/**
 * Centralized logging utility for the Babble application.
 *
 * Provides structured logging with configurable log levels, namespacing,
 * and consistent formatting across the application.
 *
 * @example
 * ```typescript
 * import { createLogger } from '@/utils/logger';
 *
 * const logger = createLogger('SpeechService');
 * logger.info('Speech started', { voiceURI: 'en-US' });
 * logger.error('Speech failed', new Error('No voices available'));
 * ```
 */

/** Available log levels in order of severity */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Configuration for log level colors in console output */
const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#9CA3AF', // gray
  info: '#3B82F6',  // blue
  warn: '#F59E0B',  // amber
  error: '#EF4444', // red
};

/** Log level priority for filtering */
const LOG_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Global logger configuration.
 * Modify these values to control logging behavior across the application.
 */
interface LoggerConfig {
  /** Minimum log level to output. Messages below this level are suppressed. */
  minLevel: LogLevel;
  /** Whether logging is enabled. Set to false to suppress all logs. */
  enabled: boolean;
  /** Whether to include timestamps in log output. */
  showTimestamp: boolean;
}

/** Default configuration - can be modified at runtime */
const config: LoggerConfig = {
  minLevel: import.meta.env.DEV ? 'debug' : 'info',
  enabled: true,
  showTimestamp: true,
};

/**
 * Updates the global logger configuration.
 *
 * @param updates - Partial configuration updates to apply
 *
 * @example
 * ```typescript
 * // Suppress all logs except errors
 * configureLogger({ minLevel: 'error' });
 *
 * // Disable logging entirely
 * configureLogger({ enabled: false });
 * ```
 */
export function configureLogger(updates: Partial<LoggerConfig>): void {
  Object.assign(config, updates);
}

/**
 * Gets the current logger configuration.
 *
 * @returns Current logger configuration object
 */
export function getLoggerConfig(): Readonly<LoggerConfig> {
  return { ...config };
}

/**
 * Formats a log message with optional namespace and timestamp.
 *
 * @param namespace - The module/component name for the log
 * @param level - The log level
 * @param message - The log message
 * @returns Formatted log prefix and style
 */
function formatLog(namespace: string, level: LogLevel): { prefix: string; style: string } {
  const timestamp = config.showTimestamp
    ? new Date().toISOString().split('T')[1].slice(0, -1)
    : '';

  const prefix = config.showTimestamp
    ? `%c[${timestamp}] [${namespace}] [${level.toUpperCase()}]`
    : `%c[${namespace}] [${level.toUpperCase()}]`;

  const style = `color: ${LOG_COLORS[level]}; font-weight: bold;`;

  return { prefix, style };
}

/**
 * Checks if a log level should be output based on current configuration.
 *
 * @param level - The log level to check
 * @returns true if the level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_PRIORITY[level] >= LOG_PRIORITY[config.minLevel];
}

/**
 * Logger interface providing methods for each log level.
 */
export interface Logger {
  /** Log debug information for development troubleshooting */
  debug(message: string, ...args: unknown[]): void;
  /** Log general information about application flow */
  info(message: string, ...args: unknown[]): void;
  /** Log warnings about potential issues */
  warn(message: string, ...args: unknown[]): void;
  /** Log errors and exceptions */
  error(message: string, ...args: unknown[]): void;
}

/**
 * Creates a namespaced logger instance.
 *
 * Creates a logger with a specific namespace that prefixes all log messages,
 * making it easy to identify which module or component produced the log.
 *
 * @param namespace - The name to prefix log messages with (e.g., 'SpeechService', 'DocumentStore')
 * @returns A Logger instance with debug, info, warn, and error methods
 *
 * @example
 * ```typescript
 * // Create a logger for a service
 * const logger = createLogger('DocumentService');
 *
 * // Log various levels
 * logger.debug('Loading document', { id: '123' });
 * logger.info('Document loaded successfully');
 * logger.warn('Document content is empty');
 * logger.error('Failed to save document', error);
 * ```
 */
export function createLogger(namespace: string): Logger {
  return {
    debug(message: string, ...args: unknown[]) {
      if (!shouldLog('debug')) return;
      const { prefix, style } = formatLog(namespace, 'debug');
      console.debug(prefix, style, message, ...args);
    },

    info(message: string, ...args: unknown[]) {
      if (!shouldLog('info')) return;
      const { prefix, style } = formatLog(namespace, 'info');
      console.info(prefix, style, message, ...args);
    },

    warn(message: string, ...args: unknown[]) {
      if (!shouldLog('warn')) return;
      const { prefix, style } = formatLog(namespace, 'warn');
      console.warn(prefix, style, message, ...args);
    },

    error(message: string, ...args: unknown[]) {
      if (!shouldLog('error')) return;
      const { prefix, style } = formatLog(namespace, 'error');
      console.error(prefix, style, message, ...args);
    },
  };
}

/**
 * Pre-configured loggers for common application modules.
 * Import these directly for convenience, or create custom loggers with createLogger().
 */
export const loggers = {
  speech: createLogger('Speech'),
  document: createLogger('Document'),
  settings: createLogger('Settings'),
  ui: createLogger('UI'),
  editor: createLogger('Editor'),
} as const;
