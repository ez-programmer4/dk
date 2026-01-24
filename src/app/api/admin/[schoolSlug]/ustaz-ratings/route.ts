import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get school information and verify access
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true },
  });

  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.id as string },
    select: { schoolId: true },
  });

  if (!admin || admin.schoolId !== school.id) {
    return NextResponse.json({ error: "Unauthorized access to school" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "2024-01-01";
    const to = searchParams.get("to") || "2024-12-31";
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get teacher ratings based on quality assessments
    const teacherRatings = await prisma.qualityassessment.groupBy({
      by: ["teacherId"],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: limit,
    });

    // Get teacher details and transform the data
    const ratingsWithDetails = await Promise.all(
      teacherRatings.map(async (rating) => {
        const teacher = await prisma.wpos_wpdatatable_24.findUnique({
          where: { ustazid: rating.teacherId },
          select: { ustazname: true },
        });

        // Get the latest quality assessment for this teacher
        const latestAssessment = await prisma.qualityassessment.findFirst({
          where: { teacherId: rating.teacherId },
          orderBy: { createdAt: "desc" },
          select: { overallQuality: true },
        });

        return {
          ustazname: teacher?.ustazname || "Unknown",
          name: teacher?.ustazname || "Unknown",
          quality: latestAssessment?.overallQuality || "Unknown",
          rating: latestAssessment?.overallQuality || "Unknown",
          assessmentCount: rating._count.id || 0,
        };
      })
    );

    return NextResponse.json(ratingsWithDetails);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
