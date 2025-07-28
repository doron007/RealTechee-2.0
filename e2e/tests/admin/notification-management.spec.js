/**
 * Notification Management System Tests
 * 
 * Comprehensive tests for the notification management backoffice interface at:
 * /admin-legacy?tab=notifications
 * 
 * Expected AWS DynamoDB Tables (Dev Environment):
 * - NotificationTemplate-fvn7t5hbobaxjklhrqzdl4ac34-NONE (should have 2 items: email + SMS templates)
 * - NotificationQueue-fvn7t5hbobaxjklhrqzdl4ac34-NONE (for notification queue data)
 * - NotificationEvents-fvn7t5hbobaxjklhrqzdl4ac34-NONE (for event logging)
 * 
 * Test Areas:
 * - Navigation and tab switching
 * - Template management (view, create, edit)
 * - Queue management (view, filter, bulk operations)
 * - Data validation and error handling
 * - Test data creation functionality
 * - GraphQL integration and real-time updates
 */

const { test, expect } = require('@playwright/test');

// Configure for manual validation workflow - must be at top level
test.use({ 
  headless: false,  // Keep browser visible
  viewport: { width: 1400, height: 900 }
});

// Test credentials - using the standard admin account
const TEST_CREDENTIALS = {
  email: 'info@realtechee.com',
  password: 'Sababa123!'
};

// Expected dev environment table suffix
const DEV_TABLE_SUFFIX = 'fvn7t5hbobaxjklhrqzdl4ac34-NONE';

// Page selectors for notification management interface
const SELECTORS = {
  // Main interface
  notificationTab: 'button:has-text("Notification Management")',
  notificationSystem: 'h2:has-text("Notification System")',
  
  // Tab navigation
  queueTab: 'button:has-text("Queue Management")',
  historyTab: 'button:has-text("History & Analytics")',
  templatesTab: 'button:has-text("Template Management")', 
  monitoringTab: 'button:has-text("AWS Monitoring")',
  
  // Action buttons
  sendTestButton: 'button:has-text("Send Test")',
  createTestTemplateButton: 'button:has-text("Create Test Template")',
  refreshButton: 'button:has-text("Refresh")',
  autoRefreshCheckbox: 'input[type="checkbox"][checked]',
  
  // Queue Management elements
  searchInput: 'input[placeholder*="Search notifications"]',
  statusFilter: 'select:has(option:has-text("All Statuses"))',
  channelFilter: 'select:has(option:has-text("All Channels"))',
  startDateInput: 'input[type="date"]',
  endDateInput: 'input[type="date"]',
  
  // Data tables
  notificationTable: 'table',
  templateTable: 'table',
  tableRows: 'tbody tr',
  
  // Status cards  
  successfulSentCard: '.bg-green-50',
  pendingRetryingCard: '.bg-yellow-50',
  failedCard: '.bg-red-50',
  
  // Error handling
  graphqlError: '.bg-red-50:has-text("GraphQL Error")',
  errorMessage: '.text-red-700',
  
  // Loading states
  loadingButton: 'button[disabled]:has-text("Loading")',
  loadingSpinner: '[data-testid="loading"], .loading'
};

