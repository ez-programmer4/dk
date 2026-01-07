import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolSlug: string; studentId: string } }
) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const teacherId = token.id as string;
    const studentId = Number(params.studentId);
    const schoolSlug = params.schoolSlug;

    if (!Number.isFinite(studentId)) {
      return NextResponse.json(
        { error: "Invalid student id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status, surah, pages_read, level, lesson, notes } = body;

    console.log("Attendance API received body:", body);

    if (!status) {
      console.log("❌ Attendance API failed: status is required");
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    // Get school ID for filtering
    let schoolId = null;
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolSlug },
        select: { id: true },
      });
      schoolId = school?.id || null;
      console.log("Attendance API - School lookup result:", {
        schoolSlug,
        schoolId,
      });
    } catch (error) {
      console.error("Attendance API - Error looking up school:", error);
      schoolId = null;
    }

    // Verify ownership and school assignment
    const whereClause: any = { wdt_ID: studentId, ustaz: teacherId };
    if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    console.log("Attendance API - Student lookup whereClause:", whereClause);

    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: whereClause,
      select: { ustaz: true, name: true },
    });

    console.log("Attendance API - Student lookup result:", {
      found: !!student,
      studentId,
      teacherId,
      schoolId,
    });

    if (!student) {
      return NextResponse.json(
        {
          error: "Student not found or not assigned to this teacher/school",
          details: { studentId, teacherId, schoolId },
        },
        { status: 403 }
      );
    }

    const created = await prisma.student_attendance_progress.create({
      data: {
        student_id: studentId,
        attendance_status: status,
        surah: surah ?? null,
        pages_read: pages_read != null ? Number(pages_read) : null,
        level: level ?? null,
        lesson: lesson ?? null,
        notes: notes ?? null,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        student_name: student.name,
        status: status,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
