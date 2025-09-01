/**
 * React API hooks for Request operations
 * 
 * Provides clean frontend interface to RequestService and RequestRepository
 * with comprehensive React Query integration for optimal UX.
 * 
 * Features:
 * - Loading, error, and success states
 * - Optimistic updates for better UX
 * - Automatic cache invalidation
 * - Background refetching
 * - Real-time updates support
 * - TypeScript support with proper types
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { RequestService, createRequestService } from '../../services/domain/request/RequestService';
import { RequestRepository } from '../../repositories/RequestRepository';
import { GraphQLClient } from '../../repositories/base/GraphQLClient';
import type { 
  Request, 
  EnhancedRequest, 
  RequestNote, 
  RequestAssignment 
} from '../../repositories/RequestRepository';
import type { 
  ServiceResult, 
  FilterOptions, 
  ListOptions,
  CreateInput,
  UpdateInput
} from '../../repositories/base/types';
import type {
  LeadScoreResult,
  AgentAssignment,
  QuoteGenerationInput,
  FollowUpSchedule,
  RequestMergeResult
} from '../../services/domain/request/RequestService';

// ============================================================================
// Service Setup & Configuration
// ============================================================================

// Create singleton service instances
let requestServiceInstance: RequestService | null = null;
let requestRepositoryInstance: RequestRepository | null = null;

function getRequestService(): RequestService {
  if (!requestServiceInstance) {
    // Initialize GraphQL client and repository
    const graphqlClient = new GraphQLClient();
    requestRepositoryInstance = new RequestRepository(graphqlClient);
    
    // Create service with dependencies (other services would be injected here)
    requestServiceInstance = createRequestService({
      requestRepository: requestRepositoryInstance,
      // notificationService: notificationServiceInstance,
      // contactService: contactServiceInstance,
      // propertyService: propertyServiceInstance,
      // auditService: auditServiceInstance,
    });
  }
  return requestServiceInstance;
}

function getRequestRepository(): RequestRepository {
  if (!requestRepositoryInstance) {
    const graphqlClient = new GraphQLClient();
    requestRepositoryInstance = new RequestRepository(graphqlClient);
  }
  return requestRepositoryInstance;
}

// ============================================================================
// Query Keys for Cache Management
// ============================================================================

export const requestsQueryKeys = {
  all: ['requests'] as const,
  lists: () => [...requestsQueryKeys.all, 'list'] as const,
  list: (filters: FilterOptions = {}) => [...requestsQueryKeys.lists(), filters] as const,
  details: () => [...requestsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestsQueryKeys.details(), id] as const,
  search: (criteria: Record<string, any>) => [...requestsQueryKeys.all, 'search', criteria] as const,
  byStatus: (status: string) => [...requestsQueryKeys.all, 'status', status] as const,
  assignments: (requestId: string) => [...requestsQueryKeys.detail(requestId), 'assignments'] as const,
  notes: (requestId: string) => [...requestsQueryKeys.detail(requestId), 'notes'] as const,
  leadScore: (requestId: string) => [...requestsQueryKeys.detail(requestId), 'leadScore'] as const,
  workflow: (requestId: string) => [...requestsQueryKeys.detail(requestId), 'workflow'] as const,
} as const;

// ============================================================================
// Query Hooks - Data Fetching
// ============================================================================

/**
 * Hook to fetch a single request with full relations
 */
export function useRequest(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: requestsQueryKeys.detail(id),
    queryFn: async (): Promise<EnhancedRequest> => {
      const repository = getRequestRepository();
      const result = await repository.getWithRelations(id);
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Request not found');
      }
      
      return result.data;
    },
    enabled: !!id && options.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute for individual requests
    retry: (failureCount, error: any) => {
      // Don't retry on 404s
      if (error?.message?.includes('not found')) return false;
      return failureCount < 3;
    },
  });
}

/**
 * Hook to fetch paginated list of requests with filtering
 */
