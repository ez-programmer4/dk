import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolSlug = searchParams.get("schoolSlug");
    const schoolId = schoolSlug === "darulkubra" ? null : schoolSlug;

    const [statuses, packages, subjects, daypackages] = await Promise.all([
      prisma.studentStatus.findMany({
        where: {
          isActive: true,
          ...(schoolId ? { schoolId } : { schoolId: null }),
        },
        orderBy: { name: "asc" },
      }),
      prisma.studentPackage.findMany({
        where: {
          isActive: true,
          ...(schoolId ? { schoolId } : { schoolId: null }),
        },
        orderBy: { name: "asc" },
      }),
      prisma.studentSubject.findMany({
        where: {
          isActive: true,
          ...(schoolId ? { schoolId } : { schoolId: null }),
        },
        orderBy: { name: "asc" },
      }),
      prisma.studentdaypackage.findMany({
        where: {
          isActive: true,
          ...(schoolId ? { schoolId } : { schoolId: null }),
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      statuses,
      packages,
      subjects,
      daypackages,
    });
  } catch (error) {
    console.error("Error fetching student configurations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
