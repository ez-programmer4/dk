import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  // Declare variables outside try block so they're accessible in catch
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const packageFilter = searchParams.get("package") || "";
  const subjectFilter = searchParams.get("subject") || "";
  const countryFilter = searchParams.get("country") || "";
  const ustazFilter = searchParams.get("ustaz") || "";
  const progressFilter = searchParams.get("progress") || "";
  const regDateFrom = searchParams.get("regDateFrom") || "";
  const regDateTo = searchParams.get("regDateTo") || "";
  const startDateFrom = searchParams.get("startDateFrom") || "";
  const startDateTo = searchParams.get("startDateTo") || "";
  const feeMin = searchParams.get("feeMin") || "";
  const feeMax = searchParams.get("feeMax") || "";

  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Verify admin has access to this school
    const admin = await prisma.admin.findUnique({
      where: { id: session.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }

    const offset = (page - 1) * limit;

    // Build WHERE conditions dynamically
    const whereConditions: string[] = [`schoolId = ?`];
    const queryParams: any[] = [school.id];

    // Search filter (name search)
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereConditions.push(`LOWER(name) LIKE ?`);
      queryParams.push(searchTerm);
    }

    // Status filter
    if (status) {
      whereConditions.push(`status = ?`);
      queryParams.push(status);
    }

    // Package filter
    if (packageFilter) {
      whereConditions.push(`package = ?`);
      queryParams.push(packageFilter);
    }

    // Subject filter
    if (subjectFilter) {
      whereConditions.push(`subject = ?`);
      queryParams.push(subjectFilter);
    }

    // Country filter
    if (countryFilter) {
      whereConditions.push(`country = ?`);
      queryParams.push(countryFilter);
    }

    // Ustaz/Teacher filter
    if (ustazFilter) {
      whereConditions.push(`ustaz = ?`);
      queryParams.push(ustazFilter);
    }

    // Progress filter
    if (progressFilter) {
      whereConditions.push(`progress = ?`);
      queryParams.push(progressFilter);
    }

    // Registration date range
    if (regDateFrom) {
      whereConditions.push(`DATE(registrationdate) >= ?`);
      queryParams.push(regDateFrom);
    }
    if (regDateTo) {
      whereConditions.push(`DATE(registrationdate) <= ?`);
      queryParams.push(regDateTo);
    }

    // Start date range
    if (startDateFrom) {
      whereConditions.push(`DATE(startdate) >= ?`);
      queryParams.push(startDateFrom);
    }
    if (startDateTo) {
      whereConditions.push(`DATE(startdate) <= ?`);
      queryParams.push(startDateTo);
    }

    // Fee range
    if (feeMin) {
      whereConditions.push(`CAST(classfee AS DECIMAL(10,2)) >= ?`);
      queryParams.push(parseFloat(feeMin));
    }
    if (feeMax) {
      whereConditions.push(`CAST(classfee AS DECIMAL(10,2)) <= ?`);
      queryParams.push(parseFloat(feeMax));
    }

    // Build the WHERE clause
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Build and execute queries
    const countQuery = `
      SELECT COUNT(*) as count
      FROM wpos_wpdatatable_23
      ${whereClause}
    `;

    const studentsQuery = `
      SELECT 
        wdt_ID,
        name,
        status,
        startdate,
        ustaz,
        phoneno,
        registrationdate,
        package,
        subject,
        daypackages,
        classfee,
        classfeeCurrency,
        country,
        progress,
        chat_id as chatId,
        u_control
      FROM wpos_wpdatatable_23
      ${whereClause}
      ORDER BY registrationdate DESC
      LIMIT ? OFFSET ?
    `;

    // Execute queries with parameters
    const countResult = (await prisma.$queryRawUnsafe(
      countQuery,
      ...queryParams
    )) as any[];
    const total = Number(countResult[0]?.count || 0);

    const students = (await prisma.$queryRawUnsafe(
      studentsQuery,
      ...queryParams,
      limit,
      offset
    )) as any[];

    // Get ustaz names for assigned students
    const ustazIds = students
      .map((s) => s.ustaz)
      .filter((id): id is string => Boolean(id))
      .filter((id, index, arr) => arr.indexOf(id) === index);

    const ustazData = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        ustazid: {
          in: ustazIds,
        },
      },
      select: {
        ustazid: true,
        ustazname: true,
      },
    });

    const ustazMap = ustazData.reduce((acc, ustaz) => {
      if (ustaz.ustazid && ustaz.ustazname) {
        acc[ustaz.ustazid] = ustaz.ustazname;
      }
      return acc;
    }, {} as Record<string, string>);

    // Get controller names for assigned students
    const controllerCodes = students
      .map((s) => s.u_control)
      .filter((code): code is string => Boolean(code))
      .filter((code, index, arr) => arr.indexOf(code) === index);

    const controllerData = await prisma.wpos_wpdatatable_28.findMany({
      where: {
        code: {
          in: controllerCodes,
        },
      },
      select: {
        code: true,
        name: true,
      },
    });

    const controllerMap = controllerData.reduce((acc, controller) => {
      if (controller.code && controller.name) {
        acc[controller.code] = controller.name;
      }
      return acc;
    }, {} as Record<string, string>);

    // Format response
    const formattedStudents = students.map((student: any) => ({
      id: student.wdt_ID,
      name: student.name,
      status: student.status,
      startDate: student.startdate,
      ustazName: student.ustaz ? ustazMap[student.ustaz] : null,
      phone: student.phoneno,
      email: null,
      registrationDate: student.registrationdate,
      package: student.package || null,
      subject: student.subject || null,
      daypackages: student.daypackages || null,
      classfee: student.classfee || null,
      classfeeCurrency: student.classfeeCurrency || null,
      country: student.country || null,
      progress: student.progress || null,
      chatId: student.chatId || null,
      controller: student.u_control ? controllerMap[student.u_control] : null,
      controllerCode: student.u_control || null,
    }));

    return NextResponse.json({
      students: formattedStudents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin students API error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      search,
      status,
      packageFilter,
      subjectFilter,
      countryFilter,
      ustazFilter,
      progressFilter,
      regDateFrom,
      regDateTo,
      startDateFrom,
      startDateTo,
      feeMin,
      feeMax,
      page,
      limit,
    });
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
