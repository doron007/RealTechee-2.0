/**
 * Working Backend Unit Tests
 * 
 * Simplified but comprehensive tests that actually run successfully
 * and validate the most critical business logic paths.
 * 
 * Focus: Core functionality with working mocks and realistic scenarios.
 */

import { GraphQLClient } from '../../repositories/base/GraphQLClient';
import { RequestRepository } from '../../repositories/RequestRepository';
import { RequestService } from '../../services/domain/request/RequestService';
import { createMockServiceResult, createMockGraphQLResponse, createMockRequest, createMockEnhancedRequest, createMockLeadScore, createMockAgentAssignment } from '../testDataFactories';

// Mock the generateClient function
const mockGraphQL = jest.fn();
const mockGenerateClient = jest.requireMock('aws-amplify/api').generateClient;

describe('Backend Integration Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateClient.mockReturnValue({
      graphql: mockGraphQL
    });
  });

  describe('GraphQLClient Core Functionality', () => {
    let client: GraphQLClient;

    beforeEach(() => {
      client = new GraphQLClient({
        enableLogging: false,
        enableMetrics: true,
        maxRetries: 1,
        timeout: 1000
      });
    });

    it('should execute successful GraphQL operations', async () => {
      const mockData = { getTest: { id: 'test-id', name: 'Test Item' } };
      const mockResponse = createMockGraphQLResponse(mockData);
      
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      const result = await client.execute({
        query: 'query GetTest { getTest { id name } }',
        variables: { id: 'test-id' }
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(mockGraphQL).toHaveBeenCalledWith({
        query: 'query GetTest { getTest { id name } }',
        variables: { id: 'test-id' },
        authMode: undefined
      });
    });

    it('should handle GraphQL errors gracefully', async () => {
      const mockErrors = [{ message: 'Validation failed', extensions: { code: 'VALIDATION_ERROR' } }];
      const mockResponse = createMockGraphQLResponse(null, mockErrors);
      
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      const result = await client.execute({
        query: 'query GetTest { getTest { id } }',
        variables: { id: 'test-id' }
      });

      expect(result.success).toBe(true); // GraphQL errors are non-fatal
      expect(result.data).toBeNull();
      expect(result.meta?.warnings).toEqual(mockErrors);
    });

    it('should collect performance metrics', async () => {
      const mockResponse = createMockGraphQLResponse({ success: true });
      mockGraphQL.mockResolvedValueOnce(mockResponse);

      await client.execute(
        { query: 'query Test { test }' },
        { operation: 'test', model: 'Test' }
      );

      const metrics = client.getMetrics('test', 'Test');
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successRate).toBe(100);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('RequestRepository Business Logic', () => {
    let repository: RequestRepository;
    let mockClient: jest.Mocked<GraphQLClient>;

    beforeEach(() => {
      mockClient = {
        query: jest.fn(),
        mutate: jest.fn(),
        execute: jest.fn(),
        getMetrics: jest.fn(),
        clearMetrics: jest.fn()
      } as any;
      
      repository = new RequestRepository(mockClient);
    });

    it('should create requests with proper validation', async () => {
      const requestData = createMockRequest({ id: undefined as any, status: undefined });
      const expectedRequest = createMockRequest({ id: 'new-request-id', status: 'new' });

      mockClient.mutate.mockResolvedValueOnce(
        createMockServiceResult({ createRequests: expectedRequest })
      );

      const result = await repository.create({ data: requestData });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedRequest);
      expect(mockClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation CreateRequest'),
        expect.objectContaining({
          input: expect.objectContaining({
            status: 'new',
            priority: 'medium'
          })
        }),
        expect.any(Object)
      );
    });

    it('should validate status transitions correctly', async () => {
      const validTransition = await repository.validateStatusTransition('new', 'assigned');
      expect(validTransition.isValid).toBe(true);
      expect(validTransition.errors).toHaveLength(0);

      const invalidTransition = await repository.validateStatusTransition('completed', 'new');
      expect(invalidTransition.isValid).toBe(false);
      expect(invalidTransition.errors?.length).toBeGreaterThan(0);
    });

    it('should find requests by status', async () => {
      const mockRequests = [
        createMockRequest({ status: 'new' }),
        createMockRequest({ status: 'new' })
      ];

      mockClient.query.mockResolvedValueOnce(
        createMockServiceResult({
          listRequests: { items: mockRequests, nextToken: null }
        })
      );

      const result = await repository.findByStatus('new');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].status).toBe('new');
    });

    it('should handle bulk status updates', async () => {
      const requestIds = ['req-1', 'req-2'];
      const newStatus = 'in_progress';

      // Mock the updateStatus method to succeed
      const mockUpdateStatus = jest.spyOn(repository, 'updateStatus');
      mockUpdateStatus
        .mockResolvedValueOnce(createMockServiceResult(createMockRequest({ id: 'req-1', status: newStatus })))
        .mockResolvedValueOnce(createMockServiceResult(createMockRequest({ id: 'req-2', status: newStatus })));

      const result = await repository.bulkUpdateStatus(requestIds, newStatus);

      expect(result.success).toBe(true);
      expect(result.data?.successful).toHaveLength(2);
      expect(result.data?.failed).toHaveLength(0);
      expect(mockUpdateStatus).toHaveBeenCalledTimes(2);
    });
  });

  describe('RequestService Lead Scoring Algorithm', () => {
    let service: RequestService;
    let mockRepository: jest.Mocked<RequestRepository>;

    beforeEach(() => {
      mockRepository = {
        getWithRelations: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        assignRequest: jest.fn(),
        addNote: jest.fn(),
        updateStatus: jest.fn()
      } as any;

      service = new RequestService({
        requestRepository: mockRepository
      });
    });

    it('should calculate high-quality lead scores accurately', async () => {
      const highQualityRequest = createMockEnhancedRequest({
        homeownerContactId: 'homeowner-1',
        addressId: 'property-1',
        product: 'Kitchen Renovation',
        budget: '$75,000 - $100,000',
        message: 'Complete kitchen remodel needed urgently with high-end finishes. Have architect plans ready and permits approved.',
        leadSource: 'referral',
        uploadedMedia: 'kitchen-photos.jpg',
        requestedVisitDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days
      });

      mockRepository.getWithRelations.mockResolvedValue(createMockServiceResult(highQualityRequest));
      mockRepository.update.mockResolvedValue(createMockServiceResult(highQualityRequest));

      const result = await service.calculateLeadScore('high-quality-request');

      expect(result.success).toBe(true);
      expect(result.data?.overallScore).toBeGreaterThan(80);
      expect(result.data?.grade).toMatch(/^[AB]$/);
      expect(result.data?.priorityLevel).toMatch(/^(urgent|high)$/);
      expect(result.data?.conversionProbability).toBeGreaterThan(0.7);

      // Verify individual factors
      expect(result.data?.factors.dataCompleteness).toBeGreaterThan(70);
      expect(result.data?.factors.sourceQuality).toBe(90); // Referral is high quality
      expect(result.data?.factors.engagementLevel).toBeGreaterThan(70);
      expect(result.data?.factors.budgetAlignment).toBeGreaterThan(70);

      // Verify recommendations are provided
      expect(result.data?.recommendations).toBeDefined();
      expect(result.data?.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate low-quality lead scores accurately', async () => {
      const lowQualityRequest = createMockEnhancedRequest({
        homeownerContactId: undefined,
        addressId: undefined,
        product: undefined,
        budget: 'no budget',
        message: 'just looking',
        leadSource: 'unknown',
        uploadedMedia: undefined
      });

      mockRepository.getWithRelations.mockResolvedValue(createMockServiceResult(lowQualityRequest));
      mockRepository.update.mockResolvedValue(createMockServiceResult(lowQualityRequest));

      const result = await service.calculateLeadScore('low-quality-request');

      expect(result.success).toBe(true);
      expect(result.data?.overallScore).toBeLessThan(50);
      expect(result.data?.grade).toMatch(/^[DF]$/);
      expect(result.data?.priorityLevel).toBe('low');
      expect(result.data?.conversionProbability).toBeLessThan(0.5);

      // Verify low scores in key factors
      expect(result.data?.factors.dataCompleteness).toBeLessThan(50);
      expect(result.data?.factors.sourceQuality).toBe(30); // Unknown source
      expect(result.data?.factors.budgetAlignment).toBeLessThan(30);
    });

    it('should update request with calculated score and priority', async () => {
      const request = createMockEnhancedRequest();
      mockRepository.getWithRelations.mockResolvedValue(createMockServiceResult(request));
      mockRepository.update.mockResolvedValue(createMockServiceResult(request));

      const result = await service.calculateLeadScore('test-request');

      expect(result.success).toBe(true);
      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'test-request',
        data: expect.objectContaining({
          readinessScore: expect.any(Number),
          priority: expect.any(String)
        })
      });
    });
  });

  describe('RequestService Agent Assignment Logic', () => {
    let service: RequestService;
    let mockRepository: jest.Mocked<RequestRepository>;

    beforeEach(() => {
      mockRepository = {
        getWithRelations: jest.fn(),
        assignRequest: jest.fn(),
        update: jest.fn()
      } as any;

      service = new RequestService({
        requestRepository: mockRepository
      });

      // Mock scheduleFollowUp method
      jest.spyOn(service, 'scheduleFollowUp').mockResolvedValue(createMockServiceResult({} as any));
    });

    it('should assign agents with intelligent load balancing', async () => {
      const request = createMockEnhancedRequest({ priority: 'high' });
      mockRepository.getWithRelations.mockResolvedValue(createMockServiceResult(request));
      mockRepository.assignRequest.mockResolvedValue(createMockServiceResult({} as any));
      mockRepository.update.mockResolvedValue(createMockServiceResult({} as any));

      const result = await service.assignToAgent('test-request', {
        strategy: 'auto_balance',
        considerSpecialty: true,
        considerLocation: true
      });

      expect(result.success).toBe(true);
      expect(result.data?.assignmentReason).toBe('workload_balance');
      expect(result.data?.confidence).toBeGreaterThan(0.8);
      
      expect(mockRepository.assignRequest).toHaveBeenCalledWith(
        'test-request',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          assignmentType: 'primary',
          reason: expect.stringContaining('auto_balance')
        })
      );
    });

    it('should handle manual assignments', async () => {
      const request = createMockEnhancedRequest();
      mockRepository.getWithRelations.mockResolvedValue(createMockServiceResult(request));
      mockRepository.assignRequest.mockResolvedValue(createMockServiceResult({} as any));

      const result = await service.assignToAgent('test-request', {
        agentId: 'specific-agent-123',
        strategy: 'manual'
      });

      expect(result.success).toBe(true);
      expect(result.data?.assignmentReason).toBe('manual');
      expect(result.data?.confidence).toBe(1.0);
    });

    it('should schedule appropriate follow-up based on priority', async () => {
      const urgentRequest = createMockEnhancedRequest({ priority: 'urgent' });
      mockRepository.getWithRelations.mockResolvedValue(createMockServiceResult(urgentRequest));
      mockRepository.assignRequest.mockResolvedValue(createMockServiceResult({} as any));

      const result = await service.assignToAgent('urgent-request');

      expect(result.success).toBe(true);
      expect(service.scheduleFollowUp).toHaveBeenCalledWith(
        'urgent-request',
        expect.objectContaining({
          followUpType: 'initial_contact',
          priority: 'urgent',
          autoReschedule: true
        })
      );
    });
  });

  describe('RequestService Quote Generation', () => {
    let service: RequestService;
    let mockRepository: jest.Mocked<RequestRepository>;

    beforeEach(() => {
      mockRepository = {
        get: jest.fn(),
        updateStatus: jest.fn(),
        addNote: jest.fn()
      } as any;

      service = new RequestService({
        requestRepository: mockRepository
      });

      jest.spyOn(service, 'scheduleFollowUp').mockResolvedValue(createMockServiceResult({} as any));
    });

    it('should generate quotes with accurate pricing calculations', async () => {
      const completeRequest = createMockRequest({
        status: 'in_progress',
        product: 'Kitchen Renovation',
        budget: '$50,000',
        homeownerContactId: 'homeowner-1',
        addressId: 'property-1'
      });

      mockRepository.get.mockResolvedValue(createMockServiceResult(completeRequest));
      mockRepository.updateStatus.mockResolvedValue(createMockServiceResult(completeRequest));
      mockRepository.addNote.mockResolvedValue(createMockServiceResult({} as any));

      const quoteInput = {
        basePrice: 25000,
        adjustmentFactors: {
          complexity: 1.2, // 20% increase
          materials: 1.1,  // 10% increase  
          timeline: 0.95,  // 5% discount
          location: 1.0    // No adjustment
        },
        includeAlternatives: true,
        validityPeriod: 30
      };

      const result = await service.generateQuoteFromRequest('test-request', quoteInput);

      expect(result.success).toBe(true);
      expect(result.data?.basePrice).toBe(25000);
      
      // Expected calculation: 25000 * 1.2 * 1.1 * 0.95 * 1.0 = 31350
      expect(result.data?.totalPrice).toBe(31350);
      expect(result.data?.validityPeriod).toBe(30);

      // Should update status to quote_ready
      expect(mockRepository.updateStatus).toHaveBeenCalledWith(
        'test-request',
        'quote_ready',
        expect.objectContaining({
          reason: 'Quote generated'
        })
      );

      // Should add note about quote generation
      expect(mockRepository.addNote).toHaveBeenCalledWith(
        'test-request',
        expect.stringContaining('Quote generated'),
        expect.any(Object)
      );

      // Should schedule follow-up
      expect(service.scheduleFollowUp).toHaveBeenCalledWith(
        'test-request',
        expect.objectContaining({
          followUpType: 'quote_follow_up',
          priority: 'high'
        })
      );
    });

    it('should validate request status before quote generation', async () => {
      const completedRequest = createMockRequest({ status: 'completed' });
      mockRepository.get.mockResolvedValue(createMockServiceResult(completedRequest));

      const result = await service.generateQuoteFromRequest('completed-request', {
        basePrice: 25000,
        includeAlternatives: false,
        validityPeriod: 30
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot generate quote for request in status: completed');
    });
  });

  describe('RequestService Follow-up Scheduling', () => {
    let service: RequestService;
    let mockRepository: jest.Mocked<RequestRepository>;

    beforeEach(() => {
      mockRepository = {
        addNote: jest.fn(),
        update: jest.fn()
      } as any;

      service = new RequestService({
        requestRepository: mockRepository
      });

      mockRepository.addNote.mockResolvedValue(createMockServiceResult({} as any));
      mockRepository.update.mockResolvedValue(createMockServiceResult({} as any));
    });

    it('should calculate appropriate timing for different follow-up types and priorities', async () => {
      const testCases = [
        { type: 'initial_contact', priority: 'urgent', maxHours: 3 },
        { type: 'information_request', priority: 'medium', maxHours: 50 },
        { type: 'quote_follow_up', priority: 'high', maxHours: 75 },
        { type: 'check_in', priority: 'low', maxHours: 170 }
      ];

      for (const testCase of testCases) {
        const result = await service.scheduleFollowUp('test-request', {
          followUpType: testCase.type as any,
          priority: testCase.priority as any,
          reminderDays: [],
          autoReschedule: false
        });

        expect(result.success).toBe(true);
        
        const scheduledDate = new Date(result.data!.scheduledDate!);
        const now = new Date();
        const hoursDiff = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        expect(hoursDiff).toBeLessThanOrEqual(testCase.maxHours);
        expect(hoursDiff).toBeGreaterThan(0);
      }
    });

    it('should create notes and update request follow-up dates', async () => {
      const result = await service.scheduleFollowUp('test-request', {
        followUpType: 'initial_contact',
        priority: 'medium',
        reminderDays: [1, 3],
        autoReschedule: true
      });

      expect(result.success).toBe(true);
      
      // Should create note
      expect(mockRepository.addNote).toHaveBeenCalledWith(
        'test-request',
        expect.stringContaining('Follow-up scheduled'),
        expect.objectContaining({
          type: 'follow_up'
        })
      );

      // Should update request
      expect(mockRepository.update).toHaveBeenCalledWith({
        id: 'test-request',
        data: expect.objectContaining({
          followUpDate: expect.any(String)
        })
      });
    });
  });

  describe('End-to-End Business Workflow', () => {
    let service: RequestService;
    let mockRepository: jest.Mocked<RequestRepository>;

    beforeEach(() => {
      mockRepository = {
        create: jest.fn(),
        getWithRelations: jest.fn(),
        update: jest.fn(),
        assignRequest: jest.fn(),
        addNote: jest.fn()
      } as any;

      service = new RequestService({
        requestRepository: mockRepository
      });

      // Mock all service methods
      jest.spyOn(service, 'calculateLeadScore').mockResolvedValue(createMockServiceResult(createMockLeadScore({ overallScore: 85 })));
      jest.spyOn(service, 'assignToAgent').mockResolvedValue(createMockServiceResult(createMockAgentAssignment()));
      jest.spyOn(service, 'scheduleFollowUp').mockResolvedValue(createMockServiceResult({} as any));
    });

    it('should process complete new request workflow successfully', async () => {
      const requestData = createMockRequest({ id: undefined as any });
      const createdRequest = createMockRequest({ id: 'workflow-request' });
      const enhancedRequest = createMockEnhancedRequest({ id: 'workflow-request' });

      mockRepository.create.mockResolvedValue(createMockServiceResult(createdRequest));
      mockRepository.getWithRelations.mockResolvedValue(createMockServiceResult(enhancedRequest));
      mockRepository.update.mockResolvedValue(createMockServiceResult(createdRequest));

      const result = await service.processNewRequest(requestData, {
        autoAssign: true,
        autoScore: true,
        autoScheduleFollowUp: true,
        sendNotifications: false // Disable to avoid mock complexity
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(enhancedRequest);

      // Verify complete workflow execution
      expect(mockRepository.create).toHaveBeenCalledWith({ data: requestData });
      expect(service.calculateLeadScore).toHaveBeenCalledWith('workflow-request');
      expect(service.assignToAgent).toHaveBeenCalledWith('workflow-request', expect.any(Object));
      expect(service.scheduleFollowUp).toHaveBeenCalledWith('workflow-request', expect.any(Object));
    });

    it('should handle workflow failures gracefully', async () => {
      const requestData = createMockRequest({ id: undefined as any });
      
      mockRepository.create.mockResolvedValue(
        createMockServiceResult(null, false, new Error('Database connection failed'))
      );

      const result = await service.processNewRequest(requestData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Database connection failed');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle large datasets efficiently', async () => {
      const client = new GraphQLClient({ enableMetrics: true });
      
      // Simulate large response
      const largeResponse = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: `item_${i}`,
          name: `Item ${i}`,
          data: 'x'.repeat(100) // 100 chars per item
        }))
      };

      mockGraphQL.mockResolvedValue(createMockGraphQLResponse(largeResponse));

      const startTime = Date.now();
      const result = await client.execute({ query: 'query GetLargeDataset { items { id name data } }' });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.data).toEqual(largeResponse);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain consistent performance under load', async () => {
      const client = new GraphQLClient({ enableMetrics: true });
      const mockResponse = createMockGraphQLResponse({ success: true });
      
      mockGraphQL.mockResolvedValue(mockResponse);

      // Simulate 50 concurrent operations
      const promises = Array.from({ length: 50 }, () => 
        client.execute({ query: 'query Test { test }' })
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      const metrics = client.getMetrics();
      expect(metrics.totalRequests).toBe(50);
      expect(metrics.successRate).toBe(100);
    });
  });
});