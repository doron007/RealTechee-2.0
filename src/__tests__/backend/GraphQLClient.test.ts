/**
 * GraphQLClient Unit Tests
 * 
 * Comprehensive tests for GraphQL client wrapper including:
 * - Error handling and retries
 * - Timeout management
 * - Authentication modes
 * - Performance metrics
 * - Network error scenarios
 */

import { GraphQLClient } from '../../repositories/base/GraphQLClient';
import { createMockGraphQLResponse, createMockGraphQLError, createMockServiceResult } from '../testDataFactories';

// Mock the generateClient function
const mockGraphQL = jest.fn();
const mockGenerateClient = jest.requireMock('aws-amplify/api').generateClient;

beforeEach(() => {
  jest.clearAllMocks();
  mockGenerateClient.mockReturnValue({
    graphql: mockGraphQL
  });
});

describe('GraphQLClient', () => {
  let client: GraphQLClient;

  beforeEach(() => {
    client = new GraphQLClient({
      enableLogging: false, // Disable logging for cleaner test output
      enableMetrics: true,
      maxRetries: 2,
      retryDelay: 100,
      timeout: 1000
    });
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultClient = new GraphQLClient();
      expect(defaultClient).toBeInstanceOf(GraphQLClient);
    });

    it('should initialize with custom configuration', () => {
      const customClient = new GraphQLClient({
        defaultAuthMode: 'userPool',
        enableLogging: true,
        timeout: 5000,
        maxRetries: 5
      });
      expect(customClient).toBeInstanceOf(GraphQLClient);
    });
  });

  describe('execute()', () => {
    const mockQuery = 'query GetTest { getTest { id name } }';
    const mockVariables = { id: 'test-id' };

    it('should execute successful GraphQL operation', async () => {
      const mockData = { getTest: { id: 'test-id', name: 'Test Item' } };
      const mockResponse = createMockGraphQLResponse(mockData);
      
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      const result = await client.execute({
        query: mockQuery,
        variables: mockVariables
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockGraphQL).toHaveBeenCalledWith({
        query: mockQuery,
        variables: mockVariables,
        authMode: undefined
      });
    });

    it('should handle GraphQL errors gracefully', async () => {
      const mockErrors = [createMockGraphQLError('Validation failed', 'VALIDATION_ERROR')];
      const mockResponse = createMockGraphQLResponse(null, mockErrors);
      
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      const result = await client.execute({
        query: mockQuery,
        variables: mockVariables
      });

      expect(result.success).toBe(true); // GraphQL errors are non-fatal
      expect(result.data).toBeNull();
      expect(result.meta?.warnings).toEqual(mockErrors);
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      // First two attempts fail, third succeeds
      mockGraphQL
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(createMockGraphQLResponse({ success: true }));

      const result = await client.execute({
        query: mockQuery,
        variables: mockVariables
      });

      expect(mockGraphQL).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true });
    });

    it('should fail after max retries exceeded', async () => {
      const networkError = new Error('Persistent network error');
      networkError.name = 'NetworkError';
      
      mockGraphQL.mockRejectedValue(networkError);

      const result = await client.execute({
        query: mockQuery,
        variables: mockVariables
      });

      expect(mockGraphQL).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    it('should handle timeout errors', async () => {
      // Mock a long-running operation
      mockGraphQL.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {} }), 2000))
      );

      const result = await client.execute({
        query: mockQuery,
        variables: mockVariables,
        timeout: 500 // Short timeout
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('timeout');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized access');
      (authError as any).code = 'UNAUTHORIZED';
      
      mockGraphQL.mockRejectedValueOnce(authError);

      const result = await client.execute({
        query: mockQuery,
        variables: mockVariables
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should use correct auth mode', async () => {
      const mockResponse = createMockGraphQLResponse({ success: true });
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: mockQuery,
        variables: mockVariables,
        authMode: 'userPool'
      });

      expect(mockGraphQL).toHaveBeenCalledWith({
        query: mockQuery,
        variables: mockVariables,
        authMode: 'userPool'
      });
    });

    it('should collect metrics when enabled', async () => {
      const mockResponse = createMockGraphQLResponse({ success: true });
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      await client.execute(
        {
          query: mockQuery,
          variables: mockVariables
        },
        {
          operation: 'getTest',
          model: 'Test'
        }
      );

      const metrics = client.getMetrics('getTest', 'Test');
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successRate).toBe(100);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('query()', () => {
    it('should execute query operation', async () => {
      const mockData = { items: [{ id: '1', name: 'Item 1' }] };
      const mockResponse = createMockGraphQLResponse(mockData);
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      const result = await client.query(
        'query ListItems { items { id name } }',
        {},
        { operation: 'list', model: 'Item' }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });

  describe('mutate()', () => {
    it('should execute mutation operation', async () => {
      const mockData = { createItem: { id: '1', name: 'New Item' } };
      const mockResponse = createMockGraphQLResponse(mockData);
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      const result = await client.mutate(
        'mutation CreateItem($input: CreateItemInput!) { createItem(input: $input) { id name } }',
        { input: { name: 'New Item' } },
        { operation: 'create', model: 'Item' }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });

  describe('metrics', () => {
    beforeEach(() => {
      client.clearMetrics();
    });

    it('should track success rate correctly', async () => {
      const mockResponse = createMockGraphQLResponse({ success: true });
      const networkError = new Error('Network error');
      
      // 2 successes, 1 failure
      mockGraphQL
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse)
        .mockRejectedValueOnce(networkError);

      await client.query('test query');
      await client.query('test query');
      await client.query('test query');

      const metrics = client.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.successRate).toBe(67); // 2/3 = 66.67% rounded to 67%
    });

    it('should calculate average response time', async () => {
      const mockResponse = createMockGraphQLResponse({ success: true });
      mockGraphQL.mockResolvedValue(mockResponse);

      // Simulate different response times
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // Start time
        .mockReturnValueOnce(1100) // End time (100ms)
        .mockReturnValueOnce(1200) // Start time
        .mockReturnValueOnce(1350) // End time (150ms)
        .mockReturnValueOnce(1400) // Start time
        .mockReturnValueOnce(1450); // End time (50ms)

      await client.query('test query');
      await client.query('test query');
      await client.query('test query');

      const metrics = client.getMetrics();
      expect(metrics.averageResponseTime).toBe(100); // (100 + 150 + 50) / 3 = 100
    });

    it('should clear metrics', async () => {
      const mockResponse = createMockGraphQLResponse({ success: true });
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      await client.query('test query');
      expect(client.getMetrics().totalRequests).toBe(1);

      client.clearMetrics();
      expect(client.getMetrics().totalRequests).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle malformed GraphQL responses', async () => {
      mockGraphQL.mockResolvedValueOnce(undefined);

      const result = await client.execute({
        query: 'query Test { test }'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should handle JSON parsing errors in response', async () => {
      const mockResponse = createMockGraphQLResponse('invalid-json');
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      const result = await client.execute({
        query: 'query Test { test }'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBe('invalid-json');
    });

    it('should handle promise rejection', async () => {
      const customError = new Error('Custom error');
      mockGraphQL.mockRejectedValueOnce(customError);

      const result = await client.execute({
        query: 'query Test { test }'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Custom error');
    });
  });

  describe('auth modes', () => {
    it('should handle apiKey auth mode', async () => {
      const mockResponse = createMockGraphQLResponse({ success: true });
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: 'query Test { test }',
        authMode: 'apiKey'
      });

      expect(mockGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({
          authMode: 'apiKey'
        })
      );
    });

    it('should handle userPool auth mode', async () => {
      const mockResponse = createMockGraphQLResponse({ success: true });
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: 'query Test { test }',
        authMode: 'userPool'
      });

      expect(mockGraphQL).toHaveBeenCalledWith(
        expect.objectContaining({
          authMode: 'userPool'
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty query string', async () => {
      const result = await client.execute({
        query: ''
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null variables', async () => {
      const mockResponse = createMockGraphQLResponse({ success: true });
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      await client.execute({
        query: 'query Test { test }',
        variables: null as any
      });

      expect(mockGraphQL).toHaveBeenCalledWith({
        query: 'query Test { test }',
        variables: {},
        authMode: undefined
      });
    });

    it('should handle large response data', async () => {
      // Create a large mock response
      const largeData = {
        items: Array.from({ length: 10000 }, (_, i) => ({
          id: `item_${i}`,
          data: 'x'.repeat(1000) // 1KB per item = ~10MB total
        }))
      };
      const mockResponse = createMockGraphQLResponse(largeData);
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      const result = await client.execute({
        query: 'query GetLargeData { items { id data } }'
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(largeData);
    });
  });
});