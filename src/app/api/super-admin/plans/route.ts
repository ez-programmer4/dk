/**
 * Super Admin Subscription Plans API
 * 
 * GET: List all plans
 * POST: Create a new plan
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  type CreatePlanData,
} from "@/lib/billing/subscription-plans";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/super-admin/plans - List all plans
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const plans = await getSubscriptionPlans(includeInactive);

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error: any) {
    console.error("Get plans error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/plans - Create a new plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const planData: CreatePlanData = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      basePrice: body.basePrice,
      perStudentPrice: body.perStudentPrice,
      pricingTiers: body.pricingTiers,
      currency: body.currency || "ETB",
      maxStudents: body.maxStudents,
      maxTeachers: body.maxTeachers,
      maxStorage: body.maxStorage,
      features: body.features,
      billingCycles: body.billingCycles || ["monthly"],
      trialDays: body.trialDays || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isPublic: body.isPublic !== undefined ? body.isPublic : true,
    };

    // Validate required fields
    if (!planData.name || !planData.slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    // Either traditional pricing or tiered pricing must be provided
    const hasTraditionalPricing = planData.basePrice !== undefined && planData.perStudentPrice !== undefined;
    const hasTieredPricing = planData.pricingTiers && planData.pricingTiers.length > 0;

    if (!hasTraditionalPricing && !hasTieredPricing) {
      return NextResponse.json(
        { error: "Either traditional pricing (basePrice, perStudentPrice) or tiered pricing (pricingTiers) must be provided" },
        { status: 400 }
      );
    }

    const plan = await createSubscriptionPlan(planData);

    // TODO: Implement super admin audit logging
    // Create audit log once the SuperAdminAuditLog model is added to schema

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error: any) {
    console.error("Create plan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create plan" },
      { status: 500 }
    );
  }
}


