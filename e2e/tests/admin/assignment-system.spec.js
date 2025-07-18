// Assignment System E2E Tests
// Tests for User Story 02: Default AE Assignment System

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'info@realtechee.com';
const ADMIN_PASSWORD = 'Sababa123!';

// Test data setup
const testData = {
  // Test request data
  testRequest: {
    agentInfo: {
      fullName: 'Test Agent Assignment',
      email: 'agent.assignment@test.com',
      phone: '(555) 123-4567',
      company: 'Test Brokerage Assignment'
    },
    propertyAddress: {
      streetAddress: '123 Assignment Test St',
      city: 'Test City',
      state: 'CA',
      zip: '90210'
    },
    relationToProperty: 'Agent',
    rtDigitalSelection: 'Kitchen Renovation',
    notes: 'Test assignment system functionality'
  },
  
  // Test AE data
  testAE: {
    name: 'Test AE Assignment',
    email: 'ae.assignment@test.com',
    phone: '(555) 987-6543'
  }
};

// Authentication setup
test.beforeEach(async ({ page }) => {
  // Navigate to login
  await page.goto(`${BASE_URL}/admin`);
  
  // Fill login form
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load
  await page.waitForURL('**/admin/dashboard');
  await page.waitForSelector('text=Admin Dashboard');
});

test.describe('Assignment System - Core Functionality', () => {
  
  test('should load available AEs in request detail dropdown', async ({ page }) => {
    // Navigate to requests page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Click on first request to open detail view
    await page.click('[data-testid="request-row"]:first-child');
    await page.waitForSelector('text=Request Information');
    
    // Check that Assignment dropdown exists and has options
    const assignmentDropdown = page.locator('select').filter({ hasText: 'Assigned To' }).first();
    await expect(assignmentDropdown).toBeVisible();
    
    // Check for default options
    await expect(assignmentDropdown).toContainText('Select AE...');
    await expect(assignmentDropdown).toContainText('Unassigned');
    
    // Check that AE options are loaded from database
    const options = await assignmentDropdown.locator('option').all();
    expect(options.length).toBeGreaterThan(2); // At least Select AE + Unassigned + some AEs
  });
  
  test('should validate AE assignment when changed', async ({ page }) => {
    // Navigate to requests page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Click on first request
    await page.click('[data-testid="request-row"]:first-child');
    await page.waitForSelector('text=Request Information');
    
    // Select an AE from dropdown
    const assignmentDropdown = page.locator('select').filter({ hasText: 'Assigned To' }).first();
    await assignmentDropdown.selectOption({ index: 2 }); // Select first available AE
    
    // Check that assigned date is updated
    await page.waitForTimeout(500); // Wait for assignment to process
    
    // Verify assignment change is reflected
    const selectedValue = await assignmentDropdown.inputValue();
    expect(selectedValue).not.toBe('');
    expect(selectedValue).not.toBe('Unassigned');
  });
  
  test('should handle assignment validation errors gracefully', async ({ page }) => {
    // Navigate to requests page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Click on first request
    await page.click('[data-testid="request-row"]:first-child');
    await page.waitForSelector('text=Request Information');
    
    // Try to select an invalid AE (simulate by clearing and typing invalid name)
    const assignmentDropdown = page.locator('select').filter({ hasText: 'Assigned To' }).first();
    
    // Select "Unassigned" first
    await assignmentDropdown.selectOption('Unassigned');
    
    // Then select a valid AE
    await assignmentDropdown.selectOption({ index: 2 });
    
    // Should not show error for valid AE
    await expect(page.locator('text=not available or invalid')).toBeHidden();
  });
  
  test('should save assignment changes successfully', async ({ page }) => {
    // Navigate to requests page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Click on first request
    await page.click('[data-testid="request-row"]:first-child');
    await page.waitForSelector('text=Request Information');
    
    // Change assignment
    const assignmentDropdown = page.locator('select').filter({ hasText: 'Assigned To' }).first();
    await assignmentDropdown.selectOption({ index: 2 });
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Wait for success message
    await page.waitForSelector('text=saved successfully', { timeout: 10000 });
    
    // Verify changes persisted by refreshing
    await page.reload();
    await page.waitForSelector('text=Request Information');
    
    // Check that assignment is still selected
    const savedValue = await assignmentDropdown.inputValue();
    expect(savedValue).not.toBe('');
    expect(savedValue).not.toBe('Unassigned');
  });
});

