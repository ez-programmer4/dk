import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/usage/summary - Get usage summary across all schools
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current month for usage calculations
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get all schools with their current usage
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        maxStudents: true,
        currentStudentCount: true,
        plan: {
          select: {
            name: true,
            maxStudents: true,
            maxTeachers: true,
          },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            admins: true,
          },
        },
      },
    });

    // Calculate summary statistics
    let totalSchools = schools.length;
    let totalStudents = 0;
    let totalTeachers = 0;
    let totalRevenue = 0;
    let schoolsOverLimit = 0;
    let totalCapacity = 0;

    for (const school of schools) {
      totalStudents += school._count.students;
      totalTeachers += school._count.teachers;

      // Calculate revenue (simplified - you might want to calculate based on actual billing)
      const studentCount = school._count.students;
      const baseRevenue = school.plan ? parseFloat("0") : 0; // You'd calculate based on plan pricing
      totalRevenue += baseRevenue;

      // Check if school is over limits
      const maxStudents = school.plan?.maxStudents || school.maxStudents;
      if (maxStudents && school._count.students > maxStudents) {
        schoolsOverLimit++;
      }

      totalCapacity += maxStudents || 0;
    }

    const averageUtilization = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalSchools,
        totalStudents,
        totalTeachers,
        totalRevenue,
        averageUtilization,
        schoolsOverLimit,
      },
    });
  } catch (error) {
    console.error("Usage summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

