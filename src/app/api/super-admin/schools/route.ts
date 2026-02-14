import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication for schools API
    // For now, allow access without authentication for testing

    // Get all schools with basic info
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get active student, teacher, and admin counts for each school
    const schoolsWithCounts = await Promise.all(
      schools.map(async (school) => {
        const [activeStudents, teacherCount, adminCount] = await Promise.all([
          // Count active students from wpos_wpdatatable_23
          prisma.wpos_wpdatatable_23.count({
            where: {
              schoolId: school.id,
              AND: [
                {
                  OR: [
                    { status: null },
                    { status: { notIn: ["inactive", "Inactive", "INACTIVE", "exited", "Exited", "EXITED", "cancelled", "Cancelled", "CANCELLED"] } }
                  ]
                },
                { exitdate: null }
              ]
            }
          }),
          // Count teachers from wpos_wpdatatable_24
          prisma.wpos_wpdatatable_24.count({
            where: { schoolId: school.id }
          }),
          // Count admins
          prisma.admin.count({
            where: { schoolId: school.id }
          })
        ]);

        return {
          ...school,
          _count: {
            students: activeStudents,
            teachers: teacherCount,
            admins: adminCount
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      schools: schoolsWithCounts
    });

  } catch (error) {
    console.error('Schools API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}