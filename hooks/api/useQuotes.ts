/**
 * React Query hooks for Quote operations
 * Provides clean frontend interface with loading states and error handling
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { quoteService, EnhancedQuote, QuoteCreateData, QuoteBusinessFilter } from '../../services/business/QuoteService';
import { ServiceQueryOptions } from '../../services/interfaces/IBaseService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('useQuotes');

// Query keys for consistent caching
export const quoteQueryKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteQueryKeys.all, 'list'] as const,
  list: (filters?: QuoteBusinessFilter) => [...quoteQueryKeys.lists(), filters] as const,
  details: () => [...quoteQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...quoteQueryKeys.details(), id] as const,
  businessState: (id: string) => [...quoteQueryKeys.detail(id), 'businessState'] as const,
  byRequest: (requestId: string) => [...quoteQueryKeys.all, 'byRequest', requestId] as const,
  expiring: (days: number) => [...quoteQueryKeys.all, 'expiring', days] as const,
};

// Hook for fetching all quotes
export function useQuotes(
  options?: ServiceQueryOptions<QuoteBusinessFilter>,
  queryOptions?: Omit<UseQueryOptions<EnhancedQuote[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: quoteQueryKeys.list(options?.filter),
    queryFn: async () => {
      logger.debug('Fetching quotes', { options });
      const result = await quoteService.findAll(options);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch quotes');
      }
      
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...queryOptions,
  });
}

// Hook for fetching a single quote
export function useQuote(
  id: string,
  queryOptions?: Omit<UseQueryOptions<EnhancedQuote>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: quoteQueryKeys.detail(id),
    queryFn: async () => {
      logger.debug('Fetching quote', { id });
      const result = await quoteService.findById(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch quote');
      }
      
      if (!result.data) {
        throw new Error('Quote not found');
      }
      
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for fetching quotes by request
export function useQuotesByRequest(
  requestId: string,
  queryOptions?: Omit<UseQueryOptions<EnhancedQuote[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: quoteQueryKeys.byRequest(requestId),
    queryFn: async () => {
      logger.debug('Fetching quotes by request', { requestId });
      const result = await quoteService.findByRequest(requestId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch quotes');
      }
      
      return result.data || [];
    },
    enabled: !!requestId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for fetching expiring quotes
export function useExpiringQuotes(
  days: number = 7,
  queryOptions?: Omit<UseQueryOptions<EnhancedQuote[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: quoteQueryKeys.expiring(days),
    queryFn: async () => {
      logger.debug('Fetching expiring quotes', { days });
      const result = await quoteService.findExpiring(days);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch expiring quotes');
      }
      
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for expiring quotes)
    gcTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for fetching quote business state
export function useQuoteBusinessState(
  id: string,
  queryOptions?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: quoteQueryKeys.businessState(id),
    queryFn: async () => {
      logger.debug('Fetching quote business state', { id });
      const result = await quoteService.getBusinessState(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch quote business state');
      }
      
      return result.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for creating quotes
export function useCreateQuote(
  mutationOptions?: UseMutationOptions<EnhancedQuote, Error, QuoteCreateData>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: QuoteCreateData) => {
      logger.info('Creating quote', { data });
      const result = await quoteService.create(data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create quote');
      }
      
      if (!result.data) {
        throw new Error('No data returned from create operation');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch quotes list
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.lists() });
      
      // Add the new quote to the cache
      queryClient.setQueryData(quoteQueryKeys.detail(data.id), data);
      
      // If associated with a request, invalidate that cache too
      if (data.requestId) {
        queryClient.invalidateQueries({ queryKey: quoteQueryKeys.byRequest(data.requestId) });
      }
      
      logger.info('Quote created successfully', { id: data.id });
    },
    onError: (error) => {
      logger.error('Failed to create quote', { error });
    },
    ...mutationOptions,
  });
}

// Hook for updating quotes
export function useUpdateQuote(
  mutationOptions?: UseMutationOptions<EnhancedQuote, Error, { id: string; data: Partial<EnhancedQuote> }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      logger.info('Updating quote', { id, data });
      const result = await quoteService.update(id, data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update quote');
      }
      
      if (!result.data) {
        throw new Error('No data returned from update operation');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      // Update the specific quote in cache
      queryClient.setQueryData(quoteQueryKeys.detail(data.id), data);
      
      // Invalidate lists to ensure they're updated
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.lists() });
      
      // Invalidate business state as it may have changed
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.businessState(data.id) });
      
      // Invalidate expiring quotes if this might affect expiration
      queryClient.invalidateQueries({ queryKey: [...quoteQueryKeys.all, 'expiring'] });
      
      logger.info('Quote updated successfully', { id: data.id });
    },
    onError: (error) => {
      logger.error('Failed to update quote', { error });
    },
    ...mutationOptions,
  });
}

// Hook for processing quote workflow
export function useQuoteWorkflow(
  mutationOptions?: UseMutationOptions<EnhancedQuote, Error, { id: string; action: string; data?: any }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, action, data }) => {
      logger.info('Processing quote workflow', { id, action, data });
      const result = await quoteService.processWorkflow(id, action, data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process workflow');
      }
      
      if (!result.data) {
        throw new Error('No data returned from workflow operation');
      }
      
      return result.data;
    },
    onSuccess: (data, { id }) => {
      // Update the specific quote in cache
      queryClient.setQueryData(quoteQueryKeys.detail(id), data);
      
      // Invalidate lists and business state
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.businessState(id) });
      
      // Invalidate expiring quotes if status changed
      queryClient.invalidateQueries({ queryKey: [...quoteQueryKeys.all, 'expiring'] });
      
      logger.info('Quote workflow processed successfully', { id });
    },
    onError: (error) => {
      logger.error('Failed to process quote workflow', { error });
    },
    ...mutationOptions,
  });
}

// Hook for duplicating quotes
export function useDuplicateQuote(
  mutationOptions?: UseMutationOptions<EnhancedQuote, Error, { id: string; modifications?: Partial<QuoteCreateData> }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, modifications }) => {
      logger.info('Duplicating quote', { id, modifications });
      const result = await quoteService.duplicateQuote(id, modifications);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to duplicate quote');
      }
      
      if (!result.data) {
        throw new Error('No data returned from duplicate operation');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate lists to include the new quote
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.lists() });
      
      // Add the new quote to the cache
      queryClient.setQueryData(quoteQueryKeys.detail(data.id), data);
      
      logger.info('Quote duplicated successfully', { id: data.id });
    },
    onError: (error) => {
      logger.error('Failed to duplicate quote', { error });
    },
    ...mutationOptions,
  });
}

// Hook for deleting quotes
export function useDeleteQuote(
  mutationOptions?: UseMutationOptions<boolean, Error, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      logger.info('Deleting quote', { id });
      const result = await quoteService.delete(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete quote');
      }
      
      return result.data || false;
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: quoteQueryKeys.detail(id) });
      queryClient.removeQueries({ queryKey: quoteQueryKeys.businessState(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: quoteQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...quoteQueryKeys.all, 'byRequest'] });
      queryClient.invalidateQueries({ queryKey: [...quoteQueryKeys.all, 'expiring'] });
      
      logger.info('Quote deleted successfully', { id });
    },
    onError: (error) => {
      logger.error('Failed to delete quote', { error });
    },
    ...mutationOptions,
  });
}

// Compound hook for comprehensive quote management
export function useQuoteManagement(id?: string) {
  const quotes = useQuotes();
  const quote = useQuote(id || '', { enabled: !!id });
  const businessState = useQuoteBusinessState(id || '', { enabled: !!id });
  const expiringQuotes = useExpiringQuotes();
  
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const processWorkflow = useQuoteWorkflow();
  const duplicateQuote = useDuplicateQuote();
  const deleteQuote = useDeleteQuote();
  
  return {
    // Data
    quotes: quotes.data || [],
    quote: quote.data,
    businessState: businessState.data,
    expiringQuotes: expiringQuotes.data || [],
    
    // Loading states
    isLoadingQuotes: quotes.isLoading,
    isLoadingQuote: quote.isLoading,
    isLoadingBusinessState: businessState.isLoading,
    isLoadingExpiringQuotes: expiringQuotes.isLoading,
    
    // Error states
    quotesError: quotes.error,
    quoteError: quote.error,
    businessStateError: businessState.error,
    expiringQuotesError: expiringQuotes.error,
    
    // Mutations
    createQuote: createQuote.mutateAsync,
    updateQuote: updateQuote.mutateAsync,
    processWorkflow: processWorkflow.mutateAsync,
    duplicateQuote: duplicateQuote.mutateAsync,
    deleteQuote: deleteQuote.mutateAsync,
    
    // Mutation states
    isCreating: createQuote.isPending,
    isUpdating: updateQuote.isPending,
    isProcessingWorkflow: processWorkflow.isPending,
    isDuplicating: duplicateQuote.isPending,
    isDeleting: deleteQuote.isPending,
    
    // Mutation errors
    createError: createQuote.error,
    updateError: updateQuote.error,
    workflowError: processWorkflow.error,
    duplicateError: duplicateQuote.error,
    deleteError: deleteQuote.error,
    
    // Refetch functions
    refetchQuotes: quotes.refetch,
    refetchQuote: quote.refetch,
    refetchBusinessState: businessState.refetch,
    refetchExpiringQuotes: expiringQuotes.refetch,
  };
}