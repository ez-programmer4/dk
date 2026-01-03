/**
 * Standardized error handling for payment operations
 */

import { NextResponse } from "next/server";
import { paymentLogger } from "./logger";

export class PaymentError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export class ValidationError extends PaymentError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends PaymentError {
  constructor(message: string, details?: unknown) {
    super(message, 404, "NOT_FOUND", details);
    this.name = "NotFoundError";
  }
}

export class SecurityError extends PaymentError {
  constructor(message: string, details?: unknown) {
    super(message, 403, "SECURITY_ERROR", details);
    this.name = "SecurityError";
  }
}

/**
 * Handle payment errors and return standardized responses
 */
export function handlePaymentError(
  error: unknown,
  context: string
): NextResponse {
  if (error instanceof PaymentError) {
    paymentLogger.error(context, error.message, error, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && typeof error.details === 'object' && !Array.isArray(error.details) ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    paymentLogger.error(context, "Unexpected error", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }

  paymentLogger.error(context, "Unknown error", error);
  return NextResponse.json(
    { error: "An unknown error occurred" },
    { status: 500 }
  );
}

/**
 * Safely execute async operations with error handling
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context: string,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    paymentLogger.error(context, errorMessage || "Operation failed", error);
    throw error;
  }
}
