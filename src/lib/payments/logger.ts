/**
 * Payment system logger
 * Provides structured logging for payment operations
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class PaymentLogger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private enabled = process.env.PAYMENT_LOGGING !== "false";

  private formatMessage(level: LogLevel, context: string, message: string, data?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
    
    if (data && Object.keys(data).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    return `${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    
    // In production, only log warnings and errors
    if (!this.isDevelopment && (level === "debug" || level === "info")) {
      return false;
    }
    
    return true;
  }

  debug(context: string, message: string, data?: LogContext): void {
    if (!this.shouldLog("debug")) return;
    console.debug(this.formatMessage("debug", context, message, data));
  }

  info(context: string, message: string, data?: LogContext): void {
    if (!this.shouldLog("info")) return;
    console.info(this.formatMessage("info", context, message, data));
  }

  warn(context: string, message: string, data?: LogContext): void {
    if (!this.shouldLog("warn")) return;
    console.warn(this.formatMessage("warn", context, message, data));
  }

  error(context: string, message: string, error?: Error | unknown, data?: LogContext): void {
    if (!this.shouldLog("error")) return;
    
    const errorData: LogContext = {
      ...data,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : String(error),
    };
    
    console.error(this.formatMessage("error", context, message, errorData));
  }
}

export const paymentLogger = new PaymentLogger();




