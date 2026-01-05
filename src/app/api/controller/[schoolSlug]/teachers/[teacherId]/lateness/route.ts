import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Fetch lateness records for a specific teacher (controller access)
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

    // Fetch lateness records for this teacher
    const records = await prisma.latenessrecord.findMany({
      where: { teacherId },
      orderBy: { classDate: "desc" },
    });

    // Get teacher name separately
    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: teacherId },
      select: { ustazname: true },
    });

    const teacherName = teacher?.ustazname || "Unknown Teacher";

    // Add teacher data to each record
    const recordsWithTeacher = records.map((record) => ({
      ...record,
      teacher: {
        ustazname: teacherName,
      },
    }));

    return NextResponse.json(recordsWithTeacher);
  } catch (error) {
    console.error("Controller teacher lateness API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
