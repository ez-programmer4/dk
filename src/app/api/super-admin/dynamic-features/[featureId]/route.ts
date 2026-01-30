import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for updating dynamic features
const UpdateFeatureSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  category: z.string().min(1).max(50).optional(),
  basePricePerStudent: z.number().min(0).optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { featureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureId } = params;

    const feature = await prisma.premiumFeature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feature,
    });

  } catch (error) {
    console.error('Error fetching feature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { featureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureId } = params;
    const body = await request.json();
    const validatedData = UpdateFeatureSchema.parse(body);

    // Check if feature exists
    const existingFeature = await prisma.premiumFeature.findUnique({
      where: { id: featureId },
    });

    if (!existingFeature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Update the feature
    const updatedFeature = await prisma.premiumFeature.update({
      where: { id: featureId },
      data: validatedData,
    });

    // Audit log
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: (session.user as any).id,
        action: 'UPDATE_DYNAMIC_FEATURE',
        resourceType: 'premium_feature',
        resourceId: featureId,
        details: {
          featureCode: updatedFeature.code,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      feature: updatedFeature,
      message: 'Feature updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating feature:', error);
    return NextResponse.json(
      { error: 'Failed to update feature' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { featureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureId } = params;

    // Check if feature exists and if it's being used
    const feature = await prisma.premiumFeature.findUnique({
      where: { id: featureId },
      include: {
        schoolFeatures: true,
      },
    });

    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Check if feature is required
    if (feature.isRequired) {
      return NextResponse.json(
        { error: 'Cannot delete required features' },
        { status: 400 }
      );
    }

    // Check if feature is assigned to any schools
    if (feature.schoolFeatures.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete feature that is assigned to schools' },
        { status: 400 }
      );
    }

    // Delete the feature
    await prisma.premiumFeature.delete({
      where: { id: featureId },
    });

    // Audit log
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: (session.user as any).id,
        action: 'DELETE_DYNAMIC_FEATURE',
        resourceType: 'premium_feature',
        resourceId: featureId,
        details: {
          featureCode: feature.code,
          featureName: feature.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Feature deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature' },
      { status: 500 }
    );
  }
}
