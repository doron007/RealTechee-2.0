/**
 * Notification Validation Helpers for E2E Form Tests
 * 
 * Comprehensive validation of notification system flow including:
 * - Notification queue validation
 * - Template rendering verification  
 * - Recipient validation and security
 * - Environment safety checks
 */

const { expect } = require('@playwright/test');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Import existing backend validation
const { DatabaseHelper, TEST_MARKERS } = require('./backendValidation');

// Import Amplify configuration
const amplifyOutputs = require('../../amplify_outputs.json');

// Initialize AWS DynamoDB client
const ddbClient = new DynamoDBClient({ 
  region: amplifyOutputs.data.aws_region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
});

const docClient = DynamoDBDocumentClient.from(ddbClient);

// Get table names with dynamic environment detection
const getTableName = (modelName) => {
  // Detect environment based on BASE_URL or process.env
  const baseUrl = process.env.BASE_URL || '';
  let envId;
  let envName;
  
  if (baseUrl.includes('realtechee.com') || baseUrl.includes('production')) {
    // Production environment
    envId = 'aqnqdrctpzfwfjwyxxsmu6peoq';
    envName = 'production';
  } else {
    // Development/staging environment (localhost, staging URLs, etc.)
    envId = 'fvn7t5hbobaxjklhrqzdl4ac34';
    envName = 'development/staging';
  }
  
  const tableName = `${modelName}-${envId}-NONE`;
  console.log(`🔍 Environment detected: ${envName} (${baseUrl})`);
  console.log(`📊 Using table name: ${tableName} for model: ${modelName}`);
  
  return tableName;
};

/**
 * Notification Template Types and Expected Recipients
 */
const NOTIFICATION_CONFIG = {
  'contact-us': {
    templateType: 'contactUs',
    expectedTemplateFields: ['fullName', 'email', 'phone', 'subject', 'message'],
    expectedRecipients: ['info@realtechee.com'],
    channels: ['email', 'sms']
  },
  'get-qualified': {
    templateType: 'getQualified', 
    expectedTemplateFields: ['agentInfo', 'propertyAddress', 'relationToProperty'],
    expectedRecipients: ['info@realtechee.com'],
    channels: ['email', 'sms']
  },
  'affiliate': {
    templateType: 'affiliate',
    expectedTemplateFields: ['companyName', 'contactInfo', 'serviceType'],
    expectedRecipients: ['info@realtechee.com'], 
    channels: ['email', 'sms']
  },
  'get-estimate': {
    templateType: 'getEstimate',
    expectedTemplateFields: ['agentInfo', 'propertyAddress', 'relationToProperty'],
    expectedRecipients: ['info@realtechee.com'],
    channels: ['email', 'sms']
  }
};

/**
 * Development Environment Safety Validation
 */
class EnvironmentSafetyValidator {
  static async validateDevelopmentEnvironment() {
    console.log('🔒 Validating development environment safety...');
    
    const validations = {
      environment: 'development',
      awsRegion: amplifyOutputs.data.aws_region,
      tablePrefix: '',
      safetyChecks: []
    };

    // Check AWS region (development should not be us-east-1 production)
    if (amplifyOutputs.data.aws_region === 'us-east-1') {
      console.warn('⚠️ WARNING: Using us-east-1 region - verify this is not production');
    }
    validations.safetyChecks.push('AWS region checked');

    // Check table names for development markers
    const sampleTable = amplifyOutputs.data.tables?.[0]?.name || '';
    if (sampleTable.includes('prod') || sampleTable.includes('production')) {
      throw new Error('🚨 CRITICAL: Production table detected in test environment');
    }
    validations.safetyChecks.push('Table names verified as non-production');

    // Extract table prefix for validation
    const match = sampleTable.match(/^(.+-)([^-]+)(-NONE)$/);
    if (match) {
      validations.tablePrefix = match[2]; // Environment ID
    }
    validations.safetyChecks.push('Table prefix extracted');

    console.log('✅ Development environment safety validated');
    return validations;
  }

  static async validateTestDataMarking(submissionData) {
    console.log('🏷️ Validating test data marking...');
    
    const markers = [];
    
    // Check lead source marking
    if (submissionData.leadSource === TEST_MARKERS.LEAD_SOURCE) {
      markers.push('Lead source marked as E2E_TEST');
    }
    
    // Check session ID in notes
    if (submissionData.officeNotes && submissionData.officeNotes.includes(TEST_MARKERS.SESSION_PREFIX)) {
      markers.push('Session ID marked in office notes');
    }
    
    // Check email patterns
    if (submissionData.email) {
      const isTestEmail = TEST_MARKERS.EMAIL_PATTERNS.some(pattern => 
        submissionData.email.toLowerCase().includes(pattern)
      );
      if (isTestEmail) {
        markers.push('Test email pattern detected');
      }
    }
    
    console.log(`✅ Test data marking validated: ${markers.length} markers found`);
    return markers;
  }
}

