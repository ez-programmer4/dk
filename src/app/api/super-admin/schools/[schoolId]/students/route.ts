import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    // Verify super admin authentication
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "superAdmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { schoolId } = params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true }
    });

    if (!school) {
      return NextResponse.json(
        { success: false, error: "School not found" },
        { status: 404 }
      );
    }

    // Get students based on status filter
    let whereCondition: any = {
      schoolId: schoolId,
    };

    if (status === "active") {
      // Active students: not inactive/exited/cancelled and not exited
      whereCondition.AND = [
        {
          OR: [
            { status: null },
            { status: { notIn: ["inactive", "Inactive", "INACTIVE", "exited", "Exited", "EXITED", "cancelled", "Cancelled", "CANCELLED"] } }
          ]
        },
        { exitdate: null }
      ];
    }

    const students = await prisma.wpos_wpdatatable_23.findMany({
      where: whereCondition,
      select: {
        wdt_ID: true,
        rigistral: true, // Student registration/ID number
        name: true, // Full name
        phoneno: true, // Phone number
        ustaz: true, // Teacher
        package: true, // Package
        subject: true, // Subject
        country: true, // Country
        schoolId: true, // School ID
        status: true, // Status
        registrationdate: true, // Registration date
        startdate: true, // Start date
      },
      orderBy: { registrationdate: "desc" },
    });

    return NextResponse.json({
      success: true,
      school: school,
      students: students,
      totalCount: students.length,
      filter: status,
    });

  } catch (error) {
    console.error("Super admin school students fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
