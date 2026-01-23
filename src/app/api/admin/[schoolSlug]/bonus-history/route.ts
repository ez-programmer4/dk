import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  // Get school information and verify access
  const { prisma } = await import("@/lib/prisma");
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true },
  });

  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.id as string },
    select: { schoolId: true },
  });

  if (!admin || admin.schoolId !== school.id) {
    return NextResponse.json({ error: "Unauthorized access to school" }, { status: 403 });
  }
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const teacherId = url.searchParams.get("teacherId");

  if (!teacherId) {
    return NextResponse.json(
      { error: "Missing teacherId parameter" },
      { status: 400 }
    );
  }

  try {
    const bonusRecords = await prisma.qualityassessment.findMany({
      where: {
        teacherId,
        bonusAwarded: { gt: 0 },
        schoolId: school.id,
      },
      select: {
        bonusAwarded: true,
        weekStart: true,
        overallQuality: true,
      },
      orderBy: {
        weekStart: "desc",
      },
    });

    const bonuses = bonusRecords.map((record) => ({
      amount: record.bonusAwarded,
      period: new Date(record.weekStart).toLocaleDateString(),
      reason: `${record.overallQuality} Performance`,
    }));

    return NextResponse.json({ bonuses });
  } catch (error) {
    console.error("Bonus history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bonus history" },
      { status: 500 }
    );
  }
}
