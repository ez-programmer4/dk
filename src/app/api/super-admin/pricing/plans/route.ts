import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/pricing/plans - Get all pricing plans
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Get pricing plans API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/pricing/plans - Create new pricing plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, slug, baseSalaryPerStudent, currency, features } = await req.json();

    // Validate required fields
    if (!name || !slug || !baseSalaryPerStudent) {
      return NextResponse.json({
        error: "Name, slug, and base salary per student are required"
      }, { status: 400 });
    }

    // Check if slug is unique
    const existingPlan = await prisma.pricingPlan.findUnique({
      where: { slug },
    });

    if (existingPlan) {
      return NextResponse.json({
        error: "Plan slug already exists"
      }, { status: 400 });
    }

    // Create the plan
    const plan = await prisma.pricingPlan.create({
      data: {
        name,
        description,
        slug,
        baseSalaryPerStudent: parseFloat(baseSalaryPerStudent),
        currency: currency || "ETB",
        createdById: session.user.id,
      },
      include: {
        planFeatures: {
          include: {
            feature: true,
          },
        },
      },
    });

    // Add features to the plan if provided
    if (features && Array.isArray(features)) {
      const planFeatures = features.map((feature: any) => ({
        planId: plan.id,
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
          action: "create_pricing_plan",
          resourceType: "pricing_plan",
          resourceId: plan.id,
          details: {
            planName: name,
            planSlug: slug,
            baseSalaryPerStudent,
            featuresCount: features?.length || 0,
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
      message: "Pricing plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Create pricing plan API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
