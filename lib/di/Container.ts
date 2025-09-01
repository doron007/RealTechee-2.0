/**
 * Dependency Injection Container
 * Manages service dependencies and provides clean architecture boundaries
 */

import { createLogger } from '../../utils/logger';

const logger = createLogger('DIContainer');

export interface ServiceDefinition<T = any> {
  factory: (container: Container) => T;
  singleton?: boolean;
  dependencies?: string[];
}

export interface ServiceRegistry {
  [key: string]: ServiceDefinition;
}

export class Container {
  private services = new Map<string, ServiceDefinition>();
  private instances = new Map<string, any>();
  private isResolving = new Set<string>();

  constructor() {
    logger.debug('Initializing DI Container');
  }

  /**
   * Register a service in the container
   */
  register<T>(name: string, definition: ServiceDefinition<T>): void {
    logger.debug(`Registering service: ${name}`, { 
      singleton: definition.singleton,
      dependencies: definition.dependencies 
    });
    
    this.services.set(name, definition);
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(name: string, factory: (container: Container) => T, dependencies?: string[]): void {
    this.register(name, {
      factory,
      singleton: true,
      dependencies
    });
  }

  /**
   * Register a transient service (new instance each time)
   */
  registerTransient<T>(name: string, factory: (container: Container) => T, dependencies?: string[]): void {
    this.register(name, {
      factory,
      singleton: false,
      dependencies
    });
  }

  /**
   * Register an instance directly
   */
  registerInstance<T>(name: string, instance: T): void {
    logger.debug(`Registering instance: ${name}`);
    this.instances.set(name, instance);
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(name: string): T {
    // Check for circular dependencies
    if (this.isResolving.has(name)) {
      throw new Error(`Circular dependency detected for service: ${name}`);
    }

    // Return existing instance if already created
    if (this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Get service definition
    const definition = this.services.get(name);
    if (!definition) {
      throw new Error(`Service not found: ${name}`);
    }

    // Mark as resolving
    this.isResolving.add(name);

    try {
      logger.debug(`Resolving service: ${name}`);
      
      // Resolve dependencies first
      if (definition.dependencies) {
        for (const dep of definition.dependencies) {
          this.resolve(dep);
        }
      }

      // Create instance
      const instance = definition.factory(this);

      // Cache singleton instances
      if (definition.singleton !== false) {
        this.instances.set(name, instance);
      }

      logger.debug(`Successfully resolved service: ${name}`);
      return instance;

    } catch (error) {
      logger.error(`Failed to resolve service: ${name}`, { error });
      throw error;
    } finally {
      // Remove from resolving set
      this.isResolving.delete(name);
    }
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name) || this.instances.has(name);
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys()).concat(Array.from(this.instances.keys()));
  }

  /**
   * Clear all instances (useful for testing)
   */
  clearInstances(): void {
    logger.debug('Clearing all service instances');
    this.instances.clear();
  }

  /**
   * Reset the container completely
   */
  reset(): void {
    logger.debug('Resetting DI Container');
    this.services.clear();
    this.instances.clear();
    this.isResolving.clear();
  }
}

// Create default container instance
export const container = new Container();