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

    // Get all premium packages
    const packages = await prisma.premiumPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      packages,
    });

  } catch (error) {
    console.error("Premium packages fetch error:", error);
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
    const { name, description, packagePricePerStudent, currency } = body;

    if (!name || !packagePricePerStudent) {
      return NextResponse.json(
        { error: "Missing required fields: name, packagePricePerStudent" },
        { status: 400 }
      );
    }

    const premiumPackage = await prisma.premiumPackage.create({
      data: {
        name,
        description,
        packagePricePerStudent: parseFloat(packagePricePerStudent),
        currency: currency || "ETB",
      },
    });

    return NextResponse.json({
      success: true,
      package: premiumPackage,
      message: "Premium package created successfully",
    });

  } catch (error) {
    console.error("Premium package creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

