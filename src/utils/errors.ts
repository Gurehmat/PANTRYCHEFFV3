/**
 * Centralized error types and utilities.
 */

export const ERROR_CODES = {
  UNKNOWN: 'UNKNOWN',
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  AI: 'AI',
  VALIDATION: 'VALIDATION',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface AppErrorContext {
  [key: string]: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly context?: AppErrorContext;

  constructor(
    message: string,
    options?: { code?: ErrorCode; statusCode?: number; context?: AppErrorContext }
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options?.code ?? ERROR_CODES.UNKNOWN;
    this.statusCode = options?.statusCode ?? 500;
    this.context = options?.context;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: AppErrorContext) {
    super(message, { code: ERROR_CODES.NETWORK, statusCode: 0, context });
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message: string, context?: AppErrorContext) {
    super(message, { code: ERROR_CODES.AUTH, statusCode: 401, context });
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class AIError extends AppError {
  constructor(message: string, context?: AppErrorContext) {
    super(message, { code: ERROR_CODES.AI, statusCode: 502, context });
    this.name = 'AIError';
    Object.setPrototypeOf(this, AIError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: AppErrorContext) {
    super(message, { code: ERROR_CODES.VALIDATION, statusCode: 400, context });
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

function getMessage(err: unknown): string {
  if (err instanceof Error) return err.message || 'An unexpected error occurred';
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return String(err);
}

/**
 * Normalize any thrown value into an AppError.
 */
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const message = getMessage(error);
  if (error instanceof Error) {
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch'))
      return new NetworkError(message, { original: error });
    if (message.toLowerCase().includes('auth') || message.includes('not logged in'))
      return new AuthError(message, { original: error });
    if (message.toLowerCase().includes('gemini') || message.toLowerCase().includes('ai'))
      return new AIError(message, { original: error });
    return new AppError(message, { context: { original: error } });
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new AppError(message, { context: { original: error } });
  }
  return new AppError(message);
}

/**
 * Return a user-friendly message for display in the UI.
 */
export function getErrorMessage(error: unknown): string {
  const appErr = handleError(error);
  switch (appErr.code) {
    case ERROR_CODES.NETWORK:
      return 'Connection problem. Please check your internet and try again.';
    case ERROR_CODES.AUTH:
      return appErr.message || 'Please sign in to continue.';
    case ERROR_CODES.AI:
      return 'Something went wrong with the recipe assistant. Please try again later.';
    case ERROR_CODES.VALIDATION:
      return appErr.message || 'Please check your input and try again.';
    default:
      return appErr.message || 'Something went wrong. Please try again.';
  }
}
