/**
 * Base repository interface for all data operations
 * Provides standardized CRUD operations and query patterns
 */

export interface IRepository<T, TFilter = any, TCreate = any, TUpdate = any> {
  // Basic CRUD operations
  create(data: TCreate): Promise<RepositoryResult<T>>;
  findById(id: string): Promise<RepositoryResult<T>>;
  findAll(options?: QueryOptions<TFilter>): Promise<RepositoryResult<T[]>>;
  update(id: string, data: TUpdate): Promise<RepositoryResult<T>>;
  delete(id: string): Promise<RepositoryResult<boolean>>;
  
  // Advanced query operations
  findMany(filter: TFilter): Promise<RepositoryResult<T[]>>;
  findOne(filter: TFilter): Promise<RepositoryResult<T | null>>;
  count(filter?: TFilter): Promise<RepositoryResult<number>>;
  exists(id: string): Promise<RepositoryResult<boolean>>;
}

export interface RepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    totalCount?: number;
    nextToken?: string;
    cached?: boolean;
  };
}

export interface QueryOptions<TFilter> {
  filter?: TFilter;
  limit?: number;
  offset?: number;
  nextToken?: string;
  orderBy?: OrderBy[];
  includeDeleted?: boolean;
}

export interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
  nextToken?: string;
}

/**
 * Enhanced repository interface for entities with relationships
 */
export interface IRepositoryWithRelations<T, TFilter = any> extends IRepository<T, TFilter> {
  findByIdWithRelations(id: string, include?: string[]): Promise<RepositoryResult<T>>;
  findAllWithRelations(options?: QueryOptions<TFilter> & { include?: string[] }): Promise<RepositoryResult<T[]>>;
}

/**
 * Cache-enabled repository interface
 */
export interface ICacheableRepository<T, TFilter = any, TCreate = any, TUpdate = any> extends IRepository<T, TFilter, TCreate, TUpdate> {
  clearCache(): void;
  warmCache(): Promise<void>;
  getCacheStats(): {
    size: number;
    hitRate: number;
    lastUpdated: Date;
  };
}