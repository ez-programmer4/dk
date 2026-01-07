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

    const { searchParams } = new URL(request.url);
    const month =
      searchParams.get("month") || new Date().toISOString().slice(0, 7);
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

    // Get successful registrations (started + paid in same month)
    const successQuery = `
      SELECT
        s.wdt_ID,
        s.subject
      FROM wpos_wpdatatable_23 s
      JOIN months_table m ON s.wdt_ID = m.studentid
      WHERE s.rigistral = ?
        AND (s.refer IS NULL OR s.refer = '')
        AND DATE_FORMAT(s.startdate, '%Y-%m') = ?
        AND s.status IN ('Active', 'Not yet')
        AND m.month = ?
        AND (UPPER(m.payment_status) IN ('PAID','COMPLETE','SUCCESS') OR m.is_free_month = 1)
        ${schoolId ? `AND s.schoolId = ?` : `AND (s.schoolId IS NULL OR s.schoolId = '')`}
    `;

    const successResults = (await prisma.$queryRawUnsafe(
      successQuery,
      registralName,
      month,
      month,
      ...(schoolId ? [schoolId] : [])
    )) as any[];

    // Get total registrations in month (only Active and Not yet statuses, excluding referrals)
    const totalQuery = `
      SELECT COUNT(*) as count
      FROM wpos_wpdatatable_23
      WHERE rigistral = ?
        AND (refer IS NULL OR refer = '')
        AND DATE_FORMAT(registrationdate, '%Y-%m') = ?
        AND status IN ('Active', 'Not yet')
        ${schoolId ? `AND schoolId = ?` : `AND (schoolId IS NULL OR schoolId = '')`}
    `;

    const totalResult = (await prisma.$queryRawUnsafe(
      totalQuery,
      registralName,
      month,
      ...(schoolId ? [schoolId] : [])
    )) as any[];

    // Calculate not success count (total registrations - successful registrations)
    const notSuccessCount =
      Number(totalResult[0]?.count || 0) - successResults.length;

    // Calculate stats
    const stats = {
      registral: registralName,
      totalReg: Number(totalResult[0]?.count || 0),
      successReg: successResults.length,
      reading: 0,
      hifz: 0,
      notSuccess: notSuccessCount,
      reward: 0,
      level: null as string | null,
    };

    // Count reading and hifz from successful registrations
    successResults.forEach((result: any) => {
      if (result.subject && ["Nethor", "Qaidah"].includes(result.subject)) {
        stats.reading++;
      } else if (result.subject === "Hifz") {
        stats.hifz++;
      }
    });

    // Calculate reward
    stats.reward = stats.reading * 50 + stats.hifz * 100;

    // Determine level
    if (registralName === "Abdulrahim") {
      stats.level = "Level 1";
    } else if (registralName !== "Unsigned") {
      stats.level = "Level 2";
    }

    return NextResponse.json({
      earnings: stats.totalReg > 0 || stats.successReg > 0 ? stats : null,
      month,
    });
  } catch (error) {
    console.error("Error fetching registral earnings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




