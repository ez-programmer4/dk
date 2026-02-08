import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || !["admin", "registral"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get current month start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Previous month for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    );

    // Last 12 months for comprehensive trends
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Get comprehensive counts
    const [
      totalStudents,
      totalActive,
      totalNotYet,
      totalInactive,
      monthlyRegistered,
      monthlyStarted,
      lastMonthActive,
      lastMonthRegistered,
      studentsWithUstaz,
      studentsWithoutUstaz,
      packageBreakdown,
      subjectBreakdown,
      dayPackageBreakdown,
      countryBreakdown,
      referralStudents,
      studentsWithPhone,
      studentsWithChatId,
      recentExits,
      allRegistrations,
      allActivations,
      allExits,
      statusBreakdown,
      currencyBreakdown,
      monthlyAttendance,
      totalAttendance,
    ] = await Promise.all([
      // Total students
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          schoolId: school.id
        },
      }),

      // Total active students
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          status: "Active",
          schoolId: school.id
        },
      }),

      // Total not yet students
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          status: "Not yet",
          schoolId: school.id
        },
      }),

      // Total inactive students
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          status: { notIn: ["Active", "Not yet"] },
          schoolId: school.id
        },
      }),

      // Monthly registered students
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          registrationdate: {
            gte: monthStart,
            lte: monthEnd,
          },
          schoolId: school.id
        },
      }),

      // Monthly started students
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          status: "Active",
          startdate: {
            gte: monthStart,
            lte: monthEnd,
          },
          schoolId: school.id
        },
      }),

      // Last month active count
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          status: "Active",
          startdate: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),

      // Last month registrations
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          registrationdate: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
      }),

      // Students with assigned ustaz
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          AND: [{ ustaz: { not: null } }, { ustaz: { not: "" } }],
        },
      }),

      // Students without assigned ustaz
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          OR: [{ ustaz: null }, { ustaz: "" }],
        },
      }),

      // Package breakdown
      prisma.wpos_wpdatatable_23.groupBy({
        by: ["package"],
        where: {
          name: { not: "" },
          status: { in: ["Active", "Not yet"] },
        },
        _count: true,
        orderBy: {
          _count: {
            package: "desc",
          },
        },
      }),

      // Subject breakdown
      prisma.wpos_wpdatatable_23.groupBy({
        by: ["subject"],
        where: {
          name: { not: "" },
          status: { in: ["Active", "Not yet"] },
        },
        _count: true,
        orderBy: {
          _count: {
            subject: "desc",
          },
        },
      }),

      // Day package breakdown
      prisma.wpos_wpdatatable_23.groupBy({
        by: ["daypackages"],
        where: {
          name: { not: "" },
          status: { in: ["Active", "Not yet"] },
        },
        _count: true,
        orderBy: {
          _count: {
            daypackages: "desc",
          },
        },
      }),

      // Country breakdown
      prisma.wpos_wpdatatable_23.groupBy({
        by: ["country"],
        where: {
          name: { not: "" },
          status: { in: ["Active", "Not yet"] },
          AND: [{ country: { not: null } }, { country: { not: "" } }],
        },
        _count: true,
        orderBy: {
          _count: {
            country: "desc",
          },
        },
      }),

      // Referral students
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          AND: [{ refer: { not: null } }, { refer: { not: "" } }],
        },
      }),

      // Students with phone numbers
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          AND: [{ phoneno: { not: null } }, { phoneno: { not: "" } }],
        },
      }),

      // Students with Telegram chat ID
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          AND: [{ chatId: { not: null } }, { chatId: { not: "" } }],
        },
      }),

      // Students who left this month
      prisma.wpos_wpdatatable_23.count({
        where: {
          name: { not: "" },
          exitdate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),

      // All registrations (last 12 months)
      prisma.wpos_wpdatatable_23.findMany({
        where: {
          name: { not: "" },
          registrationdate: {
            gte: twelveMonthsAgo,
          },
        },
        select: {
          registrationdate: true,
        },
      }),

      // All activations (last 12 months)
      prisma.wpos_wpdatatable_23.findMany({
        where: {
          name: { not: "" },
          status: "Active",
          startdate: {
            gte: twelveMonthsAgo,
            not: null,
          },
        },
        select: {
          startdate: true,
        },
      }),

      // All exits (last 12 months)
      prisma.wpos_wpdatatable_23.findMany({
        where: {
          name: { not: "" },
          exitdate: {
            gte: twelveMonthsAgo,
            not: null,
          },
        },
        select: {
          exitdate: true,
        },
      }),

      // Status breakdown (all statuses)
      prisma.wpos_wpdatatable_23.groupBy({
        by: ["status"],
        where: {
          name: { not: "" },
        },
        _count: true,
        orderBy: {
          _count: {
            status: "desc",
          },
        },
      }),

      // Currency breakdown
      prisma.wpos_wpdatatable_23.groupBy({
        by: ["classfeeCurrency"],
        where: {
          name: { not: "" },
          status: { in: ["Active", "Not yet"] },
        },
        _count: true,
        orderBy: {
          _count: {
            classfeeCurrency: "desc",
          },
        },
      }),

      // Monthly attendance data
      prisma.student_attendance_progress.findMany({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
          schoolId: school.id
        },
        select: {
          attendance_status: true,
          student_id: true,
        },
      }),

      // Total attendance data (all time)
      prisma.student_attendance_progress.groupBy({
        by: ["attendance_status"],
        where: {
          schoolId: school.id
        },
        _count: true,
      }),
    ]);

    // Get payment statistics - CURRENT MONTH FOCUS
    const currentMonthFormat = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const lastMonthFormat = `${now.getFullYear()}-${String(
      now.getMonth()
    ).padStart(2, "0")}`;

    const [
      currentMonthPaidStudents,
      currentMonthUnpaidStudents,
      lastMonthPaidStudents,
      lastMonthUnpaidStudents,
      totalRevenue,
      monthlyRevenue,
      currentMonthPayments,
      lastMonthPayments,
    ] = await Promise.all([
      // Current month - Students with PAID status
      prisma.months_table.groupBy({
        by: ["studentid"],
        where: {
          month: currentMonthFormat,
          payment_status: "Paid",
          schoolId: school.id
        },
        _count: true,
      }),

      // Current month - Students with UNPAID status
      prisma.months_table.groupBy({
        by: ["studentid"],
        where: {
          month: currentMonthFormat,
          payment_status: "Unpaid",
          schoolId: school.id
        },
        _count: true,
      }),

      // Last month - Students with PAID status
      prisma.months_table.groupBy({
        by: ["studentid"],
        where: {
          month: lastMonthFormat,
          payment_status: "Paid",
          schoolId: school.id
        },
        _count: true,
      }),

      // Last month - Students with UNPAID status
      prisma.months_table.groupBy({
        by: ["studentid"],
        where: {
          month: lastMonthFormat,
          payment_status: "Unpaid",
          schoolId: school.id
        },
        _count: true,
      }),

      // Total revenue (all time)
      prisma.months_table.aggregate({
        where: {
          payment_status: "Paid",
          schoolId: school.id
        },
        _sum: {
          paid_amount: true,
        },
      }),

      // Current month revenue
      prisma.months_table.aggregate({
        where: {
          month: currentMonthFormat,
          payment_status: "Paid",
          schoolId: school.id
        },
        _sum: {
          paid_amount: true,
        },
      }),

      // Current month all payment records
      prisma.months_table.findMany({
        where: {
          month: currentMonthFormat,
          schoolId: school.id
        },
        select: {
          studentid: true,
          payment_status: true,
          paid_amount: true,
        },
      }),

      // Last month all payment records
      prisma.months_table.findMany({
        where: {
          month: lastMonthFormat,
          schoolId: school.id
        },
        select: {
          studentid: true,
          payment_status: true,
          paid_amount: true,
        },
      }),
    ]);

    // Calculate payment statistics for current month
    const paidStudentsCount = currentMonthPaidStudents.length;
    const unpaidStudentsCount = currentMonthUnpaidStudents.length;
    const lastMonthPaidCount = lastMonthPaidStudents.length;
    const lastMonthUnpaidCount = lastMonthUnpaidStudents.length;

    // Calculate monthly left
    const monthlyLeft = recentExits;

    // Process 12-month trend data
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const targetMonth = new Date(
        now.getFullYear(),
        now.getMonth() - (11 - i),
        1
      );
      return {
        month: `${targetMonth.getFullYear()}-${String(
          targetMonth.getMonth() + 1
        ).padStart(2, "0")}`,
        monthName: targetMonth.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        year: targetMonth.getFullYear(),
        monthNum: targetMonth.getMonth(),
      };
    });

    const registrationTrend = last12Months.map((m) => {
      const count = allRegistrations.filter((r) => {
        if (!r.registrationdate) return false;
        const regDate = new Date(r.registrationdate);
        return (
          regDate.getFullYear() === m.year && regDate.getMonth() === m.monthNum
        );
      }).length;
      return { ...m, count };
    });

    const activationTrend = last12Months.map((m) => {
      const count = allActivations.filter((r) => {
        if (!r.startdate) return false;
        const startDate = new Date(r.startdate);
        return (
          startDate.getFullYear() === m.year &&
          startDate.getMonth() === m.monthNum
        );
      }).length;
      return { ...m, count };
    });

    const exitTrend = last12Months.map((m) => {
      const count = allExits.filter((r) => {
        if (!r.exitdate) return false;
        const exitDate = new Date(r.exitdate);
        return (
          exitDate.getFullYear() === m.year &&
          exitDate.getMonth() === m.monthNum
        );
      }).length;
      return { ...m, count };
    });

    // Calculate growth rates
    const growthRate =
      lastMonthRegistered > 0
        ? (
            ((monthlyRegistered - lastMonthRegistered) / lastMonthRegistered) *
            100
          ).toFixed(1)
        : monthlyRegistered > 0
        ? "100.0"
        : "0";

    const activationGrowth =
      lastMonthActive > 0
        ? (
            ((monthlyStarted - lastMonthActive) / lastMonthActive) *
            100
          ).toFixed(1)
        : monthlyStarted > 0
        ? "100.0"
        : "0";

    // Calculate rates
    const activeRate =
      totalStudents > 0
        ? ((totalActive / totalStudents) * 100).toFixed(1)
        : "0";

    const assignmentRate =
      totalStudents > 0
        ? ((studentsWithUstaz / totalStudents) * 100).toFixed(1)
        : "0";

    const referralRate =
      totalStudents > 0
        ? ((referralStudents / totalStudents) * 100).toFixed(1)
        : "0";

    const contactRate =
      totalStudents > 0
        ? ((studentsWithPhone / totalStudents) * 100).toFixed(1)
        : "0";

    const telegramRate =
      totalStudents > 0
        ? ((studentsWithChatId / totalStudents) * 100).toFixed(1)
        : "0";

    const retentionRate =
      monthlyStarted + lastMonthActive > 0
        ? (
            ((monthlyStarted + lastMonthActive - monthlyLeft) /
              (monthlyStarted + lastMonthActive)) *
            100
          ).toFixed(1)
        : "100.0";

    const conversionRate =
      monthlyRegistered > 0
        ? ((monthlyStarted / monthlyRegistered) * 100).toFixed(1)
        : "0";

    const churnRate =
      totalActive > 0 ? ((monthlyLeft / totalActive) * 100).toFixed(2) : "0";

    // Calculate average values
    const avgRegistrationsPerMonth =
      registrationTrend.length > 0
        ? (
            registrationTrend.reduce((sum, m) => sum + m.count, 0) /
            registrationTrend.length
          ).toFixed(1)
        : "0";

    const avgActivationsPerMonth =
      activationTrend.length > 0
        ? (
            activationTrend.reduce((sum, m) => sum + m.count, 0) /
            activationTrend.length
          ).toFixed(1)
        : "0";

    // Student lifecycle metrics
    const lifecycle = {
      prospects: totalNotYet,
      active: totalActive,
      churned: totalInactive,
      conversionRate,
      churnRate,
      avgLifetimeMonths: "6.5", // This would need actual calculation based on start/exit dates
    };

    return NextResponse.json(
      {
        // Overview metrics
        overview: {
          totalStudents,
          totalActive,
          totalNotYet,
          totalInactive,
          activeRate,
        },

        // Monthly activity metrics
        monthly: {
          registered: monthlyRegistered,
          started: monthlyStarted,
          left: monthlyLeft,
          netGrowth: monthlyRegistered - monthlyLeft,
          conversionRate,
          retentionRate,
          churnRate,
        },

        // Growth metrics
        growth: {
          registrationGrowthRate: growthRate,
          activationGrowthRate: activationGrowth,
          lastMonthRegistered,
          lastMonthActive,
          avgRegistrationsPerMonth,
          avgActivationsPerMonth,
        },

        // Payment & Revenue metrics
        payments: {
          currentMonth: {
            paidStudents: paidStudentsCount,
            unpaidStudents: unpaidStudentsCount,
            paymentRate:
              paidStudentsCount + unpaidStudentsCount > 0
                ? (
                    (paidStudentsCount /
                      (paidStudentsCount + unpaidStudentsCount)) *
                    100
                  ).toFixed(1)
                : "0",
            totalStudents: paidStudentsCount + unpaidStudentsCount,
            revenue: monthlyRevenue._sum.paid_amount || 0,
          },
          lastMonth: {
            paidStudents: lastMonthPaidCount,
            unpaidStudents: lastMonthUnpaidCount,
            paymentRate:
              lastMonthPaidCount + lastMonthUnpaidCount > 0
                ? (
                    (lastMonthPaidCount /
                      (lastMonthPaidCount + lastMonthUnpaidCount)) *
                    100
                  ).toFixed(1)
                : "0",
            totalStudents: lastMonthPaidCount + lastMonthUnpaidCount,
          },
          paidStudents: paidStudentsCount,
          unpaidStudents: unpaidStudentsCount,
          paymentRate:
            paidStudentsCount + unpaidStudentsCount > 0
              ? (
                  (paidStudentsCount /
                    (paidStudentsCount + unpaidStudentsCount)) *
                  100
                ).toFixed(1)
              : "0",
          totalRevenue: totalRevenue._sum.paid_amount || 0,
          monthlyRevenue: monthlyRevenue._sum.paid_amount || 0,
          avgRevenuePerStudent:
            paidStudentsCount > 0
              ? (
                  (totalRevenue._sum.paid_amount || 0) / paidStudentsCount
                ).toFixed(0)
              : "0",
          growthRate:
            lastMonthPaidCount > 0
              ? (
                  ((paidStudentsCount - lastMonthPaidCount) /
                    lastMonthPaidCount) *
                  100
                ).toFixed(1)
              : "0",
          currentMonthDetails: currentMonthPayments,
        },

        // Assignment metrics
        assignments: {
          assigned: studentsWithUstaz,
          unassigned: studentsWithoutUstaz,
          assignmentRate,
        },

        // Engagement metrics
        engagement: {
          withPhone: studentsWithPhone,
          withTelegram: studentsWithChatId,
          withReferral: referralStudents,
          contactRate,
          telegramRate,
          referralRate,
        },

        // Lifecycle metrics
        lifecycle,

        // Breakdown data
        breakdowns: {
          packages: packageBreakdown.map((p) => ({
            name: p.package || "Unknown",
            count: p._count,
            percentage:
              totalStudents > 0
                ? ((p._count / totalStudents) * 100).toFixed(1)
                : "0",
          })),
          subjects: subjectBreakdown.map((s) => ({
            name: s.subject || "Unknown",
            count: s._count,
            percentage:
              totalStudents > 0
                ? ((s._count / totalStudents) * 100).toFixed(1)
                : "0",
          })),
          schedules: dayPackageBreakdown.map((d) => ({
            name: d.daypackages || "Unknown",
            count: d._count,
            percentage:
              totalStudents > 0
                ? ((d._count / totalStudents) * 100).toFixed(1)
                : "0",
          })),
          countries: countryBreakdown.map((c) => ({
            name: c.country || "Unknown",
            count: c._count,
            percentage:
              totalStudents > 0
                ? ((c._count / totalStudents) * 100).toFixed(1)
                : "0",
          })),
          statuses: statusBreakdown.map((s) => ({
            name: s.status || "Unknown",
            count: s._count,
            percentage:
              totalStudents > 0
                ? ((s._count / totalStudents) * 100).toFixed(1)
                : "0",
          })),
          currencies: currencyBreakdown.map((c) => ({
            name: c.classfeeCurrency || "Unknown",
            count: c._count,
            percentage:
              totalStudents > 0
                ? ((c._count / totalStudents) * 100).toFixed(1)
                : "0",
          })),
        },

        // Trend data for charts (12 months)
        trends: {
          registrations: registrationTrend,
          activations: activationTrend,
          exits: exitTrend,
          netGrowth: registrationTrend.map((r, idx) => ({
            ...r,
            count: r.count - (exitTrend[idx]?.count || 0),
          })),
        },

        // Attendance metrics
        attendance: {
          monthly: {
            present: monthlyAttendance.filter(
              (a) => a.attendance_status === "present"
            ).length,
            absent: monthlyAttendance.filter(
              (a) => a.attendance_status === "absent"
            ).length,
            excused: monthlyAttendance.filter(
              (a) => a.attendance_status === "excused"
            ).length,
            total: monthlyAttendance.length,
            attendanceRate:
              monthlyAttendance.length > 0
                ? (
                    (monthlyAttendance.filter(
                      (a) => a.attendance_status === "present"
                    ).length /
                      monthlyAttendance.length) *
                    100
                  ).toFixed(1)
                : "0",
            absenceRate:
              monthlyAttendance.length > 0
                ? (
                    (monthlyAttendance.filter(
                      (a) => a.attendance_status === "absent"
                    ).length /
                      monthlyAttendance.length) *
                    100
                  ).toFixed(1)
                : "0",
            uniqueStudents: new Set(monthlyAttendance.map((a) => a.student_id))
              .size,
          },
          overall: {
            present:
              totalAttendance.find((a) => a.attendance_status === "present")
                ?._count || 0,
            absent:
              totalAttendance.find((a) => a.attendance_status === "absent")
                ?._count || 0,
            excused:
              totalAttendance.find((a) => a.attendance_status === "excused")
                ?._count || 0,
            total: totalAttendance.reduce((sum, a) => sum + (a._count || 0), 0),
            attendanceRate:
              totalAttendance.reduce((sum, a) => sum + (a._count || 0), 0) > 0
                ? (
                    ((totalAttendance.find(
                      (a) => a.attendance_status === "present"
                    )?._count || 0) /
                      totalAttendance.reduce(
                        (sum, a) => sum + (a._count || 0),
                        0
                      )) *
                    100
                  ).toFixed(1)
                : "0",
          },
        },

        // Legacy support (keep for backward compatibility)
        totalStudents,
        totalActive,
        totalNotYet,
        totalInactive,
        monthlyRegistered,
        monthlyStarted,
        monthlyLeft,
        monthlyActive: monthlyStarted,
        monthlyNotYet: monthlyRegistered - monthlyStarted,
        paidStudentsCount,
        unpaidStudentsCount,
        referralStudents,
        referralRate,
        studentsWithUstaz,
        studentsWithoutUstaz,
        assignmentRate,
        growthRate,
        activeRate,
        lastMonthTotal: lastMonthRegistered,
        packageBreakdown: packageBreakdown.map((p) => ({
          name: p.package || "Unknown",
          count: p._count,
        })),
        subjectBreakdown: subjectBreakdown.map((s) => ({
          name: s.subject || "Unknown",
          count: s._count,
        })),
        dayPackageBreakdown: dayPackageBreakdown.map((d) => ({
          name: d.daypackages || "Unknown",
          count: d._count,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching student stats:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
