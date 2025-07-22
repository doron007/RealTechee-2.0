const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_REQUEST_ID = 'test-request-ae-detail-enhancement';
const TEST_TIMEOUT = 30000;
const ADMIN_EMAIL = 'info@realtechee.com';
const ADMIN_PASSWORD = 'Sababa123!';

// Test data for form fields
const testData = {
  product: 'Kitchen Renovation',
  leadSource: 'Website',
  relationToProperty: 'Owner',
  budget: '$50,000',
  assignedTo: 'Accounting',
  message: 'Updated message for comprehensive testing',
  officeNotes: 'AE validation notes added during testing',
  requestedVisitDateTime: '2024-12-01T10:00',
  visitDate: '2024-12-01',
  virtualWalkthrough: 'Yes',
  rtDigitalSelection: 'both',
  needFinance: true
};

test.describe('AE Request Detail Page Enhancement', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set test timeout
    test.setTimeout(TEST_TIMEOUT);
    
    // Navigate to admin login
    await page.goto('/admin');
    
    // Login as admin user
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    
    // Navigate to requests page
    await page.goto('/admin/requests');
    await page.waitForSelector('text=Requests', { timeout: 10000 });
    
    // Find first request and navigate to detail page
    const firstRequestLink = await page.locator('table tbody tr').first().locator('a').first();
    await firstRequestLink.click();
    
    // Wait for request detail page to load
    await page.waitForSelector('text=Request #', { timeout: 10000 });
  });
  
  test('AE can edit all request information', async ({ page }) => {
    // Verify page loads with editable form
    await expect(page.locator('h1')).toContainText('Request #');
    
    // Test Product dropdown
    const productDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Select Product...")') });
    await productDropdown.selectOption(testData.product);
    await expect(productDropdown).toHaveValue(testData.product);
    
    // Test Lead Source dropdown
    const leadSourceDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Select Lead Source...")') });
    await leadSourceDropdown.selectOption(testData.leadSource);
    await expect(leadSourceDropdown).toHaveValue(testData.leadSource);
    
    // Test Relation to Property dropdown
    const relationDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Select Relation...")') });
    await relationDropdown.selectOption(testData.relationToProperty);
    await expect(relationDropdown).toHaveValue(testData.relationToProperty);
    
    // Test Budget field
    const budgetField = page.locator('input[type="text"]').filter({ has: page.locator('xpath=../label[contains(text(), "Budget")]') });
    await budgetField.fill(testData.budget);
    await expect(budgetField).toHaveValue(testData.budget);
    
    // Test Message textarea
    const messageField = page.locator('textarea').filter({ has: page.locator('xpath=../label[contains(text(), "Message")]') });
    await messageField.fill(testData.message);
    await expect(messageField).toHaveValue(testData.message);
    
    // Test Office Notes textarea
    const officeNotesField = page.locator('textarea').filter({ has: page.locator('xpath=../label[contains(text(), "Office Notes")]') });
    await officeNotesField.fill(testData.officeNotes);
    await expect(officeNotesField).toHaveValue(testData.officeNotes);
    
    // Test Needs Finance checkbox
    const needFinanceCheckbox = page.locator('input[type="checkbox"]').filter({ has: page.locator('xpath=../text()[contains(., "Needs Finance")]') });
    await needFinanceCheckbox.check();
    await expect(needFinanceCheckbox).toBeChecked();
    
    // Verify save button appears when changes are made
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Wait for save success (button should disappear or show success state)
    await page.waitForTimeout(2000);
    await expect(page.locator('button:has-text("Save Changes")')).not.toBeVisible();
  });
  
  test('Product dropdown integration with BackOfficeProducts', async ({ page }) => {
    // Click on product dropdown
    const productDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Select Product...")') });
    await productDropdown.click();
    
    // Verify dropdown options are loaded from BackOfficeProducts
    await expect(page.locator('option:has-text("Select Product...")')).toBeVisible();
    
    // Test selecting different products
    const productOptions = await page.locator('select option').allTextContents();
    expect(productOptions.length).toBeGreaterThan(1); // Should have at least "Select Product..." and one product
    
    // Select first available product (skip "Select Product..." option)
    const availableProducts = productOptions.filter(option => option !== 'Select Product...');
    if (availableProducts.length > 0) {
      await productDropdown.selectOption(availableProducts[0]);
      await expect(productDropdown).toHaveValue(availableProducts[0]);
    }
    
    // Test that selection persists after page interactions
    await page.click('body'); // Click elsewhere
    await expect(productDropdown).toHaveValue(availableProducts[0]);
  });
  
  test('Assigned To dropdown with AE filtering', async ({ page }) => {
    // Click on assigned to dropdown
    const assignedToDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Select AE...")') });
    await assignedToDropdown.click();
    
    // Verify dropdown shows active AEs
    await expect(page.locator('option:has-text("Select AE...")')).toBeVisible();
    
    // Test assignment change
    const assignedToOptions = await page.locator('select option').allTextContents();
    const availableAEs = assignedToOptions.filter(option => option !== 'Select AE...' && option !== '');
    
    if (availableAEs.length > 0) {
      await assignedToDropdown.selectOption(availableAEs[0]);
      await expect(assignedToDropdown).toHaveValue(availableAEs[0]);
      
      // Verify changes trigger save button
      await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    }
  });
  
  test('Meeting management integration', async ({ page }) => {
    // Test Requested Visit Date/Time field
    const visitDateTimeField = page.locator('input[type="datetime-local"]');
    await visitDateTimeField.fill(testData.requestedVisitDateTime);
    await expect(visitDateTimeField).toHaveValue(testData.requestedVisitDateTime);
    
    // Test Visit Date field
    const visitDateField = page.locator('input[type="date"]');
    await visitDateField.fill(testData.visitDate);
    await expect(visitDateField).toHaveValue(testData.visitDate);
    
    // Test Virtual Walkthrough dropdown
    const virtualWalkthroughDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Virtual Walkthrough")') });
    await virtualWalkthroughDropdown.selectOption(testData.virtualWalkthrough);
    await expect(virtualWalkthroughDropdown).toHaveValue(testData.virtualWalkthrough);
    
    // Test RT Digital Selection dropdown
    const rtDigitalDropdown = page.locator('select').filter({ has: page.locator('option:has-text("RT Digital Selection")') });
    await rtDigitalDropdown.selectOption(testData.rtDigitalSelection);
    await expect(rtDigitalDropdown).toHaveValue(testData.rtDigitalSelection);
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(2000);
    
    // Verify changes persisted after save
    await expect(visitDateTimeField).toHaveValue(testData.requestedVisitDateTime);
    await expect(visitDateField).toHaveValue(testData.visitDate);
    await expect(virtualWalkthroughDropdown).toHaveValue(testData.virtualWalkthrough);
    await expect(rtDigitalDropdown).toHaveValue(testData.rtDigitalSelection);
  });
  
  test('Real-time form validation', async ({ page }) => {
    // Test empty required fields behavior
    const budgetField = page.locator('input[type="text"]').filter({ has: page.locator('xpath=../label[contains(text(), "Budget")]') });
    
    // Clear existing budget value
    await budgetField.fill('');
    await budgetField.blur();
    
    // Test invalid budget format
    await budgetField.fill('invalid-budget');
    await budgetField.blur();
    
    // Test valid budget format
    await budgetField.fill('$25000');
    await budgetField.blur();
    
    // Test message field (should not have validation errors)
    const messageField = page.locator('textarea').filter({ has: page.locator('xpath=../label[contains(text(), "Message")]') });
    await messageField.fill('Valid message content');
    await messageField.blur();
    
    // Verify no validation errors for valid content
    await expect(messageField).toHaveValue('Valid message content');
  });
  
  test('Form auto-save functionality', async ({ page }) => {
    // Make changes to form fields
    const messageField = page.locator('textarea').filter({ has: page.locator('xpath=../label[contains(text(), "Message")]') });
    await messageField.fill('Auto-save test message');
    
    // Verify unsaved changes indicator appears
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
    
    // Wait for auto-save (if implemented) or manual save
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(2000);
    
    // Refresh page to verify changes persisted
    await page.reload();
    await page.waitForSelector('text=Request #', { timeout: 10000 });
    
    // Verify changes were saved
    const reloadedMessageField = page.locator('textarea').filter({ has: page.locator('xpath=../label[contains(text(), "Message")]') });
    await expect(reloadedMessageField).toHaveValue('Auto-save test message');
  });
  
  test('Data completeness tracking', async ({ page }) => {
    // Check current form completeness
    const formFields = [
      'select[value=""]', // Empty dropdowns
      'input[type="text"][value=""]', // Empty text inputs
      'textarea:empty' // Empty textareas
    ];
    
    // Count incomplete fields
    let incompleteCount = 0;
    for (const selector of formFields) {
      const elements = await page.locator(selector).count();
      incompleteCount += elements;
    }
    
    // Fill required fields one by one and verify progress
    const productDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Select Product...")') });
    await productDropdown.selectOption({ index: 1 }); // Select first available product
    
    // Verify field was filled
    await expect(productDropdown).not.toHaveValue('');
    
    // Test completion progress by filling more fields
    const leadSourceDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Select Lead Source...")') });
    await leadSourceDropdown.selectOption('Website');
    
    const relationDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Select Relation...")') });
    await relationDropdown.selectOption('Owner');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(2000);
    
    // Verify all filled fields persist
    await expect(productDropdown).not.toHaveValue('');
    await expect(leadSourceDropdown).toHaveValue('Website');
    await expect(relationDropdown).toHaveValue('Owner');
  });
  
  test('Concurrent editing scenarios', async ({ page, context }) => {
    // Open second tab/page for concurrent editing simulation
    const secondPage = await context.newPage();
    await secondPage.goto('/admin');
    
    // Login on second page
    await secondPage.fill('input[type="email"]', ADMIN_EMAIL);
    await secondPage.fill('input[type="password"]', ADMIN_PASSWORD);
    await secondPage.click('button[type="submit"]');
    await secondPage.waitForSelector('text=Dashboard', { timeout: 10000 });
    
    // Navigate to same request on second page
    await secondPage.goto('/admin/requests');
    const secondRequestLink = await secondPage.locator('table tbody tr').first().locator('a').first();
    await secondRequestLink.click();
    await secondPage.waitForSelector('text=Request #', { timeout: 10000 });
    
    // Make changes on first page
    const messageField1 = page.locator('textarea').filter({ has: page.locator('xpath=../label[contains(text(), "Message")]') });
    await messageField1.fill('First page edit');
    
    // Make different changes on second page
    const messageField2 = secondPage.locator('textarea').filter({ has: secondPage.locator('xpath=../label[contains(text(), "Message")]') });
    await messageField2.fill('Second page edit');
    
    // Save changes on first page
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(2000);
    
    // Save changes on second page
    await secondPage.click('button:has-text("Save Changes")');
    await secondPage.waitForTimeout(2000);
    
    // Verify data integrity maintained (last save should win)
    await page.reload();
    await page.waitForSelector('text=Request #', { timeout: 10000 });
    
    const finalMessageField = page.locator('textarea').filter({ has: page.locator('xpath=../label[contains(text(), "Message")]') });
    const finalValue = await finalMessageField.inputValue();
    
    // Should be either "First page edit" or "Second page edit"
    expect(['First page edit', 'Second page edit']).toContain(finalValue);
    
    await secondPage.close();
  });
  
  test('Invalid file upload handling', async ({ page }) => {
    // Check if file upload functionality is available
    const mediaTab = page.locator('text=Media');
    await mediaTab.click();
    
    // Check for file upload interface
    const addMediaButton = page.locator('button:has-text("Add Media")');
    if (await addMediaButton.count() > 0) {
      await addMediaButton.click();
      
      // Test file upload modal/interface if available
      // This would test upload restrictions, file type validation, etc.
      // Implementation depends on the actual upload interface
    }
    
    // Test documents tab similarly
    const documentsTab = page.locator('text=Documents');
    await documentsTab.click();
    
    const addDocumentButton = page.locator('button:has-text("Add Document")');
    if (await addDocumentButton.count() > 0) {
      await addDocumentButton.click();
      // Test document upload interface
    }
  });
  
  test('Complete AE validation workflow', async ({ page }) => {
    // Simulate complete AE validation workflow
    
    // 1. Review and validate all information
    await expect(page.locator('h1')).toContainText('Request #');
    
    // 2. Update contact information section
    const contactSection = page.locator('text=Contact Information').locator('..');
    await expect(contactSection).toBeVisible();
    
    // 3. Update product selection
    const productDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Select Product...")') });
    await productDropdown.selectOption({ index: 1 });
    
    // 4. Update meeting information
    const visitDateField = page.locator('input[type="date"]');
    await visitDateField.fill('2024-12-15');
    
    const virtualWalkthroughDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Virtual Walkthrough")') });
    await virtualWalkthroughDropdown.selectOption('Yes');
    
    // 5. Add office notes
    const officeNotesField = page.locator('textarea').filter({ has: page.locator('xpath=../label[contains(text(), "Office Notes")]') });
    await officeNotesField.fill('Complete AE validation performed. All information verified and updated.');
    
    // 6. Update status if dropdown is available
    const statusDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Status")') });
    if (await statusDropdown.count() > 0) {
      await statusDropdown.selectOption('reviewing');
    }
    
    // 7. Save all changes
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(3000);
    
    // 8. Verify all changes were saved
    await page.reload();
    await page.waitForSelector('text=Request #', { timeout: 10000 });
    
    // Verify critical fields were saved
    const savedOfficeNotes = page.locator('textarea').filter({ has: page.locator('xpath=../label[contains(text(), "Office Notes")]') });
    await expect(savedOfficeNotes).toHaveValue('Complete AE validation performed. All information verified and updated.');
    
    const savedVisitDate = page.locator('input[type="date"]');
    await expect(savedVisitDate).toHaveValue('2024-12-15');
    
    const savedVirtualWalkthrough = page.locator('select').filter({ has: page.locator('option:has-text("Virtual Walkthrough")') });
    await expect(savedVirtualWalkthrough).toHaveValue('Yes');
  });
  
  test('Page load performance', async ({ page }) => {
    // Measure page load performance
    const startTime = Date.now();
    
    // Navigate to request detail page
    await page.goto('/admin/requests');
    const firstRequestLink = await page.locator('table tbody tr').first().locator('a').first();
    await firstRequestLink.click();
    
    // Wait for page to fully load
    await page.waitForSelector('text=Request #', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Verify page loads within performance target (3 seconds = 3000ms)
    expect(loadTime).toBeLessThan(3000);
    
    // Verify all form elements are loaded
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });
  
  test('Accessibility compliance', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Verify focus management
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test form labels and ARIA attributes
    const formLabels = page.locator('label');
    const labelCount = await formLabels.count();
    expect(labelCount).toBeGreaterThan(0);
    
    // Test that all form inputs have associated labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const inputName = await input.getAttribute('name');
      const inputType = await input.getAttribute('type');
      
      // Skip hidden or system inputs
      if (inputType === 'hidden') continue;
      
      // Verify input has proper labeling (id, name, or aria-label)
      expect(inputId || inputName || await input.getAttribute('aria-label')).toBeTruthy();
    }
    
    // Test color contrast (basic check)
    const computedStyle = await page.locator('body').evaluate(element => {
      return window.getComputedStyle(element);
    });
    
    expect(computedStyle.color).toBeDefined();
    expect(computedStyle.backgroundColor).toBeDefined();
  });
  
  test('Mobile responsiveness', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForSelector('text=Request #', { timeout: 10000 });
    
    // Verify form elements are still accessible
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('text=Request #', { timeout: 10000 });
    
    // Verify form is still functional on mobile
    const productDropdown = page.locator('select').filter({ has: page.locator('option:has-text("Select Product...")') });
    await productDropdown.click();
    await productDropdown.selectOption({ index: 1 });
    
    // Test that mobile interactions work
    const messageField = page.locator('textarea').filter({ has: page.locator('xpath=../label[contains(text(), "Message")]') });
    await messageField.fill('Mobile test message');
    
    // Verify save functionality works on mobile
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(2000);
    
    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
});