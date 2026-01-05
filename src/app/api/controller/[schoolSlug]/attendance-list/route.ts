import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { startOfDay, endOfDay, isValid } from "date-fns";
import { getEthiopianTime } from "@/lib/ethiopian-time";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

// Utility to format attendance status
const formatAttendanceStatus = (status: string | null | undefined): string => {
  const validStatuses = ["Present", "Absent", "Permission", "Not Taken"];
  if (!status) return "Not Taken";
  const normalizedStatus =
    status?.charAt(0)?.toUpperCase() + status?.slice(1).toLowerCase() ||
    "Not Taken";
  return validStatuses.includes(normalizedStatus)
    ? normalizedStatus
    : "Not Taken";
};

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
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

    const { searchParams } = new URL(req.url);
    const schoolSlug = params.schoolSlug;

    // Get schoolId from schoolSlug
    const school = await prisma.school.findFirst({
      where: { slug: schoolSlug },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    let schoolId: string | null = school.id;

    // Use Ethiopian local time for default date since we store times in UTC+3
    const ethiopianNow = getEthiopianTime();
    const defaultDate = ethiopianNow.toISOString().split("T")[0];
    const date = searchParams.get("date") || defaultDate;
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const ustaz = searchParams.get("ustaz") || "";
    const attendanceStatus = searchParams.get("attendanceStatus") || "";
    const sentStatus = searchParams.get("sentStatus") || "";
    const clickedStatus = searchParams.get("clickedStatus") || "";
    // Robust pagination parsing with support for limit=all
    const pageParam = searchParams.get("page") || "1";
    const limitParam = searchParams.get("limit") || "10";
    const isAll =
      typeof limitParam === "string" && limitParam.toLowerCase() === "all";
    const page = Number.isNaN(parseInt(pageParam, 10))
      ? 1
      : parseInt(pageParam, 10);
    const limit = isAll
      ? undefined
      : Number.isNaN(parseInt(limitParam, 10))
      ? 10
      : parseInt(limitParam, 10);
    const notify = searchParams.get("notify")
      ? parseInt(searchParams.get("notify") || "0", 10)
      : 0;

    // Validate date
    let dayStart, dayEnd;
    try {
      const parsedDate = new Date(date);
      if (!isValid(parsedDate)) {
        throw new Error("Invalid date provided");
      }
      dayStart = startOfDay(parsedDate);
      dayEnd = endOfDay(parsedDate);
    } catch (error) {
      console.error("Invalid date format:", date, error);
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Get teachers assigned to this controller
    const controllerTeachers = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        schoolId: schoolId,
        control: session.username,
      },
      select: {
        ustazid: true,
        ustazname: true,
      },
    });

    if (controllerTeachers.length === 0) {
      return NextResponse.json({
        integratedData: [],
        total: 0,
        stats: {
          totalLinks: 0,
          totalSent: 0,
          totalClicked: 0,
          responseRate: "0%",
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0,
          permissionCount: 0,
          notTakenCount: 0,
        },
        allTeachers: [],
      });
    }

    const teacherIds = controllerTeachers.map(t => t.ustazid);

    // Determine day packages for the selected day
    const selectedDayName = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });
    // Build day package filters based on selected day
    const dayPackageOr = [];

    // Always include "All days" students
    dayPackageOr.push({ daypackages: { contains: "All days" } });
    dayPackageOr.push({ daypackages: { contains: "all days" } });

    // Add specific day name
    dayPackageOr.push({ daypackages: { contains: selectedDayName } });

    // Add package-specific filters based on the day
    if (["Monday", "Wednesday", "Friday"].includes(selectedDayName)) {
      dayPackageOr.push({ daypackages: { contains: "MWF" } });
      dayPackageOr.push({ daypackages: { contains: "mwf" } });
    }

    if (["Tuesday", "Thursday", "Saturday"].includes(selectedDayName)) {
      dayPackageOr.push({ daypackages: { contains: "TTS" } });
      dayPackageOr.push({ daypackages: { contains: "tts" } });
    }

    // Include null/empty for backward compatibility
    dayPackageOr.push({ daypackages: null });
    dayPackageOr.push({ daypackages: "" });

    // Notify logic
    if (notify) {
      const student = await prisma.wpos_wpdatatable_23.findUnique({
        where: { wdt_ID: notify },
      });

      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      // Check if student belongs to controller's teachers
      if (!teacherIds.includes(student.ustaz || "")) {
        return NextResponse.json({ error: "Unauthorized to access this student" }, { status: 403 });
      }

      // Send SMS notification
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sms/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: student.phoneno,
            message: `Dear Parent, your child ${student.name} has missed their Quran class today. Please ensure they attend their next scheduled session. Thank you.`,
          }),
        });

        if (response.ok) {
          return NextResponse.json({
            message: "Notification sent to teacher",
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
    }

    // Build main query with controller's teacher filtering
    const whereClause: any = {
      schoolId: schoolId,
      OR: dayPackageOr,
      ustaz: {
        in: teacherIds,
      },
    };

    // Add ustaz filter if specified
    if (ustaz) {
      whereClause.ustaz = ustaz;
    }

    // Add attendance status filter if specified
    if (attendanceStatus) {
      whereClause.attendance_status = attendanceStatus;
    }

    // Get total count for pagination
    const totalCount = await prisma.wpos_wpdatatable_23.count({
      where: whereClause,
    });

    // Get students with pagination
    const students = await prisma.wpos_wpdatatable_23.findMany({
      where: whereClause,
      select: {
        wdt_ID: true,
        name: true,
        ustaz: true,
        status: true,
        attendance_status: true,
        phoneno: true,
        daypackages: true,
        time_slot: true,
        selectedTime: true,
        control: true,
        created_at: true,
      },
      orderBy: {
        name: "asc",
      },
      skip: limit ? (page - 1) * limit : 0,
      take: limit,
    });

    // Get all teachers for filter dropdown (only controller's teachers)
    const allTeachers = controllerTeachers.map(t => t.ustazname);

    // Process each student to integrate links data
    const integratedData = await Promise.all(
      students.map(async (student) => {
        // Get links for this student on the selected date
        const links = await prisma.wpos_zoom_links.findMany({
          where: {
            student_id: student.wdt_ID,
            created_at: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          select: {
            id: true,
            link: true,
            sent_time: true,
            clicked_at: true,
            expiration_date: true,
            report: true,
            tracking_token: true,
          },
          orderBy: {
            sent_time: "desc",
          },
        });

        // Get absent days count if date range is provided
        let absentDaysCount = null;
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);

          if (isValid(start) && isValid(end)) {
            const absentCount = await prisma.wpos_wpdatatable_23.count({
              where: {
                wdt_ID: student.wdt_ID,
                attendance_status: "Absent",
                created_at: {
                  gte: start,
                  lte: end,
                },
              },
            });
            absentDaysCount = absentCount;
          }
        }

        // Find scheduled time from database
        let scheduledAt = null;
        if (student.time_slot) {
          scheduledAt = `${date}T${student.time_slot}`;
        }

        // Format attendance status
        const formattedAttendanceStatus = formatAttendanceStatus(
          student.attendance_status
        );

        return {
          student_id: student.wdt_ID,
          studentName: student.name,
          ustazName: controllerTeachers.find(t => t.ustazid === student.ustaz)?.ustazname || "Unknown",
          scheduledAt,
          links,
          attendance_status: formattedAttendanceStatus,
          absentDaysCount,
        };
      })
    );

    // Calculate statistics
    const stats = {
      totalLinks: integratedData.reduce(
        (sum, record) => sum + record.links.length,
        0
      ),
      totalSent: integratedData.reduce(
        (sum, record) =>
          sum +
          record.links.filter((link) => link.sent_time).length,
        0
      ),
      totalClicked: integratedData.reduce(
        (sum, record) =>
          sum +
          record.links.filter((link) => link.clicked_at).length,
        0
      ),
      responseRate:
        integratedData.reduce(
          (sum, record) =>
            sum +
            record.links.filter((link) => link.clicked_at).length,
          0
        ) > 0
          ? (
              (integratedData.reduce(
                (sum, record) =>
                  sum +
                  record.links.filter((link) => link.clicked_at).length,
                0
              ) /
                integratedData.reduce(
                  (sum, record) =>
                    sum +
                    record.links.filter((link) => link.sent_time).length,
                  0
                )) *
              100
            ).toFixed(1) + "%"
          : "0%",
      totalStudents: integratedData.length,
      presentCount: integratedData.filter(
        (r) => r.attendance_status === "Present"
      ).length,
      absentCount: integratedData.filter(
        (r) => r.attendance_status === "Absent"
      ).length,
      permissionCount: integratedData.filter(
        (r) => r.attendance_status === "Permission"
      ).length,
      notTakenCount: integratedData.filter(
        (r) => r.attendance_status === "Not Taken"
      ).length,
    };

    return NextResponse.json({
      integratedData,
      total: totalCount,
      stats,
      allTeachers,
    });
  } catch (error) {
    console.error("Error fetching attendance list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
