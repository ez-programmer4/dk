import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { finalizeSubscriptionPayment } from "@/lib/payments/finalizeSubscription";
import { stripeClient } from "@/lib/payments/stripe";
import { prisma } from "@/lib/prisma";
import { PaymentIntent, PaymentSource } from "@prisma/client";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/payments/stripe/manual-finalize
 * List pending subscription checkouts that need manual finalization
 */
export async function GET(request: NextRequest) {
  try {
    const session = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })) as any;

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find pending subscription checkouts
    const pendingCheckouts = await prisma.payment_checkout.findMany({
      where: {
        provider: PaymentSource.stripe,
        intent: PaymentIntent.subscription,
        status: { not: "completed" },
      },
      include: {
        student: {
          select: {
            wdt_ID: true,
            name: true,
            classfeeCurrency: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Extract session IDs and subscription IDs from metadata
    const checkoutsWithDetails = pendingCheckouts.map((checkout) => {
      const metadata = checkout.metadata as any;
      return {
        id: checkout.id,
        txRef: checkout.txRef,
        studentId: checkout.studentId,
        studentName: checkout.student?.name || "Unknown",
        amount: Number(checkout.amount),
        currency: checkout.currency,
        status: checkout.status,
        createdAt: checkout.createdAt,
        stripeSessionId: metadata?.stripeSessionId,
        stripeSubscriptionId: metadata?.stripeSubscriptionId,
        packageId: metadata?.packageId,
        packageName: metadata?.packageName,
      };
    });

    return NextResponse.json({
      success: true,
      checkouts: checkoutsWithDetails,
    });
  } catch (error: any) {
    console.error("[Manual Finalize GET] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch pending checkouts",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/payments/stripe/manual-finalize
 * Auto-finalize all successful Stripe payments that are still pending
 * This checks Stripe for payment status and finalizes any that succeeded
 */
export async function PUT(request: NextRequest) {
  try {
    const session = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })) as any;

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!stripeClient) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    console.log(`[Auto-Finalize] Starting auto-finalization of pending checkouts...`);

    // Find all pending subscription checkouts
    const pendingCheckouts = await prisma.payment_checkout.findMany({
      where: {
        provider: PaymentSource.stripe,
        intent: PaymentIntent.subscription,
        status: { not: "completed" },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`[Auto-Finalize] Found ${pendingCheckouts.length} pending checkouts`);

    const results = {
      checked: 0,
      finalized: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const checkout of pendingCheckouts) {
      results.checked++;
      const metadata = checkout.metadata as any;
      const sessionId = metadata?.stripeSessionId;

      if (!sessionId) {
        console.log(`[Auto-Finalize] Checkout ${checkout.id}: No session ID, skipping`);
        continue;
      }

      try {
        // Check session status in Stripe
        const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription'],
        });

        console.log(`[Auto-Finalize] Checkout ${checkout.id}: Payment status = ${session.payment_status}`);

        // Only finalize if payment was successful
        if (session.payment_status === "paid" && session.mode === "subscription") {
          const subscriptionId = session.subscription as string;
          
          if (subscriptionId) {
            console.log(`[Auto-Finalize] Checkout ${checkout.id}: Payment successful, finalizing...`);
            
            try {
              await finalizeSubscriptionPayment(subscriptionId, {
                isInitialPayment: true,
                sessionId: sessionId,
              });
              
              results.finalized++;
              console.log(`[Auto-Finalize] âœ… Checkout ${checkout.id} finalized successfully`);
            } catch (finalizeError: any) {
              results.failed++;
              const errorMsg = `Checkout ${checkout.id}: ${finalizeError.message}`;
              results.errors.push(errorMsg);
              console.error(`[Auto-Finalize] â‌Œ ${errorMsg}`);
            }
          } else {
            console.log(`[Auto-Finalize] Checkout ${checkout.id}: No subscription ID yet`);
          }
        } else {
          console.log(`[Auto-Finalize] Checkout ${checkout.id}: Payment not completed (status: ${session.payment_status})`);
        }
      } catch (error: any) {
        results.failed++;
        const errorMsg = `Checkout ${checkout.id}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[Auto-Finalize] â‌Œ ${errorMsg}`);
      }
    }

    console.log(`[Auto-Finalize] Completed: ${results.finalized} finalized, ${results.failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Auto-finalization complete`,
      results,
    });
  } catch (error: any) {
    console.error("[Auto-Finalize] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to auto-finalize payments",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/payments/stripe/manual-finalize
 * Manually finalize a Stripe subscription payment (for testing or when webhook fails)
 * 
 * Body: { subscriptionId?: string, sessionId?: string, checkoutId?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })) as any;

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!stripeClient) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { subscriptionId, sessionId, checkoutId } = body;

    let finalSubscriptionId = subscriptionId;
    let finalSessionId = sessionId;

    // If checkoutId is provided, get session/subscription from checkout
    if (checkoutId && !finalSubscriptionId && !finalSessionId) {
      const checkout = await prisma.payment_checkout.findUnique({
        where: { id: checkoutId },
      });

      if (!checkout) {
        return NextResponse.json(
          { error: "Checkout not found" },
          { status: 404 }
        );
      }

      if (checkout.intent !== PaymentIntent.subscription) {
        return NextResponse.json(
          { error: "Checkout is not a subscription" },
          { status: 400 }
        );
      }

      const metadata = checkout.metadata as any;
      finalSessionId = metadata?.stripeSessionId;
      finalSubscriptionId = metadata?.stripeSubscriptionId;
    }

    if (!finalSubscriptionId && !finalSessionId) {
      return NextResponse.json(
        { error: "Either subscriptionId, sessionId, or checkoutId is required" },
        { status: 400 }
      );
    }


    // If only sessionId is provided, get the subscription ID from the session
    if (!finalSubscriptionId && finalSessionId) {
      try {
        console.log(`[Manual Finalize] Retrieving session ${finalSessionId} from Stripe...`);
        const session = await stripeClient.checkout.sessions.retrieve(finalSessionId, {
          expand: ['subscription'], // Expand subscription to get full details
        });
        
        console.log(`[Manual Finalize] Session mode: ${session.mode}, Payment status: ${session.payment_status}`);
        
        if (session.mode !== "subscription") {
          return NextResponse.json(
            { error: "Session is not a subscription checkout" },
            { status: 400 }
          );
        }
        
        // Check if payment was successful
        if (session.payment_status !== "paid") {
          return NextResponse.json(
            { error: `Payment not completed. Status: ${session.payment_status}` },
            { status: 400 }
          );
        }
        
        finalSubscriptionId = session.subscription as string;
        if (!finalSubscriptionId) {
          console.error(`[Manual Finalize] No subscription ID in session. Session details:`, {
            id: session.id,
            mode: session.mode,
            payment_status: session.payment_status,
            status: session.status,
          });
          return NextResponse.json(
            { error: "No subscription ID found in session. Payment may not have been completed." },
            { status: 400 }
          );
        }
        
        console.log(`[Manual Finalize] âœ… Found subscription ID: ${finalSubscriptionId}`);
      } catch (error: any) {
        console.error("[Manual Finalize] Error retrieving session:", error);
        return NextResponse.json(
          { error: `Failed to retrieve session: ${error.message}` },
          { status: 400 }
        );
      }
    }

    if (!finalSubscriptionId) {
      return NextResponse.json(
        { error: "Could not determine subscription ID" },
        { status: 400 }
      );
    }

    console.log(
      `[Manual Finalize] Finalizing subscription ${finalSubscriptionId}`
    );

    // Finalize the subscription payment
    await finalizeSubscriptionPayment(finalSubscriptionId, {
      isInitialPayment: true,
      sessionId: finalSessionId || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Subscription ${finalSubscriptionId} finalized successfully`,
      subscriptionId: finalSubscriptionId,
    });
  } catch (error: any) {
    console.error("[Manual Finalize] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to finalize subscription",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

