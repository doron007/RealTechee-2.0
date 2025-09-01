/**
 * Service Factory for Dependency Injection
 * 
 * Centralizes service instantiation and dependency management
 * to ensure consistent service configurations across the application.
 */

import { RequestService, createRequestService } from '../../services/domain/request/RequestService';
import { RequestRepository } from '../../repositories/RequestRepository';
import { GraphQLClient } from '../../repositories/base/GraphQLClient';

// ============================================================================
// Service Instances (Singletons)
// ============================================================================

let graphqlClientInstance: GraphQLClient | null = null;
let requestRepositoryInstance: RequestRepository | null = null;
let requestServiceInstance: RequestService | null = null;

// Additional service instances would be added here:
// let notificationServiceInstance: NotificationService | null = null;
// let contactServiceInstance: ContactService | null = null;
// let propertyServiceInstance: PropertyService | null = null;
// let auditServiceInstance: AuditService | null = null;

// ============================================================================
// Configuration Options
// ============================================================================

interface ServiceConfig {
  /** GraphQL endpoint configuration */
  graphql?: {
    endpoint?: string;
    authMode?: 'apiKey' | 'userPool' | 'oidc' | 'identityPool';
    region?: string;
  };
  
  /** Enable/disable specific service features */
  features?: {
    notifications?: boolean;
    audit?: boolean;
    realTime?: boolean;
    caching?: boolean;
  };
  
  /** Environment-specific settings */
  environment?: 'development' | 'staging' | 'production';
}

const defaultConfig: ServiceConfig = {
  graphql: {
    authMode: 'apiKey',
  },
  features: {
    notifications: true,
    audit: true,
    realTime: true,
    caching: true,
  },
  environment: (process.env.NODE_ENV as any) || 'development',
};

let currentConfig: ServiceConfig = defaultConfig;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Configure services with custom options
 */
export function configureServices(config: Partial<ServiceConfig>): void {
  currentConfig = { ...defaultConfig, ...config };
  
  // Reset instances to force recreation with new config
  graphqlClientInstance = null;
  requestRepositoryInstance = null;
  requestServiceInstance = null;
}

/**
 * Get or create GraphQL client instance
 */
export function getGraphQLClient(): GraphQLClient {
  if (!graphqlClientInstance) {
    // Create GraphQL client with proper config
    const config = {
      defaultAuthMode: (currentConfig.graphql?.authMode || 'apiKey') as 'apiKey' | 'userPool' | 'oidc' | 'identityPool',
      enableLogging: true,
      loggerName: 'GraphQLClient',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      enableMetrics: true,
    };
    graphqlClientInstance = new GraphQLClient(config);
  }
  return graphqlClientInstance;
}

/**
 * Get or create RequestRepository instance
 */
export function getRequestRepository(): RequestRepository {
  if (!requestRepositoryInstance) {
    const graphqlClient = getGraphQLClient();
    requestRepositoryInstance = new RequestRepository(graphqlClient);
  }
  return requestRepositoryInstance;
}

/**
 * Get or create RequestService instance with full dependency injection
 */
export function getRequestService(): RequestService {
  if (!requestServiceInstance) {
    const requestRepository = getRequestRepository();
    
    // TODO: Initialize other services when they're implemented
    const notificationService = currentConfig.features?.notifications 
      ? getNotificationService() 
      : undefined;
    const contactService = getContactService();
    const propertyService = getPropertyService();
    const auditService = currentConfig.features?.audit 
      ? getAuditService() 
      : undefined;
    
    requestServiceInstance = createRequestService({
      requestRepository,
      notificationService,
      contactService,
      propertyService,
      auditService,
    });
  }
  return requestServiceInstance;
}

// ============================================================================
// Placeholder Service Factories (To be implemented)
// ============================================================================

/**
 * Get or create NotificationService instance
 * TODO: Implement when NotificationService is created
 */
function getNotificationService(): any {
  console.warn('NotificationService not yet implemented');
  return undefined;
}

/**
 * Get or create ContactService instance
 * TODO: Implement when ContactService is created
 */
function getContactService(): any {
  console.warn('ContactService not yet implemented');
  return undefined;
}

/**
 * Get or create PropertyService instance
 * TODO: Implement when PropertyService is created
 */
function getPropertyService(): any {
  console.warn('PropertyService not yet implemented');
  return undefined;
}

/**
 * Get or create AuditService instance
 * TODO: Implement when AuditService is created
 */
function getAuditService(): any {
  console.warn('AuditService not yet implemented');
  return undefined;
}

// ============================================================================
// Service Registry
// ============================================================================

/**
 * Service registry for accessing all services
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  
  private constructor(private config: ServiceConfig = defaultConfig) {}
  
  static getInstance(config?: Partial<ServiceConfig>): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry(config);
    }
    
    if (config) {
      ServiceRegistry.instance.configure(config);
    }
    
    return ServiceRegistry.instance;
  }
  
  configure(config: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...config };
    configureServices(this.config);
  }
  
  get requests(): RequestService {
    return getRequestService();
  }
  
  get requestRepository(): RequestRepository {
    return getRequestRepository();
  }
  
  get graphqlClient(): GraphQLClient {
    return getGraphQLClient();
  }
  
  // TODO: Add other services as they're implemented
  // get notifications(): NotificationService { return getNotificationService(); }
  // get contacts(): ContactService { return getContactService(); }
  // get properties(): PropertyService { return getPropertyService(); }
  // get audit(): AuditService { return getAuditService(); }
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Default service registry instance
 */
export const services = ServiceRegistry.getInstance();

/**
 * Quick access to commonly used services
 */
export const requestService = () => getRequestService();
export const requestRepository = () => getRequestRepository();

// ============================================================================
// Development Utilities
// ============================================================================

/**
 * Reset all service instances (useful for testing)
 */
export function resetServices(): void {
  graphqlClientInstance = null;
  requestRepositoryInstance = null;
  requestServiceInstance = null;
}

/**
 * Get service health status (for debugging)
 */
export function getServiceStatus(): {
  graphqlClient: boolean;
  requestRepository: boolean;
  requestService: boolean;
  config: ServiceConfig;
} {
  return {
    graphqlClient: !!graphqlClientInstance,
    requestRepository: !!requestRepositoryInstance,
    requestService: !!requestServiceInstance,
    config: currentConfig,
  };
}

/**
 * Initialize services with environment-specific configuration
 */
export function initializeServices(): void {
  const environment = process.env.NODE_ENV || 'development';
  
  const environmentConfigs: Record<string, Partial<ServiceConfig>> = {
    development: {
      features: {
        notifications: true,
        audit: true,
        realTime: true,
        caching: true,
      },
    },
    staging: {
      features: {
        notifications: true,
        audit: true,
        realTime: true,
        caching: true,
      },
    },
    production: {
      features: {
        notifications: true,
        audit: true,
        realTime: false, // Disable for performance in production
        caching: true,
      },
    },
  };
  
  const config = environmentConfigs[environment] || environmentConfigs.development;
  configureServices({ ...config, environment: environment as any });
  
  console.log(`Services initialized for ${environment} environment`);
}