/**
 * Super Admin Invoice Payment API
 * 
 * POST: Process manual payment for an invoice
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processInvoicePayment } from "@/lib/billing/billing-calculator";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/super-admin/billing/invoices/[id]/payment - Process payment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoiceId = params.id;
    const body = await req.json();
    const { paymentMethod, paymentReference, notes } = body;

    if (!paymentMethod || !paymentReference) {
      return NextResponse.json(
        { error: "paymentMethod and paymentReference are required" },
        { status: 400 }
      );
    }

    // Verify invoice exists
    const invoice = await prisma.billingInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    // Process payment
    const updatedInvoice = await processInvoicePayment(
      invoiceId,
      paymentMethod,
      paymentReference,
      session.user.id,
      notes
    );

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "process_payment",
          resourceType: "invoice",
          resourceId: invoiceId,
          details: {
            invoiceNumber: invoice.invoiceNumber,
            schoolId: invoice.schoolId,
            schoolName: invoice.school.name,
            amount: invoice.totalAmount.toString(),
            paymentMethod,
            paymentReference,
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
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error("Process payment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment" },
      { status: 500 }
    );
  }
}


