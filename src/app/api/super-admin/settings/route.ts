import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Check super admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the first SuperAdmin (assuming there's only one main SuperAdmin)
    const superAdmin = await prisma.superAdmin.findFirst({
      select: {
        telegramBotToken: true,
      },
    });

    const settings = {
      telegramBotToken: superAdmin?.telegramBotToken || "",
    };

    return NextResponse.json({
      success: true,
      settings,
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

    const settingsData = await req.json();

    // Validate telegram bot token if provided
    if (settingsData.telegramBotToken && settingsData.telegramBotToken.trim()) {
      const token = settingsData.telegramBotToken.trim();
      const isValid = token.startsWith('bot') && token.length > 40 ||
                     /^\d{8,10}:[a-zA-Z0-9_-]{35}$/.test(token);

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid telegram bot token format" },
          { status: 400 }
        );
      }
    }

    // Update the SuperAdmin settings (assuming there's only one main SuperAdmin)
    const updatedSuperAdmin = await prisma.superAdmin.updateMany({
      data: {
        telegramBotToken: settingsData.telegramBotToken?.trim() || null,
      },
    });

    // Log the settings update (get super admin ID from database)
    try {
      const superAdmin = await prisma.superAdmin.findFirst({
        select: { id: true },
      });

      if (superAdmin) {
        await prisma.superAdminAuditLog.create({
          data: {
            superAdminId: superAdmin.id,
            action: "UPDATE_SUPER_ADMIN_SETTINGS",
            resourceType: "settings",
            resourceId: "global",
            details: {
              updatedFields: ["telegramBotToken"],
            },
          },
        });
      }
    } catch (auditError) {
      // Don't fail the settings update if audit logging fails
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Super admin settings updated successfully",
      settings: {
        telegramBotToken: settingsData.telegramBotToken?.trim() || "",
      },
    });

  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}




