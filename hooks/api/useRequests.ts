/**
 * React Query hooks for Request operations
 * Provides clean frontend interface with loading states and error handling
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { requestService, EnhancedRequest, RequestCreateData, RequestBusinessFilter } from '../../services/business/RequestService';
import { ServiceResult, ServiceQueryOptions } from '../../services/interfaces/IBaseService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('useRequests');

// Query keys for consistent caching
export const requestQueryKeys = {
  all: ['requests'] as const,
  lists: () => [...requestQueryKeys.all, 'list'] as const,
  list: (filters?: RequestBusinessFilter) => [...requestQueryKeys.lists(), filters] as const,
  details: () => [...requestQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestQueryKeys.details(), id] as const,
  businessState: (id: string) => [...requestQueryKeys.detail(id), 'businessState'] as const,
};

// Hook for fetching all requests
export function useRequests(
  options?: ServiceQueryOptions<RequestBusinessFilter>,
  queryOptions?: Omit<UseQueryOptions<EnhancedRequest[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: requestQueryKeys.list(options?.filter),
    queryFn: async () => {
      logger.debug('Fetching requests', { options });
      const result = await requestService.findAll(options);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch requests');
      }
      
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...queryOptions,
  });
}

// Hook for fetching a single request
export function useRequest(
  id: string,
  queryOptions?: Omit<UseQueryOptions<EnhancedRequest>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: requestQueryKeys.detail(id),
    queryFn: async () => {
      logger.debug('Fetching request', { id });
      const result = await requestService.findById(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch request');
      }
      
      if (!result.data) {
        throw new Error('Request not found');
      }
      
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for fetching request business state
export function useRequestBusinessState(
  id: string,
  queryOptions?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: requestQueryKeys.businessState(id),
    queryFn: async () => {
      logger.debug('Fetching request business state', { id });
      const result = await requestService.getBusinessState(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch request business state');
      }
      
      return result.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes (business state changes more frequently)
    gcTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for creating requests
export function useCreateRequest(
  mutationOptions?: UseMutationOptions<EnhancedRequest, Error, RequestCreateData>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RequestCreateData) => {
      logger.info('Creating request', { data });
      const result = await requestService.create(data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create request');
      }
      
      if (!result.data) {
        throw new Error('No data returned from create operation');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch requests list
      queryClient.invalidateQueries({ queryKey: requestQueryKeys.lists() });
      
      // Add the new request to the cache
      queryClient.setQueryData(requestQueryKeys.detail(data.id), data);
      
      logger.info('Request created successfully', { id: data.id });
    },
    onError: (error) => {
      logger.error('Failed to create request', { error });
    },
    ...mutationOptions,
  });
}

// Hook for updating requests
export function useUpdateRequest(
  mutationOptions?: UseMutationOptions<EnhancedRequest, Error, { id: string; data: Partial<EnhancedRequest> }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      logger.info('Updating request', { id, data });
      const result = await requestService.update(id, data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update request');
      }
      
      if (!result.data) {
        throw new Error('No data returned from update operation');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      // Update the specific request in cache
      queryClient.setQueryData(requestQueryKeys.detail(data.id), data);
      
      // Invalidate lists to ensure they're updated
      queryClient.invalidateQueries({ queryKey: requestQueryKeys.lists() });
      
      // Invalidate business state as it may have changed
      queryClient.invalidateQueries({ queryKey: requestQueryKeys.businessState(data.id) });
      
      logger.info('Request updated successfully', { id: data.id });
    },
    onError: (error) => {
      logger.error('Failed to update request', { error });
    },
    ...mutationOptions,
  });
}

// Hook for processing request workflow
export function useRequestWorkflow(
  mutationOptions?: UseMutationOptions<EnhancedRequest, Error, { id: string; action: string; data?: any }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, action, data }) => {
      logger.info('Processing request workflow', { id, action, data });
      const result = await requestService.processWorkflow(id, action, data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process workflow');
      }
      
      if (!result.data) {
        throw new Error('No data returned from workflow operation');
      }
      
      return result.data;
    },
    onSuccess: (data, { id }) => {
      // Update the specific request in cache
      queryClient.setQueryData(requestQueryKeys.detail(id), data);
      
      // Invalidate lists and business state
      queryClient.invalidateQueries({ queryKey: requestQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestQueryKeys.businessState(id) });
      
      logger.info('Request workflow processed successfully', { id });
    },
    onError: (error) => {
      logger.error('Failed to process request workflow', { error });
    },
    ...mutationOptions,
  });
}

// Hook for deleting requests
export function useDeleteRequest(
  mutationOptions?: UseMutationOptions<boolean, Error, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      logger.info('Deleting request', { id });
      const result = await requestService.delete(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete request');
      }
      
      return result.data || false;
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: requestQueryKeys.detail(id) });
      queryClient.removeQueries({ queryKey: requestQueryKeys.businessState(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: requestQueryKeys.lists() });
      
      logger.info('Request deleted successfully', { id });
    },
    onError: (error) => {
      logger.error('Failed to delete request', { error });
    },
    ...mutationOptions,
  });
}

// Compound hook for comprehensive request management
export function useRequestManagement(id?: string) {
  const requests = useRequests();
  const request = useRequest(id || '', { enabled: !!id });
  const businessState = useRequestBusinessState(id || '', { enabled: !!id });
  
  const createRequest = useCreateRequest();
  const updateRequest = useUpdateRequest();
  const processWorkflow = useRequestWorkflow();
  const deleteRequest = useDeleteRequest();
  
  return {
    // Data
    requests: requests.data || [],
    request: request.data,
    businessState: businessState.data,
    
    // Loading states
    isLoadingRequests: requests.isLoading,
    isLoadingRequest: request.isLoading,
    isLoadingBusinessState: businessState.isLoading,
    
    // Error states
    requestsError: requests.error,
    requestError: request.error,
    businessStateError: businessState.error,
    
    // Mutations
    createRequest: createRequest.mutateAsync,
    updateRequest: updateRequest.mutateAsync,
    processWorkflow: processWorkflow.mutateAsync,
    deleteRequest: deleteRequest.mutateAsync,
    
    // Mutation states
    isCreating: createRequest.isPending,
    isUpdating: updateRequest.isPending,
    isProcessingWorkflow: processWorkflow.isPending,
    isDeleting: deleteRequest.isPending,
    
    // Mutation errors
    createError: createRequest.error,
    updateError: updateRequest.error,
    workflowError: processWorkflow.error,
    deleteError: deleteRequest.error,
    
    // Refetch functions
    refetchRequests: requests.refetch,
    refetchRequest: request.refetch,
    refetchBusinessState: businessState.refetch,
  };
}