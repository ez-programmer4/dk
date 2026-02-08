import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    // Fallback secret for development if NEXTAUTH_SECRET is not set
    const secret =
      process.env.NEXTAUTH_SECRET || "fallback-secret-for-development";

    const session = await getToken({
      req,
      secret,
    });

    if (!session) {
      return NextResponse.json({ error: "No session token" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    const { schoolSlug } = params;

    // Find school
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
    });


    if (!school) {
      console.log('❌ School not found for slug:', schoolSlug);
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Check if admin belongs to this school
    const admin = await prisma.admin.findUnique({
      where: { id: session.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all settings from database - use the existing setting model
    const allSettings = await prisma.setting.findMany({
      where: {
        OR: [
          { schoolId: school.id }, // School-specific settings
          { schoolId: null } // Global settings
        ]
      },
    });
    console.log(`Found ${allSettings.length} settings for school ${school.name}:`, allSettings.map(s => `${s.key}=${s.value}`).join(', '));

    let settings = {
      branding: {
        primaryColor: "#1f2937",
        secondaryColor: "#6b7280",
        accentColor: "#3b82f6",
        schoolName: school.name,
        isSetupComplete: false,
      },
      general: {
        timezone: "Africa/Addis_Ababa",
        defaultLanguage: "en",
        dateFormat: "DD/MM/YYYY",
        currency: "ETB",
        workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        workingHours: { start: "08:00", end: "17:00" },
        academicYearStart: "09-01",
        academicYearEnd: "06-30",
      },
      academic: {
        gradeLevels: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
        subjects: ["Mathematics", "English", "Science", "Social Studies", "Arabic", "Islamic Studies"],
        maxClassSize: 30,
        attendanceRequired: true,
        gradingScale: "A-F",
        reportCardFrequency: "quarterly",
        enableOnlineLearning: false,
        requireParentApproval: true,
      },
      financial: {
        paymentMethods: ["cash", "bank_transfer"],
        paymentGateway: "stripe",
        currency: "ETB",
        taxRate: 0,
        lateFeePolicy: { enabled: false, amount: 0, frequency: "monthly" },
        scholarshipEnabled: false,
        installmentPlans: true,
      },
      communication: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        newsletterEnabled: true,
        parentPortalEnabled: true,
        studentPortalEnabled: true,
        emergencyContacts: true,
      },
      security: {
        twoFactorAuth: false,
        passwordPolicy: { minLength: 8, requireSpecialChars: true, requireNumbers: true, expireAfter: 90 },
        sessionTimeout: 30,
        ipWhitelist: [],
        auditLogging: true,
      },
      integrations: {
        googleCalendar: false,
        zoomIntegration: false,
        paymentGateway: "stripe",
        emailService: "sendgrid",
        smsService: "twilio",
        cloudStorage: "aws_s3",
      },
      features: {
        attendanceTracking: true,
        gradebook: true,
        parentCommunication: true,
        onlinePayments: true,
        resourceLibrary: true,
        timetableManagement: true,
        examManagement: true,
        transportation: false,
        cafeteria: false,
        library: true,
      },
    };


    // Parse each setting from database
    allSettings.forEach(setting => {
      if (setting.value !== null) {
        // Map setting keys to our settings structure
        switch (setting.key) {
          // Branding settings
          case 'school_primary_color':
            settings.branding.primaryColor = setting.value;
            break;
          case 'school_secondary_color':
            settings.branding.secondaryColor = setting.value;
            break;
          case 'school_accent_color':
            settings.branding.accentColor = setting.value;
            break;
          case 'school_name':
            settings.branding.schoolName = setting.value;
            break;
          case 'school_tagline':
            settings.branding.tagline = setting.value;
            break;
          case 'school_description':
            settings.branding.description = setting.value;
            break;
          case 'school_logo_url':
            settings.branding.logoUrl = setting.value;
            break;

          // General settings - migrate legacy keys
          case 'default_timezone':
            settings.general.timezone = setting.value;
            break;
          case 'default_currency':
            settings.general.currency = setting.value;
            break;
          case 'default_language':
            settings.general.defaultLanguage = setting.value;
            break;

          // Academic settings
          case 'grade_levels':
            try {
              settings.academic.gradeLevels = JSON.parse(setting.value);
            } catch {
              settings.academic.gradeLevels = setting.value.split(',');
            }
            break;
          case 'subjects':
            try {
              settings.academic.subjects = JSON.parse(setting.value);
            } catch {
              settings.academic.subjects = setting.value.split(',');
            }
            break;
          case 'max_class_size':
            settings.academic.maxClassSize = parseInt(setting.value);
            break;
          case 'attendance_required':
            settings.academic.attendanceRequired = setting.value === 'true';
            break;

          // Communication settings
          case 'email_notifications':
            settings.communication.emailNotifications = setting.value === 'true';
            break;
          case 'sms_notifications':
            settings.communication.smsNotifications = setting.value === 'true';
            break;
          case 'parent_portal_enabled':
            settings.communication.parentPortalEnabled = setting.value === 'true';
            break;
          case 'student_portal_enabled':
            settings.communication.studentPortalEnabled = setting.value === 'true';
            break;

          // Feature toggles
          case 'attendance_tracking_enabled':
            settings.features.attendanceTracking = setting.value === 'true';
            break;
          case 'gradebook_enabled':
            settings.features.gradebook = setting.value === 'true';
            break;
          case 'parent_communication_enabled':
            settings.features.parentCommunication = setting.value === 'true';
            break;
          case 'online_payments_enabled':
            settings.features.onlinePayments = setting.value === 'true';
            break;
          case 'resource_library_enabled':
            settings.features.resourceLibrary = setting.value === 'true';
            break;
          case 'timetable_management_enabled':
            settings.features.timetableManagement = setting.value === 'true';
            break;
          case 'exam_management_enabled':
            settings.features.examManagement = setting.value === 'true';
            break;
          case 'library_enabled':
            settings.features.library = setting.value === 'true';
            break;

          default:
            // Unknown setting keys are ignored
            break;
        }
      }
    });

    console.log(`📤 Sending settings response for school ${school.name}:`, {
      branding: settings.branding,
      settingsCount: allSettings.length
    });

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
    // Log only critical errors, not parsing errors for legacy data
    if (!error.message?.includes('JSON')) {
      console.error("Settings fetch error:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Debug endpoint to check database state
export async function PATCH(
  req: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-for-development";
    const session = await getToken({ req, secret });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolSlug } = params;
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      include: { settings: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      school: { id: school.id, name: school.name, slug: school.slug },
      settingsCount: school.settings.length,
      settings: school.settings.map(s => ({
        id: s.id,
        key: s.key,
        category: s.category,
        type: s.type,
        valueLength: s.value?.length || 0,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Debug failed" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    // Fallback secret for development if NEXTAUTH_SECRET is not set
    const secret =
      process.env.NEXTAUTH_SECRET || "fallback-secret-for-development";

    const session = await getToken({
      req,
      secret,
    });

    if (!session) {
      return NextResponse.json({ error: "No session token" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
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
    const admin = await prisma.admin.findUnique({
      where: { id: session.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Validate required fields
    if (!settingsData.branding?.schoolName?.trim()) {
      return NextResponse.json(
        { error: "School name is required" },
        { status: 400 }
      );
    }

    // Save individual settings using the setting model
    const settingsToSave = [];

    // Branding settings
    if (settingsData.branding) {
      settingsToSave.push(
        { key: 'school_primary_color', value: settingsData.branding.primaryColor },
        { key: 'school_secondary_color', value: settingsData.branding.secondaryColor },
        { key: 'school_accent_color', value: settingsData.branding.accentColor },
        { key: 'school_name', value: settingsData.branding.schoolName },
        { key: 'school_tagline', value: settingsData.branding.tagline || '' },
        { key: 'school_description', value: settingsData.branding.description || '' },
        { key: 'school_logo_url', value: settingsData.branding.logoUrl || '' },
      );
    }

    // General settings
    if (settingsData.general) {
      settingsToSave.push(
        { key: 'timezone', value: settingsData.general.timezone },
        { key: 'default_language', value: settingsData.general.defaultLanguage },
        { key: 'currency', value: settingsData.general.currency },
        { key: 'date_format', value: settingsData.general.dateFormat },
        { key: 'working_days', value: JSON.stringify(settingsData.general.workingDays) },
      );
    }

    // Academic settings
    if (settingsData.academic) {
      settingsToSave.push(
        { key: 'grade_levels', value: JSON.stringify(settingsData.academic.gradeLevels) },
        { key: 'subjects', value: JSON.stringify(settingsData.academic.subjects) },
        { key: 'max_class_size', value: settingsData.academic.maxClassSize.toString() },
        { key: 'attendance_required', value: settingsData.academic.attendanceRequired.toString() },
      );
    }

    // Communication settings
    if (settingsData.communication) {
      settingsToSave.push(
        { key: 'email_notifications', value: settingsData.communication.emailNotifications.toString() },
        { key: 'sms_notifications', value: settingsData.communication.smsNotifications.toString() },
        { key: 'parent_portal_enabled', value: settingsData.communication.parentPortalEnabled.toString() },
        { key: 'student_portal_enabled', value: settingsData.communication.studentPortalEnabled.toString() },
      );
    }

    // Feature toggles
    if (settingsData.features) {
      settingsToSave.push(
        { key: 'attendance_tracking_enabled', value: settingsData.features.attendanceTracking.toString() },
        { key: 'gradebook_enabled', value: settingsData.features.gradebook.toString() },
        { key: 'parent_communication_enabled', value: settingsData.features.parentCommunication.toString() },
        { key: 'online_payments_enabled', value: settingsData.features.onlinePayments.toString() },
        { key: 'resource_library_enabled', value: settingsData.features.resourceLibrary.toString() },
        { key: 'timetable_management_enabled', value: settingsData.features.timetableManagement.toString() },
        { key: 'exam_management_enabled', value: settingsData.features.examManagement.toString() },
        { key: 'library_enabled', value: settingsData.features.library.toString() },
      );
    }

    // Save all settings using upsert
    const saveResults = await Promise.all(
      settingsToSave.map(async ({ key, value }) => {
        if (value !== undefined && value !== null) {
          const result = await prisma.setting.upsert({
            where: {
              key_schoolId: {
                key,
                schoolId: school.id,
              },
            },
            update: {
              value: value.toString(),
              updatedAt: new Date(),
            },
            create: {
              key,
              value: value.toString(),
              schoolId: school.id,
            },
          });
          return result;
        }
        return null;
      })
    );

    // Log the settings update
    await prisma.auditlog.create({
      data: {
        actionType: "UPDATE_SCHOOL_SETTINGS",
        adminId: admin.id,
        schoolId: school.id,
        targetId: school.id,
        details: `Updated ${saveResults.filter(r => r !== null).length} school settings`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    });

  } catch (error) {
    // Log only critical errors, not parsing errors for legacy data
    if (!error.message?.includes('JSON')) {
      console.error("Settings update error:", error);
    }
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}