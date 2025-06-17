/**
 * Centralized logging utility for RealTechee
 * Provides environment-aware logging with different levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LoggerConfig {
  level: LogLevel;
  prefix: string;
  enableTimestamp: boolean;
  enableColors: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    const isDev = process.env.NODE_ENV === 'development';
    const isTest = process.env.NODE_ENV === 'test';
    
    // Allow custom log level override via environment variable
    const customLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL;
    let defaultLevel = isDev ? LogLevel.DEBUG : LogLevel.INFO;
    
    // Parse custom log level if provided
    if (customLogLevel) {
      const levelMap: Record<string, LogLevel> = {
        'DEBUG': LogLevel.DEBUG,
        'INFO': LogLevel.INFO,
        'WARN': LogLevel.WARN,
        'ERROR': LogLevel.ERROR,
        'NONE': LogLevel.NONE
      };
      defaultLevel = levelMap[customLogLevel.toUpperCase()] ?? defaultLevel;
    }
    
    this.config = {
      level: defaultLevel,
      prefix: 'RealTechee',
      enableTimestamp: isDev,
      enableColors: isDev && typeof window !== 'undefined',
      ...config
    };

    // Suppress all logs in test environment unless explicitly overridden
    if (isTest && !config.level) {
      this.config.level = LogLevel.NONE;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: string, module: string, message: string, data?: any): [string, ...any[]] {
    const timestamp = this.config.enableTimestamp ? new Date().toISOString() : '';
    const prefix = this.config.prefix;
    
    const baseMessage = [timestamp, prefix, level, module, message]
      .filter(Boolean)
      .join(' | ');

    return data !== undefined ? [baseMessage, data] : [baseMessage];
  }

  /**
   * Debug logs - only shown in development
   * Use for: Detailed debugging info, API responses, state changes
   */
  debug(module: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const args = this.formatMessage('DEBUG', module, message, data);
    console.log(...args);
  }

  /**
   * Info logs - shown in development and production
   * Use for: User actions, successful operations, important state changes
   */
  info(module: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const args = this.formatMessage('INFO', module, message, data);
    console.info(...args);
  }

  /**
   * Warning logs - always shown
   * Use for: Recoverable errors, deprecated usage, performance issues
   */
  warn(module: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const args = this.formatMessage('WARN', module, message, data);
    console.warn(...args);
  }

  /**
   * Error logs - always shown
   * Use for: Critical errors, exceptions, failed operations
   */
  error(module: string, message: string, error?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const args = this.formatMessage('ERROR', module, message, error);
    console.error(...args);
  }

  /**
   * Create a module-specific logger
   */
  forModule(moduleName: string) {
    return {
      debug: (message: string, data?: any) => this.debug(moduleName, message, data),
      info: (message: string, data?: any) => this.info(moduleName, message, data),
      warn: (message: string, data?: any) => this.warn(moduleName, message, data),
      error: (message: string, error?: any) => this.error(moduleName, message, error),
    };
  }

  /**
   * Dynamically change log level at runtime
   * Useful for debugging specific issues without restart
   */
  setLevel(level: LogLevel) {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }
}

// Global logger instance
export const logger = new Logger();

// Convenience function to create module loggers
export const createLogger = (moduleName: string) => logger.forModule(moduleName);

// Runtime log level control (available in browser console)
export const setLogLevel = (level: LogLevel | string) => {
  if (typeof level === 'string') {
    const levelMap: Record<string, LogLevel> = {
      'DEBUG': LogLevel.DEBUG,
      'INFO': LogLevel.INFO,
      'WARN': LogLevel.WARN,
      'ERROR': LogLevel.ERROR,
      'NONE': LogLevel.NONE
    };
    level = levelMap[level.toUpperCase()] ?? LogLevel.INFO;
  }
  logger.setLevel(level as LogLevel);
  console.info(`Log level changed to: ${LogLevel[level as LogLevel]}`);
};

export const getLogLevel = () => {
  const currentLevel = logger.getLevel();
  console.info(`Current log level: ${LogLevel[currentLevel]}`);
  return currentLevel;
};

// Make available globally for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).setLogLevel = setLogLevel;
  (window as any).getLogLevel = getLogLevel;
  (window as any).LogLevel = LogLevel;
}

// Export types for external use
export type ModuleLogger = ReturnType<typeof createLogger>;