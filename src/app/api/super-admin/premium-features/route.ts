import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_FEATURES, FeatureCode } from "@/lib/features/feature-registry";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all pricing tiers with their features
    const pricingTiers = await prisma.pricingTier.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        monthlyFee: true,
        maxStudents: true,
        currency: true,
        features: true,
        isActive: true,
        isDefault: true,
        sortOrder: true,
        trialDays: true,
        _count: {
          select: {
            schools: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    // Get available features for selection
    const availableFeatures = Object.entries(ALL_FEATURES).map(([code, feature]) => ({
      code,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      business_value: feature.business_value,
      development_cost: feature.development_cost,
    }));

    return NextResponse.json({
      success: true,
      pricingTiers,
      availableFeatures,
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
    const { action, pricingTierId, featureCode, pricingTierData } = body;

    switch (action) {
      case "create_pricing_tier": {
        const { name, slug, description, monthlyFee, maxStudents, currency, features, trialDays } = pricingTierData;

        // Validate features
        const validFeatures = features.filter((code: string) => code in ALL_FEATURES);

        const newTier = await prisma.pricingTier.create({
          data: {
            name,
            slug,
            description,
            monthlyFee: parseFloat(monthlyFee),
            maxStudents: maxStudents ? parseInt(maxStudents) : null,
            currency,
            features: validFeatures,
            trialDays: parseInt(trialDays),
          },
        });

        return NextResponse.json({
          success: true,
          pricingTier: newTier,
          message: "Pricing tier created successfully",
        });
      }

      case "update_pricing_tier": {
        const { name, slug, description, monthlyFee, maxStudents, currency, features, trialDays, isActive, isDefault } = pricingTierData;

        // Validate features
        const validFeatures = features.filter((code: string) => code in ALL_FEATURES);

        const updatedTier = await prisma.pricingTier.update({
          where: { id: pricingTierId },
          data: {
            name,
            slug,
            description,
            monthlyFee: parseFloat(monthlyFee),
            maxStudents: maxStudents ? parseInt(maxStudents) : null,
            currency,
            features: validFeatures,
            trialDays: parseInt(trialDays),
            isActive,
            isDefault,
          },
        });

        return NextResponse.json({
          success: true,
          pricingTier: updatedTier,
          message: "Pricing tier updated successfully",
        });
      }

      case "toggle_feature": {
        const tier = await prisma.pricingTier.findUnique({
          where: { id: pricingTierId },
          select: { features: true },
        });

        if (!tier) {
          return NextResponse.json({ error: "Pricing tier not found" }, { status: 404 });
        }

        const currentFeatures = tier.features as string[];
        const hasFeature = currentFeatures.includes(featureCode);

        const updatedFeatures = hasFeature
          ? currentFeatures.filter(f => f !== featureCode)
          : [...currentFeatures, featureCode];

        const updatedTier = await prisma.pricingTier.update({
          where: { id: pricingTierId },
          data: { features: updatedFeatures },
        });

        return NextResponse.json({
          success: true,
          pricingTier: updatedTier,
          message: hasFeature ? "Feature removed from tier" : "Feature added to tier",
        });
      }

      case "delete_pricing_tier": {
        // Check if tier is being used by schools
        const schoolsUsingTier = await prisma.school.count({
          where: { pricingTierId },
        });

        if (schoolsUsingTier > 0) {
          return NextResponse.json(
            { error: "Cannot delete pricing tier that is being used by schools" },
            { status: 400 }
          );
        }

        await prisma.pricingTier.delete({
          where: { id: pricingTierId },
        });

        return NextResponse.json({
          success: true,
          message: "Pricing tier deleted successfully",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Premium features operation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

