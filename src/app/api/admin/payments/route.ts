import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all payments with filtering
export async function GET(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statsOnly = searchParams.get("statsOnly") === "true";
    
    if (statsOnly) {
      console.log(`[Admin Payments API] ========== STATS ONLY REQUEST ==========`);
      console.log(`[Admin Payments API] Fetching ALL payments for statistics (no filters)`);
    }
    
    const status = searchParams.get("status") || "";
    const searchQuery = searchParams.get("search") || "";
    const countryFilter = searchParams.get("country") || "";
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const whereClause: any = {};
    
    // For statistics, get ALL payments from database without any filters
    if (statsOnly) {
      // No filters - get everything for accurate statistics
      // Use empty whereClause to get all payments
      // Don't set anything - empty object means no filters
    } else {
      // Build status filter: Gateway payments must be approved, manual can be any status
      if (status) {
        // If status filter is specified, apply it
        whereClause.status = status;
      } else {
        // If no status filter, show approved gateway payments + all manual payments
        // Show: (status = "Approved") OR (source = "manual")
        whereClause.OR = [
          { status: "Approved" }, // All approved payments (gateway or manual)
          { source: "manual" }, // All manual payments regardless of status
        ];
      }
    }
    
    // Add search query (skip for stats)
    if (searchQuery && !statsOnly) {
      const searchConditions = [
        { studentname: { contains: searchQuery } },
        { transactionid: { contains: searchQuery } },
      ];
      
      // If we already have an OR clause for status, combine them
      if (whereClause.OR) {
        // Combine: (status OR source) AND (name OR transaction)
        whereClause.AND = [
          { OR: whereClause.OR },
          { OR: searchConditions },
        ];
        delete whereClause.OR;
      } else {
        whereClause.OR = searchConditions;
      }
    }
    if (countryFilter && !statsOnly) {
      whereClause.wpos_wpdatatable_23 = {
        country: countryFilter,
      };
    }
    // Date range filter (skip for stats)
    if ((startDateStr || endDateStr) && !statsOnly) {
      whereClause.paymentdate = {};
      if (startDateStr) {
        const sd = new Date(startDateStr);
        if (!isNaN(sd.getTime())) (whereClause.paymentdate as any).gte = sd;
      }
      if (endDateStr) {
        const ed = new Date(endDateStr);
        if (!isNaN(ed.getTime())) (whereClause.paymentdate as any).lte = ed;
      }
    }

    // Debug: First check ALL payments without date filter to see if Stripe payments exist
    const allPaymentsCheck = await prisma.payment.findMany({
      where: {
        OR: [
          { status: "Approved" },
          { source: "manual" },
        ],
      },
      select: {
        id: true,
        source: true,
        status: true,
        paymentdate: true,
        studentname: true,
        paidamount: true,
      },
      take: 50, // Just check recent 50
      orderBy: {
        paymentdate: "desc",
      },
    });
    
    const allStripePayments = allPaymentsCheck.filter(p => p.source === "stripe");
    console.log(`[Admin Payments API] ========== DEBUG: All Payments Check ==========`);
    console.log(`[Admin Payments API] Total payments (no date filter): ${allPaymentsCheck.length}`);
    console.log(`[Admin Payments API] Stripe payments found (no date filter): ${allStripePayments.length}`);
    if (allStripePayments.length > 0) {
      console.log(`[Admin Payments API] Stripe payment details (no date filter):`);
      allStripePayments.forEach((p, idx) => {
        console.log(`[Admin Payments API]   [${idx + 1}] ID: ${p.id}, Status: ${p.status}, Source: ${p.source}, Date: ${p.paymentdate}, Amount: ${p.paidamount}, Student: ${p.studentname}`);
      });
    } else {
      console.log(`[Admin Payments API] ⚠️ NO STRIPE PAYMENTS IN DATABASE - Webhook likely didn't fire!`);
      
      // Check for pending subscription checkouts
      const { PaymentIntent, PaymentSource } = await import("@prisma/client");
      const pendingCheckouts = await prisma.payment_checkout.findMany({
        where: {
          provider: PaymentSource.stripe,
          intent: PaymentIntent.subscription,
          status: { not: "completed" },
        },
        select: {
          id: true,
          txRef: true,
          studentId: true,
          status: true,
          createdAt: true,
          metadata: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });
      
      if (pendingCheckouts.length > 0) {
        console.log(`[Admin Payments API] 🔍 Found ${pendingCheckouts.length} pending subscription checkouts that need manual finalization:`);
        pendingCheckouts.forEach((checkout, idx) => {
          const metadata = checkout.metadata as any;
          console.log(`[Admin Payments API]   [${idx + 1}] Checkout ID: ${checkout.id}, Status: ${checkout.status}`);
          console.log(`[Admin Payments API]      Session ID: ${metadata?.stripeSessionId || 'N/A'}`);
          console.log(`[Admin Payments API]      Subscription ID: ${metadata?.stripeSubscriptionId || 'N/A'}`);
          console.log(`[Admin Payments API]      Student ID: ${checkout.studentId}, Created: ${checkout.createdAt}`);
          console.log(`[Admin Payments API]      → Use manual finalize endpoint with checkoutId: ${checkout.id}`);
        });
      } else {
        console.log(`[Admin Payments API] ℹ️ No pending checkouts found. Payment may need to be finalized manually using Stripe session/subscription ID.`);
      }
    }

    // Get confirmed payments from payment table
    const payments = await prisma.payment.findMany({
      where: whereClause,
      orderBy: {
        paymentdate: "desc",
      },
      include: {
        wpos_wpdatatable_23: {
          select: {
            classfeeCurrency: true,
            country: true,
          },
        },
        subscription: {
          include: {
            package: {
              select: {
                name: true,
                duration: true,
                price: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    // Debug: Log payment counts and sources
    console.log(`[Admin Payments API] ========== Payment Query Results (with filters) ==========`);
    console.log(`[Admin Payments API] Found ${payments.length} total payments from database`);
    console.log(`[Admin Payments API] Where clause used:`, JSON.stringify(whereClause, null, 2));
    
    const stripePayments = payments.filter(p => p.source === "stripe");
    const chapaPayments = payments.filter(p => p.source === "chapa");
    const manualPayments = payments.filter(p => p.source === "manual" || !p.source);
    
    console.log(`[Admin Payments API] Breakdown by source:`);
    console.log(`[Admin Payments API]   - Stripe: ${stripePayments.length}`);
    console.log(`[Admin Payments API]   - Chapa: ${chapaPayments.length}`);
    console.log(`[Admin Payments API]   - Manual: ${manualPayments.length}`);
    
    // Log details of Stripe payments
    if (stripePayments.length > 0) {
      console.log(`[Admin Payments API] Stripe payment details:`);
      stripePayments.forEach((p, idx) => {
        console.log(`[Admin Payments API]   [${idx + 1}] ID: ${p.id}, Status: ${p.status}, Amount: ${p.paidamount}, Date: ${p.paymentdate}`);
      });
    } else {
      console.log(`[Admin Payments API] ⚠️ No Stripe payments found in query results`);
    }

    // Filter: Gateway payments must be approved, manual payments can be any status
    // Note: This is a safety filter, the whereClause should already handle this
    // Skip filtering for stats - we want ALL payments from database
    const filteredPayments = statsOnly 
      ? payments // For stats, return all payments as-is from database
      : payments.filter((p) => {
          const isGateway = p.source === "stripe" || p.source === "chapa";
          if (isGateway) {
            // Gateway payments must be approved
            const isApproved = p.status === "Approved" || p.status === "approved";
            if (!isApproved) {
              console.log(`[Admin Payments API] Filtered out gateway payment ${p.id}: status=${p.status}, source=${p.source}`);
            }
            return isApproved;
          }
          // Manual payments - show all statuses (if no status filter) or filtered status
          return true;
        });

    console.log(`[Admin Payments API] After filtering: ${filteredPayments.length} payments`);

    // Map payments
    const mappedPayments = filteredPayments.map((p) => ({
      id: p.id,
      studentid: p.studentid,
      studentname: p.studentname,
      paymentdate: p.paymentdate?.toISOString?.() || p.paymentdate,
      paidamount: Number(p.paidamount) || 0,
      transactionid: p.transactionid,
      reason: p.reason,
      status: p.status,
      sendername: p.studentname || "Unknown",
      currency: p.currency || p.wpos_wpdatatable_23?.classfeeCurrency || "ETB", // Use payment's currency first, fallback to student's
      country: p.wpos_wpdatatable_23?.country || undefined,
      source: p.source || "manual", // Default to manual if not set
      isPendingCheckout: false,
      intent: p.intent || undefined,
      providerReference: p.providerReference || undefined,
      providerStatus: p.providerStatus || undefined,
      providerFee: p.providerFee ? Number(p.providerFee) : undefined,
      subscription: p.subscription
        ? {
            id: p.subscription.id,
            status: p.subscription.status,
            startDate: p.subscription.startDate?.toISOString?.() || p.subscription.startDate,
            endDate: p.subscription.endDate?.toISOString?.() || p.subscription.endDate,
            package: p.subscription.package
              ? {
                  name: p.subscription.package.name,
                  duration: p.subscription.package.duration,
                  price: Number(p.subscription.package.price),
                  currency: p.subscription.package.currency,
                }
              : null,
          }
        : undefined,
    }));

    // Only show successful payments - no pending checkouts
    const filtered = mappedPayments;

    // Sort by date (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.paymentdate).getTime();
      const dateB = new Date(b.paymentdate).getTime();
      return dateB - dateA;
    });

    if (statsOnly) {
      console.log(`[Admin Payments API] ========== STATS ONLY RESPONSE ==========`);
      console.log(`[Admin Payments API] Returning ${filtered.length} payments for statistics`);
      console.log(`[Admin Payments API] Payment summary:`);
      const summary = {
        total: filtered.length,
        byStatus: {} as Record<string, number>,
        byCurrency: {} as Record<string, number>,
        bySource: {} as Record<string, number>,
      };
      filtered.forEach((p: any) => {
        const status = p.status || 'N/A';
        const currency = p.currency || 'N/A';
        const source = p.source || 'N/A';
        summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
        summary.byCurrency[currency] = (summary.byCurrency[currency] || 0) + 1;
        summary.bySource[source] = (summary.bySource[source] || 0) + 1;
      });
      console.log(`[Admin Payments API] Summary:`, JSON.stringify(summary, null, 2));
      console.log(`[Admin Payments API] ========== END STATS ONLY ==========`);
    }

    return NextResponse.json(filtered, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Payment fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}

// PUT to update a payment status
export async function PUT(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Payment ID and status are required" },
        { status: 400 }
      );
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: Number(id) },
      data: { status },
    });

    // If approved and payment has months_table entries with pending status, update them to Paid
    if (status === "Approved") {
      await prisma.months_table.updateMany({
        where: {
          paymentId: Number(id),
          payment_status: "pending",
        },
        data: {
          payment_status: "Paid",
        },
      });
    }

    return NextResponse.json(updatedPayment, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Payment update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}
