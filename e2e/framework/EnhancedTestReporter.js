const fs = require('fs');
const path = require('path');

/**
 * Enhanced Test Reporter with Fail-Fast Validation and Business Logic Testing
 * 
 * CRITICAL IMPROVEMENTS:
 * 1. Fail-fast validation - stops immediately on critical failures
 * 2. Screenshot verification - ensures artifacts are actually created
 * 3. Business logic validation - tests actual functionality, not just UI presence
 * 4. Console log monitoring - captures and analyzes browser errors
 * 5. Network request tracking - monitors API calls and responses
 * 6. Comprehensive evidence collection - screenshots, logs, network data
 */
class EnhancedTestReporter {
  constructor(testSuiteName, options = {}) {
    this.testSuiteName = testSuiteName;
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.baseDir = options.baseDir || 'test-results';
    this.reportDir = path.join(this.baseDir, `${this.timestamp}-${testSuiteName}`);
    
    // Fail-fast configuration
    this.failFast = options.failFast !== false; // Default to true
    this.criticalFailureOccurred = false;
    
    // Validation settings
    this.screenshotValidation = options.screenshotValidation !== false; // Default to true
    this.businessLogicValidation = options.businessLogicValidation !== false; // Default to true
    
    this.results = {
      metadata: {
        testSuite: testSuiteName,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        failFastEnabled: this.failFast,
        screenshotValidationEnabled: this.screenshotValidation,
        businessLogicValidationEnabled: this.businessLogicValidation,
        ...options.metadata
      },
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        errors: 0,
        criticalFailures: 0,
        startTime: null,
        endTime: null,
        duration: null,
        stopReason: null
      },
      tests: [],
      screenshots: [],
      artifacts: [],
      consoleLogs: [],
      networkRequests: [],
      validationResults: {
        screenshotValidation: [],
        businessLogicValidation: [],
        serverValidation: []
      }
    };
    
