import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/super-admin/schools/[id]/users/[userId] - Update a user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
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
    const userId = params.userId;
    const body = await req.json();
    const { name, username, email, phone, password } = body;

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Find the user in all possible tables
    let user = null;
    let userRole = null;

    // Check admin table
    user = await prisma.admin.findUnique({ where: { id: userId } });
    if (user) userRole = 'admin';

    // Check teacher table (uses ustazid as primary key)
    if (!user) {
      user = await prisma.wpos_wpdatatable_24.findUnique({ where: { ustazid: userId } });
      if (user) userRole = 'teacher';
    }

    // Check student table (uses wdt_ID as primary key)
    if (!user) {
      const studentId = parseInt(userId);
      if (!isNaN(studentId)) {
        user = await prisma.wpos_wpdatatable_23.findUnique({ where: { wdt_ID: studentId } });
        if (user) userRole = 'student';
      }
    }

    // Check controller table (uses wdt_ID as primary key)
    if (!user) {
      const controllerId = parseInt(userId);
      if (!isNaN(controllerId)) {
        user = await prisma.wpos_wpdatatable_28.findUnique({ where: { wdt_ID: controllerId } });
        if (user) userRole = 'controller';
      }
    }

    // Check registral table (uses wdt_ID as primary key)
    if (!user) {
      const registralId = parseInt(userId);
      if (!isNaN(registralId)) {
        user = await prisma.wpos_wpdatatable_33.findUnique({ where: { wdt_ID: registralId } });
        if (user) userRole = 'registral';
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      const bcrypt = await import("bcryptjs");
      hashedPassword = await bcrypt.hash(password, 12);
    }

    let updatedUser;

    // Update user based on role
    switch (userRole) {
      case 'admin':
        // Check for duplicate name (unique constraint)
        if (name && name !== user.name) {
          const existingAdminByName = await prisma.admin.findFirst({
            where: { name, id: { not: userId } },
          });
          if (existingAdminByName) {
            return NextResponse.json({ error: "Admin with this name already exists" }, { status: 400 });
          }
        }

        updatedUser = await prisma.admin.update({
          where: { id: userId },
          data: {
            ...(name && { name }),
            ...(username && { username }),
            ...(hashedPassword && { passcode: hashedPassword }),
            ...(phone && { phoneno: phone }),
          },
        });
        break;

      case 'teacher':
        updatedUser = await prisma.wpos_wpdatatable_24.update({
          where: { ustazid: userId },
          data: {
            ...(name && { ustazname: name }),
            ...(hashedPassword && { password: hashedPassword }),
            ...(phone && { phone }),
          },
        });
        break;

      case 'student':
        const studentId = parseInt(userId);
        updatedUser = await prisma.wpos_wpdatatable_23.update({
          where: { wdt_ID: studentId },
          data: {
            ...(name && { name }),
            ...(phone && { phoneno: phone }),
          },
        });
        break;

      case 'controller':
        const controllerId = parseInt(userId);
        updatedUser = await prisma.wpos_wpdatatable_28.update({
          where: { wdt_ID: controllerId },
          data: {
            ...(name && { name }),
            ...(username && { username }),
            ...(hashedPassword && { password: hashedPassword }),
          },
        });
        break;

      case 'registral':
        const registralId = parseInt(userId);
        updatedUser = await prisma.wpos_wpdatatable_33.update({
          where: { wdt_ID: registralId },
          data: {
            ...(name && { name }),
            ...(username && { username }),
            ...(hashedPassword && { password: hashedPassword }),
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid user role" }, { status: 400 });
    }

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "update_user",
          resourceType: "user",
          resourceId: userId,
          details: {
            role: userRole,
            schoolId,
            schoolName: school.name,
            changes: {
              name: name !== user.name ? { from: user.name, to: name } : undefined,
              username: username !== user.username ? { from: user.username, to: username } : undefined,
              email: email !== user.email ? { from: user.email, to: email } : undefined,
              phone: phone !== user.phone ? { from: user.phone, to: phone } : undefined,
              passwordChanged: password ? true : undefined,
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
      user: { ...updatedUser, role: userRole },
      message: `${userRole} updated successfully`,
    });
  } catch (error) {
    console.error("Update school user API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/schools/[id]/users/[userId] - Delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
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
    const userId = params.userId;
    const url = new URL(req.url);
    const role = url.searchParams.get('role');

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Find and delete user based on role
    let deletedUser = null;
    let userRole = role;

    switch (role) {
      case 'admin':
        deletedUser = await prisma.admin.findUnique({ where: { id: userId } });
        if (deletedUser) {
          await prisma.admin.delete({ where: { id: userId } });
        }
        break;

      case 'teacher':
        deletedUser = await prisma.wpos_wpdatatable_24.findUnique({ where: { ustazid: userId } });
        if (deletedUser) {
          await prisma.wpos_wpdatatable_24.delete({ where: { ustazid: userId } });
        }
        break;

      case 'student':
        const studentId = parseInt(userId);
        if (!isNaN(studentId)) {
          deletedUser = await prisma.wpos_wpdatatable_23.findUnique({ where: { wdt_ID: studentId } });
          if (deletedUser) {
            await prisma.wpos_wpdatatable_23.delete({ where: { wdt_ID: studentId } });
          }
        }
        break;

      case 'controller':
        const controllerId = parseInt(userId);
        if (!isNaN(controllerId)) {
          deletedUser = await prisma.wpos_wpdatatable_28.findUnique({ where: { wdt_ID: controllerId } });
          if (deletedUser) {
            await prisma.wpos_wpdatatable_28.delete({ where: { wdt_ID: controllerId } });
          }
        }
        break;

      case 'registral':
        const registralId = parseInt(userId);
        if (!isNaN(registralId)) {
          deletedUser = await prisma.wpos_wpdatatable_33.findUnique({ where: { wdt_ID: registralId } });
          if (deletedUser) {
            await prisma.wpos_wpdatatable_33.delete({ where: { wdt_ID: registralId } });
          }
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "delete_user",
          resourceType: "user",
          resourceId: userId,
          details: {
            role: userRole,
            schoolId,
            schoolName: school.name,
            userData: {
              name: deletedUser.name,
              username: deletedUser.username,
              email: deletedUser.email,
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
      message: `${userRole} deleted successfully`,
    });
  } catch (error) {
    console.error("Delete school user API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
