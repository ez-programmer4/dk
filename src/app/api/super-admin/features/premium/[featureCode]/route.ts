import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// PUT /api/super-admin/features/premium/[featureCode] - Update premium feature settings
export async function PUT(
  req: NextRequest,
  { params }: { params: { featureCode: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { featureCode } = params;
    const { requiredPlans, isEnabled } = await req.json();

    if (!requiredPlans || !Array.isArray(requiredPlans)) {
      return NextResponse.json({
        error: "requiredPlans array is required"
      }, { status: 400 });
    }

    const updatedFeature = await prisma.premiumFeature.update({
      where: { featureCode },
      data: {
        requiredPlans,
        isEnabled,
        updatedAt: new Date()
      }
    });

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.user.id,
        action: "update_premium_feature",
        resourceType: "feature",
        resourceId: updatedFeature.id,
        details: {
          featureCode,
          requiredPlans,
          isEnabled
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({
      success: true,
      premiumFeature: updatedFeature,
      message: `Premium settings updated for ${featureCode}`
    });
  } catch (error) {
    console.error("Failed to update premium feature:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/super-admin/features/premium/[featureCode] - Make feature core again (remove premium)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { featureCode: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { featureCode } = params;

    const deletedFeature = await prisma.premiumFeature.delete({
      where: { featureCode }
    });

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.user.id,
        action: "make_feature_core",
        resourceType: "feature",
        resourceId: deletedFeature.id,
        details: {
          featureCode,
          message: "Feature is now core (removed from premium)"
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${featureCode} is now a core feature again`
    });
  } catch (error) {
    console.error("Failed to make feature core:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


