import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolSlug: string; id: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "controller") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const schoolSlug = params.schoolSlug;
    const studentId = params.id;

    let schoolId: string | null = null;

    // Look up the school ID for all schools
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolSlug },
        select: { id: true, name: true, slug: true }
      });
      schoolId = school?.id || null;
    } catch (error) {
      console.error("Error looking up school:", error);
      schoolId = null;
    }

    // Get teachers assigned to this controller
    const controllerTeachers = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        control: session.code,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
      select: {
        ustazid: true,
      },
    });

    const teacherIds = controllerTeachers.map(t => t.ustazid);

    if (teacherIds.length === 0) {
      return NextResponse.json({ message: "No teachers assigned to you" }, { status: 404 });
    }

    // Get student data - only if the student belongs to one of the controller's teachers
    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: {
        wdt_ID: parseInt(studentId),
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
        exitdate: true,
        progress: true,
        chatId: true,
        teacher: {
          select: {
            ustazname: true,
            ustazid: true,
          },
        },
        schoolId: true,
      },
    });

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    // Check if the student's teacher is assigned to this controller
    if (!teacherIds.includes(student.ustaz)) {
      return NextResponse.json({ message: "Access denied - student not assigned to your teachers" }, { status: 403 });
    }

    // Check school isolation
    if ((schoolId === null && student.schoolId !== null) ||
        (schoolId !== null && student.schoolId !== schoolId)) {
      return NextResponse.json({ message: "Access denied - student belongs to different school" }, { status: 403 });
    }

    // Transform the data to match the expected format
    const transformedStudent = {
      id: student.wdt_ID,
      name: student.name,
      phoneno: student.phoneno,
      classfee: student.classfee,
      classfeeCurrency: student.classfeeCurrency,
      startdate: student.startdate,
      status: student.status,
      ustaz: student.ustaz,
      ustazname: student.teacher?.ustazname || "Unknown",
      package: student.package,
      subject: student.subject,
      country: student.country,
      rigistral: student.rigistral,
      daypackages: student.daypackages,
      isTrained: student.isTrained,
      refer: student.refer,
      registrationdate: student.registrationdate,
      exitdate: student.exitdate,
      progress: student.progress,
      chatId: student.chatId,
    };

    return NextResponse.json(transformedStudent);
  } catch (error) {
    console.error("Controller student detail API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

