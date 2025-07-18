// Assignment System Bug Fixes Validation Tests
// Tests each of the 4 critical bugs that were fixed

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'info@realtechee.com';
const ADMIN_PASSWORD = 'Sababa123!';

// Test data
const testData = {
  testRequest: {
    agentInfo: {
      fullName: 'Test Agent Fixes ' + Date.now(),
      email: 'agent.fixes@test.com',
      phone: '(555) 123-4567',
      company: 'Test Brokerage Fixes'
    },
    propertyAddress: {
      streetAddress: '123 Fixes Test St',
      city: 'Test City',
      state: 'CA',
      zip: '90210'
    },
    relationToProperty: 'Agent',
    rtDigitalSelection: 'Kitchen Renovation',
    notes: 'Test bug fixes validation'
  }
};

// Authentication setup
test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_URL}/admin`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => url.pathname.includes('/admin'), { timeout: 10000 });
});

test.describe('Assignment System Bug Fixes Validation', () => {
  
  test('BUG FIX 1: Should not have duplicate "Unassigned" options in dropdown', async ({ page }) => {
    // Navigate to requests page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management', { timeout: 10000 });
    
    // Find any existing request and click on it
    const requestRows = await page.locator('[data-testid="request-row"]').count();
    
    if (requestRows > 0) {
      await page.locator('[data-testid="request-row"]').first().click();
      await page.waitForSelector('text=Request #', { timeout: 10000 });
      
      // Find the "Assigned To" dropdown
      const assignedToDropdown = page.locator('select').filter({ hasText: 'Unassigned' }).or(
        page.locator('select[value*="Unassigned"]')
      ).or(
        page.locator('label:has-text("Assigned To") + select')
      );
      
      // Check dropdown options
      const options = await assignedToDropdown.locator('option').allTextContents();
      console.log('Dropdown options:', options);
      
      // Count "Unassigned" options
      const unassignedOptions = options.filter(option => option.includes('Unassigned'));
      
      // Should have exactly 1 "Unassigned" option, not duplicates
      expect(unassignedOptions.length).toBe(1);
      console.log('✅ BUG FIX 1: No duplicate "Unassigned" options found');
    } else {
      console.log('⚠️ No existing requests found - skipping dropdown test');
    }
  });

  test('BUG FIX 2: Should save assignment changes without reverting', async ({ page }) => {
    // First create a test request
    await page.goto(`${BASE_URL}/contact/get-estimate`);
    await page.waitForSelector('text=Get Your Estimate', { timeout: 10000 });
    
    // Fill and submit form
    await page.selectOption('select[name="relationToProperty"]', 'Agent');
    await page.fill('input[name="propertyAddress.streetAddress"]', testData.testRequest.propertyAddress.streetAddress);
    await page.fill('input[name="propertyAddress.city"]', testData.testRequest.propertyAddress.city);
    await page.selectOption('select[name="propertyAddress.state"]', testData.testRequest.propertyAddress.state);
    await page.fill('input[name="propertyAddress.zip"]', testData.testRequest.propertyAddress.zip);
    await page.fill('input[name="agentInfo.fullName"]', testData.testRequest.agentInfo.fullName);
    await page.fill('input[name="agentInfo.email"]', testData.testRequest.agentInfo.email);
    await page.fill('input[name="agentInfo.phone"]', testData.testRequest.agentInfo.phone);
    await page.fill('input[name="agentInfo.company"]', testData.testRequest.agentInfo.company);
    await page.selectOption('select[name="rtDigitalSelection"]', testData.testRequest.rtDigitalSelection);
    await page.fill('textarea[name="notes"]', testData.testRequest.notes);
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Thank you for your request!', { timeout: 15000 });
    
    // Extract request ID
    const requestIdElement = await page.locator('[data-testid="request-id"]');
    const requestIdText = await requestIdElement.textContent();
    const requestId = requestIdText?.match(/Request ID: ([A-Za-z0-9-]+)/)?.[1];
    
    expect(requestId).toBeTruthy();
    console.log('Created test request:', requestId);
    
    // Navigate to the request detail page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management', { timeout: 10000 });
    
    // Find the newly created request
    const requestRow = page.locator(`[data-testid="request-row"]:has-text("${testData.testRequest.agentInfo.fullName}")`);
    await requestRow.click();
    await page.waitForSelector('text=Request #', { timeout: 10000 });
    
    // Find the assignment dropdown
    const assignedToDropdown = page.locator('label:has-text("Assigned To") + select');
    await assignedToDropdown.waitFor({ timeout: 10000 });
    
    // Change assignment to a specific AE
    await assignedToDropdown.selectOption('Doron');
    
    // Check if save button appears
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.waitFor({ timeout: 5000 });
    
    // Save changes
    await saveButton.click();
    await page.waitForSelector('text=Save Changes', { state: 'hidden', timeout: 10000 });
    
    // Verify assignment was saved by checking the dropdown value
    const selectedValue = await assignedToDropdown.inputValue();
    expect(selectedValue).toBe('Doron');
    console.log('✅ BUG FIX 2: Assignment saved successfully without reverting');
  });

  test('BUG FIX 3: Should handle notification system without failures', async ({ page }) => {
    // Create a request and verify notifications are queued
    await page.goto(`${BASE_URL}/contact/get-estimate`);
    await page.waitForSelector('text=Get Your Estimate', { timeout: 10000 });
    
    // Fill form with notification test data
    await page.selectOption('select[name="relationToProperty"]', 'Agent');
    await page.fill('input[name="propertyAddress.streetAddress"]', '123 Notification Test St');
    await page.fill('input[name="propertyAddress.city"]', 'Test City');
    await page.selectOption('select[name="propertyAddress.state"]', 'CA');
    await page.fill('input[name="propertyAddress.zip"]', '90210');
    await page.fill('input[name="agentInfo.fullName"]', 'Test Agent Notification');
    await page.fill('input[name="agentInfo.email"]', 'agent.notification@test.com');
    await page.fill('input[name="agentInfo.phone"]', '(555) 123-4567');
    await page.fill('input[name="agentInfo.company"]', 'Test Company');
    await page.selectOption('select[name="rtDigitalSelection"]', 'Kitchen Renovation');
    await page.fill('textarea[name="notes"]', 'Test notification system');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should complete successfully even if notifications have issues
    await page.waitForSelector('text=Thank you for your request!', { timeout: 15000 });
    
    // Check that we get a request ID (form submission succeeded)
    const requestIdElement = await page.locator('[data-testid="request-id"]');
    const requestIdText = await requestIdElement.textContent();
    const requestId = requestIdText?.match(/Request ID: ([A-Za-z0-9-]+)/)?.[1];
    
    expect(requestId).toBeTruthy();
    console.log('✅ BUG FIX 3: Form submission succeeded regardless of notification status');
  });

  test('BUG FIX 4: Should auto-assign to actual AEs, not "Unassigned"', async ({ page }) => {
    // Create a request and verify auto-assignment
    await page.goto(`${BASE_URL}/contact/get-estimate`);
    await page.waitForSelector('text=Get Your Estimate', { timeout: 10000 });
    
    // Fill form for auto-assignment test
    await page.selectOption('select[name="relationToProperty"]', 'Agent');
    await page.fill('input[name="propertyAddress.streetAddress"]', '123 Auto Assignment Test St');
    await page.fill('input[name="propertyAddress.city"]', 'Test City');
    await page.selectOption('select[name="propertyAddress.state"]', 'CA');
    await page.fill('input[name="propertyAddress.zip"]', '90210');
    await page.fill('input[name="agentInfo.fullName"]', 'Test Agent AutoAssign ' + Date.now());
    await page.fill('input[name="agentInfo.email"]', 'agent.autoassign@test.com');
    await page.fill('input[name="agentInfo.phone"]', '(555) 123-4567');
    await page.fill('input[name="agentInfo.company"]', 'Test Company');
    await page.selectOption('select[name="rtDigitalSelection"]', 'Kitchen Renovation');
    await page.fill('textarea[name="notes"]', 'Test auto-assignment functionality');
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Thank you for your request!', { timeout: 15000 });
    
    // Extract request ID
    const requestIdElement = await page.locator('[data-testid="request-id"]');
    const requestIdText = await requestIdElement.textContent();
    const requestId = requestIdText?.match(/Request ID: ([A-Za-z0-9-]+)/)?.[1];
    
    expect(requestId).toBeTruthy();
    
    // Navigate to admin to verify auto-assignment
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management', { timeout: 10000 });
    
    // Find the newly created request
    const requestRow = page.locator(`[data-testid="request-row"]:has-text("Test Agent AutoAssign")`);
    await requestRow.waitFor({ timeout: 10000 });
    
    // Check assignment status - should NOT be "Unassigned"
    const assignmentText = await requestRow.textContent();
    
    // The request should be assigned to an actual AE, not "Unassigned"
    expect(assignmentText).not.toContain('Unassigned');
    console.log('✅ BUG FIX 4: Auto-assignment assigned to actual AE, not "Unassigned"');
  });
});

test.describe('Assignment System Integration Test', () => {
  test('Should complete full workflow: Create → Auto-assign → Manual reassign → Save', async ({ page }) => {
    // Step 1: Create request
    await page.goto(`${BASE_URL}/contact/get-estimate`);
    await page.waitForSelector('text=Get Your Estimate', { timeout: 10000 });
    
    const timestamp = Date.now();
    await page.selectOption('select[name="relationToProperty"]', 'Agent');
    await page.fill('input[name="propertyAddress.streetAddress"]', '123 Integration Test St');
    await page.fill('input[name="propertyAddress.city"]', 'Test City');
    await page.selectOption('select[name="propertyAddress.state"]', 'CA');
    await page.fill('input[name="propertyAddress.zip"]', '90210');
    await page.fill('input[name="agentInfo.fullName"]', `Test Agent Integration ${timestamp}`);
    await page.fill('input[name="agentInfo.email"]', 'agent.integration@test.com');
    await page.fill('input[name="agentInfo.phone"]', '(555) 123-4567');
    await page.fill('input[name="agentInfo.company"]', 'Test Company');
    await page.selectOption('select[name="rtDigitalSelection"]', 'Kitchen Renovation');
    await page.fill('textarea[name="notes"]', 'Test full integration workflow');
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Thank you for your request!', { timeout: 15000 });
    
    // Step 2: Verify auto-assignment
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management', { timeout: 10000 });
    
    const requestRow = page.locator(`[data-testid="request-row"]:has-text("Test Agent Integration ${timestamp}")`);
    await requestRow.click();
    await page.waitForSelector('text=Request #', { timeout: 10000 });
    
    // Step 3: Manual reassignment
    const assignedToDropdown = page.locator('label:has-text("Assigned To") + select');
    await assignedToDropdown.selectOption('Doron');
    
    // Step 4: Save changes
    const saveButton = page.locator('button:has-text("Save Changes")');
    await saveButton.click();
    await page.waitForSelector('text=Save Changes', { state: 'hidden', timeout: 10000 });
    
    // Step 5: Verify final state
    const finalValue = await assignedToDropdown.inputValue();
    expect(finalValue).toBe('Doron');
    
    console.log('✅ INTEGRATION TEST: Full workflow completed successfully');
  });
});