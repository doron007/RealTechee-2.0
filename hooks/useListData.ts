import { useState, useEffect } from 'react';

export interface ListDataState<T> {
  items: T[];
  filteredItems: T[];
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export interface ListFilter {
  [key: string]: any;
}

export interface UseListDataOptions<T> {
  fetchFunction: (filter?: ListFilter) => Promise<{ 
    success: boolean; 
    data?: T[]; 
    totalCount?: number; 
    error?: any 
  }>;
  itemsPerPage?: number;
  defaultFilter?: ListFilter;
  dependencies?: any[];
}

/**
 * Generic hook for list pages with filtering and pagination
 * Follows the same pattern as ProjectsGridSection for consistency
 */
export function useListData<T>({
  fetchFunction,
  itemsPerPage = 6,
  defaultFilter = {},
  dependencies = []
}: UseListDataOptions<T>) {
  const [state, setState] = useState<ListDataState<T>>({
    items: [],
    filteredItems: [],
    currentPage: 1,
    totalPages: 0,
    loading: true,
    error: null
  });

  const [filter, setFilter] = useState<ListFilter>(defaultFilter);

  // Calculate paginated items
  const indexOfLastItem = state.currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = state.filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  // Load data function
  const loadData = async (currentFilter: ListFilter = filter) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchFunction(currentFilter);
      
      if (result.success && result.data) {
        const totalPages = Math.ceil(result.data.length / itemsPerPage);
        
        setState(prev => ({
          ...prev,
          items: result.data || [],
          filteredItems: result.data || [],
          totalPages,
          loading: false,
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          items: [],
          filteredItems: [],
          totalPages: 0,
          loading: false,
          error: result.error?.message || 'No items found matching your criteria.'
        }));
      }
    } catch (error) {
      console.error('Error loading list data:', error);
      setState(prev => ({
        ...prev,
        items: [],
        filteredItems: [],
        totalPages: 0,
        loading: false,
        error: 'Failed to load data. Please try again later.'
      }));
    }
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      setState(prev => ({ ...prev, currentPage: page }));
    }
  };

  const goToPreviousPage = () => {
    if (state.currentPage > 1) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  const goToNextPage = () => {
    if (state.currentPage < state.totalPages) {
      setState(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  // Filter update handler
  const updateFilter = (newFilter: ListFilter) => {
    setFilter(newFilter);
    setState(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  // Load data when dependencies change
  useEffect(() => {
    loadData();
  }, [filter, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    ...state,
    currentItems,
    filter,
    
    // Actions
    loadData: () => loadData(filter),
    updateFilter,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    
    // Computed values
    hasNextPage: state.currentPage < state.totalPages,
    hasPreviousPage: state.currentPage > 1,
    totalItems: state.filteredItems.length
  };
}