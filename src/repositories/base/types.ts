/**
 * Common types for repository operations
 * Base types used across all repository implementations
 */

/**
 * Standard pagination options for list operations
 */
export interface PaginationOptions {
  /** Maximum number of items to return */
  limit?: number;
  /** Token for fetching next page */
  nextToken?: string;
  /** Offset for cursor-based pagination */
  offset?: number;
}

/**
 * Sorting configuration for list operations
 */
export interface SortOptions {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Generic filter conditions for GraphQL queries
 */
export interface FilterCondition {
  /** Equality filter */
  eq?: any;
  /** Not equal filter */
  ne?: any;
  /** Greater than filter */
  gt?: any;
  /** Greater than or equal filter */
  ge?: any;
  /** Less than filter */
  lt?: any;
  /** Less than or equal filter */
  le?: any;
  /** Contains filter (for strings) */
  contains?: string;
  /** Begins with filter (for strings) */
  beginsWith?: string;
  /** Between filter */
  between?: [any, any];
  /** In array filter */
  in?: any[];
  /** Not in array filter */
  notIn?: any[];
  /** Attribute exists filter */
  attributeExists?: boolean;
  /** Attribute type filter */
  attributeType?: string;
}

/**
 * Complex filter with AND/OR logic
 */
export interface FilterOptions {
  /** Simple field filters */
  [key: string]: FilterCondition | FilterOptions[] | FilterOptions | undefined;
  /** Logical AND conditions */
  and?: FilterOptions[];
  /** Logical OR conditions */
  or?: FilterOptions[];
  /** Logical NOT condition */
  not?: FilterOptions;
}

/**
 * Options for list operations
 */
export interface ListOptions {
  /** Pagination options */
  pagination?: PaginationOptions;
  /** Sorting options */
  sort?: SortOptions;
  /** Filter conditions */
  filter?: FilterOptions;
  /** Include related data */
  includes?: string[];
}

/**
 * Standard service result wrapper
 */
export interface ServiceResult<T = any> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The returned data (if successful) */
  data?: T;
  /** Error information (if failed) */
  error?: any;
  /** Additional metadata */
  meta?: {
    /** Total count of items (for pagination) */
    totalCount?: number;
    /** Next page token */
    nextToken?: string;
    /** Current page size */
    pageSize?: number;
    /** Has more pages */
    hasMore?: boolean;
    /** Execution time in milliseconds */
    executionTime?: number;
    /** GraphQL errors (non-fatal) */
    warnings?: any[];
  };
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T = any> {
  /** Array of items */
  items: T[];
  /** Token for next page */
  nextToken?: string;
  /** Total count (if available) */
  totalCount?: number;
  /** Current page size */
  pageSize: number;
  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * GraphQL response structure
 */
export interface GraphQLResponse<T = any> {
  /** Response data */
  data?: T;
  /** GraphQL errors */
  errors?: GraphQLError[];
  /** Extensions metadata */
  extensions?: Record<string, any>;
}

/**
 * GraphQL error structure
 */
export interface GraphQLError {
  /** Error message */
  message: string;
  /** Error locations in query */
  locations?: Array<{
    line: number;
    column: number;
  }>;
  /** Path to the error in the response */
  path?: Array<string | number>;
  /** Additional error extensions */
  extensions?: Record<string, any>;
}

/**
 * Authentication modes for GraphQL operations
 */
export type AuthMode = 'apiKey' | 'userPool' | 'oidc' | 'identityPool';

/**
 * GraphQL operation configuration
 */
export interface GraphQLOperation {
  /** GraphQL query/mutation string */
  query: string;
  /** Operation variables */
  variables?: Record<string, any>;
  /** Authentication mode override */
  authMode?: AuthMode;
  /** Operation timeout in milliseconds */
  timeout?: number;
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Repository configuration options
 */
export interface RepositoryConfig {
  /** Default authentication mode */
  defaultAuthMode: AuthMode;
  /** Default timeout for operations */
  defaultTimeout: number;
  /** Enable request/response logging */
  enableLogging: boolean;
  /** Logger name */
  loggerName?: string;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
}

/**
 * Cache configuration for repository operations
 */
export interface CacheOptions {
  /** Enable caching */
  enabled: boolean;
  /** Cache TTL in seconds */
  ttl: number;
  /** Cache key prefix */
  keyPrefix?: string;
  /** Skip cache for this operation */
  skipCache?: boolean;
}

/**
 * Audit information for create/update operations
 */
export interface AuditFields {
  /** User ID performing the operation */
  userId?: string;
  /** User email performing the operation */
  userEmail?: string;
  /** User role performing the operation */
  userRole?: string;
  /** Operation source */
  source?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Base model interface with common fields
 */
export interface BaseModel {
  /** Unique identifier */
  id: string;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
  /** Record owner */
  owner?: string;
}

/**
 * Create operation input
 */
export interface CreateInput<T> {
  /** Data to create */
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
  /** Audit information */
  audit?: AuditFields;
}

/**
 * Update operation input
 */
export interface UpdateInput<T> {
  /** Record ID */
  id: string;
  /** Data to update */
  data: Partial<Omit<T, 'id' | 'createdAt'>>;
  /** Audit information */
  audit?: AuditFields;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field name */
  field: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Field value that caused the error */
  value?: any;
}

/**
 * Repository metrics for monitoring
 */
export interface RepositoryMetrics {
  /** Operation name */
  operation: string;
  /** Model name */
  model: string;
  /** Execution time in milliseconds */
  duration: number;
  /** Whether operation succeeded */
  success: boolean;
  /** Error code (if failed) */
  errorCode?: string;
  /** Number of records affected */
  recordCount?: number;
  /** Cache hit/miss status */
  cacheStatus?: 'hit' | 'miss' | 'disabled';
  /** Timestamp */
  timestamp: Date;
}