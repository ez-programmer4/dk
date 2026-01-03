import { NextRequest, NextResponse } from "next/server";
import { stripeClient } from "@/lib/payments/stripe";
import { finalizePaymentByTxRef } from "@/lib/payments/finalizePayment";
import { PaymentSource } from "@prisma/client";
import type Stripe from "stripe";
import { paymentLogger } from "@/lib/payments/logger";
import { safeExecute, handlePaymentError, SecurityError } from "@/lib/payments/errorHandler";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_UI_WEBHOOK_CONTEXT = "StripeUIWebhook";

export async function POST(request: NextRequest) {
  if (!stripeClient || !stripeWebhookSecret) {
    paymentLogger.error(STRIPE_UI_WEBHOOK_CONTEXT, "Stripe webhook secret or client not configured");
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  return safeExecute(async () => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      throw new SecurityError("Missing Stripe signature header");
    }

    const rawBody = await request.text();

    let event: Stripe.Event;
    try {
      if (!stripeClient) {
        throw new SecurityError("Stripe client not configured");
      }
      event = stripeClient.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      paymentLogger.error(STRIPE_UI_WEBHOOK_CONTEXT, "Stripe webhook signature verification failed", err);
      throw new SecurityError("Invalid signature");
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const txRef = session.metadata?.txRef;
        paymentLogger.info(STRIPE_UI_WEBHOOK_CONTEXT, "checkout.session.completed", { txRef });
        
        if (!txRef) {
          paymentLogger.warn(STRIPE_UI_WEBHOOK_CONTEXT, "Missing txRef in session metadata", {
            sessionId: session.id,
          });
          break;
        }
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        paymentLogger.info(STRIPE_UI_WEBHOOK_CONTEXT, "Finalizing successful payment", { txRef });
        await finalizePaymentByTxRef(txRef, {
          provider: PaymentSource.stripe,
          providerReference: paymentIntentId ?? session.id,
          providerStatus: session.payment_status ?? "paid",
          providerPayload: session,
          currency: session.currency?.toUpperCase(),
          status: "success",
        });
        paymentLogger.info(STRIPE_UI_WEBHOOK_CONTEXT, "Successfully finalized payment", { txRef });
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const txRef = session.metadata?.txRef;
        if (!txRef) {
          break;
        }

        paymentLogger.info(STRIPE_UI_WEBHOOK_CONTEXT, "Finalizing expired payment", { txRef });
        await finalizePaymentByTxRef(txRef, {
          provider: PaymentSource.stripe,
          providerReference: session.id,
          providerStatus: session.status ?? "expired",
          providerPayload: session,
          status: "failed",
        });
        break;
      }
      default: {
        paymentLogger.debug(STRIPE_UI_WEBHOOK_CONTEXT, "Unhandled event type", { type: event.type });
        break;
      }
    }

    return NextResponse.json({ received: true });
  }, STRIPE_UI_WEBHOOK_CONTEXT, "Webhook processing failed").catch((error) => handlePaymentError(error, STRIPE_UI_WEBHOOK_CONTEXT));
}

