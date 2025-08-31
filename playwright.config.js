// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Production testing configuration
const isProductionTest = process.env.PLAYWRIGHT_PROD === 'true';
const baseURL = isProductionTest ? 'https://www.realtechee.com' : 'http://localhost:3000';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: 'line',
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: baseURL,
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Override viewport to use most common desktop resolution
        viewport: { width: 1920, height: 2500 },
      },
    },
  ],

  /* Run your local dev server before starting the tests (only for local testing) */
  webServer: isProductionTest ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Always reuse existing server since dev server runs on port 3000
    timeout: 120 * 1000, // 2 minutes
  },
});