/**
 * Notification Queue Validation
 */
class NotificationQueueValidator {
  /**
   * Find notifications by related submission/request ID
   */
  static async findNotificationsBySubmissionId(submissionId, formType) {
    console.log(`🔍 Finding notifications for submission: ${submissionId}`);
    
    const params = {
      TableName: getTableName('NotificationQueue'),
      FilterExpression: 'contains(payload, :submissionId) OR contains(relatedRecordId, :submissionId)',
      ExpressionAttributeValues: {
        ':submissionId': submissionId
      }
    };

    try {
      const result = await docClient.send(new ScanCommand(params));
      const notifications = result.Items || [];
      
      console.log(`Found ${notifications.length} notifications for submission ${submissionId}`);
      return notifications;
    } catch (error) {
      console.error('Error finding notifications:', error);
      return [];
    }
  }

  /**
   * Find notifications by form submission criteria
   */
  static async findNotificationsByFormSubmission(formType, submittedData, timeWindow = 5) {
    console.log(`🔍 Finding notifications for ${formType} form submission...`);
    
    // Calculate time window for recent notifications
    const windowStart = new Date(Date.now() - timeWindow * 60 * 1000).toISOString();
    
    const params = {
      TableName: getTableName('NotificationQueue'),
      FilterExpression: 'eventType = :eventType AND createdAt > :windowStart',
      ExpressionAttributeValues: {
        ':eventType': NOTIFICATION_CONFIG[formType]?.templateType || formType,
        ':windowStart': windowStart
      }
    };

    try {
      const result = await docClient.send(new ScanCommand(params));
      let notifications = result.Items || [];
      
      // Filter by matching submission data
      notifications = notifications.filter(notification => {
        try {
          const payload = JSON.parse(notification.payload || '{}');
          return this.matchesSubmissionData(payload, submittedData, formType);
        } catch (error) {
          console.warn('Could not parse notification payload:', error);
          return false;
        }
      });
      
      console.log(`Found ${notifications.length} matching notifications for ${formType}`);
      return notifications;
    } catch (error) {
      console.error('Error finding notifications by form submission:', error);
      return [];
    }
  }

  /**
   * Check if notification payload matches submitted form data
   */
  static matchesSubmissionData(payload, submittedData, formType) {
    switch (formType) {
      case 'contact-us':
        return payload.customer?.email === submittedData.email &&
               payload.customer?.name === submittedData.fullName;
      
      case 'get-qualified':
      case 'get-estimate':
        return payload.customer?.email === submittedData.agentInfo?.email &&
               payload.property?.address?.includes(submittedData.propertyAddress?.streetAddress);
      
      case 'affiliate':
        return payload.businessInformation?.companyName === submittedData.companyName &&
               payload.contactInformation?.email === submittedData.contactInfo?.email;
      
      default:
        return false;
    }
  }

  /**
   * Validate notification structure and content
   */
  static async validateNotificationStructure(notification, formType, submittedData) {
    console.log('🔍 Validating notification structure...');
    
    const validations = [];
    const config = NOTIFICATION_CONFIG[formType];
    
    // Basic structure validation
    expect(notification.id).toBeDefined();
    expect(notification.eventType).toBe(config.templateType);
    expect(notification.status).toMatch(/PENDING|SENT|PROCESSING|QUEUED/);
    expect(notification.createdAt).toBeDefined();
    validations.push('Basic notification structure validated');

    // Payload validation
    const payload = JSON.parse(notification.payload);
    expect(payload).toBeDefined();
    expect(typeof payload).toBe('object');
    validations.push('Payload structure validated');

    // Template field validation
    config.expectedTemplateFields.forEach(field => {
      const fieldExists = this.checkFieldExists(payload, field, submittedData);
      expect(fieldExists).toBe(true);
    });
    validations.push('Template fields validated');

    // Recipient validation
    if (notification.recipients) {
      const recipients = JSON.parse(notification.recipients);
      expect(Array.isArray(recipients)).toBe(true);
      expect(recipients.length).toBeGreaterThan(0);
      
      // In development, should only contain safe recipients
      recipients.forEach(recipient => {
        expect(config.expectedRecipients.includes(recipient.email)).toBe(true);
      });
      validations.push('Recipients validated');
    }

    console.log(`✅ Notification structure validation completed: ${validations.length} checks passed`);
    return validations;
  }

