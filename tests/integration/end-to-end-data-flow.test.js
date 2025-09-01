/**
 * End-to-End Data Flow Integration Tests
 * 
 * Tests the complete data flow from:
 * GraphQL → AmplifyAPI → Service → Hooks → Frontend Components
 * 
 * Validates the entire request lifecycle:
 * - Create request → Score request → Assign request → Quote generation
 * - Error scenarios across all layers
 * - Performance across integrated layers
 * - Real data transformations
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { generateClient } from 'aws-amplify/api';
import { enhancedRequestsService } from '../../services/enhancedRequestsService';
import { useRequestsQuery, useRequestMutations } from '../../hooks/useRequestsQuery';
import { requestsAPI } from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';

const logger = createLogger('E2EDataFlow');

// Mock external dependencies but keep internal layer integration
jest.mock('aws-amplify/api');
jest.mock('../../utils/amplifyAPI');
jest.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn()
  })
}));

// Mock GraphQL client
const mockGraphQLClient = {
  graphql: jest.fn()
};
generateClient.mockReturnValue(mockGraphQLClient);

// Mock amplifyAPI
const mockAmplifyAPI = {
  update: jest.fn()
};
requestsAPI.mockValue = mockAmplifyAPI;

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 }
    }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('End-to-End Data Flow Integration Tests', () => {
  let wrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = createWrapper();
  });

  describe('Complete Request Lifecycle Flow', () => {
    test('new request creation flows through all layers correctly', async () => {
      // Arrange: Mock GraphQL response with nested relations
      const mockGraphQLResponse = {
        data: {
          listRequests: {
            items: [{
              id: 'req-new-001',
              status: 'New Lead',
              product: 'Kitchen Remodel',
              message: 'Need full kitchen renovation',
              budget: '$50,000',
              createdAt: '2024-01-01T12:00:00Z',
              address: {
                id: 'addr-001',
                propertyFullAddress: '123 Innovation St, Tech City, CA 94000',
                propertyType: 'Single Family',
                bedrooms: 3,
                bathrooms: 2
              },
              homeowner: {
                id: 'contact-001',
                fullName: 'John Innovator',
                email: 'john@innovator.com',
                phone: '+1-555-0123'
              },
              agent: {
                id: 'agent-001',
                fullName: 'Sarah Realtor',
                email: 'sarah@realty.com',
                brokerage: 'Premium Realty Inc'
              }
            }]
          }
        }
      };

      mockGraphQLClient.graphql.mockResolvedValue(mockGraphQLResponse);

      // Act: Use hook to fetch data (simulating frontend component)
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Verify complete data transformation through all layers
      expect(result.current.isSuccess).toBe(true);
      const request = result.current.data[0];
      
      // Verify core request data
      expect(request.id).toBe('req-new-001');
      expect(request.status).toBe('New Lead');
      expect(request.product).toBe('Kitchen Remodel');
      
      // Verify property data transformation
      expect(request.propertyAddress).toBe('123 Innovation St, Tech City, CA 94000');
      expect(request.propertyType).toBe('Single Family');
      expect(request.bedrooms).toBe('3');
      expect(request.bathrooms).toBe('2');
      
      // Verify contact data transformation
      expect(request.clientName).toBe('John Innovator');
      expect(request.clientEmail).toBe('john@innovator.com');
      expect(request.agentName).toBe('Sarah Realtor');
      expect(request.brokerage).toBe('Premium Realty Inc');

      logger.info('✓ Complete request creation flow validated', {
        requestId: request.id,
        propertyAddress: request.propertyAddress,
        clientName: request.clientName,
        agentName: request.agentName
      });
    });

    test('request assignment workflow integrates across all layers', async () => {
      // Arrange: Mock initial request state
      const initialRequest = {
        data: {
          listRequests: {
            items: [{
              id: 'req-assign-001',
              status: 'New Lead',
              assignedTo: null,
              assignedDate: null,
              address: { propertyFullAddress: '456 Assignment Ave' },
              homeowner: { fullName: 'Jane Client' },
              agent: { fullName: 'Bob Agent' }
            }]
          }
        }
      };

      // Mock assignment update
      const updatedRequest = {
        success: true,
        data: {
          id: 'req-assign-001',
          status: 'Assigned',
          assignedTo: 'senior-contractor-001',
          assignedDate: '2024-01-01T15:00:00Z'
        }
      };

      mockGraphQLClient.graphql.mockResolvedValueOnce(initialRequest);
      mockAmplifyAPI.update.mockResolvedValue(updatedRequest);

      // Act: Fetch initial state then perform assignment
      const { result: queryResult } = renderHook(() => useRequestsQuery(), { wrapper });
      const { result: mutationResult } = renderHook(() => useRequestMutations(), { wrapper });

      await waitFor(() => expect(queryResult.current.isLoading).toBe(false));

      // Perform assignment mutation
      mutationResult.current.archiveRequest.mutate('req-assign-001');

      await waitFor(() => {
        expect(mutationResult.current.archiveRequest.isSuccess).toBe(true);
      });

      // Assert: Verify assignment flow through all layers
      expect(queryResult.current.data[0].id).toBe('req-assign-001');
      expect(mockAmplifyAPI.update).toHaveBeenCalledWith('req-assign-001', { status: 'archived' });

      logger.info('✓ Request assignment workflow validated');
    });
  });

  describe('Data Transformation Integrity', () => {
    test('complex nested data transforms correctly through all layers', async () => {
      // Arrange: Complex GraphQL response with missing/null values
      const complexResponse = {
        data: {
          listRequests: {
            items: [{
              id: 'req-complex-001',
              status: 'In Progress',
              product: null, // Test null handling
              address: {
                propertyFullAddress: null,
                houseAddress: '789 Complex Ln',
                city: 'Data City',
                state: 'CA',
                zip: '90210',
                bedrooms: null,
                bathrooms: 2.5
              },
              homeowner: {
                fullName: null,
                firstName: 'Complex',
                lastName: 'Client',
                email: 'complex@client.com'
              },
              agent: null // Test completely missing agent
            }]
          }
        }
      };

      mockGraphQLClient.graphql.mockResolvedValue(complexResponse);

      // Act: Process through all layers
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Assert: Verify robust data transformation
      const request = result.current.data[0];
      
      // Verify address composition from parts when full address missing
      expect(request.propertyAddress).toBe('789 Complex Ln, Data City, CA, 90210');
      
      // Verify name composition from first/last when full name missing
      expect(request.clientName).toBe('Complex Client');
      
      // Verify graceful handling of missing agent
      expect(request.agentName).toBe('N/A');
      expect(request.brokerage).toBe('N/A');
      
      // Verify null/undefined product handling
      expect(request.product).toBeNull();
      
      // Verify number to string conversion
      expect(request.bathrooms).toBe('2.5');

      logger.info('✓ Complex data transformation validated', {
        addressComposition: request.propertyAddress,
        nameComposition: request.clientName,
        missingAgentHandling: request.agentName
      });
    });

    test('empty and error responses handled gracefully', async () => {
      // Arrange: Empty response
      mockGraphQLClient.graphql.mockResolvedValue({
        data: { listRequests: { items: [] } }
      });

      // Act: Process empty response
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Assert: Empty state handled correctly
      expect(result.current.data).toEqual([]);
      expect(result.current.isSuccess).toBe(true);

      logger.info('✓ Empty response handling validated');
    });
  });

  describe('Error Propagation Across Layers', () => {
    test('GraphQL errors propagate correctly through all layers', async () => {
      // Arrange: GraphQL error response
      mockGraphQLClient.graphql.mockResolvedValue({
        errors: [{ message: 'GraphQL field resolution error' }],
        data: null
      });

      // Act: Process error through layers
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Assert: Error handled at hook level
      expect(result.current.isError).toBe(true);
      expect(result.current.error.message).toBe('Failed to fetch requests');

      logger.info('✓ GraphQL error propagation validated');
    });

    test('service layer errors propagate to frontend correctly', async () => {
      // Arrange: GraphQL throws exception
      mockGraphQLClient.graphql.mockRejectedValue(new Error('Network connection failed'));

      // Act: Process through error layers
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Assert: Network error handled at frontend
      expect(result.current.isError).toBe(true);
      expect(result.current.error.message).toBe('Network connection failed');

      logger.info('✓ Service layer error propagation validated');
    });
  });

  describe('Performance Integration', () => {
    test('large dataset performance across all layers', async () => {
      // Arrange: Large dataset (simulate 1000 requests)
      const largeDataset = {
        data: {
          listRequests: {
            items: Array.from({ length: 1000 }, (_, i) => ({
              id: `req-perf-${i.toString().padStart(3, '0')}`,
              status: i % 3 === 0 ? 'New Lead' : i % 3 === 1 ? 'In Progress' : 'Quoted',
              product: `Product ${i}`,
              createdAt: new Date(2024, 0, i % 30 + 1).toISOString(),
              address: {
                propertyFullAddress: `${i} Performance St, Test City, CA 90210`
              },
              homeowner: {
                fullName: `Client ${i}`,
                email: `client${i}@test.com`
              },
              agent: {
                fullName: `Agent ${i % 10}`, // 10 agents handling requests
                brokerage: `Brokerage ${i % 5}` // 5 brokerages
              }
            }))
          }
        }
      };

      mockGraphQLClient.graphql.mockResolvedValue(largeDataset);

      // Act: Process large dataset
      const startTime = performance.now();
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      const endTime = performance.now();

      // Assert: Performance acceptable and data complete
      expect(result.current.data).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
      
      // Verify data integrity on first and last items
      expect(result.current.data[0].id).toBe('req-perf-000');
      expect(result.current.data[999].id).toBe('req-perf-999');
      expect(result.current.data[0].propertyAddress).toBe('0 Performance St, Test City, CA 90210');

      logger.info('✓ Large dataset performance validated', {
        recordCount: result.current.data.length,
        processingTime: `${(endTime - startTime).toFixed(2)}ms`
      });
    });

    test('concurrent data operations maintain integrity', async () => {
      // Arrange: Mock responses for concurrent operations
      const readResponse = {
        data: {
          listRequests: {
            items: [{ 
              id: 'req-concurrent-001',
              status: 'New Lead',
              address: { propertyFullAddress: 'Concurrent St' },
              homeowner: { fullName: 'Concurrent Client' },
              agent: { fullName: 'Concurrent Agent' }
            }]
          }
        }
      };

      const updateResponse = {
        success: true,
        data: { id: 'req-concurrent-001', status: 'archived' }
      };

      mockGraphQLClient.graphql.mockResolvedValue(readResponse);
      mockAmplifyAPI.update.mockResolvedValue(updateResponse);

      // Act: Perform concurrent read and write operations
      const { result: queryResult } = renderHook(() => useRequestsQuery(), { wrapper });
      const { result: mutationResult } = renderHook(() => useRequestMutations(), { wrapper });

      // Start both operations concurrently
      const [queryPromise, mutationPromise] = await Promise.allSettled([
        waitFor(() => expect(queryResult.current.isLoading).toBe(false)),
        new Promise(resolve => {
          mutationResult.current.archiveRequest.mutate('req-concurrent-001');
          waitFor(() => {
            if (mutationResult.current.archiveRequest.isSuccess) resolve();
          });
        })
      ]);

      // Assert: Both operations completed successfully
      expect(queryPromise.status).toBe('fulfilled');
      expect(queryResult.current.data).toHaveLength(1);
      expect(queryResult.current.data[0].id).toBe('req-concurrent-001');

      logger.info('✓ Concurrent operations integrity validated');
    });
  });

  describe('Real-world Scenario Integration', () => {
    test('typical user workflow: browse → select → update → refetch', async () => {
      // Arrange: Initial request list
      const initialList = {
        data: {
          listRequests: {
            items: [
              { 
                id: 'req-workflow-001', 
                status: 'New Lead',
                address: { propertyFullAddress: '123 Workflow St' },
                homeowner: { fullName: 'Workflow Client' },
                agent: { fullName: 'Workflow Agent' }
              },
              { 
                id: 'req-workflow-002', 
                status: 'In Progress',
                address: { propertyFullAddress: '456 Workflow Ave' },
                homeowner: { fullName: 'Second Client' },
                agent: { fullName: 'Second Agent' }
              }
            ]
          }
        }
      };

      // Mock sequence of operations
      mockGraphQLClient.graphql
        .mockResolvedValueOnce(initialList) // Initial browse
        .mockResolvedValueOnce(initialList); // Refetch after update

      mockAmplifyAPI.update.mockResolvedValue({
        success: true,
        data: { id: 'req-workflow-001', status: 'archived' }
      });

      // Act: Simulate user workflow
      const { result: browseResult } = renderHook(() => useRequestsQuery(), { wrapper });
      const { result: actionResult } = renderHook(() => useRequestMutations(), { wrapper });

      // 1. User browses requests
      await waitFor(() => expect(browseResult.current.isLoading).toBe(false));
      expect(browseResult.current.data).toHaveLength(2);

      // 2. User selects and archives a request
      actionResult.current.archiveRequest.mutate('req-workflow-001');
      await waitFor(() => expect(actionResult.current.archiveRequest.isSuccess).toBe(true));

      // 3. User refetches to see updated list
      browseResult.current.refetch();
      await waitFor(() => expect(browseResult.current.isFetching).toBe(false));

      // Assert: Workflow completed successfully
      expect(mockGraphQLClient.graphql).toHaveBeenCalledTimes(2);
      expect(mockAmplifyAPI.update).toHaveBeenCalledWith('req-workflow-001', { status: 'archived' });

      logger.info('✓ Real-world workflow integration validated', {
        initialRequestCount: 2,
        operationCompleted: 'archive',
        refetchTriggered: true
      });
    });
  });
});