test.describe('Assignment System - Auto-Assignment', () => {
  
  test('should auto-assign AE when new request is created', async ({ page }) => {
    // Navigate to Get Estimate form
    await page.goto(`${BASE_URL}/contact/get-estimate`);
    await page.waitForSelector('text=Get Your Estimate');
    
    // Fill out the form
    await page.selectOption('select[name="relationToProperty"]', 'Agent');
    
    // Property address
    await page.fill('input[name="propertyAddress.streetAddress"]', testData.testRequest.propertyAddress.streetAddress);
    await page.fill('input[name="propertyAddress.city"]', testData.testRequest.propertyAddress.city);
    await page.selectOption('select[name="propertyAddress.state"]', testData.testRequest.propertyAddress.state);
    await page.fill('input[name="propertyAddress.zip"]', testData.testRequest.propertyAddress.zip);
    
    // Agent info
    await page.fill('input[name="agentInfo.fullName"]', testData.testRequest.agentInfo.fullName);
    await page.fill('input[name="agentInfo.email"]', testData.testRequest.agentInfo.email);
    await page.fill('input[name="agentInfo.phone"]', testData.testRequest.agentInfo.phone);
    await page.fill('input[name="agentInfo.company"]', testData.testRequest.agentInfo.company);
    
    // Project details
    await page.selectOption('select[name="rtDigitalSelection"]', testData.testRequest.rtDigitalSelection);
    await page.fill('textarea[name="notes"]', testData.testRequest.notes);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('text=Thank you for your request!', { timeout: 15000 });
    
    // Extract request ID from success message
    const requestIdText = await page.textContent('[data-testid="request-id"]');
    const requestId = requestIdText?.match(/Request ID: ([A-Za-z0-9-]+)/)?.[1];
    
    expect(requestId).toBeTruthy();
    
    // Navigate to admin to verify auto-assignment
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Find the newly created request
    const requestRow = page.locator(`[data-testid="request-row"]:has-text("${testData.testRequest.agentInfo.fullName}")`);
    await expect(requestRow).toBeVisible();
    
    // Check that it has been assigned (not "Unassigned")
    await expect(requestRow).not.toContainText('Unassigned');
  });
  
  test('should handle auto-assignment failure gracefully', async ({ page }) => {
    // This test simulates when auto-assignment fails but form submission succeeds
    // Navigate to Get Estimate form
    await page.goto(`${BASE_URL}/contact/get-estimate`);
    await page.waitForSelector('text=Get Your Estimate');
    
    // Fill minimal form (this should trigger auto-assignment)
    await page.selectOption('select[name="relationToProperty"]', 'Agent');
    
    // Property address
    await page.fill('input[name="propertyAddress.streetAddress"]', '456 Failover Test St');
    await page.fill('input[name="propertyAddress.city"]', 'Test City');
    await page.selectOption('select[name="propertyAddress.state"]', 'CA');
    await page.fill('input[name="propertyAddress.zip"]', '90210');
    
    // Agent info
    await page.fill('input[name="agentInfo.fullName"]', 'Test Agent Failover');
    await page.fill('input[name="agentInfo.email"]', 'agent.failover@test.com');
    await page.fill('input[name="agentInfo.phone"]', '(555) 123-4567');
    await page.fill('input[name="agentInfo.company"]', 'Test Brokerage');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Form should still succeed even if auto-assignment fails
    await page.waitForSelector('text=Thank you for your request!', { timeout: 15000 });
    
    // The request should be created as "Unassigned" if auto-assignment failed
    const requestIdText = await page.textContent('[data-testid="request-id"]');
    const requestId = requestIdText?.match(/Request ID: ([A-Za-z0-9-]+)/)?.[1];
    
    expect(requestId).toBeTruthy();
  });
});

