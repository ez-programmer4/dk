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
    // Get unique time slots from occupied times
    const occupiedTimes = await prisma.wpos_ustaz_occupied_times.findMany({
      where: { schoolId: school.id },
      select: { time_slot: true },
      distinct: ['time_slot']
    });

    const timeSlots = occupiedTimes
      .map(ot => ot.time_slot)
      .filter(Boolean)
      .sort();

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error("Failed to fetch time slots:", error);
    return NextResponse.json({ error: "Failed to fetch time slots" }, { status: 500 });
  }
}
