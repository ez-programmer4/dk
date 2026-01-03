import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "controller") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const controllerCode = session.code || session.username || session.name;
    if (!controllerCode) {
      return NextResponse.json(
        { error: "Controller code not found" },
        { status: 404 }
      );
    }

    // Get all students for this controller
    const students = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        u_control: controllerCode,
        status: {
          in: ["Active", "active", "Not yet", "not yet", "Fresh", "fresh"],
        },
      },
      select: {
        wdt_ID: true,
        name: true,
        classfee: true,
        classfeeCurrency: true,
        startdate: true,
        status: true,
      },
    });

    const now = new Date();
    const currentMonth = format(now, "yyyy-MM");
    const lastMonthDate = subMonths(now, 1);
    const lastMonth = format(lastMonthDate, "yyyy-MM");
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(lastMonthDate);

    // Get all monthly payments for these students
    const studentIds = students.map((s) => s.wdt_ID);
    const allPayments = await prisma.months_table.findMany({
      where: {
        studentid: { in: studentIds },
        month: { in: [currentMonth, lastMonth] },
      },
      orderBy: {
        month: "desc",
      },
    });

    // Calculate current month stats
    const currentMonthPayments = allPayments.filter(
      (p) => p.month === currentMonth
    );
    const currentMonthPaidStudents = new Set(
      currentMonthPayments
        .filter((p) => p.payment_status === "Paid")
        .map((p) => p.studentid)
    );
    const currentMonthNotPaidStudents = students.filter(
      (s) => !currentMonthPaidStudents.has(s.wdt_ID)
    );

    // Calculate last month stats
    const lastMonthPayments = allPayments.filter(
      (p) => p.month === lastMonth
    );
    const lastMonthPaidStudents = new Set(
      lastMonthPayments
        .filter((p) => p.payment_status === "Paid")
        .map((p) => p.studentid)
    );
    const lastMonthNotPaidStudents = students.filter(
      (s) => !lastMonthPaidStudents.has(s.wdt_ID)
    );

    // Calculate payment amounts
    const currentMonthTotalPaid = currentMonthPayments
      .filter((p) => p.payment_status === "Paid")
      .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

    const lastMonthTotalPaid = lastMonthPayments
      .filter((p) => p.payment_status === "Paid")
      .reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

    // Calculate expected amounts
    const currentMonthExpected = students.reduce((sum, s) => {
      if (!s.classfee || !s.startdate) return sum;
      const startDate = new Date(s.startdate);
      const monthStart = currentMonthStart;
      
      // If student started before this month, full fee expected
      if (startDate < monthStart) {
        return sum + Number(s.classfee);
      }
      
      // If student started this month, prorated fee
      const daysInMonth = endOfMonth(monthStart).getDate();
      const daysFromStart = Math.max(
        0,
        daysInMonth - startDate.getDate() + 1
      );
      return sum + (Number(s.classfee) * daysFromStart) / daysInMonth;
    }, 0);

    const lastMonthExpected = students.reduce((sum, s) => {
      if (!s.classfee || !s.startdate) return sum;
      const startDate = new Date(s.startdate);
      const monthStart = lastMonthStart;
      
      if (startDate < monthStart) {
        return sum + Number(s.classfee);
      }
      
      if (
        startDate.getFullYear() === monthStart.getFullYear() &&
        startDate.getMonth() === monthStart.getMonth()
      ) {
        const daysInMonth = endOfMonth(monthStart).getDate();
        const daysFromStart = Math.max(
          0,
          daysInMonth - startDate.getDate() + 1
        );
        return sum + (Number(s.classfee) * daysFromStart) / daysInMonth;
      }
      
      return sum;
    }, 0);

    // Get student payment details
    const studentPaymentDetails = students.map((student) => {
      const currentPayment = currentMonthPayments.find(
        (p) => p.studentid === student.wdt_ID
      );
      const lastPayment = lastMonthPayments.find(
        (p) => p.studentid === student.wdt_ID
      );

      // Get all payments for progress calculation
      const allStudentPayments = allPayments.filter(
        (p) => p.studentid === student.wdt_ID
      );

      return {
        studentId: student.wdt_ID,
        studentName: student.name,
        currentMonth: {
          paid: currentPayment?.payment_status === "Paid",
          amount: currentPayment ? Number(currentPayment.paid_amount || 0) : 0,
          expected: student.classfee ? Number(student.classfee) : 0,
          status: currentPayment?.payment_status || "Not Paid",
        },
        lastMonth: {
          paid: lastPayment?.payment_status === "Paid",
          amount: lastPayment ? Number(lastPayment.paid_amount || 0) : 0,
          expected: student.classfee ? Number(student.classfee) : 0,
          status: lastPayment?.payment_status || "Not Paid",
        },
        totalPayments: allStudentPayments.filter(
          (p) => p.payment_status === "Paid"
        ).length,
        currency: student.classfeeCurrency || "ETB",
      };
    });

    return NextResponse.json({
      currentMonth: {
        month: currentMonth,
        paid: currentMonthPaidStudents.size,
        notPaid: currentMonthNotPaidStudents.length,
        total: students.length,
        totalPaid: currentMonthTotalPaid,
        totalExpected: currentMonthExpected,
        percentage: students.length > 0 
          ? Math.round((currentMonthPaidStudents.size / students.length) * 100)
          : 0,
      },
      lastMonth: {
        month: lastMonth,
        paid: lastMonthPaidStudents.size,
        notPaid: lastMonthNotPaidStudents.length,
        total: students.length,
        totalPaid: lastMonthTotalPaid,
        totalExpected: lastMonthExpected,
        percentage: students.length > 0
          ? Math.round((lastMonthPaidStudents.size / students.length) * 100)
          : 0,
      },
      studentDetails: studentPaymentDetails,
    });
  } catch (error) {
    console.error("Payment stats API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

