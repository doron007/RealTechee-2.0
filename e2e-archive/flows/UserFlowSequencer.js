/**
 * User Flow Sequencer
 * 
 * Manages and executes user flow sequences that mimic real user journeys
 * through the admin pages. Each flow represents a complete business workflow
 * that spans multiple pages and actions.
 */

const SharedTestUtilities = require('../framework/SharedTestUtilities');

class UserFlowSequencer {
  constructor(page, reporter, baseUrl) {
    this.page = page;
    this.reporter = reporter;
    this.baseUrl = baseUrl;
    this.testUtils = new SharedTestUtilities(page, reporter);
    this.flowResults = {};
  }

  /**
   * Execute complete request-to-project workflow
   * Flow: Requests → Create Quote → View Quote → Create Project → View Project
   */
  async executeRequestToProjectFlow() {
    const flowName = 'request-to-project-flow';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', '🔄 Starting Request-to-Project workflow');
      
      const flowSteps = {};
      
      // Step 1: Navigate to Requests page
      await this.page.goto(`${this.baseUrl}/admin/requests`);
      await this.testUtils.waitForDataLoad();
      await this.reporter.captureScreenshot(this.page, `${flowName}-step-1-requests`, 'info', 'Step 1: Requests page loaded');
      
      flowSteps.step1_requests = {
        action: 'Navigate to Requests page',
        success: true,
        url: this.page.url()
      };
      
      // Step 2: Find and click "Create Quote" on first request
      const createQuoteButton = await this.page.$('button:has-text("Create Quote"), [aria-label*="Create Quote"]');
      if (createQuoteButton) {
        await createQuoteButton.click();
        await this.page.waitForTimeout(2000);
        await this.reporter.captureScreenshot(this.page, `${flowName}-step-2-create-quote`, 'info', 'Step 2: Create Quote clicked');
        
        flowSteps.step2_create_quote = {
          action: 'Click Create Quote button',
          success: true,
          buttonFound: true
        };
      } else {
        flowSteps.step2_create_quote = {
          action: 'Click Create Quote button',
          success: false,
          buttonFound: false,
          error: 'Create Quote button not found'
        };
      }
      
      // Step 3: Navigate to Quotes page to view created quote
      await this.page.goto(`${this.baseUrl}/admin/quotes`);
      await this.testUtils.waitForDataLoad();
      await this.reporter.captureScreenshot(this.page, `${flowName}-step-3-quotes`, 'info', 'Step 3: Quotes page loaded');
      
      flowSteps.step3_quotes = {
        action: 'Navigate to Quotes page',
        success: true,
        url: this.page.url()
      };
      
      // Step 4: Find and click "Create Project" on first quote
      const createProjectButton = await this.page.$('button:has-text("Create Project"), [aria-label*="Create Project"]');
      if (createProjectButton) {
        await createProjectButton.click();
        await this.page.waitForTimeout(2000);
        await this.reporter.captureScreenshot(this.page, `${flowName}-step-4-create-project`, 'info', 'Step 4: Create Project clicked');
        
        flowSteps.step4_create_project = {
          action: 'Click Create Project button',
          success: true,
          buttonFound: true
        };
      } else {
        flowSteps.step4_create_project = {
          action: 'Click Create Project button',
          success: false,
          buttonFound: false,
          error: 'Create Project button not found'
        };
      }
      
      // Step 5: Navigate to Projects page to view created project
      await this.page.goto(`${this.baseUrl}/admin/projects`);
      await this.testUtils.waitForDataLoad();
      await this.reporter.captureScreenshot(this.page, `${flowName}-step-5-projects`, 'info', 'Step 5: Projects page loaded');
      
      flowSteps.step5_projects = {
        action: 'Navigate to Projects page',
        success: true,
        url: this.page.url()
      };
      
      // Calculate flow success
      const flowSuccess = Object.values(flowSteps).every(step => step.success);
      
      this.flowResults[flowName] = {
        flowName: 'Request to Project Workflow',
        success: flowSuccess,
        steps: flowSteps,
        duration: new Date().toISOString()
      };
      
      this.reporter.addTestResult({
        name: flowName,
        status: flowSuccess ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: this.flowResults[flowName]
      });
      
      this.reporter.logMessage('info', `🔄 Request-to-Project workflow ${flowSuccess ? 'completed successfully' : 'failed'}`);
      
      return this.flowResults[flowName];
      
    } catch (error) {
      this.flowResults[flowName] = {
        flowName: 'Request to Project Workflow',
        success: false,
        error: error.message
      };
      
      this.reporter.addTestResult({
        name: flowName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Request-to-Project workflow failed: ${error.message}`);
    }
  }

  /**
   * Execute admin navigation workflow
   * Flow: Projects → Quotes → Requests → Back to Projects
   */
  async executeAdminNavigationFlow() {
    const flowName = 'admin-navigation-flow';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', '🔄 Starting Admin Navigation workflow');
      
      const flowSteps = {};
      const navigationPages = ['projects', 'quotes', 'requests'];
      
      for (let i = 0; i < navigationPages.length; i++) {
        const pageName = navigationPages[i];
        const stepName = `step${i + 1}_${pageName}`;
        
        // Navigate to page
        await this.page.goto(`${this.baseUrl}/admin/${pageName}`);
        await this.testUtils.waitForDataLoad();
        await this.reporter.captureScreenshot(this.page, `${flowName}-${stepName}`, 'info', `Navigation to ${pageName} page`);
        
        // Validate page loaded correctly
        const pageTitle = await this.page.title();
        const hasData = await this.page.$$eval('tr, .MuiCard-root', elements => elements.length > 0);
        
        flowSteps[stepName] = {
          action: `Navigate to ${pageName} page`,
          success: hasData,
          url: this.page.url(),
          pageTitle,
          dataLoaded: hasData
        };
        
        // Wait between navigations
        await this.page.waitForTimeout(1000);
      }
      
      // Navigate back to Projects (full circle)
      await this.page.goto(`${this.baseUrl}/admin/projects`);
      await this.testUtils.waitForDataLoad();
      await this.reporter.captureScreenshot(this.page, `${flowName}-final-projects`, 'info', 'Final navigation back to Projects');
      
      flowSteps.final_projects = {
        action: 'Navigate back to Projects page',
        success: true,
        url: this.page.url()
      };
      
      // Calculate flow success
      const flowSuccess = Object.values(flowSteps).every(step => step.success);
      
      this.flowResults[flowName] = {
        flowName: 'Admin Navigation Workflow',
        success: flowSuccess,
        steps: flowSteps,
        duration: new Date().toISOString()
      };
      
      this.reporter.addTestResult({
        name: flowName,
        status: flowSuccess ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: this.flowResults[flowName]
      });
      
      this.reporter.logMessage('info', `🔄 Admin Navigation workflow ${flowSuccess ? 'completed successfully' : 'failed'}`);
      
      return this.flowResults[flowName];
      
    } catch (error) {
      this.flowResults[flowName] = {
        flowName: 'Admin Navigation Workflow',
        success: false,
        error: error.message
      };
      
      this.reporter.addTestResult({
        name: flowName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Admin Navigation workflow failed: ${error.message}`);
    }
  }

