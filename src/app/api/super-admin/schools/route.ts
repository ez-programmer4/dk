import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  onboardNewSchool,
  validateOnboardingData,
  type OnboardingData,
} from "@/lib/school-onboarding";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/super-admin/schools - List all schools
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { slug: { contains: search } },
      ];
    }
    if (status) {
      whereClause.status = status;
    }

    // Get schools with stats
    const [schools, totalCount] = await Promise.all([
      prisma.school.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          status: true,
          subscriptionTier: true,
          maxStudents: true,
          currentStudentCount: true,
          createdAt: true,
          _count: {
            select: {
              admins: true,
              teachers: true,
              students: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.school.count({ where: whereClause }),
    ]);

    // Calculate total revenue for each school
    const schoolsWithRevenue = await Promise.all(
      schools.map(async (school) => {
        const revenue = await prisma.$queryRaw<{ paidamount: number | null }[]>`
          SELECT SUM(p.paidamount) as paidamount
          FROM wpos_wpdatatable_29 p
          JOIN wpos_wpdatatable_23 s ON p.studentid = s.wdt_ID
          WHERE s.schoolId = ${school.id} AND p.status IN ('Approved', 'completed')
        `;

        return {
          ...school,
          revenue: revenue?.[0]?.paidamount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      schools: schoolsWithRevenue,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Super admin schools API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/schools - Create a new school
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      email,
      phone,
      address,
      adminName,
      adminUsername,
      adminPassword,
      adminEmail,
      adminPhone,
      subscriptionTier = "trial",
      maxStudents = 50,
      planId,
      telegramBotToken,
    } = body;

    // Prepare onboarding data
    const onboardingData: OnboardingData = {
      name,
      slug,
      email,
      phone,
      address,
      adminName: adminName || name + " Admin",
      adminUsername: adminUsername || `admin_${slug}`,
      adminPassword: adminPassword || `Admin${slug}123!`,
      adminEmail: adminEmail || email,
      adminPhone: adminPhone || phone,
      subscriptionTier,
      maxStudents,
      planId,
      telegramBotToken,
    };

    // Validate onboarding data
    const validation = validateOnboardingData(onboardingData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", errors: validation.errors },
        { status: 400 }
      );
    }

    try {
      // Use onboarding service to create school with admin and default settings
      const result = await onboardNewSchool(onboardingData, session.user.id);

      // Create audit log
      try {
        await prisma.superAdminAuditLog.create({
          data: {
            superAdminId: session.user.id,
            action: "create_school",
            resourceType: "school",
            resourceId: result.school.id,
            details: {
              schoolName: name,
              schoolSlug: slug,
              subscriptionTier,
              maxStudents,
              adminCreated: true,
            },
            ipAddress:
              req.headers.get("x-forwarded-for") ||
              req.headers.get("x-real-ip"),
            userAgent: req.headers.get("user-agent"),
          },
        });
      } catch (auditError) {
        // Log but don't fail if audit log fails
        console.error("Failed to create audit log:", auditError);
      }

      return NextResponse.json({
        success: true,
        school: result.school,
        admin: result.admin,
        message: "School created successfully with default settings",
      });
    } catch (error: any) {
      console.error("Onboarding error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create school" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Create school error:", error);
    return NextResponse.json(
      { error: "Failed to create school" },
      { status: 500 }
    );
  }
}
