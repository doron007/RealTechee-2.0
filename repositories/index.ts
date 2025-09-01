/**
 * Repository layer exports
 * Centralized access to all repositories and their interfaces
 */

// Core interfaces and base classes
export * from './interfaces/IBaseRepository';
export * from './interfaces/IGraphQLClient';
export * from './core/BaseRepository';
export * from './core/GraphQLClient';

// Repository implementations
export * from './RequestRepository';
export * from './QuoteRepository';
export * from './ProjectRepository';
export * from './ContactRepository';
export * from './PropertyRepository';

// Singleton instances for easy import
export { requestRepository } from './RequestRepository';
export { quoteRepository } from './QuoteRepository';
export { projectRepository } from './ProjectRepository';
export { contactRepository } from './ContactRepository';
export { propertyRepository } from './PropertyRepository';

// GraphQL clients
export { apiKeyClient, userPoolClient } from './core/GraphQLClient';