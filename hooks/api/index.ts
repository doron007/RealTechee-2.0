/**
 * API hooks exports
 * Centralized access to all React Query hooks for data operations
 */

// Request hooks
export * from './useRequests';
export { useRequests, useRequest, useRequestBusinessState, useCreateRequest, useUpdateRequest, useRequestWorkflow, useDeleteRequest, useRequestManagement } from './useRequests';

// Quote hooks  
export * from './useQuotes';
export { useQuotes, useQuote, useQuotesByRequest, useExpiringQuotes, useQuoteBusinessState, useCreateQuote, useUpdateQuote, useQuoteWorkflow, useDuplicateQuote, useDeleteQuote, useQuoteManagement } from './useQuotes';

// Project hooks
export * from './useProjects';
export { useProjects, useProject, useOverdueProjects, useAtRiskProjects, useProjectBusinessState, useProjectMetrics, useProjectsByStatus, useCreateProject, useUpdateProject, useProjectWorkflow, useDeleteProject, useProjectManagement } from './useProjects';

// Query keys for external use
export { requestQueryKeys } from './useRequests';
export { quoteQueryKeys } from './useQuotes';
export { projectQueryKeys } from './useProjects';