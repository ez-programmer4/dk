import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const studentId = parseInt(params.id);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Build where conditions
    const whereConditions: any = {
      wdt_ID: studentId,
      ...(schoolId && { schoolId }),
    };

    if (startDate && endDate) {
      whereConditions.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const attendanceRecords = await prisma.student_attendance_progress.findMany({
      where: whereConditions,
      orderBy: { date: "desc" },
      take: limit,
      include: {
        student: {
          select: {
            name: true,
            subject: true,
            daypackages: true,
          },
        },
      },
    });

    return NextResponse.json({
      attendance: attendanceRecords,
      total: attendanceRecords.length,
    });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

















