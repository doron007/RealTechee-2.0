/**
 * RequestService Unit Tests
 * 
 * Comprehensive tests for business logic including:
 * - Lead scoring algorithm with multiple scenarios
 * - Agent assignment logic with load balancing
 * - Quote generation with pricing calculations
 * - Status transition business rules
 * - Request merging logic
 * - Follow-up scheduling
 * - End-to-end workflows
 */

import { RequestService, LeadScoreResult, AgentAssignment } from '../../services/domain/request/RequestService';
import { RequestRepository } from '../../repositories/RequestRepository';
import { 
  createMockRequest, 
  createMockEnhancedRequest,
  createMockServiceResult,
  createMockLeadScore,
  createMockAgentAssignment
} from '../testDataFactories';

// Mock RequestRepository
const mockRequestRepository = {
  create: jest.fn(),
  get: jest.fn(),
  getWithRelations: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  assignRequest: jest.fn(),
  addNote: jest.fn(),
  validateStatusTransition: jest.fn(),
  find: jest.fn(),
  list: jest.fn(),
  delete: jest.fn(),
  findByStatus: jest.fn(),
  findUnassigned: jest.fn(),
  findExpiring: jest.fn(),
  bulkUpdateStatus: jest.fn()
} as jest.Mocked<RequestRepository>;

// Mock service dependencies
const mockNotificationService = {
  sendNewRequestNotifications: jest.fn(),
  sendAssignmentNotification: jest.fn(),
  scheduleReminder: jest.fn(),
  sendMergeNotification: jest.fn()
};

const mockContactService = {
  getAgent: jest.fn(),
  getAvailableAgents: jest.fn()
};

const mockAuditService = {
  logRequestCreated: jest.fn(),
  logStatusChange: jest.fn()
};

