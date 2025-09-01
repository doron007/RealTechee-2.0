/**
 * Service-to-Hook Integration Tests
 * 
 * Tests the complete integration between:
 * - EnhancedRequestsService ↔ React Hooks (useRequestsQuery)
 * - Validates data flows correctly from service → hooks → frontend
 * - Tests error handling propagation
 * - Validates loading states and caching behavior
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRequestsQuery, useRequestQuery, useRequestMutations } from '../../hooks/useRequestsQuery';
import { enhancedRequestsService } from '../../services/enhancedRequestsService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ServiceHookIntegration');

// Mock the service to test integration behavior
jest.mock('../../services/enhancedRequestsService');
const mockService = enhancedRequestsService;

// Mock notification context
jest.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn()
  })
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0
      }
    }
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Service-Hook Integration Tests', () => {
  let queryClient;
  let wrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0, gcTime: 0 }
      }
    });
    wrapper = createWrapper();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Service → Hook Data Flow', () => {
    test('useRequestsQuery successfully integrates with enhancedRequestsService', async () => {
      // Arrange: Mock service to return test data
      const mockRequests = [
        {
          id: 'req-1',
          status: 'New Lead',
          propertyAddress: '123 Main St, City, State 12345',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          agentName: 'Jane Agent',
          product: 'Kitchen Remodel',
          createdAt: '2024-01-01T12:00:00Z'
        },
        {
          id: 'req-2', 
          status: 'In Progress',
          propertyAddress: '456 Oak Ave, City, State 67890',
          clientName: 'Alice Smith',
          clientEmail: 'alice@example.com',
          agentName: 'Bob Agent',
          product: 'Bathroom Renovation',
          createdAt: '2024-01-02T12:00:00Z'
        }
      ];

      mockService.getFullyEnhancedRequests.mockResolvedValue({
        success: true,
        data: mockRequests
      });

      // Act: Render hook and wait for data
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Verify successful integration
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockRequests);
      expect(result.current.error).toBeNull();
      
      // Verify service was called correctly
      expect(mockService.getFullyEnhancedRequests).toHaveBeenCalledTimes(1);
      
      logger.info('✓ Service-Hook integration successful', {
        requestsReceived: result.current.data?.length,
        loadingState: result.current.isLoading,
        errorState: result.current.error
      });
    });

    test('useRequestQuery integrates with service for single request', async () => {
      // Arrange: Mock service for single request
      const mockRequest = {
        id: 'req-1',
        status: 'New Lead',
        propertyAddress: '123 Main St',
        clientName: 'John Doe'
      };

      mockService.getFullyEnhancedRequests.mockResolvedValue({
        success: true,
        data: [mockRequest]
      });

      // Act: Render hook for single request
      const { result } = renderHook(() => useRequestQuery('req-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Verify single request integration
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockRequest);
      expect(mockService.getFullyEnhancedRequests).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    test('service errors propagate correctly to hooks', async () => {
      // Arrange: Mock service to return error
      const serviceError = 'GraphQL connection failed';
      mockService.getFullyEnhancedRequests.mockResolvedValue({
        success: false,
        error: serviceError
      });

      // Act: Render hook
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Verify error propagation
      expect(result.current.isError).toBe(true);
      expect(result.current.error.message).toBe(serviceError);
      expect(result.current.data).toBeUndefined();

      logger.info('✓ Error propagation working correctly', {
        errorReceived: result.current.error?.message,
        isError: result.current.isError
      });
    });

    test('service exceptions are handled by hooks', async () => {
      // Arrange: Mock service to throw exception
      mockService.getFullyEnhancedRequests.mockRejectedValue(new Error('Network timeout'));

      // Act: Render hook
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Verify exception handling
      expect(result.current.isError).toBe(true);
      expect(result.current.error.message).toBe('Network timeout');
    });
  });

  describe('Mutation Integration', () => {
    test('useRequestMutations integrates with service update methods', async () => {
      // Arrange: Mock successful update
      mockService.updateRequest.mockResolvedValue({
        success: true,
        data: { id: 'req-1', status: 'archived' }
      });

      // Act: Render mutation hook
      const { result } = renderHook(() => useRequestMutations(), { wrapper });

      // Trigger archive mutation
      result.current.archiveRequest.mutate('req-1');

      await waitFor(() => {
        expect(result.current.archiveRequest.isSuccess).toBe(true);
      });

      // Assert: Verify mutation integration
      expect(mockService.updateRequest).toHaveBeenCalledWith('req-1', { status: 'archived' });
      expect(result.current.archiveRequest.isError).toBe(false);

      logger.info('✓ Mutation integration successful');
    });

    test('mutation errors propagate from service to hooks', async () => {
      // Arrange: Mock service to return error
      mockService.updateRequest.mockResolvedValue({
        success: false,
        error: 'Update validation failed'
      });

      // Act: Render mutation hook
      const { result } = renderHook(() => useRequestMutations(), { wrapper });

      result.current.archiveRequest.mutate('req-1');

      await waitFor(() => {
        expect(result.current.archiveRequest.isError).toBe(true);
      });

      // Assert: Verify error propagation in mutations
      expect(result.current.archiveRequest.error.message).toBe('Update validation failed');
    });
  });

  describe('Caching and Performance Integration', () => {
    test('hooks properly cache service responses', async () => {
      // Arrange: Mock service response
      const mockData = [{ id: 'req-1', status: 'New Lead' }];
      mockService.getFullyEnhancedRequests.mockResolvedValue({
        success: true,
        data: mockData
      });

      // Act: Render hook twice
      const { result: result1 } = renderHook(() => useRequestsQuery(), { wrapper });
      await waitFor(() => expect(result1.current.isLoading).toBe(false));

      const { result: result2 } = renderHook(() => useRequestsQuery(), { wrapper });
      await waitFor(() => expect(result2.current.isLoading).toBe(false));

      // Assert: Service should only be called once due to caching
      expect(mockService.getFullyEnhancedRequests).toHaveBeenCalledTimes(1);
      expect(result1.current.data).toEqual(result2.current.data);

      logger.info('✓ Caching integration working correctly');
    });

    test('stale data refetching works between service and hooks', async () => {
      // Arrange: Mock service with different responses
      mockService.getFullyEnhancedRequests
        .mockResolvedValueOnce({ success: true, data: [{ id: 'req-1', status: 'Old' }] })
        .mockResolvedValueOnce({ success: true, data: [{ id: 'req-1', status: 'Updated' }] });

      // Act: Render hook with stale time 0 (immediate refetch)
      const { result, rerender } = renderHook(() => useRequestsQuery(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      
      // Force refetch by changing query client
      result.current.refetch();
      
      await waitFor(() => expect(result.current.isFetching).toBe(false));

      // Assert: Both calls should be made
      expect(mockService.getFullyEnhancedRequests).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading State Integration', () => {
    test('loading states flow correctly from service to hooks', async () => {
      // Arrange: Mock delayed service response
      let resolveService;
      const servicePromise = new Promise(resolve => {
        resolveService = resolve;
      });

      mockService.getFullyEnhancedRequests.mockReturnValue(servicePromise);

      // Act: Render hook
      const { result } = renderHook(() => useRequestsQuery(), { wrapper });

      // Assert: Initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Resolve service
      resolveService({ success: true, data: [{ id: 'req-1' }] });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Final loaded state
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeDefined();

      logger.info('✓ Loading state integration working correctly');
    });
  });

  describe('Concurrent Operations Integration', () => {
    test('concurrent hook calls integrate properly with service', async () => {
      // Arrange: Mock service with delay
      mockService.getFullyEnhancedRequests.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, data: [{ id: 'concurrent-test' }] };
      });

      // Act: Create multiple concurrent hooks
      const hooks = [
        renderHook(() => useRequestsQuery(), { wrapper }),
        renderHook(() => useRequestsQuery(), { wrapper }),
        renderHook(() => useRequestsQuery(), { wrapper })
      ];

      // Wait for all to complete
      await Promise.all(hooks.map(({ result }) => 
        waitFor(() => expect(result.current.isLoading).toBe(false))
      ));

      // Assert: All hooks should have same data, service called minimal times due to caching
      const firstData = hooks[0].result.current.data;
      hooks.forEach(({ result }) => {
        expect(result.current.data).toEqual(firstData);
        expect(result.current.isSuccess).toBe(true);
      });

      logger.info('✓ Concurrent operations integration successful');
    });
  });
});