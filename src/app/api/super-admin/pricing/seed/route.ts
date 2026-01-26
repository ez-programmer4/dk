import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { seedPricingData } from "@/lib/pricing-seed";

// POST /api/super-admin/pricing/seed - Seed initial pricing data
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await seedPricingData();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Pricing seed API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
