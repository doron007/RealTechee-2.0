/**
 * Get Estimate Form E2E Tests - Golden User Story 01
 * 
 * Comprehensive testing of the complete Get Estimate form submission workflow:
 * - Form validation and user experience
 * - File upload functionality
 * - Meeting scheduling
 * - Success/error handling
 * - Responsive behavior
 * - Accessibility compliance
 * 
 * This is the foundation workflow of the RealTechee platform - must never break!
 */

const { test, expect } = require('@playwright/test');

test.describe('Get Estimate Form - Golden User Story 01', () => {
  
  // Test data sets for different scenarios
  const validTestData = {
    agent: {
      fullName: 'John Doe Test Agent',
      email: 'test.agent@example.com',
      phone: '5551234567',
      brokerage: 'Century 21'
    },
    homeowner: {
      fullName: 'Jane Smith Test Homeowner',
      email: 'test.homeowner@example.com',
      phone: '5557654321'
    },
    property: {
      streetAddress: '123 Test Street',
      city: 'Test City',
      state: 'CA',
      zip: '90210'
    },
    project: {
      relationToProperty: 'Real Estate Agent',
      needFinance: true,
      rtDigitalSelection: 'in-person',
      notes: 'This is a test submission for E2E testing. Please do not process.'
    }
  };

  // Navigation and setup
  test.beforeEach(async ({ page }) => {
    // Add test parameter to URL for test data marking
    await page.goto('/contact/get-estimate?test=true');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Loading and Basic Structure', () => {
    
    test('should load Get Estimate page successfully', async ({ page }) => {
      // Verify page loads and displays main elements
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('form')).toBeVisible();
      
      // Check page title and metadata
      const title = await page.title();
      expect(title).toContain('Get an Estimate');
      
      // Verify essential form sections are present
      await expect(page.locator('text=Property Information')).toBeVisible();
      await expect(page.locator('text=Contact Information')).toBeVisible();
    });

    test('should display form sections and fields correctly', async ({ page }) => {
      // Verify property address section
      await expect(page.locator('input[name*="streetAddress"]')).toBeVisible();
      await expect(page.locator('input[name*="city"]')).toBeVisible();
      await expect(page.locator('input[name*="state"]')).toBeVisible();
      await expect(page.locator('input[name*="zip"]')).toBeVisible();
      
      // Verify relation to property dropdown
      await expect(page.locator('select[name*="relationToProperty"]')).toBeVisible();
      
      // Verify agent information section
      await expect(page.locator('input[name*="agentInfo.fullName"]')).toBeVisible();
      await expect(page.locator('input[name*="agentInfo.email"]')).toBeVisible();
      await expect(page.locator('input[name*="agentInfo.phone"]')).toBeVisible();
      
      // Verify project details section
      await expect(page.locator('input[name*="needFinance"]')).toBeVisible();
      await expect(page.locator('textarea[name*="notes"]')).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    
    test('should validate required fields on submission', async ({ page }) => {
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Should show validation errors without submitting
      await expect(page.locator('.error, [aria-invalid="true"]')).toHaveCount({ min: 1 });
      
      // Should not navigate away or show success message
      const currentUrl = page.url();
      expect(currentUrl).toContain('/contact/get-estimate');
    });

    test('should validate email format', async ({ page }) => {
      // Fill agent email with invalid format
      await page.locator('input[name*="agentInfo.email"]').fill('invalid-email');
      await page.locator('input[name*="agentInfo.email"]').blur();
      
      // Should show email validation error
      await expect(page.locator('text=Invalid email')).toBeVisible({ timeout: 3000 });
    });

    test('should validate phone number format', async ({ page }) => {
      // Fill agent phone with invalid format
      await page.locator('input[name*="agentInfo.phone"]').fill('123');
      await page.locator('input[name*="agentInfo.phone"]').blur();
      
      // Should show phone validation error
      await expect(page.locator('text=Invalid phone')).toBeVisible({ timeout: 3000 });
    });

    test('should validate ZIP code format', async ({ page }) => {
      // Fill ZIP with invalid format
      await page.locator('input[name*="zip"]').fill('invalid');
      await page.locator('input[name*="zip"]').blur();
      
      // Should show ZIP validation error
      await expect(page.locator('text=Invalid ZIP')).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Form Field Interactions', () => {
    
    test('should handle property address input correctly', async ({ page }) => {
      // Fill property address fields
      await page.locator('input[name*="streetAddress"]').fill(validTestData.property.streetAddress);
      await page.locator('input[name*="city"]').fill(validTestData.property.city);
      await page.locator('input[name*="state"]').fill(validTestData.property.state);
      await page.locator('input[name*="zip"]').fill(validTestData.property.zip);
      
      // Verify values are retained
      await expect(page.locator('input[name*="streetAddress"]')).toHaveValue(validTestData.property.streetAddress);
      await expect(page.locator('input[name*="city"]')).toHaveValue(validTestData.property.city);
      await expect(page.locator('input[name*="state"]')).toHaveValue(validTestData.property.state);
      await expect(page.locator('input[name*="zip"]')).toHaveValue(validTestData.property.zip);
    });

    test('should handle relation to property selection', async ({ page }) => {
      // Select relation to property
      await page.locator('select[name*="relationToProperty"]').selectOption(validTestData.project.relationToProperty);
      
      // Verify selection
      await expect(page.locator('select[name*="relationToProperty"]')).toHaveValue(validTestData.project.relationToProperty);
    });

    test('should handle agent information input', async ({ page }) => {
      // Fill agent information
      await page.locator('input[name*="agentInfo.fullName"]').fill(validTestData.agent.fullName);
      await page.locator('input[name*="agentInfo.email"]').fill(validTestData.agent.email);
      await page.locator('input[name*="agentInfo.phone"]').fill(validTestData.agent.phone);
      
      // Select brokerage
      await page.locator('select[name*="agentInfo.brokerage"]').selectOption(validTestData.agent.brokerage);
      
      // Verify all values
      await expect(page.locator('input[name*="agentInfo.fullName"]')).toHaveValue(validTestData.agent.fullName);
      await expect(page.locator('input[name*="agentInfo.email"]')).toHaveValue(validTestData.agent.email);
      await expect(page.locator('input[name*="agentInfo.phone"]')).toHaveValue(validTestData.agent.phone);
      await expect(page.locator('select[name*="agentInfo.brokerage"]')).toHaveValue(validTestData.agent.brokerage);
    });

    test('should handle project details correctly', async ({ page }) => {
      // Handle financing checkbox
      if (validTestData.project.needFinance) {
        await page.locator('input[name*="needFinance"]').check();
        await expect(page.locator('input[name*="needFinance"]')).toBeChecked();
      }
      
      // Fill project notes
      await page.locator('textarea[name*="notes"]').fill(validTestData.project.notes);
      await expect(page.locator('textarea[name*="notes"]')).toHaveValue(validTestData.project.notes);
      
      // Select consultation type
      const consultationRadio = page.locator(`input[name*="rtDigitalSelection"][value="${validTestData.project.rtDigitalSelection}"]`);
      if (await consultationRadio.count() > 0) {
        await consultationRadio.check();
        await expect(consultationRadio).toBeChecked();
      }
    });
  });

  test.describe('File Upload Functionality', () => {
    
    test('should allow file uploads', async ({ page }) => {
      // Look for file upload component
      const fileUpload = page.locator('input[type="file"]');
      
      if (await fileUpload.count() > 0) {
        // Create a simple test file
        const testFile = Buffer.from('Test file content for E2E testing');
        
        // Upload file
        await fileUpload.setInputFiles({
          name: 'test-image.jpg',
          mimeType: 'image/jpeg',
          buffer: testFile
        });
        
        // Verify file upload feedback
        await expect(page.locator('text=test-image.jpg')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should validate file types and sizes', async ({ page }) => {
      const fileUpload = page.locator('input[type="file"]');
      
      if (await fileUpload.count() > 0) {
        // Try to upload an invalid file type
        const invalidFile = Buffer.from('Invalid file content');
        
        await fileUpload.setInputFiles({
          name: 'test-file.exe',
          mimeType: 'application/octet-stream',
          buffer: invalidFile
        });
        
        // Should show error for invalid file type
        await expect(page.locator('text=invalid file type')).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Meeting Scheduling', () => {
    
    test('should show meeting scheduling for in-person consultations', async ({ page }) => {
      // Select in-person consultation
      const inPersonRadio = page.locator('input[name*="rtDigitalSelection"][value="in-person"]');
      if (await inPersonRadio.count() > 0) {
        await inPersonRadio.check();
        
        // Should show date/time selection
        await expect(page.locator('input[type="date"], input[name*="date"]')).toBeVisible({ timeout: 3000 });
      }
    });

    test('should handle date selection', async ({ page }) => {
      // Select in-person consultation first
      const inPersonRadio = page.locator('input[name*="rtDigitalSelection"][value="in-person"]');
      if (await inPersonRadio.count() > 0) {
        await inPersonRadio.check();
        
        // Fill date field
        const dateField = page.locator('input[type="date"], input[name*="date"]').first();
        if (await dateField.count() > 0) {
          await dateField.fill('2025-12-31');
          await expect(dateField).toHaveValue('2025-12-31');
        }
      }
    });
  });

  test.describe('Complete Form Submission Flow', () => {
    
    async function fillCompleteForm(page, includeOptionalFields = true) {
      // Property Information
      await page.locator('input[name*="streetAddress"]').fill(validTestData.property.streetAddress);
      await page.locator('input[name*="city"]').fill(validTestData.property.city);
      await page.locator('input[name*="state"]').fill(validTestData.property.state);
      await page.locator('input[name*="zip"]').fill(validTestData.property.zip);
      
      // Relation to Property
      await page.locator('select[name*="relationToProperty"]').selectOption(validTestData.project.relationToProperty);
      
      // Agent Information (Required)
      await page.locator('input[name*="agentInfo.fullName"]').fill(validTestData.agent.fullName);
      await page.locator('input[name*="agentInfo.email"]').fill(validTestData.agent.email);
      await page.locator('input[name*="agentInfo.phone"]').fill(validTestData.agent.phone);
      await page.locator('select[name*="agentInfo.brokerage"]').selectOption(validTestData.agent.brokerage);
      
      if (includeOptionalFields) {
        // Homeowner Information (Optional)
        await page.locator('input[name*="homeownerInfo.fullName"]').fill(validTestData.homeowner.fullName);
        await page.locator('input[name*="homeownerInfo.email"]').fill(validTestData.homeowner.email);
        await page.locator('input[name*="homeownerInfo.phone"]').fill(validTestData.homeowner.phone);
        
        // Project Details
        if (validTestData.project.needFinance) {
          await page.locator('input[name*="needFinance"]').check();
        }
        
        await page.locator('textarea[name*="notes"]').fill(validTestData.project.notes);
        
        // Consultation Type
        const consultationRadio = page.locator(`input[name*="rtDigitalSelection"][value="${validTestData.project.rtDigitalSelection}"]`);
        if (await consultationRadio.count() > 0) {
          await consultationRadio.check();
          
          // If in-person, add date
          if (validTestData.project.rtDigitalSelection === 'in-person') {
            const dateField = page.locator('input[type="date"], input[name*="date"]').first();
            if (await dateField.count() > 0) {
              await dateField.fill('2025-12-31');
            }
          }
        }
      }
    }

    test('should submit complete form successfully', async ({ page }) => {
      // Fill the complete form
      await fillCompleteForm(page);
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Should show loading state
      await expect(page.locator('text=Submitting')).toBeVisible({ timeout: 3000 });
      
      // Should show success message
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 10000 });
      
      // Should display request ID
      await expect(page.locator('text=Request ID')).toBeVisible();
      
      // Should display response timeframe
      await expect(page.locator('text=Within 24 hours')).toBeVisible();
    });

    test('should handle form submission with minimal required fields', async ({ page }) => {
      // Fill only required fields
      await fillCompleteForm(page, false); // Don't include optional fields
      
      // Submit the form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Should still submit successfully
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 10000 });
    });

    test('should display comprehensive success information', async ({ page }) => {
      // Submit complete form
      await fillCompleteForm(page);
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Wait for success
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 10000 });
      
      // Verify success message components
      await expect(page.locator('text=within 24 hours')).toBeVisible();
      await expect(page.locator('text=What happens next')).toBeVisible();
      await expect(page.locator('text=review your project details')).toBeVisible();
      await expect(page.locator('text=contact you')).toBeVisible();
      await expect(page.locator('text=schedule your consultation')).toBeVisible();
      
      // Verify request details are shown
      await expect(page.locator('text=Request ID')).toBeVisible();
      await expect(page.locator('text=Submitted')).toBeVisible();
      await expect(page.locator('text=Response Time')).toBeVisible();
    });

    test('should provide options after successful submission', async ({ page }) => {
      // Submit form and wait for success
      await fillCompleteForm(page);
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 10000 });
      
      // Should have action buttons
      await expect(page.locator('button:has-text("Submit Another Request")')).toBeVisible();
      await expect(page.locator('button:has-text("Return to Homepage"), a:has-text("Return to Homepage")')).toBeVisible();
      
      // Test "Submit Another Request" functionality
      await page.locator('button:has-text("Submit Another Request")').click();
      
      // Should return to form
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[name*="agentInfo.fullName"]')).toHaveValue(''); // Form should be reset
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle network errors gracefully', async ({ page }) => {
      // Fill form
      await fillCompleteForm(page);
      
      // Simulate network failure
      await page.route('**/graphql', route => {
        route.abort('failed');
      });
      
      // Submit form
      await page.locator('button[type="submit"]').click();
      
      // Should show error message
      await expect(page.locator('text=Submission Failed')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
    });

    test('should handle server errors appropriately', async ({ page }) => {
      // Fill form
      await fillCompleteForm(page);
      
      // Simulate server error
      await page.route('**/graphql', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ errors: [{ message: 'Internal server error' }] })
        });
      });
      
      // Submit form
      await page.locator('button[type="submit"]').click();
      
      // Should show error message
      await expect(page.locator('text=Submission Failed')).toBeVisible({ timeout: 10000 });
    });

    test('should validate form state after error recovery', async ({ page }) => {
      // Fill form
      await fillCompleteForm(page);
      
      // Cause an error, then recover
      await page.route('**/graphql', route => {
        route.abort('failed');
      });
      
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Submission Failed')).toBeVisible({ timeout: 10000 });
      
      // Unblock network
      await page.unroute('**/graphql');
      
      // Try again - form data should be preserved
      await page.locator('button:has-text("Try Again")').click();
      
      // Should submit successfully this time
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Responsive Behavior', () => {
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 1024 }
    ];

    viewports.forEach(({ name, width, height }) => {
      test(`should be functional on ${name} (${width}x${height})`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        
        // Page should load properly
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('form')).toBeVisible();
        
        // Form fields should be accessible
        await expect(page.locator('input[name*="agentInfo.fullName"]')).toBeVisible();
        await expect(page.locator('input[name*="agentInfo.email"]')).toBeVisible();
        
        // Should be able to interact with form
        await page.locator('input[name*="agentInfo.fullName"]').fill('Test Agent');
        await expect(page.locator('input[name*="agentInfo.fullName"]')).toHaveValue('Test Agent');
        
        // Submit button should be accessible
        await expect(page.locator('button[type="submit"]')).toBeVisible();
      });
    });
  });

  test.describe('Accessibility Compliance', () => {
    
    test('should have proper form labels and structure', async ({ page }) => {
      // Check for form labels
      const labels = await page.locator('label').count();
      const inputs = await page.locator('input, textarea, select').count();
      
      // Should have reasonable labeling
      expect(labels).toBeGreaterThan(0);
      
      // Check for aria-labels as backup
      const ariaLabeled = await page.locator('[aria-label], [aria-labelledby]').count();
      const totalLabeled = labels + ariaLabeled;
      
      // At least 50% of form fields should be properly labeled
      expect(totalLabeled / inputs).toBeGreaterThan(0.5);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Should be able to tab through form elements
      let tabbableElements = 0;
      const maxTabs = 20;
      
      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.locator(':focus').count();
        if (focused > 0) {
          tabbableElements++;
        }
      }
      
      // Should have tabbable elements
      expect(tabbableElements).toBeGreaterThan(5);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // Check for heading structure
      const h1Count = await page.locator('h1').count();
      const h2Count = await page.locator('h2').count();
      const h3Count = await page.locator('h3').count();
      
      // Should have proper heading hierarchy
      expect(h1Count).toBeGreaterThanOrEqual(1);
      expect(h1Count).toBeLessThanOrEqual(1); // Only one h1 per page
      
      if (h3Count > 0) {
        expect(h2Count).toBeGreaterThan(0); // H3 shouldn't exist without H2
      }
    });
  });

  test.describe('Performance Validation', () => {
    
    test('should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      
      // Reload page to test fresh load
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load reasonably quickly
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });

    test('should handle form interactions responsively', async ({ page }) => {
      // Test form interaction performance
      const startTime = Date.now();
      
      // Fill multiple fields quickly
      await page.locator('input[name*="agentInfo.fullName"]').fill(validTestData.agent.fullName);
      await page.locator('input[name*="agentInfo.email"]').fill(validTestData.agent.email);
      await page.locator('input[name*="agentInfo.phone"]').fill(validTestData.agent.phone);
      
      const interactionTime = Date.now() - startTime;
      
      // Should respond quickly to user input
      expect(interactionTime).toBeLessThan(3000); // 3 seconds max for multiple inputs
    });
  });
});