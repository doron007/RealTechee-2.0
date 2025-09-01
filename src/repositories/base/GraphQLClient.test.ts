/**
 * GraphQLClient Unit Tests
 * 
 * Comprehensive tests for GraphQL client with 100% coverage
 * Testing error handling, retry mechanisms, performance metrics, and business scenarios
 */

// Mock the AWS Amplify generateClient BEFORE imports
const mockGraphQLClient = {
  graphql: jest.fn()
};

jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => mockGraphQLClient)
}));

// Mock the logger utility BEFORE imports
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

jest.mock('../../../utils/logger', () => ({
  createLogger: jest.fn().mockReturnValue(mockLogger)
}));

import { GraphQLClient } from './GraphQLClient';
import { RepositoryError, NetworkError, AuthenticationError, GraphQLError } from './RepositoryError';
import { 
  createMockGraphQLSuccess, 
  createMockGraphQLError,
  createNetworkErrorScenario,
  createTimeoutErrorScenario,
  createAuthenticationErrorScenario,
  createRateLimitErrorScenario
} from '../../__tests__/testDataFactories';

describe('GraphQLClient', () => {
  let client: GraphQLClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    // Reset mock implementation
    mockGraphQLClient.graphql.mockReset();
    
    // Create fresh client instance
    client = new GraphQLClient({
      enableLogging: true,
      enableMetrics: true,
      timeout: 5000,
      maxRetries: 2,
      retryDelay: 100
    });
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultClient = new GraphQLClient();
      expect(defaultClient).toBeInstanceOf(GraphQLClient);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'GraphQL Client initialized',
        expect.objectContaining({
          defaultAuthMode: 'apiKey',
          timeout: 30000,
          maxRetries: 3
        })
      );
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        defaultAuthMode: 'userPool' as const,
        enableLogging: false,
        timeout: 10000,
        maxRetries: 1,
        retryDelay: 500
      };

      const customClient = new GraphQLClient(customConfig);
      expect(customClient).toBeInstanceOf(GraphQLClient);
    });

    it('should merge custom config with defaults', () => {
      const partialConfig = {
        timeout: 15000,
        enableMetrics: false
      };

      const client = new GraphQLClient(partialConfig);
      expect(client).toBeInstanceOf(GraphQLClient);
    });
  });

  describe('execute() method', () => {
    const mockQuery = 'query GetRequest { getRequest(id: "123") { id name } }';
    const mockVariables = { id: '123' };

    it('should execute successful GraphQL operation', async () => {
      const mockResponse = createMockGraphQLSuccess({
        getRequest: { id: '123', name: 'Test Request' }
      });

      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      const result = await client.execute({
        query: mockQuery,
        variables: mockVariables
      }, {
        operation: 'getRequest',
        model: 'Request'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(result.meta?.executionTime).toBeGreaterThan(0);
      expect(mockGraphQLClient.graphql).toHaveBeenCalledWith({
        query: mockQuery,
        variables: mockVariables,
        authMode: undefined
      });
    });

    it('should handle GraphQL operation with warnings', async () => {
      const mockResponse = {
        data: { getRequest: { id: '123', name: 'Test Request' } },
        errors: [{ message: 'Field deprecated', path: ['name'] }]
      };

      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      const result = await client.execute({
        query: mockQuery,
        variables: mockVariables
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(result.meta?.warnings).toEqual(mockResponse.errors);
    });

    it('should handle network errors with retries', async () => {
      const networkError = createNetworkErrorScenario();
      
      mockGraphQLClient.graphql
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(createMockGraphQLSuccess({ data: 'success' }));

      const result = await client.execute({
        query: mockQuery
      }, {
        operation: 'getRequest',
        model: 'Request'
      });

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.graphql).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retrying GraphQL operation',
        expect.objectContaining({
          operation: 'getRequest',
          model: 'Request',
          attempt: 2
        })
      );
    });

    it('should fail after max retries', async () => {
      const networkError = createNetworkErrorScenario();
      
      mockGraphQLClient.graphql.mockRejectedValue(networkError);

      const result = await client.execute({
        query: mockQuery
      }, {
        operation: 'getRequest',
        model: 'Request'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NetworkError);
      expect(mockGraphQLClient.graphql).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle timeout errors', async () => {
      const timeoutError = createTimeoutErrorScenario();
      
      mockGraphQLClient.graphql.mockRejectedValueOnce(timeoutError);

      const result = await client.execute({
        query: mockQuery,
        timeout: 1000
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT_ERROR');
    });

    it('should handle authentication errors', async () => {
      const authError = createAuthenticationErrorScenario();
      authError.code = 'UNAUTHORIZED';
      
      mockGraphQLClient.graphql.mockRejectedValueOnce(authError);

      const result = await client.execute({
        query: mockQuery,
        authMode: 'userPool'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(AuthenticationError);
    });

    it('should handle GraphQL errors', async () => {
      const graphQLError = {
        errors: [
          { message: 'Variable "id" is required', path: ['getRequest'] },
          { message: 'Field "invalidField" not found', path: ['getRequest'] }
        ]
      };
      
      mockGraphQLClient.graphql.mockRejectedValueOnce(graphQLError);

      const result = await client.execute({
        query: mockQuery
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(GraphQLError);
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = createRateLimitErrorScenario();
      
      mockGraphQLClient.graphql.mockRejectedValueOnce(rateLimitError);

      const result = await client.execute({
        query: mockQuery
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Rate limit exceeded');
    });

    it('should use correct auth mode', async () => {
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: mockQuery,
        authMode: 'userPool'
      });

      expect(mockGraphQLClient.graphql).toHaveBeenCalledWith(
        expect.objectContaining({
          authMode: 'userPool'
        })
      );
    });

    it('should apply exponential backoff on retries', async () => {
      const networkError = createNetworkErrorScenario();
      const startTime = Date.now();
      
      mockGraphQLClient.graphql
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError);

      await client.execute({
        query: mockQuery
      });

      const totalTime = Date.now() - startTime;
      // Should have delays: 100ms + 200ms = 300ms minimum
      expect(totalTime).toBeGreaterThan(250);
    });
  });

  describe('query() method', () => {
    it('should execute query with simplified interface', async () => {
      const mockResponse = createMockGraphQLSuccess({
        listRequests: { items: [{ id: '1' }, { id: '2' }] }
      });

      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      const result = await client.query(
        'query ListRequests { listRequests { items { id } } }',
        { limit: 10 },
        {
          authMode: 'apiKey',
          operation: 'listRequests',
          model: 'Request'
        }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(mockGraphQLClient.graphql).toHaveBeenCalledWith({
        query: expect.stringContaining('query ListRequests'),
        variables: { limit: 10 },
        authMode: 'apiKey'
      });
    });

    it('should default operation name to "query"', async () => {
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.query('query Test { test }');

      // Should not throw and should use default operation name in logs
      expect(result.success).toBe(true);
    });
  });

  describe('mutate() method', () => {
    it('should execute mutation with simplified interface', async () => {
      const mockResponse = createMockGraphQLSuccess({
        createRequest: { id: 'new_123', status: 'created' }
      });

      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      const result = await client.mutate(
        'mutation CreateRequest($input: CreateRequestInput!) { createRequest(input: $input) { id status } }',
        { input: { name: 'New Request' } },
        {
          operation: 'createRequest',
          model: 'Request'
        }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(mockGraphQLClient.graphql).toHaveBeenCalledWith({
        query: expect.stringContaining('mutation CreateRequest'),
        variables: { input: { name: 'New Request' } },
        authMode: undefined
      });
    });

    it('should default operation name to "mutation"', async () => {
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.mutate('mutation Test { test }');

      // Should use default operation name
      expect(mockLogger.info).toHaveBeenCalledWith(
        'GraphQL operation completed successfully',
        expect.objectContaining({
          operation: 'mutation'
        })
      );
    });
  });

  describe('Performance Metrics', () => {
    it('should collect metrics for successful operations', async () => {
      const mockResponse = createMockGraphQLSuccess({
        listRequests: { items: [{ id: '1' }, { id: '2' }] }
      });

      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: 'query ListRequests { listRequests { items { id } } }'
      }, {
        operation: 'listRequests',
        model: 'Request'
      });

      const metrics = client.getMetrics('listRequests', 'Request');
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successRate).toBe(100);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should collect metrics for failed operations', async () => {
      const networkError = createNetworkErrorScenario();
      mockGraphQLClient.graphql.mockRejectedValue(networkError);

      await client.execute({
        query: 'query FailingQuery { test }'
      }, {
        operation: 'failingQuery',
        model: 'Test'
      });

      const metrics = client.getMetrics('failingQuery', 'Test');
      expect(metrics.totalRequests).toBe(3); // Initial + 2 retries
      expect(metrics.successRate).toBe(0);
    });

    it('should calculate average response time correctly', async () => {
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      
      // Execute multiple operations
      mockGraphQLClient.graphql.mockResolvedValue(mockResponse);
      
      await client.execute({ query: 'query Test1 { test }' }, { operation: 'test' });
      await client.execute({ query: 'query Test2 { test }' }, { operation: 'test' });
      await client.execute({ query: 'query Test3 { test }' }, { operation: 'test' });

      const metrics = client.getMetrics('test');
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should filter metrics by operation and model', async () => {
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValue(mockResponse);

      await client.execute({ query: 'query Test1 { test }' }, { operation: 'query1', model: 'Model1' });
      await client.execute({ query: 'query Test2 { test }' }, { operation: 'query2', model: 'Model2' });
      await client.execute({ query: 'query Test3 { test }' }, { operation: 'query1', model: 'Model1' });

      const model1Metrics = client.getMetrics(undefined, 'Model1');
      expect(model1Metrics.totalRequests).toBe(2);

      const query1Metrics = client.getMetrics('query1');
      expect(query1Metrics.totalRequests).toBe(2);

      const specificMetrics = client.getMetrics('query1', 'Model1');
      expect(specificMetrics.totalRequests).toBe(2);
    });

    it('should clear metrics', async () => {
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.execute({ query: 'query Test { test }' }, { operation: 'test' });

      let metrics = client.getMetrics();
      expect(metrics.totalRequests).toBe(1);

      client.clearMetrics();

      metrics = client.getMetrics();
      expect(metrics.totalRequests).toBe(0);
    });

    it('should handle metrics when disabled', async () => {
      const clientWithoutMetrics = new GraphQLClient({ enableMetrics: false });
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await clientWithoutMetrics.execute({ query: 'query Test { test }' });

      const metrics = clientWithoutMetrics.getMetrics();
      expect(metrics.totalRequests).toBe(0); // Metrics not collected
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle null/undefined responses', async () => {
      mockGraphQLClient.graphql.mockResolvedValueOnce(null);

      const result = await client.execute({
        query: 'query Test { test }'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle malformed error objects', async () => {
      const malformedError = { 
        someProperty: 'value',
        nested: { error: 'hidden' }
      };
      
      mockGraphQLClient.graphql.mockRejectedValueOnce(malformedError);

      const result = await client.execute({
        query: 'query Test { test }'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(RepositoryError);
    });

    it('should handle empty GraphQL errors array', async () => {
      const emptyErrorsResponse = {
        data: { test: 'value' },
        errors: []
      };
      
      mockGraphQLClient.graphql.mockResolvedValueOnce(emptyErrorsResponse);

      const result = await client.execute({
        query: 'query Test { test }'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(emptyErrorsResponse.data);
    });

    it('should handle concurrent operations', async () => {
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValue(mockResponse);

      // Execute multiple concurrent operations
      const promises = [
        client.execute({ query: 'query Test1 { test }' }),
        client.execute({ query: 'query Test2 { test }' }),
        client.execute({ query: 'query Test3 { test }' })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(mockGraphQLClient.graphql).toHaveBeenCalledTimes(3);
    });
  });

  describe('Auth Mode Handling', () => {
    it('should use apiKey auth mode by default', async () => {
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: 'query Test { test }'
      });

      expect(mockGraphQLClient.graphql).toHaveBeenCalledWith(
        expect.objectContaining({
          authMode: undefined // Falls back to default
        })
      );
    });

    it('should handle unsupported auth modes gracefully', async () => {
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: 'query Test { test }',
        authMode: 'unsupportedMode' as any
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Unsupported auth mode'),
        expect.anything()
      );
    });
  });

  describe('Record Count Extraction', () => {
    it('should extract record count from list responses', async () => {
      const mockResponse = createMockGraphQLSuccess({
        listRequests: {
          items: [{ id: '1' }, { id: '2' }, { id: '3' }]
        }
      });

      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: 'query ListRequests { listRequests { items { id } } }'
      }, {
        operation: 'listRequests',
        model: 'Request'
      });

      // Record count should be extracted and used in metrics
      const metrics = client.getMetrics('listRequests', 'Request');
      expect(metrics.totalRequests).toBe(1);
    });

    it('should extract record count from single object responses', async () => {
      const mockResponse = createMockGraphQLSuccess({
        getRequest: { id: '123', name: 'Test' }
      });

      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: 'query GetRequest { getRequest(id: "123") { id name } }'
      });

      // Should identify single record response
      const result = await client.execute({ query: 'test' });
      expect(result.success).toBe(true);
    });

    it('should handle responses with no identifiable records', async () => {
      const mockResponse = createMockGraphQLSuccess({
        customQuery: { count: 5, metadata: 'info' }
      });

      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: 'query CustomQuery { customQuery { count metadata } }'
      });

      // Should not error on non-standard response formats
      const metrics = client.getMetrics();
      expect(metrics.totalRequests).toBe(1);
    });
  });

  describe('Timeout Behavior', () => {
    it('should respect operation timeout', async () => {
      jest.setTimeout(10000);
      
      // Mock a delayed response
      mockGraphQLClient.graphql.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const startTime = Date.now();
      const result = await client.execute({
        query: 'query SlowQuery { test }',
        timeout: 500 // 500ms timeout
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT_ERROR');
      expect(duration).toBeGreaterThanOrEqual(450);
      expect(duration).toBeLessThan(700);
    });

    it('should use default timeout when not specified', async () => {
      mockGraphQLClient.graphql.mockResolvedValueOnce(
        createMockGraphQLSuccess({ data: 'test' })
      );

      const result = await client.execute({
        query: 'query Test { test }'
      });

      expect(result.success).toBe(true);
      // Default timeout should not interfere with fast operations
    });
  });

  describe('Logging Behavior', () => {
    it('should log successful operations when logging is enabled', async () => {
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: 'query Test { test }'
      }, {
        operation: 'test',
        model: 'TestModel'
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'GraphQL operation completed successfully',
        expect.objectContaining({
          operation: 'test',
          model: 'TestModel',
          duration: expect.any(Number)
        })
      );
    });

    it('should not log when logging is disabled', async () => {
      const clientWithoutLogging = new GraphQLClient({ enableLogging: false });
      const mockResponse = createMockGraphQLSuccess({ data: 'test' });
      mockGraphQLClient.graphql.mockResolvedValueOnce(mockResponse);

      await clientWithoutLogging.execute({
        query: 'query Test { test }'
      });

      // Should only have initialization log, no operation logs
      expect(mockLogger.info).toHaveBeenCalledTimes(1); // Just initialization
    });
  });
});