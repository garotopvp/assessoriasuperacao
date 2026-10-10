import * as Sentry from "@sentry/react";

/**
 * Sistema de Logs Estruturado
 *
 * Fornece logging seguro e estruturado, evitando exposição de dados sensíveis
 * em produção e facilitando debugging em desenvolvimento.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  functionName: string;
  userId?: string;
  data?: Record<string, unknown>;
  timestamp: string;
  environment: string;
}

class Logger {
  private isDev: boolean;
  private context: string;

  constructor(context: string = "App") {
    this.isDev = import.meta.env.DEV || import.meta.env.MODE === "development";
    this.context = context;
  }

  private sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return undefined;

    // Remove dados sensíveis
    const sensitiveKeys = ["password", "token", "secret", "apiKey", "creditCard", "cvv"];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  private log(entry: LogEntry) {
    // Em produção, só loga erros e warnings
    if (!this.isDev && (entry.level === "debug" || entry.level === "info")) {
      return;
    }

    const logMessage = {
      ...entry,
      data: this.sanitizeData(entry.data),
    };

    // Console output colorido
    const colors: Record<LogLevel, string> = {
      debug: "\x1b[36m", // Cyan
      info: "\x1b[32m", // Green
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
    };
    const reset = "\x1b[0m";

    console.log(
      `${colors[entry.level]}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} [${entry.functionName}] ${entry.message}`,
      entry.data ? logMessage.data : ""
    );

    // Em produção, enviar para Sentry
    if (!this.isDev) {
      if (entry.level === "error") {
        Sentry.captureMessage(entry.message, {
          level: "error",
          extra: logMessage,
          tags: { context: this.context },
        });
      } else if (entry.level === "warn") {
        Sentry.captureMessage(entry.message, {
          level: "warning",
          extra: logMessage,
          tags: { context: this.context },
        });
      }
    }
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log({
      level: "debug",
      message,
      functionName: this.context,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      data,
    });
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log({
      level: "info",
      message,
      functionName: this.context,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      data,
    });
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log({
      level: "warn",
      message,
      functionName: this.context,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      data,
    });
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
    const errorData =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: this.isDev ? error.stack : undefined,
          }
        : { error: String(error) };

    this.log({
      level: "error",
      message,
      functionName: this.context,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      data: {
        ...data,
        ...errorData,
      },
    });
  }
}

// Factory function para criar loggers
export const createLogger = (context: string) => new Logger(context);

// Logger padrão
export const logger = new Logger();

// Export class para uso direto
export { Logger };
