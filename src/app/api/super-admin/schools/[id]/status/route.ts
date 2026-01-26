import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_STATUSES = ['trial', 'active', 'inactive', 'suspended', 'expired', 'cancelled'] as const;
type SchoolStatus = typeof VALID_STATUSES[number];

// PUT /api/super-admin/schools/[id]/status - Update school status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status, reason } = await req.json();

    // Validate status
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

    // Get current school status for history tracking
    const currentSchool = await prisma.school.findUnique({
      where: { id },
      select: { status: true, statusReason: true }
    });

    if (!currentSchool) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Don't update if status is the same
    if (currentSchool.status === status) {
      return NextResponse.json({
        error: "School is already in this status"
      }, { status: 400 });
    }

    // Update school status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update school status
      const updatedSchool = await tx.school.update({
        where: { id },
        data: {
          status: status,
          statusReason: reason || null,
          statusChangedById: session.user.id,
          statusChangedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          status: true,
          statusReason: true,
          statusChangedAt: true,
          statusChangedBy: {
            select: { id: true, name: true, username: true }
          }
        }
      });

      // Create status history record
      await tx.schoolStatusHistory.create({
        data: {
          schoolId: id,
          oldStatus: currentSchool.status,
          newStatus: status,
          reason: reason || null,
          changedById: session.user.id,
        }
      });

      return updatedSchool;
    });

    // Create audit log
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: session.user.id,
        action: "update_school_status",
        resourceType: "school",
        resourceId: id,
        details: {
          oldStatus: currentSchool.status,
          newStatus: status,
          reason: reason || null,
          schoolName: result.name,
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userAgent: req.headers.get("user-agent"),
      },
    });

    return NextResponse.json({
      success: true,
      school: result,
      message: `School status updated to ${status}`
    });

  } catch (error) {
    console.error("Failed to update school status:", error);
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 });
  }
}

// GET /api/super-admin/schools/[id]/status - Get status history
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Get current status
    const school = await prisma.school.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        statusReason: true,
        statusChangedAt: true,
        statusChangedBy: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get status history
    const statusHistory = await prisma.schoolStatusHistory.findMany({
      where: { schoolId: id },
      include: {
        changedBy: {
          select: { id: true, name: true, username: true }
        }
      },
      orderBy: { changedAt: "desc" },
      take: 50 // Limit to last 50 changes
    });

    return NextResponse.json({
      success: true,
      currentStatus: school,
      history: statusHistory
    });

  } catch (error) {
    console.error("Failed to fetch school status:", error);
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 });
  }
}