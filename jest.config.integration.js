/**
 * Jest Configuration for Integration Tests
 * 
 * Comprehensive integration testing configuration for validating
 * all backend layers work together correctly:
 * - Repository ↔ Service ↔ API Hooks integration
 * - End-to-end data flow validation
 * - Error handling and resilience testing
 * - Performance across integrated layers
 */

module.exports = {
  // Display name for this configuration
  displayName: 'Integration Tests',
  
  // Test environment
  testEnvironment: 'jsdom', // Required for React hooks testing
  
  // Test file patterns - integration tests only
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.js'
  ],
  
  // Module name mapping for imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  
  // Transform configuration - simplified
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/out/',
    '<rootDir>/tests/e2e/' // Exclude Playwright tests
  ],
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>'
  ],
  
  // Coverage configuration for integration tests
  collectCoverage: true,
  collectCoverageFrom: [
    'services/enhancedRequestsService.ts',
    'hooks/useRequestsQuery.ts',
    'utils/amplifyAPI.ts',
    '!**/*.d.ts',
    '!**/*.test.js',
    '!**/node_modules/**',
    '!**/.next/**'
  ],
  
  coverageDirectory: '<rootDir>/coverage/integration',
  
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Coverage thresholds for integration testing
  coverageThreshold: {
    global: {
      branches: 80, // 80% minimum for integration coverage
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Performance settings for integration tests
  testTimeout: 10000, // 10 seconds for integration tests (includes async operations)
  maxWorkers: '50%', // Use half of available workers for integration tests
  
  // Mock and cleanup settings
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Error handling
  errorOnDeprecated: false, // Allow deprecated features in integration tests
  bail: false, // Continue all tests even if some fail
  
  // Verbose output for debugging integration flows
  verbose: true,
  
  // Force exit to prevent hanging processes
  forceExit: true,
  
  // Detect open handles for clean shutdown
  detectOpenHandles: true,
  
  // Test result processor removed for simplicity
  
  // Global setup and teardown removed for simplicity
  
  // Custom environment variables for integration testing
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Reporters for integration test results
  reporters: ['default']
};