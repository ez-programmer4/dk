import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { featureId: string } }
) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { featureId } = params;
    const body = await req.json();
    const { name, description, category, basePricePerStudent, currency, isRequired } = body;

    if (!name || !category || basePricePerStudent === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, basePricePerStudent" },
        { status: 400 }
      );
    }

    // Verify feature exists
    const existingFeature = await prisma.premiumFeature.findUnique({
      where: { id: featureId },
    });

    if (!existingFeature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    const updatedFeature = await prisma.premiumFeature.update({
      where: { id: featureId },
      data: {
        name,
        description,
        category,
        basePricePerStudent: parseFloat(basePricePerStudent),
        currency: currency || "ETB",
        isRequired: isRequired || false,
      },
    });

    // Log audit action
    const superAdminId = "78er9w"; // Current super admin
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        action: "UPDATE_PREMIUM_FEATURE",
        resourceType: "premium_feature",
        resourceId: featureId,
        details: {
          featureCode: existingFeature.code,
          featureName: existingFeature.name,
          changes: {
            name: name !== existingFeature.name ? { from: existingFeature.name, to: name } : undefined,
            description: description !== existingFeature.description ? { from: existingFeature.description, to: description } : undefined,
            category: category !== existingFeature.category ? { from: existingFeature.category, to: category } : undefined,
            basePricePerStudent: basePricePerStudent !== existingFeature.basePricePerStudent ? { from: existingFeature.basePricePerStudent, to: parseFloat(basePricePerStudent) } : undefined,
            currency: currency !== existingFeature.currency ? { from: existingFeature.currency, to: currency } : undefined,
            isRequired: isRequired !== existingFeature.isRequired ? { from: existingFeature.isRequired, to: isRequired } : undefined,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      feature: updatedFeature,
      message: "Premium feature updated successfully",
    });

  } catch (error) {
    console.error("Premium feature update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
