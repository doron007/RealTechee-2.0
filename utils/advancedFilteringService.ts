import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../amplify/data/resource';
import { createLogger } from './logger';

const filteringClient = generateClient<Schema>({
  authMode: 'userPool'
});

const filteringLogger = createLogger('AdvancedFiltering');

/**
 * Advanced filtering service with complex query support
 */
export class AdvancedFilteringService {
  private static instance: AdvancedFilteringService;
  private filterCache = new Map<string, any>();
  private filterSchemas = new Map<string, any>();

  static getInstance(): AdvancedFilteringService {
    if (!AdvancedFilteringService.instance) {
      AdvancedFilteringService.instance = new AdvancedFilteringService();
    }
    return AdvancedFilteringService.instance;
  }

  /**
   * Initialize filter schemas for models
   */
  initializeFilterSchemas() {
    // Define complex filter schemas for each model
    this.filterSchemas.set('Projects', {
      fields: {
        title: { type: 'string', operators: ['eq', 'contains', 'beginsWith', 'ne'] },
        status: { type: 'enum', operators: ['eq', 'ne', 'in', 'notIn'], values: ['New', 'Boosting', 'Listed', 'Sold'] },
        budget: { type: 'number', operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'] },
        createdDate: { type: 'datetime', operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'] },
        assignedTo: { type: 'string', operators: ['eq', 'ne', 'contains'] },
        archived: { type: 'boolean', operators: ['eq'] }
      },
      relationships: {
        agent: { model: 'Contacts', field: 'agentContactId' },
        homeowner: { model: 'Contacts', field: 'homeownerContactId' },
        address: { model: 'Properties', field: 'addressId' }
      }
    });

    this.filterSchemas.set('Quotes', {
      fields: {
        status: { type: 'enum', operators: ['eq', 'ne', 'in', 'notIn'] },
        totalPrice: { type: 'number', operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'] },
        budget: { type: 'number', operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'] },
        assignedTo: { type: 'string', operators: ['eq', 'ne', 'contains'] },
        signed: { type: 'boolean', operators: ['eq'] },
        sentDate: { type: 'datetime', operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'] }
      },
      relationships: {
        project: { model: 'Projects', field: 'projectId' },
        agent: { model: 'Contacts', field: 'agentContactId' }
      }
    });

    this.filterSchemas.set('Requests', {
      fields: {
        status: { type: 'enum', operators: ['eq', 'ne', 'in', 'notIn'] },
        product: { type: 'string', operators: ['eq', 'contains', 'beginsWith'] },
        budget: { type: 'string', operators: ['eq', 'contains'] },
        assignedTo: { type: 'string', operators: ['eq', 'ne', 'contains'] },
        leadSource: { type: 'string', operators: ['eq', 'ne', 'in'] },
        needFinance: { type: 'boolean', operators: ['eq'] }
      },
      relationships: {
        agent: { model: 'Contacts', field: 'agentContactId' },
        homeowner: { model: 'Contacts', field: 'homeownerContactId' },
        address: { model: 'Properties', field: 'addressId' }
      }
    });

    this.filterSchemas.set('Contacts', {
      fields: {
        firstName: { type: 'string', operators: ['eq', 'contains', 'beginsWith'] },
        lastName: { type: 'string', operators: ['eq', 'contains', 'beginsWith'] },
        fullName: { type: 'string', operators: ['eq', 'contains', 'beginsWith'] },
        email: { type: 'email', operators: ['eq', 'contains', 'beginsWith'] },
        phone: { type: 'string', operators: ['eq', 'contains'] },
        company: { type: 'string', operators: ['eq', 'contains', 'beginsWith'] },
        brokerage: { type: 'string', operators: ['eq', 'contains', 'beginsWith'] }
      }
    });

    this.filterSchemas.set('Properties', {
      fields: {
        propertyFullAddress: { type: 'string', operators: ['eq', 'contains', 'beginsWith'] },
        city: { type: 'string', operators: ['eq', 'contains', 'beginsWith'] },
        state: { type: 'string', operators: ['eq', 'ne', 'in'] },
        zip: { type: 'string', operators: ['eq', 'beginsWith'] },
        propertyType: { type: 'enum', operators: ['eq', 'ne', 'in'] },
        bedrooms: { type: 'number', operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'] },
        bathrooms: { type: 'number', operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'] },
        sizeSqft: { type: 'number', operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'] },
        yearBuilt: { type: 'number', operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'] }
      }
    });

    filteringLogger.info('Filter schemas initialized', {
      modelCount: this.filterSchemas.size,
      models: Array.from(this.filterSchemas.keys())
    });
  }

  /**
   * Build complex filters from user-friendly filter definitions
   */
  buildAdvancedFilter(
    modelName: keyof Schema['models'],
    filterDefinition: FilterDefinition
  ): any {
    try {
      filteringLogger.debug('Building advanced filter', {
        modelName,
        filterDefinition
      });

      const schema = this.filterSchemas.get(String(modelName));
      if (!schema) {
        throw new Error(`No filter schema found for model: ${modelName}`);
      }

      return this.processFilterGroup(filterDefinition, schema);
    } catch (error) {
      filteringLogger.error('Failed to build advanced filter', {
        modelName,
        filterDefinition,
        error
      });
      throw error;
    }
  }

  /**
   * Process a filter group (and/or conditions)
   */
  private processFilterGroup(group: FilterDefinition, schema: any): any {
    if (group.and) {
      return {
        and: group.and.map(subGroup => this.processFilterGroup(subGroup, schema))
      };
    }

    if (group.or) {
      return {
        or: group.or.map(subGroup => this.processFilterGroup(subGroup, schema))
      };
    }

    if (group.not) {
      return {
        not: this.processFilterGroup(group.not, schema)
      };
    }

    // Process individual field filters
    if (group.field && group.operator && group.value !== undefined) {
      return this.processFieldFilter(group as FieldFilter, schema);
    }

    throw new Error('Invalid filter definition');
  }

  /**
   * Process individual field filters
   */
  private processFieldFilter(filter: FieldFilter, schema: any): any {
    const { field, operator, value } = filter;
    const fieldSchema = schema.fields[field];

    if (!fieldSchema) {
      throw new Error(`Field '${field}' not found in schema`);
    }

    if (!fieldSchema.operators.includes(operator)) {
      throw new Error(`Operator '${operator}' not supported for field '${field}'`);
    }

    // Validate value based on field type
    this.validateFieldValue(value, fieldSchema, operator);

    // Build DynamoDB filter expression
    return this.buildDynamoDBFilter(field, operator, value, fieldSchema);
  }

  /**
   * Build DynamoDB-compatible filter expressions
   */
  private buildDynamoDBFilter(field: string, operator: string, value: any, fieldSchema: any): any {
    switch (operator) {
      case 'eq':
        return { [field]: { eq: value } };
      
      case 'ne':
        return { [field]: { ne: value } };
      
      case 'gt':
        return { [field]: { gt: value } };
      
      case 'gte':
        return { [field]: { gte: value } };
      
      case 'lt':
        return { [field]: { lt: value } };
      
      case 'lte':
        return { [field]: { lte: value } };
      
      case 'contains':
        return { [field]: { contains: value } };
      
      case 'beginsWith':
        return { [field]: { beginsWith: value } };
      
      case 'between':
        if (!Array.isArray(value) || value.length !== 2) {
          throw new Error('Between operator requires array of two values');
        }
        return {
          and: [
            { [field]: { gte: value[0] } },
            { [field]: { lte: value[1] } }
          ]
        };
      
      case 'in':
        if (!Array.isArray(value)) {
          throw new Error('In operator requires array of values');
        }
        return {
          or: value.map(v => ({ [field]: { eq: v } }))
        };
      
      case 'notIn':
        if (!Array.isArray(value)) {
          throw new Error('NotIn operator requires array of values');
        }
        return {
          and: value.map(v => ({ [field]: { ne: v } }))
        };
      
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * Validate field values based on type
   */
  private validateFieldValue(value: any, fieldSchema: any, operator: string): void {
    switch (fieldSchema.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error('String field requires string value');
        }
        break;
      
      case 'number':
        if (typeof value !== 'number' && operator !== 'between') {
          throw new Error('Number field requires number value');
        }
        if (operator === 'between' && (!Array.isArray(value) || value.some(v => typeof v !== 'number'))) {
          throw new Error('Between operator for number field requires array of numbers');
        }
        break;
      
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error('Boolean field requires boolean value');
        }
        break;
      
      case 'datetime':
        if (!(value instanceof Date) && typeof value !== 'string') {
          throw new Error('DateTime field requires Date or ISO string value');
        }
        break;
      
      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          throw new Error('Email field requires valid email string');
        }
        break;
      
      case 'enum':
        if (fieldSchema.values && !fieldSchema.values.includes(value)) {
          throw new Error(`Enum field value must be one of: ${fieldSchema.values.join(', ')}`);
        }
        break;
    }
  }

  /**
   * Execute advanced query with filters
   */
  async executeAdvancedQuery<T = any>(
    modelName: keyof Schema['models'],
    options: {
      filters?: FilterDefinition;
      sort?: SortDefinition[];
      pagination?: {
        limit?: number;
        nextToken?: string;
      };
      include?: string[]; // Related models to include
    } = {}
  ): Promise<{
    success: boolean;
    data?: T[];
    pagination?: {
      nextToken?: string;
      hasNextPage: boolean;
    };
    metadata?: {
      totalCount?: number;
      executionTime: number;
      filtersApplied: number;
    };
    error?: any;
  }> {
    try {
      const startTime = Date.now();
      
      filteringLogger.debug('Executing advanced query', {
        modelName,
        options
      });

      // Build filter expression
      let filter: any = undefined;
      let filtersApplied = 0;

      if (options.filters) {
        filter = this.buildAdvancedFilter(modelName, options.filters);
        filtersApplied = this.countFilters(options.filters);
      }

      // Build query options
      const queryOptions: any = {
        limit: options.pagination?.limit || 50
      };

      if (filter) {
        queryOptions.filter = filter;
      }

      if (options.pagination?.nextToken) {
        queryOptions.nextToken = options.pagination.nextToken;
      }

      // Execute query
      const result = await (filteringClient.models as any)[modelName].list(queryOptions);

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      const executionTime = Date.now() - startTime;

      filteringLogger.debug('Advanced query completed', {
        modelName,
        itemCount: result.data?.length || 0,
        executionTime,
        filtersApplied
      });

      return {
        success: true,
        data: result.data || [],
        pagination: {
          nextToken: result.nextToken,
          hasNextPage: !!result.nextToken
        },
        metadata: {
          executionTime,
          filtersApplied
        }
      };
    } catch (error) {
      filteringLogger.error('Advanced query failed', {
        modelName,
        options,
        error
      });
      return {
        success: false,
        error
      };
    }
  }

  /**
   * Get filter suggestions based on model and field
   */
  async getFilterSuggestions(
    modelName: keyof Schema['models'],
    field: string,
    partialValue?: string
  ): Promise<{
    success: boolean;
    suggestions?: Array<{
      value: any;
      label: string;
      count?: number;
    }>;
    error?: any;
  }> {
    try {
      filteringLogger.debug('Getting filter suggestions', {
        modelName,
        field,
        partialValue
      });

      const schema = this.filterSchemas.get(String(modelName));
      if (!schema?.fields[field]) {
        throw new Error(`Field '${field}' not found in schema for model '${modelName}'`);
      }

      // For enum fields, return all possible values
      const fieldSchema = schema.fields[field];
      if (fieldSchema.type === 'enum' && fieldSchema.values) {
        const suggestions = fieldSchema.values
          .filter((value: string) => 
            !partialValue || value.toLowerCase().includes(partialValue.toLowerCase())
          )
          .map((value: string) => ({
            value,
            label: value
          }));

        return { success: true, suggestions };
      }

      // For other fields, query existing values
      const distinctValues = await this.getDistinctFieldValues(modelName, field, partialValue);
      
      return {
        success: true,
        suggestions: distinctValues.map(value => ({
          value,
          label: String(value)
        }))
      };
    } catch (error) {
      filteringLogger.error('Failed to get filter suggestions', {
        modelName,
        field,
        partialValue,
        error
      });
      return { success: false, error };
    }
  }

  /**
   * Get distinct values for a field (simplified implementation)
   */
  private async getDistinctFieldValues(
    modelName: keyof Schema['models'],
    field: string,
    partialValue?: string
  ): Promise<any[]> {
    // This is a simplified implementation
    // In a real scenario, you'd want to use aggregation or maintain a separate index
    try {
      const result = await (filteringClient.models as any)[modelName].list({
        limit: 1000 // Limited for performance
      });

      if (!result.data) return [];

      const values = new Set();
      result.data.forEach((item: any) => {
        if (item[field] !== null && item[field] !== undefined) {
          const value = item[field];
          if (!partialValue || String(value).toLowerCase().includes(partialValue.toLowerCase())) {
            values.add(value);
          }
        }
      });

      return Array.from(values).slice(0, 20); // Limit suggestions
    } catch (error) {
      filteringLogger.error('Failed to get distinct field values', { modelName, field, error });
      return [];
    }
  }

  /**
   * Create saved filters for reuse
   */
  async saveFilter(
    name: string,
    modelName: keyof Schema['models'],
    filterDefinition: FilterDefinition,
    metadata?: {
      description?: string;
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<{ success: boolean; filterId?: string; error?: any }> {
    try {
      const savedFilter = {
        id: this.generateFilterId(),
        name,
        modelName: String(modelName),
        filterDefinition,
        metadata: {
          description: metadata?.description || '',
          tags: metadata?.tags || [],
          isPublic: metadata?.isPublic || false,
          createdAt: new Date().toISOString(),
          createdBy: 'current_user' // Would be actual user ID
        }
      };

      // In a real implementation, this would be saved to the database
      this.filterCache.set(savedFilter.id, savedFilter);

      filteringLogger.info('Filter saved', {
        filterId: savedFilter.id,
        name,
        modelName
      });

      return {
        success: true,
        filterId: savedFilter.id
      };
    } catch (error) {
      filteringLogger.error('Failed to save filter', { name, modelName, error });
      return { success: false, error };
    }
  }

  /**
   * Load saved filter
   */
  async loadFilter(filterId: string): Promise<{
    success: boolean;
    filter?: {
      id: string;
      name: string;
      modelName: string;
      filterDefinition: FilterDefinition;
      metadata: any;
    };
    error?: any;
  }> {
    try {
      const filter = this.filterCache.get(filterId);
      if (!filter) {
        throw new Error(`Filter not found: ${filterId}`);
      }

      return { success: true, filter };
    } catch (error) {
      filteringLogger.error('Failed to load filter', { filterId, error });
      return { success: false, error };
    }
  }

  /**
   * Validate filter definition
   */
  validateFilter(
    modelName: keyof Schema['models'],
    filterDefinition: FilterDefinition
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.buildAdvancedFilter(modelName, filterDefinition);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Utility methods
   */
  private countFilters(filterDefinition: FilterDefinition): number {
    if (filterDefinition.and) {
      return filterDefinition.and.reduce((count, filter) => count + this.countFilters(filter), 0);
    }
    if (filterDefinition.or) {
      return filterDefinition.or.reduce((count, filter) => count + this.countFilters(filter), 0);
    }
    if (filterDefinition.not) {
      return this.countFilters(filterDefinition.not);
    }
    return 1; // Single field filter
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private generateFilterId(): string {
    return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get available filter operators for a field
   */
  getFieldOperators(modelName: keyof Schema['models'], field: string): string[] {
    const schema = this.filterSchemas.get(String(modelName));
    return schema?.fields[field]?.operators || [];
  }

  /**
   * Get model schema for building filter UI
   */
  getModelFilterSchema(modelName: keyof Schema['models']): any {
    return this.filterSchemas.get(String(modelName));
  }

  /**
   * Performance statistics
   */
  getPerformanceStats() {
    return {
      savedFilters: this.filterCache.size,
      initializedSchemas: this.filterSchemas.size,
      supportedModels: Array.from(this.filterSchemas.keys())
    };
  }
}

// Type definitions for advanced filtering
export interface FilterDefinition {
  and?: FilterDefinition[];
  or?: FilterDefinition[];
  not?: FilterDefinition;
  field?: string;
  operator?: string;
  value?: any;
}

export interface FieldFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'beginsWith' | 'between' | 'in' | 'notIn';
  value: any;
}

export interface SortDefinition {
  field: string;
  direction: 'asc' | 'desc';
}

// Initialize and export singleton
export const advancedFilteringService = AdvancedFilteringService.getInstance();

// Initialize filter schemas on module load
advancedFilteringService.initializeFilterSchemas();

// React hooks for advanced filtering
export const useAdvancedFiltering = {
  /**
   * Hook for building and executing advanced queries
   */
  useAdvancedQuery: <T = any>(
    modelName: keyof Schema['models'],
    options: any = {}
  ) => {
    // Would be implemented as React hook
    return {
      data: [] as T[],
      loading: false,
      error: null,
      refetch: () => {},
      setFilters: (filters: FilterDefinition) => {},
      clearFilters: () => {}
    };
  },

  /**
   * Hook for filter suggestions
   */
  useFilterSuggestions: (
    modelName: keyof Schema['models'],
    field: string
  ) => {
    return {
      suggestions: [] as Array<{ value: any; label: string }>,
      loading: false,
      getSuggestions: (partialValue?: string) => {}
    };
  }
};