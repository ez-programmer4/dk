import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_FEATURES, FeatureCode } from "@/lib/features/feature-registry";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface PaymentCalculation {
  schoolId: string;
  schoolName: string;
  currentStudents: number;
  pricingTier: {
    id: string;
    name: string;
    monthlyFee: number;
    currency: string;
    features: string[];
  } | null;
  baseSalary: number;
  premiumFeatures: {
    featureCode: string;
    featureName: string;
    costPerStudent: number;
    totalCost: number;
  }[];
  totalPremiumCost: number;
  totalMonthlyPayment: number;
  period: string; // YYYY-MM
  currency: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { schoolIds, period, baseSalaryPerStudent } = body;

    // Get base salary from configuration or use default
    let effectiveBaseSalary = baseSalaryPerStudent;
    if (!effectiveBaseSalary) {
      // Try to get from database configuration
      try {
        const config = await prisma.superAdminAuditLog.findFirst({
          where: {
            action: "UPDATE_BASE_SALARY",
            superAdminId: "78er9w" // Current super admin
          },
          orderBy: { createdAt: "desc" }
        });

        if (config?.details && typeof config.details === 'object') {
          effectiveBaseSalary = (config.details as any).baseSalary || 50;
        } else {
          effectiveBaseSalary = 50; // Default
        }
      } catch {
        effectiveBaseSalary = 50; // Default fallback
      }
    }

    if (!schoolIds || !Array.isArray(schoolIds) || schoolIds.length === 0) {
      return NextResponse.json(
        { error: "schoolIds array is required" },
        { status: 400 }
      );
    }

    // Set period to current month if not provided
    const calculationPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get schools with their pricing tiers and subscription info
    const schools = await prisma.school.findMany({
      where: {
        id: { in: schoolIds },
        status: { in: ["active", "trial"] },
      },
      select: {
        id: true,
        name: true,
        pricingTier: {
          select: {
            id: true,
            name: true,
            monthlyFee: true,
            currency: true,
            features: true,
          },
        },
        subscription: {
          select: {
            status: true,
            currentStudents: true,
          },
        },
      },
    });

    const calculations: PaymentCalculation[] = [];

    for (const school of schools) {
      const currentStudents = school.subscription?.currentStudents || 0;
      const currency = school.pricingTier?.currency || "ETB";

      // Calculate base salary (fixed monthly fee)
      const baseSalary = school.pricingTier?.monthlyFee || 0;

      // Check if school has premium package enabled
      const schoolPremiumPackage = await prisma.schoolPremiumPackage.findFirst({
        where: {
          schoolId: school.id,
          isEnabled: true,
        },
        include: {
          package: true,
        },
      });

      let premiumFeatures: PaymentCalculation["premiumFeatures"] = [];
      let totalPremiumCost = 0;

      if (schoolPremiumPackage) {
        // Use package pricing - all features included
        const pkg = schoolPremiumPackage.package;
        const costPerStudent = schoolPremiumPackage.customPricePerStudent || pkg.packagePricePerStudent;
        const totalCost = costPerStudent * currentStudents;

        // Get all features for display (even though they're bundled)
        const allFeatures = await prisma.premiumFeature.findMany({
          where: { isActive: true },
          select: { code: true, name: true },
        });

        premiumFeatures = allFeatures.map(feature => ({
          featureCode: feature.code,
          featureName: `${feature.name} (Included in Package)`,
          costPerStudent: 0, // Individual cost is 0 since it's bundled
          totalCost: 0,
        }));

        // Add package as a single line item
        premiumFeatures.unshift({
          featureCode: "premium_package",
          featureName: `${pkg.name} (All Features)`,
          costPerStudent,
          totalCost,
        });

        totalPremiumCost = totalCost;
      } else {
        // Use individual feature pricing
        const schoolPremiumFeatures = await prisma.schoolPremiumFeature.findMany({
          where: {
            schoolId: school.id,
            isEnabled: true,
          },
          include: {
            feature: true,
          },
        });

        for (const schoolFeature of schoolPremiumFeatures) {
          const feature = schoolFeature.feature;
          const costPerStudent = schoolFeature.customPricePerStudent || feature.basePricePerStudent;
          const totalCost = costPerStudent * currentStudents;

          premiumFeatures.push({
            featureCode: feature.code,
            featureName: feature.name,
            costPerStudent,
            totalCost,
          });

          totalPremiumCost += totalCost;
        }
      }

      const totalMonthlyPayment = baseSalary + totalPremiumCost;

      calculations.push({
        schoolId: school.id,
        schoolName: school.name,
        currentStudents,
        pricingTier: school.pricingTier,
        baseSalary,
        premiumFeatures,
        totalPremiumCost,
        totalMonthlyPayment,
        period: calculationPeriod,
        currency,
      });
    }

    // Calculate totals
    const totals = {
      totalSchools: calculations.length,
      totalStudents: calculations.reduce((sum, calc) => sum + calc.currentStudents, 0),
      totalBaseSalary: calculations.reduce((sum, calc) => sum + calc.baseSalary, 0),
      totalPremiumCost: calculations.reduce((sum, calc) => sum + calc.totalPremiumCost, 0),
      totalMonthlyPayment: calculations.reduce((sum, calc) => sum + calc.totalMonthlyPayment, 0),
      currency: "ETB", // Assuming all calculations are in ETB
    };

    return NextResponse.json({
      success: true,
      period: calculationPeriod,
      calculations,
      totals,
    });

  } catch (error) {
    console.error("Payment calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period");
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return NextResponse.json(
        { error: "schoolId parameter is required" },
        { status: 400 }
      );
    }

    // Get school payment history
    const payments = await prisma.schoolPayment.findMany({
      where: {
        schoolId,
        ...(period && { period }),
      },
      orderBy: { period: "desc" },
      take: 12, // Last 12 months
    });

    return NextResponse.json({
      success: true,
      payments,
    });

  } catch (error) {
    console.error("Payment history fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
