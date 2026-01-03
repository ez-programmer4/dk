/**
 * Retry mechanism for payment operations
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: ["NETWORK_ERROR", "TIMEOUT", "GATEWAY_TIMEOUT"],
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | unknown;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break;
      }
      
      // Check if error is retryable
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryable = opts.retryableErrors.some(code => 
        errorMessage.includes(code) || errorMessage.includes("network") || errorMessage.includes("timeout")
      );
      
      if (!isRetryable) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }
  
  throw lastError;
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("fetch failed") ||
      message.includes("connection") ||
      message.includes("econnrefused") ||
      message.includes("enotfound")
    );
  }
  return false;
}








