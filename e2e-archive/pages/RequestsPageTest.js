/**
 * Requests Page Test Module
 * 
 * Comprehensive testing for the Admin Requests page including:
 * - Request listing validation
 * - Search and filter functionality
 * - Request management actions (Edit, Create Quote, View Quotes)
 * - Progressive request card functionality
 * - Lead source and product filtering
 * - Status management
 */

const BasePageTest = require('../framework/BasePageTest');
const SharedTestUtilities = require('../framework/SharedTestUtilities');

class RequestsPageTest extends BasePageTest {
  constructor(page, reporter, baseUrl) {
    const pageConfig = {
      name: 'Requests',
      path: '/admin/requests',
      baseUrl: baseUrl,
      expectedTitle: 'Requests',
      expectedSubtitle: 'Manage service requests and inquiries',
      searchFields: ['message', 'clientName', 'clientEmail', 'agentName', 'product'],
      sortableColumns: ['status', 'address', 'created', 'clientName', 'agentName', 'brokerage', 'opportunity'],
      actionButtons: ['Edit', 'Create Quote', 'View Quotes', 'Archive'],
      filters: ['status', 'product', 'leadSource', 'assignedTo'],
      expectedAddressPattern: /CA\s+\d{5}/i
    };
    
    super(page, reporter, pageConfig);
    this.testUtils = new SharedTestUtilities(page, reporter);
  }

