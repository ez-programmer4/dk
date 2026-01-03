import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { applyDepositPaymentToMonths } from "@/lib/payments/finalizePayment";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Payment {
  id: number;
  studentid: number;
  studentname: string;
  paidamount: Decimal;
  reason: string;
  transactionid: string;
  // sendername is derived: `${studentname} - ${controllerName}`
  paymentdate: Date;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (
      !session ||
      (session.role !== "controller" &&
        session.role !== "registral" &&
        session.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const parsedStudentId = parseInt(studentId);
    if (isNaN(parsedStudentId)) {
      return NextResponse.json(
        { error: "Invalid student ID format" },
        { status: 400 }
      );
    }

    // Load student and controller to derive sender name
    const studentInfo = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: parsedStudentId },
      select: {
        name: true,
        classfeeCurrency: true,
        controller: { select: { name: true } },
      },
    });
    if (!studentInfo) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    const derivedSenderName = `${studentInfo.name ?? ""}${
      studentInfo.controller?.name ? " - " + studentInfo.controller.name : ""
    }`;
    const currency = studentInfo.classfeeCurrency || "ETB";

    // First, let's check if we can find any payments for this student
    const allPayments = await prisma.payment.findMany({
      where: {
        studentid: parsedStudentId,
        paidamount: {
          gt: 0,
        },
      },
      select: {
        id: true,
        studentid: true,
        studentname: true,
        paidamount: true,
        reason: true,
        transactionid: true,
        paymentdate: true,
        status: true,
        source: true,
        providerReference: true,
        providerStatus: true,
        providerFee: true,
        currency: true,
      },
    });

    // Now get deposits specifically, but first check all reasons
    const uniqueReasons = [...new Set(allPayments.map((p) => p.reason))];
    // Get deposits with any reason that might indicate a deposit
    const deposits = await prisma.payment.findMany({
      where: {
        studentid: parsedStudentId,
        paidamount: {
          gt: 0,
        },
      },
      select: {
        id: true,
        studentid: true,
        studentname: true,
        paidamount: true,
        reason: true,
        transactionid: true,
        paymentdate: true,
        status: true,
        source: true,
        providerReference: true,
        providerStatus: true,
        providerFee: true,
        currency: true,
      },
      orderBy: {
        paymentdate: "desc",
      },
    });

    // If we still don't find any deposits, let's try a more direct query
    if (deposits.length === 0) {
      const directDeposits = await prisma.payment.findMany({
        where: {
          studentid: parsedStudentId,
          status: "Approved", // Only get approved deposits
          paidamount: {
            gt: 0,
          },
        },
        select: {
          id: true,
          studentid: true,
          studentname: true,
          paidamount: true,
          reason: true,
          transactionid: true,
          paymentdate: true,
          status: true,
        },
        orderBy: {
          paymentdate: "desc",
        },
      });

      // Use the direct query results as deposits
      // First, fetch with gateway fields
      const directDepositsWithGateway = await prisma.payment.findMany({
        where: {
          studentid: parsedStudentId,
          status: "Approved",
          paidamount: {
            gt: 0,
          },
        },
        select: {
          id: true,
          studentid: true,
          studentname: true,
          paidamount: true,
          reason: true,
          transactionid: true,
          paymentdate: true,
          status: true,
          source: true,
          providerReference: true,
          providerStatus: true,
          providerFee: true,
          currency: true,
        },
        orderBy: {
          paymentdate: "desc",
        },
      });

      const formattedDeposits = directDepositsWithGateway.map((deposit) => {
        const formatted = {
          id: deposit.id,
          studentid: deposit.studentid,
          studentname: deposit.studentname,
          amount: Number(deposit.paidamount),
          reason: deposit.reason,
          transaction_id: deposit.transactionid,
          sender_name: derivedSenderName,
          payment_date: deposit.paymentdate,
          status: deposit.status || "pending",
          currency: deposit.currency || currency,
          source: deposit.source || "manual",
          providerReference: deposit.providerReference,
          providerStatus: deposit.providerStatus,
          providerFee: deposit.providerFee ? Number(deposit.providerFee) : null,
        };
        return formatted;
      });

      return NextResponse.json(formattedDeposits);
    }

    // Convert Decimal to number for amount
    const formattedDeposits = deposits.map((deposit) => ({
      id: deposit.id,
      studentid: deposit.studentid,
      studentname: deposit.studentname,
      paidamount: Number(deposit.paidamount),
      reason: deposit.reason,
      transactionid: deposit.transactionid,
      sendername: derivedSenderName,
      paymentdate: deposit.paymentdate,
      status: deposit.status || "pending",
      currency: deposit.currency || currency,
      source: deposit.source || "manual",
      providerReference: deposit.providerReference,
      providerStatus: deposit.providerStatus,
      providerFee: deposit.providerFee ? Number(deposit.providerFee) : null,
    }));

    return NextResponse.json(formattedDeposits);
  } catch (error) {
    console.error("GET /api/payments/deposit error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (
    !session ||
    (session.role !== "controller" &&
      session.role !== "registral" &&
      session.role !== "admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      studentId,
      amount,
      status = "pending",
      reason,
      transactionId,
      paymentDate,
    } = body;

    if (!studentId || !amount || amount === null || amount === undefined || amount === '') {
      return NextResponse.json(
        { error: "Missing required fields: studentId and amount are required" },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a valid positive number" },
        { status: 400 }
      );
    }

    if (!["pending", "Approved"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending' or 'approved'" },
        { status: 400 }
      );
    }

    try {
      // Get the student to verify ownership and fetch controller name for sendername
      const student = await prisma.wpos_wpdatatable_23.findUnique({
        where: { wdt_ID: parseInt(studentId) },
        select: {
          u_control: true,
          name: true,
          classfeeCurrency: true,
          controller: { select: { name: true } },
        },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      // Check if the student belongs to this controller (skip for admin)
      if (session.role === "controller" && student.u_control !== (session.code || session.username)) {
        return NextResponse.json(
          { error: "You are not authorized to add deposits for this student" },
          { status: 403 }
        );
      }

      // Derive sender name `${studentname} - ${controllerName}` if available
      const derivedSenderName = `${student.name ?? ""}${student.controller?.name ? " - " + student.controller.name : ""}`;
      const currency = student.classfeeCurrency || "ETB";

      // Create the deposit payment (do not store sendername in DB)
      const deposit = await prisma.payment.create({
        data: {
          studentid: parseInt(studentId),
          studentname: student.name ?? "",
          paidamount: new Prisma.Decimal(numericAmount),
          reason: reason || "deposit",
          paymentdate: paymentDate ? new Date(paymentDate) : new Date(),
          transactionid: transactionId || `DEP-${Date.now()}`,
          status: status || "pending",
        },
      });

      // Format the response to match the expected format
      const formattedDeposit = {
        ...deposit,
        paidamount: Number(deposit.paidamount),
        currency,
      };

      return NextResponse.json(formattedDeposit);
    } catch (error) {
      console.error("Deposit creation error:", error);
      return NextResponse.json(
        { error: "Failed to create deposit" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("POST /api/payments/deposit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add new endpoint for approving/rejecting deposits
export async function PUT(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (
      !session ||
      (session.role !== "controller" &&
        session.role !== "registral" &&
        session.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, status, reason } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: "Payment ID and status are required" },
        { status: 400 }
      );
    }

    if (!["Approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Get the payment first to check if it's a deposit
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        paymentCheckouts: {
          where: { intent: "deposit" },
          take: 1,
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Update the payment status
    const updatedPayment = await prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status,
        reason: reason || "No reason provided",
      },
    });

    // If approved and it's a deposit (either from checkout or manual), apply to unpaid months
    if (status === "Approved") {
      try {
        // Check if there's a checkout for this payment (online deposit)
        const hasCheckout = existingPayment.paymentCheckouts.length > 0;
        
        // If no checkout, it's a manual deposit - apply it
        // If there's a checkout, the webhook/finalizePayment should handle it,
        // but we'll also try to apply it here as a safety net
        if (!hasCheckout || existingPayment.paymentCheckouts[0]?.status !== "completed") {
          await applyDepositPaymentToMonths(paymentId);
        }
      } catch (error) {
        console.error("Error applying deposit to months:", error);
        // Don't fail the approval if auto-application fails - admin can apply manually
      }
    }

    // Format the response to match the expected format
    const formattedPayment = {
      ...updatedPayment,
      paidamount: Number(updatedPayment.paidamount),
    };

    return NextResponse.json(formattedPayment);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update deposit (full update)
export async function PATCH(request: NextRequest) {
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (
    !session ||
    (session.role !== "controller" &&
      session.role !== "registral" &&
      session.role !== "admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { depositId, amount, reason, transactionId, paymentDate, status } = body;

    if (!depositId) {
      return NextResponse.json(
        { error: "Deposit ID is required" },
        { status: 400 }
      );
    }

    // Get the existing deposit
    const existingDeposit = await prisma.payment.findUnique({
      where: { id: depositId },
      include: {
        wpos_wpdatatable_23: {
          select: {
            u_control: true,
            name: true,
            classfeeCurrency: true,
          },
        },
      },
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { error: "Deposit not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (
      session.role === "controller" &&
      existingDeposit.wpos_wpdatatable_23?.u_control !==
        (session.code || session.username)
    ) {
      return NextResponse.json(
        { error: "You are not authorized to update this deposit" },
        { status: 403 }
      );
    }

    // Prevent editing gateway payments (stripe/chapa)
    if (
      existingDeposit.source &&
      (existingDeposit.source === "stripe" || existingDeposit.source === "chapa")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot edit gateway payments. Only manual deposits can be edited.",
        },
        { status: 400 }
      );
    }

    // Prevent editing approved deposits
    if (existingDeposit.status === "Approved") {
      return NextResponse.json(
        {
          error:
            "Cannot edit approved deposits. Only pending or rejected deposits can be edited.",
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (amount !== undefined) {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return NextResponse.json(
          { error: "Amount must be a valid positive number" },
          { status: 400 }
        );
      }
      updateData.paidamount = new Prisma.Decimal(numericAmount);
    }
    if (reason !== undefined) updateData.reason = reason;
    if (transactionId !== undefined) updateData.transactionid = transactionId;
    if (paymentDate !== undefined)
      updateData.paymentdate = new Date(paymentDate);
    if (status !== undefined) {
      if (!["pending", "Approved", "rejected"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be 'pending', 'Approved', or 'rejected'" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Update the deposit
    const updatedDeposit = await prisma.payment.update({
      where: { id: depositId },
      data: updateData,
    });

    return NextResponse.json({
      ...updatedDeposit,
      paidamount: Number(updatedDeposit.paidamount),
    });
  } catch (error) {
    console.error("PATCH /api/payments/deposit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete deposit
export async function DELETE(request: NextRequest) {
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (
    !session ||
    (session.role !== "controller" &&
      session.role !== "registral" &&
      session.role !== "admin")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get("depositId");

    if (!depositId) {
      return NextResponse.json(
        { error: "Deposit ID is required" },
        { status: 400 }
      );
    }

    // Get the existing deposit
    const existingDeposit = await prisma.payment.findUnique({
      where: { id: parseInt(depositId) },
      include: {
        wpos_wpdatatable_23: {
          select: {
            u_control: true,
          },
        },
      },
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { error: "Deposit not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (
      session.role === "controller" &&
      existingDeposit.wpos_wpdatatable_23?.u_control !==
        (session.code || session.username)
    ) {
      return NextResponse.json(
        { error: "You are not authorized to delete this deposit" },
        { status: 403 }
      );
    }

    // Prevent deleting gateway payments
    if (
      existingDeposit.source &&
      (existingDeposit.source === "stripe" || existingDeposit.source === "chapa")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete gateway payments. Only manual deposits can be deleted.",
        },
        { status: 400 }
      );
    }

    // Prevent deleting approved deposits
    if (existingDeposit.status === "Approved") {
      return NextResponse.json(
        {
          error:
            "Cannot delete approved deposits. Only pending or rejected deposits can be deleted.",
        },
        { status: 400 }
      );
    }

    // Check if deposit is used in monthly payments
    const monthlyPayments = await prisma.months_table.findMany({
      where: { paymentId: parseInt(depositId) },
    });

    if (monthlyPayments.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete deposit. It has been used in monthly payments. Please remove related monthly payments first.",
        },
        { status: 400 }
      );
    }

    // Delete the deposit
    await prisma.payment.delete({
      where: { id: parseInt(depositId) },
    });

    return NextResponse.json({ success: true, message: "Deposit deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/payments/deposit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}