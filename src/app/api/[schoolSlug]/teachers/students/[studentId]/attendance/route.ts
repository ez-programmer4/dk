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
    const teacherId = token.user?.id || token.id as string;
    const studentId = Number(params.studentId);
    const schoolSlug = params.schoolSlug;

    if (!Number.isFinite(studentId)) {
      return NextResponse.json(
        { error: "Invalid student id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { attendance_status, surah, pages_read, level, lesson, notes, ayah, next_class } = body;
    if (!attendance_status) {
      return NextResponse.json(
        { error: "attendance_status is required" },
        { status: 400 }
      );
    }

    // Get school ID for filtering
    let schoolId = null;
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolSlug },
        select: { id: true }
      });
      schoolId = school?.id || null;
    } catch (error) {
      console.error("Error looking up school:", error);
      schoolId = null;
    }

    // Verify ownership and school assignment
    const whereClause: any = { wdt_ID: studentId, ustaz: teacherId };
    if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: whereClause,
      select: { ustaz: true, name: true },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found or not assigned to this teacher/school" }, { status: 403 });
    }

    const created = await prisma.student_attendance_progress.create({
      data: {
        student_id: studentId,
        attendance_status,
        surah: surah ?? null,
        pages_read: pages_read != null ? Number(pages_read) : null,
        level: level ?? null,
        lesson: lesson ?? null,
        notes: notes ?? null,
        ayah: ayah ?? null,
        next_class: next_class ?? null,
      },
    });

    return NextResponse.json(
      {
        id: created.id,
        student_name: student.name,
        status: attendance_status,
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
