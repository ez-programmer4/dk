import { ALL_FEATURES, type FeatureCode } from './feature-registry';

export interface FeatureContext {
  schoolId: string;
  userId?: string;
  userRole?: string;
  requestSource?: 'web' | 'api' | 'mobile';
  ipAddress?: string;
  userAgent?: string;
}

export interface FeatureAccessResult {
  access: 'granted' | 'denied';
  type: 'core' | 'premium';
  reason: string;
  limits?: UsageLimits;
  fallback?: FallbackBehavior;
  upgradeOptions?: UpgradeOption[];
}

export interface UsageLimits {
  monthlyCalls?: number;
  concurrentUsers?: number;
  dataRetention?: number;
  customLimits?: Record<string, any>;
}

export interface FallbackBehavior {
  mode: 'hide' | 'disabled' | 'limited' | 'upgrade_prompt';
  message?: string;
  limitedFeatures?: string[];
}

export interface UpgradeOption {
  plan: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

/**
 * Dynamic Feature Gate - All features start as CORE
 * Premium features are dynamically selected via database
 */
export class HybridFeatureGate {
  private static featureCache = new Map<string, FeatureAccessResult>();
  private static cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private static premiumFeaturesCache: Map<string, any> | null = null;
  private static premiumFeaturesCacheExpiry = 0;

