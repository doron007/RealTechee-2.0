/**
 * API Layer - Clean Frontend Interface
 * 
 * This module provides a complete abstraction over the backend services,
 * offering React hooks for data fetching, mutations, and business operations.
 */

// ============================================================================
// Hooks Exports
// ============================================================================

// Request hooks
export {
  // Query hooks
  useRequest,
  useRequests,
  useInfiniteRequests,
  useRequestsByStatus,
  useRequestsSearch,
  useLeadScore,
  
  // Mutation hooks
  useCreateRequest,
  useUpdateRequest,
  useDeleteRequest,
  useAssignRequest,
  useAddRequestNote,
  useGenerateQuote,
  useScheduleFollowUp,
  useMergeRequests,
  
  // Utility hooks
  usePrefetchRequest,
  useInvalidateRequests,
  useRequestOperations,
  
  // Query keys for advanced usage
  requestsQueryKeys,
} from './hooks/useRequests';

// ============================================================================
// Provider Exports
// ============================================================================

export {
  // Main provider
  ServicesProvider,
  CompleteServicesProvider,
  
  // Context hooks
  useServices,
  useRequestService,
  useRequestRepository,
  useServiceRegistry,
  useServicesStatus,
  
  // Higher-order component
  withServices,
  
  // Development utilities
  ServicesDebugInfo,
  ServicesErrorBoundary,
} from './providers/ServicesProvider';

// ============================================================================
// Service Exports
// ============================================================================

export {
  // Service registry
  ServiceRegistry,
  services,
  
  // Service getters
  requestService,
  requestRepository,
  getRequestService,
  getRequestRepository,
  
  // Configuration
  configureServices,
  initializeServices,
  
  // Development utilities
  resetServices,
  getServiceStatus,
} from './services/serviceFactory';

// ============================================================================
// Type Exports
// ============================================================================

// Re-export types for convenience
export type {
  Request,
  EnhancedRequest,
  RequestNote,
  RequestAssignment,
} from '../repositories/RequestRepository';

export type {
  ServiceResult,
  FilterOptions,
  ListOptions,
  CreateInput,
  UpdateInput,
} from '../repositories/base/types';

export type {
  LeadScoreResult,
  AgentAssignment,
  QuoteGenerationInput,
  FollowUpSchedule,
  RequestMergeResult,
} from '../services/domain/request/RequestService';

// ============================================================================
// Constants
// ============================================================================

export const API_VERSION = '1.0.0';
export const SUPPORTED_FEATURES = {
  REQUESTS: true,
  LEAD_SCORING: true,
  AGENT_ASSIGNMENT: true,
  QUOTE_GENERATION: true,
  FOLLOW_UP_SCHEDULING: true,
  REQUEST_MERGING: true,
  OPTIMISTIC_UPDATES: true,
  REAL_TIME_UPDATES: false, // TODO: Implement
  OFFLINE_SUPPORT: false,   // TODO: Implement
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a feature is supported
 */
export function isFeatureSupported(feature: keyof typeof SUPPORTED_FEATURES): boolean {
  return SUPPORTED_FEATURES[feature];
}

/**
 * Get API version
 */
export function getApiVersion(): string {
  return API_VERSION;
}

/**
 * Initialize the complete API layer
 * Call this once at the root of your application
 */
export function initializeAPI(config?: {
  environment?: 'development' | 'staging' | 'production';
  features?: Partial<{
    notifications: boolean;
    audit: boolean;
    realTime: boolean;
    caching: boolean;
  }>;
}): void {
  // Import services dynamically to avoid circular dependencies
  const { configureServices: configure, initializeServices: initialize } = 
    require('./services/serviceFactory');
  
  if (config) {
    configure({
      environment: config.environment,
      features: config.features,
    });
  }
  
  initialize();
  
  console.log(`RealTechee API v${API_VERSION} initialized successfully`);
}

// ============================================================================
// Default Export - Complete API
// ============================================================================

const apiExports = {
  // Hooks
  // useRequest,
  // useRequests,
  // useRequestOperations,
  
  // Provider
  // ServicesProvider,
  
  // Services
  // services,
  
  // Utilities
  initializeAPI,
  isFeatureSupported,
  getApiVersion,
  
  // Constants
  API_VERSION,
  SUPPORTED_FEATURES,
};

export default apiExports;