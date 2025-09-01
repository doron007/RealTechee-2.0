/**
 * RequestRepository Tests - Focusing on Actual Implementation
 * 
 * Tests the real RequestRepository methods and functionality
 */

import { RequestRepository, Request } from '../../../../repositories/RequestRepository';

jest.mock('../../../../repositories/core/GraphQLClient', () => {
  const mockGraphQLClient = {
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
    GraphQLClient: jest.fn(() => mockGraphQLClient),
    apiKeyClient: mockGraphQLClient
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

describe('RequestRepository - Core Functionality', () => {
  let repository: RequestRepository;
  let mockGraphQLClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked client
    const { apiKeyClient } = jest.requireMock('../../../../repositories/core/GraphQLClient');
    mockGraphQLClient = apiKeyClient;
    
    repository = new RequestRepository();
  });

  describe('Repository Initialization', () => {
    test('should initialize successfully', () => {
      expect(repository).toBeInstanceOf(RequestRepository);
    });

    test('should have proper inheritance from BaseRepository', () => {
      expect(repository).toHaveProperty('get');
      expect(repository).toHaveProperty('create');
      expect(repository).toHaveProperty('update');
      expect(repository).toHaveProperty('delete');
    });
  });

  describe('CRUD Operations', () => {
    const mockRequest: Request = {
      id: 'test-request-123',
      status: 'new',
      statusOrder: 1,
      product: 'Kitchen Renovation',
      message: 'Looking for kitchen renovation services',
      leadSource: 'website',
      priority: 'medium',
      source: 'online',
      estimatedValue: 45000,
      budget: '$40,000 - $50,000',
      homeownerContactId: 'homeowner-456',
      agentContactId: 'agent-789',
      addressId: 'address-123',
      readinessScore: 75,
      tags: ['kitchen', 'renovation'],
      missingInformation: [],
      relationToProperty: 'owner',
      needFinance: false,
      informationGatheringStatus: 'pending',
      scopeDefinitionStatus: 'not_started',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      owner: 'system'
    };

    describe('create() method', () => {
      test('should create a new request successfully', async () => {
        const mockResult = {
          data: { createRequest: mockRequest }
        };
        mockGraphQLClient.mutate.mockResolvedValue(mockResult);

        const result = await repository.create(mockRequest);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockRequest);
        expect(mockGraphQLClient.mutate).toHaveBeenCalled();
      });

      test('should handle creation errors', async () => {
        const error = new Error('Creation failed');
        mockGraphQLClient.mutate.mockRejectedValue(error);

        const result = await repository.create(mockRequest);

        expect(result.success).toBe(false);
        expect(result.error).toBe(error);
      });

      test('should handle GraphQL errors in response', async () => {
        const mockResult = {
          data: null,
          errors: [{ message: 'Validation failed', path: ['createRequest'] }]
        };
        mockGraphQLClient.mutate.mockResolvedValue(mockResult);

        const result = await repository.create(mockRequest);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Validation failed');
      });
    });

    describe('get() method', () => {
      test('should retrieve a request by ID successfully', async () => {
        const mockResult = {
          data: { getRequest: mockRequest }
        };
        mockGraphQLClient.query.mockResolvedValue(mockResult);

        const result = await repository.get('test-request-123');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockRequest);
        expect(mockGraphQLClient.query).toHaveBeenCalled();
      });

      test('should return error for non-existent request', async () => {
        const mockResult = {
          data: { getRequest: null }
        };
        mockGraphQLClient.query.mockResolvedValue(mockResult);

        const result = await repository.get('non-existent-id');

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('not found');
      });

      test('should handle network errors', async () => {
        const error = new Error('Network error');
        mockGraphQLClient.query.mockRejectedValue(error);

        const result = await repository.get('test-request-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe(error);
      });
    });

    describe('update() method', () => {
      test('should update a request successfully', async () => {
        const updateData = { status: 'assigned', assignedTo: 'agent-999' };
        const updatedRequest = { ...mockRequest, ...updateData };
        
        const mockResult = {
          data: { updateRequest: updatedRequest }
        };
        mockGraphQLClient.mutate.mockResolvedValue(mockResult);

        const result = await repository.update('test-request-123', updateData);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(updatedRequest);
        expect(mockGraphQLClient.mutate).toHaveBeenCalled();
      });

      test('should handle update errors', async () => {
        const error = new Error('Update failed');
        mockGraphQLClient.mutate.mockRejectedValue(error);

        const result = await repository.update('test-request-123', { status: 'assigned' });

        expect(result.success).toBe(false);
        expect(result.error).toBe(error);
      });
    });

    describe('delete() method', () => {
      test('should delete a request successfully', async () => {
        const mockResult = {
          data: { deleteRequest: mockRequest }
        };
        mockGraphQLClient.mutate.mockResolvedValue(mockResult);

        const result = await repository.delete('test-request-123');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockRequest);
        expect(mockGraphQLClient.mutate).toHaveBeenCalled();
      });

      test('should handle deletion errors', async () => {
        const error = new Error('Deletion failed');
        mockGraphQLClient.mutate.mockRejectedValue(error);

        const result = await repository.delete('test-request-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe(error);
      });
    });
  });

  describe('Business Query Methods', () => {
    describe('findByStatus() method', () => {
      test('should find requests by status', async () => {
        const mockRequests = [mockRequest, { ...mockRequest, id: 'request-2' }];
        const mockResult = {
          data: { listRequests: { items: mockRequests } }
        };
        mockGraphQLClient.query.mockResolvedValue(mockResult);

        const result = await repository.findByStatus('new');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockRequests);
        expect(mockGraphQLClient.query).toHaveBeenCalled();
      });

      test('should handle empty results', async () => {
        const mockResult = {
          data: { listRequests: { items: [] } }
        };
        mockGraphQLClient.query.mockResolvedValue(mockResult);

        const result = await repository.findByStatus('non-existent-status');

        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });

    describe('findUnassigned() method', () => {
      test('should find unassigned requests', async () => {
        const unassignedRequests = [
          { ...mockRequest, assignedTo: undefined },
          { ...mockRequest, id: 'request-2', assignedTo: null }
        ];
        const mockResult = {
          data: { listRequests: { items: unassignedRequests } }
        };
        mockGraphQLClient.query.mockResolvedValue(mockResult);

        const result = await repository.findUnassigned();

        expect(result.success).toBe(true);
        expect(result.data).toEqual(unassignedRequests);
        expect(mockGraphQLClient.query).toHaveBeenCalled();
      });
    });

    describe('findByPriority() method', () => {
      test('should find requests by priority', async () => {
        const highPriorityRequests = [
          { ...mockRequest, priority: 'high' },
          { ...mockRequest, id: 'request-2', priority: 'high' }
        ];
        const mockResult = {
          data: { listRequests: { items: highPriorityRequests } }
        };
        mockGraphQLClient.query.mockResolvedValue(mockResult);

        const result = await repository.findByPriority('high');

        expect(result.success).toBe(true);
        expect(result.data).toEqual(highPriorityRequests);
        expect(mockGraphQLClient.query).toHaveBeenCalled();
      });
    });
  });

  describe('Advanced Query Methods', () => {
    describe('searchRequests() method', () => {
      test('should search requests with multiple filters', async () => {
        const searchCriteria = {
          status: ['new', 'assigned'],
          priority: ['high', 'medium'],
          assignedTo: 'agent-123',
          readinessScoreMin: 70
        };
        
        const mockRequests = [mockRequest];
        const mockResult = {
          data: { listRequests: { items: mockRequests } }
        };
        mockGraphQLClient.query.mockResolvedValue(mockResult);

        const result = await repository.searchRequests(searchCriteria);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockRequests);
        expect(mockGraphQLClient.query).toHaveBeenCalled();
      });

      test('should handle search with no results', async () => {
        const searchCriteria = { status: ['non-existent'] };
        const mockResult = {
          data: { listRequests: { items: [] } }
        };
        mockGraphQLClient.query.mockResolvedValue(mockResult);

        const result = await repository.searchRequests(searchCriteria);

        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });

      test('should handle search errors', async () => {
        const error = new Error('Search failed');
        mockGraphQLClient.query.mockRejectedValue(error);

        const result = await repository.searchRequests({ status: ['new'] });

        expect(result.success).toBe(false);
        expect(result.error).toBe(error);
      });
    });
  });

  describe('Batch Operations', () => {
    test('should handle bulk operations', async () => {
      const requests = [
        { ...mockRequest, id: 'bulk-1' },
        { ...mockRequest, id: 'bulk-2' },
        { ...mockRequest, id: 'bulk-3' }
      ];

      // Mock successful creation for all requests
      mockGraphQLClient.mutate.mockImplementation(() => 
        Promise.resolve({ data: { createRequest: requests[0] } })
      );

      // Test bulk creation
      const createPromises = requests.map(request => repository.create(request));
      const results = await Promise.all(createPromises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(mockGraphQLClient.mutate).toHaveBeenCalledTimes(3);
    });

    test('should handle partial failures in bulk operations', async () => {
      const requests = [
        { ...mockRequest, id: 'bulk-1' },
        { ...mockRequest, id: 'bulk-2' }
      ];

      mockGraphQLClient.mutate
        .mockResolvedValueOnce({ data: { createRequest: requests[0] } })
        .mockRejectedValueOnce(new Error('Creation failed'));

      const results = await Promise.allSettled([
        repository.create(requests[0]),
        repository.create(requests[1])
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed GraphQL responses', async () => {
      const malformedResponse = { data: undefined };
      mockGraphQLClient.query.mockResolvedValue(malformedResponse);

      const result = await repository.get('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      mockGraphQLClient.query.mockRejectedValue(timeoutError);

      const result = await repository.get('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe(timeoutError);
    });

    test('should handle network connectivity issues', async () => {
      const networkError = new Error('Network unavailable');
      networkError.name = 'NetworkError';
      mockGraphQLClient.query.mockRejectedValue(networkError);

      const result = await repository.get('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe(networkError);
    });
  });
});