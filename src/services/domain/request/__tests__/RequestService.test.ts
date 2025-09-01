/**
 * RequestService Unit Tests
 * 
 * Tests business logic without external dependencies
 * Using mock implementations for all repositories and services
 */

// Mock dependencies to avoid external calls
const createMockRequestRepository = () => ({
  create: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'request_123',
      status: 'new',
      priority: 'medium',
      createdAt: new Date().toISOString()
    }
  }),
  
  get: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'request_123',
      status: 'new',
      priority: 'medium',
      homeownerContactId: 'contact_456',
      addressId: 'property_789',
      product: 'Kitchen Renovation',
      budget: '$50,000',
      message: 'Test message',
      leadSource: 'website'
    }
  }),
  
  getWithRelations: jest.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'request_123',
      status: 'new',
      priority: 'medium',
      homeownerContactId: 'contact_456',
      addressId: 'property_789',
      product: 'Kitchen Renovation',
      budget: '$50,000',
      message: 'Test message',
      leadSource: 'website',
      notes: [],
      assignments: [],
      statusHistory: [],
      informationItems: [],
      scopeItems: [],
      workflowStates: [],
      agent: null,
      homeowner: { id: 'contact_456', name: 'Test User' },
      address: { id: 'property_789', address: '123 Test St' }
    }
  }),
  
  update: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'request_123', priority: 'high' }
  }),
  
  addNote: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'note_123', content: 'Test note' }
  }),
  
  assignRequest: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'assignment_123', assignedToName: 'Test Agent' }
  }),
  
  validateStatusTransition: jest.fn().mockResolvedValue({
    isValid: true,
    errors: [],
    warnings: [],
    requiredFields: [],
    businessRules: []
  }),
  
  find: jest.fn().mockResolvedValue({
    success: true,
    data: []
  })
});

const createMockServices = () => ({
  notificationService: {
    sendNewRequestNotifications: jest.fn().mockResolvedValue({ success: true }),
    sendAssignmentNotification: jest.fn().mockResolvedValue({ success: true }),
    scheduleReminder: jest.fn().mockResolvedValue({ success: true }),
    sendMergeNotification: jest.fn().mockResolvedValue({ success: true })
  },
  contactService: {
    validateContact: jest.fn().mockResolvedValue({ isValid: true })
  },
  propertyService: {
    validateProperty: jest.fn().mockResolvedValue({ isValid: true })
  },
  auditService: {
    logRequestCreated: jest.fn().mockResolvedValue({ success: true })
  }
});

// Import the service after mocking
import { RequestService } from '../RequestService';