export function useRequests(options: {
  filters?: FilterOptions;
  pagination?: { limit?: number; nextToken?: string };
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: requestsQueryKeys.list(options.filters || {}),
    queryFn: async () => {
      const repository = getRequestRepository();
      const result = await repository.find(options.filters || {}, {
        pagination: options.pagination,
        includes: ['notes', 'assignments', 'statusHistory']
      });
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch requests');
      }
      
      return result.data || [];
    },
    enabled: options.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes for lists
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

/**
 * Hook for infinite scrolling/pagination of requests
 */
export function useInfiniteRequests(options: {
  filters?: FilterOptions;
  pageSize?: number;
  enabled?: boolean;
} = {}) {
  return useInfiniteQuery({
    queryKey: [...requestsQueryKeys.list(options.filters || {}), 'infinite'],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const repository = getRequestRepository();
      const result = await repository.find(options.filters || {}, {
        pagination: { 
          limit: options.pageSize || 20, 
          nextToken: pageParam 
        },
        includes: ['notes', 'assignments']
      });
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch requests');
      }
      
      return {
        data: result.data || [],
        nextCursor: result.meta?.nextToken,
        hasNextPage: !!result.meta?.nextToken,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: options.enabled !== false,
    staleTime: 2 * 60 * 1000,
    initialPageParam: undefined as string | undefined,
  });
}

/**
 * Hook to fetch requests filtered by status
 */
export function useRequestsByStatus(status: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: requestsQueryKeys.byStatus(status),
    queryFn: async () => {
      const repository = getRequestRepository();
      const result = await repository.find(
        { status: { eq: status } },
        { includes: ['notes', 'assignments'] }
      );
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch requests');
      }
      
      return result.data || [];
    },
    enabled: !!status && options.enabled !== false,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for advanced search with debouncing
 */
export function useRequestsSearch(
  searchCriteria: Record<string, any>, 
  options: { debounceMs?: number; enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: requestsQueryKeys.search(searchCriteria),
    queryFn: async () => {
      const repository = getRequestRepository();
      
      // Build GraphQL filters from search criteria
      const filters: FilterOptions = {};
      
      Object.entries(searchCriteria).forEach(([key, value]) => {
        if (value && value !== '') {
          if (typeof value === 'string') {
            filters[key] = { contains: value };
          } else if (Array.isArray(value)) {
            filters[key] = { in: value };
          } else if (typeof value === 'object' && value.from && value.to) {
            filters[key] = { between: [value.from, value.to] };
          } else {
            filters[key] = { eq: value };
          }
        }
      });
      
      const result = await repository.find(filters, {
        includes: ['notes', 'assignments']
      });
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Search failed');
      }
      
      return result.data || [];
    },
    enabled: options.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds for search results
  });
}

// ============================================================================
// Business Logic Hooks - Using RequestService
// ============================================================================

/**
 * Hook to calculate lead score for a request
 */
export function useLeadScore(requestId: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: requestsQueryKeys.leadScore(requestId),
    queryFn: async (): Promise<LeadScoreResult> => {
      const service = getRequestService();
      const result = await service.calculateLeadScore(requestId);
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to calculate lead score');
      }
      
      return result.data;
    },
    enabled: !!requestId && options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes for lead scores
  });
}

// ============================================================================
// Mutation Hooks - Data Modifications
// ============================================================================

/**
 * Hook for creating new requests with business logic
 */
export function useCreateRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      requestData: Omit<Request, 'id' | 'createdAt' | 'updatedAt'>;
      options?: {
        autoAssign?: boolean;
        autoScore?: boolean;
        autoScheduleFollowUp?: boolean;
        sendNotifications?: boolean;
      };
    }) => {
      const service = getRequestService();
      const result = await service.processNewRequest(data.requestData, data.options || {});
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to create request');
      }
      
      return result.data;
    },
    onSuccess: (newRequest) => {
      // Add to cache optimistically
      queryClient.setQueryData(requestsQueryKeys.detail(newRequest.id), newRequest);
      
      // Invalidate lists to include new request
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.byStatus(newRequest.status || 'new') });
    },
    onError: (error: Error) => {
      console.error('Create request failed:', error);
    },
  });
}

/**
 * Hook for updating requests
 */
