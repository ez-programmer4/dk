import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizePaymentByTxRef } from "@/lib/payments/finalizePayment";
import { PaymentSource } from "@prisma/client";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Verify and finalize Chapa payment manually
 * This is used as a fallback when webhook doesn't fire
 * 
 * POST /api/payments/chapa/verify
 * Body: { txRef: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txRef } = body;

    if (!txRef) {
      return NextResponse.json(
        { error: "txRef is required" },
        { status: 400 }
      );
    }

    console.log(`[Chapa Verify] Verifying payment for txRef: ${txRef}`);

    // Check if checkout exists
    const checkout = await prisma.payment_checkout.findUnique({
      where: { txRef },
      include: { payment: true },
    });

    if (!checkout) {
      return NextResponse.json(
        { error: "Checkout not found" },
        { status: 404 }
      );
    }

    // If already completed, return status
    if (checkout.status === "completed" && checkout.payment) {
      return NextResponse.json({
        success: true,
        message: "Payment already finalized",
        paymentId: checkout.payment.id,
        status: checkout.payment.status,
      });
    }

    // Verify with Chapa API
    if (!process.env.CHAPA_TOKEN) {
      return NextResponse.json(
        { error: "Chapa credentials not configured" },
        { status: 500 }
      );
    }

    const chapaApiBase = process.env.CHAPA_API?.replace(/\/$/, "") ?? "https://api.chapa.co/v1";
    
    // Chapa uses Bearer token format
    const chapaToken = process.env.CHAPA_TOKEN.replace(/^Bearer\s+/i, "").trim();
    const authHeader = `Bearer ${chapaToken}`;
    
    try {
      const verifyResponse = await fetch(
        `${chapaApiBase}/transaction/verify/${txRef}`,
        {
          method: "GET",
          headers: {
            Authorization: authHeader, // Chapa uses Bearer token format
            "Content-Type": "application/json",
          },
        }
      );

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error(`[Chapa Verify] Chapa API error: ${verifyResponse.status}`, errorText);
        return NextResponse.json(
          { 
            error: "Failed to verify payment with Chapa",
            details: errorText 
          },
          { status: verifyResponse.status }
        );
      }

      const chapaData = await verifyResponse.json();
      console.log(`[Chapa Verify] Chapa response:`, chapaData);

      // Check payment status
      const chapaStatus = (chapaData?.status || chapaData?.data?.status || "").toLowerCase();
      
      if (chapaStatus === "success" || chapaStatus === "successful") {
        // Finalize the payment
        console.log(`[Chapa Verify] Payment verified as successful, finalizing...`);
        
        const finalizedCheckout = await finalizePaymentByTxRef(txRef, {
          provider: PaymentSource.chapa,
          providerReference: chapaData?.data?.reference || chapaData?.reference || txRef,
          providerStatus: chapaData?.data?.status || chapaData?.status || "success",
          providerFee: chapaData?.data?.charge || chapaData?.charge || null,
          providerPayload: chapaData,
          currency: chapaData?.data?.currency || chapaData?.currency || checkout.currency,
          status: "success",
        });

        // Check if deposit was applied
        let monthsApplied = 0;
        if (finalizedCheckout?.intent === "deposit" && finalizedCheckout?.paymentId) {
          monthsApplied = await prisma.months_table.count({
            where: { paymentId: finalizedCheckout.paymentId },
          });
        }

        return NextResponse.json({
          success: true,
          message: "Payment verified and finalized successfully",
          paymentId: finalizedCheckout?.paymentId,
          status: finalizedCheckout?.payment?.status || "Approved",
          monthsApplied,
        });
      } else if (chapaStatus === "failed" || chapaStatus === "error") {
        // Mark as failed
        await finalizePaymentByTxRef(txRef, {
          provider: PaymentSource.chapa,
          providerReference: chapaData?.data?.reference || chapaData?.reference || txRef,
          providerStatus: chapaStatus,
          providerPayload: chapaData,
          status: "failed",
        });

        return NextResponse.json({
          success: false,
          message: "Payment verification failed",
          status: "failed",
        });
      } else {
        // Still pending
        return NextResponse.json({
          success: false,
          message: "Payment is still pending",
          status: "pending",
        });
      }
    } catch (error: any) {
      console.error(`[Chapa Verify] Error verifying payment:`, error);
      return NextResponse.json(
        { 
          error: "Failed to verify payment",
          details: error.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Chapa Verify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}


