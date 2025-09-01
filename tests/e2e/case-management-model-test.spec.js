const { test, expect } = require('@playwright/test');

const loginToAdmin = async (page) => {
  await page.goto('http://localhost:3000/admin/login');
  await page.fill('input[name="username"]', 'info@realtechee.com');
  await page.fill('input[name="password"]', 'Sababa123!');
  await page.click('button[type="submit"]');
  
  // Wait for redirect to admin area
  await page.waitForURL('**/admin**', { timeout: 15000 });
}

test.describe('Case Management Model Initialization', () => {
  test('should initialize case management models without errors', async ({ page }) => {
    // Set up console logging to capture model initialization
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Login to admin
    await loginToAdmin(page);
    
    // Navigate to requests
    await page.click('a[href*="/admin/requests"]', { timeout: 10000 });
    await page.waitForURL('**/admin/requests**', { timeout: 10000 });
    
    // Wait for requests to load and click on the first request
    await page.waitForSelector('[data-testid="request-row"]', { timeout: 10000 });
    const firstRequestRow = page.locator('[data-testid="request-row"]').first();
    await firstRequestRow.click();
    
    // Wait for request detail to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Click on Case Management tab
    await page.click('button:has-text("Case Management")', { timeout: 10000 });
    
    // Wait a moment for the tab to load
    await page.waitForTimeout(3000);
    
    // Check for model initialization errors in console
    const modelErrors = consoleMessages.filter(msg => 
      msg.includes('not available on client') || 
      msg.includes('Model') && msg.includes('not available')
    );
    
    // Log all console messages for debugging
    console.log('Console messages during Case Management load:');
    consoleMessages.forEach((msg, index) => {
      if (msg.includes('Case Management') || msg.includes('Model') || msg.includes('client')) {
        console.log(`${index + 1}. ${msg}`);
      }
    });
    
    // Check that we don't have the specific model initialization errors
    expect(modelErrors.length).toBe(0);
    
    // Verify Case Management content is visible (not just loading spinner)
    await expect(page.locator('text=Case Overview')).toBeVisible({ timeout: 10000 });
    
    // Verify no error messages are shown
    await expect(page.locator('text=Case management system is still initializing')).not.toBeVisible();
    await expect(page.locator('text=not available on client')).not.toBeVisible();
    
    console.log('✅ Case Management tab loaded successfully without model initialization errors');
  });
  
  test('should handle graceful fallbacks when models are initializing', async ({ page }) => {
    // Set up console logging
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Login to admin
    await loginToAdmin(page);
    
    // Navigate to requests
    await page.click('a[href*="/admin/requests"]', { timeout: 10000 });
    await page.waitForURL('**/admin/requests**', { timeout: 10000 });
    
    // Wait for requests to load and click on the first request
    await page.waitForSelector('[data-testid="request-row"]', { timeout: 10000 });
    const firstRequestRow = page.locator('[data-testid="request-row"]').first();
    await firstRequestRow.click();
    
    // Wait for request detail to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Click on Case Management tab
    await page.click('button:has-text("Case Management")', { timeout: 10000 });
    
    // Wait for either successful load or graceful error handling
    await page.waitForTimeout(2000);
    
    // Check that either:
    // 1. Case Management loaded successfully, or
    // 2. We show a graceful "initializing" message instead of hard errors
    const hasSuccessfulLoad = await page.locator('text=Case Overview').isVisible();
    const hasGracefulMessage = await page.locator('text=Case management system is').isVisible();
    
    expect(hasSuccessfulLoad || hasGracefulMessage).toBe(true);
    
    // Check that we don't have any hard model errors displayed to user
    await expect(page.locator('text=Model RequestNotes not available')).not.toBeVisible();
    await expect(page.locator('text=Model RequestAssignments not available')).not.toBeVisible();
    await expect(page.locator('text=Model RequestInformationItems not available')).not.toBeVisible();
    
    console.log('✅ Case Management shows either successful load or graceful fallback');
  });
});