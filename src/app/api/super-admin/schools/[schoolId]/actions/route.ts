import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    const { schoolId } = params;
    const { action, ...data } = await req.json();

    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, status: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const superAdminId = "78er9w"; // Hardcoded for now, should come from JWT

    switch (action) {
      case "suspend": {
        await prisma.school.update({
          where: { id: schoolId },
          data: {
            status: "suspended",
            statusChangedAt: new Date(),
            statusChangedById: superAdminId,
          },
        });

        // Log audit action
        await prisma.superAdminAuditLog.create({
          data: {
            superAdminId,
            action: "SUSPEND_SCHOOL",
            resourceType: "school",
            resourceId: schoolId,
            details: { schoolName: school.name },
          },
        });

        return NextResponse.json({
          success: true,
          message: "School suspended successfully",
        });
      }

      case "activate": {
        await prisma.school.update({
          where: { id: schoolId },
          data: {
            status: "active",
            statusChangedAt: new Date(),
            statusChangedById: superAdminId,
          },
        });

        // Log audit action
        await prisma.superAdminAuditLog.create({
          data: {
            superAdminId,
            action: "ACTIVATE_SCHOOL",
            resourceType: "school",
            resourceId: schoolId,
            details: { schoolName: school.name },
          },
        });

        return NextResponse.json({
          success: true,
          message: "School activated successfully",
        });
      }

      case "reset-password": {
        // Generate a new random password
        const newPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
        const bcrypt = require("bcryptjs");
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update the admin password (assuming there's only one admin per school for simplicity)
        const admin = await prisma.admin.findFirst({
          where: { schoolId },
          select: { id: true, name: true },
        });

        if (admin) {
          await prisma.admin.update({
            where: { id: admin.id },
            data: { passcode: hashedPassword },
          });

          // Log audit action
          await prisma.superAdminAuditLog.create({
            data: {
              superAdminId,
              action: "RESET_ADMIN_PASSWORD",
              resourceType: "school",
              resourceId: schoolId,
              details: { schoolName: school.name, adminName: admin.name },
            },
          });
        }

        return NextResponse.json({
          success: true,
          message: "Admin password reset successfully",
          newPassword, // In production, this should be sent via email instead
        });
      }

      case "delete": {
        // Check if school has data that would be lost
        const studentCount = await prisma.wpos_wpdatatable_23.count({
          where: { schoolId },
        });

        const teacherCount = await prisma.wpos_wpdatatable_24.count({
          where: { schoolId },
        });

        if (studentCount > 0 || teacherCount > 0) {
          return NextResponse.json(
            {
              error: "Cannot delete school with existing students or teachers. Please migrate or remove all data first."
            },
            { status: 400 }
          );
        }

        // Delete school and all related data
        await prisma.$transaction(async (tx) => {
          // Delete in reverse order of dependencies
          await tx.schoolPayment.deleteMany({ where: { schoolId } });
          await tx.schoolSetting.deleteMany({ where: { schoolId } });
          await tx.superAdminAuditLog.deleteMany({ where: { resourceId: schoolId } });
          await tx.schoolStatusHistory.deleteMany({ where: { schoolId } });
          await tx.admin.deleteMany({ where: { schoolId } });
          await tx.school.delete({ where: { id: schoolId } });
        });

        // Log audit action
        await prisma.superAdminAuditLog.create({
          data: {
            superAdminId,
            action: "DELETE_SCHOOL",
            resourceType: "school",
            resourceId: schoolId,
            details: { schoolName: school.name },
          },
        });

        return NextResponse.json({
          success: true,
          message: "School deleted successfully",
        });
      }

      case "edit": {
        // For now, return success - actual editing would be handled by a separate form
        return NextResponse.json({
          success: true,
          message: "Edit functionality would open here",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("School action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



