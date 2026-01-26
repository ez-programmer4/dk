import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/pricing/features - Get all features
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const features = await prisma.feature.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      features,
    });
  } catch (error) {
    console.error("Get features API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/pricing/features - Create new feature
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, code, isCore } = await req.json();

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json({
        error: "Name and code are required"
      }, { status: 400 });
    }

    // Check if code is unique
    const existingFeature = await prisma.feature.findUnique({
      where: { code },
    });

    if (existingFeature) {
      return NextResponse.json({
        error: "Feature code already exists"
      }, { status: 400 });
    }

    // Create the feature
    const feature = await prisma.feature.create({
      data: {
        name,
        description,
        code,
        isCore: isCore || false,
      },
    });

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "create_feature",
          resourceType: "feature",
          resourceId: feature.id,
          details: {
            featureName: name,
            featureCode: code,
            isCore,
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Feature created successfully",
      feature,
    });
  } catch (error) {
    console.error("Create feature API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
