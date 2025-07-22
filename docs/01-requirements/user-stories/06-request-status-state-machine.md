# User Story 06: Request Status State Machine

## 📋 Story Overview

**As an** Account Executive (AE) and System Administrator  
**I want to** manage request statuses through a defined state machine with automatic transitions and business rules  
**So that** requests follow proper workflow progression and status updates reflect accurate business processes  

---

## 🎯 Acceptance Criteria

### Primary Flow
1. **New request is submitted** with automatic status assignment to "Submitted"
2. **AE begins work** and status automatically updates to "New" on first edit
3. **Status transitions follow business rules** defined in BackOfficeRequestStatuses table
4. **Automatic status updates** triggered by specific actions and time-based rules
5. **Manual status overrides** available to AEs and Admins with proper permissions
6. **Status history tracking** maintains audit trail of all status changes

### Status State Machine Requirements
- [ ] Status progression follows predefined order from BackOfficeRequestStatuses table
- [ ] Automatic status transitions based on user actions and time triggers
- [ ] Business rule validation prevents invalid status changes
- [ ] Status reversal capability for "Archived" and "Expired" requests
- [ ] Status change notifications to relevant stakeholders
- [ ] Audit logging for all status modifications with timestamp and user tracking

### Status Definitions and Triggers
```typescript
// Status Flow: Submitted → New → Pending walk-thru → Quote Created → [End States]
interface RequestStatus {
  'Submitted': {
    trigger: 'form_submission',
    autoTransitions: [
      { to: 'New', condition: 'first_ae_edit', immediate: true }
    ],
    manualTransitions: ['New', 'Archived'],
    description: 'Request submitted via form, awaiting AE assignment'
  },
  
  'New': {
    trigger: 'ae_first_edit',
    autoTransitions: [
      { to: 'Pending walk-thru', condition: 'meeting_scheduled', immediate: true },
      { to: 'Expired', condition: 'no_update_14_days', scheduled: true }
    ],
    manualTransitions: ['Pending walk-thru', 'Archived', 'Expired'],
    description: 'AE actively working on request validation and information gathering'
  },
  
  'Pending walk-thru': {
    trigger: 'meeting_scheduled_or_info_pending',
    autoTransitions: [
      { to: 'Quote Created', condition: 'quote_button_clicked', immediate: true },
      { to: 'Expired', condition: 'no_update_14_days', scheduled: true }
    ],
    manualTransitions: ['New', 'Quote Created', 'Archived', 'Expired'],
    description: 'Meeting scheduled or waiting for additional information from agent'
  },
  
  'Quote Created': {
    trigger: 'quote_creation_completed',
    autoTransitions: [],
    manualTransitions: ['Archived'],
    description: 'Quote successfully created and sent to customer'
  },
  
  'Archived': {
    trigger: 'manual_archive_or_no_conversion',
    autoTransitions: [],
    manualTransitions: ['New'],
    description: 'Request archived due to no conversion opportunity'
  },
  
  'Expired': {
    trigger: 'unresponsive_14_days',
    autoTransitions: [],
    manualTransitions: ['New'],
    description: 'Request expired due to lack of response from agent (14+ days)'
  }
}
```

### Automatic Transition Rules
- [ ] **"Submitted" → "New"**: Triggered on first AE edit of any field
- [ ] **"New" → "Pending walk-thru"**: Triggered when meeting is scheduled OR when waiting for info
- [ ] **"Pending walk-thru" → "Quote Created"**: Triggered when "Create Quote" button is clicked
- [ ] **Any Active Status → "Expired"**: Triggered after 14 days of no updates
- [ ] **Date field updates**: Automatic tracking of state change dates for analytics

### Manual Override Capabilities
- [ ] AE can manually change status with reason tracking
- [ ] Admin can override any status transition with approval logging
- [ ] "Archived" and "Expired" requests can be reactivated to "New"
- [ ] Status change requires comment explaining reason for manual override
- [ ] Bulk status updates for multiple requests with admin approval

