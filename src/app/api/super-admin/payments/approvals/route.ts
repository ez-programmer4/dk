import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Verify super admin authentication
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "superAdmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all submitted payments that need approval
    const submittedPayments = await prisma.schoolPayment.findMany({
      where: {
        status: "submitted",
      },
      select: {
        id: true,
        period: true,
        amount: true,
        currency: true,
        studentCount: true,
        baseFee: true,
        notes: true,
        transactionId: true,
        bankAccount: true,
        submittedAt: true,
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { submittedAt: "asc" },
    });

    // Get payment statistics
    const stats = await prisma.schoolPayment.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
      where: {
        status: { in: ["submitted", "paid", "pending", "overdue"] },
      },
    });

    const statistics = {
      submitted: stats.find(s => s.status === "submitted")?._count.id || 0,
      paid: stats.find(s => s.status === "paid")?._count.id || 0,
      pending: stats.find(s => s.status === "pending")?._count.id || 0,
      overdue: stats.find(s => s.status === "overdue")?._count.id || 0,
    };

    return NextResponse.json({
      success: true,
      payments: submittedPayments,
      statistics,
    });

  } catch (error) {
    console.error("Payment approvals fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify super admin authentication
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "superAdmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { paymentId, action, notes } = await req.json();

    if (!paymentId || !action) {
      return NextResponse.json(
        { success: false, error: "Payment ID and action are required" },
        { status: 400 }
      );
    }

    // Get the payment
    const payment = await prisma.schoolPayment.findUnique({
      where: { id: paymentId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.status !== "submitted") {
      return NextResponse.json(
        { success: false, error: "Payment is not in submitted status" },
        { status: 400 }
      );
    }

    let updateData: any = {
      approvedBy: token.sub, // Super admin ID
      approvedAt: new Date(),
      approvalNotes: notes || null,
    };

    if (action === "approve") {
      updateData.status = "paid";
      updateData.paidAt = new Date();
    } else if (action === "reject") {
      updateData.status = "pending"; // Reset to pending so school can resubmit
      updateData.transactionId = null; // Clear transaction ID
      updateData.bankAccount = null; // Clear bank account
      updateData.submittedAt = null; // Clear submission date
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Update the payment
    const updatedPayment = await prisma.schoolPayment.update({
      where: { id: paymentId },
      data: updateData,
    });

    // Create audit log
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: token.sub!,
        action: action === "approve" ? "PAYMENT_APPROVED" : "PAYMENT_REJECTED",
        resourceType: "SchoolPayment",
        resourceId: paymentId,
        details: {
          schoolId: payment.school.id,
          schoolName: payment.school.name,
          amount: payment.amount,
          currency: payment.currency,
          period: payment.period,
          action,
          notes,
        },
      },
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: action === "approve"
        ? "Payment approved successfully"
        : "Payment rejected and returned to school for resubmission",
    });

  } catch (error) {
    console.error("Payment approval error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}