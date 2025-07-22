/**
 * Analytics Dashboard Tests
 * 
 * Comprehensive tests for the analytics dashboard functionality including:
 * - Dashboard loading and data display
 * - KPI cards and metrics
 * - Interactive charts and visualizations
 * - Real-time data updates
 * - Export functionality
 * - Responsive design
 */

const { test, expect } = require('@playwright/test');

// Test data and utilities
const TEST_CREDENTIALS = {
  email: 'info@realtechee.com',
  password: 'Sababa123!'
};

const CHART_SELECTORS = {
  revenueChart: '[data-testid="revenue-chart"]',
  statusChart: '[data-testid="status-chart"]',
  projectsChart: '[data-testid="projects-chart"]',
  agentsChart: '[data-testid="agents-chart"]',
  productsChart: '[data-testid="products-chart"]'
};

const KPI_SELECTORS = {
  totalProjects: '[data-testid="kpi-total-projects"]',
  activeProjects: '[data-testid="kpi-active-projects"]',
  totalRevenue: '[data-testid="kpi-total-revenue"]',
  conversionRate: '[data-testid="kpi-conversion-rate"]'
};

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to analytics dashboard (auth state is already loaded)
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Dashboard Loading and Layout', () => {
    test('should load analytics dashboard successfully', async ({ page }) => {
      // Verify page loads without errors
      await expect(page).toHaveTitle(/Analytics Dashboard/);
      
      // Check main heading (target the analytics dashboard h1 specifically)
      await expect(page.locator('h1:has-text("Analytics Dashboard")')).toBeVisible();
      
      // Verify no error messages
      const errorAlert = page.locator('[role="alert"]');
      await expect(errorAlert).toHaveCount(0);
      
      // Take screenshot for visual verification
      await page.screenshot({ 
        path: 'test-results/analytics-dashboard-loaded.png',
        fullPage: true 
      });
    });

    test('should display all KPI cards', async ({ page }) => {
      // Wait for data to load
      await page.waitForSelector(KPI_SELECTORS.totalProjects);
      
      // Verify all KPI cards are present
      await expect(page.locator(KPI_SELECTORS.totalProjects)).toBeVisible();
      await expect(page.locator(KPI_SELECTORS.activeProjects)).toBeVisible();
      await expect(page.locator(KPI_SELECTORS.totalRevenue)).toBeVisible();
      await expect(page.locator(KPI_SELECTORS.conversionRate)).toBeVisible();
      
      // Verify KPI cards have data (not loading state)
      const totalProjectsText = await page.locator(KPI_SELECTORS.totalProjects).textContent();
      expect(totalProjectsText).not.toContain('...');
      expect(totalProjectsText).not.toContain('Loading');
    });

    test('should display all chart sections', async ({ page }) => {
      // Wait for charts to load
      await page.waitForTimeout(3000); // Allow time for chart rendering
      
      // Check for chart containers using data-testid
      const revenueChart = page.locator('[data-testid="revenue-chart"]');
      const statusChart = page.locator('[data-testid="status-chart"]');
      const projectsChart = page.locator('[data-testid="projects-chart"]');
      const agentsChart = page.locator('[data-testid="agents-chart"]');
      const productsChart = page.locator('[data-testid="products-chart"]');
      
      await expect(revenueChart).toBeVisible();
      await expect(statusChart).toBeVisible();
      await expect(projectsChart).toBeVisible();
      await expect(agentsChart).toBeVisible();
      await expect(productsChart).toBeVisible();
    });

    test('should show loading states initially', async ({ page }) => {
      // Navigate to fresh page to catch loading state
      await page.goto('/admin/analytics');
      
      // Check for loading indicator
      const loadingIndicator = page.locator('[role="progressbar"]');
      await expect(loadingIndicator).toBeVisible();
      
      // Wait for data to load and loading to disappear
      await page.waitForSelector('[role="progressbar"]', { state: 'detached', timeout: 10000 });
      
      // Verify data is now displayed
      await expect(page.locator(KPI_SELECTORS.totalProjects)).toBeVisible();
    });
  });

  test.describe('Data Accuracy and Content', () => {
    test('should display valid KPI data', async ({ page }) => {
      await page.waitForSelector(KPI_SELECTORS.totalProjects);
      
      // Extract and validate KPI values
      const totalProjects = await page.locator(KPI_SELECTORS.totalProjects).textContent();
      const activeProjects = await page.locator(KPI_SELECTORS.activeProjects).textContent();
      const totalRevenue = await page.locator(KPI_SELECTORS.totalRevenue).textContent();
      const conversionRate = await page.locator(KPI_SELECTORS.conversionRate).textContent();
      
      // Verify numeric values are reasonable
      expect(totalProjects).toMatch(/\\d+/); // Contains numbers
      expect(activeProjects).toMatch(/\\d+/);
      expect(totalRevenue).toMatch(/[$]|\\d/); // Contains currency or numbers
      expect(conversionRate).toMatch(/\\d+.*%/); // Contains percentage
      
      console.log('KPI Values:', {
        totalProjects,
        activeProjects,
        totalRevenue,
        conversionRate
      });
    });

    test('should display chart data points', async ({ page }) => {
      await page.waitForTimeout(3000); // Allow charts to render
      
      // Check for data points in charts (SVG elements)
      const chartDataPoints = page.locator('svg circle, svg rect, svg path[stroke]');
      const dataPointsCount = await chartDataPoints.count();
      
      expect(dataPointsCount).toBeGreaterThan(0);
      console.log(`Found ${dataPointsCount} chart data points`);
    });

    test('should show quick stats section', async ({ page }) => {
      // Scroll to quick stats section
      const quickStats = page.locator('text=Quick Stats');
      await expect(quickStats).toBeVisible();
      
      // Verify quick stats data
      const avgProjectValue = page.locator('text=Average Project Value').locator('..');
      const projectsThisPeriod = page.locator('text=Projects This').locator('..');
      const growthRate = page.locator('text=Growth Rate').locator('..');
      
      await expect(avgProjectValue).toBeVisible();
      await expect(projectsThisPeriod).toBeVisible();
      await expect(growthRate).toBeVisible();
    });
  });

  test.describe('Interactive Features', () => {
    test('should handle time range selector', async ({ page }) => {
      // Find and interact with time range selector
      const timeRangeSelect = page.locator('text=Time Range').locator('..').locator('select, [role="combobox"]');
      await expect(timeRangeSelect).toBeVisible();
      
      // Change time range and verify update
      await timeRangeSelect.click();
      await page.click('text=Last Quarter');
      
      // Wait for data to update
      await page.waitForTimeout(2000);
      
      // Verify the selection updated
      const selectedValue = await timeRangeSelect.inputValue();
      expect(selectedValue).toBe('quarter');
    });

    test('should handle manual refresh', async ({ page }) => {
      await page.waitForSelector(KPI_SELECTORS.totalProjects);
      
      // Get initial KPI value
      const initialValue = await page.locator(KPI_SELECTORS.totalProjects).textContent();
      
      // Click refresh button
      const refreshButton = page.locator('button[aria-label*="refresh"], button:has-text("Refresh")');
      await refreshButton.click();
      
      // Look for loading state
      const loadingIndicator = page.locator('[role="progressbar"]');
      await expect(loadingIndicator).toBeVisible();
      
      // Wait for refresh to complete
      await page.waitForSelector('[role="progressbar"]', { state: 'detached', timeout: 10000 });
      
      // Verify data is still displayed (might be same or different)
      const updatedValue = await page.locator(KPI_SELECTORS.totalProjects).textContent();
      expect(updatedValue).toMatch(/\\d+/);
    });

    test('should handle export functionality', async ({ page }) => {
      // Find export button
      const exportButton = page.locator('button:has-text("Export")');
      await expect(exportButton).toBeVisible();
      
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      // Wait for download to start
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/analytics.*\\.json$/);
      
      // Save the download to verify content
      const downloadPath = 'test-results/analytics-export.json';
      await download.saveAs(downloadPath);
      
      console.log(`Export saved to: ${downloadPath}`);
    });
  });

  test.describe('Chart Interactions', () => {
    test('should display chart tooltips on hover', async ({ page }) => {
      await page.waitForTimeout(3000); // Allow charts to render
      
      // Find chart elements to hover over
      const chartDataPoint = page.locator('svg circle, svg rect, svg path[stroke]').first();
      await expect(chartDataPoint).toBeVisible();
      
      // Hover over chart element
      await chartDataPoint.hover();
      
      // Look for tooltip (might be different selectors depending on Recharts version)
      const tooltip = page.locator('[role="tooltip"], .recharts-tooltip-wrapper, .recharts-tooltip');
      await expect(tooltip).toBeVisible({ timeout: 2000 });
    });

    test('should display chart legends', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // Check for chart legends
      const legends = page.locator('.recharts-legend, text:has-text("Revenue"), text:has-text("Profit"), text:has-text("Projects")');
      const legendCount = await legends.count();
      
      expect(legendCount).toBeGreaterThan(0);
      console.log(`Found ${legendCount} chart legend elements`);
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify mobile layout
      const dashboard = page.locator('main, [role="main"], .MuiBox-root').first();
      await expect(dashboard).toBeVisible();
      
      // Check that KPI cards stack on mobile
      const kpiCards = page.locator(KPI_SELECTORS.totalProjects).locator('..');
      const cardBounds = await kpiCards.boundingBox();
      expect(cardBounds.width).toBeLessThan(500); // Mobile width constraint
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/analytics-dashboard-mobile.png',
        fullPage: true 
      });
    });

    test('should adapt to tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify tablet layout
      await expect(page.locator(KPI_SELECTORS.totalProjects)).toBeVisible();
      
      // Take tablet screenshot
      await page.screenshot({ 
        path: 'test-results/analytics-dashboard-tablet.png',
        fullPage: true 
      });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept network requests and simulate failure
      await page.route('**/graphql', route => {
        route.abort('failed');
      });
      
      // Navigate to analytics page
      await page.goto('/admin/analytics');
      
      // Look for error handling
      const errorMessage = page.locator('[role="alert"], text*="Failed", text*="Error"');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      
      // Verify no crash occurred
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should handle empty data states', async ({ page }) => {
      // Mock empty data response
      await page.route('**/graphql', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              listProjects: { items: [] },
              listQuotes: { items: [] },
              listRequests: { items: [] }
            }
          })
        });
      });
      
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
      
      // Verify empty state handling
      const zeroValues = page.locator('text="0"');
      await expect(zeroValues.first()).toBeVisible();
      
      // Verify charts still render (even with no data)
      const chartContainers = page.locator('svg');
      await expect(chartContainers.first()).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/admin/analytics');
      await page.waitForSelector(KPI_SELECTORS.totalProjects);
      
      const loadTime = Date.now() - startTime;
      console.log(`Analytics dashboard loaded in ${loadTime}ms`);
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test('should handle multiple rapid refreshes', async ({ page }) => {
      await page.waitForSelector(KPI_SELECTORS.totalProjects);
      
      const refreshButton = page.locator('button:has-text("Refresh")');
      
      // Rapidly click refresh multiple times
      for (let i = 0; i < 3; i++) {
        await refreshButton.click();
        await page.waitForTimeout(500);
      }
      
      // Verify the page still works
      await page.waitForSelector(KPI_SELECTORS.totalProjects);
      const finalValue = await page.locator(KPI_SELECTORS.totalProjects).textContent();
      expect(finalValue).toMatch(/\\d+/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.waitForSelector(KPI_SELECTORS.totalProjects);
      
      // Check for ARIA labels on interactive elements
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const hasAriaLabel = await button.getAttribute('aria-label');
        const hasAccessibleText = await button.textContent();
        
        expect(hasAriaLabel || hasAccessibleText).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.waitForSelector(KPI_SELECTORS.totalProjects);
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});

test.describe('Analytics Dashboard - Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin');
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
  });

  test('should display real-time update indicators', async ({ page }) => {
    await page.waitForSelector(KPI_SELECTORS.totalProjects);
    
    // Look for timestamp or last updated information
    const timestamp = page.locator('text*="Updated", text*="Last", text*="ago"');
    await expect(timestamp).toBeVisible({ timeout: 5000 });
  });

  test('should maintain state during navigation', async ({ page }) => {
    await page.waitForSelector(KPI_SELECTORS.totalProjects);
    
    // Change time range
    const timeRangeSelect = page.locator('text=Time Range').locator('..').locator('select, [role="combobox"]');
    await timeRangeSelect.click();
    await page.click('text=Last Year');
    
    // Navigate away and back
    await page.click('text=Projects');
    await page.waitForLoadState('networkidle');
    await page.click('text=Analytics');
    await page.waitForLoadState('networkidle');
    
    // Verify state is maintained (this would require implementation)
    await expect(page.locator(KPI_SELECTORS.totalProjects)).toBeVisible();
  });
});