import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/tax/reports
 * Get tax reports with various filters and aggregations
 */
export async function GET(req: NextRequest) {
  try {
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

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "summary"; // summary, detailed, by-jurisdiction, by-subscription, by-student
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const jurisdiction = searchParams.get("jurisdiction"); // e.g., "US-CA"
    const subscriptionId = searchParams.get("subscriptionId");
    const studentId = searchParams.get("studentId");
    const packageId = searchParams.get("packageId");
    const currency = searchParams.get("currency");

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Build where clause for raw SQL
    let whereConditions: string[] = ["taxStatus = 'calculated'"];
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      whereConditions.push(`createdAt >= ?`);
      // Use UTC time to match database storage
      const start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);
      params.push(start);
      paramIndex++;
    }
    if (endDate) {
      whereConditions.push(`createdAt <= ?`);
      // Use UTC time to match database storage
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      params.push(end);
      paramIndex++;
    }
    if (subscriptionId) {
      whereConditions.push(`subscriptionId = ?`);
      params.push(parseInt(subscriptionId));
      paramIndex++;
    }
    if (studentId) {
      whereConditions.push(`studentId = ?`);
      params.push(parseInt(studentId));
      paramIndex++;
    }
    if (packageId) {
      whereConditions.push(`packageId = ?`);
      params.push(parseInt(packageId));
      paramIndex++;
    }
    if (currency) {
      whereConditions.push(`currency = ?`);
      params.push(currency.toUpperCase());
      paramIndex++;
    }
    if (jurisdiction) {
      const parts = jurisdiction.split("-");
      if (parts.length === 2) {
        whereConditions.push(`billingCountry = ? AND billingState = ?`);
        params.push(parts[0], parts[1]);
        paramIndex += 2;
      } else {
        whereConditions.push(`billingCountry = ?`);
        params.push(jurisdiction);
        paramIndex++;
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Check if tax_transactions table exists
    try {
      await prisma.$queryRawUnsafe(`SELECT 1 FROM tax_transactions LIMIT 1`);
    } catch (tableError: any) {
      // Table doesn't exist - return helpful error
      return NextResponse.json(
        {
          error: "Tax transactions table not found",
          message: "Please run the database migration: add_stripe_tax_tracking.sql",
          details: tableError.message,
        },
        { status: 503 }
      );
    }

    switch (reportType) {
      case "summary":
        return await getTaxSummary(whereClause, params);

      case "detailed":
        return await getTaxDetailed(whereClause, params, searchParams);

      case "by-jurisdiction":
        return await getTaxByJurisdiction(whereClause, params);

      case "by-subscription":
        return await getTaxBySubscription(whereClause, params);

      case "by-student":
        return await getTaxByStudent(whereClause, params);

      case "export":
        return await exportTaxReport(whereClause, params, searchParams);

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("[Tax Reports] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get tax summary (totals, averages, counts)
 */
async function getTaxSummary(whereClause: string, params: any[]) {
  // Debug: Check total tax transactions in database
  const totalCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*) as count FROM tax_transactions WHERE taxStatus = 'calculated'`
  ).catch(() => [{ count: BigInt(0) }]);
  
  console.log(`[Tax Reports] Total tax transactions in database: ${totalCount[0]?.count || 0}`);
  
  // Debug: Check recent tax transactions
  const recentTransactions = await prisma.$queryRawUnsafe<Array<{
    id: string;
    invoiceId: string;
    taxAmount: number;
    createdAt: Date;
  }>>(
    `SELECT id, invoiceId, taxAmount, createdAt FROM tax_transactions WHERE taxStatus = 'calculated' ORDER BY createdAt DESC LIMIT 10`
  ).catch(() => []);
  
  console.log(`[Tax Reports] Recent tax transactions:`, recentTransactions.map(tx => ({
    invoiceId: tx.invoiceId,
    taxAmount: tx.taxAmount,
    createdAt: tx.createdAt,
  })));
  
  const summaryQuery = `
    SELECT 
      COALESCE(SUM(taxAmount), 0) as totalTax,
      COALESCE(SUM(baseAmount), 0) as totalBaseAmount,
      COALESCE(SUM(totalAmount), 0) as totalAmount,
      COUNT(*) as transactionCount,
      COALESCE(AVG(taxAmount), 0) as avgTaxAmount,
      currency
    FROM tax_transactions
    ${whereClause}
    GROUP BY currency
  `;

  console.log("[Tax Reports] Summary query:", summaryQuery);
  console.log("[Tax Reports] Summary params:", params);

  const summary = await prisma.$queryRawUnsafe(summaryQuery, ...params).catch((err) => {
    console.error("[Tax Reports] Summary query error:", err);
    return [];
  });

  console.log("[Tax Reports] Summary result:", summary);

  const byJurisdictionQuery = `
    SELECT 
      billingCountry,
      billingState,
      COALESCE(SUM(taxAmount), 0) as totalTax,
      COUNT(*) as transactionCount
    FROM tax_transactions
    ${whereClause}
    GROUP BY billingCountry, billingState
    ORDER BY totalTax DESC
    LIMIT 20
  `;

  console.log("[Tax Reports] Jurisdiction query:", byJurisdictionQuery);

  const byJurisdiction = await prisma.$queryRawUnsafe(byJurisdictionQuery, ...params).catch((err) => {
    console.error("[Tax Reports] Jurisdiction query error:", err);
    return [];
  });

  console.log("[Tax Reports] Jurisdiction result:", byJurisdiction);

  const summaryFormatted = (summary as any[]).map((s) => ({
    totalTax: Number(s.totalTax),
    totalBaseAmount: Number(s.totalBaseAmount),
    totalAmount: Number(s.totalAmount),
    transactionCount: Number(s.transactionCount),
    avgTaxAmount: Number(s.avgTaxAmount),
    currency: s.currency || "USD",
  }));

  const byJurisdictionFormatted = (byJurisdiction as any[]).map((j) => ({
    jurisdiction: j.billingState
      ? `${j.billingCountry}-${j.billingState}`
      : j.billingCountry || "Unknown",
    country: j.billingCountry || "Unknown",
    state: j.billingState,
    totalTax: Number(j.totalTax),
    transactionCount: Number(j.transactionCount),
  }));

  console.log("[Tax Reports] Formatted summary:", summaryFormatted);
  console.log("[Tax Reports] Formatted jurisdictions:", byJurisdictionFormatted);

  return NextResponse.json({
    summary: summaryFormatted,
    byJurisdiction: byJurisdictionFormatted,
  });
}

/**
 * Get detailed tax transactions
 */
async function getTaxDetailed(whereClause: string, params: any[], searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  const transactionsQuery = `
    SELECT 
      id,
      invoiceId,
      subscriptionId,
      studentId,
      packageId,
      taxAmount,
      baseAmount,
      totalAmount,
      billingCountry,
      billingState,
      billingCity,
      currency,
      createdAt,
      taxBreakdown
    FROM tax_transactions
    ${whereClause}
    ORDER BY createdAt DESC
    LIMIT ? OFFSET ?
  `;

  const transactions = await prisma.$queryRawUnsafe(
    transactionsQuery,
    ...params,
    limit,
    offset
  ).catch(() => []);

  const countQuery = `
    SELECT COUNT(*) as count
    FROM tax_transactions
    ${whereClause}
  `;

  const totalCount = await prisma.$queryRawUnsafe(countQuery, ...params).catch(() => [{ count: BigInt(0) }]);

  // Get student and package names
  const enrichedTransactions = await Promise.all(
    (transactions as any[]).map(async (tx) => {
      const [student, packageData] = await Promise.all([
        prisma.wpos_wpdatatable_23.findUnique({
          where: { wdt_ID: tx.studentId },
          select: { name: true, wdt_ID: true },
        }),
        prisma.subscription_packages.findUnique({
          where: { id: tx.packageId },
          select: { name: true, id: true },
        }),
      ]);

      return {
        ...tx,
        taxAmount: Number(tx.taxAmount),
        baseAmount: Number(tx.baseAmount),
        totalAmount: Number(tx.totalAmount),
        taxBreakdown: tx.taxBreakdown
          ? (typeof tx.taxBreakdown === "string" ? JSON.parse(tx.taxBreakdown) : tx.taxBreakdown)
          : null,
        student: student
          ? { id: student.wdt_ID, name: student.name }
          : null,
        package: packageData
          ? { id: packageData.id, name: packageData.name }
          : null,
      };
    })
  );

  return NextResponse.json({
    transactions: enrichedTransactions,
    pagination: {
      page,
      limit,
      total: Number((totalCount as any[])[0]?.count || 0),
      totalPages: Math.ceil(Number((totalCount as any[])[0]?.count || 0) / limit),
    },
  });
}

/**
 * Get tax grouped by jurisdiction
 */
async function getTaxByJurisdiction(whereClause: string, params: any[]) {
  const query = `
    SELECT 
      billingCountry,
      billingState,
      COALESCE(SUM(taxAmount), 0) as totalTax,
      COALESCE(SUM(baseAmount), 0) as totalBaseAmount,
      COUNT(*) as transactionCount,
      CASE 
        WHEN SUM(baseAmount) > 0 
        THEN (SUM(taxAmount) / SUM(baseAmount)) * 100
        ELSE 0
      END as avgTaxRate
    FROM tax_transactions
    ${whereClause}
    GROUP BY billingCountry, billingState
    ORDER BY totalTax DESC
  `;

  const byJurisdiction = await prisma.$queryRawUnsafe(query, ...params).catch(() => []);

  return NextResponse.json({
    jurisdictions: (byJurisdiction as any[]).map((j) => ({
      jurisdiction: j.billingState
        ? `${j.billingCountry}-${j.billingState}`
        : j.billingCountry,
      country: j.billingCountry,
      state: j.billingState,
      totalTax: Number(j.totalTax),
      totalBaseAmount: Number(j.totalBaseAmount),
      transactionCount: Number(j.transactionCount),
      avgTaxRate: Number(j.avgTaxRate),
    })),
  });
}

/**
 * Get tax grouped by subscription
 */
async function getTaxBySubscription(whereClause: string, params: any[]) {
  const query = `
    SELECT 
      subscriptionId,
      COALESCE(SUM(taxAmount), 0) as totalTax,
      COUNT(*) as transactionCount
    FROM tax_transactions
    ${whereClause}
    GROUP BY subscriptionId
    ORDER BY totalTax DESC
    LIMIT 100
  `;

  const bySubscription = await prisma.$queryRawUnsafe(query, ...params).catch(() => []);

  // Enrich with subscription details
  const enriched = await Promise.all(
    (bySubscription as any[]).map(async (sub) => {
      const subscription = await prisma.student_subscriptions.findUnique({
        where: { id: sub.subscriptionId },
        include: {
          student: { select: { name: true, wdt_ID: true } },
          package: { select: { name: true, id: true } },
        },
      });

      return {
        subscriptionId: sub.subscriptionId,
        totalTax: Number(sub.totalTax),
        transactionCount: Number(sub.transactionCount),
        subscription: subscription
          ? {
              id: subscription.id,
              student: subscription.student
                ? {
                    id: subscription.student.wdt_ID,
                    name: subscription.student.name,
                  }
                : null,
              package: subscription.package
                ? {
                    id: subscription.package.id,
                    name: subscription.package.name,
                  }
                : null,
            }
          : null,
      };
    })
  );

  return NextResponse.json({ subscriptions: enriched });
}

/**
 * Get tax grouped by student
 */
async function getTaxByStudent(whereClause: string, params: any[]) {
  const query = `
    SELECT 
      studentId,
      COALESCE(SUM(taxAmount), 0) as totalTax,
      COUNT(*) as transactionCount
    FROM tax_transactions
    ${whereClause}
    GROUP BY studentId
    ORDER BY totalTax DESC
    LIMIT 100
  `;

  const byStudent = await prisma.$queryRawUnsafe(query, ...params).catch(() => []);

  // Enrich with student details
  const enriched = await Promise.all(
    (byStudent as any[]).map(async (stu) => {
      const student = await prisma.wpos_wpdatatable_23.findUnique({
        where: { wdt_ID: stu.studentId },
        select: { name: true, wdt_ID: true },
      });

      return {
        studentId: stu.studentId,
        totalTax: Number(stu.totalTax),
        transactionCount: Number(stu.transactionCount),
        student: student
          ? { id: student.wdt_ID, name: student.name }
          : null,
      };
    })
  );

  return NextResponse.json({ students: enriched });
}

/**
 * Export tax report as CSV
 */
async function exportTaxReport(whereClause: string, params: any[], searchParams: URLSearchParams) {
  const format = searchParams.get("format") || "csv"; // csv, json

  const query = `
    SELECT 
      invoiceId,
      studentId,
      packageId,
      taxAmount,
      baseAmount,
      totalAmount,
      billingCountry,
      billingState,
      billingCity,
      currency,
      createdAt
    FROM tax_transactions
    ${whereClause}
    ORDER BY createdAt DESC
  `;

  const transactions = await prisma.$queryRawUnsafe(query, ...params).catch(() => []);

  if (format === "csv") {
    // Generate CSV
    const headers = [
      "Invoice ID",
      "Student ID",
      "Package ID",
      "Tax Amount",
      "Base Amount",
      "Total Amount",
      "Country",
      "State",
      "City",
      "Currency",
      "Date",
    ];

    const rows = (transactions as any[]).map((tx) => [
      tx.invoiceId,
      tx.studentId.toString(),
      tx.packageId.toString(),
      Number(tx.taxAmount).toFixed(2),
      Number(tx.baseAmount).toFixed(2),
      Number(tx.totalAmount).toFixed(2),
      tx.billingCountry || "",
      tx.billingState || "",
      tx.billingCity || "",
      tx.currency,
      new Date(tx.createdAt).toISOString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tax-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } else {
    // Return JSON
    return NextResponse.json({
      transactions: (transactions as any[]).map((tx) => ({
        invoiceId: tx.invoiceId,
        studentId: tx.studentId,
        packageId: tx.packageId,
        taxAmount: Number(tx.taxAmount),
        baseAmount: Number(tx.baseAmount),
        totalAmount: Number(tx.totalAmount),
        billingCountry: tx.billingCountry,
        billingState: tx.billingState,
        billingCity: tx.billingCity,
        currency: tx.currency,
        createdAt: new Date(tx.createdAt).toISOString(),
      })),
    });
  }
}

