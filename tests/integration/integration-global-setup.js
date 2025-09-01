/**
 * Global Setup for Integration Tests
 * 
 * Sets up the test environment for integration testing:
 * - Mock AWS configuration
 * - Initialize test databases/services
 * - Setup global mocks for external dependencies
 */

const { createLogger } = require('../../utils/logger');

const logger = createLogger('IntegrationSetup');

module.exports = async () => {
  logger.info('🚀 Starting Integration Test Global Setup');

  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_AMPLIFY_ENV = 'test';
  
  // Mock AWS configuration to prevent real API calls
  process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  process.env.AWS_REGION = 'us-east-1';
  
  // Mock GraphQL endpoint
  process.env.NEXT_PUBLIC_GRAPHQL_URL = 'https://test-graphql.amazonaws.com/graphql';
  process.env.NEXT_PUBLIC_API_KEY = 'test-api-key';
  
  // Prevent actual AWS Amplify configuration
  process.env.INTEGRATION_TEST_MODE = 'true';
  
  // Setup global performance monitoring
  global.integrationTestMetrics = {
    startTime: Date.now(),
    testCounts: {
      passed: 0,
      failed: 0,
      total: 0
    },
    performanceMetrics: {
      slowestTest: null,
      fastestTest: null,
      averageTestTime: 0
    }
  };

  // Mock console methods to capture logs during testing
  global.originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  // Override console methods for cleaner test output
  console.log = (...args) => {
    if (!args[0]?.includes?.('AWS Amplify')) {
      global.originalConsole.log(...args);
    }
  };

  console.warn = (...args) => {
    if (!args[0]?.includes?.('AWS Amplify') && !args[0]?.includes?.('deprecated')) {
      global.originalConsole.warn(...args);
    }
  };

  logger.info('✅ Integration Test Global Setup Complete', {
    environment: process.env.NODE_ENV,
    amplifyEnv: process.env.NEXT_PUBLIC_AMPLIFY_ENV,
    mockMode: process.env.INTEGRATION_TEST_MODE
  });
};