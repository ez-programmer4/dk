import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (
      !session ||
      !["controller"].includes(session.role) ||
      !session.username
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolSlug = params.schoolSlug;

    // Get schoolId from schoolSlug
    const school = await prisma.school.findFirst({
      where: { slug: schoolSlug },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    let schoolId: string | null = school.id;

    const body = await req.json();
    const {
      studentId,
      urgency = "alert",
      minutesLate = 0,
      autoNotify = false,
    } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get student details
    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if student belongs to controller's teachers
    const controllerTeachers = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        schoolId: schoolId,
        control: session.username,
      },
      select: {
        ustazid: true,
      },
    });

    const teacherIds = controllerTeachers.map((t) => t.ustazid);

    if (!teacherIds.includes(student.ustaz || "")) {
      return NextResponse.json(
        { error: "Unauthorized to access this student" },
        { status: 403 }
      );
    }

    // Check if student has a teacher assigned
    if (!student.ustaz) {
      return NextResponse.json(
        { error: "Student has no teacher assigned" },
        { status: 400 }
      );
    }

    // Get teacher details for notification
    const teacher = await prisma.wpos_wpdatatable_24.findFirst({
      where: {
        schoolId: schoolId,
        ustazid: student.ustaz,
      },
    });

    if (!teacher || !teacher.phone) {
      return NextResponse.json(
        { error: "Teacher phone number not found" },
        { status: 404 }
      );
    }

    // Craft message based on urgency
    let message = "";
    switch (urgency) {
      case "critical":
        message = `🚨 URGENT: Student ${student.name} is ${minutesLate} minutes late for class. Please check immediately.`;
        break;
      case "warning":
        message = `⚠️ WARNING: Student ${student.name} is ${minutesLate} minutes late for class.`;
        break;
      case "alert":
      default:
        message = `📢 ALERT: Student ${student.name} is running ${minutesLate} minutes late for class.`;
        break;
    }

    if (autoNotify) {
      message += " (Auto-notification)";
    }

    // Send SMS notification
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/sms/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: teacher.phone,
            message,
          }),
        }
      );

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: "Notification sent successfully",
          details: {
            studentName: student.name,
            teacherName: teacher.ustazname,
            urgency,
            minutesLate,
            autoNotify,
          },
        });
      } else {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.error || "Failed to send SMS" },
          { status: response.status }
        );
      }
    } catch (error) {
      console.error("SMS sending error:", error);
      return NextResponse.json(
        { error: "Failed to send SMS notification" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
