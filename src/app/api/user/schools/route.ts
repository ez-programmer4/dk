import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    let schools = [];

    if (userRole === 'admin') {
      // Get schools for admin
      const adminSchools = await prisma.admin.findUnique({
        where: { id: parseInt(userId) },
        include: { school: true }
      });
      if (adminSchools?.school) {
        schools = [adminSchools.school];
      }
    } else if (userRole === 'teacher') {
      // Get schools for teacher
      const teacherSchools = await prisma.wpos_wpdatatable_24.findUnique({
        where: { ustazid: userId },
        include: { school: true }
      });
      if (teacherSchools?.school) {
        schools = [teacherSchools.school];
      }
    } else if (userRole === 'controller') {
      // Get schools for controller
      const controllerSchools = await prisma.wpos_wpdatatable_28.findUnique({
        where: { wdt_ID: parseInt(userId) },
        include: { school: true }
      });
      if (controllerSchools?.school) {
        schools = [controllerSchools.school];
      }
    } else if (userRole === 'registral') {
      // Get schools for registral
      const registralSchools = await prisma.wpos_wpdatatable_33.findUnique({
        where: { wdt_ID: parseInt(userId) },
        include: { school: true }
      });
      if (registralSchools?.school) {
        schools = [registralSchools.school];
      }
    } else if (userRole === 'superAdmin') {
      // Super admins can access all schools
      schools = await prisma.school.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          status: true
        },
        where: { status: 'active' }, // Use status instead of isActive
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json({
      schools: schools.map(school => ({
        id: school.id,
        name: school.name,
        slug: school.slug,
        domain: school.domain
      }))
    });

  } catch (error) {
    console.error("Error fetching user schools:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
