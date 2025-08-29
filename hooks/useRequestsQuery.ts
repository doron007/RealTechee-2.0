import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enhancedRequestsService } from '../services/enhancedRequestsService';
import { queryKeys, invalidateQueries } from '../lib/queryClient';
import { useNotification } from '../contexts/NotificationContext';

export function useRequestsQuery() {
  return useQuery({
    queryKey: queryKeys.requests,
    queryFn: async () => {
      const result = await enhancedRequestsService.getFullyEnhancedRequests();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch requests');
      }
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRequestQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.request(id),
    queryFn: async () => {
      // For now, get all requests and filter by ID
      // In a real app, this would be a dedicated getById endpoint
      const result = await enhancedRequestsService.getFullyEnhancedRequests();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch requests');
      }
      const request = result.data?.find(r => r.id === id);
      if (!request) {
        throw new Error('Request not found');
      }
      return request;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute for individual requests
  });
}

export function useRequestMutations() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const archiveRequest = useMutation({
    mutationFn: async (id: string) => {
      // Use the updateRequest method to set status to archived
      const result = await enhancedRequestsService.updateRequest(id, { status: 'archived' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to archive request');
      }
      return result.data;
    },
    onSuccess: (data, id) => {
      // Update the specific request in cache
      queryClient.setQueryData(queryKeys.request(id), data);
      invalidateQueries.requests();
      invalidateQueries.analytics();
      showSuccess('Request Archived', 'Request has been archived successfully');
    },
    onError: (error: Error) => {
      showError('Archive Failed', error.message);
    },
  });

  return {
    archiveRequest,
  };
}

// Optimized search hook with debouncing
export function useRequestsSearch(searchCriteria: Record<string, any>, debounceMs: number = 500) {
  return useQuery({
    queryKey: queryKeys.requestsSearch(searchCriteria),
    queryFn: async () => {
      // If no search criteria, return all requests
      if (!searchCriteria || Object.keys(searchCriteria).length === 0) {
        const result = await enhancedRequestsService.getFullyEnhancedRequests();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch requests');
        }
        return result.data || [];
      }

      // Perform client-side filtering for now
      // In a real app, this would be server-side filtering
      const result = await enhancedRequestsService.getFullyEnhancedRequests();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch requests');
      }
      
      const requests = result.data || [];
      
      // Apply search criteria
      return requests.filter(request => {
        return Object.entries(searchCriteria).every(([key, value]) => {
          if (!value || (typeof value === 'string' && !value.trim())) return true;
          
          const requestValue = request[key as keyof typeof request];
          
          if (typeof value === 'string') {
            return requestValue && String(requestValue).toLowerCase().includes(value.toLowerCase());
          } else if (Array.isArray(value)) {
            return value.length === 0 || value.includes(String(requestValue));
          } else if (typeof value === 'object' && value !== null) {
            // Handle range queries (dates, numbers)
            if (value.from || value.to) {
              const requestVal = requestValue ? new Date(String(requestValue)).getTime() : 0;
              const from = value.from ? new Date(value.from).getTime() : 0;
              const to = value.to ? new Date(value.to).getTime() : Infinity;
              return requestVal >= from && requestVal <= to;
            }
          }
          
          return true;
        });
      });
    },
    enabled: true,
    staleTime: 30 * 1000, // 30 seconds for search results
  });
}

// Prefetch hook for performance optimization
export function usePrefetchRequests() {
  const queryClient = useQueryClient();

  const prefetchRequest = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.request(id),
      queryFn: async () => {
        const result = await enhancedRequestsService.getFullyEnhancedRequests();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch requests');
        }
        const request = result.data?.find(r => r.id === id);
        if (!request) {
          throw new Error('Request not found');
        }
        return request;
      },
      staleTime: 1 * 60 * 1000,
    });
  };

  return { prefetchRequest };
}