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

const DOWNGRADE_CONTEXT = "DowngradeSubscription";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * PATCH /api/student/subscriptions/[id]/downgrade
 * Downgrade a subscription to a lower tier package with proration
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

      paymentLogger.info(DOWNGRADE_CONTEXT, "Starting subscription downgrade", {
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

    // Check subscription is active or cancelled (can downgrade cancelled subscriptions too)
    if (
      currentSubscription.status !== "active" &&
      currentSubscription.status !== "trialing" &&
      currentSubscription.status !== "cancelled"
    ) {
        throw new ValidationError(
          `Only active, trialing, or cancelled subscriptions can be downgraded. Current status: ${currentSubscription.status}`
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

    // Validate it's a downgrade
    const currentPrice = Number(currentSubscription.package.price);
    const newPrice = Number(newPackage.price);
    const currentDuration = currentSubscription.package.duration;
    const newDuration = newPackage.duration;

    const isDowngrade =
      newPrice < currentPrice || newDuration < currentDuration;

    if (!isDowngrade) {
        throw new ValidationError(
          "Only downgrades are allowed. New package must have lower price or shorter duration."
      );
    }

    // Check if trying to downgrade to the same package
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
          DOWNGRADE_CONTEXT,
          "Error retrieving Stripe subscription",
          error
        );
        throw new Error(
          `Failed to retrieve Stripe subscription: ${error.message}`
      );
    }

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

      paymentLogger.info(DOWNGRADE_CONTEXT, "Proration calculation", {
      creditAmount: proration.creditAmount,
      netAmount: proration.netAmount,
      daysUsed: proration.daysUsed,
      daysRemaining: proration.daysRemaining,
      currentDailyRate: proration.currentDailyRate,
      newDailyRate: proration.newDailyRate,
    });

    // Calculate new subscription dates (new cycle starts on downgrade date)
    const { startDate: newStartDate, endDate: newEndDate } =
      calculateNewSubscriptionDates(now, newDuration);

      // Manual proration: Calculate credit and charge amounts
      // Credit = unused time on old plan (days remaining × old daily rate)
      // Charge = full price of new plan
      // Net = charge - credit (if negative, customer gets credit)
      const creditAmount = Math.round(proration.creditAmount * 100) / 100; // Round to 2 decimals
      const newPlanCharge = newPrice; // Full price of new plan
      const netAmount = Math.round((newPlanCharge - creditAmount) * 100) / 100;

      paymentLogger.info(DOWNGRADE_CONTEXT, "Manual proration calculation", {
        creditAmount,
        newPlanCharge,
        netAmount,
        daysRemaining: proration.daysRemaining,
        currentDailyRate: proration.currentDailyRate,
        note: netAmount < 0
          ? "Customer receives credit (credit > charge)"
          : "Customer pays net amount (charge > credit)",
      });

    // Update Stripe subscription
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

        // Update subscription WITHOUT proration (we'll handle it manually)
        const updatedSubscription = await stripeClient.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [
            {
              id: subscriptionItemId,
              price: price.id,
            },
          ],
            proration_behavior: "none", // No automatic proration - we handle it manually
          metadata: {
            studentId: String(currentSubscription.studentId),
            packageId: String(newPackageId),
            packageName: newPackage.name,
            packageDuration: String(newDuration),
            downgradedFrom: String(currentSubscription.packageId),
            downgradedAt: now.toISOString(),
          },
        }
      );

        paymentLogger.info(
          DOWNGRADE_CONTEXT,
          "Subscription updated (no automatic proration)",
          {
            subscriptionId: updatedSubscription.id,
            status: updatedSubscription.status,
          }
        );

        // Create invoice manually with credit and charge items
        const customerId = updatedSubscription.customer as string;
        const invoice = await stripeClient.invoices.create({
          customer: customerId,
          subscription: updatedSubscription.id,
          auto_advance: false, // Don't auto-finalize, we'll do it manually
          metadata: {
            subscriptionId: String(id),
            downgradeFrom: String(currentSubscription.packageId),
            downgradeTo: String(newPackageId),
            creditAmount: String(creditAmount),
            newPlanCharge: String(newPlanCharge),
            netAmount: String(netAmount),
          },
        });

        paymentLogger.info(DOWNGRADE_CONTEXT, "Invoice created", {
          invoiceId: invoice.id,
        });

        // Add credit invoice item (positive amount = credit to customer)
        if (creditAmount > 0) {
          await stripeClient.invoiceItems.create({
            customer: customerId,
            invoice: invoice.id,
            amount: Math.round(creditAmount * 100), // Convert to cents
            currency: newPackage.currency.toLowerCase(),
            description: `Credit for ${proration.daysRemaining} unused days on ${currentSubscription.package.name}`,
            metadata: {
              type: "downgrade_credit",
              daysRemaining: String(proration.daysRemaining),
              oldPackageId: String(currentSubscription.packageId),
            },
          });

          paymentLogger.info(DOWNGRADE_CONTEXT, "Credit invoice item added", {
            creditAmount,
            daysRemaining: proration.daysRemaining,
          });
        }

        // Add charge invoice item (negative amount = charge to customer)
        // This is the full price of the new plan
        await stripeClient.invoiceItems.create({
          customer: customerId,
          invoice: invoice.id,
          amount: -Math.round(newPlanCharge * 100), // Negative = charge
          currency: newPackage.currency.toLowerCase(),
          description: `Charge for ${newPackage.name} (${newDuration} months)`,
          metadata: {
            type: "downgrade_charge",
            newPackageId: String(newPackageId),
            newPackageDuration: String(newDuration),
          },
        });

        paymentLogger.info(DOWNGRADE_CONTEXT, "Charge invoice item added", {
          newPlanCharge,
        });

        // Finalize the invoice
        const finalizedInvoice = await stripeClient.invoices.finalizeInvoice(
          invoice.id,
          {
            auto_advance: true, // Automatically attempt payment
          }
        );

        paymentLogger.info(DOWNGRADE_CONTEXT, "Invoice finalized", {
          invoiceId: finalizedInvoice.id,
          status: finalizedInvoice.status,
          amountDue: finalizedInvoice.amount_due / 100,
          amountPaid: finalizedInvoice.amount_paid / 100,
          subtotal: finalizedInvoice.subtotal / 100,
          total: finalizedInvoice.total / 100,
        });

        // If net amount is negative (customer gets credit), the invoice will show negative amount_due
        // If net amount is positive (customer pays), attempt to pay it
        let paidInvoice = finalizedInvoice;
        if (finalizedInvoice.status === "open" && finalizedInvoice.amount_due > 0) {
          try {
            // Wait a moment for auto_advance to process
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Check invoice status again
            paidInvoice = await stripeClient.invoices.retrieve(finalizedInvoice.id);

            // If still unpaid, try explicit payment
            if (paidInvoice.status === "open" && paidInvoice.amount_due > 0) {
              const stripeSubscription = await stripeClient.subscriptions.retrieve(
                updatedSubscription.id
              );
              const defaultPaymentMethod =
                (stripeSubscription as any).default_payment_method ||
                (stripeSubscription as any).default_source;

              if (defaultPaymentMethod) {
                paidInvoice = await stripeClient.invoices.pay(finalizedInvoice.id, {
                  payment_method: defaultPaymentMethod,
                });
                paymentLogger.info(
                  DOWNGRADE_CONTEXT,
                  "Invoice paid using subscription payment method",
                  {
                    invoiceId: paidInvoice.id,
                    status: paidInvoice.status,
                    amountPaid: paidInvoice.amount_paid / 100,
                  }
                );
              } else {
                paymentLogger.warn(
                  DOWNGRADE_CONTEXT,
                  "Invoice cannot be auto-paid - no payment method",
                  {
                    invoiceId: finalizedInvoice.id,
                    note: "Customer needs to add a payment method or pay manually",
                  }
                );
              }
            }
          } catch (payError: any) {
            paymentLogger.warn(DOWNGRADE_CONTEXT, "Could not auto-pay invoice", {
              invoiceId: finalizedInvoice.id,
              error: payError.message,
              note: "Invoice is finalized but requires manual payment",
            });
          }
        }

        // Update proration with actual invoice amounts
        proration.netAmount = paidInvoice.total / 100; // This will be negative if credit > charge
      } catch (error: any) {
        paymentLogger.error(
          DOWNGRADE_CONTEXT,
          "Error updating Stripe subscription",
          error
        );
        throw new Error(
          `Failed to update Stripe subscription: ${error.message}`
      );
    }

    // Update database with proration logic
    const result = await prisma.$transaction(async (tx) => {
      // Update subscription record with new start date and end date
      const updatedSubscription = await tx.student_subscriptions.update({
        where: { id },
        data: {
          packageId: newPackageId,
          startDate: newStartDate, // New cycle starts on downgrade date
          endDate: newEndDate,
          nextBillingDate: newEndDate,
          updatedAt: now,
        },
        include: {
          package: true,
        },
      });

        // Use the actual Stripe invoice amount (from proration.netAmount which was updated above)
        // For downgrades, netAmount can be negative (customer gets credit)
        const stripeNetAmount = proration.netAmount;

        paymentLogger.info(
          DOWNGRADE_CONTEXT,
          "Using manual proration calculation",
          {
            invoiceAmount: stripeNetAmount,
            creditAmount,
            newPlanCharge,
            note:
              stripeNetAmount < 0
                ? "Customer receives credit (credit > charge)"
                : "Customer pays net amount (charge > credit)",
          }
        );

        // Create payment record
        // For credits (negative netAmount), mark clearly as credit
        // For charges (positive netAmount), record as normal charge
        const isCredit = stripeNetAmount < 0;
        const paymentCreditAmount = isCredit ? Math.abs(stripeNetAmount) : 0;
        
        // Mark credit clearly in reason - prefix with "CREDIT:" for easy identification
        const paymentReason = isCredit
          ? `CREDIT: Subscription downgrade - ${currentSubscription.package.name} → ${newPackage.name} (Credit: ${paymentCreditAmount.toFixed(2)} ${newPackage.currency})`
          : `Subscription downgrade - ${currentSubscription.package.name} → ${newPackage.name} (Net charge: ${stripeNetAmount.toFixed(2)} ${newPackage.currency})`;

      const payment = await tx.payment.create({
          data: {
            studentid: currentSubscription.studentId,
            studentname: currentSubscription.student.name || "",
            paymentdate: now,
            transactionid: `downgrade_${
              currentSubscription.stripeSubscriptionId
            }_${Date.now()}`,
            paidamount: isCredit ? paymentCreditAmount : stripeNetAmount, // Store credit amount (positive) or charge amount
            reason: paymentReason,
            status: "Approved",
            currency: newPackage.currency,
            source: PaymentSource.stripe,
            intent: PaymentIntent.subscription,
            providerReference: currentSubscription.stripeSubscriptionId,
            providerStatus: "success",
            subscriptionId: id,
            // Store credit info in metadata via providerPayload for easy querying
            providerPayload: isCredit ? {
              isCredit: true,
              creditAmount: paymentCreditAmount,
              originalNetAmount: stripeNetAmount,
              type: "downgrade_credit",
            } : {
              type: "downgrade_charge",
              netAmount: stripeNetAmount,
            },
          },
        });

        // IMPORTANT: For downgrades, update only future months (from downgrade date forward)
        // Preserve historical months that were already paid at the old rate
        // This ensures accurate accounting - past months keep their original amounts
        const downgradeDate = new Date(now);
        downgradeDate.setHours(0, 0, 0, 0); // Start of day
        
        const futureMonths = generateMonthStrings(downgradeDate, newEndDate);
        const newMonthlyRate = Math.round(proration.newMonthlyRate * 100) / 100; // Round to 2 decimals then to integer
        
        paymentLogger.info(
          DOWNGRADE_CONTEXT,
          "Updating only future months (from downgrade date)",
          {
            months: futureMonths,
            count: futureMonths.length,
            newMonthlyRate,
            newPrice,
            newDuration,
            prorationNewMonthlyRate: proration.newMonthlyRate,
            downgradeDate: downgradeDate.toISOString(),
            newEndDate: newEndDate.toISOString(),
            note: "Historical months (before downgrade date) are preserved with original amounts",
          }
        );

        if (futureMonths.length === 0) {
          paymentLogger.warn(
            DOWNGRADE_CONTEXT,
            "No future months to update",
            {
              downgradeDate: downgradeDate.toISOString(),
              newEndDate: newEndDate.toISOString(),
            }
          );
        }

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
            const existingAmount = Number(existing.paid_amount);
            if (Math.abs(existingAmount - newMonthlyRate) > 0.01) { // Allow small floating point differences
              await tx.months_table.updateMany({
                where: {
                  studentid: currentSubscription.studentId,
                  month: month,
                },
                data: {
                  paid_amount: newMonthlyRate,
                  payment_status: "Paid",
                  source: PaymentSource.stripe,
                  providerReference: currentSubscription.stripeSubscriptionId,
                  providerStatus: "success",
                  paymentId: payment.id,
                },
              });
              monthsUpdated++;
              paymentLogger.info(
                DOWNGRADE_CONTEXT,
                "Updated existing month",
                {
                  month,
                  oldAmount: existingAmount,
                  newAmount: newMonthlyRate,
                }
              );
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
            paymentLogger.info(
              DOWNGRADE_CONTEXT,
              "Created new month entry",
              {
                month,
                amount: newMonthlyRate,
              }
          );
        }
      }

        paymentLogger.info(DOWNGRADE_CONTEXT, "Months table update completed", {
          monthsUpdated,
        monthsCreated,
          totalFutureMonths: futureMonths.length,
          monthlyRate: newMonthlyRate,
          months: futureMonths,
          downgradeDate: downgradeDate.toISOString(),
          newEndDate: newEndDate.toISOString(),
          note: "Historical months (before downgrade) preserved with original amounts",
      });

      return {
        subscription: updatedSubscription,
        payment,
          monthsUpdated,
        monthsCreated,
          totalMonths: futureMonths.length,
        proration,
      };
    });

      // Calculate net credit (positive if customer receives credit)
      const netCredit =
        result.proration.netAmount < 0
          ? Math.abs(result.proration.netAmount)
          : 0;

    return NextResponse.json({
      success: true,
        message: netCredit > 0
          ? `Subscription downgraded successfully. You have received a credit of ${netCredit.toFixed(2)} ${newPackage.currency} that will be applied to your next billing cycle.`
          : "Subscription downgraded successfully with proration",
      subscription: {
        ...result.subscription,
        package: {
          ...result.subscription.package,
          price: Number(result.subscription.package.price),
        },
      },
      proration: {
        creditAmount: result.proration.creditAmount,
          newPlanCharge: newPrice, // Full price of new plan
        netAmount: result.proration.netAmount,
        daysUsed: result.proration.daysUsed,
        daysRemaining: result.proration.daysRemaining,
          netCredit: netCredit,
        },
        credit: netCredit > 0
          ? {
              amount: netCredit,
              message: `You have received a credit of ${netCredit.toFixed(2)} ${newPackage.currency}. This credit will be applied to your next billing cycle.`,
            }
          : null,
        payment: {
          id: result.payment.id,
          amount: Number(result.payment.paidamount),
          reason: result.payment.reason,
      },
        monthsUpdated: result.monthsUpdated,
      monthsCreated: result.monthsCreated,
      totalMonths: result.totalMonths,
    });
    },
    DOWNGRADE_CONTEXT,
    "Failed to downgrade subscription"
  ).catch((error) => {
    return handlePaymentError(error, DOWNGRADE_CONTEXT);
  });
}
