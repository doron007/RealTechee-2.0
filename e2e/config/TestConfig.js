/**
 * Test Configuration
 * 
 * Centralized configuration for all test settings
 */

class TestConfig {
  static get DEFAULT_CONFIG() {
    return {
      // Base application settings
      baseUrl: 'http://localhost:3000',
      
      // Test credentials
      credentials: {
        email: 'info@realtechee.com',
        password: 'Sababa123!'
      },
      
      // Browser settings
      browser: {
        headless: false,
        slowMo: 0,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      
      // Timeout settings (milliseconds)
      timeouts: {
        navigation: 15000,
        element: 10000,
        test: 120000
      },
      
      // Responsive breakpoints
      breakpoints: [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1200, height: 800 },
        { name: 'large-desktop', width: 1920, height: 1080 }
      ],
      
      // Page definitions aligned with report structure
      pages: {
        projects: {
          name: 'Admin Projects',
          path: '/admin/projects',
          key: 'projects'
        },
        quotes: {
          name: 'Admin Quotes',
          path: '/admin/quotes',
          key: 'quotes'
        },
        requests: {
          name: 'Admin Requests',
          path: '/admin/requests',
          key: 'requests'
        },
        dashboard: {
          name: 'Admin Dashboard',
          path: '/admin/dashboard',
          key: 'dashboard'
        }
      },
      
      // Test execution settings
      execution: {
        screenshot: {
          fullPage: false,
          quality: 90
        },
        retries: 1,
        parallel: false
      },
      
      // Report settings
      reporting: {
        baseDir: 'test-results', // Reports saved at project root level
        generateHTML: true,
        generateJSON: true,
        generateSummary: true,
        screenshotOnFailure: true
      }
    };
  }

  static get TEST_PHASES() {
    return [
      {
        name: 'systemPriming',
        title: 'System Priming',
        description: 'Prepare system for testing',
        required: true
      },
      {
        name: 'authentication',
        title: 'Authentication & Login',
        description: 'Test user authentication',
        required: true
      },
      {
        name: 'pages',
        title: 'Admin Pages Testing',
        description: 'Test admin page functionality and responsiveness',
        required: false
      }
    ];
  }

  static get PAGE_TEST_CATEGORIES() {
    return [
      {
        name: 'functionality',
        title: 'Functionality',
        description: 'Page loading, data display, interactions'
      },
      {
        name: 'responsiveness',
        title: 'Responsiveness',
        description: 'Mobile, tablet, desktop layouts'
      }
    ];
  }

  static getConfig(overrides = {}) {
    return {
      ...this.DEFAULT_CONFIG,
      ...overrides
    };
  }

  static getPageConfig(pageKey) {
    return this.DEFAULT_CONFIG.pages[pageKey] || null;
  }

  static getAllPages() {
    return Object.values(this.DEFAULT_CONFIG.pages);
  }

  static getBreakpoints() {
    return this.DEFAULT_CONFIG.breakpoints;
  }

  static getCredentials() {
    return this.DEFAULT_CONFIG.credentials;
  }

  static getBrowserConfig() {
    return this.DEFAULT_CONFIG.browser;
  }

  static getTimeouts() {
    return this.DEFAULT_CONFIG.timeouts;
  }
}

module.exports = TestConfig;