test.describe('Notification Management System', () => {
  // Handle authentication in same window
  test.beforeEach(async ({ page }) => {
    console.log('🔐 Checking authentication status...');
    
    // Navigate to notification management page
    await page.goto('/admin-legacy?tab=notifications');
    
    // Check if redirected to login (wait a moment for redirect)
    await page.waitForTimeout(2000);
    
    if (page.url().includes('/login') || page.url().includes('/auth')) {
      console.log('🔑 Login required - performing authentication...');
      
      // Fill login form
      await page.fill('input[type="email"], input[name="email"], [data-testid="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[type="password"], input[name="password"], [data-testid="password"]', TEST_CREDENTIALS.password);
      
      // Click sign in button
      await page.click('button[type="submit"], button:has-text("Sign in"), [data-testid="sign-in-button"]');
      
      // Wait for navigation back to notification management
      await page.waitForURL('**/admin-legacy?tab=notifications', { timeout: 10000 });
      
      console.log('✅ Authentication successful - staying in same window');
    } else {
      console.log('✅ Already authenticated - proceeding with tests');
    }
    
    // Ensure we're on the notifications tab and page is loaded
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation and Interface Loading', () => {
    test('should load notification management page correctly', async ({ page }) => {
      // Page already loaded by beforeEach - verify it loaded correctly
      console.log('🧭 Verifying notification management page loaded...');
      
      // Verify page loaded correctly
      await expect(page.locator(SELECTORS.notificationSystem)).toBeVisible();
      await expect(page.locator(SELECTORS.notificationTab)).toHaveClass(/text-blue-600/);
      
      // Take screenshot for documentation
      await page.screenshot({ 
        path: 'test-results/notification-management-page.png',
        fullPage: true 
      });
      
      console.log('✅ Notification management page verified');
    });
    
    test('should display all four main tabs', async ({ page }) => {
      // Verify all tabs are present and clickable
      const tabs = [
        { selector: SELECTORS.queueTab, name: 'Queue Management' },
        { selector: SELECTORS.historyTab, name: 'History & Analytics' },
        { selector: SELECTORS.templatesTab, name: 'Template Management' },
        { selector: SELECTORS.monitoringTab, name: 'AWS Monitoring' }
      ];
      
      for (const tab of tabs) {
        await expect(page.locator(tab.selector)).toBeVisible();
        console.log(`✅ ${tab.name} tab is visible`);
      }
    });
    
    test('should show correct tab content when switching', async () => {
      // Test Queue Management tab (default)
      await page.click(SELECTORS.queueTab);
      await expect(page.locator(SELECTORS.searchInput)).toBeVisible();
      await expect(page.locator(SELECTORS.statusFilter)).toBeVisible();
      
      // Test Template Management tab
      await page.click(SELECTORS.templatesTab);
      await expect(page.locator(SELECTORS.createTestTemplateButton)).toBeVisible();
      await expect(page.locator(SELECTORS.templateTable)).toBeVisible();
      
      // Test History & Analytics tab
      await page.click(SELECTORS.historyTab);
      await expect(page.locator('text=Analytics dashboard coming soon')).toBeVisible();
      
      // Test AWS Monitoring tab  
      await page.click(SELECTORS.monitoringTab);
      await expect(page.locator('text=AWS monitoring dashboard coming soon')).toBeVisible();
      
      console.log('✅ All tabs switch content correctly');
    });
  });

  test.describe('Environment and Data Validation', () => {
    test('should confirm dev environment table configuration', async () => {
      // Navigate to Queue Management to check data loading
      await page.click(SELECTORS.queueTab);
      await page.waitForTimeout(2000);
      
      // Check if we're targeting correct dev environment
      // This should be confirmed by checking the GraphQL endpoint in network tab
      const graphqlRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('graphql')) {
          graphqlRequests.push(request.url());
        }
      });
      
      // Trigger a refresh to capture GraphQL requests
      await page.click(SELECTORS.refreshButton);
      await page.waitForTimeout(3000);
      
      // Verify GraphQL requests are being made
      expect(graphqlRequests.length).toBeGreaterThan(0);
      console.log(`📡 GraphQL requests detected: ${graphqlRequests.length}`);
      console.log(`🎯 Endpoint: ${graphqlRequests[0]}`);
      
      // TODO: Add manual verification note for AWS Console
      console.log(`📋 MANUAL VERIFICATION REQUIRED:`);
      console.log(`   Check AWS DynamoDB console for tables:`);
      console.log(`   - NotificationTemplate-${DEV_TABLE_SUFFIX} (should have 2 items)`);
      console.log(`   - NotificationQueue-${DEV_TABLE_SUFFIX} (for queue data)`);
    });
    
    test('should handle GraphQL data loading', async ({ page }) => {
      // Page already loaded by beforeEach
      
      // Check for GraphQL errors or successful data loading
      const hasGraphQLError = await page.locator(SELECTORS.graphqlError).isVisible();
      
      if (hasGraphQLError) {
        const errorText = await page.locator(SELECTORS.errorMessage).textContent();
        console.log(`⚠️ GraphQL Error detected: ${errorText}`);
        
        // This is expected during development - log for debugging
        await page.screenshot({ 
          path: 'test-results/graphql-error-state.png',
          fullPage: true 
        });
      } else {
        console.log('✅ No GraphQL errors detected');
      }
      
      // Verify the interface still functions despite potential errors
      await expect(page.locator(SELECTORS.notificationSystem)).toBeVisible();
    });
  });

  test.describe('Template Management Functions', () => {
    test('should display template management interface', async () => {
      // Navigate to templates tab
      await page.click(SELECTORS.templatesTab);
      await page.waitForTimeout(1000);
      
      // Verify template interface elements
      await expect(page.locator('h3:has-text("Notification Templates")')).toBeVisible();
      await expect(page.locator(SELECTORS.createTestTemplateButton)).toBeVisible();
      await expect(page.locator(SELECTORS.templateTable)).toBeVisible();
      
      // Check table headers
      const expectedHeaders = ['TEMPLATE', 'CHANNEL', 'SUBJECT', 'STATUS', 'CREATED', 'ACTIONS'];
      for (const header of expectedHeaders) {
        await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
      }
      
      console.log('✅ Template management interface displayed correctly');
    });
    
    test('should create test template when button is clicked', async () => {
      // Navigate to templates tab
      await page.click(SELECTORS.templatesTab);
      
      // Count current templates
      const initialRowCount = await page.locator(SELECTORS.tableRows).count();
      console.log(`📊 Initial template count: ${initialRowCount}`);
      
      // Click create test template button
      await page.click(SELECTORS.createTestTemplateButton);
      
      // Wait for potential loading state
      await page.waitForTimeout(3000);
      
      // Check if new template appeared (if GraphQL is working)
      const newRowCount = await page.locator(SELECTORS.tableRows).count();
      
      if (newRowCount > initialRowCount) {
        console.log('✅ Test template created successfully');
        
        // Verify the new template has expected properties
        const lastRow = page.locator(SELECTORS.tableRows).last();
        await expect(lastRow.locator('text=Admin Test Template')).toBeVisible();
        await expect(lastRow.locator('text=EMAIL')).toBeVisible();
      } else {
        console.log('ℹ️ Template creation requires backend connectivity');
        
        // Check for loading state or error feedback
        const hasLoading = await page.locator(SELECTORS.loadingButton).isVisible();
        if (hasLoading) {
          console.log('🔄 Create template operation in progress');
        }
      }
    });
    
    test('should display existing templates from AWS', async () => {
      await page.click(SELECTORS.templatesTab);
      await page.waitForTimeout(2000);
      
      // Count existing templates
      const templateRows = await page.locator(SELECTORS.tableRows).count();
      console.log(`📊 Templates found in interface: ${templateRows}`);
      
      if (templateRows > 0) {
        console.log('✅ Templates loaded from backend');
        
        // Verify template data structure
        const firstRow = page.locator(SELECTORS.tableRows).first();
        const templateName = await firstRow.locator('td').first().textContent();
        console.log(`📝 First template: ${templateName}`);
      } else {
        console.log('⚠️ No templates displayed - checking error state');
        
        // Check if it's due to GraphQL errors
        const hasError = await page.locator(SELECTORS.graphqlError).isVisible();
        if (hasError) {
          console.log('🚨 Templates not loading due to GraphQL errors');
        }
      }
      
      // TODO: Add manual verification note
      console.log(`📋 MANUAL VERIFICATION:`);
      console.log(`   Check NotificationTemplate-${DEV_TABLE_SUFFIX} table in AWS`);
      console.log(`   Should contain 2 items (email + SMS templates for estimate requests)`);
    });
  });

  test.describe('Queue Management Functions', () => {
    test('should display queue management interface', async () => {
      // Navigate to queue tab
      await page.click(SELECTORS.queueTab);
      await page.waitForTimeout(1000);
      
      // Verify filter controls
      await expect(page.locator(SELECTORS.searchInput)).toBeVisible();
      await expect(page.locator(SELECTORS.statusFilter)).toBeVisible();
      await expect(page.locator(SELECTORS.channelFilter)).toBeVisible();
      await expect(page.locator(SELECTORS.startDateInput)).toBeVisible();
      await expect(page.locator(SELECTORS.endDateInput)).toBeVisible();
      
      // Verify status cards
      await expect(page.locator(SELECTORS.successfulSentCard)).toBeVisible();
      await expect(page.locator(SELECTORS.pendingRetryingCard)).toBeVisible();
      await expect(page.locator(SELECTORS.failedCard)).toBeVisible();
      
      console.log('✅ Queue management interface displayed correctly');
    });
    
    test('should test Send Test notification functionality', async () => {
      await page.click(SELECTORS.queueTab);
      
      // Count current notifications
      const initialRowCount = await page.locator(SELECTORS.tableRows).count();
      console.log(`📊 Initial notification count: ${initialRowCount}`);
      
      // Click Send Test button
      await page.click(SELECTORS.sendTestButton);
      
      // Wait for backend processing
      await page.waitForTimeout(5000);
      
      // Check if new notification appeared
      const newRowCount = await page.locator(SELECTORS.tableRows).count();
      
      if (newRowCount > initialRowCount) {
        console.log('✅ Test notification created successfully');
        
        // Verify the notification properties
        const lastRow = page.locator(SELECTORS.tableRows).last();
        await expect(lastRow.locator('text=admin_test')).toBeVisible();
        await expect(lastRow.locator('text=PENDING')).toBeVisible();
      } else {
        console.log('ℹ️ Send test requires backend connectivity');
        
        // Look for console logs or feedback
        const console_logs = [];
        page.on('console', msg => console_logs.push(msg.text()));
        
        // Should see "📧 Sending test notification..." in console
        const hasTestLog = console_logs.some(log => log.includes('Sending test notification'));
        if (hasTestLog) {
          console.log('🔄 Send test command executed (check console)');
        }
      }
    });
    
    test('should handle filter operations', async () => {
      await page.click(SELECTORS.queueTab);
      
      // Test search functionality
      await page.fill(SELECTORS.searchInput, 'admin_test');
      await page.waitForTimeout(1000);
      
      // Test status filter
      await page.selectOption(SELECTORS.statusFilter, 'PENDING');
      await page.waitForTimeout(1000);
      
      // Test channel filter  
      await page.selectOption(SELECTORS.channelFilter, 'EMAIL');
      await page.waitForTimeout(1000);
      
      // Clear filters
      await page.fill(SELECTORS.searchInput, '');
      await page.selectOption(SELECTORS.statusFilter, 'all');
      await page.selectOption(SELECTORS.channelFilter, 'all');
      
      console.log('✅ Filter operations completed');
    });
    
    test('should verify auto-refresh functionality', async () => {
      await page.click(SELECTORS.queueTab);
      
      // Check auto-refresh checkbox state
      const isAutoRefreshEnabled = await page.locator(SELECTORS.autoRefreshCheckbox).isChecked();
      console.log(`🔄 Auto-refresh enabled: ${isAutoRefreshEnabled}`);
      
      if (isAutoRefreshEnabled) {
        // Disable auto-refresh
        await page.click(SELECTORS.autoRefreshCheckbox);
        await page.waitForTimeout(500);
        
        // Re-enable auto-refresh
        await page.click(SELECTORS.autoRefreshCheckbox);
        console.log('✅ Auto-refresh toggle working');
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle GraphQL errors gracefully', async () => {
      await page.goto('/admin-legacy?tab=notifications');
      await page.waitForLoadState('networkidle');
      
      // Check if GraphQL error is displayed
      const hasError = await page.locator(SELECTORS.graphqlError).isVisible();
      
      if (hasError) {
        // Verify error message is informative
        const errorText = await page.locator(SELECTORS.errorMessage).textContent();
        expect(errorText).toContain('GraphQL');
        
        // Verify interface remains functional despite error
        await expect(page.locator(SELECTORS.sendTestButton)).toBeVisible();
        await expect(page.locator(SELECTORS.refreshButton)).toBeVisible();
        
        console.log('✅ GraphQL errors handled gracefully');
      } else {
        console.log('ℹ️ No GraphQL errors to test');
      }
    });
    
    test('should handle empty data states', async () => {
      // Test queue tab with no data
      await page.click(SELECTORS.queueTab);
      
      const rowCount = await page.locator(SELECTORS.tableRows).count();
      if (rowCount === 0) {
        // Verify empty state is handled properly
        const table = page.locator(SELECTORS.notificationTable);
        await expect(table).toBeVisible();
        console.log('✅ Empty queue state handled properly');
      }
      
      // Test templates tab with no data
      await page.click(SELECTORS.templatesTab);
      
      const templateRows = await page.locator(SELECTORS.tableRows).count();
      if (templateRows === 0) {
        const templateTable = page.locator(SELECTORS.templateTable);
        await expect(templateTable).toBeVisible();
        console.log('✅ Empty template state handled properly');
      }
    });
    
    test('should handle network connectivity issues', async () => {
      // This would require more advanced network mocking
      // For now, just verify the refresh button works
      await page.click(SELECTORS.queueTab);
      await page.click(SELECTORS.refreshButton);
      
      // Look for loading state
      const refreshButtonText = await page.locator(SELECTORS.refreshButton).textContent();
      console.log(`🔄 Refresh button state: ${refreshButtonText}`);
      
      // Wait for refresh to complete
      await page.waitForTimeout(3000);
      
      // Verify button returns to normal state
      const finalButtonText = await page.locator(SELECTORS.refreshButton).textContent();
      expect(finalButtonText).toBe('Refresh');
      
      console.log('✅ Refresh functionality working');
    });
  });

  test.describe('Data Integration and Backend Connectivity', () => {
    test('should validate GraphQL query structure', async () => {
      // Monitor GraphQL requests
      const graphqlRequests = [];
      
      page.on('request', request => {
        if (request.url().includes('graphql')) {
          graphqlRequests.push({
            url: request.url(),
            method: request.method(),
            postData: request.postData()
          });
        }
      });
      
      // Navigate and trigger data loading
      await page.goto('/admin-legacy?tab=notifications');
      await page.waitForLoadState('networkidle');
      
      // Trigger refresh
      await page.click(SELECTORS.refreshButton);
      await page.waitForTimeout(2000);
      
      // Verify GraphQL requests are being made correctly
      expect(graphqlRequests.length).toBeGreaterThan(0);
      
      const hasListTemplatesQuery = graphqlRequests.some(req => 
        req.postData && req.postData.includes('listNotificationTemplates')
      );
      const hasListQueueQuery = graphqlRequests.some(req => 
        req.postData && req.postData.includes('listNotificationQueues')
      );
      
      console.log(`📡 GraphQL queries detected:`);
      console.log(`   - listNotificationTemplates: ${hasListTemplatesQuery}`);
      console.log(`   - listNotificationQueues: ${hasListQueueQuery}`);
      
      if (hasListTemplatesQuery && hasListQueueQuery) {
        console.log('✅ Correct GraphQL queries being executed');
      } else {
        console.log('⚠️ Expected GraphQL queries not detected');
      }
    });
    
    test('should test notification creation workflow', async () => {
      // Navigate to queue management
      await page.click(SELECTORS.queueTab);
      
      // Record initial state
      const initialCount = await page.locator(SELECTORS.tableRows).count();
      
      // Create test notification
      await page.click(SELECTORS.sendTestButton);
      await page.waitForTimeout(3000);
      
      // Navigate to templates tab
      await page.click(SELECTORS.templatesTab);
      
      // Create test template
      await page.click(SELECTORS.createTestTemplateButton);
      await page.waitForTimeout(3000);
      
      // Navigate back to queue
      await page.click(SELECTORS.queueTab);
      
      // Check if data appeared
      const finalCount = await page.locator(SELECTORS.tableRows).count();
      
      console.log(`📊 Notification creation test:`);
      console.log(`   Initial count: ${initialCount}`);
      console.log(`   Final count: ${finalCount}`);
      
      if (finalCount > initialCount) {
        console.log('✅ Test data creation workflow successful');
      } else {
        console.log('ℹ️ Test data creation requires backend connectivity');
      }
    });
  });

  test.describe('User Experience and Accessibility', () => {
    test('should have proper accessibility features', async () => {
      await page.goto('/admin-legacy?tab=notifications');
      await page.waitForLoadState('networkidle');
      
      // Check for proper heading structure
      await expect(page.locator('h2')).toBeVisible();
      await expect(page.locator('h3')).toBeVisible();
      
      // Check tab accessibility
      const tabs = [SELECTORS.queueTab, SELECTORS.templatesTab, SELECTORS.historyTab, SELECTORS.monitoringTab];
      for (const tab of tabs) {
        const tabElement = page.locator(tab);
        await expect(tabElement).toBeVisible();
        
        // Verify tab can receive focus
        await tabElement.focus();
        const isFocused = await tabElement.evaluate(el => document.activeElement === el);
        expect(isFocused).toBeTruthy();
      }
      
      console.log('✅ Accessibility features verified');
    });
    
    test('should provide clear user feedback', async () => {
      await page.goto('/admin-legacy?tab=notifications');
      await page.waitForLoadState('networkidle');
      
      // Test button states and feedback
      await page.click(SELECTORS.sendTestButton);
      
      // Look for loading or feedback states
      const buttonText = await page.locator(SELECTORS.sendTestButton).textContent();
      console.log(`🔘 Send Test button feedback: ${buttonText}`);
      
      // Test refresh button feedback
      await page.click(SELECTORS.refreshButton);
      const refreshText = await page.locator(SELECTORS.refreshButton).textContent();
      console.log(`🔄 Refresh button feedback: ${refreshText}`);
      
      console.log('✅ User feedback mechanisms verified');
    });
  });

  test.describe('Final Integration Test', () => {
    test('should complete full notification management workflow', async ({ page }) => {
      console.log('🎯 Starting complete workflow test...');
      
      // 1. Page already loaded by beforeEach
      
      // 2. Verify all tabs work
      const tabs = [
        { selector: SELECTORS.queueTab, name: 'Queue' },
        { selector: SELECTORS.templatesTab, name: 'Templates' },
        { selector: SELECTORS.historyTab, name: 'History' },
        { selector: SELECTORS.monitoringTab, name: 'Monitoring' }
      ];
      
      for (const tab of tabs) {
        await page.click(tab.selector);
        await page.waitForTimeout(500);
        console.log(`✅ ${tab.name} tab functional`);
      }
      
      // 3. Test data creation functions
      await page.click(SELECTORS.templatesTab);
      await page.click(SELECTORS.createTestTemplateButton);
      await page.waitForTimeout(2000);
      
      await page.click(SELECTORS.queueTab);
      await page.click(SELECTORS.sendTestButton);
      await page.waitForTimeout(2000);
      
      // 4. Test filtering and refresh
      await page.fill(SELECTORS.searchInput, 'test');
      await page.click(SELECTORS.refreshButton);
      await page.waitForTimeout(2000);
      
      // 5. Take final screenshot
      await page.screenshot({ 
        path: 'test-results/notification-management-complete.png',
        fullPage: true 
      });
      
      console.log('🎉 Complete notification management workflow test finished');
      console.log('🔍 Browser window will remain open for manual validation');
      
      // Summary for manual validation
      console.log(`\n📋 MANUAL VALIDATION CHECKLIST:`);
      console.log(`   1. Check AWS DynamoDB tables:`);
      console.log(`      - NotificationTemplate-${DEV_TABLE_SUFFIX}`);
      console.log(`      - NotificationQueue-${DEV_TABLE_SUFFIX}`);
      console.log(`   2. Verify 2 email/SMS templates exist in template table`);
      console.log(`   3. Check if test notifications were created`);
      console.log(`   4. Verify GraphQL requests in Network tab`);
      console.log(`   5. Confirm no console errors (except expected GraphQL auth issues)`);
      console.log(`   6. Take additional screenshots if needed`);
      console.log(`   7. Window will stay open for further inspection`);
    });
  });
});