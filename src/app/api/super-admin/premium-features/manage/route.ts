import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all premium features
    const premiumFeatures = await prisma.premiumFeature.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      features: premiumFeatures,
    });

  } catch (error) {
    console.error("Premium features fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, name, description, category, basePricePerStudent, currency, isRequired, sortOrder } = body;

    if (!code || !name || !category || !basePricePerStudent) {
      return NextResponse.json(
        { error: "Missing required fields: code, name, category, basePricePerStudent" },
        { status: 400 }
      );
    }

    // Check if feature code already exists
    const existingFeature = await prisma.premiumFeature.findUnique({
      where: { code },
    });

    if (existingFeature) {
      return NextResponse.json(
        { error: "Feature code already exists" },
        { status: 400 }
      );
    }

    const feature = await prisma.premiumFeature.create({
      data: {
        code,
        name,
        description,
        category,
        basePricePerStudent: parseFloat(basePricePerStudent),
        currency: currency || "ETB",
        isRequired: isRequired || false,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({
      success: true,
      feature,
      message: "Premium feature created successfully",
    });

  } catch (error) {
    console.error("Premium feature creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}








