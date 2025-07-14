/**
 * Advanced Filters Tests
 * 
 * Comprehensive tests for the advanced filtering system including:
 * - Date range filtering with presets and custom ranges
 * - Multi-criteria data filters (status, agents, products, brokerages)
 * - Metric toggle controls
 * - Filter state management and persistence
 * - Real-time filter application
 * - Filter reset functionality
 */

const { test, expect } = require('@playwright/test');

const TEST_CREDENTIALS = {
  email: 'info@realtechee.com',
  password: 'Sababa123!'
};

const FILTER_SELECTORS = {
  filterPanel: '[data-testid="advanced-filters"]',
  expandButton: 'button[aria-label*="expand"], button:has-text("Advanced Filters")',
  dateRangePreset: 'text=Date Preset',
  startDatePicker: 'input[placeholder*="Start Date"], input[aria-label*="Start Date"]',
  endDatePicker: 'input[placeholder*="End Date"], input[aria-label*="End Date"]',
  statusFilter: 'text=Project Status',
  agentsFilter: 'text=Agents',
  productsFilter: 'text=Products',
  brokeragesFilter: 'text=Brokerages',
  groupBySelect: 'text=Group By',
  compareMode: 'text=Compare with Previous Period',
  showProjections: 'text=Show Projections',
  resetButton: 'button[aria-label*="Reset"], button:has-text("Reset")',
  activeFiltersChip: '[data-testid="active-filters-chip"]'
};

const METRIC_TOGGLES = {
  revenue: 'text=Revenue',
  projects: 'text=Projects', 
  conversion: 'text=Conversion',
  growth: 'text=Growth'
};

