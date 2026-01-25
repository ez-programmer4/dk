import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/schools/[id]/audit-logs - Get audit logs for a specific school
export async function GET(
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

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Fetch audit logs related to this school
    const auditLogs = await prisma.superAdminAuditLog.findMany({
      where: {
        OR: [
          { resourceId: schoolId },
          {
            action: {
              in: ['create_school', 'update_school', 'delete_school', 'create_user', 'update_user', 'delete_user', 'update_school_config']
            }
          }
        ]
      },
      include: {
        superAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to last 100 entries for performance
    });

    return NextResponse.json({
      success: true,
      logs: auditLogs,
    });
  } catch (error) {
    console.error("Get school audit logs API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
