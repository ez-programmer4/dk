import { prisma } from "@/lib/prisma";

// Types for subscription plan operations
export interface PricingTier {
  id?: string;
  minStudents: number;
  maxStudents: number | null;
  basePrice: number;
  perStudentPrice: number;
  name: string;
}

export interface CreatePlanData {
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  perStudentPrice: number;
  pricingTiers?: PricingTier[];
  currency: string;
  maxStudents?: number;
  maxTeachers?: number;
  maxStorage?: number;
  features?: any;
  billingCycles?: string[];
  trialDays?: number;
  isActive?: boolean;
  isPublic?: boolean;
}

/**
 * Get all subscription plans
 * @param includeInactive - Whether to include inactive plans
 * @returns Array of subscription plans
 */
export async function getSubscriptionPlans(includeInactive: boolean = false) {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [
        { isActive: "desc" },
        { basePrice: "asc" },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        perStudentPrice: true,
        pricingTiers: true,
        currency: true,
        maxStudents: true,
        maxTeachers: true,
        maxStorage: true,
        features: true,
        billingCycles: true,
        trialDays: true,
        isActive: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            schools: true,
          },
        },
      },
    });

    return plans.map(plan => ({
      ...plan,
      basePrice: Number(plan.basePrice),
      perStudentPrice: Number(plan.perStudentPrice),
    }));
  } catch (error) {
    console.error("Failed to get subscription plans:", error);
    throw new Error("Failed to fetch subscription plans");
  }
}

/**
 * Create a new subscription plan
 * @param planData - The plan data to create
 * @returns The created plan
 */
export async function createSubscriptionPlan(planData: CreatePlanData) {
  try {
    // Check if slug already exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { slug: planData.slug },
    });

    if (existingPlan) {
      throw new Error("A plan with this slug already exists");
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: planData.name,
        slug: planData.slug,
        description: planData.description,
        basePrice: planData.basePrice,
        perStudentPrice: planData.perStudentPrice,
        pricingTiers: planData.pricingTiers,
        currency: planData.currency,
        maxStudents: planData.maxStudents,
        maxTeachers: planData.maxTeachers,
        maxStorage: planData.maxStorage,
        features: planData.features || {},
        billingCycles: planData.billingCycles || ["monthly"],
        trialDays: planData.trialDays || 0,
        isActive: planData.isActive !== undefined ? planData.isActive : true,
        isPublic: planData.isPublic !== undefined ? planData.isPublic : true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        perStudentPrice: true,
        pricingTiers: true,
        currency: true,
        maxStudents: true,
        maxTeachers: true,
        maxStorage: true,
        features: true,
        billingCycles: true,
        trialDays: true,
        isActive: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...plan,
      basePrice: Number(plan.basePrice),
      perStudentPrice: Number(plan.perStudentPrice),
    };
  } catch (error: any) {
    console.error("Failed to create subscription plan:", error);
    if (error.message.includes("slug")) {
      throw error;
    }
    throw new Error("Failed to create subscription plan");
  }
}

/**
 * Update an existing subscription plan
 * @param planId - The plan ID to update
 * @param updateData - The data to update
 * @returns The updated plan
 */
export async function updateSubscriptionPlan(planId: string, updateData: Partial<CreatePlanData>) {
  try {
    // If slug is being updated, check for conflicts
    if (updateData.slug) {
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: {
          slug: updateData.slug,
          id: { not: planId },
        },
      });

      if (existingPlan) {
        throw new Error("A plan with this slug already exists");
      }
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        perStudentPrice: true,
        pricingTiers: true,
        currency: true,
        maxStudents: true,
        maxTeachers: true,
        maxStorage: true,
        features: true,
        billingCycles: true,
        trialDays: true,
        isActive: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...plan,
      basePrice: Number(plan.basePrice),
      perStudentPrice: Number(plan.perStudentPrice),
    };
  } catch (error: any) {
    console.error("Failed to update subscription plan:", error);
    if (error.message.includes("slug")) {
      throw error;
    }
    throw new Error("Failed to update subscription plan");
  }
}

/**
 * Delete a subscription plan (soft delete by setting isActive to false)
 * @param planId - The plan ID to deactivate
 */
export async function deleteSubscriptionPlan(planId: string) {
  try {
    await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { isActive: false },
    });
  } catch (error) {
    console.error("Failed to delete subscription plan:", error);
    throw new Error("Failed to delete subscription plan");
  }
}

/**
 * Get a single subscription plan by ID
 * @param planId - The plan ID to fetch
 * @returns The plan data
 */
export async function getSubscriptionPlan(planId: string) {
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        perStudentPrice: true,
        pricingTiers: true,
        currency: true,
        maxStudents: true,
        maxTeachers: true,
        maxStorage: true,
        features: true,
        billingCycles: true,
        trialDays: true,
        isActive: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            schools: true,
          },
        },
      },
    });

    if (!plan) {
      throw new Error("Plan not found");
    }

    return {
      ...plan,
      basePrice: Number(plan.basePrice),
      perStudentPrice: Number(plan.perStudentPrice),
    };
  } catch (error) {
    console.error("Failed to get subscription plan:", error);
    throw new Error("Failed to fetch subscription plan");
  }
}
