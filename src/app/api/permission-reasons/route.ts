import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const reasons = await prisma.permissionreason.findMany({
      orderBy: { createdAt: "desc" },
      select: { reason: true },
    });
    return NextResponse.json({ reasons: reasons.map((r) => r.reason) });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
