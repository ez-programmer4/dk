import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, safeDecrypt } from "@/lib/encryption";

interface SystemSettingsData {
  telegramBotToken: string;
  platformName: string;
  platformDescription: string;
  supportEmail: string;
  maintenanceMode: boolean;
  maxSchoolsPerAdmin: number;
  sessionTimeout: number; // in minutes
  enableRegistration: boolean;
  defaultTimezone: string;
  defaultCurrency: string;
}

// Define which settings should be encrypted
const ENCRYPTED_SETTINGS = ['telegramBotToken'];

export async function GET() {
  try {
    // Check super admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all system settings
    const settings = await prisma.systemSettings.findMany({
      orderBy: { key: 'asc' }
    });

    // Convert settings to object format with decryption for sensitive data
    const settingsData: Partial<SystemSettingsData> = {};

    for (const setting of settings) {
      let value: any = setting.value;

      // Decrypt sensitive settings
      if (setting.isEncrypted) {
        try {
          value = safeDecrypt(setting.value);
        } catch (error) {
          console.error(`Failed to decrypt setting ${setting.key}:`, error);
          value = ''; // Return empty string for failed decryption
        }
      } else {
        // Parse JSON for non-encrypted settings
        try {
          value = JSON.parse(setting.value);
        } catch {
          // Keep as string if not JSON
        }
      }

      settingsData[setting.key as keyof SystemSettingsData] = value;
    }

    return NextResponse.json({
      success: true,
      settings: settingsData
    });

  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check super admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const superAdminId = (session.user as any)?.id;
    const settingsData: Partial<SystemSettingsData> = await req.json();

    // Process each setting
    const updates: any[] = [];

    for (const [key, value] of Object.entries(settingsData)) {
      if (value === undefined) continue;

      let processedValue: string;
      const shouldEncrypt = ENCRYPTED_SETTINGS.includes(key);

      if (shouldEncrypt) {
        // Encrypt sensitive data
        processedValue = encrypt(String(value));
      } else {
        // Store non-sensitive data as JSON
        processedValue = JSON.stringify(value);
      }

      // Upsert the setting
      updates.push(
        prisma.systemSettings.upsert({
          where: { key },
          update: {
            value: processedValue,
            updatedById: superAdminId,
            isEncrypted: shouldEncrypt,
          },
          create: {
            key,
            value: processedValue,
            description: getSettingDescription(key),
            category: getSettingCategory(key),
            isEncrypted: shouldEncrypt,
            isPublic: getSettingIsPublic(key),
            createdById: superAdminId,
            updatedById: superAdminId,
          },
        })
      );
    }

    // Execute all updates
    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully"
    });

  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    telegramBotToken: "Global Telegram bot token used by all schools for notifications",
    platformName: "Name of the platform displayed to users",
    platformDescription: "Description of the platform",
    supportEmail: "Support email address for user inquiries",
    maintenanceMode: "Enable maintenance mode to restrict access",
    maxSchoolsPerAdmin: "Maximum number of schools a super admin can manage",
    sessionTimeout: "User session timeout in minutes",
    enableRegistration: "Allow new schools to register",
    defaultTimezone: "Default timezone for new schools",
    defaultCurrency: "Default currency for new schools"
  };
  return descriptions[key] || "";
}

function getSettingCategory(key: string): string {
  const categories: Record<string, string> = {
    telegramBotToken: "integrations",
    platformName: "general",
    platformDescription: "general",
    supportEmail: "general",
    maintenanceMode: "security",
    maxSchoolsPerAdmin: "limits",
    sessionTimeout: "security",
    enableRegistration: "general",
    defaultTimezone: "general",
    defaultCurrency: "general"
  };
  return categories[key] || "general";
}

function getSettingIsPublic(key: string): boolean {
  const publicSettings = ['platformName', 'platformDescription', 'supportEmail', 'maintenanceMode'];
  return publicSettings.includes(key);
}