  /**
   * Execute search and filter workflow
   * Flow: Search across all pages → Apply filters → Clear filters
   */
  async executeSearchAndFilterFlow() {
    const flowName = 'search-filter-flow';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', '🔄 Starting Search and Filter workflow');
      
      const flowSteps = {};
      const pages = [
        { name: 'projects', searchTerm: 'project' },
        { name: 'quotes', searchTerm: 'quote' },
        { name: 'requests', searchTerm: 'request' }
      ];
      
      for (const pageInfo of pages) {
        const stepName = `search_${pageInfo.name}`;
        
        // Navigate to page
        await this.page.goto(`${this.baseUrl}/admin/${pageInfo.name}`);
        await this.testUtils.waitForDataLoad();
        
        // Perform search
        const searchResult = await this.testUtils.performSearch(pageInfo.searchTerm);
        
        // Apply filter (if available)
        let filterResult = null;
        try {
          filterResult = await this.testUtils.applyFilter('status', 'Active');
        } catch (error) {
          filterResult = false;
        }
        
        // Clear search
        await this.testUtils.performSearch('');
        
        flowSteps[stepName] = {
          action: `Search and filter on ${pageInfo.name}`,
          success: searchResult >= 0,
          searchTerm: pageInfo.searchTerm,
          searchResults: searchResult,
          filterApplied: filterResult,
          page: pageInfo.name
        };
        
        await this.reporter.captureScreenshot(this.page, `${flowName}-${stepName}`, 'info', `Search and filter on ${pageInfo.name}`);
      }
      
      // Calculate flow success
      const flowSuccess = Object.values(flowSteps).every(step => step.success);
      
      this.flowResults[flowName] = {
        flowName: 'Search and Filter Workflow',
        success: flowSuccess,
        steps: flowSteps,
        duration: new Date().toISOString()
      };
      
      this.reporter.addTestResult({
        name: flowName,
        status: flowSuccess ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: this.flowResults[flowName]
      });
      
      this.reporter.logMessage('info', `🔄 Search and Filter workflow ${flowSuccess ? 'completed successfully' : 'failed'}`);
      
      return this.flowResults[flowName];
      
    } catch (error) {
      this.flowResults[flowName] = {
        flowName: 'Search and Filter Workflow',
        success: false,
        error: error.message
      };
      
      this.reporter.addTestResult({
        name: flowName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Search and Filter workflow failed: ${error.message}`);
    }
  }

  /**
   * Execute responsive workflow
   * Flow: Test each page at different breakpoints
   */
  async executeResponsiveFlow(breakpoints) {
    const flowName = 'responsive-flow';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', '🔄 Starting Responsive workflow');
      
      const flowSteps = {};
      const pages = ['projects', 'quotes', 'requests'];
      
      for (const breakpoint of breakpoints) {
        const stepName = `responsive_${breakpoint.name}`;
        
        // Set viewport
        await this.page.setViewport({
          width: breakpoint.width,
          height: breakpoint.height
        });
        
        const pageResults = {};
        
        for (const pageName of pages) {
          // Navigate to page
          await this.page.goto(`${this.baseUrl}/admin/${pageName}`);
          await this.testUtils.waitForDataLoad();
          
          // Take screenshot at this breakpoint
          await this.reporter.captureScreenshot(this.page, `${flowName}-${stepName}-${pageName}`, 'info', `${pageName} at ${breakpoint.name}`);
          
          // Check layout
          const hasData = await this.page.$$eval('tr, .MuiCard-root', elements => elements.length > 0);
          
          pageResults[pageName] = {
            hasData,
            success: hasData
          };
        }
        
        flowSteps[stepName] = {
          action: `Test all pages at ${breakpoint.name} breakpoint`,
          success: Object.values(pageResults).every(result => result.success),
          breakpoint,
          pageResults
        };
      }
      
      // Calculate flow success
      const flowSuccess = Object.values(flowSteps).every(step => step.success);
      
      this.flowResults[flowName] = {
        flowName: 'Responsive Workflow',
        success: flowSuccess,
        steps: flowSteps,
        duration: new Date().toISOString()
      };
      
      this.reporter.addTestResult({
        name: flowName,
        status: flowSuccess ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: this.flowResults[flowName]
      });
      
      this.reporter.logMessage('info', `🔄 Responsive workflow ${flowSuccess ? 'completed successfully' : 'failed'}`);
      
      return this.flowResults[flowName];
      
    } catch (error) {
      this.flowResults[flowName] = {
        flowName: 'Responsive Workflow',
        success: false,
        error: error.message
      };
      
      this.reporter.addTestResult({
        name: flowName,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Responsive workflow failed: ${error.message}`);
    }
  }

