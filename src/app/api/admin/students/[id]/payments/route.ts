import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = parseInt(params.id);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    // Get monthly payments
    const monthlyPayments = await prisma.months_table.findMany({
      where: { studentid: studentId },
      orderBy: { start_date: "desc" },
    });

    // Get direct payments
    const directPayments = await prisma.payment.findMany({
      where: { studentid: studentId },
      orderBy: { paymentdate: "desc" },
    });

    // Calculate statistics
    const totalMonthlyPaid = monthlyPayments
      .filter((p) => p.payment_status === "Paid" && p.paid_amount)
      .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

    const totalDirectPaid = directPayments
      .filter((p) => p.status === "completed" && p.paidamount)
      .reduce((sum, p) => sum + Number(p.paidamount || 0), 0);

    const totalPaid = totalMonthlyPaid + totalDirectPaid;
    const paidMonths = monthlyPayments.filter((p) => p.payment_status === "Paid").length;
    const pendingMonths = monthlyPayments.filter((p) => p.payment_status === "pending").length;

    return NextResponse.json({
      monthlyPayments: monthlyPayments.map((payment) => ({
        id: payment.id,
        month: payment.month,
        paid_amount: payment.paid_amount ? Number(payment.paid_amount) : 0,
        payment_status: payment.payment_status,
        payment_type: payment.payment_type,
        start_date: payment.start_date?.toISOString() || null,
        end_date: payment.end_date?.toISOString() || null,
        source: payment.source || null,
      })),
      directPayments: directPayments.map((payment) => ({
        id: payment.id,
        paymentdate: payment.paymentdate.toISOString(),
        paidamount: Number(payment.paidamount || 0),
        status: payment.status,
        paymentmethod: payment.source || "manual", // Use source field instead of paymentmethod
        transactionid: payment.transactionid,
        notes: payment.reason || null, // Use reason field instead of notes
        currency: payment.currency || "ETB",
        providerReference: payment.providerReference || null,
      })),
      statistics: {
        totalPaid,
        totalMonthlyPaid,
        totalDirectPaid,
        paidMonths,
        pendingMonths,
        totalMonths: monthlyPayments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

