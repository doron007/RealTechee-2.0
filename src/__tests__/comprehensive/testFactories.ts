/**
 * Comprehensive Test Data Factories
 * 
 * Factories for creating comprehensive test data for 100% backend coverage
 */

import { 
  Request, 
  EnhancedRequest, 
  RequestNote, 
  RequestAssignment, 
  RequestStatusHistory 
} from '../../repositories/RequestRepository';
import { ServiceResult } from '../../repositories/base/types';
import { RepositoryError, NetworkError, ValidationError } from '../../repositories/base/RepositoryError';

// ============================================================================
// Core Data Factories
// ============================================================================

export function createMockRequest(overrides: Partial<Request> = {}): Request {
  const timestamp = new Date().toISOString();
  
  return {
    id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'new',
    statusOrder: 1,
    product: 'Kitchen Renovation',
    message: 'Looking for a complete kitchen remodel with modern appliances',
    leadSource: 'website',
    priority: 'medium',
    source: 'online',
    estimatedValue: 50000,
    budget: '$40,000 - $60,000',
    homeownerContactId: 'contact_homeowner_123',
    agentContactId: 'contact_agent_456',
    addressId: 'address_789',
    readinessScore: 75,
    tags: ['kitchen', 'renovation'],
    missingInformation: [],
    relationToProperty: 'owner',
    needFinance: false,
    informationGatheringStatus: 'pending',
    scopeDefinitionStatus: 'not_started',
    createdAt: timestamp,
    updatedAt: timestamp,
    owner: 'system',
    ...overrides
  };
}

export function createMockEnhancedRequest(overrides: Partial<EnhancedRequest> = {}): EnhancedRequest {
  const baseRequest = createMockRequest(overrides);
  
  return {
    ...baseRequest,
    agent: createMockContact('agent'),
    homeowner: createMockContact('homeowner'),
    address: createMockAddress(),
    notes: overrides.notes || [createMockRequestNote()],
    assignments: overrides.assignments || [createMockRequestAssignment()],
    statusHistory: overrides.statusHistory || [createMockRequestStatusHistory()],
    informationItems: overrides.informationItems || [],
    scopeItems: overrides.scopeItems || [],
    workflowStates: overrides.workflowStates || []
  };
}

export function createMockContact(type: 'agent' | 'homeowner' = 'homeowner', overrides: any = {}) {
  return {
    id: `contact_${type}_${Date.now()}`,
    firstName: type === 'agent' ? 'John' : 'Sarah',
    lastName: type === 'agent' ? 'Smith' : 'Johnson',
    fullName: type === 'agent' ? 'John Smith' : 'Sarah Johnson',
    email: type === 'agent' ? 'john.smith@realtechee.com' : 'sarah.johnson@email.com',
    phone: '555-0123',
    mobile: '555-0124',
    company: type === 'agent' ? 'RealTechee' : null,
    roleType: type === 'agent' ? 'Account Executive' : 'Customer',
    isActive: true,
    ...overrides
  };
}

export function createMockAddress(overrides: any = {}) {
  return {
    id: `address_${Date.now()}`,
    propertyFullAddress: '123 Main Street, Springfield, IL 62701',
    houseAddress: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    propertyType: 'Single Family',
    bedrooms: 3,
    bathrooms: 2,
    floors: 2,
    sizeSqft: 2500,
    yearBuilt: 1995,
    redfinLink: 'https://redfin.com/property/123',
    zillowLink: 'https://zillow.com/property/123',
    ...overrides
  };
}

export function createMockRequestNote(overrides: Partial<RequestNote> = {}): RequestNote {
  const timestamp = new Date().toISOString();
  
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    requestId: 'request_123',
    content: 'Customer called to discuss project timeline and budget',
    type: 'client_communication',
    category: 'follow_up',
    isPrivate: false,
    authorId: 'agent_123',
    authorName: 'John Smith',
    authorRole: 'Account Executive',
    priority: 'normal',
    tags: ['follow_up', 'timeline'],
    communicationMethod: 'phone',
    clientResponse: 'responded',
    followUpRequired: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    owner: 'agent_123',
    ...overrides
  };
}

export function createMockRequestAssignment(overrides: Partial<RequestAssignment> = {}): RequestAssignment {
  const timestamp = new Date().toISOString();
  
  return {
    id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    requestId: 'request_123',
    assignedToId: 'agent_456',
    assignedToName: 'Jane Doe',
    assignedToRole: 'Senior Account Executive',
    assignmentType: 'primary',
    assignedById: 'admin_789',
    assignedByName: 'Admin User',
    assignmentReason: 'Geographic expertise and availability',
    status: 'active',
    priority: 'normal',
    estimatedHours: 10,
    actualHours: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    owner: 'admin_789',
    ...overrides
  };
}

