import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user has registral role
    if (session.role !== "registral") {
      return NextResponse.json(
        { error: "Forbidden - Registral role required" },
        { status: 403 }
      );
    }

    const schoolSlug = params.schoolSlug;
    const registralName = session.name || session.username;

    // Determine schoolId for filtering
    const schoolId = schoolSlug === "darulkubra" ? null : schoolSlug;

    // Check if user has access to this school
    if (session.schoolSlug && session.schoolSlug !== schoolSlug) {
      return NextResponse.json(
        { error: "Forbidden - Access to this school not allowed" },
        { status: 403 }
      );
    }

    // Validate registral name
    if (!registralName) {
      return NextResponse.json(
        { error: "Registral name not found in session" },
        { status: 400 }
      );
    }

    // Get total students registered by this registral
    const totalStudentsQuery = `
      SELECT COUNT(*) as count
      FROM wpos_wpdatatable_23
      WHERE rigistral = ?
        ${schoolId ? `AND schoolId = ?` : `AND (schoolId IS NULL OR schoolId = '')`}
    `;

    const totalStudentsResult = (await prisma.$queryRawUnsafe(
      totalStudentsQuery,
      registralName,
      ...(schoolId ? [schoolId] : [])
    )) as any[];

    // Get active students
    const activeStudentsQuery = `
      SELECT COUNT(*) as count
      FROM wpos_wpdatatable_23
      WHERE rigistral = ?
        AND status IN ('Active', 'Not yet')
        ${schoolId ? `AND schoolId = ?` : `AND (schoolId IS NULL OR schoolId = '')`}
    `;

    const activeStudentsResult = (await prisma.$queryRawUnsafe(
      activeStudentsQuery,
      registralName,
      ...(schoolId ? [schoolId] : [])
    )) as any[];

    // Get completed students
    const completedStudentsQuery = `
      SELECT COUNT(*) as count
      FROM wpos_wpdatatable_23
      WHERE rigistral = ?
        AND status = 'Completed'
        ${schoolId ? `AND schoolId = ?` : `AND (schoolId IS NULL OR schoolId = '')`}
    `;

    const completedStudentsResult = (await prisma.$queryRawUnsafe(
      completedStudentsQuery,
      registralName,
      ...(schoolId ? [schoolId] : [])
    )) as any[];

    // Get total revenue
    const revenueQuery = `
      SELECT COALESCE(SUM(classfee), 0) as total
      FROM wpos_wpdatatable_23
      WHERE rigistral = ?
        AND classfee IS NOT NULL
        ${schoolId ? `AND schoolId = ?` : `AND (schoolId IS NULL OR schoolId = '')`}
    `;

    const revenueResult = (await prisma.$queryRawUnsafe(
      revenueQuery,
      registralName,
      ...(schoolId ? [schoolId] : [])
    )) as any[];

    // Get recent registrations (last 10)
    const recentQuery = `
      SELECT
        wdt_ID as id,
        name,
        registrationdate,
        status
      FROM wpos_wpdatatable_23
      WHERE rigistral = ?
        ${schoolId ? `AND schoolId = ?` : `AND (schoolId IS NULL OR schoolId = '')`}
      ORDER BY registrationdate DESC
      LIMIT 10
    `;

    const recentResult = (await prisma.$queryRawUnsafe(
      recentQuery,
      registralName,
      ...(schoolId ? [schoolId] : [])
    )) as any[];

    // Calculate metrics
    const totalStudents = Number(totalStudentsResult[0]?.count || 0);
    const activeStudents = Number(activeStudentsResult[0]?.count || 0);
    const completedStudents = Number(completedStudentsResult[0]?.count || 0);
    const totalRevenue = Number(revenueResult[0]?.total || 0);
    const averageFee = totalStudents > 0 ? Math.round(totalRevenue / totalStudents) : 0;
    const conversionRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

    // Get top package
    const topPackageQuery = `
      SELECT package, COUNT(*) as count
      FROM wpos_wpdatatable_23
      WHERE rigistral = ?
        AND package IS NOT NULL
        ${schoolId ? `AND schoolId = ?` : `AND (schoolId IS NULL OR schoolId = '')`}
      GROUP BY package
      ORDER BY count DESC
      LIMIT 1
    `;

    const topPackageResult = (await prisma.$queryRawUnsafe(
      topPackageQuery,
      registralName,
      ...(schoolId ? [schoolId] : [])
    )) as any[];

    const topPackage = topPackageResult[0]?.package || "N/A";

    // Mock monthly growth (would need historical data for real calculation)
    const monthlyGrowth = 12.5;

    // Format recent activity
    const recentActivity = recentResult.map((student: any) => ({
      id: student.id,
      action: "Student registered",
      date: student.registrationdate ? new Date(student.registrationdate).toISOString().split('T')[0] : "N/A",
      studentName: student.name || "Unknown"
    }));

    const analytics = {
      totalStudents,
      activeStudents,
      completedStudents,
      totalRevenue,
      monthlyGrowth,
      conversionRate,
      averageFee,
      topPackage,
      recentActivity
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching registral analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
