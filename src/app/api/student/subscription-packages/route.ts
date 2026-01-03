import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering - prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/student/subscription-packages
 * Get active subscription packages for students
 * Query params:
 *   - studentId: (optional) Filter packages available for this specific student
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");
    const studentId = studentIdParam ? parseInt(studentIdParam) : null;

    // Build where clause
    const whereClause: any = {
      isActive: true,
    };
    
    // If studentId is provided, filter packages based on student's config
    if (studentId && !isNaN(studentId)) {
      // Get the student's configId from student table
      const student = await prisma.wpos_wpdatatable_23.findUnique({
        where: { wdt_ID: studentId },
        select: {
          subscriptionPackageConfigId: true,
        },
      });
      
      if (student && student.subscriptionPackageConfigId) {
        // Student has a config assigned - show packages from that config
        // Packages with configId matching the student's config
        whereClause.configId = student.subscriptionPackageConfigId;
        console.log(
          `[SubscriptionPackages] Student ${studentId} has config ${student.subscriptionPackageConfigId} - filtering packages by config`
        );
        
        // Debug: Check how many packages are assigned to this config
        const configPackageCount = await prisma.subscription_packages.count({
          where: {
            configId: student.subscriptionPackageConfigId,
            isActive: true,
          },
        });
        console.log(
          `[SubscriptionPackages] Config ${student.subscriptionPackageConfigId} has ${configPackageCount} active packages assigned`
        );
      } else {
        // Student has NO config assigned - show packages available to all students
        // These are packages with configId = null (no config restriction)
        whereClause.configId = null;
        console.log(
          `[SubscriptionPackages] Student ${studentId} has no config - showing packages with no config (available to all)`
        );
      }
    } else {
      // No studentId provided - return all active packages
      // This is for backward compatibility or admin views
      // Don't filter by configId - show all active packages
    }

    const packages = await prisma.subscription_packages.findMany({
      where: whereClause,
      orderBy: {
        duration: "asc",
      },
    });

    console.log(
      `[SubscriptionPackages] Found ${packages.length} packages for student ${studentId || "all"}`
    );

    // If student has a config but no packages found, log a helpful message
    if (studentId && packages.length === 0) {
      const student = await prisma.wpos_wpdatatable_23.findUnique({
        where: { wdt_ID: studentId },
        select: {
          subscriptionPackageConfigId: true,
        },
      });
      
      if (student && student.subscriptionPackageConfigId) {
        const configPackageCount = await prisma.subscription_packages.count({
          where: {
            configId: student.subscriptionPackageConfigId,
            isActive: true,
          },
        });
        console.warn(
          `[SubscriptionPackages] Student ${studentId} has config ${student.subscriptionPackageConfigId} but ${configPackageCount} packages are assigned. Please assign packages to this config in the admin panel.`
        );
      }
    }

    // Get purchase counts for each package
    const packagesWithStats = await Promise.all(
      packages.map(async (pkg) => {
        // Count total subscriptions (including cancelled/ended ones for popularity)
        const purchaseCount = await prisma.student_subscriptions.count({
          where: {
            packageId: pkg.id,
          },
        });

        return {
          ...pkg,
          price: Number(pkg.price),
          purchaseCount,
        };
      })
    );

    return NextResponse.json(
      {
      success: true,
      packages: packagesWithStats,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error("GET /api/student/subscription-packages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription packages" },
      { status: 500 }
    );
  }
}





