import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST: Clear time slot by setting end_at on occupied time
export async function POST(
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
    const { dayPackage, timeSlot, studentId } = await req.json();

    if (!dayPackage || !timeSlot) {
      return NextResponse.json(
        { error: "dayPackage and timeSlot are required" },
        { status: 400 }
      );
    }

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

    // Find the occupied time record
    const occupiedTime = await prisma.wpos_ustaz_occupied_times.findFirst({
      where: {
        ustaz_id: teacherId,
        daypackage: dayPackage,
        time_slot: timeSlot,
        end_at: null, // Only active occupations
        ...(studentId ? { student_id: studentId } : {}),
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
    });

    if (!occupiedTime) {
      return NextResponse.json(
        { error: "No active occupation found for this time slot" },
        { status: 404 }
      );
    }

    // Update the occupied time to set end_at
    const updatedOccupiedTime = await prisma.wpos_ustaz_occupied_times.update({
      where: {
        id: occupiedTime.id,
      },
      data: {
        end_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Time slot cleared successfully",
      occupiedTime: updatedOccupiedTime,
    });
  } catch (error) {
    console.error("Controller clear time slot API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

