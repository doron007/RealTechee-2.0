/**
 * Environment-specific logging configuration
 */

import { LogLevel } from './logger';

export const getLoggerConfig = () => {
  const env = process.env.NODE_ENV;
  const isTest = env === 'test';
  const isDev = env === 'development';
  const isProd = env === 'production';

  return {
    // Log levels by environment
    development: {
      level: LogLevel.DEBUG,
      enableTimestamp: true,
      enableColors: true,
      prefix: 'RealTechee[DEV]',
    },
    production: {
      level: LogLevel.INFO,
      enableTimestamp: false,
      enableColors: false,
      prefix: 'RealTechee',
    },
    test: {
      level: LogLevel.NONE,
      enableTimestamp: false,
      enableColors: false,
      prefix: 'RealTechee[TEST]',
    },
  };
};

/**
 * Module-specific log level overrides
 * Use this to enable specific modules in production for troubleshooting
 */
export const moduleOverrides = {
  // Example: Enable debug logs for specific modules in production
  // AgentInfoCard: LogLevel.DEBUG,
  // ProjectsAPI: LogLevel.DEBUG,
};