import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = parseInt(params.id);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Get attendance records
    const whereClause: any = {
      student_id: studentId,
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const attendanceRecords = await prisma.student_attendance_progress.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: limit,
    });

    // Calculate statistics
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (r) => r.attendance_status === "Present"
    ).length;
    const absentCount = attendanceRecords.filter(
      (r) => r.attendance_status === "Absent"
    ).length;
    const permissionCount = attendanceRecords.filter(
      (r) => r.attendance_status === "Permission"
    ).length;
    const notTakenCount = attendanceRecords.filter(
      (r) => r.attendance_status === "Not Taken"
    ).length;

    const attendanceRate =
      totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    return NextResponse.json({
      records: attendanceRecords.map((record) => ({
        id: record.id,
        date: record.date.toISOString(),
        status: record.attendance_status,
        surah: record.surah,
        pages_read: record.pages_read,
        level: record.level,
        lesson: record.lesson,
        notes: record.notes,
      })),
      statistics: {
        total: totalRecords,
        present: presentCount,
        absent: absentCount,
        permission: permissionCount,
        notTaken: notTakenCount,
        attendanceRate,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

