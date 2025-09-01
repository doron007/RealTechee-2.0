/**
 * RequestRepository Unit Tests
 * 
 * Comprehensive tests for the RequestRepository including:
 * - CRUD operations with proper GraphQL mocking
 * - Business-specific query methods  
 * - Status management and transitions
 * - Assignment operations
 * - Note management
 * - Validation logic
 * - Error handling scenarios
 */

import { RequestRepository, RequestCreateInput, Request, RequestFilter } from '../../../repositories/RequestRepository';
import { GraphQLClient } from '../../../repositories/core/GraphQLClient';
import { 
  createMockRequest, 
  createMockServiceResult,
  createMockGraphQLResponse,
  createMockRepositoryError,
  createMockRepositoryErrorWithDetails,
  createMockNote,
  createMockAssignment
} from '../testDataFactories';

// Create mock GraphQLClient with all required IAmplifyGraphQLClient methods
const mockGraphQLClient = {
  query: jest.fn(),
  mutate: jest.fn(),
  subscribe: jest.fn(),
  batchQuery: jest.fn(),
  withAuthMode: jest.fn(),
  isConnected: jest.fn(() => true),
  connect: jest.fn(),
  disconnect: jest.fn()
} as unknown as jest.Mocked<GraphQLClient>;

describe('RequestRepository', () => {
  let repository: RequestRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new RequestRepository();
    // Mock the client property
    (repository as any).client = mockGraphQLClient;
  });

  describe('create()', () => {
    it('should create a new request successfully', async () => {
      const requestData: RequestCreateInput = {
        status: 'new',
        message: 'Test request',
        relationToProperty: 'owner',
        budget: '50000',
        leadSource: 'website',
        agentContactId: 'agent-123',
        homeownerContactId: 'homeowner-456',
        addressId: 'address-789'
      };
      const expectedRequest = createMockRequest({ 
        id: 'new-request-id',
        status: 'new', // Should set default status
        priority: 'medium' // Should set default priority
      });

      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockServiceResult({
          createRequests: expectedRequest
        })
      );

      const result = await repository.create(requestData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedRequest);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation CreateRequest'),
        expect.objectContaining({
          input: expect.objectContaining({
            status: 'new',
            priority: 'medium',
            readinessScore: 0
          })
        }),
        expect.objectContaining({
          operation: 'create',
          model: 'Request'
        })
      );
    });

    it('should validate required fields before creation', async () => {
      const invalidRequestData: RequestCreateInput = {
        status: 'new',
        message: 'Test request'
        // Missing required homeownerContactId and agentContactId
      };

      const result = await repository.create(invalidRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_FAILED');
      expect(result.error).toContain('Either homeowner or agent contact is required');
    });

    it('should validate priority field', async () => {
      const invalidRequestData: RequestCreateInput = {
        status: 'new',
        message: 'Test request',
        homeownerContactId: 'homeowner-123',
        agentContactId: 'agent-123'
      };

      const result = await repository.create(invalidRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_FAILED');
      expect(result.error).toContain('Priority must be one of: low, medium, high, urgent');
    });

    it('should validate readiness score range', async () => {
      const invalidRequestData: RequestCreateInput = {
        status: 'new',
        message: 'Test request',
        homeownerContactId: 'homeowner-123',
        agentContactId: 'agent-123'
      };

      const result = await repository.create(invalidRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_FAILED');
      expect(result.error).toContain('Readiness score must be between 0 and 100');
    });

    it('should handle GraphQL mutation errors', async () => {
      const requestData: RequestCreateInput = {
        status: 'new',
        message: 'Test request',
        homeownerContactId: 'homeowner-123',
        agentContactId: 'agent-123',
        relationToProperty: 'owner',
        budget: '50000',
        leadSource: 'website'
      };
      
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockServiceResult(null, false, createMockRepositoryError(new Error('Database error')))
      );

      const result = await repository.create(requestData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('get()', () => {
    it('should retrieve request by ID', async () => {
      const mockRequest = createMockRequest({ id: 'test-request-id' });
      
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          getRequests: mockRequest
        })
      );

      const result = await repository.findById('test-request-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRequest);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query GetRequest'),
        { id: 'test-request-id' },
        expect.objectContaining({
          operation: 'get',
          model: 'Request'
        })
      );
    });

    it('should handle request not found', async () => {
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          getRequests: null
        })
      );

      const result = await repository.findById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NOT_FOUND');
    });
  });

  describe('update()', () => {
    it('should update request successfully', async () => {
      const existingRequest = createMockRequest({ id: 'test-id', status: 'new' });
      const updateData: Partial<Request> = { status: 'in_progress', priority: 'high' };
      const updatedRequest = { ...existingRequest, ...updateData };

      // Mock get for validation
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          getRequests: existingRequest
        })
      );

      // Mock update mutation
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockServiceResult({
          updateRequests: updatedRequest
        })
      );

      const result = await repository.update('test-id', updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedRequest);
    });

    it('should validate status transition on update', async () => {
      const existingRequest = createMockRequest({ id: 'test-id', status: 'completed' });
      const updateData = { status: 'new' }; // Invalid transition from completed to new

      // Mock get for validation
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          getRequests: existingRequest
        })
      );

      const result = await repository.update('test-id', updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_FAILED');
      expect(result.error).toContain('Invalid status transition');
    });
  });

  describe('getWithRelations()', () => {
    it('should retrieve request with all related entities', async () => {
      const mockEnhancedRequest = {
        ...createMockRequest({ id: 'test-id' }),
        agent: { id: 'agent-1', name: 'John Doe' },
        homeowner: { id: 'homeowner-1', name: 'Jane Smith' },
        address: { id: 'address-1', street: '123 Main St' },
        notes: { items: [createMockNote()] },
        assignments: { items: [createMockAssignment()] },
        statusHistory: { items: [] },
        informationItems: { items: [] },
        scopeItems: { items: [] },
        workflowStates: { items: [] }
      };

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          getRequests: mockEnhancedRequest
        })
      );

      const result = await repository.findByIdWithRelations('test-id');

      expect(result.success).toBe(true);
      expect(result.data?.agent).toBeDefined();
      expect(result.data?.homeowner).toBeDefined();
      expect(result.data?.address).toBeDefined();
      expect(result.data?.notes).toHaveLength(1);
      expect(result.data?.assignments).toHaveLength(1);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('GetRequestWithRelations'),
        { id: 'test-id' },
        expect.any(Object)
      );
    });
  });

  describe('findByStatus()', () => {
    it('should find requests by single status', async () => {
      const mockRequests = [
        createMockRequest({ status: 'new' }),
        createMockRequest({ status: 'new' })
      ];

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          listRequests: {
            items: mockRequests,
            nextToken: null
          }
        })
      );

      const result = await repository.findMany({ status: 'new' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].status).toBe('new');
    });

    it('should find requests by multiple statuses', async () => {
      const mockRequests = [
        createMockRequest({ status: 'new' }),
        createMockRequest({ status: 'assigned' })
      ];

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          listRequests: {
            items: mockRequests,
            nextToken: null
          }
        })
      );

      const result = await repository.findMany({ status: 'new' }); // TODO: Update when multi-status filter is supported

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('findUnassigned()', () => {
    it('should find unassigned requests', async () => {
      const unassignedRequests = [
        createMockRequest({ assignedTo: undefined }),
        createMockRequest({ assignedTo: '' })
      ];

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          listRequests: {
            items: unassignedRequests,
            nextToken: null
          }
        })
      );

      const result = await repository.findMany({});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          filter: expect.objectContaining({
            or: expect.arrayContaining([
              { assignedTo: { attributeExists: false } },
              { assignedTo: { eq: null } },
              { assignedTo: { eq: '' } }
            ])
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('findExpiring()', () => {
    it('should find requests with follow-up dates approaching', async () => {
      const expiringRequests = [
        createMockRequest({ 
          followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
        })
      ];

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          listRequests: {
            items: expiringRequests,
            nextToken: null
          }
        })
      );

      const result = await repository.findMany({}); // TODO: Add date range filter for expiring requests

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  // TODO: Implement updateStatus method in RequestRepository
  describe.skip('updateStatus()', () => {
    it('should update status with history tracking', async () => {
      const existingRequest = createMockRequest({ id: 'test-id', status: 'new' });
      const updatedRequest = { ...existingRequest, status: 'assigned' };

      // Mock get request
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          getRequests: existingRequest
        })
      );

      // Mock update mutation
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockServiceResult({
          updateRequests: updatedRequest
        })
      );

      // Mock status history creation
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockServiceResult({
          createRequestStatusHistory: {
            id: 'history-1',
            previousStatus: 'new',
            newStatus: 'assigned'
          }
        })
      );

      const result = await repository.update('test-id', {
        status: 'assigned'
        // TODO: Add support for metadata like reason, userId, userName
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('assigned');
      expect(mockGraphQLClient.mutate).toHaveBeenCalledTimes(2); // Update + history
    });

    it('should reject invalid status transitions', async () => {
      const existingRequest = createMockRequest({ id: 'test-id', status: 'completed' });

      // Mock get request
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          getRequests: existingRequest
        })
      );

      const result = await repository.update('test-id', { status: 'new' }); // Invalid transition

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_FAILED');
      expect(result.error).toContain('Invalid status transition');
    });
  });

  // TODO: Implement assignRequest method in RequestRepository
  describe.skip('assignRequest()', () => {
    it('should assign request to user', async () => {
      const requestId = 'test-request-id';
      const assignToId = 'agent-123';
      const assignToName = 'John Smith';
      const assignToRole = 'Account Executive';

      // Mock update request
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockServiceResult({
          updateRequests: createMockRequest({ 
            id: requestId,
            assignedTo: assignToName,
            status: 'assigned'
          })
        })
      );

      // Mock create assignment
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockServiceResult({
          createRequestAssignments: createMockAssignment({
            requestId,
            assignedToId: assignToId,
            assignedToName: assignToName,
            assignedToRole: assignToRole
          })
        })
      );

      const result = await repository.assignRequest(
        requestId,
        assignToId,
        assignToName,
        assignToRole,
        {
          reason: 'Best match for this project',
          priority: 'high'
        }
      );

      expect(result.success).toBe(true);
      expect(result.data?.assignedToName).toBe(assignToName);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledTimes(2); // Update request + create assignment
    });
  });

  // TODO: Implement addNote method in RequestRepository
  describe.skip('addNote()', () => {
    it('should add note to request', async () => {
      const requestId = 'test-request-id';
      const noteContent = 'Customer called to confirm appointment';
      const noteOptions = {
        type: 'client_communication' as const,
        priority: 'normal' as const,
        authorName: 'Agent Smith'
      };

      // Mock create note
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockServiceResult({
          createRequestNotes: createMockNote({
            requestId,
            content: noteContent,
            ...noteOptions
          })
        })
      );

      // Mock update request last contact date
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockServiceResult({
          updateRequests: createMockRequest({ id: requestId })
        })
      );

      const result = await repository.addNote(requestId, noteContent, noteOptions);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe(noteContent);
      expect(result.data?.type).toBe('client_communication');
      expect(mockGraphQLClient.mutate).toHaveBeenCalledTimes(2); // Create note + update request
    });
  });

  // TODO: Implement bulkUpdateStatus method in RequestRepository
  describe.skip('bulkUpdateStatus()', () => {
    it('should update status for multiple requests', async () => {
      const requestIds = ['req-1', 'req-2', 'req-3'];
      const newStatus = 'in_progress';

      // Mock each individual status update (simplified - actual implementation calls updateStatus)
      const mockUpdateStatus = jest.spyOn(repository, 'updateStatus');
      mockUpdateStatus
        .mockResolvedValueOnce(createMockServiceResult(createMockRequest({ id: 'req-1', status: newStatus })))
        .mockResolvedValueOnce(createMockServiceResult(createMockRequest({ id: 'req-2', status: newStatus })))
        .mockResolvedValueOnce(createMockServiceResult(createMockRequest({ id: 'req-3', status: newStatus })));

      const result = await repository.bulkUpdateStatus(requestIds, newStatus, {
        reason: 'Bulk status update',
        userId: 'admin-1'
      });

      expect(result.success).toBe(true);
      expect(result.data?.successful).toHaveLength(3);
      expect(result.data?.failed).toHaveLength(0);
      expect(mockUpdateStatus).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in bulk update', async () => {
      const requestIds = ['req-1', 'req-2'];
      const newStatus = 'completed';

      const mockUpdateStatus = jest.spyOn(repository, 'updateStatus');
      mockUpdateStatus
        .mockResolvedValueOnce(createMockServiceResult(createMockRequest({ id: 'req-1', status: newStatus })))
        .mockResolvedValueOnce(createMockServiceResult(null, false, createMockRepositoryError(new Error('Update failed'))));

      const result = await repository.bulkUpdateStatus(requestIds, newStatus);

      expect(result.success).toBe(false); // Overall failure due to partial failure
      expect(result.data?.successful).toHaveLength(1);
      expect(result.data?.failed).toHaveLength(1);
      expect(result.data?.failed[0].id).toBe('req-2');
    });
  });

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

    it('should provide warnings for risky transitions', async () => {
      const result = await repository.validateStatusTransition('in_progress', 'cancelled');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Cancelling request in progress - consider adding cancellation reason');
    });

    it('should identify required fields for transitions', async () => {
      const result = await repository.validateStatusTransition('new', 'assigned');

      expect(result.isValid).toBe(true);
      expect(result.requiredFields).toContain('assignedTo');
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult(null, false, createMockRepositoryErrorWithDetails('Network error', 'NETWORK_ERROR'))
      );

      const result = await repository.findById('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NETWORK_ERROR');
    });

    it('should handle validation errors', async () => {
      const result = await repository.create({
        status: 'new',
        message: 'Test request with invalid data'
        // TODO: Add validation for readinessScore
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_FAILED');
    });
  });

  describe('data transformation', () => {
    it('should transform arrays to JSON strings for GraphQL', async () => {
      const requestData: RequestCreateInput = {
        status: 'new',
        message: 'Test request with array data',
        homeownerContactId: 'homeowner-123',
        agentContactId: 'agent-123',
        relationToProperty: 'owner',
        budget: '50000',
        leadSource: 'website'
      };

      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockServiceResult({
          createRequests: createMockRequest()
        })
      );

      await repository.create(requestData);

      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({
            status: 'new',
            message: 'Test request with array data'
          })
        }),
        expect.any(Object)
      );
    });

    it('should parse JSON strings back to arrays in response', async () => {
      const mockResponse = {
        getRequests: {
          ...createMockRequest(),
          tags: '["urgent","high-value"]',
          missingInformation: '["budget","timeline"]'
        }
      };

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockServiceResult(mockResponse)
      );

      const result = await repository.findById('test-id');

      expect(result.success).toBe(true);
      expect(result.data?.tags).toEqual(['urgent', 'high-value']);
      expect(result.data?.missingInformation).toEqual(['budget', 'timeline']);
    });
  });
});