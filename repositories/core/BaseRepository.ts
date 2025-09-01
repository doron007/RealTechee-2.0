/**
 * Base repository implementation
 * Provides common CRUD operations and caching functionality
 */

import { createLogger } from '../../utils/logger';
import { 
  IRepository, 
  IRepositoryWithRelations,
  ICacheableRepository,
  RepositoryResult, 
  QueryOptions,
  OrderBy,
  PaginatedResult 
} from '../interfaces/IBaseRepository';
import { IAmplifyGraphQLClient } from '../interfaces/IGraphQLClient';

const logger = createLogger('BaseRepository');

export abstract class BaseRepository<T, TFilter = any, TCreate = any, TUpdate = any> 
  implements IRepository<T, TFilter, TCreate, TUpdate>, ICacheableRepository<T, TFilter, TCreate, TUpdate> {
  
  protected abstract modelName: string;
  protected abstract client: IAmplifyGraphQLClient;
  
  // Cache implementation
  private cache = new Map<string, { data: T; timestamp: number }>();
  private cacheStats = {
    hits: 0,
    misses: 0,
    lastUpdated: new Date()
  };
  protected cacheTTL = 5 * 60 * 1000; // 5 minutes default

  constructor(protected entityName: string) {}

  // Abstract methods that must be implemented by subclasses
  protected abstract getCreateMutation(): string;
  protected abstract getUpdateMutation(): string;
  protected abstract getDeleteMutation(): string;
  protected abstract getListQuery(): string;
  protected abstract getByIdQuery(): string;
  
  protected abstract mapToEntity(data: any): T;
  protected abstract mapToCreateInput(data: TCreate): any;
  protected abstract mapToUpdateInput(data: TUpdate): any;

  async create(data: TCreate): Promise<RepositoryResult<T>> {
    try {
      logger.info(`Creating ${this.entityName}`, { data });
      
      const createInput = this.mapToCreateInput(data);
      const result = await this.client.mutate(
        this.getCreateMutation(),
        { input: createInput }
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error(`Failed to create ${this.entityName}`, { error });
        return { success: false, error };
      }

      const createdEntity = this.mapToEntity(result.data);
      this.updateCache(createdEntity);
      
      logger.info(`Successfully created ${this.entityName}`, { id: (createdEntity as any).id });
      return { success: true, data: createdEntity };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error creating ${this.entityName}`, { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async findById(id: string): Promise<RepositoryResult<T>> {
    try {
      // Check cache first
      const cached = this.getFromCache(id);
      if (cached) {
        this.cacheStats.hits++;
        return { success: true, data: cached, metadata: { cached: true } };
      }
      this.cacheStats.misses++;

      logger.debug(`Finding ${this.entityName} by ID`, { id });
      
      const result = await this.client.query(
        this.getByIdQuery(),
        { id }
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error(`Failed to find ${this.entityName} by ID`, { id, error });
        return { success: false, error };
      }

      const entityData = this.extractSingleResult(result.data);
      if (!entityData) {
        return { success: false, error: `${this.entityName} not found` };
      }

      const entity = this.mapToEntity(entityData);
      this.updateCache(entity);
      
      return { success: true, data: entity };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error finding ${this.entityName} by ID`, { id, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async findAll(options: QueryOptions<TFilter> = {}): Promise<RepositoryResult<T[]>> {
    try {
      logger.debug(`Finding all ${this.entityName}s`, { options });
      
      const variables = this.buildQueryVariables(options);
      const result = await this.client.query(
        this.getListQuery(),
        variables
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error(`Failed to find ${this.entityName}s`, { error });
        return { success: false, error };
      }

      const items = this.extractListResults(result.data);
      const entities = items.map(item => this.mapToEntity(item));
      
      // Update cache for all entities
      entities.forEach(entity => this.updateCache(entity));
      
      const metadata = this.extractMetadata(result.data);
      
      logger.info(`Successfully found ${entities.length} ${this.entityName}s`);
      return { success: true, data: entities, metadata };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error finding ${this.entityName}s`, { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async update(id: string, data: TUpdate): Promise<RepositoryResult<T>> {
    try {
      logger.info(`Updating ${this.entityName}`, { id, data });
      
      const updateInput = { id, ...this.mapToUpdateInput(data) };
      const result = await this.client.mutate(
        this.getUpdateMutation(),
        { input: updateInput }
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error(`Failed to update ${this.entityName}`, { id, error });
        return { success: false, error };
      }

      const updatedEntity = this.mapToEntity(result.data);
      this.updateCache(updatedEntity);
      
      logger.info(`Successfully updated ${this.entityName}`, { id });
      return { success: true, data: updatedEntity };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error updating ${this.entityName}`, { id, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      logger.info(`Deleting ${this.entityName}`, { id });
      
      const result = await this.client.mutate(
        this.getDeleteMutation(),
        { input: { id } }
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error(`Failed to delete ${this.entityName}`, { id, error });
        return { success: false, error };
      }

      this.removeFromCache(id);
      
      logger.info(`Successfully deleted ${this.entityName}`, { id });
      return { success: true, data: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error deleting ${this.entityName}`, { id, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async findMany(filter: TFilter): Promise<RepositoryResult<T[]>> {
    return this.findAll({ filter });
  }

  async findOne(filter: TFilter): Promise<RepositoryResult<T | null>> {
    const result = await this.findAll({ filter, limit: 1 });
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    const entity = result.data && result.data.length > 0 ? result.data[0] : null;
    return { success: true, data: entity };
  }

  async count(filter?: TFilter): Promise<RepositoryResult<number>> {
    // This would require a separate count query - simplified for now
    const result = await this.findAll({ filter });
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    return { success: true, data: result.data?.length || 0 };
  }

  async exists(id: string): Promise<RepositoryResult<boolean>> {
    const result = await this.findById(id);
    return { success: true, data: result.success && !!result.data };
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      lastUpdated: new Date()
    };
    logger.info(`Cleared ${this.entityName} cache`);
  }

  async warmCache(): Promise<void> {
    logger.info(`Warming ${this.entityName} cache`);
    await this.findAll({ limit: 1000 }); // Load up to 1000 entities into cache
  }

  getCacheStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? this.cacheStats.hits / total : 0;
    
    return {
      size: this.cache.size,
      hitRate,
      lastUpdated: this.cacheStats.lastUpdated
    };
  }

  // Protected helper methods for subclasses
  protected getFromCache(id: string): T | null {
    const cached = this.cache.get(id);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.cacheTTL;
    if (isExpired) {
      this.cache.delete(id);
      return null;
    }
    
    return cached.data;
  }

  protected updateCache(entity: T): void {
    const id = (entity as any).id;
    if (id) {
      this.cache.set(id, {
        data: entity,
        timestamp: Date.now()
      });
    }
  }

  protected removeFromCache(id: string): void {
    this.cache.delete(id);
  }

  // Abstract methods for subclasses to implement
  protected abstract extractSingleResult(data: any): any;
  protected abstract extractListResults(data: any): any[];
  protected abstract extractMetadata(data: any): any;
  
  protected buildQueryVariables(options: QueryOptions<TFilter>): any {
    const variables: any = {};
    
    if (options.limit) {
      variables.limit = options.limit;
    }
    
    if (options.nextToken) {
      variables.nextToken = options.nextToken;
    }
    
    if (options.filter) {
      variables.filter = this.buildFilterInput(options.filter);
    }
    
    return variables;
  }

  protected abstract buildFilterInput(filter: TFilter): any;
}