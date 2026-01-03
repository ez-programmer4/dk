/**
 * School Configuration Management
 *
 * Handles school-specific settings, feature flags, and configuration
 */

import { prisma } from "./prisma";

export interface SchoolConfig {
  schoolId: string;
  settings: Record<string, any>;
  features: FeatureFlags;
  branding: BrandingConfig;
}

export interface FeatureFlags {
  zoom: boolean;
  analytics: boolean;
  telegram: boolean;
  stripe: boolean;
  customBranding: boolean;
  advancedReports: boolean;
  [key: string]: boolean;
}

export interface BrandingConfig {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  faviconUrl?: string;
}

/**
 * Get school configuration
 */
export async function getSchoolConfig(
  schoolId: string
): Promise<SchoolConfig | null> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      settings: true,
    },
  });

  if (!school) {
    return null;
  }

  // Parse features from JSON
  const features: FeatureFlags = {
    zoom: false,
    analytics: false,
    telegram: false,
    stripe: false,
    customBranding: false,
    advancedReports: false,
    ...((school.features as any) || {}),
  };

  // Build settings map
  const settings: Record<string, any> = {};
  school.settings.forEach((setting) => {
    settings[setting.key] = parseSettingValue(setting.value, setting.type);
  });

  return {
    schoolId: school.id,
    settings,
    features,
    branding: {
      logoUrl: school.logoUrl || undefined,
      primaryColor: school.primaryColor || undefined,
      secondaryColor: school.secondaryColor || undefined,
    },
  };
}

/**
 * Get a specific school setting
 */
export async function getSchoolSetting(
  schoolId: string,
  key: string
): Promise<any> {
  const setting = await prisma.schoolSetting.findUnique({
    where: {
      schoolId_key: {
        schoolId,
        key,
      },
    },
  });

  if (!setting) {
    return null;
  }

  return parseSettingValue(setting.value, setting.type);
}

/**
 * Set a school setting
 */
export async function setSchoolSetting(
  schoolId: string,
  key: string,
  value: any,
  type: "string" | "number" | "boolean" | "json" = "string",
  category?: string
): Promise<void> {
  const stringValue = type === "json" ? JSON.stringify(value) : String(value);

  await prisma.schoolSetting.upsert({
    where: {
      schoolId_key: {
        schoolId,
        key,
      },
    },
    create: {
      schoolId,
      key,
      value: stringValue,
      type,
      category: category || "general",
    },
    update: {
      value: stringValue,
      type,
      category: category || "general",
    },
  });
}

/**
 * Update feature flags
 */
export async function updateFeatureFlags(
  schoolId: string,
  features: Partial<FeatureFlags>
): Promise<void> {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { features: true },
  });

  const currentFeatures = (school?.features as any) || {};
  const updatedFeatures = { ...currentFeatures, ...features };

  await prisma.school.update({
    where: { id: schoolId },
    data: {
      features: updatedFeatures as any,
    },
  });
}

/**
 * Update branding configuration
 */
export async function updateBranding(
  schoolId: string,
  branding: Partial<BrandingConfig>
): Promise<void> {
  await prisma.school.update({
    where: { id: schoolId },
    data: {
      logoUrl: branding.logoUrl || null,
      primaryColor: branding.primaryColor || null,
      secondaryColor: branding.secondaryColor || null,
    },
  });
}

/**
 * Initialize default settings for a new school (transaction-based)
 */
