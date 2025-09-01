/**
 * Jest Configuration for Backend Unit Tests
 * 
 * Focused configuration for testing GraphQL isolation architecture backend components
 * with zero external dependencies and 100% coverage requirements.
 */

module.exports = {
  // Node environment for backend testing
  testEnvironment: 'node',
  
  // Test file patterns - backend only
  testMatch: [
    '<rootDir>/src/repositories/**/*.test.ts',
    '<rootDir>/src/services/**/*.test.ts',
    '<rootDir>/src/__tests__/backend/**/*.test.ts'
  ],
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/__tests__/(.*)$': '<rootDir>/src/__tests__/$1'
  },
  
  // Setup files for backend testing
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup-backend.ts'
  ],
  
  // Transform configuration
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs'
      }
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/out/',
    '<rootDir>/tests/' // Exclude Playwright tests
  ],
  
  // Coverage configuration for 100% backend coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'src/repositories/base/*.ts',
    'src/repositories/*.ts',
    'src/services/domain/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/examples/**',
    '!src/**/README*.ts'
  ],
  
  coverageDirectory: '<rootDir>/coverage/backend',
  
  coverageReporters: [
    'text',
    'text-summary', 
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Strict coverage thresholds for production readiness
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/repositories/base/GraphQLClient.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/repositories/RequestRepository.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/services/domain/request/RequestService.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // Performance settings
  testTimeout: 5000, // Fast feedback loop requirement
  maxWorkers: 1, // Isolated testing
  
  // Mock and cleanup settings
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  bail: false, // Continue testing even if some fail
  
  // Verbose output for debugging
  verbose: true,
  
  // TypeScript module resolution
  extensionsToTreatAsEsm: [],
  
  // Force exit to prevent hanging processes
  forceExit: true,
  
  // Detect open handles for clean shutdown
  detectOpenHandles: true
};