import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ZoomService } from "@/lib/zoom-service";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Simplified API to create Zoom meeting for a student
 * Uses Server-to-Server OAuth - no teacher Zoom connection needed!
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "teacher") {
      return NextResponse.json(
        { error: "Unauthorized - Teacher access required" },
        { status: 403 }
      );
    }

    const teacherId = token.id as string;
    const { studentId, scheduledTime } = await req.json();

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // Get teacher info
    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: teacherId },
      select: { ustazname: true },
    });

    // Get student info
    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: Number(studentId) },
      select: {
        wdt_ID: true,
        name: true,
        ustaz: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.ustaz !== teacherId) {
      return NextResponse.json({ error: "Not your student" }, { status: 403 });
    }

    // Determine meeting time
    const meetingTime = scheduledTime
      ? new Date(scheduledTime)
      : new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Create meeting via Server-to-Server OAuth
    const meeting = await ZoomService.createMeetingServerToServer(
      teacher?.ustazname || "Teacher",
      student.name || "",
      meetingTime,
      {
        type: 1,
        duration: 60,
        timezone: "Africa/Addis_Ababa",
        settings: {
          host_video: false,
          participant_video: false,
          join_before_host: true,
          mute_upon_entry: false,
          auto_recording: "none",
          waiting_room: false,
        },
      }
    );

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        join_url: meeting.join_url,
        start_url: meeting.start_url,
        start_time: meeting.start_time,
        duration: meeting.duration,
      },
    });
  } catch (error) {
    console.error("Create meeting error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Zoom meeting",
      },
      { status: 500 }
    );
  }
}

















