import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Default settings
const getDefaultSettings = () => ({
  platformName: "Darul Kubra",
  platformDescription: "Comprehensive School Management Platform",
  defaultTimezone: "Africa/Addis_Ababa",
  defaultCurrency: "ETB",
  maintenanceMode: false,
  maintenanceMessage: "System is currently under maintenance. Please check back later.",

  passwordMinLength: 8,
  sessionTimeout: 480,
  maxLoginAttempts: 5,
  enableTwoFactor: false,

  defaultBillingCycle: "monthly",
  stripeEnabled: false,
  paypalEnabled: false,
  taxRate: 0,

  smtpHost: "",
  smtpPort: 587,
  smtpUsername: "",
  smtpPassword: "",
  fromEmail: "noreply@darulkubra.com",
  fromName: "Darul Kubra",

  features: {
    zoomIntegration: true,
    analytics: true,
    telegramBot: false,
    customBranding: false,
    advancedReports: false,
    apiAccess: false,
    webhookSupport: false,
    mobileApp: false,
  },

  apiRateLimit: 1000,
  webhookUrl: "",

  dataRetentionDays: 365,
  autoBackup: true,
  backupFrequency: "daily",
});

// GET /api/super-admin/settings - Get platform settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all settings
    const settings = await prisma.setting.findMany({
      orderBy: { key: "asc" },
    });

    // Convert key-value pairs to structured object
    const settingsObject: any = {};
    settings.forEach((setting) => {
      try {
        // Try to parse as JSON first
        settingsObject[setting.key] = JSON.parse(setting.value);
      } catch {
        // If not JSON, use as string
        settingsObject[setting.key] = setting.value;
      }
    });

    // Merge with defaults to ensure all fields exist
    const defaultSettings = getDefaultSettings();
    const mergedSettings = { ...defaultSettings, ...settingsObject };

    return NextResponse.json({
      success: true,
      settings: mergedSettings,
    });
  } catch (error) {
    console.error("Super admin settings API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/settings - Update platform settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingsData = await req.json();

    // Convert structured object back to key-value pairs
    const updatedSettings = [];
    for (const [key, value] of Object.entries(settingsData)) {
      // Convert value to JSON string for complex objects, string for primitives
      const valueString = typeof value === 'object' ? JSON.stringify(value) : String(value);

      const setting = await prisma.setting.upsert({
        where: { key },
        update: {
          value: valueString,
          updatedAt: new Date(),
        },
        create: {
          key,
          value: valueString,
        },
      });
      updatedSettings.push(setting);
    }

    // Create audit log for settings update
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "update_settings",
          resourceType: "settings",
          resourceId: "system_settings",
          details: {
            updatedFields: Object.keys(settingsData),
            platformName: settingsData.platformName,
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}