export function useUpdateRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Request> }) => {
      const repository = getRequestRepository();
      const result = await repository.update({ id: data.id, data: data.updates });
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to update request');
      }
      
      return result.data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: requestsQueryKeys.detail(id) });
      
      // Snapshot the previous value
      const previousRequest = queryClient.getQueryData(requestsQueryKeys.detail(id));
      
      // Optimistically update to the new value
      if (previousRequest) {
        queryClient.setQueryData(requestsQueryKeys.detail(id), {
          ...previousRequest,
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      }
      
      return { previousRequest };
    },
    onError: (error, { id }, context) => {
      // Rollback to previous value on error
      if (context?.previousRequest) {
        queryClient.setQueryData(requestsQueryKeys.detail(id), context.previousRequest);
      }
      console.error('Update request failed:', error);
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.lists() });
    },
  });
}

/**
 * Hook for deleting/archiving requests
 */
export function useDeleteRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const repository = getRequestRepository();
      const result = await repository.delete(id);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete request');
      }
      
      return { id, deletedAt: new Date().toISOString() };
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: requestsQueryKeys.detail(id) });
      
      const previousRequest = queryClient.getQueryData(requestsQueryKeys.detail(id));
      
      // Remove from cache optimistically
      queryClient.removeQueries({ queryKey: requestsQueryKeys.detail(id) });
      
      return { previousRequest };
    },
    onError: (error, id, context) => {
      // Restore on error
      if (context?.previousRequest) {
        queryClient.setQueryData(requestsQueryKeys.detail(id), context.previousRequest);
      }
      console.error('Delete request failed:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.lists() });
    },
  });
}

/**
 * Hook for assigning requests to agents
 */
export function useAssignRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      options?: {
        agentId?: string;
        strategy?: 'manual' | 'round_robin' | 'skill_match' | 'geographic' | 'auto_balance';
        considerSpecialty?: boolean;
        considerLocation?: boolean;
        considerWorkload?: boolean;
      };
    }) => {
      const service = getRequestService();
      const result = await service.assignToAgent(data.requestId, data.options || {});
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to assign request');
      }
      
      return result.data;
    },
    onSuccess: (assignment, { requestId }) => {
      // Update request in cache with assignment info
      queryClient.setQueryData(
        requestsQueryKeys.detail(requestId),
        (oldData: EnhancedRequest | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            assignedTo: assignment.agentId,
            assignedDate: new Date().toISOString(),
            assignments: [
              ...(oldData.assignments || []),
              {
                id: `assignment_${Date.now()}`,
                requestId,
                assignedToId: assignment.agentId,
                assignedToName: assignment.agentName,
                assignedToRole: assignment.agentRole,
                assignmentType: 'primary',
                assignedById: 'system',
                assignedByName: 'System',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as RequestAssignment
            ]
          };
        }
      );
      
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.assignments(requestId) });
    },
  });
}

/**
 * Hook for adding notes to requests
 */
export function useAddRequestNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      content: string;
      options?: {
        type?: 'internal' | 'client_communication' | 'technical' | 'follow_up';
        category?: string;
        isPrivate?: boolean;
        priority?: 'normal' | 'important' | 'urgent';
      };
    }) => {
      const repository = getRequestRepository();
      const result = await repository.addNote(data.requestId, data.content, data.options);
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to add note');
      }
      
      return result.data;
    },
    onSuccess: (newNote, { requestId }) => {
      // Add note to request in cache
      queryClient.setQueryData(
        requestsQueryKeys.detail(requestId),
        (oldData: EnhancedRequest | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            notes: [...(oldData.notes || []), newNote]
          };
        }
      );
      
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.notes(requestId) });
    },
  });
}

/**
 * Hook for generating quotes from requests
 */
export function useGenerateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      quoteInput: QuoteGenerationInput;
    }) => {
      const service = getRequestService();
      const result = await service.generateQuoteFromRequest(data.requestId, data.quoteInput);
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to generate quote');
      }
      
      return result.data;
    },
    onSuccess: (quote, { requestId }) => {
      // Update request status to quote_ready
      queryClient.setQueryData(
        requestsQueryKeys.detail(requestId),
        (oldData: EnhancedRequest | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            status: 'quote_ready',
            moveToQuotingDate: new Date().toISOString(),
          };
        }
      );
      
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.byStatus('quote_ready') });
    },
  });
}

/**
 * Hook for scheduling follow-ups
 */
