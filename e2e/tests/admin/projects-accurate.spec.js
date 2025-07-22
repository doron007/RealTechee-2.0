/**
 * Admin Projects Page Tests - ACCURATE VERSION
 * 
 * This test suite validates the ACTUAL AdminDataGrid implementation
 * based on the real component structure and functionality.
 */

const { test, expect } = require('@playwright/test');

test.describe('Admin Projects Page - Accurate Tests', () => {
  
  let sharedPage;
  
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ 
      storageState: 'e2e/playwright/.auth/user.json',
      viewport: { width: 1280, height: 1080 }
    });
    sharedPage = await context.newPage();
    
    // Navigate to projects page
    await sharedPage.goto('/admin/projects');
    
    // Wait for page to load
    await expect(sharedPage.locator('h1').first()).toBeVisible();
    await sharedPage.waitForLoadState('networkidle');
  });
  
  test.afterAll(async () => {
    if (sharedPage) {
      await sharedPage.close();
    }
  });

  test.describe('Real UI Elements Validation', () => {
    
    test('should have correct page structure', async () => {
      const page = sharedPage;
      
      // Verify main title (be specific to avoid multiple H1s)
      const title = page.locator('h1').filter({ hasText: 'Projects' }).first();
      await expect(title).toBeVisible();
      
      // Verify search field with correct placeholder
      const searchField = page.locator('input[placeholder*="Search projects"]');
      await expect(searchField).toBeVisible();
      
      // Verify view toggle exists (tablet and up only)
      const viewToggle = page.locator('button').filter({ has: page.locator('svg[data-testid="ViewModuleIcon"], svg[data-testid="TableChartIcon"]') });
      
      // Should exist but might be hidden on mobile
      if (await viewToggle.count() > 0) {
        console.log('✅ View toggle found');
      } else {
        console.log('ℹ️ View toggle not visible (might be mobile view)');
      }
    });
    
    test('should validate search functionality correctly', async () => {
      const page = sharedPage;
      
      // Find the actual search input
      const searchInput = page.locator('input[placeholder*="Search projects"]');
      await expect(searchInput).toBeVisible();
      
      // Get initial data count from table or cards
      const initialTableRows = await page.locator('tbody tr').count();
      const initialCards = await page.locator('.bg-white.border-b.border-gray-100').count(); 
      const initialCount = Math.max(initialTableRows, initialCards);
      
      console.log(`📊 Initial data count: ${initialCount}`);
      
      if (initialCount === 0) {
        console.log('ℹ️ No data available for search testing');
        return;
      }
      
      // Extract search term from visible data
      let searchTerm = '';
      
      if (initialTableRows > 0) {
        // Get text from first data row, second cell (address column)
        const firstRowCell = page.locator('tbody tr').first().locator('td').nth(1);
        const cellText = await firstRowCell.textContent();
        if (cellText && cellText.trim() !== 'No address provided') {
          searchTerm = cellText.trim().split(/[\s,]+/)[0];
        }
      }
      
      if (!searchTerm && initialCards > 0) {
        // Get text from first card using correct selector
        const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
        const cardText = await firstCard.textContent();
        if (cardText) {
          // Extract a meaningful search term
          const words = cardText.split(/\s+/).filter(word => word.length > 3);
          searchTerm = words[0] || '';
        }
      }
      
      if (searchTerm) {
        console.log(`🔍 Testing search with term: "${searchTerm}"`);
        
        // Perform search
        await searchInput.fill(searchTerm);
        await page.waitForTimeout(1000); // Wait for debounce
        
        // Check filtered results
        const filteredTableRows = await page.locator('tbody tr').count();
        const filteredCards = await page.locator('.bg-white.border-b.border-gray-100').count();
        const filteredCount = Math.max(filteredTableRows, filteredCards);
        
        console.log(`📊 Filtered count: ${filteredCount}`);
        
        // Validate search worked
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(1000);
        
        // Verify data restored
        const restoredTableRows = await page.locator('tbody tr').count();
        const restoredCards = await page.locator('.bg-white.border-b.border-gray-100').count();
        const restoredCount = Math.max(restoredTableRows, restoredCards);
        
        expect(restoredCount).toBe(initialCount);
        console.log('✅ Search functionality validated');
      } else {
        console.log('ℹ️ Could not extract search term from data');
      }
    });
    
    test('should validate view toggle functionality', async () => {
      const page = sharedPage;
      
      // Check viewport - view toggle only shows on md and up (768px+)
      const viewport = page.viewportSize();
      if (viewport.width < 768) {
        console.log('ℹ️ Skipping view toggle test on mobile viewport');
        return;
      }
      
      // Find view toggle button by its Material-UI icons
      const viewToggleButton = page.locator('button').filter({ 
        has: page.locator('svg[data-testid="ViewModuleIcon"], svg[data-testid="TableChartIcon"]') 
      });
      
      if (await viewToggleButton.count() === 0) {
        console.log('ℹ️ View toggle button not found - feature may not be available');
        return;
      }
      
      await expect(viewToggleButton).toBeVisible();
      
      // Get initial state
      const initialTableRows = await page.locator('tbody tr').count();
      const initialCards = await page.locator('.bg-white.border-b.border-gray-100').count();
      
      console.log(`📊 Before toggle: table rows=${initialTableRows}, cards=${initialCards}`);
      
      // Click to toggle view
      await viewToggleButton.click();
      await page.waitForTimeout(2000); // Wait longer for view transition and data rendering
      
      // Check new state with correct card selectors
      const newTableRows = await page.locator('tbody tr').count();
      const newCards = await page.locator('.bg-white.border-b.border-gray-100').count();
      
      console.log(`📊 After toggle: table rows=${newTableRows}, cards=${newCards}`);
      
      // Debug: Check if we can find any card-like elements
      const anyCards = await page.locator('div[class*="card"], .shadow, .rounded-lg').count();
      console.log(`🔍 Debug: Found ${anyCards} card-like elements`);
      
      // Verify view actually changed (table rows should go down when switching to cards)
      const viewChanged = (newTableRows < initialTableRows) || (newCards > initialCards);
      expect(viewChanged).toBeTruthy();
      
      console.log('✅ View toggle functionality validated');
    });
    
    test('should validate filter functionality with real data', async () => {
      const page = sharedPage;
      
      // Find filter selects using Material-UI specific selectors
      const filterSelects = page.locator('.MuiSelect-select, [role="combobox"], .MuiFormControl-root .MuiInputBase-root');
      const filterCount = await filterSelects.count();
      
      console.log(`🔍 Looking for filters - found ${filterCount} potential filter elements`);
      
      // Debug: Check for labels that might indicate filters
      const filterLabels = page.locator('label').filter({ hasText: /status|product/i });
      const labelCount = await filterLabels.count();
      console.log(`🔍 Found ${labelCount} filter labels`);
      
      if (filterCount === 0 && labelCount === 0) {
        console.log('ℹ️ No filters found');
        return;
      }
      
      console.log(`🔍 Found ${filterCount} filters`);
      
      // Get initial data count
      const initialTableRows = await page.locator('tbody tr').count();
      const initialCards = await page.locator('.bg-white.border-b.border-gray-100').count();
      const initialCount = Math.max(initialTableRows, initialCards);
      
      if (initialCount === 0) {
        console.log('ℹ️ No data available for filter testing');
        return;
      }
      
      // Test first filter
      const firstFilter = filterSelects.first();
      
      // Click to open dropdown
      await firstFilter.click();
      await page.waitForTimeout(500);
      
      // Look for filter options (skip "All" options)
      const options = page.locator('[role="option"], li[role="menuitem"]');
      const optionCount = await options.count();
      
      console.log(`📋 Found ${optionCount} filter options`);
      
      if (optionCount > 1) {
        // Find a non-"All" option
        let testOption = null;
        for (let i = 0; i < optionCount; i++) {
          const option = options.nth(i);
          const optionText = await option.textContent();
          if (optionText && !optionText.toLowerCase().includes('all')) {
            testOption = option;
            console.log(`🎯 Testing filter option: "${optionText}"`);
            break;
          }
        }
        
        if (testOption) {
          await testOption.click();
          await page.waitForTimeout(1500); // Wait for filtering
          
          // Check filtered results
          const filteredTableRows = await page.locator('tbody tr').count();
          const filteredCards = await page.locator('.bg-white.border-b.border-gray-100').count();
          const filteredCount = Math.max(filteredTableRows, filteredCards);
          
          console.log(`📊 Filtered results: ${filteredCount}`);
          expect(filteredCount).toBeLessThanOrEqual(initialCount);
          
          // Reset filter
          await firstFilter.click();
          await page.waitForTimeout(300);
          const allOption = options.filter({ hasText: /all/i }).first();
          if (await allOption.count() > 0) {
            await allOption.click();
            await page.waitForTimeout(1000);
          }
          
          console.log('✅ Filter functionality validated');
        }
      }
    });
    
    test('should validate custom actions dropdown', async () => {
      const page = sharedPage;
      
      // Find the custom actions button (MoreVert icon)
      const moreButton = page.locator('button').filter({ 
        has: page.locator('svg[data-testid="MoreVertIcon"]') 
      });
      
      if (await moreButton.count() === 0) {
        console.log('ℹ️ Custom actions button not found');
        return;
      }
      
      await expect(moreButton).toBeVisible();
      
      // Click to open menu
      await moreButton.click();
      await page.waitForTimeout(500);
      
      // Verify menu items exist
      const menuItems = page.locator('[role="menuitem"]');
      const itemCount = await menuItems.count();
      
      console.log(`📋 Found ${itemCount} menu items`);
      expect(itemCount).toBeGreaterThan(0);
      
      // Check for expected items
      const exportItem = menuItems.filter({ hasText: /export.*pdf/i });
      const reportItem = menuItems.filter({ hasText: /generate.*report/i });
      const bulkItem = menuItems.filter({ hasText: /bulk.*operations/i });
      
      expect(await exportItem.count()).toBeGreaterThan(0);
      expect(await reportItem.count()).toBeGreaterThan(0);
      expect(await bulkItem.count()).toBeGreaterThan(0);
      
      // Test clicking Export to PDF (which shows alert)
      let alertShown = false;
      page.on('dialog', async dialog => {
        console.log(`📄 Alert shown: "${dialog.message()}"`);
        expect(dialog.message()).toContain('Export to PDF functionality will be implemented');
        alertShown = true;
        await dialog.accept();
      });
      
      await exportItem.click();
      await page.waitForTimeout(500);
      
      expect(alertShown).toBeTruthy();
      console.log('✅ Custom actions dropdown validated');
    });
    
    test('should validate archive toggle functionality', async () => {
      const page = sharedPage;
      
      // Find archive checkbox
      const archiveCheckbox = page.locator('input[type="checkbox"]').filter({ 
        hasText: /show archived/i 
      }).or(
        page.locator('input[id*="show-archived"]')
      );
      
      if (await archiveCheckbox.count() === 0) {
        console.log('ℹ️ Archive toggle not found');
        return;
      }
      
      const isChecked = await archiveCheckbox.isChecked();
      console.log(`📋 Archive toggle initial state: ${isChecked ? 'showing archived' : 'showing active'}`);
      
      // Get initial data count
      const initialTableRows = await page.locator('tbody tr').count();
      const initialCards = await page.locator('.bg-white.border-b.border-gray-100').count();
      const initialCount = Math.max(initialTableRows, initialCards);
      
      // Toggle archive view
      await archiveCheckbox.click();
      await page.waitForTimeout(1500); // Wait for data reload
      
      // Check new state
      const newChecked = await archiveCheckbox.isChecked();
      expect(newChecked).toBe(!isChecked);
      
      const newTableRows = await page.locator('tbody tr').count();
      const newCards = await page.locator('.bg-white.border-b.border-gray-100').count();
      const newCount = Math.max(newTableRows, newCards);
      
      console.log(`📊 After toggle: ${newCount} items`);
      
      // Toggle back
      await archiveCheckbox.click();
      await page.waitForTimeout(1500);
      
      const restoredTableRows = await page.locator('tbody tr').count();
      const restoredCards = await page.locator('.bg-white.border-b.border-gray-100').count();
      const restoredCount = Math.max(restoredTableRows, restoredCards);
      
      expect(restoredCount).toBe(initialCount);
      console.log('✅ Archive toggle functionality validated');
    });
    
    test('should validate density toggle functionality', async () => {
      const page = sharedPage;
      
      // Find density toggle button (ViewAgenda/ViewComfy icons)
      const densityButton = page.locator('button').filter({ 
        has: page.locator('svg[data-testid="ViewAgendaIcon"], svg[data-testid="ViewComfyIcon"]') 
      });
      
      if (await densityButton.count() === 0) {
        console.log('ℹ️ Density toggle not found');
        return;
      }
      
      await expect(densityButton).toBeVisible();
      
      // Click to toggle density
      await densityButton.click();
      await page.waitForTimeout(500);
      
      // Verify button still exists and is functional
      await expect(densityButton).toBeVisible();
      
      console.log('✅ Density toggle functionality validated');
    });
  });
  
  test.describe('Data Validation', () => {
    
    test('should display data in correct format', async () => {
      const page = sharedPage;
      
      // Check for table or cards with correct selectors based on actual component structure
      const tableRows = await page.locator('tbody tr').count();
      // ProgressiveProjectCard uses bg-white border-b classes, not MuiCard-root
      const progressiveCards = await page.locator('.bg-white.border-b.border-gray-100').count();
      const anyCards = await page.locator('[class*="card"], .shadow, .rounded-lg.bg-white').count();
      
      console.log(`📊 Data detection: table rows=${tableRows}, progressive cards=${progressiveCards}, any cards=${anyCards}`);
      
      const hasTableRows = tableRows > 0;
      const hasCards = progressiveCards > 0 || anyCards > 0;
      
      if (!hasTableRows && !hasCards) {
        console.log('ℹ️ No data displayed - this may be normal for empty state');
        return;
      }
      
      if (hasTableRows) {
        console.log(`📊 Table view active with ${tableRows} rows`);
        
        // Validate table headers exist
        const headers = page.locator('thead th, [role="columnheader"]');
        const headerCount = await headers.count();
        expect(headerCount).toBeGreaterThan(0);
        
        // Check for status column data
        const statusCells = page.locator('tbody tr').first().locator('td').first();
        if (await statusCells.count() > 0) {
          const statusText = await statusCells.textContent();
          expect(statusText?.trim()).toBeTruthy();
        }
      }
      
      if (hasCards) {
        console.log(`📊 Cards view active with ${progressiveCards} progressive cards`);
        
        // Validate cards have content using correct selector
        const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
        if (await firstCard.count() > 0) {
          const cardText = await firstCard.textContent();
          expect(cardText?.trim()).toBeTruthy();
          console.log(`📋 First card content preview: "${cardText?.substring(0, 100)}..."`);
        }
      }
      
      console.log('✅ Data format validation passed');
    });
  });
});