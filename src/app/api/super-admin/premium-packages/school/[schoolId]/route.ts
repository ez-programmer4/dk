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

    // Get all premium packages with school-specific status
    const allPackages = await prisma.premiumPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Get school's premium package status
    const schoolPackages = await prisma.schoolPremiumPackage.findMany({
      where: { schoolId },
      include: {
        package: true,
      },
    });

    // Combine data
    const packages = allPackages.map(pkg => {
      const schoolPackage = schoolPackages.find(sp => sp.packageId === pkg.id);
      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        packagePricePerStudent: pkg.packagePricePerStudent,
        currency: pkg.currency,
        isEnabled: schoolPackage?.isEnabled || false,
        customPricePerStudent: schoolPackage?.customPricePerStudent,
        enabledAt: schoolPackage?.enabledAt,
        disabledAt: schoolPackage?.disabledAt,
        monthlyCost: (schoolPackage?.customPricePerStudent || pkg.packagePricePerStudent) * school._count.students,
      };
    });

    const enabledPackages = packages.filter(p => p.isEnabled);
    const totalMonthlyCost = enabledPackages.reduce((sum, p) => sum + p.monthlyCost, 0);

    return NextResponse.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        activeStudents: school._count.students,
      },
      packages,
      summary: {
        totalPackages: packages.length,
        enabledPackages: enabledPackages.length,
        disabledPackages: packages.length - enabledPackages.length,
        totalMonthlyCost,
        currency: "ETB",
      },
    });

  } catch (error) {
    console.error("School premium packages fetch error:", error);
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
    const { packageId, isEnabled, customPricePerStudent } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: "packageId is required" },
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

    // Verify package exists
    const pkg = await prisma.premiumPackage.findUnique({
      where: { id: packageId },
      select: { id: true, name: true },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Handle package enable/disable
    const schoolPackage = await prisma.schoolPremiumPackage.upsert({
      where: {
        schoolId_packageId: {
          schoolId,
          packageId,
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
        packageId,
        isEnabled,
        customPricePerStudent: customPricePerStudent ? parseFloat(customPricePerStudent) : null,
        enabledAt: isEnabled ? new Date() : null,
      },
    });

    // If enabling the package, enable all individual features automatically
    if (isEnabled) {
      const allFeatures = await prisma.premiumFeature.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true },
      });

      // Enable all features for this school
      for (const feature of allFeatures) {
        await prisma.schoolPremiumFeature.upsert({
          where: {
            schoolId_featureId: {
              schoolId,
              featureId: feature.id,
            },
          },
          update: {
            isEnabled: true,
            enabledAt: new Date(),
            disabledAt: null,
          },
          create: {
            schoolId,
            featureId: feature.id,
            isEnabled: true,
            enabledAt: new Date(),
          },
        });
      }
    } else {
      // If disabling the package, disable all individual features
      await prisma.schoolPremiumFeature.updateMany({
        where: { schoolId },
        data: {
          isEnabled: false,
          disabledAt: new Date(),
        },
      });
    }

    // Log audit action
    const superAdminId = "78er9w"; // Current super admin
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        action: isEnabled ? "ENABLE_PREMIUM_PACKAGE" : "DISABLE_PREMIUM_PACKAGE",
        resourceType: "school_premium_package",
        resourceId: schoolPackage.id,
        details: {
          schoolId,
          schoolName: school.name,
          packageId,
          packageName: pkg.name,
          isEnabled,
          customPricePerStudent,
          allFeaturesEnabled: isEnabled,
        },
      },
    });

    return NextResponse.json({
      success: true,
      schoolPackage,
      message: `Premium package ${isEnabled ? 'enabled' : 'disabled'} successfully`,
    });

  } catch (error) {
    console.error("School premium package update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