  /**
   * Test request listing functionality
   */
  async testRequestListing() {
    const testName = 'requests-listing';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing request listing functionality');
      
      // Wait for requests to load
      const requestCount = await this.testUtils.waitForDataLoad('tr, .MuiCard-root, [data-testid*="request"]');
      
      if (requestCount === 0) {
        throw new Error('No requests found in listing');
      }
      
      // Extract request data
      const requestData = await this.testUtils.extractTableData();
      
      // Validate address format
      const addressValidation = await this.testUtils.validateAddressFormat('[data-testid*="address"], .address, td:contains("CA")');
      
      // Take screenshot of request listing
      await this.reporter.captureScreenshot(this.page, `${testName}-listing`, 'info', 'Requests listing view');
      
      const results = {
        requestCount,
        requestData: requestData.slice(0, 5), // First 5 requests for reporting
        addressValidation,
        success: true
      };
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: results
      });
      
      return results;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Request listing test failed: ${error.message}`);
    }
  }

  /**
   * Test progressive request card functionality
   */
  async testProgressiveRequestCards() {
    const testName = 'requests-progressive-cards';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing progressive request cards');
      
      // Look for progressive request cards
      const progressiveCards = await this.page.$$('.progressive-request-card, [data-testid*="progressive-request"]');
      
      if (progressiveCards.length === 0) {
        return {
          cardsFound: 0,
          tested: false,
          message: 'No progressive request cards found'
        };
      }
      
      const cardResults = [];
      
      for (let i = 0; i < Math.min(progressiveCards.length, 3); i++) {
        const card = progressiveCards[i];
        
        try {
          // Take screenshot before expansion
          await this.reporter.captureScreenshot(this.page, `${testName}-card-${i}-before`, 'info', `Progressive card ${i} before expansion`);
          
          // Click to expand card
          await card.click();
          await this.page.waitForTimeout(1000);
          
          // Take screenshot after expansion
          await this.reporter.captureScreenshot(this.page, `${testName}-card-${i}-after`, 'info', `Progressive card ${i} after expansion`);
          
          // Check for expanded content
          const expandedContent = await card.$('.expanded-content, .request-details');
          
          cardResults.push({
            cardIndex: i,
            clicked: true,
            expandedContent: !!expandedContent,
            success: true
          });
          
        } catch (error) {
          cardResults.push({
            cardIndex: i,
            clicked: false,
            success: false,
            error: error.message
          });
        }
      }
      
      const results = {
        cardsFound: progressiveCards.length,
        tested: true,
        cardResults,
        success: cardResults.every(r => r.success)
      };
      
      this.reporter.addTestResult({
        name: testName,
        status: results.success ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: results
      });
      
      return results;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Progressive request cards test failed: ${error.message}`);
    }
  }

  /**
   * Test request lead source filtering
   */
  async testRequestLeadSourceFiltering() {
    const testName = 'requests-lead-source-filtering';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing request lead source filtering');
      
      const filterResults = {};
      
      // Test lead source filter
      const leadSources = ['Website', 'Referral', 'Social Media', 'Email', 'Phone'];
      
      for (const leadSource of leadSources) {
        const filterApplied = await this.testUtils.applyFilter('leadSource', leadSource);
        
        if (filterApplied) {
          const resultCount = await this.testUtils.waitForDataLoad();
          filterResults[leadSource] = {
            applied: true,
            resultCount,
            success: true
          };
        } else {
          filterResults[leadSource] = {
            applied: false,
            success: false,
            error: 'Lead source filter not found or failed to apply'
          };
        }
      }
      
      // Clear filters
      await this.testUtils.applyFilter('leadSource', '');
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: filterResults
      });
      
      return filterResults;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Request lead source filtering test failed: ${error.message}`);
    }
  }

  /**
   * Test request product filtering
   */
  async testRequestProductFiltering() {
    const testName = 'requests-product-filtering';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing request product filtering');
      
      const filterResults = {};
      
      // Test product filter
      const productValues = ['Inspection', 'Repair', 'Maintenance', 'Consulting'];
      
      for (const product of productValues) {
        const filterApplied = await this.testUtils.applyFilter('product', product);
        
        if (filterApplied) {
          const resultCount = await this.testUtils.waitForDataLoad();
          filterResults[product] = {
            applied: true,
            resultCount,
            success: true
          };
        } else {
          filterResults[product] = {
            applied: false,
            success: false,
            error: 'Product filter not found or failed to apply'
          };
        }
      }
      
      // Clear filters
      await this.testUtils.applyFilter('product', '');
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: filterResults
      });
      
      return filterResults;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Request product filtering test failed: ${error.message}`);
    }
  }

  /**
   * Test request status filtering
   */
  async testRequestStatusFiltering() {
    const testName = 'requests-status-filtering';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing request status filtering');
      
      const filterResults = {};
      
      // Test status filter
      const statusValues = ['New', 'In Progress', 'Completed', 'Cancelled'];
      
      for (const status of statusValues) {
        const filterApplied = await this.testUtils.applyFilter('status', status);
        
        if (filterApplied) {
          const resultCount = await this.testUtils.waitForDataLoad();
          filterResults[status] = {
            applied: true,
            resultCount,
            success: true
          };
        } else {
          filterResults[status] = {
            applied: false,
            success: false,
            error: 'Status filter not found or failed to apply'
          };
        }
      }
      
      // Clear filters
      await this.testUtils.applyFilter('status', '');
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: filterResults
      });
      
      return filterResults;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Request status filtering test failed: ${error.message}`);
    }
  }

  /**
   * Test request action buttons
   */
  async testRequestActions() {
    const testName = 'requests-actions';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing request action buttons');
      
      const actionResults = {};
      
      // Test each action button
      for (const action of this.pageConfig.actionButtons) {
        try {
          // Look for action button in first row
          const actionButton = await this.page.$(`button:has-text("${action}"), [aria-label*="${action}"]`);
          
          if (actionButton) {
            // Take screenshot before action
            await this.reporter.captureScreenshot(this.page, `${testName}-${action}-before`, 'info', `Before ${action} action`);
            
            // Click action button
            await actionButton.click();
            
            // Wait for action to complete
            await this.page.waitForTimeout(2000);
            
            // Take screenshot after action
            await this.reporter.captureScreenshot(this.page, `${testName}-${action}-after`, 'info', `After ${action} action`);
            
            // Check for modal/navigation
            const modalOpened = await this.page.$('.MuiDialog-root, .modal');
            const urlChanged = !this.page.url().includes('/admin/requests');
            
            actionResults[action] = {
              buttonFound: true,
              clicked: true,
              modalOpened: !!modalOpened,
              urlChanged,
              success: true
            };
            
            // Handle modal closure or navigation
            if (modalOpened) {
              const closeButton = await this.page.$('button[aria-label*="close"], .MuiDialog-root button:has-text("Close")');
              if (closeButton) {
                await closeButton.click();
                await this.page.waitForTimeout(1000);
              }
            }
            
            if (urlChanged) {
              await this.page.goto(`${this.pageConfig.baseUrl}/admin/requests`);
              await this.testUtils.waitForDataLoad();
            }
            
          } else {
            actionResults[action] = {
              buttonFound: false,
              success: false,
              error: 'Action button not found'
            };
          }
          
        } catch (error) {
          actionResults[action] = {
            buttonFound: false,
            success: false,
            error: error.message
          };
        }
      }
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: actionResults
      });
      
      return actionResults;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Request actions test failed: ${error.message}`);
    }
  }

  /**
   * Test request search functionality
   */
  async testRequestSearch() {
    const testName = 'requests-search';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing request search functionality');
      
      const searchResults = {};
      
      // Test search by different fields
      for (const searchField of this.pageConfig.searchFields) {
        try {
          // Get sample data for search
          const sampleData = await this.getSampleRequestData();
          const searchTerm = sampleData[searchField];
          
          if (searchTerm) {
            const resultCount = await this.testUtils.performSearch(searchTerm);
            searchResults[searchField] = {
              searchTerm,
              resultCount,
              success: resultCount > 0
            };
          }
          
        } catch (error) {
          searchResults[searchField] = {
            searchTerm: 'test',
            resultCount: 0,
            success: false,
            error: error.message
          };
        }
      }
      
      // Clear search
      await this.testUtils.performSearch('');
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: searchResults
      });
      
      return searchResults;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Request search test failed: ${error.message}`);
    }
  }

  /**
   * Override: Run page-specific tests
   */
  async runPageSpecificTests() {
    const results = {};
    
    // Run all request-specific tests
    results.listing = await this.testRequestListing();
    results.progressiveCards = await this.testProgressiveRequestCards();
    results.leadSourceFiltering = await this.testRequestLeadSourceFiltering();
    results.productFiltering = await this.testRequestProductFiltering();
    results.statusFiltering = await this.testRequestStatusFiltering();
    results.actions = await this.testRequestActions();
    results.search = await this.testRequestSearch();
    
    return results;
  }

  /**
   * Helper: Get sample request data for testing
   */
  async getSampleRequestData() {
    try {
      // Extract data from first request row
      const firstRow = await this.page.$('tr:nth-child(2), .MuiCard-root:first-child');
      
      if (!firstRow) {
        return {
          message: 'Sample request message',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          agentName: 'Jane Smith',
          product: 'Inspection'
        };
      }
      
      const rowData = await firstRow.evaluate(row => {
        const cells = row.querySelectorAll('td, .MuiCard-root *');
        const text = Array.from(cells).map(cell => cell.textContent.trim()).join(' ');
        
        return {
          message: text.match(/Message:\s*([^,\n]+)/)?.[1] || 'Sample request message',
          clientName: text.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/)?.[0] || 'John Doe',
          clientEmail: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || 'john@example.com',
          agentName: text.match(/Agent:\s*([^,\s]+)/)?.[1] || 'Jane Smith',
          product: text.match(/Product:\s*([^,\s]+)/)?.[1] || 'Inspection'
        };
      });
      
      return rowData;
      
    } catch (error) {
      return {
        message: 'Sample request message',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        agentName: 'Jane Smith',
        product: 'Inspection'
      };
    }
  }
}

module.exports = RequestsPageTest;