---

## 🧪 Test Suite Requirements

### State Machine Logic Tests
```typescript
// Test File: e2e/tests/admin/requests/status-state-machine.spec.js
describe('Request Status State Machine', () => {
  
  // Automatic Transition Tests
  test('Submitted to New automatic transition on AE first edit', async () => {
    // Create test request with "Submitted" status
    // Login as AE and navigate to request detail
    // Edit any field (title, description, etc.)
    // Verify status automatically changes to "New"
    // Check date fields updated appropriately
    // Verify AE user logged as responsible for transition
  });
  
  test('New to Pending walk-thru on meeting scheduling', async () => {
    // Start with request in "New" status
    // Schedule a meeting with project manager
    // Verify status automatically transitions to "Pending walk-thru"
    // Check meeting scheduled date is recorded
    // Verify PM notification triggered
  });
  
  test('Pending walk-thru to Quote Created on quote button click', async () => {
    // Set request to "Pending walk-thru" status
    // Complete all required information for quoting
    // Click "Create Quote" action button
    // Verify status changes to "Quote Created"
    // Check quote creation date recorded
    // Verify quote entity created with proper linkage
  });
  
  test('Automatic expiration after 14 days of inactivity', async () => {
    // Create request with "New" status
    // Set lastUpdated date to 15 days ago
    // Run scheduled task or trigger expiration check
    // Verify status changes to "Expired"
    // Check expiration date and reason logged
    // Verify expiration notification sent
  });
  
  // Manual Transition Tests
  test('Manual status override with reason tracking', async () => {
    // Start with any active status
    // Attempt manual status change via dropdown
    // Provide reason for manual override
    // Verify status change with audit trail
    // Check reason and user logged properly
  });
  
  test('Reactivation of Archived and Expired requests', async () => {
    // Create request with "Archived" status
    // Change status back to "New"
    // Verify reactivation successful
    // Check audit trail includes reactivation reason
    // Test same workflow for "Expired" status
  });
  
  test('Invalid status transition prevention', async () => {
    // Attempt invalid status transition (e.g., Submitted → Quote Created)
    // Verify transition blocked with appropriate error
    // Check valid transition options displayed
    // Test business rule validation working
  });
  
  // Business Rule Validation Tests
  test('Status transition business rules enforcement', async () => {
    // Test each status transition against business rules
    // Verify required fields completed before certain transitions
    // Check permission-based transition restrictions
    // Test validation messages for incomplete requirements
  });
  
  test('Bulk status update with admin approval', async () => {
    // Login as admin user
    // Select multiple requests for bulk status update
    // Apply bulk status change with approval reason
    // Verify all requests updated correctly
    // Check audit trail for bulk operation
  });
  
  test('Status change notifications to stakeholders', async () => {
    // Change request status
    // Verify appropriate notifications sent
    // Check AE receives status change confirmation
    // Verify customer notified for relevant status changes
    // Test PM notification for meeting-related status changes
  });
  
  // Date Tracking and Analytics Tests
  test('Date field updates on status transitions', async () => {
    // Transition through multiple statuses
    // Verify each status change updates appropriate date fields
    // Check submittedDate, newDate, pendingDate, quotedDate, etc.
    // Test date accuracy and timezone handling
    // Verify historical date preservation
  });
  
  test('Status change audit trail completeness', async () => {
    // Perform multiple status changes on same request
    // Verify complete audit trail maintained
    // Check user information, timestamps, and reasons logged
    // Test audit trail accessibility and formatting
    // Verify audit data integrity and immutability
  });
  
  // Edge Case Tests
  test('Concurrent status change conflict resolution', async () => {
    // Simulate two users changing status simultaneously
    // Verify conflict detection and resolution
    // Check last-write-wins or proper merge handling
    // Test user notification of conflicts
  });
  
  test('Status change during system maintenance', async () => {
    // Attempt status changes during maintenance mode
    // Verify appropriate handling and user notification
    // Test queued status changes and delayed processing
    // Check data consistency after maintenance completion
  });
  
  test('Status transitions with incomplete data', async () => {
    // Attempt status transitions with missing required fields
    // Verify validation prevents invalid transitions
    // Check helpful error messages guide user completion
    // Test partial data preservation during validation failures
  });
})
```

