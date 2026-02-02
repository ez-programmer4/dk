import { prisma } from "@/lib/prisma";

/**
 * Get the global Telegram bot token from the SuperAdmin settings
 * This token is used by all schools for Telegram bot interactions
 */
export async function getGlobalBotToken(): Promise<string | null> {
  try {
    // Get the first SuperAdmin (assuming there's only one main SuperAdmin)
    const superAdmin = await prisma.superAdmin.findFirst({
      select: {
        telegramBotToken: true,
      },
    });

    return superAdmin?.telegramBotToken || null;
  } catch (error) {
    console.error("Failed to get global bot token:", error);
    return null;
  }
}

/**
 * Validate bot token format
 */
export function isValidBotToken(token: string): boolean {
  // Accept both formats: bot<token> or <token>:<secret>
  return (
    token.startsWith('bot') && token.length > 40 ||
    /^\d{8,10}:[a-zA-Z0-9_-]{35}$/.test(token)
  );
}









