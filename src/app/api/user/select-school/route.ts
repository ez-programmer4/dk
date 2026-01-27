import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await req.json();

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Verify the user has access to this school
    let hasAccess = false;
    let school = null;

    if (userRole === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { id: parseInt(userId) },
        include: { school: true }
      });
      hasAccess = admin?.school?.id === schoolId;
      school = admin?.school;
    } else if (userRole === 'teacher') {
      const teacher = await prisma.wpos_wpdatatable_24.findUnique({
        where: { ustazid: userId },
        include: { school: true }
      });
      hasAccess = teacher?.school?.id === schoolId;
      school = teacher?.school;
    } else if (userRole === 'controller') {
      const controller = await prisma.wpos_wpdatatable_28.findUnique({
        where: { wdt_ID: parseInt(userId) },
        include: { school: true }
      });
      hasAccess = controller?.school?.id === schoolId;
      school = controller?.school;
    } else if (userRole === 'registral') {
      const registral = await prisma.wpos_wpdatatable_33.findUnique({
        where: { wdt_ID: parseInt(userId) },
        include: { school: true }
      });
      hasAccess = registral?.school?.id === schoolId;
      school = registral?.school;
    } else if (userRole === 'superAdmin') {
      // Super admins can select any active school
      school = await prisma.school.findUnique({
        where: { id: schoolId, isActive: true }
      });
      hasAccess = !!school;
    }

    if (!hasAccess || !school) {
      return NextResponse.json({ error: "Access denied to selected school" }, { status: 403 });
    }

    // Return success - the client should update the session
    // Note: In a real implementation, you might want to store the selected school
    // in a user preference or session store for future logins
    return NextResponse.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        domain: school.domain
      }
    });

  } catch (error) {
    console.error("Error selecting school:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