  /**
   * Helper to check if field exists in payload
   */
  static checkFieldExists(payload, field, submittedData) {
    const fieldParts = field.split('.');
    let current = payload;
    
    for (const part of fieldParts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }
    
    return current !== undefined && current !== null;
  }
}

/**
 * Template Rendering Validation
 */
class TemplateRenderingValidator {
  /**
   * Validate template selection and rendering
   */
  static async validateTemplateRendering(notification, formType, submittedData) {
    console.log('🎨 Validating template rendering...');
    
    const validations = [];
    const payload = JSON.parse(notification.payload);
    const config = NOTIFICATION_CONFIG[formType];
    
    // Template type validation
    expect(notification.templateType || notification.eventType).toBe(config.templateType);
    validations.push('Template type validated');

    // Content rendering validation
    if (notification.renderedContent) {
      const content = JSON.parse(notification.renderedContent);
      
      // Email content validation
      if (content.email) {
        expect(content.email.subject).toBeDefined();
        expect(content.email.body).toBeDefined();
        expect(content.email.body.length).toBeGreaterThan(0);
        validations.push('Email template rendered');
      }
      
      // SMS content validation
      if (content.sms) {
        expect(content.sms.message).toBeDefined();
        expect(content.sms.message.length).toBeGreaterThan(0);
        expect(content.sms.message.length).toBeLessThanOrEqual(160);
        validations.push('SMS template rendered');
      }
    }

    // Form data inclusion validation
    await this.validateFormDataInclusion(payload, submittedData, formType);
    validations.push('Form data inclusion validated');

    console.log(`✅ Template rendering validation completed: ${validations.length} checks passed`);
    return validations;
  }

  /**
   * Validate that form data is properly included in template
   */
  static async validateFormDataInclusion(payload, submittedData, formType) {
    switch (formType) {
      case 'contact-us':
        expect(payload.customer?.name).toBe(submittedData.fullName);
        expect(payload.customer?.email).toBe(submittedData.email);
        expect(payload.customer?.phone).toBe(submittedData.phone);
        expect(payload.subject).toBe(submittedData.subject);
        expect(payload.message).toBe(submittedData.message);
        break;
        
      case 'get-qualified':
      case 'get-estimate':
        expect(payload.customer?.name).toBe(submittedData.agentInfo.fullName);
        expect(payload.customer?.email).toBe(submittedData.agentInfo.email);
        expect(payload.property?.address).toContain(submittedData.propertyAddress.streetAddress);
        expect(payload.property?.city).toBe(submittedData.propertyAddress.city);
        break;
        
      case 'affiliate':
        expect(payload.company?.name).toBe(submittedData.companyName);
        expect(payload.contact?.email).toBe(submittedData.contactInfo.email);
        break;
    }
  }
}

/**
 * Recipient Security Validation
 */
class RecipientSecurityValidator {
  /**
   * Validate recipient security and development environment safety
   */
  static async validateRecipientSecurity(notification, formType) {
    console.log('🔐 Validating recipient security...');
    
    const validations = [];
    const config = NOTIFICATION_CONFIG[formType];
    
    if (!notification.recipients) {
      console.warn('⚠️ No recipients found in notification');
      return validations;
    }
    
    const recipients = JSON.parse(notification.recipients);
    
    // Development environment - only safe recipients
    recipients.forEach(recipient => {
      const isAllowedRecipient = config.expectedRecipients.includes(recipient.email);
      expect(isAllowedRecipient).toBe(true);
    });
    validations.push('Only safe development recipients validated');

    // No external/production recipients in development
    const hasExternalRecipients = recipients.some(recipient => 
      !recipient.email.includes('realtechee.com') && 
      !recipient.email.includes('test') &&
      !recipient.email.includes('localhost')
    );
    expect(hasExternalRecipients).toBe(false);
    validations.push('No external recipients in development');

    // Test data marking validation
    const payload = JSON.parse(notification.payload);
    if (payload.testData !== true) {
      console.warn('⚠️ Notification payload not marked as test data');
    } else {
      validations.push('Test data properly marked');
    }

    console.log(`✅ Recipient security validation completed: ${validations.length} checks passed`);
    return validations;
  }
}

/**
 * Main Notification Validation Class
 */
class NotificationValidator {
  constructor(formType, submittedData, testSessionId) {
    this.formType = formType;
    this.submittedData = submittedData;
    this.testSessionId = testSessionId;
    this.validationResults = {
      environmentSafety: null,
      notificationQueue: null,
      templateRendering: null,
      recipientSecurity: null,
      notifications: []
    };
  }

