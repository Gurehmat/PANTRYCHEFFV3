/**
 * Logger utility: timestamp, level, source, message.
 * Development: info, warn, error, debug.
 * Production: warn and error only.
 */

const isDev = import.meta.env.DEV;

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  context?: unknown;
}

function formatEntry(entry: LogEntry): string {
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}${
    entry.context !== undefined ? ` ${JSON.stringify(entry.context)}` : ''
  }`;
}

function log(level: LogLevel, source: string, message: string, context?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    ...(context !== undefined && { context }),
  };

  if (!isDev && (level === 'info' || level === 'debug')) return;

  const formatted = formatEntry(entry);
  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'debug':
      console.debug(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  info(source: string, message: string, context?: unknown): void {
    log('info', source, message, context);
  },
  warn(source: string, message: string, context?: unknown): void {
    log('warn', source, message, context);
  },
  error(source: string, message: string, context?: unknown): void {
    log('error', source, message, context);
  },
  debug(source: string, message: string, context?: unknown): void {
    log('debug', source, message, context);
  },
};
