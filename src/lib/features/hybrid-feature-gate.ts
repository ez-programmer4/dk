import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type FeatureCode = string; // Now dynamic - any string can be a feature code

export type FeatureAccessResult = {
  access: 'granted' | 'denied' | 'limited';
  type: 'core' | 'premium';
  reason?: string;
  fallback?: string;
  upgradeOptions?: string[];
  limits?: Record<string, any>;
};

export type FeatureContext = {
  schoolId: string;
  userId?: string;
  userRole?: string;
};

export class HybridFeatureGate {
  // Core features that are always available (can be configured in database later)
  private static readonly DEFAULT_CORE_FEATURES: FeatureCode[] = [
    'student_management',
    'teacher_management',
    'basic_reporting',
    'user_management',
    'school_settings',
    'dashboard_basic',
    'communication_basic'
  ];

  // Cache for feature configurations
  private static featureCache: Map<string, any> = new Map();
  private static cacheExpiry: Map<string, number> = new Map();

  /**
   * Evaluate feature access for a specific school and user
   */
  static async evaluateFeatureAccess(
    featureCode: FeatureCode,
    context: FeatureContext
  ): Promise<FeatureAccessResult> {
    try {
      const { schoolId, userId, userRole } = context;

      // Get school subscription and premium features
      const school = await prisma.school.findUnique({
        where: { slug: schoolId },
        include: {
          premiumFeatures: {
            where: { isEnabled: true },
            include: { feature: true }
          },
          premiumPackages: {
            where: { isEnabled: true },
            include: { package: true }
          },
          _count: {
            select: { students: true }
          }
        }
      });

      if (!school) {
        return {
          access: 'denied',
          type: 'premium',
          reason: 'school_not_found'
        };
      }

      // Check if school has active subscription
      if (school.status !== 'active') {
        return {
          access: 'denied',
          type: 'premium',
          reason: 'school_inactive',
          fallback: 'Please contact support to activate your school account.'
        };
      }

      // Check if feature is core (always available)
      // For now, use default core features, but this can be made configurable later
      if (this.DEFAULT_CORE_FEATURES.includes(featureCode)) {
        return {
          access: 'granted',
          type: 'core'
        };
      }

      // Check individual premium feature access
      const featureAccess = school.premiumFeatures.find(
        pf => pf.feature.code === featureCode && pf.isEnabled
      );

      // Check package access (if they have an all-inclusive package)
      const hasPackage = school.premiumPackages.some(
        pp => pp.isEnabled && pp.package.name.toLowerCase().includes('all premium')
      );

      if (featureAccess || hasPackage) {
        return {
          access: 'granted',
          type: 'premium'
        };
      }

      // Feature is not enabled - try to get feature info from database
      try {
        const featureInfo = await prisma.premiumFeature.findUnique({
          where: { code: featureCode }
        });

        const upgradeOptions = [
          `Enable ${featureInfo?.name || featureCode.replace('_', ' ')} feature individually`,
          'Upgrade to All Premium Features package'
        ];

        return {
          access: 'denied',
          type: 'premium',
          reason: 'feature_not_enabled',
          upgradeOptions,
          fallback: `This feature (${featureInfo?.name || featureCode.replace('_', ' ')}) requires a premium subscription. Please contact your administrator to enable it.`
        };
      } catch (dbError) {
        // If feature doesn't exist in database, deny access
        return {
          access: 'denied',
          type: 'premium',
          reason: 'feature_not_found',
          upgradeOptions: ['Contact administrator to configure this feature'],
          fallback: `This feature (${featureCode.replace('_', ' ')}) is not available. Please contact support.`
        };
      }

    } catch (error) {
      console.error('Error evaluating feature access:', error);
      return {
        access: 'denied',
        type: 'premium',
        reason: 'system_error'
      };
    }
  }

