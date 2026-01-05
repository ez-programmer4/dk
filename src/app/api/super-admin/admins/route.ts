/**
 * Super Admin Admins API
 *
 * GET: List all admins across all schools
 * POST: Create a new admin
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/super-admin/admins - List all admins
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause
    const where: any = {};
    if (schoolId) {
      where.schoolId = schoolId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { school: { name: { contains: search, mode: "insensitive" } } },
        { school: { slug: { contains: search, mode: "insensitive" } } },
      ];
    }

    const admins = await prisma.admin.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      admins,
    });
  } catch (error: any) {
    console.error("Get admins error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/admins - Create a new admin
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, username, passcode, phone, schoolId, role } = body;

    // Validate required fields
    if (!name || !username || !passcode || !schoolId) {
      return NextResponse.json(
        { error: "name, username, passcode, and schoolId are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin with this username already exists" },
        { status: 400 }
      );
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Hash password
    const hashedPassword = await hash(passcode, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        name,
        username,
        passcode: hashedPassword,
        phoneno: phone || null,
        role: role || "admin",
        schoolId,
        chat_id: `admin_${schoolId}_${Date.now()}`,
      },
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
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create admin" },
      { status: 500 }
    );
  }
}


