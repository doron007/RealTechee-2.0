/**
 * Base Repository interface and implementation
 * Provides generic CRUD operations with type safety and error handling
 */

import { GraphQLClient } from './GraphQLClient';
import {
  ServiceResult,
  ListOptions,
  PaginatedResult,
  CreateInput,
  UpdateInput,
  BaseModel,
  AuthMode,
  FilterOptions,
  SortOptions,
  PaginationOptions
} from './types';
import {
  RepositoryError,
  RepositoryErrorCode,
  ValidationError,
  NotFoundError,
  createRepositoryError
} from './RepositoryError';
import { createLogger } from '../../../utils/logger';

/**
 * Generic repository interface for CRUD operations
 */
export interface IRepository<T extends BaseModel> {
  /**
   * Create a new record
   */
  create(input: CreateInput<T>): Promise<ServiceResult<T>>;

  /**
   * Get a record by ID
   */
  get(id: string, includes?: string[]): Promise<ServiceResult<T>>;

  /**
   * Update an existing record
   */
  update(input: UpdateInput<T>): Promise<ServiceResult<T>>;

  /**
   * Delete a record by ID
   */
  delete(id: string): Promise<ServiceResult<boolean>>;

  /**
   * List records with filtering, sorting, and pagination
   */
  list(options?: ListOptions): Promise<ServiceResult<PaginatedResult<T>>>;

  /**
   * Find records by custom criteria
   */
  find(filter: FilterOptions, options?: Omit<ListOptions, 'filter'>): Promise<ServiceResult<T[]>>;

  /**
   * Count records matching criteria
   */
  count(filter?: FilterOptions): Promise<ServiceResult<number>>;

  /**
   * Check if a record exists
   */
  exists(id: string): Promise<ServiceResult<boolean>>;

  /**
   * Batch operations
   */
  batchCreate(inputs: CreateInput<T>[]): Promise<ServiceResult<T[]>>;
  batchUpdate(inputs: UpdateInput<T>[]): Promise<ServiceResult<T[]>>;
  batchDelete(ids: string[]): Promise<ServiceResult<boolean>>;
}

/**
 * Base repository configuration
 */
export interface BaseRepositoryConfig {
  /** Model name for logging and error messages */
  modelName: string;
  /** GraphQL type name */
  graphqlTypeName: string;
  /** Default authentication mode */
  defaultAuthMode: AuthMode;
  /** Enable validation before operations */
  enableValidation: boolean;
  /** Enable audit logging */
  enableAuditLog: boolean;
  /** Default page size for list operations */
  defaultPageSize: number;
  /** Maximum page size allowed */
  maxPageSize: number;
}

/**
 * Base repository implementation with common CRUD operations
 */
export abstract class BaseRepository<T extends BaseModel> implements IRepository<T> {
  protected readonly client: GraphQLClient;
  protected readonly config: BaseRepositoryConfig;
  protected readonly logger: any;

  constructor(
    client: GraphQLClient,
    config: Partial<BaseRepositoryConfig> & { modelName: string; graphqlTypeName: string }
  ) {
    this.client = client;
    this.config = {
      defaultAuthMode: 'apiKey',
      enableValidation: true,
      enableAuditLog: false,
      defaultPageSize: 20,
      maxPageSize: 1000,
      ...config
    };
    this.logger = createLogger(`${this.config.modelName}Repository`);

    this.logger.info('Repository initialized', {
      modelName: this.config.modelName,
      graphqlTypeName: this.config.graphqlTypeName,
      defaultAuthMode: this.config.defaultAuthMode
    });
  }

  /**
   * Abstract methods that must be implemented by concrete repositories
   */
  protected abstract getCreateMutation(): string;
  protected abstract getUpdateMutation(): string;
  protected abstract getDeleteMutation(): string;
  protected abstract getGetQuery(): string;
  protected abstract getListQuery(): string;
  protected getCountQuery?(): string | undefined { return undefined; }