  /**
   * Get all available features for a school
   */
  static async getAvailableFeatures(schoolId: string): Promise<FeatureCode[]> {
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolId },
        include: {
          premiumFeatures: {
            where: { isEnabled: true },
            include: { feature: true }
          },
          premiumPackages: {
            where: { isEnabled: true },
            include: { package: true }
          }
        }
      });

      if (!school) return this.DEFAULT_CORE_FEATURES;

      const availableFeatures = [...this.DEFAULT_CORE_FEATURES];

      // Add enabled individual features
      school.premiumFeatures.forEach(pf => {
        if (pf.isEnabled && pf.feature.isActive) {
          if (!availableFeatures.includes(pf.feature.code)) {
            availableFeatures.push(pf.feature.code);
          }
        }
      });

      // Add all features if they have an all-inclusive package
      const hasPackage = school.premiumPackages.some(
        pp => pp.isEnabled && pp.package.name.toLowerCase().includes('all premium')
      );

      if (hasPackage) {
        // Get all active premium features from database
        const allPremiumFeatures = await prisma.premiumFeature.findMany({
          where: { isActive: true },
          select: { code: true }
        });

        allPremiumFeatures.forEach(feature => {
          if (!availableFeatures.includes(feature.code)) {
            availableFeatures.push(feature.code);
          }
        });
      }

      return availableFeatures;
    } catch (error) {
      console.error('Error getting available features:', error);
      return this.DEFAULT_CORE_FEATURES;
    }
  }

  /**
   * Get features that require upgrade for a school
   */
  static async getUpgradeRequiredFeatures(schoolId: string): Promise<FeatureCode[]> {
    try {
      // Get all active premium features from database
      const allPremiumFeatures = await prisma.premiumFeature.findMany({
        where: { isActive: true },
        select: { code: true }
      });

      const allFeatures = [...this.DEFAULT_CORE_FEATURES, ...allPremiumFeatures.map(f => f.code)];
      const availableFeatures = await this.getAvailableFeatures(schoolId);

      return allFeatures.filter(feature => !availableFeatures.includes(feature));
    } catch (error) {
      console.error('Error getting upgrade required features:', error);
      return [];
    }
  }

  /**
   * Check if a school has access to a specific feature
   */
  static async hasFeatureAccess(
    featureCode: FeatureCode,
    schoolId: string
  ): Promise<boolean> {
    const result = await this.evaluateFeatureAccess(featureCode, { schoolId });
    return result.access === 'granted';
  }

  /**
   * Get school subscription information
   */
  static async getSchoolSubscription(schoolId: string) {
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolId },
        select: {
          id: true,
          name: true,
          status: true,
          pricingTier: {
            select: {
              id: true,
              name: true,
              monthlyFee: true,
              currency: true
            }
          },
          subscription: {
            select: {
              status: true,
              currentStudents: true,
              trialEndsAt: true,
              subscribedAt: true,
              nextBillingDate: true
            }
          }
        }
      });

      return school;
    } catch (error) {
      console.error('Error getting school subscription:', error);
      return null;
    }
  }

  /**
   * Get feature usage limits for a school
   */
  static async getFeatureLimits(featureCode: FeatureCode, schoolId: string) {
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolId },
        select: {
          _count: {
            select: { students: true, teachers: true }
          },
          premiumFeatures: {
            where: { isEnabled: true },
            include: { feature: true }
          }
        }
      });

      if (!school) return null;

      // Define limits based on features
      const limits: Record<string, any> = {
        studentLimit: 1000, // Default limit
        teacherLimit: 50,
      };

      // Check for premium features that might increase limits
      const hasAnalytics = school.premiumFeatures.some(pf =>
        pf.feature.code === 'student_analytics' && pf.isEnabled
      );

      if (hasAnalytics) {
        limits.studentLimit = 5000; // Higher limit for analytics
      }

      return limits;
    } catch (error) {
      console.error('Error getting feature limits:', error);
      return null;
    }
  }
}