/**
 * Classes de Erro Customizadas
 *
 * Fornece tratamento consistente de erros em toda a aplicação,
 * com códigos de status HTTP e mensagens claras.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(statusCode: number, code: string, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Mantém o stack trace correto
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 - Bad Request
export class BadRequestError extends AppError {
  constructor(message: string, code = "BAD_REQUEST") {
    super(400, code, message);
  }
}

// 401 - Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado. Faça login para continuar.", code = "UNAUTHORIZED") {
    super(401, code, message);
  }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(
    message = "Acesso negado. Você não tem permissão para essa ação.",
    code = "FORBIDDEN"
  ) {
    super(403, code, message);
  }
}

// 404 - Not Found
export class NotFoundError extends AppError {
  constructor(message: string, code = "NOT_FOUND") {
    super(404, code, message);
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(409, code, message);
  }
}

// 422 - Unprocessable Entity (validação)
export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  constructor(message: string, errors?: Record<string, string[]>, code = "VALIDATION_ERROR") {
    super(422, code, message);
    this.errors = errors;
  }
}

// 429 - Too Many Requests
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(
    message = "Muitas requisições. Tente novamente mais tarde.",
    retryAfter?: number,
    code = "RATE_LIMIT"
  ) {
    super(429, code, message);
    this.retryAfter = retryAfter;
  }
}

// 500 - Internal Server Error
export class InternalServerError extends AppError {
  constructor(
    message = "Erro interno do servidor. Tente novamente mais tarde.",
    code = "INTERNAL_ERROR"
  ) {
    super(500, code, message);
  }
}

// 503 - Service Unavailable
export class ServiceUnavailableError extends AppError {
  constructor(message = "Serviço temporariamente indisponível.", code = "SERVICE_UNAVAILABLE") {
    super(503, code, message);
  }
}

/**
 * Verifica se um erro é operacional (esperado) ou um bug
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Formata erro para resposta ao cliente
 */
export function formatErrorResponse(error: Error | AppError) {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        ...(error instanceof ValidationError && error.errors ? { errors: error.errors } : {}),
        ...(error instanceof RateLimitError && error.retryAfter
          ? { retryAfter: error.retryAfter }
          : {}),
      },
    };
  }

  // Erro não tratado - não expor detalhes em produção
  const isDev = import.meta.env.DEV;
  return {
    error: {
      code: "INTERNAL_ERROR",
      message: isDev ? error.message : "Erro interno do servidor",
      statusCode: 500,
      ...(isDev ? { stack: error.stack } : {}),
    },
  };
}
