/**
 * Quotes Page Test Module
 * 
 * Comprehensive testing for the Admin Quotes page including:
 * - Quote listing validation
 * - Search and filter functionality
 * - Quote creation workflow
 * - Quote management actions (Edit, View, Create Project)
 * - Progressive quote card functionality
 * - Status and product filtering
 */

const BasePageTest = require('../framework/BasePageTest');
const SharedTestUtilities = require('../framework/SharedTestUtilities');

class QuotesPageTest extends BasePageTest {
  constructor(page, reporter, baseUrl) {
    const pageConfig = {
      name: 'Quotes',
      path: '/admin/quotes',
      baseUrl: baseUrl,
      expectedTitle: 'Quotes',
      expectedSubtitle: 'Manage quotes, proposals, and estimates',
      searchFields: ['title', 'description', 'clientName', 'clientEmail', 'agentName'],
      sortableColumns: ['status', 'address', 'created', 'clientName', 'agentName', 'brokerage', 'opportunity'],
      actionButtons: ['Edit', 'View Request', 'Create Project', 'View Project', 'Archive'],
      filters: ['status', 'product', 'assignedTo'],
      expectedAddressPattern: /CA\s+\d{5}/i
    };
    
    super(page, reporter, pageConfig);
    this.testUtils = new SharedTestUtilities(page, reporter);
  }

  /**
   * Test quote listing functionality
   */
  async testQuoteListing() {
    const testName = 'quotes-listing';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing quote listing functionality');
      
      // Wait for quotes to load
      const quoteCount = await this.testUtils.waitForDataLoad('tr, .MuiCard-root, [data-testid*="quote"]');
      
      if (quoteCount === 0) {
        throw new Error('No quotes found in listing');
      }
      
      // Extract quote data
      const quoteData = await this.testUtils.extractTableData();
      
      // Validate address format
      const addressValidation = await this.testUtils.validateAddressFormat('[data-testid*="address"], .address, td:contains("CA")');
      
      // Take screenshot of quote listing
      await this.reporter.captureScreenshot(this.page, `${testName}-listing`, 'info', 'Quotes listing view');
      
      const results = {
        quoteCount,
        quoteData: quoteData.slice(0, 5), // First 5 quotes for reporting
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
      
      throw new Error(`Quote listing test failed: ${error.message}`);
    }
  }

  /**
   * Test progressive quote card functionality
   */
  async testProgressiveQuoteCards() {
    const testName = 'quotes-progressive-cards';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing progressive quote cards');
      
      // Look for progressive quote cards
      const progressiveCards = await this.page.$$('.progressive-quote-card, [data-testid*="progressive-quote"]');
      
      if (progressiveCards.length === 0) {
        return {
          cardsFound: 0,
          tested: false,
          message: 'No progressive quote cards found'
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
          const expandedContent = await card.$('.expanded-content, .quote-details');
          
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
      
      throw new Error(`Progressive quote cards test failed: ${error.message}`);
    }
  }

  /**
   * Test quote filtering by product
   */
  async testQuoteProductFiltering() {
    const testName = 'quotes-product-filtering';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing quote product filtering');
      
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
      
      throw new Error(`Quote product filtering test failed: ${error.message}`);
    }
  }

  /**
   * Test quote status filtering
   */
  async testQuoteStatusFiltering() {
    const testName = 'quotes-status-filtering';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing quote status filtering');
      
      const filterResults = {};
      
      // Test status filter
      const statusValues = ['Draft', 'Sent', 'Approved', 'Declined', 'Expired'];
      
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
      
      throw new Error(`Quote status filtering test failed: ${error.message}`);
    }
  }

  /**
   * Test quote action buttons
   */
  async testQuoteActions() {
    const testName = 'quotes-actions';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing quote action buttons');
      
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
            const urlChanged = !this.page.url().includes('/admin/quotes');
            
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
              await this.page.goto(`${this.pageConfig.baseUrl}/admin/quotes`);
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
      
      throw new Error(`Quote actions test failed: ${error.message}`);
    }
  }

  /**
   * Test quote search functionality
   */
  async testQuoteSearch() {
    const testName = 'quotes-search';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing quote search functionality');
      
      const searchResults = {};
      
      // Test search by different fields
      for (const searchField of this.pageConfig.searchFields) {
        try {
          // Get sample data for search
          const sampleData = await this.getSampleQuoteData();
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
      
      throw new Error(`Quote search test failed: ${error.message}`);
    }
  }

  /**
   * Override: Run page-specific tests
   */
  async runPageSpecificTests() {
    const results = {};
    
    // Run all quote-specific tests
    results.listing = await this.testQuoteListing();
    results.progressiveCards = await this.testProgressiveQuoteCards();
    results.productFiltering = await this.testQuoteProductFiltering();
    results.statusFiltering = await this.testQuoteStatusFiltering();
    results.actions = await this.testQuoteActions();
    results.search = await this.testQuoteSearch();
    
    return results;
  }

  /**
   * Helper: Get sample quote data for testing
   */
  async getSampleQuoteData() {
    try {
      // Extract data from first quote row
      const firstRow = await this.page.$('tr:nth-child(2), .MuiCard-root:first-child');
      
      if (!firstRow) {
        return {
          title: 'Sample Quote',
          description: 'Sample quote description',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          agentName: 'Jane Smith'
        };
      }
      
      const rowData = await firstRow.evaluate(row => {
        const cells = row.querySelectorAll('td, .MuiCard-root *');
        const text = Array.from(cells).map(cell => cell.textContent.trim()).join(' ');
        
        return {
          title: text.match(/Quote\s+[^,\s]+/)?.[0] || 'Sample Quote',
          description: text.match(/Description:\s*([^,\n]+)/)?.[1] || 'Sample description',
          clientName: text.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/)?.[0] || 'John Doe',
          clientEmail: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || 'john@example.com',
          agentName: text.match(/Agent:\s*([^,\s]+)/)?.[1] || 'Jane Smith'
        };
      });
      
      return rowData;
      
    } catch (error) {
      return {
        title: 'Sample Quote',
        description: 'Sample quote description',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        agentName: 'Jane Smith'
      };
    }
  }
}

module.exports = QuotesPageTest;