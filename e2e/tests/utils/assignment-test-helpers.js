// Assignment System Test Helpers
// Utility functions for testing the assignment system

/**
 * Creates a test request for assignment testing
 */
export const createTestRequest = async (page, requestData) => {
  // Navigate to Get Estimate form
  await page.goto('http://localhost:3000/contact/get-estimate');
  await page.waitForSelector('text=Get Your Estimate');
  
  // Fill form with test data
  await page.selectOption('select[name="relationToProperty"]', requestData.relationToProperty);
  
  // Property address
  await page.fill('input[name="propertyAddress.streetAddress"]', requestData.propertyAddress.streetAddress);
  await page.fill('input[name="propertyAddress.city"]', requestData.propertyAddress.city);
  await page.selectOption('select[name="propertyAddress.state"]', requestData.propertyAddress.state);
  await page.fill('input[name="propertyAddress.zip"]', requestData.propertyAddress.zip);
  
  // Agent info
  await page.fill('input[name="agentInfo.fullName"]', requestData.agentInfo.fullName);
  await page.fill('input[name="agentInfo.email"]', requestData.agentInfo.email);
  await page.fill('input[name="agentInfo.phone"]', requestData.agentInfo.phone);
  await page.fill('input[name="agentInfo.company"]', requestData.agentInfo.company || 'Test Company');
  
  // Project details
  await page.selectOption('select[name="rtDigitalSelection"]', requestData.rtDigitalSelection || 'Kitchen Renovation');
  await page.fill('textarea[name="notes"]', requestData.notes || 'Test request for assignment system');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for success and extract request ID
  await page.waitForSelector('text=Thank you for your request!', { timeout: 15000 });
  const requestIdText = await page.textContent('[data-testid="request-id"]');
  const requestId = requestIdText?.match(/Request ID: ([A-Za-z0-9-]+)/)?.[1];
  
  return requestId;
};

/**
 * Opens a request in the admin panel
 */
export const openRequestInAdmin = async (page, requestId) => {
  await page.goto('http://localhost:3000/admin/requests');
  await page.waitForSelector('text=Requests Management');
  
  // Find request by ID or by agent name
  const requestRow = page.locator(`[data-testid="request-row"]:has-text("${requestId}")`);
  if (await requestRow.count() === 0) {
    // If not found by ID, try clicking first row
    await page.click('[data-testid="request-row"]:first-child');
  } else {
    await requestRow.click();
  }
  
  await page.waitForSelector('text=Request Information');
};

/**
 * Gets the assignment dropdown element
 */
export const getAssignmentDropdown = (page) => {
  return page.locator('select').filter({ hasText: 'Assigned To' }).first();
};

/**
 * Gets all available AEs from the dropdown
 */
export const getAvailableAEs = async (page) => {
  const dropdown = getAssignmentDropdown(page);
  const options = await dropdown.locator('option').all();
  
  const aes = [];
  for (const option of options) {
    const value = await option.getAttribute('value');
    const text = await option.textContent();
    
    // Skip empty and "Unassigned" options
    if (value && value !== 'Unassigned' && value !== '') {
      aes.push({ value, text });
    }
  }
  
  return aes;
};

/**
 * Assigns a request to a specific AE
 */
export const assignRequestToAE = async (page, aeName) => {
  const dropdown = getAssignmentDropdown(page);
  await dropdown.selectOption(aeName);
  
  // Wait for assignment to process
  await page.waitForTimeout(500);
};

/**
 * Saves request changes
 */
export const saveRequestChanges = async (page) => {
  await page.click('button:has-text("Save Changes")');
  await page.waitForSelector('text=saved successfully', { timeout: 10000 });
};

/**
 * Verifies that a request has been assigned
 */
export const verifyRequestAssignment = async (page, expectedAssignee) => {
  const dropdown = getAssignmentDropdown(page);
  const currentValue = await dropdown.inputValue();
  
  if (expectedAssignee) {
    expect(currentValue).toBe(expectedAssignee);
  } else {
    // Just verify it's not empty or "Unassigned"
    expect(currentValue).not.toBe('');
    expect(currentValue).not.toBe('Unassigned');
  }
  
  return currentValue;
};

/**
 * Cleans up test requests by agent email
 */
