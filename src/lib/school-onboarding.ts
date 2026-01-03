/**
 * School Onboarding Service
 *
 * Handles the complete onboarding process for new schools
 */

import { prisma } from "./prisma";
import {
  initializeDefaultSettings,
  initializeDefaultSettingsInTransaction,
} from "./school-config";
import { hash } from "bcryptjs";

export interface OnboardingData {
  // School basic info
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;

  // Localization
  timezone?: string;
  defaultCurrency?: string;
  defaultLanguage?: string;

  // Branding
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;

  // Subscription & limits
  subscriptionTier?: string;
  maxStudents?: number;
  planId?: string;
  billingCycle?: string;

  // Integrations
  telegramBotToken?: string;

  // Admin details
  adminName: string;
  adminUsername: string;
  adminPassword: string;
  adminEmail?: string;
  adminPhone?: string;
}

export interface OnboardingResult {
  school: {
    id: string;
    name: string;
    slug: string;
  };
  admin: {
    id: string;
    username: string;
  };
}

/**
 * Complete school onboarding process
 */
export async function onboardNewSchool(
  data: OnboardingData,
  createdBy?: string
): Promise<OnboardingResult> {
  // Validate slug uniqueness
  const existingSchool = await prisma.school.findUnique({
    where: { slug: data.slug },
  });

  if (existingSchool) {
    throw new Error(`School with slug "${data.slug}" already exists`);
  }

  // Validate admin username uniqueness
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: data.adminUsername },
  });

  if (existingAdmin) {
    throw new Error(`Admin username "${data.adminUsername}" already exists`);
  }

  // Create school and admin in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create school
    const school = await tx.school.create({
      data: {
        // Basic info
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,

        // Localization
        timezone: data.timezone || "Africa/Addis_Ababa",
        defaultCurrency: data.defaultCurrency || "ETB",
        defaultLanguage: data.defaultLanguage || "en",

        // Branding
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || "#3B82F6",
        secondaryColor: data.secondaryColor || "#1F2937",

        // Subscription & limits
        subscriptionTier: data.subscriptionTier || "trial",
        maxStudents: data.maxStudents || 50,
        billingCycle: data.billingCycle || "monthly",
        status: "active",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        createdById: createdBy || null,
        planId: data.planId || null,

        // Integrations
        telegramBotToken: data.telegramBotToken || null,
      },
    });

    // 2. Create admin user
    const hashedPassword = await hash(data.adminPassword, 10);
    const admin = await tx.admin.create({
      data: {
        name: data.adminName,
        username: data.adminUsername,
        passcode: hashedPassword,
        phoneno: data.adminPhone || null,
        role: "admin",
        schoolId: school.id,
        chat_id: `admin_${school.id}_${Date.now()}`, // Generate unique chat_id
      },
    });

    // 3. Initialize default settings within transaction for atomicity
    await initializeDefaultSettingsInTransaction(tx, school.id);

    return { school, admin };
  });

  return {
    school: {
      id: result.school.id,
      name: result.school.name,
      slug: result.school.slug,
    },
    admin: {
      id: result.admin.id,
      username: result.admin.username,
    },
  };
}

/**
 * Validate onboarding data
 */
export function validateOnboardingData(data: OnboardingData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // School validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push("School name must be at least 2 characters");
  }

  if (!data.slug || !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push(
      "School slug must contain only lowercase letters, numbers, and hyphens"
    );
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Valid email address is required");
  }

  // Admin validation
  if (!data.adminName || data.adminName.trim().length < 2) {
    errors.push("Admin name must be at least 2 characters");
  }

  if (!data.adminUsername || data.adminUsername.trim().length < 3) {
    errors.push("Admin username must be at least 3 characters");
  }

  if (!data.adminPassword || data.adminPassword.length < 8) {
    errors.push("Admin password must be at least 8 characters");
  }

  // Branding validation (optional)
  if (data.logoUrl && !/^https?:\/\/.+/.test(data.logoUrl)) {
    errors.push("Logo URL must be a valid HTTP/HTTPS URL");
  }

  if (data.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(data.primaryColor)) {
    errors.push("Primary color must be a valid hex color (e.g., #3B82F6)");
  }

  if (data.secondaryColor && !/^#[0-9A-Fa-f]{6}$/.test(data.secondaryColor)) {
    errors.push("Secondary color must be a valid hex color (e.g., #1F2937)");
  }

  // Limits validation
  if (data.maxStudents && (data.maxStudents < 1 || data.maxStudents > 10000)) {
    errors.push("Max students must be between 1 and 10,000");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a unique slug from school name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await prisma.school.findUnique({
    where: { slug },
  });
  return !existing;
}
