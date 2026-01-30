import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for creating/updating dynamic features
const DynamicFeatureSchema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  basePricePerStudent: z.number().min(0),
  currency: z.string().default('ETB'),
  isActive: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Build where clause
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (activeOnly) {
      where.isActive = true;
    }

    const features = await prisma.premiumFeature.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      features,
    });

  } catch (error) {
    console.error('Error fetching dynamic features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = DynamicFeatureSchema.parse(body);

    // Check if feature code already exists
    const existingFeature = await prisma.premiumFeature.findUnique({
      where: { code: validatedData.code },
    });

    if (existingFeature) {
      return NextResponse.json(
        { error: 'Feature code already exists' },
        { status: 400 }
      );
    }

    // Create the feature
    const feature = await prisma.premiumFeature.create({
      data: validatedData,
    });

    // Audit log
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: (session.user as any).id,
        action: 'CREATE_DYNAMIC_FEATURE',
        resourceType: 'premium_feature',
        resourceId: feature.id,
        details: {
          featureCode: feature.code,
          featureName: feature.name,
          category: feature.category,
        },
      },
    });

    return NextResponse.json({
      success: true,
      feature,
      message: 'Dynamic feature created successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating dynamic feature:', error);
    return NextResponse.json(
      { error: 'Failed to create feature' },
      { status: 500 }
    );
  }
}
