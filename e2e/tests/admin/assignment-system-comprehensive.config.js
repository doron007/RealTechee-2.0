// Assignment System Comprehensive Test Configuration
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e/tests/admin',
  testMatch: 'assignment-system-comprehensive.spec.js',
  
  // Test execution settings
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 15000 // 15 seconds for assertions
  },
  
  // Retries and parallelization
  retries: 2, // Retry failed tests
  workers: 1, // Run tests sequentially to avoid conflicts
  
  // Reporter settings
  reporter: [
    ['html', { outputFolder: 'e2e/playwright-report' }],
    ['json', { outputFile: 'e2e/test-results/assignment-results.json' }],
    ['line']
  ],
  
  // Global test settings
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Browser settings
    headless: false, // Run in headed mode for debugging
    viewport: { width: 1280, height: 720 },
    
    // Network settings
    navigationTimeout: 30000,
    actionTimeout: 15000
  },
  
  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { 
        ...require('@playwright/test').devices['Desktop Chrome'],
        // Use authenticated user session
        storageState: 'playwright/.auth/user.json'
      }
    }
  ],
  
  // Development server (if needed)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});