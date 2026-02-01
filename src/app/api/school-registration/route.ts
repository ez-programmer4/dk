import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schema for school self-registration
const schoolRegistrationSchema = z.object({
  // School Information
  schoolName: z.string().min(2, "School name must be at least 2 characters"),
  schoolEmail: z.string().email("Invalid email address"),
  schoolPhone: z.string().optional(),
  schoolAddress: z.string().optional(),

  // Admin Information
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid admin email address"),
  adminPhone: z.string().optional(),
  adminUsername: z.string().min(3, "Username must be at least 3 characters"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters"),

  // Configuration (optional, with defaults)
  timezone: z.string().default("Africa/Addis_Ababa"),
  defaultCurrency: z.string().default("ETB"),
  defaultLanguage: z.string().default("en"),

  // Additional information
  expectedStudents: z.number().min(1).max(10000).optional(),
  schoolType: z.string().optional(), // "madrasa", "school", "academy", etc.
  additionalNotes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = schoolRegistrationSchema.parse(body);

    // Generate slug from school name
    const slug = validatedData.schoolName
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

    // Check if admin email is already used
    const existingAdminEmail = await prisma.admin.findUnique({
      where: { username: validatedData.adminUsername },
    });

    if (existingAdminEmail) {
      return NextResponse.json(
        { error: "Admin username already exists" },
        { status: 400 }
      );
    }

    // Hash admin password
    const hashedPassword = await bcrypt.hash(validatedData.adminPassword, 12);

    // Start transaction for school and admin creation
    const result = await prisma.$transaction(async (tx) => {
      // Create school with pending status
      const school = await tx.school.create({
        data: {
          name: validatedData.schoolName,
          slug,
          email: validatedData.schoolEmail,
          phone: validatedData.schoolPhone,
          address: validatedData.schoolAddress,
          timezone: validatedData.timezone,
          defaultCurrency: validatedData.defaultCurrency,
          defaultLanguage: validatedData.defaultLanguage,
          status: "pending", // Schools created via self-registration start as pending
          isSelfRegistered: true,
          registrationStatus: "pending",
          registrationData: {
            adminName: validatedData.adminName,
            adminEmail: validatedData.adminEmail,
            adminPhone: validatedData.adminPhone,
            expectedStudents: validatedData.expectedStudents,
            schoolType: validatedData.schoolType,
            additionalNotes: validatedData.additionalNotes,
            submittedAt: new Date().toISOString(),
          },
        },
      });

      // Create admin for the school (but don't activate until approved)
      await tx.admin.create({
        data: {
          name: validatedData.adminName,
          username: validatedData.adminUsername,
          passcode: hashedPassword,
          phoneno: validatedData.adminPhone,
          role: "admin",
          schoolId: school.id,
          chat_id: `admin_pending_${school.id}_${Date.now()}`, // Special chat_id for pending schools
          isActive: false, // Admin account is inactive until school is approved
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
          {
            schoolId: school.id,
            key: "self_registration_data",
            value: JSON.stringify({
              expectedStudents: validatedData.expectedStudents,
              schoolType: validatedData.schoolType,
              additionalNotes: validatedData.additionalNotes,
            }),
            category: "registration",
          },
        ],
      });

      return school;
    });

    // Send notification to super admins about new registration
    // Note: This would typically send an email or notification
    // For now, we'll just log it
    console.log(`New school registration: ${result.name} (${result.id}) - Status: pending`);

    return NextResponse.json({
      success: true,
      message: "School registration submitted successfully. You will receive an email once your registration is reviewed.",
      school: {
        id: result.id,
        name: result.name,
        slug: result.slug,
        email: result.email,
        status: result.status,
        registrationStatus: result.registrationStatus,
        submittedAt: result.createdAt,
      },
    });

  } catch (error) {
    console.error("School registration error:", error);

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

