/**
 * Shared Test Utilities
 * 
 * Common functions and utilities used across all page tests including:
 * - Authentication helpers
 * - Data interaction utilities
 * - UI element helpers
 * - Validation helpers
 * - Screenshot utilities
 */

class SharedTestUtilities {
  constructor(page, reporter) {
    this.page = page;
    this.reporter = reporter;
  }

  /**
   * Authenticate user with given credentials
   */
  async authenticateUser(credentials, baseUrl) {
    try {
      this.reporter.logMessage('info', `Authenticating user: ${credentials.email}`);
      
      // Navigate to login page
      await this.page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
      
      // Fill login form
      await this.page.fill('input[name="email"], input[type="email"]', credentials.email);
      await this.page.fill('input[name="password"], input[type="password"]', credentials.password);
      
      // Take screenshot before login
      await this.reporter.captureScreenshot(this.page, 'login-attempt', 'info', 'Login form filled');
      
      // Submit login
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      // Verify login success
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        throw new Error('Authentication failed - still on login page');
      }
      
      // Take screenshot after successful login
      await this.reporter.captureScreenshot(this.page, 'login-success', 'info', 'Login successful');
      
      this.reporter.logMessage('info', 'Authentication successful');
      return true;
      
    } catch (error) {
      await this.reporter.captureScreenshot(this.page, 'login-failed', 'errors', 'Login failed');
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Wait for data to load with retry logic
   */
  async waitForDataLoad(dataSelector = 'tr, .MuiCard-root, [data-testid*="card"]', timeout = 10000) {
    try {
      await this.page.waitForSelector(dataSelector, { timeout });
      
      // Wait additional time for data to fully render
      await this.page.waitForTimeout(2000);
      
      // Count data elements
      const dataCount = await this.page.$$eval(dataSelector, elements => elements.length);
      
      this.reporter.logMessage('info', `Data loaded: ${dataCount} elements found`);
      return dataCount;
      
    } catch (error) {
      throw new Error(`Data load timeout: ${error.message}`);
    }
  }

  /**
   * Search for specific content
   */
  async performSearch(searchTerm, searchSelector = 'input[type="search"], input[placeholder*="search" i]') {
    try {
      this.reporter.logMessage('info', `Performing search: "${searchTerm}"`);
      
      // Clear and fill search input
      await this.page.fill(searchSelector, '');
      await this.page.fill(searchSelector, searchTerm);
      
      // Submit search
      await this.page.keyboard.press('Enter');
      
      // Wait for search results
      await this.page.waitForTimeout(2000);
      
      // Take screenshot of search results
      await this.reporter.captureScreenshot(this.page, `search-${searchTerm}`, 'info', `Search results for: ${searchTerm}`);
      
      // Count results
      const resultCount = await this.page.$$eval('tr, .MuiCard-root', elements => elements.length);
      
      this.reporter.logMessage('info', `Search results: ${resultCount} items found`);
      return resultCount;
      
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Filter data by specific criteria
   */
  async applyFilter(filterType, filterValue) {
    try {
      this.reporter.logMessage('info', `Applying filter: ${filterType} = ${filterValue}`);
      
      // Look for filter dropdown
      const filterSelector = `select[name="${filterType}"], [data-testid="${filterType}-filter"]`;
      
      await this.page.waitForSelector(filterSelector, { timeout: 5000 });
      await this.page.selectOption(filterSelector, filterValue);
      
      // Wait for filter to apply
      await this.page.waitForTimeout(2000);
      
      // Take screenshot of filtered results
      await this.reporter.captureScreenshot(this.page, `filter-${filterType}-${filterValue}`, 'info', `Filter applied: ${filterType} = ${filterValue}`);
      
      return true;
      
    } catch (error) {
      this.reporter.logMessage('warn', `Filter not found or failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Sort data by column
   */
  async sortByColumn(columnName) {
    try {
      this.reporter.logMessage('info', `Sorting by column: ${columnName}`);
      
      // Look for sortable column header
      const headerSelector = `th:has-text("${columnName}"), .MuiTableCell-head:has-text("${columnName}")`;
      
      await this.page.click(headerSelector);
      
      // Wait for sort to apply
      await this.page.waitForTimeout(2000);
      
      // Take screenshot of sorted results
      await this.reporter.captureScreenshot(this.page, `sort-${columnName}`, 'info', `Sorted by: ${columnName}`);
      
      return true;
      
    } catch (error) {
      this.reporter.logMessage('warn', `Sort failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Click button and wait for action
   */
  async clickButtonAndWait(buttonSelector, waitCondition = null) {
    try {
      // Take screenshot before click
      await this.reporter.captureScreenshot(this.page, 'before-button-click', 'info', `Before clicking: ${buttonSelector}`);
      
      // Click button
      await this.page.click(buttonSelector);
      
      // Wait for condition or default timeout
      if (waitCondition) {
        await this.page.waitForSelector(waitCondition, { timeout: 5000 });
      } else {
        await this.page.waitForTimeout(1000);
      }
      
      // Take screenshot after click
      await this.reporter.captureScreenshot(this.page, 'after-button-click', 'info', `After clicking: ${buttonSelector}`);
      
      return true;
      
    } catch (error) {
      throw new Error(`Button click failed: ${error.message}`);
    }
  }

  /**
   * Fill form with data
   */
  async fillForm(formData, formSelector = 'form') {
    try {
      this.reporter.logMessage('info', `Filling form with data`);
      
      // Take screenshot before filling
      await this.reporter.captureScreenshot(this.page, 'before-form-fill', 'info', 'Form before filling');
      
      for (const [fieldName, value] of Object.entries(formData)) {
        const fieldSelector = `${formSelector} input[name="${fieldName}"], ${formSelector} textarea[name="${fieldName}"], ${formSelector} select[name="${fieldName}"]`;
        
        try {
          await this.page.fill(fieldSelector, value);
          this.reporter.logMessage('info', `Filled field: ${fieldName} = ${value}`);
        } catch (error) {
          this.reporter.logMessage('warn', `Could not fill field: ${fieldName} - ${error.message}`);
        }
      }
      
      // Take screenshot after filling
      await this.reporter.captureScreenshot(this.page, 'after-form-fill', 'info', 'Form after filling');
      
      return true;
      
    } catch (error) {
      throw new Error(`Form filling failed: ${error.message}`);
    }
  }

  /**
   * Validate that elements contain expected text
   */
  async validateElementsContainText(selector, expectedTexts) {
    try {
      const elements = await this.page.$$(selector);
      const actualTexts = await Promise.all(
        elements.map(element => element.textContent())
      );
      
      const validationResults = [];
      
      for (const expectedText of expectedTexts) {
        const found = actualTexts.some(text => text.includes(expectedText));
        validationResults.push({
          expectedText,
          found,
          status: found ? 'passed' : 'failed'
        });
      }
      
      return validationResults;
      
    } catch (error) {
      throw new Error(`Text validation failed: ${error.message}`);
    }
  }

  /**
   * Validate address format (specific to RealTechee)
   */
  async validateAddressFormat(addressSelector = '[data-testid*="address"], .address') {
    try {
      const addresses = await this.page.$$eval(addressSelector, elements => 
        elements.map(el => el.textContent.trim())
      );
      
      const addressPattern = /CA\s+\d{5}/i;
      const validationResults = [];
      
      for (const address of addresses) {
        const isValid = addressPattern.test(address);
        validationResults.push({
          address,
          isValid,
          status: isValid ? 'passed' : 'failed'
        });
      }
      
      return validationResults;
      
    } catch (error) {
      throw new Error(`Address validation failed: ${error.message}`);
    }
  }

  /**
   * Test pagination functionality
   */
  async testPagination() {
    try {
      this.reporter.logMessage('info', 'Testing pagination functionality');
      
      // Look for pagination controls
      const paginationSelector = '.MuiPagination-root, .pagination, [data-testid*="pagination"]';
      
      const paginationExists = await this.page.$(paginationSelector);
      if (!paginationExists) {
        return { exists: false, message: 'No pagination found' };
      }
      
      // Take screenshot of first page
      await this.reporter.captureScreenshot(this.page, 'pagination-page-1', 'info', 'First page of results');
      
      // Click next page if available
      const nextButton = await this.page.$('button[aria-label*="next"], .MuiPagination-root button:not([disabled]):last-child');
      if (nextButton) {
        await nextButton.click();
        await this.page.waitForTimeout(2000);
        
        // Take screenshot of second page
        await this.reporter.captureScreenshot(this.page, 'pagination-page-2', 'info', 'Second page of results');
        
        return { exists: true, tested: true, message: 'Pagination tested successfully' };
      }
      
      return { exists: true, tested: false, message: 'Pagination exists but no next page available' };
      
    } catch (error) {
      throw new Error(`Pagination test failed: ${error.message}`);
    }
  }

  /**
   * Test modal/dialog functionality
   */
  async testModal(triggerSelector, modalSelector = '.MuiDialog-root, .modal') {
    try {
      this.reporter.logMessage('info', `Testing modal triggered by: ${triggerSelector}`);
      
      // Click trigger
      await this.page.click(triggerSelector);
      
      // Wait for modal to appear
      await this.page.waitForSelector(modalSelector, { timeout: 5000 });
      
      // Take screenshot of modal
      await this.reporter.captureScreenshot(this.page, 'modal-opened', 'info', 'Modal opened');
      
      // Close modal (try common close methods)
      const closeButton = await this.page.$('button[aria-label*="close"], .MuiDialog-root button:has-text("Close")');
      if (closeButton) {
        await closeButton.click();
      } else {
        // Try clicking outside modal
        await this.page.click('body');
      }
      
      // Wait for modal to close
      await this.page.waitForTimeout(1000);
      
      // Verify modal is closed
      const modalStillVisible = await this.page.$(modalSelector);
      const modalClosed = !modalStillVisible;
      
      return { opened: true, closed: modalClosed };
      
    } catch (error) {
      throw new Error(`Modal test failed: ${error.message}`);
    }
  }

  /**
   * Extract data from table/grid
   */
  async extractTableData(tableSelector = 'table, .MuiDataGrid-root') {
    try {
      const tableData = await this.page.$$eval(`${tableSelector} tr`, rows => {
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          return cells.map(cell => cell.textContent.trim());
        });
      });
      
      return tableData;
      
    } catch (error) {
      throw new Error(`Table data extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract data from card layout
   */
  async extractCardData(cardSelector = '.MuiCard-root, .card') {
    try {
      const cardData = await this.page.$$eval(cardSelector, cards => {
        return cards.map(card => {
          const title = card.querySelector('h1, h2, h3, h4, h5, h6, .MuiTypography-h1, .MuiTypography-h2, .MuiTypography-h3')?.textContent.trim();
          const content = card.querySelector('p, .MuiTypography-body1, .MuiTypography-body2')?.textContent.trim();
          const buttons = Array.from(card.querySelectorAll('button')).map(btn => btn.textContent.trim());
          
          return {
            title,
            content,
            buttons
          };
        });
      });
      
      return cardData;
      
    } catch (error) {
      throw new Error(`Card data extraction failed: ${error.message}`);
    }
  }

  /**
   * Check for console errors
   */
  async checkConsoleErrors() {
    try {
      const errors = await this.page.evaluate(() => {
        return window.consoleErrors || [];
      });
      
      return errors;
      
    } catch (error) {
      return [];
    }
  }

  /**
   * Wait for loading indicators to disappear
   */
  async waitForLoadingToComplete() {
    try {
      // Wait for common loading indicators to disappear
      const loadingSelectors = [
        '.MuiCircularProgress-root',
        '.loading',
        '.spinner',
        '[data-testid*="loading"]'
      ];
      
      for (const selector of loadingSelectors) {
        try {
          await this.page.waitForSelector(selector, { state: 'hidden', timeout: 5000 });
        } catch (error) {
          // Ignore if selector doesn't exist
        }
      }
      
      // Additional wait for any remaining async operations
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      // Don't throw error for loading indicators
      this.reporter.logMessage('warn', `Loading wait completed with issues: ${error.message}`);
    }
  }
}

module.exports = SharedTestUtilities;