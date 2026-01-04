import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { EarningsCalculator } from "@/lib/earningsCalculator";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only controllers can access their own earnings
    if (session.role !== "controller") {
      return NextResponse.json(
        { message: "Unauthorized role" },
        { status: 403 }
      );
    }

    const schoolSlug = params.schoolSlug;
    const schoolId = schoolSlug === 'darulkubra' ? null : schoolSlug;

    const { searchParams } = new URL(request.url);
    const yearMonth = searchParams.get("month") || undefined;

    // Get the controller's code from the database using username
    const controller = await prisma.wpos_wpdatatable_28.findFirst({
      where: {
        username: session.username,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
      select: {
        code: true,
      },
    });

    if (!controller?.code) {
      return NextResponse.json(
        { message: "Controller not found" },
        { status: 404 }
      );
    }

    const controllerId = controller.code; // Use controller code as ID

    try {
      const calculator = new EarningsCalculator(yearMonth, schoolId); // Pass schoolId
      const earnings = await calculator.calculateControllerEarnings({
        yearMonth,
        teamId: controllerId,
        controllerId,
        schoolId, // Pass schoolId to calculation logic
      });

      return NextResponse.json(earnings);
    } catch (calcError) {
      console.error("Earnings calculation error:", calcError);
      return NextResponse.json(
        { message: "Error calculating earnings" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Controller earnings API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
