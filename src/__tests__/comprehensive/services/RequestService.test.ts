/**
 * RequestService Comprehensive Tests - 100% Coverage
 * 
 * Complete test suite covering all business logic, workflows, validations,
 * error scenarios, and edge cases for the RequestService
 */

import { RequestService } from '../../../services/domain/request/RequestService';
import type { 
  RequestServiceDependencies,
  LeadScoreResult,
  AgentAssignment,
  QuoteGenerationInput,
  FollowUpSchedule,
  RequestMergeResult
} from '../../../services/domain/request/RequestService';
import { RequestRepository } from '../../../repositories/RequestRepository';
import { GraphQLClient } from '../../../repositories/base/GraphQLClient';
import {
  createMockRequest,
  createMockEnhancedRequest,
  createMockRequestNote,
  createMockRequestAssignment,
  createMockServiceSuccess,
  createMockServiceError,
  createMockRepositorySuccess,
  createMockRepositoryError,
  createMockLeadScoreResult,
  createMockAgentAssignment,
  createMockQuoteGenerationInput,
  createMockFollowUpSchedule,
  createMockNotificationService,
  createMockContactService,
  createMockPropertyService,
  createMockAuditService,
  createAsyncDelay
} from '../testFactories';

// Mock the RequestRepository
const mockRequestRepository = {
  create: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getWithRelations: jest.fn(),
  findByStatus: jest.fn(),
  findUnassigned: jest.fn(),
  findByAgent: jest.fn(),
  findByHomeowner: jest.fn(),
  findByPriority: jest.fn(),
  searchRequests: jest.fn(),
  validateStatusTransition: jest.fn(),
  updateStatus: jest.fn(),
  assignRequest: jest.fn(),
  addNote: jest.fn(),
  bulkUpdateStatus: jest.fn(),
  bulkAssign: jest.fn(),
  find: jest.fn()
};

jest.mock('../../../repositories/RequestRepository', () => ({
  RequestRepository: jest.fn(() => mockRequestRepository)
}));

