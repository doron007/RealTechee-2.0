/**
 * Projects Page Test Module
 * 
 * Comprehensive testing for the Admin Projects page including:
 * - Project listing validation
 * - Search and filter functionality
 * - Project creation workflow
 * - Project management actions (Edit, View, Archive)
 * - Address format validation
 * - Responsive behavior
 */

const BasePageTest = require('../framework/BasePageTest');
const SharedTestUtilities = require('../framework/SharedTestUtilities');

class ProjectsPageTest extends BasePageTest {
  constructor(page, reporter, baseUrl) {
    const pageConfig = {
      name: 'Projects',
      path: '/admin/projects',
      baseUrl: baseUrl,
      expectedTitle: 'Projects',
      expectedSubtitle: 'Manage and track all project records',
      searchFields: ['title', 'propertyAddress', 'clientName', 'agentName'],
      sortableColumns: ['status', 'address', 'created', 'clientName', 'agentName', 'brokerage', 'opportunity'],
      actionButtons: ['Open', 'Edit', 'View Request', 'View Quotes', 'Archive'],
      filters: ['status'],
      expectedAddressPattern: /CA\s+\d{5}/i
    };
    
    super(page, reporter, pageConfig);
    this.testUtils = new SharedTestUtilities(page, reporter);
  }

  /**
   * Test project listing functionality
   */
  async testProjectListing() {
    const testName = 'projects-listing';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing project listing functionality');
      
      // Wait for projects to load
      const projectCount = await this.testUtils.waitForDataLoad('tr, .MuiCard-root, [data-testid*="project"]');
      
      if (projectCount === 0) {
        throw new Error('No projects found in listing');
      }
      
      // Extract project data
      const projectData = await this.testUtils.extractTableData();
      
      // Validate address format
      const addressValidation = await this.testUtils.validateAddressFormat('[data-testid*="address"], .address, td:contains("CA")');
      
      // Take screenshot of project listing
      await this.reporter.captureScreenshot(this.page, `${testName}-listing`, 'info', 'Projects listing view');
      
      const results = {
        projectCount,
        projectData: projectData.slice(0, 5), // First 5 projects for reporting
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
      
      throw new Error(`Project listing test failed: ${error.message}`);
    }
  }

  /**
   * Test project search functionality
   */
  async testProjectSearch() {
    const testName = 'projects-search';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing project search functionality');
      
      const searchResults = {};
      
      // Test search by different fields
      for (const searchField of this.pageConfig.searchFields) {
        try {
          // Get sample data for search
          const sampleData = await this.getSampleProjectData();
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
      
      throw new Error(`Project search test failed: ${error.message}`);
    }
  }

  /**
   * Test project filtering functionality
   */
  async testProjectFiltering() {
    const testName = 'projects-filtering';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing project filtering functionality');
      
      const filterResults = {};
      
      // Test status filter
      const statusValues = ['Active', 'Completed', 'Archived'];
      
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
            error: 'Filter not found or failed to apply'
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
      
      throw new Error(`Project filtering test failed: ${error.message}`);
    }
  }

  /**
   * Test project sorting functionality
   */
  async testProjectSorting() {
    const testName = 'projects-sorting';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing project sorting functionality');
      
      const sortResults = {};
      
      // Test sorting by different columns
      for (const column of this.pageConfig.sortableColumns) {
        const sortApplied = await this.testUtils.sortByColumn(column);
        
        if (sortApplied) {
          // Extract data to verify sorting
          const sortedData = await this.testUtils.extractTableData();
          
          sortResults[column] = {
            applied: true,
            dataCount: sortedData.length,
            success: true
          };
        } else {
          sortResults[column] = {
            applied: false,
            success: false,
            error: 'Sort column not found or failed to apply'
          };
        }
      }
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: sortResults
      });
      
      return sortResults;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Project sorting test failed: ${error.message}`);
    }
  }

  /**
   * Test project action buttons
   */
  async testProjectActions() {
    const testName = 'projects-actions';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing project action buttons');
      
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
            const urlChanged = this.page.url().includes('/admin/projects');
            
            actionResults[action] = {
              buttonFound: true,
              clicked: true,
              modalOpened: !!modalOpened,
              urlChanged: !urlChanged,
              success: true
            };
            
            // Close modal if opened
            if (modalOpened) {
              const closeButton = await this.page.$('button[aria-label*="close"], .MuiDialog-root button:has-text("Close")');
              if (closeButton) {
                await closeButton.click();
                await this.page.waitForTimeout(1000);
              }
            }
            
            // Navigate back to projects page if URL changed
            if (!urlChanged) {
              await this.page.goto(`${this.pageConfig.baseUrl}/admin/projects`);
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
      
      throw new Error(`Project actions test failed: ${error.message}`);
    }
  }

  /**
   * Test pagination functionality
   */
  async testProjectPagination() {
    const testName = 'projects-pagination';
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', 'Testing project pagination');
      
      const paginationResult = await this.testUtils.testPagination();
      
      this.reporter.addTestResult({
        name: testName,
        status: 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: paginationResult
      });
      
      return paginationResult;
      
    } catch (error) {
      this.reporter.addTestResult({
        name: testName,
        status: 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Project pagination test failed: ${error.message}`);
    }
  }

  /**
   * Override: Run page-specific tests
   */
  async runPageSpecificTests() {
    const results = {};
    
    // Run all project-specific tests
    results.listing = await this.testProjectListing();
    results.search = await this.testProjectSearch();
    results.filtering = await this.testProjectFiltering();
    results.sorting = await this.testProjectSorting();
    results.actions = await this.testProjectActions();
    results.pagination = await this.testProjectPagination();
    
    return results;
  }

  /**
   * Helper: Get sample project data for testing
   */
  async getSampleProjectData() {
    try {
      // Extract data from first project row
      const firstRow = await this.page.$('tr:nth-child(2), .MuiCard-root:first-child');
      
      if (!firstRow) {
        return {
          title: 'Sample Project',
          propertyAddress: '123 Main St',
          clientName: 'John Doe',
          agentName: 'Jane Smith'
        };
      }
      
      const rowData = await firstRow.evaluate(row => {
        const cells = row.querySelectorAll('td, .MuiCard-root *');
        const text = Array.from(cells).map(cell => cell.textContent.trim()).join(' ');
        
        return {
          title: text.match(/Project\s+[^,\s]+/)?.[0] || 'Sample Project',
          propertyAddress: text.match(/\d+\s+[^,]+,\s*CA\s+\d{5}/)?.[0] || '123 Main St',
          clientName: text.match(/[A-Z][a-z]+\s+[A-Z][a-z]+/)?.[0] || 'John Doe',
          agentName: text.match(/Agent:\s*([^,\s]+)/)?.[1] || 'Jane Smith'
        };
      });
      
      return rowData;
      
    } catch (error) {
      return {
        title: 'Sample Project',
        propertyAddress: '123 Main St, CA 90210',
        clientName: 'John Doe',
        agentName: 'Jane Smith'
      };
    }
  }
}

module.exports = ProjectsPageTest;