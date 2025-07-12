/**
 * Responsive Test Framework
 * 
 * Flexible test framework that can run in both full suite mode and isolated mode
 * Supports skipping system priming and authentication for isolated page testing
 */

const EnhancedTestReporter = require('../core/framework/EnhancedTestReporter');
const TestConfig = require('../config/TestConfig');
const SystemPrimingTests = require('../tests/system-priming/SystemPrimingTests');
const AuthenticationTests = require('../tests/authentication/AuthenticationTests');

const puppeteer = require('puppeteer');

class ResponsiveTestFramework {
  constructor(suiteName, options = {}) {
    this.suiteName = suiteName;
    this.config = TestConfig.getConfig(options);
    
    // Support isolated testing options
    this.skipSystemPrime = options.skipSystemPrime || false;
    this.skipAuthentication = options.skipAuthentication || false;
    this.customCredentials = options.credentials || this.config.credentials;
    this.baseUrl = options.baseUrl || this.config.baseUrl;
    
    this.reporter = new EnhancedTestReporter(suiteName, {
      baseDir: this.config.reporting.baseDir,
      mode: options.skipSystemPrime ? 'isolated' : 'full',
      metadata: {
        testType: options.skipSystemPrime ? 'isolated-page' : 'full-suite',
        skipSystemPrime: this.skipSystemPrime,
        skipAuthentication: this.skipAuthentication,
        framework: 'responsive'
      }
    });
    
    this.browser = null;
    this.page = null;
    
    // Standard responsive breakpoints for testing
    this.breakpoints = [
      { name: 'mobile', width: 375, height: 667 },     // iPhone SE
      { name: 'tablet', width: 768, height: 1024 },    // iPad
      { name: 'desktop', width: 1440, height: 900 },   // Standard desktop
      { name: 'large', width: 1920, height: 1080 }     // Large desktop
    ];
  }

  /**
   * Initialize browser for testing
   */
  async initializeBrowser() {
    if (!this.skipSystemPrime) {
      console.log('🔧 Initializing browser...');
    }
    
    this.browser = await puppeteer.launch(this.config.browser);
    this.page = await this.browser.newPage();
    
    const timeouts = this.config.timeouts;
    this.page.setDefaultNavigationTimeout(timeouts.navigation);
    this.page.setDefaultTimeout(timeouts.element);
    
    if (!this.skipSystemPrime) {
      console.log('✅ Browser initialized');
    }
    return true;
  }

  /**
   * Execute System Priming Phase (can be skipped for isolated tests)
   */
  async executeSystemPrimingPhase() {
    if (this.skipSystemPrime) {
      console.log('⏭️ Skipping system priming (assuming system is ready)');
      return true;
    }
    
    console.log('\n🏗️ SYSTEM PRIMING PHASE');
    console.log('═'.repeat(50));
    
    this.reporter.startPhase('systemPriming');
    
    const systemTests = new SystemPrimingTests(this.reporter);
    const result = await systemTests.executeAll();
    
    this.reporter.completePhase('systemPriming');
    
    console.log(`✅ System Priming: ${result.success ? 'PASSED' : 'FAILED'}`);
    
    if (result.criticalFailed) {
      console.log('🛑 Critical system priming failed - cannot continue');
      return false;
    }
    
    return result.success;
  }

  /**
   * Execute Authentication Phase (can be skipped for isolated tests)
   */
  async executeAuthenticationPhase() {
    if (this.skipAuthentication) {
      console.log('⏭️ Skipping authentication (assuming user is logged in)');
      return true;
    }
    
    console.log('\n🔐 AUTHENTICATION PHASE');
    console.log('═'.repeat(50));
    
    this.reporter.startPhase('authentication');
    
    const authTests = new AuthenticationTests(
      this.reporter, 
      this.customCredentials
    );
    
    const result = await authTests.executeAll(this.page, this.baseUrl);
    
    this.reporter.completePhase('authentication');
    
    console.log(`✅ Authentication: ${result.success ? 'PASSED' : 'FAILED'}`);
    
    if (!result.success) {
      console.log('🛑 Authentication failed - cannot continue');
      return false;
    }
    
    return result.success;
  }

