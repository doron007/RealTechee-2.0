/**
 * Service layer exports
 * Centralized access to all services and their interfaces
 */

// Core service interfaces and base classes
export * from './interfaces/IBaseService';
export * from './core/BaseService';

// Business service implementations
export * from './business/RequestService';
export * from './business/QuoteService';
export * from './business/ProjectService';

// Service instances for easy import
export { requestService } from './business/RequestService';
export { quoteService } from './business/QuoteService';
export { projectService } from './business/ProjectService';