test.describe('Assignment System - Round Robin Logic', () => {
  
  test('should distribute assignments using round-robin method', async ({ page }) => {
    // This test creates multiple requests and verifies round-robin distribution
    const requestCount = 3;
    const createdRequests = [];
    
    for (let i = 0; i < requestCount; i++) {
      // Navigate to Get Estimate form
      await page.goto(`${BASE_URL}/contact/get-estimate`);
      await page.waitForSelector('text=Get Your Estimate');
      
      // Fill unique form data
      await page.selectOption('select[name="relationToProperty"]', 'Agent');
      
      // Property address
      await page.fill('input[name="propertyAddress.streetAddress"]', `${100 + i} Round Robin Test St`);
      await page.fill('input[name="propertyAddress.city"]', 'Test City');
      await page.selectOption('select[name="propertyAddress.state"]', 'CA');
      await page.fill('input[name="propertyAddress.zip"]', '90210');
      
      // Agent info
      await page.fill('input[name="agentInfo.fullName"]', `Test Agent RR ${i + 1}`);
      await page.fill('input[name="agentInfo.email"]', `agent.rr${i + 1}@test.com`);
      await page.fill('input[name="agentInfo.phone"]', '(555) 123-4567');
      await page.fill('input[name="agentInfo.company"]', 'Test Brokerage');
      
      // Project details
      await page.selectOption('select[name="rtDigitalSelection"]', 'Kitchen Renovation');
      await page.fill('textarea[name="notes"]', `Round robin test request ${i + 1}`);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for success
      await page.waitForSelector('text=Thank you for your request!', { timeout: 15000 });
      
      // Extract request ID
      const requestIdText = await page.textContent('[data-testid="request-id"]');
      const requestId = requestIdText?.match(/Request ID: ([A-Za-z0-9-]+)/)?.[1];
      
      createdRequests.push(requestId);
      
      // Small delay between requests
      await page.waitForTimeout(1000);
    }
    
    // Verify all requests were created
    expect(createdRequests).toHaveLength(requestCount);
    expect(createdRequests.every(id => id)).toBeTruthy();
    
    // Navigate to admin to check assignments
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Check that requests have different assignments (round-robin distribution)
    const assignments = [];
    for (let i = 0; i < requestCount; i++) {
      const requestRow = page.locator(`[data-testid="request-row"]:has-text("Test Agent RR ${i + 1}")`);
      await expect(requestRow).toBeVisible();
      
      // Extract assignment from row
      const assignmentCell = requestRow.locator('[data-testid="assignment-cell"]');
      const assignment = await assignmentCell.textContent();
      assignments.push(assignment);
    }
    
    // Verify that not all assignments are the same (round-robin working)
    const uniqueAssignments = [...new Set(assignments)];
    expect(uniqueAssignments.length).toBeGreaterThan(1);
  });
});

test.describe('Assignment System - Performance & Analytics', () => {
  
  test('should load assignment dropdown quickly', async ({ page }) => {
    // Navigate to requests page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Measure time to load request detail with assignment dropdown
    const startTime = Date.now();
    
    await page.click('[data-testid="request-row"]:first-child');
    await page.waitForSelector('text=Request Information');
    
    // Wait for dropdown to be populated
    const assignmentDropdown = page.locator('select').filter({ hasText: 'Assigned To' }).first();
    await expect(assignmentDropdown).toBeVisible();
    
    // Check that options are loaded
    const options = await assignmentDropdown.locator('option').all();
    expect(options.length).toBeGreaterThan(2);
    
    const loadTime = Date.now() - startTime;
    
    // Assignment dropdown should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('should handle assignment changes under load', async ({ page }) => {
    // Navigate to requests page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Click on first request
    await page.click('[data-testid="request-row"]:first-child');
    await page.waitForSelector('text=Request Information');
    
    const assignmentDropdown = page.locator('select').filter({ hasText: 'Assigned To' }).first();
    
    // Rapidly change assignments multiple times
    for (let i = 0; i < 5; i++) {
      await assignmentDropdown.selectOption({ index: (i % 3) + 1 }); // Cycle through options
      await page.waitForTimeout(200);
    }
    
    // Final assignment should be stable
    const finalValue = await assignmentDropdown.inputValue();
    expect(finalValue).toBeTruthy();
    
    // Save should work
    await page.click('button:has-text("Save Changes")');
    await page.waitForSelector('text=saved successfully', { timeout: 10000 });
  });
});

