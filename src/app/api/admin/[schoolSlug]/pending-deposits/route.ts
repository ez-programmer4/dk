import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Fetch all pending deposits
export async function GET(request: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Verify admin has access to this school
    const admin = await prisma.admin.findUnique({
      where: { id: session.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build where clause for pending deposits
    const whereClause: Prisma.paymentWhereInput = {
      status: "pending",
      studentid: { gt: 0 },
      paidamount: { gte: 0 },
      schoolId: school.id,
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { studentname: { contains: search } },
        { transactionid: { contains: search } },
        { reason: { contains: search } },
      ];
    }

    // Get pending deposits with pagination
    const [deposits, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          wpos_wpdatatable_23: {
            select: {
              name: true,
              classfeeCurrency: true,
              country: true,
              controller: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          paymentdate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({
        where: whereClause,
      }),
    ]);

    // Format the deposits
    const formattedDeposits = deposits.map((deposit) => ({
      id: deposit.id,
      studentid: deposit.studentid,
      studentname: deposit.studentname,
      paidamount: Number(deposit.paidamount),
      reason: deposit.reason,
      transactionid: deposit.transactionid,
      paymentdate: deposit.paymentdate,
      status: deposit.status,
      currency: deposit.currency || deposit.wpos_wpdatatable_23?.classfeeCurrency || "ETB",
      source: deposit.source || "manual",
      providerReference: deposit.providerReference,
      providerStatus: deposit.providerStatus,
      providerFee: deposit.providerFee ? Number(deposit.providerFee) : null,
      student: deposit.wpos_wpdatatable_23
        ? {
            name: deposit.wpos_wpdatatable_23.name,
            currency: deposit.wpos_wpdatatable_23.classfeeCurrency,
            country: deposit.wpos_wpdatatable_23.country,
            controllerName: deposit.wpos_wpdatatable_23.controller?.name,
          }
        : null,
    }));

    return NextResponse.json({
      deposits: formattedDeposits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/pending-deposits error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending deposits" },
      { status: 500 }
    );
  }
}

// PUT: Approve or reject a pending deposit
export async function PUT(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
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
        { error: "Invalid status. Must be 'Approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Get the payment first
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId, schoolId: school.id },
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

    // Check if payment is pending
    if (existingPayment.status !== "pending") {
      return NextResponse.json(
        { error: `Payment is already ${existingPayment.status}. Only pending payments can be updated.` },
        { status: 400 }
      );
    }

    // Update the payment status
    const updatedPayment = await prisma.payment.update({
      where: {
        id: paymentId,
        schoolId: school.id,
      },
      data: {
        status,
        reason: reason || existingPayment.reason,
      },
    });

    // If approved, try to apply the deposit to unpaid months
    if (status === "Approved") {
      try {
        const { applyDepositPaymentToMonths } = await import(
          "@/lib/payments/finalizePayment"
        );
        const hasCheckout =
          existingPayment.paymentCheckouts.length > 0 &&
          existingPayment.paymentCheckouts[0]?.status === "completed";

        // If no checkout or checkout not completed, apply manually
        if (!hasCheckout) {
          await applyDepositPaymentToMonths(paymentId);
        }
      } catch (error) {
        console.error("Error applying deposit to months:", error);
        // Don't fail the approval if auto-application fails
      }
    }

    // Format the response
    const formattedPayment = {
      id: updatedPayment.id,
      studentid: updatedPayment.studentid,
      studentname: updatedPayment.studentname,
      paidamount: Number(updatedPayment.paidamount),
      reason: updatedPayment.reason,
      transactionid: updatedPayment.transactionid,
      paymentdate: updatedPayment.paymentdate,
      status: updatedPayment.status,
      currency: updatedPayment.currency,
      source: updatedPayment.source,
    };

    return NextResponse.json(formattedPayment);
  } catch (error) {
    console.error("PUT /api/admin/pending-deposits error:", error);
    return NextResponse.json(
      { error: "Failed to update deposit status" },
      { status: 500 }
    );
  }
}

