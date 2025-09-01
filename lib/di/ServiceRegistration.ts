/**
 * Service Registration Configuration
 * Configures all services with proper dependency injection
 */

import { container } from './Container';
import { createLogger } from '../../utils/logger';

// Repository imports
import { 
  requestRepository, 
  quoteRepository, 
  projectRepository, 
  contactRepository, 
  propertyRepository 
} from '../../repositories';
import type { RequestRepository } from '../../repositories/RequestRepository';
import type { QuoteRepository } from '../../repositories/QuoteRepository';
import type { ProjectRepository } from '../../repositories/ProjectRepository';
import type { ContactRepository } from '../../repositories/ContactRepository';
import type { PropertyRepository } from '../../repositories/PropertyRepository';

// Service imports
import { RequestService } from '../../services/business/RequestService';
import { QuoteService } from '../../services/business/QuoteService';
import { ProjectService } from '../../services/business/ProjectService';

const logger = createLogger('ServiceRegistration');

/**
 * Service identifiers for type-safe resolution
 */
export const SERVICE_IDENTIFIERS = {
  // Repositories
  REQUEST_REPOSITORY: 'RequestRepository',
  QUOTE_REPOSITORY: 'QuoteRepository', 
  PROJECT_REPOSITORY: 'ProjectRepository',
  CONTACT_REPOSITORY: 'ContactRepository',
  PROPERTY_REPOSITORY: 'PropertyRepository',
  
  // Services
  REQUEST_SERVICE: 'RequestService',
  QUOTE_SERVICE: 'QuoteService',
  PROJECT_SERVICE: 'ProjectService',
  
  // Infrastructure
  LOGGER: 'Logger',
  EVENT_BUS: 'EventBus',
  CACHE_MANAGER: 'CacheManager',
} as const;

export type ServiceIdentifier = typeof SERVICE_IDENTIFIERS[keyof typeof SERVICE_IDENTIFIERS];

/**
 * Register all repositories
 */
function registerRepositories(): void {
  logger.info('Registering repositories');

  // Register repository instances as singletons
  container.registerInstance(SERVICE_IDENTIFIERS.REQUEST_REPOSITORY, requestRepository);
  container.registerInstance(SERVICE_IDENTIFIERS.QUOTE_REPOSITORY, quoteRepository);
  container.registerInstance(SERVICE_IDENTIFIERS.PROJECT_REPOSITORY, projectRepository);
  container.registerInstance(SERVICE_IDENTIFIERS.CONTACT_REPOSITORY, contactRepository);
  container.registerInstance(SERVICE_IDENTIFIERS.PROPERTY_REPOSITORY, propertyRepository);
}

/**
 * Register all business services
 */
function registerServices(): void {
  logger.info('Registering business services');

  // Register RequestService with dependencies
  container.registerSingleton(
    SERVICE_IDENTIFIERS.REQUEST_SERVICE,
    (container) => {
      const requestRepo = container.resolve<RequestRepository>(SERVICE_IDENTIFIERS.REQUEST_REPOSITORY);
      const contactRepo = container.resolve<ContactRepository>(SERVICE_IDENTIFIERS.CONTACT_REPOSITORY);
      const propertyRepo = container.resolve<PropertyRepository>(SERVICE_IDENTIFIERS.PROPERTY_REPOSITORY);
      
      const service = new RequestService();
      // Note: Services already have repository instances via singleton imports
      // In a full DI implementation, we would inject repositories through constructor
      return service;
    },
    [SERVICE_IDENTIFIERS.REQUEST_REPOSITORY, SERVICE_IDENTIFIERS.CONTACT_REPOSITORY, SERVICE_IDENTIFIERS.PROPERTY_REPOSITORY]
  );

  // Register QuoteService with dependencies
  container.registerSingleton(
    SERVICE_IDENTIFIERS.QUOTE_SERVICE,
    (container) => {
      const quoteRepo = container.resolve<QuoteRepository>(SERVICE_IDENTIFIERS.QUOTE_REPOSITORY);
      const requestRepo = container.resolve<RequestRepository>(SERVICE_IDENTIFIERS.REQUEST_REPOSITORY);
      
      const service = new QuoteService();
      return service;
    },
    [SERVICE_IDENTIFIERS.QUOTE_REPOSITORY, SERVICE_IDENTIFIERS.REQUEST_REPOSITORY]
  );

  // Register ProjectService with dependencies
  container.registerSingleton(
    SERVICE_IDENTIFIERS.PROJECT_SERVICE,
    (container) => {
      const projectRepo = container.resolve<ProjectRepository>(SERVICE_IDENTIFIERS.PROJECT_REPOSITORY);
      const requestRepo = container.resolve<RequestRepository>(SERVICE_IDENTIFIERS.REQUEST_REPOSITORY);
      const quoteRepo = container.resolve<QuoteRepository>(SERVICE_IDENTIFIERS.QUOTE_REPOSITORY);
      
      const service = new ProjectService();
      return service;
    },
    [SERVICE_IDENTIFIERS.PROJECT_REPOSITORY, SERVICE_IDENTIFIERS.REQUEST_REPOSITORY, SERVICE_IDENTIFIERS.QUOTE_REPOSITORY]
  );
}