### Integration and Analytics Tests
```typescript
// Test File: e2e/tests/integration/status-analytics-integration.spec.js
describe('Status Analytics and Reporting', () => {
  
  test('Status change analytics and reporting', async () => {
    // Create requests with various status progressions
    // Generate status analytics report
    // Verify conversion rates calculated correctly
    // Check average time in each status
    // Test status distribution reporting
  });
  
  test('Status-based dashboard metrics', async () => {
    // Navigate to admin dashboard
    // Verify status-based counts and percentages
    // Check real-time status updates reflected
    // Test filtering and sorting by status
    // Verify drill-down capabilities
  });
  
  test('Status change performance impact', async () => {
    // Measure status change operation performance
    // Test database locking and transaction efficiency
    // Verify notification system performance during status changes
    // Check scalability with large numbers of requests
  });
  
  test('Status integration with external systems', async () => {
    // Test status synchronization with CRM systems
    // Verify webhook notifications for status changes
    // Check API endpoint responses for status queries
    // Test third-party integration reliability
  });
})
```

---

## 📊 Success Metrics

### Technical Metrics
- [ ] **Status transition time**: <1 second for automatic transitions
- [ ] **Business rule validation**: 100% enforcement of state machine rules
- [ ] **Audit trail completeness**: 100% of status changes logged with full context
- [ ] **Notification delivery**: 99% success rate for status change notifications
- [ ] **Data consistency**: Zero status inconsistencies across system

### Business Metrics
- [ ] **Workflow compliance**: >95% of requests follow proper status progression
- [ ] **Expiration rate**: <15% of requests expire due to inactivity
- [ ] **Reactivation success**: >80% of reactivated requests convert to quotes
- [ ] **Status accuracy**: >98% of status transitions represent actual business state
- [ ] **Process efficiency**: 30% reduction in manual status management overhead

### User Experience Metrics
- [ ] **AE status management efficiency**: 50% reduction in time spent on status updates
- [ ] **Status clarity**: >4.5/5 user rating for status meaning and progression clarity
- [ ] **Error rate**: <2% of manual status changes result in errors or corrections
- [ ] **Training time**: <2 hours for new AEs to master status management
- [ ] **User satisfaction**: >4.0/5 rating for status management workflow

---

## 🔧 Implementation Details

