import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Fetch teacher statistics
export async function GET(
  req: NextRequest,
  { params }: { params: { schoolSlug: string; teacherId: string } }
) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "controller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolSlug = params.schoolSlug;
    let schoolId: string | null = schoolSlug === "darulkubra" ? null : null;

    // For non-darulkubra schools, look up the actual school ID
    if (schoolSlug !== "darulkubra") {
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
    }

    const teacherId = params.teacherId;

    // Verify the teacher is assigned to this controller
    const teacherAssignment = await prisma.wpos_wpdatatable_24.findFirst({
      where: {
        ustazid: teacherId,
        control: session.code,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
    });

    if (!teacherAssignment) {
      return NextResponse.json(
        { error: "Teacher not assigned to you" },
        { status: 403 }
      );
    }

    // Get total students assigned to this teacher
    const totalStudents = await prisma.wpos_wpdatatable_23.count({
      where: {
        ustaz: teacherId,
        ...(schoolId ? { schoolId } : {}),
      },
    });

    // Get active students (not exited)
    const activeStudents = await prisma.wpos_wpdatatable_23.count({
      where: {
        ustaz: teacherId,
        exitdate: null,
        ...(schoolId ? { schoolId } : {}),
      },
    });

    // Get total classes (from attendance records for students assigned to this teacher)
    // First get all students assigned to this teacher, then count their attendance records
    const teacherStudents = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        ustaz: teacherId,
        ...(schoolId ? { schoolId } : {}),
      },
      select: {
        wdt_ID: true,
      },
    });

    const studentIds = teacherStudents.map((student) => student.wdt_ID);

    const totalClasses = await prisma.student_attendance_progress.count({
      where: {
        student_id: {
          in: studentIds,
        },
      },
    });

    // Average rating not available (quality assessment table not implemented)
    const averageRating = 0;

    const stats = {
      totalStudents,
      activeStudents,
      totalClasses,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Controller teacher stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
