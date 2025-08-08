# Backend Validation Testing Framework

This directory contains helper utilities for comprehensive form submission testing with backend validation.

## Overview

The backend validation framework provides end-to-end testing that validates both:
1. **Frontend Form Submission** - User interaction and form validation
2. **Backend Data Persistence** - Database records and notifications

## Architecture

```
tests/
├── helpers/
│   ├── awsConfig.js           # AWS SDK configuration
│   ├── backendValidation.js   # Database validation utilities
│   ├── testDataGenerator.js   # Realistic test data generation
│   └── README.md             # This file
└── e2e/
    ├── form-validation-get-estimate.spec.js
    ├── form-validation-contact-us.spec.js
    └── ...
```

## Core Components

### 1. AWS Configuration (`awsConfig.js`)
- Handles AWS SDK setup for DynamoDB access
- Supports both local development and CI environments
- Validates Amplify backend deployment

### 2. Backend Validation (`backendValidation.js`)
- **BackendValidator**: Main validation orchestrator
- **DatabaseHelper**: DynamoDB query utilities
- **Form Validators**: Specialized validation for each form type
- **TestSession**: Test data lifecycle management

### 3. Test Data Generator (`testDataGenerator.js`)
- Generates realistic, consistent test data
- Provides test scenarios for different form submission patterns
- Uses built-in randomization (no external dependencies)

## Setup Requirements

### 1. AWS Credentials
Set up AWS credentials using one of these methods:

**Option A: Environment Variables (Recommended for CI)**
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key  
export AWS_REGION=us-east-1
```

**Option B: AWS Credentials File (Recommended for Local)**
```bash
aws configure
```

**Option C: IAM Roles (For AWS environments)**
Automatic credential detection in AWS environments.

### 2. Amplify Backend Deployment
```bash
npx ampx sandbox
```

This creates the `amplify_outputs.json` file with table configurations.

### 3. Required Dependencies
The backend validation tests require these packages (already in package.json):
- `@playwright/test`
- `@aws-sdk/client-dynamodb` 
- `@aws-sdk/lib-dynamodb`

## Usage Examples

### Basic Test Structure
```javascript
const { test, expect } = require('@playwright/test');
const { BackendValidator, TestSession } = require('../helpers/backendValidation');
const { generateGetEstimateData } = require('../helpers/testDataGenerator');
const { setupAWS } = require('../helpers/awsConfig');

test.describe('Form Tests', () => {
  let testSession;

  test.beforeAll(async () => {
    await setupAWS(); // Initialize AWS configuration
  });

  test.beforeEach(async () => {
    testSession = TestSession.generateSessionId(); // Unique test session
  });

  test.afterEach(async () => {
    await BackendValidator.cleanupTestData(testSession); // Cleanup
  });

  test('should submit form and validate backend', async ({ page }) => {
    // 1. Generate test data
    const testData = generateGetEstimateData();
    
    // 2. Fill and submit form
    await page.goto('/contact/get-estimate');
    // ... fill form fields ...
    await page.click('[type="submit"]');
    
    // 3. Validate frontend success
    await expect(page.locator('text=Success')).toBeVisible();
    
    // 4. Validate backend persistence
    const results = await BackendValidator.validateFormSubmission(
      'get-estimate', testData, testSession
    );
    
    expect(results.request).toBeDefined();
    expect(results.agentContact).toBeDefined();
    expect(results.property).toBeDefined();
    expect(results.notifications).toBeDefined();
  });
});
```

### Test Data Scenarios
```javascript
const { createTestScenarios } = require('../helpers/testDataGenerator');

// Predefined scenarios
const agentOnly = createTestScenarios.getEstimate.agentOnly();
const mergedContact = createTestScenarios.getEstimate.mergedContact();
const uploadMode = createTestScenarios.getEstimate.uploadMode();
const customBrokerage = createTestScenarios.getEstimate.customBrokerage();

// Custom scenarios
const customData = generateGetEstimateData({
  relationToProperty: 'Homeowner',
  rtDigitalSelection: 'video-call',
  needFinance: true
});
```

## Form Type Support

### Currently Implemented
- ✅ **Get Estimate** (`GetEstimateValidator`)
- ✅ **Contact Us** (`ContactUsValidator`)

### Planned
- 🚧 **Get Qualified** (uses GetEstimateValidator pattern)
- 🚧 **Affiliate** (requires AffiliateValidator implementation)

## Backend Validation Flow

### 1. Test Data Identification
Test data is marked with:
- `leadSource: 'E2E_TEST'` for Requests table
- `officeNotes: 'TEST_SESSION: {sessionId}'` for session tracking
- Email patterns: `test@`, `@test.`, `playwright@`, `e2e@`
- Name patterns: `test`, `playwright`, `automation`, `e2e`

### 2. Database Query Strategy
```javascript
// Find test requests by lead source
await DatabaseHelper.findTestRequests();

