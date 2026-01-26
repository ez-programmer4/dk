import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PricingCalculator } from "@/lib/billing/pricing-calculator";

// POST /api/super-admin/billing/calculate - Calculate billing for a school
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await req.json();

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    // Calculate current pricing
    const calculation = await PricingCalculator.calculateSchoolPricing(schoolId);

    if (!calculation) {
      return NextResponse.json({ error: "Unable to calculate pricing for this school" }, { status: 404 });
    }

    // Get subscription details
    const subscription = await prisma.schoolSubscription.findUnique({
      where: { schoolId },
      include: {
        plan: true,
        school: {
          select: { name: true, status: true },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "School subscription not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      calculation: {
        ...calculation,
        schoolName: subscription.school.name,
        schoolStatus: subscription.school.status,
        subscriptionStatus: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        nextBillingDate: subscription.nextBillingDate,
      },
    });
  } catch (error) {
    console.error("Calculate billing API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
