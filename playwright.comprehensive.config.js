/**
 * 🎯 COMPREHENSIVE TESTING CONFIGURATION
 * 
 * Specialized Playwright configuration for 100% user story coverage testing
 * Addresses all discovered issues and provides robust, production-ready testing
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory for comprehensive testing
  testDir: './e2e/tests/comprehensive',
  
  // Run tests in parallel for efficiency
  fullyParallel: false, // Sequential for data dependency validation
  
  // Fail build on CI if you accidentally left test.only in source code
  forbidOnly: !!process.env.CI,
  
  // Retry tests on CI for stability
  retries: process.env.CI ? 2 : 1,
  
  // Limit concurrent workers for resource management
  workers: process.env.CI ? 1 : 1, // Sequential execution for comprehensive testing
  
  // Reporter configuration for comprehensive reporting
  reporter: [
    ['html', { 
      outputFolder: 'e2e/playwright-report-comprehensive',
      open: 'never' // Don't auto-open in CI
    }],
    ['json', { outputFile: 'e2e/playwright-report-comprehensive/results.json' }],
    ['junit', { outputFile: 'e2e/playwright-report-comprehensive/results.xml' }],
    // Custom console reporter for real-time feedback
    ['list']
  ],
  
  // Global test configuration
  use: {
    // Base URL for testing
    baseURL: 'http://localhost:3000',
    
    // Collect trace for debugging failures
    trace: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video for critical test failures
    video: 'retain-on-failure',
    
    // Global timeout settings
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Viewport for consistent testing
    viewport: { width: 1920, height: 1080 },
    
    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,
    
    // User agent for tracking
    userAgent: 'RealTechee-Comprehensive-E2E-Testing'
  },

  // Test timeout configuration
  timeout: 300000, // 5 minutes per test for comprehensive testing
  expect: {
    timeout: 15000 // Longer timeout for complex operations
  },

  // Global setup and teardown
  globalSetup: require.resolve('./e2e/tests/comprehensive/global-setup.js'),
  globalTeardown: require.resolve('./e2e/tests/comprehensive/global-teardown.js'),

  // Project configurations for different testing scenarios
  projects: [
    {
      name: 'comprehensive-setup',
      testMatch: /global\.setup\.js/,
      teardown: 'comprehensive-cleanup'
    },
    
    {
      name: 'comprehensive-cleanup',
      testMatch: /global\.cleanup\.js/
    },
    
    // Main comprehensive testing project
    {
      name: 'comprehensive-desktop',
      dependencies: ['comprehensive-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        // Use authentication state from setup
        storageState: 'e2e/playwright/.auth/comprehensive-user.json',
        // Disable web security for comprehensive testing
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        }
      },
      testMatch: /user-stories-complete-coverage\.spec\.js/
    },
    
    // Backend integration testing
    {
      name: 'comprehensive-api',
      dependencies: ['comprehensive-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/playwright/.auth/comprehensive-user.json'
      },
      testMatch: /backend-integration\.spec\.js/
    },
    
    // Edge cases and error scenarios
    {
      name: 'comprehensive-edge-cases',
      dependencies: ['comprehensive-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/playwright/.auth/comprehensive-user.json'
      },
      testMatch: /edge-cases\.spec\.js/
    },
    
    // Mobile testing for responsive validation
    {
      name: 'comprehensive-mobile',
      dependencies: ['comprehensive-setup'],
      use: { 
        ...devices['iPhone 13'],
        storageState: 'e2e/playwright/.auth/comprehensive-user.json'
      },
      testMatch: /mobile-responsiveness\.spec\.js/
    },
    
    // Performance testing
    {
      name: 'comprehensive-performance',
      dependencies: ['comprehensive-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/playwright/.auth/comprehensive-user.json'
      },
      testMatch: /performance-validation\.spec\.js/
    }
  ],

  // Web server configuration for local testing
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000 // 2 minutes to start
  }
});