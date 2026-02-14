import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Check super admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'superAdmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token || !token.trim()) {
      return NextResponse.json(
        { error: "Bot token is required" },
        { status: 400 }
      );
    }

    // Validate token format
    const trimmedToken = token.trim();
    const isValid = trimmedToken.startsWith('bot') && trimmedToken.length > 40 ||
                   /^\d{8,10}:[a-zA-Z0-9_-]{35}$/.test(trimmedToken);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid bot token format" },
        { status: 400 }
      );
    }

    // Test the bot token by making a request to Telegram API
    try {
      const botToken = trimmedToken.startsWith('bot') ? trimmedToken : `bot${trimmedToken}`;
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
        timeout: 10000, // 10 second timeout
      });

      const data = await response.json();

      if (data.ok && data.result) {
        return NextResponse.json({
          success: true,
          message: "Bot token is valid",
          botInfo: {
            id: data.result.id,
            username: data.result.username,
            firstName: data.result.first_name,
          },
        });
      } else {
        return NextResponse.json(
          { error: "Bot token is invalid or bot is not accessible" },
          { status: 400 }
        );
      }
    } catch (apiError) {
      console.error("Telegram API error:", apiError);
      return NextResponse.json(
        { error: "Failed to verify bot token with Telegram API" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Bot token test error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}








