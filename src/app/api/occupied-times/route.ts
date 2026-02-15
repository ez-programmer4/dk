import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const schoolSlug = searchParams.get("schoolSlug");
    const dayPackage = searchParams.get("dayPackage");

    // Handle the case where we want occupied times for a school and day package
    if (schoolSlug && dayPackage) {
      // Get school ID for multi-tenancy
      const school = await prisma.school.findUnique({
        where: { slug: schoolSlug },
        select: { id: true },
      });

      if (!school) {
        return NextResponse.json({ message: "School not found" }, { status: 404 });
      }

      const occupiedTimes = await prisma.wpos_ustaz_occupied_times.findMany({
        where: {
          daypackage: dayPackage,
          schoolId: school.id,
        },
        select: {
          time_slot: true,
          daypackage: true,
          student_id: true,
        },
      });

      return NextResponse.json(
        { occupiedTimes },
        { status: 200 }
      );
    }

    // Handle the original case for a specific student
    if (!studentId) {
      return NextResponse.json(
        { message: "Student ID is required" },
        { status: 400 }
      );
    }

    const occupiedTime = await prisma.wpos_ustaz_occupied_times.findFirst({
      where: { student_id: parseInt(studentId) },
      select: { time_slot: true },
    });

    if (!occupiedTime) {
      return NextResponse.json(
        { message: "No occupied time found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { time_slot: occupiedTime.time_slot },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Error fetching occupied time",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
