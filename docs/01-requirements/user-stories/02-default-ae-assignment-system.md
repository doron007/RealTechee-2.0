# User Story 02: Default AE Assignment System

## 📋 Story Overview

**As a** Super Admin or Admin  
**I want to** configure a default Account Executive for new request assignments  
**So that** all incoming requests are automatically routed to available staff without manual intervention  

---

## 🎯 Acceptance Criteria

### Primary Flow
1. **Admin accesses settings page** for default assignment configuration
2. **Admin selects default AE** from available Account Executives list
3. **System stores configuration** in database for global application
4. **New requests automatically assigned** to configured default AE on submission
5. **Assignment can be changed** manually on individual requests as needed
6. **System maintains audit trail** of assignment changes

### Configuration Requirements
- [ ] Settings page accessible only to Super Admin and Admin roles
- [ ] Dropdown populated from `BackOfficeAssignTo` table filtered by AE role
- [ ] Single global default AE setting applies to all new requests
- [ ] Configuration change takes effect immediately for new submissions
- [ ] Previous requests retain their existing assignments (no retroactive changes)

### Assignment Logic Requirements
- [ ] New request submission automatically sets `assignedTo` field to default AE ID
- [ ] Assignment timestamp (`assignedDate`) set to submission time
- [ ] Request status set to "Submitted" initially, changes to "New" on first AE edit
- [ ] Notification system sends alerts to assigned AE with direct request link
- [ ] Manual assignment override available in admin request detail page

### System Integration Requirements
- [ ] Integration with existing notification system for AE alerts
- [ ] Compatible with role-based assignment filtering system
- [ ] Audit logging for all assignment changes and configuration updates
- [ ] Backup assignment logic if default AE is deactivated or deleted
- [ ] Settings validation prevents assignment to inactive staff members

---

## 🧪 Test Suite Requirements

### Settings Configuration Tests
```typescript
// Test File: e2e/tests/admin/settings/default-assignment.spec.js
describe('Default AE Assignment Configuration', () => {
  
  // Happy Path Tests
  test('Admin can configure default AE assignment', async () => {
    // Login as admin user
    // Navigate to settings page
    // Access default assignment configuration
    // Select AE from dropdown
    // Save configuration
    // Verify success confirmation
    // Validate setting persists after page refresh
  });
  
  test('Default assignment dropdown shows only active AEs', async () => {
    // Access assignment configuration
    // Verify dropdown populated from BackOfficeAssignTo table
    // Confirm only active=true records displayed
    // Check role filtering for Account Executive roles
    // Validate proper display names and email addresses
  });
  
  test('Configuration change takes immediate effect', async () => {
    // Set initial default AE
    // Submit new request (should assign to initial AE)
    // Change default AE configuration
    // Submit another new request (should assign to new AE)
    // Verify both requests have correct assignments
  });
  
  // Edge Case Tests
  test('Default assignment when no AE configured', async () => {
    // Clear default AE setting
    // Submit new request
    // Verify request gets created without assignment
    // Check notification system behavior
    // Validate admin dashboard shows unassigned requests
  });
  
  test('Default assignment when configured AE becomes inactive', async () => {
    // Set default AE
    // Deactivate the assigned AE in BackOfficeAssignTo table
    // Submit new request
    // Verify fallback behavior (no assignment or backup assignment)
    // Check error handling and admin notifications
  });
  
  test('Settings access control validation', async () => {
    // Test access as Super Admin (should succeed)
    // Test access as Admin (should succeed)
    // Test access as Account Executive (should fail)
    // Test access as Agent (should fail)
    // Test access as Guest/unauthenticated (should fail)
  });
  
  // Negative Tests
  test('Invalid assignment configuration handling', async () => {
    // Attempt to assign deleted AE
    // Attempt to assign inactive AE
    // Attempt to assign non-existent AE ID
    // Verify appropriate error messages
    // Ensure configuration remains unchanged on errors
  });
})
```

### Assignment Logic Tests
```typescript
// Test File: e2e/tests/api/request-assignment-logic.spec.js
describe('Automatic Assignment Logic', () => {
  
  test('New request automatically assigned to default AE', async () => {
    // Configure default AE in settings
    // Submit Get Estimate form
    // Verify request record has correct assignedTo value
    // Check assignedDate is set to submission time
    // Confirm notification sent to assigned AE
    // Validate notification includes direct admin link
  });
  
  test('Assignment audit trail creation', async () => {
    // Submit request with default assignment
    // Verify audit log entry for automatic assignment
    // Change assignment manually
    // Verify audit log entry for manual change
    // Check audit trail includes user, timestamp, old/new values
  });
  
  test('Assignment notification system integration', async () => {
    // Submit request with default assignment
    // Verify NotificationQueue entry created
    // Check email notification sent to assigned AE
    // Validate SMS notification if AE has SMS enabled
    // Confirm notification contains request details and admin link
  });
  
  test('Multiple role default assignments', async () => {
    // Configure default AE
    // Configure default Project Manager
    // Configure default Accountant
    // Submit request and verify only AE gets assigned initially
    // Test quote creation assigns to default accountant
    // Test project creation assigns to default PM
  });
})
```

