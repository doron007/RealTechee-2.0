/**
 * Simple Jest Configuration for Testing
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.ts'
  ],
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/out/'
  ],
  
  // Global test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: false,
  
  // Mock AWS and other external dependencies
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};