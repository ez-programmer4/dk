import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripeClient } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/admin/correct-subscription-payment
 * Corrects the payment amount for a subscription by fetching the actual amount from Stripe
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripeClient) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    // Get subscription from database
    const subscription = await prisma.student_subscriptions.findUnique({
      where: { id: parseInt(subscriptionId) },
      include: {
        package: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Get the latest invoice from Stripe
    const invoices = await stripeClient.invoices.list({
      subscription: subscription.stripeSubscriptionId,
      limit: 1,
    });

    if (invoices.data.length === 0) {
      return NextResponse.json(
        { error: "No invoices found for this subscription" },
        { status: 404 }
      );
    }

    const latestInvoice = invoices.data[0];
    const actualAmount = latestInvoice.amount_paid / 100; // Convert from cents to dollars

    // Find the payment record for this subscription
    const payment = await prisma.payment.findFirst({
      where: {
        subscriptionId: subscription.id,
        intent: "subscription",
      },
      orderBy: {
        paymentdate: "desc",
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    const existingAmount = Number(payment.paidamount);
    const amountDifference = Math.abs(existingAmount - actualAmount);

    if (amountDifference > 0.01) {
      // Update the payment record with the correct amount
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paidamount: actualAmount,
          transactionid: latestInvoice.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment amount corrected",
        oldAmount: existingAmount,
        newAmount: actualAmount,
        difference: amountDifference,
        payment: updatedPayment,
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Payment amount is already correct",
        amount: actualAmount,
      });
    }
  } catch (error: any) {
    console.error("Error correcting subscription payment:", error);
    return NextResponse.json(
      {
        error: "Failed to correct payment",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
