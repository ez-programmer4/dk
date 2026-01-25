import { NextRequest, NextResponse } from "next/server";
import { getBotManager } from "@/lib/telegram/bot-manager";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    console.log("🤖 Centralized Telegram Bot Webhook received");

    const update = await req.json();
    console.log("📨 Update received:", JSON.stringify(update, null, 2));

    // Get bot manager instance
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/bot-webhook`;

    if (!botToken) {
      console.error("❌ TELEGRAM_BOT_TOKEN not configured");
      return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
    }

    const botManager = getBotManager(botToken, webhookUrl);

    if (!botManager) {
      console.error("❌ Failed to initialize bot manager");
      return NextResponse.json({ error: "Bot initialization failed" }, { status: 500 });
    }

    // Process the update through the bot manager
    await botManager.processWebhook(update);

    console.log("✅ Webhook processed successfully");
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("❌ Bot webhook error:", error);
    console.error(
      "❌ Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );

    // Always return success to prevent Telegram from retrying
    return NextResponse.json({ ok: true });
  }
}
