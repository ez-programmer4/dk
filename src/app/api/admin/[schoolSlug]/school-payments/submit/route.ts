import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    const { schoolSlug } = params;

    // Verify authentication
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.schoolId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user has access to this school
    if (token.schoolSlug !== schoolSlug) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Get school by slug
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true, name: true }
    });

    if (!school) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 404 }
      );
    }

    const { paymentId, transactionId, bankAccount, notes } = await request.json();

    if (!paymentId || !transactionId || !bankAccount) {
      return NextResponse.json(
        { success: false, error: "Payment ID, transaction ID, and bank account are required" },
        { status: 400 }
      );
    }

    // Verify the payment belongs to this school
    const payment = await prisma.schoolPayment.findFirst({
      where: {
        id: paymentId,
        schoolId: school.id
      }
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found or doesn't belong to this school" },
        { status: 404 }
      );
    }

    if (payment.status === 'paid') {
      return NextResponse.json(
        { success: false, error: "Payment has already been processed" },
        { status: 400 }
      );
    }

    // Update payment record
    await prisma.schoolPayment.update({
      where: { id: paymentId },
      data: {
        transactionId: transactionId || null,
        bankAccount: bankAccount || null,
        notes: notes || null,
        submittedAt: new Date(),
        status: 'submitted' // Submitted for approval
      }
    });

    // Note: Skipping audit log creation for school-initiated payment submissions
    // SuperAdminAuditLog is designed for super admin actions only
    console.log(`Payment submitted successfully: ${paymentId} by school ${school.name}`);

    return NextResponse.json({
      success: true,
      message: "Payment submitted successfully"
    });

  } catch (error) {
    console.error("Payment slip submission error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