/**
 * Register infrastructure services
 */
function registerInfrastructure(): void {
  logger.info('Registering infrastructure services');

  // Register logger factory
  container.registerTransient(
    SERVICE_IDENTIFIERS.LOGGER,
    () => createLogger('DIResolved')
  );

  // Register event bus (placeholder for future implementation)
  container.registerSingleton(
    SERVICE_IDENTIFIERS.EVENT_BUS,
    () => ({
      emit: (event: string, data: any) => logger.debug(`Event emitted: ${event}`, data),
      on: (event: string, handler: Function) => logger.debug(`Event listener registered: ${event}`)
    })
  );

  // Register cache manager (placeholder for future implementation)
  container.registerSingleton(
    SERVICE_IDENTIFIERS.CACHE_MANAGER,
    () => ({
      get: async (key: string) => null,
      set: async (key: string, value: any, ttl?: number) => true,
      clear: async (pattern?: string) => true
    })
  );
}

/**
 * Initialize all service registrations
 */
export function initializeServices(): void {
  try {
    logger.info('Initializing dependency injection container');
    
    registerRepositories();
    registerServices();
    registerInfrastructure();
    
    logger.info('All services registered successfully', {
      totalServices: container.getServiceNames().length,
      services: container.getServiceNames()
    });
    
  } catch (error) {
    logger.error('Failed to initialize services', { error });
    throw error;
  }
}

/**
 * Type-safe service resolution
 */
export function getService<T>(identifier: ServiceIdentifier): T {
  return container.resolve<T>(identifier);
}

/**
 * Utility functions for common service access
 */
export const serviceAccessors = {
  getRequestService: () => getService<RequestService>(SERVICE_IDENTIFIERS.REQUEST_SERVICE),
  getQuoteService: () => getService<QuoteService>(SERVICE_IDENTIFIERS.QUOTE_SERVICE),
  getProjectService: () => getService<ProjectService>(SERVICE_IDENTIFIERS.PROJECT_SERVICE),
  
  getRequestRepository: () => getService<RequestRepository>(SERVICE_IDENTIFIERS.REQUEST_REPOSITORY),
  getQuoteRepository: () => getService<QuoteRepository>(SERVICE_IDENTIFIERS.QUOTE_REPOSITORY),
  getProjectRepository: () => getService<ProjectRepository>(SERVICE_IDENTIFIERS.PROJECT_REPOSITORY),
  getContactRepository: () => getService<ContactRepository>(SERVICE_IDENTIFIERS.CONTACT_REPOSITORY),
  getPropertyRepository: () => getService<PropertyRepository>(SERVICE_IDENTIFIERS.PROPERTY_REPOSITORY),
};

/**
 * Validation to ensure all services can be resolved
 */
export function validateServiceConfiguration(): void {
  logger.info('Validating service configuration');
  
  const criticalServices = [
    SERVICE_IDENTIFIERS.REQUEST_SERVICE,
    SERVICE_IDENTIFIERS.QUOTE_SERVICE,
    SERVICE_IDENTIFIERS.PROJECT_SERVICE,
    SERVICE_IDENTIFIERS.REQUEST_REPOSITORY,
    SERVICE_IDENTIFIERS.QUOTE_REPOSITORY,
    SERVICE_IDENTIFIERS.PROJECT_REPOSITORY,
  ];
  
  for (const serviceId of criticalServices) {
    try {
      const service = container.resolve(serviceId);
      if (!service) {
        throw new Error(`Service resolution returned null/undefined for ${serviceId}`);
      }
      logger.debug(`✓ ${serviceId} resolves correctly`);
    } catch (error) {
      logger.error(`✗ Failed to resolve ${serviceId}`, { error });
      throw new Error(`Critical service validation failed: ${serviceId}`);
    }
  }
  
  logger.info('All critical services validated successfully');
}