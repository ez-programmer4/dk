import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";

const AttendanceSubmissionLogSchema = z.object({
  classDate: z.string().datetime(),
  submittedAt: z.string().datetime(),
  isLate: z.boolean(),
  deductionApplied: z.number(),
});

// TODO: Add real authentication/authorization middleware

// GET: Fetch all attendance submission logs for a teacher
export async function GET(
  req: NextRequest,
  { params }: { params: { schoolSlug: string; teacherId: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (user.role === "teacher" && user.id !== params.teacherId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get school ID for validation
    const schoolSlug = params.schoolSlug;
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

    const teacherId = params.teacherId;

    // Verify teacher belongs to the school
    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: teacherId },
      select: { schoolId: true },
    });

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Teacher not found in this school" },
        { status: 404 }
      );
    }

    const records = await prisma.attendancesubmissionlog.findMany({
      where: { teacherId },
      orderBy: { classDate: "desc" },
    });
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST: Create a new attendance submission log for a teacher
export async function POST(
  req: NextRequest,
  { params }: { params: { schoolSlug: string; teacherId: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (user.role === "teacher" && user.id !== params.teacherId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get school ID for validation
    const schoolSlug = params.schoolSlug;
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

    const teacherId = params.teacherId;

    // Verify teacher belongs to the school
    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: teacherId },
      select: { schoolId: true },
    });

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Teacher not found in this school" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parseResult = AttendanceSubmissionLogSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parseResult.error.issues },
        { status: 400 }
      );
    }
    const { classDate, submittedAt, isLate, deductionApplied } =
      parseResult.data;
    const record = await prisma.attendancesubmissionlog.create({
      data: {
        teacherId,
        classDate: new Date(classDate),
        submittedAt: new Date(submittedAt),
        isLate,
        deductionApplied,
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    const error = err as Error;
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create attendance submission log." },
      { status: 500 }
    );
  }
}