### Status State Machine Data Structure
```typescript
interface RequestStatusStateMachine {
  requestId: string;
  
  // Current status information
  currentStatus: RequestStatusCode;
  currentStatusSince: Date;
  currentStatusAssignedBy: string;
  
  // Status history
  statusHistory: StatusHistoryEntry[];
  
  // Automatic transition configuration
  automaticTransitions: {
    enabled: boolean;
    rules: AutoTransitionRule[];
    lastChecked: Date;
    nextCheck: Date;
  };
  
  // Business dates for analytics
  statusDates: {
    submittedDate?: Date;
    newDate?: Date;
    pendingWalkThruDate?: Date;
    quoteCreatedDate?: Date;
    archivedDate?: Date;
    expiredDate?: Date;
    lastReactivatedDate?: Date;
  };
  
  // Transition permissions
  allowedTransitions: RequestStatusCode[];
  restrictedTransitions: {
    status: RequestStatusCode;
    reason: string;
    requiredRole?: string;
  }[];
}

interface StatusHistoryEntry {
  id: string;
  fromStatus: RequestStatusCode;
  toStatus: RequestStatusCode;
  transitionType: 'automatic' | 'manual' | 'system';
  triggeredBy: string;              // User ID or system process
  triggeredAt: Date;
  reason?: string;                  // Required for manual transitions
  additionalData?: {
    [key: string]: any;
  };
}

interface AutoTransitionRule {
  id: string;
  name: string;
  fromStatus: RequestStatusCode;
  toStatus: RequestStatusCode;
  
  // Trigger conditions
  trigger: {
    type: 'field_change' | 'time_based' | 'action' | 'external_event';
    condition: string;              // JSON query or expression
    delayMinutes?: number;          // For time-based triggers
  };
  
  // Additional requirements
  requirements?: {
    fields: string[];               // Required fields must be completed
    permissions?: string[];         // Required user permissions
    customValidation?: string;      // Custom validation function
  };
  
  // Configuration
  enabled: boolean;
  priority: number;                 // Execution priority for multiple matching rules
  retryOnFailure: boolean;
  maxRetries?: number;
}

interface StatusPermissionMatrix {
  fromStatus: RequestStatusCode;
  toStatus: RequestStatusCode;
  requiredRoles: UserRole[];
  additionalPermissions?: string[];
  businessRules?: string[];
}
```

### Status Management Service
```typescript
interface RequestStatusService {
  // Core status management
  changeStatus(
    requestId: string,
    newStatus: RequestStatusCode,
    options: StatusChangeOptions
  ): Promise<StatusChangeResult>;
  
  // Automatic transition processing
  processAutomaticTransitions(
    requestId?: string
  ): Promise<AutoTransitionResult[]>;
  
  // Validation and rules
  validateStatusTransition(
    requestId: string,
    fromStatus: RequestStatusCode,
    toStatus: RequestStatusCode,
    userId: string
  ): Promise<ValidationResult>;
  
  // Status queries
  getStatusHistory(requestId: string): Promise<StatusHistoryEntry[]>;
  
  getAllowedTransitions(
    requestId: string,
    userId: string
  ): Promise<RequestStatusCode[]>;
  
  getStatusAnalytics(
    filters: AnalyticsFilters
  ): Promise<StatusAnalytics>;
}

interface StatusChangeOptions {
  userId: string;
  reason?: string;
  triggeredBy: 'user' | 'system' | 'schedule';
  force?: boolean;                  // Override business rules (admin only)
  notifyStakeholders?: boolean;
  additionalData?: any;
}

interface StatusChangeResult {
  success: boolean;
  previousStatus: RequestStatusCode;
  newStatus: RequestStatusCode;
  transitionId: string;
  validationWarnings?: string[];
  notificationsSent?: string[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  missingRequirements: {
    fields: string[];
    permissions: string[];
    businessRules: string[];
  };
}
```

### API Endpoints
```typescript
// GET /api/admin/requests/{id}/status
{
  method: 'GET',
  authentication: 'admin|ae',
  response: {
    currentStatus: RequestStatusCode,
    statusSince: Date,
    allowedTransitions: RequestStatusCode[],
    statusHistory: StatusHistoryEntry[],
    automaticTransitions: AutoTransitionRule[]
  }
}

// POST /api/admin/requests/{id}/status
{
  method: 'POST',
  authentication: 'admin|ae',
  body: {
    newStatus: RequestStatusCode,
    reason?: string,
    force?: boolean,
    notifyStakeholders?: boolean
  },
  response: {
    success: boolean,
    statusChange: StatusChangeResult,
    nextAllowedTransitions: RequestStatusCode[]
  }
}

// POST /api/admin/requests/status/bulk
{
  method: 'POST',
  authentication: 'admin',
  body: {
    requestIds: string[],
    newStatus: RequestStatusCode,
    reason: string,
    force?: boolean
  },
  response: {
    success: boolean,
    results: StatusChangeResult[],
    summary: {
      successful: number,
      failed: number,
      errors: string[]
    }
  }
}

// POST /api/admin/status/process-automatic
{
  method: 'POST',
  authentication: 'system|admin',
  body: {
    requestId?: string,
    statusType?: RequestStatusCode
  },
  response: {
    processed: number,
    transitions: AutoTransitionResult[],
    errors: string[]
  }
}

// GET /api/admin/status/analytics
{
  method: 'GET',
  authentication: 'admin|ae',
  query: {
    startDate?: string,
    endDate?: string,
    status?: RequestStatusCode,
    assignedTo?: string
  },
  response: {
    statusDistribution: StatusCount[],
    averageTimeInStatus: StatusDuration[],
    conversionRates: ConversionRate[],
    trends: StatusTrend[]
  }
}
```

