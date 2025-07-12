/**
 * Base Page Test Class
 * 
 * Provides common functionality for all page-specific tests including:
 * - Page navigation and validation
 * - Common UI element interactions
 * - Screenshot capture for each test step
 * - Business logic validation
 * - Error handling and reporting
 */

const FailFastValidator = require('./FailFastValidator');
const BusinessLogicTester = require('./BusinessLogicTester');

class BasePageTest {
  constructor(page, reporter, pageConfig) {
    this.page = page;
    this.reporter = reporter;
    this.pageConfig = pageConfig;
    this.validator = new FailFastValidator(reporter);
    this.businessTester = new BusinessLogicTester(page, reporter);
    this.testResults = [];
    this.screenshots = [];
  }

  /**
   * Navigate to the page and perform basic validations
   */
  async navigateToPage() {
    const testName = `${this.pageConfig.name}-navigation`;
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Navigating to ${this.pageConfig.name} page`);
      
      // Navigate to the page
      await this.page.goto(`${this.pageConfig.baseUrl}${this.pageConfig.path}`, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      // Take screenshot of loaded page
      const screenshot = await this.reporter.captureScreenshot(
        this.page, 
        `${testName}-loaded`, 
        'info', 
        `${this.pageConfig.name} page loaded`
      );
      
      // Validate page load
      await this.validator.validatePageLoad(
        this.page, 
        `${this.pageConfig.baseUrl}${this.pageConfig.path}`,
        this.pageConfig.expectedTitle
      );
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: {
          url: this.page.url(),
          title: await this.page.title(),
          screenshot: screenshot?.filename
        }
      });
      
      return true;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Page navigation failed: ${error.message}`);
    }
  }

  /**
   * Validate page content and structure
   */
  async validatePageContent() {
    const testName = `${this.pageConfig.name}-content-validation`;
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Validating ${this.pageConfig.name} page content`);
      
      const validationResults = {};
      
      // Validate page title
      if (this.pageConfig.expectedTitle) {
        const titleElement = await this.page.waitForSelector('h1, .MuiTypography-h1', { timeout: 5000 });
        const titleText = await titleElement.textContent();
        
        if (!titleText.includes(this.pageConfig.expectedTitle)) {
          throw new Error(`Title mismatch. Expected: ${this.pageConfig.expectedTitle}, Got: ${titleText}`);
        }
        
        validationResults.title = { expected: this.pageConfig.expectedTitle, actual: titleText };
      }
      
      // Validate subtitle
      if (this.pageConfig.expectedSubtitle) {
        const subtitleElement = await this.page.waitForSelector('h2, .MuiTypography-h2, p', { timeout: 5000 });
        const subtitleText = await subtitleElement.textContent();
        
        if (!subtitleText.includes(this.pageConfig.expectedSubtitle)) {
          this.reporter.logMessage('warn', `Subtitle mismatch. Expected: ${this.pageConfig.expectedSubtitle}, Got: ${subtitleText}`);
        }
        
        validationResults.subtitle = { expected: this.pageConfig.expectedSubtitle, actual: subtitleText };
      }
      
      // Validate data is present
      await this.validator.validateDataLoading(this.page);
      
      // Take screenshot of content validation
      const screenshot = await this.reporter.captureScreenshot(
        this.page, 
        `${testName}-validated`, 
        'info', 
        `${this.pageConfig.name} content validated`
      );
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: {
          validationResults,
          screenshot: screenshot?.filename
        }
      });
      
      return validationResults;
      
    } catch (error) {
      // Take screenshot of validation failure
      await this.reporter.captureScreenshot(
        this.page, 
        `${testName}-failed`, 
        'failed', 
        `${this.pageConfig.name} content validation failed`
      );
      
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Content validation failed: ${error.message}`);
    }
  }

  /**
   * Test responsive behavior at different breakpoints
   */
  async testResponsiveBehavior(breakpoints) {
    const testName = `${this.pageConfig.name}-responsive`;
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Testing responsive behavior for ${this.pageConfig.name}`);
      
      const responsiveResults = {};
      
      for (const breakpoint of breakpoints) {
        this.reporter.logMessage('info', `Testing ${breakpoint.name} breakpoint (${breakpoint.width}x${breakpoint.height})`);
        
        // Set viewport
        await this.page.setViewport({
          width: breakpoint.width,
          height: breakpoint.height
        });
        
        // Wait for responsive changes
        await this.page.waitForTimeout(1000);
        
        // Take screenshot at this breakpoint
        const screenshot = await this.reporter.captureScreenshot(
          this.page, 
          `${testName}-${breakpoint.name}`, 
          'info', 
          `${this.pageConfig.name} at ${breakpoint.name} breakpoint`
        );
        
        // Validate layout at this breakpoint
        const layoutValidation = await this.validateBreakpointLayout(breakpoint);
        
        responsiveResults[breakpoint.name] = {
          breakpoint,
          screenshot: screenshot?.filename,
          layout: layoutValidation
        };
      }
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: responsiveResults
      });
      
      return responsiveResults;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Responsive testing failed: ${error.message}`);
    }
  }

  /**
   * Test all interactive elements on the page
   */
  async testInteractiveElements() {
    const testName = `${this.pageConfig.name}-interactive-elements`;
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Testing interactive elements for ${this.pageConfig.name}`);
      
      const interactiveResults = {};
      
      // Test all buttons
      interactiveResults.buttons = await this.businessTester.testAllButtons(`${this.pageConfig.name}-buttons`);
      
      // Test all forms
      interactiveResults.forms = await this.businessTester.testAllForms(`${this.pageConfig.name}-forms`);
      
      // Test search and filters
      interactiveResults.searchFilters = await this.businessTester.testSearchAndFilters(`${this.pageConfig.name}-search`, this.pageConfig);
      
      // Test CRUD operations
      interactiveResults.crud = await this.businessTester.testCRUDOperations(`${this.pageConfig.name}-crud`, this.pageConfig);
      
      const allPassed = Object.values(interactiveResults).every(result => result.success);
      
      this.reporter.addTestResult({
        name: testName,
        status: allPassed ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: interactiveResults
      });
      
      return interactiveResults;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Interactive elements testing failed: ${error.message}`);
    }
  }

  /**
   * Test page-specific use cases
   */
  async testPageSpecificUseCases() {
    const testName = `${this.pageConfig.name}-use-cases`;
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Testing page-specific use cases for ${this.pageConfig.name}`);
      
      // This method should be overridden by specific page test classes
      const useCaseResults = await this.runPageSpecificTests();
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: useCaseResults
      });
      
      return useCaseResults;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Page-specific use cases failed: ${error.message}`);
    }
  }

  /**
   * Run complete page test suite
   */
  async runCompletePageTest(breakpoints) {
    const testName = `${this.pageConfig.name}-complete-test`;
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Running complete test suite for ${this.pageConfig.name}`);
      
      const results = {};
      
      // 1. Navigate to page
      results.navigation = await this.navigateToPage();
      
      // 2. Validate page content
      results.content = await this.validatePageContent();
      
      // 3. Test responsive behavior
      results.responsive = await this.testResponsiveBehavior(breakpoints);
      
      // 4. Test interactive elements
      results.interactive = await this.testInteractiveElements();
      
      // 5. Test page-specific use cases
      results.useCases = await this.testPageSpecificUseCases();
      
      // Final screenshot
      const screenshot = await this.reporter.captureScreenshot(
        this.page, 
        `${testName}-complete`, 
        'passed', 
        `${this.pageConfig.name} complete test finished`
      );
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: {
          ...results,
          finalScreenshot: screenshot?.filename
        }
      });
      
      return results;
      
    } catch (error) {
      // Take screenshot of failure
      await this.reporter.captureScreenshot(
        this.page, 
        `${testName}-failed`, 
        'failed', 
        `${this.pageConfig.name} complete test failed`
      );
      
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Complete page test failed: ${error.message}`);
    }
  }

  /**
   * Validate layout at specific breakpoint
   */
  async validateBreakpointLayout(breakpoint) {
    try {
      const layoutInfo = await this.page.evaluate(() => {
        return {
          bodyWidth: document.body.offsetWidth,
          bodyHeight: document.body.offsetHeight,
          hasHorizontalScroll: document.body.scrollWidth > document.body.clientWidth,
          hasVerticalScroll: document.body.scrollHeight > document.body.clientHeight,
          elementCounts: {
            visibleCards: document.querySelectorAll('.MuiCard-root:not([style*="display: none"])').length,
            visibleButtons: document.querySelectorAll('button:not([style*="display: none"])').length,
            visibleInputs: document.querySelectorAll('input:not([style*="display: none"])').length
          }
        };
      });
      
      return {
        valid: true,
        ...layoutInfo
      };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Override this method in specific page test classes
   */
  async runPageSpecificTests() {
    // Default implementation - should be overridden
    return { message: 'No page-specific tests implemented' };
  }

  /**
   * Get test results summary
   */
  getTestSummary() {
    return {
      page: this.pageConfig.name,
      url: this.pageConfig.path,
      testResults: this.testResults,
      screenshots: this.screenshots
    };
  }
}

module.exports = BasePageTest;