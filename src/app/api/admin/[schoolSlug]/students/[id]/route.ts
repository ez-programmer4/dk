import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET - Get full student details
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolSlug: string; id: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school ID for filtering
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

    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: {
        wdt_ID: parseInt(params.id),
        ...(schoolId && { schoolId }),
      },
      include: {
        teacher: {
          select: {
            ustazid: true,
            ustazname: true,
            phone: true,
          },
        },
        occupiedTimes: {
          select: {
            time_slot: true,
            occupied_at: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT - Update student details
export async function PUT(
  request: NextRequest,
  { params }: { params: { schoolSlug: string; id: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school ID for filtering
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

    const body = await request.json();
    const { name, phone, email, subject, daypackages, ustaz, status } = body;

    const updatedStudent = await prisma.wpos_wpdatatable_23.update({
      where: {
        wdt_ID: parseInt(params.id),
        ...(schoolId && { schoolId }),
      },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(subject && { subject }),
        ...(daypackages && { daypackages }),
        ...(ustaz && { ustaz }),
        ...(status && { status }),
      },
      include: {
        teacher: {
          select: {
            ustazid: true,
            ustazname: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { schoolSlug: string; id: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school ID for filtering
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

    await prisma.wpos_wpdatatable_23.delete({
      where: {
        wdt_ID: parseInt(params.id),
        ...(schoolId && { schoolId }),
      },
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}