export async function initializeDefaultSettingsInTransaction(
  tx: any,
  schoolId: string
): Promise<void> {
  const defaultSettings = [
    {
      key: "timezone",
      value: "Africa/Addis_Ababa",
      type: "string" as const,
      category: "general",
    },
    {
      key: "currency",
      value: "ETB",
      type: "string" as const,
      category: "payment",
    },
    {
      key: "language",
      value: "en",
      type: "string" as const,
      category: "general",
    },
    {
      key: "email_notifications",
      value: "true",
      type: "boolean" as const,
      category: "notifications",
    },
    {
      key: "sms_notifications",
      value: "false",
      type: "boolean" as const,
      category: "notifications",
    },
    {
      key: "auto_attendance_reminder",
      value: "true",
      type: "boolean" as const,
      category: "attendance",
    },
    {
      key: "payment_reminder_days",
      value: "3",
      type: "number" as const,
      category: "payment",
    },
    {
      key: "max_students_per_teacher",
      value: "50",
      type: "number" as const,
      category: "general",
    },
  ];

  // Create default settings using transaction
  await Promise.all(
    defaultSettings.map((setting) =>
      tx.schoolSetting.create({
        data: {
          schoolId,
          key: setting.key,
          value: setting.value,
          type: setting.type,
          category: setting.category,
        },
      })
    )
  );

  // Set default feature flags using transaction
  await updateFeatureFlagsInTransaction(tx, schoolId, {
    zoom: true,
    analytics: true,
    telegram: false,
    stripe: false,
    customBranding: false,
    advancedReports: false,
  });
}

/**
 * Update feature flags within a transaction
 */
export async function updateFeatureFlagsInTransaction(
  tx: any,
  schoolId: string,
  features: Partial<FeatureFlags>
): Promise<void> {
  const school = await tx.school.findUnique({
    where: { id: schoolId },
    select: { features: true },
  });

  const currentFeatures = (school?.features as any) || {};
  const updatedFeatures = { ...currentFeatures, ...features };

  await tx.school.update({
    where: { id: schoolId },
    data: {
      features: updatedFeatures as any,
    },
  });
}

/**
 * Initialize default settings for a new school
 */
export async function initializeDefaultSettings(
  schoolId: string
): Promise<void> {
  // Verify school exists before creating settings
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true },
  });

  if (!school) {
    throw new Error(
      `School with ID ${schoolId} not found. Cannot initialize settings.`
    );
  }

  const defaultSettings = [
    {
      key: "timezone",
      value: "Africa/Addis_Ababa",
      type: "string" as const,
      category: "general",
    },
    {
      key: "currency",
      value: "ETB",
      type: "string" as const,
      category: "payment",
    },
    {
      key: "language",
      value: "en",
      type: "string" as const,
      category: "general",
    },
    {
      key: "email_notifications",
      value: "true",
      type: "boolean" as const,
      category: "notifications",
    },
    {
      key: "sms_notifications",
      value: "false",
      type: "boolean" as const,
      category: "notifications",
    },
    {
      key: "auto_attendance_reminder",
      value: "true",
      type: "boolean" as const,
      category: "attendance",
    },
    {
      key: "payment_reminder_days",
      value: "3",
      type: "number" as const,
      category: "payment",
    },
    {
      key: "max_students_per_teacher",
      value: "50",
      type: "number" as const,
      category: "general",
    },
  ];

  // Create default settings
  await Promise.all(
    defaultSettings.map((setting) =>
      prisma.schoolSetting.create({
        data: {
          schoolId,
          key: setting.key,
          value: setting.value,
          type: setting.type,
          category: setting.category,
        },
      })
    )
  );

  // Set default feature flags
  await updateFeatureFlags(schoolId, {
    zoom: true,
    analytics: true,
    telegram: false,
    stripe: false,
    customBranding: false,
    advancedReports: false,
  });
}

/**
 * Parse setting value based on type
 */
function parseSettingValue(value: string | null, type: string): any {
  if (value === null || value === undefined) {
    return null;
  }

  switch (type) {
    case "boolean":
      return value === "true" || value === "1";
    case "number":
      return Number(value);
    case "json":
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
}

/**
 * Check if a feature is enabled for a school
 */
export async function isFeatureEnabled(
  schoolId: string,
  feature: keyof FeatureFlags
): Promise<boolean> {
  const config = await getSchoolConfig(schoolId);
  return config?.features[feature] || false;
}