---

## 🚨 Risk Mitigation

### Technical Risks
- [ ] **State inconsistency**: Implement atomic transactions and conflict resolution
- [ ] **Automation failures**: Robust error handling and manual override capabilities
- [ ] **Performance degradation**: Optimize status queries and batch processing
- [ ] **Database locking**: Implement proper transaction isolation and timeout handling
- [ ] **Migration complexity**: Careful migration strategy for existing requests

### Business Process Risks
- [ ] **Status confusion**: Clear documentation and training for status meanings
- [ ] **Workflow disruption**: Gradual rollout with fallback to manual processes
- [ ] **Audit compliance**: Comprehensive logging and immutable audit trails
- [ ] **User resistance**: Change management and user acceptance testing
- [ ] **Data quality**: Validation rules and data cleanup procedures

### Operational Risks
- [ ] **Notification failures**: Multiple notification channels and confirmation tracking
- [ ] **System downtime**: Offline status tracking and synchronization procedures
- [ ] **User error**: Undo capabilities and approval workflows for critical changes
- [ ] **Scalability issues**: Load testing and performance monitoring
- [ ] **Integration failures**: Fallback procedures and error recovery

---

## 🎯 Definition of Done

### Technical Requirements
- [ ] Status state machine implemented with all defined transitions
- [ ] Automatic transition rules engine functional
- [ ] Manual status override interface implemented
- [ ] Audit trail and history tracking working
- [ ] Business rule validation active
- [ ] Notification system integrated
- [ ] API endpoints documented and tested

### Quality Requirements
- [ ] All status transitions tested across browsers
- [ ] Performance testing completed for bulk operations
- [ ] Security testing for permission-based transitions
- [ ] Data integrity testing for concurrent operations
- [ ] User acceptance testing with AEs and admins
- [ ] Load testing for automatic transition processing

### Documentation Requirements
- [ ] Status workflow diagram and business rules documented
- [ ] User guide updated with status management procedures
- [ ] Admin guide for status configuration and overrides
- [ ] API documentation for status endpoints
- [ ] Troubleshooting guide for status-related issues

---

## 📋 Dependencies & Integration Points

### System Dependencies
- [ ] **BackOfficeRequestStatuses table**: Status definitions and order
- [ ] **Requests table**: Status field and date tracking fields
- [ ] **User authentication**: Permission-based transition validation
- [ ] **Notification system**: Status change notifications
- [ ] **Audit logging**: Comprehensive change tracking

### Integration Requirements
- [ ] **Request detail page**: Status dropdown and transition interface
- [ ] **Admin dashboard**: Status-based filtering and analytics
- [ ] **Reporting system**: Status analytics and conversion tracking
- [ ] **Workflow automation**: Integration with meeting scheduling and quote creation
- [ ] **External systems**: CRM synchronization and webhook notifications

---

**Priority**: 🔴 **CRITICAL**  
**Story Points**: **5**  
**Dependencies**: BackOfficeRequestStatuses table, User permissions, Notification system  
**Estimated Duration**: **1 week**  

---

*This user story establishes the foundation for proper request lifecycle management and ensures consistent business process execution across the platform.*