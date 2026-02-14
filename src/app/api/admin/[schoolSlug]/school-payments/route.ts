import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    console.log(`School payments API called for slug: ${schoolSlug} by user from school: ${token.schoolSlug}`);

    // Get school by slug
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true, name: true, status: true }
    });

    if (!school) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 404 }
      );
    }

    // Get payments for this school
    const payments = await prisma.schoolPayment.findMany({
      where: { schoolId: school.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        period: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        notes: true,
        transactionId: true,
        bankAccount: true,
        submittedAt: true,
        approvedBy: true,
        approvedAt: true,
        approvalNotes: true,
        studentCount: true,
        baseFee: true,
      }
    });

    console.log(`Payments found for school ${school.name} (${school.id}):`, payments.length);

    // Calculate summary
    const summary = {
      totalDue: payments
        .filter(p => p.status === 'pending' || p.status === 'overdue' || p.status === 'submitted')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      totalPaid: payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      submittedPayments: payments.filter(p => p.status === 'submitted').length,
      overduePayments: payments.filter(p => p.status === 'overdue').length,
      currency: payments[0]?.currency || 'ETB'
    };

    return NextResponse.json({
      success: true,
      payments: payments.map(payment => ({
        ...payment,
        baseRate: Number(payment.baseFee), // For display purposes
      })),
      summary
    });

  } catch (error) {
    console.error("School payments fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
