/**
 * Assignment System Robust E2E Tests
 * 
 * Using the new RobustFormTester framework for reliable form testing
 * with intelligent field detection and validation.
 */

const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');
const { GetEstimateFormTester } = require('../../utils/GetEstimateFormTester');

// Use authenticated user for admin access
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Assignment System - Robust E2E Tests', () => {
  
  let formTester;
  let testData;
  
  test.beforeEach(async ({ page }) => {
    // Initialize form tester
    formTester = new GetEstimateFormTester(page, {
      debugMode: false,
      timeout: 30000
    });
    
    // Generate unique test data
    testData = GetEstimateFormTester.createTestData({
      agentInfo: {
        fullName: `Test Agent Robust ${Date.now()}`,
        email: `test.robust${Date.now()}@example.com`,
        phone: '5551234567',
        brokerage: 'Equity Union'
      },
      notes: 'Robust assignment system test - automated validation'
    });
  });

  test('01. Complete Form Submission with Auto-Assignment', async ({ page }) => {
    console.log('🧪 TEST 01: Complete Form Submission with Auto-Assignment');
    
    // Run complete test workflow
    const testResults = await formTester.runCompleteTest(testData);
    
    // Validate test results
    expect(testResults.success).toBe(true);
    expect(testResults.errors).toHaveLength(0);
    expect(testResults.formFilling.filled.length).toBeGreaterThan(0);
    
    // Wait for database processing
    await page.waitForTimeout(5000);
    
    // Validate auto-assignment in database
    const dbRecord = await getDatabaseRecord(testData.agentInfo.fullName);
    expect(dbRecord).toBeTruthy();
    expect(dbRecord.assignedTo).toBeTruthy();
    expect(dbRecord.assignedTo).not.toBe('Unassigned');
    
    console.log('✅ Auto-assignment verified:', dbRecord.assignedTo);
    
    // Store test results for next tests
    test.info().annotations.push({ 
      type: 'test-data', 
      description: JSON.stringify({
        agentName: testData.agentInfo.fullName,
        requestId: testResults.submission?.requestId,
        assignedTo: dbRecord.assignedTo
      })
    });
  });

  test('02. Assignment Dropdown Validation', async ({ page }) => {
    console.log('🧪 TEST 02: Assignment Dropdown Validation');
    
    // Navigate to admin requests
    await page.goto('/admin/requests');
    
    // Wait for requests to load with retry
    await waitForElementWithRetry(page, 'table, .table, [data-testid="requests-table"]');
    
    // Look for test request (use any recent test request)
    const testRequestRows = await page.locator('tr').filter({ hasText: 'Test Agent Robust' });
    const rowCount = await testRequestRows.count();
    
    if (rowCount === 0) {
      // Create a test request first
      await formTester.navigateToForm();
      await formTester.runCompleteTest();
      await page.goto('/admin/requests');
      await waitForElementWithRetry(page, 'table, .table, [data-testid="requests-table"]');
    }
    
    // Click on first available test request
    const testRequestRow = page.locator('tr').filter({ hasText: 'Test Agent Robust' }).first();
    await expect(testRequestRow).toBeVisible({ timeout: 10000 });
    
    await testRequestRow.click();
    
    // Wait for request details to load
    await page.waitForURL(/.*\/admin\/requests\/.*/, { timeout: 10000 });
    
    // Validate assignment dropdown
    await waitForElementWithRetry(page, 'select[name="assignedTo"]');
    
    const assignmentSelect = page.locator('select[name="assignedTo"]');
    const options = await assignmentSelect.locator('option').allTextContents();
    
    console.log('📋 Assignment dropdown options:', options);
    
    // Validate exactly ONE "Unassigned" option
    const unassignedCount = options.filter(opt => opt.includes('Unassigned')).length;
    expect(unassignedCount).toBe(1);
    
    // Validate we have actual AE options
    const availableAEs = await getAvailableAEs();
    const assignableAEs = availableAEs.filter(ae => ae.name !== 'Unassigned');
    
    expect(assignableAEs.length).toBeGreaterThan(0);
    
    // Validate dropdown contains expected AEs
    for (const ae of assignableAEs) {
      expect(options.some(opt => opt.includes(ae.name))).toBe(true);
    }
    
    console.log('✅ Assignment dropdown validated successfully');
  });

  test('03. Assignment Save Functionality', async ({ page }) => {
    console.log('🧪 TEST 03: Assignment Save Functionality');
    
    // Navigate to admin requests
    await page.goto('/admin/requests');
    await waitForElementWithRetry(page, 'table, .table, [data-testid="requests-table"]');
    
    // Find a test request
    const testRequestRow = page.locator('tr').filter({ hasText: 'Test Agent Robust' }).first();
    await expect(testRequestRow).toBeVisible({ timeout: 10000 });
    
    await testRequestRow.click();
    await page.waitForURL(/.*\/admin\/requests\/.*/, { timeout: 10000 });
    
    // Get request ID from URL
    const requestId = page.url().split('/').pop();
    
    // Test assignment changes
    await waitForElementWithRetry(page, 'select[name="assignedTo"]');
    const assignmentSelect = page.locator('select[name="assignedTo"]');
    
    // Test sequence: Current -> Doron -> Accounting -> Unassigned
    const testSequence = ['Doron', 'Accounting', 'Unassigned'];
    
    for (const testAssignment of testSequence) {
      console.log(`🔄 Testing assignment to: ${testAssignment}`);
      
      // Change assignment
      await assignmentSelect.selectOption(testAssignment);
      
      // Wait for save button and click
      await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 5000 });
      await page.click('button[type="submit"]');
      
      // Wait for save to complete
      await page.waitForTimeout(2000);
      
      // Verify in UI
      const currentValue = await assignmentSelect.inputValue();
      expect(currentValue).toBe(testAssignment);
      
      // Verify in database
      const dbRecord = await getDatabaseRecord(requestId);
      expect(dbRecord.assignedTo).toBe(testAssignment);
      
      console.log(`✅ Assignment to ${testAssignment} verified in UI and database`);
    }
    
    // Test persistence after page refresh
    await page.reload();
    await waitForElementWithRetry(page, 'select[name="assignedTo"]');
    
    const finalValue = await assignmentSelect.inputValue();
    expect(finalValue).toBe('Unassigned');
    
    console.log('✅ Assignment persistence verified after page refresh');
  });

  test('04. Assignment System Stress Test', async ({ page }) => {
    console.log('🧪 TEST 04: Assignment System Stress Test');
    
    // Create multiple test requests quickly
    const stressTestResults = [];
    
    for (let i = 0; i < 3; i++) {
      const stressTestData = GetEstimateFormTester.createTestData({
        agentInfo: {
          fullName: `Stress Test Agent ${i + 1} ${Date.now()}`,
          email: `stress${i}${Date.now()}@example.com`,
          phone: '5551234567',
          brokerage: 'Equity Union'
        }
      });
      
      console.log(`🔄 Creating stress test request ${i + 1}/3`);
      
      const result = await formTester.runCompleteTest(stressTestData);
      stressTestResults.push(result);
      
      // Wait briefly between requests
      await page.waitForTimeout(1000);
    }
    
    // Validate all requests were created successfully
    const successCount = stressTestResults.filter(r => r.success).length;
    expect(successCount).toBe(3);
    
    // Wait for database processing
    await page.waitForTimeout(5000);
    
    // Validate assignments were distributed
    const assignments = [];
    for (const result of stressTestResults) {
      const dbRecord = await getDatabaseRecord(result.testData.agentInfo.fullName);
      if (dbRecord) {
        assignments.push(dbRecord.assignedTo);
      }
    }
    
    console.log('📋 Stress test assignments:', assignments);
    
    // Validate assignments are to actual AEs
    const validAssignments = assignments.filter(a => a && a !== 'Unassigned');
    expect(validAssignments.length).toBeGreaterThan(0);
    
    console.log('✅ Assignment system stress test completed successfully');
  });

  test('05. End-to-End Assignment Workflow', async ({ page }) => {
    console.log('🧪 TEST 05: End-to-End Assignment Workflow');
    
    // Step 1: Submit form
    const workflowTestData = GetEstimateFormTester.createTestData({
      agentInfo: {
        fullName: `Workflow Test Agent ${Date.now()}`,
        email: `workflow${Date.now()}@example.com`,
        phone: '5551234567',
        brokerage: 'Equity Union'
      }
    });
    
    const testResults = await formTester.runCompleteTest(workflowTestData);
    expect(testResults.success).toBe(true);
    
    // Step 2: Verify in admin
    await page.goto('/admin/requests');
    await waitForElementWithRetry(page, 'table, .table, [data-testid="requests-table"]');
    
    const workflowRequestRow = page.locator('tr').filter({ 
      hasText: workflowTestData.agentInfo.fullName 
    });
    await expect(workflowRequestRow).toBeVisible({ timeout: 10000 });
    
    // Step 3: Verify auto-assignment
    const rowText = await workflowRequestRow.textContent();
    expect(rowText).not.toContain('Unassigned');
    
    // Step 4: Test assignment workflow
    await workflowRequestRow.click();
    await page.waitForURL(/.*\/admin\/requests\/.*/, { timeout: 10000 });
    
    await waitForElementWithRetry(page, 'select[name="assignedTo"]');
    const assignmentSelect = page.locator('select[name="assignedTo"]');
    
    // Test rapid assignment changes
    const rapidSequence = ['Doron', 'Demo', 'Accounting', 'Unassigned'];
    
    for (const assignment of rapidSequence) {
      await assignmentSelect.selectOption(assignment);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      
      const currentValue = await assignmentSelect.inputValue();
      expect(currentValue).toBe(assignment);
    }
    
    console.log('✅ End-to-end assignment workflow completed successfully');
  });

  // Helper functions
  async function waitForElementWithRetry(page, selector, options = {}) {
    const { timeout = 15000, retries = 3 } = options;
    
    for (let i = 0; i < retries; i++) {
      try {
        await page.waitForSelector(selector, { timeout });
        return true;
      } catch (error) {
        if (i === retries - 1) throw error;
        await page.waitForTimeout(2000);
      }
    }
  }

  async function getDatabaseRecord(identifier) {
    try {
      let query;
      
      if (identifier.includes('-')) {
        // It's a request ID
        query = `aws dynamodb get-item --table-name "Requests-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --key '{"id": {"S": "${identifier}"}}' --query "Item.{assignedTo: assignedTo.S, createdAt: createdAt.S, status: status.S}" --output json`;
      } else {
        // It's a test identifier - search by leadSource and get the most recent test record
        query = `aws dynamodb scan --table-name "Requests-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "leadSource = :leadSource AND contains(officeNotes, :testId)" --expression-attribute-values '{":leadSource": {"S": "E2E_TEST"}, ":testId": {"S": "TEST_SESSION"}}' --query "Items[0].{assignedTo: assignedTo.S, createdAt: createdAt.S, status: status.S}" --output json`;
      }
      
      const result = execSync(query, { encoding: 'utf8' });
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to get database record:', error);
      return null;
    }
  }

  async function getAvailableAEs() {
    try {
      const query = `aws dynamodb scan --table-name "BackOfficeAssignTo-fvn7t5hbobaxjklhrqzdl4ac34-NONE" --region us-west-1 --filter-expression "active = :active" --expression-attribute-values '{":active": {"BOOL": true}}' --query "Items[*].{name: name.S, active: active.BOOL, order: order.S}" --output json`;
      const result = execSync(query, { encoding: 'utf8' });
      return JSON.parse(result);
    } catch (error) {
      console.error('Failed to get available AEs:', error);
      return [];
    }
  }

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      console.log(`❌ Test failed: ${testInfo.title}`);
      
      // Take screenshot on failure
      await page.screenshot({ 
        path: `e2e/test-results/assignment-robust-failure-${Date.now()}.png`,
        fullPage: true 
      });
    }
  });
});