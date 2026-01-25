import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Verify that the SuperAdmin exists in the database
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: session.user.id }
    });

    if (!superAdmin) {
      return NextResponse.json({ error: "SuperAdmin not found" }, { status: 404 });
    }

    const schoolId = params.id;
    const body = await req.json();
    const { status, reason } = body;

    // Validate status
    const validStatuses = ["active", "inactive", "suspended"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Check if school exists
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!existingSchool) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Update school status
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: { status },
      include: {
        _count: {
          select: {
            admins: true,
            teachers: true,
            students: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "update_school_status",
          resourceType: "school",
          resourceId: schoolId,
          details: {
            oldStatus: existingSchool.status,
            newStatus: status,
            reason: reason || null,
            schoolName: existingSchool.name,
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
      school: updatedSchool,
      message: `School status updated to ${status}`,
    });
  } catch (error) {
    console.error("Update school status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
