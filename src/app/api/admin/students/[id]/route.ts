import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET - Get full student details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: parseInt(params.id) },
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

// PUT - Update a student (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      classfee,
      classfeeCurrency,
      package: pkg,
      subject,
      daypackages,
      ustaz,
      name,
      phoneno,
      country,
      rigistral,
      refer,
      progress,
      chatId,
    } = body;

    // Verify student exists
    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: parseInt(params.id) },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if status is changing to Leave and set exitdate
    const exitdate =
      status === "Leave" && student.status !== "Leave" ? new Date() : undefined;

    // Build update data object
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (classfee !== undefined) updateData.classfee = classfee;
    if (classfeeCurrency !== undefined)
      updateData.classfeeCurrency = classfeeCurrency;
    if (pkg !== undefined) updateData.package = pkg;
    if (subject !== undefined) updateData.subject = subject;
    if (daypackages !== undefined) updateData.daypackages = daypackages;
    if (ustaz !== undefined) updateData.ustaz = ustaz;
    if (name !== undefined) updateData.name = name;
    if (phoneno !== undefined) updateData.phoneno = phoneno;
    if (country !== undefined) updateData.country = country;
    if (rigistral !== undefined) updateData.rigistral = rigistral;
    if (refer !== undefined) updateData.refer = refer;
    if (progress !== undefined) updateData.progress = progress;
    if (chatId !== undefined) updateData.chatId = chatId;
    if (exitdate) updateData.exitdate = exitdate;

    // Update the student
    const updatedStudent = await prisma.wpos_wpdatatable_23.update({
      where: { wdt_ID: parseInt(params.id) },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a student (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: parseInt(params.id) },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete the student and related records
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.student_attendance_progress.deleteMany({
        where: { student_id: parseInt(params.id) },
      });

      await tx.months_table.deleteMany({
        where: { studentid: parseInt(params.id) },
      });

      await tx.payment.deleteMany({
        where: { studentid: parseInt(params.id) },
      });

      await tx.wpos_ustaz_occupied_times.deleteMany({
        where: { student_id: parseInt(params.id) },
      });

      await tx.wpos_zoom_links.deleteMany({
        where: { studentid: parseInt(params.id) },
      });

      // Finally delete the student
      await tx.wpos_wpdatatable_23.delete({
        where: { wdt_ID: parseInt(params.id) },
      });
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
