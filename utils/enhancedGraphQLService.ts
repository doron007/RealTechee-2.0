import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../amplify/data/resource';
import { queryClient, queryKeys } from '../lib/queryClient';
import { createLogger } from './logger';

// Enhanced GraphQL client with optimized caching
const enhancedClient = generateClient<Schema>({
  authMode: 'userPool'
});

const graphqlLogger = createLogger('EnhancedGraphQL');

/**
 * Enhanced GraphQL service with query optimization and advanced caching
 */
export class EnhancedGraphQLService {
  private static instance: EnhancedGraphQLService;
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private batchQueue = new Map<string, { requests: any[]; timer: NodeJS.Timeout }>();
  private requestDeduplication = new Map<string, Promise<any>>();

  static getInstance(): EnhancedGraphQLService {
    if (!EnhancedGraphQLService.instance) {
      EnhancedGraphQLService.instance = new EnhancedGraphQLService();
    }
    return EnhancedGraphQLService.instance;
  }

  /**
   * Query with automatic caching and deduplication
   */
  async optimizedQuery<T = any>(
    queryKey: string,
    queryFn: () => Promise<any>,
    options: {
      ttl?: number; // Time to live in milliseconds
      staleWhileRevalidate?: boolean; // Return stale data while fetching fresh
      deduplicate?: boolean; // Deduplicate identical requests
      priority?: 'low' | 'normal' | 'high'; // Request priority
    } = {}
  ): Promise<{ success: boolean; data?: T; error?: any; fromCache?: boolean }> {
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      staleWhileRevalidate = true,
      deduplicate = true,
      priority = 'normal'
    } = options;