  /**
   * Execute all user flows
   */
  async executeAllFlows(breakpoints) {
    const allFlowsStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', '🚀 Starting all user flow sequences');
      
      const flows = {};
      
      // Execute each flow
      flows.requestToProject = await this.executeRequestToProjectFlow();
      flows.adminNavigation = await this.executeAdminNavigationFlow();
      flows.searchAndFilter = await this.executeSearchAndFilterFlow();
      flows.responsive = await this.executeResponsiveFlow(breakpoints);
      
      // Calculate overall success
      const allFlowsSuccess = Object.values(flows).every(flow => flow.success);
      
      const allFlowsResult = {
        allFlowsSuccess,
        flowCount: Object.keys(flows).length,
        passedFlows: Object.values(flows).filter(flow => flow.success).length,
        failedFlows: Object.values(flows).filter(flow => !flow.success).length,
        flows
      };
      
      this.reporter.addTestResult({
        name: 'all-user-flows',
        status: allFlowsSuccess ? 'passed' : 'failed',
        startTime: allFlowsStart,
        endTime: new Date().toISOString(),
        details: allFlowsResult
      });
      
      this.reporter.logMessage('info', `🚀 All user flows completed: ${allFlowsResult.passedFlows}/${allFlowsResult.flowCount} passed`);
      
      return allFlowsResult;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: 'all-user-flows',
        status: 'error',
        startTime: allFlowsStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`User flows execution failed: ${error.message}`);
    }
  }

  /**
   * Get flow results summary
   */
  getFlowResults() {
    return this.flowResults;
  }
}

module.exports = UserFlowSequencer;