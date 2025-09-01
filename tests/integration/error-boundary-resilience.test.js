/**
 * Error Boundary and Resilience Integration Tests
 * 
 * Tests error handling and recovery across all integration layers:
 * - Network failures and recovery
 * - GraphQL errors and fallbacks
 * - Service layer error handling
 * - Hook error states and retry mechanisms
 * - Performance degradation graceful handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/api';
import { enhancedRequestsService } from '../../services/enhancedRequestsService';
import { useRequestsQuery, useRequestMutations } from '../../hooks/useRequestsQuery';
import { requestsAPI } from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ErrorBoundaryResilience');

// Mock external dependencies
jest.mock('aws-amplify/api');
jest.mock('../../utils/amplifyAPI');
jest.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn()
  })
}));

const mockGraphQLClient = {
  graphql: jest.fn()
};
generateClient.mockReturnValue(mockGraphQLClient);

const mockAmplifyAPI = {
  update: jest.fn()
};
requestsAPI.mockValue = mockAmplifyAPI;

// Test wrapper with error boundary simulation
const createWrapper = (retryOptions = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: retryOptions.retry || false, 
        retryDelay: retryOptions.retryDelay || 0,
        staleTime: 0, 
        gcTime: 0 
      },
      mutations: {
        retry: retryOptions.mutationRetry || false
      }
    }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Error Boundary and Resilience Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Network Failure Recovery', () => {
    test('network timeout with automatic retry', async () => {
      const wrapper = createWrapper({ retry: 2, retryDelay: 100 });

      // Arrange: Mock network failures followed by success
      mockGraphQLClient.graphql
        .mockRejectedValueOnce(new Error('TIMEOUT'))
        .mockRejectedValueOnce(new Error('TIMEOUT'))
        .mockResolvedValueOnce({
          data: {
            listRequests: {
              items: [{
                id: 'req-recovery-001',
                status: 'New Lead',
                address: { propertyFullAddress: '123 Recovery St' },
                homeowner: { fullName: 'Recovery Client' },
                agent: { fullName: 'Recovery Agent' }
              }]
            }
          }
        });

      // Act: Hook should retry and eventually succeed
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      // Wait for initial failure and retries
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      // Assert: Should succeed after retries
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].id).toBe('req-recovery-001');
      expect(mockGraphQLClient.graphql).toHaveBeenCalledTimes(3); // Initial + 2 retries

      logger.info('✓ Network timeout recovery validated', {
        retryCount: 2,
        finalStatus: 'success',
        dataReceived: true
      });
    });

    test('permanent network failure handling', async () => {
      const wrapper = createWrapper({ retry: 2 });

      // Arrange: Persistent network failure
      mockGraphQLClient.graphql.mockRejectedValue(new Error('NETWORK_UNREACHABLE'));

      // Act: Hook should fail after retries
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      // Assert: Should gracefully fail
      expect(result.current.isError).toBe(true);
      expect(result.current.error.message).toBe('NETWORK_UNREACHABLE');
      expect(result.current.data).toBeUndefined();
      expect(mockGraphQLClient.graphql).toHaveBeenCalledTimes(3); // Initial + 2 retries

      logger.info('✓ Permanent network failure handling validated');
    });
  });

  describe('GraphQL Error Handling', () => {
    test('GraphQL field errors with partial data recovery', async () => {
      const wrapper = createWrapper();

      // Arrange: GraphQL response with errors but partial data
      mockGraphQLClient.graphql.mockResolvedValue({
        data: {
          listRequests: {
            items: [{
              id: 'req-partial-001',
              status: 'New Lead',
              address: null, // Missing address data
              homeowner: { fullName: 'Partial Client' },
              agent: null // Missing agent data
            }]
          }
        },
        errors: [
          { message: 'Field address could not be resolved', path: ['listRequests', 'items', 0, 'address'] },
          { message: 'Field agent could not be resolved', path: ['listRequests', 'items', 0, 'agent'] }
        ]
      });

      // Act: Process response with errors
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Assert: Should handle partial data gracefully
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toHaveLength(1);
      
      const request = result.current.data[0];
      expect(request.id).toBe('req-partial-001');
      expect(request.propertyAddress).toBe('No address provided'); // Fallback
      expect(request.clientName).toBe('Partial Client');
      expect(request.agentName).toBe('N/A'); // Fallback for missing agent

      logger.info('✓ GraphQL partial data recovery validated', {
        errorsReceived: 2,
        fallbacksApplied: ['address', 'agent'],
        dataRecovered: true
      });
    });

    test('GraphQL authorization errors', async () => {
      const wrapper = createWrapper();

      // Arrange: Authorization error
      mockGraphQLClient.graphql.mockResolvedValue({
        data: null,
        errors: [{
          message: 'Unauthorized: API key access denied',
          errorType: 'UnauthorizedException'
        }]
      });

      // Act: Process authorization error
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Assert: Should handle auth error appropriately
      expect(result.current.isError).toBe(true);
      expect(result.current.error.message).toBe('Failed to fetch requests');

      logger.info('✓ GraphQL authorization error handling validated');
    });
  });

  describe('Service Layer Error Resilience', () => {
    test('service method failure with graceful degradation', async () => {
      const wrapper = createWrapper();

      // Arrange: Service returns structured error
      const originalGetFullyEnhanced = enhancedRequestsService.getFullyEnhancedRequests;
      enhancedRequestsService.getFullyEnhancedRequests = jest.fn().mockResolvedValue({
        success: false,
        error: 'Database connection timeout during enhancement process'
      });

      // Act: Hook should handle service error
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Assert: Error propagated correctly
      expect(result.current.isError).toBe(true);
      expect(result.current.error.message).toBe('Database connection timeout during enhancement process');

      // Cleanup
      enhancedRequestsService.getFullyEnhancedRequests = originalGetFullyEnhanced;

      logger.info('✓ Service layer error resilience validated');
    });

    test('cache corruption recovery', async () => {
      const wrapper = createWrapper();

      // Arrange: Service initially returns corrupted data, then valid data
      const originalGetFullyEnhanced = enhancedRequestsService.getFullyEnhancedRequests;
      enhancedRequestsService.getFullyEnhancedRequests = jest.fn()
        .mockResolvedValueOnce({
          success: true,
          data: null // Corrupted cache data
        })
        .mockResolvedValueOnce({
          success: true,
          data: [{
            id: 'req-cache-recovery-001',
            status: 'Recovered',
            address: { propertyFullAddress: 'Recovery Address' },
            homeowner: { fullName: 'Cache Client' },
            agent: { fullName: 'Cache Agent' }
          }]
        });

      // Act: First call gets corrupted data, refetch should work
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // First result should handle null gracefully
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(null);

      // Refetch should get valid data
      result.current.refetch();
      await waitFor(() => expect(result.current.isFetching).toBe(false));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].id).toBe('req-cache-recovery-001');

      // Cleanup
      enhancedRequestsService.getFullyEnhancedRequests = originalGetFullyEnhanced;

      logger.info('✓ Cache corruption recovery validated');
    });
  });

  describe('Mutation Error Handling', () => {
    test('mutation failure with rollback', async () => {
      const wrapper = createWrapper();

      // Arrange: Initial successful query, then failed mutation
      mockGraphQLClient.graphql.mockResolvedValue({
        data: {
          listRequests: {
            items: [{
              id: 'req-mutation-001',
              status: 'New Lead',
              address: { propertyFullAddress: '123 Mutation St' },
              homeowner: { fullName: 'Mutation Client' },
              agent: { fullName: 'Mutation Agent' }
            }]
          }
        }
      });

      mockAmplifyAPI.update.mockResolvedValue({
        success: false,
        error: 'Validation failed: Cannot archive active request'
      });

      // Act: Query then failed mutation
      const { result: queryResult } = renderHook(() => useRequestsQuery(), { wrapper });
      const { result: mutationResult } = renderHook(() => useRequestMutations(), { wrapper });

      await waitFor(() => expect(queryResult.current.isLoading).toBe(false));

      // Perform failing mutation
      mutationResult.current.archiveRequest.mutate('req-mutation-001');

      await waitFor(() => {
        expect(mutationResult.current.archiveRequest.isIdle).toBe(false);
      });

      // Assert: Mutation error handled, query data intact
      expect(mutationResult.current.archiveRequest.isError).toBe(true);
      expect(mutationResult.current.archiveRequest.error.message).toBe('Validation failed: Cannot archive active request');
      expect(queryResult.current.data).toHaveLength(1); // Original data preserved

      logger.info('✓ Mutation failure with rollback validated');
    });

    test('mutation retry mechanism', async () => {
      const wrapper = createWrapper({ mutationRetry: 2 });

      // Arrange: Failed mutations followed by success
      mockAmplifyAPI.update
        .mockResolvedValueOnce({ success: false, error: 'Temporary server error' })
        .mockResolvedValueOnce({ success: false, error: 'Temporary server error' })
        .mockResolvedValueOnce({ success: true, data: { id: 'req-retry-001', status: 'archived' } });

      // Act: Mutation with retries
      const { result } = renderHook(() => useRequestMutations(), { wrapper });

      result.current.archiveRequest.mutate('req-retry-001');

      await waitFor(() => {
        expect(result.current.archiveRequest.isSuccess).toBe(true);
      }, { timeout: 2000 });

      // Assert: Should succeed after retries
      expect(mockAmplifyAPI.update).toHaveBeenCalledTimes(3);
      expect(result.current.archiveRequest.data.id).toBe('req-retry-001');

      logger.info('✓ Mutation retry mechanism validated');
    });
  });

  describe('Performance Degradation Handling', () => {
    test('slow response graceful handling', async () => {
      const wrapper = createWrapper();

      // Arrange: Slow GraphQL response
      let resolveSlowResponse;
      const slowPromise = new Promise(resolve => {
        resolveSlowResponse = resolve;
      });

      mockGraphQLClient.graphql.mockReturnValue(slowPromise);

      // Act: Start request with slow response
      const startTime = performance.now();
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      // Should be loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Simulate slow response after 3 seconds
      setTimeout(() => {
        resolveSlowResponse({
          data: {
            listRequests: {
              items: [{
                id: 'req-slow-001',
                status: 'Slow Response',
                address: { propertyFullAddress: 'Slow St' },
                homeowner: { fullName: 'Patient Client' },
                agent: { fullName: 'Patient Agent' }
              }]
            }
          }
        });
      }, 100); // Reduced for testing

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      const endTime = performance.now();

      // Assert: Should handle slow response gracefully
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toHaveLength(1);
      expect(endTime - startTime).toBeGreaterThan(100);

      logger.info('✓ Slow response handling validated', {
        responseTime: `${(endTime - startTime).toFixed(2)}ms`,
        dataReceived: true
      });
    });

    test('memory pressure handling with large datasets', async () => {
      const wrapper = createWrapper();

      // Arrange: Very large dataset that might cause memory pressure
      const hugeDataset = {
        data: {
          listRequests: {
            items: Array.from({ length: 10000 }, (_, i) => ({
              id: `req-memory-${i}`,
              status: 'Memory Test',
              product: `Product with very long description that takes up memory ${i}`.repeat(10),
              message: `Long message content for request ${i}`.repeat(20),
              address: {
                propertyFullAddress: `${i} Memory Lane, Large Dataset City, CA ${String(i).padStart(5, '0')}`
              },
              homeowner: {
                fullName: `Client ${i} with a very long name`,
                email: `verylongemailaddress${i}@extremelylongdomainname.com`
              },
              agent: {
                fullName: `Agent ${i} Professional Services`,
                brokerage: `Professional Real Estate Services LLC ${i}`
              }
            }))
          }
        }
      };

      mockGraphQLClient.graphql.mockResolvedValue(hugeDataset);

      // Act: Process large dataset
      const startMemory = process.memoryUsage().heapUsed;
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const endMemory = process.memoryUsage().heapUsed;

      // Assert: Should handle large dataset without crashing
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toHaveLength(10000);
      expect(result.current.data[0].id).toBe('req-memory-0');
      expect(result.current.data[9999].id).toBe('req-memory-9999');

      const memoryIncrease = endMemory - startMemory;

      logger.info('✓ Memory pressure handling validated', {
        recordsProcessed: result.current.data.length,
        memoryIncrease: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        noMemoryLeaks: memoryIncrease < 100 * 1024 * 1024 // Should be less than 100MB
      });
    });
  });

  describe('Concurrent Error Scenarios', () => {
    test('multiple simultaneous failures recovery', async () => {
      const wrapper = createWrapper({ retry: 1 });

      // Arrange: Multiple hooks with different failure patterns
      mockGraphQLClient.graphql
        .mockRejectedValueOnce(new Error('Query 1 failure'))
        .mockResolvedValueOnce({ // Query 1 retry succeeds
          data: { listRequests: { items: [{ id: 'success-1', status: 'Success' }] } }
        })
        .mockRejectedValueOnce(new Error('Query 2 failure'))
        .mockResolvedValueOnce({ // Query 2 retry succeeds
          data: { listRequests: { items: [{ id: 'success-2', status: 'Success' }] } }
        });

      // Act: Create multiple concurrent hooks
      const { result: result1 } = renderHook(() => useRequestsQuery(), { wrapper });
      const { result: result2 } = renderHook(() => useRequestsQuery(), { wrapper });

      await Promise.all([
        waitFor(() => expect(result1.current.isLoading).toBe(false)),
        waitFor(() => expect(result2.current.isLoading).toBe(false))
      ]);

      // Assert: Both should recover
      expect(result1.current.isSuccess).toBe(true);
      expect(result2.current.isSuccess).toBe(true);

      logger.info('✓ Concurrent error recovery validated');
    });

    test('error isolation between hooks', async () => {
      const wrapper = createWrapper();

      // Arrange: One query succeeds, one fails
      mockGraphQLClient.graphql
        .mockResolvedValueOnce({
          data: { listRequests: { items: [{ id: 'isolated-success' }] } }
        })
        .mockRejectedValueOnce(new Error('Isolated failure'));

      // Act: Create separate hook instances
      const { result: successResult } = renderHook(() => useRequestsQuery(), { wrapper });
      const { result: failResult } = renderHook(() => useRequestsQuery(), { wrapper });

      await Promise.all([
        waitFor(() => expect(successResult.current.isLoading).toBe(false)),
        waitFor(() => expect(failResult.current.isLoading).toBe(false))
      ]);

      // Assert: Errors should be isolated
      expect(successResult.current.isSuccess).toBe(true);
      expect(failResult.current.isError).toBe(true);
      expect(successResult.current.data[0].id).toBe('isolated-success');

      logger.info('✓ Error isolation validated');
    });
  });
});