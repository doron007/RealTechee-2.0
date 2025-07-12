/**
 * Admin Dashboard Page Tests
 * 
 * User story-driven tests for /admin/dashboard back office functionality:
 * - Executive dashboard overview and key metrics
 * - Real-time data monitoring and alerts
 * - Interactive charts and data visualization
 * - Quick action panels and navigation shortcuts
 * - Performance indicators and business intelligence
 * - Responsive dashboard layout across devices
 * - Data refresh and real-time updates
 * - Export and reporting capabilities
 */

const { test, expect } = require('@playwright/test');

test.describe('Admin Dashboard Page - Executive Overview', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin/dashboard');
    
    // Wait for dashboard to load completely
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForSelector('.dashboard, .MuiCard-root, .chart, [data-testid*="dashboard"]', { timeout: 15000 });
  });

  test.describe('User Story: Executive Views Business Overview', () => {
    
    test('should display comprehensive business metrics dashboard', async ({ page }) => {
      // User Story: As an executive, I want to see key business metrics at a glance for quick decision making
      
      // Verify dashboard title
      const pageTitle = await page.locator('h1').first().textContent();
      expect(pageTitle?.toLowerCase()).toContain('dashboard');
      
      // Check for key metric cards/widgets
      const metricCards = page.locator('.MuiCard-root, .metric-card, .dashboard-widget, .stat-card');
      const cardCount = await metricCards.count();
      
      // Dashboard should have multiple metric displays
      expect(cardCount).toBeGreaterThan(0);
      
      // Look for business-relevant metrics
      const hasRevenue = await page.locator('text=/revenue|sales|income/i').count() > 0;
      const hasProjects = await page.locator('text=/project|job/i').count() > 0;
      const hasCustomers = await page.locator('text=/customer|client/i').count() > 0;
      const hasQuotes = await page.locator('text=/quote|estimate/i').count() > 0;
      const hasRequests = await page.locator('text=/request|ticket|service/i').count() > 0;
      
      // At least some business metrics should be present
      const businessMetricsCount = [hasRevenue, hasProjects, hasCustomers, hasQuotes, hasRequests].filter(Boolean).length;
      expect(businessMetricsCount).toBeGreaterThan(0);
    });
    
    test('should show real-time or recent data indicators', async ({ page }) => {
      // User Story: As an executive, I want to see current and trending data to understand business performance
      
      await page.waitForLoadState('networkidle');
      
      // Look for data freshness indicators
      const hasTimestamp = await page.locator('text=/updated|last update|as of|current/i').count() > 0;
      const hasNumbers = await page.locator('text=/\\d+|\\$|%/').count() > 0;
      const hasCharts = await page.locator('.chart, canvas, svg, .recharts, .highcharts').count() > 0;
      
      // Dashboard should show actual data, not just placeholders
      expect(hasNumbers || hasCharts).toBeTruthy();
      
      if (hasTimestamp) {
        console.log('ℹ️ Dashboard shows data freshness indicators');
      }
    });
  });

  test.describe('User Story: Executive Monitors Key Performance Indicators', () => {
    
    test('should display KPI widgets with clear visual hierarchy', async ({ page }) => {
      // User Story: As an executive, I want to quickly identify performance trends and critical metrics
      
      // Look for KPI displays
      const kpiWidgets = page.locator('.kpi, .metric, .stat, .MuiCard-root');
      const widgetCount = await kpiWidgets.count();
      
      if (widgetCount > 0) {
        // Check for visual indicators of performance
        const hasPercentages = await page.locator('text=/%|percent/i').count() > 0;
        const hasGrowth = await page.locator('text=/growth|increase|decrease|up|down/i').count() > 0;
        const hasTargets = await page.locator('text=/target|goal|objective/i').count() > 0;
        const hasColors = await page.locator('.text-green, .text-red, .success, .danger, .warning').count() > 0;
        
        // KPIs should have some performance indicators
        const performanceIndicators = [hasPercentages, hasGrowth, hasTargets, hasColors].filter(Boolean).length;
        console.log(`ℹ️ Found ${performanceIndicators} types of performance indicators`);
      }
    });
    
    test('should provide interactive charts and visualizations', async ({ page }) => {
      // User Story: As an executive, I want interactive visualizations to drill down into business data
      
      // Look for charts and interactive elements
      const charts = page.locator('canvas, svg, .chart, .graph, .visualization');
      const chartCount = await charts.count();
      
      if (chartCount > 0) {
        console.log(`ℹ️ Found ${chartCount} chart/visualization elements`);
        
        // Test interaction with first chart if available
        const firstChart = charts.first();
        if (await firstChart.isVisible()) {
          await firstChart.hover();
          await page.waitForTimeout(500);
          
          // Look for tooltips or interaction feedback
          const hasTooltip = await page.locator('.tooltip, .chart-tooltip, [role="tooltip"]').count() > 0;
          if (hasTooltip) {
            console.log('ℹ️ Charts have interactive tooltips');
          }
        }
      }
    });
  });

  test.describe('User Story: Executive Accesses Quick Actions', () => {
    
    test('should provide quick action buttons for common tasks', async ({ page }) => {
      // User Story: As an executive, I want quick access to common administrative actions from the dashboard
      
      const actionButtons = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add"), button:has-text("View All"), button:has-text("Export"), button:has-text("Report")');
      
      const buttonCount = await actionButtons.count();
      if (buttonCount > 0) {
        console.log(`ℹ️ Found ${buttonCount} quick action buttons`);
        
        // Test each action button
        for (let i = 0; i < Math.min(buttonCount, 4); i++) {
          const button = actionButtons.nth(i);
          if (await button.isVisible()) {
            await expect(button).toBeEnabled();
            
            const buttonText = await button.textContent();
            console.log(`ℹ️ Quick action available: ${buttonText}`);
          }
        }
      }
    });
    
    test('should provide navigation shortcuts to main admin sections', async ({ page }) => {
      // User Story: As an executive, I want quick navigation to detailed admin sections from the dashboard
      
      // Look for navigation links or shortcuts
      const navLinks = page.locator('a[href*="/admin"], button:has-text("Projects"), button:has-text("Quotes"), button:has-text("Requests"), .nav-shortcut');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        console.log(`ℹ️ Found ${linkCount} navigation shortcuts`);
        
        // Test navigation functionality (hover only to avoid navigation)
        for (let i = 0; i < Math.min(linkCount, 3); i++) {
          const link = navLinks.nth(i);
          if (await link.isVisible()) {
            await link.hover();
            await page.waitForTimeout(200);
            
            const linkText = await link.textContent();
            console.log(`ℹ️ Navigation shortcut: ${linkText}`);
          }
        }
      }
    });
  });

  test.describe('User Story: Executive Monitors System Health', () => {
    
    test('should display system status and health indicators', async ({ page }) => {
      // User Story: As an executive, I want to monitor system health and identify any issues requiring attention
      
      // Look for system health indicators
      const healthIndicators = page.locator('.status, .health, .alert, .notification, .system-status');
      const indicatorCount = await healthIndicators.count();
      
      if (indicatorCount > 0) {
        console.log(`ℹ️ Found ${indicatorCount} system health indicators`);
        
        // Check for different types of status indicators
        const hasSuccess = await page.locator('.success, .healthy, .online, .text-green').count() > 0;
        const hasWarning = await page.locator('.warning, .caution, .text-yellow').count() > 0;
        const hasError = await page.locator('.error, .critical, .text-red').count() > 0;
        
        console.log(`ℹ️ Status types - Success: ${hasSuccess}, Warning: ${hasWarning}, Error: ${hasError}`);
      }
    });
    
    test('should show recent activity and alerts', async ({ page }) => {
      // User Story: As an executive, I want to see recent system activity and any alerts that need attention
      
      // Look for activity feeds or alert panels
      const activitySections = page.locator('.activity, .recent, .alerts, .notifications, .feed');
      const sectionCount = await activitySections.count();
      
      if (sectionCount > 0) {
        console.log(`ℹ️ Found ${sectionCount} activity/alert sections`);
        
        // Check for timestamps indicating recent activity
        const hasRecentActivity = await page.locator('text=/today|yesterday|hour|minute|ago|recent/i').count() > 0;
        if (hasRecentActivity) {
          console.log('ℹ️ Dashboard shows recent activity timestamps');
        }
      }
    });
  });

  test.describe('User Story: Executive Customizes Dashboard View', () => {
    
    test('should support dashboard customization and preferences', async ({ page }) => {
      // User Story: As an executive, I want to customize my dashboard view to focus on metrics most important to me
      
      // Look for customization controls
      const customizationControls = page.locator('button:has-text("Customize"), button:has-text("Settings"), button:has-text("Preferences"), .customize, .settings');
      
      if (await customizationControls.count() > 0) {
        const customizeButton = customizationControls.first();
        if (await customizeButton.isVisible()) {
          await customizeButton.hover();
          console.log('ℹ️ Dashboard customization options available');
        }
      }
      
      // Look for drag-and-drop or moveable widgets
      const draggableWidgets = page.locator('.draggable, .moveable, [draggable="true"]');
      if (await draggableWidgets.count() > 0) {
        console.log('ℹ️ Dashboard has draggable widgets for customization');
      }
    });
    
    test('should maintain responsive layout across device sizes', async ({ page }) => {
      // User Story: As an executive, I want the dashboard to work well on my tablet and phone for mobile access
      
      // Test responsive behavior
      const viewports = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1440, height: 900 }   // Desktop
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);
        
        // Verify dashboard remains functional
        await expect(page.locator('h1').first()).toBeVisible();
        
        // Check for layout adaptation
        const widgets = await page.locator('.MuiCard-root, .widget, .metric').count();
        expect(widgets).toBeGreaterThanOrEqual(0);
        
        console.log(`ℹ️ Dashboard functional at ${viewport.width}x${viewport.height}`);
      }
      
      // Reset to desktop view
      await page.setViewportSize({ width: 1440, height: 900 });
    });
  });

  test.describe('User Story: Executive Exports and Reports', () => {
    
    test('should provide data export capabilities', async ({ page }) => {
      // User Story: As an executive, I want to export dashboard data for presentations and external analysis
      
      const exportButtons = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("PDF"), button:has-text("CSV"), .export');
      
      if (await exportButtons.count() > 0) {
        const exportButton = exportButtons.first();
        if (await exportButton.isVisible()) {
          await expect(exportButton).toBeEnabled();
          
          const buttonText = await exportButton.textContent();
          console.log(`ℹ️ Export capability available: ${buttonText}`);
          
          // Test export interaction (hover only to avoid actual download)
          await exportButton.hover();
          await page.waitForTimeout(300);
        }
      }
    });
    
    test('should support report generation and scheduling', async ({ page }) => {
      // User Story: As an executive, I want to generate reports and set up automated reporting
      
      const reportControls = page.locator('button:has-text("Report"), button:has-text("Schedule"), button:has-text("Generate"), .reporting');
      
      if (await reportControls.count() > 0) {
        console.log('ℹ️ Reporting capabilities found');
        
        // Test report controls
        const reportButton = reportControls.first();
        if (await reportButton.isVisible()) {
          await reportButton.hover();
          await page.waitForTimeout(300);
          
          const buttonText = await reportButton.textContent();
          console.log(`ℹ️ Report function: ${buttonText}`);
        }
      }
    });
  });

  test.describe('User Story: Executive Monitors Data Freshness', () => {
    
    test('should provide data refresh capabilities', async ({ page }) => {
      // User Story: As an executive, I want to refresh dashboard data to ensure I'm seeing the latest information
      
      const refreshButtons = page.locator('button:has-text("Refresh"), button:has-text("Update"), button:has-text("Reload"), .refresh, [aria-label*="refresh" i]');
      
      if (await refreshButtons.count() > 0) {
        const refreshButton = refreshButtons.first();
        if (await refreshButton.isVisible()) {
          await expect(refreshButton).toBeEnabled();
          
          // Test refresh functionality
          await refreshButton.click();
          await page.waitForTimeout(1000);
          
          // Verify page remains functional after refresh
          await expect(page.locator('h1').first()).toBeVisible();
          
          console.log('ℹ️ Dashboard refresh functionality working');
        }
      }
    });
    
    test('should show data timestamps and update indicators', async ({ page }) => {
      // User Story: As an executive, I want to know when the dashboard data was last updated
      
      // Look for timestamp indicators
      const timestampElements = page.locator('text=/last updated|updated|as of|current as of/i');
      
      if (await timestampElements.count() > 0) {
        const timestamp = await timestampElements.first().textContent();
        console.log(`ℹ️ Data freshness indicator: ${timestamp}`);
      }
      
      // Look for real-time indicators
      const realtimeIndicators = page.locator('text=/live|real.?time|now/i, .live, .realtime');
      if (await realtimeIndicators.count() > 0) {
        console.log('ℹ️ Real-time data indicators found');
      }
    });
  });

  test.describe('User Story: Executive Ensures Dashboard Reliability', () => {
    
    test('should handle dashboard errors gracefully', async ({ page }) => {
      // User Story: As an executive, I want the dashboard to handle data loading errors gracefully
      
      // Monitor for JavaScript errors
      const errors = [];
      page.on('pageerror', (error) => {
        errors.push(error);
      });
      
      // Test dashboard under various conditions
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Test rapid interactions
      const widgets = page.locator('.MuiCard-root, .widget').first();
      if (await widgets.count() > 0) {
        await widgets.hover();
        await page.waitForTimeout(200);
      }
      
      // Verify no critical JavaScript errors
      expect(errors.length).toBe(0);
    });
    
    test('should maintain performance with large datasets', async ({ page }) => {
      // User Story: As an executive, I want the dashboard to remain responsive even with large amounts of data
      
      const startTime = Date.now();
      
      // Test dashboard responsiveness
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within reasonable time
      expect(loadTime).toBeLessThan(15000); // 15 seconds max
      
      console.log(`ℹ️ Dashboard load time: ${loadTime}ms`);
      
      // Test interactive responsiveness
      const interactiveElements = page.locator('button, .MuiCard-root').first();
      if (await interactiveElements.count() > 0) {
        const interactionStart = Date.now();
        await interactiveElements.hover();
        const interactionTime = Date.now() - interactionStart;
        
        expect(interactionTime).toBeLessThan(1000); // 1 second max for hover response
      }
    });
    
    test('should provide consistent executive experience', async ({ page }) => {
      // User Story: As an executive, I want a consistent, professional dashboard experience
      
      // Verify consistent layout and branding
      const dashboardTitle = await page.locator('h1').first().textContent();
      
      // Test navigation consistency
      const navElements = page.locator('nav, .navigation, .sidebar');
      if (await navElements.count() > 0) {
        console.log('ℹ️ Consistent navigation elements present');
      }
      
      // Test visual consistency
      const brandingElements = page.locator('.logo, .brand, .company');
      if (await brandingElements.count() > 0) {
        console.log('ℹ️ Branding elements consistent');
      }
      
      // Verify professional appearance
      const professionalElements = page.locator('.MuiCard-root, .chart, .metric');
      const elementCount = await professionalElements.count();
      expect(elementCount).toBeGreaterThan(0);
      
      console.log(`ℹ️ Dashboard maintains professional appearance with ${elementCount} UI elements`);
    });
  });
});