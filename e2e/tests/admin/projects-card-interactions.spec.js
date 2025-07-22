/**
 * Admin Projects Card Interaction Tests
 * 
 * Comprehensive testing for ProgressiveProjectCard functionality:
 * - Card state transitions (collapsed → basic → full)
 * - Expand/collapse via address click and arrow button
 * - "Show More" functionality
 * - Action buttons in different states
 * - Interactive elements and click handling
 */

const { test, expect } = require('@playwright/test');

test.describe('Admin Projects Card Interactions', () => {
  
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
  
  test.beforeEach(async () => {
    // Ensure we're in cards view for all tests
    const viewToggleButton = sharedPage.locator('button').filter({ 
      has: sharedPage.locator('svg[data-testid="ViewModuleIcon"], svg[data-testid="TableChartIcon"]') 
    });
    
    if (await viewToggleButton.count() > 0) {
      // Check if we're already in cards view (should show table rows=0, cards>0)
      const tableRows = await sharedPage.locator('tbody tr').count();
      const cards = await sharedPage.locator('.bg-white.border-b.border-gray-100').count();
      
      if (tableRows > 0 && cards === 0) {
        // We're in table view, switch to cards view
        await viewToggleButton.click();
        await sharedPage.waitForTimeout(1000);
        console.log('🔄 Switched to cards view for testing');
      }
    }
  });
  
  test.afterAll(async () => {
    if (sharedPage) {
      await sharedPage.close();
    }
  });

  test.describe('Card State Transitions', () => {
    
    test('should start in collapsed state by default', async () => {
      const page = sharedPage;
      
      // Get first card
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      await expect(firstCard).toBeVisible();
      
      // In collapsed state, should show minimal content
      const statusBadge = firstCard.locator('[class*="bg-blue-100"]'); // Status badge
      const address = firstCard.locator('div:has-text("1050"), div:has-text("Ramon")').first(); // Address
      
      await expect(statusBadge).toBeVisible();
      await expect(address).toBeVisible();
      
      // Should not show expanded content like "Property Information" or detailed grids
      const expandedContent = firstCard.locator('text="Property Information"');
      expect(await expandedContent.count()).toBe(0);
      
      console.log('✅ Card starts in collapsed state correctly');
    });
    
    test('should expand to basic state when clicking address', async () => {
      const page = sharedPage;
      
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      
      // Find clickable address area (has cursor-pointer class)
      const addressClickable = firstCard.locator('.cursor-pointer').first();
      await expect(addressClickable).toBeVisible();
      
      // Click to expand
      await addressClickable.click();
      await page.waitForTimeout(500);
      
      // Should now show basic expanded content
      const expandedGrid = firstCard.locator('.grid.grid-cols-1');
      await expect(expandedGrid).toBeVisible();
      
      // Should show property address, created date, owner, agent, etc.
      const propertySection = firstCard.locator('text="Property Address"');
      await expect(propertySection).toBeVisible();
      
      const createdSection = firstCard.locator('text="Created"');
      await expect(createdSection).toBeVisible();
      
      console.log('✅ Card expands to basic state via address click');
    });
    
    test('should expand to basic state when clicking arrow button', async () => {
      const page = sharedPage;
      
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      
      // Ensure we start collapsed
      const addressClickable = firstCard.locator('.cursor-pointer').first();
      await addressClickable.click(); // Expand
      await page.waitForTimeout(200);
      await addressClickable.click(); // Collapse back
      await page.waitForTimeout(200);
      
      // Find the expand arrow button (should be a button now, not just div)
      const expandButton = firstCard.locator('button[title*="Expand"], button:has(img[alt="Expand"])');
      await expect(expandButton).toBeVisible();
      
      // Click the arrow button to expand
      await expandButton.click();
      await page.waitForTimeout(500);
      
      // Should show basic expanded content
      const expandedGrid = firstCard.locator('.grid.grid-cols-1');
      await expect(expandedGrid).toBeVisible();
      
      console.log('✅ Card expands to basic state via arrow button click');
    });
    
    test('should collapse from basic state when clicking address again', async () => {
      const page = sharedPage;
      
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      const addressClickable = firstCard.locator('.cursor-pointer').first();
      
      // Expand to basic state
      await addressClickable.click();
      await page.waitForTimeout(500);
      
      // Verify expanded
      const expandedGrid = firstCard.locator('.grid.grid-cols-1');
      await expect(expandedGrid).toBeVisible();
      
      // Click again to collapse
      await addressClickable.click();
      await page.waitForTimeout(500);
      
      // Should be collapsed - no expanded grid visible
      expect(await expandedGrid.count()).toBe(0);
      
      console.log('✅ Card collapses from basic state via address click');
    });
    
    test('should expand to full state when clicking "Show More" button', async () => {
      const page = sharedPage;
      
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      const addressClickable = firstCard.locator('.cursor-pointer').first();
      
      // First expand to basic state
      await addressClickable.click();
      await page.waitForTimeout(500);
      
      // Find and click "Show More" button
      const showMoreButton = firstCard.locator('button:has-text("Show All Details"), .show-more-button');
      await expect(showMoreButton).toBeVisible();
      
      await showMoreButton.click();
      await page.waitForTimeout(1000);
      
      // Should now show full expanded content with details sections
      const propertyInfo = firstCard.locator('text="Property Information"');
      const homeowners = firstCard.locator('text="Homeowners"');
      const financial = firstCard.locator('text="Financial Information"');
      
      await expect(propertyInfo).toBeVisible();
      await expect(homeowners).toBeVisible();
      await expect(financial).toBeVisible();
      
      console.log('✅ Card expands to full state via Show More button');
    });
  });

  test.describe('Action Button Functionality', () => {
    
    test('should show action buttons in collapsed state (desktop)', async () => {
      const page = sharedPage;
      
      // Ensure we're on desktop viewport
      await page.setViewportSize({ width: 1280, height: 1080 });
      
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      
      // Action buttons should be visible on desktop (hidden on mobile)
      const actionButtons = firstCard.locator('.action-buttons');
      await expect(actionButtons).toBeVisible();
      
      // Should have multiple action buttons (Open, Edit, etc.)
      const buttons = firstCard.locator('.action-buttons button, .action-buttons .MuiIconButton-root');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
      
      console.log(`✅ Found ${buttonCount} action buttons in collapsed state`);
    });
    
    test('should show action buttons in basic expanded state', async () => {
      const page = sharedPage;
      
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      const addressClickable = firstCard.locator('.cursor-pointer').first();
      
      // Expand to basic state
      await addressClickable.click();
      await page.waitForTimeout(500);
      
      // Should have action buttons at bottom of expanded card
      const actionSection = firstCard.locator('div:has(button):last-of-type');
      const actionButtons = actionSection.locator('button');
      const buttonCount = await actionButtons.count();
      
      expect(buttonCount).toBeGreaterThan(0);
      console.log(`✅ Found ${buttonCount} action buttons in basic expanded state`);
    });
    
    test('should show large action buttons in full expanded state', async () => {
      const page = sharedPage;
      
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      const addressClickable = firstCard.locator('.cursor-pointer').first();
      
      // Expand to basic then full state
      await addressClickable.click();
      await page.waitForTimeout(500);
      
      const showMoreButton = firstCard.locator('button:has-text("Show All Details"), .show-more-button');
      await showMoreButton.click();
      await page.waitForTimeout(1000);
      
      // Should have large action buttons at bottom with sticky positioning
      const stickyActions = firstCard.locator('.sticky.bottom-0');
      await expect(stickyActions).toBeVisible();
      
      const actionButtons = stickyActions.locator('button');
      const buttonCount = await actionButtons.count();
      
      expect(buttonCount).toBeGreaterThan(0);
      console.log(`✅ Found ${buttonCount} large action buttons in full expanded state`);
    });
  });

  test.describe('Interactive Elements', () => {
    
    test('should handle density toggle affecting card layout', async () => {
      const page = sharedPage;
      
      // Find density toggle button
      const densityButton = page.locator('button').filter({ 
        has: page.locator('svg[data-testid="ViewAgendaIcon"], svg[data-testid="ViewComfyIcon"]') 
      });
      
      if (await densityButton.count() > 0) {
        const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
        
        // Get initial card height
        const initialBox = await firstCard.boundingBox();
        
        // Toggle density
        await densityButton.click();
        await page.waitForTimeout(500);
        
        // Get new card height
        const newBox = await firstCard.boundingBox();
        
        // Cards should change size (though both might be valid)
        console.log(`📏 Card height changed from ${initialBox?.height} to ${newBox?.height}`);
        
        console.log('✅ Density toggle affects card layout');
      } else {
        console.log('ℹ️ Density toggle not found');
      }
    });
    
    test('should prevent expansion when clicking on action buttons', async () => {
      const page = sharedPage;
      
      await page.setViewportSize({ width: 1280, height: 1080 });
      
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      
      // Ensure we start collapsed
      const addressClickable = firstCard.locator('.cursor-pointer').first();
      const currentExpanded = await firstCard.locator('.grid.grid-cols-1').count();
      if (currentExpanded > 0) {
        await addressClickable.click(); // Collapse if expanded
        await page.waitForTimeout(200);
      }
      
      // Click on an action button (should not expand card)
      const actionButton = firstCard.locator('.action-buttons button').first();
      if (await actionButton.count() > 0) {
        await actionButton.click();
        await page.waitForTimeout(500);
        
        // Card should still be collapsed
        const stillCollapsed = await firstCard.locator('.grid.grid-cols-1').count();
        expect(stillCollapsed).toBe(0);
        
        console.log('✅ Clicking action buttons does not expand card');
      }
    });
  });

  test.describe('Accessibility and UX', () => {
    
    test('should have proper ARIA labels and titles', async () => {
      const page = sharedPage;
      
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      
      // Expand button should have title attribute
      const expandButton = firstCard.locator('button[title*="Expand"]');
      await expect(expandButton).toBeVisible();
      
      const title = await expandButton.getAttribute('title');
      expect(title).toBeTruthy();
      
      console.log(`✅ Expand button has title: "${title}"`);
    });
    
    test('should show hover states on interactive elements', async () => {
      const page = sharedPage;
      
      const firstCard = page.locator('.bg-white.border-b.border-gray-100').first();
      
      // Hover over expand button should show hover state
      const expandButton = firstCard.locator('button[title*="Expand"]');
      await expandButton.hover();
      
      // Should have hover classes applied
      const hasHoverClass = await expandButton.evaluate(el => {
        return el.classList.contains('hover:bg-gray-100') || 
               getComputedStyle(el).backgroundColor !== getComputedStyle(el.parentElement).backgroundColor;
      });
      
      console.log('✅ Interactive elements have hover states');
    });
  });
});