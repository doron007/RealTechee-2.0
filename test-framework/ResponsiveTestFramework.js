const puppeteer = require('puppeteer');
const TestReporter = require('./TestReporter');

class ResponsiveTestFramework {
  constructor(testName, config = {}) {
    this.testName = testName;
    this.config = {
      // Default configuration
      baseUrl: 'http://localhost:3000',
      credentials: {
        email: 'info@realtechee.com',
        password: 'Sababa123!'
      },
      timeouts: {
        navigation: 45000,
        authentication: 30000,
        pageLoad: 60000,
        elementWait: 15000
      },
      breakpoints: [
        { width: 320, height: 568, name: 'mobile-small', description: 'iPhone SE' },
        { width: 375, height: 667, name: 'mobile-medium', description: 'iPhone 8' },
        { width: 414, height: 896, name: 'mobile-large', description: 'iPhone 11 Pro Max' },
        { width: 768, height: 1024, name: 'tablet', description: 'iPad' },
        { width: 1024, height: 1366, name: 'desktop-small', description: 'iPad Pro Landscape' },
        { width: 1440, height: 900, name: 'desktop-medium', description: 'MacBook Pro' },
        { width: 1920, height: 1080, name: 'desktop-large', description: 'Full HD' }
      ],
      puppeteer: {
        headless: false,
        slowMo: 100,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security'
        ]
      },
      test: {
        waitBetweenTests: 2000,
        screenshotDelay: 1000,
        captureFailureScreenshots: true,
        captureSuccessScreenshots: true
      },
      ...config
    };

    this.reporter = new TestReporter(testName, {
      metadata: {
        url: this.config.baseUrl,
        userAgent: 'Puppeteer Test Framework',
        breakpointsCount: this.config.breakpoints.length
      }
    });

