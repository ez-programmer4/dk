import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = params;

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get all premium features with school-specific status
    const allFeatures = await prisma.premiumFeature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Get school's premium feature status
    const schoolFeatures = await prisma.schoolPremiumFeature.findMany({
      where: { schoolId },
      include: {
        feature: true,
      },
    });

    // Combine data
    const features = allFeatures.map(feature => {
      const schoolFeature = schoolFeatures.find(sf => sf.featureId === feature.id);
      return {
        id: feature.id,
        code: feature.code,
        name: feature.name,
        description: feature.description,
        category: feature.category,
        basePricePerStudent: feature.basePricePerStudent,
        currency: feature.currency,
        isRequired: feature.isRequired,
        isEnabled: schoolFeature?.isEnabled || false,
        customPricePerStudent: schoolFeature?.customPricePerStudent,
        enabledAt: schoolFeature?.enabledAt,
        disabledAt: schoolFeature?.disabledAt,
        monthlyCost: (schoolFeature?.customPricePerStudent || feature.basePricePerStudent) * school._count.students,
      };
    });

    const enabledFeatures = features.filter(f => f.isEnabled);
    const totalMonthlyCost = enabledFeatures.reduce((sum, f) => sum + f.monthlyCost, 0);

    return NextResponse.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        activeStudents: school._count.students,
      },
      features,
      summary: {
        totalFeatures: features.length,
        enabledFeatures: enabledFeatures.length,
        disabledFeatures: features.length - enabledFeatures.length,
        totalMonthlyCost,
        currency: "ETB",
      },
    });

  } catch (error) {
    console.error("School premium features fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = params;
    const body = await req.json();
    const { featureId, isEnabled, customPricePerStudent } = body;

    if (!featureId) {
      return NextResponse.json(
        { error: "featureId is required" },
        { status: 400 }
      );
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Verify feature exists
    const feature = await prisma.premiumFeature.findUnique({
      where: { id: featureId },
      select: { id: true, code: true, name: true, isRequired: true },
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    // Don't allow disabling required features
    if (feature.isRequired && isEnabled === false) {
      return NextResponse.json(
        { error: "Cannot disable required premium features" },
        { status: 400 }
      );
    }

    // Upsert school premium feature
    const schoolFeature = await prisma.schoolPremiumFeature.upsert({
      where: {
        schoolId_featureId: {
          schoolId,
          featureId,
        },
      },
      update: {
        isEnabled,
        customPricePerStudent: customPricePerStudent ? parseFloat(customPricePerStudent) : null,
        enabledAt: isEnabled ? new Date() : undefined,
        disabledAt: !isEnabled ? new Date() : null,
      },
      create: {
        schoolId,
        featureId,
        isEnabled,
        customPricePerStudent: customPricePerStudent ? parseFloat(customPricePerStudent) : null,
        enabledAt: isEnabled ? new Date() : null,
      },
    });

    // Log audit action
    const superAdminId = "78er9w"; // Current super admin
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        action: isEnabled ? "ENABLE_PREMIUM_FEATURE" : "DISABLE_PREMIUM_FEATURE",
        resourceType: "school_premium_feature",
        resourceId: schoolFeature.id,
        details: {
          schoolId,
          schoolName: school.name,
          featureId,
          featureCode: feature.code,
          featureName: feature.name,
          isEnabled,
          customPricePerStudent,
        },
      },
    });

    return NextResponse.json({
      success: true,
      schoolFeature,
      message: `Premium feature ${isEnabled ? 'enabled' : 'disabled'} successfully`,
    });

  } catch (error) {
    console.error("School premium feature update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
