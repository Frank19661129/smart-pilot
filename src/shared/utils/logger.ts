/**
 * Centralized logging utility for Smart Pilot
 * Wraps electron-log for consistent logging across main and renderer processes
 */

// Conditional import - electron-log may not be available in browser dev mode
let electronLog: any;
try {
  electronLog = require('electron-log');
} catch (error) {
  // Fallback to console in browser mode
  electronLog = null;
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Logger instance with structured logging
 */
export class Logger {
  constructor(private context: string) {}

  /**
   * Debug level logging (verbose)
   */
  debug(message: string, ...args: unknown[]): void {
    if (electronLog) {
      electronLog.debug(`[${this.context}]`, message, ...args);
    } else {
      console.debug(`[DEBUG] [${this.context}]`, message, ...args);
    }
  }

  /**
   * Info level logging (general information)
   */
  info(message: string, ...args: unknown[]): void {
    if (electronLog) {
      electronLog.info(`[${this.context}]`, message, ...args);
    } else {
      console.info(`[INFO] [${this.context}]`, message, ...args);
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, ...args: unknown[]): void {
    if (electronLog) {
      electronLog.warn(`[${this.context}]`, message, ...args);
    } else {
      console.warn(`[WARN] [${this.context}]`, message, ...args);
    }
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (error instanceof Error) {
      if (electronLog) {
        electronLog.error(`[${this.context}]`, message, {
          error: error.message,
          stack: error.stack,
          ...args,
        });
      } else {
        console.error(`[ERROR] [${this.context}]`, message, {
          error: error.message,
          stack: error.stack,
          ...args,
        });
      }
    } else {
      if (electronLog) {
        electronLog.error(`[${this.context}]`, message, error, ...args);
      } else {
        console.error(`[ERROR] [${this.context}]`, message, error, ...args);
      }
    }
  }

  /**
   * Log function entry (for debugging)
   */
  entry(functionName: string, params?: unknown): void {
    this.debug(`→ ${functionName}`, params);
  }

  /**
   * Log function exit (for debugging)
   */
  exit(functionName: string, result?: unknown): void {
    this.debug(`← ${functionName}`, result);
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, ...args: unknown[]): void {
    switch (level) {
      case LogLevel.DEBUG:
        this.debug(message, ...args);
        break;
      case LogLevel.INFO:
        this.info(message, ...args);
        break;
      case LogLevel.WARN:
        this.warn(message, ...args);
        break;
      case LogLevel.ERROR:
        this.error(message, ...args);
        break;
    }
  }
}

/**
 * Create logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = createLogger('SmartPilot');

/**
 * Configure electron-log settings
 */
export function configureLogger(): void {
  if (electronLog) {
    // Set log levels
    electronLog.transports.file.level = 'info';
    electronLog.transports.console.level = 'debug';

    // Configure log file location
    try {
      const { app } = require('electron');
      const path = require('path');
      if (app) {
        electronLog.transports.file.resolvePathFn = () =>
          path.join(app.getPath('userData'), 'logs', 'smart-pilot.log');
      }
    } catch (error) {
      // App not available, use default location
    }

    // Set max file size (10MB)
    electronLog.transports.file.maxSize = 10 * 1024 * 1024;
  }
}

// Auto-configure on import
configureLogger();
