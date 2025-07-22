# User Story 01: Get Estimate Form Submission

## 📋 Story Overview

**As a** Agent or Homeowner visiting the public site  
**I want to** submit a request for estimate through the get estimate form  
**So that** I can start the home preparation process and receive professional guidance  

---

## 🎯 Acceptance Criteria

### Primary Flow
1. **User visits public site** and navigates to "Get an Estimate" form
2. **User fills required information** in the get estimate form
3. **User submits the form** with all required fields completed
4. **System validates submission** and stores data in DynamoDB
5. **User receives confirmation** with success message and next steps
6. **Request is logged** for admin team follow-up

### Form Requirements
- [ ] All required fields must be completed before submission
- [ ] Form validation prevents submission with missing/invalid data
- [ ] User receives clear error messages for validation failures
- [ ] Form data is sanitized and validated server-side
- [ ] Form submission includes timestamp and unique request ID

### Data Storage Requirements
- [ ] Form submission creates new entry in `Requests` DynamoDB table
- [ ] All form fields are correctly mapped to database columns
- [ ] Request status is set to "New" upon submission
- [ ] Submission timestamp is recorded with proper timezone
- [ ] Request ID is generated and stored for tracking

### User Experience Requirements
- [ ] Form is responsive across all device types (mobile, tablet, desktop)
- [ ] Form submission shows loading state during processing
- [ ] Success confirmation displays immediately after submission
- [ ] Confirmation includes request ID and expected response timeframe
- [ ] User is provided with next steps information

---

## 🧪 Test Suite Requirements

### Test Data Management Strategy (NO SCHEMA CHANGES)
```typescript
// CRITICAL: Use existing fields only - NO SCHEMA CHANGES to avoid data purge
const TEST_DATA_MARKER = {
  source: 'E2E_TEST',                    // Use existing 'source' field
  additionalNotes: `TEST_SESSION:test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // Use existing field
  // NO isTestData field - use source field filtering instead
};

