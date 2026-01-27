import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/super-admin/features/premium - Get all premium features
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const premiumFeatures = await prisma.premiumFeature.findMany({
      include: {
        createdBy: {
          select: { name: true, username: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, premiumFeatures });
  } catch (error) {
    console.error("Failed to fetch premium features:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/super-admin/features/premium - Make a feature premium
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { featureCode, requiredPlans, isEnabled = true } = await req.json();

    if (!featureCode || !requiredPlans || !Array.isArray(requiredPlans)) {
      return NextResponse.json({
        error: "featureCode and requiredPlans array are required"
      }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.premiumFeature.findUnique({
      where: { featureCode }
    });

    if (existing) {
      return NextResponse.json({
        error: "Feature is already premium"
      }, { status: 400 });
    }

    const premiumFeature = await prisma.premiumFeature.create({
      data: {
        featureCode,
        isEnabled,
        requiredPlans,
        createdById: session.user.id
      }
    });

    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.user.id,
        action: "make_feature_premium",
        resourceType: "feature",
        resourceId: premiumFeature.id,
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
      premiumFeature,
      message: `${featureCode} is now a premium feature`
    });
  } catch (error) {
    console.error("Failed to make feature premium:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