// Find test requests by session ID
await DatabaseHelper.findTestRequestsBySession(sessionId);

// Find contacts by email
await DatabaseHelper.findContactByEmail(email);

// Find properties by address
await DatabaseHelper.findPropertyByAddress(fullAddress);

// Find notifications by submission ID
await DatabaseHelper.findNotificationsBySubmissionId(submissionId);
```

### 3. Validation Assertions
Each form validator performs comprehensive checks:
- **Record Creation**: Verify all expected database records exist
- **Field Mapping**: Validate form data matches database fields
- **Relationships**: Verify foreign key relationships are correct
- **Business Logic**: Validate form-specific business rules
- **Notifications**: Confirm notification queue entries

## Database Schema Mapping

### Get Estimate Form → Database Tables
```
Form Data                  → Database Records
─────────────────────────    ─────────────────────
propertyAddress           → Properties table
agentInfo                 → Contacts table (agent)
homeownerInfo (optional)  → Contacts table (homeowner) 
form submission           → Requests table
notification              → NotificationQueue table
```

### Contact Us Form → Database Tables
```
Form Data                  → Database Records
─────────────────────────    ─────────────────────
contact information       → Contacts table
form submission           → ContactUs table
```

## Test Data Lifecycle

### 1. Generation
```javascript
const testData = generateGetEstimateData({
  relationToProperty: 'Real Estate Agent',
  rtDigitalSelection: 'upload'
});
```

### 2. Identification
All test data includes markers for identification:
- Session IDs for tracking related records
- Test email patterns for contact cleanup
- Lead source markers for request cleanup

### 3. Cleanup
```javascript
await BackendValidator.cleanupTestData(testSession);
```

**Note**: Currently logs cleanup operations. Implement actual deletion if needed.

## Error Handling

### AWS Connection Issues
```
Error: AWS connection failed: The security token included in the request is invalid
```
**Solution**: Check AWS credentials configuration

### Missing Tables
```
Error: Table configuration not found for model: Requests
```
**Solution**: Run `npx ampx sandbox` to deploy backend

### Amplify Configuration Missing
```
Warning: amplify_outputs.json not found
```
**Solution**: Deploy Amplify backend first

## Performance Considerations

### Database Sync Delays
AWS DynamoDB uses eventual consistency. Tests include wait periods:
```javascript
await this._waitForDatabaseSync(); // 2-3 second delays
```

### Query Limitations
- DynamoDB doesn't support complex text filtering
- Uses scan operations with client-side filtering
- Limits query results to prevent timeout

### Test Isolation
- Each test uses unique session ID
- Test data is marked and tracked
- Cleanup prevents test data accumulation

## CI/CD Integration

### Environment Variables
Set these in your CI environment:
```bash
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx  
AWS_REGION=us-east-1
CI=true
```

### Test Scripts
```bash
# Run all form validation tests
npm run test:e2e -- form-validation

# Run specific form tests
npm run test:e2e -- form-validation-get-estimate

# Run with headed browser for debugging
npm run test:e2e:headed -- form-validation
```

## Debugging Tips

### Enable Verbose Logging
Tests include extensive console logging for debugging:
- Test data generation details
- Form filling steps
- Backend validation progress
- AWS connection status

### Screenshots
Automatic screenshots are saved to `test-results/`:
- Before form submission
- After form submission  
- On test failures

### Manual Verification
You can manually verify test data in:
- DynamoDB console (AWS)
- Amplify console (Data section)
- CloudWatch logs (for notification processing)

## Extending the Framework

### Adding New Form Validators
1. Create new validator class in `backendValidation.js`
2. Implement validation logic following existing patterns
3. Add form type to `BackendValidator.validateFormSubmission()`
4. Create test scenarios in `testDataGenerator.js`

### Adding New Test Scenarios
1. Add scenario functions to `createTestScenarios`
2. Use descriptive names (e.g., `customBrokerage`, `uploadMode`)
3. Include edge cases and validation scenarios
4. Test both happy path and error conditions

This framework provides comprehensive testing coverage for form submissions while maintaining test data isolation and cleanup.