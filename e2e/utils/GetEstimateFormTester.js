/**
 * Specialized Form Tester for Get Estimate Form
 * 
 * This extends the RobustFormTester with specific knowledge about
 * the Get Estimate form structure and validation rules.
 */

const { RobustFormTester } = require('./RobustFormTester');

class GetEstimateFormTester extends RobustFormTester {
  constructor(page, options = {}) {
    super(page, {
      timeout: 30000,
      retries: 3,
      debugMode: false,
      ...options
    });
    
    this.formUrl = '/contact/get-estimate';
    this.successIndicators = [
      'Request Submitted Successfully!',
      'Thank you for your estimate request',
      'Thank you for your request',
      'Someone will contact you within 24 hours',
      'will review your submission and connect back with you',
      'Request submitted successfully'
    ];
    this.errorIndicators = [
      'Please fill out all required fields',
      'Invalid email address',
      'Invalid phone number'
    ];
  }

  /**
   * Navigate to form and ensure it's ready
   */
  async navigateToForm() {
    console.log('🚀 Navigating to Get Estimate form...');
    
    await this.page.goto(this.formUrl);
    
    // Wait for form to be ready
    await this.page.waitForSelector('form', { timeout: 15000 });
    
    // Wait for dynamic content to load
    await this.page.waitForTimeout(2000);
    
    console.log('✅ Form loaded successfully');
    return this;
  }