### Integration Tests
```typescript
// Test File: e2e/tests/integration/assignment-workflow.spec.js
describe('Assignment Workflow Integration', () => {
  
  test('End-to-end assignment workflow', async () => {
    // Admin configures default AE
    // Public user submits Get Estimate form
    // System assigns request to default AE
    // AE receives notification with admin link
    // AE clicks link and accesses request detail page
    // AE can reassign to different staff member
    // Reassignment triggers new notifications
  });
  
  test('Assignment with multiple request types', async () => {
    // Test assignment for Get Estimate requests
    // Test assignment for Contact Us submissions
    // Test assignment for quote requests
    // Verify each type uses appropriate default assignee
  });
  
  test('Backup assignment scenarios', async () => {
    // Test when default AE is deleted
    // Test when default AE account is deactivated
    // Test when default AE has notification disabled
    // Verify fallback behaviors and error handling
  });
})
```

---

## 📊 Success Metrics

### Technical Metrics
- [ ] **Configuration save time**: <1 second for settings update
- [ ] **Assignment processing time**: <500ms for automatic assignment
- [ ] **Notification delivery time**: <30 seconds for AE alerts
- [ ] **System availability**: 99.9% uptime for assignment logic
- [ ] **Error rate**: <0.1% of requests fail automatic assignment

### Business Metrics
- [ ] **Assignment coverage**: 100% of requests assigned to staff
- [ ] **Response time improvement**: 50% faster initial AE response
- [ ] **Admin efficiency**: 80% reduction in manual assignment tasks
- [ ] **Lead distribution**: Balanced workload across available AEs
- [ ] **Configuration adoption**: 100% of admin users configure defaults

### User Experience Metrics
- [ ] **Settings interface usability**: <30 seconds to configure default AE
- [ ] **Assignment transparency**: 100% of assignments visible in admin dashboard
- [ ] **AE satisfaction**: >4.5/5 rating for assignment notification quality
- [ ] **Admin satisfaction**: >4.5/5 rating for configuration ease
- [ ] **System reliability**: >99% of assignments processed without errors

---

## 🔧 Implementation Details

### Settings Data Structure
```typescript
interface DefaultAssignmentSettings {
  // Default assignments for different workflow types
  defaultAE: string;                    // BackOfficeAssignTo ID for requests
  defaultProjectManager: string;       // BackOfficeAssignTo ID for projects
  defaultAccountant: string;           // BackOfficeAssignTo ID for quotes
  defaultUnderwriter: string;          // BackOfficeAssignTo ID for underwriting
  
  // Configuration metadata
  configuredBy: string;                // Admin user who set the configuration
  configuredAt: Date;                  // Timestamp of last configuration change
  version: number;                     // Configuration version for audit trail
  
  // Backup assignment rules
  backupAssignmentEnabled: boolean;    // Use backup if primary unavailable
  unassignedNotificationEnabled: boolean; // Alert admins about unassigned requests
}
```

### Database Storage Strategy (No Schema Changes)
```typescript
// Use existing BackOfficeNotifications table as key-value store
const defaultAssignmentConfig = {
  key: 'default_assignment_config',
  subject: 'System Configuration',
  body: JSON.stringify({
    defaultAE: 'ae_user_id_123',
    defaultProjectManager: 'pm_user_id_456',
    defaultAccountant: 'acc_user_id_789',
    configuredBy: 'admin_user_id',
    configuredAt: '2025-07-17T10:00:00Z',
    version: 1
  }),
  owner: 'SYSTEM',
  to: '', // Not used for config storage
  cc: '', // Not used for config storage
  bcc: '' // Not used for config storage
};
```

