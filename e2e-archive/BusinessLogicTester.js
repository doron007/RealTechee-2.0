const fs = require('fs');
const path = require('path');

/**
 * Business Logic Testing Framework
 * 
 * Provides comprehensive testing for all interactive elements, forms, 
 * buttons, and business workflows in the admin pages.
 */
class BusinessLogicTester {
  constructor(page, reporter) {
    this.page = page;
    this.reporter = reporter;
    this.testResults = [];
  }

  /**
   * Test all buttons on the page
   */
  async testAllButtons(testName) {
    const testStart = new Date().toISOString();
    
    try {
      // Screenshot before testing
      await this.reporter.captureScreenshot(this.page, `${testName}-buttons-before`, 'info', 'Page state before button testing');
      
      // Find all clickable elements
      const buttons = await this.page.$$eval('button, [role="button"], .MuiButton-root, input[type="submit"], input[type="button"]', 
        elements => elements.map(el => ({
          text: el.textContent?.trim() || el.value || el.getAttribute('aria-label') || 'Unknown',
          tagName: el.tagName,
          className: el.className,
          disabled: el.disabled,
          type: el.type || 'button',
          visible: el.offsetParent !== null,
          id: el.id,
          dataTestId: el.getAttribute('data-testid')
        }))
      );

      this.reporter.logMessage('info', `Found ${buttons.length} buttons to test`);
      
      const buttonResults = [];
      
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        
        if (!button.visible || button.disabled) {
          buttonResults.push({
            button: button.text,
            status: 'skipped',
            reason: button.disabled ? 'disabled' : 'not visible'
          });
          continue;
        }

        try {
          // Test button click
          const buttonSelector = this.getButtonSelector(button, i);
          
          // Wait for button to be clickable
          await this.page.waitForSelector(buttonSelector, { timeout: 5000 });
          
          // Take screenshot before click
          await this.reporter.captureScreenshot(this.page, `${testName}-button-${i}-before`, 'info', `Before clicking: ${button.text}`);
          
          // Click the button
          await this.page.click(buttonSelector);
          
          // Wait for potential page changes
          await this.page.waitForTimeout(1000);
          
          // Take screenshot after click
          await this.reporter.captureScreenshot(this.page, `${testName}-button-${i}-after`, 'info', `After clicking: ${button.text}`);
          
          // Check for errors in console
          const errors = await this.page.evaluate(() => {
            return window.console.errors || [];
          });
          
          buttonResults.push({
            button: button.text,
            status: errors.length > 0 ? 'failed' : 'passed',
            errors: errors,
            selector: buttonSelector
          });
          
          this.reporter.logMessage('info', `Button tested: ${button.text} - ${errors.length > 0 ? 'FAILED' : 'PASSED'}`);
          
        } catch (error) {
          buttonResults.push({
            button: button.text,
            status: 'error',
            error: error.message
          });
          
          this.reporter.logMessage('error', `Button test failed: ${button.text} - ${error.message}`);
        }
      }
      
      const passed = buttonResults.filter(r => r.status === 'passed').length;
      const failed = buttonResults.filter(r => r.status === 'failed').length;
      const errors = buttonResults.filter(r => r.status === 'error').length;
      
      this.reporter.addTestResult({
        name: `${testName}-button-testing`,
        status: (failed + errors) > 0 ? 'failed' : 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: {
          totalButtons: buttons.length,
          tested: buttonResults.length,
          passed,
          failed,
          errors,
          results: buttonResults
        }
      });
      
      return {
        success: (failed + errors) === 0,
        tested: buttonResults.length,
        passed,
        failed,
        errors,
        results: buttonResults
      };
      
    } catch (error) {
      this.reporter.addTestResult({
        name: `${testName}-button-testing`,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Button testing failed: ${error.message}`);
    }
  }

  /**
   * Test all forms on the page
   */
  async testAllForms(testName) {
    const testStart = new Date().toISOString();
    
    try {
      // Screenshot before testing
      await this.reporter.captureScreenshot(this.page, `${testName}-forms-before`, 'info', 'Page state before form testing');
      
      // Find all forms
      const forms = await this.page.$$eval('form', 
        elements => elements.map((form, index) => ({
          id: form.id || `form-${index}`,
          action: form.action,
          method: form.method,
          inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
            name: input.name,
            type: input.type,
            required: input.required,
            placeholder: input.placeholder,
            value: input.value
          }))
        }))
      );

      this.reporter.logMessage('info', `Found ${forms.length} forms to test`);
      
      const formResults = [];
      
      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        
        try {
          // Test form validation
          const formSelector = form.id ? `#${form.id}` : `form:nth-child(${i + 1})`;
          
          // Test each input in the form
          for (const input of form.inputs) {
            if (input.type === 'text' || input.type === 'email' || input.type === 'textarea') {
              // Test with valid data
              await this.page.fill(`${formSelector} [name="${input.name}"]`, 'test-data');
              
              // Test with invalid data if email
              if (input.type === 'email') {
                await this.page.fill(`${formSelector} [name="${input.name}"]`, 'invalid-email');
              }
            }
          }
          
          // Take screenshot after filling
          await this.reporter.captureScreenshot(this.page, `${testName}-form-${i}-filled`, 'info', `Form ${form.id} filled`);
          
          // Try to submit form
          await this.page.click(`${formSelector} [type="submit"]`);
          
          // Wait for response
          await this.page.waitForTimeout(2000);
          
          // Take screenshot after submit
          await this.reporter.captureScreenshot(this.page, `${testName}-form-${i}-submitted`, 'info', `Form ${form.id} submitted`);
          
          formResults.push({
            form: form.id,
            status: 'passed',
            inputs: form.inputs.length
          });
          
        } catch (error) {
          formResults.push({
            form: form.id,
            status: 'error',
            error: error.message
          });
        }
      }
      
      const passed = formResults.filter(r => r.status === 'passed').length;
      const failed = formResults.filter(r => r.status === 'failed').length;
      const errors = formResults.filter(r => r.status === 'error').length;
      
      this.reporter.addTestResult({
        name: `${testName}-form-testing`,
        status: (failed + errors) > 0 ? 'failed' : 'passed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: {
          totalForms: forms.length,
          tested: formResults.length,
          passed,
          failed,
          errors,
          results: formResults
        }
      });
      
