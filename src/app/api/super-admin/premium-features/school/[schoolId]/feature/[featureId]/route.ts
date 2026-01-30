import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const ToggleFeatureSchema = z.object({
  enabled: z.boolean(),
  customPricePerStudent: z.number().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolId: string; featureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { schoolId, featureId } = params;
    const body = await request.json();
    const { enabled, customPricePerStudent } = ToggleFeatureSchema.parse(body);

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Verify feature exists
    const feature = await prisma.premiumFeature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    // Toggle the feature access
    if (enabled) {
      // Enable feature for school
      await prisma.schoolPremiumFeature.upsert({
        where: {
          schoolId_featureId: {
            schoolId,
            featureId,
          },
        },
        update: {
          isEnabled: true,
          customPricePerStudent,
          enabledAt: new Date(),
        },
        create: {
          schoolId,
          featureId,
          isEnabled: true,
          customPricePerStudent,
          enabledAt: new Date(),
        },
      });
    } else {
      // Disable feature for school
      await prisma.schoolPremiumFeature.upsert({
        where: {
          schoolId_featureId: {
            schoolId,
            featureId,
          },
        },
        update: {
          isEnabled: false,
          disabledAt: new Date(),
        },
        create: {
          schoolId,
          featureId,
          isEnabled: false,
          disabledAt: new Date(),
        },
      });
    }

    // Audit log
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: (session.user as any).id,
        action: enabled ? 'ENABLE_SCHOOL_FEATURE' : 'DISABLE_SCHOOL_FEATURE',
        resourceType: 'school_premium_feature',
        resourceId: `${schoolId}_${featureId}`,
        details: {
          schoolId,
          schoolName: school.name,
          featureId,
          featureName: feature.name,
          enabled,
          customPricePerStudent,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Feature ${enabled ? 'enabled' : 'disabled'} successfully`,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error toggling school feature:', error);
    return NextResponse.json(
      { error: 'Failed to toggle feature access' },
      { status: 500 }
    );
  }
}
