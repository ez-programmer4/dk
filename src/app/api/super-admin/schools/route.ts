import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Verify that the SuperAdmin exists in the database
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: session.user.id }
    });

    if (!superAdmin) {
      return NextResponse.json({ error: "SuperAdmin not found" }, { status: 404 });
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

    // Verify that the SuperAdmin exists in the database
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: session.user.id }
    });

    if (!superAdmin) {
      return NextResponse.json({ error: "SuperAdmin not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      email,
      phone,
      address,
      logoUrl,
      primaryColor,
      secondaryColor,
      timezone,
      defaultCurrency,
      defaultLanguage,
      features,
      adminName,
      adminUsername,
      adminPassword,
      adminEmail,
      adminPhone,
    } = body;

    // Basic validation
    if (!name || !slug || !email) {
      return NextResponse.json(
        { error: "Name, slug, and email are required" },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingSchool = await prisma.school.findUnique({
      where: { slug }
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: "School slug already exists" },
        { status: 400 }
      );
    }

    try {
      // Create school
      const school = await prisma.school.create({
        data: {
          name,
          slug,
          email,
          phone,
          address,
          logoUrl,
          primaryColor,
          secondaryColor,
          timezone,
          defaultCurrency,
          defaultLanguage,
          features,
          createdById: session.user.id,
        }
      });

      // Create admin user for the school
      const hashedPassword = await import("bcryptjs").then(({ hash }) =>
        hash(adminPassword || `Admin${slug}123!`, 12)
      );

      // Generate unique admin name and username to avoid conflicts
      const baseAdminName = adminName || `${name} Admin`;
      const baseUsername = adminUsername || `admin_${slug}`;

      let finalAdminName = baseAdminName;
      let finalUsername = baseUsername;
      let counter = 1;

      // Check for existing admin with same name/username and make unique
      while (true) {
        const existingAdmin = await prisma.admin.findFirst({
          where: {
            OR: [
              { name: finalAdminName },
              { username: finalUsername }
            ]
          }
        });

        if (!existingAdmin) break;

        counter++;
        finalAdminName = `${baseAdminName} ${counter}`;
        finalUsername = `${baseUsername}_${counter}`;
      }

      await prisma.admin.create({
        data: {
          name: finalAdminName,
          username: finalUsername,
          passcode: hashedPassword,
          email: adminEmail || email,
          phoneno: adminPhone || phone,
          schoolId: school.id,
          chat_id: `admin_${slug}_${Date.now()}`, // Generate unique chat_id for admin
        }
      });

      // Create audit log
      try {
        await prisma.superAdminAuditLog.create({
          data: {
            superAdminId: session.user.id,
            action: "create_school",
            resourceType: "school",
            resourceId: school.id,
            details: {
              schoolName: name,
              schoolSlug: slug,
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
        school,
        message: "School created successfully",
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
