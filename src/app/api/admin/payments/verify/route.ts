import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyAndFinalizePayment } from "@/lib/payments/verifyPayment";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { txRef } = body;

    if (!txRef) {
      return NextResponse.json(
        { error: "txRef is required" },
        { status: 400 }
      );
    }

    console.log(`[Admin Verify] Admin ${session.id} verifying payment ${txRef}`);

    const result = await verifyAndFinalizePayment(txRef);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[Admin Verify] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to verify payment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}