export function createMockRequestStatusHistory(overrides: Partial<RequestStatusHistory> = {}): RequestStatusHistory {
  const timestamp = new Date().toISOString();
  
  return {
    id: `status_history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    requestId: 'request_123',
    previousStatus: 'new',
    newStatus: 'assigned',
    statusReason: 'Agent available and qualified for this request type',
    triggeredBy: 'user',
    triggeredById: 'admin_123',
    triggeredByName: 'Admin User',
    businessImpact: 'medium',
    clientNotified: false,
    internalNotification: true,
    timeInPreviousStatus: 3600, // 1 hour in seconds
    expectedDuration: 86400, // 1 day in seconds
    timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    owner: 'admin_123',
    ...overrides
  };
}

// ============================================================================
// Service Result Factories
// ============================================================================

export function createMockServiceSuccess<T>(data: T, meta: any = {}): ServiceResult<T> {
  return {
    success: true,
    data,
    meta: {
      executionTime: Date.now(),
      recordCount: Array.isArray(data) ? data.length : 1,
      ...meta
    }
  };
}

export function createMockServiceError<T>(error: Error | string, meta: any = {}): ServiceResult<T> {
  const err = typeof error === 'string' ? new Error(error) : error;
  
  return {
    success: false,
    error: err,
    meta: {
      executionTime: Date.now(),
      ...meta
    }
  };
}

// ============================================================================
// GraphQL Response Factories
// ============================================================================

export function createMockGraphQLSuccess(data: any, errors?: any[]) {
  return {
    data,
    errors,
    extensions: {
      requestId: `req_${Date.now()}`,
      executionTime: Math.random() * 100
    }
  };
}

export function createMockGraphQLError(message: string, code?: string, path?: string[]) {
  return {
    errors: [
      {
        message,
        locations: [{ line: 1, column: 1 }],
        path: path || ['mutation'],
        extensions: {
          code: code || 'GRAPHQL_ERROR',
          exception: {
            stacktrace: [`Error: ${message}`, '    at TestFunction']
          }
        }
      }
    ]
  };
}

// ============================================================================
// Repository Result Factories
// ============================================================================

export function createMockRepositorySuccess<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
    meta: {
      executionTime: Date.now(),
      source: 'mock_repository'
    }
  };
}

export function createMockRepositoryError<T>(error: Error | string): ServiceResult<T> {
  const err = typeof error === 'string' ? new Error(error) : error;
  
  return {
    success: false,
    error: err,
    meta: {
      executionTime: Date.now(),
      source: 'mock_repository'
    }
  };
}

// ============================================================================
// Error Scenario Factories
// ============================================================================

export function createNetworkErrorScenario(): Error {
  const error = new Error('Network request failed') as any;
  error.code = 'NETWORK_ERROR';
  error.errno = -4077;
  error.syscall = 'getaddrinfo';
  error.hostname = 'api.example.com';
  return error;
}

export function createTimeoutErrorScenario(): Error {
  const error = new Error('Request timeout') as any;
  error.code = 'TIMEOUT_ERROR';
  error.timeout = 5000;
  return error;
}

export function createAuthenticationErrorScenario(): Error {
  const error = new Error('Authentication failed') as any;
  error.code = 'UNAUTHORIZED';
  error.statusCode = 401;
  return error;
}

export function createRateLimitErrorScenario(): Error {
  const error = new Error('Rate limit exceeded') as any;
  error.code = 'RATE_LIMIT_EXCEEDED';
  error.statusCode = 429;
  error.retryAfter = 60;
  return error;
}

export function createValidationErrorScenario(fields: Array<{ field: string; message: string }>): ValidationError {
  return new ValidationError('Validation failed', fields);
}

// ============================================================================
// Business Logic Test Data Factories
// ============================================================================

export function createMockLeadScoreResult(overrides: any = {}) {
  return {
    requestId: 'request_123',
    overallScore: 78,
    grade: 'B' as const,
    conversionProbability: 0.72,
    priorityLevel: 'high' as const,
    factors: {
      dataCompleteness: 85,
      sourceQuality: 75,
      engagementLevel: 80,
      budgetAlignment: 70,
      projectComplexity: 75,
      geographicFit: 90,
      urgencyIndicators: 65
    },
    recommendations: [
      'Schedule consultation within 24-48 hours',
      'Gather missing property details',
      'Confirm budget parameters'
    ],
    calculatedAt: new Date().toISOString(),
    ...overrides
  };
}

export function createMockAgentAssignment(overrides: any = {}) {
  return {
    agentId: 'agent_123',
    agentName: 'John Smith',
    agentRole: 'Senior Account Executive',
    assignmentReason: 'skill_match' as const,
    confidence: 0.85,
    workloadBefore: 5,
    workloadAfter: 6,
    estimatedCapacity: 10,
    specialtyMatch: true,
    distanceScore: 0.92,
    ...overrides
  };
}

export function createMockQuoteGenerationInput(overrides: any = {}) {
  return {
    basePrice: 45000,
    adjustmentFactors: {
      complexity: 1.1,
      materials: 1.15,
      timeline: 0.95,
      location: 1.05
    },
    includeAlternatives: true,
    validityPeriod: 30,
    notes: 'Standard kitchen renovation with premium fixtures',
    ...overrides
  };
}

export function createMockFollowUpSchedule(overrides: any = {}) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  
  return {
    requestId: 'request_123',
    followUpType: 'initial_contact' as const,
    scheduledDate: futureDate.toISOString(),
    priority: 'high' as const,
    assignedTo: 'agent_123',
    message: 'Initial consultation follow-up',
    reminderDays: [1, 3],
    autoReschedule: true,
    ...overrides
  };
}

// ============================================================================
// Edge Case and Performance Test Data
// ============================================================================

export function createLargeDataSet(count: number = 1000) {
  return Array.from({ length: count }, (_, index) => 
    createMockRequest({ 
      id: `request_large_${index}`,
      product: `Test Product ${index}`,
      estimatedValue: Math.floor(Math.random() * 100000) + 10000
    })
  );
}

export function createMockConcurrentOperations(operationCount: number = 10) {
  return Array.from({ length: operationCount }, (_, index) => ({
    operationId: `op_${index}`,
    requestId: `request_concurrent_${index}`,
    operation: index % 2 === 0 ? 'create' : 'update',
    data: createMockRequest({ id: `request_concurrent_${index}` })
  }));
}

export function createMockErrorSequence() {
  return [
    createNetworkErrorScenario(),
    createTimeoutErrorScenario(),
    createAuthenticationErrorScenario(),
    createRateLimitErrorScenario()
  ];
}

// ============================================================================
// Mock Service Dependencies
// ============================================================================

export function createMockNotificationService() {
  return {
    sendNewRequestNotifications: jest.fn().mockResolvedValue({ success: true }),
    sendAssignmentNotification: jest.fn().mockResolvedValue({ success: true }),
    scheduleReminder: jest.fn().mockResolvedValue({ success: true }),
    sendMergeNotification: jest.fn().mockResolvedValue({ success: true })
  };
}

export function createMockContactService() {
  return {
    getContact: jest.fn().mockResolvedValue(createMockServiceSuccess(createMockContact())),
    validateContact: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
    findAgentsBySpecialty: jest.fn().mockResolvedValue([createMockContact('agent')])
  };
}

export function createMockPropertyService() {
  return {
    getProperty: jest.fn().mockResolvedValue(createMockServiceSuccess(createMockAddress())),
    validateProperty: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
    calculateGeographicScore: jest.fn().mockResolvedValue(0.85)
  };
}

export function createMockAuditService() {
  return {
    logRequestCreated: jest.fn().mockResolvedValue({ success: true }),
    logStatusChange: jest.fn().mockResolvedValue({ success: true }),
    logAssignment: jest.fn().mockResolvedValue({ success: true })
  };
}

// ============================================================================
// Test Utilities
// ============================================================================

export function createMockTimer() {
  const start = Date.now();
  return {
    start,
    elapsed: () => Date.now() - start,
    reset: () => Date.now()
  };
}

export function createAsyncDelay(ms: number = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createMockRetrySequence<T>(
  failCount: number, 
  successResult: T
): Array<() => Promise<ServiceResult<T>>> {
  const sequence = [];
  
  // Add failures
  for (let i = 0; i < failCount; i++) {
    sequence.push(() => Promise.resolve(createMockServiceError<T>('Retry attempt failed')));
  }
  
  // Add success
  sequence.push(() => Promise.resolve(createMockServiceSuccess(successResult)));
  
  return sequence;
}

export default {
  // Core factories
  createMockRequest,
  createMockEnhancedRequest,
  createMockRequestNote,
  createMockRequestAssignment,
  createMockRequestStatusHistory,
  createMockContact,
  createMockAddress,
  
  // Service result factories
  createMockServiceSuccess,
  createMockServiceError,
  createMockRepositorySuccess,
  createMockRepositoryError,
  
  // GraphQL factories
  createMockGraphQLSuccess,
  createMockGraphQLError,
  
  // Error scenarios
  createNetworkErrorScenario,
  createTimeoutErrorScenario,
  createAuthenticationErrorScenario,
  createRateLimitErrorScenario,
  createValidationErrorScenario,
  
  // Business logic factories
  createMockLeadScoreResult,
  createMockAgentAssignment,
  createMockQuoteGenerationInput,
  createMockFollowUpSchedule,
  
  // Mock services
  createMockNotificationService,
  createMockContactService,
  createMockPropertyService,
  createMockAuditService,
  
  // Test utilities
  createMockTimer,
  createAsyncDelay,
  createMockRetrySequence,
  createLargeDataSet,
  createMockConcurrentOperations,
  createMockErrorSequence
};