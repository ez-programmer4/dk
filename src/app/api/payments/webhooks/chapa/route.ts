import { NextRequest, NextResponse } from "next/server";
import { finalizePaymentByTxRef } from "@/lib/payments/finalizePayment";
import { PaymentSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { paymentLogger } from "@/lib/payments/logger";
import { safeExecute, handlePaymentError } from "@/lib/payments/errorHandler";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CHAPA_WEBHOOK_CONTEXT = "ChapaWebhook";

export async function POST(request: NextRequest) {
  return safeExecute(async () => {
    const payload = await request.json();
    paymentLogger.debug(CHAPA_WEBHOOK_CONTEXT, "Received payload", { payload });
    
    // Chapa webhook can come in different formats
    // Format 1: { status: "success", data: { tx_ref: "...", ... } }
    // Format 2: { tx_ref: "...", status: "success", ... }
    // Format 3: { data: { tx_ref: "...", status: "success", ... } }
    const data = payload?.data ?? payload;
    const txRef =
      data?.tx_ref ||
      data?.txRef ||
      data?.reference ||
      payload?.tx_ref ||
      payload?.txRef ||
      payload?.reference;

    if (!txRef) {
      paymentLogger.error(CHAPA_WEBHOOK_CONTEXT, "Missing tx_ref in payload", new Error("Missing tx_ref"), {
        hasData: !!payload?.data,
        hasTxRef: !!payload?.tx_ref,
        keys: Object.keys(payload || {}),
      });
      return NextResponse.json(
        { error: "Missing tx_ref in webhook payload" },
        { status: 400 }
      );
    }

    paymentLogger.info(CHAPA_WEBHOOK_CONTEXT, "Processing webhook", { txRef });

    // Check status from multiple possible locations
    const status = (
      data?.status || 
      payload?.status || 
      data?.data?.status ||
      ""
    ).toLowerCase();
    paymentLogger.debug(CHAPA_WEBHOOK_CONTEXT, "Payment status", { txRef, status });

    if (status === "success" || status === "successful") {
      paymentLogger.info(CHAPA_WEBHOOK_CONTEXT, "Finalizing successful payment", {
        txRef,
        amount: data?.amount || payload?.amount,
        currency: data?.currency || payload?.currency || "ETB",
        reference: data?.reference || data?.tx_ref || payload?.reference || txRef,
      });
      
      try {
        const finalizedCheckout = await finalizePaymentByTxRef(txRef, {
          provider: PaymentSource.chapa,
          providerReference: data?.reference || data?.tx_ref || payload?.reference || txRef,
          providerStatus: data?.status || payload?.status || "success",
          providerFee: data?.charge || payload?.charge || null,
          providerPayload: payload,
          currency: data?.currency || payload?.currency || "ETB",
          status: "success",
        });
        
        paymentLogger.info(CHAPA_WEBHOOK_CONTEXT, "Successfully finalized payment", { txRef });
        
        // Log deposit application details
        if (finalizedCheckout?.intent === "deposit" && finalizedCheckout?.paymentId) {
          const monthsApplied = await prisma.months_table.count({
            where: { paymentId: finalizedCheckout.paymentId },
          });
          paymentLogger.info(CHAPA_WEBHOOK_CONTEXT, "Deposit applied to months", {
            txRef,
            monthsApplied,
            studentId: finalizedCheckout.studentId,
          });
        }
      } catch (finalizeError: any) {
        paymentLogger.error(CHAPA_WEBHOOK_CONTEXT, "Error finalizing payment", finalizeError, { txRef });
        // Don't throw - return success to Chapa so they don't retry
        // But log the error for manual intervention
        return NextResponse.json({ 
          received: true, 
          warning: "Payment received but finalization failed",
          error: finalizeError.message 
        });
      }
    } else if (status === "failed" || status === "error" || status === "cancelled") {
      paymentLogger.info(CHAPA_WEBHOOK_CONTEXT, "Finalizing failed payment", { txRef, status });
      try {
        await finalizePaymentByTxRef(txRef, {
          provider: PaymentSource.chapa,
          providerReference: data?.reference || data?.tx_ref || payload?.reference || txRef,
          providerStatus: status,
          providerPayload: payload,
          status: "failed",
        });
        paymentLogger.info(CHAPA_WEBHOOK_CONTEXT, "Marked payment as failed", { txRef });
      } catch (finalizeError: any) {
        paymentLogger.error(CHAPA_WEBHOOK_CONTEXT, "Error marking payment as failed", finalizeError, { txRef });
      }
    } else {
      paymentLogger.debug(CHAPA_WEBHOOK_CONTEXT, "Unknown status, treating as pending", { txRef, status });
    }

    return NextResponse.json({ received: true });
  }, CHAPA_WEBHOOK_CONTEXT, "Webhook processing failed").catch((error) => handlePaymentError(error, CHAPA_WEBHOOK_CONTEXT));
}


