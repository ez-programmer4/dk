import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

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
    const schoolSlug = searchParams.get("schoolSlug");

    if (!schoolSlug) {
      return NextResponse.json(
        { message: "School slug is required" },
        { status: 400 }
      );
    }

    // Get school ID from slug
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true },
    });

    if (!school) {
      return NextResponse.json(
        { message: "School not found" },
        { status: 404 }
      );
    }

    // Filter teachers by school
    const teachers = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        schoolId: school.id,
      },
      select: {
        ustazid: true,
        ustazname: true,
        schedule: true,
        controller: {
          select: { code: true },
        },
      },
      orderBy: {
        ustazname: "asc",
      },
    });

    return NextResponse.json(teachers, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Error fetching teachers",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
