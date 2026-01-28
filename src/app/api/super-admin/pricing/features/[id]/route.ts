import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/pricing/features/[id] - Get single feature
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureId = params.id;

    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      feature,
    });
  } catch (error) {
    console.error("Get feature API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/pricing/features/[id] - Update feature
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureId = params.id;
    const { name, description, code, isCore, isActive } = await req.json();

    // Check if feature exists
    const existingFeature = await prisma.feature.findUnique({
      where: { id: featureId },
    });

    if (!existingFeature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    // Check if code is unique (if changed)
    if (code && code !== existingFeature.code) {
      const codeExists = await prisma.feature.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json({
          error: "Feature code already exists"
        }, { status: 400 });
      }
    }

    // Update the feature
    const updatedFeature = await prisma.feature.update({
      where: { id: featureId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(code !== undefined && { code }),
        ...(isCore !== undefined && { isCore }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    });

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "update_feature",
          resourceType: "feature",
          resourceId: featureId,
          details: {
            featureName: name || existingFeature.name,
            featureCode: code || existingFeature.code,
            changes: {
              name: name !== undefined ? { from: existingFeature.name, to: name } : null,
              description: description !== undefined ? { from: existingFeature.description, to: description } : null,
              code: code !== undefined ? { from: existingFeature.code, to: code } : null,
              isCore: isCore !== undefined ? { from: existingFeature.isCore, to: isCore } : null,
              isActive: isActive !== undefined ? { from: existingFeature.isActive, to: isActive } : null,
            },
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
      message: "Feature updated successfully",
      feature: updatedFeature,
    });
  } catch (error) {
    console.error("Update feature API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/pricing/features/[id] - Delete feature
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureId = params.id;

    // Check if feature exists
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        planFeatures: true,
      },
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    // Check if feature is used in any plans
    if (feature.planFeatures.length > 0) {
      return NextResponse.json({
        error: `Cannot delete feature "${feature.name}" because it is used in ${feature.planFeatures.length} pricing plan(s). Remove it from all plans first.`
      }, { status: 400 });
    }

    // Check if feature is marked as premium
    const premiumFeature = await prisma.premiumFeature.findUnique({
      where: { featureCode: feature.code },
    });

    if (premiumFeature) {
      // Remove from premium features first
      await prisma.premiumFeature.delete({
        where: { featureCode: feature.code },
      });
    }

    // Delete the feature
    await prisma.feature.delete({
      where: { id: featureId },
    });

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "delete_feature",
          resourceType: "feature",
          resourceId: featureId,
          details: {
            featureName: feature.name,
            featureCode: feature.code,
            wasPremium: !!premiumFeature,
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
      message: "Feature deleted successfully",
    });
  } catch (error) {
    console.error("Delete feature API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

