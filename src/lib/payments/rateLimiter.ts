/**
 * Rate limiting for payment operations
 */

import { prisma } from "@/lib/prisma";

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  cooldownMs?: number; // Cooldown period after max attempts
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  cooldownMs: 15 * 60 * 1000, // 15 minutes
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds until retry allowed
}

/**
 * Check if a payment attempt is allowed for a student
 */
export async function checkPaymentRateLimit(
  studentId: number,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);
  
  // Count payment attempts in the time window
  const attempts = await prisma.payment_checkout.count({
    where: {
      studentId,
      createdAt: {
        gte: windowStart,
      },
      status: {
        in: ["initialized", "pending", "failed"],
      },
    },
  });
  
  const remaining = Math.max(0, config.maxAttempts - attempts);
  const resetAt = new Date(now.getTime() + config.windowMs);
  
  if (attempts >= config.maxAttempts) {
    // Check if cooldown period has passed
    const lastAttempt = await prisma.payment_checkout.findFirst({
      where: {
        studentId,
        createdAt: {
          gte: windowStart,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });
    
    if (lastAttempt && config.cooldownMs) {
      const cooldownEnd = new Date(lastAttempt.createdAt.getTime() + config.cooldownMs);
      if (now < cooldownEnd) {
        const retryAfter = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetAt: cooldownEnd,
          retryAfter,
        };
      }
    }
    
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }
  
  return {
    allowed: true,
    remaining,
    resetAt,
  };
}

/**
 * Record a payment attempt for rate limiting
 */
export async function recordPaymentAttempt(studentId: number): Promise<void> {
  // The attempt is already recorded when checkout is created
  // This function can be used for additional tracking if needed
}








