import { prisma } from "@/lib/prisma";
import { stripeClient } from "@/lib/payments/stripe";
import { PaymentSource, PaymentIntent, Prisma } from "@prisma/client";
import { paymentLogger } from "./logger";

const FINALIZE_SUBSCRIPTION_CONTEXT = "FinalizeSubscription";

interface FinalizeParams {
  isInitialPayment: boolean;
  sessionId?: string;
  invoiceId?: string;
  invoiceAmount?: number;
  idempotencyKey?: string; // For preventing duplicate processing
}

/**
 * Finalizes a subscription payment after Stripe confirmation.
 * 
 * This function:
 * 1. Gets Stripe subscription details
 * 2. Creates or updates student_subscriptions record (with idempotency)
 * 3. Creates payment record
 * 4. Creates months_table entries for the subscription period
 * 
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param params - Finalization parameters
 */
export async function finalizeSubscriptionPayment(
  stripeSubscriptionId: string,
  params: FinalizeParams
) {
  if (!stripeClient) {
    throw new Error("Stripe client not configured");
  }

  // Generate idempotency key if not provided
  // Format: finalize_{subscriptionId}_{sessionId|invoiceId|timestamp}
  const idempotencyKey =
    params.idempotencyKey ||
    `finalize_${stripeSubscriptionId}_${
      params.sessionId || params.invoiceId || Date.now()
    }`;

  paymentLogger.info(FINALIZE_SUBSCRIPTION_CONTEXT, "Starting finalization", {
    subscriptionId: stripeSubscriptionId,
    params,
    idempotencyKey,
  });

  // IDEMPOTENCY CHECK: Check if we've already processed this finalization
  // This prevents duplicate processing from webhook + return page race conditions
  const existingFinalization = await prisma.payment.findFirst({
    where: {
      OR: [
        { transactionid: idempotencyKey },
        {
          transactionid:
            params.sessionId || params.invoiceId || stripeSubscriptionId,
          subscriptionId: {
            not: null,
          },
        },
      ],
    },
    select: {
      id: true,
      transactionid: true,
      subscriptionId: true,
    },
  });

  if (existingFinalization) {
    paymentLogger.info(
      FINALIZE_SUBSCRIPTION_CONTEXT,
      "Finalization already processed (idempotency check)",
      {
        subscriptionId: stripeSubscriptionId,
        existingPaymentId: existingFinalization.id,
        idempotencyKey,
      }
    );

    // Return existing subscription details
    const existingSubscription = await prisma.student_subscriptions.findFirst({
      where: {
        stripeSubscriptionId: stripeSubscriptionId,
      },
      include: {
        package: true,
      },
    });

    if (existingSubscription) {
      paymentLogger.info(
        FINALIZE_SUBSCRIPTION_CONTEXT,
        "Returning existing subscription (already finalized)"
      );
      return {
        subscriptionId: existingSubscription.id,
        status: existingSubscription.status,
        alreadyProcessed: true,
      };
    }
  }

  try {
    // Get Stripe subscription details
    paymentLogger.debug(
      FINALIZE_SUBSCRIPTION_CONTEXT,
      "Retrieving subscription from Stripe"
    );
    const subscription = (await stripeClient.subscriptions.retrieve(
      stripeSubscriptionId
    )) as any;
    paymentLogger.debug(
      FINALIZE_SUBSCRIPTION_CONTEXT,
      "Retrieved subscription",
      {
      status: subscription.status,
      customerId: subscription.customer,
      }
    );

  const customerId = subscription.customer as string;
  const metadata = subscription.metadata || {};
    paymentLogger.debug(
      FINALIZE_SUBSCRIPTION_CONTEXT,
      "Subscription metadata",
      { metadata }
    );
  
    const studentId = metadata.studentId ? parseInt(metadata.studentId) : null;
    const packageId = metadata.packageId ? parseInt(metadata.packageId) : null;

    paymentLogger.debug(FINALIZE_SUBSCRIPTION_CONTEXT, "Extracted IDs", {
      studentId,
      packageId,
    });

  if (!studentId || !packageId) {
      const errorMsg = `Missing studentId or packageId in subscription metadata. Subscription: ${stripeSubscriptionId}, metadata: ${JSON.stringify(
        metadata
      )}`;
    paymentLogger.error(FINALIZE_SUBSCRIPTION_CONTEXT, errorMsg);
    throw new Error(errorMsg);
  }

  // Get package details
    paymentLogger.debug(FINALIZE_SUBSCRIPTION_CONTEXT, "Fetching package", {
      packageId,
    });
  const packageData = await prisma.subscription_packages.findUnique({
    where: { id: packageId },
  });

  if (!packageData) {
    const errorMsg = `Package ${packageId} not found`;
    paymentLogger.error(FINALIZE_SUBSCRIPTION_CONTEXT, errorMsg);
    throw new Error(errorMsg);
  }
  paymentLogger.info(FINALIZE_SUBSCRIPTION_CONTEXT, "Package found", {
    name: packageData.name,
    price: packageData.price,
    currency: packageData.currency,
  });

  // Get student details
    paymentLogger.debug(FINALIZE_SUBSCRIPTION_CONTEXT, "Fetching student", {
      studentId,
    });
  const student = await prisma.wpos_wpdatatable_23.findUnique({
    where: { wdt_ID: studentId },
    select: {
      wdt_ID: true,
      name: true,
      classfee: true,
      classfeeCurrency: true,
    },
  });

  if (!student) {
    const errorMsg = `Student ${studentId} not found`;
    paymentLogger.error(FINALIZE_SUBSCRIPTION_CONTEXT, errorMsg);
    throw new Error(errorMsg);
  }
  
  // CRITICAL: Check if subscription already exists for a DIFFERENT student
  // This prevents cross-student subscription assignment
  const existingSubscription = await prisma.student_subscriptions.findFirst({
    where: {
      stripeSubscriptionId: stripeSubscriptionId,
    },
    select: {
      id: true,
      studentId: true,
    },
  });
  
  if (existingSubscription && existingSubscription.studentId !== studentId) {
    const errorMsg = `Subscription ${stripeSubscriptionId} already exists for student ${existingSubscription.studentId}. Cannot assign to student ${studentId}.`;
    paymentLogger.error(FINALIZE_SUBSCRIPTION_CONTEXT, errorMsg);
    throw new Error(errorMsg);
  }
  
  if (existingSubscription) {
      paymentLogger.debug(
        FINALIZE_SUBSCRIPTION_CONTEXT,
        "Subscription already exists for this student, will update",
        {
      subscriptionId: existingSubscription.id,
      studentId,
        }
      );
  }
    paymentLogger.info(FINALIZE_SUBSCRIPTION_CONTEXT, "Student found", {
      name: student.name,
    });

  await prisma.$transaction(async (tx) => {
    const now = new Date();
    // Safely derive period start/end; Stripe fields may be missing on some events
    const startUnix =
      typeof subscription?.current_period_start === "number"
        ? subscription.current_period_start
        : Math.floor(now.getTime() / 1000);
    const endUnix =
      typeof subscription?.current_period_end === "number"
        ? subscription.current_period_end
        : undefined;

    const currentPeriodStart = new Date(startUnix * 1000);
    // If end is missing, derive by adding package duration months to start
    const derivedEnd = (() => {
      const d = new Date(currentPeriodStart);
      d.setMonth(d.getMonth() + packageData.duration);
      return d;
    })();
      const currentPeriodEnd = endUnix ? new Date(endUnix * 1000) : derivedEnd;

    const nextBillingDate =
      typeof subscription?.current_period_end === "number"
        ? new Date(subscription.current_period_end * 1000)
        : null;

    // CRITICAL: Before upsert, check if subscription exists for a different student
    const existingSub = await tx.student_subscriptions.findUnique({
      where: { stripeSubscriptionId },
      select: { id: true, studentId: true },
    });
    
    if (existingSub && existingSub.studentId !== studentId) {
      const errorMsg = `Cannot finalize subscription ${stripeSubscriptionId}: already exists for student ${existingSub.studentId}, cannot assign to student ${studentId}`;
      paymentLogger.error(FINALIZE_SUBSCRIPTION_CONTEXT, errorMsg);
      throw new Error(errorMsg);
    }
    
    // Use upsert to atomically create or update subscription record (prevents race conditions)
    // But only update if studentId matches (already verified above)
    const subscriptionRecord = await tx.student_subscriptions.upsert({
      where: { stripeSubscriptionId },
      create: {
        studentId: studentId,
        packageId: packageId,
        stripeSubscriptionId: stripeSubscriptionId,
        stripeCustomerId: customerId,
        status: subscription.status,
        startDate: currentPeriodStart,
        endDate: currentPeriodEnd,
        nextBillingDate: nextBillingDate,
      },
      update: {
        // Only update status and dates, never change studentId
        status: subscription.status,
        nextBillingDate: nextBillingDate,
        endDate: currentPeriodEnd,
      },
    });
      paymentLogger.info(
        FINALIZE_SUBSCRIPTION_CONTEXT,
        "Upserted subscription record",
        {
      subscriptionRecordId: subscriptionRecord.id,
      status: subscriptionRecord.status,
        }
      );

    // Calculate payment amount
    // For subscriptions, we should use the actual amount charged by Stripe, not the package price
    // The package price might be the total for the entire duration, but the actual charge could be different
    let paymentAmount = Number(packageData.price);
    
    if (params.invoiceAmount !== undefined && params.invoiceAmount > 0) {
      // Use invoice amount if provided (already in dollars, not cents)
      paymentAmount = params.invoiceAmount;
    } else {
      // If invoice amount not provided, try to get it from Stripe
      // This is important for initial payments where the actual charge might differ from package price
      try {
          const stripe = await import("@/lib/payments/stripe").then(
            (m) => m.stripeClient
          );
        if (stripe && stripeSubscriptionId) {
          // Get the latest invoice for this subscription
          const invoices = await stripe.invoices.list({
            subscription: stripeSubscriptionId,
            limit: 1,
          });
          
          if (invoices.data.length > 0 && invoices.data[0].amount_paid > 0) {
            // Use the actual amount paid (convert from cents to dollars)
            paymentAmount = invoices.data[0].amount_paid / 100;
              paymentLogger.debug(
                FINALIZE_SUBSCRIPTION_CONTEXT,
                "Using invoice amount from Stripe",
                {
              invoiceId: invoices.data[0].id,
              amountPaid: paymentAmount,
              packagePrice: packageData.price,
                }
              );
          } else {
              paymentLogger.debug(
                FINALIZE_SUBSCRIPTION_CONTEXT,
                "No invoice found or amount is 0, using package price",
                {
              packagePrice: packageData.price,
                }
              );
          }
        }
      } catch (error) {
          paymentLogger.warn(
            FINALIZE_SUBSCRIPTION_CONTEXT,
            "Failed to fetch invoice amount from Stripe, using package price",
            {
          error: error instanceof Error ? error.message : String(error),
          packagePrice: packageData.price,
            }
          );
        // Fall back to package price if we can't fetch invoice
      }
    }

      // Use idempotency key as transaction ID to prevent duplicates
      const transactionId = idempotencyKey;
    const isSubscriptionUpdate = metadata.upgradedAt || metadata.downgradedAt;
    
    // Initialize payment variable
    let payment: any = null;
    
    // For subscription updates (upgrades/downgrades), check for payments created by the upgrade/downgrade endpoint
    if (isSubscriptionUpdate) {
        paymentLogger.debug(
          FINALIZE_SUBSCRIPTION_CONTEXT,
          "Subscription update detected - checking for existing payment from upgrade/downgrade endpoint",
          {
        subscriptionId: stripeSubscriptionId,
        isUpgrade: !!metadata.upgradedAt,
        isDowngrade: !!metadata.downgradedAt,
          }
        );
      
        // Look for payment created by upgrade/downgrade endpoint (within last 10 minutes)
        // Check by both reason and transaction ID pattern to be thorough
        const searchTerm = metadata.upgradedAt ? "upgrade" : "downgrade";
        const transactionPrefix = metadata.upgradedAt ? "upgrade_" : "downgrade_";
        const timeWindow = new Date(Date.now() - 600000); // Within last 10 minutes
        
      const existingUpdatePayment = await tx.payment.findFirst({
        where: {
          subscriptionId: subscriptionRecord.id,
          paymentdate: {
              gte: timeWindow,
          },
          OR: [
              // Check by reason (contains upgrade or downgrade)
            {
              reason: {
                  contains: searchTerm,
              },
            },
              // Check by transaction ID pattern
            {
                transactionid: {
                  contains: transactionPrefix,
              },
            },
          ],
        },
        orderBy: {
          paymentdate: "desc",
        },
      });
      
      if (existingUpdatePayment) {
          // Payment already exists from upgrade/downgrade endpoint
          // For downgrades, the amount might be a credit (negative net), so don't update it
          // The upgrade/downgrade endpoint already calculated the correct prorated amount
          paymentLogger.info(
            FINALIZE_SUBSCRIPTION_CONTEXT,
            "Found existing payment from upgrade/downgrade endpoint - using existing payment",
            {
          paymentId: existingUpdatePayment.id,
          amount: existingUpdatePayment.paidamount,
          reason: existingUpdatePayment.reason,
              note: "Skipping payment creation - already handled by upgrade/downgrade endpoint",
            }
          );
        payment = existingUpdatePayment;
          // Set a flag to skip all further payment creation logic
          // This ensures we don't accidentally create a duplicate
      }
    }
    
      // If no payment found yet (and we didn't find one from upgrade/downgrade), check by idempotency key or transaction ID
    if (!payment) {
      payment = await tx.payment.findFirst({
        where: {
            OR: [
              { transactionid: idempotencyKey },
              {
          transactionid: transactionId,
          subscriptionId: subscriptionRecord.id,
              },
            ],
        },
      });
    }

    if (!payment) {
      // Also check if there's an existing payment for this subscription with a different transaction ID
      // This can happen if the transaction ID format changed or if we need to update an existing record
      payment = await tx.payment.findFirst({
        where: {
          subscriptionId: subscriptionRecord.id,
          intent: PaymentIntent.subscription,
          source: PaymentSource.stripe,
        },
        orderBy: {
          paymentdate: "desc",
        },
      });

      if (payment) {
        // Found existing payment - check if amount needs to be corrected
        const existingAmount = Number(payment.paidamount);
        const amountDifference = Math.abs(existingAmount - paymentAmount);
        
        // If the amounts differ significantly (more than $0.01), update it
        // This fixes cases where the payment was created with the wrong amount (e.g., package price instead of actual charge)
        if (amountDifference > 0.01) {
            paymentLogger.info(
              FINALIZE_SUBSCRIPTION_CONTEXT,
              "Updating existing payment record with correct amount",
              {
            existingPaymentId: payment.id,
            oldAmount: existingAmount,
            newAmount: paymentAmount,
            difference: amountDifference,
              }
            );
          
          payment = await tx.payment.update({
            where: { id: payment.id },
            data: {
              paidamount: paymentAmount,
              transactionid: transactionId, // Update transaction ID to latest
                reason: `Subscription payment - ${packageData.name}${
                  params.isInitialPayment ? " (Initial)" : " (Renewal)"
                }`,
              paymentdate: now,
            },
          });
        } else {
            paymentLogger.debug(
              FINALIZE_SUBSCRIPTION_CONTEXT,
              "Payment amount is correct, no update needed",
              {
            paymentId: payment.id,
            amount: paymentAmount,
              }
            );
        }
      } else {
        // For subscription updates (upgrades/downgrades), the upgrade/downgrade endpoint
        // already creates the payment record, so we should skip creating a duplicate
        if (isSubscriptionUpdate) {
            paymentLogger.info(
              FINALIZE_SUBSCRIPTION_CONTEXT,
              "Skipping payment creation for subscription update - already handled by upgrade/downgrade endpoint",
              {
            subscriptionId: stripeSubscriptionId,
            isUpgrade: !!metadata.upgradedAt,
            isDowngrade: !!metadata.downgradedAt,
              }
            );
          
          // Try to find the payment created by the upgrade/downgrade endpoint
            // Use a wider time window and check both reason and transaction ID pattern
            const searchTerm = metadata.upgradedAt ? "upgrade" : "downgrade";
            const transactionPrefix = metadata.upgradedAt ? "upgrade_" : "downgrade_";
            const timeWindow = new Date(Date.now() - 600000); // Within last 10 minutes
            
          payment = await tx.payment.findFirst({
            where: {
              subscriptionId: subscriptionRecord.id,
              paymentdate: {
                  gte: timeWindow,
              },
                OR: [
                  {
              reason: {
                      contains: searchTerm,
                    },
                  },
                  {
                    transactionid: {
                      contains: transactionPrefix,
                    },
              },
                ],
            },
            orderBy: {
              paymentdate: "desc",
            },
          });
          
          if (!payment) {
              paymentLogger.warn(
                FINALIZE_SUBSCRIPTION_CONTEXT,
                "No payment found for subscription update - creating one",
                {
              subscriptionId: stripeSubscriptionId,
                }
              );
            // Fall through to create payment
          } else {
              paymentLogger.info(
                FINALIZE_SUBSCRIPTION_CONTEXT,
                "Found existing payment from upgrade/downgrade endpoint",
                {
              paymentId: payment.id,
              amount: payment.paidamount,
                }
              );
          }
        }
        
        // Create payment record only if it doesn't exist and we haven't found one
        if (!payment) {
            paymentLogger.debug(
              FINALIZE_SUBSCRIPTION_CONTEXT,
              "Creating payment record",
              {
            studentId,
            transactionId,
            paymentAmount,
            currency: packageData.currency,
            isSubscriptionUpdate,
              }
            );
          
          payment = await tx.payment.create({
            data: {
              studentid: studentId,
              studentname: student.name || "",
              paymentdate: now,
              transactionid: transactionId,
              paidamount: paymentAmount,
                reason: `Subscription payment - ${packageData.name}${
                  params.isInitialPayment ? " (Initial)" : " (Renewal)"
                }`,
              status: "Approved", // Gateway confirmed, no admin approval needed
              currency: packageData.currency,
              source: PaymentSource.stripe,
              intent: PaymentIntent.subscription,
              providerReference: transactionId,
              providerStatus: "success",
              subscriptionId: subscriptionRecord.id,
            },
          });

            paymentLogger.info(
              FINALIZE_SUBSCRIPTION_CONTEXT,
              "Created payment record",
              {
            paymentId: payment.id,
              }
            );
        }
      }
    } else {
      // Payment exists with same transaction ID, but check if amount needs updating
      if (Math.abs(Number(payment.paidamount) - paymentAmount) > 0.01) {
          paymentLogger.info(
            FINALIZE_SUBSCRIPTION_CONTEXT,
            "Updating existing payment record with correct amount",
            {
          existingPaymentId: payment.id,
          oldAmount: payment.paidamount,
          newAmount: paymentAmount,
            }
          );
        
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            paidamount: paymentAmount,
              reason: `Subscription payment - ${packageData.name}${
                params.isInitialPayment ? " (Initial)" : " (Renewal)"
              }`,
          },
        });
      }
    }
    
    // Ensure payment exists before using it
    if (!payment) {
        paymentLogger.error(
          FINALIZE_SUBSCRIPTION_CONTEXT,
          "CRITICAL: Payment record was not created or found!",
          {
        subscriptionId: stripeSubscriptionId,
        transactionId,
        isSubscriptionUpdate,
          }
        );
        throw new Error(
          "Payment record is required but was not created or found"
        );
    }
    
    paymentLogger.debug(FINALIZE_SUBSCRIPTION_CONTEXT, "Payment details", {
      paymentId: payment.id,
      status: payment.status,
      source: payment.source,
      amount: payment.paidamount,
    });

    // Calculate months to create based on package duration (not Stripe period)
    const months: string[] = [];
    const startDate = new Date(currentPeriodStart);
    const packageDuration = packageData.duration; // e.g., 3 months
    
    paymentLogger.debug(FINALIZE_SUBSCRIPTION_CONTEXT, "Package details", {
      duration: packageDuration,
      startDate: startDate.toISOString(),
    });

    // Generate month strings for the package duration
    for (let i = 0; i < packageDuration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + i);
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const monthStr = `${year}-${month}`;

      if (!months.includes(monthStr)) {
        months.push(monthStr);
      }
    }

      paymentLogger.debug(
        FINALIZE_SUBSCRIPTION_CONTEXT,
        "Creating months_table entries",
        {
      monthCount: months.length,
      months,
      packageDuration,
      startDate: startDate.toISOString(),
        }
      );

    // Validate that months were generated
    if (months.length === 0) {
      const errorMsg = `No months generated for subscription! Package duration: ${packageDuration}, Start date: ${startDate.toISOString()}`;
      paymentLogger.error(FINALIZE_SUBSCRIPTION_CONTEXT, errorMsg);
      throw new Error(errorMsg);
    }

    if (months.length !== packageDuration) {
        paymentLogger.warn(
          FINALIZE_SUBSCRIPTION_CONTEXT,
          "Month count doesn't match package duration",
          {
        monthsGenerated: months.length,
        packageDuration,
        months,
          }
        );
    }

    // CRITICAL: For subscription updates (upgrades/downgrades), use full package price for monthly calculations
    // The invoice amount is prorated and should NOT be used to calculate monthly breakdown
    // The invoice amount should only be used for the payment record itself
    // Note: isSubscriptionUpdate is already defined above
    const amountForMonthlyCalculation = isSubscriptionUpdate 
      ? Number(packageData.price) // Use full package price for upgrades/downgrades
      : paymentAmount; // Use invoice amount for initial payments and renewals
    
      paymentLogger.debug(
        FINALIZE_SUBSCRIPTION_CONTEXT,
        "Monthly calculation amount",
        {
      isSubscriptionUpdate,
      invoiceAmount: paymentAmount,
      packagePrice: packageData.price,
      amountForMonthlyCalculation,
      metadata: {
        upgradedAt: metadata.upgradedAt,
        downgradedAt: metadata.downgradedAt,
      },
        }
      );

    // Calculate per-month amount (divide by package duration, not number of calendar months)
    // Since paid_amount is stored as Int, we need to work with whole dollars
    // Strategy: Distribute evenly, then add remainder to last month to ensure exact total
    const totalAmount = Math.round(amountForMonthlyCalculation); // Round to nearest dollar: $55.00 = 55
    const baseAmountPerMonth = Math.floor(totalAmount / packageDuration); // 55 / 3 = 18 (floor)
      const remainder = totalAmount - baseAmountPerMonth * packageDuration; // 55 - (18 * 3) = 1
    
      paymentLogger.debug(
        FINALIZE_SUBSCRIPTION_CONTEXT,
        "Payment distribution",
        {
      paymentAmount,
      amountForMonthlyCalculation,
      packageDuration,
      totalAmount,
      baseAmountPerMonth,
      remainder,
        }
      );

    // Create months_table entries
    const createdMonths: number[] = [];
    const updatedMonths: number[] = [];
    
    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const [year, monthNum] = month.split("-").map(Number);
      const monthStart = new Date(year, monthNum - 1, 1, 0, 0, 0);
      const monthEnd = new Date(year, monthNum, 0, 23, 59, 59);

      // Check if month entry already exists
      const existing = await tx.months_table.findFirst({
        where: {
          studentid: studentId,
          month: month,
        },
      });

      // Last month gets the remainder to ensure exact total
      // This ensures: (n-1) × baseAmount + (baseAmount + remainder) = totalAmount
        const paidAmount =
          i === months.length - 1
            ? baseAmountPerMonth + remainder // Last month: $18 + $1 = $19
            : baseAmountPerMonth; // Other months: $18
      
      paymentLogger.debug(FINALIZE_SUBSCRIPTION_CONTEXT, "Processing month", {
        index: i + 1,
        total: months.length,
        month,
        paidAmount,
        existing: !!existing,
      });

      try {
        if (existing) {
          // For subscription updates (upgrades/downgrades), handle existing months carefully
          if (isSubscriptionUpdate) {
            const isDowngrade = !!metadata.downgradedAt;
            const isUpgrade = !!metadata.upgradedAt;
            
            if (isDowngrade) {
              // For downgrades: PRESERVE existing months - do NOT update them
              // Existing months were paid at the old (higher) rate and should keep that amount
              // Only new months (after downgrade date) should get the new rate
                paymentLogger.debug(
                  FINALIZE_SUBSCRIPTION_CONTEXT,
                  "Downgrade detected - preserving existing month",
                  {
                monthId: existing.id,
                month,
                existingAmount: existing.paid_amount,
                newAmount: paidAmount,
                note: "Existing months keep original paid amount for downgrades",
                  }
                );
              updatedMonths.push(existing.id); // Count as processed for verification
              continue; // Skip updating - preserve original amount
            } else if (isUpgrade) {
              // For upgrades: The upgrade endpoint already deleted old months and created new ones
              // If we see an existing month here, it's likely from the new cycle, so update it
              // But check if it already has the correct amount first
              if (existing.paid_amount === paidAmount) {
                  paymentLogger.debug(
                    FINALIZE_SUBSCRIPTION_CONTEXT,
                    "Month already has correct amount from upgrade, skipping update",
                    {
                  monthId: existing.id,
                  month,
                  paidAmount,
                    }
                  );
                updatedMonths.push(existing.id); // Count as updated for verification
                continue; // Skip to next month
              }
              // Update to new amount (upgrade endpoint should have handled this, but webhook might run first)
                paymentLogger.debug(
                  FINALIZE_SUBSCRIPTION_CONTEXT,
                  "Updating month from upgrade webhook",
                  {
                monthId: existing.id,
                month,
                oldAmount: existing.paid_amount,
                newAmount: paidAmount,
                  }
                );
            }
          }
          
          // Update existing entry (for upgrades or non-update scenarios)
          const updated = await tx.months_table.update({
            where: { id: existing.id },
            data: {
              paid_amount: paidAmount,
              payment_status: "Paid",
              payment_type: "auto",
              start_date: monthStart,
              end_date: monthEnd,
              source: PaymentSource.stripe,
                providerReference:
                  params.invoiceId || params.sessionId || stripeSubscriptionId,
              providerStatus: "success",
              paymentId: payment.id,
            },
          });
          updatedMonths.push(updated.id);
            paymentLogger.debug(
              FINALIZE_SUBSCRIPTION_CONTEXT,
              "Updated existing month entry",
              {
            monthId: updated.id,
            month,
            oldAmount: existing.paid_amount,
            newAmount: paidAmount,
              }
            );
        } else {
          // Create new entry
          const created = await tx.months_table.create({
            data: {
              studentid: studentId,
              month: month,
              paid_amount: paidAmount,
              payment_status: "Paid",
              payment_type: "auto",
              start_date: monthStart,
              end_date: monthEnd,
              is_free_month: false,
              source: PaymentSource.stripe,
                providerReference:
                  params.invoiceId || params.sessionId || stripeSubscriptionId,
              providerStatus: "success",
              paymentId: payment.id,
            },
          });
          createdMonths.push(created.id);
            paymentLogger.debug(
              FINALIZE_SUBSCRIPTION_CONTEXT,
              "Created new month entry",
              {
            monthId: created.id,
            month,
              }
            );
        }
      } catch (monthError: any) {
          paymentLogger.error(
            FINALIZE_SUBSCRIPTION_CONTEXT,
            "Error creating/updating month entry",
            monthError,
            {
          month,
          studentId,
          paidAmount,
          existing: !!existing,
            }
          );
        // Continue with other months even if one fails
      }
    }

      paymentLogger.info(
        FINALIZE_SUBSCRIPTION_CONTEXT,
        "Successfully created/updated months_table entries",
        {
      totalMonths: months.length,
      created: createdMonths.length,
      updated: updatedMonths.length,
      createdIds: createdMonths,
      updatedIds: updatedMonths,
        }
      );

    // Verify months were created
    if (createdMonths.length === 0 && updatedMonths.length === 0) {
        paymentLogger.error(
          FINALIZE_SUBSCRIPTION_CONTEXT,
          "WARNING: No months_table entries were created or updated!",
          {
        monthsAttempted: months.length,
        studentId,
        subscriptionId: stripeSubscriptionId,
        paymentId: payment.id,
          }
        );
        throw new Error(
          `Failed to create months_table entries for subscription ${stripeSubscriptionId}. Attempted ${months.length} months but none were created.`
        );
    }

    // Final verification: Query months_table to confirm entries exist
    const verifyMonths = await tx.months_table.findMany({
      where: {
        studentid: studentId,
        paymentId: payment.id,
      },
      select: {
        id: true,
        month: true,
        paid_amount: true,
        payment_status: true,
      },
    });

      paymentLogger.info(
        FINALIZE_SUBSCRIPTION_CONTEXT,
        "Verification: months_table entries linked to payment",
        {
      paymentId: payment.id,
      verifiedCount: verifyMonths.length,
      expectedCount: months.length,
          verifiedMonths: verifyMonths.map((m) => ({
            id: m.id,
            month: m.month,
            amount: m.paid_amount,
            status: m.payment_status,
          })),
        }
      );

    if (verifyMonths.length === 0) {
        paymentLogger.error(
          FINALIZE_SUBSCRIPTION_CONTEXT,
          "CRITICAL: Payment created but no months_table entries found after creation!",
          {
        paymentId: payment.id,
        studentId,
        subscriptionId: stripeSubscriptionId,
        monthsAttempted: months,
          }
        );
      // Don't throw here - payment is already created, just log the issue
      // The transaction will complete but we'll know something went wrong
    } else if (verifyMonths.length < months.length) {
        paymentLogger.warn(
          FINALIZE_SUBSCRIPTION_CONTEXT,
          "Some months_table entries may be missing",
          {
        paymentId: payment.id,
        expected: months.length,
        found: verifyMonths.length,
        missing: months.length - verifyMonths.length,
          }
        );
    }
  });

    paymentLogger.info(
      FINALIZE_SUBSCRIPTION_CONTEXT,
      "Completed finalization",
      {
    subscriptionId: stripeSubscriptionId,
      }
    );
  } catch (error: any) {
    paymentLogger.error(
      FINALIZE_SUBSCRIPTION_CONTEXT,
      "Error finalizing subscription",
      error,
      {
      subscriptionId: stripeSubscriptionId,
      }
    );
    throw error; // Re-throw to let webhook handler know it failed
  }
}
