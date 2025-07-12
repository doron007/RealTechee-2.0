#!/usr/bin/env node

/**
 * Modular Admin Test Runner
 * 
 * A comprehensive test runner that sequences individual page tests
 * and user flow tests to provide complete validation of the admin
 * pages functionality. This runner:
 * 
 * 1. Runs individual page tests (Projects, Quotes, Requests)
 * 2. Executes user flow sequences
 * 3. Performs end-to-end workflow validation
 * 4. Generates comprehensive reports
 * 5. Provides detailed analysis of test results
 */

const puppeteer = require('puppeteer');
const TestReporter = require('./framework/TestReporter');
const FailFastValidator = require('./framework/FailFastValidator');
const SharedTestUtilities = require('./framework/SharedTestUtilities');
const UserFlowSequencer = require('./flows/UserFlowSequencer');

// Import page test modules
const ProjectsPageTest = require('./pages/ProjectsPageTest');
const QuotesPageTest = require('./pages/QuotesPageTest');
const RequestsPageTest = require('./pages/RequestsPageTest');

class ModularAdminTestRunner {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.credentials = {
      email: 'info@realtechee.com',
      password: 'Sababa123!'
    };
    
    this.browser = null;
    this.page = null;
    
    // Initialize test reporter
    this.reporter = new TestReporter('modular-admin-test-suite', {
      baseDir: 'test-results',
      mode: 'full',
      metadata: {
        testType: 'modular-admin-comprehensive',
        baseUrl: this.baseUrl,
        credentials: this.credentials.email,
        framework: 'modular-page-tests'
      }
    });
    
    // Initialize components
    this.validator = new FailFastValidator(this.reporter);
    this.testUtils = null;
    this.flowSequencer = null;
    
    // Page test instances
    this.pageTests = {};
    
