import { PaymentIntent, PaymentSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { paymentLogger } from "./logger";

const FINALIZE_PAYMENT_CONTEXT = "FinalizePayment";
const APPLY_DEPOSIT_CONTEXT = "ApplyDeposit";

type ProviderStatus = "success" | "failed" | "pending";

interface FinalizeParams {
  provider: PaymentSource;
  providerReference?: string | null;
  providerStatus?: string | null;
  providerFee?: number | null;
  providerPayload?: unknown;
  currency?: string | null;
  status?: ProviderStatus;
}

const zeroDecimalCurrencies = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

/**
 * Finalizes a payment after gateway confirmation.
 * 
 * Flow:
 * 1. Creates payment record in payment table (wpos_wpdatatable_29/_29) with status "Approved" (for deposits) or "pending" (for tuition)
 * 2. Links checkout to the newly created payment
 * 3. For deposits: Automatically applies to unpaid months in months_table
 * 4. Links months_table records to payment via paymentId
 * 
 * NOTE: Payment record is created AFTER gateway confirms payment, not when checkout is initiated.
 * 
 * @param txRef - Transaction reference from payment gateway
 * @param params - Finalization parameters from webhook
 */
export async function finalizePaymentByTxRef(
  txRef: string,
  params: FinalizeParams
) {
  const checkout = await prisma.payment_checkout.findUnique({
    where: { txRef },
    include: {
      payment: true,
    },
  });

  if (!checkout) {
    throw new Error(`Checkout with txRef ${txRef} not found`);
  }

  // If already completed, check if deposit was applied
  if (checkout.status === "completed") {
    // For deposits, check if any months were created/updated with this paymentId
    if (checkout.intent === PaymentIntent.deposit && checkout.paymentId) {
      const monthsWithPayment = await prisma.months_table.count({
        where: {
          paymentId: checkout.paymentId,
        },
      });
      
      // If no months were created, the deposit wasn't applied - allow re-application
      if (monthsWithPayment === 0) {
        paymentLogger.debug(FINALIZE_PAYMENT_CONTEXT, "Payment completed but deposit not applied, re-applying", {
          paymentId: checkout.paymentId,
        });
        // Continue to apply deposit below
      } else {
        paymentLogger.debug(FINALIZE_PAYMENT_CONTEXT, "Payment already completed and deposit applied", {
          paymentId: checkout.paymentId,
          monthsCount: monthsWithPayment,
        });
        return checkout;
      }
    } else {
      return checkout;
    }
  }

  const status = params.status ?? "success";
  const now = new Date();

  const monthsValue = checkout.months as unknown;
  const months: string[] = Array.isArray(monthsValue)
    ? monthsValue.filter((m): m is string => typeof m === "string")
    : [];

  // Get student info for payment creation
  const student = await prisma.wpos_wpdatatable_23.findUnique({
    where: { wdt_ID: checkout.studentId },
    select: {
      name: true,
      classfeeCurrency: true,
    },
  });

  if (!student) {
    throw new Error(`Student ${checkout.studentId} not found`);
  }

  await prisma.$transaction(async (tx) => {
    // Step 1: Create or get existing payment record in payment table (_29)
    // If payment already exists (from previous finalization), use it
    let payment = checkout.payment;
    
    if (!payment) {
      // Auto-approve all gateway-confirmed payments (Stripe/Chapa confirmed = Approved)
      // Gateway confirmation means payment is successful, so no admin approval needed
      const paymentStatus = status === "success" 
        ? "Approved"  // Gateway confirmed = auto-approved
        : status === "failed" 
        ? "Rejected" 
        : "pending";

      payment = await tx.payment.create({
      data: {
        studentid: checkout.studentId,
        studentname: student.name || "",
        paymentdate: now,
        transactionid: checkout.txRef,
        paidamount: checkout.amount,
        reason:
          checkout.intent === PaymentIntent.deposit
            ? "Automated deposit via payment gateway"
            : "Automated payment via payment gateway",
        status: paymentStatus,
        currency: params.currency ?? checkout.currency ?? student.classfeeCurrency ?? "ETB",
        source: params.provider,
        intent: checkout.intent,
        providerReference: params.providerReference ?? checkout.txRef,
        providerStatus: params.providerStatus ?? status,
        providerFee:
          params.providerFee !== undefined && params.providerFee !== null
            ? new Prisma.Decimal(params.providerFee)
            : null,
        providerPayload: params.providerPayload ?? {},
      },
    });

      paymentLogger.info(FINALIZE_PAYMENT_CONTEXT, "Created payment record", {
        paymentId: payment.id,
        status: paymentStatus,
      });
    } else {
      paymentLogger.debug(FINALIZE_PAYMENT_CONTEXT, "Using existing payment record", {
        paymentId: payment.id,
        status: payment.status,
      });
    }

    // Step 2: Link checkout to the newly created payment
    await tx.payment_checkout.update({
      where: { id: checkout.id },
      data: {
        paymentId: payment.id,
        status: status === "success" ? "completed" : status === "failed" ? "failed" : "pending",
        metadata: {
          ...((typeof checkout.metadata === "object" && checkout.metadata !== null
            ? (checkout.metadata as Record<string, unknown>)
            : {}) as Record<string, unknown>),
          finalizedAt: now.toISOString(),
          providerStatus: params.providerStatus ?? status,
          paymentCreated: true,
        },
        updatedAt: now,
      },
    });

    if (status === "success") {
      // Handle tuition payments (direct month payment)
      // IMPORTANT: Deposits should NEVER use this logic - they always use applyDepositToUnpaidMonths
      if (
        checkout.intent === PaymentIntent.tuition &&
        months.length > 0
      ) {
        const currencyUpper = (
          checkout.currency ??
          params.currency ??
          student.classfeeCurrency ??
          "ETB"
        ).toUpperCase();
        const totalAmount = Number(checkout.amount);
        const perMonthAmount =
          months.length > 0 ? totalAmount / months.length : totalAmount;

        for (const month of months) {
          const existing = await tx.months_table.findFirst({
            where: {
              studentid: checkout.studentId,
              month,
            },
          });

          const rawAmount = zeroDecimalCurrencies.has(currencyUpper)
            ? Math.round(perMonthAmount)
            : Math.round(perMonthAmount * 100) / 100;
          const paidAmount = Math.round(rawAmount);

          // Gateway confirmed = auto-approved, so set months to "Paid" immediately
          const monthPaymentStatus = "Paid";

          if (existing) {
            await tx.months_table.update({
              where: { id: existing.id },
              data: {
                paid_amount: paidAmount,
                payment_status: monthPaymentStatus,
                payment_type: "auto",
                source: params.provider,
                providerReference:
                  params.providerReference ?? existing.providerReference,
                providerStatus: params.providerStatus ?? "success",
                providerPayload:
                  params.providerPayload ??
                  (existing.providerPayload === null
                    ? undefined
                    : existing.providerPayload),
                paymentId: payment.id,
              },
            });
          } else {
            await tx.months_table.create({
              data: {
                studentid: checkout.studentId,
                month,
                paid_amount: paidAmount,
                payment_status: monthPaymentStatus,
                payment_type: "auto",
                start_date: now,
                end_date: null,
                is_free_month: false,
                source: params.provider,
                providerReference: params.providerReference ?? checkout.txRef,
                providerStatus: params.providerStatus ?? "success",
                providerPayload: params.providerPayload ?? {},
                paymentId: payment.id,
              },
            });
          }
        }
      } else if (checkout.intent === PaymentIntent.deposit) {
        // Step 3: For deposits, automatically apply to unpaid months in months_table
        // Each months_table record will have paymentId linking back to payment table (_29)
        paymentLogger.info(FINALIZE_PAYMENT_CONTEXT, "Applying deposit to unpaid months", {
          txRef: checkout.txRef,
          paymentId: payment.id,
          studentId: checkout.studentId,
        });
        try {
          await applyDepositToUnpaidMonths({
            tx,
            checkout: {
              ...checkout,
              paymentId: payment.id, // Use the newly created payment ID
            },
            provider: params.provider,
            providerReference: params.providerReference ?? checkout.txRef,
            providerStatus: params.providerStatus ?? "success",
            providerPayload: params.providerPayload ?? {},
          });
          paymentLogger.info(FINALIZE_PAYMENT_CONTEXT, "Successfully applied deposit to months_table", {
            txRef: checkout.txRef,
            paymentId: payment.id,
          });
        } catch (error) {
          paymentLogger.error(FINALIZE_PAYMENT_CONTEXT, "Error applying deposit to months", error, {
            txRef: checkout.txRef,
            paymentId: payment.id,
          });
          throw error; // Re-throw to rollback transaction
        }
      }
    }
  });

  return prisma.payment_checkout.findUnique({
    where: { id: checkout.id },
    include: { payment: true },
  });
}

interface DepositApplicationParams {
  tx: Prisma.TransactionClient;
  checkout: {
    studentId: number;
    amount: Prisma.Decimal;
    currency: string;
    paymentId: number | null;
    intent: PaymentIntent;
    months: any;
    txRef: string;
  };
  provider: PaymentSource;
  providerReference?: string | null;
  providerStatus?: string | null;
  providerPayload?: unknown;
}

/**
 * Applies a deposit from payment table (_29) to unpaid months in months_table.
 * 
 * This function:
 * 1. Finds unpaid months for the student
 * 2. Allocates deposit amount to months sequentially (oldest first)
 * 3. Creates/updates months_table records with paymentId linking to payment table
 * 
 * @param tx - Database transaction
 * @param checkout - Checkout record containing paymentId
 * @param provider - Payment source (chapa/stripe)
 * @param providerReference - Reference from payment gateway
 * @param providerStatus - Status from payment gateway
 * @param providerPayload - Full payload from payment gateway
 */
async function applyDepositToUnpaidMonths({
  tx,
  checkout,
  provider,
  providerReference,
  providerStatus,
  providerPayload,
}: DepositApplicationParams) {
  const safeProviderPayload = (providerPayload ?? {}) as Prisma.InputJsonValue;
  if (checkout.intent !== PaymentIntent.deposit) {
    paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Skipping - intent is not deposit", {
      intent: checkout.intent,
    });
    return;
  }

  paymentLogger.info(APPLY_DEPOSIT_CONTEXT, "Starting deposit application", {
    studentId: checkout.studentId,
    paymentId: checkout.paymentId,
    amount: checkout.amount,
  });

  const student = await tx.wpos_wpdatatable_23.findUnique({
    where: { wdt_ID: checkout.studentId },
    select: {
      classfee: true,
      startdate: true,
    },
  });

  if (!student) {
    paymentLogger.error(APPLY_DEPOSIT_CONTEXT, "Student not found", undefined, {
      studentId: checkout.studentId,
    });
    return;
  }

  const classFee = Number(student.classfee ?? 0);
  if (!classFee || classFee <= 0) {
    paymentLogger.error(APPLY_DEPOSIT_CONTEXT, "Invalid class fee", undefined, {
      studentId: checkout.studentId,
      classFee,
    });
    return;
  }

  paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Student class fee", {
    classFee,
    currency: "ETB",
  });

  const monthsJson = checkout.months as unknown;
  const monthsFromCheckout = Array.isArray(monthsJson)
    ? monthsJson.filter((value): value is string => typeof value === "string")
    : [];

  const formatMonthString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const getNextMonthString = (monthStr: string): string => {
    const [yearStr, monthStrVal] = monthStr.split("-");
    const year = Number(yearStr);
    const month = Number(monthStrVal);
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      return formatMonthString(new Date());
    }
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + 1);
    return formatMonthString(date);
  };

  const queue: string[] = [];
  const queueSet = new Set<string>();
  const addToQueue = (month?: string | null) => {
    if (!month) return;
    if (!queueSet.has(month)) {
      queueSet.add(month);
      queue.push(month);
    }
  };

  monthsFromCheckout.forEach((month) => addToQueue(month));

  const unpaidMonths = await tx.months_table.findMany({
    where: {
      studentid: checkout.studentId,
      AND: [
        {
          payment_status: { not: "Paid" },
        },
        {
          OR: [{ is_free_month: null }, { is_free_month: false }],
        },
      ],
    },
    orderBy: { month: "asc" },
  });

  unpaidMonths.forEach((record) => addToQueue(record.month));

  const latestMonthRecord = await tx.months_table.findFirst({
    where: { studentid: checkout.studentId },
    orderBy: { month: "desc" },
    select: { month: true },
  });

  const determineInitialAutoMonth = () => {
    if (queue.length > 0) {
      return getNextMonthString(queue[queue.length - 1]);
    }
    if (latestMonthRecord?.month) {
      return getNextMonthString(latestMonthRecord.month);
    }
    if (student.startdate) {
      return formatMonthString(new Date(student.startdate));
    }
    return formatMonthString(new Date());
  };

  let nextAutoMonth: string | null = determineInitialAutoMonth();

  if (queue.length > 0) {
    paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Found unpaid/pending months", {
      count: queue.length,
      months: queue,
    });
  } else {
    paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "No unpaid months found, future months will be generated automatically", {
      studentId: checkout.studentId,
    });
  }

  let remaining = Number(checkout.amount);
  if (!Number.isFinite(remaining) || remaining <= 0) {
    paymentLogger.error(APPLY_DEPOSIT_CONTEXT, "Invalid deposit amount", undefined, {
      amount: remaining,
    });
    return;
  }

  paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Applying deposit to months", {
    amount: remaining,
  });

  let monthsApplied = 0;
  let queueIndex = 0;
  const processedMonths = new Set<string>();

  const ensureNextMonth = () => {
    if (!nextAutoMonth) return;
    addToQueue(nextAutoMonth);
    nextAutoMonth = getNextMonthString(nextAutoMonth);
  };

  while (remaining > 0) {
    if (queueIndex >= queue.length) {
      ensureNextMonth();
      if (queueIndex >= queue.length) {
        paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "No additional months available, stopping allocation", {
          studentId: checkout.studentId,
          remainingBalance: remaining,
        });
        break;
      }
    }

    const month = queue[queueIndex++];
    if (!month || processedMonths.has(month)) {
      continue;
    }
    processedMonths.add(month);

    const existing = await tx.months_table.findFirst({
      where: {
        studentid: checkout.studentId,
        month,
      },
    });

    const alreadyPaid = existing ? Number(existing.paid_amount ?? 0) : 0;
    const needed = Math.max(classFee - alreadyPaid, 0);

    paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Processing month", {
      month,
      classFee,
      alreadyPaid,
      needed,
      remaining,
    });

    if (needed <= 0) {
      paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Month already fully paid, skipping", {
        month,
        alreadyPaid,
        classFee,
      });
      continue;
    }

    let allocation = Math.min(remaining, needed);
    if (allocation > needed) {
      allocation = needed;
    }

    let allocationInt = Math.round(allocation);
    if (allocationInt > needed) {
      allocationInt = Math.round(needed);
    }

    const maxAllowedForMonth = classFee - alreadyPaid;
    if (allocationInt > maxAllowedForMonth) {
      allocationInt = Math.max(0, Math.round(maxAllowedForMonth));
    }

    if (allocationInt <= 0) {
      continue;
    }

    let newPaidTotal = alreadyPaid + allocationInt;
    const isFullyCovered = newPaidTotal >= classFee;

    if (newPaidTotal > classFee) {
      const correctedAllocation = Math.max(0, classFee - alreadyPaid);
      allocationInt = Math.round(correctedAllocation);
      newPaidTotal = alreadyPaid + allocationInt;
    }

    if (newPaidTotal > classFee) {
      const cappedTotal = classFee;
      const cappedAllocation = cappedTotal - alreadyPaid;
      if (cappedAllocation > 0) {
        const finalAllocation = Math.round(cappedAllocation);
        const finalPaidTotal = alreadyPaid + finalAllocation;
        const monthPaymentStatus = "Paid";
        const resolvedProviderStatus =
          providerStatus ?? (finalPaidTotal >= classFee ? "success" : "partial");

        if (existing) {
          await tx.months_table.update({
            where: { id: existing.id },
            data: {
              paid_amount: finalPaidTotal,
              payment_status: monthPaymentStatus,
              payment_type: "auto",
              source: provider,
              providerReference,
              providerStatus: resolvedProviderStatus,
              providerPayload: safeProviderPayload,
              paymentId: checkout.paymentId,
            },
          });
        } else {
          await tx.months_table.create({
            data: {
              studentid: checkout.studentId,
              month,
              paid_amount: finalAllocation,
              payment_status: monthPaymentStatus,
              payment_type: "auto",
              start_date: new Date(),
              end_date: null,
              is_free_month: false,
              source: provider,
              providerReference,
              providerStatus: resolvedProviderStatus,
              providerPayload: safeProviderPayload,
              paymentId: checkout.paymentId,
            },
          });
        }

        remaining -= finalAllocation;
        monthsApplied++;
        paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Applied capped allocation to month", {
          month,
          allocation: finalAllocation,
          remaining,
        });
        continue;
      } else {
        continue;
      }
    }

    const monthPaymentStatus = isFullyCovered ? "Paid" : "pending";
    const resolvedProviderStatus =
      providerStatus ?? (isFullyCovered ? "success" : "partial");

    paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Allocating to month", {
      month,
      allocation: allocationInt,
      alreadyPaid,
      newTotal: newPaidTotal,
      classFee,
      fullyCovered: isFullyCovered,
    });

    if (existing) {
      await tx.months_table.update({
        where: { id: existing.id },
        data: {
          paid_amount: newPaidTotal,
          payment_status: monthPaymentStatus,
          payment_type: isFullyCovered ? "auto" : "partial",
          source: provider,
          providerReference,
          providerStatus: resolvedProviderStatus,
          providerPayload: safeProviderPayload,
          paymentId: checkout.paymentId,
        },
      });
    } else {
      const finalAmountForNewRecord = Math.min(allocationInt, classFee);

      await tx.months_table.create({
        data: {
          studentid: checkout.studentId,
          month,
          paid_amount: finalAmountForNewRecord,
          payment_status: monthPaymentStatus,
          payment_type: isFullyCovered ? "auto" : "partial",
          start_date: new Date(),
          end_date: null,
          is_free_month: false,
          source: provider,
          providerReference,
          providerStatus: resolvedProviderStatus,
          providerPayload: safeProviderPayload,
          paymentId: checkout.paymentId,
        },
      });

      if (finalAmountForNewRecord !== allocationInt) {
        const oldRemaining = remaining;
        remaining = remaining - allocationInt + finalAmountForNewRecord;
        paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Adjusted remaining balance", {
          oldRemaining,
          newRemaining: remaining,
          originalAllocation: allocationInt,
          cappedAllocation: finalAmountForNewRecord,
        });
        remaining -= finalAmountForNewRecord;
        monthsApplied++;
        paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Applied capped allocation to month", {
          month,
          allocation: finalAmountForNewRecord,
          originalAllocation: allocationInt,
          remaining,
        });
        continue;
      }
    }

    remaining -= allocationInt;
    monthsApplied++;
    paymentLogger.debug(APPLY_DEPOSIT_CONTEXT, "Applied allocation to month", {
      month,
      allocation: allocationInt,
      remaining,
    });
  }

  paymentLogger.info(APPLY_DEPOSIT_CONTEXT, "Completed deposit application", {
    monthsApplied,
    remainingBalance: remaining,
  });
}

