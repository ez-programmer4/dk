import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PricingCalculator } from "@/lib/billing/pricing-calculator";

// GET /api/super-admin/billing/overview - Get billing overview for all schools
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all school subscriptions with basic info
    const subscriptions = await prisma.schoolSubscription.findMany({
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            baseSalaryPerStudent: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate current billing for each school
    const billingOverview = await Promise.all(
      subscriptions.map(async (subscription) => {
        const calculation = await PricingCalculator.calculateSchoolPricing(subscription.schoolId);

        return {
          schoolId: subscription.school.id,
          schoolName: subscription.school.name,
          schoolSlug: subscription.school.slug,
          schoolStatus: subscription.school.status,
          schoolEmail: subscription.school.email,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          planName: subscription.plan.name,
          currency: subscription.plan.currency,
          billingCycle: subscription.billingCycle,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          nextBillingDate: subscription.nextBillingDate,
          lastBilledAt: subscription.lastBilledAt,
          activeStudentCount: subscription.activeStudentCount,
          lastCalculatedAt: subscription.lastCalculatedAt,
          currentBilling: calculation ? {
            baseFee: calculation.baseFee,
            featureFees: calculation.featureFees,
            totalFee: calculation.totalFee,
            breakdown: calculation.breakdown,
          } : null,
        };
      })
    );

    // Calculate summary statistics
    const activeSubscriptions = billingOverview.filter(s => s.subscriptionStatus === 'active');
    const totalMonthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
      return sum + (sub.currentBilling?.totalFee || 0);
    }, 0);

    const totalActiveStudents = activeSubscriptions.reduce((sum, sub) => {
      return sum + (sub.activeStudentCount || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      overview: {
        totalSchools: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        inactiveSubscriptions: subscriptions.length - activeSubscriptions.length,
        totalMonthlyRevenue,
        totalActiveStudents,
        currency: "ETB", // Default currency
      },
      schools: billingOverview,
    });
  } catch (error) {
    console.error("Billing overview API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
