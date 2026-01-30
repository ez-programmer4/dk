import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get session using getToken
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin has access to this school
    const admin = await prisma.admin.findUnique({
      where: { id: token.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json({ error: "Unauthorized access to school" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    if (role === "teacher") {
      // Get teachers count
      const teachersCount = await prisma.wpos_wpdatatable_24.count({
        where: {
          schoolId: school.id,
        },
      });

      return NextResponse.json({
        total: teachersCount,
        role: "teacher",
      });
    }

    // Get all users count (admins + controllers + teachers)
    const adminCount = await prisma.admin.count({
      where: { schoolId: school.id },
    });

    const controllerCount = await prisma.wpos_wpdatatable_28.count({
      where: { schoolId: school.id },
    });

    const teacherCount = await prisma.wpos_wpdatatable_24.count({
      where: { schoolId: school.id },
    });

    const totalUsers = adminCount + controllerCount + teacherCount;

    return NextResponse.json({
      total: limit ? Math.min(totalUsers, limit) : totalUsers,
      breakdown: {
        admins: adminCount,
        controllers: controllerCount,
        teachers: teacherCount,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}