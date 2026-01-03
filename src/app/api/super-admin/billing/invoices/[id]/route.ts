/**
 * Super Admin Individual Invoice API
 *
 * GET: Get a single invoice with full details
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/super-admin/billing/invoices/[id] - Get single invoice
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await prisma.billingInvoice.findUnique({
      where: { id: params.id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error: any) {
    console.error("Get invoice error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
