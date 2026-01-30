import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packageId } = params;
    const body = await req.json();
    const { name, description, packagePricePerStudent, currency } = body;

    if (!name || packagePricePerStudent === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, packagePricePerStudent" },
        { status: 400 }
      );
    }

    // Verify package exists
    const existingPackage = await prisma.premiumPackage.findUnique({
      where: { id: packageId },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const updatedPackage = await prisma.premiumPackage.update({
      where: { id: packageId },
      data: {
        name,
        description,
        packagePricePerStudent: parseFloat(packagePricePerStudent),
        currency: currency || "ETB",
      },
    });

    // Log audit action
    const superAdminId = "78er9w"; // Current super admin
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        action: "UPDATE_PREMIUM_PACKAGE",
        resourceType: "premium_package",
        resourceId: packageId,
        details: {
          packageName: existingPackage.name,
          changes: {
            name: name !== existingPackage.name ? { from: existingPackage.name, to: name } : undefined,
            description: description !== existingPackage.description ? { from: existingPackage.description, to: description } : undefined,
            packagePricePerStudent: packagePricePerStudent !== existingPackage.packagePricePerStudent ? { from: existingPackage.packagePricePerStudent, to: parseFloat(packagePricePerStudent) } : undefined,
            currency: currency !== existingPackage.currency ? { from: existingPackage.currency, to: currency } : undefined,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      package: updatedPackage,
      message: "Premium package updated successfully",
    });

  } catch (error) {
    console.error("Premium package update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { packageId: string } }
) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packageId } = params;

    // Verify package exists
    const existingPackage = await prisma.premiumPackage.findUnique({
      where: { id: packageId },
      include: {
        schoolPackages: true,
      },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Check if package is being used by any schools
    if (existingPackage.schoolPackages.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete package that is assigned to schools" },
        { status: 400 }
      );
    }

    // Delete the package
    await prisma.premiumPackage.delete({
      where: { id: packageId },
    });

    // Log audit action
    const superAdminId = "78er9w"; // Current super admin
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        action: "DELETE_PREMIUM_PACKAGE",
        resourceType: "premium_package",
        resourceId: packageId,
        details: {
          packageName: existingPackage.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Premium package deleted successfully",
    });

  } catch (error) {
    console.error("Premium package deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
