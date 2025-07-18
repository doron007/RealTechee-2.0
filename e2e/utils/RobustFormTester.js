/**
 * Robust Form Testing Framework for Playwright
 * 
 * This framework provides intelligent form field detection, validation,
 * and testing capabilities that can handle various form types and validation rules.
 */

class RobustFormTester {
  constructor(page, options = {}) {
    this.page = page;
    this.options = {
      timeout: 30000,
      retries: 3,
      waitBetweenActions: 100,
      debugMode: false,
      ...options
    };
    this.formSchema = null;
    this.fieldStates = new Map();
  }

  /**
   * Analyze form structure and create a schema
   */
  async analyzeForm(formSelector = 'form') {
    console.log('🔍 Analyzing form structure...');
    
    const formAnalysis = await this.page.evaluate((selector) => {
      const form = document.querySelector(selector);
      if (!form) return null;

      const fields = [];
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        const fieldInfo = {
          type: input.type || input.tagName.toLowerCase(),
          name: input.name || input.id,
          selector: this.getUniqueSelector(input),
          required: input.required || input.hasAttribute('required'),
          options: [],
          validation: {
            pattern: input.pattern,
            min: input.min,
            max: input.max,
            minLength: input.minLength,
            maxLength: input.maxLength
          }
        };

        // Get options for select/radio fields
        if (input.tagName === 'SELECT') {
          fieldInfo.options = Array.from(input.options)
            .map(opt => ({ value: opt.value, text: opt.text }))
            .filter(opt => opt.value !== '');
        } else if (input.type === 'radio') {
          const radioGroup = form.querySelectorAll(`input[name="${input.name}"]`);
          fieldInfo.options = Array.from(radioGroup).map(radio => ({
            value: radio.value,
            text: radio.nextElementSibling?.textContent || radio.value
          }));
        }

        fields.push(fieldInfo);
      });

      return { fields, action: form.action, method: form.method };
    }, formSelector);

    this.formSchema = formAnalysis;
    console.log(`✅ Form analyzed: ${formAnalysis?.fields?.length || 0} fields found`);
    
    if (this.options.debugMode) {
      console.log('📋 Form schema:', JSON.stringify(formAnalysis, null, 2));
    }

    return formAnalysis;
  }

  /**
   * Get unique selector for an element
   */
  getUniqueSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.name) return `[name="${element.name}"]`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  /**
   * Fill form intelligently based on field types
   */
  async fillForm(testData, options = {}) {
    console.log('📝 Filling form with intelligent field detection...');
    
    if (!this.formSchema) {
      await this.analyzeForm();
    }

    const fillOptions = {
      validateAfterFill: true,
      skipOptionalFields: false,
      ...options
    };

    const results = {
      filled: [],
      skipped: [],
      errors: []
    };

    for (const field of this.formSchema.fields) {
      try {
        const fieldData = this.getFieldData(field, testData);
        
        if (!fieldData && field.required) {
          results.errors.push(`Required field missing data: ${field.name}`);
          continue;
        }

        if (!fieldData && fillOptions.skipOptionalFields) {
          results.skipped.push(field.name);
          continue;
        }

        const success = await this.fillField(field, fieldData);
        if (success) {
          results.filled.push(field.name);
        } else {
          results.errors.push(`Failed to fill field: ${field.name}`);
        }

      } catch (error) {
        results.errors.push(`Error filling ${field.name}: ${error.message}`);
      }
    }

    if (fillOptions.validateAfterFill) {
      await this.validateFormState();
    }

    console.log(`✅ Form filling completed: ${results.filled.length} filled, ${results.skipped.length} skipped, ${results.errors.length} errors`);
    
    if (results.errors.length > 0) {
      console.log('❌ Form filling errors:', results.errors);
    }

    return results;
  }

  /**
   * Get field data from test data object
   */
  getFieldData(field, testData) {
    // Try different naming conventions
    const possibleKeys = [
      field.name,
      field.name?.replace(/\./g, '_'),
      field.name?.split('.').pop(),
      field.name?.toLowerCase(),
      field.name?.replace(/([A-Z])/g, '_$1').toLowerCase()
    ].filter(Boolean);

    for (const key of possibleKeys) {
      if (this.getNestedValue(testData, key) !== undefined) {
        return this.getNestedValue(testData, key);
      }
    }

    return null;
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Fill individual field based on type
   */
  async fillField(field, value) {
    if (!value) return false;

    try {
      await this.waitForField(field.selector);

      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'password':
        case 'textarea':
          await this.page.fill(field.selector, value.toString());
          break;

        case 'select':
        case 'select-one':
          await this.page.selectOption(field.selector, value.toString());
          break;

        case 'radio':
          await this.page.check(`input[name="${field.name}"][value="${value}"]`);
          break;

        case 'checkbox':
          if (value) {
            await this.page.check(field.selector);
          } else {
            await this.page.uncheck(field.selector);
          }
          break;

        default:
          console.log(`⚠️ Unknown field type: ${field.type}`);
          return false;
      }

      // Wait for field to be filled
      await this.page.waitForTimeout(this.options.waitBetweenActions);
      
      // Validate field was filled correctly
      const isValid = await this.validateField(field, value);
      if (!isValid) {
        console.log(`❌ Field validation failed: ${field.name}`);
        return false;
      }

      return true;
    } catch (error) {
      console.log(`❌ Error filling field ${field.name}:`, error.message);
      return false;
    }
  }

  /**
   * Wait for field to be available
   */
  async waitForField(selector, timeout = this.options.timeout) {
    await this.page.waitForSelector(selector, { 
      timeout, 
      state: 'visible' 
    });
  }

  /**
   * Validate individual field
   */
  async validateField(field, expectedValue) {
    try {
      switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'password':
        case 'textarea':
          const inputValue = await this.page.inputValue(field.selector);
          return inputValue === expectedValue.toString();

        case 'select':
        case 'select-one':
          const selectValue = await this.page.inputValue(field.selector);
          return selectValue === expectedValue.toString();

        case 'radio':
          const radioChecked = await this.page.isChecked(`input[name="${field.name}"][value="${expectedValue}"]`);
          return radioChecked;

        case 'checkbox':
          const checkboxChecked = await this.page.isChecked(field.selector);
          return checkboxChecked === Boolean(expectedValue);

        default:
          return true; // Unknown types pass validation
      }
    } catch (error) {
      console.log(`❌ Validation error for ${field.name}:`, error.message);
      return false;
    }
  }

  /**
   * Validate entire form state
   */
  async validateFormState() {
    console.log('🔍 Validating form state...');
    
    const validation = await this.page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return { valid: false, errors: ['Form not found'] };

      const errors = [];
      const requiredFields = form.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!field.value || field.value.trim() === '') {
          errors.push(`Required field empty: ${field.name || field.id}`);
        }
      });

      // Check for validation errors displayed on page
      const errorElements = form.querySelectorAll('.error, .alert-error, [role="alert"], .text-red-500, .invalid-feedback');
      errorElements.forEach(el => {
        if (el.textContent.trim()) {
          errors.push(`Validation error: ${el.textContent.trim()}`);
        }
      });

      return {
        valid: errors.length === 0,
        errors,
        formValid: form.checkValidity ? form.checkValidity() : true
      };
    });

    if (!validation.valid) {
      console.log('❌ Form validation failed:', validation.errors);
    } else {
      console.log('✅ Form validation passed');
    }

    return validation;
  }

  /**
   * Submit form with comprehensive validation
   */
  async submitForm(options = {}) {
    console.log('📤 Submitting form with validation...');
    
    const submitOptions = {
      waitForNavigation: true,
      expectSuccess: true,
      successIndicators: ['Thank you', 'Success', 'submitted'],
      errorIndicators: ['Error', 'Failed', 'Invalid'],
      timeout: this.options.timeout,
      ...options
    };

    // Pre-submission validation
    const preValidation = await this.validateFormState();
    if (!preValidation.valid) {
      throw new Error(`Form validation failed before submission: ${preValidation.errors.join(', ')}`);
    }

    // Find and validate submit button
    const submitButton = await this.page.locator('button[type="submit"], input[type="submit"]').first();
    
    if (!(await submitButton.isVisible())) {
      throw new Error('Submit button not found or not visible');
    }

    if (!(await submitButton.isEnabled())) {
      throw new Error('Submit button is disabled');
    }

    // Get current URL for comparison
    const beforeUrl = this.page.url();
    
    // Submit form
    await submitButton.click();
    
    // Wait for submission to complete
    if (submitOptions.waitForNavigation) {
      try {
        await this.page.waitForURL(url => url !== beforeUrl, { 
          timeout: submitOptions.timeout 
        });
      } catch (error) {
        console.log('⚠️ URL did not change after submission');
      }
    }

    // Wait for processing (longer for complex forms)
    await this.page.waitForTimeout(10000);

    // Validate submission result
    const result = await this.validateSubmissionResult(submitOptions);
    
    if (result.success) {
      console.log('✅ Form submitted successfully');
    } else {
      console.log('❌ Form submission failed:', result.errors);
    }

    return result;
  }

  /**
   * Validate submission result
   */
  async validateSubmissionResult(options) {
    const pageContent = await this.page.textContent('body');
    const currentUrl = this.page.url();
    
    const hasSuccessIndicator = options.successIndicators.some(indicator => 
      pageContent.toLowerCase().includes(indicator.toLowerCase())
    );
    
    const hasErrorIndicator = options.errorIndicators.some(indicator => 
      pageContent.toLowerCase().includes(indicator.toLowerCase())
    );

    // Check for validation errors (filter out empty ones)
    const validationErrors = await this.page.locator('.error, .alert-error, [role="alert"], .text-red-500').allTextContents();
    const realValidationErrors = validationErrors.filter(error => error && error.trim().length > 0);
    
    const result = {
      success: hasSuccessIndicator && !hasErrorIndicator && realValidationErrors.length === 0,
      url: currentUrl,
      hasSuccessMessage: hasSuccessIndicator,
      hasErrorMessage: hasErrorIndicator,
      validationErrors: realValidationErrors,
      errors: []
    };

    if (hasErrorIndicator) {
      result.errors.push('Error indicator found on page');
    }

    if (realValidationErrors.length > 0) {
      result.errors.push(`Validation errors: ${realValidationErrors.join(', ')}`);
    }

    if (!hasSuccessIndicator && options.expectSuccess) {
      result.errors.push('Expected success indicator not found');
    }

    return result;
  }

  /**
   * Get form submission data for database validation
   */
  async getSubmissionData() {
    // Try to extract request ID or other identifiers
    const requestId = await this.page.locator('[data-testid="request-id"]').textContent().catch(() => null);
    const timestamp = new Date().toISOString();
    
    return {
      requestId,
      timestamp,
      url: this.page.url(),
      formData: this.fieldStates
    };
  }

  /**
   * Take screenshot for debugging
   */
  async takeDebugScreenshot(filename = `form-debug-${Date.now()}.png`) {
    await this.page.screenshot({ 
      path: filename, 
      fullPage: true 
    });
    console.log(`📸 Debug screenshot saved: ${filename}`);
    return filename;
  }

  /**
   * Generate test report
   */
  generateReport(testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      formSchema: this.formSchema,
      testResults,
      summary: {
        totalFields: this.formSchema?.fields?.length || 0,
        filledFields: testResults.filled?.length || 0,
        skippedFields: testResults.skipped?.length || 0,
        errorCount: testResults.errors?.length || 0,
        successRate: testResults.filled?.length / (this.formSchema?.fields?.length || 1) * 100
      }
    };

    return report;
  }
}

module.exports = { RobustFormTester };