import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/student/payments/history
 * Get payment history for a student (via chatId or studentId)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const studentId = searchParams.get("studentId");

    if (!chatId && !studentId) {
      return NextResponse.json(
        { error: "chatId or studentId is required" },
        { status: 400 }
      );
    }

    // Find student
    const student = await prisma.wpos_wpdatatable_23.findFirst({
      where: {
        ...(chatId ? { chatId } : {}),
        ...(studentId ? { wdt_ID: parseInt(studentId) } : {}),
      },
      select: {
        wdt_ID: true,
        classfeeCurrency: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const currency = student.classfeeCurrency || "ETB";

    // Get all payments (deposits)
    const payments = await prisma.payment.findMany({
      where: {
        studentid: student.wdt_ID,
      },
      select: {
        id: true,
        paidamount: true,
        reason: true,
        paymentdate: true,
        status: true,
        transactionid: true,
        source: true,
        intent: true,
        currency: true,
        providerReference: true,
      },
      orderBy: {
        paymentdate: "desc",
      },
      take: 50, // Limit to last 50 payments
    });

    // Get monthly payments from months_table
    const monthlyPayments = await prisma.months_table.findMany({
      where: {
        studentid: student.wdt_ID,
        paymentId: {
          not: null,
        },
      },
      select: {
        id: true,
        month: true,
        paid_amount: true,
        payment_status: true,
        payment_type: true,
        paymentId: true,
        source: true,
        providerReference: true,
        start_date: true,
      },
      orderBy: {
        month: "desc",
      },
      take: 50,
    });

    // Format response
    const history = {
      deposits: payments.map((p) => ({
        id: p.id,
        type: "deposit",
        amount: Number(p.paidamount),
        currency: p.currency || currency,
        status: p.status,
        date: p.paymentdate.toISOString(),
        transactionId: p.transactionid,
        providerReference: p.providerReference,
        source: p.source,
        intent: p.intent,
        reason: p.reason,
      })),
      monthlyPayments: monthlyPayments.map((mp) => ({
        id: mp.id,
        type: "monthly",
        month: mp.month,
        amount: Number(mp.paid_amount),
        currency: currency,
        status: mp.payment_status,
        paymentType: mp.payment_type,
        paymentId: mp.paymentId,
        source: mp.source,
        providerReference: mp.providerReference,
        date: mp.start_date?.toISOString() || new Date().toISOString(),
      })),
    };

    // Combine and sort by date
    const allPayments = [
      ...history.deposits.map((d) => ({ ...d, sortDate: new Date(d.date) })),
      ...history.monthlyPayments.map((m) => ({ ...m, sortDate: new Date(m.date) })),
    ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

    return NextResponse.json({
      success: true,
      history: {
        all: allPayments.slice(0, 50), // Return combined last 50
        deposits: history.deposits,
        monthlyPayments: history.monthlyPayments,
        summary: {
          totalDeposits: history.deposits.length,
          totalMonthlyPayments: history.monthlyPayments.length,
          currency,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/student/payments/history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}

