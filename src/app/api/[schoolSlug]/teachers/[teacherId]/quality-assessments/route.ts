import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";

// TODO: Add real authentication/authorization middleware

// GET: Fetch all quality assessments for a teacher
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

    const records = await prisma.qualityassessment.findMany({
      where: { teacherId },
      orderBy: { weekStart: "desc" },
    });
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const QualityAssessmentSchema = z.object({
  weekStart: z.string().datetime(),
  supervisorFeedback: z.string().min(1),
  examinerRating: z.number().nullable().optional(),
  studentPassRate: z.number().nullable().optional(),
  overallQuality: z.string().min(1),
  managerApproved: z.boolean(),
  managerOverride: z.boolean(),
  overrideNotes: z.string().nullable().optional(),
  bonusAwarded: z.number().nullable().optional(),
});

// POST: Create a new quality assessment for a teacher
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
    const parseResult = QualityAssessmentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parseResult.error.issues },
        { status: 400 }
      );
    }
    const {
      weekStart,
      supervisorFeedback,
      examinerRating,
      studentPassRate,
      overallQuality,
      managerApproved,
      managerOverride,
      overrideNotes,
      bonusAwarded,
    } = parseResult.data;
    const record = await prisma.qualityassessment.create({
      data: {
        teacherId,
        weekStart: new Date(weekStart),
        supervisorFeedback,
        examinerRating,
        studentPassRate,
        overallQuality,
        managerApproved,
        managerOverride,
        overrideNotes,
        bonusAwarded,
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    const error = err as Error;
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create quality assessment." },
      { status: 500 }
    );
  }
}




























