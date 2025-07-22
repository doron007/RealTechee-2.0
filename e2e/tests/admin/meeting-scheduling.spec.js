/**
 * E2E Tests for Meeting Scheduling & Project Manager Assignment
 * Tests User Story 05: Meeting Scheduling & PM Assignment functionality
 */

const { test, expect } = require('@playwright/test');
const { testDataUtils } = require('../../utils/testDataUtils');

test.describe('Meeting Scheduling & PM Assignment', () => {
  let requestId;
  let testSession;

  test.beforeEach(async ({ page }) => {
    testSession = `meeting-test-${Date.now()}`;
    
    // Authenticate as admin
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign In' }).click();
    await page.fill('input[name="username"]', 'info@realtechee.com');
    await page.fill('input[name="password"]', 'Sababa123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for successful login
    await page.waitForSelector('[data-testid="admin-dashboard"], .admin-dashboard, h1:has-text("Dashboard")', { timeout: 10000 });
  });

  test.afterEach(async () => {
    // Clean up test data
    if (requestId) {
      await testDataUtils.markForCleanup('Requests', requestId, testSession);
    }
  });

  test('Complete meeting scheduling workflow', async ({ page }) => {
    // Create a test request first
    requestId = await createTestRequest(testSession);
    
    // Navigate to request detail page
    await page.goto(`/admin/requests/${requestId}`);
    await page.waitForSelector('h1:has-text("Request #")', { timeout: 10000 });

    // Verify meeting scheduler component is present
    await expect(page.getByText('Meeting Scheduling & Project Manager Assignment')).toBeVisible();

    // Test meeting date selection
    const meetingDate = new Date();
    meetingDate.setDate(meetingDate.getDate() + 7); // 1 week from now
    const dateString = meetingDate.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateString);
    await page.fill('input[type="time"]', '14:00'); // 2 PM

    // Test meeting type selection
    await page.selectOption('select:near(:text("Meeting Type"))', 'in-person');

    // Test PM assignment
    const pmDropdown = page.locator('select:near(:text("Assigned Project Manager"))');
    await pmDropdown.waitFor({ state: 'visible', timeout: 5000 });
    
    // Wait for PM list to load
    await page.waitForTimeout(2000);
    
    // Get available PM options
    const pmOptions = await pmDropdown.locator('option:not([value=""])').all();
    
    if (pmOptions.length > 0) {
      const firstPM = await pmOptions[0].textContent();
      await pmDropdown.selectOption({ label: firstPM });
    }

    // Add meeting location for in-person meeting
    await page.fill('input:near(:text("Meeting Location"))', '123 Test Property St, Test City');

    // Add meeting notes
    await page.fill('textarea:near(:text("Meeting Notes"))', `Test meeting scheduled by E2E test - ${testSession}`);

    // Schedule the meeting
    await page.getByRole('button', { name: 'Schedule Meeting' }).click();

    // Wait for success (no error messages)
    await page.waitForTimeout(3000);
    
    // Verify no error messages
    const errorMessage = page.locator('.text-red-700, .text-red-600, [class*="error"]');
    await expect(errorMessage).not.toBeVisible();

    // Verify meeting was saved by checking if Save Changes button appears
    // (indicating the form data was saved and page refreshed)
    const saveButton = page.getByRole('button', { name: 'Save Changes' });
    // Save button should not be visible if meeting was saved successfully
    await expect(saveButton).not.toBeVisible();
  });

  test('Meeting date validation', async ({ page }) => {
    requestId = await createTestRequest(testSession);
    
    await page.goto(`/admin/requests/${requestId}`);
    await page.waitForSelector('h1:has-text("Request #")', { timeout: 10000 });

    // Test past date validation
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastDateString = pastDate.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', pastDateString);
    await page.fill('input[type="time"]', '14:00');
    
    await page.getByRole('button', { name: 'Schedule Meeting' }).click();
    
    // Should show validation error
    await expect(page.getByText('Meeting date must be in the future')).toBeVisible();

    // Test far future date validation (90+ days)
    const farFutureDate = new Date();
    farFutureDate.setDate(farFutureDate.getDate() + 100);
    const farFutureDateString = farFutureDate.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', farFutureDateString);
    
    await page.getByRole('button', { name: 'Schedule Meeting' }).click();
    
    // Should show validation error
    await expect(page.getByText('cannot be more than 90 days in the future')).toBeVisible();
  });

  test('Business hours validation', async ({ page }) => {
    requestId = await createTestRequest(testSession);
    
    await page.goto(`/admin/requests/${requestId}`);
    await page.waitForSelector('h1:has-text("Request #")', { timeout: 10000 });

    // Test early morning time (before business hours)
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 7);
    const dateString = validDate.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateString);
    await page.fill('input[type="time"]', '07:00'); // 7 AM (before business hours)
    
    await page.getByRole('button', { name: 'Schedule Meeting' }).click();
    
    // Should show validation error for business hours
    await expect(page.getByText('during business hours')).toBeVisible();

    // Test late evening time (after business hours)
    await page.fill('input[type="time"]', '19:00'); // 7 PM (after business hours)
    
    await page.getByRole('button', { name: 'Schedule Meeting' }).click();
    
    // Should show validation error for business hours
    await expect(page.getByText('during business hours')).toBeVisible();
  });

  test('Calendar export functionality', async ({ page }) => {
    requestId = await createTestRequest(testSession);
    
    await page.goto(`/admin/requests/${requestId}`);
    await page.waitForSelector('h1:has-text("Request #")', { timeout: 10000 });

    // Fill in meeting details
    const meetingDate = new Date();
    meetingDate.setDate(meetingDate.getDate() + 7);
    const dateString = meetingDate.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateString);
    await page.fill('input[type="time"]', '14:00');

    // Test calendar export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export to Calendar' }).click()
    ]);

    // Verify download
    expect(download.suggestedFilename()).toMatch(/meeting-.*\.ics/);
    
    // Verify file content
    const path = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf8');
    
    expect(content).toContain('BEGIN:VCALENDAR');
    expect(content).toContain('BEGIN:VEVENT');
    expect(content).toContain('SUMMARY:Property Assessment Meeting');
    expect(content).toContain('END:VEVENT');
    expect(content).toContain('END:VCALENDAR');
  });

  test('Meeting type conditional fields', async ({ page }) => {
    requestId = await createTestRequest(testSession);
    
    await page.goto(`/admin/requests/${requestId}`);
    await page.waitForSelector('h1:has-text("Request #")', { timeout: 10000 });

    // Test in-person meeting type shows location field
    await page.selectOption('select:near(:text("Meeting Type"))', 'in-person');
    await expect(page.getByText('Meeting Location')).toBeVisible();

    // Test virtual meeting type hides location field
    await page.selectOption('select:near(:text("Meeting Type"))', 'virtual');
    await expect(page.getByText('Meeting Location')).not.toBeVisible();

    // Test hybrid meeting type shows location field
    await page.selectOption('select:near(:text("Meeting Type"))', 'hybrid');
    await expect(page.getByText('Meeting Location')).toBeVisible();
  });

  test('PM assignment workflow', async ({ page }) => {
    requestId = await createTestRequest(testSession);
    
    await page.goto(`/admin/requests/${requestId}`);
    await page.waitForSelector('h1:has-text("Request #")', { timeout: 10000 });

    // Verify PM dropdown loads
    const pmDropdown = page.locator('select:near(:text("Assigned Project Manager"))');
    await pmDropdown.waitFor({ state: 'visible', timeout: 5000 });

    // Wait for PM options to load
    await page.waitForTimeout(2000);

    // Verify dropdown has options (at least the default "Select Project Manager...")
    const optionCount = await pmDropdown.locator('option').count();
    expect(optionCount).toBeGreaterThan(0);

    // Verify default option
    await expect(pmDropdown.locator('option[value=""]')).toHaveText('Select Project Manager...');
  });

  test('Customer requested meeting display', async ({ page }) => {
    // Create a test request with requested meeting time
    const meetingTime = new Date();
    meetingTime.setDate(meetingTime.getDate() + 5);
    requestId = await createTestRequestWithMeeting(testSession, meetingTime.toISOString());
    
    await page.goto(`/admin/requests/${requestId}`);
    await page.waitForSelector('h1:has-text("Request #")', { timeout: 10000 });

    // Verify customer requested meeting info is displayed
    await expect(page.getByText('Customer Requested Meeting')).toBeVisible();
    
    // Verify the requested date is shown
    const formattedDate = meetingTime.toLocaleDateString();
    await expect(page.getByText(formattedDate)).toBeVisible();
  });

  test('Form validation and error handling', async ({ page }) => {
    requestId = await createTestRequest(testSession);
    
    await page.goto(`/admin/requests/${requestId}`);
    await page.waitForSelector('h1:has-text("Request #")', { timeout: 10000 });

    // Test scheduling without date
    await page.getByRole('button', { name: 'Schedule Meeting' }).click();
    await expect(page.getByText('Meeting date and time are required')).toBeVisible();

    // Test scheduling with date but no time
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 7);
    const dateString = validDate.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', dateString);
    await page.getByRole('button', { name: 'Schedule Meeting' }).click();
    await expect(page.getByText('Meeting date and time are required')).toBeVisible();

    // Test calendar export without complete data
    await page.getByRole('button', { name: 'Export to Calendar' }).click();
    await expect(page.getByText('Meeting date and time are required for calendar export')).toBeVisible();
  });

  test('Business rules info display', async ({ page }) => {
    requestId = await createTestRequest(testSession);
    
    await page.goto(`/admin/requests/${requestId}`);
    await page.waitForSelector('h1:has-text("Request #")', { timeout: 10000 });

    // Verify business rules information is displayed
    await expect(page.getByText('Business Rules:')).toBeVisible();
    await expect(page.getByText('Meetings can be scheduled Monday-Friday')).toBeVisible();
    await expect(page.getByText('09:00-17:00')).toBeVisible();
    await expect(page.getByText('up to 90 days in advance')).toBeVisible();
  });

  // Helper function to create a test request
  async function createTestRequest(sessionId) {
    const testData = {
      status: 'submitted',
      clientName: `Test Client ${sessionId}`,
      clientEmail: `test-${sessionId}@example.com`,
      clientPhone: '555-0123',
      propertyAddress: '123 Test St, Test City',
      message: `Test request created for meeting scheduling E2E test - ${sessionId}`,
      leadSource: 'E2E_TEST',
      additionalNotes: `Test session: ${sessionId}`,
      businessCreatedDate: new Date().toISOString(),
      businessUpdatedDate: new Date().toISOString(),
    };

    return await testDataUtils.createTestRecord('Requests', testData, sessionId);
  }

  // Helper function to create a test request with requested meeting time
  async function createTestRequestWithMeeting(sessionId, requestedDateTime) {
    const testData = {
      status: 'submitted',
      clientName: `Test Client ${sessionId}`,
      clientEmail: `test-${sessionId}@example.com`,
      clientPhone: '555-0123',
      propertyAddress: '123 Test St, Test City',
      message: `Test request with meeting request - ${sessionId}`,
      requestedVisitDateTime: requestedDateTime,
      virtualWalkthrough: 'Either',
      leadSource: 'E2E_TEST',
      additionalNotes: `Test session: ${sessionId}`,
      businessCreatedDate: new Date().toISOString(),
      businessUpdatedDate: new Date().toISOString(),
    };

    return await testDataUtils.createTestRecord('Requests', testData, sessionId);
  }
});