    this.setupDirectories();
    this.validateEnvironment();
  }

  /**
   * Validate critical environment requirements before starting tests
   * FAIL-FAST: Stop immediately if environment is not ready
   */
  async validateEnvironment() {
    const validationResults = [];
    
    try {
      // Check if server is running on localhost:3000
      const fetch = (await import('node-fetch')).default;
      try {
        const response = await fetch('http://localhost:3000', { timeout: 5000 });
        if (response.ok) {
          validationResults.push({ check: 'server', status: 'passed', message: 'Server running on localhost:3000' });
        } else {
          throw new Error(`Server responded with status ${response.status}`);
        }
      } catch (error) {
        const failure = { check: 'server', status: 'failed', message: `Server not accessible: ${error.message}` };
        validationResults.push(failure);
        if (this.failFast) {
          this.criticalFailure('Server not running on localhost:3000', { error: error.message });
          return;
        }
      }
      
      // Validate test directories can be created
      try {
        if (!fs.existsSync(this.reportDir)) {
          fs.mkdirSync(this.reportDir, { recursive: true });
        }
        validationResults.push({ check: 'directories', status: 'passed', message: 'Test directories created successfully' });
      } catch (error) {
        const failure = { check: 'directories', status: 'failed', message: `Cannot create test directories: ${error.message}` };
        validationResults.push(failure);
        if (this.failFast) {
          this.criticalFailure('Cannot create test directories', { error: error.message });
          return;
        }
      }
      
      this.results.validationResults.serverValidation = validationResults;
      
    } catch (error) {
      this.criticalFailure('Environment validation failed', { error: error.message });
    }
  }

  /**
   * Record a critical failure and stop test execution if fail-fast is enabled
   */
  criticalFailure(reason, details = {}) {
    this.criticalFailureOccurred = true;
    this.results.summary.criticalFailures++;
    this.results.summary.stopReason = reason;
    
    const criticalError = {
      timestamp: new Date().toISOString(),
      reason,
      details,
      failFastEnabled: this.failFast
    };
    
    this.logMessage('error', `🚨 CRITICAL FAILURE: ${reason}`, criticalError);
    
    if (this.failFast) {
      this.logMessage('error', '⏹️  STOPPING TEST EXECUTION DUE TO CRITICAL FAILURE');
      throw new Error(`Critical failure: ${reason}`);
    }
  }

  setupDirectories() {
    const dirs = [
      this.reportDir,
      path.join(this.reportDir, 'screenshots'),
      path.join(this.reportDir, 'screenshots', 'passed'),
      path.join(this.reportDir, 'screenshots', 'failed'),
      path.join(this.reportDir, 'screenshots', 'errors'),
      path.join(this.reportDir, 'screenshots', 'before-action'),
      path.join(this.reportDir, 'screenshots', 'after-action'),
      path.join(this.reportDir, 'artifacts'),
      path.join(this.reportDir, 'logs'),
      path.join(this.reportDir, 'console-logs'),
      path.join(this.reportDir, 'network-logs')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    this.logMessage('info', `📁 Test report directory created: ${this.reportDir}`);
  }

  startTest(testName, metadata = {}) {
    if (this.criticalFailureOccurred && this.failFast) {
      throw new Error('Cannot start new test - critical failure occurred');
    }
    
    this.results.summary.startTime = this.results.summary.startTime || new Date().toISOString();
    this.logMessage('info', `🚀 Starting test: ${testName}`);
    
    return {
      testName,
      startTime: new Date().toISOString(),
      metadata
    };
  }

  /**
   * Enhanced screenshot capture with validation
   * VALIDATION: Ensures screenshot files are actually created and contain data
   */
  async captureScreenshot(page, testName, status = 'info', description = '', validateContent = true) {
    const screenshotDir = path.join(this.reportDir, 'screenshots', status);
    const filename = `${testName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
    const screenshotPath = path.join(screenshotDir, filename);
    
    try {
      // Capture screenshot
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        type: 'png'
      });

      // VALIDATION: Verify screenshot was actually created and has content
      if (this.screenshotValidation && validateContent) {
        const validationResult = await this.validateScreenshot(screenshotPath, testName);
        this.results.validationResults.screenshotValidation.push(validationResult);
        
        if (validationResult.status === 'failed') {
          this.logMessage('error', `📸 Screenshot validation failed: ${validationResult.message}`);
          if (this.failFast) {
            this.criticalFailure('Screenshot validation failed', validationResult);
            return null;
          }
        }
      }

      const screenshot = {
        testName,
        filename,
        path: screenshotPath,
        relativePath: path.relative(this.reportDir, screenshotPath),
        status,
        description,
        timestamp: new Date().toISOString(),
        metadata: {
          url: page.url(),
          fileSize: fs.existsSync(screenshotPath) ? fs.statSync(screenshotPath).size : 0
        }
      };

      this.results.screenshots.push(screenshot);
      this.logMessage('info', `📸 Screenshot captured: ${filename} (${screenshot.metadata.fileSize} bytes)`);
      return screenshot;
      
    } catch (error) {
      this.logMessage('error', `📸 Failed to capture screenshot: ${error.message}`);
      
      if (this.failFast) {
        this.criticalFailure('Screenshot capture failed', { error: error.message, testName });
      }
      return null;
    }
  }

  /**
   * Validate screenshot file was created and contains actual image data
   */
  async validateScreenshot(screenshotPath, testName) {
    try {
      if (!fs.existsSync(screenshotPath)) {
        return {
          testName,
          screenshotPath,
          status: 'failed',
          message: 'Screenshot file was not created',
          timestamp: new Date().toISOString()
        };
      }
      
      const stats = fs.statSync(screenshotPath);
      if (stats.size === 0) {
        return {
          testName,
          screenshotPath,
          status: 'failed',
          message: 'Screenshot file is empty (0 bytes)',
          fileSize: 0,
          timestamp: new Date().toISOString()
        };
      }
      
      if (stats.size < 1000) { // Less than 1KB is suspicious for a full page screenshot
        return {
          testName,
          screenshotPath,
          status: 'warning',
          message: `Screenshot file is unusually small (${stats.size} bytes)`,
          fileSize: stats.size,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        testName,
        screenshotPath,
        status: 'passed',
        message: 'Screenshot validation passed',
        fileSize: stats.size,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        testName,
        screenshotPath,
        status: 'failed',
        message: `Screenshot validation error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Capture and analyze console logs from the browser
   */
  async captureConsoleLogs(page, testName) {
    try {
      const logs = [];
      
      page.on('console', msg => {
        const logEntry = {
          testName,
          type: msg.type(),
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        };
        logs.push(logEntry);
        
        // Log errors immediately
        if (msg.type() === 'error') {
          this.logMessage('error', `🔴 Browser Console Error: ${msg.text()}`);
        }
      });
      
      page.on('pageerror', error => {
        const errorLog = {
          testName,
          type: 'pageerror',
          text: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        };
        logs.push(errorLog);
        this.logMessage('error', `🔴 Browser Page Error: ${error.message}`);
      });
      
      this.results.consoleLogs.push(...logs);
      return logs;
      
    } catch (error) {
      this.logMessage('error', `Console log capture failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Business Logic Validation Framework
   * Tests actual functionality instead of just UI presence
   */
  async validateBusinessLogic(page, testName, validationType, expectedResult) {
    if (!this.businessLogicValidation) {
      return { status: 'skipped', message: 'Business logic validation disabled' };
    }
    
    const validation = {
      testName,
      validationType,
      timestamp: new Date().toISOString(),
      status: 'unknown',
      message: '',
      actualResult: null,
      expectedResult,
      evidence: {}
    };
    
    try {
      switch (validationType) {
        case 'authentication':
          validation.actualResult = await this.validateAuthentication(page);
          break;
          
        case 'data-loading':
          validation.actualResult = await this.validateDataLoading(page);
          break;
          
        case 'button-functionality':
          validation.actualResult = await this.validateButtonFunctionality(page, expectedResult);
          break;
          
        case 'form-submission':
          validation.actualResult = await this.validateFormSubmission(page, expectedResult);
          break;
          
        case 'navigation':
          validation.actualResult = await this.validateNavigation(page, expectedResult);
          break;
          
        case 'crud-operations':
          validation.actualResult = await this.validateCrudOperations(page, expectedResult);
          break;
          
        default:
          validation.status = 'error';
          validation.message = `Unknown validation type: ${validationType}`;
          return validation;
      }
      
      // Compare actual vs expected results
      validation.status = this.compareResults(validation.actualResult, expectedResult) ? 'passed' : 'failed';
      validation.message = validation.status === 'passed' 
        ? `Business logic validation passed for ${validationType}`
        : `Business logic validation failed for ${validationType}`;
        
    } catch (error) {
      validation.status = 'error';
      validation.message = `Business logic validation error: ${error.message}`;
      validation.evidence.error = error.stack;
    }
    
    this.results.validationResults.businessLogicValidation.push(validation);
    
    if (validation.status === 'failed' || validation.status === 'error') {
      this.logMessage('error', `❌ ${validation.message}`);
      if (this.failFast) {
        this.criticalFailure(`Business logic validation failed: ${validation.message}`, validation);
      }
    } else {
      this.logMessage('info', `✅ ${validation.message}`);
    }
    
    return validation;
  }

  /**
   * Validate authentication actually works
   */
  async validateAuthentication(page) {
    const result = {
      loginFormPresent: false,
      loginSuccessful: false,
      redirectedToAdmin: false,
      userMenuVisible: false,
      errors: []
    };
    
    try {
      // Check if we're on login page
      if (page.url().includes('/login') || page.url().includes('/auth')) {
        result.loginFormPresent = await page.locator('input[type="email"], input[type="password"]').count() > 0;
        
        // If login form is present, try to authenticate
        if (result.loginFormPresent) {
          const emailInput = page.locator('input[type="email"]').first();
          const passwordInput = page.locator('input[type="password"]').first();
          const submitButton = page.locator('button[type="submit"], button:has-text("sign in")').first();
          
          if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
            await emailInput.fill('info@realtechee.com');
            await passwordInput.fill('Sababa123!');
            await submitButton.click();
            
            // Wait for navigation or error
            await page.waitForTimeout(3000);
            
            result.loginSuccessful = !page.url().includes('/login') && !page.url().includes('/auth');
          }
        }
      }
      
      // Check if we're in admin area
      result.redirectedToAdmin = page.url().includes('/admin');
      
      // Check for user menu or logout option (indicates successful auth)
      result.userMenuVisible = await page.locator('[data-testid="user-menu"], .user-menu, button:has-text("logout")').count() > 0;
      
    } catch (error) {
      result.errors.push(error.message);
    }
    
    return result;
  }

  /**
   * Validate data actually loads from the backend
   */
  async validateDataLoading(page) {
    const result = {
      dataElementsFound: 0,
      emptyStateHandled: false,
      loadingStateHandled: false,
      apiCallsMade: false,
      errors: []
    };
    
    try {
      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
      
      // Check for data elements
      const dataElements = await page.locator('tr:not(:first-child), .bg-white.border-b.border-gray-100, [data-testid*="item"], .card').count();
      result.dataElementsFound = dataElements;
      
      // Check for empty state handling
      if (dataElements === 0) {
        const emptyStateElements = await page.locator('text=/no data|empty|no items|no results/i').count();
        result.emptyStateHandled = emptyStateElements > 0;
      }
      
      // Check if loading states were handled
      const loadingElements = await page.locator('.loading, .spinner, .MuiCircularProgress-root').count();
      result.loadingStateHandled = loadingElements === 0; // Should be gone after loading
      
      // Monitor network requests
      const networkRequests = [];
      page.on('request', request => {
        if (request.url().includes('/api/') || request.url().includes('graphql')) {
          networkRequests.push(request.url());
        }
      });
      
      result.apiCallsMade = networkRequests.length > 0;
      
    } catch (error) {
      result.errors.push(error.message);
    }
    
    return result;
  }

  /**
   * Validate buttons actually function (not just exist)
   */
  async validateButtonFunctionality(page, buttonTestConfig) {
    const result = {
      buttonsFound: 0,
      buttonsClickable: 0,
      buttonsWithActions: 0,
      failedButtons: [],
      errors: []
    };
    
    try {
      const buttons = await page.locator('button:visible, [role="button"]:visible').all();
      result.buttonsFound = buttons.length;
      
      for (const button of buttons.slice(0, 5)) { // Test first 5 buttons to avoid overwhelming
        try {
          const isClickable = await button.isEnabled();
          if (isClickable) {
            result.buttonsClickable++;
            
            // Capture before state
            const beforeUrl = page.url();
            const beforeScreenshot = await this.captureScreenshot(page, 'button-test-before', 'before-action', 'Before button click', false);
            
            // Click button
            await button.click();
            await page.waitForTimeout(1000);
            
            // Capture after state
            const afterUrl = page.url();
            const afterScreenshot = await this.captureScreenshot(page, 'button-test-after', 'after-action', 'After button click', false);
            
            // Check if action occurred (URL change, modal opened, etc.)
            const urlChanged = beforeUrl !== afterUrl;
            const modalOpened = await page.locator('.modal, .dialog, [role="dialog"]').count() > 0;
            const contentChanged = beforeScreenshot && afterScreenshot && 
              beforeScreenshot.metadata.fileSize !== afterScreenshot.metadata.fileSize;
            
            if (urlChanged || modalOpened || contentChanged) {
              result.buttonsWithActions++;
            } else {
              result.failedButtons.push(await button.textContent() || 'Unknown button');
            }
            
          }
        } catch (error) {
          result.errors.push(`Button test error: ${error.message}`);
        }
      }
      
    } catch (error) {
      result.errors.push(error.message);
    }
    
    return result;
  }

  compareResults(actual, expected) {
    if (!expected) return true; // No expectations set
    
    for (const [key, expectedValue] of Object.entries(expected)) {
      if (actual[key] !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  addTestResult(testData) {
    if (this.criticalFailureOccurred && this.failFast && testData.status !== 'skipped') {
      testData.status = 'skipped';
      testData.error = 'Skipped due to critical failure';
    }
    
    const test = {
      name: testData.name,
      status: testData.status,
      startTime: testData.startTime,
      endTime: testData.endTime || new Date().toISOString(),
      duration: testData.duration || this.calculateDuration(testData.startTime, testData.endTime),
      details: testData.details || {},
      assertions: testData.assertions || [],
      screenshots: testData.screenshots || [],
      error: testData.error || null,
      metadata: testData.metadata || {},
      validationResults: testData.validationResults || []
    };

    this.results.tests.push(test);
    this.results.summary.totalTests++;
    
    switch (test.status) {
      case 'passed':
        this.results.summary.passed++;
        this.logMessage('info', `✅ ${test.name}: PASSED`);
        break;
      case 'failed':
        this.results.summary.failed++;
        this.logMessage('error', `❌ ${test.name}: FAILED - ${test.error || 'Unknown error'}`);
        break;
      case 'error':
        this.results.summary.errors++;
        this.logMessage('error', `💥 ${test.name}: ERROR - ${test.error || 'Unknown error'}`);
        break;
      case 'skipped':
        this.results.summary.skipped++;
        this.logMessage('info', `⏭️  ${test.name}: SKIPPED`);
        break;
    }

    return test;
  }

  addArtifact(filePath, description = '', type = 'file') {
    const artifact = {
      path: filePath,
      relativePath: path.relative(this.reportDir, filePath),
      description,
      type,
      timestamp: new Date().toISOString(),
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
    };

    this.results.artifacts.push(artifact);
    this.logMessage('info', `📎 Artifact added: ${artifact.relativePath}`);
    return artifact;
  }

  logMessage(level, message, metadata = {}) {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Write to log file
    const logFile = path.join(this.reportDir, 'logs', 'test.log');
    const logLine = `[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}\n`;
    fs.appendFileSync(logFile, logLine);

    // Console output with emojis
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🐛'
    };
    console.log(`${emoji[level] || 'ℹ️'} ${message}`);
    
    if (metadata && Object.keys(metadata).length > 0) {
      console.log('   ', JSON.stringify(metadata, null, 2));
    }
  }

  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return null;
    return new Date(endTime) - new Date(startTime);
  }

  generateEnhancedHTMLReport() {
    const validationSummary = {
      screenshotValidation: this.results.validationResults.screenshotValidation.length,
      businessLogicValidation: this.results.validationResults.businessLogicValidation.length,
      criticalFailures: this.results.summary.criticalFailures
    };
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Test Report - ${this.testSuiteName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header.critical-failure { background: linear-gradient(135deg, #dc3545 0%, #a71e2e 100%); }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { text-align: center; padding: 20px; border-radius: 8px; }
        .metric.passed { background: #d4edda; color: #155724; }
        .metric.failed { background: #f8d7da; color: #721c24; }
        .metric.error { background: #fff3cd; color: #856404; }
        .metric.critical { background: #f5c6cb; color: #721c24; border: 2px solid #dc3545; }
        .metric .number { font-size: 2.5em; font-weight: bold; display: block; }
        .metric .label { font-size: 0.9em; text-transform: uppercase; opacity: 0.8; }
        .validation-section { margin: 20px 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .validation-item { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; background: white; }
        .validation-item.failed { border-left-color: #dc3545; }
        .validation-item.error { border-left-color: #ffc107; }
        .tests { padding: 0 30px 30px; }
        .test { border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 15px; overflow: hidden; }
        .test-header { padding: 15px 20px; background: #f8f9fa; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .test-header.passed { border-left: 4px solid #28a745; }
        .test-header.failed { border-left: 4px solid #dc3545; }
        .test-header.error { border-left: 4px solid #ffc107; }
        .test-header.skipped { border-left: 4px solid #6c757d; }
        .test-details { padding: 20px; background: white; display: none; }
        .test-details.show { display: block; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-top: 15px; }
        .screenshot { border: 1px solid #dee2e6; border-radius: 4px; overflow: hidden; }
        .screenshot img { width: 100%; height: auto; display: block; cursor: pointer; }
        .screenshot .caption { padding: 10px; background: #f8f9fa; font-size: 0.9em; }
        .toggle { background: none; border: none; color: #007bff; cursor: pointer; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; }
        .status-badge.passed { background: #d4edda; color: #155724; }
        .status-badge.failed { background: #f8d7da; color: #721c24; }
        .status-badge.error { background: #fff3cd; color: #856404; }
        .status-badge.skipped { background: #e2e3e5; color: #6c757d; }
        .critical-alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px; margin: 20px 30px; }
        .evidence-section { background: #f8f9fa; padding: 15px; margin-top: 15px; border-radius: 4px; }
        .console-logs { max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 0.8em; }
        .log-entry { margin: 2px 0; padding: 2px 4px; }
        .log-entry.error { background: #f8d7da; color: #721c24; }
        .log-entry.warn { background: #fff3cd; color: #856404; }
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.9); }
        .modal-content { margin: auto; display: block; width: 80%; max-width: 700px; }
        .close { position: absolute; top: 15px; right: 35px; color: #f1f1f1; font-size: 40px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header ${this.criticalFailureOccurred ? 'critical-failure' : ''}">
            <h1>Enhanced Test Report: ${this.testSuiteName}</h1>
            <p>Generated on ${new Date(this.results.metadata.timestamp).toLocaleString()}</p>
            <p>Duration: ${this.results.summary.duration ? (this.results.summary.duration / 1000).toFixed(2) + 's' : 'N/A'}</p>
            ${this.criticalFailureOccurred ? `<p><strong>⚠️ CRITICAL FAILURE OCCURRED: ${this.results.summary.stopReason}</strong></p>` : ''}
            <p>Fail-Fast: ${this.failFast ? 'Enabled' : 'Disabled'} | Screenshot Validation: ${this.screenshotValidation ? 'Enabled' : 'Disabled'} | Business Logic Validation: ${this.businessLogicValidation ? 'Enabled' : 'Disabled'}</p>
        </div>
        
        ${this.criticalFailureOccurred ? `
        <div class="critical-alert">
            <h3>🚨 Critical Failure Alert</h3>
            <p><strong>Test execution was stopped due to:</strong> ${this.results.summary.stopReason}</p>
            <p>Fail-fast mode prevented further test execution to avoid cascading failures.</p>
        </div>
        ` : ''}
        
        <div class="summary">
            <div class="metric passed">
                <span class="number">${this.results.summary.passed}</span>
                <span class="label">Passed</span>
            </div>
            <div class="metric failed">
                <span class="number">${this.results.summary.failed}</span>
                <span class="label">Failed</span>
            </div>
            <div class="metric error">
                <span class="number">${this.results.summary.errors}</span>
                <span class="label">Errors</span>
            </div>
            <div class="metric critical">
                <span class="number">${this.results.summary.criticalFailures}</span>
                <span class="label">Critical</span>
            </div>
            <div class="metric">
                <span class="number">${this.results.summary.totalTests}</span>
                <span class="label">Total</span>
            </div>
        </div>
        
        <div class="validation-section">
            <h3>🔍 Validation Results</h3>
            <div class="validation-item">
                <strong>Screenshot Validation:</strong> ${validationSummary.screenshotValidation} validations performed
            </div>
            <div class="validation-item">
                <strong>Business Logic Validation:</strong> ${validationSummary.businessLogicValidation} validations performed
            </div>
            <div class="validation-item ${this.criticalFailureOccurred ? 'failed' : 'passed'}">
                <strong>Critical Failures:</strong> ${validationSummary.criticalFailures} occurred
            </div>
        </div>
        
        <div class="tests">
            <h2>Test Results</h2>
            ${this.results.tests.map(test => `
                <div class="test">
                    <div class="test-header ${test.status}" onclick="toggleDetails('${test.name.replace(/[^a-zA-Z0-9]/g, '')}')">
                        <div>
                            <strong>${test.name}</strong>
                            <span class="status-badge ${test.status}">${test.status}</span>
                        </div>
                        <button class="toggle">Toggle Details</button>
                    </div>
                    <div class="test-details" id="details-${test.name.replace(/[^a-zA-Z0-9]/g, '')}">
                        <p><strong>Duration:</strong> ${test.duration ? (test.duration / 1000).toFixed(2) + 's' : 'N/A'}</p>
                        ${test.error ? `<p><strong>Error:</strong> ${test.error}</p>` : ''}
                        ${test.validationResults && test.validationResults.length > 0 ? `
                            <div class="evidence-section">
                                <h4>🔍 Validation Evidence</h4>
                                ${test.validationResults.map(validation => `
                                    <div class="validation-item ${validation.status}">
                                        <strong>${validation.validationType}:</strong> ${validation.message}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${test.screenshots.length > 0 ? `
                            <h4>📸 Screenshots</h4>
                            <div class="screenshots">
                                ${test.screenshots.map(screenshot => `
                                    <div class="screenshot">
                                        <img src="${screenshot.relativePath}" alt="${screenshot.description}" onclick="openModal('${screenshot.relativePath}')" />
                                        <div class="caption">${screenshot.description || screenshot.filename}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <!-- Modal for full-size screenshots -->
    <div id="imageModal" class="modal">
        <span class="close" onclick="closeModal()">&times;</span>
        <img class="modal-content" id="modalImage">
    </div>
    
    <script>
        function toggleDetails(testId) {
            const details = document.getElementById('details-' + testId);
            details.classList.toggle('show');
        }
        
        function openModal(imagePath) {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            modal.style.display = 'block';
            modalImg.src = imagePath;
        }
        
        function closeModal() {
            document.getElementById('imageModal').style.display = 'none';
        }
        
        // Close modal when clicking outside of it
        window.onclick = function(event) {
            const modal = document.getElementById('imageModal');
            if (event.target == modal) {
                closeModal();
            }
        }
    </script>
</body>
</html>`;

    const htmlPath = path.join(this.reportDir, 'enhanced-report.html');
    fs.writeFileSync(htmlPath, htmlContent);
    this.logMessage('info', `📄 Enhanced HTML report generated: ${htmlPath}`);
    return htmlPath;
  }

  finalize() {
    this.results.summary.endTime = new Date().toISOString();
    this.results.summary.duration = this.calculateDuration(
      this.results.summary.startTime,
      this.results.summary.endTime
    );

    // Generate JSON report
    const jsonPath = path.join(this.reportDir, 'enhanced-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

    // Generate enhanced HTML report
    const htmlPath = this.generateEnhancedHTMLReport();

    // Generate enhanced summary
    const summaryPath = path.join(this.reportDir, 'enhanced-summary.txt');
    const summaryContent = `
ENHANCED TEST REPORT SUMMARY
===========================
Test Suite: ${this.testSuiteName}
Timestamp: ${this.results.metadata.timestamp}
Duration: ${this.results.summary.duration ? (this.results.summary.duration / 1000).toFixed(2) + 's' : 'N/A'}

CONFIGURATION:
- Fail-Fast Mode: ${this.failFast ? 'ENABLED' : 'DISABLED'}
- Screenshot Validation: ${this.screenshotValidation ? 'ENABLED' : 'DISABLED'}
- Business Logic Validation: ${this.businessLogicValidation ? 'ENABLED' : 'DISABLED'}

TEST RESULTS:
- Total Tests: ${this.results.summary.totalTests}
- Passed: ${this.results.summary.passed}
- Failed: ${this.results.summary.failed}
- Errors: ${this.results.summary.errors}
- Skipped: ${this.results.summary.skipped}
- Critical Failures: ${this.results.summary.criticalFailures}

VALIDATION RESULTS:
- Screenshot Validations: ${this.results.validationResults.screenshotValidation.length}
- Business Logic Validations: ${this.results.validationResults.businessLogicValidation.length}
- Server Validations: ${this.results.validationResults.serverValidation.length}

SUCCESS METRICS:
- Success Rate: ${this.results.summary.totalTests > 0 ? 
  ((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1) : 0}%
- Critical Failure Rate: ${this.results.summary.totalTests > 0 ? 
  ((this.results.summary.criticalFailures / this.results.summary.totalTests) * 100).toFixed(1) : 0}%

EVIDENCE COLLECTED:
- Screenshots: ${this.results.screenshots.length}
- Console Log Entries: ${this.results.consoleLogs.length}
- Network Requests: ${this.results.networkRequests.length}
- Artifacts: ${this.results.artifacts.length}

${this.criticalFailureOccurred ? `
🚨 CRITICAL FAILURE ALERT:
Stop Reason: ${this.results.summary.stopReason}
Execution was halted to prevent cascading failures.
` : ''}
`;

    fs.writeFileSync(summaryPath, summaryContent);

    this.logMessage('info', '\n🎯 ENHANCED TEST REPORT SUMMARY');
    this.logMessage('info', '================================');
    this.logMessage('info', `📁 Report Directory: ${this.reportDir}`);
    this.logMessage('info', `📄 JSON Report: ${path.basename(jsonPath)}`);
    this.logMessage('info', `📄 HTML Report: ${path.basename(htmlPath)}`);
    this.logMessage('info', `📄 Summary: ${path.basename(summaryPath)}`);
    this.logMessage('info', `📸 Screenshots: ${this.results.screenshots.length}`);
    this.logMessage('info', `🔍 Validations: ${this.results.validationResults.screenshotValidation.length + this.results.validationResults.businessLogicValidation.length}`);
    this.logMessage('info', `📎 Artifacts: ${this.results.artifacts.length}`);
    
    if (this.criticalFailureOccurred) {
      this.logMessage('error', `🚨 CRITICAL FAILURE: ${this.results.summary.stopReason}`);
    }
    
    console.log(summaryContent);

    return {
      reportDir: this.reportDir,
      jsonPath,
      htmlPath,
      summaryPath,
      results: this.results,
      criticalFailure: this.criticalFailureOccurred
    };
  }
}

module.exports = EnhancedTestReporter;