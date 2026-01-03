import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId query parameter is required" },
        { status: 400 }
      );
    }

    // Get the most recent checkout for this student
    const checkout = await prisma.payment_checkout.findFirst({
      where: {
        studentId: parseInt(studentId),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        txRef: true,
        status: true,
        createdAt: true,
      },
    });

    if (!checkout) {
      return NextResponse.json(
        { error: "No checkout found for this student" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      txRef: checkout.txRef,
      status: checkout.status,
      createdAt: checkout.createdAt,
    });
  } catch (error) {
    console.error("GET /api/payments/checkout/latest error:", error);
    return NextResponse.json(
      { error: "Failed to load latest checkout" },
      { status: 500 }
    );
  }
}


