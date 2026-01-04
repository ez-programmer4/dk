/**
 * Super Admin Individual Admin API
 *
 * GET: Get admin details
 * PUT: Update admin
 * DELETE: Delete admin
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/super-admin/admins/[id] - Get admin details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: params.id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      admin,
    });
  } catch (error: any) {
    console.error("Get admin error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/admins/[id] - Update admin
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, username, passcode, phone, schoolId, role } = body;

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: params.id },
    });

    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Check if username is being changed and if it conflicts
    if (username && username !== existingAdmin.username) {
      const usernameConflict = await prisma.admin.findUnique({
        where: { username },
      });

      if (usernameConflict) {
        return NextResponse.json(
          { error: "An admin with this username already exists" },
          { status: 400 }
        );
      }
    }

    // Verify school exists if changing school
    if (schoolId && schoolId !== existingAdmin.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!school) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (phone !== undefined) updateData.phoneno = phone;
    if (schoolId !== undefined) updateData.schoolId = schoolId;
    if (role !== undefined) updateData.role = role;

    // Hash new password if provided
    if (passcode) {
      updateData.passcode = await hash(passcode, 10);
    }

    // Update admin
    const admin = await prisma.admin.update({
      where: { id: params.id },
      data: updateData,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      admin,
    });
  } catch (error: any) {
    console.error("Update admin error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update admin" },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/admins/[id] - Delete admin
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: params.id },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Delete admin
    await prisma.admin.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete admin" },
      { status: 500 }
    );
  }
}

