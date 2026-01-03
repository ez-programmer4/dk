/**
 * Super Admin Billing Invoices API
 * 
 * GET: List all invoices
 * POST: Generate invoice for a school/period
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPendingInvoices, getSchoolInvoices } from "@/lib/billing/billing-calculator";
import { calculateBilling, createBillingInvoice } from "@/lib/billing/billing-calculator";
import { autoTrackCurrentPeriod } from "@/lib/billing/usage-tracking";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/super-admin/billing/invoices - List all invoices
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let invoices;
    if (schoolId) {
      invoices = await getSchoolInvoices(schoolId, status || undefined, limit);
    } else if (status === "pending") {
      invoices = await getPendingInvoices(limit);
    } else {
      // Get all invoices (you may want to add pagination here)
      const { prisma } = await import("@/lib/prisma");
      invoices = await prisma.billingInvoice.findMany({
        include: {
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error: any) {
    console.error("Get invoices error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/billing/invoices - Generate invoice
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { schoolId, period } = body;

    if (!schoolId || !period) {
      return NextResponse.json(
        { error: "schoolId and period are required" },
        { status: 400 }
      );
    }

    // Validate period format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: "Period must be in YYYY-MM format" },
        { status: 400 }
      );
    }

    // Auto-track usage for the period if not already tracked
    await autoTrackCurrentPeriod(schoolId);

    // Calculate billing
    const calculation = await calculateBilling(schoolId, period);

    // Create invoice
    const invoice = await createBillingInvoice(schoolId, period, calculation);

    // Create audit log
    const { prisma } = await import("@/lib/prisma");
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "generate_invoice",
          resourceType: "invoice",
          resourceId: invoice.id,
          details: {
            schoolId,
            period,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: calculation.total,
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      invoice,
      calculation,
    });
  } catch (error: any) {
    console.error("Generate invoice error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/billing/invoices/bulk - Bulk generate invoices
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { schoolIds, period } = body;

    if (!schoolIds || !Array.isArray(schoolIds) || !period) {
      return NextResponse.json(
        { error: "schoolIds (array) and period are required" },
        { status: 400 }
      );
    }

    // Validate period format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { error: "Period must be in YYYY-MM format" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const schoolId of schoolIds) {
      try {
        // Auto-track usage for the period if not already tracked
        await autoTrackCurrentPeriod(schoolId);

        // Calculate billing
        const calculation = await calculateBilling(schoolId, period);

        // Create invoice
        const invoice = await createBillingInvoice(schoolId, period, calculation);

        results.push({
          schoolId,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: calculation.total,
        });
      } catch (error: any) {
        errors.push({
          schoolId,
          error: error.message || "Failed to generate invoice",
        });
      }
    }

    // Create audit log
    const { prisma } = await import("@/lib/prisma");
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "bulk_generate_invoices",
          resourceType: "invoices",
          resourceId: "bulk",
          details: {
            period,
            schoolCount: schoolIds.length,
            successCount: results.length,
            errorCount: errors.length,
            results,
            errors,
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
      summary: {
        total: schoolIds.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error: any) {
    console.error("Bulk generate invoices error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to bulk generate invoices" },
      { status: 500 }
    );
  }
}


