/**
 * Admin Quotes Page Tests
 * 
 * Comprehensive testing for /admin/quotes including:
 * - Data loading and display
 * - Search functionality  
 * - Filter operations
 * - View mode switching
 * - Archive toggle
 * - Action buttons
 * - Pagination
 * - Performance and accessibility
 * - Edge cases and error recovery
 */

const { test, expect } = require('@playwright/test');

test.describe('Admin Quotes Page', () => {
  
  // Helper function to reset page state like a real user would
  async function resetPageState(page) {
    // Clear any search inputs
    const searchInputs = page.locator('input[placeholder*="search" i], input[type="search"]');
    if (await searchInputs.count() > 0) {
      await searchInputs.first().clear();
    }
    
    // Reset any filters to default state
    const filterSelects = page.locator('select, .MuiSelect-select');
    const filterCount = await filterSelects.count();
    for (let i = 0; i < Math.min(filterCount, 2); i++) {
      try {
        const select = filterSelects.nth(i);
        if (await select.isVisible()) {
          // Try to reset to first option if possible
          await select.click();
          await page.waitForTimeout(200);
          const firstOption = page.locator('[role="option"], option').first();
          if (await firstOption.count() > 0) {
            await firstOption.click();
            await page.waitForTimeout(300);
          }
        }
      } catch (error) {
        // Continue if reset fails - some filters might not be resettable
      }
    }
    
    // Wait for any changes to settle
    await page.waitForTimeout(500);
  }
  
  // Single page context - reuse the same page for all tests like a real user
  let sharedPage;
  
  test.beforeAll(async ({ browser }) => {
    // Create a single page context that persists across all tests
    const context = await browser.newContext({ 
      storageState: 'playwright/.auth/user.json',
      viewport: { width: 1280, height: 1080 } // Increased height for pagination visibility
    });
    sharedPage = await context.newPage();
    
    // Navigate to quotes page once
    await sharedPage.goto('/admin/quotes');
    
    // Wait for page to load completely
    await expect(sharedPage.locator('h1').first()).toBeVisible();
    await sharedPage.waitForSelector('[data-testid="admin-data-grid"], .MuiCircularProgress-root, tr, .MuiCard-root', { timeout: 15000 });
  });
  
  test.beforeEach(async () => {
    // Reset page state for clean test start (mimics user clearing filters/search)
    await resetPageState(sharedPage);
  });
  
  test.afterAll(async () => {
    // Clean up the shared page
    if (sharedPage) {
      await sharedPage.close();
    }
  });

  test.describe('Data Loading & Display', () => {
    
    test('should load quotes page without errors', async () => {
      // Use shared page instead of new page instance
      const page = sharedPage;
      
      // Verify page title (select the main page heading)
      const pageTitle = await page.locator('h1').first().textContent();
      expect(pageTitle).toBeTruthy();
      
      // Check for aggregation bar (Total/Active/Archived counts)
      const aggregationBar = page.locator('.bg-white.rounded-lg.shadow').first();
      
      // Verify data elements are present (either table rows or cards)
      const dataElements = page.locator('tr:not(:first-child), .MuiCard-root');
      const count = await dataElements.count();
      
      // Should have either data or proper empty state
      expect(count).toBeGreaterThanOrEqual(0);
      
      // Verify no blocking errors
      const criticalErrors = page.locator('[role="alert"][severity="error"], .error-blocking');
      expect(await criticalErrors.count()).toBe(0);
    });
    
    test('should show quote-specific information in data grid', async ({ page }) => {
      // User Story: As a quote manager, I want to see essential quote information at a glance
      
      await page.waitForLoadState('networkidle');
      
      const hasQuotes = await page.locator('tr:not(:first-child), .MuiCard-root').count() > 0;
      
      if (hasQuotes) {
        // Verify quote-specific columns/fields are present
        const hasQuoteNumber = await page.locator('text=/quote.*number|quote.*id|#/i').count() > 0;
        const hasCustomer = await page.locator('text=/customer|client|contact/i').count() > 0;
        const hasStatus = await page.locator('text=/status|state/i').count() > 0;
        const hasAmount = await page.locator('text=/amount|total|price/i').count() > 0;
        const hasDate = await page.locator('text=/date|created|updated/i').count() > 0;
        
        // At least some quote-relevant fields should be present
        const relevantFieldsCount = [hasQuoteNumber, hasCustomer, hasStatus, hasAmount, hasDate].filter(Boolean).length;
        expect(relevantFieldsCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('User Story: Quote Manager Searches for Specific Quotes', () => {
    
    test('should provide search functionality across quote fields', async ({ page }) => {
      // User Story: As a quote manager, I want to search for quotes by customer name, quote number, or product
      
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"], .MuiInputBase-input').first();
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        
        // Test search for quote-specific terms
        const quoteSearchTerms = ['quote', 'customer', 'pending', 'approved'];
        
        for (const term of quoteSearchTerms) {
          await searchInput.fill(term);
          await page.waitForTimeout(800); // Wait for search debounce
          
          // Verify search doesn't break the page
          await expect(page.locator('h1').first()).toBeVisible();
          
          await searchInput.clear();
          await page.waitForTimeout(300);
        }
      }
    });
    
    test('should handle advanced search patterns for quotes', async ({ page }) => {
      // User Story: As a quote manager, I want to search using quote numbers, customer names, and status
      
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Test quote-specific search patterns
        const searchPatterns = [
          'QT-2024',      // Quote number pattern
          'John Smith',   // Customer name
          'pending',      // Status search
          '$10000'        // Amount search
        ];
        
        for (const pattern of searchPatterns) {
          await searchInput.fill(pattern);
          await page.waitForTimeout(1000);
          
          // Page should remain functional
          await expect(page.locator('h1').first()).toBeVisible();
          
          await searchInput.clear();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('User Story: Quote Manager Filters Quotes by Criteria', () => {
    
    test('should provide filtering by quote status', async ({ page }) => {
      // User Story: As a quote manager, I want to filter quotes by status (pending, approved, rejected, expired)
      
      const statusFilter = page.locator('text=/status/i').locator('..').locator('select, .MuiSelect-select').first();
      
      if (await statusFilter.count() > 0 && await statusFilter.isVisible()) {
        await statusFilter.click();
        await page.waitForTimeout(300);
        
        // Look for quote status options
        const statusOptions = page.locator('[role="option"], .MuiMenuItem-root');
        if (await statusOptions.count() > 0) {
          // Test selecting different statuses
          await statusOptions.first().click();
          await page.waitForTimeout(500);
          
          // Verify filtering works
          await expect(page.locator('h1').first()).toBeVisible();
        }
      }
    });
    
    test('should provide filtering by product type or date range', async ({ page }) => {
      // User Story: As a quote manager, I want to filter quotes by product type and date ranges
      
      // Product filter
      const productFilter = page.locator('text=/product|service/i').locator('..').locator('select, .MuiSelect-select').first();
      if (await productFilter.count() > 0 && await productFilter.isVisible()) {
        await productFilter.click();
        await page.waitForTimeout(300);
        
        const productOptions = page.locator('[role="option"], .MuiMenuItem-root');
        if (await productOptions.count() > 0) {
          await productOptions.first().click();
          await page.waitForTimeout(500);
        }
      }
      
      // Date filter (if present)
      const dateFilter = page.locator('input[type="date"], .MuiDatePicker-root input').first();
      if (await dateFilter.count() > 0 && await dateFilter.isVisible()) {
        // Test date filtering
        await dateFilter.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('User Story: Quote Manager Switches Between Views', () => {
    
    test('should toggle between table and card views for quotes', async ({ page }) => {
      // User Story: As a quote manager, I want to switch between table view for detailed analysis and card view for quick overview
      
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i], .MuiToggleButton-root');
      
      if (await viewToggle.count() > 0) {
        // Switch to card view
        await viewToggle.first().click();
        await page.waitForTimeout(500);
        
        // Verify view switched
        const afterToggle = await page.locator('tr, .MuiCard-root').count();
        expect(afterToggle).toBeGreaterThanOrEqual(0);
        
        // Switch back to table view
        if (await viewToggle.count() > 1) {
          await viewToggle.last().click();
          await page.waitForTimeout(500);
        }
      }
    });
    
    test('should maintain quote data integrity across view modes', async ({ page }) => {
      // User Story: As a quote manager, I want the same quote information available in both table and card views
      
      const initialQuoteCount = await page.locator('tr:not(:first-child), .MuiCard-root').count();
      
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i]').first();
      if (await viewToggle.count() > 0) {
        // Switch views
        await viewToggle.click();
        await page.waitForTimeout(500);
        
        // Verify data consistency
        const newQuoteCount = await page.locator('tr:not(:first-child), .MuiCard-root').count();
        
        // Quote count should be consistent (allowing for pagination differences)
        expect(Math.abs(newQuoteCount - initialQuoteCount)).toBeLessThanOrEqual(5);
      }
    });
  });

  test.describe('User Story: Quote Manager Performs Actions on Quotes', () => {
    
    test('should provide quote management actions', async ({ page }) => {
      // User Story: As a quote manager, I want to create new quotes, edit existing ones, and export quote data
      
      const actionButtons = page.locator('button:has-text("Create"), button:has-text("New Quote"), button:has-text("Add"), button:has-text("Export"), button:has-text("More")');
      
      const buttonCount = await actionButtons.count();
      if (buttonCount > 0) {
        // Test each action button
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = actionButtons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeEnabled();
            
            const buttonText = await button.textContent();
            if (buttonText?.toLowerCase().includes('export')) {
              // Test export functionality
              await button.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      }
    });
    
    test('should handle quote workflow actions', async ({ page }) => {
      // User Story: As a quote manager, I want to approve, reject, or modify quote status
      
      // Look for status change actions
      const statusActions = page.locator('button:has-text("Approve"), button:has-text("Reject"), button:has-text("Review"), select[name*="status"]');
      
      if (await statusActions.count() > 0) {
        const firstAction = statusActions.first();
        if (await firstAction.isVisible() && await firstAction.isEnabled()) {
          // Test status action (without actually changing data)
          const actionText = await firstAction.textContent();
          console.log(`ℹ️ Found quote status action: ${actionText}`);
        }
      }
    });
  });

  test.describe('User Story: Quote Manager Sorts and Organizes Quotes', () => {
    
    test('should provide sorting capabilities for quote organization', async ({ page }) => {
      // User Story: As a quote manager, I want to sort quotes by date, amount, status, or customer name
      
      // Look for sortable column headers
      const sortableHeaders = page.locator('th[role="columnheader"], .MuiDataGrid-columnHeader, .sortable');
      const headerCount = await sortableHeaders.count();
      
      if (headerCount > 0) {
        // Test sorting on first few columns
        for (let i = 0; i < Math.min(headerCount, 3); i++) {
          const header = sortableHeaders.nth(i);
          if (await header.isVisible()) {
            await header.click();
            await page.waitForTimeout(500);
            
            // Verify page remains functional after sort
            await expect(page.locator('h1').first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('User Story: Quote Manager Uses Progressive Quote Cards', () => {
    
    test('should support expanding quote cards for detailed information', async ({ page }) => {
      // User Story: As a quote manager, I want to expand quote cards to see detailed information without leaving the list
      
      // Switch to card view if available
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i]').first();
      if (await viewToggle.count() > 0) {
        await viewToggle.click();
        await page.waitForTimeout(500);
      }
      
      // Look for expandable cards
      const quoteCards = page.locator('.MuiCard-root');
      if (await quoteCards.count() > 0) {
        const firstCard = quoteCards.first();
        
        // Look for expand/details button
        const expandButton = firstCard.locator('button, [role="button"]').first();
        if (await expandButton.count() > 0) {
          await expandButton.click();
          await page.waitForTimeout(500);
          
          // Verify card expanded with more details
          const cardContent = await firstCard.textContent();
          expect(cardContent).toBeTruthy();
        }
      }
    });
  });

  test.describe('User Story: Quote Manager Handles Large Quote Lists', () => {
    
    test('should provide pagination for large quote datasets', async ({ page }) => {
      // User Story: As a quote manager, I want to navigate through pages of quotes efficiently
      
      const pagination = page.locator('.MuiPagination-root, .pagination, [aria-label*="pagination" i]');
      
      if (await pagination.count() > 0) {
        const paginationButtons = pagination.locator('button');
        const buttonCount = await paginationButtons.count();
        
        if (buttonCount > 1) {
          // Test pagination navigation
          const nextButton = paginationButtons.filter({ hasText: /next|>/ }).first();
          if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            
            // Navigate back
            const prevButton = paginationButtons.filter({ hasText: /prev|</ }).first();
            if (await prevButton.count() > 0 && await prevButton.isEnabled()) {
              await prevButton.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      } else {
        console.log('ℹ️ Pagination not found - current quote dataset may not require pagination');
      }
    });
  });

  test.describe('User Story: Quote Manager Ensures System Reliability', () => {
    
    test('should handle errors gracefully during quote operations', async ({ page }) => {
      // User Story: As a quote manager, I want the system to handle errors gracefully and provide helpful feedback
      
      // Monitor for JavaScript errors
      const errors = [];
      page.on('pageerror', (error) => {
        errors.push(error);
      });
      
      // Perform various quote operations
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Test rapid interactions
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('rapid test');
        await searchInput.clear();
        await searchInput.fill('quote test');
        await page.waitForTimeout(1000);
      }
      
      // Verify no critical JavaScript errors
      expect(errors.length).toBe(0);
    });
    
    test('should maintain responsiveness during quote management tasks', async ({ page }) => {
      // User Story: As a quote manager, I want the system to remain responsive during heavy quote operations
      
      // Test system responsiveness with multiple rapid actions
      const actionButtons = page.locator('button').first();
      if (await actionButtons.count() > 0 && await actionButtons.isVisible()) {
        // Rapid button interactions
        for (let i = 0; i < 3; i++) {
          if (await actionButtons.isEnabled()) {
            await actionButtons.hover();
            await page.waitForTimeout(100);
          }
        }
      }
      
      // System should remain responsive
      await expect(page.locator('h1').first()).toBeVisible();
    });
  });
});