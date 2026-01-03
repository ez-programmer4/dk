import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/admin/tax/test-data
 * Create test tax transaction data for local development/testing
 * Only works in development mode
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[Tax Test Data] POST request received");

    // Only allow in development (or if explicitly enabled)
    const isDevelopment = process.env.NODE_ENV !== "production" || process.env.ENABLE_TEST_DATA === "true";
    if (!isDevelopment) {
      console.log("[Tax Test Data] Blocked - not in development mode");
      return NextResponse.json(
        { error: "This endpoint is only available in development mode" },
        { status: 403 }
      );
    }

    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    console.log("[Tax Test Data] Session check:", { hasSession: !!session, role: session?.role });

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { count = 5 } = body; // Create 5 test transactions by default

    // Check if tax_transactions table exists
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM tax_transactions LIMIT 1`);
      console.log("[Tax Test Data] tax_transactions table exists");
    } catch (tableError: any) {
      console.error("[Tax Test Data] Table check failed:", tableError);
      return NextResponse.json(
        {
          error: "Tax transactions table not found",
          message: "Please run the database migration: add_stripe_tax_tracking.sql",
          details: tableError.message,
        },
        { status: 503 }
      );
    }

    // Get a sample subscription to use for test data
    console.log("[Tax Test Data] Looking for sample subscription...");
    const sampleSubscription = await prisma.student_subscriptions.findFirst({
      include: {
        student: { select: { wdt_ID: true, name: true } },
        package: { select: { id: true, name: true } },
      },
    });

    if (!sampleSubscription) {
      console.log("[Tax Test Data] No subscriptions found");
      return NextResponse.json(
        { error: "No subscriptions found. Please create a subscription first." },
        { status: 400 }
      );
    }

    console.log("[Tax Test Data] Using subscription:", {
      id: sampleSubscription.id,
      studentId: sampleSubscription.studentId,
      packageId: sampleSubscription.packageId,
    });

    const testTransactions = [];

    // Sample jurisdictions for testing
    const jurisdictions = [
      { country: "US", state: "CA", city: "Los Angeles" },
      { country: "US", state: "NY", city: "New York" },
      { country: "US", state: "TX", city: "Austin" },
      { country: "CA", state: "ON", city: "Toronto" },
      { country: "GB", state: null, city: "London" },
    ];

    const currencies = ["USD", "CAD", "GBP"];

    for (let i = 0; i < count; i++) {
      const jurisdiction = jurisdictions[i % jurisdictions.length];
      const currency = currencies[i % currencies.length];
      const baseAmount = Math.random() * 100 + 20; // Random between 20-120
      const taxRate = 0.08 + Math.random() * 0.05; // Random tax rate 8-13%
      const taxAmount = baseAmount * taxRate;
      const totalAmount = baseAmount + taxAmount;

      const taxTransactionId = `test_tax_${Date.now()}_${i}`;
      const invoiceId = `in_test_${Date.now()}_${i}`;

      // Create tax breakdown
      const taxBreakdown = {
        total_tax: taxAmount,
        breakdown: [
          {
            jurisdiction: jurisdiction.state
              ? `${jurisdiction.country}-${jurisdiction.state}`
              : jurisdiction.country,
            tax_type: "sales_tax",
            rate: taxRate,
            amount: taxAmount,
            taxable_amount: baseAmount,
          },
        ],
      };

      try {
        console.log(`[Tax Test Data] Creating test transaction ${i + 1}/${count}...`);
        
        // Insert test tax transaction
        const insertResult = await prisma.$executeRawUnsafe(
          `INSERT INTO tax_transactions (
            id, subscriptionId, invoiceId, studentId, packageId,
            taxAmount, baseAmount, totalAmount, taxBreakdown,
            billingCountry, billingState, billingCity, billingPostalCode,
            stripeTaxCalculationId, stripeCustomerId,
            taxStatus, currency, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          taxTransactionId,
          sampleSubscription.id,
          invoiceId,
          sampleSubscription.studentId,
          sampleSubscription.packageId,
          taxAmount,
          baseAmount,
          totalAmount,
          JSON.stringify(taxBreakdown),
          jurisdiction.country,
          jurisdiction.state,
          jurisdiction.city,
          `12345${i}`,
          `calc_test_${i}`,
          sampleSubscription.stripeCustomerId,
          "calculated",
          currency
        );

        console.log(`[Tax Test Data] Insert result for transaction ${i + 1}:`, insertResult);

        // Update subscription total tax
        await prisma.$executeRawUnsafe(
          `UPDATE student_subscriptions
           SET totalTaxPaid = COALESCE(totalTaxPaid, 0) + ?,
               taxEnabled = TRUE,
               updatedAt = NOW()
           WHERE id = ?`,
          taxAmount,
          sampleSubscription.id
        );

        testTransactions.push({
          id: taxTransactionId,
          invoiceId,
          taxAmount,
          baseAmount,
          totalAmount,
          jurisdiction: jurisdiction.state
            ? `${jurisdiction.country}-${jurisdiction.state}`
            : jurisdiction.country,
          currency,
        });

        console.log(`[Tax Test Data] Successfully created transaction ${i + 1}`);
      } catch (error: any) {
        console.error(`[Tax Test Data] Error creating test transaction ${i + 1}:`, error);
        console.error(`[Tax Test Data] Error details:`, {
          message: error.message,
          code: error.code,
          sqlState: error.sqlState,
        });
        // Continue with next transaction
      }
    }

    console.log(`[Tax Test Data] Successfully created ${testTransactions.length} test transactions`);

    return NextResponse.json({
      success: true,
      message: `Created ${testTransactions.length} test tax transactions`,
      transactions: testTransactions,
      subscription: {
        id: sampleSubscription.id,
        student: sampleSubscription.student?.name || `Student #${sampleSubscription.studentId}`,
        package: sampleSubscription.package?.name || `Package #${sampleSubscription.packageId}`,
      },
    });
  } catch (error: any) {
    console.error("[Tax Test Data] Fatal error:", error);
    console.error("[Tax Test Data] Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/tax/test-data
 * Delete all test tax transactions (for cleanup)
 */
export async function DELETE(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is only available in development mode" },
        { status: 403 }
      );
    }

    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Delete all test transactions
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM tax_transactions WHERE id LIKE 'test_tax_%'`
    );

    // Reset subscription tax totals
    await prisma.$executeRawUnsafe(
      `UPDATE student_subscriptions SET totalTaxPaid = 0 WHERE totalTaxPaid > 0`
    );

    return NextResponse.json({
      success: true,
      message: "All test tax transactions deleted",
      deletedCount: result,
    });
  } catch (error: any) {
    console.error("[Tax Test Data] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

