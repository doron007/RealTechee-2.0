/**
 * Centralized GraphQL client implementation
 * Wraps Amplify GraphQL client with consistent error handling and retry logic
 */

import { generateClient } from 'aws-amplify/api';
import { createLogger } from '../../utils/logger';
import { 
  IAmplifyGraphQLClient, 
  GraphQLResult, 
  GraphQLSubscription 
} from '../interfaces/IGraphQLClient';

const logger = createLogger('GraphQLClient');

export class GraphQLClient implements IAmplifyGraphQLClient {
  private client: any;
  private currentAuthMode: 'apiKey' | 'userPool' | 'oidc' | 'lambda' = 'apiKey';
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor(authMode: 'apiKey' | 'userPool' | 'oidc' | 'lambda' = 'apiKey') {
    this.currentAuthMode = authMode;
    this.client = generateClient({ authMode });
  }

  withAuthMode(authMode: 'apiKey' | 'userPool' | 'oidc' | 'lambda'): IAmplifyGraphQLClient {
    return new GraphQLClient(authMode);
  }

  async query<TData, TVariables = any>(
    query: string, 
    variables?: TVariables
  ): Promise<GraphQLResult<TData>> {
    return this.executeWithRetry(async () => {
      logger.debug('Executing GraphQL query', { 
        authMode: this.currentAuthMode,
        hasVariables: !!variables 
      });

      const result = await this.client.graphql({
        query,
        variables,
        authMode: this.currentAuthMode
      });

      if (result.errors && result.errors.length > 0) {
        logger.warn('GraphQL query returned errors', result.errors);
      }

      return result;
    });
  }

  async mutate<TData, TVariables = any>(
    mutation: string, 
    variables?: TVariables
  ): Promise<GraphQLResult<TData>> {
    return this.executeWithRetry(async () => {
      logger.debug('Executing GraphQL mutation', { 
        authMode: this.currentAuthMode,
        hasVariables: !!variables 
      });

      const result = await this.client.graphql({
        query: mutation,
        variables,
        authMode: this.currentAuthMode
      });

      if (result.errors && result.errors.length > 0) {
        logger.warn('GraphQL mutation returned errors', result.errors);
      }

      return result;
    });
  }

  async subscribe<TData, TVariables = any>(
    subscription: string,
    variables?: TVariables
  ): Promise<GraphQLSubscription<TData>> {
    logger.debug('Creating GraphQL subscription', { 
      authMode: this.currentAuthMode,
      hasVariables: !!variables 
    });

    const observable = this.client.graphql({
      query: subscription,
      variables,
      authMode: this.currentAuthMode
    });

    return {
      subscribe: (observer) => {
        const subscription = observable.subscribe(observer);
        return subscription;
      }
    };
  }

  async batchQuery<T>(queries: Array<{
    query: string;
    variables?: any;
  }>): Promise<GraphQLResult<T>[]> {
    logger.debug('Executing batch GraphQL queries', { count: queries.length });

    // Execute all queries in parallel
    const promises = queries.map(({ query, variables }) =>
      this.query<T>(query, variables)
    );

    return Promise.all(promises);
  }

  isConnected(): boolean {
    // Amplify GraphQL is connection-less (HTTP-based)
    return true;
  }

  async connect(): Promise<void> {
    // No-op for Amplify GraphQL
    logger.debug('GraphQL client connected');
  }

  async disconnect(): Promise<void> {
    // No-op for Amplify GraphQL
    logger.debug('GraphQL client disconnected');
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === this.retryAttempts) {
          logger.error(`GraphQL operation failed after ${this.retryAttempts} attempts`, lastError);
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          logger.error('Non-retryable GraphQL error', lastError);
          break;
        }

        logger.warn(`GraphQL operation failed, retrying (${attempt}/${this.retryAttempts})`, lastError);
        await this.delay(this.retryDelay * attempt); // Exponential backoff
      }
    }

    throw lastError;
  }

  private isRetryableError(error: any): boolean {
    // Common retryable errors
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'ThrottlingException',
      'ServiceUnavailableException'
    ];

    const errorMessage = error?.message || '';
    return retryableErrors.some(retryable => errorMessage.includes(retryable));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instances
export const apiKeyClient = new GraphQLClient('apiKey');
export const userPoolClient = new GraphQLClient('userPool');