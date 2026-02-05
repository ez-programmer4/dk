import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolSlug } = params;

    // Find school
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      include: {
        settings: true,
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Check if admin belongs to this school
    const admin = await prisma.admin.findFirst({
      where: {
        schoolId: school.id,
        email: (session.user as any)?.email,
        isActive: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get branding settings
    const brandingSettings = school.settings.find(s => s.key === 'branding');
    let settings = {
      primaryColor: "#1f2937",
      secondaryColor: "#6b7280",
      accentColor: "#3b82f6",
      schoolName: school.name,
      isSetupComplete: false,
    };

    if (brandingSettings && brandingSettings.value) {
      try {
        const parsed = JSON.parse(brandingSettings.value);
        settings = { ...settings, ...parsed };
      } catch (error) {
        console.error('Error parsing branding settings:', error);
      }
    }

    return NextResponse.json({
      success: true,
      settings,
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
      },
    });

  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolSlug } = params;
    const settingsData = await req.json();

    // Find school
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Check if admin belongs to this school
    const admin = await prisma.admin.findFirst({
      where: {
        schoolId: school.id,
        email: (session.user as any)?.email,
        isActive: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate required fields
    if (!settingsData.schoolName?.trim()) {
      return NextResponse.json(
        { error: "School name is required" },
        { status: 400 }
      );
    }

    // Prepare branding settings
    const brandingSettings = {
      primaryColor: settingsData.primaryColor || "#1f2937",
      secondaryColor: settingsData.secondaryColor || "#6b7280",
      accentColor: settingsData.accentColor || "#3b82f6",
      schoolName: settingsData.schoolName.trim(),
      tagline: settingsData.tagline?.trim() || "",
      logoUrl: settingsData.logoUrl || "",
      isSetupComplete: settingsData.isSetupComplete || false,
    };

    // Save settings using upsert
    await prisma.schoolSetting.upsert({
      where: {
        schoolId_key: {
          schoolId: school.id,
          key: 'branding',
        },
      },
      update: {
        value: JSON.stringify(brandingSettings),
        type: 'json',
        category: 'branding',
      },
      create: {
        schoolId: school.id,
        key: 'branding',
        value: JSON.stringify(brandingSettings),
        type: 'json',
        category: 'branding',
      },
    });

    // Log the settings update
    await prisma.auditlog.create({
      data: {
        actionType: "UPDATE_SCHOOL_BRANDING",
        adminId: admin.id,
        schoolId: school.id,
        targetId: school.id,
        details: "School branding settings updated",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Branding settings saved successfully",
      settings: brandingSettings,
    });

  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}