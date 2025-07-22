// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Seamless Playwright Configuration - QA-Style Testing
 * 
 * Optimized for single Chromium instance with sequential flow
 * Tests build on prior steps like a real QA person would test
 */
module.exports = defineConfig({
  testDir: './e2e/tests',
  
  // Sequential execution - no parallel, build on prior steps
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced retries for faster feedback
  workers: 1, // Single worker for sequential flow
  
  // Reporting
  reporter: [
    ['html', { 
      outputFolder: 'e2e/playwright-report-seamless',
      open: 'never'
    }],
    ['line'],
  ],

  // Extended timeout for complex flows
  timeout: 120000, // 2 minutes per test
  
  // Global test settings - Desktop focused
  use: {
    baseURL: 'http://localhost:3000',
    
    // Full desktop experience - maximum available screen size
    headless: false,
    viewport: null, // Use full screen - let browser use maximum available resolution
    
    // Faster interactions for QA-style testing
    actionTimeout: 10000,
    navigationTimeout: 15000,
    
    // Capture failures only
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    ignoreHTTPSErrors: true,
  },

  // Single project for seamless flow
  projects: [
    {
      name: 'seamless-business-flow',
      testMatch: '**/seamless/*.spec.js',
      use: { 
        ...devices['Desktop Chrome'],
        // Shared state across all tests in the flow
        storageState: 'e2e/playwright/.auth/seamless-user.json'
      },
    }
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./e2e/tests/seamless/global-setup.js'),
  globalTeardown: require.resolve('./e2e/tests/seamless/global-teardown.js'),

  // Development server
  webServer: {
    command: 'npm run dev:primed', // Use primed version for faster startup
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
});

/**
 * Usage:
 * 
 * # Run seamless business flow tests
 * npx playwright test --config=playwright.seamless.config.js
 * 
 * # Run with UI for debugging
 * npx playwright test --config=playwright.seamless.config.js --ui
 * 
 * # Generate seamless report
 * npx playwright show-report e2e/playwright-report-seamless
 */