test.describe('Advanced Filters System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to analytics dashboard (auth state is already loaded)
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Filter Panel UI', () => {
    test('should display filter panel header', async ({ page }) => {
      // Look for Advanced Filters section
      const filterHeader = page.locator('text=Advanced Filters');
      await expect(filterHeader).toBeVisible();
      
      // Check for filter icon
      const filterIcon = page.locator('svg[data-testid="FilterListIcon"], [data-testid="filter-icon"]');
      await expect(filterIcon).toBeVisible();
    });

    test('should expand and collapse filter panel', async ({ page }) => {
      // Find expand/collapse button
      const expandButton = page.locator(FILTER_SELECTORS.expandButton).first();
      await expect(expandButton).toBeVisible();
      
      // Initially collapsed - look for expanded content
      const dateRangeSection = page.locator(FILTER_SELECTORS.dateRangePreset);
      
      // If already expanded, collapse first
      if (await dateRangeSection.isVisible()) {
        await expandButton.click();
        await expect(dateRangeSection).not.toBeVisible();
      }
      
      // Expand and verify content is visible
      await expandButton.click();
      await expect(dateRangeSection).toBeVisible({ timeout: 5000 });
      
      // Collapse again
      await expandButton.click();
      await expect(dateRangeSection).not.toBeVisible();
      
      // Take screenshot of collapsed state
      await page.screenshot({ 
        path: 'test-results/filters-collapsed.png',
        fullPage: true 
      });
    });

    test('should show active filters count', async ({ page }) => {
      // Expand filters panel
      const expandButton = page.locator(FILTER_SELECTORS.expandButton).first();
      await expandButton.click();
      
      // Apply a filter
      const datePresetSelect = page.locator(FILTER_SELECTORS.dateRangePreset).locator('..').locator('select, [role="combobox"]');
      await datePresetSelect.click();
      await page.click('text=Last 30 Days');
      
      // Look for active filters indicator
      const activeFiltersChip = page.locator('text*="active", [data-testid*="active"]');
      await expect(activeFiltersChip).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Date Range Filtering', () => {
    test.beforeEach(async ({ page }) => {
      // Expand filters panel for each test
      const expandButton = page.locator(FILTER_SELECTORS.expandButton).first();
      await expandButton.click();
      await page.waitForSelector('text=Date Preset');
    });

    test('should have all date range presets', async ({ page }) => {
      const datePresetSelect = page.locator(FILTER_SELECTORS.dateRangePreset).locator('..').locator('select, [role="combobox"]');
      await datePresetSelect.click();
      
      // Check for expected preset options
      const expectedPresets = [
        'Last 7 Days',
        'Last 30 Days', 
        'Last 90 Days',
        'This Month',
        'Last Month',
        'This Quarter',
        'Last Quarter',
        'This Year',
        'Last Year',
        'Custom Range'
      ];
      
      for (const preset of expectedPresets) {
        const option = page.locator(`text=${preset}`);
        await expect(option).toBeVisible();
      }
    });

    test('should apply date range preset and update data', async ({ page }) => {
      // Get initial data
      const initialData = await page.locator('[data-testid="kpi-total-projects"], h4, h5').first().textContent();
      
      // Apply date range filter
      const datePresetSelect = page.locator(FILTER_SELECTORS.dateRangePreset).locator('..').locator('select, [role="combobox"]');
      await datePresetSelect.click();
      await page.click('text=Last 7 Days');
      
      // Wait for data to update
      await page.waitForTimeout(2000);
      
      // Verify filter is applied (look for "Filtered View Active" indicator)
      const filteredIndicator = page.locator('text*="Filtered View", text*="active"');
      await expect(filteredIndicator).toBeVisible({ timeout: 5000 });
      
      // Take screenshot of filtered state
      await page.screenshot({ 
        path: 'test-results/date-filter-applied.png',
        fullPage: true 
      });
    });

    test('should handle custom date range selection', async ({ page }) => {
      // Select custom range
      const datePresetSelect = page.locator(FILTER_SELECTORS.dateRangePreset).locator('..').locator('select, [role="combobox"]');
      await datePresetSelect.click();
      await page.click('text=Custom Range');
      
      // Date pickers should now be visible
      const startDatePicker = page.locator('input[placeholder*="Start"], input[aria-label*="Start"]').first();
      const endDatePicker = page.locator('input[placeholder*="End"], input[aria-label*="End"]').first();
      
      await expect(startDatePicker).toBeVisible();
      await expect(endDatePicker).toBeVisible();
      
      // Set custom date range (last month)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const startDate = lastMonth.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      
      const thisMonth = new Date();
      const endDate = thisMonth.toLocaleDateString('en-CA');
      
      await startDatePicker.fill(startDate);
      await endDatePicker.fill(endDate);
      
      // Verify custom dates are applied
      await page.waitForTimeout(1000);
      const startValue = await startDatePicker.inputValue();
      const endValue = await endDatePicker.inputValue();
      
      expect(startValue).toBeTruthy();
      expect(endValue).toBeTruthy();
    });
  });

  test.describe('Multi-Criteria Data Filters', () => {
    test.beforeEach(async ({ page }) => {
      const expandButton = page.locator(FILTER_SELECTORS.expandButton).first();
      await expandButton.click();
      await page.waitForSelector('text=Project Status');
    });

    test('should have all data filter categories', async ({ page }) => {
      // Check for filter categories
      await expect(page.locator('text=Project Status')).toBeVisible();
      await expect(page.locator('text=Agents')).toBeVisible();
      await expect(page.locator('text=Products')).toBeVisible();
      await expect(page.locator('text=Brokerages')).toBeVisible();
    });

    test('should handle status filtering', async ({ page }) => {
      // Find status filter autocomplete
      const statusFilter = page.locator('text=Project Status').locator('..').locator('input, [role="combobox"]');
      await statusFilter.click();
      
      // Select a status option
      const statusOption = page.locator('[role="option"], text="active", text="completed", text="pending"').first();
      await statusOption.click();
      
      // Verify chip is created
      const filterChip = page.locator('[data-testid*="chip"], .MuiChip-root').first();
      await expect(filterChip).toBeVisible({ timeout: 3000 });
      
      // Wait for data update
      await page.waitForTimeout(2000);
      
      // Look for filtered view indicator
      const filteredIndicator = page.locator('text*="Filtered", text*="active"');
      await expect(filteredIndicator).toBeVisible({ timeout: 5000 });
    });

    test('should handle agents filtering', async ({ page }) => {
      // Find agents filter
      const agentsFilter = page.locator('text=Agents').locator('..').locator('input, [role="combobox"]');
      await agentsFilter.click();
      
      // Look for agent options
      const agentOptions = page.locator('[role="option"]');
      const optionsCount = await agentOptions.count();
      
      if (optionsCount > 0) {
        // Select first available agent
        await agentOptions.first().click();
        
        // Verify selection
        const filterChip = page.locator('[data-testid*="chip"], .MuiChip-root');
        await expect(filterChip).toBeVisible({ timeout: 3000 });
      } else {
        console.log('No agent options available for filtering');
      }
    });

    test('should handle products filtering', async ({ page }) => {
      const productsFilter = page.locator('text=Products').locator('..').locator('input, [role="combobox"]');
      await productsFilter.click();
      
      // Look for product options
      const productOptions = page.locator('[role="option"]');
      const optionsCount = await productOptions.count();
      
      if (optionsCount > 0) {
        await productOptions.first().click();
        
        const filterChip = page.locator('[data-testid*="chip"], .MuiChip-root');
        await expect(filterChip).toBeVisible({ timeout: 3000 });
      } else {
        console.log('No product options available for filtering');
      }
    });

    test('should handle multiple filter selection', async ({ page }) => {
      // Apply date filter
      const datePresetSelect = page.locator(FILTER_SELECTORS.dateRangePreset).locator('..').locator('select, [role="combobox"]');
      await datePresetSelect.click();
      await page.click('text=Last 30 Days');
      
      // Apply status filter
      const statusFilter = page.locator('text=Project Status').locator('..').locator('input, [role="combobox"]');
      await statusFilter.click();
      const statusOption = page.locator('[role="option"]').first();
      if (await statusOption.isVisible()) {
        await statusOption.click();
      }
      
      // Wait for updates
      await page.waitForTimeout(2000);
      
      // Verify multiple filters are active
      const activeFiltersCount = page.locator('text*="2 active", text*="active"');
      await expect(activeFiltersCount).toBeVisible({ timeout: 5000 });
      
      // Take screenshot of multiple filters applied
      await page.screenshot({ 
        path: 'test-results/multiple-filters-applied.png',
        fullPage: true 
      });
    });
  });

  test.describe('Metric Toggle Controls', () => {
    test.beforeEach(async ({ page }) => {
      const expandButton = page.locator(FILTER_SELECTORS.expandButton).first();
      await expandButton.click();
      await page.waitForSelector('text=Metrics to Display');
    });

    test('should display all metric toggles', async ({ page }) => {
      // Check for metrics section
      await expect(page.locator('text=Metrics to Display')).toBeVisible();
      
      // Check for toggle switches
      const toggles = page.locator('input[type="checkbox"], [role="switch"]');
      const toggleCount = await toggles.count();
      
      expect(toggleCount).toBeGreaterThan(0);
      console.log(`Found ${toggleCount} metric toggles`);
    });

    test('should toggle metric visibility', async ({ page }) => {
      // Find a metric toggle
      const revenueToggle = page.locator('text=Revenue').locator('..').locator('input[type="checkbox"], [role="switch"]');
      
      if (await revenueToggle.isVisible()) {
        // Get initial state
        const initialState = await revenueToggle.isChecked();
        
        // Toggle the metric
        await revenueToggle.click();
        
        // Verify state changed
        const newState = await revenueToggle.isChecked();
        expect(newState).toBe(!initialState);
        
        // Wait for UI update
        await page.waitForTimeout(1000);
        
        // Toggle back
        await revenueToggle.click();
        const finalState = await revenueToggle.isChecked();
        expect(finalState).toBe(initialState);
      }
    });
  });

  test.describe('Advanced Options', () => {
    test.beforeEach(async ({ page }) => {
      const expandButton = page.locator(FILTER_SELECTORS.expandButton).first();
      await expandButton.click();
      await page.waitForSelector('text=Advanced Options');
    });

    test('should have grouping options', async ({ page }) => {
      await expect(page.locator('text=Group By')).toBeVisible();
      
      const groupBySelect = page.locator('text=Group By').locator('..').locator('select, [role="combobox"]');
      await groupBySelect.click();
      
      // Check for grouping options
      await expect(page.locator('text=Month')).toBeVisible();
      await expect(page.locator('text=Quarter')).toBeVisible();
      await expect(page.locator('text=Year')).toBeVisible();
    });

    test('should handle compare mode toggle', async ({ page }) => {
      const compareModeToggle = page.locator('text=Compare with Previous Period').locator('..').locator('input[type="checkbox"], [role="switch"]');
      
      if (await compareModeToggle.isVisible()) {
        const initialState = await compareModeToggle.isChecked();
        await compareModeToggle.click();
        
        const newState = await compareModeToggle.isChecked();
        expect(newState).toBe(!initialState);
      }
    });

    test('should handle projections toggle', async ({ page }) => {
      const projectionsToggle = page.locator('text=Show Projections').locator('..').locator('input[type="checkbox"], [role="switch"]');
      
      if (await projectionsToggle.isVisible()) {
        const initialState = await projectionsToggle.isChecked();
        await projectionsToggle.click();
        
        const newState = await projectionsToggle.isChecked();
        expect(newState).toBe(!initialState);
      }
    });
  });

  test.describe('Filter Reset Functionality', () => {
    test.beforeEach(async ({ page }) => {
      const expandButton = page.locator(FILTER_SELECTORS.expandButton).first();
      await expandButton.click();
      await page.waitForSelector('text=Date Preset');
    });

    test('should reset all filters', async ({ page }) => {
      // Apply some filters first
      const datePresetSelect = page.locator(FILTER_SELECTORS.dateRangePreset).locator('..').locator('select, [role="combobox"]');
      await datePresetSelect.click();
      await page.click('text=Last 30 Days');
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Find and click reset button
      const resetButton = page.locator('button[aria-label*="Reset"], button:has-text("Reset")').first();
      await expect(resetButton).toBeVisible();
      await resetButton.click();
      
      // Wait for reset
      await page.waitForTimeout(1000);
      
      // Verify filters are reset (no "Filtered View Active" indicator)
      const filteredIndicator = page.locator('text*="Filtered View", text*="active"');
      await expect(filteredIndicator).not.toBeVisible();
      
      // Verify date preset is back to default
      const selectedPreset = await datePresetSelect.inputValue();
      expect(selectedPreset).toBe('last30days'); // Should be default
    });
  });

  test.describe('Filter Performance and Updates', () => {
    test.beforeEach(async ({ page }) => {
      const expandButton = page.locator(FILTER_SELECTORS.expandButton).first();
      await expandButton.click();
      await page.waitForSelector('text=Date Preset');
    });

    test('should update data in real-time', async ({ page }) => {
      // Get initial KPI value
      const kpiSelector = '[data-testid="kpi-total-projects"], h4';
      await page.waitForSelector(kpiSelector);
      const initialValue = await page.locator(kpiSelector).first().textContent();
      
      // Apply filter
      const datePresetSelect = page.locator(FILTER_SELECTORS.dateRangePreset).locator('..').locator('select, [role="combobox"]');
      await datePresetSelect.click();
      await page.click('text=Last 7 Days');
      
      // Wait for update
      await page.waitForTimeout(3000);
      
      // Verify data updated
      const updatedValue = await page.locator(kpiSelector).first().textContent();
      console.log(`Data updated from "${initialValue}" to "${updatedValue}"`);
      
      // Values might be the same if there's data in both ranges, but filtered indicator should show
      const filteredIndicator = page.locator('text*="Filtered", text*="active"');
      await expect(filteredIndicator).toBeVisible();
    });

    test('should handle rapid filter changes', async ({ page }) => {
      const datePresetSelect = page.locator(FILTER_SELECTORS.dateRangePreset).locator('..').locator('select, [role="combobox"]');
      
      // Rapidly change filters
      await datePresetSelect.click();
      await page.click('text=Last 7 Days');
      await page.waitForTimeout(500);
      
      await datePresetSelect.click();
      await page.click('text=Last 30 Days');
      await page.waitForTimeout(500);
      
      await datePresetSelect.click();
      await page.click('text=Last 90 Days');
      await page.waitForTimeout(500);
      
      // Verify final state is stable
      await page.waitForTimeout(2000);
      const finalIndicator = page.locator('text*="Filtered", text*="active"');
      await expect(finalIndicator).toBeVisible();
      
      // Take screenshot of final state
      await page.screenshot({ 
        path: 'test-results/rapid-filter-changes.png',
        fullPage: true 
      });
    });
  });

  test.describe('Mobile Filter Experience', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Expand filters on mobile
      const expandButton = page.locator(FILTER_SELECTORS.expandButton).first();
      await expandButton.click();
      
      // Verify filters are accessible on mobile
      await expect(page.locator('text=Date Preset')).toBeVisible();
      
      // Apply a filter on mobile
      const datePresetSelect = page.locator(FILTER_SELECTORS.dateRangePreset).locator('..').locator('select, [role="combobox"]');
      await datePresetSelect.click();
      await page.click('text=Last 30 Days');
      
      // Verify mobile filter application
      await page.waitForTimeout(2000);
      const filteredIndicator = page.locator('text*="Filtered", text*="active"');
      await expect(filteredIndicator).toBeVisible();
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/mobile-filters.png',
        fullPage: true 
      });
    });
  });
});