import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = session.username;
    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID not found" },
        { status: 400 }
      );
    }

    // Get today's date range
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const dayStart = new Date(todayStr + "T00:00:00.000Z");
    const dayEnd = new Date(todayStr + "T23:59:59.999Z");

    // Find attendance records filled today for this teacher's students
    const attendanceRecords = await prisma.student_attendance_progress.findMany(
      {
        where: {
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
          wpos_wpdatatable_23: {
            ustaz: teacherId,
          },
        },
        select: {
          student_id: true,
          date: true,
          attendance_status: true,
        },
        distinct: ["student_id"],
      }
    );

    const filledToday = attendanceRecords.map((record) => record.student_id);

    return NextResponse.json({
      filledToday,
      date: todayStr,
      count: filledToday.length,
    });
  } catch (error: any) {
    console.error("Attendance status check error:", error);
    return NextResponse.json(
      { error: "Failed to check attendance status", details: error.message },
      { status: 500 }
    );
  }
}
