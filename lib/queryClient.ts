import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes after component unmounts
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect unless data is stale
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // Projects
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  projectsSearch: (criteria: Record<string, any>) => ['projects', 'search', criteria] as const,
  
  // Quotes
  quotes: ['quotes'] as const,
  quote: (id: string) => ['quotes', id] as const,
  quotesSearch: (criteria: Record<string, any>) => ['quotes', 'search', criteria] as const,
  
  // Requests
  requests: ['requests'] as const,
  request: (id: string) => ['requests', id] as const,
  requestsSearch: (criteria: Record<string, any>) => ['requests', 'search', criteria] as const,
  
  // Analytics
  analytics: ['analytics'] as const,
  analyticsOverview: ['analytics', 'overview'] as const,
  analyticsProjects: ['analytics', 'projects'] as const,
  analyticsQuotes: ['analytics', 'quotes'] as const,
  analyticsRequests: ['analytics', 'requests'] as const,
  analyticsRevenue: ['analytics', 'revenue'] as const,
  analyticsTimeRange: (range: string) => ['analytics', 'range', range] as const,
  analyticsFilterOptions: ['analytics', 'filter-options'] as const,
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  projects: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  quotes: () => queryClient.invalidateQueries({ queryKey: queryKeys.quotes }),
  requests: () => queryClient.invalidateQueries({ queryKey: queryKeys.requests }),
  analytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics }),
  all: () => queryClient.invalidateQueries(),
};

// Prefetch helpers for performance optimization
export const prefetchQueries = {
  projects: () => queryClient.prefetchQuery({
    queryKey: queryKeys.projects,
    // We'll implement this in the enhanced service
    queryFn: () => import('../services/business/enhancedProjectsService').then(m => m.enhancedProjectsService.getFullyEnhancedProjects()),
  }),
  
  analytics: () => queryClient.prefetchQuery({
    queryKey: queryKeys.analyticsOverview,
    // We'll implement this in the analytics service
    queryFn: () => import('../services/analytics/analyticsService').then(m => m.analyticsService.getOverviewMetrics()),
  }),
};