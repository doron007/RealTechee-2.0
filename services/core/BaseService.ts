/**
 * Base service implementation
 * Provides common business logic patterns and validation
 */

import { createLogger } from '../../utils/logger';
import { 
  IService, 
  IBusinessService,
  ServiceResult, 
  ServiceQueryOptions,
  ValidationResult,
  ValidationError,
  BusinessState,
  BusinessRule
} from '../interfaces/IBaseService';
import { IRepository } from '../../repositories/interfaces/IBaseRepository';

const logger = createLogger('BaseService');

export abstract class BaseService<T, TFilter = any, TCreate = any, TUpdate = any, TRepository extends IRepository<T, TFilter> = IRepository<T, TFilter>> 
  implements IService<T, TFilter, TCreate, TUpdate> {
  
  protected abstract repository: TRepository;
  protected abstract entityName: string;
  
  // Business validation rules
  protected validationRules: ValidationRule<TCreate | TUpdate>[] = [];
  
  constructor() {}

  async create(data: TCreate): Promise<ServiceResult<T>> {
    try {
      logger.info(`Creating ${this.entityName}`, { data });
      
      // Business validation
      const validation = await this.validate(data);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Validation failed',
          metadata: { validationErrors: validation.errors }
        };
      }
      
      // Business rules check
      const canCreate = await this.canCreate(data);
      if (!canCreate) {
        return {
          success: false,
          error: `Cannot create ${this.entityName}: business rules violation`
        };
      }
      
      // Transform data for business requirements
      const transformedData = await this.transformForCreate(data);
      
      // Repository operation
      const result = await this.repository.create(transformedData as any);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      
      // Post-creation business logic
      await this.afterCreate(result.data!);
      
      logger.info(`Successfully created ${this.entityName}`, { id: (result.data as any).id });
      
      return {
        success: true,
        data: result.data,
        warnings: validation.warnings
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error creating ${this.entityName}`, { error: errorMessage });
      return {
        success: false,
        error: `Failed to create ${this.entityName}: ${errorMessage}`
      };
    }
  }

  async findById(id: string): Promise<ServiceResult<T>> {
    try {
      logger.debug(`Finding ${this.entityName} by ID`, { id });
      
      // Access validation
      const hasAccess = await this.checkReadAccess(id);
      if (!hasAccess) {
        return {
          success: false,
          error: 'Access denied'
        };
      }
      
      const result = await this.repository.findById(id);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      
      if (!result.data) {
        return {
          success: false,
          error: `${this.entityName} not found`
        };
      }
      
      // Transform for business presentation
      const transformedData = await this.transformForPresentation(result.data);
      
      return {
        success: true,
        data: transformedData,
        metadata: result.metadata
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error finding ${this.entityName}`, { id, error: errorMessage });
      return {
        success: false,
        error: `Failed to find ${this.entityName}: ${errorMessage}`
      };
    }
  }

  async findAll(options: ServiceQueryOptions<TFilter> = {}): Promise<ServiceResult<T[]>> {
    try {
      logger.debug(`Finding all ${this.entityName}s`, { options });
      
      // Access validation
      if (options.validateAccess !== false) {
        const hasAccess = await this.checkListAccess(options.filter);
        if (!hasAccess) {
          return {
            success: false,
            error: 'Access denied'
          };
        }
      }
      
      // Transform service options to repository options
      const repositoryOptions = await this.transformQueryOptions(options);
      
      const result = await this.repository.findAll(repositoryOptions);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      
      // Transform data for business presentation
      const transformedData = await Promise.all(
        (result.data || []).map(item => this.transformForPresentation(item))
      );
      
      logger.info(`Successfully found ${transformedData.length} ${this.entityName}s`);
      
      return {
        success: true,
        data: transformedData,
        metadata: result.metadata
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error finding ${this.entityName}s`, { error: errorMessage });
      return {
        success: false,
        error: `Failed to find ${this.entityName}s: ${errorMessage}`
      };
    }
  }

  async update(id: string, data: TUpdate): Promise<ServiceResult<T>> {
    try {
      logger.info(`Updating ${this.entityName}`, { id, data });
      
      // Business validation
      const validation = await this.validate(data);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Validation failed',
          metadata: { validationErrors: validation.errors }
        };
      }
      
      // Business rules check
      const canUpdate = await this.canUpdate(id, data);
      if (!canUpdate) {
        return {
          success: false,
          error: `Cannot update ${this.entityName}: business rules violation`
        };
      }
      
      // Transform data for business requirements
      const transformedData = await this.transformForUpdate(id, data);
      
      // Repository operation
      const result = await this.repository.update(id, transformedData as any);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      
      // Post-update business logic
      await this.afterUpdate(id, result.data!);
      
      logger.info(`Successfully updated ${this.entityName}`, { id });
      
      return {
        success: true,
        data: result.data,
        warnings: validation.warnings
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error updating ${this.entityName}`, { id, error: errorMessage });
      return {
        success: false,
        error: `Failed to update ${this.entityName}: ${errorMessage}`
      };
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      logger.info(`Deleting ${this.entityName}`, { id });
      
      // Business rules check
      const canDelete = await this.canDelete(id);
      if (!canDelete) {
        return {
          success: false,
          error: `Cannot delete ${this.entityName}: business rules violation`
        };
      }
      
      // Pre-deletion business logic
      await this.beforeDelete(id);
      
      // Repository operation
      const result = await this.repository.delete(id);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }
      
      // Post-deletion business logic
      await this.afterDelete(id);
      
      logger.info(`Successfully deleted ${this.entityName}`, { id });
      
      return {
        success: true,
        data: true
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error deleting ${this.entityName}`, { id, error: errorMessage });
      return {
        success: false,
        error: `Failed to delete ${this.entityName}: ${errorMessage}`
      };
    }
  }

  // Validation implementation
  async validate(data: TCreate | TUpdate): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    
    // Run all validation rules
    for (const rule of this.validationRules) {
      try {
        const result = await rule.validate(data);
        if (!result.valid) {
          errors.push(...result.errors);
        }
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      } catch (error) {
        logger.error('Validation rule failed', { rule: rule.name, error });
        errors.push({
          field: 'general',
          message: 'Internal validation error',
          code: 'VALIDATION_FAILED'
        });
      }
    }
    
    // Custom business validation
    const customValidation = await this.customValidation(data);
    errors.push(...customValidation.errors);
    warnings.push(...customValidation.warnings);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Business rules - to be implemented by subclasses
  async canCreate(data: TCreate): Promise<boolean> {
    return true; // Default: allow creation
  }

  async canUpdate(id: string, data: TUpdate): Promise<boolean> {
    return true; // Default: allow updates
  }

  async canDelete(id: string): Promise<boolean> {
    return true; // Default: allow deletion
  }

  // Access control - to be implemented by subclasses
  protected async checkReadAccess(id: string): Promise<boolean> {
    return true; // Default: allow read
  }

  protected async checkListAccess(filter?: TFilter): Promise<boolean> {
    return true; // Default: allow list
  }

  // Data transformation hooks - to be implemented by subclasses
  protected async transformForCreate(data: TCreate): Promise<TCreate> {
    return data; // Default: no transformation
  }

  protected async transformForUpdate(id: string, data: TUpdate): Promise<TUpdate> {
    return data; // Default: no transformation
  }

  protected async transformForPresentation(data: T): Promise<T> {
    return data; // Default: no transformation
  }

  protected async transformQueryOptions(options: ServiceQueryOptions<TFilter>): Promise<any> {
    return options; // Default: pass through
  }

  // Business logic hooks - to be implemented by subclasses
  protected async afterCreate(data: T): Promise<void> {
    // Default: no post-creation logic
  }

  protected async afterUpdate(id: string, data: T): Promise<void> {
    // Default: no post-update logic
  }

  protected async beforeDelete(id: string): Promise<void> {
    // Default: no pre-deletion logic
  }

  protected async afterDelete(id: string): Promise<void> {
    // Default: no post-deletion logic
  }

  // Custom validation hook - to be implemented by subclasses
  protected async customValidation(data: TCreate | TUpdate): Promise<{ errors: ValidationError[]; warnings: string[] }> {
    return { errors: [], warnings: [] }; // Default: no custom validation
  }

  // Utility methods
  protected addValidationRule(rule: ValidationRule<TCreate | TUpdate>): void {
    this.validationRules.push(rule);
  }

  protected createValidationError(field: string, message: string, code?: string): ValidationError {
    return { field, message, code };
  }
}

// Validation rule interface
export interface ValidationRule<T> {
  name: string;
  validate(data: T): Promise<{ valid: boolean; errors: ValidationError[]; warnings?: string[] }>;
}

// Common validation rules
export class RequiredFieldRule<T> implements ValidationRule<T> {
  constructor(public name: string, private field: keyof T, private fieldName?: string) {}

  async validate(data: T): Promise<{ valid: boolean; errors: ValidationError[]; warnings?: string[] }> {
    const value = data[this.field];
    const isEmpty = value === undefined || value === null || value === '';
    
    return {
      valid: !isEmpty,
      errors: isEmpty ? [{
        field: String(this.field),
        message: `${this.fieldName || String(this.field)} is required`,
        code: 'REQUIRED_FIELD'
      }] : []
    };
  }
}

export class EmailValidationRule<T> implements ValidationRule<T> {
  constructor(public name: string, private field: keyof T) {}

  async validate(data: T): Promise<{ valid: boolean; errors: ValidationError[]; warnings?: string[] }> {
    const email = data[this.field] as string;
    if (!email) return { valid: true, errors: [] }; // Let required field rule handle this
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    return {
      valid: isValid,
      errors: isValid ? [] : [{
        field: String(this.field),
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      }]
    };
  }
}