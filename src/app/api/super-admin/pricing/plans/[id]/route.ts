import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/pricing/plans/[id] - Get specific pricing plan
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await prisma.pricingPlan.findUnique({
      where: { id: params.id },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
        subscriptions: {
          include: {
            school: {
              select: { name: true, slug: true },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Pricing plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Get pricing plan API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/pricing/plans/[id] - Update pricing plan
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, baseSalaryPerStudent, currency, isActive, isDefault, features } = await req.json();

    // Check if plan exists
    const existingPlan = await prisma.pricingPlan.findUnique({
      where: { id: params.id },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Pricing plan not found" }, { status: 404 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.pricingPlan.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // Update the plan
    const updatedPlan = await prisma.pricingPlan.update({
      where: { id: params.id },
      data: {
        name: name || existingPlan.name,
        description,
        baseSalaryPerStudent: baseSalaryPerStudent ? parseFloat(baseSalaryPerStudent) : existingPlan.baseSalaryPerStudent,
        currency: currency || existingPlan.currency,
        isActive: isActive !== undefined ? isActive : existingPlan.isActive,
        isDefault: isDefault !== undefined ? isDefault : existingPlan.isDefault,
      },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
      },
    });

    // Update features if provided
    if (features && Array.isArray(features)) {
      // Delete existing plan features
      await prisma.planFeature.deleteMany({
        where: { planId: params.id },
      });

      // Add new plan features
      const planFeatures = features.map((feature: any) => ({
        planId: params.id,
        featureId: feature.id,
        price: parseFloat(feature.price || 0),
        isEnabled: feature.isEnabled !== false,
      }));

      await prisma.planFeature.createMany({
        data: planFeatures,
      });
    }

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "update_pricing_plan",
          resourceType: "pricing_plan",
          resourceId: params.id,
          details: {
            planName: updatedPlan.name,
            changes: {
              name: name !== undefined,
              baseSalaryPerStudent: baseSalaryPerStudent !== undefined,
              isActive: isActive !== undefined,
              isDefault: isDefault !== undefined,
              featuresUpdated: features !== undefined,
            },
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Pricing plan updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Update pricing plan API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/pricing/plans/[id] - Delete pricing plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if plan exists and has subscriptions
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: params.id },
      include: {
        subscriptions: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Pricing plan not found" }, { status: 404 });
    }

    // Don't allow deletion if plan has active subscriptions
    const activeSubscriptions = plan.subscriptions.filter(sub => sub.status === 'active');
    if (activeSubscriptions.length > 0) {
      return NextResponse.json({
        error: "Cannot delete plan with active subscriptions. Deactivate the plan instead."
      }, { status: 400 });
    }

    // Soft delete by deactivating (or hard delete if no subscriptions)
    if (plan.subscriptions.length === 0) {
      await prisma.pricingPlan.delete({
        where: { id: params.id },
      });
    } else {
      await prisma.pricingPlan.update({
        where: { id: params.id },
        data: { isActive: false },
      });
    }

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "delete_pricing_plan",
          resourceType: "pricing_plan",
          resourceId: params.id,
          details: {
            planName: plan.name,
            hadSubscriptions: plan.subscriptions.length > 0,
            action: plan.subscriptions.length === 0 ? "hard_delete" : "deactivate",
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: plan.subscriptions.length === 0 ? "Pricing plan deleted successfully" : "Pricing plan deactivated successfully",
    });
  } catch (error) {
    console.error("Delete pricing plan API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


