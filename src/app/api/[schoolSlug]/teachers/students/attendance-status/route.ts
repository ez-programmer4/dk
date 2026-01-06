import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = session.id;
    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID not found" },
        { status: 400 }
      );
    }

    const schoolSlug = params.schoolSlug;

    // Get school ID
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

    // Get today's date range
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const dayStart = new Date(todayStr + "T00:00:00.000Z");
    const dayEnd = new Date(todayStr + "T23:59:59.999Z");

    // Filter attendance records by school if schoolId is available
    const whereClause: any = {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
      wpos_wpdatatable_23: {
        ustaz: teacherId,
      },
    };

    if (schoolId) {
      whereClause.wpos_wpdatatable_23.schoolId = schoolId;
    }

    // Find attendance records filled today for this teacher's students
    const attendanceRecords = await prisma.student_attendance_progress.findMany(
      {
        where: whereClause,
        select: {
          student_id: true,
          date: true,
          attendance_status: true,
          level: true,
          surah: true,
          pages_read: true,
          lesson: true,
          notes: true,
        },
        distinct: ["student_id"],
      }
    );

    const attendance = attendanceRecords.map((record) => ({
      student_id: record.student_id,
      status: record.attendance_status,
      level: record.level,
      surah: record.surah,
      pages_read: record.pages_read,
      lesson: record.lesson,
      notes: record.notes,
    }));

    return NextResponse.json({
      attendance,
      date: todayStr,
      count: attendanceRecords.length,
    });
  } catch (error: any) {
    console.error("Attendance status check error:", error);
    return NextResponse.json(
      { error: "Failed to check attendance status", details: error.message },
      { status: 500 }
    );
  }
}
