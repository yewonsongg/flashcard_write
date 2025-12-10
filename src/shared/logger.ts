import pc from 'picocolors';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (message: string, meta?: unknown) => void;
  info:  (message: string, meta?: unknown) => void;
  warn:  (message: string, meta?: unknown) => void;
  error: (message: string, meta?: unknown) => void;
};

interface LoggerOptions {
  context: string;
  /**
   * Force color off (e.g. if we ever need plain logs)
   * Defaults to true in dev, false in production build if you want.
   */
  useColors?: boolean;
};

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info:  20,
  warn:  30,
  error: 40,
};

// Change this if we want different minimum levels by env.
const DEFAULT_MIN_LEVEL: LogLevel = 
  process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function levelEnabled(level: LogLevel, minLevel: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[minLevel];
};

function formatLevel(level: LogLevel, useColors: boolean): string {
  if (!useColors) return level.toUpperCase().padEnd(5, ' ');
  switch (level) {
    case 'debug': 
      return pc.cyan(level.toUpperCase().padEnd(5, ' '));
    case 'info':
      return pc.green(level.toUpperCase().padEnd(5, ' '));
    case 'warn':
      return pc.yellow(level.toUpperCase().padEnd(5, ' '));
    case 'error':
      return pc.red(level.toUpperCase().padEnd(5, ' '));
  }
};

function formatContext(context: string, useColors: boolean): string {
  const label = `[${context}]`;
  return useColors ? pc.magenta(label) : label;
};

function formatTimeStamp(): string {
  return new Date().toISOString();
};

function output(
  level: LogLevel,
  context: string,
  message: string,
  meta: unknown,
  useColors: boolean,
) {
  if (!levelEnabled(level, DEFAULT_MIN_LEVEL)) return;

  const ts  = formatTimeStamp();
  const lvl = formatLevel(level, useColors);
  const ctx = formatContext(context, useColors);

  const base = `${ts} ${lvl} ${ctx} ${message}`;

  // optional structured meta for debugging
  if (meta !== undefined) {
    console.log(base, '\n ', meta);
  } else {
    console.log(base);
  }
};

export function createLogger(options: LoggerOptions): Logger {
  const { context } = options;
  const useColors = 
    options.useColors ?? process.env.NODE_ENV !== 'production';

  return {
    debug(message, meta) {
      output('debug', context, message, meta, useColors);
    },
    info(message, meta) {
      output('info', context, message, meta, useColors);
    },
    warn(message, meta) {
      output('warn', context, message, meta, useColors);
    },
    error(message, meta) {
      output('error', context, message, meta, useColors);
    },
  };
};

// general app-wide context logger
export const log = createLogger({ context: 'app' });