    // Responsive breakpoints
    this.breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1200, height: 800 },
      { name: 'large', width: 1920, height: 1080 }
    ];
    
    // Test results
    this.testResults = {
      pageTests: {},
      userFlows: {},
      endToEndTests: {},
      summary: {}
    };
  }

  /**
   * Setup test environment
   */
  async setup() {
    try {
      this.reporter.logMessage('info', '🚀 Setting up Modular Admin Test Suite');
      
      // Start test reporting
      this.reporter.startTest('modular-admin-test-suite');
      
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: true,
        slowMo: 50,
        defaultViewport: { width: 1200, height: 800 },
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--no-first-run',
          '--disable-default-apps'
        ]
      });
      
      this.page = await this.browser.newPage();
      
      // Initialize utilities
      this.testUtils = new SharedTestUtilities(this.page, this.reporter);
      this.flowSequencer = new UserFlowSequencer(this.page, this.reporter, this.baseUrl);
      
      // Set up console error tracking
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          this.reporter.logMessage('error', `Browser Console Error: ${msg.text()}`);
        }
      });
      
      // Run critical fail-fast validations
      await this.validator.runAllValidations(this.page, this.baseUrl, this.credentials, null);
      
      // Initialize page test instances
      this.pageTests.projects = new ProjectsPageTest(this.page, this.reporter, this.baseUrl);
      this.pageTests.quotes = new QuotesPageTest(this.page, this.reporter, this.baseUrl);
      this.pageTests.requests = new RequestsPageTest(this.page, this.reporter, this.baseUrl);
      
      this.reporter.logMessage('info', '✅ Modular Admin Test Suite setup complete');
      
      return true;
      
    } catch (error) {
      this.reporter.logMessage('error', `❌ Setup failed: ${error.message}`);
      throw new Error(`Setup failed: ${error.message}`);
    }
  }

  /**
   * Run individual page tests
   */
  async runPageTests() {
    const testName = 'individual-page-tests';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', '📄 Starting individual page tests');
      
      const pageTestResults = {};
      
      // Test each page individually
      for (const [pageName, pageTest] of Object.entries(this.pageTests)) {
        try {
          this.reporter.logMessage('info', `🔍 Testing ${pageName} page`);
          
          // Run complete page test
          const pageResult = await pageTest.runCompletePageTest(this.breakpoints);
          
          pageTestResults[pageName] = {
            success: true,
            results: pageResult
          };
          
          this.reporter.logMessage('info', `✅ ${pageName} page tests completed successfully`);
          
        } catch (error) {
          this.reporter.logMessage('error', `❌ ${pageName} page tests failed: ${error.message}`);
          
          pageTestResults[pageName] = {
            success: false,
            error: error.message
          };
          
          // Don't fail entire suite for individual page test failures
          continue;
        }
      }
      
      // Calculate overall page tests success
      const pageTestsSuccess = Object.values(pageTestResults).every(result => result.success);
      
      this.testResults.pageTests = {
        success: pageTestsSuccess,
        results: pageTestResults,
        totalPages: Object.keys(pageTestResults).length,
        passedPages: Object.values(pageTestResults).filter(r => r.success).length,
        failedPages: Object.values(pageTestResults).filter(r => !r.success).length
      };
      
      this.reporter.addTestResult({
        name: testName,
        status: pageTestsSuccess ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: this.testResults.pageTests
      });
      
      this.reporter.logMessage('info', `📄 Individual page tests completed: ${this.testResults.pageTests.passedPages}/${this.testResults.pageTests.totalPages} passed`);
      
      return this.testResults.pageTests;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Page tests failed: ${error.message}`);
    }
  }

  /**
   * Run user flow sequences
   */
  async runUserFlows() {
    const testName = 'user-flow-sequences';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', '🔄 Starting user flow sequences');
      
      // Execute all user flows
      const flowResults = await this.flowSequencer.executeAllFlows(this.breakpoints);
      
      this.testResults.userFlows = {
        success: flowResults.allFlowsSuccess,
        results: flowResults,
        totalFlows: flowResults.flowCount,
        passedFlows: flowResults.passedFlows,
        failedFlows: flowResults.failedFlows
      };
      
      this.reporter.addTestResult({
        name: testName,
        status: flowResults.allFlowsSuccess ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: this.testResults.userFlows
      });
      
      this.reporter.logMessage('info', `🔄 User flow sequences completed: ${this.testResults.userFlows.passedFlows}/${this.testResults.userFlows.totalFlows} passed`);
      
      return this.testResults.userFlows;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`User flows failed: ${error.message}`);
    }
  }

  /**
   * Run end-to-end workflow tests
   */
  async runEndToEndTests() {
    const testName = 'end-to-end-workflows';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', '🔗 Starting end-to-end workflow tests');
      
      const endToEndResults = {};
      
      // Test 1: Complete Admin Management Workflow
      endToEndResults.adminManagement = await this.testAdminManagementWorkflow();
      
      // Test 2: Cross-Page Data Consistency
      endToEndResults.dataConsistency = await this.testCrossPageDataConsistency();
      
      // Test 3: Performance and Load Testing
      endToEndResults.performance = await this.testPerformanceMetrics();
      
      // Calculate overall success
      const endToEndSuccess = Object.values(endToEndResults).every(result => result.success);
      
      this.testResults.endToEndTests = {
        success: endToEndSuccess,
        results: endToEndResults,
        totalTests: Object.keys(endToEndResults).length,
        passedTests: Object.values(endToEndResults).filter(r => r.success).length,
        failedTests: Object.values(endToEndResults).filter(r => !r.success).length
      };
      
      this.reporter.addTestResult({
        name: testName,
        status: endToEndSuccess ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: this.testResults.endToEndTests
      });
      
      this.reporter.logMessage('info', `🔗 End-to-end tests completed: ${this.testResults.endToEndTests.passedTests}/${this.testResults.endToEndTests.totalTests} passed`);
      
      return this.testResults.endToEndTests;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`End-to-end tests failed: ${error.message}`);
    }
  }

  /**
   * Test complete admin management workflow
   */
  async testAdminManagementWorkflow() {
    try {
      this.reporter.logMessage('info', '🏢 Testing complete admin management workflow');
      
      const workflowSteps = [];
      
      // Step 1: Navigate to each page and verify data loads
      const pages = ['projects', 'quotes', 'requests'];
      
      for (const pageName of pages) {
        await this.page.goto(`${this.baseUrl}/admin/${pageName}`);
        await this.testUtils.waitForDataLoad();
        
        const dataCount = await this.page.$$eval('tr, .MuiCard-root', elements => elements.length);
        
        workflowSteps.push({
          step: `Navigate to ${pageName}`,
          success: dataCount > 0,
          dataCount
        });
      }
      
      // Step 2: Test search functionality across all pages
      for (const pageName of pages) {
        await this.page.goto(`${this.baseUrl}/admin/${pageName}`);
        await this.testUtils.waitForDataLoad();
        
        const searchResults = await this.testUtils.performSearch('test');
        
        workflowSteps.push({
          step: `Search functionality on ${pageName}`,
          success: searchResults >= 0,
          searchResults
        });
      }
      
      const allStepsSuccess = workflowSteps.every(step => step.success);
      
      return {
        success: allStepsSuccess,
        steps: workflowSteps,
        totalSteps: workflowSteps.length,
        passedSteps: workflowSteps.filter(s => s.success).length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test cross-page data consistency
   */
  async testCrossPageDataConsistency() {
    try {
      this.reporter.logMessage('info', '🔄 Testing cross-page data consistency');
      
      const consistencyTests = [];
      
      // Test 1: Address format consistency across pages
      const pages = ['projects', 'quotes', 'requests'];
      
      for (const pageName of pages) {
        await this.page.goto(`${this.baseUrl}/admin/${pageName}`);
        await this.testUtils.waitForDataLoad();
        
        const addressValidation = await this.testUtils.validateAddressFormat();
        
        consistencyTests.push({
          test: `Address format consistency on ${pageName}`,
          success: addressValidation.length === 0 || addressValidation.every(addr => addr.isValid),
          addressValidation
        });
      }
      
      // Test 2: Common UI elements consistency
      for (const pageName of pages) {
        await this.page.goto(`${this.baseUrl}/admin/${pageName}`);
        await this.testUtils.waitForDataLoad();
        
        const hasTitle = await this.page.$('h1, .MuiTypography-h1');
        const hasSearch = await this.page.$('input[type="search"], input[placeholder*="search" i]');
        
        consistencyTests.push({
          test: `UI elements consistency on ${pageName}`,
          success: !!hasTitle && !!hasSearch,
          hasTitle: !!hasTitle,
          hasSearch: !!hasSearch
        });
      }
      
      const allConsistencyTestsSuccess = consistencyTests.every(test => test.success);
      
      return {
        success: allConsistencyTestsSuccess,
        tests: consistencyTests,
        totalTests: consistencyTests.length,
        passedTests: consistencyTests.filter(t => t.success).length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test performance metrics
   */
  async testPerformanceMetrics() {
    try {
      this.reporter.logMessage('info', '⚡ Testing performance metrics');
      
      const performanceTests = [];
      const pages = ['projects', 'quotes', 'requests'];
      
      for (const pageName of pages) {
        const startTime = Date.now();
        
        await this.page.goto(`${this.baseUrl}/admin/${pageName}`);
        await this.testUtils.waitForDataLoad();
        
        const loadTime = Date.now() - startTime;
        const memoryUsage = await this.page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
        
        performanceTests.push({
          page: pageName,
          loadTime,
          memoryUsage,
          success: loadTime < 10000, // Under 10 seconds
          performanceGrade: loadTime < 3000 ? 'A' : loadTime < 6000 ? 'B' : 'C'
        });
      }
      
      const allPerformanceTestsSuccess = performanceTests.every(test => test.success);
      
      return {
        success: allPerformanceTestsSuccess,
        tests: performanceTests,
        averageLoadTime: performanceTests.reduce((sum, test) => sum + test.loadTime, 0) / performanceTests.length,
        totalTests: performanceTests.length,
        passedTests: performanceTests.filter(t => t.success).length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate comprehensive test summary
   */
  generateTestSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallSuccess: true,
      categories: {
        pageTests: this.testResults.pageTests,
        userFlows: this.testResults.userFlows,
        endToEndTests: this.testResults.endToEndTests
      }
    };
    
    // Calculate totals
    Object.values(summary.categories).forEach(category => {
      if (category.success !== undefined) {
        summary.totalTests++;
        if (category.success) {
          summary.passedTests++;
        } else {
          summary.failedTests++;
          summary.overallSuccess = false;
        }
      }
    });
    
    // Add detailed counts
    summary.detailedCounts = {
      pageTests: `${this.testResults.pageTests.passedPages}/${this.testResults.pageTests.totalPages}`,
      userFlows: `${this.testResults.userFlows.passedFlows}/${this.testResults.userFlows.totalFlows}`,
      endToEndTests: `${this.testResults.endToEndTests.passedTests}/${this.testResults.endToEndTests.totalTests}`
    };
    
    this.testResults.summary = summary;
    
    return summary;
  }

  /**
   * Run complete test suite
   */
  async run() {
    try {
      await this.setup();
      
      // Run all test categories
      await this.runPageTests();
      await this.runUserFlows();
      await this.runEndToEndTests();
      
      // Generate summary
      const summary = this.generateTestSummary();
      
      // Finalize reporting
      const reportData = this.reporter.finalize();
      
      // Output results
      console.log('\n═'.repeat(80));
      console.log('🎯 MODULAR ADMIN TEST SUITE COMPLETE');
      console.log('═'.repeat(80));
      console.log(`📊 Overall Success: ${summary.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`📄 Page Tests: ${summary.detailedCounts.pageTests} passed`);
      console.log(`🔄 User Flows: ${summary.detailedCounts.userFlows} passed`);
      console.log(`🔗 End-to-End: ${summary.detailedCounts.endToEndTests} passed`);
      console.log(`📁 Report: ${reportData.htmlPath}`);
      console.log(`📸 Screenshots: ${reportData.results.screenshots.length}`);
      
      await this.cleanup();
      
      if (summary.overallSuccess) {
        console.log('\n🎉 ALL TESTS PASSED - Admin pages are fully functional!');
        process.exit(0);
      } else {
        console.log('\n❌ SOME TESTS FAILED - Check the report for details');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Test execution error:', error.message);
      
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Cleanup test environment
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the test suite if this file is executed directly
if (require.main === module) {
  const testRunner = new ModularAdminTestRunner();
  testRunner.run().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = ModularAdminTestRunner;