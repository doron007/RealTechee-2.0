/**
 * Simplified GraphQLClient Tests - Based on Actual Implementation
 * 
 * Tests the actual GraphQL client methods: query, mutate, subscribe
 */

// Mock AWS Amplify generateClient BEFORE imports
const mockAmplifyClient = {
  graphql: jest.fn()
};

jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => mockAmplifyClient)
}));

// Mock logger
jest.mock('../../../../utils/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

import { GraphQLClient } from '../../../../repositories/core/GraphQLClient';

describe('GraphQLClient - Actual Implementation Tests', () => {
  let client: GraphQLClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAmplifyClient.graphql.mockReset();
    client = new GraphQLClient('apiKey');
  });

  describe('Initialization', () => {
    test('should initialize with apiKey auth mode', () => {
      const apiKeyClient = new GraphQLClient('apiKey');
      expect(apiKeyClient).toBeInstanceOf(GraphQLClient);
    });

    test('should initialize with userPool auth mode', () => {
      const userPoolClient = new GraphQLClient('userPool');
      expect(userPoolClient).toBeInstanceOf(GraphQLClient);
    });

    test('should initialize with default auth mode', () => {
      const defaultClient = new GraphQLClient();
      expect(defaultClient).toBeInstanceOf(GraphQLClient);
    });
  });

  describe('withAuthMode() method', () => {
    test('should return new client with different auth mode', () => {
      const newClient = client.withAuthMode('userPool');
      expect(newClient).toBeInstanceOf(GraphQLClient);
      expect(newClient).not.toBe(client);
    });

    test('should work with all auth modes', () => {
      const userPoolClient = client.withAuthMode('userPool');
      const oidcClient = client.withAuthMode('oidc');
      const lambdaClient = client.withAuthMode('lambda');
      
      expect(userPoolClient).toBeInstanceOf(GraphQLClient);
      expect(oidcClient).toBeInstanceOf(GraphQLClient);
      expect(lambdaClient).toBeInstanceOf(GraphQLClient);
    });
  });

  describe('query() method', () => {
    const testQuery = 'query GetTest($id: String!) { test(id: $id) { id name } }';
    const testVariables = { id: '123' };

    test('should execute query successfully', async () => {
      const mockResult = {
        data: { test: { id: '123', name: 'Test Item' } }
      };
      mockAmplifyClient.graphql.mockResolvedValue(mockResult);

      const result = await client.query(testQuery, testVariables);

      expect(mockAmplifyClient.graphql).toHaveBeenCalledWith({
        query: testQuery,
        variables: testVariables,
        authMode: 'apiKey'
      });
      expect(result).toEqual(mockResult);
    });

    test('should execute query without variables', async () => {
      const queryWithoutVars = 'query GetAll { tests { id name } }';
      const mockResult = {
        data: { tests: [{ id: '1', name: 'Test 1' }, { id: '2', name: 'Test 2' }] }
      };
      mockAmplifyClient.graphql.mockResolvedValue(mockResult);

      const result = await client.query(queryWithoutVars);

      expect(mockAmplifyClient.graphql).toHaveBeenCalledWith({
        query: queryWithoutVars,
        variables: undefined,
        authMode: 'apiKey'
      });
      expect(result).toEqual(mockResult);
    });

    test('should handle GraphQL errors in response', async () => {
      const mockResult = {
        data: null,
        errors: [{ message: 'Test not found', path: ['test'], locations: [{ line: 2, column: 3 }] }]
      };
      mockAmplifyClient.graphql.mockResolvedValue(mockResult);

      const result = await client.query(testQuery, testVariables);
      expect(result).toEqual(mockResult);
    });

    test('should retry on network errors', async () => {
      const networkError = new Error('NetworkError: Connection failed');
      mockAmplifyClient.graphql
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ data: { test: { id: '123', name: 'Success after retries' } } });

      const result = await client.query(testQuery, testVariables);
      
      expect(mockAmplifyClient.graphql).toHaveBeenCalledTimes(3);
      expect(result.data.test.name).toBe('Success after retries');
    });

    test('should fail after max retry attempts', async () => {
      const networkError = new Error('NetworkError: Connection failed');
      mockAmplifyClient.graphql.mockRejectedValue(networkError);

      await expect(client.query(testQuery, testVariables)).rejects.toThrow('NetworkError: Connection failed');
      expect(mockAmplifyClient.graphql).toHaveBeenCalledTimes(3); // Max retries + initial attempt
    });

    test('should not retry non-retryable errors', async () => {
      const validationError = new Error('ValidationError: Invalid input');
      mockAmplifyClient.graphql.mockRejectedValue(validationError);

      await expect(client.query(testQuery, testVariables)).rejects.toThrow('ValidationError: Invalid input');
      expect(mockAmplifyClient.graphql).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('mutate() method', () => {
    const testMutation = 'mutation CreateTest($input: TestInput!) { createTest(input: $input) { id name } }';
    const testVariables = { input: { name: 'New Test', description: 'Test description' } };

    test('should execute mutation successfully', async () => {
      const mockResult = {
        data: { createTest: { id: '456', name: 'New Test' } }
      };
      mockAmplifyClient.graphql.mockResolvedValue(mockResult);

      const result = await client.mutate(testMutation, testVariables);

      expect(mockAmplifyClient.graphql).toHaveBeenCalledWith({
        query: testMutation,
        variables: testVariables,
        authMode: 'apiKey'
      });
      expect(result).toEqual(mockResult);
    });

    test('should execute mutation without variables', async () => {
      const simpleMutation = 'mutation ClearCache { clearCache { success } }';
      const mockResult = {
        data: { clearCache: { success: true } }
      };
      mockAmplifyClient.graphql.mockResolvedValue(mockResult);

      const result = await client.mutate(simpleMutation);

      expect(mockAmplifyClient.graphql).toHaveBeenCalledWith({
        query: simpleMutation,
        variables: undefined,
        authMode: 'apiKey'
      });
      expect(result).toEqual(mockResult);
    });

    test('should handle mutation errors', async () => {
      const mockResult = {
        data: null,
        errors: [{ message: 'Validation failed: Name is required', path: ['createTest'] }]
      };
      mockAmplifyClient.graphql.mockResolvedValue(mockResult);

      const result = await client.mutate(testMutation, testVariables);
      expect(result).toEqual(mockResult);
    });

    test('should retry mutations on retryable errors', async () => {
      const timeoutError = new Error('TimeoutError: Request timed out');
      mockAmplifyClient.graphql
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue({ data: { createTest: { id: '456', name: 'Created after retry' } } });

      const result = await client.mutate(testMutation, testVariables);
      
      expect(mockAmplifyClient.graphql).toHaveBeenCalledTimes(2);
      expect(result.data.createTest.name).toBe('Created after retry');
    });
  });

  describe('subscribe() method', () => {
    const testSubscription = 'subscription OnTestUpdated($id: String!) { onTestUpdated(id: $id) { id name updatedAt } }';
    const testVariables = { id: '123' };

    test('should create subscription with variables', async () => {
      const mockObservable = {
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() })
      };
      mockAmplifyClient.graphql.mockReturnValue(mockObservable);

      const subscription = await client.subscribe(testSubscription, testVariables);

      expect(mockAmplifyClient.graphql).toHaveBeenCalledWith({
        query: testSubscription,
        variables: testVariables,
        authMode: 'apiKey'
      });
      
      const mockObserver = { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
      subscription.subscribe(mockObserver);
      expect(mockObservable.subscribe).toHaveBeenCalledWith(mockObserver);
    });

    test('should create subscription without variables', async () => {
      const globalSubscription = 'subscription OnAnyTestUpdated { onAnyTestUpdated { id name } }';
      const mockObservable = {
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() })
      };
      mockAmplifyClient.graphql.mockReturnValue(mockObservable);

      const subscription = await client.subscribe(globalSubscription);

      expect(mockAmplifyClient.graphql).toHaveBeenCalledWith({
        query: globalSubscription,
        variables: undefined,
        authMode: 'apiKey'
      });
    });
  });

  describe('batchQuery() method', () => {
    test('should execute multiple queries in parallel', async () => {
      const queries = [
        { query: 'query GetTest1 { test1 { id } }' },
        { query: 'query GetTest2 { test2 { id } }', variables: { id: '123' } },
        { query: 'query GetTest3 { test3 { id } }' }
      ];

      mockAmplifyClient.graphql
        .mockResolvedValueOnce({ data: { test1: { id: '1' } } })
        .mockResolvedValueOnce({ data: { test2: { id: '2' } } })
        .mockResolvedValueOnce({ data: { test3: { id: '3' } } });

      const results = await client.batchQuery(queries);

      expect(results).toHaveLength(3);
      expect(results[0].data.test1.id).toBe('1');
      expect(results[1].data.test2.id).toBe('2');
      expect(results[2].data.test3.id).toBe('3');
      expect(mockAmplifyClient.graphql).toHaveBeenCalledTimes(3);
    });

    test('should handle batch query with partial failures', async () => {
      const queries = [
        { query: 'query GetTest1 { test1 { id } }' },
        { query: 'query GetTest2 { test2 { id } }' }
      ];

      mockAmplifyClient.graphql
        .mockResolvedValueOnce({ data: { test1: { id: '1' } } })
        .mockRejectedValueOnce(new Error('Query failed'));

      await expect(client.batchQuery(queries)).rejects.toThrow('Query failed');
    });
  });

  describe('Connection Management', () => {
    test('should return connected status', () => {
      expect(client.isConnected()).toBe(true);
    });

    test('should handle connect call', async () => {
      await expect(client.connect()).resolves.toBeUndefined();
    });

    test('should handle disconnect call', async () => {
      await expect(client.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('Error Classification and Retry Logic', () => {
    test('should identify retryable NetworkError', async () => {
      const networkError = new Error('NetworkError: Connection reset');
      mockAmplifyClient.graphql
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ data: { test: 'success' } });

      const result = await client.query('query { test }');
      expect(result.data.test).toBe('success');
      expect(mockAmplifyClient.graphql).toHaveBeenCalledTimes(2);
    });

    test('should identify retryable TimeoutError', async () => {
      const timeoutError = new Error('TimeoutError: Operation timed out');
      mockAmplifyClient.graphql
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValue({ data: { test: 'success' } });

      const result = await client.query('query { test }');
      expect(result.data.test).toBe('success');
      expect(mockAmplifyClient.graphql).toHaveBeenCalledTimes(2);
    });

    test('should identify retryable ThrottlingException', async () => {
      const throttlingError = new Error('ThrottlingException: Rate limit exceeded');
      mockAmplifyClient.graphql
        .mockRejectedValueOnce(throttlingError)
        .mockResolvedValue({ data: { test: 'success' } });

      const result = await client.query('query { test }');
      expect(result.data.test).toBe('success');
      expect(mockAmplifyClient.graphql).toHaveBeenCalledTimes(2);
    });

    test('should identify retryable ServiceUnavailableException', async () => {
      const serviceError = new Error('ServiceUnavailableException: Service temporarily unavailable');
      mockAmplifyClient.graphql
        .mockRejectedValueOnce(serviceError)
        .mockResolvedValue({ data: { test: 'success' } });

      const result = await client.query('query { test }');
      expect(result.data.test).toBe('success');
      expect(mockAmplifyClient.graphql).toHaveBeenCalledTimes(2);
    });

    test('should apply exponential backoff on retries', async () => {
      const networkError = new Error('NetworkError');
      const startTime = Date.now();
      
      mockAmplifyClient.graphql
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ data: { test: 'success' } });

      const result = await client.query('query { test }');
      
      const executionTime = Date.now() - startTime;
      // First retry: 1000ms, second retry: 2000ms = minimum 3000ms total delay
      expect(executionTime).toBeGreaterThan(2900); // Allow some variance
      expect(result.data.test).toBe('success');
    });

    test('should handle non-Error exceptions', async () => {
      mockAmplifyClient.graphql.mockRejectedValue('String error message');
      
      await expect(client.query('query { test }')).rejects.toThrow('Unknown error');
    });
  });
});