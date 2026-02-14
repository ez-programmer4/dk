import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { period, baseSalaryPerStudent } = await request.json();

    if (!period || !baseSalaryPerStudent) {
      return NextResponse.json(
        { success: false, error: "Period and base salary are required" },
        { status: 400 }
      );
    }

    // Get effective base salary (from config or provided)
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
        }
      } catch (error) {
        console.log("No base salary config found, using default");
      }
    }

    // Get all active schools
    const schools = await prisma.school.findMany({
      where: {
        status: { in: ["active", "trial"] },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        pricingTier: {
          select: {
            id: true,
            name: true,
            monthlyFee: true,
            currency: true,
            features: true,
          },
        },
      },
    });

    console.log(`Found ${schools.length} active/trial schools for payment generation:`, schools.map(s => `${s.name} (${s.slug})`));

    const generatedPayments = [];

    for (const school of schools) {
      // Get active student count
      const activeStudentCount = await prisma.wpos_wpdatatable_23.count({
        where: {
          schoolId: school.id,
          AND: [
            {
              OR: [
                { status: null },
                { status: { notIn: ["inactive", "Inactive", "INACTIVE", "exited", "Exited", "EXITED", "cancelled", "Cancelled", "CANCELLED"] } }
              ]
            },
            { exitdate: null }
          ]
        }
      });

      // For testing: create minimum payment even for schools with 0 students
      const minStudents = activeStudentCount === 0 ? 1 : activeStudentCount;
      console.log(`Processing ${school.name}: ${activeStudentCount} active students (using ${minStudents} for minimum billing)`);

      // if (activeStudentCount === 0) {
      //   console.log(`Skipping ${school.name} - no active students`);
      //   continue;
      // }

      // Calculate base payment
      const basePayment = effectiveBaseSalary * minStudents;

      // Check if payment already exists for this period (using raw query to avoid schema mismatch)
      const existingPayments = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM school_payments WHERE schoolId = ${school.id} AND period = ${period} LIMIT 1
      `;
      const existingPayment = existingPayments.length > 0;

      if (existingPayment) {
        console.log(`Payment already exists for ${school.name} period ${period}`);
        continue;
      }

      // Get premium features for this school
      const schoolPremiumPackage = await prisma.schoolPremiumPackage.findFirst({
        where: {
          schoolId: school.id,
          isEnabled: true,
        },
        include: {
          package: true,
        },
      });

      let premiumFeatures: any[] = [];
      let totalPremiumCost = 0;

      if (schoolPremiumPackage) {
        const pkg = schoolPremiumPackage.package;
        const costPerStudent = schoolPremiumPackage.customPricePerStudent || pkg.packagePricePerStudent;
        totalPremiumCost = Number(costPerStudent) * activeStudentCount;

        premiumFeatures = [{
          featureCode: pkg.id,
          featureName: pkg.name,
          costPerStudent,
          totalCost: totalPremiumCost
        }];
      }

      // Calculate due date (end of next month)
      const [year, month] = period.split('-').map(Number);
      const dueDate = new Date(year, month, 0); // Last day of the month

      // Create payment record using raw query to avoid schema mismatch
      await prisma.$executeRaw`
        INSERT INTO school_payments (id, schoolId, period, amount, currency, studentCount, baseFee, perStudentFee, featureFees, totalAmount, status, createdAt, updatedAt)
        VALUES (${randomUUID()}, ${school.id}, ${period}, ${basePayment + totalPremiumCost}, ${school.pricingTier?.currency || "ETB"}, ${minStudents}, ${effectiveBaseSalary}, ${effectiveBaseSalary}, ${premiumFeatures.length > 0 ? JSON.stringify(premiumFeatures) : null}, ${basePayment + totalPremiumCost}, 'pending', NOW(), NOW())
      `;

      generatedPayments.push({
        schoolId: school.id,
        schoolName: school.name,
        period,
        amount: basePayment + totalPremiumCost,
        currency: school.pricingTier?.currency || "ETB",
        studentCount: activeStudentCount,
        basePayment,
        premiumCost: totalPremiumCost,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedPayments.length} payment records`,
      payments: generatedPayments
    });

  } catch (error) {
    console.error("Payment generation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
