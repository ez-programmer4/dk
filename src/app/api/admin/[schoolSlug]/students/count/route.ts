import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const schoolSlug = params.schoolSlug;
  let schoolId = schoolSlug === 'darulkubra' ? null : null; // Default to null for darulkubra

  // For non-darulkubra schools, look up the actual school ID
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

  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!session || !["admin", "registral"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const registral = searchParams.get("registral") || "";

    // Build WHERE conditions for count
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    // School filtering
    whereConditions.push(`schoolId ${schoolId ? `= '${schoolId}'` : 'IS NULL'}`);

    // For registral users, only show their students
    if (session.role === "registral") {
    // For registral users, only show their students
    if (session.role === "registral") {
      const registralName = session.name || session.username || (session as any).user?.name || (session as any).user?.username;
      if (registralName) {
        whereConditions.push(`rigistral = ?`);
        queryParams.push(registralName);
      }
    } else if (registral) {
      // Admin can filter by registral if specified
      whereConditions.push(`rigistral = ?`);
      queryParams.push(registral);
    }
    } else if (registral) {
      // Admin can filter by registral if specified
      whereConditions.push(`rigistral = ?`);
      queryParams.push(registral);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const countQuery = `
      SELECT COUNT(*) as total
      FROM wpos_wpdatatable_23
      ${whereClause}
    `;

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...queryParams);
    const total = Number((countResult as any)[0]?.total || 0);

    // Get active count
    const activeWhereConditions = [...whereConditions];
    activeWhereConditions.push(`status IN ('Active', 'active')`);
    const activeWhereClause = activeWhereConditions.length > 0
      ? `WHERE ${activeWhereConditions.join(" AND ")}`
      : "";

    const activeCountQuery = `
      SELECT COUNT(*) as active
      FROM wpos_wpdatatable_23
      ${activeWhereClause}
    `;

    const activeCountResult = await prisma.$queryRawUnsafe(activeCountQuery, ...queryParams);
    const active = Number((activeCountResult as any)[0]?.active || 0);

    return NextResponse.json({
      total,
      active,
    });
  } catch (error) {
    console.error("Admin students count API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
