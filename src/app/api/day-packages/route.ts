import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolSlug = searchParams.get("schoolSlug");

    if (!schoolSlug) {
      return NextResponse.json(
        { message: "schoolSlug parameter is required" },
        { status: 400 }
      );
    }

    // Get school by slug
    let school = await prisma.school.findFirst({
      where: { slug: schoolSlug },
      select: { id: true, name: true },
    });

    // Fallback for backward compatibility if slug doesn't match
    if (!school && schoolSlug !== "darulkubra") {
      school = await prisma.school.findUnique({
        where: { id: schoolSlug },
        select: { id: true, name: true },
      });
    }

    if (!school) {
      return NextResponse.json(
        { message: "School not found" },
        { status: 404 }
      );
    }

    // Fetch active day packages for the school
    const dayPackages = await prisma.studentdaypackage.findMany({
      where: {
        isActive: true,
        schoolId: school.id
      },
      orderBy: { name: "asc" },
      select: { name: true }
    });

    return NextResponse.json({
      dayPackages: dayPackages.map(dp => dp.name)
    });

  } catch (error) {
    console.error("Error fetching day packages:", error);
    return NextResponse.json(
      { message: "Failed to fetch day packages" },
      { status: 500 }
    );
  }
}