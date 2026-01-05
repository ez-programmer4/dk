import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Fetch occupied time slots for a teacher
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

    // Fetch occupied time slots for this teacher that haven't ended yet
    const occupiedSlots = await prisma.wpos_ustaz_occupied_times.findMany({
      where: {
        ustaz_id: teacherId,
        end_at: null, // Only active occupations
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
      include: {
        student: {
          select: {
            wdt_ID: true,
            name: true,
            phoneno: true,
            classfee: true,
            status: true,
          },
        },
      },
      orderBy: [
        { daypackage: "asc" },
        { time_slot: "asc" },
      ],
    });

    // Format the response
    const formattedSlots = occupiedSlots.map(slot => ({
      id: slot.id,
      dayPackage: slot.daypackage,
      timeSlot: slot.time_slot,
      occupiedAt: slot.occupied_at?.toISOString(),
      student: slot.student ? {
        id: slot.student.wdt_ID,
        name: slot.student.name,
        phone: slot.student.phoneno,
        classFee: slot.student.classfee,
        status: slot.student.status,
      } : null,
    }));

    return NextResponse.json({
      occupiedSlots: formattedSlots,
    });
  } catch (error) {
    console.error("Controller teacher occupied slots API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