  /**
   * Create comprehensive test data
   */
  static createTestData(overrides = {}) {
    const timestamp = Date.now();
    
    // Generate future date (tomorrow) for meeting date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const meetingDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return {
      relationToProperty: 'Real Estate Agent',
      propertyAddress: {
        streetAddress: `123 Test Street ${timestamp}`,
        city: 'Test City',
        state: 'CA',
        zip: '90210'
      },
      agentInfo: {
        fullName: `Test Agent ${timestamp}`,
        email: `test${timestamp}@example.com`,
        phone: '5551234567',
        brokerage: 'Equity Union'
      },
      homeownerInfo: {
        fullName: `Test Homeowner ${timestamp}`,
        email: `homeowner${timestamp}@example.com`,
        phone: '5559876543'
      },
      rtDigitalSelection: 'in-person',
      needFinance: false,
      requestedVisitDateTime: meetingDate,
      requestedVisitTime: '10:00',
      notes: `Test submission ${timestamp} - automated test`,
      ...overrides
    };
  }

  /**
   * Create test data for upload mode (no date/time required)
   */
  static createUploadTestData(overrides = {}) {
    return this.createTestData({
      rtDigitalSelection: 'upload',
      requestedVisitDateTime: null,
      requestedVisitTime: null,
      ...overrides
    });
  }

  /**
   * Create test data for video call mode
   */
  static createVideoCallTestData(overrides = {}) {
    return this.createTestData({
      rtDigitalSelection: 'video-call',
      ...overrides
    });
  }

  /**
   * Fill form with intelligent field mapping
   */
  async fillGetEstimateForm(testData = null) {
    console.log('📝 Filling Get Estimate form...');
    
    if (!testData) {
      testData = GetEstimateFormTester.createTestData();
    }

    // Custom field mapping for Get Estimate form
    const fieldMappings = {
      'relationToProperty': testData.relationToProperty,
      'propertyAddress.streetAddress': testData.propertyAddress?.streetAddress,
      'propertyAddress.city': testData.propertyAddress?.city,
      'propertyAddress.state': testData.propertyAddress?.state,
      'propertyAddress.zip': testData.propertyAddress?.zip,
      'agentInfo.fullName': testData.agentInfo?.fullName,
      'agentInfo.email': testData.agentInfo?.email,
      'agentInfo.phone': testData.agentInfo?.phone,
      'agentInfo.brokerage': testData.agentInfo?.brokerage,
      'homeownerInfo.fullName': testData.homeownerInfo?.fullName,
      'homeownerInfo.email': testData.homeownerInfo?.email,
      'homeownerInfo.phone': testData.homeownerInfo?.phone,
      'rtDigitalSelection': testData.rtDigitalSelection,
      'requestedVisitDateTime': testData.requestedVisitDateTime,
      'requestedVisitTime': testData.requestedVisitTime,
      'needFinance': testData.needFinance,
      'notes': testData.notes
    };

    // Fill each field with custom logic
    const results = { filled: [], skipped: [], errors: [] };

    try {
      // Relation to Property (required)
      await this.fillRelationToProperty(fieldMappings.relationToProperty, results);
      
      // Property Address (required)
      await this.fillPropertyAddress(testData.propertyAddress, results);
      
      // Agent Info (conditional - required if agent)
      if (fieldMappings.relationToProperty === 'Real Estate Agent') {
        await this.fillAgentInfo(testData.agentInfo, results);
      }
      
      // Homeowner Info (conditional)
      if (testData.homeownerInfo?.fullName) {
        await this.fillHomeownerInfo(testData.homeownerInfo, results);
      }
      
      // Consultation Type (required)
      await this.fillConsultationType(fieldMappings.rtDigitalSelection, results);
      
      // Conditional Date/Time fields - only show when not 'upload'
      if (fieldMappings.rtDigitalSelection !== 'upload') {
        await this.fillMeetingDateTime(testData.requestedVisitDateTime, testData.requestedVisitTime, results);
      }
      
      // Optional fields
      if (fieldMappings.needFinance !== undefined) {
        await this.fillNeedFinance(fieldMappings.needFinance, results);
      }
      
      if (fieldMappings.notes) {
        await this.fillNotes(fieldMappings.notes, results);
      }

      // Wait for form to stabilize
      await this.page.waitForTimeout(1000);
      
      // Final validation
      const validation = await this.validateFormState();
      if (!validation.valid) {
        results.errors.push(...validation.errors);
      }

      console.log(`✅ Form filling completed: ${results.filled.length} filled, ${results.errors.length} errors`);
      
      return results;
    } catch (error) {
      console.error('❌ Form filling failed:', error);
      results.errors.push(error.message);
      return results;
    }
  }

  /**
   * Fill relation to property field
   */
  async fillRelationToProperty(value, results) {
    try {
      await this.page.waitForSelector('select[name="relationToProperty"]', { timeout: 10000 });
      await this.page.selectOption('select[name="relationToProperty"]', value);
      
      // Wait for conditional fields to appear
      await this.page.waitForTimeout(500);
      
      results.filled.push('relationToProperty');
      console.log(`✅ Filled relationToProperty: ${value}`);
    } catch (error) {
      results.errors.push(`Failed to fill relationToProperty: ${error.message}`);
    }
  }

  /**
   * Fill property address fields
   */
  async fillPropertyAddress(addressData, results) {
    const addressFields = [
      { name: 'streetAddress', selector: 'input[name*="propertyAddress.streetAddress"]' },
      { name: 'city', selector: 'input[name*="propertyAddress.city"]' },
      { name: 'state', selector: 'select[name*="propertyAddress.state"]' },
      { name: 'zip', selector: 'input[name*="propertyAddress.zip"]' }
    ];

    for (const field of addressFields) {
      try {
        await this.page.waitForSelector(field.selector, { timeout: 5000 });
        
        if (field.name === 'state') {
          await this.page.selectOption(field.selector, addressData[field.name]);
        } else {
          await this.page.fill(field.selector, addressData[field.name]);
        }
        
        results.filled.push(`propertyAddress.${field.name}`);
        console.log(`✅ Filled propertyAddress.${field.name}: ${addressData[field.name]}`);
      } catch (error) {
        results.errors.push(`Failed to fill propertyAddress.${field.name}: ${error.message}`);
      }
    }
  }

  /**
   * Fill agent info fields
   */
  async fillAgentInfo(agentData, results) {
    const agentFields = [
      { name: 'fullName', selector: 'input[name*="agentInfo.fullName"]' },
      { name: 'email', selector: 'input[name*="agentInfo.email"]' },
      { name: 'phone', selector: 'input[name*="agentInfo.phone"]' },
      { name: 'brokerage', selector: 'select[name*="agentInfo.brokerage"]' }
    ];

    for (const field of agentFields) {
      try {
        await this.page.waitForSelector(field.selector, { timeout: 5000 });
        
        if (field.name === 'brokerage') {
          await this.page.selectOption(field.selector, agentData[field.name]);
        } else {
          await this.page.fill(field.selector, agentData[field.name]);
        }
        
        results.filled.push(`agentInfo.${field.name}`);
        console.log(`✅ Filled agentInfo.${field.name}: ${agentData[field.name]}`);
      } catch (error) {
        results.errors.push(`Failed to fill agentInfo.${field.name}: ${error.message}`);
      }
    }
  }

  /**
   * Fill homeowner info fields
   */
  async fillHomeownerInfo(homeownerData, results) {
    const homeownerFields = [
      { name: 'fullName', selector: 'input[name*="homeownerInfo.fullName"]' },
      { name: 'email', selector: 'input[name*="homeownerInfo.email"]' },
      { name: 'phone', selector: 'input[name*="homeownerInfo.phone"]' }
    ];

    for (const field of homeownerFields) {
      try {
        await this.page.waitForSelector(field.selector, { timeout: 5000 });
        await this.page.fill(field.selector, homeownerData[field.name]);
        
        results.filled.push(`homeownerInfo.${field.name}`);
        console.log(`✅ Filled homeownerInfo.${field.name}: ${homeownerData[field.name]}`);
      } catch (error) {
        results.errors.push(`Failed to fill homeownerInfo.${field.name}: ${error.message}`);
      }
    }
  }

  /**
   * Fill consultation type (radio buttons)
   */
  async fillConsultationType(value, results) {
    try {
      const radioSelector = `label:has(input[name*="rtDigitalSelection"][value="${value}"])`;
      await this.page.waitForSelector(radioSelector, { timeout: 5000 });
      await this.page.click(radioSelector);
      
      // Wait for conditional fields to appear/disappear
      await this.page.waitForTimeout(1000);
      
      results.filled.push('rtDigitalSelection');
      console.log(`✅ Filled rtDigitalSelection: ${value}`);
    } catch (error) {
      results.errors.push(`Failed to fill rtDigitalSelection: ${error.message}`);
    }
  }

  /**
   * Fill meeting date and time fields (conditional)
   */
  async fillMeetingDateTime(dateValue, timeValue, results) {
    try {
      // Fill meeting date
      const dateSelector = 'input[name="requestedVisitDateTime"]';
      await this.page.waitForSelector(dateSelector, { timeout: 5000 });
      await this.page.fill(dateSelector, dateValue);
      
      results.filled.push('requestedVisitDateTime');
      console.log(`✅ Filled requestedVisitDateTime: ${dateValue}`);
      
      // Fill meeting time
      const timeSelector = 'input[name="requestedVisitTime"]';
      await this.page.waitForSelector(timeSelector, { timeout: 5000 });
      await this.page.fill(timeSelector, timeValue);
      
      results.filled.push('requestedVisitTime');
      console.log(`✅ Filled requestedVisitTime: ${timeValue}`);
      
    } catch (error) {
      results.errors.push(`Failed to fill meeting date/time: ${error.message}`);
    }
  }

  /**
   * Fill finance checkbox
   */
  async fillNeedFinance(value, results) {
    try {
      const checkboxSelector = 'input[name*="needFinance"]';
      await this.page.waitForSelector(checkboxSelector, { timeout: 5000 });
      
      if (value) {
        await this.page.check(checkboxSelector);
      } else {
        await this.page.uncheck(checkboxSelector);
      }
      
      results.filled.push('needFinance');
      console.log(`✅ Filled needFinance: ${value}`);
    } catch (error) {
      results.errors.push(`Failed to fill needFinance: ${error.message}`);
    }
  }

  /**
   * Fill notes textarea
   */
  async fillNotes(value, results) {
    try {
      await this.page.waitForSelector('textarea[name="notes"]', { timeout: 5000 });
      await this.page.fill('textarea[name="notes"]', value);
      
      results.filled.push('notes');
      console.log(`✅ Filled notes: ${value.substring(0, 50)}...`);
    } catch (error) {
      results.errors.push(`Failed to fill notes: ${error.message}`);
    }
  }

  /**
   * Submit form with Get Estimate specific validation
   */
  async submitGetEstimateForm() {
    console.log('📤 Submitting Get Estimate form...');
    
    const result = await this.submitForm({
      successIndicators: this.successIndicators,
      errorIndicators: this.errorIndicators,
      waitForNavigation: false, // Form stays on same page
      expectSuccess: true
    });

    // Try to extract request ID
    if (result.success) {
      try {
        const requestId = await this.page.locator('[data-testid="request-id"]').textContent();
        result.requestId = requestId;
        console.log(`✅ Request ID extracted: ${requestId}`);
      } catch (error) {
        console.log('⚠️ Could not extract request ID from UI');
      }
    }

    return result;
  }

  /**
   * Complete test workflow
   */
  async runCompleteTest(testData = null) {
    console.log('🧪 Running complete Get Estimate form test...');
    
    const testResults = {
      navigation: null,
      formFilling: null,
      submission: null,
      validation: null,
      success: false,
      errors: [],
      testData: testData || GetEstimateFormTester.createTestData()
    };

    try {
      // Step 1: Navigate to form
      testResults.navigation = await this.navigateToForm();
      
      // Step 2: Fill form
      testResults.formFilling = await this.fillGetEstimateForm(testResults.testData);
      
      if (testResults.formFilling.errors.length > 0) {
        testResults.errors.push(...testResults.formFilling.errors);
      }
      
      // Step 3: Submit form
      testResults.submission = await this.submitGetEstimateForm();
      
      if (!testResults.submission.success) {
        testResults.errors.push(...testResults.submission.errors);
      }
      
      // Step 4: Final validation (skip if submission was successful)
      if (testResults.submission.success) {
        testResults.validation = { valid: true, errors: [] };
        console.log('✅ Skipping form validation after successful submission');
      } else {
        testResults.validation = await this.validateFormState();
      }
      
      testResults.success = testResults.submission.success && testResults.validation.valid;
      
      console.log(`${testResults.success ? '✅' : '❌'} Complete test ${testResults.success ? 'PASSED' : 'FAILED'}`);
      
      return testResults;
      
    } catch (error) {
      console.error('❌ Complete test failed:', error);
      testResults.errors.push(error.message);
      testResults.success = false;
      
      // Take debug screenshot
      await this.takeDebugScreenshot(`get-estimate-test-failure-${Date.now()}.png`);
      
      return testResults;
    }
  }
}

module.exports = { GetEstimateFormTester };