import { prisma } from "@/lib/prisma";

// Types for billing calculations
export interface BillingCalculation {
  baseAmount: number;
  perStudentAmount: number;
  totalStudents: number;
  totalAmount: number;
  currency: string;
  billingCycle: string;
  proratedAmount?: number;
  discount?: number;
  tax?: number;
  finalAmount: number;
}

export interface UsageMetrics {
  totalStudents: number;
  activeStudents: number;
  storageUsed: number;
  apiCalls: number;
  featuresUsed: string[];
}

/**
 * Calculate billing amount for a school based on their plan and usage
 * @param schoolId - The school ID
 * @param billingCycle - The billing cycle (monthly, yearly, etc.)
 * @returns Billing calculation details
 */
export async function calculateBillingAmount(
  schoolId: string,
  billingCycle: string = "monthly"
): Promise<BillingCalculation> {
  try {
    // Get school details with plan
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        plan: true,
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    if (!school.plan) {
      throw new Error("School has no subscription plan");
    }

    // Get current student count
    const studentCount = await prisma.student.count({
      where: { schoolId },
    });

    // Calculate amounts based on pricing tiers or legacy pricing
    let baseAmount = 0;
    let perStudentAmount = 0;
    let subtotal = 0;

    if (school.plan.pricingTiers && school.plan.pricingTiers.length > 0) {
      // Use tiered pricing
      const tiers = school.plan.pricingTiers as any[];
      const applicableTier = tiers
        .filter((tier: any) => tier.minStudents <= studentCount &&
                               (tier.maxStudents === null || studentCount <= tier.maxStudents))
        .sort((a: any, b: any) => b.minStudents - a.minStudents)[0];

      if (applicableTier) {
        baseAmount = applicableTier.basePrice;
        const extraStudents = Math.max(0, studentCount - applicableTier.minStudents + 1);
        perStudentAmount = extraStudents * applicableTier.perStudentPrice;
        subtotal = baseAmount + perStudentAmount;
      } else {
        // Fallback to legacy pricing if no tier applies
        baseAmount = Number(school.plan.basePrice);
        perStudentAmount = Number(school.plan.perStudentPrice) * studentCount;
        subtotal = baseAmount + perStudentAmount;
      }
    } else {
      // Use legacy pricing
      baseAmount = Number(school.plan.basePrice);
      perStudentAmount = Number(school.plan.perStudentPrice) * studentCount;
      subtotal = baseAmount + perStudentAmount;
    }

    // Apply billing cycle multiplier (yearly plans might have discounts)
    let cycleMultiplier = 1;
    if (billingCycle === "yearly") {
      cycleMultiplier = 12; // 12 months
    }

    const totalAmount = subtotal * cycleMultiplier;

    return {
      baseAmount,
      perStudentAmount,
      totalStudents: studentCount,
      totalAmount,
      currency: school.plan.currency,
      billingCycle,
      finalAmount: totalAmount, // Can be modified with discounts/tax later
    };
  } catch (error) {
    console.error("Failed to calculate billing amount:", error);
    throw new Error("Failed to calculate billing amount");
  }
}

/**
 * Generate invoice for a school
 * @param schoolId - The school ID
 * @param billingCycle - The billing cycle
 * @param startDate - Billing period start date
 * @param endDate - Billing period end date
 * @returns Invoice data
 */
export async function generateInvoice(
  schoolId: string,
  billingCycle: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const calculation = await calculateBillingAmount(schoolId, billingCycle);

    // Get school details
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        plan: true,
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    const invoiceData = {
      schoolId,
      schoolName: school.name,
      planName: school.plan?.name || "Unknown Plan",
      billingCycle,
      startDate,
      endDate,
      ...calculation,
      status: "pending",
      dueDate: new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from end date
    };

    return invoiceData;
  } catch (error) {
    console.error("Failed to generate invoice:", error);
    throw new Error("Failed to generate invoice");
  }
}

/**
 * Calculate prorated amount for plan changes
 * @param currentPlan - Current plan details
 * @param newPlan - New plan details
 * @param daysRemaining - Days remaining in current billing cycle
 * @param totalDays - Total days in billing cycle
 * @returns Prorated calculation
 */
