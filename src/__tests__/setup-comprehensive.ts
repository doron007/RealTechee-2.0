/**
 * Comprehensive Test Setup
 * 
 * Setup for 100% backend test coverage with proper mocking and utilities
 */

// Mock AWS Amplify before any imports
jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn()
  }))
}));

// Mock logger utility
jest.mock('../../utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

// Configure Jest timeout
jest.setTimeout(10000);

// Global test utilities
global.beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export {};