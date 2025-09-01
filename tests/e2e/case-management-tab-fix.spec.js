import { test, expect } from '@playwright/test';

test.describe('Case Management Tab Fix', () => {
  // Login helper function
  async function loginToAdmin(page) {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // Fill login form
    await page.fill('input[name="username"], input[type="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"], input[type="password"]', 'Sababa123!');
    
    // Click sign in button
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    
    // Wait for redirect to admin area
    await page.waitForURL('**/admin**', { timeout: 10000 });
  }

  test('should load Case Management tab without client initialization error', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`[${msg.type()}]`, msg.text());
    });

    // Login first
    await loginToAdmin(page);
    
    // Navigate to admin requests
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    
    // Wait for the page to load and find a request to edit
    await page.waitForSelector('[data-testid="requests-grid"], .MuiDataGrid-root, table', { timeout: 10000 });
    
    // Look for Edit button or clickable row
    const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-button"], .MuiButtonBase-root:has-text("Edit")').first();
    
    if (await editButton.count() > 0) {
      console.log('Clicking Edit button to open RequestDetail');
      await editButton.click();
    } else {
      // Try clicking on first row if no edit button found
      console.log('No Edit button found, trying to click first row');
      const firstRow = page.locator('[data-testid="requests-grid"] .MuiDataGrid-row, table tbody tr').first();
      await firstRow.click();
    }
    
    // Wait for RequestDetail page to load
    await page.waitForSelector('h1, h2, [data-testid="request-detail"]', { timeout: 10000 });
    console.log('RequestDetail page loaded');
    
    // Look for Case Management tab
    const caseManagementTab = page.locator('button:has-text("Case Management"), .MuiTab-root:has-text("Case Management"), [role="tab"]:has-text("Case Management")');
    
    await expect(caseManagementTab).toBeVisible({ timeout: 10000 });
    console.log('Case Management tab found');
    
    // Check for any existing console errors before clicking
    let hasInitializationError = false;
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Model Requests not available on client')) {
        hasInitializationError = true;
        console.error('❌ Found the client initialization error!');
      }
    });
    
    // Click the Case Management tab
    console.log('Clicking Case Management tab...');
    await caseManagementTab.click();
    
    // Wait a moment for any errors to appear
    await page.waitForTimeout(3000);
    
    // Verify no client initialization error occurred
    expect(hasInitializationError).toBeFalsy();
    console.log('✅ No client initialization error detected');
    
    // Verify case management content is loading or loaded
    const caseManagementContent = page.locator('[data-testid="case-management-content"], .case-management, .MuiCard-root, .MuiAccordion-root').first();
    
    // Wait for content to appear (either loaded or loading state)
    await expect(caseManagementContent).toBeVisible({ timeout: 10000 });
    console.log('✅ Case management content is visible');
    
    // Check if there's a loading indicator or actual content
    const loadingIndicator = page.locator('.MuiCircularProgress-root, .MuiLinearProgress-root, [data-testid="loading"]');
    const actualContent = page.locator('.case-overview, [data-testid="case-overview"], .MuiTypography-root');
    
    // Either loading state or actual content should be present
    const hasContentOrLoading = await loadingIndicator.count() > 0 || await actualContent.count() > 0;
    expect(hasContentOrLoading).toBeTruthy();
    console.log('✅ Case management tab is functioning (showing loading or content)');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'tests/screenshots/case-management-tab-fix.png', fullPage: true });
    console.log('📸 Screenshot saved: case-management-tab-fix.png');
  });
  
  test('should handle case management system initialization gracefully', async ({ page }) => {
    // Monitor console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
      console.log(`[${msg.type()}]`, msg.text());
    });

    // Login first
    await loginToAdmin(page);
    await page.goto('/admin/requests', { waitUntil: 'networkidle' });
    
    // Find and click first request
    const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-button"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
    }
    
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    
    // Click Case Management tab
    const caseManagementTab = page.locator('button:has-text("Case Management"), [role="tab"]:has-text("Case Management")');
    await caseManagementTab.click();
    
    // Wait for potential retry mechanism to work
    await page.waitForTimeout(5000);
    
    // Check console messages for proper error handling
    const hasGracefulHandling = consoleMessages.some(msg => 
      msg.text.includes('still initializing') || 
      msg.text.includes('will retry') ||
      msg.text.includes('Client model') ||
      msg.text.includes('ready for operations')
    );
    
    console.log('Console messages:', consoleMessages.map(m => m.text));
    
    // Should have graceful handling messages
    expect(hasGracefulHandling).toBeTruthy();
    console.log('✅ Graceful error handling is working');
  });
});