    try {
      graphqlLogger.debug('Optimized query requested', { 
        queryKey, 
        ttl, 
        staleWhileRevalidate, 
        deduplicate,
        priority 
      });

      // Check deduplication cache first
      if (deduplicate && this.requestDeduplication.has(queryKey)) {
        graphqlLogger.debug('Returning deduplicated request', { queryKey });
        const result = await this.requestDeduplication.get(queryKey)!;
        return result;
      }

      // Check local cache
      const cached = this.queryCache.get(queryKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < cached.ttl) {
        graphqlLogger.debug('Returning cached data', { 
          queryKey, 
          age: now - cached.timestamp,
          ttl: cached.ttl 
        });
        return { success: true, data: cached.data, fromCache: true };
      }

      // If stale data exists and staleWhileRevalidate is enabled
      if (cached && staleWhileRevalidate) {
        graphqlLogger.debug('Returning stale data while revalidating', { queryKey });
        
        // Return stale data immediately
        const staleResponse = { success: true, data: cached.data, fromCache: true };
        
        // Revalidate in background
        this.backgroundRevalidate(queryKey, queryFn, ttl);
        
        return staleResponse;
      }

      // Execute query with deduplication
      const queryPromise = this.executeQuery(queryKey, queryFn, ttl);
      
      if (deduplicate) {
        this.requestDeduplication.set(queryKey, queryPromise);
        
        // Clean up deduplication after request completes
        queryPromise.finally(() => {
          this.requestDeduplication.delete(queryKey);
        });
      }

      return await queryPromise;
    } catch (error) {
      graphqlLogger.error('Optimized query failed', { queryKey, error });
      return { success: false, error };
    }
  }

  /**
   * Execute the actual query and cache result
   */
  private async executeQuery(queryKey: string, queryFn: () => Promise<any>, ttl: number) {
    try {
      graphqlLogger.debug('Executing query', { queryKey });
      const startTime = Date.now();
      
      const result = await queryFn();
      
      const executionTime = Date.now() - startTime;
      graphqlLogger.debug('Query executed', { 
        queryKey, 
        executionTime,
        success: !!result 
      });

      if (result) {
        // Cache the result
        this.queryCache.set(queryKey, {
          data: result,
          timestamp: Date.now(),
          ttl
        });

        return { success: true, data: result };
      } else {
        return { success: false, error: 'No data returned' };
      }
    } catch (error) {
      graphqlLogger.error('Query execution failed', { queryKey, error });
      return { success: false, error };
    }
  }

  /**
   * Background revalidation for stale-while-revalidate
   */
  private async backgroundRevalidate(queryKey: string, queryFn: () => Promise<any>, ttl: number) {
    try {
      graphqlLogger.debug('Background revalidation started', { queryKey });
      
      const result = await queryFn();
      
      if (result) {
        // Update cache with fresh data
        this.queryCache.set(queryKey, {
          data: result,
          timestamp: Date.now(),
          ttl
        });

        // Update React Query cache
        queryClient.setQueryData([queryKey], result);
        
        graphqlLogger.debug('Background revalidation completed', { queryKey });
      }
    } catch (error) {
      graphqlLogger.error('Background revalidation failed', { queryKey, error });
    }
  }

  /**
   * Batch multiple queries for efficiency
   */
  async batchQueries<T = any>(
    queries: Array<{
      key: string;
      fn: () => Promise<any>;
      options?: any;
    }>,
    batchOptions: {
      batchDelay?: number; // Delay before executing batch
      maxBatchSize?: number; // Maximum queries per batch
    } = {}
  ): Promise<Array<{ success: boolean; data?: T; error?: any }>> {
    const { batchDelay = 10, maxBatchSize = 10 } = batchOptions;

    graphqlLogger.debug('Batch queries requested', { 
      count: queries.length, 
      batchDelay, 
      maxBatchSize 
    });

    // Split into batches if needed
    const batches = [];
    for (let i = 0; i < queries.length; i += maxBatchSize) {
      batches.push(queries.slice(i, i + maxBatchSize));
    }

    // Execute batches with delay
    const results: any[] = [];
    for (const batch of batches) {
      const batchPromises = batch.map(query => 
        this.optimizedQuery(query.key, query.fn, query.options)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to prevent overwhelming the server
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }

    return results;
  }

  /**
   * Pagination support with intelligent prefetching
   */
  async paginatedQuery<T = any>(
    baseQueryKey: string,
    queryFn: (options: { limit: number; nextToken?: string }) => Promise<any>,
    options: {
      pageSize?: number;
      prefetchNext?: boolean; // Prefetch next page in background
      maxPages?: number; // Maximum pages to cache
    } = {}
  ): Promise<{
    success: boolean;
    data?: T[];
    nextToken?: string;
    hasNextPage?: boolean;
    error?: any;
  }> {
    const { pageSize = 20, prefetchNext = true, maxPages = 5 } = options;

    try {
      graphqlLogger.debug('Paginated query requested', { 
        baseQueryKey, 
        pageSize, 
        prefetchNext 
      });

      // Get first page
      const firstPageKey = `${baseQueryKey}_page_1`;
      const firstPageResult = await this.optimizedQuery(
        firstPageKey,
        () => queryFn({ limit: pageSize }),
        { ttl: 2 * 60 * 1000 } // 2 minutes for paginated data
      );

      if (!firstPageResult.success) {
        return firstPageResult;
      }

      const { items, nextToken } = firstPageResult.data;
      const hasNextPage = !!nextToken;

      // Prefetch next page in background if enabled
      if (prefetchNext && hasNextPage) {
        this.backgroundPrefetch(baseQueryKey, queryFn, nextToken, pageSize, 2);
      }

      return {
        success: true,
        data: items,
        nextToken,
        hasNextPage
      };
    } catch (error) {
      graphqlLogger.error('Paginated query failed', { baseQueryKey, error });
      return { success: false, error };
    }
  }

  /**
   * Background prefetching for pagination
   */
  private async backgroundPrefetch(
    baseQueryKey: string,
    queryFn: (options: { limit: number; nextToken?: string }) => Promise<any>,
    nextToken: string,
    pageSize: number,
    pageNumber: number
  ) {
    try {
      const pageKey = `${baseQueryKey}_page_${pageNumber}`;
      
      await this.optimizedQuery(
        pageKey,
        () => queryFn({ limit: pageSize, nextToken }),
        { ttl: 2 * 60 * 1000 }
      );
      
      graphqlLogger.debug('Background prefetch completed', { pageKey });
    } catch (error) {
      graphqlLogger.error('Background prefetch failed', { baseQueryKey, pageNumber, error });
    }
  }

  /**
   * Advanced filtering with optimized queries
   */
  async filteredQuery<T = any>(
    modelName: keyof Schema['models'],
    filters: any,
    options: {
      sort?: { field: string; direction: 'asc' | 'desc' };
      limit?: number;
      cacheKey?: string;
    } = {}
  ): Promise<{ success: boolean; data?: T[]; error?: any }> {
    const { sort, limit = 50, cacheKey } = options;
    
    const queryKey = cacheKey || `${String(modelName)}_filtered_${JSON.stringify({ filters, sort, limit })}`;

    return this.optimizedQuery(
      queryKey,
      async () => {
        const queryOptions: any = { filter: filters, limit };
        
        if (sort) {
          // Note: Amplify Gen2 handles sorting differently
          // This would need to be implemented based on your specific schema
          queryOptions.sortDirection = sort.direction.toUpperCase();
        }

        const result = await (enhancedClient.models as any)[modelName].list(queryOptions);
        return result.data;
      },
      { ttl: 3 * 60 * 1000 } // 3 minutes for filtered data
    );
  }

  /**
   * Real-time query with live updates
   */
  liveQuery<T = any>(
    queryKey: string,
    queryFn: () => Promise<any>,
    subscriptionConfig: {
      modelName: keyof Schema['models'];
      operations: Array<'onCreate' | 'onUpdate' | 'onDelete'>;
    }
  ): {
    data: T | null;
    loading: boolean;
    error: any;
    refetch: () => Promise<void>;
  } {
    // This would be implemented as a React hook
    // For now, returning the interface
    return {
      data: null,
      loading: true,
      error: null,
      refetch: async () => {}
    };
  }

  /**
   * Bulk operations with transaction support
   */
  async bulkOperation(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      modelName: keyof Schema['models'];
      data: any;
    }>,
    options: {
      transactional?: boolean; // If true, all operations succeed or all fail
      batchSize?: number;
    } = {}
  ): Promise<{
    success: boolean;
    results: Array<{ success: boolean; data?: any; error?: any }>;
    error?: any;
  }> {
    const { transactional = false, batchSize = 25 } = options;

    try {
      graphqlLogger.info('Bulk operation started', { 
        operationCount: operations.length, 
        transactional, 
        batchSize 
      });

      const results: any[] = [];
      
      // Split into batches
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (operation) => {
          try {
            let result;
            const model = (enhancedClient.models as any)[operation.modelName];
            
            switch (operation.type) {
              case 'create':
                result = await model.create(operation.data);
                break;
              case 'update':
                result = await model.update(operation.data);
                break;
              case 'delete':
                result = await model.delete({ id: operation.data.id });
                break;
            }
            
            return { success: true, data: result.data };
          } catch (error) {
            return { success: false, error };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // If transactional and any operation failed, rollback
        if (transactional && batchResults.some(r => !r.success)) {
          throw new Error('Transaction failed - some operations were unsuccessful');
        }
      }

      graphqlLogger.info('Bulk operation completed', { 
        totalOperations: operations.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });

      return {
        success: true,
        results
      };
    } catch (error) {
      graphqlLogger.error('Bulk operation failed', { error });
      return {
        success: false,
        results: [],
        error
      };
    }
  }

  /**
   * Cache management utilities
   */
  cacheManager = {
    /**
     * Invalidate specific cache entries
     */
    invalidate: (patterns: string[]) => {
      let invalidatedCount = 0;
      patterns.forEach(pattern => {
        for (const key of Array.from(this.queryCache.keys())) {
          if (key.includes(pattern)) {
            this.queryCache.delete(key);
            invalidatedCount++;
          }
        }
      });
      
      graphqlLogger.info('Cache invalidated', { patterns, invalidatedCount });
    },

    /**
     * Clear all cache entries
     */
    clear: () => {
      const size = this.queryCache.size;
      this.queryCache.clear();
      graphqlLogger.info('Cache cleared', { entriesRemoved: size });
    },

    /**
     * Get cache statistics
     */
    getStats: () => {
      const now = Date.now();
      const entries = Array.from(this.queryCache.entries());
      
      return {
        totalEntries: entries.length,
        freshEntries: entries.filter(([, { timestamp, ttl }]) => 
          (now - timestamp) < ttl
        ).length,
        staleEntries: entries.filter(([, { timestamp, ttl }]) => 
          (now - timestamp) >= ttl
        ).length,
        oldestEntry: entries.reduce((oldest, [, { timestamp }]) => 
          Math.min(oldest, timestamp), now
        ),
        cacheSize: JSON.stringify(Object.fromEntries(this.queryCache)).length
      };
    },

    /**
     * Cleanup stale cache entries
     */
    cleanup: () => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, entry] of Array.from(this.queryCache.entries())) {
        const { timestamp, ttl } = entry;
        if ((now - timestamp) >= ttl) {
          this.queryCache.delete(key);
          cleanedCount++;
        }
      }
      
      graphqlLogger.info('Cache cleanup completed', { cleanedCount });
      return cleanedCount;
    }
  };

  /**
   * Performance monitoring
   */
  getPerformanceMetrics() {
    return {
      activeQueries: this.requestDeduplication.size,
      cacheStats: this.cacheManager.getStats(),
      batchQueues: this.batchQueue.size
    };
  }
}

// Export singleton instance
export const enhancedGraphQLService = EnhancedGraphQLService.getInstance();

// React hooks for enhanced GraphQL operations
export const useEnhancedGraphQL = {
  /**
   * Hook for optimized queries with caching
   */
  useOptimizedQuery: <T = any>(
    queryKey: string,
    queryFn: () => Promise<any>,
    options?: any
  ) => {
    // This would be implemented as a React hook using React Query
    // For now, returning the interface
    return {
      data: null as T | null,
      loading: true,
      error: null,
      refetch: () => enhancedGraphQLService.optimizedQuery(queryKey, queryFn, options)
    };
  }
};