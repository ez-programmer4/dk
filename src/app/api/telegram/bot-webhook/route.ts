import { NextRequest, NextResponse } from "next/server";


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
    console.log("ًں¤– Webhook received request");
    const update: TelegramUpdate = await req.json();
    console.log("ًں“‌ Update data:", JSON.stringify(update, null, 2));

    // All bot functionality is handled by BotFather mini app configuration
    // No message handling needed - start message is handled by another system

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("â‌Œ Bot webhook error:", error);
    console.error(
      "â‌Œ Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "â‌Œ Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json({ ok: true }); // Always return ok to prevent retries
  }
}
