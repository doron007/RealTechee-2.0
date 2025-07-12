// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration
 * 
 * Modern enterprise test configuration following industry standards.
 * Configuration-driven test execution with dependency management.
 */
module.exports = defineConfig({
  // Test directory structure
  testDir: './tests',
  
  // Global test configuration
  fullyParallel: false, // Sequential execution for admin tests that may have dependencies
  forbidOnly: !!process.env.CI, // Prevent .only() in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 1 : 1, // Single worker for stability with admin tests
  
  // Reporting configuration
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report',
      open: 'never' // Don't auto-open in CI
    }],
    ['json', { 
      outputFile: 'test-results/playwright-results.json' 
    }],
    ['line'], // Console output
    ['./tests/reporters/enhanced-reporter.js'] // Custom reporter for compatibility
  ],

  // Global test timeout
  timeout: 60000, // 60 seconds per test
  
  // Global test settings
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:3000',
    
    // Browser settings
    headless: false, // Visible browser for development
    viewport: { width: 1280, height: 1080 }, // Increased height for pagination visibility
    
    // Interaction settings
    actionTimeout: 15000, // 15 seconds for actions
    navigationTimeout: 20000, // 20 seconds for navigation
    
    // Screenshots and video
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Other settings
    ignoreHTTPSErrors: true,
  },

  // Test projects - Configuration-driven test execution
  projects: [
    // Authentication setup (dependency for other tests)
    {
      name: 'auth-setup',
      testMatch: '**/auth.setup.js',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] } // Start with clean state
      },
    },
    
    // Isolated admin projects testing
    {
      name: 'isolated-admin-projects',
      testMatch: '**/admin/projects.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json' // Reuse authenticated state
      },
    },
    
    // Isolated admin quotes testing
    {
      name: 'isolated-admin-quotes',
      testMatch: '**/admin/quotes.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
    },
    
    // Isolated admin requests testing
    {
      name: 'isolated-admin-requests',
      testMatch: '**/admin/requests.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
    },
    
    // Isolated admin dashboard testing
    {
      name: 'isolated-admin-dashboard',
      testMatch: '**/admin/dashboard.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
    },
    
    // Full admin suite (all admin pages)
    {
      name: 'full-admin-suite',
      testMatch: '**/admin/*.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
    },
    
    // Responsive testing across devices
    {
      name: 'responsive-mobile',
      testMatch: '**/responsive/*.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['iPhone 13'],
        storageState: 'playwright/.auth/user.json'
      },
    },
    
    {
      name: 'responsive-tablet',
      testMatch: '**/responsive/*.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['iPad Pro'],
        storageState: 'playwright/.auth/user.json'
      },
    },
    
    {
      name: 'responsive-desktop',
      testMatch: '**/responsive/*.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
    },
    
    // Public pages testing (no authentication required)
    {
      name: 'public-homepage',
      testMatch: '**/public/homepage.spec.js',
      use: { 
        ...devices['Desktop Chrome']
        // No storageState needed for public pages
      },
    },
    
    {
      name: 'public-contact',
      testMatch: '**/public/contact.spec.js',
      use: { 
        ...devices['Desktop Chrome']
      },
    },
    
    {
      name: 'public-products',
      testMatch: '**/public/products.spec.js',
      use: { 
        ...devices['Desktop Chrome']
      },
    },
    
    // Full public suite (all public pages)
    {
      name: 'full-public-suite',
      testMatch: '**/public/*.spec.js',
      use: { 
        ...devices['Desktop Chrome']
      },
    },
    
    // Authentication flow testing
    {
      name: 'auth-flows',
      testMatch: '**/auth/auth-flows.spec.js',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] } // Clean state for auth testing
      },
    },
    
    // Member portal testing (requires authentication)
    {
      name: 'member-portal',
      testMatch: '**/member/member-portal.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
    },
    
    // Cross-browser testing (optional)
    {
      name: 'cross-browser-firefox',
      testMatch: '**/admin/projects.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json'
      },
    },
    
    {
      name: 'cross-browser-webkit',
      testMatch: '**/admin/projects.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json'
      },
    },
  ],

  // Development server configuration
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true, // Don't restart if already running
    timeout: 120000, // 2 minutes to start
  },
});

/**
 * Usage Examples:
 * 
 * # Run isolated admin projects tests
 * npx playwright test --project=isolated-admin-projects
 * 
 * # Run full admin suite
 * npx playwright test --project=full-admin-suite
 * 
 * # Run responsive tests
 * npx playwright test --project=responsive-mobile,responsive-tablet,responsive-desktop
 * 
 * # Run all tests
 * npx playwright test
 * 
 * # Run with UI mode for debugging
 * npx playwright test --ui
 * 
 * # Generate report
 * npx playwright show-report
 */