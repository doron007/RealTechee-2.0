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
  testDir: './e2e/tests',
  
  // Global test configuration
  fullyParallel: process.env.CI ? true : false, // Parallel in CI, sequential locally
  forbidOnly: !!process.env.CI, // Prevent .only() in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: process.env.CI ? 2 : 1, // Optimized workers for CI stability
  
  // Reporting configuration
  reporter: [
    ['html', { 
      outputFolder: 'e2e/playwright-report',
      open: 'never' // Don't auto-open in CI
    }],
    ['json', { 
      outputFile: 'e2e/test-results/playwright-results.json' 
    }],
    ['line'], // Console output
    ['./e2e/tests/reporters/enhanced-reporter.js'] // Custom reporter for compatibility
  ],

  // Global test timeout - increased for CI stability
  timeout: process.env.CI ? 120000 : 60000, // 2 minutes in CI, 1 minute locally
  
  // Global test settings
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:3000',
    
    // Browser settings
    headless: process.env.CI ? true : false, // Headless in CI, visible locally
    viewport: { width: 1280, height: 1080 }, // Increased height for pagination visibility
    
    // Interaction settings - increased for CI reliability
    actionTimeout: process.env.CI ? 30000 : 15000, // 30s in CI, 15s locally
    navigationTimeout: process.env.CI ? 45000 : 20000, // 45s in CI, 20s locally
    
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
        storageState: 'e2e/playwright/.auth/user.json' // Reuse authenticated state
      },
    },
    
    // Isolated admin quotes testing
    {
      name: 'isolated-admin-quotes',
      testMatch: '**/admin/quotes.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/playwright/.auth/user.json'
      },
    },
    
    // Isolated admin requests testing
    {
      name: 'isolated-admin-requests',
      testMatch: '**/admin/requests.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/playwright/.auth/user.json'
      },
    },
    
    // Lead Lifecycle Management testing (User Story 07)
    {
      name: 'lead-lifecycle-management',
      testMatch: '**/admin/lead-lifecycle-management.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/playwright/.auth/user.json'
      },
      timeout: 120000, // Extended timeout for lifecycle operations
    },
    
    // Isolated admin dashboard testing
    {
      name: 'isolated-admin-dashboard',
      testMatch: '**/admin/dashboard.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/playwright/.auth/user.json'
      },
    },
    
    // Full admin suite (all admin pages)
    {
      name: 'full-admin-suite',
      testMatch: '**/admin/*.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/playwright/.auth/user.json'
      },
    },
    
    // Responsive testing across devices
    {
      name: 'responsive-mobile',
      testMatch: '**/responsive/*.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['iPhone 13'],
        storageState: 'e2e/playwright/.auth/user.json'
      },
    },
    
    {
      name: 'responsive-tablet',
      testMatch: '**/responsive/*.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['iPad Pro'],
        storageState: 'e2e/playwright/.auth/user.json'
      },
    },
    
    {
      name: 'responsive-desktop',
      testMatch: '**/responsive/*.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/playwright/.auth/user.json'
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
        storageState: 'e2e/playwright/.auth/user.json'
      },
    },
    
    // Cross-browser testing (optional)
    {
      name: 'cross-browser-firefox',
      testMatch: '**/admin/projects.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'e2e/playwright/.auth/user.json'
      },
    },
    
    {
      name: 'cross-browser-webkit',
      testMatch: '**/admin/projects.spec.js',
      dependencies: ['auth-setup'],
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'e2e/playwright/.auth/user.json'
      },
    },
  ],

  // Development server configuration with Turbopack optimization
  webServer: {
    command: 'npm run dev', // Using regular dev for webServer, priming handled separately
    port: 3000,
    reuseExistingServer: !process.env.CI, // Fresh server in CI, reuse locally
    timeout: process.env.CI ? 180000 : 120000, // 3 minutes in CI, 2 minutes locally
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