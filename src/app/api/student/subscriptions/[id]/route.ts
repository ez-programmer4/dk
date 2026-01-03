import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripeClient } from "@/lib/payments/stripe";
import { paymentLogger } from "@/lib/payments/logger";
import { handlePaymentError, ValidationError, safeExecute } from "@/lib/payments/errorHandler";

const CANCEL_CONTEXT = "CancelSubscription";

/**
 * GET /api/student/subscriptions/[id]
 * Get a single subscription by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid subscription ID" },
        { status: 400 }
      );
    }

    const subscription = await prisma.student_subscriptions.findUnique({
      where: { id },
      include: {
        package: true,
        payments: {
          orderBy: {
            paymentdate: "desc",
          },
          take: 10, // Last 10 payments
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        ...subscription,
        package: {
          ...subscription.package,
          price: Number(subscription.package.price),
        },
        payments: subscription.payments.map((p) => ({
          ...p,
          paidamount: Number(p.paidamount),
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/student/subscriptions/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/student/subscriptions/[id]
 * Cancel a subscription
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return safeExecute(async () => {
    if (!stripeClient) {
      throw new Error("Stripe not configured");
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid subscription ID");
    }

    const subscription = await prisma.student_subscriptions.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new ValidationError(`Subscription ${id} not found`);
    }

    paymentLogger.info(CANCEL_CONTEXT, "Cancelling subscription", {
      subscriptionId: id,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    });

    // Cancel at period end in Stripe
    await stripeClient.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update database - use explicit status value
    const updatedSubscription = await prisma.student_subscriptions.update({
      where: { id },
      data: {
        status: "cancelled",
      },
    });
    
    // Verify the update by reading it back
    const verifySubscription = await prisma.student_subscriptions.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    
    paymentLogger.info(CANCEL_CONTEXT, "Subscription cancelled", {
      subscriptionId: id,
      updatedStatus: updatedSubscription.status,
      verifiedStatus: verifySubscription?.status,
    });
    
    if (verifySubscription?.status !== "cancelled") {
      paymentLogger.error(CANCEL_CONTEXT, "Status was not updated correctly", undefined, {
        subscriptionId: id,
        expected: "cancelled",
        actual: verifySubscription?.status,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Subscription will be cancelled at the end of the current period",
    });
  }, CANCEL_CONTEXT, "Failed to cancel subscription").catch((error) => {
    return handlePaymentError(error, CANCEL_CONTEXT);
  });
}

/**
 * POST /api/student/subscriptions/[id]/renew
 * Renew a cancelled subscription
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!stripeClient) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid subscription ID" },
        { status: 400 }
      );
    }

    const subscription = await prisma.student_subscriptions.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Remove cancellation in Stripe
    await stripeClient.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update database
    await prisma.student_subscriptions.update({
      where: { id },
      data: {
        status: "active",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription renewed successfully",
    });
  } catch (error: any) {
    console.error("POST /api/student/subscriptions/[id]/renew error:", error);
    return NextResponse.json(
      {
        error: "Failed to renew subscription",
        details: error.message,
      },
      { status: 500 }
    );
  }
}






