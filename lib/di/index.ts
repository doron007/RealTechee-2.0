/**
 * Dependency Injection exports
 * Centralized access to DI container and service registration
 */

export { Container, container } from './Container';
export type { ServiceDefinition, ServiceRegistry } from './Container';

export { 
  initializeServices, 
  validateServiceConfiguration, 
  getService, 
  serviceAccessors,
  SERVICE_IDENTIFIERS 
} from './ServiceRegistration';
export type { ServiceIdentifier } from './ServiceRegistration';