/**
 * Apply an approved deposit payment to unpaid months.
 * This is used when admin manually approves a deposit (not from a checkout).
 */
export async function applyDepositPaymentToMonths(paymentId: number) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      wpos_wpdatatable_23: {
        select: {
          classfee: true,
          startdate: true,
        },
      },
    },
  });

  if (!payment || !payment.wpos_wpdatatable_23) {
    throw new Error(`Payment ${paymentId} not found or missing student`);
  }

  // Only apply if status is "Approved"
  if (payment.status !== "Approved") {
    return;
  }

  // Check if this payment is already linked to months (avoid double application)
  const existingMonths = await prisma.months_table.findFirst({
    where: { paymentId: payment.id },
  });
  if (existingMonths) {
    // Already applied
    return;
  }

  const student = payment.wpos_wpdatatable_23;
  const classFee = Number(student.classfee ?? 0);
  if (!classFee || classFee <= 0) {
    return;
  }

  const depositAmount = Number(payment.paidamount);
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Get unpaid months for this student
    const unpaidMonths = await tx.months_table.findMany({
      where: {
        studentid: payment.studentid,
        AND: [
          {
            payment_status: { not: "Paid" },
          },
          {
            OR: [{ is_free_month: null }, { is_free_month: false }],
          },
        ],
      },
      orderBy: { month: "asc" },
    });

    if (unpaidMonths.length === 0) {
      return;
    }

    let remaining = depositAmount;
    const source = payment.source || PaymentSource.manual;

    for (const monthRecord of unpaidMonths) {
      if (remaining <= 0) break;
      if (!monthRecord.month) continue;

      const alreadyPaid = Number(monthRecord.paid_amount ?? 0);
      const needed = Math.max(classFee - alreadyPaid, 0);
      if (needed <= 0) {
        continue;
      }

      const allocation = Math.min(remaining, needed);
      const allocationInt = Math.round(allocation);
      if (allocationInt <= 0) {
        continue;
      }

      const newPaidTotal = alreadyPaid + allocationInt;
      const isFullyCovered = newPaidTotal >= classFee;
      
      const monthPaymentStatus = isFullyCovered ? "Paid" : "pending";
      const resolvedProviderStatus =
        payment.providerStatus || (isFullyCovered ? "success" : "partial");

      await tx.months_table.update({
        where: { id: monthRecord.id },
        data: {
          paid_amount: newPaidTotal,
          payment_status: monthPaymentStatus,
          payment_type: isFullyCovered ? "auto" : "partial",
          source,
          providerReference: payment.providerReference || payment.transactionid,
          providerStatus: resolvedProviderStatus,
          providerPayload: (payment.providerPayload ??
            {}) as Prisma.InputJsonValue,
          paymentId: payment.id,
        },
      });

      remaining -= allocationInt;
    }
  });
}

