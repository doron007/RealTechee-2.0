/**
 * Server-side logger for Node.js (CommonJS)
 * Simplified version of the TypeScript logger for server-side usage
 */

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

class ServerLogger {
  constructor(moduleName = 'Server') {
    this.moduleName = moduleName;
    
    // Allow custom log level override via environment variable
    const customLogLevel = process.env.LOG_LEVEL;
    let defaultLevel = isDev ? LogLevel.DEBUG : LogLevel.INFO;
    
    // Parse custom log level if provided
    if (customLogLevel) {
      const levelMap = {
        'DEBUG': LogLevel.DEBUG,
        'INFO': LogLevel.INFO,
        'WARN': LogLevel.WARN,
        'ERROR': LogLevel.ERROR,
        'NONE': LogLevel.NONE
      };
      defaultLevel = levelMap[customLogLevel.toUpperCase()] || defaultLevel;
    }
    
    this.logLevel = defaultLevel;
  }

  shouldLog(level) {
    return level >= this.logLevel;
  }

  formatMessage(level, message, data) {
    const timestamp = isDev ? new Date().toISOString() : '';
    const prefix = 'RealTechee';
    
    const baseMessage = [timestamp, prefix, level, this.moduleName, message]
      .filter(Boolean)
      .join(' | ');

    return data !== undefined ? [baseMessage, data] : [baseMessage];
  }

  debug(message, data) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const args = this.formatMessage('DEBUG', message, data);
    console.log(...args);
  }

  info(message, data) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const args = this.formatMessage('INFO', message, data);
    console.info(...args);
  }

  warn(message, data) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const args = this.formatMessage('WARN', message, data);
    console.warn(...args);
  }

  error(message, error) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const args = this.formatMessage('ERROR', message, error);
    console.error(...args);
  }
}

module.exports = { ServerLogger };