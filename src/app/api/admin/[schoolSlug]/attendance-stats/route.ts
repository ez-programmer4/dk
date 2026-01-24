import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user as { id: string; role: string }).role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Verify admin has access to this school
    const user = session.user as { id: string };
    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing from or to date parameters" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Get attendance statistics for the date range
    const stats = await prisma.wpos_wpdatatable_23.aggregate({
      where: {
        registrationdate: {
          gte: fromDate,
          lte: toDate,
        },
        schoolId: school.id,
      },
      _count: {
        wdt_ID: true,
      },
    });

    // Get students by status
    const statusStats = await prisma.wpos_wpdatatable_23.groupBy({
      by: ["status"],
      where: {
        registrationdate: {
          gte: fromDate,
          lte: toDate,
        },
        schoolId: school.id,
      },
      _count: {
        wdt_ID: true,
      },
    });

    // Get students by teacher
    const teacherStats = await prisma.wpos_wpdatatable_23.groupBy({
      by: ["ustaz"],
      where: {
        registrationdate: {
          gte: fromDate,
          lte: toDate,
        },
        schoolId: school.id,
      },
      _count: {
        wdt_ID: true,
      },
    });

    // Get teacher names for the stats
    const teacherIds = teacherStats
      .map((stat) => stat.ustaz)
      .filter((id): id is string => id !== null);
    const teachers = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        ustazid: {
          in: teacherIds,
        },
        schoolId: school.id,
      },
      select: {
        ustazid: true,
        ustazname: true,
      },
    });

    const teacherMap = Object.fromEntries(
      teachers.map((t) => [t.ustazid, t.ustazname])
    );

    return NextResponse.json({
      totalStudents: stats._count.wdt_ID,
      statusBreakdown: statusStats.map((stat) => ({
        status: stat.status,
        count: stat._count.wdt_ID,
      })),
      teacherBreakdown: teacherStats.map((stat) => ({
        teacherId: stat.ustaz,
        teacherName: stat.ustaz
          ? teacherMap[stat.ustaz] || "Unknown"
          : "Unknown",
        count: stat._count.wdt_ID,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
