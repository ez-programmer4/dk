import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user has access to this school
  if (session.schoolSlug !== params.schoolSlug) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const schoolId = session.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: "No school access" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const hasDateFilter = startDate && endDate;

    const paymentWhere = {
      paymentdate: hasDateFilter ? dateFilter : undefined,
      schoolId: schoolId, // Filter by school
    };
    const studentWhere = {
      registrationdate: hasDateFilter ? dateFilter : undefined,
      schoolId: schoolId, // Filter by school
    };

    const [studentCount, payments, pendingPaymentCount] =
      await prisma.$transaction([
        prisma.wpos_wpdatatable_23.count({
          where: { schoolId: schoolId }
        }),
        prisma.payment.findMany({
          where: paymentWhere,
          select: { status: true, paidamount: true },
        }),
        prisma.payment.count({
          where: {
            status: "pending",
            schoolId: schoolId,
            ...(hasDateFilter && { paymentdate: dateFilter }),
          },
        }),
      ]);

    const adminCount = await prisma.admin.count({
      where: { schoolId: schoolId }
    });
    const controllerCount = await prisma.wpos_wpdatatable_28.count({
      where: { schoolId: schoolId }
    });
    const teacherCount = await prisma.wpos_wpdatatable_24.count({
      where: { schoolId: schoolId }
    });
    const registralCount = await prisma.wpos_wpdatatable_33.count({
      where: { schoolId: schoolId }
    });

    const totalRevenue = payments.reduce(
      (sum: number, payment: any) => {
        if (payment.status === "Approved") {
          return sum + (payment.paidamount || 0);
        }
        return sum;
      },
      0
    );

    const pendingPaymentAmount = await prisma.payment.aggregate({
      where: {
        status: "pending",
        schoolId: schoolId,
        ...(hasDateFilter && { paymentdate: dateFilter }),
      },
      _sum: {
        paidamount: true,
      },
    });

    const paymentCount = payments.length;
    const rejectedPayments = payments.filter((p: any) => p.status === "Rejected").length;
    const approvedPayments = payments.filter((p: any) => p.status === "Approved").length;
    const pendingPayments = payments.filter((p: any) => p.status === "pending").length;

    return NextResponse.json({
      admins: adminCount,
      controllers: controllerCount,
      teachers: teacherCount,
      registrars: registralCount,
      students: studentCount,
      totalRevenue: {
        approved: approvedPayments,
        pending: pendingPayments,
        rejected: rejectedPayments,
      },
      paymentCount,
      pendingPaymentCount,
      pendingPaymentAmount: pendingPaymentAmount._sum.paidamount || 0,
    });
  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

