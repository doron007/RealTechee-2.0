// Simple logger utility for the application

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, data?: LogData): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data })
    };

    // In development, use console for better debugging
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(`[${timestamp}] DEBUG: ${message}`, data);
          break;
        case 'info':
          console.info(`[${timestamp}] INFO: ${message}`, data);
          break;
        case 'warn':
          console.warn(`[${timestamp}] WARN: ${message}`, data);
          break;
        case 'error':
          console.error(`[${timestamp}] ERROR: ${message}`, data);
          break;
      }
    } else {
      // In production, you might want to send to a logging service
      // For now, we'll still use console but with structured logging
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, data?: LogData): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: LogData): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: LogData): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: LogData): void {
    this.log('error', message, data);
  }

  // Specific methods for common use cases
  formSubmission(formType: string, data: any): void {
    this.info(`Form submitted: ${formType}`, {
      formType,
      hasFiles: data.uploadedMedia?.length > 0,
      relationToProperty: data.relationToProperty,
      rtDigitalSelection: data.rtDigitalSelection
    });
  }

  apiCall(endpoint: string, method: string, data?: any): void {
    this.info(`API call: ${method} ${endpoint}`, { endpoint, method, data });
  }

  apiError(endpoint: string, error: any): void {
    this.error(`API error: ${endpoint}`, { endpoint, error: error.message || error });
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;