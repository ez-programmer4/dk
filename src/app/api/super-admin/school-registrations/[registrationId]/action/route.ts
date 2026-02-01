import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { registrationId: string } }
) {
  try {
    // Check super admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { registrationId } = params;
    const body = await req.json();
    const { action } = actionSchema.parse(body);

    // Find the school registration
    const school = await prisma.school.findUnique({
      where: { id: registrationId },
      include: {
        admins: true,
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School registration not found" },
        { status: 404 }
      );
    }

    if (!school.isSelfRegistered) {
      return NextResponse.json(
        { error: "This school was not registered through self-registration" },
        { status: 400 }
      );
    }

    if (school.registrationStatus !== "pending") {
      return NextResponse.json(
        { error: "This registration has already been processed" },
        { status: 400 }
      );
    }

    // Perform the action
    if (action === "approve") {
      // Approve the registration
      await prisma.$transaction(async (tx) => {
        // Update school status
        await tx.school.update({
          where: { id: registrationId },
          data: {
            status: "active",
            registrationStatus: "approved",
          },
        });

        // Activate the admin account
        await tx.admin.updateMany({
          where: {
            schoolId: registrationId,
            isActive: false,
          },
          data: {
            isActive: true,
          },
        });

        // Log the approval
        await tx.superAdminAuditLog.create({
          data: {
            superAdminId: "78er9w", // Current super admin ID
            action: "APPROVE_SCHOOL_REGISTRATION",
            resourceType: "school",
            resourceId: registrationId,
            details: {
              schoolName: school.name,
              schoolEmail: school.email,
            },
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "School registration approved successfully",
      });

    } else if (action === "reject") {
      // Reject the registration
      await prisma.$transaction(async (tx) => {
        // Update school status
        await tx.school.update({
          where: { id: registrationId },
          data: {
            status: "inactive",
            registrationStatus: "rejected",
          },
        });

        // Keep admin account inactive (or we could delete it)
        // For now, we'll keep it inactive so they can see their account status

        // Log the rejection
        await tx.superAdminAuditLog.create({
          data: {
            superAdminId: "78er9w", // Current super admin ID
            action: "REJECT_SCHOOL_REGISTRATION",
            resourceType: "school",
            resourceId: registrationId,
            details: {
              schoolName: school.name,
              schoolEmail: school.email,
            },
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "School registration rejected",
      });
    }

  } catch (error) {
    console.error("School registration action error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid action", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

