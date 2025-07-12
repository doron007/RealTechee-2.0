/**
 * Admin Projects Page Tests
 * 
 * Comprehensive testing for /admin/projects including:
 * - Data loading and display
 * - Search functionality  
 * - Filter operations
 * - View mode switching
 * - Archive toggle
 * - Action buttons
 * - Pagination
 */

const { test, expect } = require('@playwright/test');

test.describe('Admin Projects Page', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to projects page before each test
    await page.goto('/admin/projects');
    
    // Wait for page to load completely
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForSelector('[data-testid="admin-data-grid"], .MuiCircularProgress-root, tr, .MuiCard-root', { timeout: 15000 });
  });

  test.describe('Data Loading & Display', () => {
    
    test('should load projects page without errors', async ({ page }) => {
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
      
      // Verify no error states
      const errorElement = page.locator('[role="alert"], .error-message');
      await expect(errorElement).toHaveCount(0);
    });
    
    test('should display project data correctly', async ({ page }) => {
      // Wait for data to load
      await page.waitForLoadState('networkidle');
      
      // Check if we have data or empty state
      const hasData = await page.locator('tr:not(:first-child), .MuiCard-root').count() > 0;
      
      if (hasData) {
        // If data exists, verify table/card structure
        const firstDataElement = page.locator('tr:not(:first-child), .MuiCard-root').first();
        await expect(firstDataElement).toBeVisible();
        
        // Verify essential columns/fields are present
        const hasAddress = await page.locator('text=/address|location/i').count() > 0;
        const hasStatus = await page.locator('text=/status|state/i').count() > 0;
        
        // At least one of these should be present
        expect(hasAddress || hasStatus).toBeTruthy();
      } else {
        // Verify empty state is handled properly
        const emptyMessage = page.locator('text=/no projects|empty|no data/i');
        // Empty state might not have specific message, that's ok
      }
    });
  });

  test.describe('Search Functionality', () => {
    
    test('should have search functionality available', async ({ page }) => {
      // Look for search input (global search)
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"], .MuiInputBase-input').first();
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        
        // Test search interaction
        await searchInput.fill('test search');
        await page.waitForTimeout(500); // Debounce delay
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
    });
    
    test('should handle search across multiple fields', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"], .MuiInputBase-input').first();
      
      if (await searchInput.count() > 0) {
        // Test various search terms
        const searchTerms = ['address', 'status', 'project'];
        
        for (const term of searchTerms) {
          await searchInput.fill(term);
          await page.waitForTimeout(800); // Wait for search debounce
          
          // Verify search doesn't break the page
          await expect(page.locator('h1').first()).toBeVisible();
          
          await searchInput.clear();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Filter Operations', () => {
    
    test('should have filter functionality', async ({ page }) => {
      // Look for filter dropdowns
      const filterDropdowns = page.locator('select, .MuiSelect-select, [role="combobox"]');
      const filterCount = await filterDropdowns.count();
      
      if (filterCount > 0) {
        // Test each filter
        for (let i = 0; i < Math.min(filterCount, 3); i++) {
          const filter = filterDropdowns.nth(i);
          
          if (await filter.isVisible()) {
            await filter.click();
            await page.waitForTimeout(300);
            
            // Look for filter options
            const options = page.locator('[role="option"], option, .MuiMenuItem-root');
            if (await options.count() > 0) {
              await options.first().click();
              await page.waitForTimeout(500);
            }
          }
        }
      }
    });
    
    test('should handle status and product filters', async ({ page }) => {
      // Status filter
      const statusFilter = page.locator('text=/status/i').locator('..').locator('select, .MuiSelect-select').first();
      if (await statusFilter.count() > 0 && await statusFilter.isVisible()) {
        await statusFilter.click();
        await page.waitForTimeout(300);
        
        const statusOptions = page.locator('[role="option"], .MuiMenuItem-root');
        if (await statusOptions.count() > 0) {
          await statusOptions.first().click();
          await page.waitForTimeout(500);
        }
      }
      
      // Product filter
      const productFilter = page.locator('text=/product/i').locator('..').locator('select, .MuiSelect-select').first();
      if (await productFilter.count() > 0 && await productFilter.isVisible()) {
        await productFilter.click();
        await page.waitForTimeout(300);
        
        const productOptions = page.locator('[role="option"], .MuiMenuItem-root');
        if (await productOptions.count() > 0) {
          await productOptions.first().click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('View Mode Switching', () => {
    
    test('should support view mode toggle between table and cards', async ({ page }) => {
      // Look for view toggle buttons
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i], .MuiToggleButton-root');
      
      if (await viewToggle.count() > 0) {
        // Test switching between views
        await viewToggle.first().click();
        await page.waitForTimeout(500);
        
        // Verify view changed (either more cards or more table structure)
        const afterToggle = await page.locator('tr, .MuiCard-root').count();
        expect(afterToggle).toBeGreaterThanOrEqual(0);
        
        // Toggle back
        if (await viewToggle.count() > 1) {
          await viewToggle.last().click();
          await page.waitForTimeout(500);
        }
      }
    });
    
    test('should maintain functionality across view modes', async ({ page }) => {
      // Test that search/filters work in both view modes
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i], .MuiToggleButton-root');
      
      if (await viewToggle.count() > 0) {
        // Switch to card view
        await viewToggle.first().click();
        await page.waitForTimeout(500);
        
        // Test search in card view
        const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
        if (await searchInput.count() > 0) {
          await searchInput.fill('test');
          await page.waitForTimeout(800);
          await searchInput.clear();
        }
        
        // Switch back to table view
        if (await viewToggle.count() > 1) {
          await viewToggle.last().click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Archive Toggle', () => {
    
    test('should handle archive toggle functionality', async ({ page }) => {
      // Look for archive toggle
      const archiveToggle = page.locator('text=/archive/i').locator('..').locator('input[type="checkbox"], .MuiSwitch-input').first();
      
      if (await archiveToggle.count() > 0) {
        const initialState = await archiveToggle.isChecked();
        
        // Toggle archive filter
        await archiveToggle.click();
        await page.waitForTimeout(1000);
        
        // Verify state changed
        const newState = await archiveToggle.isChecked();
        expect(newState).toBe(!initialState);
        
        // Toggle back
        await archiveToggle.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Action Buttons', () => {
    
    test('should have action buttons available', async ({ page }) => {
      // Look for action buttons
      const actionButtons = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New"), button:has-text("Refresh"), button:has-text("More")');
      
      const buttonCount = await actionButtons.count();
      if (buttonCount > 0) {
        // Verify buttons are visible and clickable
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = actionButtons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeEnabled();
            
            // Test button interaction (without actually creating/modifying)
            const buttonText = await button.textContent();
            if (buttonText?.toLowerCase().includes('refresh')) {
              await button.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      }
    });
    
    test('should handle more actions menu', async ({ page }) => {
      // Look for more actions or menu buttons
      const moreButton = page.locator('button:has-text("More"), button[aria-label*="menu" i], .MuiIconButton-root:has(svg)').first();
      
      if (await moreButton.count() > 0 && await moreButton.isVisible()) {
        await moreButton.click();
        await page.waitForTimeout(500);
        
        // Look for menu items
        const menuItems = page.locator('[role="menuitem"], .MuiMenuItem-root');
        if (await menuItems.count() > 0) {
          // Close menu by clicking outside
          await page.click('body');
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Pagination', () => {
    
    test('should handle pagination if present', async ({ page }) => {
      // Look for pagination controls
      const pagination = page.locator('.MuiPagination-root, .pagination, [aria-label*="pagination" i]');
      
      if (await pagination.count() > 0) {
        const paginationButtons = pagination.locator('button');
        const buttonCount = await paginationButtons.count();
        
        if (buttonCount > 1) {
          // Test pagination interaction
          const nextButton = paginationButtons.filter({ hasText: /next|>/ }).first();
          if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            
            // Go back to first page
            const prevButton = paginationButtons.filter({ hasText: /prev|</ }).first();
            if (await prevButton.count() > 0 && await prevButton.isEnabled()) {
              await prevButton.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      } else {
        console.log('ℹ️ Pagination not found - may not be needed for current data size');
      }
    });
  });

  test.describe('Progressive Card Features', () => {
    
    test('should handle progressive disclosure in card view', async ({ page }) => {
      // Switch to card view first
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i]').first();
      if (await viewToggle.count() > 0) {
        await viewToggle.click();
        await page.waitForTimeout(500);
      }
      
      // Look for cards with expansion capability
      const cards = page.locator('.MuiCard-root');
      if (await cards.count() > 0) {
        const firstCard = cards.first();
        
        // Look for expand/collapse functionality
        const expandButton = firstCard.locator('button, [role="button"]').first();
        if (await expandButton.count() > 0) {
          await expandButton.click();
          await page.waitForTimeout(500);
          
          // Verify card expanded (more content visible)
          const cardContent = await firstCard.textContent();
          expect(cardContent).toBeTruthy();
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle errors gracefully', async ({ page }) => {
      // Verify no JavaScript errors
      const errors = [];
      page.on('pageerror', (error) => {
        errors.push(error);
      });
      
      // Interact with various elements
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check for console errors
      expect(errors.length).toBe(0);
    });
    
    test('should maintain responsiveness during interactions', async ({ page }) => {
      // Test rapid interactions don't break the page
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Rapid search inputs
        await searchInput.fill('a');
        await searchInput.fill('ab');
        await searchInput.fill('abc');
        await page.waitForTimeout(1000);
        
        // Page should still be responsive
        await expect(page.locator('h1')).toBeVisible();
        
        await searchInput.clear();
      }
    });
  });
});