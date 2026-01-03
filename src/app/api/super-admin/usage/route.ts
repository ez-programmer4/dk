/**
 * Super Admin Usage Tracking API
 *
 * GET: Get usage for schools
 * POST: Track usage for a school/period
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCurrentUsage,
  trackUsage,
  getUsageForPeriod,
  getSchoolUsageHistory,
  autoTrackCurrentPeriod,
} from "@/lib/billing/usage-tracking";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/super-admin/usage - Get usage data (single school or all schools)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const period = searchParams.get("period") || "current";
    const specificPeriod = searchParams.get("specificPeriod");

    // If schoolId is provided, return usage for that specific school
    if (schoolId) {
      let usage;
      if (specificPeriod) {
        usage = await getUsageForPeriod(schoolId, specificPeriod);
      } else {
        usage = await getCurrentUsage(schoolId);
      }

      if (!usage) {
        return NextResponse.json(
          { error: "Usage data not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        usage,
      });
    }

    // If no schoolId, return usage for all schools
    const now = new Date();
    let targetPeriod = specificPeriod;

    if (period === "current") {
      targetPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    } else if (period === "last_month") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      targetPeriod = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
    } else if (period === "last_3_months") {
      // Return data for last 3 months
      const usage = await getAllSchoolsUsage(3);
      return NextResponse.json({
        success: true,
        usage,
      });
    } else if (period === "last_6_months") {
      const usage = await getAllSchoolsUsage(6);
      return NextResponse.json({
        success: true,
        usage,
      });
    }

    // Get current usage for all schools
    const usage = await getAllSchoolsCurrentUsage();
    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error: any) {
    console.error("Get usage error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch usage" },
      { status: 500 }
    );
  }
}

// Helper function to get usage for all schools
async function getAllSchoolsCurrentUsage() {
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      maxStudents: true,
      currentStudentCount: true,
      plan: {
        select: {
          name: true,
          maxStudents: true,
          maxTeachers: true,
        },
      },
      _count: {
        select: {
          students: true,
          teachers: true,
          admins: true,
        },
      },
    },
  });

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const usage = await Promise.all(
    schools.map(async (school) => {
      // Get session data from zoom_links (join through students table)
      const sessionData = await prisma.$queryRaw<{ sessionCount: number, totalHours: number }[]>`
        SELECT
          COUNT(*) as sessionCount,
          COALESCE(SUM(z.teacher_duration_minutes), 0) / 60.0 as totalHours
        FROM wpos_zoom_links z
        JOIN wpos_wpdatatable_23 s ON z.studentid = s.wdt_ID
        WHERE s.schoolId = ${school.id}
          AND DATE_FORMAT(z.scheduled_start_time, '%Y-%m') = ${currentPeriod}
          AND z.session_status = 'ended'
      `;

      // Get revenue data (join through students table)
      const revenueData = await prisma.$queryRaw<{ revenue: number }[]>`
        SELECT COALESCE(SUM(p.paidamount), 0) as revenue
        FROM wpos_wpdatatable_29 p
        JOIN wpos_wpdatatable_23 s ON p.studentid = s.wdt_ID
        WHERE s.schoolId = ${school.id}
          AND p.status = 'Approved'
          AND DATE_FORMAT(p.paymentdate, '%Y-%m') = ${currentPeriod}
      `;

      const studentCount = school._count.students;
      const teacherCount = school._count.teachers;
      const maxStudents = school.plan?.maxStudents || school.maxStudents;
      const maxTeachers = school.plan?.maxTeachers;

      // Determine status
      let status: "active" | "over_limit" | "inactive" = "active";
      if (maxStudents && studentCount > maxStudents) {
        status = "over_limit";
      } else if (studentCount === 0 && teacherCount === 0) {
        status = "inactive";
      }

      return {
        schoolId: school.id,
        schoolName: school.name,
        schoolSlug: school.slug,
        period: currentPeriod,
        studentCount,
        teacherCount,
        adminCount: school._count.admins,
        sessionCount: Number(sessionData[0]?.sessionCount) || 0,
        totalHours: Number(sessionData[0]?.totalHours) || 0,
        storageUsed: 0, // TODO: Implement storage tracking
        revenue: Number(revenueData[0]?.revenue) || 0,
        planName: school.plan?.name || "No Plan",
        maxStudents,
        maxTeachers,
        lastUpdated: new Date().toISOString(),
        status,
      };
    })
  );

  return usage;
}

// Helper function to get usage for all schools over multiple months
async function getAllSchoolsUsage(months: number) {
  const allUsage = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;

    // Get usage for this period (simplified - you might want to store historical usage)
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: { select: { name: true } },
        _count: { select: { students: true, teachers: true, admins: true } },
      },
    });

    for (const school of schools) {
      // This is simplified - in a real implementation you'd have historical usage tracking
      const usage = {
        schoolId: school.id,
        schoolName: school.name,
        schoolSlug: school.slug,
        period,
        studentCount: school._count.students,
        teacherCount: school._count.teachers,
        adminCount: school._count.admins,
        sessionCount: 0, // Would need historical data
        totalHours: 0,
        storageUsed: 0,
        revenue: 0,
        planName: school.plan?.name || "No Plan",
        maxStudents: 50,
        maxTeachers: null,
        lastUpdated: new Date().toISOString(),
        status: "active" as const,
      };
      allUsage.push(usage);
    }
  }

  return allUsage;
}

// POST /api/super-admin/usage - Track usage
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { schoolId, period, metrics, notes } = body;

    if (!schoolId || !period || !metrics) {
      return NextResponse.json(
        { error: "schoolId, period, and metrics are required" },
        { status: 400 }
      );
    }

    // Validate period format
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: "Period must be in YYYY-MM format" },
        { status: 400 }
      );
    }

    await trackUsage({
      schoolId,
      period,
      metrics,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: "Usage tracked successfully",
    });
  } catch (error: any) {
    console.error("Track usage error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to track usage" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/usage - Auto-track current period
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { schoolId } = body;

    if (!schoolId) {
      return NextResponse.json(
        { error: "schoolId is required" },
        { status: 400 }
      );
    }

    await autoTrackCurrentPeriod(schoolId);

    return NextResponse.json({
      success: true,
      message: "Usage auto-tracked successfully",
    });
  } catch (error: any) {
    console.error("Auto-track usage error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to auto-track usage" },
      { status: 500 }
    );
  }
}
