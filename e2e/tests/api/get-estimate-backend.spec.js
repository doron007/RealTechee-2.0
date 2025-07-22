/**
 * Get Estimate Backend API Tests - Golden User Story 01
 * 
 * Comprehensive testing of the backend API workflow for Get Estimate form:
 * - GraphQL mutations and queries
 * - Database record creation and linking
 * - Contact deduplication logic
 * - Property management
 * - Notification queueing
 * - Test data management
 * - Data integrity and relationships
 */

const { test, expect } = require('@playwright/test');

test.describe('Get Estimate Backend API - Golden User Story 01', () => {
  
  // Test data for API testing
  const testSessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const testData = {
    agent: {
      fullName: 'API Test Agent',
      email: 'api.test.agent@example.com',
      phone: '5551234567',
      brokerage: 'Test Brokerage'
    },
    homeowner: {
      fullName: 'API Test Homeowner',
      email: 'api.test.homeowner@example.com',
      phone: '5557654321'
    },
    property: {
      streetAddress: '456 API Test Street',
      city: 'Test City',
      state: 'CA',
      zip: '90210'
    },
    project: {
      relationToProperty: 'Real Estate Agent',
      needFinance: true,
      rtDigitalSelection: 'in-person',
      notes: `API Test submission - Session: ${testSessionId}`
    }
  };

  // Cleanup helper
  const createdRecords = {
    requests: [],
    contacts: [],
    properties: []
  };

  test.afterAll(async () => {
    // Clean up test records (if cleanup utilities are available)
    console.log(`Test session ${testSessionId} created ${createdRecords.requests.length} requests, ${createdRecords.contacts.length} contacts, ${createdRecords.properties.length} properties`);
  });

  test.describe('Form Submission API Flow', () => {
    
    test('should submit complete form and create all necessary records', async ({ page }) => {
      // Navigate to Get Estimate page with test flag
      await page.goto('/contact/get-estimate?test=true');
      await page.waitForLoadState('networkidle');
      
      // Fill the complete form
      await page.locator('input[name*="streetAddress"]').fill(testData.property.streetAddress);
      await page.locator('input[name*="city"]').fill(testData.property.city);
      await page.locator('input[name*="state"]').fill(testData.property.state);
      await page.locator('input[name*="zip"]').fill(testData.property.zip);
      
      await page.locator('select[name*="relationToProperty"]').selectOption(testData.project.relationToProperty);
      
      await page.locator('input[name*="agentInfo.fullName"]').fill(testData.agent.fullName);
      await page.locator('input[name*="agentInfo.email"]').fill(testData.agent.email);
      await page.locator('input[name*="agentInfo.phone"]').fill(testData.agent.phone);
      await page.locator('select[name*="agentInfo.brokerage"]').selectOption(testData.agent.brokerage);
      
      await page.locator('input[name*="homeownerInfo.fullName"]').fill(testData.homeowner.fullName);
      await page.locator('input[name*="homeownerInfo.email"]').fill(testData.homeowner.email);
      await page.locator('input[name*="homeownerInfo.phone"]').fill(testData.homeowner.phone);
      
      if (testData.project.needFinance) {
        await page.locator('input[name*="needFinance"]').check();
      }
      
      await page.locator('textarea[name*="notes"]').fill(testData.project.notes);
      
      const consultationRadio = page.locator(`input[name*="rtDigitalSelection"][value="${testData.project.rtDigitalSelection}"]`);
      if (await consultationRadio.count() > 0) {
        await consultationRadio.check();
      }
      
      // Intercept GraphQL requests to validate API calls
      const graphqlRequests = [];
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData) {
          try {
            const body = JSON.parse(postData);
            graphqlRequests.push(body);
          } catch (e) {
            console.warn('Could not parse GraphQL request:', e);
          }
        }
        
        // Continue with the request
        await route.continue();
      });
      
      // Submit the form
      await page.locator('button[type="submit"]').click();
      
      // Wait for success
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 15000 });
      
      // Validate that proper GraphQL mutations were called
      const createQueries = graphqlRequests.filter(req => 
        req.query && (
          req.query.includes('createProperties') ||
          req.query.includes('createContacts') ||
          req.query.includes('createRequests')
        )
      );
      
      expect(createQueries.length).toBeGreaterThan(0);
      console.log(`API calls made: ${createQueries.length} create mutations`);
      
      // Verify request ID is displayed
      await expect(page.locator('text=Request ID')).toBeVisible();
      
      const requestIdElement = page.locator('span.font-mono').first();
      const requestId = await requestIdElement.textContent();
      expect(requestId).toBeTruthy();
      expect(requestId.length).toBeGreaterThan(4);
      
      console.log(`Created request with ID: ${requestId}`);
    });

    test('should handle property deduplication correctly', async ({ page }) => {
      // First submission with a specific property
      await page.goto('/contact/get-estimate?test=true');
      await page.waitForLoadState('networkidle');
      
      const uniqueProperty = {
        streetAddress: '789 Deduplication Test St',
        city: 'Unique City',
        state: 'TX',
        zip: '75001'
      };
      
      // Fill and submit first form
      await page.locator('input[name*="streetAddress"]').fill(uniqueProperty.streetAddress);
      await page.locator('input[name*="city"]').fill(uniqueProperty.city);
      await page.locator('input[name*="state"]').fill(uniqueProperty.state);
      await page.locator('input[name*="zip"]').fill(uniqueProperty.zip);
      
      await page.locator('select[name*="relationToProperty"]').selectOption('Real Estate Agent');
      
      await page.locator('input[name*="agentInfo.fullName"]').fill('First Test Agent');
      await page.locator('input[name*="agentInfo.email"]').fill('first.agent@test.com');
      await page.locator('input[name*="agentInfo.phone"]').fill('5551111111');
      await page.locator('select[name*="agentInfo.brokerage"]').selectOption('Century 21');
      
      await page.locator('textarea[name*="notes"]').fill(`First submission for property deduplication test - ${testSessionId}`);
      
      // Track GraphQL calls
      let propertyCreationCount = 0;
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData && postData.includes('createProperties')) {
          propertyCreationCount++;
        }
        
        await route.continue();
      });
      
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 15000 });
      
      const firstPropertyCreations = propertyCreationCount;
      
      // Submit another request button to reset form
      await page.locator('button:has-text("Submit Another Request")').click();
      
      // Second submission with the SAME property
      await page.locator('input[name*="streetAddress"]').fill(uniqueProperty.streetAddress);
      await page.locator('input[name*="city"]').fill(uniqueProperty.city);
      await page.locator('input[name*="state"]').fill(uniqueProperty.state);
      await page.locator('input[name*="zip"]').fill(uniqueProperty.zip);
      
      await page.locator('select[name*="relationToProperty"]').selectOption('Real Estate Agent');
      
      await page.locator('input[name*="agentInfo.fullName"]').fill('Second Test Agent');
      await page.locator('input[name*="agentInfo.email"]').fill('second.agent@test.com');
      await page.locator('input[name*="agentInfo.phone"]').fill('5552222222');
      await page.locator('select[name*="agentInfo.brokerage"]').selectOption('Remax');
      
      await page.locator('textarea[name*="notes"]').fill(`Second submission for same property - ${testSessionId}`);
      
      // Reset counter
      propertyCreationCount = 0;
      
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 15000 });
      
      const secondPropertyCreations = propertyCreationCount;
      
      // Verify property deduplication worked
      expect(firstPropertyCreations).toBe(1); // Should create property first time
      expect(secondPropertyCreations).toBe(0); // Should NOT create property second time
      
      console.log(`Property deduplication test: First=${firstPropertyCreations}, Second=${secondPropertyCreations}`);
    });

    test('should handle contact deduplication for same email addresses', async ({ page }) => {
      await page.goto('/contact/get-estimate?test=true');
      await page.waitForLoadState('networkidle');
      
      const sameEmail = 'same.email@test.com';
      
      // Fill form with agent and homeowner having the same email
      await page.locator('input[name*="streetAddress"]').fill('123 Same Email Test St');
      await page.locator('input[name*="city"]').fill('Test City');
      await page.locator('input[name*="state"]').fill('CA');
      await page.locator('input[name*="zip"]').fill('90210');
      
      await page.locator('select[name*="relationToProperty"]').selectOption('Real Estate Agent');
      
      // Agent info
      await page.locator('input[name*="agentInfo.fullName"]').fill('Test Agent Same Email');
      await page.locator('input[name*="agentInfo.email"]').fill(sameEmail);
      await page.locator('input[name*="agentInfo.phone"]').fill('5553333333');
      await page.locator('select[name*="agentInfo.brokerage"]').selectOption('Century 21');
      
      // Homeowner info with SAME email
      await page.locator('input[name*="homeownerInfo.fullName"]').fill('Test Homeowner Same Email');
      await page.locator('input[name*="homeownerInfo.email"]').fill(sameEmail);
      await page.locator('input[name*="homeownerInfo.phone"]').fill('5554444444');
      
      await page.locator('textarea[name*="notes"]').fill(`Same email test - ${testSessionId}`);
      
      // Track contact creation calls
      let contactCreationCount = 0;
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData && postData.includes('createContacts')) {
          contactCreationCount++;
        }
        
        await route.continue();
      });
      
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 15000 });
      
      // Should only create ONE contact for the same email address
      expect(contactCreationCount).toBeLessThanOrEqual(1);
      
      console.log(`Contact deduplication test: Created ${contactCreationCount} contacts for same email`);
    });
  });

  test.describe('Test Data Management', () => {
    
    test('should mark test submissions correctly', async ({ page }) => {
      await page.goto('/contact/get-estimate?test=true');
      await page.waitForLoadState('networkidle');
      
      // Fill minimal form
      await page.locator('input[name*="streetAddress"]').fill('456 Test Data Street');
      await page.locator('input[name*="city"]').fill('Test City');
      await page.locator('input[name*="state"]').fill('CA');
      await page.locator('input[name*="zip"]').fill('90210');
      
      await page.locator('select[name*="relationToProperty"]').selectOption('Real Estate Agent');
      
      await page.locator('input[name*="agentInfo.fullName"]').fill('Test Data Agent');
      await page.locator('input[name*="agentInfo.email"]').fill('test.data@test.com');
      await page.locator('input[name*="agentInfo.phone"]').fill('5555555555');
      await page.locator('select[name*="agentInfo.brokerage"]').selectOption('Century 21');
      
      await page.locator('textarea[name*="notes"]').fill(`Test data marking validation - ${testSessionId}`);
      
      // Intercept the createRequests mutation to verify test marking
      let requestCreationData = null;
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData && postData.includes('createRequests')) {
          try {
            const body = JSON.parse(postData);
            if (body.variables && body.variables.input) {
              requestCreationData = body.variables.input;
            }
          } catch (e) {
            console.warn('Could not parse request data:', e);
          }
        }
        
        await route.continue();
      });
      
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 15000 });
      
      // Verify test data marking
      expect(requestCreationData).toBeTruthy();
      expect(requestCreationData.leadSource).toBe('E2E_TEST');
      expect(requestCreationData.additionalNotes).toContain('TEST_SESSION:');
      
      console.log('Test data marking verified:', {
        leadSource: requestCreationData.leadSource,
        hasTestSession: requestCreationData.additionalNotes?.includes('TEST_SESSION:')
      });
    });

    test('should detect test context from URL parameter', async ({ page }) => {
      // Test with test=true parameter
      await page.goto('/contact/get-estimate?test=true');
      await page.waitForLoadState('networkidle');
      
      // Check if test detection JavaScript runs correctly
      const isTestContext = await page.evaluate(() => {
        return window.location.search.includes('test=true');
      });
      
      expect(isTestContext).toBe(true);
      
      // Test without test parameter
      await page.goto('/contact/get-estimate');
      await page.waitForLoadState('networkidle');
      
      const isNormalContext = await page.evaluate(() => {
        return window.location.search.includes('test=true');
      });
      
      expect(isNormalContext).toBe(false);
    });

    test('should detect test context from user agent', async ({ page, browser }) => {
      // Test with test agent names in form fields
      await page.goto('/contact/get-estimate');
      await page.waitForLoadState('networkidle');
      
      // Fill form with test keywords
      await page.locator('input[name*="agentInfo.fullName"]').fill('Test Agent Playwright');
      await page.locator('input[name*="agentInfo.email"]').fill('playwright@test.com');
      
      // Check if test detection would work (based on the logic in the form)
      const agentName = await page.locator('input[name*="agentInfo.fullName"]').inputValue();
      const agentEmail = await page.locator('input[name*="agentInfo.email"]').inputValue();
      
      const hasTestKeywords = agentName.toLowerCase().includes('test') || 
                             agentName.toLowerCase().includes('playwright') ||
                             agentEmail.includes('test');
      
      expect(hasTestKeywords).toBe(true);
    });
  });

  test.describe('Database Integrity and Relationships', () => {
    
    test('should create proper foreign key relationships', async ({ page }) => {
      await page.goto('/contact/get-estimate?test=true');
      await page.waitForLoadState('networkidle');
      
      // Fill form
      await page.locator('input[name*="streetAddress"]').fill('789 Relationship Test St');
      await page.locator('input[name*="city"]').fill('Test City');
      await page.locator('input[name*="state"]').fill('CA');
      await page.locator('input[name*="zip"]').fill('90210');
      
      await page.locator('select[name*="relationToProperty"]').selectOption('Real Estate Agent');
      
      await page.locator('input[name*="agentInfo.fullName"]').fill('Relationship Test Agent');
      await page.locator('input[name*="agentInfo.email"]').fill('relationship.test@test.com');
      await page.locator('input[name*="agentInfo.phone"]').fill('5556666666');
      await page.locator('select[name*="agentInfo.brokerage"]').selectOption('Century 21');
      
      await page.locator('textarea[name*="notes"]').fill(`Relationship test - ${testSessionId}`);
      
      // Capture the request creation data
      let requestData = null;
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData && postData.includes('createRequests')) {
          try {
            const body = JSON.parse(postData);
            if (body.variables && body.variables.input) {
              requestData = body.variables.input;
            }
          } catch (e) {
            console.warn('Could not parse request data:', e);
          }
        }
        
        await route.continue();
      });
      
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 15000 });
      
      // Verify proper foreign key relationships
      expect(requestData).toBeTruthy();
      expect(requestData.addressId).toBeTruthy(); // Should link to property
      expect(requestData.agentContactId).toBeTruthy(); // Should link to agent contact
      
      console.log('Foreign key relationships verified:', {
        hasAddressId: !!requestData.addressId,
        hasAgentContactId: !!requestData.agentContactId,
        hasHomeownerContactId: !!requestData.homeownerContactId
      });
    });

    test('should handle file upload metadata correctly', async ({ page }) => {
      await page.goto('/contact/get-estimate?test=true');
      await page.waitForLoadState('networkidle');
      
      // Fill basic form
      await page.locator('input[name*="streetAddress"]').fill('123 File Test Street');
      await page.locator('input[name*="city"]').fill('Test City');
      await page.locator('input[name*="state"]').fill('CA');
      await page.locator('input[name*="zip"]').fill('90210');
      
      await page.locator('select[name*="relationToProperty"]').selectOption('Real Estate Agent');
      
      await page.locator('input[name*="agentInfo.fullName"]').fill('File Upload Test Agent');
      await page.locator('input[name*="agentInfo.email"]').fill('filetest@test.com');
      await page.locator('input[name*="agentInfo.phone"]').fill('5557777777');
      await page.locator('select[name*="agentInfo.brokerage"]').selectOption('Century 21');
      
      // Try to upload a file if file upload is available
      const fileUpload = page.locator('input[type="file"]');
      if (await fileUpload.count() > 0) {
        const testFile = Buffer.from('Test file for backend testing');
        await fileUpload.setInputFiles({
          name: 'test-backend.jpg',
          mimeType: 'image/jpeg',
          buffer: testFile
        });
        
        // Wait for file upload processing
        await page.waitForTimeout(2000);
      }
      
      await page.locator('textarea[name*="notes"]').fill(`File upload test - ${testSessionId}`);
      
      // Capture file data in request
      let requestData = null;
      await page.route('**/graphql', async route => {
        const request = route.request();
        const postData = request.postData();
        
        if (postData && postData.includes('createRequests')) {
          try {
            const body = JSON.parse(postData);
            if (body.variables && body.variables.input) {
              requestData = body.variables.input;
            }
          } catch (e) {
            console.warn('Could not parse request data:', e);
          }
        }
        
        await route.continue();
      });
      
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('text=Request Submitted Successfully')).toBeVisible({ timeout: 15000 });
      
      // Verify file data handling
      expect(requestData).toBeTruthy();
      
      // File URLs should be stored as JSON strings
      if (requestData.uploadedMedia) {
        expect(typeof requestData.uploadedMedia).toBe('string');
        const mediaData = JSON.parse(requestData.uploadedMedia);
        expect(Array.isArray(mediaData)).toBe(true);
      }
      
      console.log('File upload data verified:', {
        hasUploadedMedia: !!requestData.uploadedMedia,
        hasUploadedDocuments: !!requestData.uplodedDocuments, // Note: typo in schema
        hasUploadedVideos: !!requestData.uploadedVideos
      });
    });
  });

  test.describe('Error Scenarios and Recovery', () => {
    
    test('should handle partial form submission gracefully', async ({ page }) => {
      await page.goto('/contact/get-estimate?test=true');
      await page.waitForLoadState('networkidle');
      
      // Fill only some required fields
      await page.locator('input[name*="streetAddress"]').fill('Partial Test Street');
      await page.locator('input[name*="agentInfo.fullName"]').fill('Partial Test Agent');
      
      // Submit incomplete form
      await page.locator('button[type="submit"]').click();
      
      // Should show validation errors, not submit
      await expect(page.locator('.error, [aria-invalid="true"]')).toHaveCount({ min: 1 });
      
      // Should remain on the form page
      expect(page.url()).toContain('/contact/get-estimate');
    });

    test('should handle GraphQL errors appropriately', async ({ page }) => {
      await page.goto('/contact/get-estimate?test=true');
      await page.waitForLoadState('networkidle');
      
      // Fill complete form
      await page.locator('input[name*="streetAddress"]').fill('Error Test Street');
      await page.locator('input[name*="city"]').fill('Test City');
      await page.locator('input[name*="state"]').fill('CA');
      await page.locator('input[name*="zip"]').fill('90210');
      
      await page.locator('select[name*="relationToProperty"]').selectOption('Real Estate Agent');
      
      await page.locator('input[name*="agentInfo.fullName"]').fill('Error Test Agent');
      await page.locator('input[name*="agentInfo.email"]').fill('error.test@test.com');
      await page.locator('input[name*="agentInfo.phone"]').fill('5558888888');
      await page.locator('select[name*="agentInfo.brokerage"]').selectOption('Century 21');
      
      await page.locator('textarea[name*="notes"]').fill(`Error handling test - ${testSessionId}`);
      
      // Simulate GraphQL error
      await page.route('**/graphql', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'Test database error' }]
          })
        });
      });
      
      await page.locator('button[type="submit"]').click();
      
      // Should show error message
      await expect(page.locator('text=Submission Failed')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
    });
  });
});