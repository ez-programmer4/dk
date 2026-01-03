import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/super-admin/users - List users across all schools
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const schoolId = searchParams.get("schoolId") || "";

    const skip = (page - 1) * limit;

    // Get users based on role
    let users: any[] = [];
    let totalCount = 0;

    if (role === "admin" || !role) {
      const [admins, adminCount] = await Promise.all([
        prisma.admin.findMany({
          where: {
            ...(search && { name: { contains: search } }),
            ...(schoolId && { schoolId }),
          },
          include: {
            school: {
              select: { name: true, slug: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.admin.count({
          where: {
            ...(search && { name: { contains: search } }),
            ...(schoolId && { schoolId }),
          },
        }),
      ]);

      users = admins.map((admin) => ({
        id: admin.id,
        name: admin.name,
        username: admin.username,
        email: admin.phoneno, // Using phone as contact
        role: "admin",
        school: admin.school,
        status: admin.role === "admin" ? "active" : "inactive",
        createdAt: admin.createdAt,
      }));
      totalCount = adminCount;
    }

    if (role === "teacher" || !role) {
      const [teachers, teacherCount] = await Promise.all([
        prisma.wpos_wpdatatable_24.findMany({
          where: {
            ...(search && { ustazname: { contains: search } }),
            ...(schoolId && { schoolId }),
            schoolId: { not: null }, // Only multi-tenant teachers
          },
          include: {
            school: {
              select: { name: true, slug: true },
            },
          },
          orderBy: { created_at: "desc" },
          skip,
          take: limit,
        }),
        prisma.wpos_wpdatatable_24.count({
          where: {
            ...(search && { ustazname: { contains: search } }),
            ...(schoolId && { schoolId }),
            schoolId: { not: null },
          },
        }),
      ]);

      const teacherUsers = teachers.map((teacher) => ({
        id: teacher.ustazid,
        name: teacher.ustazname,
        username: teacher.ustazid,
        email: teacher.phone,
        role: "teacher",
        school: teacher.school,
        status: "active",
        createdAt: teacher.created_at,
      }));

      if (role === "teacher") {
        users = teacherUsers;
        totalCount = teacherCount;
      } else {
        users = [...users, ...teacherUsers];
        totalCount += teacherCount;
      }
    }

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Super admin users API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}






