/**
 * Fail-Fast Validation Framework
 * 
 * Provides critical validation checks that must pass before proceeding
 * with the test suite. If any critical validation fails, the entire
 * test suite is aborted immediately.
 */
class FailFastValidator {
  constructor(reporter) {
    this.reporter = reporter;
    this.criticalErrors = [];
  }

  /**
   * Validate that the server is running and accessible
   */
  async validateServer(baseUrl) {
    try {
      this.reporter.logMessage('info', `Validating server at ${baseUrl}`);
      
      const response = await fetch(baseUrl);
      
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      this.reporter.logMessage('info', '✅ Server validation passed');
      return true;
      
    } catch (error) {
      const message = `❌ CRITICAL: Server validation failed - ${error.message}`;
      this.reporter.logMessage('error', message);
      this.criticalErrors.push(message);
      throw new Error(`Server not accessible: ${error.message}`);
    }
  }

  /**
   * Validate that authentication credentials work
   */
  async validateAuthentication(page, baseUrl, credentials) {
    try {
      this.reporter.logMessage('info', `Validating authentication for ${credentials.email}`);
      
      // Navigate to login page
      await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
      
      // Take screenshot before login
      await this.reporter.captureScreenshot(page, 'auth-validation-before', 'info', 'Login page before authentication');
      
      // Fill login form
      await page.fill('input[name="email"], input[type="email"]', credentials.email);
      await page.fill('input[name="password"], input[type="password"]', credentials.password);
      
      // Submit login
      await page.click('button[type="submit"], input[type="submit"]');
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      
      // Check if login was successful
      const currentUrl = page.url();
      
      if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
        throw new Error('Authentication failed - still on login page');
      }
      
      // Take screenshot after successful login
      await this.reporter.captureScreenshot(page, 'auth-validation-after', 'info', 'Page after successful authentication');
      
      this.reporter.logMessage('info', '✅ Authentication validation passed');
      return true;
      
    } catch (error) {
      const message = `❌ CRITICAL: Authentication validation failed - ${error.message}`;
      this.reporter.logMessage('error', message);
      this.criticalErrors.push(message);
      
      // Take screenshot of failed authentication
      await this.reporter.captureScreenshot(page, 'auth-validation-failed', 'errors', 'Authentication failure');
      
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Validate that the page loads correctly
   */
  async validatePageLoad(page, url, expectedTitle) {
    try {
      this.reporter.logMessage('info', `Validating page load for ${url}`);
      
      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      
      // Check for React errors
      const reactErrors = await page.evaluate(() => {
        const errors = [];
        
        // Check for unhandled promise rejections
        if (window.unhandledRejections) {
          errors.push(...window.unhandledRejections);
        }
        
        // Check for React error boundaries
        const errorBoundaries = document.querySelectorAll('[data-reactroot] *');
        errorBoundaries.forEach(el => {
          if (el.textContent && el.textContent.includes('Something went wrong')) {
            errors.push('React error boundary triggered');
          }
        });
        
        return errors;
      });
      
      if (reactErrors.length > 0) {
        throw new Error(`React errors detected: ${reactErrors.join(', ')}`);
      }
      
      // Check console errors
      const consoleErrors = await page.evaluate(() => {
        return window.console.errors || [];
      });
      
      if (consoleErrors.length > 0) {
        this.reporter.logMessage('warn', `Console errors detected: ${consoleErrors.join(', ')}`);
      }
      
      // Validate page title if provided
      if (expectedTitle) {
        const actualTitle = await page.title();
        if (!actualTitle.includes(expectedTitle)) {
          throw new Error(`Page title mismatch. Expected: ${expectedTitle}, Actual: ${actualTitle}`);
        }
      }
      
      // Take screenshot of loaded page
      await this.reporter.captureScreenshot(page, 'page-load-validation', 'info', `Page loaded successfully: ${url}`);
      
      this.reporter.logMessage('info', '✅ Page load validation passed');
      return true;
      
    } catch (error) {
      const message = `❌ CRITICAL: Page load validation failed - ${error.message}`;
      this.reporter.logMessage('error', message);
      this.criticalErrors.push(message);
      
      // Take screenshot of failed page load
      await this.reporter.captureScreenshot(page, 'page-load-failed', 'errors', `Page load failure: ${url}`);
      
      throw new Error(`Page load failed: ${error.message}`);
    }
  }

  /**
   * Validate that essential elements are present
   */
  async validateEssentialElements(page, expectedElements) {
    try {
      this.reporter.logMessage('info', 'Validating essential elements presence');
      
      const missingElements = [];
      
      for (const element of expectedElements) {
        try {
          await page.waitForSelector(element.selector, { timeout: 5000 });
          this.reporter.logMessage('info', `✅ Found essential element: ${element.name}`);
        } catch (error) {
          missingElements.push(element.name);
          this.reporter.logMessage('error', `❌ Missing essential element: ${element.name}`);
        }
      }
      
      if (missingElements.length > 0) {
        throw new Error(`Missing essential elements: ${missingElements.join(', ')}`);
      }
      
      this.reporter.logMessage('info', '✅ Essential elements validation passed');
      return true;
      
    } catch (error) {
      const message = `❌ CRITICAL: Essential elements validation failed - ${error.message}`;
      this.reporter.logMessage('error', message);
      this.criticalErrors.push(message);
      
      // Take screenshot of missing elements
      await this.reporter.captureScreenshot(page, 'essential-elements-failed', 'errors', 'Essential elements missing');
      
      throw new Error(`Essential elements validation failed: ${error.message}`);
    }
  }

  /**
   * Validate that data is loading correctly
   */
  async validateDataLoading(page, dataSelector = 'tr, .MuiCard-root, [data-testid*="card"]') {
    try {
      this.reporter.logMessage('info', 'Validating data loading');
      
      // Wait for data to appear
      await page.waitForSelector(dataSelector, { timeout: 10000 });
      
      // Count data elements
      const dataCount = await page.$$eval(dataSelector, elements => elements.length);
      
      if (dataCount === 0) {
        throw new Error('No data elements found');
      }
      
      this.reporter.logMessage('info', `✅ Data loading validation passed - ${dataCount} elements found`);
      return true;
      
    } catch (error) {
      const message = `❌ CRITICAL: Data loading validation failed - ${error.message}`;
      this.reporter.logMessage('error', message);
      this.criticalErrors.push(message);
      
      // Take screenshot of data loading failure
      await this.reporter.captureScreenshot(page, 'data-loading-failed', 'errors', 'Data loading failure');
      
      throw new Error(`Data loading validation failed: ${error.message}`);
    }
  }

  /**
   * Validate browser environment
   */
  async validateBrowserEnvironment(page) {
    try {
      this.reporter.logMessage('info', 'Validating browser environment');
      
      // Check if JavaScript is enabled
      const jsEnabled = await page.evaluate(() => {
        return typeof window !== 'undefined' && typeof document !== 'undefined';
      });
      
      if (!jsEnabled) {
        throw new Error('JavaScript is not enabled');
      }
      
      // Check viewport
      const viewport = await page.viewport();
      if (!viewport || viewport.width === 0 || viewport.height === 0) {
        throw new Error('Invalid viewport dimensions');
      }
      
      this.reporter.logMessage('info', `✅ Browser environment validation passed - ${viewport.width}x${viewport.height}`);
      return true;
      
    } catch (error) {
      const message = `❌ CRITICAL: Browser environment validation failed - ${error.message}`;
      this.reporter.logMessage('error', message);
      this.criticalErrors.push(message);
      
      throw new Error(`Browser environment validation failed: ${error.message}`);
    }
  }

  /**
   * Run all critical validations
   */
  async runAllValidations(page, baseUrl, credentials, pageConfig) {
    try {
      this.reporter.logMessage('info', '🔍 Running fail-fast validations');
      
      // 1. Validate server
      await this.validateServer(baseUrl);
      
      // 2. Validate browser environment
      await this.validateBrowserEnvironment(page);
      
      // 3. Validate authentication
      await this.validateAuthentication(page, baseUrl, credentials);
      
      // 4. Validate page load
      if (pageConfig) {
        await this.validatePageLoad(page, `${baseUrl}${pageConfig.path}`, pageConfig.expectedTitle);
        
        // 5. Validate essential elements
        const essentialElements = [
          { name: 'Main Content', selector: 'main, [role="main"], .MuiContainer-root' },
          { name: 'Navigation', selector: 'nav, [role="navigation"]' }
        ];
        
        if (pageConfig.expectedTitle) {
          essentialElements.push({ name: 'Page Title', selector: 'h1, .MuiTypography-h1' });
        }
        
        await this.validateEssentialElements(page, essentialElements);
        
        // 6. Validate data loading
        await this.validateDataLoading(page);
      }
      
      this.reporter.logMessage('info', '✅ All fail-fast validations passed');
      return true;
      
    } catch (error) {
      this.reporter.logMessage('error', `❌ CRITICAL VALIDATION FAILURE: ${error.message}`);
      this.reporter.logMessage('error', '🛑 TEST SUITE ABORTED DUE TO CRITICAL FAILURES');
      
      // Add critical failure to test results
      this.reporter.addTestResult({
        name: 'critical-validations',
        status: 'error',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        error: error.message,
        details: {
          criticalErrors: this.criticalErrors,
          abortReason: 'Critical validation failure'
        }
      });
      
      throw error;
    }
  }

  /**
   * Get all critical errors
   */
  getCriticalErrors() {
    return this.criticalErrors;
  }

  /**
   * Check if any critical errors occurred
   */
  hasCriticalErrors() {
    return this.criticalErrors.length > 0;
  }
}

module.exports = FailFastValidator;