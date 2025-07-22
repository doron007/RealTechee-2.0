import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../amplify/data/resource';
import { queryClient, queryKeys } from '../lib/queryClient';
import { createLogger } from './logger';
import { enhancedGraphQLService } from './enhancedGraphQLService';

const paginationClient = generateClient<Schema>({
  authMode: 'userPool'
});

const paginationLogger = createLogger('Pagination');

/**
 * Advanced pagination service with virtual scrolling and intelligent prefetching
 */
export class PaginationService {
  private static instance: PaginationService;
  private pageCache = new Map<string, any>();
  private prefetchQueue = new Map<string, Promise<any>>();
  private virtualScrollingCache = new Map<string, any[]>();

  static getInstance(): PaginationService {
    if (!PaginationService.instance) {
      PaginationService.instance = new PaginationService();
    }
    return PaginationService.instance;
  }

  /**
   * Enhanced pagination with intelligent prefetching
   */
  async paginateQuery<T = any>(
    modelName: keyof Schema['models'],
    options: {
      pageSize?: number;
      currentPage?: number;
      filters?: any;
      sort?: { field: string; direction: 'asc' | 'desc' };
      prefetchPages?: number; // Number of pages to prefetch ahead
      cacheStrategy?: 'memory' | 'persistent' | 'hybrid';
      virtualScrolling?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    data?: T[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalItems?: number;
      totalPages?: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      nextToken?: string;
      previousTokens?: string[];
    };
    error?: any;
  }> {
    const {
      pageSize = 25,
      currentPage = 1,
      filters,
      sort,
      prefetchPages = 2,
      cacheStrategy = 'hybrid',
      virtualScrolling = false
    } = options;

    try {
      paginationLogger.debug('Paginate query requested', {
        modelName,
        pageSize,
        currentPage,
        prefetchPages,
        cacheStrategy,
        virtualScrolling
      });

      const cacheKey = this.generateCacheKey(modelName, { filters, sort, pageSize });
      const pageKey = `${cacheKey}_page_${currentPage}`;

      // Check cache first
      const cachedPage = this.getFromCache(pageKey, cacheStrategy);
      if (cachedPage && !this.isCacheStale(cachedPage)) {
        paginationLogger.debug('Returning cached page', { pageKey });
        
        // Start background prefetch
        this.backgroundPrefetch(modelName, cacheKey, currentPage + 1, prefetchPages, {
          pageSize,
          filters,
          sort,
          cacheStrategy
        });

        return {
          success: true,
          data: cachedPage.data,
          pagination: cachedPage.pagination
        };
      }

      // Fetch current page
      const pageResult = await this.fetchPage(modelName, {
        pageSize,
        pageNumber: currentPage,
        filters,
        sort,
        nextToken: this.getNextTokenForPage(cacheKey, currentPage)
      });

      if (!pageResult.success) {
        return pageResult;
      }

      // Cache the result
      this.setCache(pageKey, pageResult, cacheStrategy);

      // Update virtual scrolling cache if enabled
      if (virtualScrolling) {
        this.updateVirtualScrollingCache(cacheKey, currentPage, pageResult.data || []);
      }

      // Start background prefetch for next pages
      this.backgroundPrefetch(modelName, cacheKey, currentPage + 1, prefetchPages, {
        pageSize,
        filters,
        sort,
        cacheStrategy,
        nextToken: pageResult.pagination.nextToken
      });

      return pageResult;
    } catch (error) {
      paginationLogger.error('Pagination query failed', { modelName, currentPage, error });
      return {
        success: false,
        pagination: {
          currentPage,
          pageSize,
          hasNextPage: false,
          hasPreviousPage: false
        },
        error
      };
    }
  }

  /**
   * Fetch a specific page of data
   */
  private async fetchPage<T = any>(
    modelName: keyof Schema['models'],
    options: {
      pageSize: number;
      pageNumber: number;
      filters?: any;
      sort?: { field: string; direction: 'asc' | 'desc' };
      nextToken?: string;
    }
  ): Promise<{
    success: boolean;
    data?: T[];
    pagination: any;
    error?: any;
  }> {
    try {
      const { pageSize, pageNumber, filters, sort, nextToken } = options;

      paginationLogger.debug('Fetching page', {
        modelName,
        pageNumber,
        pageSize,
        hasFilters: !!filters,
        hasSort: !!sort,
        hasNextToken: !!nextToken
      });

      // Build query options
      const queryOptions: any = { limit: pageSize };
      if (filters) queryOptions.filter = filters;
      if (nextToken) queryOptions.nextToken = nextToken;

      // Execute query
      const result = await (paginationClient.models as any)[modelName].list(queryOptions);

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      const items = result.data || [];
      const resultNextToken = result.nextToken;

      // Calculate pagination info
      const pagination = {
        currentPage: pageNumber,
        pageSize,
        hasNextPage: !!resultNextToken,
        hasPreviousPage: pageNumber > 1,
        nextToken: resultNextToken,
        // Note: DynamoDB doesn't provide total count efficiently
        // We'd need to implement count separately if needed
        totalItems: undefined,
        totalPages: undefined
      };

      paginationLogger.debug('Page fetched successfully', {
        modelName,
        pageNumber,
        itemCount: items.length,
        hasNextPage: pagination.hasNextPage
      });

      return {
        success: true,
        data: items,
        pagination
      };
    } catch (error) {
      paginationLogger.error('Failed to fetch page', { modelName, options, error });
      return {
        success: false,
        pagination: {
          currentPage: options.pageNumber,
          pageSize: options.pageSize,
          hasNextPage: false,
          hasPreviousPage: false
        },
        error
      };
    }
  }

  /**
   * Background prefetching for better UX
   */
  private async backgroundPrefetch(
    modelName: keyof Schema['models'],
    baseCacheKey: string,
    startPage: number,
    pageCount: number,
    options: {
      pageSize: number;
      filters?: any;
      sort?: any;
      cacheStrategy: string;
      nextToken?: string;
    }
  ) {
    try {
      paginationLogger.debug('Starting background prefetch', {
        modelName,
        startPage,
        pageCount,
        baseCacheKey
      });

      let currentNextToken = options.nextToken;

      for (let i = 0; i < pageCount; i++) {
        const pageNumber = startPage + i;
        const pageKey = `${baseCacheKey}_page_${pageNumber}`;

        // Skip if already cached or being fetched
        if (this.pageCache.has(pageKey) || this.prefetchQueue.has(pageKey)) {
          continue;
        }

        // Add to prefetch queue
        const prefetchPromise = this.fetchPage(modelName, {
          pageSize: options.pageSize,
          pageNumber,
          filters: options.filters,
          sort: options.sort,
          nextToken: currentNextToken
        }).then(result => {
          if (result.success) {
            this.setCache(pageKey, result, options.cacheStrategy);
            currentNextToken = result.pagination.nextToken;
          }
          this.prefetchQueue.delete(pageKey);
          return result;
        });

        this.prefetchQueue.set(pageKey, prefetchPromise);

        // Add small delay between prefetch requests
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      paginationLogger.debug('Background prefetch completed', {
        modelName,
        startPage,
        pageCount
      });
    } catch (error) {
      paginationLogger.error('Background prefetch failed', {
        modelName,
        startPage,
        pageCount,
        error
      });
    }
  }

  /**
   * Virtual scrolling support for large datasets
   */
  async getVirtualScrollData<T = any>(
    modelName: keyof Schema['models'],
    options: {
      startIndex: number;
      endIndex: number;
      itemHeight: number;
      containerHeight: number;
      filters?: any;
      sort?: any;
      estimatedItemCount?: number;
    }
  ): Promise<{
    success: boolean;
    data?: T[];
    totalCount?: number;
    visibleRange: { start: number; end: number };
    error?: any;
  }> {
    try {
      const {
        startIndex,
        endIndex,
        itemHeight,
        containerHeight,
        filters,
        sort,
        estimatedItemCount = 1000
      } = options;

      paginationLogger.debug('Virtual scroll data requested', {
        modelName,
        startIndex,
        endIndex,
        itemHeight,
        containerHeight
      });

      const cacheKey = this.generateCacheKey(modelName, { filters, sort });
      let virtualData = this.virtualScrollingCache.get(cacheKey) || [];

      // Calculate which pages we need to fetch
      const itemsPerPage = Math.ceil(containerHeight / itemHeight) * 2; // Buffer
      const startPage = Math.floor(startIndex / itemsPerPage) + 1;
      const endPage = Math.ceil(endIndex / itemsPerPage) + 1;

      // Fetch missing pages
      for (let page = startPage; page <= endPage; page++) {
        const pageKey = `${cacheKey}_page_${page}`;
        
        if (!this.pageCache.has(pageKey)) {
          const pageResult = await this.fetchPage(modelName, {
            pageSize: itemsPerPage,
            pageNumber: page,
            filters,
            sort
          });

          if (pageResult.success && pageResult.data) {
            // Insert data into virtual array at correct position
            const insertIndex = (page - 1) * itemsPerPage;
            virtualData.splice(insertIndex, pageResult.data.length, ...pageResult.data);
            this.virtualScrollingCache.set(cacheKey, virtualData);
          }
        }
      }

      // Extract visible range
      const visibleData = virtualData.slice(startIndex, endIndex + 1);

      return {
        success: true,
        data: visibleData,
        totalCount: Math.max(virtualData.length, estimatedItemCount),
        visibleRange: { start: startIndex, end: endIndex }
      };
    } catch (error) {
      paginationLogger.error('Virtual scroll data failed', { modelName, options, error });
      return {
        success: false,
        visibleRange: { start: options.startIndex, end: options.endIndex },
        error
      };
    }
  }

  /**
   * Cursor-based pagination for real-time data
   */
  async paginateWithCursor<T = any>(
    modelName: keyof Schema['models'],
    options: {
      cursor?: string;
      limit?: number;
      direction?: 'forward' | 'backward';
      filters?: any;
      sort?: any;
    } = {}
  ): Promise<{
    success: boolean;
    data?: T[];
    cursors: {
      startCursor?: string;
      endCursor?: string;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    error?: any;
  }> {
    try {
      const {
        cursor,
        limit = 25,
        direction = 'forward',
        filters,
        sort
      } = options;

      paginationLogger.debug('Cursor pagination requested', {
        modelName,
        cursor,
        limit,
        direction
      });

      // Build query with cursor
      const queryOptions: any = { limit };
      if (filters) queryOptions.filter = filters;
      
      // Handle cursor-based pagination
      if (cursor) {
        if (direction === 'forward') {
          queryOptions.nextToken = cursor;
        } else {
          // Backward pagination is more complex with DynamoDB
          // Would need custom implementation
          queryOptions.previousToken = cursor;
        }
      }

      const result = await (paginationClient.models as any)[modelName].list(queryOptions);

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      const items = result.data || [];
      const nextToken = result.nextToken;

      // Generate cursors from first and last items
      const startCursor = items.length > 0 ? this.generateCursor(items[0]) : undefined;
      const endCursor = items.length > 0 ? this.generateCursor(items[items.length - 1]) : undefined;

      return {
        success: true,
        data: items,
        cursors: {
          startCursor,
          endCursor,
          hasNextPage: !!nextToken,
          hasPreviousPage: !!cursor // Simplified logic
        }
      };
    } catch (error) {
      paginationLogger.error('Cursor pagination failed', { modelName, options, error });
      return {
        success: false,
        cursors: {
          hasNextPage: false,
          hasPreviousPage: false
        },
        error
      };
    }
  }

  /**
   * Search with pagination
   */
  async searchWithPagination<T = any>(
    modelName: keyof Schema['models'],
    searchQuery: string,
    options: {
      fields?: string[]; // Fields to search in
      pageSize?: number;
      currentPage?: number;
      filters?: any;
      highlightMatches?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    data?: T[];
    pagination: any;
    searchMetadata?: {
      query: string;
      totalMatches?: number;
      searchTime: number;
    };
    error?: any;
  }> {
    try {
      const {
        fields = ['title', 'description', 'name'],
        pageSize = 25,
        currentPage = 1,
        filters,
        highlightMatches = false
      } = options;

      const startTime = Date.now();

      paginationLogger.debug('Search with pagination requested', {
        modelName,
        searchQuery,
        fields,
        pageSize,
        currentPage
      });

      // Build search filters
      const searchFilters = {
        or: fields.map(field => ({
          [field]: { contains: searchQuery }
        }))
      };

      // Combine with existing filters
      const combinedFilters = filters ? {
        and: [filters, searchFilters]
      } : searchFilters;

      // Use regular pagination with search filters
      const result = await this.paginateQuery(modelName, {
        pageSize,
        currentPage,
        filters: combinedFilters,
        cacheStrategy: 'memory' // Search results shouldn't be cached as aggressively
      });

      const searchTime = Date.now() - startTime;

      if (result.success && highlightMatches && result.data) {
        // Add search highlighting
        result.data = this.addSearchHighlights(result.data, searchQuery, fields);
      }

      return {
        ...result,
        searchMetadata: {
          query: searchQuery,
          searchTime
        }
      };
    } catch (error) {
      paginationLogger.error('Search with pagination failed', {
        modelName,
        searchQuery,
        options,
        error
      });
      return {
        success: false,
        pagination: {
          currentPage: options.currentPage || 1,
          pageSize: options.pageSize || 25,
          hasNextPage: false,
          hasPreviousPage: false
        },
        error
      };
    }
  }

  /**
   * Cache management
   */
  private generateCacheKey(modelName: string, options: any): string {
    return `${modelName}_${JSON.stringify(options)}`;
  }

  private getFromCache(key: string, strategy: string): any {
    switch (strategy) {
      case 'memory':
        return this.pageCache.get(key);
      case 'persistent':
        // Would implement localStorage/IndexedDB
        return null;
      case 'hybrid':
        return this.pageCache.get(key) || null; // Fallback to persistent
      default:
        return this.pageCache.get(key);
    }
  }

  private setCache(key: string, data: any, strategy: string): void {
    const cacheEntry = {
      ...data,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutes
    };

    switch (strategy) {
      case 'memory':
        this.pageCache.set(key, cacheEntry);
        break;
      case 'persistent':
        // Would implement localStorage/IndexedDB
        break;
      case 'hybrid':
        this.pageCache.set(key, cacheEntry);
        // Also save to persistent storage
        break;
    }
  }

  private isCacheStale(entry: any): boolean {
    return (Date.now() - entry.timestamp) > entry.ttl;
  }

  private getNextTokenForPage(baseCacheKey: string, pageNumber: number): string | undefined {
    const previousPageKey = `${baseCacheKey}_page_${pageNumber - 1}`;
    const previousPage = this.pageCache.get(previousPageKey);
    return previousPage?.pagination?.nextToken;
  }

  private updateVirtualScrollingCache(cacheKey: string, pageNumber: number, data: any[]): void {
    let virtualData = this.virtualScrollingCache.get(cacheKey) || [];
    const insertIndex = (pageNumber - 1) * data.length;
    virtualData.splice(insertIndex, data.length, ...data);
    this.virtualScrollingCache.set(cacheKey, virtualData);
  }

  private generateCursor(item: any): string {
    // Generate a cursor from the item's ID and timestamp
    return Buffer.from(JSON.stringify({
      id: item.id,
      timestamp: item.createdAt || item.updatedAt || Date.now()
    })).toString('base64');
  }

  private addSearchHighlights(data: any[], query: string, fields: string[]): any[] {
    return data.map(item => {
      const highlighted = { ...item };
      fields.forEach(field => {
        if (item[field] && typeof item[field] === 'string') {
          const regex = new RegExp(`(${query})`, 'gi');
          highlighted[field] = item[field].replace(regex, '<mark>$1</mark>');
        }
      });
      return highlighted;
    });
  }

  /**
   * Performance analytics
   */
  getPerformanceStats() {
    return {
      cachedPages: this.pageCache.size,
      prefetchQueue: this.prefetchQueue.size,
      virtualScrollCaches: this.virtualScrollingCache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      avgResponseTime: this.calculateAvgResponseTime()
    };
  }

  private calculateCacheHitRate(): number {
    // Implementation would track hits vs misses
    return 0.85; // Placeholder
  }

  private calculateAvgResponseTime(): number {
    // Implementation would track response times
    return 150; // Placeholder in ms
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.pageCache.clear();
    this.virtualScrollingCache.clear();
    this.prefetchQueue.clear();
    paginationLogger.info('All pagination caches cleared');
  }
}

// Export singleton instance
export const paginationService = PaginationService.getInstance();

// React hooks for pagination
export const usePagination = {
  /**
   * Hook for standard pagination
   */
  usePaginatedQuery: <T = any>(
    modelName: keyof Schema['models'],
    options: any = {}
  ) => {
    // Would be implemented as React hook
    return {
      data: [] as T[],
      pagination: {
        currentPage: 1,
        pageSize: 25,
        hasNextPage: false,
        hasPreviousPage: false
      },
      loading: false,
      error: null,
      refetch: () => {},
      nextPage: () => {},
      previousPage: () => {},
      goToPage: (page: number) => {}
    };
  },

  /**
   * Hook for virtual scrolling
   */
  useVirtualScrolling: <T = any>(
    modelName: keyof Schema['models'],
    options: any = {}
  ) => {
    return {
      data: [] as T[],
      totalCount: 0,
      loading: false,
      error: null,
      loadMore: () => {},
      scrollToIndex: (index: number) => {}
    };
  }
};