// Test data cleanup utility (manual trigger only)
const cleanupTestData = async (testSession?: string) => {
  // Filter by source='E2E_TEST' and additionalNotes containing 'TEST_SESSION:'
  // Delete test records from all tables using existing schema
  // Never automatic - only on-demand
};
```

### Frontend Validation Tests
```typescript
// Test File: e2e/tests/public/get-estimate-frontend.spec.js
describe('Get Estimate Form - Frontend Validation', () => {
  
  // Positive Tests - Success Flows
  test('Complete form submission with all required fields', async () => {
    // Test successful submission with minimal required data
    // Validate success affirmation message displays
    // Verify confirmation includes request ID and next steps
  });
  
  test('Form submission with file attachments', async () => {
    // Upload image files (JPG, PNG, PDF)
    // Validate file upload progress indicators
    // Confirm files are attached to request
    // Check file size and type validation
  });
  
  test('Form submission with meeting date/time selection', async () => {
    // Select preferred meeting date from calendar
    // Choose available time slot
    // Validate date/time constraints (business hours, future dates)
    // Confirm meeting request is included in submission
  });
  
  test('Form submission with optional fields completed', async () => {
    // Fill all optional fields (project description, additional notes)
    // Test character limits and validation
    // Verify all data is preserved in submission
  });
  
  // Negative Tests - Error Handling
  test('Form validation with missing required fields', async () => {
    // Submit with each required field missing individually
    // Validate specific error messages for each field
    // Ensure form prevents submission
    // Check error message styling and positioning
  });
  
  test('Form validation with invalid email formats', async () => {
    // Test various invalid email formats
    // Validate email format error messages
    // Ensure real-time validation feedback
  });
  
  test('Form validation with invalid phone formats', async () => {
    // Test invalid phone number formats
    // Validate phone format error messages  
    // Test international and domestic formats
  });
  
  test('File upload validation with invalid files', async () => {
    // Upload files that are too large
    // Upload unsupported file types
    // Test virus/malware file simulation
    // Validate appropriate error messages
  });
  
  test('Form submission with server error simulation', async () => {
    // Mock server errors (500, 503, timeout)
    // Validate error handling and user feedback
    // Test retry mechanisms
    // Ensure form data is preserved during errors
  });
  
  test('Form validation with special characters and edge cases', async () => {
    // Test XSS prevention in text fields
    // Test SQL injection prevention
    // Test unicode characters and emojis
    // Validate input sanitization
  });
  
  // Responsive and Accessibility Tests
  test('Form functionality across device types', async () => {
    // Mobile, tablet, desktop form interactions
    // Touch vs mouse input validation
    // Responsive layout verification
  });
  
  test('Form accessibility compliance', async () => {
    // Screen reader compatibility
    // Keyboard navigation testing
    // WCAG 2.1 AA compliance validation
    // High contrast mode testing
  });
})
```

### Backend Validation Tests
```typescript
// Test File: e2e/tests/api/get-estimate-backend.spec.js
describe('Get Estimate Form - Backend Validation', () => {
  
  // Database Integration Tests
  test('Request record creation in Requests table', async () => {
    // Submit form and validate DynamoDB entry
    // Check all form fields are correctly mapped
    // Verify request ID generation and uniqueness
    // Validate timestamps (createdAt, updatedAt)
    // Confirm test data marking (source: 'E2E_TEST')
  });
  
  test('Property information handling', async () => {
    // Test with new property address
    const newAddress = {
      address: '123 Test Street E2E, Test City, TC 12345',
      ...TEST_DATA_MARKER
    };
    // Verify new Property record creation
    // Check address validation and geocoding
    
    // Test with existing property address
    // Verify existing Property record is linked
    // Ensure no duplicate properties created
  });
  
  test('Contact management for homeowners', async () => {
    // Test new homeowner contact creation
    const newHomeowner = {
      email: `test_homeowner_${Date.now()}@e2etest.com`,
      ...TEST_DATA_MARKER
    };
    // Verify Contact record creation
    // Check contact type assignment (homeowner)
    // Validate contact-to-request linking
    
    // Test existing homeowner contact linking
    // Ensure no duplicate contacts created
    // Verify contact information updates
  });
  
  test('Contact management for agents', async () => {
    // Test agent contact creation and linking
    const agentContact = {
      email: `test_agent_${Date.now()}@e2etest.com`,
      type: 'agent',
      ...TEST_DATA_MARKER
    };
    // Verify agent Contact record
    // Check agent-specific fields
    // Validate agent-to-request relationship
  });
  
  test('Notification system validation', async () => {
    // Submit form and track notification pipeline
    // Verify notification queue entry creation
    // Check email notification generation
    // Validate SMS notification (if phone provided)
    // Confirm notification template usage
    // Test notification delivery status tracking
    
    // All notifications should be marked as test data
    const testNotification = {
      recipient: 'test@e2etest.com',
      ...TEST_DATA_MARKER
    };
  });
  
  test('File attachment backend processing', async () => {
    // Upload files and verify S3 storage
    // Check file metadata in database
    // Validate file security scanning
    // Verify file-to-request linking
    // Test file access permissions
    
    // Files should be stored in test bucket/folder
    const testFileMetadata = {
      bucket: 'test-uploads',
      ...TEST_DATA_MARKER
    };
  });
  
  test('Meeting scheduling backend logic', async () => {
    // Submit with meeting request
    // Verify calendar integration
    // Check availability validation
    // Confirm meeting record creation
    // Test meeting notification triggers
  });
  
  test('Data integrity and relationships', async () => {
    // Verify all foreign key relationships
    // Check data consistency across tables
    // Validate cascading updates
    // Test referential integrity
  });
  
  test('Audit logging and tracking', async () => {
    // Verify audit log entries creation
    // Check user activity tracking
    // Validate change history
    // Confirm compliance logging
  });
})
```

### Test Data Cleanup Management
```typescript
// Test File: e2e/tests/utils/test-data-cleanup.spec.js
describe('Test Data Management', () => {
  
  test('Test data identification and filtering', async () => {
    // Query all tables for test data markers
    // Verify test data is properly tagged
    // Check filtering capabilities
  });
  
  test('Manual test data cleanup', async () => {
    // Clean up specific test session data
    // Verify related records are removed
    // Check S3 test files are deleted
    // Confirm notification queue cleanup
    
    // Tables to clean: Requests, Contacts, Properties, 
    // NotificationQueue, ProjectAttachments, S3 files
  });
  
  test('Test data isolation', async () => {
    // Ensure test data doesn't affect production queries
    // Verify production data is never affected by tests
    // Check test data separation in reports
  });
})
```

### Performance and Load Tests
```typescript
// Test File: e2e/tests/performance/get-estimate-performance.spec.js
describe('Get Estimate Performance', () => {
  
  test('Form load performance', async () => {
    // Page load time <3 seconds
    // Form initialization <1 second
    // Asset loading optimization
  });
  
  test('Form submission performance', async () => {
    // Submission processing <5 seconds
    // Database write time <1 second
    // File upload performance <10 seconds
  });
  
  test('Concurrent submission handling', async () => {
    // Multiple simultaneous submissions
    // Database lock handling
    // Resource contention testing
  });
  
  test('Large file upload performance', async () => {
    // Upload files up to size limits
    // Progress tracking accuracy
    // Timeout handling
  });
})
```

---

## 📊 Success Metrics

### Technical Metrics
- [ ] **Form load time**: <3 seconds (95th percentile)
- [ ] **Form submission time**: <5 seconds (95th percentile)  
- [ ] **Database write time**: <1 second (95th percentile)
- [ ] **Error rate**: <1% of submissions fail
- [ ] **Test coverage**: 100% of acceptance criteria covered

### Business Metrics
- [ ] **Conversion rate**: >85% of form starts result in completion
- [ ] **Data accuracy**: >99% of submissions have valid data
- [ ] **User satisfaction**: >4.5/5 rating for form experience
- [ ] **Response time**: Admin follow-up within 24 hours
- [ ] **Lead quality**: >80% of submissions are qualified leads

### User Experience Metrics
- [ ] **Form completion rate**: >90% of users who start complete the form
- [ ] **Time to complete**: <3 minutes average form completion time
- [ ] **Mobile usage**: Form works on >95% of mobile devices
- [ ] **Accessibility score**: 100% WCAG 2.1 AA compliance
- [ ] **User feedback**: >4.5/5 rating for ease of use

---

## 🔧 Implementation Details

### Form Fields (Required)
```typescript
interface GetEstimateFormData {
  // Contact Information
  firstName: string;           // Required, min 2 chars
  lastName: string;            // Required, min 2 chars  
  email: string;               // Required, valid email format
  phone: string;               // Required, valid phone format
  
