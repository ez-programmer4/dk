import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    // Fallback secret for development if NEXTAUTH_SECRET is not set
    const secret =
      process.env.NEXTAUTH_SECRET || "fallback-secret-for-development";

    const session = await getToken({ req, secret });

    if (!session) {
      return NextResponse.json({ error: "No session token" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    // Verify the user has access to this school
    if (session.schoolSlug !== params.schoolSlug) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const schoolId = session.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "No school access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const hasDateFilter = startDate && endDate;

    // 1. Revenue Over Time (monthly) - filtered by school
    const revenueData = await prisma.$queryRaw<{ paymentdate: Date; _sum_paidamount: any }[]>`
      SELECT
        DATE(p.paymentdate) as paymentdate,
        SUM(p.paidamount) as _sum_paidamount
      FROM wpos_wpdatatable_29 p
      JOIN wpos_wpdatatable_23 s ON p.studentid = s.wdt_ID
      WHERE p.status = 'Approved'
        AND s.schoolId = ${schoolId}
        ${hasDateFilter ? `AND p.paymentdate >= ${new Date(startDate!)} AND p.paymentdate <= ${new Date(endDate!)}` : ''}
      GROUP BY DATE(p.paymentdate)
      ORDER BY DATE(p.paymentdate) ASC
    `;

    // Transform the raw query result to match expected format
    const formattedRevenueData = revenueData.map(item => ({
      paymentdate: item.paymentdate,
      _sum: {
        paidamount: Number(item._sum_paidamount) || 0,
      },
    }));

    // 2. Student Registrations Over Time - filtered by school
    const registrationData = await prisma.wpos_wpdatatable_23.groupBy({
      by: ["registrationdate"],
      _count: {
        wdt_ID: true,
      },
      where: {
        schoolId: schoolId,
        registrationdate: hasDateFilter ? dateFilter : undefined,
      },
      orderBy: {
        registrationdate: "asc",
      },
    });

    // 3. Payment Status Breakdown - filtered by school
    const paymentStatusData = await prisma.$queryRaw<{ status: string; _count_id: any }[]>`
      SELECT
        p.status,
        COUNT(p.id) as _count_id
      FROM wpos_wpdatatable_29 p
      JOIN wpos_wpdatatable_23 s ON p.studentid = s.wdt_ID
      WHERE s.schoolId = ${schoolId}
        ${hasDateFilter ? `AND p.paymentdate >= ${new Date(startDate!)} AND p.paymentdate <= ${new Date(endDate!)}` : ''}
      GROUP BY p.status
    `;

    // Transform the raw query result to match expected format
    const formattedPaymentStatusData = paymentStatusData.map(item => ({
      status: item.status,
      _count: {
        id: Number(item._count_id) || 0,
      },
    }));

    // Process monthly revenue data
    const monthlyRevenue: Record<string, number> = {};
    formattedRevenueData.forEach((item: any) => {
      if (item.paymentdate) {
        const month = item.paymentdate.toISOString().slice(0, 7); // YYYY-MM format
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (item._sum.paidamount || 0);
      }
    });

    // Process monthly registration data
    const monthlyRegistrations: Record<string, number> = {};
    registrationData.forEach((item: any) => {
      if (item.registrationdate) {
        const month = item.registrationdate.toISOString().slice(0, 7); // YYYY-MM format
        monthlyRegistrations[month] = (monthlyRegistrations[month] || 0) + (item._count.wdt_ID || 0);
      }
    });

    // Process payment status breakdown
    const paymentStatusBreakdown = formattedPaymentStatusData.map((item: any) => ({
      name: item.status,
      value: item._count.id,
    }));

    return NextResponse.json({
      monthlyRevenue,
      monthlyRegistrations,
      paymentStatusBreakdown,
    });
  } catch (error) {
    console.error("Admin analytics API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
