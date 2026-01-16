"use strict";
/**
 * Centralized logging utility for Smart Pilot
 * Wraps electron-log for consistent logging across main and renderer processes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
exports.createLogger = createLogger;
exports.configureLogger = configureLogger;
// Conditional import - electron-log may not be available in browser dev mode
let electronLog;
try {
    electronLog = require('electron-log');
}
catch (error) {
    // Fallback to console in browser mode
    electronLog = null;
}
/**
 * Log levels
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Logger instance with structured logging
 */
class Logger {
    constructor(context) {
        this.context = context;
    }
    /**
     * Debug level logging (verbose)
     */
    debug(message, ...args) {
        if (electronLog) {
            electronLog.debug(`[${this.context}]`, message, ...args);
        }
        else {
            console.debug(`[DEBUG] [${this.context}]`, message, ...args);
        }
    }
    /**
     * Info level logging (general information)
     */
    info(message, ...args) {
        if (electronLog) {
            electronLog.info(`[${this.context}]`, message, ...args);
        }
        else {
            console.info(`[INFO] [${this.context}]`, message, ...args);
        }
    }
    /**
     * Warning level logging
     */
    warn(message, ...args) {
        if (electronLog) {
            electronLog.warn(`[${this.context}]`, message, ...args);
        }
        else {
            console.warn(`[WARN] [${this.context}]`, message, ...args);
        }
    }
    /**
     * Error level logging
     */
    error(message, error, ...args) {
        if (error instanceof Error) {
            if (electronLog) {
                electronLog.error(`[${this.context}]`, message, {
                    error: error.message,
                    stack: error.stack,
                    ...args,
                });
            }
            else {
                console.error(`[ERROR] [${this.context}]`, message, {
                    error: error.message,
                    stack: error.stack,
                    ...args,
                });
            }
        }
        else {
            if (electronLog) {
                electronLog.error(`[${this.context}]`, message, error, ...args);
            }
            else {
                console.error(`[ERROR] [${this.context}]`, message, error, ...args);
            }
        }
    }
    /**
     * Log function entry (for debugging)
     */
    entry(functionName, params) {
        this.debug(`→ ${functionName}`, params);
    }
    /**
     * Log function exit (for debugging)
     */
    exit(functionName, result) {
        this.debug(`← ${functionName}`, result);
    }
    /**
     * Log with custom level
     */
    log(level, message, ...args) {
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
exports.Logger = Logger;
/**
 * Create logger instance for a specific context
 */
function createLogger(context) {
    return new Logger(context);
}
/**
 * Default logger instance
 */
exports.logger = createLogger('SmartPilot');
/**
 * Configure electron-log settings
 */
function configureLogger() {
    if (electronLog) {
        // Set log levels
        electronLog.transports.file.level = 'info';
        electronLog.transports.console.level = 'debug';
        // Configure log file location
        try {
            const { app } = require('electron');
            const path = require('path');
            if (app) {
                electronLog.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'smart-pilot.log');
            }
        }
        catch (error) {
            // App not available, use default location
        }
        // Set max file size (10MB)
        electronLog.transports.file.maxSize = 10 * 1024 * 1024;
    }
}
// Auto-configure on import
configureLogger();
