/**
 * RequestService Unit Tests
 * 
 * Comprehensive tests for all business logic with 100% coverage
 * Testing lead scoring algorithms, agent assignment logic, quote generation,
 * status transitions, request merging, and archival operations
 */

import { RequestService } from './RequestService';
import type { 
  LeadScoreResult, 
  AgentAssignment, 
  QuoteGenerationInput,
  FollowUpSchedule,
  RequestMergeResult 
} from './RequestService';
import { 
  createMockRequest,
  createMockEnhancedRequest,
  createMockRequestNote,
  createMockRequestAssignment,
  createMockRepositorySuccess,
  createMockRepositoryError,
  createMockLeadScoreResult,
  createMockAgentAssignment,
  createMockQuoteGenerationInput,
  createMockFollowUpSchedule,
  createMockRequestMergeResult,
  createHighValueLeadScenario,
  createLowValueLeadScenario,
  createComplexAssignmentScenario
} from '../../../__tests__/testDataFactories';

// Mock all dependencies to ensure zero external calls
const mockRequestRepository = {
  create: jest.fn(),
  get: jest.fn(),
  getWithRelations: jest.fn(),
  update: jest.fn(),
  addNote: jest.fn(),
  assignRequest: jest.fn(),
  validateStatusTransition: jest.fn(),
  find: jest.fn(),
  findByStatus: jest.fn(),
  updateStatus: jest.fn()
};

const mockNotificationService = {
  sendNewRequestNotifications: jest.fn(),
  sendAssignmentNotification: jest.fn(),
  scheduleReminder: jest.fn(),
  sendMergeNotification: jest.fn(),
  sendQuoteNotification: jest.fn()
};

const mockContactService = {
  validateContact: jest.fn(),
  getContactById: jest.fn()
};

const mockPropertyService = {
  validateProperty: jest.fn(),
  getPropertyById: jest.fn()
};

const mockAuditService = {
  logRequestCreated: jest.fn(),
  logStatusChange: jest.fn(),
  logAssignment: jest.fn(),
  logQuoteGenerated: jest.fn()
};

