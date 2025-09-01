/**
 * GraphQL Client wrapper around Amplify's generateClient
 * Provides centralized error handling, logging, and auth mode management
 */

import { generateClient } from 'aws-amplify/api';
import { createLogger } from '../../../utils/logger';
import {
  GraphQLResponse,
  GraphQLOperation,
  AuthMode,
  RepositoryConfig,
  ServiceResult,
  RepositoryMetrics
} from './types';
import {
  RepositoryError,
  RepositoryErrorCode,
  GraphQLError,
  NetworkError,
  AuthenticationError,
  createRepositoryError
} from './RepositoryError';

/**
 * GraphQL Client configuration
 */
export interface GraphQLClientConfig {
  /** Default authentication mode */
  defaultAuthMode: AuthMode;
  /** Enable request/response logging */
  enableLogging: boolean;
  /** Logger name */
  loggerName: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Enable performance metrics */
  enableMetrics: boolean;
}

/**
 * Default client configuration
 */
const DEFAULT_CONFIG: GraphQLClientConfig = {
  defaultAuthMode: 'apiKey',
  enableLogging: true,
  loggerName: 'GraphQLClient',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  enableMetrics: false
};

/**
 * Performance metrics collector
 */
class MetricsCollector {
  private metrics: RepositoryMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  recordMetric(metric: RepositoryMetrics): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(operation?: string, model?: string): RepositoryMetrics[] {
    return this.metrics.filter(m => 
      (!operation || m.operation === operation) &&
      (!model || m.model === model)
    );
  }

  getAverageResponseTime(operation?: string, model?: string): number {
    const filteredMetrics = this.getMetrics(operation, model);
    if (filteredMetrics.length === 0) return 0;

    const total = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(total / filteredMetrics.length);
  }

  getSuccessRate(operation?: string, model?: string): number {
    const filteredMetrics = this.getMetrics(operation, model);
    if (filteredMetrics.length === 0) return 0;

    const successCount = filteredMetrics.filter(m => m.success).length;
    return Math.round((successCount / filteredMetrics.length) * 100);
  }

  clear(): void {
    this.metrics = [];
  }
}

/**
 * GraphQL Client wrapper with enhanced error handling and logging
 */
export class GraphQLClient {
  private readonly config: GraphQLClientConfig;
  private readonly logger: any;
  private readonly apiKeyClient: any;
  private readonly userPoolClient: any;
  private readonly metricsCollector: MetricsCollector;

  constructor(config: Partial<GraphQLClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = createLogger(this.config.loggerName);
    this.metricsCollector = new MetricsCollector();

    // Initialize Amplify clients for different auth modes
    this.apiKeyClient = generateClient({ authMode: 'apiKey' });
    this.userPoolClient = generateClient({ authMode: 'userPool' });

    if (this.config.enableLogging) {
      this.logger.info('GraphQL Client initialized', {
        defaultAuthMode: this.config.defaultAuthMode,
        timeout: this.config.timeout,
        maxRetries: this.config.maxRetries
      });
    }
  }

