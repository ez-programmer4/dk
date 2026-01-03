import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/subscription-packages/[id]
 * Get a single subscription package by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid package ID" },
        { status: 400 }
      );
    }

    const pkg = await prisma.subscription_packages.findUnique({
      where: { id },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      package: {
        ...pkg,
        price: Number(pkg.price),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/subscription-packages/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription package" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/subscription-packages/[id]
 * Update a subscription package
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid package ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, duration, price, currency, description, paymentLink, isActive } = body;

    // Check if package exists
    const existing = await prisma.subscription_packages.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    // Validation
    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Package name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (duration !== undefined) {
      if (typeof duration !== "number" || duration <= 0) {
        return NextResponse.json(
          { error: "Duration must be a positive number" },
          { status: 400 }
        );
      }
      updateData.duration = Math.round(duration);
    }

    if (price !== undefined) {
      if (typeof price !== "number" || price <= 0) {
        return NextResponse.json(
          { error: "Price must be a positive number" },
          { status: 400 }
        );
      }
      updateData.price = price;
    }

    if (currency !== undefined) {
      if (typeof currency !== "string" || currency.length !== 3) {
        return NextResponse.json(
          { error: "Currency must be a 3-letter ISO code" },
          { status: 400 }
        );
      }
      updateData.currency = currency.toUpperCase();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (paymentLink !== undefined) {
      updateData.paymentLink = paymentLink?.trim() || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Check for duplicate name (if name is being updated)
    if (updateData.name && updateData.name !== existing.name) {
      const duplicate = await prisma.subscription_packages.findFirst({
        where: { name: updateData.name },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "A package with this name already exists" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.subscription_packages.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      package: {
        ...updated,
        price: Number(updated.price),
      },
    });
  } catch (error) {
    console.error("PUT /api/admin/subscription-packages/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update subscription package" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/subscription-packages/[id]
 * Delete a subscription package (soft delete by setting isActive=false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid package ID" },
        { status: 400 }
      );
    }

    // Check if package exists
    const existing = await prisma.subscription_packages.findUnique({
      where: { id },
      include: {
        subscriptions: {
          where: {
            status: { in: ["active", "trialing"] },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    // Check if package has active subscriptions
    if (existing.subscriptions.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete package with active subscriptions. Deactivate it instead.",
        },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive=false
    const updated = await prisma.subscription_packages.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Package deactivated successfully",
      package: {
        ...updated,
        price: Number(updated.price),
      },
    });
  } catch (error) {
    console.error("DELETE /api/admin/subscription-packages/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription package" },
      { status: 500 }
    );
  }
}



