/**
 * Comprehensive Jest Configuration for 100% Backend Coverage
 * 
 * Optimized for testing GraphQL isolation architecture backend components
 * with complete test coverage and performance monitoring.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/comprehensive/**/*.test.ts',
    '<rootDir>/src/__tests__/comprehensive/**/*.spec.ts'
  ],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/__tests__/(.*)$': '<rootDir>/src/__tests__/$1',
    '^@/repositories/(.*)$': '<rootDir>/repositories/$1',
    '^@/services/(.*)$': '<rootDir>/services/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup-comprehensive.ts'
  ],
  
  // Transform configuration
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        lib: ['es2020'],
        allowJs: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        forceConsistentCasingInFileNames: true,
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true
      },
      useESM: false,
      isolatedModules: true
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
    'repositories/**/*.ts',
    'services/business/**/*.ts',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/*.test.ts',
    '!**/examples/**',
    '!**/README*.ts',
    '!**/interfaces/**'
  ],
  
  coverageDirectory: '<rootDir>/coverage/comprehensive',
  
  coverageReporters: [
    'text',
    'text-summary', 
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Progressive coverage thresholds - start achievable, aim for 100%
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Performance settings
  testTimeout: 10000, // Allow more time for comprehensive tests
  maxWorkers: 1, // Isolated testing
  
  // Mock and cleanup settings
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Error handling
  errorOnDeprecated: false, // Allow deprecated methods during testing
  bail: false, // Continue testing even if some fail
  
  // Verbose output for debugging
  verbose: true,
  
  // Force exit to prevent hanging processes
  forceExit: true,
  
  // Detect open handles for clean shutdown
  detectOpenHandles: true,
  
  // Globals for test utilities
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};