  /**
   * Execute a GraphQL operation with error handling and retries
   */
  async execute<T = any>(
    operation: GraphQLOperation,
    context?: { operation?: string; model?: string }
  ): Promise<ServiceResult<T>> {
    const startTime = Date.now();
    const authMode = operation.authMode || this.config.defaultAuthMode;
    const client = this.getClientForAuthMode(authMode);
    const operationName = context?.operation || 'query';
    const modelName = context?.model || 'unknown';

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        if (this.config.enableLogging && attempt > 0) {
          this.logger.warn(`Retrying GraphQL operation`, {
            operation: operationName,
            model: modelName,
            attempt: attempt + 1,
            maxRetries: this.config.maxRetries
          });
        }

        // Execute the GraphQL operation
        const result = await this.executeWithTimeout(client, operation);
        const duration = Date.now() - startTime;

        // Record success metrics
        if (this.config.enableMetrics) {
          this.metricsCollector.recordMetric({
            operation: operationName,
            model: modelName,
            duration,
            success: true,
            recordCount: this.extractRecordCount(result.data),
            cacheStatus: 'disabled',
            timestamp: new Date()
          });
        }

        // Handle GraphQL errors (non-fatal)
        if (result.errors && result.errors.length > 0) {
          if (this.config.enableLogging) {
            this.logger.warn(`GraphQL operation completed with warnings`, {
              operation: operationName,
              model: modelName,
              errorCount: result.errors.length,
              duration
            });
          }

          return {
            success: true,
            data: result.data,
            meta: {
              executionTime: duration,
              warnings: result.errors
            }
          };
        }

        // Success case
        if (this.config.enableLogging) {
          this.logger.info(`GraphQL operation completed successfully`, {
            operation: operationName,
            model: modelName,
            duration,
            hasData: !!result.data
          });
        }

        return {
          success: true,
          data: result.data,
          meta: {
            executionTime: duration
          }
        };

      } catch (error: any) {
        lastError = error;
        const duration = Date.now() - startTime;

        // Record failure metrics
        if (this.config.enableMetrics) {
          this.metricsCollector.recordMetric({
            operation: operationName,
            model: modelName,
            duration,
            success: false,
            errorCode: error.code || 'UNKNOWN',
            cacheStatus: 'disabled',
            timestamp: new Date()
          });
        }

        // Convert to repository error
        const repositoryError = this.handleGraphQLError(error, operationName, modelName);

        // Check if we should retry
        if (repositoryError.isRetryable() && attempt < this.config.maxRetries) {
          attempt++;
          await this.delay(this.config.retryDelay * attempt); // Exponential backoff
          continue;
        }

        // Final failure
        if (this.config.enableLogging) {
          this.logger.error(`GraphQL operation failed`, {
            operation: operationName,
            model: modelName,
            attempt: attempt + 1,
            errorCode: repositoryError.code,
            error: repositoryError.message,
            duration
          });
        }

        return {
          success: false,
          error: repositoryError,
          meta: {
            executionTime: duration
          }
        };
      }
    }

    // Should never reach here, but just in case
    return {
      success: false,
      error: createRepositoryError(lastError, operationName, modelName)
    };
  }

  /**
   * Execute query with simplified interface
   */
  async query<T = any>(
    query: string,
    variables?: Record<string, any>,
    options?: {
      authMode?: AuthMode;
      operation?: string;
      model?: string;
    }
  ): Promise<ServiceResult<T>> {
    return this.execute<T>(
      {
        query,
        variables,
        authMode: options?.authMode
      },
      {
        operation: options?.operation || 'query',
        model: options?.model
      }
    );
  }

  /**
   * Execute mutation with simplified interface
   */
  async mutate<T = any>(
    mutation: string,
    variables?: Record<string, any>,
    options?: {
      authMode?: AuthMode;
      operation?: string;
      model?: string;
    }
  ): Promise<ServiceResult<T>> {
    return this.execute<T>(
      {
        query: mutation,
        variables,
        authMode: options?.authMode
      },
      {
        operation: options?.operation || 'mutation',
        model: options?.model
      }
    );
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics(operation?: string, model?: string): {
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
  } {
    const metrics = this.metricsCollector.getMetrics(operation, model);
    return {
      averageResponseTime: this.metricsCollector.getAverageResponseTime(operation, model),
      successRate: this.metricsCollector.getSuccessRate(operation, model),
      totalRequests: metrics.length
    };
  }

  /**
   * Clear collected metrics
   */
  clearMetrics(): void {
    this.metricsCollector.clear();
  }

  /**
   * Get the appropriate client for auth mode
   */
  private getClientForAuthMode(authMode: AuthMode): any {
    switch (authMode) {
      case 'apiKey':
        return this.apiKeyClient;
      case 'userPool':
        return this.userPoolClient;
      default:
        this.logger.warn(`Unsupported auth mode: ${authMode}, falling back to apiKey`);
        return this.apiKeyClient;
    }
  }

  /**
   * Execute GraphQL operation with timeout
   */
  private async executeWithTimeout(
    client: any,
    operation: GraphQLOperation
  ): Promise<GraphQLResponse> {
    const timeout = operation.timeout || this.config.timeout;

    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('GraphQL operation timeout'));
      }, timeout);

      try {
        const result = await client.graphql({
          query: operation.query,
          variables: operation.variables || {},
          authMode: operation.authMode
        });

        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handle and convert GraphQL errors to repository errors
   */
  private handleGraphQLError(
    error: any,
    operation: string,
    model: string
  ): RepositoryError {
    // Network/connection errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return new NetworkError(
        error.message || 'Network error occurred',
        { operation, model },
        error
      );
    }

    // Authentication errors
    if (error.code === 'UNAUTHORIZED' || error.message?.includes('Unauthorized')) {
      return new AuthenticationError(
        error.message || 'Authentication failed',
        { operation, model },
        error
      );
    }

    // GraphQL-specific errors
    if (error.errors && Array.isArray(error.errors)) {
      return new GraphQLError(error.errors, { operation, model });
    }

    // Timeout errors
    if (error.message?.includes('timeout')) {
      return new RepositoryError(
        RepositoryErrorCode.TIMEOUT_ERROR,
        error.message || 'Operation timeout',
        'The request took too long. Please try again.',
        { operation, model },
        error
      );
    }

    // Generic error
    return createRepositoryError(error, operation, model);
  }

  /**
   * Extract record count from GraphQL response for metrics
   */
  private extractRecordCount(data: any): number {
    if (!data) return 0;

    // Common patterns for list operations
    if (data.items && Array.isArray(data.items)) {
      return data.items.length;
    }

    // Single record operations
    if (typeof data === 'object' && data.id) {
      return 1;
    }

    // Look for array properties
    const values = Object.values(data);
    for (const value of values) {
      if (Array.isArray(value)) {
        return value.length;
      }
    }

    return 0;
  }

  /**
   * Utility delay function for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}