import { prisma } from "@/lib/prisma";
import { PaymentSource } from "@prisma/client";
import { finalizePaymentByTxRef } from "./finalizePayment";
import { stripeClient } from "./stripe";
import { paymentLogger } from "./logger";

const VERIFY_PAYMENT_CONTEXT = "VerifyPayment";

const chapApiBase =
  process.env.CHAPA_API?.replace(/\/$/, "") ?? "https://api.chapa.co/v1";

/**
 * Verify payment status directly from payment gateway and finalize if successful
 */
export async function verifyAndFinalizePayment(txRef: string) {
  const checkout = await prisma.payment_checkout.findUnique({
    where: { txRef },
  });

  if (!checkout) {
    throw new Error(`Checkout with txRef ${txRef} not found`);
  }

  // If already completed, skip
  if (checkout.status === "completed" || checkout.paymentId) {
    return { alreadyProcessed: true, checkout };
  }

  paymentLogger.debug(VERIFY_PAYMENT_CONTEXT, "Verifying payment", {
    txRef,
    provider: checkout.provider,
  });

  try {
    if (checkout.provider === PaymentSource.chapa) {
      return await verifyChapaPayment(txRef, checkout);
    } else if (checkout.provider === PaymentSource.stripe) {
      return await verifyStripePayment(txRef, checkout);
    } else {
      throw new Error(`Unknown provider: ${checkout.provider}`);
    }
  } catch (error) {
    paymentLogger.error(VERIFY_PAYMENT_CONTEXT, "Error verifying payment", error, { txRef });
    throw error;
  }
}

async function verifyChapaPayment(txRef: string, checkout: any) {
  if (!process.env.CHAPA_TOKEN) {
    throw new Error("Chapa credentials are not configured");
  }

  // Chapa uses Bearer token format
  const chapaToken = process.env.CHAPA_TOKEN.replace(/^Bearer\s+/i, "").trim();
  const authHeader = `Bearer ${chapaToken}`;

  try {
    const response = await fetch(`${chapApiBase}/transaction/verify/${txRef}`, {
      method: "GET",
      headers: {
        Authorization: authHeader, // Chapa uses Bearer token format
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      paymentLogger.error(VERIFY_PAYMENT_CONTEXT, "Chapa verify error", new Error(text), {
        txRef,
        status: response.status,
      });
      return { verified: false, error: `Chapa API returned ${response.status}` };
    }

    const data = await response.json();
    paymentLogger.debug(VERIFY_PAYMENT_CONTEXT, "Chapa verification response", { txRef, data });

    if (data.status === "success" && data.data?.status === "success") {
      // Payment is successful, finalize it
      await finalizePaymentByTxRef(txRef, {
        provider: PaymentSource.chapa,
        providerReference: data.data?.reference || data.data?.tx_ref || txRef,
        providerStatus: data.data?.status ?? "success",
        providerFee: data.data?.charge || null,
        providerPayload: data,
        currency: data.data?.currency || checkout.currency,
        status: "success",
      });

      return { verified: true, finalized: true };
    } else if (data.status === "failed" || data.data?.status === "failed") {
      // Payment failed
      await finalizePaymentByTxRef(txRef, {
        provider: PaymentSource.chapa,
        providerReference: data.data?.reference || txRef,
        providerStatus: data.data?.status ?? "failed",
        providerPayload: data,
        status: "failed",
      });

      return { verified: true, finalized: true, failed: true };
    } else {
      // Still pending
      return { verified: true, pending: true };
    }
  } catch (error) {
    paymentLogger.error(VERIFY_PAYMENT_CONTEXT, "Chapa verification error", error, { txRef });
    throw error;
  }
}

async function verifyStripePayment(txRef: string, checkout: any) {
  if (!stripeClient) {
    throw new Error("Stripe client is not configured");
  }

  try {
    let session: any = null;

    // Method 1: Try to get session ID from checkout metadata
    const checkoutMetadata = checkout.metadata as Record<string, unknown> | null;
    if (checkoutMetadata?.stripeSessionId) {
      try {
        session = await stripeClient.checkout.sessions.retrieve(
          checkoutMetadata.stripeSessionId as string
        );
        paymentLogger.debug(VERIFY_PAYMENT_CONTEXT, "Found Stripe session by ID from metadata", {
          txRef,
          sessionId: checkoutMetadata.stripeSessionId,
        });
      } catch (err) {
        paymentLogger.debug(VERIFY_PAYMENT_CONTEXT, "Could not retrieve session by ID from metadata", {
          txRef,
          sessionId: checkoutMetadata.stripeSessionId,
        });
      }
    }
    
    // Method 1b: Try to extract session ID from checkoutUrl if metadata doesn't have it
    if (!session && checkout.checkoutUrl) {
      const urlMatch = checkout.checkoutUrl.match(/\/checkout\/sessions\/(cs_[a-zA-Z0-9_]+)/);
      if (urlMatch && urlMatch[1]) {
        try {
          session = await stripeClient.checkout.sessions.retrieve(urlMatch[1]);
          paymentLogger.debug(VERIFY_PAYMENT_CONTEXT, "Found Stripe session by ID from URL", {
            txRef,
            sessionId: urlMatch[1],
          });
        } catch (err) {
          paymentLogger.debug(VERIFY_PAYMENT_CONTEXT, "Could not retrieve session by ID from URL", {
            txRef,
            sessionId: urlMatch[1],
          });
        }
      }
    }

    // Method 2: Fallback to listing sessions (with pagination) to find by metadata
    if (!session) {
      let startingAfter: string | undefined = undefined;
      for (let i = 0; i < 10; i++) { // Check up to 1000 sessions (10 pages of 100)
        const sessions: any = await stripeClient.checkout.sessions.list({
          limit: 100,
          ...(startingAfter && { starting_after: startingAfter }),
        });

        session = sessions.data.find(
          (s: any) => s.metadata?.txRef === txRef
        );

        if (session) {
          paymentLogger.debug(VERIFY_PAYMENT_CONTEXT, "Found Stripe session by listing", {
            txRef,
            sessionId: session.id,
          });
          break;
        }

        if (sessions.data.length === 0 || !sessions.has_more) {
          break;
        }

        startingAfter = sessions.data[sessions.data.length - 1].id;
      }
    }

    if (!session) {
      return { verified: false, error: "Stripe session not found. The session may not exist yet or the payment was not completed." };
    }

    paymentLogger.debug(VERIFY_PAYMENT_CONTEXT, "Stripe session status", {
      txRef,
      paymentStatus: session.payment_status,
      status: session.status,
    });

    if (session.payment_status === "paid" && session.status === "complete") {
      // Payment is successful, finalize it
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      await finalizePaymentByTxRef(txRef, {
        provider: PaymentSource.stripe,
        providerReference: paymentIntentId ?? session.id,
        providerStatus: session.payment_status ?? "paid",
        providerPayload: session,
        currency: session.currency?.toUpperCase(),
        status: "success",
      });

      return { verified: true, finalized: true };
    } else if (session.status === "expired") {
      // Payment expired
      await finalizePaymentByTxRef(txRef, {
        provider: PaymentSource.stripe,
        providerReference: session.id,
        providerStatus: session.status ?? "expired",
        providerPayload: session,
        status: "failed",
      });

      return { verified: true, finalized: true, failed: true };
    } else {
      // Still pending
      return { verified: true, pending: true };
    }
  } catch (error) {
    paymentLogger.error(VERIFY_PAYMENT_CONTEXT, "Stripe verification error", error, { txRef });
    throw error;
  }
}

