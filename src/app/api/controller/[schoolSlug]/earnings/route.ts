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
    let schoolId = schoolSlug === 'darulkubra' ? null : null; // Default to null for darulkubra

    // For non-darulkubra schools, look up the actual school ID
    if (schoolSlug !== 'darulkubra') {
      try {
        const school = await prisma.school.findUnique({
          where: { slug: schoolSlug },
          select: { id: true, name: true, slug: true }
        });
        schoolId = school?.id || null;
      } catch (error) {
        console.error("Error looking up school:", error);
        schoolId = null;
      }
    }

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

    // For now, return a basic response to prevent 404
    // TODO: Implement proper earnings calculation
    console.log("Earnings requested for controller:", controllerId, "month:", yearMonth);
    return NextResponse.json({
      reward: 0,
      totalEarnings: 0,
      commission: 0,
      month: yearMonth,
      controllerId,
      message: "Earnings calculation temporarily unavailable"
    });

    /* Temporarily disabled earnings calculation
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
      // Return a basic response to prevent 404
      return NextResponse.json({
        reward: 0,
        totalEarnings: 0,
        commission: 0,
        month: yearMonth,
        controllerId,
        message: "Earnings calculation temporarily unavailable"
      });
    }
    */
  } catch (error) {
    console.error("Controller earnings API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

