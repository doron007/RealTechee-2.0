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
        elementWait: 15000,
        firstAccess: 120000,    // First access after build (Next.js compilation)
        subsequentAccess: 15000  // Cached/compiled access
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
        slowMo: 25, // Reduced from 100ms to 25ms for faster interactions
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security'
        ]
      },
      test: {
        waitBetweenTests: 1000, // Reduced from 2000ms to 1000ms
        screenshotDelay: 300,   // Reduced from 1000ms to 300ms
        responsiveDelay: 200,   // New: Specific delay for responsive changes
        pollInterval: 100,      // New: For status polling
        maxPollAttempts: 50,    // New: Maximum attempts for polling
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
    this.sessionReused = false;
    this.firstAccess = true; // Track if this is first access (slower compilation)
  }

  // Helper method for adaptive polling based on compilation state
  async waitForPageReady() {
    const isFirstAccess = this.firstAccess;
    const maxTime = isFirstAccess ? this.config.timeouts.firstAccess : this.config.timeouts.subsequentAccess;
    const pollInterval = this.config.test.pollInterval;
    const maxAttempts = Math.floor(maxTime / pollInterval);
    
    const startTime = Date.now();
    this.reporter.logMessage('info', `Waiting for page ready (${isFirstAccess ? 'first access - compilation' : 'subsequent access - cached'}) - max ${maxTime}ms`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const elapsed = Date.now() - startTime;
      
      // Check console for Next.js compilation status
      const compilationStatus = await this.page.evaluate(() => {
        try {
          // Check for compilation error indicators
          const bodyText = document.body ? document.body.textContent || '' : '';
          const hasCompilationError = bodyText.includes('Error:') || 
                                     bodyText.includes('Failed to compile') ||
                                     bodyText.includes('SyntaxError');
          
          // Check for loading/compilation states
          const isCompiling = bodyText.includes('Compiling') ||
                             bodyText.includes('Building') ||
                             !!document.querySelector('[class*="loading"], [class*="spinner"], .animate-spin');
          
          // Check if page has actual content
          const hasContent = document.querySelector('h1, table, [class*="bg-white"], main, [role="main"]');
          const hasRealContent = hasContent && hasContent.textContent && hasContent.textContent.trim().length > 10;
          
          return {
            hasCompilationError,
            isCompiling,
            hasRealContent: !!hasRealContent,
            documentReady: document.readyState === 'complete',
            bodyText: bodyText.substring(0, 200) // Sample for debugging
          };
        } catch (error) {
          return {
            hasCompilationError: false,
            isCompiling: false,
            hasRealContent: false,
            documentReady: false,
            bodyText: 'Error evaluating: ' + error.message
          };
        }
      });
      
      // Log progress for debugging
      if (attempt % 10 === 0 || compilationStatus.hasCompilationError) {
        this.reporter.logMessage('debug', 
          `Attempt ${attempt}/${maxAttempts} (${elapsed}ms): ` +
          `ready=${compilationStatus.hasRealContent}, ` +
          `compiling=${compilationStatus.isCompiling}, ` +
          `error=${compilationStatus.hasCompilationError}`
        );
      }
      
      // Check if compilation failed
      if (compilationStatus.hasCompilationError) {
        this.reporter.logMessage('error', `Compilation error detected: ${compilationStatus.bodyText}`);
        throw new Error('Next.js compilation failed');
      }
      
      // Check if page is ready
      if (compilationStatus.hasRealContent && 
          compilationStatus.documentReady && 
          !compilationStatus.isCompiling) {
        
        this.reporter.logMessage('info', `Page ready after ${elapsed}ms (${isFirstAccess ? 'compilation' : 'cached'} access)`);
        this.firstAccess = false; // Mark subsequent accesses as fast
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    const elapsed = Date.now() - startTime;
    this.reporter.logMessage('warning', `Page readiness timeout after ${elapsed}ms (${isFirstAccess ? 'first' : 'subsequent'} access)`);
    this.firstAccess = false; // Still mark as no longer first access
  }

  // Helper method for waiting for responsive changes
  async waitForResponsiveChanges() {
    const maxAttempts = 20; // Shorter timeout for responsive changes
    const pollInterval = this.config.test.pollInterval;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const isStable = await this.page.evaluate(() => {
        // Check if layout has stabilized
        const elements = document.querySelectorAll('table, [class*="bg-white"], [class*="MuiTable"]');
        return Array.from(elements).every(el => el.offsetWidth > 0 && el.offsetHeight > 0);
      });
      
      if (isStable) {
        this.reporter.logMessage('debug', `Responsive layout stable after ${attempt * pollInterval}ms`);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    // Fallback to minimal delay if polling doesn't work
    await new Promise(resolve => setTimeout(resolve, this.config.test.responsiveDelay));
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
        
        // Disable JavaScript-based animations
        if (typeof window !== 'undefined') {
          // Override setTimeout and setInterval for faster execution
          const originalSetTimeout = window.setTimeout;
          const originalSetInterval = window.setInterval;
          
          window.setTimeout = function(callback, delay) {
            return originalSetTimeout.call(this, callback, Math.min(delay, 1));
          };
          
          window.setInterval = function(callback, delay) {
            return originalSetInterval.call(this, callback, Math.min(delay, 1));
          };
          
          // Disable requestAnimationFrame delays
          const originalRequestAnimationFrame = window.requestAnimationFrame;
          window.requestAnimationFrame = function(callback) {
            return originalRequestAnimationFrame.call(this, callback);
          };
        }
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
      this.reporter.logMessage('info', `Starting authentication to ${targetUrl}`);
      
      // Navigate to target page (should redirect to login)
      // Use longer timeout for first access due to potential Next.js compilation
      const navTimeout = this.firstAccess ? this.config.timeouts.firstAccess : this.config.timeouts.navigation;
      await this.page.goto(targetUrl, { 
        waitUntil: 'networkidle0',
        timeout: navTimeout
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

      // Submit login with explicit button targeting
      const submitButton = await this.page.waitForSelector('button[type="submit"]');
      await Promise.all([
        this.page.waitForNavigation({ 
          waitUntil: 'networkidle0',
          timeout: this.config.timeouts.authentication 
        }),
        submitButton.click()
      ]);

      // Verify authentication with status polling
      const currentUrl = this.page.url();
      await this.page.waitForSelector('h1', { timeout: this.config.timeouts.elementWait });
      
      // Poll for page readiness instead of static delay
      await this.waitForPageReady();

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

      // Clear localStorage to ensure clean sidebar state and trigger resize events
      await this.page.evaluate(() => {
        localStorage.removeItem('admin-sidebar-collapsed');
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('orientationchange'));
      });
      
      // Wait for responsive changes with intelligent polling
      await this.waitForResponsiveChanges();

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

      // ROBUST UI BEHAVIOR ANALYSIS
      const uiAnalysis = await this.page.evaluate(() => {
        const sidebar = document.querySelector('[class*="sidebar"]') || 
                       document.querySelector('[class*="w-16"]') || 
                       document.querySelector('[class*="w-64"]');
        
        const header = document.querySelector('h1');
        const searchBox = document.querySelector('input[type="search"]');
        
        // Test for DATA PRESENCE (not just elements)
        const dataRows = document.querySelectorAll('tbody tr');
        const dataCards = document.querySelectorAll('.bg-white.border-b.border-gray-100');
        const materialTable = document.querySelector('[class*="MuiTable"]');
        
        // Test for INTERACTIVE ELEMENTS (Mobile vs Desktop)
        const actionButtons = document.querySelectorAll('button[title*="Edit"], button[title*="Delete"], button[title*="Open"], button[title*="View"]');
        const clickableElements = document.querySelectorAll('button, a, [role="button"]');
        
        // Mobile-specific elements (expandable cards, dropdowns, etc.)
        const expandableCards = document.querySelectorAll('[class*="cursor-pointer"]');
        const dropdownTriggers = document.querySelectorAll('[class*="MuiIconButton"]');
        
        // Test for LAYOUT PATTERNS
        const isTableLayout = !!(materialTable && dataRows.length > 0);
        const isCardLayout = !!(dataCards.length > 0 && !materialTable);
        
        // Test for RESPONSIVE ADAPTATIONS
        const viewToggle = document.querySelector('[class*="MuiIconButton"]');
        const densityToggle = document.querySelector('[title*="density"]');
        
        // Test for ACCESSIBILITY
        const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        // Test for VISUAL HIERARCHY
        const isElementVisible = (element) => {
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && 
                 rect.left >= 0 && rect.top >= 0 && 
                 rect.right <= window.innerWidth && rect.bottom <= window.innerHeight;
        };
        
        // Mobile-specific UI analysis
        const isMobileWidth = window.innerWidth < 768;
        const visibleActionButtons = Array.from(actionButtons).filter(btn => isElementVisible(btn));
        const mobileInteractionElements = isMobileWidth ? expandableCards.length + dropdownTriggers.length : 0;
        
        return {
          // Basic elements
          sidebarExists: !!sidebar,
          sidebarWidth: sidebar ? sidebar.offsetWidth : 0,
          headerExists: !!header,
          headerText: header ? header.textContent : '',
          headerVisible: isElementVisible(header),
          searchExists: !!searchBox,
          searchVisible: isElementVisible(searchBox),
          
          // Data presentation
          dataRowCount: dataRows.length,
          dataCardCount: dataCards.length,
          hasTable: isTableLayout,
          hasCards: isCardLayout,
          
          // Interaction elements (mobile-aware)
          actionButtonCount: actionButtons.length,
          visibleActionButtonCount: visibleActionButtons.length,
          clickableElementCount: clickableElements.length,
          expandableCardCount: expandableCards.length,
          mobileInteractionCount: mobileInteractionElements,
          
          // Responsive features
          hasViewToggle: !!viewToggle,
          hasDensityToggle: !!densityToggle,
          
          // Accessibility
          focusableElementCount: focusableElements.length,
          headingCount: headings.length,
          
          // Layout analysis
          layoutType: isTableLayout ? 'table' : isCardLayout ? 'cards' : 'unknown',
          isResponsive: true, // We'll verify this through other checks
          isMobileWidth: isMobileWidth,
          
          // Viewport info
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
          const result = await customTest(this.page, breakpoint, measurements, uiAnalysis);
          customResults.push(result);
        } catch (error) {
          customResults.push({
            name: customTest.name || 'Custom Test',
            passed: false,
            error: error.message
          });
        }
      }

      // ROBUST RESPONSIVE BEHAVIOR VALIDATION
      const issues = [];
      const passes = [];

      // Test 1: No horizontal scroll
      if (measurements.hasHorizontalScroll) {
        issues.push(`Horizontal scroll detected (${measurements.documentWidth}px > ${measurements.viewportWidth}px)`);
      } else {
        passes.push('No horizontal scroll');
      }

      // Test 2: Data is visible to users
      if (uiAnalysis.dataRowCount === 0 && uiAnalysis.dataCardCount === 0) {
        issues.push('No data visible to users');
      } else {
        passes.push(`Data visible: ${uiAnalysis.dataRowCount} rows, ${uiAnalysis.dataCardCount} cards`);
      }

      // Test 3: Responsive layout adaptation
      const isMobile = breakpoint.width < 768;
      const isTablet = breakpoint.width >= 768 && breakpoint.width < 1024;
      const isDesktop = breakpoint.width >= 1024;

      if (isMobile) {
        // Mobile should be touch-friendly
        if (uiAnalysis.hasCards || uiAnalysis.hasTable) {
          passes.push(`Mobile layout: ${uiAnalysis.layoutType}`);
        } else {
          issues.push('Mobile layout: No recognizable data layout');
        }
        
        // Sidebar should be compact
        if (uiAnalysis.sidebarWidth > 80) {
          issues.push(`Mobile sidebar too wide: ${uiAnalysis.sidebarWidth}px`);
        } else {
          passes.push(`Mobile sidebar: ${uiAnalysis.sidebarWidth}px`);
        }
      } else if (isTablet) {
        // Tablet should show table (some columns may be hidden - acceptable)
        if (uiAnalysis.hasTable) {
          passes.push('Tablet shows table layout');
        } else {
          issues.push('Tablet should show table layout');
        }
      } else if (isDesktop) {
        // Desktop should show full table
        if (uiAnalysis.hasTable) {
          passes.push('Desktop shows table layout');
        } else {
          issues.push('Desktop should show table layout');
        }
      }

      // Test 4: Interactive elements are accessible (mobile-aware)
      if (isMobile) {
        // Mobile: Action buttons may be hidden, but cards should be interactive
        if (uiAnalysis.dataCardCount > 0 && (uiAnalysis.expandableCardCount > 0 || uiAnalysis.mobileInteractionCount > 0)) {
          passes.push(`Mobile: ${uiAnalysis.dataCardCount} interactive cards (${uiAnalysis.mobileInteractionCount} interaction points)`);
        } else if (uiAnalysis.visibleActionButtonCount > 0) {
          passes.push(`Mobile: ${uiAnalysis.visibleActionButtonCount} visible action buttons`);
        } else if (uiAnalysis.actionButtonCount === 0) {
          issues.push('No action buttons found');
        } else {
          passes.push(`Mobile: ${uiAnalysis.actionButtonCount} action buttons (may be hidden in cards)`);
        }
      } else {
        // Desktop: Expect visible action buttons
        if (uiAnalysis.visibleActionButtonCount === 0) {
          issues.push('No visible action buttons found');
        } else {
          passes.push(`${uiAnalysis.visibleActionButtonCount} visible action buttons`);
        }
      }

      // Test 5: Basic accessibility
      if (uiAnalysis.focusableElementCount < 3) {
        issues.push('Insufficient focusable elements');
      } else {
        passes.push(`${uiAnalysis.focusableElementCount} focusable elements`);
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
          uiAnalysis,
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
        uiAnalysis,
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
      
      // Check if we can reuse existing session
      const canReuseSession = await this.tryReuseSession(targetUrl);
      if (!canReuseSession) {
        await this.authenticate(targetUrl);
      }

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
      // Don't cleanup if session reuse is enabled (for faster subsequent tests)
      if (!this.config.reuseSession) {
        await this.cleanup();
      }
    }
  }

  async tryReuseSession(targetUrl) {
    if (!this.config.reuseSession) return false;
    
    try {
      // For session reuse, this is likely fast (subsequent access)
      this.firstAccess = false;
      
      // Navigate to target URL to check if already authenticated
      await this.page.goto(targetUrl, { 
        waitUntil: 'networkidle0',
        timeout: this.config.timeouts.subsequentAccess
      });
      
      // Check if we're already on the admin page (not redirected to login)
      const currentUrl = this.page.url();
      const isAuthenticated = currentUrl.includes('/admin/') && !currentUrl.includes('/login');
      
      if (isAuthenticated) {
        // Verify page content loaded (fast access)
        await this.page.waitForSelector('h1', { timeout: 5000 });
        await this.waitForPageReady();
        
        this.isAuthenticated = true;
        this.sessionReused = true;
        this.reporter.logMessage('info', `Session reused successfully: ${currentUrl}`);
        return true;
      }
    } catch (error) {
      this.reporter.logMessage('debug', `Session reuse failed: ${error.message}`);
      // Reset to first access for full authentication
      this.firstAccess = true;
    }
    
    return false;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.reporter.logMessage('info', 'Browser closed');
    }
  }
}

module.exports = ResponsiveTestFramework;