    this.browser = null;
    this.page = null;
    this.isAuthenticated = false;
  }

  async setup() {
    this.reporter.logMessage('info', 'Setting up test framework...');
    
    try {
      this.browser = await puppeteer.launch(this.config.puppeteer);
      this.page = await this.browser.newPage();
      
      // Disable animations and transitions for faster, more reliable testing
      await this.page.evaluateOnNewDocument(() => {
        // Disable CSS animations and transitions
        const style = document.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            scroll-behavior: auto !important;
          }
        `;
        document.head.appendChild(style);
      });
      
      // Set timeouts
      this.page.setDefaultTimeout(this.config.timeouts.pageLoad);
      this.page.setDefaultNavigationTimeout(this.config.timeouts.navigation);
      
      // Enable request interception for debugging
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        if (req.url().includes('/_next/static/') || req.url().includes('/favicon.ico')) {
          req.continue();
        } else {
          this.reporter.logMessage('debug', `Loading: ${req.url()}`);
          req.continue();
        }
      });

      // Listen for console errors
      this.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          this.reporter.logMessage('error', `Console Error: ${msg.text()}`);
        }
      });

      this.reporter.logMessage('info', 'Browser setup complete');
      return true;
    } catch (error) {
      this.reporter.logMessage('error', `Setup failed: ${error.message}`);
      throw error;
    }
  }

  async authenticate(targetUrl) {
    const testName = 'Authentication';
    const testStart = new Date().toISOString();
    
    try {
      // Validate URL parameter
      if (!targetUrl || typeof targetUrl !== 'string') {
        throw new Error(`Invalid targetUrl parameter: ${targetUrl}. Expected a valid URL string.`);
      }
      
      // Basic URL format validation
      try {
        new URL(targetUrl);
      } catch (urlError) {
        throw new Error(`Invalid URL format: ${targetUrl}. ${urlError.message}`);
      }
      
      this.reporter.logMessage('info', `Starting authentication to ${targetUrl}`);
      
      // Navigate to target page (should redirect to login)
      await this.page.goto(targetUrl, { 
        waitUntil: 'networkidle0',
        timeout: this.config.timeouts.navigation 
      });

      // Wait for login form
      await this.page.waitForSelector('input[type="email"]', { 
        timeout: this.config.timeouts.authentication 
      });

      // Fill credentials instantly without typing simulation
      await this.page.evaluate((credentials) => {
        const emailInput = document.querySelector('input[type="email"]');
        const passwordInput = document.querySelector('input[type="password"]');
        
        if (emailInput) {
          emailInput.value = credentials.email;
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (passwordInput) {
          passwordInput.value = credentials.password;
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, this.config.credentials);

      // Submit login
      await Promise.all([
        this.page.waitForNavigation({ 
          waitUntil: 'networkidle0',
          timeout: this.config.timeouts.authentication 
        }),
        this.page.click('button[type="submit"]')
      ]);

      // Verify authentication
      const currentUrl = this.page.url();
      await this.page.waitForSelector('h1', { timeout: this.config.timeouts.elementWait });
      await new Promise(resolve => setTimeout(resolve, 3000));

      this.isAuthenticated = true;
      
      // Capture success screenshot
      const screenshot = await this.reporter.captureScreenshot(
        this.page, 
        testName, 
        'passed', 
        `Successfully authenticated to ${currentUrl}`
      );

      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: {
          targetUrl,
          finalUrl: currentUrl,
          credentials: this.config.credentials.email
        },
        screenshots: screenshot ? [screenshot] : []
      });

      this.reporter.logMessage('info', `Authentication successful: ${currentUrl}`);
      return true;

    } catch (error) {
      // Capture failure screenshot
      const screenshot = await this.reporter.captureScreenshot(
        this.page, 
        testName, 
        'failed', 
        `Authentication failed: ${error.message}`
      );

      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message,
        screenshots: screenshot ? [screenshot] : []
      });

      this.reporter.logMessage('error', `Authentication failed: ${error.message}`);
      throw error;
    }
  }

  async testBreakpoint(breakpoint, customTests = []) {
    const testName = `Responsive-${breakpoint.name}`;
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Testing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height}) - ${breakpoint.description}`);
      
      // Set viewport
      await this.page.setViewport({
        width: breakpoint.width,
        height: breakpoint.height,
        deviceScaleFactor: 1
      });

      // Wait for responsive changes
      await new Promise(resolve => setTimeout(resolve, this.config.test.screenshotDelay));
      
      // Clear localStorage to ensure clean sidebar state and trigger resize events
      await this.page.evaluate(() => {
        localStorage.removeItem('admin-sidebar-collapsed');
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('orientationchange'));
      });
      
      // Additional wait for component updates
      await new Promise(resolve => setTimeout(resolve, 500));

      // Standard responsive measurements
      const measurements = await this.page.evaluate(() => {
        return {
          documentWidth: document.body.scrollWidth,
          documentHeight: document.body.scrollHeight,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
          hasVerticalScroll: document.body.scrollHeight > window.innerHeight
        };
      });

      // Admin-specific element checks with visibility validation
      const adminElements = await this.page.evaluate(() => {
        const sidebar = document.querySelector('[class*="sidebar"]') || 
                       document.querySelector('[class*="w-16"]') || 
                       document.querySelector('[class*="w-64"]');
        
        const header = document.querySelector('h1');
        const searchBox = document.querySelector('input[type="search"]');
        const table = document.querySelector('table');
        const cards = document.querySelectorAll('[class*="card"]');
        
        // Check if elements are actually visible within viewport
        const isElementVisible = (element) => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
          };
          
          return rect.left >= 0 && 
                 rect.top >= 0 && 
                 rect.right <= viewport.width && 
                 rect.bottom <= viewport.height &&
                 rect.width > 0 && 
                 rect.height > 0;
        };
        
        const isElementPartiallyVisible = (element) => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
          };
          
          return rect.left < viewport.width && 
                 rect.right > 0 && 
                 rect.top < viewport.height && 
                 rect.bottom > 0 &&
                 rect.width > 0 && 
                 rect.height > 0;
        };
        
        // Check header visibility
        const headerRect = header ? header.getBoundingClientRect() : null;
        const headerFullyVisible = isElementVisible(header);
        const headerPartiallyVisible = isElementPartiallyVisible(header);
        
        // Check for "View Site" button and user info visibility
        const viewSiteButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Site') || btn.textContent.includes('View') || 
          btn.getAttribute('title')?.includes('View') || btn.getAttribute('title')?.includes('Site')
        );
        const userAvatar = document.querySelector('[class*="rounded-full"]');
        
        const viewSiteVisible = isElementVisible(viewSiteButton);
        const userAvatarVisible = isElementVisible(userAvatar);
        
        // Check table column visibility
        const tableHeaders = Array.from(document.querySelectorAll('th'));
        const visibleHeaders = tableHeaders.filter(th => isElementVisible(th));
        const partiallyVisibleHeaders = tableHeaders.filter(th => isElementPartiallyVisible(th));
        
        // Check for action buttons (edit, delete, etc.)
        const actionButtons = Array.from(document.querySelectorAll('button[title*="Edit"], button[title*="Delete"], button[title*="Open"]'));
        const visibleActionButtons = actionButtons.filter(btn => isElementVisible(btn));
        
        // Check search box visibility
        const searchVisible = isElementVisible(searchBox);
        
        return {
          sidebarExists: !!sidebar,
          sidebarWidth: sidebar ? sidebar.offsetWidth : 0,
          headerExists: !!header,
          headerText: header ? header.textContent : '',
          headerFullyVisible,
          headerPartiallyVisible,
          headerRect: headerRect ? {
            left: headerRect.left,
            right: headerRect.right,
            width: headerRect.width,
            withinViewport: headerRect.right <= window.innerWidth
          } : null,
          searchExists: !!searchBox,
          searchVisible,
          tableExists: !!table,
          cardCount: cards.length,
          isTableVisible: table ? table.offsetHeight > 0 : false,
          tableHeaders: {
            total: tableHeaders.length,
            fullyVisible: visibleHeaders.length,
            partiallyVisible: partiallyVisibleHeaders.length,
            hiddenCount: tableHeaders.length - partiallyVisibleHeaders.length
          },
          actionButtons: {
            total: actionButtons.length,
            visible: visibleActionButtons.length,
            hidden: actionButtons.length - visibleActionButtons.length
          },
          headerElements: {
            viewSiteVisible,
            userAvatarVisible
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        };
      });

      // Run custom tests if provided
      const customResults = [];
      for (const customTest of customTests) {
        try {
          const result = await customTest(this.page, breakpoint, measurements, adminElements);
          customResults.push(result);
        } catch (error) {
          customResults.push({
            name: customTest.name || 'Custom Test',
            passed: false,
            error: error.message
          });
        }
      }

      // Analyze results
      const issues = [];
      const passes = [];

      // Standard checks
      if (measurements.hasHorizontalScroll) {
        issues.push(`Horizontal scroll detected (${measurements.documentWidth}px > ${measurements.viewportWidth}px)`);
      } else {
        passes.push('No horizontal scroll');
      }

      // Responsive behavior checks
      const isMobile = breakpoint.width < 768;
      const isTablet = breakpoint.width >= 768 && breakpoint.width < 1024;
      const isDesktop = breakpoint.width >= 1024;

      if (isMobile || isTablet) {
        if (adminElements.sidebarWidth > 80) {
          issues.push(`Sidebar too wide for mobile/tablet: ${adminElements.sidebarWidth}px (expected ~64px)`);
        } else if (adminElements.sidebarExists) {
          passes.push(`Sidebar properly collapsed: ${adminElements.sidebarWidth}px`);
        }
      }

      if (isDesktop && adminElements.sidebarExists) {
        passes.push(`Desktop sidebar: ${adminElements.sidebarWidth}px`);
      }

      if (!adminElements.headerExists) {
        issues.push('Header not found');
      } else {
        passes.push(`Header present: "${adminElements.headerText}"`);
      }

      // Add custom test results
      customResults.forEach(result => {
        if (result.passed) {
          passes.push(result.message || result.name);
        } else {
          issues.push(result.error || result.message || `${result.name} failed`);
        }
      });

      // Capture screenshot
      const screenshotStatus = issues.length > 0 ? 'failed' : 'passed';
      const screenshot = await this.reporter.captureScreenshot(
        this.page,
        testName,
        screenshotStatus,
        `${breakpoint.description} - ${issues.length === 0 ? 'All checks passed' : issues.join(', ')}`
      );

      // Determine test status
      const testStatus = issues.length > 0 ? 'failed' : 'passed';

      this.reporter.addTestResult({
        name: testName,
        status: testStatus,
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: {
          breakpoint: breakpoint.name,
          viewport: `${breakpoint.width}x${breakpoint.height}`,
          measurements,
          adminElements,
          issues,
          passes,
          customResults
        },
        screenshots: screenshot ? [screenshot] : [],
        error: issues.length > 0 ? issues.join('; ') : null
      });

      return {
        passed: issues.length === 0,
        issues,
        passes,
        measurements,
        adminElements,
        customResults
      };

    } catch (error) {
      // Capture error screenshot
      const screenshot = await this.reporter.captureScreenshot(
        this.page,
        testName,
        'error',
        `Test error: ${error.message}`
      );

      this.reporter.addTestResult({
        name: testName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message,
        screenshots: screenshot ? [screenshot] : []
      });

      this.reporter.logMessage('error', `Test failed for ${breakpoint.name}: ${error.message}`);
      throw error;
    }
  }

  async runFullSuite(targetUrl, customTests = []) {
    try {
      this.reporter.startTest(this.testName);
      
      await this.setup();
      await this.authenticate(targetUrl);

      // Test all breakpoints
      for (const breakpoint of this.config.breakpoints) {
        await this.testBreakpoint(breakpoint, customTests);
        await new Promise(resolve => setTimeout(resolve, this.config.test.waitBetweenTests));
      }

      const finalReport = this.reporter.finalize();
      
      this.reporter.logMessage('info', 'Test suite completed successfully');
      return finalReport;

    } catch (error) {
      this.reporter.logMessage('error', `Test suite failed: ${error.message}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.reporter.logMessage('info', 'Browser closed');
    }
  }
}

module.exports = ResponsiveTestFramework;