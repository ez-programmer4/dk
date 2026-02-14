import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    console.log(`School status API called for schoolId: ${params.schoolId}`);

    // Verify super admin authentication
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    console.log(`Token role: ${token?.role}`);

    if (!token || token.role !== "superAdmin") {
      console.log('Unauthorized access attempt');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { schoolId } = params;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period");

    console.log(`Fetching payment status for school ${schoolId}, period ${period}`);

    if (!period) {
      return NextResponse.json(
        { success: false, error: "Period parameter is required" },
        { status: 400 }
      );
    }

    // First check if school has any payments at all
    const anyPayments = await prisma.schoolPayment.findFirst({
      where: {
        schoolId: schoolId,
      },
      select: {
        id: true,
        period: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`School ${schoolId} has any payments:`, anyPayments);

    // Get payment for this school and period
    console.log(`Querying payments for schoolId: ${schoolId}, period: ${period}`);
    const payment = await prisma.schoolPayment.findFirst({
      where: {
        schoolId: schoolId,
        period: period,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        submittedAt: true,
        approvedAt: true,
        paidAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found payment for period ${period}:`, payment);

    if (!payment) {
      // If no payment for this period, check if there are payments for other periods
      const allPayments = await prisma.schoolPayment.findMany({
        where: {
          schoolId: schoolId,
        },
        select: {
          id: true,
          period: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      console.log(`All payments for school ${schoolId}:`, allPayments);

      return NextResponse.json({
        success: true,
        status: 'none',
        lastPaymentDate: null,
        daysOverdue: null,
        availablePeriods: allPayments.map(p => p.period),
      });
    }

    // Calculate days overdue if applicable
    let daysOverdue = null;
    if (payment.status === 'pending' || payment.status === 'generated') {
      const dueDate = new Date(payment.createdAt);
      dueDate.setDate(dueDate.getDate() + 30); // Assuming 30-day payment terms
      const today = new Date();

      if (today > dueDate) {
        daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Map status for better UI understanding
    let status = payment.status;
    if (payment.status === 'generated') {
      status = 'generated'; // Bill generated but not submitted
    } else if (payment.status === 'submitted') {
      status = 'submitted'; // Submitted for approval
    } else if (payment.status === 'paid') {
      status = 'approved'; // Payment completed
    } else if (payment.status === 'pending' && daysOverdue && daysOverdue > 0) {
      status = 'overdue'; // Overdue payment
    }

    return NextResponse.json({
      success: true,
      status,
      lastPaymentDate: payment.submittedAt || payment.createdAt,
      daysOverdue,
      paymentId: payment.id,
    });

  } catch (error) {
    console.error("School payment status fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
