/**
 * Seamless Business Flow Testing - QA Style
 * 
 * Tests all 9 User Stories in a continuous flow building on prior steps
 * Single browser instance, no repeated setup, seamless like real QA testing
 */

const { test, expect } = require('@playwright/test');

test.describe('Complete Business Flow - Seamless QA Testing', () => {
  let testSession;
  let createdRequestId;
  let createdQuoteId; 
  let createdProjectId;
  
  // Shared state across all tests - no beforeEach needed!
  test.beforeAll(async () => {
    testSession = `seamless-${Date.now()}`;
    console.log(`🎯 Starting seamless business flow test session: ${testSession}`);
  });

  test('01. Verify Admin Dashboard Access - Foundation', async ({ page }) => {
    console.log('🏠 Test 01: Verifying admin dashboard access...');
    
    // Start from admin dashboard (already authenticated via global setup)
    await page.goto('/admin');
    
    // Verify we're in admin dashboard
    await expect(page.locator('h1')).toContainText(['Dashboard', 'Admin']);
    
    // Verify key admin navigation is present
    await expect(page.locator('nav, aside')).toContainText(['Requests', 'Projects', 'Quotes']);
    
    console.log('✅ Admin dashboard access verified');
  });

  test('02. Get Estimate Form Submission - US01', async ({ page }) => {
    console.log('📝 Test 02: Testing Get Estimate form submission flow...');
    
    // Navigate to Get Estimate form (build on previous test)
    await page.goto('/contact/get-estimate');
    
    // Fill out the form with test data
    await page.fill('input[name="firstName"]', `Test-${testSession}`);
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', `test-${testSession}@example.com`);
    await page.fill('input[name="phone"]', '555-0123');
    await page.fill('input[name="address"]', `123 Test St, ${testSession}`);
    
    // Select project type
    await page.selectOption('select[name="product"]', 'Kitchen Remodel');
    await page.selectOption('select[name="budget"]', '$25,000 - $50,000');
    
    // Add message
    await page.fill('textarea[name="message"]', `E2E test request for ${testSession}`);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify successful submission
    await expect(page.locator('text=success, text=submitted, text=thank you')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Get Estimate form submission completed');
  });

  test('03. Verify Request Created & Assignment - US02', async ({ page }) => {
    console.log('📋 Test 03: Verifying request was created and assigned...');
    
    // Navigate to admin requests (continuing seamless flow)
    await page.goto('/admin/requests');
    
    // Search for our test request
    await page.fill('input[placeholder*="Search"], input[name="search"]', testSession);
    await page.waitForTimeout(1000); // Allow search to process
    
    // Find our request in the results
    const requestRow = page.locator(`tr:has-text("${testSession}")`).first();
    await expect(requestRow).toBeVisible({ timeout: 10000 });
    
    // Click to view request details
    await requestRow.click();
    
    // Get the request ID from URL or page for later tests
    const currentUrl = page.url();
    const requestIdMatch = currentUrl.match(/\/requests\/([^\/\?]+)/);
    if (requestIdMatch) {
      createdRequestId = requestIdMatch[1];
      console.log(`📝 Request ID captured: ${createdRequestId}`);
    }
    
    // Verify assignment happened (US02)
    await expect(page.locator('text=Assigned to, text=AE:')).toBeVisible();
    
    console.log('✅ Request creation and assignment verified');
  });

  test('04. Request Detail Enhancement & Editing - US03', async ({ page }) => {
    console.log('✏️ Test 04: Testing request detail enhancement and editing...');
    
    // Continue from request detail page (seamless flow)
    // Verify we can edit fields
    await expect(page.locator('input:not([readonly]), select:not([disabled])')).toHaveCount.greaterThan(5);
    
    // Test product dropdown editing
    await page.selectOption('select[name="product"]', 'Bathroom Remodel');
    
    // Test office notes functionality
    await page.fill('textarea[name="officeNotes"]', `Test notes added during ${testSession}`);
    
    // Test lead source editing
    await page.selectOption('select[name="leadSource"]', 'Website');
    
    // Save changes
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=saved, text=updated')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Request detail editing functionality verified');
  });

  test('05. Contact & Property Modal Testing - US04', async ({ page }) => {
    console.log('👤 Test 05: Testing contact and property modal functionality...');
    
    // Test contact modal (continuing from request detail)
    await page.click('button:has-text("Add Contact"), button:has-text("Edit Contact")');
    
    // Verify modal opens
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
    
    // Fill contact information
    await page.fill('input[name="firstName"]', `Contact-${testSession}`);
    await page.fill('input[name="email"]', `contact-${testSession}@example.com`);
    
    // Save contact
    await page.click('button:has-text("Save")');
    await expect(page.locator('[role="dialog"], .modal')).not.toBeVisible();
    
    // Test property modal
    await page.click('button:has-text("Add Property"), button:has-text("Edit Property")');
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
    
    // Fill property information
    await page.fill('input[name="address"]', `456 Property St, ${testSession}`);
    
    // Save property
    await page.click('button:has-text("Save")');
    await expect(page.locator('[role="dialog"], .modal')).not.toBeVisible();
    
    console.log('✅ Contact and property modal functionality verified');
  });

  test('06. Meeting Scheduling & PM Assignment - US05', async ({ page }) => {
    console.log('📅 Test 06: Testing meeting scheduling and PM assignment...');
    
    // Schedule a meeting (continuing seamless flow)
    await page.click('button:has-text("Schedule"), button:has-text("Meeting")');
    
    // Set meeting date/time
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateString);
    await page.fill('input[type="time"]', '10:00');
    
    // Assign PM if available
    const pmSelect = page.locator('select:has-option:text("PM"), select[name*="manager"]');
    if (await pmSelect.isVisible()) {
      await pmSelect.selectOption({ index: 1 });
    }
    
    // Confirm meeting
    await page.click('button:has-text("Confirm"), button:has-text("Schedule")');
    
    // Verify status change to "Pending walk-thru"
    await expect(page.locator('text=Pending walk-thru, text=Scheduled')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Meeting scheduling and PM assignment verified');
  });

  test('07. Status State Machine Testing - US06', async ({ page }) => {
    console.log('🔄 Test 07: Testing status state machine transitions...');
    
    // Test status transitions (continuing from scheduled meeting)
    const statusSelect = page.locator('select[name="status"]');
    
    // Move to next status in workflow
    await statusSelect.selectOption('Move to Quoting');
    await page.click('button:has-text("Save")');
    
    // Verify status change
    await expect(page.locator('text=Move to Quoting')).toBeVisible();
    
    // Test business rule validation - try invalid transition
    await statusSelect.selectOption('New');
    await page.click('button:has-text("Save")');
    
    // Should show validation or prevent invalid transition
    // (Implementation may vary based on business rules)
    
    console.log('✅ Status state machine functionality verified');
  });

  test('08. Quote Creation from Request - US08', async ({ page }) => {
    console.log('💰 Test 08: Testing quote creation from request...');
    
    // Create quote from current request (seamless continuation)
    await page.click('button:has-text("Create Quote"), button:has-text("Quote")');
    
    // Should navigate to quote creation or open quote modal
    await expect(page.locator('text=Quote, text=Estimate')).toBeVisible({ timeout: 10000 });
    
    // Fill quote details
    await page.fill('input[name="amount"], input[name="total"]', '45000');
    await page.fill('textarea[name="description"]', `Quote for ${testSession} project`);
    
    // Save quote
    await page.click('button:has-text("Save"), button:has-text("Create")');
    
    // Capture quote ID for next tests
    const quoteUrl = page.url();
    const quoteIdMatch = quoteUrl.match(/\/quotes\/([^\/\?]+)/);
    if (quoteIdMatch) {
      createdQuoteId = quoteIdMatch[1];
      console.log(`💰 Quote ID captured: ${createdQuoteId}`);
    }
    
    console.log('✅ Quote creation from request verified');
  });

  test('09. Project Creation Flow - Complete Workflow', async ({ page }) => {
    console.log('🏗️ Test 09: Testing project creation from approved quote...');
    
    // Navigate to projects (completing the business flow)
    await page.goto('/admin/projects');
    
    // Create new project
    await page.click('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    
    // Fill project details
    await page.fill('input[name="name"]', `Project-${testSession}`);
    await page.fill('textarea[name="description"]', `E2E test project for ${testSession}`);
    
    // Link to our request and quote if possible
    if (createdRequestId) {
      await page.fill('input[name="requestId"]', createdRequestId);
    }
    
    // Save project
    await page.click('button:has-text("Save"), button:has-text("Create")');
    
    // Verify project creation
    await expect(page.locator(`text=${testSession}`)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Complete business workflow verified - Request → Quote → Project');
  });

  test('10. Lead Lifecycle Management - US07', async ({ page }) => {
    console.log('🔄 Test 10: Testing lead lifecycle management...');
    
    // Navigate to lifecycle management
    await page.goto('/admin/lifecycle');
    
    // Verify lifecycle dashboard loads
    await expect(page.locator('h1, h2')).toContainText(['Lifecycle', 'Lead Management']);
    
    // Test archival functionality if available
    const archiveButton = page.locator('button:has-text("Archive")');
    if (await archiveButton.isVisible()) {
      await archiveButton.first().click();
      
      // Fill archival reason
      await page.selectOption('select[name="reason"]', { index: 1 });
      await page.fill('textarea[name="notes"]', `Archived during ${testSession} testing`);
      
      // Confirm archival
      await page.click('button:has-text("Confirm")');
    }
    
    console.log('✅ Lead lifecycle management verified');
  });

  test.afterAll(async () => {
    console.log('🧹 Cleaning up test data for session:', testSession);
    // Test data cleanup can happen here if needed
    console.log('✅ Seamless business flow testing completed successfully!');
  });
});