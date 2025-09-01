/**
 * Test Data Factories
 * 
 * Consistent test data generation for comprehensive backend testing
 * with realistic business scenarios and edge cases.
 */

import type { 
  Request, 
  RequestNote, 
  RequestAssignment, 
  RequestStatusHistory,
  EnhancedRequest,
  RequestInformationItem,
  RequestScopeItem,
  RequestWorkflowState
} from '../repositories/RequestRepository';

import type {
  LeadScoreResult,
  AgentAssignment,
  QuoteGenerationInput,
  FollowUpSchedule,
  RequestMergeResult
} from '../services/domain/request/RequestService';

/**
 * Base Request Factory
 */
export const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  id: 'req_' + Math.random().toString(36).substr(2, 9),
  homeownerContactId: 'contact_' + Math.random().toString(36).substr(2, 9),
  addressId: 'property_' + Math.random().toString(36).substr(2, 9),
  product: 'Kitchen Renovation',
  message: 'Looking for a complete kitchen remodel with modern appliances',
  budget: '$50,000 - $75,000',
  leadSource: 'website',
  relationToProperty: 'owner',
  priority: 'medium',
  status: 'new',
  assignedTo: null,
  needFinance: false,
  readinessScore: 75,
  estimatedValue: 50000,
  source: 'manual',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
  owner: 'system',
  ...overrides
});

/**
 * Enhanced Request with Relations Factory
 */
