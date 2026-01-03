import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/subscription-packages
 * List all subscription packages (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (
      !session ||
      (session.role !== "admin" && session.role !== "registral")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const packages = await prisma.subscription_packages.findMany({
      orderBy: [
        { isActive: "desc" },
        { duration: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      packages: packages.map((pkg) => ({
        ...pkg,
        price: Number(pkg.price),
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/subscription-packages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription packages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/subscription-packages
 * Create a new subscription package (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (
      !session ||
      (session.role !== "admin" && session.role !== "registral")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, duration, price, currency, description, paymentLink, isActive } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Package name is required" },
        { status: 400 }
      );
    }

    if (!duration || typeof duration !== "number" || duration <= 0) {
      return NextResponse.json(
        { error: "Duration must be a positive number" },
        { status: 400 }
      );
    }

    if (!price || typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 }
      );
    }

    if (!currency || typeof currency !== "string" || currency.length !== 3) {
      return NextResponse.json(
        { error: "Currency must be a 3-letter ISO code (e.g., USD)" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.subscription_packages.findFirst({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A package with this name already exists" },
        { status: 400 }
      );
    }

    const newPackage = await prisma.subscription_packages.create({
      data: {
        name: name.trim(),
        duration: Math.round(duration),
        price: price,
        currency: currency.toUpperCase(),
        description: description?.trim() || null,
        paymentLink: paymentLink?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({
      success: true,
      package: {
        ...newPackage,
        price: Number(newPackage.price),
      },
    });
  } catch (error) {
    console.error("POST /api/admin/subscription-packages error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription package" },
      { status: 500 }
    );
  }
}