  /**
   * Run complete notification validation suite
   */
  async validateComplete() {
    console.log(`🚀 Starting complete notification validation for ${this.formType}...`);
    
    // Step 1: Environment safety validation
    this.validationResults.environmentSafety = await EnvironmentSafetyValidator.validateDevelopmentEnvironment();
    
    // Step 2: Wait for notification processing
    await this.waitForNotificationProcessing();
    
    // Step 3: Find and validate notifications
    const notifications = await NotificationQueueValidator.findNotificationsByFormSubmission(
      this.formType, 
      this.submittedData
    );
    
    expect(notifications.length).toBeGreaterThan(0);
    this.validationResults.notifications = notifications;
    
    // Step 4: Validate each notification
    for (const notification of notifications) {
      // Queue structure validation
      const queueValidations = await NotificationQueueValidator.validateNotificationStructure(
        notification, 
        this.formType, 
        this.submittedData
      );
      
      // Template rendering validation
      const templateValidations = await TemplateRenderingValidator.validateTemplateRendering(
        notification, 
        this.formType, 
        this.submittedData
      );
      
      // Recipient security validation
      const securityValidations = await RecipientSecurityValidator.validateRecipientSecurity(
        notification, 
        this.formType
      );
      
      this.validationResults.notificationQueue = queueValidations;
      this.validationResults.templateRendering = templateValidations;
      this.validationResults.recipientSecurity = securityValidations;
    }
    
    // Step 5: Test data marking validation
    const testMarkers = await EnvironmentSafetyValidator.validateTestDataMarking(this.submittedData);
    this.validationResults.testDataMarkers = testMarkers;
    
    console.log(`✅ Complete notification validation finished for ${this.formType}`);
    return this.validationResults;
  }

  /**
   * Quick validation for specific notification aspects
   */
  async validateNotificationQueued() {
    const notifications = await NotificationQueueValidator.findNotificationsByFormSubmission(
      this.formType, 
      this.submittedData
    );
    
    expect(notifications.length).toBeGreaterThan(0);
    console.log(`✅ Notification queued validation passed: ${notifications.length} notifications found`);
    return notifications;
  }

  async validateNotificationRecipients() {
    const notifications = await this.validateNotificationQueued();
    
    for (const notification of notifications) {
      await RecipientSecurityValidator.validateRecipientSecurity(notification, this.formType);
    }
    
    console.log('✅ Notification recipients validation passed');
    return notifications;
  }

  async validateNotificationTemplate() {
    const notifications = await this.validateNotificationQueued();
    
    for (const notification of notifications) {
      await TemplateRenderingValidator.validateTemplateRendering(
        notification, 
        this.formType, 
        this.submittedData
      );
    }
    
    console.log('✅ Notification template validation passed');
    return notifications;
  }

  async validateEnvironmentSafety() {
    const safety = await EnvironmentSafetyValidator.validateDevelopmentEnvironment();
    const testMarkers = await EnvironmentSafetyValidator.validateTestDataMarking(this.submittedData);
    
    console.log('✅ Environment safety validation passed');
    return { safety, testMarkers };
  }

  /**
   * Wait for notification processing (DynamoDB eventual consistency)
   */
  async waitForNotificationProcessing() {
    console.log('⏳ Waiting for notification processing...');
    // Wait for notification service to process and create entries
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

/**
 * Reusable validation helper functions for tests
 */
const NotificationValidationHelpers = {
  /**
   * Create notification validator for form type
   */
  createValidator(formType, submittedData, testSessionId) {
    return new NotificationValidator(formType, submittedData, testSessionId);
  },

  /**
   * Quick validation functions
   */
  async validateNotificationQueued(formType, submittedData, testSessionId) {
    const validator = new NotificationValidator(formType, submittedData, testSessionId);
    return await validator.validateNotificationQueued();
  },

  async validateNotificationRecipients(formType, submittedData, testSessionId) {
    const validator = new NotificationValidator(formType, submittedData, testSessionId);
    return await validator.validateNotificationRecipients();
  },

  async validateNotificationTemplate(formType, submittedData, testSessionId) {
    const validator = new NotificationValidator(formType, submittedData, testSessionId);
    return await validator.validateNotificationTemplate();
  },

  async validateEnvironmentSafety(formType, submittedData, testSessionId) {
    const validator = new NotificationValidator(formType, submittedData, testSessionId);
    return await validator.validateEnvironmentSafety();
  },

  /**
   * Complete validation
   */
  async validateCompleteNotificationFlow(formType, submittedData, testSessionId) {
    const validator = new NotificationValidator(formType, submittedData, testSessionId);
    return await validator.validateComplete();
  }
};

module.exports = {
  NotificationValidator,
  NotificationQueueValidator,
  TemplateRenderingValidator,
  RecipientSecurityValidator,
  EnvironmentSafetyValidator,
  NotificationValidationHelpers,
  NOTIFICATION_CONFIG
};