describe('RequestService', () => {
  let requestService: RequestService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    // Reset all mock implementations
    Object.values(mockRequestRepository).forEach(mock => mock.mockReset());
    Object.values(mockNotificationService).forEach(mock => mock.mockReset());
    Object.values(mockContactService).forEach(mock => mock.mockReset());
    Object.values(mockPropertyService).forEach(mock => mock.mockReset());
    Object.values(mockAuditService).forEach(mock => mock.mockReset());
    
    // Set default successful responses
    mockContactService.validateContact.mockResolvedValue({ isValid: true });
    mockPropertyService.validateProperty.mockResolvedValue({ isValid: true });
    mockNotificationService.sendNewRequestNotifications.mockResolvedValue({ success: true });
    mockNotificationService.sendAssignmentNotification.mockResolvedValue({ success: true });
    mockNotificationService.scheduleReminder.mockResolvedValue({ success: true });
    mockAuditService.logRequestCreated.mockResolvedValue({ success: true });
    mockAuditService.logStatusChange.mockResolvedValue({ success: true });
    mockAuditService.logAssignment.mockResolvedValue({ success: true });
    
    // Create service instance with mocked dependencies
    requestService = new RequestService({
      requestRepository: mockRequestRepository as any,
      notificationService: mockNotificationService,
      contactService: mockContactService,
      propertyService: mockPropertyService,
      auditService: mockAuditService
    });
  });

  describe('Initialization', () => {
    it('should initialize with all dependencies', () => {
      expect(requestService).toBeInstanceOf(RequestService);
    });

    it('should initialize without optional services', () => {
      const minimalService = new RequestService({
        requestRepository: mockRequestRepository as any
      });
      expect(minimalService).toBeInstanceOf(RequestService);
    });
  });

  describe('processNewRequest()', () => {
    const mockRequestData = {
      homeownerContactId: 'contact_456',
      addressId: 'property_789',
      product: 'Kitchen Renovation',
      message: 'Looking for a complete kitchen remodel',
      budget: '$50,000 - $75,000',
      leadSource: 'website',
      relationToProperty: 'owner',
      priority: 'medium' as const,
      needFinance: false
    };

    it('should process new request with full workflow', async () => {
      const mockRequest = createMockRequest(mockRequestData);
      const mockEnhancedRequest = createMockEnhancedRequest(mockRequestData);
      
      mockRequestRepository.create.mockResolvedValueOnce(
        createMockRepositorySuccess(mockRequest)
      );
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(mockEnhancedRequest)
      );
      mockRequestRepository.update.mockResolvedValue(
        createMockRepositorySuccess(mockRequest)
      );
      mockRequestRepository.addNote.mockResolvedValue(
        createMockRepositorySuccess(createMockRequestNote())
      );

      const result = await requestService.processNewRequest(mockRequestData, {
        autoScore: true,
        autoAssign: true,
        autoScheduleFollowUp: true,
        sendNotifications: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(mockRequest.id);
      
      // Verify repository methods were called
      expect(mockRequestRepository.create).toHaveBeenCalledWith({ data: mockRequestData });
      expect(mockRequestRepository.getWithRelations).toHaveBeenCalledWith(mockRequest.id);
      expect(mockRequestRepository.update).toHaveBeenCalled(); // For lead score and assignment
      
      // Verify services were called
      expect(mockNotificationService.sendNewRequestNotifications).toHaveBeenCalled();
      expect(mockAuditService.logRequestCreated).toHaveBeenCalled();
    });

    it('should handle repository creation failures', async () => {
      mockRequestRepository.create.mockResolvedValueOnce(
        createMockRepositoryError(new Error('Database connection failed'))
      );

      const result = await requestService.processNewRequest(mockRequestData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Database connection failed');
    });

    it('should skip validation when requested', async () => {
      const mockRequest = createMockRequest(mockRequestData);
      
      mockRequestRepository.create.mockResolvedValueOnce(
        createMockRepositorySuccess(mockRequest)
      );
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockEnhancedRequest(mockRequestData))
      );

      const result = await requestService.processNewRequest(mockRequestData, {
        skipValidation: true
      });

      expect(result.success).toBe(true);
      expect(mockContactService.validateContact).not.toHaveBeenCalled();
      expect(mockPropertyService.validateProperty).not.toHaveBeenCalled();
    });

    it('should handle partial workflow failures gracefully', async () => {
      const mockRequest = createMockRequest(mockRequestData);
      
      mockRequestRepository.create.mockResolvedValueOnce(
        createMockRepositorySuccess(mockRequest)
      );
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockEnhancedRequest(mockRequestData))
      );
      
      // Notification service fails but request should still be created
      mockNotificationService.sendNewRequestNotifications.mockRejectedValueOnce(
        new Error('Email service unavailable')
      );

      const result = await requestService.processNewRequest(mockRequestData, {
        sendNotifications: true
      });

      expect(result.success).toBe(true); // Should succeed despite notification failure
    });
  });

  describe('calculateLeadScore()', () => {
    it('should calculate comprehensive lead score for high-value lead', async () => {
      const { request, expectedScore, expectedGrade } = createHighValueLeadScenario();
      const enhancedRequest = createMockEnhancedRequest({
        ...request,
        budget: '$100,000+',
        message: 'Complete home renovation needed urgently. Have permits ready.',
        leadSource: 'referral',
        priority: 'urgent',
        notes: [createMockRequestNote({ content: 'Client very engaged' })],
        assignments: [createMockRequestAssignment()]
      });

      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(enhancedRequest)
      );

      const result = await requestService.calculateLeadScore(request.id!);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const leadScore = result.data!;
      expect(leadScore.requestId).toBe(request.id);
      expect(leadScore.overallScore).toBeGreaterThan(80); // High value lead
      expect(leadScore.grade).toBe('A');
      expect(leadScore.priorityLevel).toBe('urgent');
      expect(leadScore.conversionProbability).toBeGreaterThan(0.8);
      expect(leadScore.factors).toBeDefined();
      expect(leadScore.factors.budgetAlignment).toBeGreaterThan(80);
      expect(leadScore.factors.sourceQuality).toBeGreaterThan(80);
      expect(leadScore.recommendations).toBeInstanceOf(Array);
      expect(leadScore.calculatedAt).toBeDefined();
    });

    it('should calculate low score for incomplete low-value lead', async () => {
      const { request, expectedScore, expectedGrade } = createLowValueLeadScenario();
      const enhancedRequest = createMockEnhancedRequest({
        ...request,
        budget: 'Under $5,000',
        message: 'Just looking for ideas',
        leadSource: 'social_media',
        priority: 'low',
        notes: [], // No engagement
        assignments: []
      });

      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(enhancedRequest)
      );

      const result = await requestService.calculateLeadScore(request.id!);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const leadScore = result.data!;
      expect(leadScore.overallScore).toBeLessThan(40); // Low value lead
      expect(leadScore.grade).toBe('D');
      expect(leadScore.priorityLevel).toBe('low');
      expect(leadScore.conversionProbability).toBeLessThan(0.3);
    });

    it('should handle missing request gracefully', async () => {
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositoryError(new Error('Request not found'))
      );

      const result = await requestService.calculateLeadScore('nonexistent_request');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Request not found');
    });

    it('should calculate all scoring factors correctly', async () => {
      const enhancedRequest = createMockEnhancedRequest({
        budget: '$75,000',
        message: 'Detailed renovation requirements with timeline',
        leadSource: 'website',
        homeownerContactId: 'contact_123',
        addressId: 'property_456',
        product: 'Full Home Renovation',
        notes: [
          createMockRequestNote({ content: 'Initial consultation completed' }),
          createMockRequestNote({ content: 'Client responded promptly' })
        ]
      });

      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(enhancedRequest)
      );

      const result = await requestService.calculateLeadScore('req_123');

      expect(result.success).toBe(true);
      const factors = result.data!.factors;
      
      expect(factors.dataCompleteness).toBeGreaterThan(0);
      expect(factors.sourceQuality).toBeGreaterThan(0);
      expect(factors.engagementLevel).toBeGreaterThan(0);
      expect(factors.budgetAlignment).toBeGreaterThan(0);
      expect(factors.projectComplexity).toBeGreaterThan(0);
      expect(factors.geographicFit).toBeGreaterThan(0);
      expect(factors.urgencyIndicators).toBeGreaterThan(0);
    });
  });

  describe('assignToAgent()', () => {
    it('should assign request with auto balance strategy', async () => {
      const { request, availableAgents, expectedAssignment } = createComplexAssignmentScenario();
      const enhancedRequest = createMockEnhancedRequest(request);

      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(enhancedRequest)
      );
      mockRequestRepository.assignRequest.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockRequestAssignment({
          assignedToId: expectedAssignment,
          assignmentReason: 'Auto-balanced with specialty match'
        }))
      );

      const result = await requestService.assignToAgent(request.id!, {
        strategy: 'auto_balance',
        considerSpecialty: true,
        considerLocation: true,
        considerWorkload: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const assignment = result.data!;
      expect(assignment.agentId).toBeDefined();
      expect(assignment.agentName).toBeDefined();
      expect(assignment.agentRole).toBeDefined();
      expect(assignment.assignmentReason).toBeDefined();
      expect(assignment.confidence).toBeGreaterThan(0);
      expect(assignment.confidence).toBeLessThanOrEqual(1);
      
      expect(mockRequestRepository.assignRequest).toHaveBeenCalled();
      expect(mockNotificationService.sendAssignmentNotification).toHaveBeenCalled();
    });

    it('should handle manual agent assignment', async () => {
      const mockRequest = createMockEnhancedRequest({ id: 'req_123' });
      
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(mockRequest)
      );
      mockRequestRepository.assignRequest.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockRequestAssignment({
          assignedToId: 'specific_agent_123',
          assignmentReason: 'Manual assignment by admin'
        }))
      );

      const result = await requestService.assignToAgent('req_123', {
        agentId: 'specific_agent_123',
        strategy: 'manual'
      });

      expect(result.success).toBe(true);
      expect(result.data!.assignmentReason).toBe('manual');
      expect(result.data!.agentId).toBe('specific_agent_123');
    });

    it('should handle assignment failures', async () => {
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockEnhancedRequest())
      );
      mockRequestRepository.assignRequest.mockResolvedValueOnce(
        createMockRepositoryError(new Error('Agent not available'))
      );

      const result = await requestService.assignToAgent('req_123', {
        agentId: 'unavailable_agent',
        strategy: 'manual'
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Agent not available');
    });

    it('should calculate workload and specialty matching correctly', async () => {
      const mockRequest = createMockEnhancedRequest({
        product: 'Historic Home Restoration',
        message: 'Need specialist for 1920s Victorian restoration'
      });

      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(mockRequest)
      );
      mockRequestRepository.assignRequest.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockRequestAssignment())
      );

      const result = await requestService.assignToAgent('req_123', {
        strategy: 'auto_balance',
        considerSpecialty: true,
        considerWorkload: true
      });

      expect(result.success).toBe(true);
      const assignment = result.data!;
      expect(assignment.workloadBefore).toBeDefined();
      expect(assignment.workloadAfter).toBeDefined();
      expect(assignment.specialtyMatch).toBeDefined();
      expect(assignment.estimatedCapacity).toBeDefined();
    });
  });

  describe('generateQuoteFromRequest()', () => {
    it('should generate quote with pricing calculations', async () => {
      const mockRequest = createMockRequest({ 
        id: 'req_123',
        status: 'assigned',
        budget: '$50,000'
      });

      mockRequestRepository.get.mockResolvedValueOnce(
        createMockRepositorySuccess(mockRequest)
      );

      const quoteInput = createMockQuoteGenerationInput({
        basePrice: 50000,
        adjustmentFactors: {
          complexity: 1.2,
          materials: 1.1,
          timeline: 0.95,
          location: 1.05
        },
        includeAlternatives: true,
        validityPeriod: 30,
        notes: 'Premium renovation with high-end finishes'
      });

      const result = await requestService.generateQuoteFromRequest('req_123', quoteInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const quote = result.data!;
      expect(quote.basePrice).toBe(50000);
      expect(quote.totalPrice).toBeGreaterThan(50000); // Should be adjusted upward
      expect(quote.adjustmentFactors).toEqual(quoteInput.adjustmentFactors);
      expect(quote.validityPeriod).toBe(30);
      expect(quote.status).toBe('draft');
      expect(quote.alternatives).toBeDefined();
      expect(quote.createdAt).toBeDefined();
    });

    it('should validate request status before quote generation', async () => {
      const mockRequest = createMockRequest({ 
        id: 'req_123',
        status: 'completed' // Invalid status for quote generation
      });

      mockRequestRepository.get.mockResolvedValueOnce(
        createMockRepositorySuccess(mockRequest)
      );

      const result = await requestService.generateQuoteFromRequest('req_123', {
        includeAlternatives: false,
        validityPeriod: 30
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot generate quote for request in status: completed');
    });

    it('should handle missing request gracefully', async () => {
      mockRequestRepository.get.mockResolvedValueOnce(
        createMockRepositoryError(new Error('Request not found'))
      );

      const result = await requestService.generateQuoteFromRequest('nonexistent', {
        includeAlternatives: false,
        validityPeriod: 30
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Request not found');
    });

    it('should calculate pricing adjustments correctly', async () => {
      const mockRequest = createMockRequest({ status: 'assigned' });
      mockRequestRepository.get.mockResolvedValueOnce(
        createMockRepositorySuccess(mockRequest)
      );

      const quoteInput = {
        basePrice: 100000,
        adjustmentFactors: {
          complexity: 1.5,   // +50%
          materials: 1.2,    // +20%
          timeline: 0.9,     // -10%
          location: 1.1      // +10%
        },
        includeAlternatives: true,
        validityPeriod: 45
      };

      const result = await requestService.generateQuoteFromRequest('req_123', quoteInput);

      expect(result.success).toBe(true);
      const quote = result.data!;
      
      // Calculate expected total: 100000 * 1.5 * 1.2 * 0.9 * 1.1 = 178200
      expect(quote.totalPrice).toBeCloseTo(178200, 0);
      expect(quote.adjustmentBreakdown).toBeDefined();
      expect(quote.adjustmentBreakdown.complexity).toBeCloseTo(50000, 0); // 50% of 100k
    });
  });

  describe('scheduleFollowUp()', () => {
    it('should schedule follow-up with intelligent timing', async () => {
      mockRequestRepository.addNote.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockRequestNote())
      );
      mockRequestRepository.update.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockRequest())
      );
      mockNotificationService.scheduleReminder.mockResolvedValue({ success: true });

      const result = await requestService.scheduleFollowUp('req_123', {
        followUpType: 'initial_contact',
        priority: 'high',
        assignedTo: 'agent_123',
        reminderDays: [1, 3, 7],
        autoReschedule: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const followUp = result.data!;
      expect(followUp.requestId).toBe('req_123');
      expect(followUp.followUpType).toBe('initial_contact');
      expect(followUp.priority).toBe('high');
      expect(followUp.scheduledDate).toBeDefined();
      expect(followUp.reminderDays).toEqual([1, 3, 7]);
      
      // Verify repository updates
      expect(mockRequestRepository.addNote).toHaveBeenCalled();
      expect(mockRequestRepository.update).toHaveBeenCalled();
      expect(mockNotificationService.scheduleReminder).toHaveBeenCalledTimes(3); // 3 reminders
    });

    it('should calculate optimal follow-up date when not provided', async () => {
      mockRequestRepository.addNote.mockResolvedValue(createMockRepositorySuccess({}));
      mockRequestRepository.update.mockResolvedValue(createMockRepositorySuccess({}));

      const result = await requestService.scheduleFollowUp('req_123', {
        followUpType: 'quote_follow_up',
        priority: 'medium',
        reminderDays: [],
        autoReschedule: false
      });

      expect(result.success).toBe(true);
      expect(result.data!.scheduledDate).toBeDefined();
      
      const scheduledDate = new Date(result.data!.scheduledDate!);
      const now = new Date();
      expect(scheduledDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should handle different follow-up types with appropriate timing', async () => {
      mockRequestRepository.addNote.mockResolvedValue(createMockRepositorySuccess({}));
      mockRequestRepository.update.mockResolvedValue(createMockRepositorySuccess({}));

      // Test initial contact (should be immediate/next business day)
      const initialResult = await requestService.scheduleFollowUp('req_123', {
        followUpType: 'initial_contact',
        priority: 'urgent',
        reminderDays: [],
        autoReschedule: false
      });

      expect(initialResult.success).toBe(true);
      const initialDate = new Date(initialResult.data!.scheduledDate!);
      const now = new Date();
      const timeDiff = initialDate.getTime() - now.getTime();
      expect(timeDiff).toBeLessThan(24 * 60 * 60 * 1000); // Within 24 hours

      // Test quote follow-up (should be longer)
      const quoteResult = await requestService.scheduleFollowUp('req_123', {
        followUpType: 'quote_follow_up',
        priority: 'medium',
        reminderDays: [],
        autoReschedule: false
      });

      expect(quoteResult.success).toBe(true);
      const quoteDate = new Date(quoteResult.data!.scheduledDate!);
      const quoteDiff = quoteDate.getTime() - now.getTime();
      expect(quoteDiff).toBeGreaterThan(24 * 60 * 60 * 1000); // More than 24 hours
    });
  });

  describe('validateStatusTransition()', () => {
    it('should validate valid status transitions', async () => {
      mockRequestRepository.get.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockRequest({
          id: 'req_123',
          status: 'new',
          assignedTo: 'agent_123'
        }))
      );
      mockRequestRepository.validateStatusTransition.mockResolvedValueOnce(
        createMockRepositorySuccess({
          isValid: true,
          errors: [],
          warnings: [],
          requiredFields: [],
          businessRules: []
        })
      );

      const result = await requestService.validateStatusTransition(
        'req_123',
        'in_progress',
        {
          userId: 'user_123',
          reason: 'Starting work on request'
        }
      );

      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(true);
      expect(result.data!.errors).toEqual([]);
      
      expect(mockRequestRepository.get).toHaveBeenCalledWith('req_123');
      expect(mockRequestRepository.validateStatusTransition).toHaveBeenCalled();
    });

    it('should reject invalid status transitions with business rules', async () => {
      mockRequestRepository.get.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockRequest({
          id: 'req_123',
          status: 'new',
          assignedTo: null // No agent assigned
        }))
      );

      const result = await requestService.validateStatusTransition(
        'req_123',
        'in_progress'
      );

      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(false);
      expect(result.data!.errors).toContain('Request must be assigned to an agent before moving to in_progress');
    });

    it('should validate required fields for status transitions', async () => {
      mockRequestRepository.get.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockRequest({
          id: 'req_123',
          status: 'quoted',
          assignedTo: 'agent_123'
        }))
      );

      const result = await requestService.validateStatusTransition(
        'req_123',
        'closed_won'
      );

      expect(result.success).toBe(true);
      // Should require quote information before closing as won
      expect(result.data!.requiredFields).toContain('quoteAmount');
    });
  });

  describe('mergeRequests()', () => {
    it('should merge duplicate requests intelligently', async () => {
      const primaryRequest = createMockEnhancedRequest({
        id: 'req_primary',
        budget: '$50,000 - $75,000',
        createdAt: '2025-01-10T10:00:00Z'
      });

      const duplicateRequest1 = createMockEnhancedRequest({
        id: 'req_dup1',
        budget: '$45,000 - $60,000',
        createdAt: '2025-01-09T10:00:00Z'
      });

      const duplicateRequest2 = createMockEnhancedRequest({
        id: 'req_dup2',
        budget: '$55,000 - $80,000',
        createdAt: '2025-01-08T10:00:00Z'
      });

      mockRequestRepository.getWithRelations
        .mockResolvedValueOnce(createMockRepositorySuccess(primaryRequest))
        .mockResolvedValueOnce(createMockRepositorySuccess(duplicateRequest1))
        .mockResolvedValueOnce(createMockRepositorySuccess(duplicateRequest2));

      mockRequestRepository.update.mockResolvedValue(createMockRepositorySuccess({}));
      mockNotificationService.sendMergeNotification.mockResolvedValue({ success: true });

      const result = await requestService.mergeRequests(
        'req_primary',
        ['req_dup1', 'req_dup2'],
        {
          conflictResolution: 'keep_primary',
          preserveHistory: true,
          notifyStakeholders: true
        }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const mergeResult = result.data!;
      expect(mergeResult.primaryRequestId).toBe('req_primary');
      expect(mergeResult.mergedRequestIds).toEqual(['req_dup1', 'req_dup2']);
      expect(mergeResult.combinedData).toBeDefined();
      expect(mergeResult.conflictResolutions).toBeInstanceOf(Array);
      expect(mergeResult.mergedNotes).toBeInstanceOf(Array);
      expect(mergeResult.mergedAssignments).toBeInstanceOf(Array);
      
      // Verify notifications were sent
      expect(mockNotificationService.sendMergeNotification).toHaveBeenCalledWith(
        'req_primary',
        ['req_dup1', 'req_dup2'],
        expect.any(Number)
      );
    });

    it('should handle merge conflicts with different resolution strategies', async () => {
      const primaryRequest = createMockEnhancedRequest({
        id: 'req_primary',
        budget: '$50,000',
        priority: 'medium'
      });

      const conflictingRequest = createMockEnhancedRequest({
        id: 'req_conflict',
        budget: '$75,000',
        priority: 'high'
      });

      mockRequestRepository.getWithRelations
        .mockResolvedValueOnce(createMockRepositorySuccess(primaryRequest))
        .mockResolvedValueOnce(createMockRepositorySuccess(conflictingRequest));

      mockRequestRepository.update.mockResolvedValue(createMockRepositorySuccess({}));

      const result = await requestService.mergeRequests(
        'req_primary',
        ['req_conflict'],
        {
          conflictResolution: 'use_latest', // Prefer latest request values
          preserveHistory: true
        }
      );

      expect(result.success).toBe(true);
      const conflicts = result.data!.conflictResolutions;
      
      const budgetConflict = conflicts.find(c => c.field === 'budget');
      expect(budgetConflict).toBeDefined();
      expect(budgetConflict!.resolution).toBe('use_merged');
    });
  });

  describe('archiveOldRequests()', () => {
    it('should archive old requests in batches', async () => {
      const oldRequests = [
        createMockRequest({ 
          id: 'old_1',
          status: 'completed',
          updatedAt: '2024-01-15T10:00:00Z' // Old date
        }),
        createMockRequest({ 
          id: 'old_2',
          status: 'cancelled',
          updatedAt: '2024-02-15T10:00:00Z'
        })
      ];

      mockRequestRepository.find.mockResolvedValueOnce(
        createMockRepositorySuccess(oldRequests)
      );
      mockRequestRepository.update.mockResolvedValue(createMockRepositorySuccess({}));
      mockRequestRepository.addNote.mockResolvedValue(createMockRepositorySuccess({}));

      const result = await requestService.archiveOldRequests({
        olderThanDays: 365,
        statuses: ['completed', 'cancelled'],
        excludeActiveQuotes: true,
        batchSize: 25,
        dryRun: false
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const archivalResult = result.data!;
      expect(archivalResult.archived).toBe(2);
      expect(archivalResult.skipped).toBe(0);
      expect(archivalResult.errors).toBeInstanceOf(Array);
      expect(archivalResult.errors).toHaveLength(0);
      
      // Verify repository updates
      expect(mockRequestRepository.update).toHaveBeenCalledTimes(2);
      expect(mockRequestRepository.addNote).toHaveBeenCalledTimes(2);
    });

    it('should handle dry run mode without making changes', async () => {
      const oldRequests = [
        createMockRequest({ 
          id: 'old_1',
          status: 'completed',
          updatedAt: '2024-01-15T10:00:00Z'
        })
      ];

      mockRequestRepository.find.mockResolvedValueOnce(
        createMockRepositorySuccess(oldRequests)
      );

      const result = await requestService.archiveOldRequests({
        olderThanDays: 365,
        statuses: ['completed'],
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.data!.archived).toBe(1);
      expect(result.data!.skipped).toBe(0);
      
      // Verify no actual updates were made
      expect(mockRequestRepository.update).not.toHaveBeenCalled();
      expect(mockRequestRepository.addNote).not.toHaveBeenCalled();
    });

    it('should exclude requests with active quotes when requested', async () => {
      const requestsWithQuotes = [
        createMockRequest({ 
          id: 'quoted_1',
          status: 'completed',
          updatedAt: '2024-01-15T10:00:00Z'
        }),
        createMockRequest({ 
          id: 'no_quote_1',
          status: 'completed',
          updatedAt: '2024-01-15T10:00:00Z'
        })
      ];

      mockRequestRepository.find.mockResolvedValueOnce(
        createMockRepositorySuccess(requestsWithQuotes)
      );

      const result = await requestService.archiveOldRequests({
        olderThanDays: 365,
        excludeActiveQuotes: true
      });

      expect(result.success).toBe(true);
      // Should filter out requests with active quotes
      expect(result.data!.skipped).toBeGreaterThan(0);
    });

    it('should handle archival errors gracefully', async () => {
      const oldRequests = [
        createMockRequest({ id: 'old_1', status: 'completed' }),
        createMockRequest({ id: 'old_2', status: 'completed' })
      ];

      mockRequestRepository.find.mockResolvedValueOnce(
        createMockRepositorySuccess(oldRequests)
      );

      // First update succeeds, second fails
      mockRequestRepository.update
        .mockResolvedValueOnce(createMockRepositorySuccess({}))
        .mockResolvedValueOnce(createMockRepositoryError(new Error('Archive failed')));

      const result = await requestService.archiveOldRequests({
        olderThanDays: 365,
        dryRun: false
      });

      expect(result.success).toBe(true);
      expect(result.data!.archived).toBe(1);
      expect(result.data!.errors).toHaveLength(1);
      expect(result.data!.errors[0]).toContain('old_2');
    });
  });

  describe('Business Logic Edge Cases', () => {
    it('should handle service dependency failures gracefully', async () => {
      const mockRequestData = {
        homeownerContactId: 'contact_123',
        product: 'Kitchen Renovation'
      };

      const mockRequest = createMockRequest(mockRequestData);
      
      mockRequestRepository.create.mockResolvedValueOnce(
        createMockRepositorySuccess(mockRequest)
      );
      mockRequestRepository.getWithRelations.mockResolvedValueOnce(
        createMockRepositorySuccess(createMockEnhancedRequest(mockRequestData))
      );

      // Notification service fails
      mockNotificationService.sendNewRequestNotifications.mockRejectedValueOnce(
        new Error('Email service down')
      );

      const result = await requestService.processNewRequest(mockRequestData, {
        sendNotifications: true
      });

      // Should still succeed despite notification failure
      expect(result.success).toBe(true);
    });

    it('should handle concurrent operations without conflicts', async () => {
      const mockRequest = createMockEnhancedRequest();
      
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockRepositorySuccess(mockRequest)
      );

      // Simulate concurrent lead scoring
      const promises = [
        requestService.calculateLeadScore('req_1'),
        requestService.calculateLeadScore('req_2'),
        requestService.calculateLeadScore('req_3')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should validate business constraints correctly', async () => {
      // Test that archived requests cannot be assigned
      const archivedRequest = createMockRequest({
        id: 'req_archived',
        status: 'archived'
      });

      mockRequestRepository.get.mockResolvedValueOnce(
        createMockRepositorySuccess(archivedRequest)
      );

      const result = await requestService.validateStatusTransition(
        'req_archived',
        'assigned'
      );

      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(false);
      expect(result.data!.errors).toContain('Cannot modify archived request');
    });
  });
});