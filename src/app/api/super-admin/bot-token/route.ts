import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/bot-token - Get global bot token
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the first super admin (assuming there's only one, or we can get by session user id)
    const superAdmin = await prisma.superAdmin.findFirst({
      select: {
        id: true,
        name: true,
        telegramBotToken: true,
      },
    });

    if (!superAdmin) {
      return NextResponse.json({ error: "SuperAdmin not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      botToken: superAdmin.telegramBotToken,
    });
  } catch (error) {
    console.error("Get bot token API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/bot-token - Update global bot token
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { botToken } = await req.json();

    if (!botToken || typeof botToken !== 'string') {
      return NextResponse.json({ error: "Bot token is required" }, { status: 400 });
    }

    // Basic validation for bot token format (should start with bot token format)
    if (!botToken.startsWith('bot') && !botToken.match(/^\d{8,10}:[a-zA-Z0-9_-]{35}$/)) {
      return NextResponse.json({
        error: "Invalid bot token format. Should be in format: bot<token> or <token>:<secret>"
      }, { status: 400 });
    }

    // Get the current super admin
    const currentSuperAdmin = await prisma.superAdmin.findUnique({
      where: { id: session.user.id },
    });

    if (!currentSuperAdmin) {
      return NextResponse.json({ error: "SuperAdmin not found" }, { status: 404 });
    }

    // Update the bot token
    const updatedSuperAdmin = await prisma.superAdmin.update({
      where: { id: session.user.id },
      data: {
        telegramBotToken: botToken,
      },
      select: {
        id: true,
        name: true,
        telegramBotToken: true,
      },
    });

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "update_bot_token",
          resourceType: "system",
          resourceId: "global_bot_token",
          details: {
            superAdminName: currentSuperAdmin.name,
            action: "updated_global_bot_token",
            oldTokenLength: currentSuperAdmin.telegramBotToken ? currentSuperAdmin.telegramBotToken.length : 0,
            newTokenLength: botToken.length,
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log for bot token update:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Global bot token updated successfully",
      botToken: updatedSuperAdmin.telegramBotToken,
    });
  } catch (error) {
    console.error("Update bot token API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