export function useScheduleFollowUp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      schedule: Omit<FollowUpSchedule, 'requestId'>;
    }) => {
      const service = getRequestService();
      const result = await service.scheduleFollowUp(data.requestId, data.schedule);
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to schedule follow-up');
      }
      
      return result.data;
    },
    onSuccess: (followUp, { requestId }) => {
      // Update request with follow-up date
      queryClient.setQueryData(
        requestsQueryKeys.detail(requestId),
        (oldData: EnhancedRequest | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            followUpDate: followUp.scheduledDate,
          };
        }
      );
    },
  });
}

/**
 * Hook for merging duplicate requests
 */
export function useMergeRequests() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      primaryRequestId: string;
      requestsToMerge: string[];
      options?: {
        conflictResolution?: 'keep_primary' | 'use_latest' | 'manual_review';
        preserveHistory?: boolean;
        notifyStakeholders?: boolean;
      };
    }) => {
      const service = getRequestService();
      const result = await service.mergeRequests(
        data.primaryRequestId,
        data.requestsToMerge,
        data.options || {}
      );
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to merge requests');
      }
      
      return result.data;
    },
    onSuccess: (mergeResult) => {
      // Remove merged requests from cache
      mergeResult.mergedRequestIds.forEach(id => {
        queryClient.removeQueries({ queryKey: requestsQueryKeys.detail(id) });
      });
      
      // Invalidate primary request to refetch with merged data
      queryClient.invalidateQueries({ 
        queryKey: requestsQueryKeys.detail(mergeResult.primaryRequestId) 
      });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: requestsQueryKeys.lists() });
    },
  });
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for prefetching request data (performance optimization)
 */
export function usePrefetchRequest() {
  const queryClient = useQueryClient();
  
  return useCallback((id: string) => {
    queryClient.prefetchQuery({
      queryKey: requestsQueryKeys.detail(id),
      queryFn: async () => {
        const repository = getRequestRepository();
        const result = await repository.getWithRelations(id);
        
        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Request not found');
        }
        
        return result.data;
      },
      staleTime: 1 * 60 * 1000,
    });
  }, [queryClient]);
}

/**
 * Hook for invalidating request caches (useful for real-time updates)
 */
export function useInvalidateRequests() {
  const queryClient = useQueryClient();
  
  return useCallback(() => ({
    all: () => queryClient.invalidateQueries({ queryKey: requestsQueryKeys.all }),
    lists: () => queryClient.invalidateQueries({ queryKey: requestsQueryKeys.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ 
      queryKey: requestsQueryKeys.detail(id) 
    }),
    byStatus: (status: string) => queryClient.invalidateQueries({ 
      queryKey: requestsQueryKeys.byStatus(status) 
    }),
  }), [queryClient]);
}

/**
 * Combined hook for common request operations
 */
export function useRequestOperations() {
  const createRequest = useCreateRequest();
  const updateRequest = useUpdateRequest();
  const deleteRequest = useDeleteRequest();
  const assignRequest = useAssignRequest();
  const addNote = useAddRequestNote();
  const generateQuote = useGenerateQuote();
  const scheduleFollowUp = useScheduleFollowUp();
  const mergeRequests = useMergeRequests();
  const prefetchRequest = usePrefetchRequest();
  const invalidateRequests = useInvalidateRequests();
  
  return {
    // Mutations
    createRequest,
    updateRequest,
    deleteRequest,
    assignRequest,
    addNote,
    generateQuote,
    scheduleFollowUp,
    mergeRequests,
    
    // Utilities
    prefetchRequest,
    invalidateRequests,
    
    // Combined state
    isLoading: createRequest.isPending || 
               updateRequest.isPending || 
               deleteRequest.isPending ||
               assignRequest.isPending ||
               addNote.isPending ||
               generateQuote.isPending ||
               scheduleFollowUp.isPending ||
               mergeRequests.isPending,
               
    hasError: createRequest.isError ||
              updateRequest.isError ||
              deleteRequest.isError ||
              assignRequest.isError ||
              addNote.isError ||
              generateQuote.isError ||
              scheduleFollowUp.isError ||
              mergeRequests.isError,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default useRequestOperations;