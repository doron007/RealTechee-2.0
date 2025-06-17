import { useState, useEffect } from 'react';

export interface AmplifyDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseAmplifyDataOptions<T> {
  fetchFunction: () => Promise<{ success: boolean; data?: T; error?: any }>;
  dependencies?: any[];
  immediate?: boolean;
}

/**
 * Generic hook for loading data from Amplify APIs
 * Provides consistent loading, error handling, and data management patterns
 */
export function useAmplifyData<T>({
  fetchFunction,
  dependencies = [],
  immediate = true
}: UseAmplifyDataOptions<T>): AmplifyDataState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<AmplifyDataState<T>>({
    data: null,
    loading: immediate,
    error: null
  });

  const loadData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchFunction();
      
      if (result.success) {
        setState({
          data: result.data || null,
          loading: false,
          error: null
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: result.error?.message || 'Failed to load data'
        });
      }
    } catch (error) {
      console.error('Error in useAmplifyData:', error);
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  };

  useEffect(() => {
    if (immediate) {
      loadData();
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    refetch: loadData
  };
}

/**
 * Hook for loading paginated data from Amplify APIs
 */
export interface PaginatedDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
}

export interface UsePaginatedAmplifyDataOptions<T> {
  fetchFunction: (options: { limit?: number; nextToken?: string }) => Promise<{
    success: boolean;
    data?: T[];
    nextToken?: string;
    totalCount?: number;
    error?: any;
  }>;
  pageSize?: number;
  dependencies?: any[];
}

export function usePaginatedAmplifyData<T>({
  fetchFunction,
  pageSize = 20,
  dependencies = []
}: UsePaginatedAmplifyDataOptions<T>): PaginatedDataState<T> & { 
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<PaginatedDataState<T> & { nextToken?: string }>({
    data: [],
    loading: true,
    error: null,
    hasMore: true,
    totalCount: 0,
    nextToken: undefined
  });

  const loadData = async (isLoadMore = false) => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      // Reset data if not loading more
      ...(isLoadMore ? {} : { data: [], nextToken: undefined })
    }));

    try {
      const result = await fetchFunction({
        limit: pageSize,
        nextToken: isLoadMore ? state.nextToken : undefined
      });
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          data: isLoadMore ? [...prev.data, ...(result.data || [])] : (result.data || []),
          loading: false,
          error: null,
          hasMore: !!result.nextToken,
          totalCount: result.totalCount || 0,
          nextToken: result.nextToken
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error?.message || 'Failed to load data'
        }));
      }
    } catch (error) {
      console.error('Error in usePaginatedAmplifyData:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }));
    }
  };

  useEffect(() => {
    loadData(false);
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    totalCount: state.totalCount,
    loadMore: () => loadData(true),
    refetch: () => loadData(false)
  };
}