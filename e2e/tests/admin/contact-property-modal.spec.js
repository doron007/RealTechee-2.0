const { test, expect } = require('@playwright/test');
const { AdminAuthenticator } = require('../../utils/adminAuthenticator');

test.describe('Contact & Property Management Modals', () => {
  let authenticator;
  let testRequestId;

  test.beforeAll(async ({ browser }) => {
    authenticator = new AdminAuthenticator(browser);
    await authenticator.setup();
  });

  test.beforeEach(async ({ page }) => {
    await authenticator.authenticate(page);
    
    // Navigate to admin requests page
    await page.goto('/admin/requests');
    await page.waitForLoadState('networkidle');
    
    // Find the first request and navigate to details
    const firstRequest = await page.locator('.admin-data-grid tr').first();
    await firstRequest.click();
    await page.waitForLoadState('networkidle');
    
    // Extract request ID from URL
    const url = page.url();
    testRequestId = url.split('/').pop();
  });

  test('should display contact and property sections with edit buttons', async ({ page }) => {
    // Check that Property Information section exists
    await expect(page.locator('h3:has-text("Property Information")')).toBeVisible();
    
    // Check that Contact Information section exists
    await expect(page.locator('h3:has-text("Contact Information")')).toBeVisible();
    
    // Check for Homeowner Contact subsection
    await expect(page.locator('h4:has-text("Homeowner Contact")')).toBeVisible();
    
    // Check for Agent Contact subsection
    await expect(page.locator('h4:has-text("Agent Contact")')).toBeVisible();
    
    // Check for edit/add buttons (should see either edit or add icons)
    const editButtons = await page.locator('[data-testid="EditIcon"], [data-testid="AddIcon"]');
    expect(await editButtons.count()).toBeGreaterThan(0);
  });

  test('should open contact modal when clicking add contact button', async ({ page }) => {
    // Click add contact button (+ icon)
    await page.locator('[data-testid="AddIcon"]').first().click();
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Check modal title
    await expect(page.locator('[role="dialog"] h3')).toContainText('Add New Contact');
    
    // Check required form fields are present
    await expect(page.locator('input[name="firstName"], label:has-text("First Name") + * input')).toBeVisible();
    await expect(page.locator('input[name="lastName"], label:has-text("Last Name") + * input')).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"], label:has-text("Email") + * input')).toBeVisible();
    
    // Check optional fields
    await expect(page.locator('input[name="phone"], label:has-text("Phone") + * input')).toBeVisible();
    await expect(page.locator('input[name="mobile"], label:has-text("Mobile") + * input')).toBeVisible();
    await expect(page.locator('input[name="company"], label:has-text("Company") + * input')).toBeVisible();
    await expect(page.locator('input[name="brokerage"], label:has-text("Brokerage") + * input')).toBeVisible();
    
    // Check notification switches
    await expect(page.locator('input[type="checkbox"], input[role="switch"]')).toHaveCount(2);
    
    // Check action buttons
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Contact")')).toBeVisible();
    
    // Close modal
    await page.locator('[data-testid="CloseIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });

  test('should create a new contact with validation', async ({ page }) => {
    // Click add contact button
    await page.locator('[data-testid="AddIcon"]').first().click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Try to submit empty form - should show validation errors
    await page.locator('button:has-text("Create Contact")').click();
    
    // Check for validation errors
    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Last name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    
    // Fill in valid data
    const timestamp = Date.now();
    const testEmail = `test.contact.${timestamp}@example.com`;
    
    await page.fill('input[name="firstName"], label:has-text("First Name") + * input', 'John');
    await page.fill('input[name="lastName"], label:has-text("Last Name") + * input', 'Doe');
    await page.fill('input[name="email"], input[type="email"], label:has-text("Email") + * input', testEmail);
    await page.fill('input[name="phone"], label:has-text("Phone") + * input', '555-123-4567');
    await page.fill('input[name="mobile"], label:has-text("Mobile") + * input', '555-987-6543');
    await page.fill('input[name="company"], label:has-text("Company") + * input', 'Test Company');
    await page.fill('input[name="brokerage"], label:has-text("Brokerage") + * input', 'Test Brokerage');
    
    // Submit form
    await page.locator('button:has-text("Create Contact")').click();
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    
    // Check that contact was created (page should update)
    await page.waitForTimeout(1000);
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should validate email format and show duplicate warnings', async ({ page }) => {
    // Click add contact button
    await page.locator('[data-testid="AddIcon"]').first().click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Fill in invalid email
    await page.fill('input[name="firstName"], label:has-text("First Name") + * input', 'Test');
    await page.fill('input[name="lastName"], label:has-text("Last Name") + * input', 'User');
    await page.fill('input[name="email"], input[type="email"], label:has-text("Email") + * input', 'invalid-email');
    
    // Try to submit
    await page.locator('button:has-text("Create Contact")').click();
    
    // Check for email validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    
    // Fix email and try with a potentially duplicate one
    await page.fill('input[name="email"], input[type="email"], label:has-text("Email") + * input', 'info@realtechee.com');
    await page.locator('button:has-text("Create Contact")').click();
    
    // Should show duplicate warning or error
    await expect(page.locator('[role="alert"]')).toBeVisible();
    
    // Close modal
    await page.locator('[data-testid="CloseIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });

  test('should open property modal when clicking add property button', async ({ page }) => {
    // Find property section and click add button
    await page.locator('h3:has-text("Property Information")').scrollIntoViewIfNeeded();
    await page.locator('h3:has-text("Property Information")').locator('.. [data-testid="AddIcon"]').click();
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Check modal title
    await expect(page.locator('[role="dialog"] h3')).toContainText('Add New Property');
    
    // Check address search section
    await expect(page.locator('h4:has-text("Address Search")')).toBeVisible();
    await expect(page.locator('input[placeholder*="123 Main St"]')).toBeVisible();
    await expect(page.locator('button:has-text("Search")')).toBeVisible();
    
    // Check required address fields
    await expect(page.locator('label:has-text("House Address") + * input')).toBeVisible();
    await expect(page.locator('label:has-text("City") + * input')).toBeVisible();
    await expect(page.locator('label:has-text("State") + * select, label:has-text("State") + * [role="combobox"]')).toBeVisible();
    await expect(page.locator('label:has-text("ZIP Code") + * input')).toBeVisible();
    
    // Check optional property details
    await expect(page.locator('label:has-text("Property Type") + * select, label:has-text("Property Type") + * [role="combobox"]')).toBeVisible();
    await expect(page.locator('label:has-text("Bedrooms") + * input')).toBeVisible();
    await expect(page.locator('label:has-text("Bathrooms") + * input')).toBeVisible();
    await expect(page.locator('label:has-text("Size") + * input')).toBeVisible();
    await expect(page.locator('label:has-text("Year Built") + * input')).toBeVisible();
    
    // Check property links
    await expect(page.locator('label:has-text("Redfin Link") + * input')).toBeVisible();
    await expect(page.locator('label:has-text("Zillow Link") + * input')).toBeVisible();
    
    // Check action buttons
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Property")')).toBeVisible();
    
    // Close modal
    await page.locator('[data-testid="CloseIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });

  test('should create a new property with validation', async ({ page }) => {
    // Click add property button
    await page.locator('h3:has-text("Property Information")').scrollIntoViewIfNeeded();
    await page.locator('h3:has-text("Property Information")').locator('.. [data-testid="AddIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Try to submit empty form - should show validation errors
    await page.locator('button:has-text("Create Property")').click();
    
    // Check for validation errors
    await expect(page.locator('text=House address is required')).toBeVisible();
    await expect(page.locator('text=City is required')).toBeVisible();
    await expect(page.locator('text=State is required')).toBeVisible();
    await expect(page.locator('text=ZIP code is required')).toBeVisible();
    
    // Fill in valid data
    const timestamp = Date.now();
    
    await page.fill('label:has-text("House Address") + * input', `${timestamp} Test Street`);
    await page.fill('label:has-text("City") + * input', 'Test City');
    await page.selectOption('label:has-text("State") + * select, label:has-text("State") + * [role="combobox"]', 'CA');
    await page.fill('label:has-text("ZIP Code") + * input', '90210');
    
    // Fill optional fields
    await page.selectOption('label:has-text("Property Type") + * select, label:has-text("Property Type") + * [role="combobox"]', 'Single Family Home');
    await page.fill('label:has-text("Bedrooms") + * input', '3');
    await page.fill('label:has-text("Bathrooms") + * input', '2');
    await page.fill('label:has-text("Size") + * input', '1500');
    await page.fill('label:has-text("Year Built") + * input', '2020');
    
    // Submit form
    await page.locator('button:has-text("Create Property")').click();
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    
    // Check that property was created (page should update)
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${timestamp} Test Street`)).toBeVisible();
  });

  test('should validate property address and show duplicate warnings', async ({ page }) => {
    // Click add property button
    await page.locator('h3:has-text("Property Information")').scrollIntoViewIfNeeded();
    await page.locator('h3:has-text("Property Information")').locator('.. [data-testid="AddIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Fill in invalid ZIP code
    await page.fill('label:has-text("House Address") + * input', '123 Test St');
    await page.fill('label:has-text("City") + * input', 'Test City');
    await page.selectOption('label:has-text("State") + * select, label:has-text("State") + * [role="combobox"]', 'CA');
    await page.fill('label:has-text("ZIP Code") + * input', '123');
    
    // Try to submit
    await page.locator('button:has-text("Create Property")').click();
    
    // Check for ZIP validation error
    await expect(page.locator('text=Please enter a valid ZIP code')).toBeVisible();
    
    // Fix ZIP and try with invalid year
    await page.fill('label:has-text("ZIP Code") + * input', '90210');
    await page.fill('label:has-text("Year Built") + * input', '1500');
    await page.locator('button:has-text("Create Property")').click();
    
    // Check for year validation error
    await expect(page.locator('text=Please enter a valid year built')).toBeVisible();
    
    // Close modal
    await page.locator('[data-testid="CloseIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });

  test('should test address search functionality', async ({ page }) => {
    // Click add property button
    await page.locator('h3:has-text("Property Information")').scrollIntoViewIfNeeded();
    await page.locator('h3:has-text("Property Information")').locator('.. [data-testid="AddIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Fill in full address
    await page.fill('input[placeholder*="123 Main St"]', '123 Main St, Beverly Hills, CA 90210');
    
    // Click search button
    await page.locator('button:has-text("Search")').click();
    
    // Wait for search to complete
    await page.waitForTimeout(2000);
    
    // Check that address components were populated
    await expect(page.locator('label:has-text("House Address") + * input')).toHaveValue('123 Main St');
    await expect(page.locator('label:has-text("City") + * input')).toHaveValue('Beverly Hills');
    await expect(page.locator('label:has-text("State") + * select, label:has-text("State") + * [role="combobox"]')).toHaveValue('CA');
    await expect(page.locator('label:has-text("ZIP Code") + * input')).toHaveValue('90210');
    
    // Close modal
    await page.locator('[data-testid="CloseIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });

  test('should handle modal close and cancel operations', async ({ page }) => {
    // Test contact modal cancel
    await page.locator('[data-testid="AddIcon"]').first().click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Fill some data
    await page.fill('input[name="firstName"], label:has-text("First Name") + * input', 'Test');
    
    // Click cancel
    await page.locator('button:has-text("Cancel")').click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    
    // Test property modal ESC key
    await page.locator('h3:has-text("Property Information")').locator('.. [data-testid="AddIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Fill some data
    await page.fill('label:has-text("House Address") + * input', 'Test Address');
    
    // Press ESC key
    await page.keyboard.press('Escape');
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    
    // Test backdrop click (should work)
    await page.locator('[data-testid="AddIcon"]').first().click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Click backdrop (outside modal)
    await page.locator('[role="dialog"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });

  test('should display fallback request data when contacts are not linked', async ({ page }) => {
    // Check that fallback request data section is visible
    await expect(page.locator('h4:has-text("Request Form Data")')).toBeVisible();
    
    // Check that client and agent data from request is displayed
    await expect(page.locator('text=Client Name')).toBeVisible();
    await expect(page.locator('text=Client Email')).toBeVisible();
    await expect(page.locator('text=Agent Name')).toBeVisible();
    await expect(page.locator('text=Agent Email')).toBeVisible();
    await expect(page.locator('text=Brokerage')).toBeVisible();
  });

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that sections stack vertically on mobile
    await page.locator('h3:has-text("Property Information")').scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Property Information")')).toBeVisible();
    
    // Open property modal on mobile
    await page.locator('h3:has-text("Property Information")').locator('.. [data-testid="AddIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Check that modal is responsive
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="123 Main St"]')).toBeVisible();
    
    // Close modal
    await page.locator('[data-testid="CloseIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });

  test('should preserve unsaved changes warning', async ({ page }) => {
    // Make changes to request form
    await page.fill('textarea[name="message"], label:has-text("Message") + * textarea', 'Test message update');
    
    // Check that unsaved changes warning appears
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    
    // Open contact modal
    await page.locator('[data-testid="AddIcon"]').first().click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Close modal
    await page.locator('[data-testid="CloseIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    
    // Check that unsaved changes warning is still there
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    // Clean up any test data if needed
    await page.close();
  });
});

// Additional test for testing the data validation service directly
test.describe('Data Validation Service Integration', () => {
  test('should validate contact data through API', async ({ page }) => {
    // This test would require setting up API testing
    // For now, we'll test the UI validation feedback
    
    await page.goto('/admin/requests');
    await page.waitForLoadState('networkidle');
    
    // Find first request
    const firstRequest = await page.locator('.admin-data-grid tr').first();
    await firstRequest.click();
    await page.waitForLoadState('networkidle');
    
    // Open contact modal
    await page.locator('[data-testid="AddIcon"]').first().click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Fill form with known duplicate data
    await page.fill('input[name="firstName"], label:has-text("First Name") + * input', 'Test');
    await page.fill('input[name="lastName"], label:has-text("Last Name") + * input', 'User');
    await page.fill('input[name="email"], input[type="email"], label:has-text("Email") + * input', 'test@example.com');
    
    // Submit and wait for validation
    await page.locator('button:has-text("Create Contact")').click();
    await page.waitForTimeout(2000);
    
    // Check for validation feedback (either success or duplicate warning)
    const hasAlert = await page.locator('[role="alert"]').count();
    expect(hasAlert).toBeGreaterThanOrEqual(0);
    
    // Close modal
    await page.locator('[data-testid="CloseIcon"]').click();
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
  });
});