  /**
   * Execute Custom Page Tests
   */
  async executePageTests(pagePath, customTests = {}) {
    console.log(`\n📄 PAGE TESTING: ${pagePath}`);
    console.log('═'.repeat(50));
    
    this.reporter.startPhase('pageTests');
    
    let allPassed = true;
    
    // Execute functionality tests
    if (customTests.functionality && customTests.functionality.length > 0) {
      console.log('\n🔧 Functionality Tests');
      console.log('─'.repeat(30));
      
      for (const test of customTests.functionality) {
        try {
          console.log(`   Running: ${test.name}...`);
          await test.testFn(this.page, this.baseUrl);
          console.log(`   ✅ ${test.name}`);
        } catch (error) {
          console.log(`   ❌ ${test.name}: ${error.message}`);
          allPassed = false;
        }
      }
    }
    
    // Execute responsive tests
    if (!customTests.responsive || customTests.responsive.length === 0) {
      console.log('\n📱 Responsive Tests');
      console.log('─'.repeat(30));
      
      for (const breakpoint of this.breakpoints) {
        try {
          console.log(`   Testing: ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})...`);
          await this.executeResponsiveTest(pagePath, breakpoint);
          console.log(`   ✅ ${breakpoint.name}`);
        } catch (error) {
          console.log(`   ❌ ${breakpoint.name}: ${error.message}`);
          allPassed = false;
        }
      }
    } else {
      // Execute custom responsive tests
      for (const test of customTests.responsive) {
        try {
          console.log(`   Running: ${test.name}...`);
          await test.testFn(this.page, this.baseUrl);
          console.log(`   ✅ ${test.name}`);
        } catch (error) {
          console.log(`   ❌ ${test.name}: ${error.message}`);
          allPassed = false;
        }
      }
    }
    
    this.reporter.completePhase('pageTests');
    
    return allPassed;
  }

  /**
   * Execute responsive test for a specific breakpoint
   */
  async executeResponsiveTest(pagePath, breakpoint) {
    await this.page.setViewport({
      width: breakpoint.width,
      height: breakpoint.height
    });
    
    await this.page.goto(`${this.baseUrl}${pagePath}`, { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await this.page.waitForSelector('h1, .admin-layout, [data-testid="admin-data-grid"]', { timeout: 10000 });
    
    // Take screenshot for this breakpoint
    await this.reporter.captureScreenshot(
      this.page, 
      `responsive-${breakpoint.name}`, 
      'passed', 
      `${pagePath} at ${breakpoint.name} breakpoint`,
      'responsive',
      breakpoint.name
    );
    
    // Check for layout issues
    const hasHorizontalScroll = await this.page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    if (hasHorizontalScroll && breakpoint.name === 'mobile') {
      console.warn(`   ⚠️ Horizontal scroll detected on ${breakpoint.name}`);
    }
    
    return true;
  }

  /**
   * Run complete test suite
   */
  async runFullSuite(pagePath, customTests = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Starting ${this.suiteName} Test Suite`);
      console.log('═'.repeat(60));
      
      // Initialize browser
      await this.initializeBrowser();
      
      // System priming phase
      const systemReady = await this.executeSystemPrimingPhase();
      if (!systemReady) {
        throw new Error('System priming failed');
      }
      
      // Authentication phase
      const authSuccess = await this.executeAuthenticationPhase();
      if (!authSuccess) {
        throw new Error('Authentication failed');
      }
      
      // Page tests
      const pageTestsSuccess = await this.executePageTests(pagePath, customTests);
      
      // Final results
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log('\n' + '═'.repeat(60));
      console.log(`🏁 Test Suite Complete: ${pageTestsSuccess ? 'PASSED' : 'FAILED'}`);
      console.log(`⏱️ Duration: ${duration}s`);
      console.log(`📊 Results: ${this.reporter.getResultsPath()}/report.html`);
      
      // Generate final report
      await this.reporter.generateFinalReport();
      
      return pageTestsSuccess;
      
    } catch (error) {
      console.error(`❌ Test suite failed: ${error.message}`);
      
      // Capture error screenshot if page exists
      if (this.page) {
        await this.reporter.captureScreenshot(
          this.page, 
          'suite-failure', 
          'failed', 
          'Test suite failure state',
          'error',
          'suite'
        );
      }
      
      throw error;
      
    } finally {
      // Clean up
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  /**
   * Get results path for reporting
   */
  getResultsPath() {
    return this.reporter.getResultsPath();
  }

  /**
   * Clean shutdown
   */
  async shutdown() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = ResponsiveTestFramework;