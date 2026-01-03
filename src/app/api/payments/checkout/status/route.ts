import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizePaymentByTxRef } from "@/lib/payments/finalizePayment";
import { PaymentSource } from "@prisma/client";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txRef = searchParams.get("txRef");
    const studentId = searchParams.get("studentId");
    const packageId = searchParams.get("packageId");
    const autoVerify = searchParams.get("autoVerify") !== "false"; // Default to true

    // Support checking subscription status by studentId and packageId
    // This is used by the return page to check if webhook has finalized the subscription
    if (studentId && packageId) {
      const subscription = await prisma.student_subscriptions.findFirst({
        where: {
          studentId: parseInt(studentId),
          packageId: parseInt(packageId),
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        include: {
          package: {
            select: {
              id: true,
              name: true,
              price: true,
              currency: true,
              duration: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (subscription) {
        return NextResponse.json({
          success: true,
          status: "completed",
          provider: "stripe",
          amount: Number(subscription.package.price),
          currency: subscription.package.currency,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            startDate: subscription.startDate.toISOString(),
            endDate: subscription.endDate.toISOString(),
            nextBillingDate: subscription.nextBillingDate?.toISOString() || null,
            package: subscription.package,
          },
          updatedAt: subscription.updatedAt.toISOString(),
        });
      } else {
        // Subscription not found - webhook may still be processing
        return NextResponse.json({
          success: true,
          status: "pending",
          provider: "stripe",
          message: "Subscription is being processed. Please wait...",
        });
      }
    }

    if (!txRef) {
      return NextResponse.json(
        { error: "txRef, or studentId+packageId query parameters are required" },
        { status: 400 }
      );
    }

    const checkout = await prisma.payment_checkout.findUnique({
      where: { txRef },
      include: {
        payment: true,
      },
    });

    if (!checkout) {
      return NextResponse.json(
        { error: "Checkout session not found" },
        { status: 404 }
      );
    }

    // If payment exists but checkout status is still pending, update it
    // This handles cases where payment was finalized but checkout status wasn't updated
    let finalStatus = checkout.status;
    if (checkout.payment && checkout.status === "pending") {
      // Payment exists, so checkout should be completed
      if (checkout.payment.status === "Approved" || checkout.payment.status === "approved") {
        finalStatus = "completed";
        // Update checkout status in background (don't wait)
        prisma.payment_checkout.update({
          where: { id: checkout.id },
          data: { status: "completed" },
        }).catch(err => {
          console.error(`[Checkout Status] Failed to update checkout ${checkout.id} status:`, err);
        });
      } else if (checkout.payment.status === "rejected") {
        finalStatus = "failed";
      }
    }

    // Auto-verify Chapa payments if still pending and autoVerify is enabled
    if (
      autoVerify &&
      checkout.provider === PaymentSource.chapa &&
      finalStatus === "pending" &&
      !checkout.payment
    ) {
      console.log(`[Checkout Status] Auto-verifying Chapa payment for txRef: ${txRef}`);
      
      try {
        // Verify with Chapa API
        if (process.env.CHAPA_TOKEN) {
          const chapaApiBase = process.env.CHAPA_API?.replace(/\/$/, "") ?? "https://api.chapa.co/v1";
          const chapaToken = process.env.CHAPA_TOKEN.replace(/^Bearer\s+/i, "").trim();
          const authHeader = `Bearer ${chapaToken}`;
          
          const verifyResponse = await fetch(
            `${chapaApiBase}/transaction/verify/${txRef}`,
            {
              method: "GET",
              headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
              },
            }
          );

          if (verifyResponse.ok) {
            const chapaData = await verifyResponse.json();
            const chapaStatus = (chapaData?.status || chapaData?.data?.status || "").toLowerCase();
            
            console.log(`[Checkout Status] Chapa verification result: ${chapaStatus}`, chapaData);
            
            if (chapaStatus === "success" || chapaStatus === "successful") {
              // Finalize the payment
              console.log(`[Checkout Status] Payment verified as successful, finalizing...`);
              
              const finalizedCheckout = await finalizePaymentByTxRef(txRef, {
                provider: PaymentSource.chapa,
                providerReference: chapaData?.data?.reference || chapaData?.reference || txRef,
                providerStatus: chapaData?.data?.status || chapaData?.status || "success",
                providerFee: chapaData?.data?.charge || chapaData?.charge || null,
                providerPayload: chapaData,
                currency: chapaData?.data?.currency || chapaData?.currency || checkout.currency,
                status: "success",
              });

              // Re-fetch checkout to get updated status
              const updatedCheckout = await prisma.payment_checkout.findUnique({
                where: { txRef },
                include: { payment: true },
              });

              if (updatedCheckout) {
                finalStatus = updatedCheckout.status;
                checkout.payment = updatedCheckout.payment;
                console.log(`[Checkout Status] Payment finalized successfully, new status: ${finalStatus}`);
              }
            } else if (chapaStatus === "failed" || chapaStatus === "error") {
              // Mark as failed
              await finalizePaymentByTxRef(txRef, {
                provider: PaymentSource.chapa,
                providerReference: chapaData?.data?.reference || chapaData?.reference || txRef,
                providerStatus: chapaStatus,
                providerPayload: chapaData,
                status: "failed",
              });
              finalStatus = "failed";
            }
          } else {
            console.warn(`[Checkout Status] Chapa verification failed: ${verifyResponse.status}`);
          }
        }
      } catch (verifyError: any) {
        console.error(`[Checkout Status] Error auto-verifying Chapa payment:`, verifyError);
        // Don't fail the request, just return current status
      }
    }

    return NextResponse.json({
      success: true,
      status: finalStatus,
      provider: checkout.provider,
      amount: Number(checkout.amount),
      currency: checkout.currency,
      intent: checkout.intent,
      payment: checkout.payment
        ? {
            id: checkout.payment.id,
            status: checkout.payment.status,
            providerStatus: checkout.payment.providerStatus,
            providerReference: checkout.payment.providerReference,
            currency: checkout.payment.currency,
          }
        : null,
      metadata: checkout.metadata,
      updatedAt: checkout.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/payments/checkout/status error:", error);
    return NextResponse.json(
      { error: "Failed to load checkout status" },
      { status: 500 }
    );
  }
}

