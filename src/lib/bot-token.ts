import { prisma } from "@/lib/prisma";
import { safeDecrypt } from "@/lib/encryption";

/**
 * Get the global Telegram bot token from the SystemSettings
 * This token is used by all schools for Telegram bot interactions
 * Token is encrypted in the database for security
 */
export async function getGlobalBotToken(): Promise<string | null> {
  try {
    // Get the telegram bot token from system settings
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'telegramBotToken' }
    });

    if (!setting) {
      console.log("No telegram bot token configured in system settings");
      return null;
    }

    // Decrypt the token if it's encrypted
    if (setting.isEncrypted) {
      const decryptedToken = safeDecrypt(setting.value);
      return decryptedToken || null;
    }

    // Return as-is if not encrypted (fallback for migration)
    return setting.value || null;
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


















