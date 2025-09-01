/**
 * RequestRepository Working Tests - Based on Actual Implementation
 * 
 * Tests the actual RequestRepository methods from BaseRepository
 */

// Mock the GraphQL client first
jest.mock('../../../../repositories/core/GraphQLClient', () => {
  const mockClient = {
    query: jest.fn(),
    mutate: jest.fn(),
    withAuthMode: jest.fn(),
    subscribe: jest.fn(),
    batchQuery: jest.fn(),
    isConnected: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  };
  
  return {
    GraphQLClient: jest.fn(() => mockClient),
    apiKeyClient: mockClient
  };
});

// Mock logger
jest.mock('../../../../utils/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

import { RequestRepository, Request, RequestCreateInput } from '../../../../repositories/RequestRepository';

describe('RequestRepository - Working Implementation Tests', () => {
  let repository: RequestRepository;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked client
    const { apiKeyClient } = jest.requireMock('../../../../repositories/core/GraphQLClient');
    mockClient = apiKeyClient;
    
    repository = new RequestRepository();
  });

  describe('Repository Initialization', () => {
    test('should initialize RequestRepository successfully', () => {
      expect(repository).toBeInstanceOf(RequestRepository);
    });

    test('should have modelName set to Requests', () => {
      expect((repository as any).modelName).toBe('Requests');
    });

    test('should have entityName set to Request', () => {
      expect((repository as any).entityName).toBe('Request');
    });
  });

  describe('CRUD Operations - From BaseRepository', () => {
    const mockRequestData: RequestCreateInput = {
      status: 'new',
      message: 'Test request message',
      relationToProperty: 'owner',
      budget: '$50,000',
      leadSource: 'website',
      homeownerContactId: 'homeowner-123',
      agentContactId: 'agent-456',
      addressId: 'address-789'
    };

    const mockRequest: Request = {
      id: 'request-123',
      status: 'new',
      message: 'Test request message',
      relationToProperty: 'owner',
      budget: '$50,000',
      leadSource: 'website',
      homeownerContactId: 'homeowner-123',
      agentContactId: 'agent-456',
      addressId: 'address-789',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    };

    describe('create() method', () => {
      test('should create a new request successfully', async () => {
        const mockResult = {
          data: { createRequests: mockRequest }
        };
        mockClient.mutate.mockResolvedValue(mockResult);

        const result = await repository.create(mockRequestData);

        expect(mockClient.mutate).toHaveBeenCalled();
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeDefined();
        }
      });

      test('should handle creation errors gracefully', async () => {
        const error = new Error('Creation failed');
        mockClient.mutate.mockRejectedValue(error);

        const result = await repository.create(mockRequestData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(error);
        }
      });

      test('should handle GraphQL errors in response', async () => {
        const mockResult = {
          data: null,
          errors: [{ message: 'Validation failed', path: ['createRequests'] }]
        };
        mockClient.mutate.mockResolvedValue(mockResult);

        const result = await repository.create(mockRequestData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error?.message).toContain('GraphQL errors');
        }
      });
    });

    describe('get() method', () => {
      test('should retrieve a request by ID successfully', async () => {
        const mockResult = {
          data: { getRequests: mockRequest }
        };
        mockClient.query.mockResolvedValue(mockResult);

        const result = await repository.get('request-123');

        expect(mockClient.query).toHaveBeenCalled();
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeDefined();
        }
      });

      test('should handle non-existent request', async () => {
        const mockResult = {
          data: { getRequests: null }
        };
        mockClient.query.mockResolvedValue(mockResult);

        const result = await repository.get('non-existent');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error?.message).toContain('not found');
        }
      });

      test('should handle query errors', async () => {
        const error = new Error('Query failed');
        mockClient.query.mockRejectedValue(error);

        const result = await repository.get('request-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(error);
        }
      });
    });

    describe('update() method', () => {
      test('should update a request successfully', async () => {
        const updateData = { status: 'assigned' };
        const updatedRequest = { ...mockRequest, ...updateData };
        
        const mockResult = {
          data: { updateRequests: updatedRequest }
        };
        mockClient.mutate.mockResolvedValue(mockResult);

        const result = await repository.update('request-123', updateData);

        expect(mockClient.mutate).toHaveBeenCalled();
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeDefined();
        }
      });

      test('should handle update errors', async () => {
        const error = new Error('Update failed');
        mockClient.mutate.mockRejectedValue(error);

        const result = await repository.update('request-123', { status: 'assigned' });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(error);
        }
      });
    });

    describe('delete() method', () => {
      test('should delete a request successfully', async () => {
        const mockResult = {
          data: { deleteRequests: mockRequest }
        };
        mockClient.mutate.mockResolvedValue(mockResult);

        const result = await repository.delete('request-123');

        expect(mockClient.mutate).toHaveBeenCalled();
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeDefined();
        }
      });

      test('should handle deletion errors', async () => {
        const error = new Error('Deletion failed');
        mockClient.mutate.mockRejectedValue(error);

        const result = await repository.delete('request-123');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(error);
        }
      });
    });
  });

  describe('Pagination and Listing', () => {
    test('should handle list operations', async () => {
      const mockRequests = [
        { ...mockRequest, id: 'request-1' },
        { ...mockRequest, id: 'request-2' }
      ];
      
      const mockResult = {
        data: { 
          listRequests: { 
            items: mockRequests,
            nextToken: null
          } 
        }
      };
      mockClient.query.mockResolvedValue(mockResult);

      const result = await repository.list();

      expect(mockClient.query).toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    test('should handle pagination', async () => {
      const mockResult = {
        data: { 
          listRequests: { 
            items: [],
            nextToken: 'next-token-123'
          } 
        }
      };
      mockClient.query.mockResolvedValue(mockResult);

      const result = await repository.list({ limit: 10 });

      expect(mockClient.query).toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockClient.query.mockRejectedValue(networkError);

      const result = await repository.get('test-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(networkError);
      }
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockClient.query.mockRejectedValue(timeoutError);

      const result = await repository.get('test-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(timeoutError);
      }
    });

    test('should handle malformed GraphQL responses', async () => {
      const malformedResponse = { data: undefined };
      mockClient.query.mockResolvedValue(malformedResponse);

      const result = await repository.get('test-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    test('should handle empty response data', async () => {
      const emptyResponse = {};
      mockClient.query.mockResolvedValue(emptyResponse);

      const result = await repository.get('test-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Cache Operations', () => {
    test('should handle cache operations', () => {
      // Test cache-related functionality if available
      expect(repository).toHaveProperty('clearCache');
    });

    test('should handle cache statistics', () => {
      // Test cache stats if available
      expect(repository).toHaveProperty('getCacheStats');
    });
  });
});