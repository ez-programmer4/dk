/**
 * Super Admin Subscription Plan API (Individual)
 *
 * GET: Get a specific plan
 * PUT: Update a plan
 * DELETE: Delete a plan (soft delete by setting isActive to false)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getSubscriptionPlan,
  updateSubscriptionPlan,
  type UpdatePlanData,
} from "@/lib/billing/subscription-plans";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/super-admin/plans/[id] - Get a specific plan
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getSubscriptionPlan(params.id);

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error: any) {
    console.error("Get plan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch plan" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/plans/[id] - Update a plan
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updateData: UpdatePlanData = {
      id: params.id,
      name: body.name,
      slug: body.slug,
      description: body.description,
      basePrice: body.basePrice,
      perStudentPrice: body.perStudentPrice,
      pricingTiers: body.pricingTiers,
      currency: body.currency,
      maxStudents: body.maxStudents,
      maxTeachers: body.maxTeachers,
      maxStorage: body.maxStorage,
      features: body.features,
      billingCycles: body.billingCycles,
      trialDays: body.trialDays,
      isActive: body.isActive,
      isPublic: body.isPublic,
    };

    const plan = await updateSubscriptionPlan(updateData);

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "update_plan",
          resourceType: "plan",
          resourceId: params.id,
          details: {
            planName: plan.name,
            changes: body,
          },
          ipAddress:
            req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error: any) {
    console.error("Update plan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update plan" },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/plans/[id] - Soft delete (deactivate) a plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete by setting isActive to false
    // Note: Using updateSubscriptionPlan would be better, but for soft delete we use direct Prisma
    const plan = await updateSubscriptionPlan({
      id: params.id,
      isActive: false,
    });

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "delete_plan",
          resourceType: "plan",
          resourceId: params.id,
          details: {
            planName: plan.name,
          },
          ipAddress:
            req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Plan deactivated successfully",
    });
  } catch (error: any) {
    console.error("Delete plan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete plan" },
      { status: 500 }
    );
  }
}
