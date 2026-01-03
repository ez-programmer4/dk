import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "controller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current month start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get deposits for students under this controller for current month
    const deposits = await prisma.payment.findMany({
      where: {
        paymentdate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        wpos_wpdatatable_23: {
          u_control: session.code as string,
        },
      },
      select: {
        id: true,
        studentid: true,
        studentname: true,
        paymentdate: true,
        transactionid: true,
        paidamount: true,
        reason: true,
        status: true,
        source: true,
        providerReference: true,
        wpos_wpdatatable_23: {
          select: {
            classfeeCurrency: true,
          },
        },
      },
      orderBy: {
        paymentdate: "desc",
      },
    });

    // Get monthly payments that were created from deposits (have paymentId linking to deposits)
    const monthlyPaymentsFromDeposits = await prisma.months_table.findMany({
      where: {
        paymentId: {
          in: deposits.map((d) => d.id),
        },
        wpos_wpdatatable_23: {
          u_control: session.code as string,
        },
      },
      select: {
        id: true,
        studentid: true,
        month: true,
        paid_amount: true,
        payment_status: true,
        payment_type: true,
        source: true,
        providerReference: true,
        paymentId: true,
        wpos_wpdatatable_23: {
          select: {
            name: true,
            classfeeCurrency: true,
          },
        },
        payment: {
          select: {
            id: true,
            studentname: true,
            transactionid: true,
            paymentdate: true,
          },
        },
      },
      orderBy: {
        month: "desc",
      },
    });

    // Transform the data to match the expected format
    const transformedDeposits = deposits.map((deposit, index) => ({
      id: index + 1,
      paymentId: deposit.id,
      studentid: deposit.studentid,
      studentname: deposit.studentname,
      paymentdate: deposit.paymentdate.toISOString(),
      transactionid: deposit.transactionid,
      paidamount: Number(deposit.paidamount),
      reason: deposit.reason,
      status: deposit.status,
      source: deposit.source,
      providerReference: deposit.providerReference,
      currency: deposit.wpos_wpdatatable_23?.classfeeCurrency || "ETB",
    }));

    // Transform monthly payments from deposits
    const transformedMonthlyPayments = monthlyPaymentsFromDeposits.map((mp) => ({
      id: mp.id,
      studentid: mp.studentid,
      studentname: mp.wpos_wpdatatable_23?.name || mp.payment?.studentname || "Unknown",
      month: mp.month,
      paid_amount: Number(mp.paid_amount),
      payment_status: mp.payment_status,
      payment_type: mp.payment_type,
      source: mp.source,
      providerReference: mp.providerReference,
      depositPaymentId: mp.paymentId,
      depositTransactionId: mp.payment?.transactionid,
      depositDate: mp.payment?.paymentdate?.toISOString(),
      currency: mp.wpos_wpdatatable_23?.classfeeCurrency || "ETB",
    }));

    return NextResponse.json({
      deposits: transformedDeposits,
      monthlyPayments: transformedMonthlyPayments,
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
    });
  } catch (error) {
    console.error("Controller deposits API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
