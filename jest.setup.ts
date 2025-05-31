// jest.setup.ts
import '@testing-library/jest-dom';

// Mock the Node.js process object
process.cwd = () => '/Users/doron/Projects/RealTechee 2.0';

// Ensure required global functions and objects are available
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
