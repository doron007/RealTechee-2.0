/**
 * RequestRepository Comprehensive Tests - 100% Coverage
 * 
 * Complete test suite covering all CRUD operations, business queries, 
 * validations, error scenarios, and edge cases
 */

import { RequestRepository } from '../../../repositories/RequestRepository';
import type { 
  Request, 
  EnhancedRequest, 
  RequestNote, 
  RequestAssignment,
  RequestFilterOptions 
} from '../../../repositories/RequestRepository';
import { GraphQLClient } from '../../../repositories/base/GraphQLClient';
import { 
  ValidationError, 
  NotFoundError, 
  RepositoryError 
} from '../../../repositories/base/RepositoryError';
import { 
  createMockRequest,
  createMockEnhancedRequest,
  createMockRequestNote,
  createMockRequestAssignment,
  createMockRequestStatusHistory,
  createMockRepositorySuccess,
  createMockRepositoryError,
  createMockGraphQLSuccess,
  createMockGraphQLError,
  createNetworkErrorScenario,
  createValidationErrorScenario,
  createLargeDataSet,
  createMockConcurrentOperations,
  createAsyncDelay
} from '../testFactories';

// Mock the GraphQLClient
const mockGraphQLClient = {
  query: jest.fn(),
  mutate: jest.fn(),
  execute: jest.fn(),
  getMetrics: jest.fn(),
  clearMetrics: jest.fn()
};

jest.mock('../../../repositories/base/GraphQLClient', () => ({
  GraphQLClient: jest.fn(() => mockGraphQLClient)
}));