describe('RequestService', () => {
  let requestService: RequestService;
  let mockRepository: any;
  let mockServices: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh mocks
    mockRepository = createMockRequestRepository();
    mockServices = createMockServices();
    
    // Create service instance
    requestService = new RequestService({
      requestRepository: mockRepository,
      ...mockServices
    });
  });

  describe('processNewRequest', () => {
    it('should create and process a new request with full workflow', async () => {
      const requestData = {
        homeownerContactId: 'contact_456',
        addressId: 'property_789',
        product: 'Kitchen Renovation',
        message: 'Looking for a complete kitchen remodel',
        budget: '$50,000',
        leadSource: 'website',
        relationToProperty: 'owner',
        priority: 'medium' as const,
        needFinance: false
      };

      const result = await requestService.processNewRequest(requestData, {
        autoScore: true,
        autoAssign: true,
        autoScheduleFollowUp: true,
        sendNotifications: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe('request_123');
      
      // Verify repository methods were called
      expect(mockRepository.create).toHaveBeenCalledWith({ data: requestData });
      expect(mockRepository.update).toHaveBeenCalled(); // For lead score and assignment
      expect(mockRepository.getWithRelations).toHaveBeenCalledWith('request_123');
      
      // Verify services were called
      expect(mockServices.notificationService.sendNewRequestNotifications).toHaveBeenCalled();
      expect(mockServices.auditService.logRequestCreated).toHaveBeenCalled();
    });

    it('should handle repository failures gracefully', async () => {
      mockRepository.create.mockResolvedValueOnce({
        success: false,
        error: new Error('Database connection failed')
      });

      const result = await requestService.processNewRequest({
        homeownerContactId: 'contact_456',
        product: 'Test Product'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('calculateLeadScore', () => {
    it('should calculate comprehensive lead score', async () => {
      const result = await requestService.calculateLeadScore('request_123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const leadScore = result.data!;
      expect(leadScore.requestId).toBe('request_123');
      expect(leadScore.overallScore).toBeGreaterThan(0);
      expect(leadScore.overallScore).toBeLessThanOrEqual(100);
      expect(leadScore.grade).toMatch(/^[A-F]$/);
      expect(leadScore.priorityLevel).toMatch(/^(urgent|high|medium|low)$/);
      expect(leadScore.conversionProbability).toBeGreaterThan(0);
      expect(leadScore.conversionProbability).toBeLessThanOrEqual(1);
      expect(leadScore.factors).toBeDefined();
      expect(leadScore.recommendations).toBeInstanceOf(Array);
    });

    it('should handle missing request gracefully', async () => {
      mockRepository.getWithRelations.mockResolvedValueOnce({
        success: false,
        error: new Error('Request not found')
      });

      const result = await requestService.calculateLeadScore('nonexistent_request');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('assignToAgent', () => {
    it('should assign request to agent with load balancing', async () => {
      const result = await requestService.assignToAgent('request_123', {
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
      
      // Verify repository methods were called
      expect(mockRepository.getWithRelations).toHaveBeenCalledWith('request_123');
      expect(mockRepository.assignRequest).toHaveBeenCalled();
      expect(mockServices.notificationService.sendAssignmentNotification).toHaveBeenCalled();
    });

    it('should handle manual agent assignment', async () => {
      const result = await requestService.assignToAgent('request_123', {
        agentId: 'specific_agent_123',
        strategy: 'manual'
      });

      expect(result.success).toBe(true);
      expect(result.data!.assignmentReason).toBe('manual');
    });
  });

  describe('generateQuoteFromRequest', () => {
    it('should generate quote with pricing calculations', async () => {
      const result = await requestService.generateQuoteFromRequest('request_123', {
        basePrice: 50000,
        adjustmentFactors: {
          complexity: 1.2,
          materials: 1.1,
          timeline: 0.95,
          location: 1.05
        },
        includeAlternatives: true,
        validityPeriod: 30,
        notes: 'Premium renovation'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const quote = result.data!;
      expect(quote.basePrice).toBe(50000);
      expect(quote.totalPrice).toBeGreaterThan(50000); // Should be adjusted
      expect(quote.validityPeriod).toBe(30);
      expect(quote.status).toBe('draft');
    });

    it('should validate request status before quote generation', async () => {
      mockRepository.get.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'request_123',
          status: 'completed' // Invalid status for quote generation
        }
      });

      const result = await requestService.generateQuoteFromRequest('request_123', {
        includeAlternatives: false,
        validityPeriod: 30
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot generate quote for request in status: completed');
    });
  });

  describe('scheduleFollowUp', () => {
    it('should schedule follow-up with intelligent timing', async () => {
      const result = await requestService.scheduleFollowUp('request_123', {
        followUpType: 'initial_contact',
        priority: 'high',
        assignedTo: 'agent_123',
        reminderDays: [1, 3, 7],
        autoReschedule: true
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const followUp = result.data!;
      expect(followUp.requestId).toBe('request_123');
      expect(followUp.followUpType).toBe('initial_contact');
      expect(followUp.priority).toBe('high');
      expect(followUp.scheduledDate).toBeDefined();
      expect(followUp.reminderDays).toEqual([1, 3, 7]);
      
      // Verify repository updates
      expect(mockRepository.addNote).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalled();
      expect(mockServices.notificationService.scheduleReminder).toHaveBeenCalledTimes(3); // 3 reminders
    });

    it('should calculate optimal follow-up date when not provided', async () => {
      const result = await requestService.scheduleFollowUp('request_123', {
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
  });

  describe('validateStatusTransition', () => {
    it('should validate status transitions with business rules', async () => {
      const result = await requestService.validateStatusTransition(
        'request_123',
        'in_progress',
        {
          userId: 'user_123',
          reason: 'Starting work on request'
        }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const validation = result.data!;
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toBeInstanceOf(Array);
      expect(validation.warnings).toBeInstanceOf(Array);
      expect(validation.requiredFields).toBeInstanceOf(Array);
      expect(validation.businessRules).toBeInstanceOf(Array);
      
      // Verify repository methods were called
      expect(mockRepository.get).toHaveBeenCalledWith('request_123');
      expect(mockRepository.validateStatusTransition).toHaveBeenCalled();
    });
  });

  describe('mergeRequests', () => {
    it('should merge duplicate requests intelligently', async () => {
      const result = await requestService.mergeRequests(
        'request_primary',
        ['request_dup1', 'request_dup2'],
        {
          conflictResolution: 'keep_primary',
          preserveHistory: true,
          notifyStakeholders: true
        }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const mergeResult = result.data!;
      expect(mergeResult.primaryRequestId).toBe('request_primary');
      expect(mergeResult.mergedRequestIds).toEqual(['request_dup1', 'request_dup2']);
      expect(mergeResult.combinedData).toBeDefined();
      expect(mergeResult.conflictResolutions).toBeInstanceOf(Array);
      expect(mergeResult.mergedNotes).toBeInstanceOf(Array);
      expect(mergeResult.mergedAssignments).toBeInstanceOf(Array);
      
      // Verify notifications were sent
      expect(mockServices.notificationService.sendMergeNotification).toHaveBeenCalledWith(
        'request_primary',
        ['request_dup1', 'request_dup2'],
        expect.any(Number)
      );
    });
  });

  describe('archiveOldRequests', () => {
    it('should archive old requests in batches', async () => {
      mockRepository.find.mockResolvedValueOnce({
        success: true,
        data: [
          { id: 'old_request_1', status: 'completed' },
          { id: 'old_request_2', status: 'cancelled' }
        ]
      });

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
      
      // Verify repository updates
      expect(mockRepository.update).toHaveBeenCalledTimes(2); // Once for each archived request
      expect(mockRepository.addNote).toHaveBeenCalledTimes(2); // Archive notes
    });

    it('should handle dry run mode', async () => {
      mockRepository.find.mockResolvedValueOnce({
        success: true,
        data: [{ id: 'old_request_1', status: 'completed' }]
      });

      const result = await requestService.archiveOldRequests({
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.data!.archived).toBe(1);
      
      // Verify no actual updates were made
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockRepository.addNote).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockRepository.create.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await requestService.processNewRequest({
        homeownerContactId: 'contact_456',
        product: 'Test Product'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Database connection failed');
    });

    it('should handle service dependency failures', async () => {
      mockServices.notificationService.sendNewRequestNotifications.mockRejectedValueOnce(
        new Error('Notification service unavailable')
      );

      const result = await requestService.processNewRequest({
        homeownerContactId: 'contact_456',
        product: 'Test Product'
      }, {
        sendNotifications: true
      });

      // Should still succeed even if notifications fail
      expect(result.success).toBe(true);
    });
  });

  describe('Business Logic Validation', () => {
    it('should enforce business rules correctly', async () => {
      // Test specific business rule: can't assign without agent
      mockRepository.get.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'request_123',
          status: 'new',
          assignedTo: null // No agent assigned
        }
      });

      const result = await requestService.validateStatusTransition(
        'request_123',
        'in_progress'
      );

      expect(result.success).toBe(true);
      expect(result.data!.isValid).toBe(false);
      expect(result.data!.errors).toContain('Request must be assigned to an agent before status change');
    });

    it('should calculate lead scores based on data quality', async () => {
      // Mock request with minimal data
      mockRepository.getWithRelations.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'request_123',
          homeownerContactId: 'contact_456',
          // Missing many fields
          notes: [],
          assignments: [],
          statusHistory: []
        }
      });

      const result = await requestService.calculateLeadScore('request_123');

      expect(result.success).toBe(true);
      expect(result.data!.overallScore).toBeLessThan(50); // Should be low due to missing data
      expect(result.data!.grade).toBe('D');
      expect(result.data!.priorityLevel).toBe('low');
    });
  });
});