export const createMockEnhancedRequest = (overrides: Partial<EnhancedRequest> = {}): EnhancedRequest => {
  const baseRequest = createMockRequest(overrides);
  
  return {
    ...baseRequest,
    notes: [],
    assignments: [],
    statusHistory: [],
    informationItems: [],
    scopeItems: [],
    workflowStates: [],
    agent: null,
    homeowner: {
      id: baseRequest.homeownerContactId,
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0123'
    },
    address: {
      id: baseRequest.addressId,
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    ...overrides
  };
};

/**
 * Request Note Factory
 */
export const createMockRequestNote = (overrides: Partial<RequestNote> = {}): RequestNote => ({
  id: 'note_' + Math.random().toString(36).substr(2, 9),
  requestId: 'req_123',
  content: 'Initial contact made with homeowner',
  author: 'Agent Smith',
  authorId: 'agent_123',
  isInternal: false,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
  ...overrides
});

/**
 * Request Assignment Factory
 */
export const createMockRequestAssignment = (overrides: Partial<RequestAssignment> = {}): RequestAssignment => ({
  id: 'assignment_' + Math.random().toString(36).substr(2, 9),
  requestId: 'req_123',
  assignedTo: 'agent_456',
  assignedToName: 'Sarah Johnson',
  assignedBy: 'admin_789',
  assignedByName: 'Admin User',
  assignmentReason: 'Geographic expertise',
  assignmentType: 'primary',
  createdAt: '2025-01-15T10:00:00Z',
  ...overrides
});

/**
 * Request Status History Factory
 */
export const createMockStatusHistory = (overrides: Partial<RequestStatusHistory> = {}): RequestStatusHistory => ({
  id: 'history_' + Math.random().toString(36).substr(2, 9),
  requestId: 'req_123',
  fromStatus: 'new',
  toStatus: 'assigned',
  changedBy: 'agent_123',
  changedByName: 'Agent Smith',
  reason: 'Request assigned to specialist',
  metadata: {},
  createdAt: '2025-01-15T10:00:00Z',
  ...overrides
});

/**
 * Request Information Item Factory
 */
export const createMockInformationItem = (overrides: Partial<RequestInformationItem> = {}): RequestInformationItem => ({
  id: 'info_' + Math.random().toString(36).substr(2, 9),
  requestId: 'req_123',
  label: 'Current Kitchen Size',
  value: '12x15 feet',
  category: 'dimensions',
  isRequired: true,
  displayOrder: 1,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
  ...overrides
});

/**
 * Request Scope Item Factory
 */
export const createMockScopeItem = (overrides: Partial<RequestScopeItem> = {}): RequestScopeItem => ({
  id: 'scope_' + Math.random().toString(36).substr(2, 9),
  requestId: 'req_123',
  category: 'cabinets',
  item: 'Custom kitchen cabinets',
  description: 'Solid wood cabinets with soft-close hardware',
  quantity: 15,
  unit: 'linear feet',
  estimatedCost: 12000,
  priority: 'high',
  status: 'pending',
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
  ...overrides
});

/**
 * Request Workflow State Factory
 */
export const createMockWorkflowState = (overrides: Partial<RequestWorkflowState> = {}): RequestWorkflowState => ({
  id: 'workflow_' + Math.random().toString(36).substr(2, 9),
  requestId: 'req_123',
  stage: 'initial_contact',
  status: 'completed',
  assignedTo: 'agent_123',
  assignedToName: 'Agent Smith',
  startedAt: '2025-01-15T09:00:00Z',
  completedAt: '2025-01-15T10:00:00Z',
  notes: 'Homeowner contacted and requirements gathered',
  metadata: {},
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2025-01-15T10:00:00Z',
  ...overrides
});

/**
 * Lead Score Result Factory
 */
export const createMockLeadScoreResult = (overrides: Partial<LeadScoreResult> = {}): LeadScoreResult => ({
  requestId: 'req_123',
  overallScore: 85,
  grade: 'A',
  priorityLevel: 'high',
  conversionProbability: 0.85,
  factors: {
    budget: { score: 90, weight: 0.25, details: 'Substantial budget indicated' },
    urgency: { score: 80, weight: 0.20, details: 'Moderate urgency expressed' },
    completeness: { score: 85, weight: 0.15, details: 'Most information provided' },
    engagement: { score: 85, weight: 0.15, details: 'Good response rate' },
    location: { score: 90, weight: 0.10, details: 'Service area coverage' },
    timing: { score: 75, weight: 0.10, details: 'Reasonable timeline' },
    referral: { score: 70, weight: 0.05, details: 'No referral source' }
  },
  recommendations: [
    'Schedule site visit within 48 hours',
    'Prepare detailed quote with timeline',
    'Follow up on financing options'
  ],
  calculatedAt: '2025-01-15T10:00:00Z',
  ...overrides
});

/**
 * Agent Assignment Factory
 */
export const createMockAgentAssignment = (overrides: Partial<AgentAssignment> = {}): AgentAssignment => ({
  agentId: 'agent_456',
  agentName: 'Sarah Johnson', 
  agentRole: 'Account Executive',
  assignmentReason: 'workload_balance',
  confidence: 0.85,
  workloadBefore: 5,
  workloadAfter: 6,
  estimatedCapacity: 10,
  specialtyMatch: true,
  distanceScore: 0.9,
  ...overrides
});

/**
 * Quote Generation Input Factory
 */
export const createMockQuoteGenerationInput = (overrides: Partial<QuoteGenerationInput> = {}): QuoteGenerationInput => ({
  basePrice: 50000,
  adjustmentFactors: {
    complexity: 1.15,
    materials: 1.1,
    timeline: 0.95,
    location: 1.05
  },
  includeAlternatives: true,
  validityPeriod: 30,
  notes: 'Premium kitchen renovation with high-end appliances',
  ...overrides
});

/**
 * Follow-up Schedule Factory
 */
export const createMockFollowUpSchedule = (overrides: Partial<FollowUpSchedule> = {}): FollowUpSchedule => ({
  requestId: 'req_123',
  followUpType: 'initial_contact',
  priority: 'high',
  scheduledDate: '2025-01-16T14:00:00Z',
  assignedTo: 'agent_123',
  reminderDays: [1, 3, 7],
  autoReschedule: true,
  maxAttempts: 3,
  notes: 'Follow up on kitchen renovation requirements',
  createdAt: '2025-01-15T10:00:00Z',
  ...overrides
});

/**
 * Request Merge Result Factory
 */
export const createMockRequestMergeResult = (overrides: Partial<RequestMergeResult> = {}): RequestMergeResult => ({
  primaryRequestId: 'req_primary',
  mergedRequestIds: ['req_dup1', 'req_dup2'],
  combinedData: createMockEnhancedRequest({ id: 'req_primary' }),
  conflictResolutions: [
    {
      field: 'budget',
      primaryValue: '$50,000 - $75,000',
      mergedValues: ['$45,000 - $60,000', '$55,000 - $80,000'],
      resolution: 'keep_primary',
      reason: 'Primary request has most recent information'
    }
  ],
  mergedNotes: [
    createMockRequestNote({ content: 'Merged note from duplicate request 1' }),
    createMockRequestNote({ content: 'Merged note from duplicate request 2' })
  ],
  mergedAssignments: [
    createMockRequestAssignment({ assignmentReason: 'Merged from duplicate request' })
  ],
  mergedAt: '2025-01-15T10:00:00Z',
  mergedBy: 'admin_123',
  totalMergedRequests: 2,
  ...overrides
});

/**
 * GraphQL Response Factories
 */
export const createMockGraphQLSuccess = <T>(data: T) => ({
  data,
  errors: undefined,
  extensions: {}
});

export const createMockGraphQLError = (message: string, code?: string) => ({
  data: null,
  errors: [
    {
      message,
      locations: [{ line: 1, column: 1 }],
      path: ['test'],
      extensions: code ? { code } : undefined
    }
  ]
});

/**
 * Repository Response Factories
 */
export const createMockRepositorySuccess = <T>(data: T) => ({
  success: true,
  data,
  error: undefined,
  metadata: {
    executionTime: 45,
    fromCache: false
  }
});

export const createMockRepositoryError = (error: Error) => ({
  success: false,
  data: undefined,
  error,
  metadata: {
    executionTime: 12,
    fromCache: false
  }
});

/**
 * Business Scenario Factories
 */
export const createHighValueLeadScenario = () => ({
  request: createMockRequest({
    budget: '$100,000+',
    message: 'Complete home renovation needed urgently. Have permits ready.',
    leadSource: 'referral',
    priority: 'urgent'
  }),
  expectedScore: 95,
  expectedGrade: 'A',
  expectedPriority: 'urgent'
});

export const createLowValueLeadScenario = () => ({
  request: createMockRequest({
    budget: 'Under $5,000',
    message: 'Just looking for ideas',
    leadSource: 'social_media',
    priority: 'low'
  }),
  expectedScore: 25,
  expectedGrade: 'D',
  expectedPriority: 'low'
});

export const createComplexAssignmentScenario = () => ({
  request: createMockRequest({
    product: 'Historic Home Restoration',
    message: 'Need specialist for 1920s Victorian restoration',
    priority: 'high'
  }),
  availableAgents: [
    { id: 'agent_1', specialty: 'modern_renovation', workload: 0.3 },
    { id: 'agent_2', specialty: 'historic_restoration', workload: 0.8 },
    { id: 'agent_3', specialty: 'historic_restoration', workload: 0.4 }
  ],
  expectedAssignment: 'agent_3' // Lower workload with right specialty
});

/**
 * Error Scenario Factories
 */
export const createNetworkErrorScenario = () => new Error('Network request failed');
export const createTimeoutErrorScenario = () => new Error('Request timeout');
export const createValidationErrorScenario = () => new Error('Validation failed: Missing required fields');
export const createAuthenticationErrorScenario = () => new Error('Authentication failed');
export const createRateLimitErrorScenario = () => new Error('Rate limit exceeded');

/**
 * Service Result Factory
 */
export const createMockServiceResult = <T>(
  data?: T, 
  success: boolean = true, 
  error?: any
) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : error,
  meta: {
    executionTime: Date.now()
  }
});