  // Property Information
  propertyAddress: string;     // Required, min 10 chars
  propertyType: string;        // Required, dropdown selection
  propertySize: string;        // Required, dropdown selection
  
  // Project Information
  projectType: string;         // Required, dropdown selection
  projectTimeline: string;     // Required, dropdown selection
  estimatedBudget: string;     // Required, dropdown selection
  
  // Additional Details
  projectDescription: string;  // Optional, max 1000 chars
  additionalNotes: string;     // Optional, max 500 chars
  
  // File Attachments
  attachments?: File[];        // Optional, images/documents
  
  // Meeting Request
  requestedMeetingDate?: Date; // Optional, calendar selection
  requestedMeetingTime?: string; // Optional, time slot selection
  
  // System Fields
  requestId: string;           // Auto-generated UUID
  submissionDate: Date;        // Auto-generated timestamp
  status: 'New';               // Default status
  source: string;              // 'Website' | 'E2E_TEST'
  
  // Test Data Identification (for E2E tests only - NO NEW FIELDS)
  // Use existing 'source' field: 'E2E_TEST' for test data
  // Use existing 'additionalNotes' field: 'TEST_SESSION:session_id' for test session
}
```

### Database Schema Validation (EXISTING SCHEMA - NO CHANGES)
```sql
-- DynamoDB Table: Requests (USE EXISTING SCHEMA ONLY)
{
  "requestId": "uuid",              // Partition Key (EXISTING)
  "submissionDate": "timestamp",    // Sort Key (EXISTING)
  "firstName": "string",            // EXISTING
  "lastName": "string",             // EXISTING
  "email": "string",                // EXISTING
  "phone": "string",                // EXISTING
  "propertyAddress": "string",      // EXISTING
  "propertyType": "string",         // EXISTING
  "propertySize": "string",         // EXISTING
  "projectType": "string",          // EXISTING
  "projectTimeline": "string",      // EXISTING
  "estimatedBudget": "string",      // EXISTING
  "projectDescription": "string",   // EXISTING
  "additionalNotes": "string",      // EXISTING (use for test session ID)
  "attachments": "array",           // EXISTING - File metadata
  "requestedMeetingDate": "date",   // EXISTING - Optional meeting date
  "requestedMeetingTime": "string", // EXISTING - Optional meeting time
  "status": "string",               // EXISTING
  "source": "string",               // EXISTING - use 'E2E_TEST' for test data
  "createdAt": "timestamp",         // EXISTING
  "updatedAt": "timestamp"          // EXISTING
}

// NO NEW FIELDS ADDED - Work within existing schema constraints