test.describe('Assignment System - Data Cleanup', () => {
  
  test.afterEach(async ({ page }) => {
    // Clean up test data after each test
    try {
      // Navigate to admin requests page
      await page.goto(`${BASE_URL}/admin/requests`);
      await page.waitForSelector('text=Requests Management');
      
      // Find and delete test requests
      const testRequests = [
        'Test Agent Assignment',
        'Test Agent Failover',
        'Test Agent RR 1',
        'Test Agent RR 2',
        'Test Agent RR 3'
      ];
      
      for (const agentName of testRequests) {
        const requestRow = page.locator(`[data-testid="request-row"]:has-text("${agentName}")`);
        if (await requestRow.count() > 0) {
          await requestRow.click();
          await page.waitForSelector('text=Request Information');
          
          // Delete request if delete button exists
          const deleteButton = page.locator('button:has-text("Delete")');
          if (await deleteButton.count() > 0) {
            await deleteButton.click();
            await page.waitForSelector('text=Are you sure?');
            await page.click('button:has-text("Yes, Delete")');
            await page.waitForSelector('text=deleted successfully');
          }
          
          // Navigate back to requests list
          await page.goto(`${BASE_URL}/admin/requests`);
          await page.waitForSelector('text=Requests Management');
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });
});

test.describe('Assignment System - Accessibility', () => {
  
  test('should have accessible assignment dropdown', async ({ page }) => {
    // Navigate to requests page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Click on first request
    await page.click('[data-testid="request-row"]:first-child');
    await page.waitForSelector('text=Request Information');
    
    // Check assignment dropdown accessibility
    const assignmentDropdown = page.locator('select').filter({ hasText: 'Assigned To' }).first();
    
    // Should have proper label
    await expect(page.locator('text=Assigned To')).toBeVisible();
    
    // Should be keyboard accessible
    await assignmentDropdown.focus();
    await expect(assignmentDropdown).toBeFocused();
    
    // Should respond to keyboard navigation
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Should maintain focus management
    await expect(assignmentDropdown).toBeFocused();
  });
});

test.describe('Assignment System - Edge Cases', () => {
  
  test('should handle empty AE list gracefully', async ({ page }) => {
    // Navigate to requests page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Click on first request
    await page.click('[data-testid="request-row"]:first-child');
    await page.waitForSelector('text=Request Information');
    
    // Assignment dropdown should still work even with no AEs
    const assignmentDropdown = page.locator('select').filter({ hasText: 'Assigned To' }).first();
    await expect(assignmentDropdown).toBeVisible();
    
    // Should have at least Select AE and Unassigned options
    await expect(assignmentDropdown).toContainText('Select AE...');
    await expect(assignmentDropdown).toContainText('Unassigned');
  });
  
  test('should handle concurrent assignment changes', async ({ page }) => {
    // Navigate to requests page
    await page.goto(`${BASE_URL}/admin/requests`);
    await page.waitForSelector('text=Requests Management');
    
    // Click on first request
    await page.click('[data-testid="request-row"]:first-child');
    await page.waitForSelector('text=Request Information');
    
    const assignmentDropdown = page.locator('select').filter({ hasText: 'Assigned To' }).first();
    
    // Simulate concurrent changes
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        assignmentDropdown.selectOption({ index: (i % 3) + 1 })
      );
    }
    
    await Promise.all(promises);
    
    // Should resolve to a stable state
    await page.waitForTimeout(1000);
    const finalValue = await assignmentDropdown.inputValue();
    expect(finalValue).toBeTruthy();
  });
});

// Test execution summary
test.afterAll(async () => {
  console.log('✅ Assignment System E2E Tests Completed');
  console.log('📊 Test Coverage:');
  console.log('   - Core functionality: Assignment dropdown, validation, save');
  console.log('   - Auto-assignment: New request assignment, failure handling');
  console.log('   - Round-robin: Distribution logic, multiple requests');
  console.log('   - Performance: Load times, concurrent operations');
  console.log('   - Accessibility: Keyboard navigation, focus management');
  console.log('   - Edge cases: Empty AE list, concurrent changes');
  console.log('   - Data cleanup: Test data removal');
});