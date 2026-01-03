import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/student/subscriptions
 * Get student's subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    const subscriptions = await prisma.student_subscriptions.findMany({
      where: {
        studentId: parseInt(studentId),
      },
      include: {
        package: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Debug: Log subscription statuses - this will show what's actually in the database
    console.log("[Get Subscriptions] Student ID:", studentId);
    console.log("[Get Subscriptions] Found subscriptions:", subscriptions.map(s => ({
      id: s.id,
      status: s.status,
      endDate: s.endDate,
      updatedAt: s.updatedAt
    })));

    const now = new Date();

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions.map((sub) => {
        // Check if subscription is still active (not expired)
        // Include both "active" and "cancelled" subscriptions that haven't expired
        const isNotExpired = sub.endDate && new Date(sub.endDate) > now;
        const isActive =
          sub.status === "active" && isNotExpired;
        // Also include cancelled subscriptions that haven't expired yet
        const isCancelledButActive =
          sub.status === "cancelled" && isNotExpired;

        return {
          ...sub,
          isActive: isActive || isCancelledButActive, // Include cancelled but not expired
          startDate: sub.startDate?.toISOString() || sub.createdAt.toISOString(),
          endDate: sub.endDate.toISOString(),
          createdAt: sub.createdAt.toISOString(), // Include createdAt for proration calculations
          package: {
            ...sub.package,
            price: Number(sub.package.price),
          },
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/student/subscriptions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}






