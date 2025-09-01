/**
 * Backend Test Setup
 * 
 * Global setup for all backend unit tests with zero external dependencies
 */

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Date.now for consistent timestamps in tests
const mockNow = 1640995200000; // 2022-01-01 00:00:00 UTC
Date.now = jest.fn(() => mockNow);

// Mock Math.random for deterministic results
Math.random = jest.fn(() => 0.5);

// Global test utilities
global.testUtils = {
  mockNow,
  createMockPromise: <T>(resolveValue?: T, rejectValue?: any) => {
    if (rejectValue) {
      return Promise.reject(rejectValue);
    }
    return Promise.resolve(resolveValue);
  },
  
  // Reset all mocks between tests
  resetAllMocks: () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  },
  
  // Create mock timers
  createMockTimers: () => {
    jest.useFakeTimers();
    return {
      advanceTime: (ms: number) => jest.advanceTimersByTime(ms),
      runAllTimers: () => jest.runAllTimers(),
      restore: () => jest.useRealTimers(),
    };
  },
};

// Type definitions for global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        mockNow: number;
        createMockPromise: <T>(resolveValue?: T, rejectValue?: any) => Promise<T>;
        resetAllMocks: () => void;
        createMockTimers: () => {
          advanceTime: (ms: number) => void;
          runAllTimers: () => void;
          restore: () => void;
        };
      };
    }
  }
}

// Clean up after each test
afterEach(() => {
  global.testUtils.resetAllMocks();
});

// Silence specific warnings that are expected in test environment
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('Warning') || args[0].includes('console.error'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});