  /**
   * Validate input data - override in concrete repositories
   */
  protected async validateCreate(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    // Basic validation - can be overridden
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid input data', [
        { field: 'data', message: 'Data is required and must be an object' }
      ]);
    }
  }

  /**
   * Validate update data - override in concrete repositories
   */
  protected async validateUpdate(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Invalid ID', [
        { field: 'id', message: 'ID is required and must be a string' }
      ]);
    }

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new ValidationError('Invalid update data', [
        { field: 'data', message: 'Update data is required and must be a non-empty object' }
      ]);
    }
  }

  /**
   * Transform input data before create - override in concrete repositories
   */
  protected transformCreateInput(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Record<string, any> {
    return { ...data };
  }

  /**
   * Transform input data before update - override in concrete repositories
   */
  protected transformUpdateInput(data: Partial<Omit<T, 'id' | 'createdAt'>>): Record<string, any> {
    return { ...data };
  }

  /**
   * Transform response data - override in concrete repositories
   */
  protected transformResponseData(data: any): T {
    return data as T;
  }

  /**
   * Build GraphQL filter from FilterOptions
   */
  protected buildGraphQLFilter(filter?: FilterOptions): Record<string, any> | undefined {
    if (!filter) return undefined;

    const graphqlFilter: Record<string, any> = {};

    // Handle direct field filters
    Object.entries(filter).forEach(([key, value]) => {
      if (key === 'and' || key === 'or' || key === 'not') return;
      if (value && typeof value === 'object') {
        graphqlFilter[key] = value;
      }
    });

    // Handle logical operators
    if (filter.and && filter.and.length > 0) {
      graphqlFilter.and = filter.and.map(f => this.buildGraphQLFilter(f));
    }

    if (filter.or && filter.or.length > 0) {
      graphqlFilter.or = filter.or.map(f => this.buildGraphQLFilter(f));
    }

    if (filter.not) {
      graphqlFilter.not = this.buildGraphQLFilter(filter.not);
    }

    return Object.keys(graphqlFilter).length > 0 ? graphqlFilter : undefined;
  }

  /**
   * Build GraphQL sort from SortOptions
   */
  protected buildGraphQLSort(sort?: SortOptions): Record<string, any> | undefined {
    if (!sort) return undefined;

    return {
      [sort.field]: sort.direction
    };
  }

  /**
   * Create a new record
   */
  async create(input: CreateInput<T>): Promise<ServiceResult<T>> {
    try {
      this.logger.info('Creating record', {
        model: this.config.modelName,
        hasData: !!input.data
      });

      // Validation
      if (this.config.enableValidation) {
        await this.validateCreate(input.data);
      }

      // Transform input
      const transformedData = this.transformCreateInput(input.data);

      // Add audit fields if enabled
      if (this.config.enableAuditLog && input.audit) {
        Object.assign(transformedData, {
          createdBy: input.audit.userId,
          createdByEmail: input.audit.userEmail,
          source: input.audit.source
        });
      }

      // Execute mutation
      const result = await this.client.mutate(
        this.getCreateMutation(),
        { input: transformedData },
        {
          authMode: this.config.defaultAuthMode,
          operation: 'create',
          model: this.config.modelName
        }
      );

      if (!result.success) {
        throw result.error;
      }

      // Extract created data
      const createdData = this.extractMutationResult(result.data, 'create');
      const transformedResult = this.transformResponseData(createdData);

      this.logger.info('Record created successfully', {
        model: this.config.modelName,
        id: transformedResult.id
      });

      return {
        success: true,
        data: transformedResult,
        meta: result.meta
      };

    } catch (error) {
      const repositoryError = createRepositoryError(error, 'create', this.config.modelName);
      this.logger.error('Create operation failed', {
        model: this.config.modelName,
        error: repositoryError.message,
        code: repositoryError.code
      });

      return {
        success: false,
        error: repositoryError
      };
    }
  }

  /**
   * Get a record by ID
   */
  async get(id: string, includes?: string[]): Promise<ServiceResult<T>> {
    try {
      this.logger.info('Getting record', {
        model: this.config.modelName,
        id,
        includes
      });

      if (!id) {
        throw new ValidationError('ID is required', [
          { field: 'id', message: 'ID is required' }
        ]);
      }

      const result = await this.client.query(
        this.getGetQuery(),
        { id },
        {
          authMode: this.config.defaultAuthMode,
          operation: 'get',
          model: this.config.modelName
        }
      );

      if (!result.success) {
        throw result.error;
      }

      // Extract data
      const data = this.extractQueryResult(result.data, 'get');
      
      if (!data) {
        throw new NotFoundError(this.config.modelName, id);
      }

      const transformedResult = this.transformResponseData(data);

      this.logger.info('Record retrieved successfully', {
        model: this.config.modelName,
        id: transformedResult.id
      });

      return {
        success: true,
        data: transformedResult,
        meta: result.meta
      };

    } catch (error) {
      const repositoryError = createRepositoryError(error, 'get', this.config.modelName);
      this.logger.error('Get operation failed', {
        model: this.config.modelName,
        id,
        error: repositoryError.message,
        code: repositoryError.code
      });

      return {
        success: false,
        error: repositoryError
      };
    }
  }

  /**
   * Update an existing record
   */
  async update(input: UpdateInput<T>): Promise<ServiceResult<T>> {
    try {
      this.logger.info('Updating record', {
        model: this.config.modelName,
        id: input.id,
        hasData: !!input.data
      });

      // Validation
      if (this.config.enableValidation) {
        await this.validateUpdate(input.id, input.data);
      }

      // Transform input
      const transformedData = this.transformUpdateInput(input.data);

      // Add audit fields if enabled
      if (this.config.enableAuditLog && input.audit) {
        Object.assign(transformedData, {
          updatedBy: input.audit.userId,
          updatedByEmail: input.audit.userEmail,
          lastModifiedBy: input.audit.userId
        });
      }

      // Execute mutation
      const result = await this.client.mutate(
        this.getUpdateMutation(),
        { 
          input: {
            id: input.id,
            ...transformedData
          }
        },
        {
          authMode: this.config.defaultAuthMode,
          operation: 'update',
          model: this.config.modelName
        }
      );

      if (!result.success) {
        throw result.error;
      }

      // Extract updated data
      const updatedData = this.extractMutationResult(result.data, 'update');
      const transformedResult = this.transformResponseData(updatedData);

      this.logger.info('Record updated successfully', {
        model: this.config.modelName,
        id: transformedResult.id
      });

      return {
        success: true,
        data: transformedResult,
        meta: result.meta
      };

    } catch (error) {
      const repositoryError = createRepositoryError(error, 'update', this.config.modelName);
      this.logger.error('Update operation failed', {
        model: this.config.modelName,
        id: input.id,
        error: repositoryError.message,
        code: repositoryError.code
      });

      return {
        success: false,
        error: repositoryError
      };
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      this.logger.info('Deleting record', {
        model: this.config.modelName,
        id
      });

      if (!id) {
        throw new ValidationError('ID is required', [
          { field: 'id', message: 'ID is required' }
        ]);
      }

      const result = await this.client.mutate(
        this.getDeleteMutation(),
        { input: { id } },
        {
          authMode: this.config.defaultAuthMode,
          operation: 'delete',
          model: this.config.modelName
        }
      );

      if (!result.success) {
        throw result.error;
      }

      this.logger.info('Record deleted successfully', {
        model: this.config.modelName,
        id
      });

      return {
        success: true,
        data: true,
        meta: result.meta
      };

    } catch (error) {
      const repositoryError = createRepositoryError(error, 'delete', this.config.modelName);
      this.logger.error('Delete operation failed', {
        model: this.config.modelName,
        id,
        error: repositoryError.message,
        code: repositoryError.code
      });

      return {
        success: false,
        error: repositoryError
      };
    }
  }

  /**
   * List records with filtering, sorting, and pagination
   */
  async list(options: ListOptions = {}): Promise<ServiceResult<PaginatedResult<T>>> {
    try {
      const pageSize = Math.min(
        options.pagination?.limit || this.config.defaultPageSize,
        this.config.maxPageSize
      );

      this.logger.info('Listing records', {
        model: this.config.modelName,
        pageSize,
        hasFilter: !!options.filter,
        hasSort: !!options.sort
      });

      const variables: Record<string, any> = {
        limit: pageSize
      };

      // Add filter
      if (options.filter) {
        variables.filter = this.buildGraphQLFilter(options.filter);
      }

      // Add pagination token
      if (options.pagination?.nextToken) {
        variables.nextToken = options.pagination.nextToken;
      }

      // Execute query
      const result = await this.client.query(
        this.getListQuery(),
        variables,
        {
          authMode: this.config.defaultAuthMode,
          operation: 'list',
          model: this.config.modelName
        }
      );

      if (!result.success) {
        throw result.error;
      }

      // Extract list data
      const listData = this.extractQueryResult(result.data, 'list');
      const items = (listData?.items || []).map((item: any) => this.transformResponseData(item));
      
      const paginatedResult: PaginatedResult<T> = {
        items,
        pageSize,
        nextToken: listData?.nextToken,
        hasMore: !!listData?.nextToken,
        totalCount: listData?.items?.length || 0
      };

      this.logger.info('Records listed successfully', {
        model: this.config.modelName,
        count: items.length,
        hasMore: paginatedResult.hasMore
      });

      return {
        success: true,
        data: paginatedResult,
        meta: {
          ...result.meta,
          totalCount: items.length,
          pageSize,
          hasMore: paginatedResult.hasMore
        }
      };

    } catch (error) {
      const repositoryError = createRepositoryError(error, 'list', this.config.modelName);
      this.logger.error('List operation failed', {
        model: this.config.modelName,
        error: repositoryError.message,
        code: repositoryError.code
      });

      return {
        success: false,
        error: repositoryError
      };
    }
  }

  /**
   * Find records by custom criteria
   */
  async find(filter: FilterOptions, options: Omit<ListOptions, 'filter'> = {}): Promise<ServiceResult<T[]>> {
    const listResult = await this.list({
      ...options,
      filter
    });

    if (!listResult.success) {
      return {
        success: false,
        error: listResult.error
      };
    }

    return {
      success: true,
      data: listResult.data!.items,
      meta: listResult.meta
    };
  }

  /**
   * Count records matching criteria
   */
  async count(filter?: FilterOptions): Promise<ServiceResult<number>> {
    try {
      // If count query is available, use it
      const countQuery = this.getCountQuery?.();
      if (countQuery) {
        const variables: Record<string, any> = {};
        if (filter) {
          variables.filter = this.buildGraphQLFilter(filter);
        }

        const result = await this.client.query(
          countQuery,
          variables,
          {
            authMode: this.config.defaultAuthMode,
            operation: 'count',
            model: this.config.modelName
          }
        );

        if (!result.success) {
          throw result.error;
        }

        const count = this.extractQueryResult(result.data, 'count') || 0;
        return {
          success: true,
          data: count,
          meta: result.meta
        };
      }

      // Fallback to list query with limit 1000
      const listResult = await this.list({
        filter,
        pagination: { limit: 1000 }
      });

      if (!listResult.success) {
        return {
          success: false,
          error: listResult.error
        };
      }

      return {
        success: true,
        data: listResult.data!.items.length,
        meta: listResult.meta
      };

    } catch (error) {
      const repositoryError = createRepositoryError(error, 'count', this.config.modelName);
      return {
        success: false,
        error: repositoryError
      };
    }
  }

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<ServiceResult<boolean>> {
    const result = await this.get(id);
    
    if (result.success) {
      return { success: true, data: true };
    }

    // If it's a not found error, return false instead of error
    if (result.error instanceof NotFoundError) {
      return { success: true, data: false };
    }

    // Other errors should propagate
    return { success: false, error: result.error };
  }

  /**
   * Batch create operations (basic implementation)
   */
  async batchCreate(inputs: CreateInput<T>[]): Promise<ServiceResult<T[]>> {
    const results: T[] = [];
    const errors: RepositoryError[] = [];

    for (const input of inputs) {
      const result = await this.create(input);
      if (result.success && result.data) {
        results.push(result.data);
      } else {
        errors.push(result.error as RepositoryError);
      }
    }

    if (errors.length === 0) {
      return { success: true, data: results };
    }

    return {
      success: false,
      error: new RepositoryError(
        RepositoryErrorCode.CREATE_FAILED,
        `Batch create failed: ${errors.length}/${inputs.length} operations failed`,
        `${errors.length} out of ${inputs.length} records could not be created`,
        { errors, successCount: results.length }
      )
    };
  }

  /**
   * Batch update operations (basic implementation)
   */
  async batchUpdate(inputs: UpdateInput<T>[]): Promise<ServiceResult<T[]>> {
    const results: T[] = [];
    const errors: RepositoryError[] = [];

    for (const input of inputs) {
      const result = await this.update(input);
      if (result.success && result.data) {
        results.push(result.data);
      } else {
        errors.push(result.error as RepositoryError);
      }
    }

    if (errors.length === 0) {
      return { success: true, data: results };
    }

    return {
      success: false,
      error: new RepositoryError(
        RepositoryErrorCode.UPDATE_FAILED,
        `Batch update failed: ${errors.length}/${inputs.length} operations failed`,
        `${errors.length} out of ${inputs.length} records could not be updated`,
        { errors, successCount: results.length }
      )
    };
  }

  /**
   * Batch delete operations (basic implementation)
   */
  async batchDelete(ids: string[]): Promise<ServiceResult<boolean>> {
    const errors: RepositoryError[] = [];
    let successCount = 0;

    for (const id of ids) {
      const result = await this.delete(id);
      if (result.success) {
        successCount++;
      } else {
        errors.push(result.error as RepositoryError);
      }
    }

    if (errors.length === 0) {
      return { success: true, data: true };
    }

    return {
      success: false,
      error: new RepositoryError(
        RepositoryErrorCode.DELETE_FAILED,
        `Batch delete failed: ${errors.length}/${ids.length} operations failed`,
        `${errors.length} out of ${ids.length} records could not be deleted`,
        { errors, successCount }
      )
    };
  }

  /**
   * Helper methods for extracting data from GraphQL responses
   */
  protected extractMutationResult(data: any, operation: 'create' | 'update' | 'delete'): any {
    const operationName = `${operation}${this.config.graphqlTypeName}`;
    return data?.[operationName];
  }

  protected extractQueryResult(data: any, operation: 'get' | 'list' | 'count'): any {
    if (operation === 'get') {
      return data?.[`get${this.config.graphqlTypeName}`];
    } else if (operation === 'list') {
      return data?.[`list${this.config.graphqlTypeName}`];
    } else if (operation === 'count') {
      return data?.[`count${this.config.graphqlTypeName}`];
    }
    return data;
  }
}