export function calculateProratedAmount(
  currentPlan: { basePrice: number; perStudentPrice: number; currency: string },
  newPlan: { basePrice: number; perStudentPrice: number; currency: string },
  daysRemaining: number,
  totalDays: number,
  currentStudentCount: number
) {
  // Calculate daily rates
  const currentDailyRate = (Number(currentPlan.basePrice) + (Number(currentPlan.perStudentPrice) * currentStudentCount)) / totalDays;
  const newDailyRate = (Number(newPlan.basePrice) + (Number(newPlan.perStudentPrice) * currentStudentCount)) / totalDays;

  // Calculate prorated difference
  const proratedDifference = (newDailyRate - currentDailyRate) * daysRemaining;

  return {
    currentDailyRate,
    newDailyRate,
    proratedDifference,
    currency: currentPlan.currency,
  };
}

/**
 * Get usage metrics for a school
 * @param schoolId - The school ID
 * @param period - Time period for metrics
 * @returns Usage metrics
 */
export async function getUsageMetrics(
  schoolId: string,
  period: { start: Date; end: Date }
): Promise<UsageMetrics> {
  try {
    // Get student counts
    const [totalStudents, activeStudents] = await Promise.all([
      prisma.student.count({
        where: { schoolId },
      }),
      prisma.student.count({
        where: {
          schoolId,
          // Add active status check if available
        },
      }),
    ]);

    // Get storage usage (placeholder - would need actual implementation)
    const storageUsed = 0; // TODO: Implement storage tracking

    // Get API calls (placeholder - would need actual implementation)
    const apiCalls = 0; // TODO: Implement API usage tracking

    // Get features used (placeholder - would need actual implementation)
    const featuresUsed: string[] = []; // TODO: Implement feature usage tracking

    return {
      totalStudents,
      activeStudents,
      storageUsed,
      apiCalls,
      featuresUsed,
    };
  } catch (error) {
    console.error("Failed to get usage metrics:", error);
    throw new Error("Failed to get usage metrics");
  }
}

/**
 * Process invoice payment
 * @param invoiceId - The invoice ID
 * @param paymentData - Payment data
 * @returns Payment result
 */
export async function processInvoicePayment(invoiceId: string, paymentData: any) {
  try {
    // TODO: Implement payment processing
    console.log(`Processing payment for invoice ${invoiceId}`);
    return { success: true, message: "Payment processed successfully" };
  } catch (error) {
    console.error("Failed to process invoice payment:", error);
    throw new Error("Failed to process invoice payment");
  }
}

/**
 * Get school invoices
 * @param schoolId - The school ID
 * @param status - Optional status filter
 * @returns Array of invoices
 */
export async function getSchoolInvoices(schoolId: string, status?: string) {
  try {
    // TODO: Implement invoice fetching when invoice model is added
    console.log(`Getting invoices for school ${schoolId}`);
    return [];
  } catch (error) {
    console.error("Failed to get school invoices:", error);
    throw new Error("Failed to get school invoices");
  }
}

/**
 * Get pending invoices
 * @returns Array of pending invoices
 */
export async function getPendingInvoices() {
  try {
    // TODO: Implement pending invoices fetching
    console.log("Getting pending invoices");
    return [];
  } catch (error) {
    console.error("Failed to get pending invoices:", error);
    throw new Error("Failed to get pending invoices");
  }
}

/**
 * Calculate billing (alias for calculateBillingAmount)
 * @param schoolId - The school ID
 * @param billingCycle - The billing cycle
 * @returns Billing calculation
 */
export async function calculateBilling(
  schoolId: string,
  billingCycle: string = "monthly"
): Promise<BillingCalculation> {
  return calculateBillingAmount(schoolId, billingCycle);
}

/**
 * Create billing invoice
 * @param schoolId - The school ID
 * @param billingCycle - The billing cycle
 * @param startDate - Billing period start
 * @param endDate - Billing period end
 * @returns Created invoice
 */
export async function createBillingInvoice(
  schoolId: string,
  billingCycle: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const invoiceData = await generateInvoice(schoolId, billingCycle, startDate, endDate);

    // TODO: Save invoice to database when invoice model is added
    console.log("Would create invoice:", invoiceData);

    return invoiceData;
  } catch (error) {
    console.error("Failed to create billing invoice:", error);
    throw new Error("Failed to create billing invoice");
  }
}
