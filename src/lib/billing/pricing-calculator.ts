import { prisma } from "@/lib/prisma";

export interface PricingCalculation {
  baseFee: number;
  featureFees: Array<{
    featureId: string;
    featureName: string;
    price: number;
    isEnabled: boolean;
  }>;
  totalFee: number;
  activeStudentCount: number;
  currency: string;
  breakdown: {
    baseCalculation: string;
    featureCalculation: string;
    total: string;
  };
}

export class PricingCalculator {
  /**
   * Calculate pricing for a school subscription
   */
  static async calculateSchoolPricing(schoolId: string): Promise<PricingCalculation | null> {
    try {
      // Get school subscription with plan details
      const subscription = await prisma.schoolSubscription.findUnique({
        where: { schoolId },
        include: {
          school: {
            select: { name: true },
          },
          plan: {
            include: {
              planFeatures: {
                include: {
                  feature: true,
                },
              },
            },
          },
        },
      });

      if (!subscription || subscription.status !== 'active') {
        return null;
      }

      // Get active student count
      const activeStudentCount = await this.getActiveStudentCount(schoolId);

      // Update subscription with latest student count
      await prisma.schoolSubscription.update({
        where: { schoolId },
        data: {
          activeStudentCount,
          lastCalculatedAt: new Date(),
        },
      });

      // Calculate base fee
      const baseSalaryPerStudent = Number(subscription.plan.baseSalaryPerStudent);
      const baseFee = baseSalaryPerStudent * activeStudentCount;

      // Calculate feature fees
      const featureFees = subscription.plan.planFeatures.map(planFeature => {
        // Check if feature is enabled in subscription (overrides plan default)
        const subscriptionFeatures = subscription.enabledFeatures as any;
        const isEnabled = subscriptionFeatures?.[planFeature.feature.code] !== undefined
          ? subscriptionFeatures[planFeature.feature.code]
          : planFeature.isEnabled;

        return {
          featureId: planFeature.feature.id,
          featureName: planFeature.feature.name,
          price: isEnabled ? Number(planFeature.price) : 0,
          isEnabled,
        };
      });

      // Calculate total feature fees
      const totalFeatureFees = featureFees.reduce((sum, feature) => sum + feature.price, 0);

      // Calculate total fee
      const totalFee = baseFee + totalFeatureFees;

      // Create breakdown
      const breakdown = {
        baseCalculation: `${subscription.plan.currency} ${baseSalaryPerStudent.toFixed(2)} × ${activeStudentCount} students = ${subscription.plan.currency} ${baseFee.toFixed(2)}`,
        featureCalculation: featureFees
          .filter(f => f.price > 0)
          .map(f => `${f.featureName}: ${subscription.plan.currency} ${f.price.toFixed(2)}`)
          .join(', ') || 'No additional features',
        total: `${subscription.plan.currency} ${totalFee.toFixed(2)}`,
      };

      return {
        baseFee,
        featureFees,
        totalFee,
        activeStudentCount,
        currency: subscription.plan.currency,
        breakdown,
      };
    } catch (error) {
      console.error('Error calculating school pricing:', error);
      return null;
    }
  }

  /**
   * Get active student count for a school
   */
  static async getActiveStudentCount(schoolId: string): Promise<number> {
    try {
      // Count active students (those with status 'active' or similar)
      const studentCount = await prisma.wpos_wpdatatable_23.count({
        where: {
          schoolId,
          // Add status filter if your student table has status field
          // status: 'active',
        },
      });

      return studentCount;
    } catch (error) {
      console.error('Error getting active student count:', error);
      return 0;
    }
  }

  /**
   * Calculate pricing preview for a plan with given student count
   */
  static async calculatePlanPreview(
    planId: string,
    studentCount: number,
    enabledFeatures?: Record<string, boolean>
  ): Promise<PricingCalculation | null> {
    try {
      const plan = await prisma.pricingPlan.findUnique({
        where: { id: planId },
        include: {
          planFeatures: {
            include: {
              feature: true,
            },
          },
        },
      });

      if (!plan) {
        return null;
      }

      // Calculate base fee
      const baseSalaryPerStudent = Number(plan.baseSalaryPerStudent);
      const baseFee = baseSalaryPerStudent * studentCount;

      // Calculate feature fees
      const featureFees = plan.planFeatures.map(planFeature => {
        // Check if feature is enabled (use provided overrides or plan defaults)
        const isEnabled = enabledFeatures?.[planFeature.feature.code] !== undefined
          ? enabledFeatures[planFeature.feature.code]
          : planFeature.isEnabled;

        return {
          featureId: planFeature.feature.id,
          featureName: planFeature.feature.name,
          price: isEnabled ? Number(planFeature.price) : 0,
          isEnabled,
        };
      });

      // Calculate total feature fees
      const totalFeatureFees = featureFees.reduce((sum, feature) => sum + feature.price, 0);

      // Calculate total fee
      const totalFee = baseFee + totalFeatureFees;

      // Create breakdown
      const breakdown = {
        baseCalculation: `${plan.currency} ${baseSalaryPerStudent.toFixed(2)} × ${studentCount} students = ${plan.currency} ${baseFee.toFixed(2)}`,
        featureCalculation: featureFees
          .filter(f => f.price > 0)
          .map(f => `${f.featureName}: ${plan.currency} ${f.price.toFixed(2)}`)
          .join(', ') || 'No additional features',
        total: `${plan.currency} ${totalFee.toFixed(2)}`,
      };

      return {
        baseFee,
        featureFees,
        totalFee,
        activeStudentCount: studentCount,
        currency: plan.currency,
        breakdown,
      };
    } catch (error) {
      console.error('Error calculating plan preview:', error);
      return null;
    }
  }

  /**
   * Get all pricing plans with calculated pricing for a given student count
   */
  static async getAllPlansPricing(studentCount: number): Promise<Array<{
    plan: any;
    pricing: PricingCalculation;
  }>> {
    try {
      const plans = await prisma.pricingPlan.findMany({
        where: { isActive: true },
        include: {
          planFeatures: {
            include: {
              feature: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const plansWithPricing = await Promise.all(
        plans.map(async (plan) => {
          const pricing = await this.calculatePlanPreview(plan.id, studentCount);
          return {
            plan,
            pricing: pricing!,
          };
        })
      );

      return plansWithPricing;
    } catch (error) {
      console.error('Error getting all plans pricing:', error);
      return [];
    }
  }
}
