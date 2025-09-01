# RequestService - Business Logic Layer

## Overview

The `RequestService` implements comprehensive business logic for request management in the RealTechee application. It orchestrates complex workflows by coordinating between multiple repositories and services while keeping UI components thin and focused on presentation.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │───▶│  RequestService │───▶│ RequestRepository│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Other Services     │
                    │ - NotificationSvc   │
                    │ - ContactService    │
                    │ - PropertyService   │
                    │ - AuditService      │
                    └─────────────────────┘
```

## Key Features

### ✅ **Complete Business Workflows**
- **New Request Processing**: Automated lead scoring, agent assignment, and follow-up scheduling
- **Quote Generation**: Business rule validation and intelligent pricing calculation
- **Agent Assignment**: Load balancing with skill and location matching
- **Status Management**: Comprehensive transition validation with business rules

### ✅ **Advanced Lead Management**
- **Lead Scoring Algorithm**: 7-factor scoring system with weighted calculations
- **Priority Classification**: Automatic A-F grading with conversion probability
- **Follow-up Scheduling**: Intelligent timing based on priority and type
- **Duplicate Handling**: Smart request merging with conflict resolution

### ✅ **Enterprise Features**
- **Dependency Injection**: Loose coupling with service dependencies
- **Error Handling**: Comprehensive error handling with ServiceResult pattern
- **Audit Logging**: Full operation tracking and business event logging
- **Bulk Operations**: Batch processing for archival and status updates

## Business Logic Implemented

### 1. Lead Scoring Algorithm
```typescript
// 7-factor weighted scoring system
const factors = {
  dataCompleteness: 20%,    // Customer and property data quality
  sourceQuality: 15%,       // Lead source reliability
  engagementLevel: 15%,     // Customer interaction quality
  budgetAlignment: 20%,     // Budget vs service fit
  projectComplexity: 10%,   // Project scope and complexity
  geographicFit: 10%,       // Location service area match
  urgencyIndicators: 10%    // Timeline and urgency signals
}
```

### 2. Agent Assignment Strategy
```typescript
// Intelligent assignment with multiple strategies
- skill_match: Match agent expertise to project type
- geographic: Assign based on location proximity
- workload_balance: Distribute based on current capacity
- availability: Consider agent schedule and availability
- auto_balance: Combined approach with ML-like scoring
```

### 3. Status Transition Rules
```typescript
// Business rules for status changes
'new' → ['assigned', 'in_progress', 'cancelled']
'assigned' → ['in_progress', 'on_hold', 'cancelled']
'in_progress' → ['quote_ready', 'on_hold', 'requires_info', 'cancelled']
'quote_ready' → ['quote_sent', 'cancelled']
'quote_sent' → ['quote_approved', 'quote_rejected', 'expired']
// ... complete state machine
```

## Usage Examples

### Basic Service Setup
```typescript
import { RequestService, createRequestService } from './RequestService';
import { createRequestRepository } from '../../../repositories/RequestRepository';

// Setup with dependency injection
const requestService = createRequestService({
  requestRepository: createRequestRepository(),
  notificationService: notificationService,
  contactService: contactService,
  propertyService: propertyService,
  auditService: auditService
});
```

### Complete New Request Workflow
```typescript
// Process new lead with full automation
const result = await requestService.processNewRequest(formData, {
  autoScore: true,           // Calculate lead score
  autoAssign: true,          // Assign to best agent
  autoScheduleFollowUp: true, // Schedule follow-up
  sendNotifications: true    // Send stakeholder notifications
});

if (result.success) {
  console.log(`Request ${result.data.id} processed with score ${result.data.readinessScore}/100`);
}
```

### Lead Scoring and Prioritization
```typescript
const scoreResult = await requestService.calculateLeadScore(requestId);

if (scoreResult.success) {
  const { overallScore, grade, priorityLevel, recommendations } = scoreResult.data;
  console.log(`Lead Score: ${overallScore}/100 (Grade: ${grade})`);
  console.log(`Priority: ${priorityLevel}`);
  console.log(`Recommendations: ${recommendations.join(', ')}`);
}
```

### Intelligent Agent Assignment
```typescript
const assignment = await requestService.assignToAgent(requestId, {
  strategy: 'auto_balance',
  considerSpecialty: true,
  considerLocation: true,
  considerWorkload: true
});

if (assignment.success) {
  console.log(`Assigned to ${assignment.data.agentName} with ${assignment.data.confidence * 100}% confidence`);
}
```

## Integration with Existing Components

### Replace Direct Repository Calls
```typescript
// ❌ OLD: Direct repository usage in components
const request = await requestsAPI.get(requestId);
await requestsAPI.update(requestId, { status: 'assigned' });

