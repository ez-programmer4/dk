import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_STATUSES = ['trial', 'active', 'inactive', 'suspended', 'expired', 'cancelled'] as const;
type SchoolStatus = typeof VALID_STATUSES[number];

// PUT /api/super-admin/schools/bulk-status - Bulk update school statuses
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolIds, status, reason } = await req.json();

    // Validate inputs
    if (!Array.isArray(schoolIds) || schoolIds.length === 0) {
      return NextResponse.json({
        error: "schoolIds must be a non-empty array"
      }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status as SchoolStatus)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      }, { status: 400 });
    }

    // Validate reason for certain status changes
    if ((status === 'suspended' || status === 'cancelled') && (!reason || reason.trim().length === 0)) {
      return NextResponse.json({
        error: "Reason is required for suspended or cancelled status"
      }, { status: 400 });
    }

    // Get current statuses for history tracking
    const currentSchools = await prisma.school.findMany({
      where: { id: { in: schoolIds } },
      select: {
        id: true,
        name: true,
        status: true,
        statusReason: true
      }
    });

    if (currentSchools.length !== schoolIds.length) {
      return NextResponse.json({
        error: "Some schools not found"
      }, { status: 404 });
    }

    // Filter out schools that are already in the target status
    const schoolsToUpdate = currentSchools.filter(school => school.status !== status);

    if (schoolsToUpdate.length === 0) {
      return NextResponse.json({
        error: "All selected schools are already in this status"
      }, { status: 400 });
    }

    const schoolsToUpdateIds = schoolsToUpdate.map(s => s.id);

    // Update schools status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update schools
      const updatedSchools = await tx.school.updateMany({
        where: { id: { in: schoolsToUpdateIds } },
        data: {
          status: status,
          statusReason: reason || null,
          statusChangedById: session.user.id,
          statusChangedAt: new Date(),
        }
      });

      // Create status history records for each school
      const historyRecords = schoolsToUpdate.map(school => ({
        schoolId: school.id,
        oldStatus: school.status,
        newStatus: status,
        reason: reason || null,
        changedById: session.user.id,
      }));

      await tx.schoolStatusHistory.createMany({
        data: historyRecords
      });

      return {
        updatedCount: updatedSchools.count,
        schools: schoolsToUpdate.map(school => ({
          id: school.id,
          name: school.name,
          oldStatus: school.status,
          newStatus: status
        }))
      };
    });

    // Create audit log
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.user.id,
        action: "bulk_update_school_status",
        resourceType: "school",
        resourceId: "bulk",
        details: {
          schoolIds: schoolsToUpdateIds,
          newStatus: status,
          reason: reason || null,
          updatedCount: result.updatedCount,
          schoolNames: result.schools.map(s => s.name)
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: `Successfully updated ${result.updatedCount} school(s) to ${status} status`
    });

  } catch (error) {
    console.error("Failed to bulk update school statuses:", error);
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 });
  }
}
