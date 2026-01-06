import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Fetch individual teacher details
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
    let schoolId: string | null = null;

    // Look up the school ID for all schools
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

    // Get the full teacher details
    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: {
        ustazid: teacherId,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    // Format the response
    const teacherDetails = {
      ustazid: teacher.ustazid,
      ustazname: teacher.ustazname,
      phone: teacher.phone || "",
      schedule: teacher.schedule || "",
      password: teacher.password || "",
      created_at: teacher.created_at?.toISOString() || "",
    };

    return NextResponse.json(teacherDetails);
  } catch (error) {
    console.error("Controller teacher details API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

