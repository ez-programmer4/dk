import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripeClient } from "@/lib/payments/stripe";
import { PaymentSource, PaymentIntent } from "@prisma/client";
import {
  calculateProration,
  calculateNewSubscriptionDates,
  generateMonthStrings,
} from "@/lib/payments/proration";
import { paymentLogger } from "@/lib/payments/logger";
import {
  handlePaymentError,
  ValidationError,
  safeExecute,
} from "@/lib/payments/errorHandler";

const UPGRADE_CONTEXT = "UpgradeSubscription";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * PATCH /api/student/subscriptions/[id]/upgrade
 * Upgrade a subscription to a different package with proration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return safeExecute(
    async () => {
      if (!stripeClient) {
        throw new Error("Stripe not configured");
      }

      const id = parseInt(params.id);
      if (isNaN(id)) {
        throw new ValidationError("Invalid subscription ID");
      }

      const body = await request.json();
      const { newPackageId } = body;

      if (!newPackageId) {
        throw new ValidationError("newPackageId is required");
      }

      paymentLogger.info(UPGRADE_CONTEXT, "Starting subscription upgrade", {
        subscriptionId: id,
        newPackageId,
      });

      // Get current subscription with package details
      const currentSubscription = await prisma.student_subscriptions.findUnique(
        {
          where: { id },
          include: {
            package: true,
            student: {
              select: {
                wdt_ID: true,
                name: true,
                classfeeCurrency: true,
              },
            },
          },
        }
      );

      if (!currentSubscription) {
        throw new ValidationError(`Subscription ${id} not found`);
      }

      // Check subscription is active
      if (
        currentSubscription.status !== "active" &&
        currentSubscription.status !== "trialing"
      ) {
        throw new ValidationError(
          `Only active or trialing subscriptions can be upgraded. Current status: ${currentSubscription.status}`
        );
      }

      // Get new package
      const newPackage = await prisma.subscription_packages.findUnique({
        where: { id: newPackageId },
      });

      if (!newPackage) {
        throw new ValidationError(`Package ${newPackageId} not found`);
      }

      if (!newPackage.isActive) {
        throw new ValidationError(
          `Package ${newPackageId} is no longer available`
        );
      }

      // Validate it's an upgrade
      const currentPrice = Number(currentSubscription.package.price);
      const newPrice = Number(newPackage.price);
      const currentDuration = currentSubscription.package.duration;
      const newDuration = newPackage.duration;

      const isUpgrade =
        newPrice > currentPrice || newDuration > currentDuration;

      if (!isUpgrade) {
        throw new ValidationError(
          "Only upgrades are allowed. New package must have higher price or longer duration."
        );
      }

      // Check if trying to upgrade to the same package
      if (currentSubscription.packageId === newPackageId) {
        throw new ValidationError("You are already subscribed to this package");
      }

      // Verify currency matches
      if (
        newPackage.currency !== currentSubscription.student.classfeeCurrency
      ) {
        throw new ValidationError(
          `Package currency (${newPackage.currency}) does not match student currency (${currentSubscription.student.classfeeCurrency})`
        );
      }

      // Get Stripe subscription
      let stripeSubscription;
      try {
        stripeSubscription = await stripeClient.subscriptions.retrieve(
          currentSubscription.stripeSubscriptionId
        );
      } catch (error: any) {
        paymentLogger.error(
          UPGRADE_CONTEXT,
          "Error retrieving Stripe subscription",
          error
        );
        throw new Error(
          `Failed to retrieve Stripe subscription: ${error.message}`
        );
      }

      // Check if subscription is already cancelled
      if (stripeSubscription.cancel_at_period_end) {
        throw new ValidationError(
          "Cannot upgrade a subscription that is scheduled for cancellation"
        );
      }

      // Get the subscription item ID
      const subscriptionItemId = stripeSubscription.items.data[0]?.id;
      if (!subscriptionItemId) {
        throw new Error("No subscription item found in Stripe subscription");
      }

      const now = new Date();
      const currentEndDate = new Date(currentSubscription.endDate);
      const originalStartDate = currentSubscription.startDate
        ? new Date(currentSubscription.startDate)
        : new Date(currentSubscription.createdAt);

      // Calculate proration
      const proration = calculateProration({
        currentPrice,
        currentDuration,
        newPrice,
        newDuration,
        originalStartDate,
        currentEndDate,
        upgradeDate: now,
      });

      paymentLogger.info(UPGRADE_CONTEXT, "Proration calculation", {
        currentPackage: {
          id: currentSubscription.packageId,
          name: currentSubscription.package.name,
          price: currentPrice,
          duration: currentDuration,
          monthlyRate: proration.currentMonthlyRate,
          dailyRate: proration.currentDailyRate,
        },
        newPackage: {
          id: newPackageId,
          name: newPackage.name,
          price: newPrice,
          duration: newDuration,
          monthlyRate: proration.newMonthlyRate,
          dailyRate: proration.newDailyRate,
        },
        dates: {
          originalStartDate: originalStartDate.toISOString(),
          currentEndDate: currentEndDate.toISOString(),
          upgradeDate: now.toISOString(),
          totalDays: proration.totalDays,
          daysUsed: proration.daysUsed,
          daysRemaining: proration.daysRemaining,
        },
        proration: {
          creditAmount: proration.creditAmount,
          newPackagePrice: newPrice,
          netAmount: proration.netAmount,
          calculation: `${newPrice} - ${proration.creditAmount} = ${proration.netAmount}`,
        },
      });

      // For upgrades, start a NEW cycle from the upgrade date
      // This creates a clean new billing period and makes future renewals easy to track
      // Credit is given for unused time on old plan, full new plan price is charged
      const newStartDate = new Date(now);
      newStartDate.setHours(0, 0, 0, 0); // Start of upgrade day

      const newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + newDuration);
      newEndDate.setHours(23, 59, 59, 999); // End of day

      // Update Stripe subscription with new price using Stripe's built-in proration
      // This is much simpler and more reliable than manual proration calculation
      try {
        const productName = `Subscription Package ${newPackage.id}`;
        let product;
        const existingProducts = await stripeClient.products.list({
          limit: 100,
        });

        product = existingProducts.data.find(
          (p) => p.name === productName && !p.deleted
        );

        if (!product) {
          product = await stripeClient.products.create({
            name: productName,
            description:
              newPackage.description ||
              `Subscription for ${newPackage.duration} months`,
            metadata: {
              packageId: String(newPackageId),
            },
          });
        }

        const price = await stripeClient.prices.create({
          product: product.id,
          currency: newPackage.currency.toLowerCase(),
          unit_amount: Math.round(newPrice * 100),
          recurring: {
            interval: "month",
            interval_count: newDuration,
          },
          metadata: {
            packageId: String(newPackageId),
            packageName: newPackage.name,
            packageDuration: String(newDuration),
          },
        });

        // Get Stripe subscription to align proration_date with database startDate
        const stripeSubscription = await stripeClient.subscriptions.retrieve(
          currentSubscription.stripeSubscriptionId
        );
        const stripePeriodStart = new Date(
          (stripeSubscription as any).current_period_start * 1000
        );
        const dbStartDate = new Date(originalStartDate);
        dbStartDate.setHours(0, 0, 0, 0);
        const daysDifference = Math.floor(
          (stripePeriodStart.getTime() - dbStartDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Use manual proration to ensure exact amount matches our calculation
        // This gives us full control over the proration amount
        const updateParams: any = {
          items: [{ id: subscriptionItemId, price: price.id }],
          proration_behavior: "none", // Disable automatic proration - we'll do it manually
          metadata: {
            studentId: String(currentSubscription.studentId),
            packageId: String(newPackageId),
            packageName: newPackage.name,
            packageDuration: String(newDuration),
            upgradedFrom: String(currentSubscription.packageId),
            upgradedAt: now.toISOString(),
          },
        };

        // Update subscription first (without proration)
        const updatedSubscription = await stripeClient.subscriptions.update(
          currentSubscription.stripeSubscriptionId,
          updateParams
        );

        // Now manually create invoice items for exact proration amount
        // This ensures Stripe charges exactly what we calculated ($218)
        const customerId = stripeSubscription.customer as string;

        // Wait a moment for subscription update to process
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create credit invoice item for unused time (negative amount)
        if (proration.creditAmount > 0.01) {
          await stripeClient.invoiceItems.create({
            customer: customerId,
            subscription: currentSubscription.stripeSubscriptionId,
            amount: -Math.round(proration.creditAmount * 100), // Negative for credit
            currency: newPackage.currency.toLowerCase(),
            description: `Credit for unused time: ${
              proration.daysRemaining
            } days × $${proration.currentDailyRate.toFixed(2)}/day`,
          });
          paymentLogger.info(UPGRADE_CONTEXT, "Created credit invoice item", {
            creditAmount: proration.creditAmount,
            daysRemaining: proration.daysRemaining,
          });
        }

        // Add invoice item for the new package charge
        // Since we set proration_behavior: "none", we need to manually add the charge
        await stripeClient.invoiceItems.create({
          customer: customerId,
          subscription: currentSubscription.stripeSubscriptionId,
          amount: Math.round(newPrice * 100), // Full new package price
          currency: newPackage.currency.toLowerCase(),
          description: `Upgrade to ${newPackage.name} (${newDuration} months)`,
        });
        paymentLogger.info(UPGRADE_CONTEXT, "Created charge invoice item", {
          newPackagePrice: newPrice,
        });

        // Wait a moment for invoice items to be added
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Create invoice - this will include both the credit and charge
        const invoice = await stripeClient.invoices.create({
          customer: customerId,
          subscription: currentSubscription.stripeSubscriptionId,
          auto_advance: false, // Don't auto-finalize
        });

        paymentLogger.info(UPGRADE_CONTEXT, "Created invoice", {
          invoiceId: invoice.id,
          subtotal: invoice.subtotal / 100,
          total: invoice.total / 100,
          lineItemsCount: invoice.lines.data.length,
        });

        // Check subscription for default payment method
        const subscription = await stripeClient.subscriptions.retrieve(
          currentSubscription.stripeSubscriptionId
        );
        const defaultPaymentMethod =
          (subscription as any).default_payment_method ||
          (subscription as any).default_source;

        paymentLogger.info(
          UPGRADE_CONTEXT,
          "Subscription payment method check",
          {
            subscriptionId: subscription.id,
            hasPaymentMethod: !!defaultPaymentMethod,
            defaultPaymentMethod,
          }
        );

        // Finalize the invoice with auto_advance: true to automatically pay if payment method exists
        const finalizedInvoice = await stripeClient.invoices.finalizeInvoice(
          invoice.id,
          {
            auto_advance: true, // Automatically attempt payment
          }
        );

        paymentLogger.info(UPGRADE_CONTEXT, "Invoice finalized", {
          invoiceId: finalizedInvoice.id,
          status: finalizedInvoice.status,
          amountDue: finalizedInvoice.amount_due / 100,
          amountPaid: finalizedInvoice.amount_paid / 100,
        });

        // Wait a moment for auto_advance to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check invoice status again
        let paidInvoice = await stripeClient.invoices.retrieve(
          finalizedInvoice.id
        );

        // If invoice is still open/unpaid, try to pay it explicitly using subscription's payment method
        if (
          paidInvoice.status === "open" &&
          paidInvoice.amount_due > 0 &&
          defaultPaymentMethod
        ) {
          try {
            paidInvoice = await stripeClient.invoices.pay(finalizedInvoice.id, {
              payment_method: defaultPaymentMethod, // Use subscription's payment method
            });
            paymentLogger.info(
              UPGRADE_CONTEXT,
              "Invoice paid using subscription payment method",
              {
                invoiceId: paidInvoice.id,
                status: paidInvoice.status,
                amountPaid: paidInvoice.amount_paid / 100,
              }
            );
          } catch (payError: any) {
            paymentLogger.warn(
              UPGRADE_CONTEXT,
              "Could not pay invoice with subscription payment method",
              {
                invoiceId: finalizedInvoice.id,
                error: payError.message,
                note: "Invoice is finalized but requires manual payment",
              }
            );
          }
        } else if (
          paidInvoice.status === "open" &&
          paidInvoice.amount_due > 0
        ) {
          paymentLogger.warn(
            UPGRADE_CONTEXT,
            "Invoice cannot be auto-paid - no payment method",
            {
              invoiceId: finalizedInvoice.id,
              note: "Customer needs to add a payment method or pay manually",
            }
          );
        }

        paymentLogger.info(
          UPGRADE_CONTEXT,
          "Created manual proration invoice",
          {
            invoiceId: paidInvoice.id,
            status: paidInvoice.status,
            netAmount: proration.netAmount,
            creditAmount: proration.creditAmount,
            newPackagePrice: newPrice,
            invoiceTotal: paidInvoice.total / 100,
            amountPaid: paidInvoice.amount_paid / 100,
            amountDue: paidInvoice.amount_due / 100,
          }
        );

        paymentLogger.info(
          UPGRADE_CONTEXT,
          "Subscription updated, creating manual proration invoice",
          {
            subscriptionId: updatedSubscription.id,
            status: updatedSubscription.status,
            netAmount: proration.netAmount,
          }
        );

        // We've already created and finalized the invoice manually above
        // Use the paid invoice
        const invoiceAmount = paidInvoice.total / 100;
        const invoiceId = paidInvoice.id;
        const invoiceStatus = paidInvoice.status;

        paymentLogger.info(
          UPGRADE_CONTEXT,
          "Manual proration invoice finalized and paid",
          {
            invoiceId: invoiceId,
            status: invoiceStatus,
            invoiceTotal: invoiceAmount,
            amountPaid: paidInvoice.amount_paid / 100,
            calculatedAmount: proration.netAmount,
            lineItems: paidInvoice.lines.data.map((line: any) => ({
              description: line.description,
              amount: line.amount / 100,
            })),
          }
        );

        // Use the invoice amount (should match our calculation)
        proration.netAmount = invoiceAmount;

        paymentLogger.info(
          UPGRADE_CONTEXT,
          "Final proration amount to record",
          {
            calculatedNetAmount: proration.netAmount,
            stripeInvoiceAmount: invoiceAmount,
            invoiceId,
            invoiceStatus,
            creditAmount: proration.creditAmount,
            newPackagePrice: newPrice,
            calculation: `$${newPrice} - $${proration.creditAmount.toFixed(
              2
            )} = $${proration.netAmount.toFixed(2)}`,
          }
        );
      } catch (error: any) {
        paymentLogger.error(
          UPGRADE_CONTEXT,
          "Error updating Stripe subscription",
          error
        );
        throw new Error(
          `Failed to update Stripe subscription: ${error.message}`
        );
      }

      // Update database with proration logic
      paymentLogger.info(UPGRADE_CONTEXT, "Starting database transaction");
      let result;
      try {
        result = await prisma.$transaction(
          async (tx) => {
            paymentLogger.debug(
              UPGRADE_CONTEXT,
              "Transaction started, updating subscription record"
            );

            // Update subscription record with new start date and end date
            const updatedSubscription = await tx.student_subscriptions.update({
              where: { id },
              data: {
                packageId: newPackageId,
                startDate: newStartDate, // New cycle starts on upgrade date
                endDate: newEndDate,
                nextBillingDate: newEndDate,
                updatedAt: now,
              },
              include: {
                package: true,
              },
            });

            paymentLogger.debug(
              UPGRADE_CONTEXT,
              "Subscription record updated",
              {
                id: updatedSubscription.id,
                packageId: updatedSubscription.packageId,
                startDate: updatedSubscription.startDate.toISOString(),
                endDate: updatedSubscription.endDate.toISOString(),
              }
            );

            // Use the actual Stripe invoice amount (from proration.netAmount which was updated above)
            const stripeChargeAmount = proration.netAmount;

            paymentLogger.info(
              UPGRADE_CONTEXT,
              "Using Stripe's calculated proration amount",
              {
                invoiceAmount: stripeChargeAmount,
                note: "This is the actual amount charged by Stripe with automatic proration",
              }
            );

            // Check if payment record already exists (from webhook that might have run first)
            // Look for payments created in the last 5 minutes to avoid duplicates
            const existingPayment = await tx.payment.findFirst({
              where: {
                subscriptionId: id,
                OR: [
                  {
                    transactionid: currentSubscription.stripeSubscriptionId,
                  },
                  {
                    transactionid: {
                      startsWith: `upgrade_${currentSubscription.stripeSubscriptionId}`,
                    },
                  },
                ],
                paymentdate: {
                  gte: new Date(now.getTime() - 300000), // Within last 5 minutes
                },
                reason: {
                  contains: "upgrade",
                },
              },
              orderBy: {
                paymentdate: "desc",
              },
            });

            let payment;
            if (existingPayment) {
              paymentLogger.info(
                UPGRADE_CONTEXT,
                "Payment record already exists from webhook, updating",
                {
                  paymentId: existingPayment.id,
                  existingAmount: existingPayment.paidamount,
                  newAmount: stripeChargeAmount,
                }
              );
              payment = await tx.payment.update({
                where: { id: existingPayment.id },
                data: {
                  paidamount: stripeChargeAmount,
                  reason: `Subscription upgrade - ${currentSubscription.package.name} → ${newPackage.name} (prorated)`,
                  paymentdate: now,
                },
              });
            } else {
              // Create payment record for net charge
              paymentLogger.debug(
                UPGRADE_CONTEXT,
                "Creating new payment record",
                {
                  amount: stripeChargeAmount,
                  reason: "Subscription upgrade (prorated)",
                }
              );
              payment = await tx.payment.create({
                data: {
                  studentid: currentSubscription.studentId,
                  studentname: currentSubscription.student.name || "",
                  paymentdate: now,
                  transactionid: `upgrade_${
                    currentSubscription.stripeSubscriptionId
                  }_${Date.now()}`,
                  paidamount: stripeChargeAmount, // Use Stripe's actual charge amount
                  reason: `Subscription upgrade - ${currentSubscription.package.name} → ${newPackage.name} (prorated)`,
                  status: "Approved",
                  currency: newPackage.currency,
                  source: PaymentSource.stripe,
                  intent: PaymentIntent.subscription,
                  providerReference: currentSubscription.stripeSubscriptionId,
                  providerStatus: "success",
                  subscriptionId: id,
                },
              });
            }

            // Note: Credit is handled automatically by Stripe's proration
            // Stripe's invoice includes the credit automatically, so we don't need a separate credit record
            if (proration.creditAmount > 0.01) {
              paymentLogger.debug(
                UPGRADE_CONTEXT,
                "Credit handled by Stripe proration",
                {
                  creditAmount: proration.creditAmount,
                  daysRemaining: proration.daysRemaining,
                  note: "Credit is included in Stripe invoice automatically - no separate record needed",
                }
              );
            }

            // IMPORTANT: For upgrades, create months for the NEW cycle starting from upgrade date
            // The old cycle is ended, and a new cycle begins with the new package
            // This ensures clean billing periods and accurate month tracking
            const futureMonths = generateMonthStrings(newStartDate, newEndDate);
            const newMonthlyRate = Math.round(proration.newMonthlyRate);

            paymentLogger.info(
              UPGRADE_CONTEXT,
              "Creating months for new subscription cycle",
              {
                months: futureMonths,
                count: futureMonths.length,
                newMonthlyRate,
                newStartDate: newStartDate.toISOString(),
                newEndDate: newEndDate.toISOString(),
                note: "New cycle starts from upgrade date, old cycle months are preserved",
              }
            );

            let monthsUpdated = 0;
            let monthsCreated = 0;

            for (const month of futureMonths) {
              const [year, monthNum] = month.split("-").map(Number);
              const monthStart = new Date(year, monthNum - 1, 1, 0, 0, 0);
              const monthEnd = new Date(year, monthNum, 0, 23, 59, 59);

              // Check if month already exists
              const existing = await tx.months_table.findFirst({
                where: {
                  studentid: currentSubscription.studentId,
                  month: month,
                },
              });

              if (existing) {
                // Update existing month to new rate (only for future months)
                if (existing.paid_amount !== newMonthlyRate) {
                  await tx.months_table.updateMany({
                    where: {
                      studentid: currentSubscription.studentId,
                      month: month,
                    },
                    data: {
                      paid_amount: newMonthlyRate,
                      payment_status: "Paid",
                      source: PaymentSource.stripe,
                      providerReference:
                        currentSubscription.stripeSubscriptionId,
                      providerStatus: "success",
                      paymentId: payment.id,
                    },
                  });
                  monthsUpdated++;
                }
              } else {
                // Create new month entry for future months
                await tx.months_table.create({
                  data: {
                    studentid: currentSubscription.studentId,
                    month: month,
                    paid_amount: newMonthlyRate,
                    payment_status: "Paid",
                    payment_type: "auto",
                    start_date: monthStart,
                    end_date: monthEnd,
                    is_free_month: false,
                    source: PaymentSource.stripe,
                    providerReference: currentSubscription.stripeSubscriptionId,
                    providerStatus: "success",
                    paymentId: payment.id,
                  },
                });
                monthsCreated++;
              }
            }

            paymentLogger.info(
              UPGRADE_CONTEXT,
              "Months table update completed",
              {
                monthsUpdated,
                monthsCreated,
                totalFutureMonths: futureMonths.length,
                monthlyRate: newMonthlyRate,
                months: futureMonths,
                upgradeDate: now.toISOString(),
                newEndDate: newEndDate.toISOString(),
                note: "Historical months (before upgrade) preserved with original amounts",
              }
            );
            return {
              subscription: updatedSubscription,
              payment,
              monthsUpdated,
              monthsCreated,
              totalMonths: futureMonths.length,
              proration,
            };
          },
          {
            timeout: 30000, // 30 second timeout
          }
        );

        paymentLogger.info(
          UPGRADE_CONTEXT,
          "Transaction completed successfully"
        );
      } catch (transactionError: any) {
        paymentLogger.error(
          UPGRADE_CONTEXT,
          "Transaction failed",
          transactionError,
          {
            subscriptionId: id,
            newPackageId,
            errorCode: transactionError.code,
          }
        );
        throw new Error(
          `Failed to update subscription in database: ${transactionError.message}`
        );
      }

      // Verify the transaction completed successfully
      if (!result) {
        paymentLogger.error(
          UPGRADE_CONTEXT,
          "CRITICAL: Transaction returned no result",
          undefined,
          {
            subscriptionId: id,
          }
        );
        throw new Error("Transaction completed but returned no result");
      }

      // Verify subscription was updated
      const verifySubscription = await prisma.student_subscriptions.findUnique({
        where: { id },
        include: { package: true },
      });

      if (!verifySubscription) {
        paymentLogger.error(
          UPGRADE_CONTEXT,
          "CRITICAL: Subscription not found after update",
          undefined,
          {
            subscriptionId: id,
          }
        );
        throw new Error("Subscription not found after update");
      }

      if (verifySubscription.packageId !== newPackageId) {
        paymentLogger.error(
          UPGRADE_CONTEXT,
          "CRITICAL: Subscription packageId was not updated",
          undefined,
          {
            expected: newPackageId,
            actual: verifySubscription.packageId,
          }
        );
        throw new Error("Subscription package was not updated correctly");
      }

      // Verify payment was created
      const verifyPayment = await prisma.payment.findFirst({
        where: {
          subscriptionId: id,
          paymentdate: {
            gte: new Date(now.getTime() - 60000), // Within last minute
          },
          reason: {
            contains: "upgrade",
          },
        },
        orderBy: {
          paymentdate: "desc",
        },
      });

      if (!verifyPayment) {
        paymentLogger.warn(UPGRADE_CONTEXT, "Payment record was not created", {
          subscriptionId: id,
        });
      } else {
        paymentLogger.debug(UPGRADE_CONTEXT, "Payment verified", {
          paymentId: verifyPayment.id,
          amount: verifyPayment.paidamount,
        });
      }

      // Verify months were created
      const verifyMonths = await prisma.months_table.findMany({
        where: {
          studentid: currentSubscription.studentId,
          month: { in: generateMonthStrings(newStartDate, newEndDate) },
        },
      });

      paymentLogger.info(UPGRADE_CONTEXT, "Upgrade completed successfully", {
        subscriptionId: result.subscription.id,
        newPackage: result.subscription.package.name,
        newStartDate: result.subscription.startDate.toISOString(),
        newEndDate: result.subscription.endDate.toISOString(),
        paymentId: result.payment.id,
        paymentAmount: result.payment.paidamount,
        monthsCreated: result.monthsCreated,
        monthsUpdated: result.monthsUpdated,
        proration: result.proration,
        verification: {
          subscriptionUpdated: verifySubscription.packageId === newPackageId,
          paymentCreated: !!verifyPayment,
          monthsCreated: verifyMonths.length,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Subscription upgraded successfully with proration",
        subscription: {
          ...result.subscription,
          package: {
            ...result.subscription.package,
            price: Number(result.subscription.package.price),
          },
        },
        proration: {
          creditAmount: result.proration.creditAmount,
          netAmount: result.proration.netAmount,
          daysUsed: result.proration.daysUsed,
          daysRemaining: result.proration.daysRemaining,
          currentPackage: {
            name: currentSubscription.package.name,
            price: currentPrice,
            duration: currentDuration,
            monthlyRate: result.proration.currentMonthlyRate,
          },
          newPackage: {
            name: newPackage.name,
            price: newPrice,
            duration: newDuration,
            monthlyRate: result.proration.newMonthlyRate,
          },
        },
        payment: {
          id: result.payment.id,
          amount: Number(result.payment.paidamount),
          reason: result.payment.reason,
          currency: result.payment.currency,
        },
        prorationDetails: {
          creditAmount: proration.creditAmount,
          netAmount: proration.netAmount,
          daysUsed: proration.daysUsed,
          daysRemaining: proration.daysRemaining,
          calculation: `$${newPrice} - $${proration.creditAmount.toFixed(
            2
          )} = $${proration.netAmount.toFixed(2)}`,
        },
        credit:
          proration.creditAmount > 0.01
            ? {
                amount: proration.creditAmount,
                message: `Credit of ${proration.creditAmount.toFixed(2)} ${
                  newPackage.currency
                } applied automatically by Stripe for ${
                  proration.daysRemaining
                } days of unused time`,
              }
            : null,
        monthsUpdated: result.monthsUpdated,
        monthsCreated: result.monthsCreated,
        totalMonths: result.totalMonths,
      });
    },
    UPGRADE_CONTEXT,
    "Failed to upgrade subscription"
  ).catch((error) => {
    return handlePaymentError(error, UPGRADE_CONTEXT);
  });
}
