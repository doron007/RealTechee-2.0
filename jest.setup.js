/**
 * Jest Setup - Mock External Dependencies
 */

// Mock AWS Amplify
jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn().mockResolvedValue({
      data: {}
    })
  }))
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    query: {},
    pathname: '/',
    asPath: '/',
    route: '/'
  }))
}));

// Skip logger mock for now

// Mock console output in tests unless VERBOSE_TESTS is set
if (!process.env.VERBOSE_TESTS) {
  console.warn = jest.fn();
  console.error = jest.fn();
}

// Global test timeout
jest.setTimeout(30000);

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JEST_ENVIRONMENT = 'isolation';