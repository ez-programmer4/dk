import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "controller") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get controller's code from the session (try different possible field names)
    const controllerCode = session.code || session.username || session.name;
    if (!controllerCode) {
      return NextResponse.json(
        { error: "Controller code not found in session" },
        { status: 404 }
      );
    }

    // Get active students for this controller (without teacher relation to avoid panics)
    const students = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        u_control: controllerCode,
      },
      select: {
        wdt_ID: true,
        name: true,
        phoneno: true,
        classfee: true,
        classfeeCurrency: true,
        startdate: true,
        status: true,
        ustaz: true,
        package: true,
        subject: true,
        country: true,
        rigistral: true,
        daypackages: true,
        isTrained: true,
        refer: true,
        registrationdate: true,
        chatId: true,
        u_control: true,
        exitdate: true,
      },
    });

    // Fetch time slots and teacher info for all students
    const studentsWithTimeSlots = await Promise.all(
      students.map(async (student) => {
        // Fetch occupied time for this student
        const occupiedTime = await prisma.wpos_ustaz_occupied_times.findFirst({
          where: { student_id: student.wdt_ID },
          select: { time_slot: true },
        });

        // Fetch teacher info separately to handle missing teachers gracefully
        let teacherName = "N/A";
        if (student.ustaz) {
          try {
            const teacher = await prisma.wpos_wpdatatable_24.findUnique({
              where: { ustazid: student.ustaz },
              select: { ustazname: true },
            });
            teacherName = teacher?.ustazname || student.ustaz || "N/A";
          } catch (error) {
            // If teacher lookup fails, use the ustaz field value
            teacherName = student.ustaz || "N/A";
          }
        }

        return {
          ...student,
          id: student.wdt_ID,
          classfeeCurrency: student.classfeeCurrency || "ETB",
          teacher: {
            ustazname: teacherName,
          },
          selectedTime: occupiedTime?.time_slot || null,
          chatId: student.chatId,
          progress: "",
        };
      })
    );

    // Return all student data
    return NextResponse.json(studentsWithTimeSlots);
  } catch (error) {
    console.error("Controller students API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