// ✅ NEW: Business logic through service
const result = await requestService.processNewRequest(data, options);
```

### UI Component Integration
```typescript
// Example: RequestDetail.tsx integration
class RequestDetailService {
  constructor(private requestService: RequestService) {}

  async updateStatus(requestId: string, newStatus: string) {
    // Validation handled by service
    const validation = await this.requestService.validateStatusTransition(
      requestId, 
      newStatus
    );
    
    if (!validation.data.isValid) {
      return { 
        success: false, 
        errors: validation.data.errors 
      };
    }
    
    // Actual update with business rules
    return await this.requestRepository.updateStatus(requestId, newStatus);
  }
}
```

## Configuration and Customization

### Lead Scoring Weights
```typescript
// Customize scoring weights in calculateLeadScore()
const weights = {
  dataCompleteness: 0.25,    // Increase importance of data quality
  budgetAlignment: 0.25,     // Increase budget importance
  sourceQuality: 0.15,
  engagementLevel: 0.15,
  projectComplexity: 0.10,
  geographicFit: 0.05,       // Decrease geography importance
  urgencyIndicators: 0.05
};
```

### Business Rules Customization
```typescript
// Modify status transition rules in validateStatusTransition()
const validTransitions: Record<string, string[]> = {
  'new': ['assigned', 'in_progress', 'cancelled'],
  'assigned': ['in_progress', 'on_hold', 'cancelled'],
  // ... customize based on business needs
};
```

### Follow-up Timing
```typescript
// Customize follow-up schedules in calculateOptimalFollowUpDate()
const timingRules = {
  'urgent': 2,      // 2 hours
  'high': 4,        // 4 hours  
  'medium': 24,     // 24 hours
  'low': 48         // 48 hours
};
```

## Testing

### Unit Tests
```bash
npm test src/services/domain/request/__tests__/RequestService.test.ts
```

### Integration Testing
```typescript
// Mock all dependencies for isolated testing
const mockRepo = createMockRequestRepository();
const mockServices = createMockServices();
const service = new RequestService({ requestRepository: mockRepo, ...mockServices });
```

## Performance Considerations

### Batch Operations
```typescript
// Use bulk operations for large datasets
await requestService.archiveOldRequests({
  olderThanDays: 365,
  batchSize: 50,
  statuses: ['completed', 'cancelled']
});
```

### Async Processing
```typescript
// All service methods return Promises for async workflows
const results = await Promise.all([
  requestService.calculateLeadScore(id1),
  requestService.calculateLeadScore(id2),
  requestService.calculateLeadScore(id3)
]);
```

## Migration Guide

### Step 1: Install Service
```typescript
// In your component or service setup
import { createRequestService } from '@/services/domain/request/RequestService';
const requestService = createRequestService(dependencies);
```

### Step 2: Replace Business Logic
```typescript
// Move complex logic from components to service methods
// Replace scattered repository calls with service workflows
```

### Step 3: Update UI Components
```typescript
// Keep components focused on presentation
// Use service for all business operations
// Handle loading and error states from ServiceResult
```

### Step 4: Add Error Handling
```typescript
const result = await requestService.processNewRequest(data);
if (result.success) {
  // Handle success
} else {
  // Handle error with result.error
}
```

## Best Practices

### ✅ **DO**
- Use ServiceResult pattern for consistent error handling
- Inject all dependencies through constructor
- Keep UI components thin - move logic to service
- Use TypeScript strict mode for type safety
- Test business logic with mocked dependencies

### ❌ **DON'T**  
- Call repositories directly from UI components
- Put business logic in UI components
- Skip error handling for service calls
- Hard-code business rules (make them configurable)
- Ignore the warnings in ServiceResult.meta

## Files Structure

```
src/services/domain/request/
├── RequestService.ts           # Main service implementation
├── RequestServiceExample.ts    # Usage examples and demos
├── README.md                   # This documentation
└── __tests__/
    └── RequestService.test.ts  # Unit tests
```

## Dependencies

- `RequestRepository`: Data access layer
- `ServiceResult<T>`: Consistent result pattern
- `GraphQLClient`: GraphQL communication
- Optional services: Notification, Contact, Property, Audit

## Future Enhancements

- **Machine Learning Integration**: Enhanced lead scoring with ML models
- **Workflow Automation**: Advanced business process automation
- **Real-time Updates**: WebSocket integration for live status updates
- **Analytics Integration**: Business intelligence and reporting
- **A/B Testing**: Service-level feature flags and experiments

---

**Ready to Use**: The RequestService is production-ready and can be integrated immediately into existing components. All business logic is properly isolated and testable.