      return {
        success: (failed + errors) === 0,
        tested: formResults.length,
        passed,
        failed,
        errors,
        results: formResults
      };
      
    } catch (error) {
      this.reporter.addTestResult({
        name: `${testName}-form-testing`,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Form testing failed: ${error.message}`);
    }
  }

  /**
   * Test CRUD operations (Create, Read, Update, Delete)
   */
  async testCRUDOperations(testName, pageConfig) {
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Testing CRUD operations for ${pageConfig.name}`);
      
      const crudResults = {
        create: await this.testCreateOperation(testName, pageConfig),
        read: await this.testReadOperation(testName, pageConfig),
        update: await this.testUpdateOperation(testName, pageConfig),
        delete: await this.testDeleteOperation(testName, pageConfig)
      };
      
      const allPassed = Object.values(crudResults).every(result => result.success);
      
      this.reporter.addTestResult({
        name: `${testName}-crud-operations`,
        status: allPassed ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: crudResults
      });
      
      return {
        success: allPassed,
        results: crudResults
      };
      
    } catch (error) {
      this.reporter.addTestResult({
        name: `${testName}-crud-operations`,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`CRUD testing failed: ${error.message}`);
    }
  }

  /**
   * Test search and filter functionality
   */
  async testSearchAndFilters(testName, pageConfig) {
    const testStart = new Date().toISOString();
    
    try {
      this.reporter.logMessage('info', `Testing search and filters for ${pageConfig.name}`);
      
      // Test search functionality
      const searchResults = await this.testSearchFunctionality(testName, pageConfig);
      
      // Test filter functionality
      const filterResults = await this.testFilterFunctionality(testName, pageConfig);
      
      // Test sorting functionality
      const sortResults = await this.testSortFunctionality(testName, pageConfig);
      
      const allPassed = searchResults.success && filterResults.success && sortResults.success;
      
      this.reporter.addTestResult({
        name: `${testName}-search-filters`,
        status: allPassed ? 'passed' : 'failed',
        startTime: testStart,
        endTime: new Date().toISOString(),
        details: {
          search: searchResults,
          filters: filterResults,
          sorting: sortResults
        }
      });
      
      return {
        success: allPassed,
        search: searchResults,
        filters: filterResults,
        sorting: sortResults
      };
      
    } catch (error) {
      this.reporter.addTestResult({
        name: `${testName}-search-filters`,
        status: 'error',
        startTime: testStart,
        endTime: new Date().toISOString(),
        error: error.message
      });
      
      throw new Error(`Search and filter testing failed: ${error.message}`);
    }
  }

  /**
   * Helper methods for specific operations
   */
  async testCreateOperation(testName, pageConfig) {
    try {
      // Look for "Create", "Add", "New" buttons
      const createButtons = await this.page.$$eval('button, [role="button"]', 
        elements => elements.filter(el => 
          /create|add|new|\+/i.test(el.textContent || el.getAttribute('aria-label'))
        ).map(el => el.textContent?.trim())
      );
      
      return {
        success: createButtons.length > 0,
        buttons: createButtons,
        message: createButtons.length > 0 ? 'Create buttons found' : 'No create buttons found'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testReadOperation(testName, pageConfig) {
    try {
      // Check if data is displayed
      const hasData = await this.page.$$eval('tr, .MuiCard-root, [data-testid*="card"]', 
        elements => elements.length > 0
      );
      
      return {
        success: hasData,
        message: hasData ? 'Data display confirmed' : 'No data displayed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testUpdateOperation(testName, pageConfig) {
    try {
      // Look for "Edit", "Update", "Modify" buttons
      const editButtons = await this.page.$$eval('button, [role="button"]', 
        elements => elements.filter(el => 
          /edit|update|modify/i.test(el.textContent || el.getAttribute('aria-label'))
        ).map(el => el.textContent?.trim())
      );
      
      return {
        success: editButtons.length > 0,
        buttons: editButtons,
        message: editButtons.length > 0 ? 'Edit buttons found' : 'No edit buttons found'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testDeleteOperation(testName, pageConfig) {
    try {
      // Look for "Delete", "Remove", "Archive" buttons
      const deleteButtons = await this.page.$$eval('button, [role="button"]', 
        elements => elements.filter(el => 
          /delete|remove|archive/i.test(el.textContent || el.getAttribute('aria-label'))
        ).map(el => el.textContent?.trim())
      );
      
      return {
        success: deleteButtons.length > 0,
        buttons: deleteButtons,
        message: deleteButtons.length > 0 ? 'Delete buttons found' : 'No delete buttons found'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testSearchFunctionality(testName, pageConfig) {
    try {
      // Look for search inputs
      const searchInputs = await this.page.$$eval('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]', 
        elements => elements.map(el => ({
          placeholder: el.placeholder,
          name: el.name,
          id: el.id
        }))
      );
      
      if (searchInputs.length === 0) {
        return {
          success: false,
          message: 'No search inputs found'
        };
      }
      
      // Test searching
      const searchInput = searchInputs[0];
      const selector = searchInput.id ? `#${searchInput.id}` : `input[placeholder*="search" i]`;
      
      await this.page.fill(selector, 'test search');
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(1000);
      
      await this.reporter.captureScreenshot(this.page, `${testName}-search-test`, 'info', 'Search functionality test');
      
      return {
        success: true,
        inputs: searchInputs,
        message: 'Search functionality tested'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testFilterFunctionality(testName, pageConfig) {
    try {
      // Look for filter dropdowns or buttons
      const filterElements = await this.page.$$eval('select, [role="combobox"], button[aria-label*="filter" i]', 
        elements => elements.map(el => ({
          tagName: el.tagName,
          text: el.textContent?.trim(),
          ariaLabel: el.getAttribute('aria-label')
        }))
      );
      
      return {
        success: filterElements.length > 0,
        elements: filterElements,
        message: filterElements.length > 0 ? 'Filter elements found' : 'No filter elements found'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testSortFunctionality(testName, pageConfig) {
    try {
      // Look for sortable column headers
      const sortableHeaders = await this.page.$$eval('th[role="columnheader"], .MuiTableCell-head', 
        elements => elements.map(el => ({
          text: el.textContent?.trim(),
          sortable: el.getAttribute('aria-sort') !== null || el.querySelector('[aria-label*="sort"]') !== null
        }))
      );
      
      return {
        success: sortableHeaders.length > 0,
        headers: sortableHeaders,
        message: sortableHeaders.length > 0 ? 'Sortable headers found' : 'No sortable headers found'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get appropriate selector for a button
   */
  getButtonSelector(button, index) {
    if (button.id) {
      return `#${button.id}`;
    }
    if (button.dataTestId) {
      return `[data-testid="${button.dataTestId}"]`;
    }
    if (button.text && button.text !== 'Unknown') {
      return `button:has-text("${button.text}")`;
    }
    return `button:nth-child(${index + 1})`;
  }
}

module.exports = BusinessLogicTester;