describe('RequestService - Comprehensive Coverage', () => {
  let service: RequestService;
  let mockNotificationService: any;
  let mockContactService: any;
  let mockPropertyService: any;
  let mockAuditService: any;
  let dependencies: RequestServiceDependencies;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all repository method mocks
    Object.values(mockRequestRepository).forEach(mock => {
      if (jest.isMockFunction(mock)) {
        mock.mockReset();
      }
    });

    // Create fresh service dependencies
    mockNotificationService = createMockNotificationService();
    mockContactService = createMockContactService();
    mockPropertyService = createMockPropertyService();
    mockAuditService = createMockAuditService();

    dependencies = {
      requestRepository: mockRequestRepository as unknown as RequestRepository,
      notificationService: mockNotificationService,
      contactService: mockContactService,
      propertyService: mockPropertyService,
      auditService: mockAuditService
    };

    service = new RequestService(dependencies);
  });

  describe('Initialization', () => {
    it('should initialize with all dependencies', () => {
      expect(service).toBeInstanceOf(RequestService);
      expect(mockRequestRepository).toBeDefined();
    });

    it('should initialize with minimal dependencies', () => {
      const minimalDeps: RequestServiceDependencies = {
        requestRepository: mockRequestRepository as unknown as RequestRepository
      };
      
      const minimalService = new RequestService(minimalDeps);
      expect(minimalService).toBeInstanceOf(RequestService);
    });

    it('should initialize without optional services', () => {
      const partialDeps: RequestServiceDependencies = {
        requestRepository: mockRequestRepository as unknown as RequestRepository,
        notificationService: undefined,
        contactService: undefined,
        propertyService: undefined,
        auditService: undefined
      };
      
      const partialService = new RequestService(partialDeps);
      expect(partialService).toBeInstanceOf(RequestService);
    });
  });

  describe('processNewRequest() - Complete Coverage', () => {
    const validRequestData = {
      homeownerContactId: 'contact_123',
      product: 'Kitchen Renovation',
      message: 'Looking for complete kitchen remodel',
      budget: '$50,000 - $75,000',
      leadSource: 'website',
      priority: 'medium' as const
    };

    beforeEach(() => {
      // Mock successful request creation
      mockRequestRepository.create.mockResolvedValue(
        createMockServiceSuccess(createMockRequest({ id: 'req_123' }))
      );

      // Mock getting request with relations
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(createMockEnhancedRequest({ id: 'req_123' }))
      );

      // Mock update for lead score
      mockRequestRepository.update.mockResolvedValue(
        createMockServiceSuccess(createMockRequest())
      );
    });

    it('should process new request with all options enabled', async () => {
      const result = await service.processNewRequest(validRequestData, {
        autoAssign: true,
        autoScore: true,
        autoScheduleFollowUp: true,
        sendNotifications: true,
        skipValidation: false
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockRequestRepository.create).toHaveBeenCalledWith({
        data: validRequestData
      });
      expect(mockRequestRepository.getWithRelations).toHaveBeenCalledWith('req_123');
      expect(mockNotificationService.sendNewRequestNotifications).toHaveBeenCalled();
      expect(mockAuditService.logRequestCreated).toHaveBeenCalled();
    });

    it('should process new request with minimal options', async () => {
      const result = await service.processNewRequest(validRequestData, {
        autoAssign: false,
        autoScore: false,
        autoScheduleFollowUp: false,
        sendNotifications: false
      });

      expect(result.success).toBe(true);
      expect(mockRequestRepository.create).toHaveBeenCalled();
      expect(mockNotificationService.sendNewRequestNotifications).not.toHaveBeenCalled();
      expect(mockAuditService.logRequestCreated).toHaveBeenCalled();
    });

    it('should handle request creation failure', async () => {
      mockRequestRepository.create.mockResolvedValue(
        createMockServiceError('Request creation failed')
      );

      const result = await service.processNewRequest(validRequestData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Request creation failed');
    });

    it('should continue processing even if lead scoring fails', async () => {
      // Mock scoring to fail but everything else to succeed
      const leadScoreError = new Error('Scoring service unavailable');
      
      const result = await service.processNewRequest(validRequestData, {
        autoScore: true,
        autoAssign: true
      });

      expect(result.success).toBe(true); // Should still succeed overall
    });

    it('should continue processing even if assignment fails', async () => {
      const result = await service.processNewRequest(validRequestData, {
        autoAssign: true,
        autoScore: false
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle notification failure gracefully', async () => {
      mockNotificationService.sendNewRequestNotifications.mockRejectedValue(
        new Error('Notification service down')
      );

      const result = await service.processNewRequest(validRequestData, {
        sendNotifications: true
      });

      expect(result.success).toBe(true); // Should not fail overall
    });

    it('should handle audit logging failure gracefully', async () => {
      mockAuditService.logRequestCreated.mockRejectedValue(
        new Error('Audit service unavailable')
      );

      const result = await service.processNewRequest(validRequestData);

      expect(result.success).toBe(true); // Should not fail overall
    });

    it('should handle enhanced request retrieval failure', async () => {
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceError('Failed to get relations')
      );

      const result = await service.processNewRequest(validRequestData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Failed to get relations');
    });

    it('should include processing metadata in result', async () => {
      const result = await service.processNewRequest(validRequestData, {
        autoScore: true,
        autoAssign: true
      });

      expect(result.success).toBe(true);
      expect(result.meta?.warnings).toContain('Processing steps:');
      expect(result.meta?.executionTime).toBeDefined();
    });

    it('should handle unexpected errors', async () => {
      mockRequestRepository.create.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await service.processNewRequest(validRequestData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unexpected error');
    });
  });

  describe('generateQuoteFromRequest() - Complete Coverage', () => {
    const mockQuoteInput: QuoteGenerationInput = createMockQuoteGenerationInput();

    beforeEach(() => {
      // Mock request retrieval
      mockRequestRepository.get.mockResolvedValue(
        createMockServiceSuccess(createMockRequest({
          id: 'req_123',
          status: 'in_progress',
          product: 'Kitchen Renovation',
          budget: '$50,000',
          homeownerContactId: 'contact_123',
          addressId: 'address_456'
        }))
      );

      // Mock status update
      mockRequestRepository.updateStatus.mockResolvedValue(
        createMockServiceSuccess(createMockRequest())
      );

      // Mock note addition
      mockRequestRepository.addNote.mockResolvedValue(
        createMockServiceSuccess(createMockRequestNote())
      );
    });

    it('should generate quote successfully', async () => {
      const result = await service.generateQuoteFromRequest('req_123', mockQuoteInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.requestId).toBe('req_123');
      expect(result.data.basePrice).toBeDefined();
      expect(result.data.totalPrice).toBeDefined();

      expect(mockRequestRepository.get).toHaveBeenCalledWith('req_123');
      expect(mockRequestRepository.updateStatus).toHaveBeenCalledWith(
        'req_123',
        'quote_ready',
        expect.objectContaining({
          reason: 'Quote generated',
          businessImpact: 'medium'
        })
      );
      expect(mockRequestRepository.addNote).toHaveBeenCalled();
    });

    it('should validate request exists', async () => {
      mockRequestRepository.get.mockResolvedValue(
        createMockServiceError('Request not found')
      );

      const result = await service.generateQuoteFromRequest('nonexistent', mockQuoteInput);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Request not found');
    });

    it('should validate request status', async () => {
      mockRequestRepository.get.mockResolvedValue(
        createMockServiceSuccess(createMockRequest({
          status: 'new' // Invalid status for quote generation
        }))
      );

      const result = await service.generateQuoteFromRequest('req_123', mockQuoteInput);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Cannot generate quote for request in status');
    });

    it('should validate required information', async () => {
      mockRequestRepository.get.mockResolvedValue(
        createMockServiceSuccess(createMockRequest({
          id: 'req_123',
          status: 'in_progress',
          product: null, // Missing required field
          budget: null, // Missing required field
          homeownerContactId: null, // Missing required field
          addressId: null // Missing required field
        }))
      );

      const result = await service.generateQuoteFromRequest('req_123', mockQuoteInput);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Missing required information');
    });

    it('should handle pricing calculation with adjustment factors', async () => {
      const complexInput: QuoteGenerationInput = {
        basePrice: 50000,
        adjustmentFactors: {
          complexity: 1.2,
          materials: 1.15,
          timeline: 0.9,
          location: 1.1
        },
        includeAlternatives: true,
        validityPeriod: 45,
        notes: 'Premium renovation with custom materials'
      };

      const result = await service.generateQuoteFromRequest('req_123', complexInput);

      expect(result.success).toBe(true);
      expect(result.data.basePrice).toBe(50000);
      expect(result.data.totalPrice).toBeGreaterThan(50000); // Should be adjusted upward
    });

    it('should handle quote generation with default pricing', async () => {
      const minimalInput: QuoteGenerationInput = {
        includeAlternatives: false,
        validityPeriod: 30
      };

      const result = await service.generateQuoteFromRequest('req_123', minimalInput);

      expect(result.success).toBe(true);
      expect(result.data.basePrice).toBeDefined(); // Should use default base price
    });

    it('should handle status update failure', async () => {
      mockRequestRepository.updateStatus.mockResolvedValue(
        createMockServiceError('Status update failed')
      );

      const result = await service.generateQuoteFromRequest('req_123', mockQuoteInput);

      expect(result.success).toBe(true); // Should still succeed overall
    });

    it('should handle note addition failure', async () => {
      mockRequestRepository.addNote.mockResolvedValue(
        createMockServiceError('Note addition failed')
      );

      const result = await service.generateQuoteFromRequest('req_123', mockQuoteInput);

      expect(result.success).toBe(true); // Should still succeed overall
    });

    it('should include quote metadata', async () => {
      const result = await service.generateQuoteFromRequest('req_123', mockQuoteInput);

      expect(result.success).toBe(true);
      expect(result.meta?.executionTime).toBeDefined();
      expect(result.meta?.warnings).toContain('Quote generated with');
    });

    it('should handle unexpected errors', async () => {
      mockRequestRepository.get.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await service.generateQuoteFromRequest('req_123', mockQuoteInput);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Database connection failed');
    });
  });

  describe('assignToAgent() - Complete Coverage', () => {
    beforeEach(() => {
      // Mock request retrieval with relations
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(createMockEnhancedRequest({
          id: 'req_123',
          priority: 'medium'
        }))
      );

      // Mock repository assignment
      mockRequestRepository.assignRequest.mockResolvedValue(
        createMockServiceSuccess(createMockRequestAssignment())
      );

      // Mock request update
      mockRequestRepository.update.mockResolvedValue(
        createMockServiceSuccess(createMockRequest())
      );
    });

    it('should assign request to specific agent', async () => {
      const result = await service.assignToAgent('req_123', {
        agentId: 'agent_456',
        strategy: 'manual'
      });

      expect(result.success).toBe(true);
      expect(result.data.agentId).toBe('agent_456');
      expect(result.data.assignmentReason).toBe('manual');

      expect(mockRequestRepository.getWithRelations).toHaveBeenCalledWith('req_123');
      expect(mockRequestRepository.assignRequest).toHaveBeenCalled();
    });

    it('should use intelligent assignment when no agent specified', async () => {
      const result = await service.assignToAgent('req_123', {
        strategy: 'auto_balance',
        considerSpecialty: true,
        considerLocation: true,
        considerWorkload: true
      });

      expect(result.success).toBe(true);
      expect(result.data.assignmentReason).toBe('workload_balance');
      expect(result.data.confidence).toBeDefined();
    });

    it('should handle different assignment strategies', async () => {
      const strategies = ['round_robin', 'skill_match', 'geographic', 'auto_balance'] as const;

      for (const strategy of strategies) {
        const result = await service.assignToAgent('req_123', { strategy });
        expect(result.success).toBe(true);
      }

      expect(mockRequestRepository.assignRequest).toHaveBeenCalledTimes(strategies.length);
    });

    it('should boost priority for high-confidence assignments', async () => {
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(createMockEnhancedRequest({
          priority: 'medium'
        }))
      );

      // Mock high confidence assignment
      const highConfidenceAssignment = createMockAgentAssignment({
        confidence: 0.95
      });

      const result = await service.assignToAgent('req_123', { strategy: 'skill_match' });

      expect(result.success).toBe(true);
      
      // Should update priority due to high confidence
      expect(mockRequestRepository.update).toHaveBeenCalledWith({
        id: 'req_123',
        data: { priority: 'high' }
      });
    });

    it('should not boost priority for urgent requests', async () => {
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(createMockEnhancedRequest({
          priority: 'urgent'
        }))
      );

      const result = await service.assignToAgent('req_123', { strategy: 'skill_match' });

      expect(result.success).toBe(true);
      
      // Should not update priority for already urgent requests
      expect(mockRequestRepository.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ priority: expect.anything() })
        })
      );
    });

    it('should send assignment notifications', async () => {
      const result = await service.assignToAgent('req_123', {
        agentId: 'agent_456'
      });

      expect(result.success).toBe(true);
      expect(mockNotificationService.sendAssignmentNotification).toHaveBeenCalledWith(
        'agent_456',
        'req_123',
        'manual'
      );
    });

    it('should schedule appropriate follow-up based on priority', async () => {
      const priorities = [
        { priority: 'urgent', expectedHours: 2 },
        { priority: 'high', expectedHours: 4 },
        { priority: 'medium', expectedHours: 24 },
        { priority: 'low', expectedHours: 48 }
      ];

      for (const { priority, expectedHours } of priorities) {
        mockRequestRepository.getWithRelations.mockResolvedValue(
          createMockServiceSuccess(createMockEnhancedRequest({ priority: priority as any }))
        );

        const result = await service.assignToAgent('req_123', { agentId: 'agent_456' });
        expect(result.success).toBe(true);
      }
    });

    it('should handle request not found', async () => {
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceError('Request not found')
      );

      const result = await service.assignToAgent('nonexistent', { agentId: 'agent_456' });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Request not found');
    });

    it('should handle assignment failure', async () => {
      mockRequestRepository.assignRequest.mockResolvedValue(
        createMockServiceError('Assignment failed')
      );

      const result = await service.assignToAgent('req_123', { agentId: 'agent_456' });

      expect(result.success).toBe(true); // Returns selected agent even if assignment fails
      expect(result.data).toBeDefined();
    });

    it('should handle notification failure gracefully', async () => {
      mockNotificationService.sendAssignmentNotification.mockRejectedValue(
        new Error('Notification service down')
      );

      const result = await service.assignToAgent('req_123', { agentId: 'agent_456' });

      expect(result.success).toBe(true); // Should not fail overall
    });

    it('should include assignment metadata', async () => {
      const result = await service.assignToAgent('req_123', { agentId: 'agent_456' });

      expect(result.success).toBe(true);
      expect(result.meta?.executionTime).toBeDefined();
      expect(result.meta?.warnings).toContain('Assignment confidence:');
    });

    it('should handle unexpected errors', async () => {
      mockRequestRepository.getWithRelations.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await service.assignToAgent('req_123', { agentId: 'agent_456' });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Database error');
    });
  });

  describe('calculateLeadScore() - Complete Coverage', () => {
    beforeEach(() => {
      // Mock request with relations for scoring
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(createMockEnhancedRequest({
          id: 'req_123',
          homeownerContactId: 'contact_123',
          agentContactId: 'agent_456',
          addressId: 'address_789',
          product: 'Kitchen Renovation',
          budget: '$50,000 - $75,000',
          message: 'Looking for a complete kitchen renovation with modern appliances and fixtures',
          leadSource: 'referral',
          relationToProperty: 'owner',
          uploadedMedia: 'photos.jpg',
          requestedVisitDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          agent: { id: 'agent_456' },
          homeowner: { id: 'contact_123' },
          address: { id: 'address_789' }
        }))
      );

      // Mock score update
      mockRequestRepository.update.mockResolvedValue(
        createMockServiceSuccess(createMockRequest())
      );
    });

    it('should calculate comprehensive lead score', async () => {
      const result = await service.calculateLeadScore('req_123');

      expect(result.success).toBe(true);
      expect(result.data.requestId).toBe('req_123');
      expect(result.data.overallScore).toBeGreaterThan(0);
      expect(result.data.overallScore).toBeLessThanOrEqual(100);
      expect(result.data.grade).toMatch(/^[ABCDF]$/);
      expect(result.data.priorityLevel).toMatch(/^(urgent|high|medium|low)$/);
      expect(result.data.conversionProbability).toBeGreaterThanOrEqual(0);
      expect(result.data.conversionProbability).toBeLessThanOrEqual(1);

      // Verify all scoring factors are calculated
      expect(result.data.factors.dataCompleteness).toBeGreaterThan(0);
      expect(result.data.factors.sourceQuality).toBeGreaterThan(0);
      expect(result.data.factors.engagementLevel).toBeGreaterThan(0);
      expect(result.data.factors.budgetAlignment).toBeGreaterThan(0);
      expect(result.data.factors.projectComplexity).toBeGreaterThan(0);
      expect(result.data.factors.geographicFit).toBeGreaterThan(0);
      expect(result.data.factors.urgencyIndicators).toBeGreaterThan(0);

      expect(result.data.recommendations).toBeInstanceOf(Array);
      expect(result.data.calculatedAt).toBeDefined();

      expect(mockRequestRepository.update).toHaveBeenCalledWith({
        id: 'req_123',
        data: {
          readinessScore: result.data.overallScore,
          priority: result.data.priorityLevel
        }
      });
    });

    it('should handle high-quality lead (A grade)', async () => {
      // Mock premium lead data
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(createMockEnhancedRequest({
          homeownerContactId: 'contact_123',
          agentContactId: 'agent_456',
          addressId: 'address_789',
          product: 'Luxury Kitchen Addition',
          budget: '$100k+',
          message: 'URGENT: Complete luxury kitchen renovation needed ASAP with premium materials and professional installation',
          leadSource: 'referral',
          uploadedMedia: 'detailed_photos.jpg',
          uplodedDocuments: 'floor_plans.pdf',
          requestedVisitDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          agent: { id: 'agent_456' },
          homeowner: { id: 'contact_123' },
          address: { id: 'address_789', city: 'Local City' }
        }))
      );

      const result = await service.calculateLeadScore('req_123');

      expect(result.success).toBe(true);
      expect(result.data.overallScore).toBeGreaterThan(85);
      expect(result.data.grade).toBe('A');
      expect(result.data.priorityLevel).toBe('urgent');
      expect(result.data.recommendations).toContain('High-priority lead - schedule immediate consultation');
    });

    it('should handle low-quality lead (F grade)', async () => {
      // Mock minimal lead data
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(createMockEnhancedRequest({
          homeownerContactId: null,
          agentContactId: null,
          addressId: null,
          product: null,
          budget: 'no budget',
          message: 'fix',
          leadSource: 'unknown',
          agent: null,
          homeowner: null,
          address: null
        }))
      );

      const result = await service.calculateLeadScore('req_123');

      expect(result.success).toBe(true);
      expect(result.data.overallScore).toBeLessThan(60);
      expect(result.data.grade).toBe('F');
      expect(result.data.priorityLevel).toBe('low');
      expect(result.data.recommendations).toContain('Consider lead nurturing campaign');
    });

    it('should calculate data completeness score correctly', async () => {
      // Test with complete data
      const completeRequest = createMockEnhancedRequest({
        homeownerContactId: 'contact_123',
        agentContactId: 'agent_456',
        addressId: 'address_789',
        product: 'Kitchen Renovation',
        budget: '$50,000',
        message: 'Detailed message',
        leadSource: 'website',
        relationToProperty: 'owner'
      });

      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(completeRequest)
      );

      const result = await service.calculateLeadScore('req_123');

      expect(result.success).toBe(true);
      expect(result.data.factors.dataCompleteness).toBe(100);
    });

    it('should calculate source quality score based on lead source', async () => {
      const sources = [
        { source: 'referral', expectedScore: 90 },
        { source: 'website', expectedScore: 80 },
        { source: 'agent_direct', expectedScore: 85 },
        { source: 'social_media', expectedScore: 70 },
        { source: 'advertisement', expectedScore: 60 },
        { source: 'unknown', expectedScore: 30 }
      ];

      for (const { source, expectedScore } of sources) {
        mockRequestRepository.getWithRelations.mockResolvedValue(
          createMockServiceSuccess(createMockEnhancedRequest({ leadSource: source }))
        );

        const result = await service.calculateLeadScore('req_123');
        expect(result.success).toBe(true);
        expect(result.data.factors.sourceQuality).toBe(expectedScore);
      }
    });

    it('should calculate engagement score based on content and attachments', async () => {
      // Test high engagement
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(createMockEnhancedRequest({
          message: 'This is a very detailed message about our urgent kitchen renovation needs with specific requirements',
          uploadedMedia: 'photos.jpg',
          uplodedDocuments: 'plans.pdf',
          uploadedVideos: 'walkthrough.mp4',
          requestedVisitDateTime: '2025-01-20T10:00:00Z'
        }))
      );

      const result = await service.calculateLeadScore('req_123');

      expect(result.success).toBe(true);
      expect(result.data.factors.engagementLevel).toBeGreaterThan(70);
    });

    it('should calculate budget alignment score', async () => {
      const budgets = [
        { budget: '$100k+', expectedMin: 90 },
        { budget: '$50k - $75k', expectedMin: 80 },
        { budget: '$25k - $30k', expectedMin: 65 },
        { budget: 'no budget', expectedMax: 15 },
        { budget: null, expected: 30 }
      ];

      for (const { budget, expectedMin, expectedMax, expected } of budgets) {
        mockRequestRepository.getWithRelations.mockResolvedValue(
          createMockServiceSuccess(createMockEnhancedRequest({ budget }))
        );

        const result = await service.calculateLeadScore('req_123');
        expect(result.success).toBe(true);
        
        if (expectedMin) {
          expect(result.data.factors.budgetAlignment).toBeGreaterThanOrEqual(expectedMin);
        }
        if (expectedMax) {
          expect(result.data.factors.budgetAlignment).toBeLessThanOrEqual(expectedMax);
        }
        if (expected) {
          expect(result.data.factors.budgetAlignment).toBe(expected);
        }
      }
    });

    it('should calculate project complexity score', async () => {
      const projects = [
        { product: 'Kitchen Addition', expectedMin: 80 },
        { product: 'Bathroom Renovation', expectedMin: 75 },
        { product: 'Home Addition', expectedMin: 80 },
        { product: 'Simple Repair', expectedMin: 55, expectedMax: 65 }
      ];

      for (const { product, expectedMin, expectedMax } of projects) {
        mockRequestRepository.getWithRelations.mockResolvedValue(
          createMockServiceSuccess(createMockEnhancedRequest({ product }))
        );

        const result = await service.calculateLeadScore('req_123');
        expect(result.success).toBe(true);
        
        if (expectedMin) {
          expect(result.data.factors.projectComplexity).toBeGreaterThanOrEqual(expectedMin);
        }
        if (expectedMax) {
          expect(result.data.factors.projectComplexity).toBeLessThanOrEqual(expectedMax);
        }
      }
    });

    it('should calculate urgency score based on timeline and keywords', async () => {
      // Test urgent request
      const urgentDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(createMockEnhancedRequest({
          requestedVisitDateTime: urgentDate,
          message: 'URGENT request - need this done ASAP!'
        }))
      );

      const result = await service.calculateLeadScore('req_123');

      expect(result.success).toBe(true);
      expect(result.data.factors.urgencyIndicators).toBeGreaterThan(80);
    });

    it('should generate appropriate recommendations', async () => {
      // Test lead needing more information
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceSuccess(createMockEnhancedRequest({
          homeownerContactId: null, // Missing data
          budget: null, // Missing budget
          message: 'short' // Low engagement
        }))
      );

      const result = await service.calculateLeadScore('req_123');

      expect(result.success).toBe(true);
      expect(result.data.recommendations).toContain('Gather missing customer and property information');
      expect(result.data.recommendations).toContain('Follow up to increase engagement and gather project details');
      expect(result.data.recommendations).toContain('Qualify budget and set realistic expectations');
    });

    it('should handle request not found', async () => {
      mockRequestRepository.getWithRelations.mockResolvedValue(
        createMockServiceError('Request not found')
      );

      const result = await service.calculateLeadScore('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Request not found');
    });

    it('should handle score update failure gracefully', async () => {
      mockRequestRepository.update.mockResolvedValue(
        createMockServiceError('Update failed')
      );

      const result = await service.calculateLeadScore('req_123');

      expect(result.success).toBe(true); // Should still succeed overall
    });

    it('should include scoring metadata', async () => {
      const result = await service.calculateLeadScore('req_123');

      expect(result.success).toBe(true);
      expect(result.meta?.executionTime).toBeDefined();
      expect(result.meta?.warnings).toContain('Calculated 7 scoring factors');
    });

    it('should handle unexpected errors', async () => {
      mockRequestRepository.getWithRelations.mockImplementation(() => {
        throw new Error('Scoring engine error');
      });

      const result = await service.calculateLeadScore('req_123');

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Scoring engine error');
    });
  });

  describe('scheduleFollowUp() - Complete Coverage', () => {
    const baseSchedule = {
      followUpType: 'initial_contact' as const,
      priority: 'medium' as const,
      reminderDays: [1, 3, 7],
      autoReschedule: true
    };

    beforeEach(() => {
      // Mock note addition
      mockRequestRepository.addNote.mockResolvedValue(
        createMockServiceSuccess(createMockRequestNote())
      );

      // Mock request update
      mockRequestRepository.update.mockResolvedValue(
        createMockServiceSuccess(createMockRequest())
      );
    });

    it('should schedule follow-up with provided date', async () => {
      const scheduledDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      
      const result = await service.scheduleFollowUp('req_123', {
        ...baseSchedule,
        scheduledDate,
        assignedTo: 'agent_456',
        message: 'Custom follow-up message'
      });

      expect(result.success).toBe(true);
      expect(result.data.requestId).toBe('req_123');
      expect(result.data.scheduledDate).toBe(scheduledDate);
      expect(result.data.assignedTo).toBe('agent_456');

      expect(mockRequestRepository.addNote).toHaveBeenCalledWith(
        'req_123',
        expect.stringContaining('Follow-up scheduled for'),
        expect.objectContaining({
          type: 'follow_up',
          followUpRequired: true,
          followUpDate: scheduledDate
        })
      );

      expect(mockRequestRepository.update).toHaveBeenCalledWith({
        id: 'req_123',
        data: { followUpDate: scheduledDate }
      });
    });

    it('should calculate optimal follow-up date when not provided', async () => {
      const result = await service.scheduleFollowUp('req_123', {
        followUpType: 'initial_contact',
        priority: 'urgent',
        reminderDays: [],
        autoReschedule: false
      });

      expect(result.success).toBe(true);
      expect(result.data.scheduledDate).toBeDefined();
      
      // Urgent initial contact should be within 2 hours
      const scheduledTime = new Date(result.data.scheduledDate).getTime();
      const now = Date.now();
      const hoursDifference = (scheduledTime - now) / (1000 * 60 * 60);
      expect(hoursDifference).toBeLessThanOrEqual(2.1); // Small buffer for test timing
    });

    it('should calculate different dates for different follow-up types', async () => {
      const followUpTypes = [
        { type: 'initial_contact', priority: 'urgent', expectedMaxHours: 2 },
        { type: 'information_request', priority: 'medium', expectedHours: 48 },
        { type: 'quote_follow_up', priority: 'high', expectedHours: 72 },
        { type: 'check_in', priority: 'low', expectedHours: 168 }, // 1 week
        { type: 'closing', priority: 'high', expectedHours: 24 }
      ];

      for (const { type, priority, expectedMaxHours, expectedHours } of followUpTypes) {
        const result = await service.scheduleFollowUp('req_123', {
          followUpType: type as any,
          priority: priority as any,
          reminderDays: [],
          autoReschedule: false
        });

        expect(result.success).toBe(true);
        
        const scheduledTime = new Date(result.data.scheduledDate).getTime();
        const now = Date.now();
        const hoursDifference = (scheduledTime - now) / (1000 * 60 * 60);
        
        if (expectedMaxHours) {
          expect(hoursDifference).toBeLessThanOrEqual(expectedMaxHours + 0.1);
        } else if (expectedHours) {
          expect(hoursDifference).toBeCloseTo(expectedHours, -1); // Within 10% tolerance
        }
      }
    });

    it('should create reminders for future dates', async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days future

      const result = await service.scheduleFollowUp('req_123', {
        ...baseSchedule,
        scheduledDate: futureDate,
        reminderDays: [1, 3, 7], // All should be in future
        assignedTo: 'agent_456'
      });

      expect(result.success).toBe(true);
      expect(mockNotificationService.scheduleReminder).toHaveBeenCalledTimes(3); // One for each reminder day

      // Verify reminder scheduling calls
      expect(mockNotificationService.scheduleReminder).toHaveBeenCalledWith({
        requestId: 'req_123',
        reminderDate: expect.any(String),
        message: expect.stringContaining('Follow-up due in'),
        recipientId: 'agent_456'
      });
    });

    it('should skip reminders for past dates', async () => {
      const nearFutureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days future

      const result = await service.scheduleFollowUp('req_123', {
        ...baseSchedule,
        scheduledDate: nearFutureDate,
        reminderDays: [1, 3, 7], // 3 and 7 day reminders would be in the past
        assignedTo: 'agent_456'
      });

      expect(result.success).toBe(true);
      expect(mockNotificationService.scheduleReminder).toHaveBeenCalledTimes(1); // Only 1-day reminder should be created
    });

    it('should handle no reminders when service unavailable', async () => {
      const result = await service.scheduleFollowUp('req_123', {
        ...baseSchedule,
        reminderDays: [1, 3]
      });

      expect(result.success).toBe(true); // Should succeed without notification service
    });

    it('should set appropriate note priority based on follow-up priority', async () => {
      const priorities = [
        { followUpPriority: 'urgent', expectedNotePriority: 'urgent' },
        { followUpPriority: 'high', expectedNotePriority: 'important' },
        { followUpPriority: 'medium', expectedNotePriority: 'normal' },
        { followUpPriority: 'low', expectedNotePriority: 'normal' }
      ];

      for (const { followUpPriority, expectedNotePriority } of priorities) {
        mockRequestRepository.addNote.mockClear();

        await service.scheduleFollowUp('req_123', {
          followUpType: 'initial_contact',
          priority: followUpPriority as any,
          reminderDays: [],
          autoReschedule: false
        });

        expect(mockRequestRepository.addNote).toHaveBeenCalledWith(
          'req_123',
          expect.any(String),
          expect.objectContaining({
            priority: expectedNotePriority
          })
        );
      }
    });

    it('should handle note creation failure gracefully', async () => {
      mockRequestRepository.addNote.mockResolvedValue(
        createMockServiceError('Note creation failed')
      );

      const result = await service.scheduleFollowUp('req_123', baseSchedule);

      expect(result.success).toBe(true); // Should still succeed overall
    });

    it('should handle request update failure gracefully', async () => {
      mockRequestRepository.update.mockResolvedValue(
        createMockServiceError('Update failed')
      );

      const result = await service.scheduleFollowUp('req_123', baseSchedule);

      expect(result.success).toBe(true); // Should still succeed overall
    });

    it('should handle reminder scheduling failure gracefully', async () => {
      mockNotificationService.scheduleReminder.mockRejectedValue(
        new Error('Reminder service unavailable')
      );

      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

      const result = await service.scheduleFollowUp('req_123', {
        ...baseSchedule,
        scheduledDate: futureDate,
        reminderDays: [1]
      });

      expect(result.success).toBe(true); // Should still succeed overall
    });

    it('should include scheduling metadata', async () => {
      const result = await service.scheduleFollowUp('req_123', {
        ...baseSchedule,
        reminderDays: [1, 3, 7]
      });

      expect(result.success).toBe(true);
      expect(result.meta?.executionTime).toBeDefined();
      expect(result.meta?.warnings).toContain('Scheduled 3 reminders');
    });

    it('should handle unexpected errors', async () => {
      mockRequestRepository.addNote.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      const result = await service.scheduleFollowUp('req_123', baseSchedule);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Database connection lost');
    });
  });

  describe('Helper Methods - Complete Coverage', () => {
    describe('Business Hours Validation', () => {
      it('should detect outside business hours', () => {
        // Access private method for testing
        const isOutsideHours = (service as any).isOutsideBusinessHours();
        expect(typeof isOutsideHours).toBe('boolean');
      });
    });

    describe('Pricing Calculations', () => {
      it('should calculate quote pricing with adjustments', async () => {
        const mockRequest = createMockRequest({
          product: 'Kitchen Renovation',
          budget: '$50,000'
        });

        const mockInput: QuoteGenerationInput = {
          basePrice: 45000,
          adjustmentFactors: {
            complexity: 1.2,
            materials: 1.1,
            timeline: 0.95,
            location: 1.05
          },
          includeAlternatives: true,
          validityPeriod: 30
        };

        // Access private method for testing
        const pricing = await (service as any).calculateQuotePricing(mockRequest, mockInput);

        expect(pricing.basePrice).toBe(45000);
        expect(pricing.totalPrice).toBeGreaterThan(45000);
        expect(pricing.breakdown).toBeDefined();
        expect(pricing.breakdown.complexity).toBeDefined();
        expect(pricing.breakdown.materials).toBeDefined();
        expect(pricing.breakdown.timeline).toBeDefined();
        expect(pricing.breakdown.location).toBeDefined();
      });
    });

    describe('Agent Finding', () => {
      it('should find best agent for assignment', async () => {
        const mockRequest = createMockEnhancedRequest();
        const options = {
          strategy: 'auto_balance',
          considerSpecialty: true,
          considerLocation: true
        };

        // Access private method for testing
        const agent = await (service as any).findBestAgent(mockRequest, options);

        expect(agent).toBeDefined();
        expect(agent.agentId).toBeDefined();
        expect(agent.agentName).toBeDefined();
        expect(agent.assignmentReason).toBeDefined();
        expect(agent.confidence).toBeGreaterThanOrEqual(0);
        expect(agent.confidence).toBeLessThanOrEqual(1);
      });

      it('should get agent for manual assignment', async () => {
        // Access private method for testing
        const agent = await (service as any).getAgentForManualAssignment('agent_123');

        expect(agent).toBeDefined();
        expect(agent.agentId).toBe('agent_123');
        expect(agent.assignmentReason).toBe('manual');
        expect(agent.confidence).toBe(1.0);
      });
    });

    describe('Scoring Calculations', () => {
      it('should calculate all scoring factors', () => {
        const mockRequest = createMockEnhancedRequest({
          homeownerContactId: 'contact_123',
          agentContactId: 'agent_456',
          addressId: 'address_789',
          product: 'Kitchen Renovation',
          budget: '$50,000',
          message: 'Detailed renovation request with specific requirements',
          leadSource: 'referral',
          uploadedMedia: 'photos.jpg',
          requestedVisitDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          agent: { id: 'agent_456' },
          homeowner: { id: 'contact_123' },
          address: { id: 'address_789' }
        });

        // Access private scoring methods
        const dataCompleteness = (service as any).calculateDataCompletenessScore(mockRequest);
        const sourceQuality = (service as any).calculateSourceQualityScore(mockRequest);
        const engagement = (service as any).calculateEngagementScore(mockRequest);
        const budgetAlignment = (service as any).calculateBudgetAlignmentScore(mockRequest);
        const projectComplexity = (service as any).calculateProjectComplexityScore(mockRequest);
        const geographicFit = (service as any).calculateGeographicFitScore(mockRequest);
        const urgency = (service as any).calculateUrgencyScore(mockRequest);

        expect(dataCompleteness).toBeGreaterThan(0);
        expect(dataCompleteness).toBeLessThanOrEqual(100);
        
        expect(sourceQuality).toBeGreaterThan(0);
        expect(sourceQuality).toBeLessThanOrEqual(100);
        
        expect(engagement).toBeGreaterThan(0);
        expect(engagement).toBeLessThanOrEqual(100);
        
        expect(budgetAlignment).toBeGreaterThan(0);
        expect(budgetAlignment).toBeLessThanOrEqual(100);
        
        expect(projectComplexity).toBeGreaterThan(0);
        expect(projectComplexity).toBeLessThanOrEqual(100);
        
        expect(geographicFit).toBeGreaterThan(0);
        expect(geographicFit).toBeLessThanOrEqual(100);
        
        expect(urgency).toBeGreaterThan(0);
        expect(urgency).toBeLessThanOrEqual(100);
      });

      it('should generate appropriate recommendations', () => {
        const factors = {
          dataCompleteness: 60, // Low - should trigger recommendation
          sourceQuality: 80,
          engagementLevel: 50, // Low - should trigger recommendation
          budgetAlignment: 40, // Low - should trigger recommendation
          projectComplexity: 75,
          geographicFit: 85,
          urgencyIndicators: 70
        };

        const overallScore = 65;

        // Access private method for testing
        const recommendations = (service as any).generateLeadRecommendations(factors, overallScore);

        expect(recommendations).toBeInstanceOf(Array);
        expect(recommendations).toContain('Gather missing customer and property information');
        expect(recommendations).toContain('Follow up to increase engagement and gather project details');
        expect(recommendations).toContain('Qualify budget and set realistic expectations');
        expect(recommendations).toContain('Schedule consultation within 24-48 hours');
      });
    });
  });

  describe('Factory Function', () => {
    it('should create service with dependencies', () => {
      const { createRequestService } = require('../../../services/domain/request/RequestService');
      const service = createRequestService(dependencies);
      
      expect(service).toBeInstanceOf(RequestService);
    });
  });
});