-- DynamoDB Table: Properties (EXISTING SCHEMA - NO CHANGES)
{
  "propertyId": "uuid",             // Partition Key (EXISTING)
  "address": "string",              // Full address (EXISTING)
  "propertyType": "string",         // EXISTING
  "propertySize": "string",         // EXISTING
  "geocoding": "object",            // Lat/lng coordinates (EXISTING)
  "source": "string",               // EXISTING - use 'E2E_TEST' for test data
  "createdAt": "timestamp",         // EXISTING
  "updatedAt": "timestamp"          // EXISTING
}

-- DynamoDB Table: Contacts (EXISTING SCHEMA - NO CHANGES)
{
  "contactId": "uuid",              // Partition Key (EXISTING)
  "email": "string",                // Unique identifier (EXISTING)
  "firstName": "string",            // EXISTING
  "lastName": "string",             // EXISTING
  "phone": "string",                // EXISTING
  "contactType": "string",          // 'homeowner' | 'agent' (EXISTING)
  "source": "string",               // EXISTING - use 'E2E_TEST' for test data
  "createdAt": "timestamp",         // EXISTING
  "updatedAt": "timestamp"          // EXISTING
}

-- DynamoDB Table: NotificationQueue (EXISTING SCHEMA - NO CHANGES)
{
  "notificationId": "uuid",         // Partition Key (EXISTING)
  "requestId": "uuid",              // Foreign key to Request (EXISTING)
  "recipientEmail": "string",       // EXISTING
  "recipientPhone": "string",       // EXISTING
  "notificationType": "string",     // 'email' | 'sms' (EXISTING)
  "templateId": "string",           // EXISTING
  "status": "string",               // 'pending' | 'sent' | 'failed' (EXISTING)
  "source": "string",               // EXISTING - use 'E2E_TEST' for test data
  "createdAt": "timestamp",         // EXISTING
  "sentAt": "timestamp"             // EXISTING
}
```

### API Endpoint
```typescript
// POST /api/requests/create
{
  method: 'POST',
  endpoint: '/api/requests/create',
  authentication: 'none', // Public endpoint
  validation: 'server-side',
  response: {
    success: boolean,
    requestId: string,
    message: string,
    nextSteps: string[]
  }
}
```

---

## 🚨 Risk Mitigation

### Potential Issues
- [ ] **Form spam prevention**: Implement rate limiting and CAPTCHA
- [ ] **Data validation**: Server-side validation for all inputs
- [ ] **Error handling**: Graceful degradation for network issues
- [ ] **Performance**: Form optimization for slow networks
- [ ] **Accessibility**: Screen reader compatibility testing

### Monitoring & Alerts
- [ ] **Form submission monitoring**: Track success/failure rates
- [ ] **Performance monitoring**: Alert on slow form loads
- [ ] **Error monitoring**: Alert on validation failures
- [ ] **Database monitoring**: Track write operations and failures
- [ ] **User behavior tracking**: Monitor form abandonment rates

---

## 🎯 Definition of Done

### Technical Requirements
- [ ] All acceptance criteria are met and tested
- [ ] End-to-end tests pass in CI/CD pipeline
- [ ] Database integration tests pass
- [ ] Performance tests meet success metrics
- [ ] Accessibility tests achieve WCAG 2.1 AA compliance
- [ ] Code review completed and approved

### Quality Requirements  
- [ ] Manual testing completed across all devices
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Load testing with concurrent users completed
- [ ] Security testing for form inputs completed
- [ ] User acceptance testing completed with stakeholders

### Documentation Requirements
- [ ] API documentation updated
- [ ] Database schema documented
- [ ] Test documentation completed
- [ ] User guide updated with form instructions
- [ ] Troubleshooting guide updated

---

## 📋 Test Execution Checklist

### Pre-Deployment Testing
- [ ] **Unit tests**: All form validation logic
- [ ] **Integration tests**: API endpoint functionality  
- [ ] **E2E tests**: Complete user workflow
- [ ] **Performance tests**: Load time and submission speed
- [ ] **Security tests**: Input validation and sanitization
- [ ] **Accessibility tests**: Screen reader and keyboard navigation

### Post-Deployment Validation
- [ ] **Smoke tests**: Basic form functionality
- [ ] **Database verification**: Data storage accuracy
- [ ] **Monitoring setup**: Alerts and dashboards configured
- [ ] **User feedback**: Initial user testing results
- [ ] **Performance monitoring**: Real-world usage metrics

---

**Priority**: 🔴 **CRITICAL**  
**Story Points**: **8**  
**Dependencies**: Public site form infrastructure, DynamoDB Requests table  
**Estimated Duration**: **1-2 weeks**  

---

*This user story serves as the foundation for the entire RealTechee platform workflow. All subsequent features depend on this initial request submission process working correctly.*