describe('RequestService', () => {
  let service: RequestService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RequestService({
      requestRepository: mockRequestRepository,
      notificationService: mockNotificationService,
      contactService: mockContactService,
      auditService: mockAuditService
    });
  });

  describe('processNewRequest()', () => {
    it('should process new request with full workflow', async () => {
      const requestData = createMockRequest({ id: undefined as any });
      const createdRequest = createMockRequest({ id: 'new-request-id' });
      const enhancedRequest = createMockEnhancedRequest({ id: 'new-request-id' });
      const leadScore = createMockLeadScore({ requestId: 'new-request-id', overallScore: 85 });
      const agentAssignment = createMockAgentAssignment();

      // Mock repository calls
      mockRequestRepository.create.mockResolvedValueOnce(createMockServiceResult(createdRequest));
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(createMockServiceResult(enhancedRequest));
      mockRequestRepository.update.mockResolvedValue(createMockServiceResult(createdRequest));

      // Mock service methods
      jest.spyOn(service, 'calculateLeadScore').mockResolvedValueOnce(createMockServiceResult(leadScore));
      jest.spyOn(service, 'assignToAgent').mockResolvedValueOnce(createMockServiceResult(agentAssignment));
      jest.spyOn(service, 'scheduleFollowUp').mockResolvedValueOnce(createMockServiceResult({} as any));

      const result = await service.processNewRequest(requestData, {
        autoAssign: true,
        autoScore: true,
        autoScheduleFollowUp: true,
        sendNotifications: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(enhancedRequest);

      // Verify all workflow steps executed
      expect(mockRequestRepository.create).toHaveBeenCalledWith({ data: requestData });
      expect(service.calculateLeadScore).toHaveBeenCalledWith('new-request-id');
      expect(service.assignToAgent).toHaveBeenCalledWith('new-request-id', expect.any(Object));
      expect(service.scheduleFollowUp).toHaveBeenCalledWith('new-request-id', expect.any(Object));
      expect(mockNotificationService.sendNewRequestNotifications).toHaveBeenCalled();
      expect(mockAuditService.logRequestCreated).toHaveBeenCalled();
    });

    it('should handle workflow failures gracefully', async () => {
      const requestData = createMockRequest({ id: undefined as any });

      mockRequestRepository.create.mockResolvedValueOnce(
        createMockServiceResult(null, false, new Error('Database error'))
      );

      const result = await service.processNewRequest(requestData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should work without optional services', async () => {
      // Create service without optional dependencies
      const simpleService = new RequestService({
        requestRepository: mockRequestRepository
      });

      const requestData = createMockRequest({ id: undefined as any });
      const createdRequest = createMockRequest({ id: 'new-request-id' });
      const enhancedRequest = createMockEnhancedRequest({ id: 'new-request-id' });

      mockRequestRepository.create.mockResolvedValueOnce(createMockServiceResult(createdRequest));
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(createMockServiceResult(enhancedRequest));

      const result = await simpleService.processNewRequest(requestData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(enhancedRequest);
    });
  });

  describe('calculateLeadScore()', () => {
    beforeEach(() => {
      const mockEnhancedRequest = createMockEnhancedRequest({
        homeownerContactId: 'homeowner-1',
        agentContactId: 'agent-1',
        addressId: 'property-1',
        product: 'Kitchen Renovation',
        budget: '$50,000 - $75,000',
        message: 'Looking for a complete kitchen remodel with modern appliances and granite countertops',
        leadSource: 'referral',
        relationToProperty: 'owner',
        uploadedMedia: 'kitchen-photos.jpg',
        requestedVisitDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      });

      mockRequestRepository.getWithRelations.mockResolvedValue(createMockServiceResult(mockEnhancedRequest));
      mockRequestRepository.update.mockResolvedValue(createMockServiceResult(mockEnhancedRequest));
    });

    it('should calculate high-quality lead score', async () => {
      const result = await service.calculateLeadScore('test-request-id');

      expect(result.success).toBe(true);
      expect(result.data?.overallScore).toBeGreaterThan(80);
      expect(result.data?.grade).toBe('A');
      expect(result.data?.priorityLevel).toBe('urgent');
      expect(result.data?.conversionProbability).toBeGreaterThan(0.7);

      // Verify factors are calculated
      expect(result.data?.factors.dataCompleteness).toBeGreaterThan(70);
      expect(result.data?.factors.sourceQuality).toBe(90); // Referral source
      expect(result.data?.factors.engagementLevel).toBeGreaterThan(70);
      expect(result.data?.factors.budgetAlignment).toBeGreaterThan(70);
    });

    it('should calculate low-quality lead score', async () => {
      const poorQualityRequest = createMockEnhancedRequest({
        homeownerContactId: undefined,
        addressId: undefined,
        product: undefined,
        budget: undefined,
        message: 'help',
        leadSource: 'unknown',
        uploadedMedia: undefined
      });

      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockServiceResult(poorQualityRequest)
      );

      const result = await service.calculateLeadScore('poor-quality-request');

      expect(result.success).toBe(true);
      expect(result.data?.overallScore).toBeLessThan(50);
      expect(result.data?.grade).toBe('F');
      expect(result.data?.priorityLevel).toBe('low');
      expect(result.data?.conversionProbability).toBeLessThan(0.5);

      // Verify low scores in key factors
      expect(result.data?.factors.dataCompleteness).toBeLessThan(50);
      expect(result.data?.factors.sourceQuality).toBe(30);
      expect(result.data?.factors.engagementLevel).toBeLessThan(60);
    });

    it('should provide appropriate recommendations', async () => {
      const result = await service.calculateLeadScore('test-request-id');

      expect(result.success).toBe(true);
      expect(result.data?.recommendations).toBeDefined();
      expect(result.data?.recommendations.length).toBeGreaterThan(0);
      expect(result.data?.recommendations[0]).toContain('High-priority lead');
    });

    it('should handle missing request', async () => {
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockServiceResult(null, false, new Error('Request not found'))
      );

      const result = await service.calculateLeadScore('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Request not found');
    });

    it('should update request with calculated score', async () => {
      const result = await service.calculateLeadScore('test-request-id');

      expect(result.success).toBe(true);
      expect(mockRequestRepository.update).toHaveBeenCalledWith({
        id: 'test-request-id',
        data: expect.objectContaining({
          readinessScore: expect.any(Number),
          priority: expect.any(String)
        })
      });
    });
  });

  describe('assignToAgent()', () => {
    beforeEach(() => {
      const mockEnhancedRequest = createMockEnhancedRequest({
        priority: 'high',
        product: 'Kitchen Renovation'
      });

      mockRequestRepository.getWithRelations.mockResolvedValue(createMockServiceResult(mockEnhancedRequest));
      mockRequestRepository.assignRequest.mockResolvedValue(createMockServiceResult({} as any));
      mockRequestRepository.update.mockResolvedValue(createMockServiceResult({} as any));

      // Mock follow-up scheduling
      jest.spyOn(service, 'scheduleFollowUp').mockResolvedValue(createMockServiceResult({} as any));
    });

    it('should assign request with intelligent load balancing', async () => {
      const result = await service.assignToAgent('test-request-id', {
        strategy: 'auto_balance',
        considerSpecialty: true,
        considerLocation: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.assignmentReason).toBe('workload_balance');
      expect(result.data?.confidence).toBeGreaterThan(0.8);

      expect(mockRequestRepository.assignRequest).toHaveBeenCalledWith(
        'test-request-id',
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          assignmentType: 'primary',
          reason: expect.stringContaining('auto_balance')
        })
      );
    });

    it('should handle manual assignment', async () => {
      const result = await service.assignToAgent('test-request-id', {
        agentId: 'specific-agent-123',
        strategy: 'manual'
      });

      expect(result.success).toBe(true);
      expect(result.data?.assignmentReason).toBe('manual');
      expect(result.data?.confidence).toBe(1.0);
    });

    it('should boost priority for high-confidence matches', async () => {
      const result = await service.assignToAgent('test-request-id', {
        strategy: 'skill_match'
      });

      expect(result.success).toBe(true);
      
      // Should update priority for high confidence assignment
      if (result.data?.confidence && result.data.confidence > 0.8) {
        expect(mockRequestRepository.update).toHaveBeenCalledWith({
          id: 'test-request-id',
          data: expect.objectContaining({
            priority: 'high'
          })
        });
      }
    });

    it('should schedule follow-up based on priority', async () => {
      const result = await service.assignToAgent('test-request-id');

      expect(result.success).toBe(true);
      expect(service.scheduleFollowUp).toHaveBeenCalledWith(
        'test-request-id',
        expect.objectContaining({
          followUpType: 'initial_contact',
          priority: expect.any(String),
          assignedTo: expect.any(String),
          autoReschedule: true
        })
      );
    });

    it('should send assignment notifications', async () => {
      const result = await service.assignToAgent('test-request-id');

      expect(result.success).toBe(true);
      expect(mockNotificationService.sendAssignmentNotification).toHaveBeenCalled();
    });
  });

  describe('generateQuoteFromRequest()', () => {
    beforeEach(() => {
      const completeRequest = createMockRequest({
        status: 'in_progress',
        product: 'Kitchen Renovation',
        budget: '$50,000',
        homeownerContactId: 'homeowner-1',
        addressId: 'property-1'
      });

      mockRequestRepository.get.mockResolvedValue(createMockServiceResult(completeRequest));
      mockRequestRepository.updateStatus.mockResolvedValue(createMockServiceResult(completeRequest));
      mockRequestRepository.addNote.mockResolvedValue(createMockServiceResult({} as any));

      // Mock follow-up scheduling
      jest.spyOn(service, 'scheduleFollowUp').mockResolvedValue(createMockServiceResult({} as any));
    });

    it('should generate quote with proper pricing calculation', async () => {
      const quoteInput = {
        basePrice: 25000,
        adjustmentFactors: {
          complexity: 1.2, // 20% increase for complexity
          materials: 1.1,  // 10% increase for premium materials
          timeline: 0.95,  // 5% discount for flexible timeline
          location: 1.0    // No location adjustment
        },
        includeAlternatives: true,
        validityPeriod: 30,
        notes: 'Premium materials and custom cabinets included'
      };

      const result = await service.generateQuoteFromRequest('test-request-id', quoteInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.basePrice).toBe(25000);
      
      // Expected total: 25000 * 1.2 * 1.1 * 0.95 * 1.0 = 31350
      expect(result.data.totalPrice).toBe(31350);
      expect(result.data.validityPeriod).toBe(30);

      // Should update request status to quote_ready
      expect(mockRequestRepository.updateStatus).toHaveBeenCalledWith(
        'test-request-id',
        'quote_ready',
        expect.objectContaining({
          reason: 'Quote generated'
        })
      );

      // Should add note about quote generation
      expect(mockRequestRepository.addNote).toHaveBeenCalledWith(
        'test-request-id',
        expect.stringContaining('Quote generated'),
        expect.any(Object)
      );

      // Should schedule follow-up
      expect(service.scheduleFollowUp).toHaveBeenCalledWith(
        'test-request-id',
        expect.objectContaining({
          followUpType: 'quote_follow_up',
          priority: 'high'
        })
      );
    });

    it('should validate request status before quote generation', async () => {
      const invalidRequest = createMockRequest({
        status: 'completed' // Cannot generate quote for completed request
      });

      mockRequestRepository.get.mockResolvedValueOnce(createMockServiceResult(invalidRequest));

      const result = await service.generateQuoteFromRequest('test-request-id', {
        basePrice: 25000,
        includeAlternatives: false,
        validityPeriod: 30
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot generate quote for request in status: completed');
    });

    it('should validate required information', async () => {
      const incompleteRequest = createMockRequest({
        status: 'in_progress',
        product: undefined, // Missing required field
        homeownerContactId: undefined
      });

      mockRequestRepository.get.mockResolvedValueOnce(createMockServiceResult(incompleteRequest));

      const result = await service.generateQuoteFromRequest('test-request-id', {
        basePrice: 25000,
        includeAlternatives: false,
        validityPeriod: 30
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Missing required information');
    });
  });

  describe('scheduleFollowUp()', () => {
    beforeEach(() => {
      mockRequestRepository.addNote.mockResolvedValue(createMockServiceResult({} as any));
      mockRequestRepository.update.mockResolvedValue(createMockServiceResult({} as any));
    });

    it('should schedule follow-up with intelligent timing', async () => {
      const schedule = {
        followUpType: 'initial_contact' as const,
        priority: 'urgent' as const,
        reminderDays: [1, 3, 7],
        autoReschedule: true
      };

      const result = await service.scheduleFollowUp('test-request-id', schedule);

      expect(result.success).toBe(true);
      expect(result.data?.scheduledDate).toBeDefined();
      expect(result.data?.followUpType).toBe('initial_contact');
      
      // For urgent priority, should schedule within 2 hours
      const scheduledDate = new Date(result.data!.scheduledDate!);
      const now = new Date();
      const hoursDiff = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeLessThanOrEqual(2);

      // Should create note
      expect(mockRequestRepository.addNote).toHaveBeenCalledWith(
        'test-request-id',
        expect.stringContaining('Follow-up scheduled'),
        expect.objectContaining({
          type: 'follow_up'
        })
      );

      // Should update request follow-up date
      expect(mockRequestRepository.update).toHaveBeenCalledWith({
        id: 'test-request-id',
        data: expect.objectContaining({
          followUpDate: expect.any(String)
        })
      });
    });

    it('should calculate appropriate timing for different follow-up types', async () => {
      const testCases = [
        { type: 'initial_contact', priority: 'urgent', expectedHours: 2 },
        { type: 'information_request', priority: 'medium', expectedHours: 48 },
        { type: 'quote_follow_up', priority: 'high', expectedHours: 72 },
        { type: 'check_in', priority: 'low', expectedHours: 168 }
      ];

      for (const testCase of testCases) {
        const result = await service.scheduleFollowUp('test-request-id', {
          followUpType: testCase.type as any,
          priority: testCase.priority as any,
          reminderDays: [],
          autoReschedule: false
        });

        expect(result.success).toBe(true);
        
        const scheduledDate = new Date(result.data!.scheduledDate!);
        const now = new Date();
        const actualHours = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        expect(actualHours).toBeLessThanOrEqual(testCase.expectedHours + 1); // Allow 1 hour tolerance
        expect(actualHours).toBeGreaterThanOrEqual(testCase.expectedHours - 1);
      }
    });

    it('should schedule reminders when configured', async () => {
      const result = await service.scheduleFollowUp('test-request-id', {
        followUpType: 'quote_follow_up',
        priority: 'medium',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        reminderDays: [1, 3, 5],
        autoReschedule: false,
        assignedTo: 'agent-123'
      });

      expect(result.success).toBe(true);
      expect(mockNotificationService.scheduleReminder).toHaveBeenCalledTimes(3); // One for each reminder day
    });
  });

  describe('validateStatusTransition()', () => {
    beforeEach(() => {
      mockRequestRepository.get.mockResolvedValue(createMockServiceResult(
        createMockRequest({ status: 'in_progress', assignedTo: 'agent-123' })
      ));
      mockRequestRepository.validateStatusTransition.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        requiredFields: [],
        businessRules: []
      });
    });

    it('should validate business rules for status transitions', async () => {
      const result = await service.validateStatusTransition('test-request-id', 'quote_ready', {
        userId: 'user-123',
        reason: 'All requirements met'
      });

      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(true);
      expect(mockRequestRepository.validateStatusTransition).toHaveBeenCalledWith('in_progress', 'quote_ready');
    });

    it('should add business-specific validation rules', async () => {
      // Test outside business hours warning
      const originalDate = Date;
      const mockDate = jest.fn(() => new Date('2025-01-15T18:00:00Z')); // 6 PM
      global.Date = mockDate as any;

      const result = await service.validateStatusTransition('test-request-id', 'quote_sent');

      expect(result.success).toBe(true);
      expect(result.data?.warnings?.some(w => w.includes('outside business hours'))).toBe(true);

      // Restore original Date
      global.Date = originalDate;
    });

    it('should enforce assignment requirements', async () => {
      mockRequestRepository.get.mockResolvedValueOnce(createMockServiceResult(
        createMockRequest({ status: 'new', assignedTo: undefined })
      ));

      const result = await service.validateStatusTransition('test-request-id', 'in_progress');

      expect(result.success).toBe(true);
      expect(result.data?.errors?.some(e => e.includes('must be assigned'))).toBe(true);
      expect(result.data?.isValid).toBe(false);
    });
  });

  describe('mergeRequests()', () => {
    beforeEach(() => {
      const primaryRequest = createMockEnhancedRequest({ id: 'primary-request' });
      const requestToMerge1 = createMockEnhancedRequest({ id: 'merge-request-1' });
      const requestToMerge2 = createMockEnhancedRequest({ id: 'merge-request-2' });

      mockRequestRepository.getWithRelations
        .mockResolvedValueOnce(createMockServiceResult(primaryRequest))
        .mockResolvedValueOnce(createMockServiceResult(requestToMerge1))
        .mockResolvedValueOnce(createMockServiceResult(requestToMerge2));

      mockRequestRepository.update.mockResolvedValue(createMockServiceResult({} as any));
      mockRequestRepository.addNote.mockResolvedValue(createMockServiceResult({} as any));
    });

    it('should merge duplicate requests intelligently', async () => {
      const result = await service.mergeRequests(
        'primary-request',
        ['merge-request-1', 'merge-request-2'],
        {
          conflictResolution: 'keep_primary',
          preserveHistory: true,
          notifyStakeholders: true
        }
      );

      expect(result.success).toBe(true);
      expect(result.data?.primaryRequestId).toBe('primary-request');
      expect(result.data?.mergedRequestIds).toEqual(['merge-request-1', 'merge-request-2']);

      // Should update primary request with merged data
      expect(mockRequestRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'primary-request'
        })
      );

      // Should archive merged requests
      expect(mockRequestRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'merge-request-1',
          data: expect.objectContaining({
            archived: expect.any(String),
            status: 'merged'
          })
        })
      );

      // Should create merge history note
      expect(mockRequestRepository.addNote).toHaveBeenCalledWith(
        'primary-request',
        expect.stringContaining('Merged 2 duplicate request'),
        expect.any(Object)
      );

      // Should send notifications
      expect(mockNotificationService.sendMergeNotification).toHaveBeenCalledWith(
        'primary-request',
        ['merge-request-1', 'merge-request-2'],
        expect.any(Number)
      );
    });

    it('should handle merge conflicts', async () => {
      const result = await service.mergeRequests('primary-request', ['merge-request-1']);

      expect(result.success).toBe(true);
      expect(result.data?.conflictResolutions).toBeDefined();
    });
  });

  describe('archiveOldRequests()', () => {
    it('should archive old completed requests', async () => {
      const oldRequests = [
        createMockRequest({ 
          id: 'old-request-1', 
          status: 'completed',
          updatedAt: '2024-01-01T00:00:00Z' // Over 1 year old
        }),
        createMockRequest({ 
          id: 'old-request-2', 
          status: 'cancelled',
          updatedAt: '2024-02-01T00:00:00Z' 
        })
      ];

      mockRequestRepository.find.mockResolvedValueOnce(createMockServiceResult(oldRequests));
      mockRequestRepository.update.mockResolvedValue(createMockServiceResult({} as any));
      mockRequestRepository.addNote.mockResolvedValue(createMockServiceResult({} as any));

      const result = await service.archiveOldRequests({
        olderThanDays: 365,
        statuses: ['completed', 'cancelled'],
        excludeActiveQuotes: true,
        batchSize: 50,
        dryRun: false
      });

      expect(result.success).toBe(true);
      expect(result.data?.archived).toBe(2);
      expect(result.data?.skipped).toBe(0);
      expect(result.data?.errors).toHaveLength(0);

      // Should have archived both requests
      expect(mockRequestRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'old-request-1',
          data: expect.objectContaining({
            archived: expect.any(String),
            archivedDate: expect.any(String)
          })
        })
      );
    });

    it('should handle dry run mode', async () => {
      const oldRequests = [createMockRequest({ status: 'completed' })];

      mockRequestRepository.find.mockResolvedValueOnce(createMockServiceResult(oldRequests));

      const result = await service.archiveOldRequests({
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.data?.archived).toBe(1);
      
      // Should not actually update anything in dry run
      expect(mockRequestRepository.update).not.toHaveBeenCalled();
      expect(mockRequestRepository.addNote).not.toHaveBeenCalled();
    });

    it('should handle archival errors gracefully', async () => {
      const oldRequests = [
        createMockRequest({ id: 'old-request-1' }),
        createMockRequest({ id: 'old-request-2' })
      ];

      mockRequestRepository.find.mockResolvedValueOnce(createMockServiceResult(oldRequests));
      mockRequestRepository.update
        .mockResolvedValueOnce(createMockServiceResult({} as any)) // First succeeds
        .mockRejectedValueOnce(new Error('Update failed'));       // Second fails

      const result = await service.archiveOldRequests();

      expect(result.success).toBe(true);
      expect(result.data?.archived).toBe(1);
      expect(result.data?.skipped).toBe(1);
      expect(result.data?.errors).toHaveLength(1);
      expect(result.data?.errors[0]).toContain('old-request-2');
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockServiceResult(null, false, new Error('Database connection failed'))
      );

      const result = await service.calculateLeadScore('test-request-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network timeouts', async () => {
      mockRequestRepository.create.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const result = await service.processNewRequest(createMockRequest({ id: undefined as any }));

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    });
  });

  describe('performance', () => {
    it('should handle large lead score calculations efficiently', async () => {
      const complexRequest = createMockEnhancedRequest({
        notes: Array.from({ length: 100 }, () => ({ content: 'Test note' })),
        assignments: Array.from({ length: 50 }, () => ({ assignedToName: 'Test Agent' }))
      });

      mockRequestRepository.getWithRelations.mockResolvedValue(createMockServiceResult(complexRequest));
      mockRequestRepository.update.mockResolvedValue(createMockServiceResult(complexRequest));

      const startTime = Date.now();
      const result = await service.calculateLeadScore('complex-request');
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle bulk operations efficiently', async () => {
      const requests = Array.from({ length: 100 }, (_, i) => 
        createMockRequest({ id: `request-${i}` })
      );

      mockRequestRepository.find.mockResolvedValueOnce(createMockServiceResult(requests));
      mockRequestRepository.update.mockResolvedValue(createMockServiceResult({} as any));
      mockRequestRepository.addNote.mockResolvedValue(createMockServiceResult({} as any));

      const startTime = Date.now();
      const result = await service.archiveOldRequests({ batchSize: 100 });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.data?.archived).toBe(100);
    });
  });
});