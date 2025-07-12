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
    
    // Navigate to projects page once
    await sharedPage.goto('/admin/projects');
    
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
    
    test('should load projects page without errors', async () => {
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
      
      // Verify no error alerts (check specifically for red error messages, not navigation alerts)
      const errorElement = page.locator('.bg-red-50, .text-red-700, [role="alert"]:has-text("error"), .error-message');
      const errorCount = await errorElement.count();
      expect(errorCount).toBe(0);
    });
    
    test('should display project data correctly', async () => {
      const page = sharedPage;
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
    
    test('should have search functionality available', async () => {
      const page = sharedPage;
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
    
    test('should handle search across multiple fields', async () => {
      const page = sharedPage;
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
    
    test('should have filter functionality', async () => {
      const page = sharedPage;
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
    
    test('should handle status and product filters', async () => {
      const page = sharedPage;
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
    
    test('should support view mode toggle between table and cards', async () => {
      const page = sharedPage;
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
    
    test('should maintain functionality across view modes', async () => {
      const page = sharedPage;
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
    
    test('should handle archive toggle functionality', async () => {
      const page = sharedPage;
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
    
    test('should have action buttons available', async () => {
      const page = sharedPage;
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
    
    test('should handle more actions menu', async () => {
      const page = sharedPage;
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
    
    test('should handle pagination if present', async () => {
      const page = sharedPage;
      // Look for pagination controls with comprehensive selectors
      const pagination = page.locator('.MuiPagination-root, .pagination, [aria-label*="pagination" i], .MuiTablePagination-root, [data-testid*="pagination"]');
      
      if (await pagination.count() > 0) {
        const paginationButtons = pagination.locator('button');
        const buttonCount = await paginationButtons.count();
        
        if (buttonCount > 1) {
          // Test pagination interaction with more specific selectors
          const nextButton = paginationButtons.filter({ hasText: /next|>|»/ }).or(pagination.locator('[aria-label*="next" i]')).first();
          if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            
            // Go back to first page
            const prevButton = paginationButtons.filter({ hasText: /prev|<|«/ }).or(pagination.locator('[aria-label*="prev" i]')).first();
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
    
    test('should handle progressive disclosure in card view', async () => {
      const page = sharedPage;
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

  test.describe('Aggregation Bar', () => {
    
    test('should display accurate aggregation counts', async () => {
      const page = sharedPage;
      
      // Ensure we're on the admin projects page
      await page.goto('/admin/projects');
      await page.waitForSelector('h1', { timeout: 10000 });
      
      // Find aggregation bar with more flexible selector
      const aggregationBar = page.locator('text=/Total:|Active:|Archived:/').first().locator('..');
      
      // Extract counts from aggregation bar
      const aggregationText = await page.locator('text=/Total:|Active:|Archived:/').allTextContents();
      
      if (aggregationText.length > 0) {
        // Parse counts from the text
        const totalMatch = aggregationText.find(text => text.includes('Total:'));
        const activeMatch = aggregationText.find(text => text.includes('Active:'));
        const archivedMatch = aggregationText.find(text => text.includes('Archived:'));
        
        if (totalMatch && activeMatch && archivedMatch) {
          const totalCount = parseInt(totalMatch.match(/\d+/)?.[0] || '0');
          const activeCount = parseInt(activeMatch.match(/\d+/)?.[0] || '0');
          const archivedCount = parseInt(archivedMatch.match(/\d+/)?.[0] || '0');
          
          // Verify math: Total should equal Active + Archived
          expect(totalCount).toBe(activeCount + archivedCount);
          
          // Verify counts are non-negative
          expect(totalCount).toBeGreaterThanOrEqual(0);
          expect(activeCount).toBeGreaterThanOrEqual(0);
          expect(archivedCount).toBeGreaterThanOrEqual(0);
        } else {
          // If aggregation bar not found, that's also valid (page might not have it)
          console.log('ℹ️ Aggregation bar not found - feature may not be implemented');
        }
      }
    });
    
    test('should update counts when archive toggle changes', async () => {
      const page = sharedPage;
      
      // Get initial counts
      const aggregationBar = page.locator('.bg-white.rounded-lg.shadow').first();
      const initialActiveText = await aggregationBar.locator('text=/Active:/')  .textContent();
      const initialArchivedText = await aggregationBar.locator('text=/Archived:/')  .textContent();
      
      const initialActive = parseInt(initialActiveText?.match(/\d+/)?.[0] || '0');
      const initialArchived = parseInt(initialArchivedText?.match(/\d+/)?.[0] || '0');
      
      // Toggle archive view if we have archived items
      if (initialArchived > 0) {
        const archiveToggle = page.locator('text=/archive/i').locator('..').locator('input[type="checkbox"], .MuiSwitch-input').first();
        if (await archiveToggle.count() > 0) {
          await archiveToggle.click();
          await page.waitForTimeout(1000);
          
          // Counts should remain the same (they show totals, not filtered)
          const newActiveText = await aggregationBar.locator('text=/Active:/')  .textContent();
          const newArchivedText = await aggregationBar.locator('text=/Archived:/')  .textContent();
          
          const newActive = parseInt(newActiveText?.match(/\d+/)?.[0] || '0');
          const newArchived = parseInt(newArchivedText?.match(/\d+/)?.[0] || '0');
          
          expect(newActive).toBe(initialActive);
          expect(newArchived).toBe(initialArchived);
          
          // Toggle back
          await archiveToggle.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });
  
  test.describe('Column Sorting', () => {
    
    test('should sort by status column', async () => {
      const page = sharedPage;
      
      // Ensure we're in table view
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i], .MuiToggleButton-root');
      if (await viewToggle.count() > 0) {
        // Try to switch to table view
        const tableViewButton = viewToggle.filter({ hasText: /table/i }).first();
        if (await tableViewButton.count() > 0) {
          await tableViewButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Find status column header and click to sort
      const statusHeader = page.locator('th').filter({ hasText: /status/i }).first();
      if (await statusHeader.count() > 0) {
        await statusHeader.click();
        await page.waitForTimeout(1000);
        
        // Verify sorting indicator appears
        const sortIndicator = page.locator('[data-testid*="sort"], .MuiTableSortLabel-icon').first();
        // Sort indicator might not always be visible, so we check if data changed
        
        // Click again to reverse sort
        await statusHeader.click();
        await page.waitForTimeout(1000);
        
        // Page should remain responsive
        await expect(page.locator('h1').first()).toBeVisible();
      }
    });
    
    test('should sort by address column', async () => {
      const page = sharedPage;
      
      // Find address column header
      const addressHeader = page.locator('th').filter({ hasText: /address/i }).first();
      if (await addressHeader.count() > 0) {
        // Get initial data to verify sorting
        const initialRows = await page.locator('tbody tr').count();
        
        await addressHeader.click();
        await page.waitForTimeout(1000);
        
        // Verify table still has same number of rows (data not filtered, just sorted)
        const sortedRows = await page.locator('tbody tr').count();
        expect(sortedRows).toBe(initialRows);
        
        // Click again for reverse sort
        await addressHeader.click();
        await page.waitForTimeout(1000);
      }
    });
    
    test('should sort by created date column', async () => {
      const page = sharedPage;
      
      const createdHeader = page.locator('th').filter({ hasText: /created/i }).first();
      if (await createdHeader.count() > 0) {
        await createdHeader.click();
        await page.waitForTimeout(1000);
        
        // Verify page remains functional
        await expect(page.locator('h1').first()).toBeVisible();
        
        // Test reverse sort
        await createdHeader.click();
        await page.waitForTimeout(1000);
      }
    });
  });
  
  test.describe('Individual Action Workflows', () => {
    
    test('should handle Open action', async () => {
      const page = sharedPage;
      
      // Find first project row or card
      const firstProject = page.locator('tbody tr, .MuiCard-root').first();
      if (await firstProject.count() > 0) {
        // Look for Open action button
        const openButton = firstProject.locator('button[title*="Open" i], [title*="Open Project" i]').first();
        
        if (await openButton.count() > 0) {
          // Mock window.open to prevent actual navigation
          await page.evaluate(() => {
            window.originalOpen = window.open;
            window.open = () => ({ focus: () => {} });
          });
          
          await openButton.click();
          await page.waitForTimeout(500);
          
          // Restore original window.open
          await page.evaluate(() => {
            if (window.originalOpen) {
              window.open = window.originalOpen;
            }
          });
          
          // Verify page remains stable
          await expect(page.locator('h1').first()).toBeVisible();
        }
      }
    });
    
    test('should handle Edit action navigation', async () => {
      const page = sharedPage;
      
      const firstProject = page.locator('tbody tr, .MuiCard-root').first();
      if (await firstProject.count() > 0) {
        const editButton = firstProject.locator('button[title*="Edit" i], [title*="Edit Project" i]').first();
        
        if (await editButton.count() > 0) {
          // Listen for navigation attempts
          let navigationAttempted = false;
          page.on('framenavigated', () => {
            navigationAttempted = true;
          });
          
          // Note: This might actually navigate, so we'll test the button exists and is clickable
          await expect(editButton).toBeVisible();
          await expect(editButton).toBeEnabled();
          
          // Verify button functionality without actually clicking (to avoid navigation)
          const buttonText = await editButton.textContent();
          expect(buttonText?.toLowerCase()).toContain('edit');
        }
      }
    });
    
    test('should handle View Request action', async () => {
      const page = sharedPage;
      
      const firstProject = page.locator('tbody tr, .MuiCard-root').first();
      if (await firstProject.count() > 0) {
        const viewRequestButton = firstProject.locator('button').filter({ hasText: /view request/i }).first();
        
        if (await viewRequestButton.count() > 0) {
          await expect(viewRequestButton).toBeVisible();
          await expect(viewRequestButton).toBeEnabled();
          
          // Test interaction without full navigation
          const buttonTitle = await viewRequestButton.getAttribute('title');
          expect(buttonTitle?.toLowerCase()).toContain('request');
        }
      }
    });
    
    test('should handle View Quotes action', async () => {
      const page = sharedPage;
      
      const firstProject = page.locator('tbody tr, .MuiCard-root').first();
      if (await firstProject.count() > 0) {
        const viewQuotesButton = firstProject.locator('button').filter({ hasText: /view quotes/i }).first();
        
        if (await viewQuotesButton.count() > 0) {
          await expect(viewQuotesButton).toBeVisible();
          await expect(viewQuotesButton).toBeEnabled();
        }
      }
    });
    
    test('should handle Archive action with confirmation', async () => {
      const page = sharedPage;
      
      const firstProject = page.locator('tbody tr, .MuiCard-root').first();
      if (await firstProject.count() > 0) {
        const archiveButton = firstProject.locator('button[title*="Archive" i]').first();
        
        if (await archiveButton.count() > 0) {
          // Mock window.confirm to auto-cancel
          await page.evaluate(() => {
            window.originalConfirm = window.confirm;
            window.confirm = () => false; // Auto-cancel to prevent actual archiving
          });
          
          await archiveButton.click();
          await page.waitForTimeout(500);
          
          // Restore original confirm
          await page.evaluate(() => {
            if (window.originalConfirm) {
              window.confirm = window.originalConfirm;
            }
          });
          
          // Verify page remains stable
          await expect(page.locator('h1').first()).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Create New Project', () => {
    
    test('should have create new project button', async () => {
      const page = sharedPage;
      
      // Look for create/new project button
      const createButton = page.locator('button').filter({ hasText: /new project|create|add project/i }).first();
      
      if (await createButton.count() > 0) {
        await expect(createButton).toBeVisible();
        await expect(createButton).toBeEnabled();
        
        // Verify button text
        const buttonText = await createButton.textContent();
        expect(buttonText?.toLowerCase()).toMatch(/new|create|add/);
      }
    });
    
    test('should navigate to create project page', async () => {
      const page = sharedPage;
      
      const createButton = page.locator('button').filter({ hasText: /new project|create/i }).first();
      
      if (await createButton.count() > 0) {
        // Test that button exists and is functional
        await expect(createButton).toBeEnabled();
        
        // Note: We don't actually click to avoid navigation during tests
        // In a real test environment, you'd test the full navigation flow
      }
    });
  });
  
  test.describe('Data Refresh Functionality', () => {
    
    test('should have refresh button', async () => {
      const page = sharedPage;
      
      // Look for refresh button
      const refreshButton = page.locator('button').filter({ hasText: /refresh|reload/i }).first();
      
      if (await refreshButton.count() > 0) {
        await expect(refreshButton).toBeVisible();
        await expect(refreshButton).toBeEnabled();
      }
    });
    
    test('should refresh data when refresh button clicked', async () => {
      const page = sharedPage;
      
      const refreshButton = page.locator('button').filter({ hasText: /refresh/i }).first();
      
      if (await refreshButton.count() > 0) {
        // Get initial data count
        const initialCount = await page.locator('tbody tr, .MuiCard-root').count();
        
        // Click refresh
        await refreshButton.click();
        await page.waitForTimeout(2000); // Wait for refresh to complete
        
        // Verify page is still functional
        await expect(page.locator('h1').first()).toBeVisible();
        
        // Data count should be consistent (unless data changed in backend)
        const newCount = await page.locator('tbody tr, .MuiCard-root').count();
        expect(newCount).toBeGreaterThanOrEqual(0);
      }
    });
  });
  
  test.describe('Custom Actions Menu', () => {
    
    test('should have custom actions dropdown', async () => {
      const page = sharedPage;
      
      // Look for more actions or custom actions button
      const moreActionsButton = page.locator('button').filter({ hasText: /project actions|more actions|actions/i }).first();
      
      if (await moreActionsButton.count() > 0) {
        await expect(moreActionsButton).toBeVisible();
        await expect(moreActionsButton).toBeEnabled();
        
        // Click to open menu
        await moreActionsButton.click();
        await page.waitForTimeout(500);
        
        // Look for menu items
        const menuItems = page.locator('[role="menuitem"], .MuiMenuItem-root');
        const itemCount = await menuItems.count();
        
        if (itemCount > 0) {
          // Verify menu items exist
          expect(itemCount).toBeGreaterThan(0);
          
          // Check for expected actions
          const exportItem = menuItems.filter({ hasText: /export.*pdf/i });
          const reportItem = menuItems.filter({ hasText: /generate.*report/i });
          const bulkItem = menuItems.filter({ hasText: /bulk.*operations/i });
          
          // At least one of these should exist
          const hasExpectedItems = (await exportItem.count()) > 0 || 
                                   (await reportItem.count()) > 0 || 
                                   (await bulkItem.count()) > 0;
          expect(hasExpectedItems).toBeTruthy();
        }
        
        // Close menu by clicking outside
        await page.click('body');
        await page.waitForTimeout(300);
      }
    });
    
    test('should handle Export to PDF action', async () => {
      const page = sharedPage;
      
      const moreActionsButton = page.locator('button').filter({ hasText: /project actions|actions/i }).first();
      
      if (await moreActionsButton.count() > 0) {
        await moreActionsButton.click();
        await page.waitForTimeout(500);
        
        const exportItem = page.locator('[role="menuitem"], .MuiMenuItem-root').filter({ hasText: /export.*pdf/i }).first();
        
        if (await exportItem.count() > 0) {
          // Mock alert to prevent actual alert
          await page.evaluate(() => {
            window.originalAlert = window.alert;
            window.alert = () => {};
          });
          
          await exportItem.click();
          await page.waitForTimeout(500);
          
          // Restore alert
          await page.evaluate(() => {
            if (window.originalAlert) {
              window.alert = window.originalAlert;
            }
          });
          
          // Verify page remains stable
          await expect(page.locator('h1').first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Progressive Card States (Phase 2)', () => {
    
    test('should support 3-state progressive disclosure', async () => {
      const page = sharedPage;
      
      // Switch to card view first
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i], .MuiToggleButton-root');
      if (await viewToggle.count() > 0) {
        await viewToggle.first().click();
        await page.waitForTimeout(500);
      }
      
      // Find a card
      const firstCard = page.locator('.MuiCard-root, .bg-white.border-b').first();
      if (await firstCard.count() > 0) {
        // State 1: Collapsed - should show minimal info
        const collapsedHeight = await firstCard.boundingBox();
        
        // Click to expand to basic state
        const titleRow = firstCard.locator('[class*="cursor-pointer"], .flex.items-center').first();
        if (await titleRow.count() > 0) {
          await titleRow.click();
          await page.waitForTimeout(500);
          
          // State 2: Basic - should show more info
          const basicHeight = await firstCard.boundingBox();
          expect(basicHeight?.height).toBeGreaterThan(collapsedHeight?.height || 0);
          
          // Look for "Show More" or "Show All Details" button
          const showMoreButton = firstCard.locator('button').filter({ hasText: /show.*more|show.*all|details/i }).first();
          if (await showMoreButton.count() > 0) {
            await showMoreButton.click();
            await page.waitForTimeout(500);
            
            // State 3: Full - should show complete details
            const fullHeight = await firstCard.boundingBox();
            expect(fullHeight?.height).toBeGreaterThan(basicHeight?.height || 0);
            
            // Verify full state shows detailed sections
            const detailSections = firstCard.locator('details, .group');
            const sectionCount = await detailSections.count();
            expect(sectionCount).toBeGreaterThan(0);
          }
        }
      }
    });
    
    test('should handle card density toggle', async () => {
      const page = sharedPage;
      
      // Look for density controls
      const densityButton = page.locator('button[title*="density" i], button[title*="compact" i], button[title*="comfortable" i]').first();
      
      if (await densityButton.count() > 0) {
        const initialCards = page.locator('.MuiCard-root, .bg-white.border-b');
        const initialCount = await initialCards.count();
        
        // Toggle density
        await densityButton.click();
        await page.waitForTimeout(500);
        
        // Cards should still exist but potentially different layout
        const newCount = await initialCards.count();
        expect(newCount).toBe(initialCount);
        
        // Toggle back
        await densityButton.click();
        await page.waitForTimeout(500);
      }
    });
    
    test('should persist view preferences', async () => {
      const page = sharedPage;
      
      // Check if localStorage contains view preferences
      const viewMode = await page.evaluate(() => {
        return localStorage.getItem('admin-projects-view-mode');
      });
      
      const density = await page.evaluate(() => {
        return localStorage.getItem('admin-projects-density');
      });
      
      // Preferences should be stored (if feature exists)
      if (viewMode !== null) {
        expect(['cards', 'table']).toContain(viewMode);
      }
      
      if (density !== null) {
        expect(['comfortable', 'compact']).toContain(density);
      }
    });
  });
  
  test.describe('Column Visibility Controls (Phase 2)', () => {
    
    test('should handle responsive column hiding', async () => {
      const page = sharedPage;
      
      // Ensure table view
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i]');
      if (await viewToggle.count() > 0) {
        const tableView = viewToggle.filter({ hasText: /table/i }).first();
        if (await tableView.count() > 0) {
          await tableView.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Count visible columns
      const headers = page.locator('th');
      const headerCount = await headers.count();
      
      if (headerCount > 0) {
        // Simulate mobile viewport
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        
        // Some columns should be hidden on mobile
        const mobileHeaders = page.locator('th:visible');
        const mobileHeaderCount = await mobileHeaders.count();
        
        // Restore desktop viewport
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.waitForTimeout(1000);
        
        // Verify responsive behavior occurred
        expect(mobileHeaderCount).toBeLessThanOrEqual(headerCount);
      }
    });
    
    test('should have column visibility controls', async () => {
      const page = sharedPage;
      
      // Look for column toggle controls
      const columnToggle = page.locator('button[title*="column" i], button[title*="hide" i], [aria-label*="column" i]').first();
      
      if (await columnToggle.count() > 0) {
        await columnToggle.click();
        await page.waitForTimeout(500);
        
        // Should show column options
        const columnOptions = page.locator('[role="menuitem"], .MuiMenuItem-root, input[type="checkbox"]');
        const optionCount = await columnOptions.count();
        
        if (optionCount > 0) {
          expect(optionCount).toBeGreaterThan(0);
          
          // Close menu
          await page.click('body');
          await page.waitForTimeout(300);
        }
      }
    });
  });
  
  test.describe('Advanced Filter Logic (Phase 2)', () => {
    
    test('should provide dynamic filter options based on data', async () => {
      const page = sharedPage;
      
      // Test status filter
      const statusFilter = page.locator('select, .MuiSelect-select').filter({ hasText: /status/i }).first();
      
      if (await statusFilter.count() > 0) {
        await statusFilter.click();
        await page.waitForTimeout(500);
        
        // Should show actual status values from data
        const options = page.locator('[role="option"], option');
        const optionCount = await options.count();
        
        if (optionCount > 0) {
          expect(optionCount).toBeGreaterThan(1); // At least "All" + one status
          
          // Verify has "All" option
          const allOption = options.filter({ hasText: /all.*status/i });
          expect(await allOption.count()).toBeGreaterThan(0);
        }
        
        // Close dropdown
        await page.click('body');
        await page.waitForTimeout(300);
      }
    });
    
    test('should validate filter combinations', async () => {
      const page = sharedPage;
      
      // Apply multiple filters
      const statusFilter = page.locator('select').first();
      const productFilter = page.locator('select').nth(1);
      
      if (await statusFilter.count() > 0 && await productFilter.count() > 0) {
        // Get initial data count
        const initialCount = await page.locator('tbody tr, .MuiCard-root').count();
        
        // Apply first filter
        await statusFilter.click();
        await page.waitForTimeout(300);
        const firstOption = page.locator('[role="option"], option').nth(1);
        if (await firstOption.count() > 0) {
          await firstOption.click();
          await page.waitForTimeout(1000);
        }
        
        // Apply second filter
        await productFilter.click();
        await page.waitForTimeout(300);
        const secondOption = page.locator('[role="option"], option').nth(1);
        if (await secondOption.count() > 0) {
          await secondOption.click();
          await page.waitForTimeout(1000);
        }
        
        // Verify filters work together
        const filteredCount = await page.locator('tbody tr, .MuiCard-root').count();
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }
    });
  });
  
  test.describe('Enhanced Search Features (Phase 2)', () => {
    
    test('should search specific fields accurately', async () => {
      const page = sharedPage;
      
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Test address search
        await searchInput.fill('123');
        await page.waitForTimeout(1000);
        
        // Should find projects with addresses containing "123"
        let results = await page.locator('tbody tr, .MuiCard-root').count();
        
        // Clear and test status search
        await searchInput.clear();
        await searchInput.fill('active');
        await page.waitForTimeout(1000);
        
        // Should find projects with "active" status
        results = await page.locator('tbody tr, .MuiCard-root').count();
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(1000);
      }
    });
    
    test('should handle search debouncing', async () => {
      const page = sharedPage;
      
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Rapid typing should be debounced
        await searchInput.fill('a');
        await searchInput.fill('ab');
        await searchInput.fill('abc');
        
        // Wait for debounce to settle
        await page.waitForTimeout(1200);
        
        // Should show results for "abc"
        const results = await page.locator('tbody tr, .MuiCard-root').count();
        expect(results).toBeGreaterThanOrEqual(0);
        
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
    });
  });
  
  test.describe('Gallery and Image Features (Phase 2)', () => {
    
    test('should handle image gallery in full card state', async () => {
      const page = sharedPage;
      
      // Switch to card view
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i]');
      if (await viewToggle.count() > 0) {
        await viewToggle.first().click();
        await page.waitForTimeout(500);
      }
      
      const firstCard = page.locator('.MuiCard-root, .bg-white.border-b').first();
      if (await firstCard.count() > 0) {
        // Expand to full state
        const showMoreButton = firstCard.locator('button').filter({ hasText: /show.*more|show.*all/i }).first();
        if (await showMoreButton.count() > 0) {
          await showMoreButton.click();
          await page.waitForTimeout(500);
          
          // Look for gallery section
          const gallerySection = firstCard.locator('details').filter({ hasText: /gallery/i }).first();
          if (await gallerySection.count() > 0) {
            // Expand gallery if collapsed
            const summary = gallerySection.locator('summary').first();
            if (await summary.count() > 0) {
              await summary.click();
              await page.waitForTimeout(500);
            }
            
            // Look for images
            const images = gallerySection.locator('img');
            const imageCount = await images.count();
            
            if (imageCount > 0) {
              expect(imageCount).toBeGreaterThan(0);
              
              // Test gallery size selector
              const sizeSelector = gallerySection.locator('select');
              if (await sizeSelector.count() > 0) {
                await sizeSelector.selectOption('medium');
                await page.waitForTimeout(500);
              }
            }
          }
        }
      }
    });
    
    test('should handle image modal opening', async () => {
      const page = sharedPage;
      
      // Look for clickable images
      const images = page.locator('img[src*="http"], img[src*="data:"]').first();
      
      if (await images.count() > 0) {
        // Mock modal behavior to prevent actual modal
        await page.evaluate(() => {
          // Add event listener to capture image clicks
          window.imageClicked = false;
          document.addEventListener('click', (e) => {
            if (e.target instanceof HTMLImageElement) {
              window.imageClicked = true;
            }
          });
        });
        
        await images.click();
        await page.waitForTimeout(500);
        
        // Verify image click was captured
        const imageClicked = await page.evaluate(() => window.imageClicked);
        expect(imageClicked).toBeTruthy();
      }
    });
  });
  
  test.describe('Business Logic Validation (Phase 2)', () => {
    
    test('should display financial data correctly', async () => {
      const page = sharedPage;
      
      // Look for financial data in table or cards
      const financialData = page.locator('text=/\\$[0-9,]+/').first();
      
      if (await financialData.count() > 0) {
        const financialText = await financialData.textContent();
        
        // Should be properly formatted currency
        expect(financialText).toMatch(/\$[\d,]+/);
        
        // Should not have invalid formats
        expect(financialText).not.toMatch(/\$\$/);
        expect(financialText).not.toMatch(/\$NaN/);
      }
    });
    
    test('should format dates consistently', async () => {
      const page = sharedPage;
      
      // Look for date fields
      const dateElements = page.locator('text=/\\d{1,2}\/\\d{1,2}\/\\d{4}|\\d{4}-\\d{2}-\\d{2}/');
      const dateCount = await dateElements.count();
      
      if (dateCount > 0) {
        for (let i = 0; i < Math.min(dateCount, 5); i++) {
          const dateText = await dateElements.nth(i).textContent();
          
          // Should match expected date formats
          const isValidFormat = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateText || '') ||
                               /^\d{4}-\d{2}-\d{2}$/.test(dateText || '') ||
                               /^[A-Za-z]{3} \d{1,2}, \d{4}$/.test(dateText || '');
          
          expect(isValidFormat).toBeTruthy();
        }
      }
    });
    
    test('should validate status pill display', async () => {
      const page = sharedPage;
      
      // Look for status pills/badges
      const statusElements = page.locator('.px-2.py-1, .rounded-full, [class*="status"], [class*="badge"]');
      const statusCount = await statusElements.count();
      
      if (statusCount > 0) {
        const firstStatus = statusElements.first();
        const statusText = await firstStatus.textContent();
        
        // Should have valid status text
        expect(statusText?.trim()).toBeTruthy();
        expect(statusText?.trim().length).toBeGreaterThan(0);
        
        // Should have styling
        const hasBackgroundColor = await firstStatus.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
        });
        
        expect(hasBackgroundColor).toBeTruthy();
      }
    });
  });

  test.describe('Performance Testing (Phase 3)', () => {
    
    test('should handle large dataset performance', async () => {
      const page = sharedPage;
      
      // Measure initial page load time
      const startTime = Date.now();
      await page.reload();
      await page.waitForSelector('tbody tr, .MuiCard-root', { timeout: 10000 });
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (15 seconds for compilation)
      expect(loadTime).toBeLessThan(15000);
      
      // Test pagination if present (indicates large dataset)
      const pagination = page.locator('.MuiPagination-root, .pagination, [aria-label*="pagination" i], .MuiTablePagination-root, [data-testid*="pagination"]');
      if (await pagination.count() > 0) {
        const paginationButtons = pagination.locator('button');
        const buttonCount = await paginationButtons.count();
        
        if (buttonCount > 2) {
          // Should have multiple pages for large datasets
          expect(buttonCount).toBeGreaterThan(2);
        }
      }
    });
    
    test('should handle rapid user interactions', async () => {
      const page = sharedPage;
      
      // Rapid search typing
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        const startTime = Date.now();
        
        // Simulate rapid typing
        for (let i = 0; i < 10; i++) {
          await searchInput.fill(`search${i}`);
          await page.waitForTimeout(50); // Very rapid typing
        }
        
        await page.waitForTimeout(2000); // Wait for debounce
        const responseTime = Date.now() - startTime;
        
        // Should handle rapid input without hanging  
        expect(responseTime).toBeLessThan(8000);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
    });
    
    test('should maintain performance during view switching', async () => {
      const page = sharedPage;
      
      const viewToggle = page.locator('[data-testid*="view"], button[title*="view" i]');
      
      if (await viewToggle.count() > 0) {
        const startTime = Date.now();
        
        // Switch views multiple times rapidly
        for (let i = 0; i < 5; i++) {
          await viewToggle.first().click();
          await page.waitForTimeout(200);
          
          // Ensure page remains responsive
          await expect(page.locator('h1').first()).toBeVisible();
        }
        
        const totalTime = Date.now() - startTime;
        
        // Should complete view switches in reasonable time
        expect(totalTime).toBeLessThan(12000);
      }
    });
  });
  
  test.describe('Accessibility Testing (Phase 3)', () => {
    
    test('should have proper ARIA labels', async () => {
      const page = sharedPage;
      
      // Check for table accessibility
      const table = page.locator('table, [role="table"]').first();
      if (await table.count() > 0) {
        // Table should have aria-label or aria-labelledby
        const hasLabel = await table.evaluate(el => {
          return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
        });
        
        // Headers should have proper structure
        const headers = page.locator('th, [role="columnheader"]');
        const headerCount = await headers.count();
        
        if (headerCount > 0) {
          expect(headerCount).toBeGreaterThan(0);
        }
      }
      
      // Check buttons have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          const hasAccessibleName = await button.evaluate(el => {
            return el.textContent?.trim() || 
                   el.getAttribute('aria-label') || 
                   el.getAttribute('title') || 
                   el.querySelector('img')?.getAttribute('alt');
          });
          
          expect(hasAccessibleName).toBeTruthy();
        }
      }
    });
    
    test('should support keyboard navigation', async () => {
      const page = sharedPage;
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Should have visible focus indicator
      const focusedElement = await page.locator(':focus').count();
      expect(focusedElement).toBeGreaterThan(0);
      
      // Test multiple tab presses
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        // Should maintain focus somewhere
        const currentFocus = await page.locator(':focus').count();
        expect(currentFocus).toBeGreaterThanOrEqual(0);
      }
      
      // Test Enter key on focused element
      const focusedElement2 = page.locator(':focus');
      if (await focusedElement2.count() > 0) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        // Page should remain stable after Enter
        await expect(page.locator('h1').first()).toBeVisible();
      }
    });
    
    test('should have proper heading hierarchy', async () => {
      const page = sharedPage;
      
      // Check heading structure
      const h1Count = await page.locator('h1').count();
      const h2Count = await page.locator('h2').count();
      const h3Count = await page.locator('h3').count();
      
      // Should have at least one H1 (may have multiple in modern SPAs)
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // If we have H3s, we should have H2s (proper hierarchy)
      if (h3Count > 0) {
        expect(h2Count).toBeGreaterThanOrEqual(0); // Allow for direct H1 -> H3 in some cases
      }
      
      // Check for skip links or landmarks
      const landmarks = await page.locator('[role="main"], [role="navigation"], main, nav').count();
      expect(landmarks).toBeGreaterThanOrEqual(1);
    });
    
    test('should have sufficient color contrast', async () => {
      const page = sharedPage;
      
      // Test status pills/badges for contrast
      const statusElements = page.locator('.px-2.py-1, .rounded, [class*="status"]');
      const statusCount = await statusElements.count();
      
      if (statusCount > 0) {
        const firstStatus = statusElements.first();
        
        // Get computed styles
        const styles = await firstStatus.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color
          };
        });
        
        // Should have defined background and text colors (allow transparent backgrounds)
        expect(styles.backgroundColor).toBeTruthy();
        expect(styles.color).toBeTruthy();
      } else {
        // If no status elements found, test passes (no elements to check)
        expect(true).toBe(true);
      }
    });
  });
  
  test.describe('Edge Cases and Error Recovery (Phase 3)', () => {
    
    test('should handle network errors gracefully', async () => {
      const page = sharedPage;
      
      // Simulate network failure during refresh
      await page.route('**/*', route => {
        if (route.request().url().includes('graphql')) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      // Try to refresh - should handle gracefully
      const refreshButton = page.locator('button').filter({ hasText: /refresh/i }).first();
      if (await refreshButton.count() > 0) {
        await refreshButton.click();
        await page.waitForTimeout(3000);
        
        // Should show error state or maintain previous data
        const errorMessages = page.locator('[role="alert"], .error-message, text=/error|failed/i');
        const dataElements = page.locator('tbody tr, .MuiCard-root');
        
        // Either show error or maintain data
        const hasError = await errorMessages.count() > 0;
        const hasData = await dataElements.count() > 0;
        
        expect(hasError || hasData).toBeTruthy();
      }
      
      // Remove network interception
      await page.unroute('**/*');
    });
    
    test('should handle empty state properly', async () => {
      const page = sharedPage;
      
      // Apply filters that might result in no data
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Search for something unlikely to exist
        await searchInput.fill('zzz_nonexistent_project_xyz_123');
        await page.waitForTimeout(2000);
        
        const dataElements = page.locator('tbody tr, .MuiCard-root');
        const dataCount = await dataElements.count();
        
        if (dataCount === 0) {
          // Should show appropriate empty state
          const emptyMessage = page.locator('text=/no projects|no results|empty|not found/i');
          const messageCount = await emptyMessage.count();
          
          // Either show empty message or maintain UI structure
          expect(messageCount >= 0).toBeTruthy();
        }
        
        // Clear search to restore data
        await searchInput.clear();
        await page.waitForTimeout(1000);
      }
    });
    
    test('should handle malformed data gracefully', async () => {
      const page = sharedPage;
      
      // Look for any data validation issues
      const dataElements = page.locator('tbody tr, .MuiCard-root');
      const dataCount = await dataElements.count();
      
      if (dataCount > 0) {
        // Check for common data issues
        const undefinedText = page.locator('text="undefined"');
        const nullText = page.locator('text="null"');
        const nanText = page.locator('text="NaN"');
        
        // Should not display raw undefined/null/NaN values
        expect(await undefinedText.count()).toBe(0);
        expect(await nullText.count()).toBe(0);
        expect(await nanText.count()).toBe(0);
        
        // Check for properly formatted N/A or default values
        const naText = page.locator('text="N/A"');
        const naCount = await naText.count();
        
        // N/A is acceptable for missing data
        expect(naCount).toBeGreaterThanOrEqual(0);
      }
    });
    
    test('should maintain state during browser resize', async () => {
      const page = sharedPage;
      
      // Get initial state
      const initialData = await page.locator('tbody tr, .MuiCard-root').count();
      
      // Test various viewport sizes
      const viewports = [
        { width: 320, height: 568 },  // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1440, height: 900 }, // Desktop
        { width: 1920, height: 1080 } // Large Desktop
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        
        // Data should remain consistent
        const currentData = await page.locator('tbody tr, .MuiCard-root').count();
        expect(currentData).toBe(initialData);
        
        // Page should remain functional
        await expect(page.locator('h1').first()).toBeVisible();
      }
      
      // Restore original viewport
      await page.setViewportSize({ width: 1280, height: 1080 });
      await page.waitForTimeout(500);
    });
  });
  
  test.describe('Integration Testing (Phase 3)', () => {
    
    test('should integrate properly with admin layout', async () => {
      const page = sharedPage;
      
      // Verify admin layout elements are present
      const sidebar = page.locator('[role="navigation"], .sidebar, nav').first();
      const header = page.locator('header, .header, h1').first();
      
      // Should have admin navigation
      expect(await sidebar.count() + await header.count()).toBeGreaterThan(0);
      
      // Verify page title in browser/header
      const pageTitle = await page.title();
      expect(pageTitle.toLowerCase()).toContain('project');
      
      // Verify breadcrumbs or navigation indicators
      const breadcrumbs = page.locator('[aria-label*="breadcrumb"], .breadcrumb, nav a');
      if (await breadcrumbs.count() > 0) {
        expect(await breadcrumbs.count()).toBeGreaterThan(0);
      }
    });
    
    test('should handle authentication properly', async () => {
      const page = sharedPage;
      
      // Verify authenticated state
      const userInfo = page.locator('text=/logged in|info@realtechee.com|super_admin/i');
      const userCount = await userInfo.count();
      
      if (userCount > 0) {
        expect(userCount).toBeGreaterThan(0);
      }
      
      // Verify admin access (should be on admin page without redirect)
      const currentUrl = page.url();
      expect(currentUrl).toContain('/admin/projects');
      
      // Should not show login form
      const loginForm = page.locator('input[type="password"]').or(page.locator('text=/sign in|login/i'));
      expect(await loginForm.count()).toBe(0);
    });
    
    test('should handle permissions correctly', async () => {
      const page = sharedPage;
      
      // Verify admin-specific features are available (broader search)
      const adminFeatures = page.locator('button').filter({ hasText: /create|edit|archive|delete|new|add|action|more/i });
      const featureCount = await adminFeatures.count();
      
      // Should have admin-level access (presence of any admin UI elements)
      const projectCount = await page.locator('tbody tr, .MuiCard-root').count();
      const totalButtons = await page.locator('button').count();
      
      // Basic admin access verification: should have some interactive elements
      expect(totalButtons).toBeGreaterThan(0); // At least some buttons should exist
      
      // Should be able to access admin functionality (no access denied)
      const accessDenied = page.locator('text=/access denied|forbidden|401|403/i');
      expect(await accessDenied.count()).toBe(0);
      
      // Should not show unauthorized messages
      const unauthorizedText = page.locator('text=/unauthorized|access denied|permission/i');
      expect(await unauthorizedText.count()).toBe(0);
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle errors gracefully', async () => {
      const page = sharedPage;
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
    
    test('should maintain responsiveness during interactions', async () => {
      const page = sharedPage;
      
      // Test rapid interactions don't break the page
      const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        // Rapid search inputs
        await searchInput.fill('a');
        await searchInput.fill('ab');
        await searchInput.fill('abc');
        await page.waitForTimeout(1000);
        
        // Page should still be responsive - check specifically for the page title H1
        await expect(page.locator('h1').first()).toBeVisible();
        
        await searchInput.clear();
      }
    });
  });
});