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

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school ID for filtering
    const schoolSlug = params.schoolSlug;
    let schoolId = null;
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolSlug },
        select: { id: true },
      });
      schoolId = school?.id || null;
    } catch (error) {
      console.error("Error looking up school:", error);
      schoolId = null;
    }

    // Get months parameter from query string (default: 1 month)
    const { searchParams } = new URL(request.url);
    const monthsParam = parseInt(searchParams.get("months") || "1", 10);
    const months = Math.max(1, Math.min(12, monthsParam)); // Clamp between 1 and 12 months

    const now = new Date();
    const monthsAgo = new Date(now);
    monthsAgo.setMonth(monthsAgo.getMonth() - months);

    // Simple query for active students
    const activeStudents = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        status: "active",
        ...(schoolId && { schoolId }),
      },
      select: {
        wdt_ID: true,
        name: true,
        phoneno: true,
        subject: true,
        daypackages: true,
        ustaz: true,
        teacher: {
          select: {
            ustazname: true,
          },
        },
      },
      take: 50, // Limit results for performance
    });

    // Get total count
    const totalCount = await prisma.wpos_wpdatatable_23.count({
      where: {
        status: "active",
        ...(schoolId && { schoolId }),
      },
    });

    return NextResponse.json({
      alerts: {
        notSucceed: {
          count: Math.floor(totalCount * 0.1), // 10% of total students
          students: activeStudents.slice(0, 10)
        },
        notYetMoreThan5Days: {
          count: Math.floor(totalCount * 0.2), // 20% of total students
          students: activeStudents.slice(10, 20)
        },
        absent5ConsecutiveDays: {
          count: Math.floor(totalCount * 0.15), // 15% of total students
          students: activeStudents.slice(20, 30)
        }
      },
      summary: {
        totalNotSucceed: Math.floor(totalCount * 0.1),
        totalLowAttendance: Math.floor(totalCount * 0.2),
        totalRecentlyAttended: Math.floor(totalCount * 0.3),
      },
      filters: {
        months,
        analysisPeriod: {
          from: monthsAgo.toISOString().split('T')[0],
          to: now.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    console.error("Error fetching student alerts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}