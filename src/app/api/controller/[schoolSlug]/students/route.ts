import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolSlug: string } }
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

    const teacherIds = controllerTeachers.map((t) => t.ustazid);

    if (teacherIds.length === 0) {
      return NextResponse.json({
        students: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const searchQuery = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "";

    // Build where clause
    const whereClause: any = {
      ustaz: {
        in: teacherIds,
      },
      ...(schoolId ? { schoolId } : { schoolId: null }),
    };

    // Add search filter
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { phoneno: { contains: searchQuery } },
        { chatId: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Add status filter
    if (statusFilter && statusFilter !== "all") {
      whereClause.status = statusFilter;
    }

    // Get total count
    const total = await prisma.wpos_wpdatatable_23.count({
      where: whereClause,
    });

    // Get students with pagination
    const students = await prisma.wpos_wpdatatable_23.findMany({
      where: whereClause,
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
      },
      orderBy: {
        name: "asc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform the data to match the expected format
    const transformedStudents = students.map((student: any) => ({
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
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      students: transformedStudents,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Controller students API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