### Assignment Logic Implementation
```typescript
interface AssignmentService {
  // Get current default assignments
  getDefaultAssignments(): Promise<DefaultAssignmentSettings>;
  
  // Update default assignment configuration
  updateDefaultAssignment(
    type: 'AE' | 'ProjectManager' | 'Accountant' | 'Underwriter',
    assignToId: string,
    adminUserId: string
  ): Promise<boolean>;
  
  // Apply automatic assignment to new request
  assignRequest(
    requestId: string,
    requestType: 'estimate' | 'contact' | 'quote',
    priority?: 'normal' | 'high' | 'urgent'
  ): Promise<AssignmentResult>;
  
  // Handle assignment failures and fallbacks
  handleAssignmentFailure(
    requestId: string,
    failureReason: string
  ): Promise<void>;
}

interface AssignmentResult {
  success: boolean;
  assignedToId?: string;
  assignedToName?: string;
  assignedAt: Date;
  notificationSent: boolean;
  fallbackUsed: boolean;
  errorMessage?: string;
}
```

### API Endpoints
```typescript
// GET /api/admin/settings/default-assignments
{
  method: 'GET',
  authentication: 'admin|superadmin',
  response: DefaultAssignmentSettings
}

// PUT /api/admin/settings/default-assignments
{
  method: 'PUT',
  authentication: 'admin|superadmin',
  body: {
    type: 'AE' | 'ProjectManager' | 'Accountant',
    assignToId: string
  },
  response: {
    success: boolean,
    message: string,
    updatedConfig: DefaultAssignmentSettings
  }
}

// POST /api/requests/assign-default
{
  method: 'POST',
  authentication: 'system|admin',
  body: {
    requestId: string,
    requestType: string
  },
  response: AssignmentResult
}
```

---

## 🚨 Risk Mitigation

### Potential Issues
- [ ] **Assignment bottleneck**: Single AE getting all requests
- [ ] **Inactive AE assignment**: Assigning to deactivated staff
- [ ] **Configuration conflicts**: Multiple admins changing settings simultaneously
- [ ] **Notification failures**: AE not receiving assignment alerts
- [ ] **Backup assignment logic**: Handling when primary assignee unavailable

### Monitoring & Alerts
- [ ] **Assignment distribution monitoring**: Track request volume per AE
- [ ] **Assignment failure alerts**: Notify admins of failed assignments
- [ ] **Configuration change alerts**: Log all default assignment updates
- [ ] **Notification delivery monitoring**: Track AE notification success rates
- [ ] **Workload balancing alerts**: Warn when single AE has too many requests

### Business Continuity
- [ ] **Backup assignment rules**: Secondary AE if primary unavailable
- [ ] **Admin override capability**: Manual assignment for all requests
- [ ] **Assignment history preservation**: Maintain audit trail for compliance
- [ ] **System fallback**: Graceful degradation if assignment service fails
- [ ] **Load balancing**: Future enhancement for automatic workload distribution

---

## 🎯 Definition of Done

### Technical Requirements
- [ ] Settings page allows configuration of default AE assignment
- [ ] New requests automatically assigned to configured default AE
- [ ] Assignment triggers notification to assigned AE with admin link
- [ ] Configuration changes logged in audit trail
- [ ] API endpoints implemented for configuration management
- [ ] Integration tests pass for assignment workflow

### Quality Requirements
- [ ] Admin interface tested across all supported browsers
- [ ] Assignment logic tested with edge cases and failure scenarios
- [ ] Performance testing completed for high-volume request periods
- [ ] Security testing completed for settings access control
- [ ] User acceptance testing completed with admin users

### Documentation Requirements
- [ ] Admin user guide updated with configuration instructions
- [ ] API documentation updated with new endpoints
- [ ] Database schema documentation updated
- [ ] Troubleshooting guide updated with assignment issues
- [ ] Release notes prepared for new feature announcement

---

## 📋 Dependencies & Integration Points

### System Dependencies
- [ ] **BackOfficeAssignTo table**: Source of available AE options
- [ ] **BackOfficeNotifications table**: Storage for configuration settings
- [ ] **Requests table**: Target for automatic assignments
- [ ] **Notification system**: Integration for AE alerts
- [ ] **Admin authentication**: Role-based access control

### Integration Requirements
- [ ] **Settings UI integration**: Add to existing admin settings page
- [ ] **Request creation workflow**: Integrate assignment logic
- [ ] **Notification pipeline**: Ensure assignment alerts are sent
- [ ] **Admin dashboard**: Display assignment status and metrics
- [ ] **Audit logging**: Track all assignment-related activities

---

**Priority**: 🔴 **CRITICAL**  
**Story Points**: **5**  
**Dependencies**: BackOfficeAssignTo table, Admin settings infrastructure, Notification system  
**Estimated Duration**: **3-5 days**  

---

*This user story establishes the foundation for automated request routing and ensures no leads are lost due to manual assignment delays. It directly supports the business requirement for immediate response to customer inquiries.*