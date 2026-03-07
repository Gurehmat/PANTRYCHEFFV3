/**
 * Retry with exponential backoff. Only retries on network errors and 5xx.
 */

import { logger } from './logger';

const SOURCE = 'retry';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  backoffMultiplier?: number;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
};

function isRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('econnrefused'))
      return true;
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: number }).status;
    if (typeof status === 'number' && status >= 500 && status < 600) return true;
  }
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (typeof statusCode === 'number' && statusCode >= 500 && statusCode < 600) return true;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const { maxRetries, baseDelay, backoffMultiplier } = { ...defaultOptions, ...options };
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries || !isRetryable(err)) throw err;
      const waitMs = baseDelay * Math.pow(backoffMultiplier, attempt);
      logger.warn(SOURCE, `Retry attempt ${attempt + 1}/${maxRetries} after ${waitMs}ms`, {
        error: err instanceof Error ? err.message : String(err),
      });
      await delay(waitMs);
    }
  }
  throw lastError;
}
