import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolSlug = searchParams.get("schoolSlug");
    const dayPackage = searchParams.get("dayPackage");
    const timeSlot = searchParams.get("timeSlot");
    const ustazId = searchParams.get("ustazId");

    // Determine schoolId
    let schoolId = schoolSlug === 'darulkubra' ? null : null;
    if (schoolSlug !== 'darulkubra') {
      try {
        const school = await prisma.school.findUnique({
          where: { slug: schoolSlug },
          select: { id: true }
        });
        schoolId = school?.id || null;
      } catch (error) {
        console.error("Error looking up school:", error);
        schoolId = null;
      }
    }

    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    // School filtering
    whereConditions.push(`schoolId ${schoolId ? `= '${schoolId}'` : 'IS NULL'}`);

    // Only check active occupations (no end_at or future end_at)
    whereConditions.push(`(end_at IS NULL OR end_at > NOW())`);

    // Filter by parameters if provided
    if (dayPackage) {
      whereConditions.push(`daypackage = ?`);
      queryParams.push(dayPackage);
    }

    if (timeSlot) {
      whereConditions.push(`time_slot = ?`);
      queryParams.push(timeSlot);
    }

    if (ustazId) {
      whereConditions.push(`ustaz_id = ?`);
      queryParams.push(ustazId);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const occupiedQuery = `
      SELECT
        id,
        ustaz_id,
        time_slot,
        daypackage,
        student_id,
        occupied_at,
        end_at
      FROM wpos_ustaz_occupied_times
      ${whereClause}
      ORDER BY occupied_at DESC
    `;

    const occupiedTimes = await prisma.$queryRawUnsafe(occupiedQuery, ...queryParams);

    return NextResponse.json({
      occupiedTimes,
      totalOccupied: (occupiedTimes as any[]).length
    });
  } catch (error) {
    console.error("Occupied times API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ustazId, timeSlot, dayPackage, studentId, schoolSlug } = await request.json();

    // Determine schoolId
    let schoolId = schoolSlug === 'darulkubra' ? null : null;
    if (schoolSlug !== 'darulkubra') {
      try {
        const school = await prisma.school.findUnique({
          where: { slug: schoolSlug },
          select: { id: true }
        });
        schoolId = school?.id || null;
      } catch (error) {
        console.error("Error looking up school:", error);
        schoolId = null;
      }
    }

    // Check if this time slot is already occupied
    const existingOccupation = await prisma.$queryRawUnsafe(`
      SELECT id FROM wpos_ustaz_occupied_times
      WHERE ustaz_id = ?
        AND time_slot = ?
        AND daypackage = ?
        AND schoolId ${schoolId ? `= '${schoolId}'` : 'IS NULL'}
        AND (end_at IS NULL OR end_at > NOW())
    `, ustazId, timeSlot, dayPackage);

    if ((existingOccupation as any[]).length > 0) {
      return NextResponse.json(
        { error: "This time slot is already occupied" },
        { status: 409 }
      );
    }

    // Create new occupation
    const occupation = await prisma.wpos_ustaz_occupied_times.create({
      data: {
        ustaz_id: ustazId,
        time_slot: timeSlot,
        daypackage: dayPackage,
        student_id: studentId,
        schoolId: schoolId,
        occupied_at: new Date(),
      }
    });

    return NextResponse.json({ occupation });
  } catch (error) {
    console.error("Create occupied time API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}