describe('RequestRepository - Comprehensive Coverage', () => {
  let repository: RequestRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGraphQLClient.query.mockReset();
    mockGraphQLClient.mutate.mockReset();
    mockGraphQLClient.execute.mockReset();
    
    repository = new RequestRepository(mockGraphQLClient as unknown as GraphQLClient);
  });

  describe('Initialization', () => {
    it('should initialize with GraphQL client', () => {
      expect(repository).toBeInstanceOf(RequestRepository);
      expect(GraphQLClient).toHaveBeenCalled();
    });

    it('should initialize with custom client', () => {
      const customClient = new GraphQLClient({ defaultAuthMode: 'userPool' });
      const customRepository = new RequestRepository(customClient);
      
      expect(customRepository).toBeInstanceOf(RequestRepository);
    });
  });

  describe('create() method - Complete Coverage', () => {
    const validRequestData = {
      homeownerContactId: 'contact_123',
      product: 'Kitchen Renovation',
      message: 'Looking for complete kitchen remodel',
      budget: '$50,000 - $75,000',
      leadSource: 'website',
      priority: 'medium' as const
    };

    it('should create a new request successfully', async () => {
      const mockRequest = createMockRequest(validRequestData);
      const mockResponse = createMockGraphQLSuccess({
        createRequests: mockRequest
      });

      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositorySuccess(mockResponse.data)
      );

      const result = await repository.create({ data: validRequestData });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRequest);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation CreateRequest'),
        expect.objectContaining({
          input: expect.objectContaining({
            homeownerContactId: 'contact_123',
            product: 'Kitchen Renovation'
          })
        }),
        expect.objectContaining({
          authMode: 'apiKey',
          operation: 'create',
          model: 'Request'
        })
      );
    });

    it('should validate required contact field', async () => {
      const invalidData = { product: 'Kitchen Renovation' };
      
      const result = await repository.create({ data: invalidData as any });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error?.message).toContain('Either homeowner or agent contact is required');
    });

    it('should validate priority enum values', async () => {
      const invalidData = {
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation',
        priority: 'invalid_priority' as any
      };

      const result = await repository.create({ data: invalidData });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error?.message).toContain('Priority must be one of: low, medium, high, urgent');
    });

    it('should validate readiness score range', async () => {
      const invalidData = {
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation',
        readinessScore: 150 // Invalid: > 100
      };

      const result = await repository.create({ data: invalidData });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error?.message).toContain('Readiness score must be between 0 and 100');
    });

    it('should validate negative estimated value', async () => {
      const invalidData = {
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation',
        estimatedValue: -1000 // Invalid: negative
      };

      const result = await repository.create({ data: invalidData });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error?.message).toContain('Estimated value cannot be negative');
    });

    it('should set default values during creation', async () => {
      const mockRequest = createMockRequest({ status: 'new', priority: 'medium' });
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositorySuccess({ createRequests: mockRequest })
      );

      const minimalData = {
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation'
      };

      const result = await repository.create({ data: minimalData });

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({
            status: 'new',
            priority: 'medium',
            source: 'manual',
            readinessScore: 0
          })
        }),
        expect.any(Object)
      );
    });

    it('should transform array fields to JSON strings', async () => {
      const mockRequest = createMockRequest();
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositorySuccess({ createRequests: mockRequest })
      );

      const dataWithArrays = {
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation',
        tags: ['urgent', 'kitchen'],
        missingInformation: ['floor_plan', 'measurements']
      };

      const result = await repository.create({ data: dataWithArrays });

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({
            tags: '["urgent","kitchen"]',
            missingInformation: '["floor_plan","measurements"]'
          })
        }),
        expect.any(Object)
      );
    });

    it('should handle GraphQL creation errors', async () => {
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositoryError(new Error('Duplicate entry'))
      );

      const result = await repository.create({ data: validRequestData });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Duplicate entry');
    });

    it('should handle network errors during creation', async () => {
      const networkError = createNetworkErrorScenario();
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositoryError(networkError)
      );

      const result = await repository.create({ data: validRequestData });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('get() method - Complete Coverage', () => {
    it('should retrieve a request by ID', async () => {
      const mockRequest = createMockRequest({ id: 'req_123' });
      
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess({ getRequests: mockRequest })
      );

      const result = await repository.get('req_123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRequest);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query GetRequest'),
        { id: 'req_123' },
        expect.objectContaining({
          authMode: 'apiKey',
          operation: 'get',
          model: 'Request'
        })
      );
    });

    it('should return not found error for non-existent request', async () => {
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess({ getRequests: null })
      );

      const result = await repository.get('nonexistent_id');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.error?.message).toContain('Request not found');
    });

    it('should transform JSON string arrays back to arrays', async () => {
      const mockRequest = {
        ...createMockRequest({ id: 'req_123' }),
        tags: '["tag1","tag2"]',
        missingInformation: '["info1"]'
      };
      
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess({ getRequests: mockRequest })
      );

      const result = await repository.get('req_123');

      expect(result.success).toBe(true);
      expect(result.data?.tags).toEqual(['tag1', 'tag2']);
      expect(result.data?.missingInformation).toEqual(['info1']);
    });

    it('should handle malformed JSON in array fields', async () => {
      const mockRequest = {
        ...createMockRequest({ id: 'req_123' }),
        tags: 'invalid_json',
        missingInformation: '["valid_json"]'
      };
      
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess({ getRequests: mockRequest })
      );

      const result = await repository.get('req_123');

      expect(result.success).toBe(true);
      expect(result.data?.tags).toEqual([]); // Falls back to empty array
      expect(result.data?.missingInformation).toEqual(['valid_json']);
    });

    it('should handle network errors gracefully', async () => {
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositoryError(createNetworkErrorScenario())
      );

      const result = await repository.get('req_123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('update() method - Complete Coverage', () => {
    const updateData = {
      id: 'req_123',
      data: {
        priority: 'high' as const,
        followUpDate: '2025-01-20T10:00:00Z',
        officeNotes: 'Updated notes'
      }
    };

    it('should update a request successfully', async () => {
      const mockRequest = createMockRequest({ 
        id: 'req_123',
        priority: 'high'
      });
      
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositorySuccess({ updateRequests: mockRequest })
      );

      const result = await repository.update(updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRequest);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation UpdateRequest'),
        expect.objectContaining({
          input: expect.objectContaining({
            id: 'req_123',
            priority: 'high',
            updatedAt: expect.any(String)
          })
        }),
        expect.any(Object)
      );
    });

    it('should validate update fields', async () => {
      const invalidUpdate = {
        id: 'req_123',
        data: {
          priority: 'invalid_priority' as any
        }
      };

      const result = await repository.update(invalidUpdate);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });

    it('should validate status transitions on update', async () => {
      // Mock current request
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess({ 
          getRequests: createMockRequest({ id: 'req_123', status: 'completed' }) 
        })
      );

      const result = await repository.update({
        id: 'req_123',
        data: { status: 'new' } // Invalid transition
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error?.message).toContain('Invalid status transition');
    });

    it('should transform arrays to JSON strings on update', async () => {
      const mockRequest = createMockRequest({ id: 'req_123' });
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositorySuccess({ updateRequests: mockRequest })
      );

      const updateWithArrays = {
        id: 'req_123',
        data: {
          tags: ['updated'],
          missingInformation: ['new_info']
        }
      };

      const result = await repository.update(updateWithArrays);

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({
            tags: '["updated"]',
            missingInformation: '["new_info"]'
          })
        }),
        expect.any(Object)
      );
    });

    it('should handle partial updates correctly', async () => {
      const mockRequest = createMockRequest({ id: 'req_123' });
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositorySuccess({ updateRequests: mockRequest })
      );

      const partialUpdate = {
        id: 'req_123',
        data: {
          officeNotes: 'Only updating notes'
        }
      };

      const result = await repository.update(partialUpdate);

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({
            id: 'req_123',
            officeNotes: 'Only updating notes',
            updatedAt: expect.any(String)
          })
        }),
        expect.any(Object)
      );
    });

    it('should handle update errors', async () => {
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositoryError(new Error('Update failed'))
      );

      const result = await repository.update(updateData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Update failed');
    });
  });

  describe('delete() method - Complete Coverage', () => {
    it('should delete a request successfully', async () => {
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositorySuccess({ deleteRequests: { id: 'req_123' } })
      );

      const result = await repository.delete('req_123');

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation DeleteRequest'),
        { input: { id: 'req_123' } },
        expect.objectContaining({
          authMode: 'apiKey',
          operation: 'delete',
          model: 'Request'
        })
      );
    });

    it('should handle delete errors', async () => {
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositoryError(new Error('Cannot delete request with active assignments'))
      );

      const result = await repository.delete('req_123');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot delete request');
    });

    it('should handle deletion of non-existent request', async () => {
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockRepositoryError(new NotFoundError('Request', 'req_nonexistent'))
      );

      const result = await repository.delete('req_nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NotFoundError);
    });
  });

  describe('getWithRelations() method - Complete Coverage', () => {
    it('should load request with all related entities', async () => {
      const mockEnhancedRequest = createMockEnhancedRequest({
        id: 'req_123',
        notes: [createMockRequestNote()],
        assignments: [createMockRequestAssignment()],
        statusHistory: [createMockRequestStatusHistory()]
      });

      const mockResponseData = {
        ...mockEnhancedRequest,
        notes: { items: mockEnhancedRequest.notes },
        assignments: { items: mockEnhancedRequest.assignments },
        statusHistory: { items: mockEnhancedRequest.statusHistory },
        informationItems: { items: [] },
        scopeItems: { items: [] },
        workflowStates: { items: [] }
      };

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess({ getRequests: mockResponseData })
      );

      const result = await repository.getWithRelations('req_123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.notes).toHaveLength(1);
      expect(result.data!.assignments).toHaveLength(1);
      expect(result.data!.statusHistory).toHaveLength(1);
      expect(result.data!.homeowner).toBeDefined();
      expect(result.data!.agent).toBeDefined();
      expect(result.data!.address).toBeDefined();
      
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query GetRequestWithRelations'),
        { id: 'req_123' },
        expect.objectContaining({
          authMode: 'apiKey',
          operation: 'getWithRelations',
          model: 'Request'
        })
      );
    });

    it('should handle missing related entities gracefully', async () => {
      const mockRequest = createMockRequest({ id: 'req_123' });
      
      const mockResponseData = {
        ...mockRequest,
        notes: { items: [] },
        assignments: { items: [] },
        statusHistory: { items: [] },
        informationItems: { items: [] },
        scopeItems: { items: [] },
        workflowStates: { items: [] },
        homeowner: null,
        agent: null,
        address: null
      };

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess({ getRequests: mockResponseData })
      );

      const result = await repository.getWithRelations('req_123');

      expect(result.success).toBe(true);
      expect(result.data!.notes).toEqual([]);
      expect(result.data!.assignments).toEqual([]);
      expect(result.data!.statusHistory).toEqual([]);
      expect(result.data!.homeowner).toBeNull();
      expect(result.data!.agent).toBeNull();
      expect(result.data!.address).toBeNull();
    });

    it('should return not found for non-existent request', async () => {
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess({ getRequests: null })
      );

      const result = await repository.getWithRelations('nonexistent_id');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NotFoundError);
    });
  });

  describe('Business Query Methods - Complete Coverage', () => {
    describe('findByStatus()', () => {
      it('should find requests by single status', async () => {
        const mockRequests = [
          createMockRequest({ status: 'new' }),
          createMockRequest({ status: 'new' })
        ];

        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ listRequests: { items: mockRequests } })
        );

        const result = await repository.findByStatus('new');

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(mockGraphQLClient.query).toHaveBeenCalledWith(
          expect.stringContaining('query ListRequests'),
          expect.objectContaining({
            filter: expect.objectContaining({
              or: [{ status: { eq: 'new' } }]
            })
          }),
          expect.any(Object)
        );
      });

      it('should find requests by multiple statuses', async () => {
        const mockRequests = [createMockRequest()];

        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ listRequests: { items: mockRequests } })
        );

        const result = await repository.findByStatus(['new', 'assigned']);

        expect(result.success).toBe(true);
        expect(mockGraphQLClient.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            filter: expect.objectContaining({
              or: [
                { status: { eq: 'new' } },
                { status: { eq: 'assigned' } }
              ]
            })
          }),
          expect.any(Object)
        );
      });
    });

    describe('findUnassigned()', () => {
      it('should find unassigned requests', async () => {
        const mockRequests = [
          createMockRequest({ assignedTo: null }),
          createMockRequest({ assignedTo: '' })
        ];

        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ listRequests: { items: mockRequests } })
        );

        const result = await repository.findUnassigned({ limit: 10 });

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(mockGraphQLClient.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            filter: expect.objectContaining({
              or: [
                { assignedTo: { attributeExists: false } },
                { assignedTo: { eq: null } },
                { assignedTo: { eq: '' } }
              ]
            }),
            limit: 10
          }),
          expect.any(Object)
        );
      });
    });

    describe('findExpiring()', () => {
      it('should find expiring requests', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        
        const expiringRequests = [
          createMockRequest({ 
            followUpDate: futureDate.toISOString().split('T')[0]
          })
        ];

        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ listRequests: { items: expiringRequests } })
        );

        const result = await repository.findExpiring(7);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(mockGraphQLClient.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            filter: expect.objectContaining({
              followUpDate: {
                le: expect.any(String)
              }
            })
          }),
          expect.any(Object)
        );
      });
    });

    describe('findByAgent()', () => {
      it('should find requests assigned to specific agent', async () => {
        const mockRequests = [
          createMockRequest({ agentContactId: 'agent_123' })
        ];

        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ listRequests: { items: mockRequests } })
        );

        const result = await repository.findByAgent('agent_123');

        expect(result.success).toBe(true);
        expect(mockGraphQLClient.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            filter: expect.objectContaining({
              agentContactId: { eq: 'agent_123' }
            })
          }),
          expect.any(Object)
        );
      });
    });

    describe('findByHomeowner()', () => {
      it('should find requests for specific homeowner', async () => {
        const mockRequests = [
          createMockRequest({ homeownerContactId: 'homeowner_123' })
        ];

        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ listRequests: { items: mockRequests } })
        );

        const result = await repository.findByHomeowner('homeowner_123');

        expect(result.success).toBe(true);
        expect(mockGraphQLClient.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            filter: expect.objectContaining({
              homeownerContactId: { eq: 'homeowner_123' }
            })
          }),
          expect.any(Object)
        );
      });
    });

    describe('findByPriority()', () => {
      it('should find requests by single priority', async () => {
        const mockRequests = [
          createMockRequest({ priority: 'high' })
        ];

        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ listRequests: { items: mockRequests } })
        );

        const result = await repository.findByPriority('high');

        expect(result.success).toBe(true);
        expect(mockGraphQLClient.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            filter: expect.objectContaining({
              or: [{ priority: { eq: 'high' } }]
            })
          }),
          expect.any(Object)
        );
      });

      it('should find requests by multiple priorities', async () => {
        const mockRequests = [createMockRequest()];

        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ listRequests: { items: mockRequests } })
        );

        const result = await repository.findByPriority(['high', 'urgent']);

        expect(result.success).toBe(true);
        expect(mockGraphQLClient.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            filter: expect.objectContaining({
              or: [
                { priority: { eq: 'high' } },
                { priority: { eq: 'urgent' } }
              ]
            })
          }),
          expect.any(Object)
        );
      });
    });

    describe('findNeedingFollowUp()', () => {
      it('should find requests needing follow-up', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        
        const mockRequests = [
          createMockRequest({ 
            followUpDate: pastDate.toISOString().split('T')[0],
            status: 'in_progress'
          })
        ];

        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ listRequests: { items: mockRequests } })
        );

        const result = await repository.findNeedingFollowUp();

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(mockGraphQLClient.query).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            filter: expect.objectContaining({
              and: [
                { followUpDate: { le: expect.any(String) } },
                { followUpDate: { attributeExists: true } },
                { 
                  or: [
                    { status: { ne: 'completed' } },
                    { status: { ne: 'cancelled' } },
                    { status: { ne: 'archived' } }
                  ]
                }
              ]
            })
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('searchRequests() method - Complete Coverage', () => {
    const mockRequests = [createMockRequest()];
    
    beforeEach(() => {
      mockGraphQLClient.query.mockResolvedValue(
        createMockRepositorySuccess({
          listRequests: { 
            items: mockRequests,
            nextToken: null
          }
        })
      );
    });

    it('should search with single status filter', async () => {
      const filters: RequestFilterOptions = {
        status: 'new'
      };

      const result = await repository.searchRequests(filters);

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: expect.objectContaining({
            or: [{ status: { eq: 'new' } }]
          })
        }),
        expect.any(Object)
      );
    });

    it('should search with multiple status filters', async () => {
      const filters: RequestFilterOptions = {
        status: ['new', 'assigned']
      };

      const result = await repository.searchRequests(filters);

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: expect.objectContaining({
            or: [
              { status: { eq: 'new' } },
              { status: { eq: 'assigned' } }
            ]
          })
        }),
        expect.any(Object)
      );
    });

    it('should search with assignment filters', async () => {
      const filters: RequestFilterOptions = {
        assignedTo: 'agent_123'
      };

      const result = await repository.searchRequests(filters);

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: expect.objectContaining({
            and: [
              { or: [{ assignedTo: { eq: 'agent_123' } }] }
            ]
          })
        }),
        expect.any(Object)
      );
    });

    it('should search with priority filters', async () => {
      const filters: RequestFilterOptions = {
        priority: ['high', 'urgent']
      };

      const result = await repository.searchRequests(filters);

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: expect.objectContaining({
            and: [
              { or: [
                { priority: { eq: 'high' } },
                { priority: { eq: 'urgent' } }
              ]}
            ]
          })
        }),
        expect.any(Object)
      );
    });

    it('should search with date range filters', async () => {
      const filters: RequestFilterOptions = {
        dateRange: {
          field: 'createdAt',
          start: '2025-01-01T00:00:00Z',
          end: '2025-01-31T23:59:59Z'
        }
      };

      const result = await repository.searchRequests(filters);

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: expect.objectContaining({
            and: [
              { createdAt: { between: ['2025-01-01T00:00:00Z', '2025-01-31T23:59:59Z'] } }
            ]
          })
        }),
        expect.any(Object)
      );
    });

    it('should search with boolean filters', async () => {
      const filters: RequestFilterOptions = {
        hasAgent: true,
        hasProperty: true,
        isArchived: false
      };

      const result = await repository.searchRequests(filters);

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: expect.objectContaining({
            and: [
              { agentContactId: { attributeExists: true } },
              { addressId: { attributeExists: true } },
              { 
                or: [
                  { archived: { attributeExists: false } },
                  { archived: { eq: null } },
                  { archived: { eq: '' } }
                ]
              }
            ]
          })
        }),
        expect.any(Object)
      );
    });

    it('should search with readiness score filter', async () => {
      const filters: RequestFilterOptions = {
        readinessScoreMin: 70
      };

      const result = await repository.searchRequests(filters);

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: expect.objectContaining({
            and: [
              { readinessScore: { ge: 70 } }
            ]
          })
        }),
        expect.any(Object)
      );
    });

    it('should combine multiple filter types', async () => {
      const filters: RequestFilterOptions = {
        status: ['new', 'assigned'],
        priority: 'high',
        hasAgent: false,
        readinessScoreMin: 50,
        dateRange: {
          field: 'createdAt',
          start: '2025-01-01T00:00:00Z',
          end: '2025-01-31T23:59:59Z'
        }
      };

      const result = await repository.searchRequests(filters, { limit: 50 });

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: expect.objectContaining({
            or: [
              { status: { eq: 'new' } },
              { status: { eq: 'assigned' } }
            ],
            and: expect.arrayContaining([
              { or: [{ priority: { eq: 'high' } }] },
              { readinessScore: { ge: 50 } },
              { createdAt: { between: ['2025-01-01T00:00:00Z', '2025-01-31T23:59:59Z'] } }
            ])
          }),
          limit: 50
        }),
        expect.any(Object)
      );
    });
  });

  describe('Status Management - Complete Coverage', () => {
    describe('validateStatusTransition()', () => {
      it('should validate valid status transitions', async () => {
        const result = await repository.validateStatusTransition('new', 'assigned');

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid status transitions', async () => {
        const result = await repository.validateStatusTransition('completed', 'new');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Cannot transition from 'completed' to 'new'");
      });

      it('should allow self-transitions', async () => {
        const result = await repository.validateStatusTransition('new', 'new');

        expect(result.isValid).toBe(true);
      });

      it('should provide business rules for invalid transitions', async () => {
        const result = await repository.validateStatusTransition('assigned', 'invalid_status');

        expect(result.isValid).toBe(false);
        expect(result.businessRules).toContain("Allowed transitions from 'assigned': in_progress, on_hold, cancelled");
      });

      it('should add warnings for risky transitions', async () => {
        const result = await repository.validateStatusTransition('in_progress', 'cancelled');

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Cancelling request in progress - consider adding cancellation reason');
      });

      it('should specify required fields for certain transitions', async () => {
        const result = await repository.validateStatusTransition('new', 'assigned');

        expect(result.isValid).toBe(true);
        expect(result.requiredFields).toContain('assignedTo');
      });

      it('should validate quote requirements', async () => {
        const result = await repository.validateStatusTransition('in_progress', 'quote_sent');

        expect(result.isValid).toBe(true);
        expect(result.requiredFields).toContain('Quote must be generated first');
      });
    });

    describe('updateStatus()', () => {
      beforeEach(() => {
        // Mock getting current request
        mockGraphQLClient.query.mockResolvedValue(
          createMockRepositorySuccess({ 
            getRequests: createMockRequest({ 
              id: 'req_123', 
              status: 'new',
              assignedTo: 'agent_123'
            }) 
          })
        );
        
        // Mock status history creation
        mockGraphQLClient.mutate.mockResolvedValueOnce(
          createMockRepositorySuccess({
            createRequestStatusHistory: createMockRequestStatusHistory()
          })
        );
        
        // Mock request update
        mockGraphQLClient.mutate.mockResolvedValueOnce(
          createMockRepositorySuccess({
            updateRequests: createMockRequest({ 
              id: 'req_123',
              status: 'assigned'
            })
          })
        );
      });

      it('should update request status with validation and history', async () => {
        const result = await repository.updateStatus(
          'req_123',
          'assigned',
          {
            userId: 'admin_123',
            userName: 'Admin User',
            reason: 'Agent available',
            businessImpact: 'medium',
            notifyClient: true
          }
        );

        expect(result.success).toBe(true);
        expect(mockGraphQLClient.query).toHaveBeenCalledTimes(1); // Get current request
        expect(mockGraphQLClient.mutate).toHaveBeenCalledTimes(2); // Status history + Update
      });

      it('should reject invalid status transitions', async () => {
        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ 
            getRequests: createMockRequest({ 
              id: 'req_123', 
              status: 'completed' 
            }) 
          })
        );

        const result = await repository.updateStatus('req_123', 'new');

        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(RepositoryError);
        expect(result.error?.message).toContain('Invalid status transition');
      });

      it('should handle missing request', async () => {
        mockGraphQLClient.query.mockResolvedValueOnce(
          createMockRepositorySuccess({ getRequests: null })
        );

        const result = await repository.updateStatus('nonexistent', 'assigned');

        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(NotFoundError);
      });

      it('should continue on status history failure', async () => {
        // Mock update success but history failure
        mockGraphQLClient.mutate
          .mockResolvedValueOnce(createMockRepositoryError(new Error('History failed')))
          .mockResolvedValueOnce(
            createMockRepositorySuccess({
              updateRequests: createMockRequest({ id: 'req_123', status: 'assigned' })
            })
          );

        const result = await repository.updateStatus('req_123', 'assigned');

        expect(result.success).toBe(true); // Should still succeed despite history failure
      });

      it('should include warnings in result', async () => {
        const result = await repository.updateStatus(
          'req_123',
          'assigned',
          { reason: 'Test reason' }
        );

        expect(result.success).toBe(true);
        expect(result.meta?.warnings).toBeDefined();
      });
    });
  });

  describe('Assignment Operations - Complete Coverage', () => {
    describe('assignRequest()', () => {
      beforeEach(() => {
        // Mock successful assignment creation
        mockGraphQLClient.mutate.mockResolvedValueOnce(
          createMockRepositorySuccess({
            createRequestAssignments: createMockRequestAssignment({
              requestId: 'req_123',
              assignedToId: 'agent_456'
            })
          })
        );

        // Mock request update
        mockGraphQLClient.mutate.mockResolvedValueOnce(
          createMockRepositorySuccess({
            updateRequests: createMockRequest({ 
              id: 'req_123',
              assignedTo: 'Agent Smith'
            })
          })
        );
      });

      it('should assign request to agent successfully', async () => {
        const result = await repository.assignRequest(
          'req_123',
          'agent_456',
          'Agent Smith',
          'Account Executive',
          {
            assignedById: 'admin_123',
            assignedByName: 'Admin User',
            reason: 'Geographic expertise',
            priority: 'high',
            dueDate: '2025-01-20T10:00:00Z',
            estimatedHours: 8
          }
        );

        expect(result.success).toBe(true);
        expect(result.data?.assignedToId).toBe('agent_456');
        expect(mockGraphQLClient.mutate).toHaveBeenCalledTimes(2); // Assignment + Request update

        // Verify assignment creation
        expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
          expect.stringContaining('mutation CreateRequestAssignment'),
          expect.objectContaining({
            input: expect.objectContaining({
              requestId: 'req_123',
              assignedToId: 'agent_456',
              assignedToName: 'Agent Smith',
              assignedToRole: 'Account Executive',
              assignmentReason: 'Geographic expertise',
              priority: 'high'
            })
          }),
          expect.any(Object)
        );

        // Verify request update
        expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
          expect.stringContaining('mutation UpdateRequest'),
          expect.objectContaining({
            input: expect.objectContaining({
              id: 'req_123',
              assignedTo: 'Agent Smith',
              assignedDate: expect.any(String),
              status: 'assigned'
            })
          }),
          expect.any(Object)
        );
      });

      it('should use default values for optional parameters', async () => {
        const result = await repository.assignRequest(
          'req_123',
          'agent_456',
          'Agent Smith',
          'Agent'
        );

        expect(result.success).toBe(true);
        expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
          expect.stringContaining('mutation CreateRequestAssignment'),
          expect.objectContaining({
            input: expect.objectContaining({
              assignmentType: 'primary',
              assignedById: 'system',
              assignedByName: 'System',
              status: 'active',
              priority: 'normal'
            })
          }),
          expect.any(Object)
        );
      });

      it('should handle assignment errors', async () => {
        mockGraphQLClient.mutate.mockResolvedValueOnce(
          createMockRepositoryError(new Error('Agent not found'))
        );

        const result = await repository.assignRequest(
          'req_123',
          'nonexistent_agent',
          'Agent Name',
          'Agent'
        );

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Agent not found');
      });

      it('should handle request update failure after assignment', async () => {
        mockGraphQLClient.mutate
          .mockResolvedValueOnce(createMockRepositorySuccess({ createRequestAssignments: {} }))
          .mockResolvedValueOnce(createMockRepositoryError(new Error('Update failed')));

        const result = await repository.assignRequest(
          'req_123',
          'agent_456',
          'Agent Smith',
          'Agent'
        );

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Update failed');
      });
    });

    describe('bulkAssign()', () => {
      it('should assign multiple requests to agent', async () => {
        // Mock successful operations
        mockGraphQLClient.mutate.mockResolvedValue(
          createMockRepositorySuccess({
            createRequestAssignments: createMockRequestAssignment()
          })
        );

        const result = await repository.bulkAssign(
          ['req_1', 'req_2', 'req_3'],
          'agent_123',
          'Agent Smith',
          'Account Executive',
          {
            assignedById: 'admin_123',
            assignedByName: 'Admin User',
            reason: 'Bulk assignment for efficiency'
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.successful).toHaveLength(3);
        expect(result.data.failed).toHaveLength(0);
        expect(mockGraphQLClient.mutate).toHaveBeenCalledTimes(6); // 3 assignments + 3 updates
      });

      it('should handle partial failures in bulk assignment', async () => {
        mockGraphQLClient.mutate
          .mockResolvedValueOnce(createMockRepositorySuccess({})) // req_1 assignment success
          .mockResolvedValueOnce(createMockRepositorySuccess({})) // req_1 update success
          .mockResolvedValueOnce(createMockRepositoryError(new Error('Failed'))) // req_2 assignment fail
          .mockResolvedValueOnce(createMockRepositorySuccess({})) // req_3 assignment success
          .mockResolvedValueOnce(createMockRepositorySuccess({})); // req_3 update success

        const result = await repository.bulkAssign(
          ['req_1', 'req_2', 'req_3'],
          'agent_123',
          'Agent Smith',
          'Account Executive'
        );

        expect(result.success).toBe(true);
        expect(result.data.successful).toHaveLength(2); // req_1 and req_3
        expect(result.data.failed).toHaveLength(1); // req_2
        expect(result.data.failed[0].id).toBe('req_2');
      });

      it('should handle empty request list', async () => {
        const result = await repository.bulkAssign(
          [],
          'agent_123',
          'Agent Smith',
          'Account Executive'
        );

        expect(result.success).toBe(true);
        expect(result.data.successful).toHaveLength(0);
        expect(result.data.failed).toHaveLength(0);
        expect(mockGraphQLClient.mutate).not.toHaveBeenCalled();
      });

      it('should include execution metadata', async () => {
        mockGraphQLClient.mutate.mockResolvedValue(createMockRepositorySuccess({}));

        const result = await repository.bulkAssign(
          ['req_1'],
          'agent_123',
          'Agent Smith',
          'Agent'
        );

        expect(result.success).toBe(true);
        expect(result.meta?.totalCount).toBe(1);
        expect(result.meta?.executionTime).toBeDefined();
      });
    });
  });

  describe('Note Management - Complete Coverage', () => {
    describe('addNote()', () => {
      beforeEach(() => {
        // Mock note creation
        mockGraphQLClient.mutate.mockResolvedValueOnce(
          createMockRepositorySuccess({
            createRequestNotes: createMockRequestNote({
              requestId: 'req_123',
              content: 'Test note content'
            })
          })
        );

        // Mock request update for lastContactDate
        mockGraphQLClient.mutate.mockResolvedValueOnce(
          createMockRepositorySuccess({})
        );
      });

      it('should add note to request successfully', async () => {
        const result = await repository.addNote(
          'req_123',
          'Client called to discuss timeline',
          {
            type: 'client_communication',
            category: 'follow_up',
            isPrivate: false,
            authorId: 'agent_123',
            authorName: 'Agent Smith',
            authorRole: 'Account Executive',
            priority: 'important',
            tags: ['timeline', 'client_call'],
            communicationMethod: 'phone',
            followUpRequired: true,
            followUpDate: '2025-01-25T10:00:00Z'
          }
        );

        expect(result.success).toBe(true);
        expect(result.data?.content).toBe('Client called to discuss timeline');
        expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
          expect.stringContaining('mutation CreateRequestNote'),
          expect.objectContaining({
            input: expect.objectContaining({
              requestId: 'req_123',
              content: 'Client called to discuss timeline',
              type: 'client_communication',
              category: 'follow_up',
              isPrivate: false,
              authorId: 'agent_123',
              priority: 'important',
              tags: '["timeline","client_call"]',
              communicationMethod: 'phone',
              followUpRequired: true,
              followUpDate: '2025-01-25T10:00:00Z'
            })
          }),
          expect.any(Object)
        );
      });

      it('should use default values for optional parameters', async () => {
        const result = await repository.addNote(
          'req_123',
          'Simple note'
        );

        expect(result.success).toBe(true);
        expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
          expect.stringContaining('mutation CreateRequestNote'),
          expect.objectContaining({
            input: expect.objectContaining({
              type: 'internal',
              isPrivate: true,
              priority: 'normal',
              followUpRequired: false,
              tags: null
            })
          }),
          expect.any(Object)
        );
      });

      it('should update request lastContactDate', async () => {
        await repository.addNote('req_123', 'Test note');

        expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
          expect.stringContaining('mutation UpdateRequest'),
          expect.objectContaining({
            input: expect.objectContaining({
              id: 'req_123',
              lastContactDate: expect.any(String)
            })
          }),
          expect.any(Object)
        );
      });

      it('should handle note creation errors', async () => {
        mockGraphQLClient.mutate.mockResolvedValueOnce(
          createMockRepositoryError(new Error('Content too long'))
        );

        const result = await repository.addNote(
          'req_123',
          'A'.repeat(10000) // Very long content
        );

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Content too long');
      });

      it('should handle tags serialization', async () => {
        await repository.addNote(
          'req_123',
          'Tagged note',
          {
            tags: ['urgent', 'follow_up', 'client']
          }
        );

        expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
          expect.stringContaining('mutation CreateRequestNote'),
          expect.objectContaining({
            input: expect.objectContaining({
              tags: '["urgent","follow_up","client"]'
            })
          }),
          expect.any(Object)
        );
      });

      it('should handle empty tags array', async () => {
        await repository.addNote(
          'req_123',
          'Untagged note',
          { tags: [] }
        );

        expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
          expect.stringContaining('mutation CreateRequestNote'),
          expect.objectContaining({
            input: expect.objectContaining({
              tags: '[]'
            })
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Bulk Operations - Complete Coverage', () => {
    describe('bulkUpdateStatus()', () => {
      beforeEach(() => {
        // Mock get request for each status update
        mockGraphQLClient.query.mockResolvedValue(
          createMockRepositorySuccess({ 
            getRequests: createMockRequest({ status: 'new', assignedTo: 'agent_123' }) 
          })
        );

        // Mock status updates
        mockGraphQLClient.mutate.mockResolvedValue(
          createMockRepositorySuccess({})
        );
      });

      it('should update status for multiple requests', async () => {
        const result = await repository.bulkUpdateStatus(
          ['req_1', 'req_2', 'req_3'],
          'assigned',
          {
            userId: 'admin_123',
            userName: 'Admin User',
            reason: 'Bulk assignment complete'
          }
        );

        expect(result.success).toBe(true);
        expect(result.data.successful).toHaveLength(3);
        expect(result.data.failed).toHaveLength(0);
        // Each request: 1 get + 1 history + 1 update = 9 total calls
        expect(mockGraphQLClient.query).toHaveBeenCalledTimes(3);
        expect(mockGraphQLClient.mutate).toHaveBeenCalledTimes(6); // 3 histories + 3 updates
      });

      it('should handle partial failures in bulk status update', async () => {
        mockGraphQLClient.mutate
          .mockResolvedValueOnce(createMockRepositorySuccess({})) // req_1 history success
          .mockResolvedValueOnce(createMockRepositorySuccess({})) // req_1 update success
          .mockResolvedValueOnce(createMockRepositoryError(new Error('Failed'))) // req_2 history fail
          .mockResolvedValueOnce(createMockRepositorySuccess({})) // req_3 history success
          .mockResolvedValueOnce(createMockRepositorySuccess({})); // req_3 update success

        const result = await repository.bulkUpdateStatus(
          ['req_1', 'req_2', 'req_3'],
          'completed'
        );

        expect(result.success).toBe(true);
        expect(result.data.successful).toHaveLength(2); // req_1 and req_3
        expect(result.data.failed).toHaveLength(1); // req_2
        expect(result.data.failed[0].id).toBe('req_2');
      });

      it('should handle empty request list', async () => {
        const result = await repository.bulkUpdateStatus(
          [],
          'assigned'
        );

        expect(result.success).toBe(true);
        expect(result.data.successful).toHaveLength(0);
        expect(result.data.failed).toHaveLength(0);
        expect(mockGraphQLClient.query).not.toHaveBeenCalled();
        expect(mockGraphQLClient.mutate).not.toHaveBeenCalled();
      });

      it('should include execution metadata', async () => {
        const result = await repository.bulkUpdateStatus(
          ['req_1'],
          'completed'
        );

        expect(result.success).toBe(true);
        expect(result.meta?.totalCount).toBe(1);
        expect(result.meta?.executionTime).toBeDefined();
        expect(result.meta?.warnings).toContain('0 requests updated successfully');
      });
    });
  });

  describe('Edge Cases and Performance Tests', () => {
    it('should handle large result sets', async () => {
      const largeDataSet = createLargeDataSet(100);
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess({ 
          listRequests: { items: largeDataSet, nextToken: null } 
        })
      );

      const result = await repository.list({ limit: 100 });

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(100);
    });

    it('should handle concurrent operations gracefully', async () => {
      const mockRequest = createMockRequest();
      mockGraphQLClient.query.mockResolvedValue(
        createMockRepositorySuccess({ getRequests: mockRequest })
      );

      const promises = [
        repository.get('req_1'),
        repository.get('req_2'),
        repository.get('req_3')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle malformed GraphQL responses', async () => {
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess(null)
      );

      const result = await repository.get('req_123');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NotFoundError);
    });

    it('should handle empty result arrays', async () => {
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositorySuccess({ listRequests: { items: [] } })
      );

      const result = await repository.findByStatus('nonexistent_status');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Request timeout') as any;
      timeoutError.code = 'TIMEOUT_ERROR';
      
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositoryError(timeoutError)
      );

      const result = await repository.get('req_123');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Request timeout');
    });
  });

  describe('Factory Function', () => {
    it('should create repository with default client', () => {
      const { createRequestRepository } = require('../../../repositories/RequestRepository');
      const repo = createRequestRepository();
      
      expect(repo).toBeInstanceOf(RequestRepository);
    });

    it('should create repository with custom client', () => {
      const { createRequestRepository } = require('../../../repositories/RequestRepository');
      const customClient = new GraphQLClient({ defaultAuthMode: 'userPool' });
      const repo = createRequestRepository(customClient);
      
      expect(repo).toBeInstanceOf(RequestRepository);
    });
  });
});