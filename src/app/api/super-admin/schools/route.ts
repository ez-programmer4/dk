import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schema for school creation
const createSchoolSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),

  // Branding
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),

  // Configuration
  timezone: z.string().default("Africa/Addis_Ababa"),
  defaultCurrency: z.string().default("ETB"),
  defaultLanguage: z.string().default("en"),

  // Admin details
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminUsername: z.string().min(3, "Username must be at least 3 characters"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),
  adminPhone: z.string().optional(),

  // Pricing tier
  pricingTierId: z.string().optional(),
});

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Validation schema for school status update
const updateSchoolStatusSchema = z.object({
  schoolId: z.string(),
  status: z.enum(["active", "inactive"]),
  statusReason: z.string().optional(),
});

// PUT method for updating school status
export async function PUT(req: NextRequest) {
  try {
    // Check super admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateSchoolStatusSchema.parse(body);

    // Update school status
    const updatedSchool = await prisma.school.update({
      where: { id: validatedData.schoolId },
      data: {
        status: validatedData.status,
        statusReason: validatedData.statusReason,
        statusChangedAt: new Date(),
        statusChangedById: "78er9w", // Actual SuperAdmin ID
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        statusReason: true,
        statusChangedAt: true,
        email: true,
        phone: true,
        address: true,
        primaryColor: true,
        secondaryColor: true,
        timezone: true,
        defaultCurrency: true,
        isSelfRegistered: true,
        registrationStatus: true,
        createdAt: true,
        _count: {
          select: {
            students: true,
            admins: true,
            teachers: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      school: updatedSchool
    });

  } catch (error) {
    console.error("Error updating school status:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update school status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check super admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createSchoolSchema.parse(body);

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists
    const existingSchool = await prisma.school.findUnique({
      where: { slug },
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: "School with this name already exists" },
        { status: 400 }
      );
    }

    // Hash admin password
    const hashedPassword = await bcrypt.hash(validatedData.adminPassword, 12);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create school
      const school = await tx.school.create({
        data: {
          name: validatedData.name,
          slug,
          email: validatedData.email,
          phone: validatedData.phone,
          address: validatedData.address,
          primaryColor: validatedData.primaryColor,
          secondaryColor: validatedData.secondaryColor,
          timezone: validatedData.timezone,
          defaultCurrency: validatedData.defaultCurrency,
          defaultLanguage: validatedData.defaultLanguage,
          pricingTierId: validatedData.pricingTierId,
          status: "active", // Default status for super admin created schools
          createdById: "78er9w", // Actual SuperAdmin ID
        },
      });

      // Create admin for the school
      await tx.admin.create({
        data: {
          name: validatedData.adminName,
          username: validatedData.adminUsername,
          passcode: hashedPassword,
          phoneno: validatedData.adminPhone,
          role: "admin",
          schoolId: school.id,
          chat_id: `admin_${school.id}_${Date.now()}`, // Generate unique chat_id
        },
      });

      // Create default settings for the school
      await tx.schoolSetting.createMany({
        data: [
          {
            schoolId: school.id,
            key: "default_timezone",
            value: validatedData.timezone,
            category: "general",
          },
          {
            schoolId: school.id,
            key: "default_currency",
            value: validatedData.defaultCurrency,
            category: "payment",
          },
          {
            schoolId: school.id,
            key: "default_language",
            value: validatedData.defaultLanguage,
            category: "general",
          },
        ],
      });

      return school;
    });

    // Log audit action
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId: "78er9w", // Actual SuperAdmin ID
        action: "CREATE_SCHOOL",
        resourceType: "school",
        resourceId: result.id,
        details: {
          schoolName: result.name,
          schoolSlug: result.slug,
          adminCreated: true,
        },
      },
    });

    return NextResponse.json({
      success: true,
      school: {
        id: result.id,
        name: result.name,
        slug: result.slug,
        email: result.email,
        phone: result.phone,
        status: result.status,
        createdAt: result.createdAt,
      },
      message: "School and admin created successfully",
    });

  } catch (error) {
    console.error("School creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check super admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    // Get schools with counts
    const [schools, totalCount] = await Promise.all([
      prisma.school.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          status: true,
          statusReason: true,
          statusChangedAt: true,
          timezone: true,
          defaultCurrency: true,
          createdAt: true,
          _count: {
            select: {
              students: true,
              teachers: true,
              admins: true,
            },
          },
          pricingTier: {
            select: {
              id: true,
              name: true,
              monthlyFee: true,
              currency: true,
            },
          },
          subscription: {
            select: {
              status: true,
              currentStudents: true,
              trialEndsAt: true,
              subscribedAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.school.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      schools,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error("Schools fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