/**
 * GraphQL Response Factory 
 */
export const createMockGraphQLResponse = <T>(data: T, errors?: any[]) => ({
  data,
  errors: errors || null
});

/**
 * Lead Score Factory
 */
export const createMockLeadScore = (overrides: Partial<LeadScoreResult> = {}): LeadScoreResult => ({
  requestId: 'req_123',
  overallScore: 85,
  grade: 'B',
  conversionProbability: 0.75,
  priorityLevel: 'high',
  factors: {
    dataCompleteness: 90,
    sourceQuality: 85,
    engagementLevel: 80,
    budgetAlignment: 75,
    projectComplexity: 85,
    geographicFit: 90,
    urgencyIndicators: 70
  },
  recommendations: [
    'Schedule consultation within 24 hours',
    'Prepare detailed project scope'
  ],
  calculatedAt: '2025-01-15T10:00:00Z',
  ...overrides
});

/**
 * Repository Error Factory (with custom error structure)
 */
export const createMockRepositoryErrorWithDetails = (message: string, code: string = 'REPOSITORY_ERROR') => ({
  name: 'RepositoryError',
  message,
  code,
  userMessage: 'An error occurred processing your request',
  context: { operation: 'test', model: 'Test' },
  originalError: null,
  isRetryable: () => code === 'NETWORK_ERROR',
  toJSON: () => ({ message, code })
});

/**
 * Note Factory (alias for compatibility)
 */
export const createMockNote = createMockRequestNote;

/**
 * Assignment Factory (alias for compatibility) 
 */
export const createMockAssignment = createMockRequestAssignment;