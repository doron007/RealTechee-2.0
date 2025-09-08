/**
 * Jest Configuration for Backend Unit Testing
 * 
 * This configuration is specifically designed to test backend business logic
 * with proper mocking, isolation, and coverage reporting.
 */

module.exports = {
  // Test environment - Node for backend tests
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts'
  ],
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/out/'
  ],
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/cache'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'utils/**/*.ts',
    'services/**/*.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/*.test.ts',
    '!**/*.test.tsx',
    '!utils/testDataUtils.ts',
    '!utils/environmentTest.ts'
  ],
  
  coverageDirectory: '<rootDir>/coverage/isolation',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage thresholds for isolation architecture
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './services/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Test result processors - disabled for now
  // testResultsProcessor: '<rootDir>/src/__tests__/processors/isolationTestProcessor.js',
  
  // Custom test environment options
  testEnvironmentOptions: {},
  
  // Global test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance monitoring
  maxWorkers: '50%',
  
  // Custom matchers and globals
  globals: {
    'ts-jest': {
      isolatedModules: true,
      useESM: false
    }
  }
};