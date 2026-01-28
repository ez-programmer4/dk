import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
  const user = session.user as { id: string };
  const admin = await prisma.admin.findUnique({
    where: { id: user.id },
    select: { schoolId: true },
  });

  if (!admin || admin.schoolId !== school.id) {
    return NextResponse.json(
      { error: "Unauthorized access to school" },
      { status: 403 }
    );
  }

  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const teacherId = url.searchParams.get("teacherId");
    const deductionType = url.searchParams.get("deductionType");

    // Build where clause
    const where: any = { schoolId: school.id };
    if (teacherId) where.teacherId = teacherId;
    if (deductionType) where.deductionType = deductionType;

    // Get recent waiver records
    const waivers = await prisma.deduction_waivers.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get teacher names
    const teacherIds = [...new Set(waivers.map((w) => w.teacherId))];
    const teachers = await prisma.wpos_wpdatatable_24.findMany({
      where: { ustazid: { in: teacherIds }, schoolId: school.id },
      select: { ustazid: true, ustazname: true },
    });

    const teacherMap = Object.fromEntries(
      teachers.map((t) => [t.ustazid, t.ustazname])
    );

    // Format response
    const formattedWaivers = waivers.map((waiver) => ({
      id: waiver.id,
      teacherId: waiver.teacherId,
      teacherName: teacherMap[waiver.teacherId] || "Unknown",
      deductionType: waiver.deductionType,
      deductionDate: waiver.deductionDate,
      originalAmount: Number(waiver.originalAmount),
      reason: waiver.reason,
      adminId: waiver.adminId,
      createdAt: waiver.createdAt,
    }));

    return NextResponse.json({ waivers: formattedWaivers });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch waiver history" },
      { status: 500 }
    );
  }
}
