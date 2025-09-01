/**
 * Base Repository Pattern Exports
 * Centralized exports for the repository pattern implementation
 */

// Core Repository Interface and Base Class
export type { IRepository } from './BaseRepository';
export { BaseRepository } from './BaseRepository';
export type { BaseRepositoryConfig } from './BaseRepository';

// GraphQL Client
export { GraphQLClient } from './GraphQLClient';
export type { GraphQLClientConfig } from './GraphQLClient';

// Error Classes and Types
export {
  RepositoryError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  NetworkError,
  GraphQLError,
  createRepositoryError,
  RepositoryErrorCode,
  ERROR_MESSAGES
} from './RepositoryError';

// Common Types
export type {
  // Core Types
  ServiceResult,
  PaginatedResult,
  BaseModel,
  
  // Operation Types
  CreateInput,
  UpdateInput,
  ListOptions,
  
  // Filter and Sort Types
  FilterOptions,
  FilterCondition,
  SortOptions,
  PaginationOptions,
  
  // GraphQL Types
  GraphQLResponse,
  GraphQLOperation,
  GraphQLError as GraphQLErrorType,
  AuthMode,
  
  // Configuration Types
  RepositoryConfig,
  CacheOptions,
  AuditFields,
  
  // Validation Types
  ValidationError as ValidationErrorType,
  
  // Metrics Types
  RepositoryMetrics
} from './types';

// Re-export types for factory pattern
import type { BaseModel } from './types';
import type { GraphQLClient } from './GraphQLClient';
import type { IRepository } from './BaseRepository';

// Utility type for creating repository instances
export type RepositoryFactory<T extends BaseModel> = {
  new (client: GraphQLClient, config: any): IRepository<T>;
};

/**
 * Repository Pattern Usage Example:
 * 
 * ```typescript
 * import { GraphQLClient, BaseRepository, IRepository } from '@/repositories/base';
 * 
 * // 1. Define your model interface
 * interface Contact extends BaseModel {
 *   firstName: string;
 *   lastName: string;
 *   email: string;
 * }
 * 
 * // 2. Create repository class
 * class ContactRepository extends BaseRepository<Contact> {
 *   constructor(client: GraphQLClient) {
 *     super(client, {
 *       modelName: 'Contact',
 *       graphqlTypeName: 'Contact'
 *     });
 *   }
 * 
 *   protected getCreateMutation(): string {
 *     return `
 *       mutation CreateContact($input: CreateContactInput!) {
 *         createContact(input: $input) {
 *           id
 *           firstName
 *           lastName
 *           email
 *           createdAt
 *           updatedAt
 *         }
 *       }
 *     `;
 *   }
 * 
 *   // ... implement other required methods
 * }
 * 
 * // 3. Use the repository
 * const client = new GraphQLClient();
 * const contactRepo = new ContactRepository(client);
 * 
 * // Create
 * const result = await contactRepo.create({
 *   data: {
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com'
 *   }
 * });
 * 
 * // List with filtering
 * const contacts = await contactRepo.list({
 *   filter: {
 *     firstName: { contains: 'John' }
 *   },
 *   pagination: { limit: 20 },
 *   sort: { field: 'createdAt', direction: 'desc' }
 * });
 * ```
 */