export const cleanupTestRequests = async (page, agentEmails) => {
  await page.goto('http://localhost:3000/admin/requests');
  await page.waitForSelector('text=Requests Management');
  
  for (const email of agentEmails) {
    // Find requests by agent email
    const requestRow = page.locator(`[data-testid="request-row"]:has-text("${email}")`);
    
    while (await requestRow.count() > 0) {
      await requestRow.first().click();
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
      await page.goto('http://localhost:3000/admin/requests');
      await page.waitForSelector('text=Requests Management');
    }
  }
};

/**
 * Authenticates as admin user
 */
export const authenticateAsAdmin = async (page) => {
  await page.goto('http://localhost:3000/admin');
  
  // Fill login form
  await page.fill('input[type="email"]', 'info@realtechee.com');
  await page.fill('input[type="password"]', 'Sababa123!');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load
  await page.waitForURL('**/admin/dashboard');
  await page.waitForSelector('text=Admin Dashboard');
};

/**
 * Measures assignment system performance
 */
export const measureAssignmentPerformance = async (page, operation) => {
  const startTime = Date.now();
  
  await operation();
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`Assignment operation took ${duration}ms`);
  return duration;
};

/**
 * Validates assignment system accessibility
 */
export const validateAssignmentAccessibility = async (page) => {
  const dropdown = getAssignmentDropdown(page);
  
  // Check for label
  const label = page.locator('text=Assigned To');
  await expect(label).toBeVisible();
  
  // Check keyboard accessibility
  await dropdown.focus();
  await expect(dropdown).toBeFocused();
  
  // Test keyboard navigation
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  
  // Should maintain focus
  await expect(dropdown).toBeFocused();
  
  return true;
};

/**
 * Generates test data for assignment system
 */
export const generateTestData = (prefix = 'Test') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  
  return {
    agentInfo: {
      fullName: `${prefix} Agent ${random}`,
      email: `agent.${random}@test.com`,
      phone: '(555) 123-4567',
      company: `${prefix} Brokerage ${random}`
    },
    propertyAddress: {
      streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${prefix} St`,
      city: 'Test City',
      state: 'CA',
      zip: '90210'
    },
    relationToProperty: 'Agent',
    rtDigitalSelection: 'Kitchen Renovation',
    notes: `${prefix} assignment test request - ${timestamp}`
  };
};

/**
 * Waits for assignment system to be ready
 */
export const waitForAssignmentSystemReady = async (page) => {
  // Wait for page to load
  await page.waitForSelector('text=Request Information');
  
  // Wait for assignment dropdown to be populated
  const dropdown = getAssignmentDropdown(page);
  await expect(dropdown).toBeVisible();
  
  // Wait for AE options to load
  await page.waitForFunction(() => {
    const select = document.querySelector('select');
    return select && select.options.length > 2; // More than just "Select AE..." and "Unassigned"
  });
};

/**
 * Verifies round-robin assignment distribution
 */
export const verifyRoundRobinDistribution = async (page, assignments) => {
  // Check that we have multiple different assignments
  const uniqueAssignments = [...new Set(assignments)];
  expect(uniqueAssignments.length).toBeGreaterThan(1);
  
  // Verify no single AE got all assignments
  const assignmentCounts = {};
  assignments.forEach(assignment => {
    assignmentCounts[assignment] = (assignmentCounts[assignment] || 0) + 1;
  });
  
  const maxCount = Math.max(...Object.values(assignmentCounts));
  const totalAssignments = assignments.length;
  
  // No single AE should have more than 60% of assignments (allowing for slight imbalance)
  expect(maxCount / totalAssignments).toBeLessThan(0.6);
  
  console.log('Assignment distribution:', assignmentCounts);
  return assignmentCounts;
};

export default {
  createTestRequest,
  openRequestInAdmin,
  getAssignmentDropdown,
  getAvailableAEs,
  assignRequestToAE,
  saveRequestChanges,
  verifyRequestAssignment,
  cleanupTestRequests,
  authenticateAsAdmin,
  measureAssignmentPerformance,
  validateAssignmentAccessibility,
  generateTestData,
  waitForAssignmentSystemReady,
  verifyRoundRobinDistribution
};