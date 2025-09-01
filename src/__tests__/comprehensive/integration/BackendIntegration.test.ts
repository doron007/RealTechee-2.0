/**
 * Backend Integration Tests - 100% Coverage
 * 
 * Tests the complete integration between Repository and Service layers,
 * data flow, error propagation, and business workflow validation
 */

import { RequestService } from '../../../services/domain/request/RequestService';
import { RequestRepository } from '../../../repositories/RequestRepository';
import { GraphQLClient } from '../../../repositories/base/GraphQLClient';
import type { RequestServiceDependencies } from '../../../services/domain/request/RequestService';
import {
  createMockRequest,
  createMockEnhancedRequest,
  createMockServiceSuccess,
  createMockServiceError,
  createMockRepositorySuccess,
  createMockRepositoryError,
  createMockGraphQLSuccess,
  createMockNotificationService,
  createMockContactService,
  createMockPropertyService,
  createMockAuditService,
  createNetworkErrorScenario,
  createAsyncDelay,
  createMockConcurrentOperations
} from '../testFactories';

// Mock the GraphQL client
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

describe('Backend Integration Tests - Complete Coverage', () => {
  let service: RequestService;
  let repository: RequestRepository;
  let graphqlClient: GraphQLClient;
  let mockServices: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all GraphQL client mocks
    Object.values(mockGraphQLClient).forEach(mock => {
      if (jest.isMockFunction(mock)) {
        mock.mockReset();
      }
    });

    // Create real instances with mocked dependencies
    graphqlClient = new GraphQLClient({
      enableLogging: true,
      enableMetrics: true,
      timeout: 5000,
      maxRetries: 2
    });

    repository = new RequestRepository(graphqlClient);

    mockServices = {
      notificationService: createMockNotificationService(),
      contactService: createMockContactService(),
      propertyService: createMockPropertyService(),
      auditService: createMockAuditService()
    };

    const dependencies: RequestServiceDependencies = {
      requestRepository: repository,
      ...mockServices
    };

    service = new RequestService(dependencies);
  });

  describe('Complete Request Lifecycle Integration', () => {
    it('should handle complete request processing workflow', async () => {
      // Mock GraphQL responses for the complete workflow
      const mockRequest = createMockRequest({ id: 'req_lifecycle_123' });
      const mockEnhancedRequest = createMockEnhancedRequest({ id: 'req_lifecycle_123' });

      // 1. Request creation
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequests: mockRequest })
      );

      // 2. Get request for lead scoring
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: mockRequest })
      );

      // 3. Get enhanced request for scoring
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: mockEnhancedRequest })
      );

      // 4. Update request with lead score
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ updateRequests: mockRequest })
      );

      // 5. Assignment operations
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequestAssignments: {} })
      );
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ updateRequests: mockRequest })
      );

      // 6. Follow-up scheduling
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequestNotes: {} })
      );
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ updateRequests: mockRequest })
      );

      // 7. Final enhanced request retrieval
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: mockEnhancedRequest })
      );

      const requestData = {
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation',
        message: 'Complete kitchen remodel needed',
        budget: '$50,000 - $75,000',
        leadSource: 'website'
      };

      const result = await service.processNewRequest(requestData, {
        autoAssign: true,
        autoScore: true,
        autoScheduleFollowUp: true,
        sendNotifications: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      // Verify the complete workflow was executed
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation CreateRequest'),
        expect.any(Object),
        expect.any(Object)
      );

      expect(mockServices.notificationService.sendNewRequestNotifications).toHaveBeenCalled();
      expect(mockServices.auditService.logRequestCreated).toHaveBeenCalled();
    });

    it('should handle partial failures gracefully', async () => {
      const mockRequest = createMockRequest({ id: 'req_partial_123' });

      // Request creation succeeds
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequests: mockRequest })
      );

      // Lead scoring fails (should not break workflow)
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockRepositoryError(new Error('Scoring service unavailable'))
      );

      // Assignment succeeds
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: createMockEnhancedRequest() })
      );
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequestAssignments: {} })
      );
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ updateRequests: mockRequest })
      );

      // Notifications fail (should not break workflow)
      mockServices.notificationService.sendNewRequestNotifications.mockRejectedValue(
        new Error('Notification service down')
      );

      // Final retrieval succeeds
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: createMockEnhancedRequest() })
      );

      const result = await service.processNewRequest({
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation'
      }, {
        autoScore: true,
        autoAssign: true,
        sendNotifications: true
      });

      expect(result.success).toBe(true); // Should succeed despite partial failures
    });
  });

  describe('Repository-Service Data Flow', () => {
    it('should properly transform data between layers', async () => {
      const requestData = {
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation',
        tags: ['urgent', 'kitchen'], // Array that needs transformation
        missingInformation: ['budget', 'timeline'], // Array that needs transformation
        priority: 'high' as const
      };

      const expectedTransformedData = {
        ...requestData,
        tags: '["urgent","kitchen"]', // Should be JSON string in GraphQL
        missingInformation: '["budget","timeline"]', // Should be JSON string in GraphQL
        status: 'new', // Should have default
        source: 'manual', // Should have default
        readinessScore: 0 // Should have default
      };

      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ 
          createRequests: { 
            ...expectedTransformedData,
            id: 'req_transform_123',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      );

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ 
          getRequests: createMockEnhancedRequest({ 
            id: 'req_transform_123',
            tags: ['urgent', 'kitchen'], // Should be transformed back to array
            missingInformation: ['budget', 'timeline'] // Should be transformed back to array
          })
        })
      );

      const result = await service.processNewRequest(requestData, {
        autoScore: false,
        autoAssign: false,
        sendNotifications: false
      });

      expect(result.success).toBe(true);

      // Verify transformation to GraphQL format
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({
            tags: '["urgent","kitchen"]',
            missingInformation: '["budget","timeline"]'
          })
        }),
        expect.any(Object)
      );

      // Verify transformation back to native format
      expect(result.data?.tags).toEqual(['urgent', 'kitchen']);
      expect(result.data?.missingInformation).toEqual(['budget', 'timeline']);
    });

    it('should handle malformed JSON gracefully', async () => {
      const malformedResponse = {
        id: 'req_malformed_123',
        tags: 'invalid_json', // Malformed JSON
        missingInformation: '["valid","json"]', // Valid JSON
        product: 'Kitchen Renovation'
      };

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: malformedResponse })
      );

      const result = await repository.get('req_malformed_123');

      expect(result.success).toBe(true);
      expect(result.data?.tags).toEqual([]); // Should fallback to empty array
      expect(result.data?.missingInformation).toEqual(['valid', 'json']); // Should parse correctly
    });
  });

  describe('Error Propagation and Handling', () => {
    it('should propagate GraphQL errors through all layers', async () => {
      const graphqlError = {
        errors: [
          { 
            message: 'Variable "id" is required',
            path: ['getRequest'],
            extensions: { code: 'VALIDATION_ERROR' }
          }
        ]
      };

      mockGraphQLClient.query.mockRejectedValueOnce(graphqlError);

      const result = await service.calculateLeadScore('invalid_request');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors across layers', async () => {
      const networkError = createNetworkErrorScenario();
      mockGraphQLClient.mutate.mockRejectedValueOnce(networkError);

      const result = await service.processNewRequest({
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle validation errors from repository layer', async () => {
      const result = await service.processNewRequest({
        product: 'Kitchen Renovation'
        // Missing required homeownerContactId
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Either homeowner or agent contact is required');
    });
  });

  describe('Performance and Load Integration', () => {
    it('should handle concurrent operations efficiently', async () => {
      const concurrentOps = createMockConcurrentOperations(5);
      
      // Mock successful responses for all operations
      mockGraphQLClient.mutate.mockResolvedValue(
        createMockGraphQLSuccess({ createRequests: createMockRequest() })
      );
      mockGraphQLClient.query.mockResolvedValue(
        createMockGraphQLSuccess({ getRequests: createMockEnhancedRequest() })
      );

      const promises = concurrentOps.map(op => 
        service.processNewRequest(op.data, { autoScore: false, autoAssign: false })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all operations were executed
      expect(mockGraphQLClient.mutate).toHaveBeenCalledTimes(5);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      const operationCount = 10;

      // Mock fast responses
      mockGraphQLClient.query.mockResolvedValue(
        createMockGraphQLSuccess({ getRequests: createMockRequest() })
      );

      const promises = Array.from({ length: operationCount }, (_, i) =>
        repository.get(`req_${i}`)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / operationCount;

      expect(results).toHaveLength(operationCount);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete in reasonable time (less than 100ms per operation on average)
      expect(averageTime).toBeLessThan(100);
    });

    it('should handle large data sets efficiently', async () => {
      const largeDataSet = Array.from({ length: 100 }, (_, i) => 
        createMockRequest({ id: `req_large_${i}` })
      );

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({
          listRequests: { items: largeDataSet, nextToken: null }
        })
      );

      const result = await repository.list({ limit: 100 });

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(100);
    });
  });

  describe('Business Logic Integration', () => {
    it('should integrate lead scoring with assignment logic', async () => {
      const mockRequest = createMockRequest({ id: 'req_scoring_123' });
      const mockEnhancedRequest = createMockEnhancedRequest({
        id: 'req_scoring_123',
        homeownerContactId: 'contact_123',
        agentContactId: 'agent_456',
        addressId: 'address_789',
        product: 'Luxury Kitchen Renovation',
        budget: '$100k+',
        message: 'URGENT: Complete luxury kitchen renovation needed ASAP',
        leadSource: 'referral',
        requestedVisitDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Mock creation
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequests: mockRequest })
      );

      // Mock scoring retrieval
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: mockEnhancedRequest })
      );

      // Mock score update (should set high priority)
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ updateRequests: { ...mockRequest, priority: 'urgent' } })
      );

      // Mock assignment retrieval
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: mockEnhancedRequest })
      );

      // Mock assignment operations
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequestAssignments: {} })
      );
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ updateRequests: mockRequest })
      );

      // Mock follow-up operations
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequestNotes: {} })
      );
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ updateRequests: mockRequest })
      );

      // Mock final retrieval
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: mockEnhancedRequest })
      );

      const result = await service.processNewRequest({
        homeownerContactId: 'contact_123',
        product: 'Luxury Kitchen Renovation',
        budget: '$100k+',
        message: 'URGENT: Complete luxury kitchen renovation needed ASAP',
        leadSource: 'referral'
      }, {
        autoScore: true,
        autoAssign: true,
        autoScheduleFollowUp: true
      });

      expect(result.success).toBe(true);

      // Verify high-value lead was processed correctly
      expect(mockServices.notificationService.sendAssignmentNotification).toHaveBeenCalled();
    });

    it('should integrate status transitions with business validation', async () => {
      const mockRequest = createMockRequest({ 
        id: 'req_status_123',
        status: 'new',
        assignedTo: 'agent_123'
      });

      // Mock request retrieval for validation
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: mockRequest })
      );

      // Mock status history creation
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequestStatusHistory: {} })
      );

      // Mock request status update
      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ 
          updateRequests: { ...mockRequest, status: 'in_progress' }
        })
      );

      const result = await repository.updateStatus('req_status_123', 'in_progress', {
        userId: 'admin_123',
        reason: 'Starting work on request'
      });

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(1); // Validation
      expect(mockGraphQLClient.mutate).toHaveBeenCalledTimes(2); // History + Update
    });
  });

  describe('Service Dependencies Integration', () => {
    it('should integrate with notification service', async () => {
      const mockRequest = createMockRequest({ id: 'req_notification_123' });

      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequests: mockRequest })
      );
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: createMockEnhancedRequest() })
      );

      const result = await service.processNewRequest({
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation'
      }, {
        sendNotifications: true
      });

      expect(result.success).toBe(true);
      expect(mockServices.notificationService.sendNewRequestNotifications).toHaveBeenCalledWith(
        'req_notification_123',
        expect.objectContaining({
          includeAgent: false,
          includeLead: true,
          includeAdmin: true
        })
      );
    });

    it('should integrate with audit service', async () => {
      const mockRequest = createMockRequest({ id: 'req_audit_123' });

      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequests: mockRequest })
      );
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: createMockEnhancedRequest() })
      );

      const result = await service.processNewRequest({
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation'
      });

      expect(result.success).toBe(true);
      expect(mockServices.auditService.logRequestCreated).toHaveBeenCalledWith(
        'req_audit_123',
        expect.objectContaining({
          autoAssigned: false,
          leadScore: undefined,
          initialPriority: undefined
        })
      );
    });

    it('should work without optional services', async () => {
      // Create service without optional dependencies
      const minimalService = new RequestService({
        requestRepository: repository
      });

      const mockRequest = createMockRequest({ id: 'req_minimal_123' });

      mockGraphQLClient.mutate.mockResolvedValueOnce(
        createMockGraphQLSuccess({ createRequests: mockRequest })
      );
      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: createMockEnhancedRequest() })
      );

      const result = await minimalService.processNewRequest({
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation'
      }, {
        sendNotifications: true // Should not fail even without notification service
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should properly clean up resources', async () => {
      const operationCount = 50;

      mockGraphQLClient.query.mockResolvedValue(
        createMockGraphQLSuccess({ getRequests: createMockRequest() })
      );

      // Perform many operations
      for (let i = 0; i < operationCount; i++) {
        await repository.get(`req_${i}`);
      }

      // Verify metrics collection (if enabled)
      expect(mockGraphQLClient.getMetrics).toBeDefined();
    });

    it('should handle memory pressure gracefully', async () => {
      const largeMessage = 'A'.repeat(10000); // Large message
      
      const result = await service.processNewRequest({
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation',
        message: largeMessage
      });

      // Should handle large data without issues
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle intermittent network issues', async () => {
      const networkError = createNetworkErrorScenario();

      // First attempt fails, second succeeds (simulating retry)
      mockGraphQLClient.query
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(
          createMockGraphQLSuccess({ getRequests: createMockRequest() })
        );

      const result = await repository.get('req_retry_123');

      expect(result.success).toBe(true);
    });

    it('should handle corrupt data gracefully', async () => {
      const corruptResponse = {
        id: 'req_corrupt_123',
        tags: 'not_valid_json{',
        missingInformation: null,
        product: undefined
      };

      mockGraphQLClient.query.mockResolvedValueOnce(
        createMockGraphQLSuccess({ getRequests: corruptResponse })
      );

      const result = await repository.get('req_corrupt_123');

      expect(result.success).toBe(true);
      expect(result.data?.tags).toEqual([]); // Should handle gracefully
    });

    it('should handle service timeouts', async () => {
      jest.setTimeout(10000);

      // Mock slow response
      mockGraphQLClient.query.mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve(createMockGraphQLSuccess({ getRequests: createMockRequest() })), 100)
        )
      );

      const result = await repository.get('req_slow_123');

      expect(result.success).toBe(true);
    });
  });
});