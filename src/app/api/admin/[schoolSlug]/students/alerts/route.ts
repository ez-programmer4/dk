import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get months parameter from query string (default: 1 month)
    const { searchParams } = new URL(request.url);
    const monthsParam = parseInt(searchParams.get("months") || "1", 10);
    const months = Math.max(1, Math.min(12, monthsParam)); // Clamp between 1 and 12 months

    const now = new Date();
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);

    // Calculate date for "Not Succeed" filter based on months parameter
    const monthsAgo = new Date(now);
    monthsAgo.setMonth(monthsAgo.getMonth() - months);
    monthsAgo.setHours(0, 0, 0, 0);

    // 1. Get "Not Succeed" students from the specified months period
    const notSucceedStudents = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        status: {
          contains: "Not succeed",
        },
        registrationdate: {
          gte: monthsAgo,
        },
      },
      select: {
        wdt_ID: true,
        name: true,
        status: true,
        startdate: true,
        ustaz: true,
        phoneno: true,
        registrationdate: true,
        u_control: true,
      },
      orderBy: {
        registrationdate: "desc",
      },
    });

    // Get ustaz names for "Not Succeed" students
    const notSucceedUstazIds = notSucceedStudents
      .map((s) => s.ustaz)
      .filter((id): id is string => Boolean(id))
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const notSucceedUstazData = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        ustazid: {
          in: notSucceedUstazIds,
        },
      },
      select: {
        ustazid: true,
        ustazname: true,
      },
    });

    const notSucceedUstazMap = notSucceedUstazData.reduce((acc, ustaz) => {
      if (ustaz.ustazid && ustaz.ustazname) {
        acc[ustaz.ustazid] = ustaz.ustazname;
      }
      return acc;
    }, {} as Record<string, string>);

    // Get controller names for "Not Succeed" students
    const notSucceedControllerCodes = notSucceedStudents
      .map((s) => s.u_control)
      .filter((code): code is string => Boolean(code))
      .filter((code, index, arr) => arr.indexOf(code) === index);

    const notSucceedControllerData = await prisma.wpos_wpdatatable_28.findMany({
      where: {
        code: {
          in: notSucceedControllerCodes,
        },
      },
      select: {
        code: true,
        name: true,
      },
    });

    const notSucceedControllerMap = notSucceedControllerData.reduce((acc, controller) => {
      if (controller.code && controller.name) {
        acc[controller.code] = controller.name;
      }
      return acc;
    }, {} as Record<string, string>);

    // 2. Get "Not Yet" students for more than 5 days
    const notYetStudentsQuery = `
      SELECT 
        wdt_ID,
        name,
        status,
        startdate,
        ustaz,
        phoneno,
        registrationdate,
        u_control,
        DATEDIFF(NOW(), registrationdate) as daysSinceRegistration
      FROM wpos_wpdatatable_23
      WHERE status = 'Not yet'
        AND registrationdate IS NOT NULL
        AND registrationdate <= ?
      ORDER BY registrationdate ASC
    `;

    const notYetStudentsRaw = (await prisma.$queryRawUnsafe(
      notYetStudentsQuery,
      fiveDaysAgo
    )) as any[];

    const notYetStudents = notYetStudentsRaw.map((s) => ({
      wdt_ID: s.wdt_ID,
      name: s.name,
      status: s.status,
      startdate: s.startdate,
      ustaz: s.ustaz,
      phoneno: s.phoneno,
      registrationdate: s.registrationdate,
      u_control: s.u_control,
      daysSinceRegistration: Number(s.daysSinceRegistration || 0),
    }));

    // Get ustaz names for "Not Yet" students
    const notYetUstazIds = notYetStudents
      .map((s) => s.ustaz)
      .filter((id): id is string => Boolean(id))
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const notYetUstazData = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        ustazid: {
          in: notYetUstazIds,
        },
      },
      select: {
        ustazid: true,
        ustazname: true,
      },
    });

    const notYetUstazMap = notYetUstazData.reduce((acc, ustaz) => {
      if (ustaz.ustazid && ustaz.ustazname) {
        acc[ustaz.ustazid] = ustaz.ustazname;
      }
      return acc;
    }, {} as Record<string, string>);

    // Get controller names for "Not Yet" students
    const notYetControllerCodes = notYetStudents
      .map((s) => s.u_control)
      .filter((code): code is string => Boolean(code))
      .filter((code, index, arr) => arr.indexOf(code) === index);

    const notYetControllerData = await prisma.wpos_wpdatatable_28.findMany({
      where: {
        code: {
          in: notYetControllerCodes,
        },
      },
      select: {
        code: true,
        name: true,
      },
    });

    const notYetControllerMap = notYetControllerData.reduce((acc, controller) => {
      if (controller.code && controller.name) {
        acc[controller.code] = controller.name;
      }
      return acc;
    }, {} as Record<string, string>);

    // 3. Get students absent for 5 consecutive days
    // Use optimized SQL query to find students with 5 consecutive absences
    const sixDaysAgo = new Date(now);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    sixDaysAgo.setHours(0, 0, 0, 0);

    // Get all active students with their recent attendance
    const activeStudents = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        status: "Active",
      },
      select: {
        wdt_ID: true,
        name: true,
        status: true,
        startdate: true,
        ustaz: true,
        phoneno: true,
        registrationdate: true,
        u_control: true,
      },
    });

    // Get attendance records for all active students in the last 6 days
    const studentIds = activeStudents.map((s) => s.wdt_ID);
    const recentAttendance = await prisma.student_attendance_progress.findMany({
      where: {
        student_id: {
          in: studentIds,
        },
        date: {
          gte: sixDaysAgo,
        },
      },
      select: {
        student_id: true,
        date: true,
        attendance_status: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Group attendance by student
    const attendanceByStudent = recentAttendance.reduce((acc, record) => {
      if (!acc[record.student_id]) {
        acc[record.student_id] = [];
      }
      acc[record.student_id].push(record);
      return acc;
    }, {} as Record<number, typeof recentAttendance>);

    // Check each student for 5 consecutive absences
    const studentsAbsent5Days: any[] = [];
    const last5Days = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date.toISOString().split("T")[0];
    }).reverse();

    for (const student of activeStudents) {
      const studentAttendance = attendanceByStudent[student.wdt_ID] || [];
      const attendanceMap = new Map(
        studentAttendance.map((r) => [
          r.date.toISOString().split("T")[0],
          r.attendance_status?.toLowerCase(),
        ])
      );

      let consecutiveAbsentDays = 0;
      let maxConsecutive = 0;

      for (const day of last5Days) {
        const status = attendanceMap.get(day);
        if (!status || status === "absent") {
          consecutiveAbsentDays++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveAbsentDays);
        } else {
          consecutiveAbsentDays = 0;
        }
      }

      if (maxConsecutive >= 5) {
        studentsAbsent5Days.push({
          ...student,
          consecutiveAbsentDays: maxConsecutive,
        });
      }
    }

    // Get ustaz names for absent students
    const absentUstazIds = studentsAbsent5Days
      .map((s) => s.ustaz)
      .filter((id): id is string => Boolean(id))
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const absentUstazData = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        ustazid: {
          in: absentUstazIds,
        },
      },
      select: {
        ustazid: true,
        ustazname: true,
      },
    });

    const absentUstazMap = absentUstazData.reduce((acc, ustaz) => {
      if (ustaz.ustazid && ustaz.ustazname) {
        acc[ustaz.ustazid] = ustaz.ustazname;
      }
      return acc;
    }, {} as Record<string, string>);

    // Get controller names for absent students
    const absentControllerCodes = studentsAbsent5Days
      .map((s) => s.u_control)
      .filter((code): code is string => Boolean(code))
      .filter((code, index, arr) => arr.indexOf(code) === index);

    const absentControllerData = await prisma.wpos_wpdatatable_28.findMany({
      where: {
        code: {
          in: absentControllerCodes,
        },
      },
      select: {
        code: true,
        name: true,
      },
    });

    const absentControllerMap = absentControllerData.reduce((acc, controller) => {
      if (controller.code && controller.name) {
        acc[controller.code] = controller.name;
      }
      return acc;
    }, {} as Record<string, string>);

    // Format responses
    const formatStudent = (student: any, ustazMap: Record<string, string>, controllerMap: Record<string, string>) => ({
      id: student.wdt_ID,
      name: student.name,
      status: student.status,
      startDate: student.startdate,
      ustazName: student.ustaz ? ustazMap[student.ustaz] : null,
      phone: student.phoneno,
      registrationDate: student.registrationdate,
      controller: student.u_control ? controllerMap[student.u_control] : null,
    });

    return NextResponse.json({
      notSucceed: {
        count: notSucceedStudents.length,
        months: months, // Include the months filter used
        students: notSucceedStudents.map((s) =>
          formatStudent(s, notSucceedUstazMap, notSucceedControllerMap)
        ),
      },
      notYetMoreThan5Days: {
        count: notYetStudents.length,
        students: notYetStudents.map((s) => ({
          ...formatStudent(s, notYetUstazMap, notYetControllerMap),
          daysSinceRegistration: s.daysSinceRegistration,
        })),
      },
      absent5ConsecutiveDays: {
        count: studentsAbsent5Days.length,
        students: studentsAbsent5Days.map((s) => ({
          ...formatStudent(s, absentUstazMap, absentControllerMap),
          consecutiveAbsentDays: s.consecutiveAbsentDays,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching student alerts:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

