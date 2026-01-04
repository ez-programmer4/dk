import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getLastSeen(studentId: number): Promise<string> {
  const lastProgressUpdatedDate = await prisma.studentProgress.findFirst({
    where: {
      studentId,
    },
    select: {
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!lastProgressUpdatedDate) return "-";

  const daysAgo = differenceInDays(
    new Date(),
    lastProgressUpdatedDate.updatedAt
  );

  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "1 day ago";
  if (daysAgo <= 7) return `${daysAgo} days ago`;
  if (daysAgo <= 14) return "1 week ago";
  if (daysAgo <= 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  if (daysAgo <= 60) return "1 month ago";
  if (daysAgo <= 365) return `${Math.floor(daysAgo / 30)} months ago`;
  if (daysAgo <= 730) return "1 year ago";
  return `${Math.floor(daysAgo / 365)} years ago`;
}

export async function GET(request: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "controller") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const schoolSlug = params.schoolSlug;
    const schoolId = schoolSlug === 'darulkubra' ? null : schoolSlug;

    // Get teachers assigned to this controller
    const controllerTeachers = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        control: session.code,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
      select: {
        ustazid: true,
      },
    });

    const teacherIds = controllerTeachers.map(t => t.ustazid);

    // Get all students assigned to these teachers
    const students = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        ustaz: {
          in: teacherIds,
        },
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
      select: {
        wdt_ID: true,
        name: true,
        status: true,
        startdate: true,
        registrationdate: true,
        daypackages: true,
        subject: true,
        classfee: true,
        country: true,
        chatId: true,
        phone: true,
        package: true,
      },
    });

    // Get attendance data for these students
    const studentIds = students.map(s => s.wdt_ID);
    const attendanceRecords = await prisma.tarbiaAttendance.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
      },
      select: {
        studentId: true,
        date: true,
        status: true,
      },
    });

    // Process attendance data
    const attendanceByStudent = attendanceRecords.reduce((acc, record) => {
      if (!acc[record.studentId]) {
        acc[record.studentId] = [];
      }
      acc[record.studentId].push(record);
      return acc;
    }, {} as Record<number, any[]>);

    // Calculate analytics for each student
    const studentAnalytics = await Promise.all(
      students.map(async (student) => {
        const studentAttendance = attendanceByStudent[student.wdt_ID] || [];
        const totalClasses = studentAttendance.length;
        const presentClasses = studentAttendance.filter(a => a.status === 'present').length;
        const absentClasses = studentAttendance.filter(a => a.status === 'absent').length;
        const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

        const lastSeen = await getLastSeen(student.wdt_ID);

        return {
          id: student.wdt_ID,
          name: student.name,
          status: student.status,
          startDate: student.startdate,
          registrationDate: student.registrationdate,
          dayPackage: student.daypackages,
          subject: student.subject,
          classFee: student.classfee,
          country: student.country,
          chatId: student.chatId,
          phone: student.phone,
          package: student.package,
          attendance: {
            total: totalClasses,
            present: presentClasses,
            absent: absentClasses,
            rate: Math.round(attendanceRate * 100) / 100,
          },
          lastSeen,
        };
      })
    );

    // Calculate overall analytics
    const totalStudents = studentAnalytics.length;
    const activeStudents = studentAnalytics.filter(s => s.status === 'Active' || s.status === 'On Progress').length;
    const averageAttendance = studentAnalytics.length > 0
      ? studentAnalytics.reduce((sum, s) => sum + s.attendance.rate, 0) / studentAnalytics.length
      : 0;

    const analytics = {
      totalStudents,
      activeStudents,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
      students: studentAnalytics,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Controller student analytics API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
