/**
 * Webhook security utilities
 * Provides rate limiting and request validation for webhook endpoints
 */

import { NextRequest } from "next/server";
import { paymentLogger } from "./logger";

const WEBHOOK_SECURITY_CONTEXT = "WebhookSecurity";

// In-memory rate limiting (for production, consider using Redis)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100, // Max 100 requests per window
  windowMs: 60 * 1000, // 1 minute window
};

/**
 * Check if a webhook request should be rate limited
 */
export function checkWebhookRateLimit(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; retryAfter?: number } {
  const clientId = getClientIdentifier(request);
  const now = Date.now();

  // Clean up old entries
  cleanupOldEntries(now);

  const record = requestCounts.get(clientId);

  if (!record) {
    requestCounts.set(clientId, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  // Check if window has expired
  if (now > record.resetAt) {
    requestCounts.set(clientId, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    paymentLogger.warn(WEBHOOK_SECURITY_CONTEXT, "Rate limit exceeded", {
      clientId,
      count: record.count,
      maxRequests: config.maxRequests,
      retryAfter,
    });
    return { allowed: false, retryAfter };
  }

  // Increment count
  record.count++;
  return { allowed: true };
}

/**
 * Get client identifier for rate limiting
 * Uses IP address or Stripe event ID if available
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  // For Stripe webhooks, we can also use event ID if available
  // This provides better rate limiting per event
  try {
    const eventId = request.headers.get("stripe-event-id");
    if (eventId) {
      return `stripe:${eventId}`;
    }
  } catch {
    // Ignore errors
  }

  return `ip:${ip}`;
}

/**
 * Clean up old rate limit entries
 */
function cleanupOldEntries(now: number): void {
  const entriesToDelete: string[] = [];
  
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetAt + 60000) { // Keep entries 1 minute past reset
      entriesToDelete.push(key);
    }
  }

  entriesToDelete.forEach((key) => requestCounts.delete(key));
}

/**
 * Validate webhook request size
 */
export function validateWebhookRequestSize(
  body: string,
  maxSize: number = 1024 * 1024 // 1MB default
): { valid: boolean; error?: string } {
  const size = Buffer.byteLength(body, "utf8");

  if (size > maxSize) {
    paymentLogger.warn(WEBHOOK_SECURITY_CONTEXT, "Webhook request too large", {
      size,
      maxSize,
    });
    return {
      valid: false,
      error: `Request body too large: ${size} bytes (max: ${maxSize} bytes)`,
    };
  }

  return { valid: true };
}

/**
 * Validate webhook request content type
 */
export function validateWebhookContentType(
  request: NextRequest
): { valid: boolean; error?: string } {
  const contentType = request.headers.get("content-type");

  // Stripe webhooks should have application/json or text/plain content type
  if (!contentType || (!contentType.includes("application/json") && !contentType.includes("text/plain"))) {
    paymentLogger.warn(WEBHOOK_SECURITY_CONTEXT, "Invalid content type", {
      contentType,
    });
    return {
      valid: false,
      error: `Invalid content type: ${contentType}. Expected application/json or text/plain`,
    };
  }

  return { valid: true };
}