  /**
   * Main method to check feature access
   */
  static async evaluateFeatureAccess(
    featureCode: FeatureCode,
    context: FeatureContext
  ): Promise<FeatureAccessResult> {

    const cacheKey = `${featureCode}:${context.schoolId}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    const feature = ALL_FEATURES[featureCode];
    if (!feature) {
      const result: FeatureAccessResult = {
        access: 'denied',
        type: 'core',
        reason: 'feature_not_found'
      };
      this.cacheResult(cacheKey, result);
      return result;
    }

    // Check if this feature is marked as premium in the database
    const premiumConfig = await this.getPremiumFeatureConfig(featureCode);

    if (!premiumConfig || !premiumConfig.isEnabled) {
      // Feature is not premium (or premium gating is disabled) - available to all
      const result: FeatureAccessResult = {
        access: 'granted',
        type: 'core',
        reason: 'core_feature',
        limits: this.getFeatureLimits(featureCode, 'trial') // Base limits for all
      };
      this.cacheResult(cacheKey, result);
      return result;
    }

    // Feature is premium - check subscription
    const result = await this.checkPremiumFeatureAccess(featureCode, context, premiumConfig);
    this.cacheResult(cacheKey, result);
    return result;
  }

  /**
   * Simplified method for quick access checks
   */
  static async canAccessFeature(
    featureCode: FeatureCode,
    schoolId: string
  ): Promise<boolean> {
    const result = await this.evaluateFeatureAccess(featureCode, { schoolId });
    return result.access === 'granted';
  }

  /**
   * Check if feature is premium (dynamically from database)
   */
  static async isPremiumFeature(featureCode: FeatureCode): Promise<boolean> {
    const premiumConfig = await this.getPremiumFeatureConfig(featureCode);
    return premiumConfig?.isEnabled || false;
  }

  /**
   * Get premium feature configuration from database
   */
  private static async getPremiumFeatureConfig(featureCode: FeatureCode): Promise<any | null> {
    // Check cache first
    if (this.premiumFeaturesCache && Date.now() < this.premiumFeaturesCacheExpiry) {
      return this.premiumFeaturesCache.get(featureCode) || null;
    }

    try {
      // Load from database
      const { prisma } = await import("@/lib/prisma");

      const premiumFeatures = await prisma.premiumFeature.findMany({
        where: { isEnabled: true }
      });

      // Create cache
      this.premiumFeaturesCache = new Map();
      premiumFeatures.forEach(pf => {
        this.premiumFeaturesCache.set(pf.featureCode, {
          isEnabled: pf.isEnabled,
          requiredPlans: pf.requiredPlans,
          fallbackMode: 'upgrade_prompt' // Default fallback mode
        });
      });

      this.premiumFeaturesCacheExpiry = Date.now() + (5 * 60 * 1000); // 5 minutes

      return this.premiumFeaturesCache.get(featureCode) || null;

    } catch (error) {
      console.error("Failed to load premium features from database:", error);
      // Return empty cache on error
      this.premiumFeaturesCache = new Map();
      this.premiumFeaturesCacheExpiry = Date.now() + (5 * 60 * 1000);
      return null;
    }
  }

  /**
   * Get all available features for a school
   */
  static async getAvailableFeatures(schoolId: string): Promise<FeatureCode[]> {
    const allFeatures = Object.keys(ALL_FEATURES) as FeatureCode[];
    const availableFeatures: FeatureCode[] = [];

    for (const feature of allFeatures) {
      if (await this.canAccessFeature(feature, schoolId)) {
        availableFeatures.push(feature);
      }
    }

    return availableFeatures;
  }

  /**
   * Get features that require upgrade (premium features school can't access)
   */
  static async getUpgradeRequiredFeatures(schoolId: string): Promise<FeatureCode[]> {
    const allFeatures = Object.keys(ALL_FEATURES) as FeatureCode[];
    const upgradeRequired: FeatureCode[] = [];

    for (const feature of allFeatures) {
      // Only check premium features
      if (await this.isPremiumFeature(feature)) {
        if (!(await this.canAccessFeature(feature, schoolId))) {
          upgradeRequired.push(feature);
        }
      }
    }

    return upgradeRequired;
  }

  /**
   * Get all premium features (dynamically from database)
   */
  static async getAllPremiumFeatures(): Promise<FeatureCode[]> {
    const allFeatures = Object.keys(ALL_FEATURES) as FeatureCode[];
    const premiumFeatures: FeatureCode[] = [];

    for (const feature of allFeatures) {
      if (await this.isPremiumFeature(feature)) {
        premiumFeatures.push(feature);
      }
    }

    return premiumFeatures;
  }

  /**
   * Make a feature premium (admin function)
   */
  static async makeFeaturePremium(
    featureCode: FeatureCode,
    requiredPlans: string[],
    adminId: string
  ): Promise<void> {
    try {
      const { prisma } = await import("@/lib/prisma");

      await prisma.premiumFeature.create({
        data: {
          featureCode,
          isEnabled: true,
          requiredPlans,
          createdById: adminId
        }
      });

      // Clear cache to force refresh
      this.premiumFeaturesCache = null;
      this.clearCache();

    } catch (error) {
      console.error(`Failed to make ${featureCode} premium:`, error);
      throw error;
    }
  }

  /**
   * Make a feature core again (remove premium gating)
   */
  static async makeFeatureCore(featureCode: FeatureCode): Promise<void> {
    try {
      const { prisma } = await import("@/lib/prisma");

      await prisma.premiumFeature.delete({
        where: { featureCode }
      });

      // Clear cache to force refresh
      this.premiumFeaturesCache = null;
      this.clearCache();

    } catch (error) {
      console.error(`Failed to make ${featureCode} core:`, error);
      throw error;
    }
  }

  // Private methods

  private static async checkPremiumFeatureAccess(
    featureCode: FeatureCode,
    context: FeatureContext,
    premiumConfig: any
  ): Promise<FeatureAccessResult> {

    try {
      const subscription = await this.getSchoolSubscription(context.schoolId);

      // Check if school has required plan
      const hasRequiredPlan = premiumConfig.requiredPlans.includes(subscription.plan.tier);

      if (hasRequiredPlan) {
        return {
          access: 'granted',
          type: 'premium',
          reason: 'subscription_valid',
          limits: this.getFeatureLimits(featureCode, subscription.plan.tier)
        };
      }

      // No access - prepare fallback
      return {
        access: 'denied',
        type: 'premium',
        reason: 'subscription_required',
        fallback: {
          mode: premiumConfig.fallbackMode || 'upgrade_prompt',
          message: this.getFallbackMessage(featureCode)
        },
        upgradeOptions: this.getUpgradeOptions(featureCode, subscription.plan.tier, premiumConfig.requiredPlans)
      };

    } catch (error) {
      console.error(`Error checking premium feature access for ${featureCode}:`, error);
      return {
        access: 'denied',
        type: 'premium',
        reason: 'system_error'
      };
    }
  }

  private static async getSchoolSubscription(schoolId: string) {
    // This should be implemented to fetch from your database
    // For now, return a mock subscription
    return {
      plan: {
        tier: 'trial', // trial, basic, professional, enterprise
        name: 'Trial Plan',
        price: 0
      },
      status: 'active'
    };
  }

  private static getFeatureLimits(featureCode: FeatureCode, planTier: string): UsageLimits {
    // Dynamic limits based on plan tier - higher tiers get more usage
    const tierLimits: Record<string, UsageLimits> = {
      trial: { monthlyCalls: 1000, concurrentUsers: 10 },
      basic: { monthlyCalls: 5000, concurrentUsers: 50 },
      professional: { monthlyCalls: 25000, concurrentUsers: 100 },
      enterprise: { monthlyCalls: 100000, concurrentUsers: 500 },
    };

    return tierLimits[planTier] || tierLimits.trial;
  }

  private static getFallbackMessage(featureCode: FeatureCode): string {
    const feature = ALL_FEATURES[featureCode];
    return `Upgrade your plan to access ${feature.name}`;
  }

  private static getUpgradeOptions(
    featureCode: FeatureCode,
    currentTier: string,
    requiredPlans: string[]
  ): UpgradeOption[] {
    const options: UpgradeOption[] = [];
    const feature = ALL_FEATURES[featureCode];

    // Generate upgrade options based on required plans
    if (requiredPlans.includes('professional') && !['professional', 'enterprise'].includes(currentTier)) {
      options.push({
        plan: 'professional',
        price: '$99/month',
        description: `Unlock ${feature.name} and other premium features`,
        features: [featureCode]
      });
    }

    if (requiredPlans.includes('enterprise') && currentTier !== 'enterprise') {
      options.push({
        plan: 'enterprise',
        price: '$299/month',
        description: `Access ${feature.name} and all enterprise features`,
        features: [featureCode, 'advanced_analytics', 'api_access', 'custom_branding']
      });
    }

    return options;
  }

  private static getPlanPrice(plan: string): number {
    const prices = {
      basic: 29,
      professional: 99,
      enterprise: 299
    };
    return prices[plan] || 0;
  }

  private static getPlanFeatures(plan: string): string[] {
    const planFeatures = {
      basic: ['student_management', 'teacher_management', 'basic_reporting'],
      professional: ['teacher_payment', 'student_mini_app'],
      enterprise: ['advanced_analytics', 'api_access', 'custom_branding']
    };
    return planFeatures[plan] || [];
  }

  // Caching methods
  private static getCachedResult(key: string): FeatureAccessResult | null {
    const cached = this.featureCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }
    this.featureCache.delete(key);
    return null;
  }

  private static cacheResult(key: string, result: FeatureAccessResult): void {
    this.featureCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  // Clear cache for a school (useful when subscription changes)
  static clearSchoolCache(schoolId: string): void {
    for (const [key] of this.featureCache) {
      if (key.includes(schoolId)) {
        this.featureCache.delete(key);
      }
    }
  }
}
