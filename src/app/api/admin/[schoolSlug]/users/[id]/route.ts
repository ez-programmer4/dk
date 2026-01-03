import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolSlug: string; id: string } }
) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user has access to this school
    if (session.schoolSlug !== params.schoolSlug) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const schoolId = session.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "No school access" }, { status: 403 });
    }

    const user = await prisma.admin.findFirst({
      where: {
        id: params.id,
        schoolId: schoolId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        phoneno: true,
        controlId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id.toString(),
        name: user.name || "",
        username: user.username || "",
        role: user.role as "admin" | "controller" | "registral" | "teacher",
        email: undefined, // Admin table doesn't have email field
        phone: user.phoneno || undefined,
        status: "active", // Admin table doesn't have status field - all admins are active
        code: undefined, // Admin table doesn't have code field - only for controllers/registrars
        controlId: user.controlId,
        createdAt: user.createdAt.toISOString(),
        lastLogin: undefined, // Admin table doesn't have lastLogin field
      },
    });
  } catch (error) {
    console.error("Get user API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { schoolSlug: string; id: string } }
) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user has access to this school
    if (session.schoolSlug !== params.schoolSlug) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const schoolId = session.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "No school access" }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, role, email, phone, code, status, password, controlId } = body;

    // Check if user exists and belongs to this school
    const existingUser = await prisma.admin.findFirst({
      where: {
        id: params.id,
        schoolId: schoolId,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check username uniqueness if changed
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.admin.findFirst({
        where: {
          username: username,
          schoolId: schoolId,
          id: { not: params.id },
        },
      });

      if (usernameExists) {
        return NextResponse.json(
          { error: "Username already exists for this school" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (role !== undefined) updateData.role = role;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phoneno = phone;
    if (code !== undefined) updateData.code = code;
    if (status !== undefined) updateData.status = status;

    // Validate controlId for teachers
    if (role === "teacher" || (role === undefined && existingUser.role === "teacher")) {
      const finalRole = role || existingUser.role;
      if (finalRole === "teacher") {
        if (controlId !== undefined && (!controlId || controlId === "" || controlId === "0")) {
          return NextResponse.json(
            { error: "Controller assignment is required for teachers" },
            { status: 400 }
          );
        }

        // If controlId is being set, verify the controller exists
        if (controlId && controlId !== existingUser.controlId) {
          const controller = await prisma.admin.findFirst({
            where: {
              id: controlId,
              role: "controller",
              schoolId: schoolId,
            },
          });

          if (!controller) {
            return NextResponse.json(
              { error: "Invalid controller assignment" },
              { status: 400 }
            );
          }
        }
      }
    }

    // Hash new password if provided
    if (password) {
      updateData.passcode = await hash(password, 10);
    }

    // Handle controlId updates
    if (controlId !== undefined) {
      updateData.controlId = controlId;
    }

    // Update user
    const updatedUser = await prisma.admin.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        email: true,
        phoneno: true,
        controlId: true,
        status: true,
        code: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    // Log the action
    await prisma.auditlog.create({
      data: {
        actionType: "UPDATE_USER",
        adminId: session.id,
        targetId: parseInt(updatedUser.id),
        details: `Updated user ${updatedUser.name} (${updatedUser.username})`,
      },
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id.toString(),
        name: updatedUser.name || "",
        username: updatedUser.username || "",
        role: updatedUser.role as "admin" | "controller" | "registral" | "teacher",
        email: undefined, // Admin table doesn't have email field
        phone: updatedUser.phoneno || undefined,
        status: "active", // Admin table doesn't have status field - all admins are active
        code: undefined, // Admin table doesn't have code field
        controlId: updatedUser.controlId,
        createdAt: updatedUser.createdAt.toISOString(),
        lastLogin: undefined, // Admin table doesn't have lastLogin field
      },
    });
  } catch (error) {
    console.error("Update user API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { schoolSlug: string; id: string } }
) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user has access to this school
    if (session.schoolSlug !== params.schoolSlug) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const schoolId = session.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "No school access" }, { status: 403 });
    }

    // Check if user exists and belongs to this school
    const user = await prisma.admin.findFirst({
      where: {
        id: params.id,
        schoolId: schoolId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting the current user
    if (user.id.toString() === session.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.admin.delete({
      where: { id: params.id },
    });

    // Log the action
    await prisma.auditlog.create({
      data: {
        actionType: "DELETE_USER",
        adminId: session.id,
        targetId: parseInt(params.id),
        details: `Deleted user ${user.name} (${user.username}) with role ${user.role}`,
      },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
