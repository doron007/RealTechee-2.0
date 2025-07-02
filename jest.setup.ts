// jest.setup.ts
import '@testing-library/jest-dom';

// Mock the Node.js process object
process.cwd = () => '/Users/doron/Projects/RealTechee 2.0';

// Ensure required global functions and objects are available
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/admin',
    asPath: '/admin',
    query: {},
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const React = require('react');
    return React.createElement('img', { ...props, alt: props.alt });
  },
}));

// Mock AWS Amplify
jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: () => ({
    user: {
      signInDetails: { loginId: 'test@realtechee.com' },
      attributes: { 'custom:role': 'admin' }
    },
    signOut: jest.fn()
  }),
}));

jest.mock('aws-amplify/auth', () => ({
  fetchUserAttributes: jest.fn().mockResolvedValue({
    email: 'test@realtechee.com',
    'custom:role': 'admin'
  }),
}));

// Note: Specific mocks will be handled in individual test files
// Global mocks that are safe to apply globally

// Global test timeout
jest.setTimeout(10000);
