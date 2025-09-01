/**
 * RequestService (Business Layer) - Comprehensive Test Suite
 * 
 * Tests for 100% coverage of business logic RequestService including:
 * - Enhanced CRUD operations with business logic
 * - Contact and property creation/linking
 * - Status workflow management
 * - Business state calculations
 * - Request enhancement with related entities
 * - Priority scoring and aging calculations
 * - Validation rules and business constraints
 * - Error handling and resilience
 */

import { RequestService, EnhancedRequest, RequestBusinessFilter, RequestCreateData } from '../../../services/business/RequestService';
import { 
  createMockRequest, 
  createMockContact, 
  createMockProperty,
  createMockRepositoryResult,
  createMockServiceResult 
} from '../testDataFactories';

// Mock the logger first
jest.mock('../../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

// Create mock repositories manually
const mockRequestRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockContactRepository = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn()
};

const mockPropertyRepository = {
  findByAddress: jest.fn(),
  create: jest.fn(),
  findById: jest.fn()
};

// Mock the repository modules
jest.mock('../../../repositories/RequestRepository', () => ({
  requestRepository: mockRequestRepository
}));

jest.mock('../../../repositories/ContactRepository', () => ({
  contactRepository: mockContactRepository
}));

jest.mock('../../../repositories/PropertyRepository', () => ({
  propertyRepository: mockPropertyRepository
}));

describe('RequestService (Business Layer) - Complete Coverage', () => {
  let service: RequestService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RequestService();
  });

  describe('Initialization & Setup', () => {
    it('should initialize with validation rules', () => {
      expect(service).toBeInstanceOf(RequestService);
      // Validation rules should be set up in constructor
      expect((service as any).validationRules.length).toBeGreaterThan(0);
    });
  });

  describe('create() - Enhanced Request Creation', () => {
    const validRequestData: RequestCreateData = {
      message: 'Looking for kitchen renovation',
      relationToProperty: 'owner',
      budget: '50000',
      leadSource: 'website',
      agentInfo: {
        firstName: 'John',
        lastName: 'Agent',
        email: 'agent@example.com',
        phone: '555-0001',
        brokerage: 'Test Realty'
      },
      homeownerInfo: {
        firstName: 'Jane',
        lastName: 'Owner',
        email: 'owner@example.com',
        phone: '555-0002'
      },
      propertyInfo: {
        houseAddress: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        propertyType: 'Single Family',
        bedrooms: 3,
        bathrooms: 2
      }
    };

    beforeEach(() => {
      // Mock successful contact creation
      mockContactRepository.findByEmail.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Contact not found')
      );
      mockContactRepository.create
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ id: 'agent-123' })))
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ id: 'homeowner-456' })));

      // Mock successful property creation
      mockPropertyRepository.findByAddress.mockResolvedValue(
        createMockRepositoryResult([], true)
      );
      mockPropertyRepository.create.mockResolvedValue(
        createMockRepositoryResult(createMockProperty({ id: 'property-789' }))
      );

      // Mock successful request creation
      const createdRequest = createMockRequest({
        id: 'request-123',
        status: 'New',
        agentContactId: 'agent-123',
        homeownerContactId: 'homeowner-456',
        addressId: 'property-789'
      });
      mockRequestRepository.create.mockResolvedValue(createMockRepositoryResult(createdRequest));
      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(createdRequest));

      // Mock related entities for enhancement
      mockContactRepository.findById
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ 
          id: 'agent-123', 
          fullName: 'John Agent',
          email: 'agent@example.com',
          brokerage: 'Test Realty'
        })))
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ 
          id: 'homeowner-456', 
          fullName: 'Jane Owner',
          email: 'owner@example.com'
        })));
      
      mockPropertyRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockProperty({ 
          id: 'property-789', 
          propertyFullAddress: '123 Main St, Test City, CA',
          propertyType: 'Single Family'
        }))
      );
    });

    it('should create request with full business workflow', async () => {
      const result = await service.create(validRequestData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe('request-123');
      expect(result.data!.agentSummary).toBeDefined();
      expect(result.data!.homeownerSummary).toBeDefined();
      expect(result.data!.propertySummary).toBeDefined();

      // Verify contact creation
      expect(mockContactRepository.create).toHaveBeenCalledTimes(2);
      expect(mockContactRepository.create).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Agent',
        email: 'agent@example.com',
        phone: '555-0001',
        brokerage: 'Test Realty',
        contactType: 'agent'
      });

      // Verify property creation
      expect(mockPropertyRepository.create).toHaveBeenCalledWith({
        houseAddress: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        propertyType: 'Single Family',
        bedrooms: 3,
        bathrooms: 2,
        propertyFullAddress: '123 Main St, Test City, CA'
      });

      // Verify request creation
      expect(mockRequestRepository.create).toHaveBeenCalledWith({
        status: 'New',
        message: 'Looking for kitchen renovation',
        relationToProperty: 'owner',
        budget: '50000',
        leadSource: 'website',
        agentContactId: 'agent-123',
        homeownerContactId: 'homeowner-456',
        addressId: 'property-789'
      });
    });

    it('should reuse existing contact by email', async () => {
      const existingAgent = createMockContact({ id: 'existing-agent', email: 'agent@example.com' });
      mockContactRepository.findByEmail.mockResolvedValueOnce(
        createMockRepositoryResult(existingAgent)
      );

      const result = await service.create(validRequestData);

      expect(result.success).toBe(true);
      expect(mockContactRepository.create).toHaveBeenCalledTimes(1); // Only homeowner created
      expect(mockRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          agentContactId: 'existing-agent'
        })
      );
    });

    it('should reuse existing property by address', async () => {
      const existingProperty = createMockProperty({ id: 'existing-property' });
      mockPropertyRepository.findByAddress.mockResolvedValue(
        createMockRepositoryResult([existingProperty], true)
      );

      const result = await service.create(validRequestData);

      expect(result.success).toBe(true);
      expect(mockPropertyRepository.create).not.toHaveBeenCalled();
      expect(mockRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          addressId: 'existing-property'
        })
      );
    });

    it('should handle minimal request data', async () => {
      const minimalData: RequestCreateData = {
        message: 'Basic request'
      };

      const createdRequest = createMockRequest({ id: 'minimal-123' });
      mockRequestRepository.create.mockResolvedValue(createMockRepositoryResult(createdRequest));
      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(createdRequest));

      const result = await service.create(minimalData);

      expect(result.success).toBe(true);
      expect(mockRequestRepository.create).toHaveBeenCalledWith({
        status: 'New',
        message: 'Basic request',
        relationToProperty: undefined,
        budget: undefined,
        leadSource: undefined,
        agentContactId: undefined,
        homeownerContactId: undefined,
        addressId: undefined
      });
    });

    it('should handle contact creation failure', async () => {
      mockContactRepository.create.mockResolvedValueOnce(
        createMockRepositoryResult(null, false, 'Contact creation failed')
      );

      const result = await service.create(validRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create agent contact');
      expect(mockRequestRepository.create).not.toHaveBeenCalled();
    });

    it('should handle property creation failure', async () => {
      mockPropertyRepository.create.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Property creation failed')
      );

      const result = await service.create(validRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create property');
      expect(mockRequestRepository.create).not.toHaveBeenCalled();
    });

    it('should handle request creation failure', async () => {
      mockRequestRepository.create.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Request creation failed')
      );

      const result = await service.create(validRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request creation failed');
    });

    it('should validate budget format', async () => {
      const invalidBudgetData: RequestCreateData = {
        message: 'Test request',
        budget: 'not-a-number'
      };

      // Create the service and test validation
      const validationResult = await (service as any).validate(invalidBudgetData);
      
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'budget',
            message: 'Budget must be a valid number',
            code: 'INVALID_BUDGET'
          })
        ])
      );
    });

    it('should handle enhancement failure gracefully', async () => {
      const createdRequest = createMockRequest({ id: 'request-123' });
      mockRequestRepository.create.mockResolvedValue(createMockRepositoryResult(createdRequest));
      
      // Mock enhancement failure (related entity lookup failure)
      mockContactRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Contact lookup failed')
      );

      const result = await service.create({
        message: 'Test request',
        agentInfo: { email: 'agent@test.com' }
      });

      expect(result.success).toBe(true);
      expect(result.data!.agentSummary).toBeUndefined(); // Enhancement should fail gracefully
    });

    it('should handle unexpected errors', async () => {
      mockContactRepository.create.mockRejectedValue(new Error('Unexpected error'));

      const result = await service.create(validRequestData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create request: Unexpected error');
    });
  });

  describe('findById() - Enhanced Request Retrieval', () => {
    beforeEach(() => {
      const baseRequest = createMockRequest({ 
        id: 'request-123',
        agentContactId: 'agent-123',
        homeownerContactId: 'homeowner-456',
        addressId: 'property-789',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z'
      });

      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(baseRequest));

      // Mock related entities
      mockContactRepository.findById
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ 
          id: 'agent-123',
          fullName: 'Agent Name',
          email: 'agent@test.com',
          brokerage: 'Test Realty'
        })))
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ 
          id: 'homeowner-456',
          fullName: 'Owner Name',
          email: 'owner@test.com'
        })));

      mockPropertyRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockProperty({ 
          id: 'property-789',
          propertyFullAddress: '123 Main St',
          propertyType: 'Single Family',
          bedrooms: 3,
          bathrooms: 2
        }))
      );
    });

    it('should return enhanced request with all related data', async () => {
      const result = await service.findById('request-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const enhanced = result.data!;
      expect(enhanced.id).toBe('request-123');
      expect(enhanced.ageDays).toBeDefined();
      expect(enhanced.isPastDue).toBeDefined();
      expect(enhanced.nextActionRequired).toBeDefined();
      expect(enhanced.priorityScore).toBeDefined();

      expect(enhanced.agentSummary).toEqual({
        name: 'Agent Name',
        email: 'agent@test.com',
        phone: '',
        brokerage: 'Test Realty'
      });

      expect(enhanced.homeownerSummary).toEqual({
        name: 'Owner Name',
        email: 'owner@test.com',
        phone: ''
      });

      expect(enhanced.propertySummary).toEqual({
        address: '123 Main St',
        type: 'Single Family',
        bedrooms: 3,
        bathrooms: 2
      });
    });

    it('should handle request not found', async () => {
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Request not found')
      );

      const result = await service.findById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request not found');
    });

    it('should handle missing related entities gracefully', async () => {
      mockContactRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Contact not found')
      );
      mockPropertyRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Property not found')
      );

      const result = await service.findById('request-123');

      expect(result.success).toBe(true);
      expect(result.data!.agentSummary).toBeUndefined();
      expect(result.data!.homeownerSummary).toBeUndefined();
      expect(result.data!.propertySummary).toBeUndefined();
    });
  });

  describe('findAll() - Enhanced Request Listing', () => {
    it('should return enhanced requests list', async () => {
      const requests = [
        createMockRequest({ id: 'req-1' }),
        createMockRequest({ id: 'req-2' })
      ];

      mockRequestRepository.findAll.mockResolvedValue(
        createMockRepositoryResult(requests)
      );

      // Mock enhancement calls (simplified)
      mockContactRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false)
      );
      mockPropertyRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false)
      );

      const result = await service.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].ageDays).toBeDefined();
      expect(result.data![1].ageDays).toBeDefined();
    });

    it('should handle empty results', async () => {
      mockRequestRepository.findAll.mockResolvedValue(
        createMockRepositoryResult([])
      );

      const result = await service.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('processWorkflow() - Business Workflow Management', () => {
    beforeEach(() => {
      const currentRequest = createMockRequest({ 
        id: 'request-123',
        status: 'New'
      });

      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(currentRequest)
      );

      const updatedRequest = createMockRequest({ 
        id: 'request-123',
        status: 'Assigned'
      });

      mockRequestRepository.update.mockResolvedValue(
        createMockRepositoryResult(updatedRequest)
      );

      // Mock enhancement
      mockContactRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false)
      );
      mockPropertyRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false)
      );
    });

    it('should process assign workflow action', async () => {
      const result = await service.processWorkflow('request-123', 'assign', {
        assignedTo: 'agent-456'
      });

      expect(result.success).toBe(true);
      expect(mockRequestRepository.update).toHaveBeenCalledWith('request-123', {
        status: 'Assigned',
        assignedTo: 'agent-456',
        assignedDate: expect.any(String)
      });
    });

    it('should process startProgress workflow action', async () => {
      const result = await service.processWorkflow('request-123', 'startProgress');

      expect(result.success).toBe(true);
      expect(mockRequestRepository.update).toHaveBeenCalledWith('request-123', {
        status: 'In Progress'
      });
    });

    it('should process createQuote workflow action', async () => {
      const result = await service.processWorkflow('request-123', 'createQuote');

      expect(result.success).toBe(true);
      expect(mockRequestRepository.update).toHaveBeenCalledWith('request-123', {
        status: 'Quoted',
        moveToQuotingDate: expect.any(String)
      });
    });

    it('should process cancel workflow action', async () => {
      const result = await service.processWorkflow('request-123', 'cancel');

      expect(result.success).toBe(true);
      expect(mockRequestRepository.update).toHaveBeenCalledWith('request-123', {
        status: 'Cancelled',
        archivedDate: expect.any(String)
      });
    });

    it('should handle invalid workflow action', async () => {
      const result = await service.processWorkflow('request-123', 'invalidAction');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid workflow action');
    });

    it('should handle request not found', async () => {
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Request not found')
      );

      const result = await service.processWorkflow('nonexistent', 'assign');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request not found');
    });
  });

  describe('getBusinessState() - Business State Calculation', () => {
    it('should calculate business state for new request', async () => {
      const request = createMockRequest({
        id: 'request-123',
        status: 'New',
        createdAt: '2025-01-01T00:00:00Z'
      });

      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(request)
      );

      const result = await service.getBusinessState('request-123');

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('New');
      expect(result.data!.stage).toBe('Initial');
      expect(result.data!.nextActions).toContain('assign');
      expect(result.data!.metadata.ageDays).toBeDefined();
      expect(result.data!.metadata.isPastDue).toBeDefined();
      expect(result.data!.metadata.priorityScore).toBeDefined();
    });

    it('should calculate business state for in-progress request', async () => {
      const request = createMockRequest({
        status: 'In Progress',
        createdAt: '2025-01-01T00:00:00Z'
      });

      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(request)
      );

      const result = await service.getBusinessState('request-123');

      expect(result.success).toBe(true);
      expect(result.data!.stage).toBe('Assessment');
      expect(result.data!.nextActions).toContain('createQuote');
    });

    it('should handle request not found', async () => {
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Request not found')
      );

      const result = await service.getBusinessState('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request not found');
    });
  });

  describe('updateBusinessState() - State Updates', () => {
    it('should update business state', async () => {
      const updatedRequest = createMockRequest({ status: 'Assigned' });
      
      mockRequestRepository.update.mockResolvedValue(
        createMockRepositoryResult(updatedRequest)
      );

      // Mock enhancement
      mockContactRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false)
      );

      const result = await service.updateBusinessState('request-123', {
        status: 'Assigned'
      });

      expect(result.success).toBe(true);
      expect(mockRequestRepository.update).toHaveBeenCalledWith('request-123', {
        status: 'Assigned'
      });
    });
  });

  describe('getBusinessRules() - Business Rules', () => {
    it('should return business rules array', () => {
      const rules = service.getBusinessRules();

      expect(rules).toBeInstanceOf(Array);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty('name');
      expect(rules[0]).toHaveProperty('description');
      expect(rules[0]).toHaveProperty('condition');
      expect(rules[0]).toHaveProperty('action');
    });
  });

  describe('checkPermissions() - Permission System', () => {
    it('should check permissions for actions', async () => {
      const result = await service.checkPermissions('assign', 'user-123');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Business Logic Calculations', () => {
    describe('calculateAgeDays()', () => {
      it('should calculate age in days', () => {
        const request = createMockRequest({
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        });

        const ageDays = (service as any).calculateAgeDays(request);
        expect(ageDays).toBe(5);
      });

      it('should handle missing createdAt', () => {
        const request = createMockRequest({ createdAt: undefined });
        const ageDays = (service as any).calculateAgeDays(request);
        expect(ageDays).toBe(0);
      });
    });

    describe('calculateIsPastDue()', () => {
      it('should detect past due requests', () => {
        const request = createMockRequest({
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // Same as created
        });

        const isPastDue = (service as any).calculateIsPastDue(request);
        expect(isPastDue).toBe(true);
      });

      it('should not mark recent requests as past due', () => {
        const request = createMockRequest({
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        });

        const isPastDue = (service as any).calculateIsPastDue(request);
        expect(isPastDue).toBe(false);
      });

      it('should not mark requests with recent activity as past due', () => {
        const request = createMockRequest({
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // Updated 1 day ago
        });

        const isPastDue = (service as any).calculateIsPastDue(request);
        expect(isPastDue).toBe(false);
      });
    });

    describe('calculateNextAction()', () => {
      it('should suggest correct next action for each status', () => {
        const testCases = [
          { status: 'New', expected: 'Assign to team member' },
          { status: 'Assigned', expected: 'Begin initial assessment' },
          { status: 'In Progress', expected: 'Continue assessment or request more information' },
          { status: 'Needs Information', expected: 'Follow up with client for additional information' },
          { status: 'Quoted', expected: 'Follow up on quote status' }
        ];

        for (const testCase of testCases) {
          const request = createMockRequest({ status: testCase.status });
          const nextAction = (service as any).calculateNextAction(request);
          expect(nextAction).toBe(testCase.expected);
        }
      });
    });

    describe('calculatePriorityScore()', () => {
      it('should calculate priority score based on age', () => {
        const oldRequest = createMockRequest({
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days old
        });

        const score = (service as any).calculatePriorityScore(oldRequest);
        expect(score).toBeGreaterThan(20); // Age factor should contribute
      });

      it('should calculate priority score based on budget', () => {
        const highBudgetRequest = createMockRequest({
          budget: '150000' // High budget
        });

        const score = (service as any).calculatePriorityScore(highBudgetRequest);
        expect(score).toBeGreaterThan(15); // Budget factor should contribute
      });

      it('should calculate priority score based on lead source', () => {
        const referralRequest = createMockRequest({
          leadSource: 'referral'
        });

        const score = (service as any).calculatePriorityScore(referralRequest);
        expect(score).toBeGreaterThan(10); // Referral bonus
      });

      it('should cap priority score at 100', () => {
        const extremeRequest = createMockRequest({
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // Very old
          budget: '1000000', // Very high budget
          leadSource: 'referral'
        });

        const score = (service as any).calculatePriorityScore(extremeRequest);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    describe('calculateStage()', () => {
      it('should determine correct stage for each status', () => {
        const testCases = [
          { status: 'New', expected: 'Initial' },
          { status: 'Assigned', expected: 'Initial' },
          { status: 'In Progress', expected: 'Assessment' },
          { status: 'Needs Information', expected: 'Assessment' },
          { status: 'Quoted', expected: 'Quoted' },
          { status: 'Approved', expected: 'Execution' },
          { status: 'Completed', expected: 'Execution' },
          { status: 'Cancelled', expected: 'Closed' }
        ];

        for (const testCase of testCases) {
          const request = createMockRequest({ status: testCase.status });
          const stage = (service as any).calculateStage(request);
          expect(stage).toBe(testCase.expected);
        }
      });
    });

    describe('getNextActions()', () => {
      it('should return valid next actions for each status', () => {
        const testCases = [
          { status: 'New', expectedActions: ['assign', 'needsInfo'] },
          { status: 'Assigned', expectedActions: ['startProgress', 'needsInfo'] },
          { status: 'In Progress', expectedActions: ['createQuote', 'needsInfo', 'complete'] },
          { status: 'Quoted', expectedActions: ['approve', 'reviseQuote'] }
        ];

        for (const testCase of testCases) {
          const request = createMockRequest({ status: testCase.status });
          const actions = (service as any).getNextActions(request);
          
          for (const expectedAction of testCase.expectedActions) {
            expect(actions).toContain(expectedAction);
          }
          
          // All requests should have these universal actions
          expect(actions).toContain('updateStatus');
          expect(actions).toContain('cancel');
        }
      });
    });

    describe('getBlockedActions()', () => {
      it('should block quote creation without contacts', () => {
        const request = createMockRequest({
          homeownerContactId: undefined,
          agentContactId: undefined
        });

        const blockedActions = (service as any).getBlockedActions(request);
        expect(blockedActions).toContain('createQuote');
        expect(blockedActions).toContain('approve');
      });

      it('should block workflow actions for completed requests', () => {
        const request = createMockRequest({
          status: 'Completed'
        });

        const blockedActions = (service as any).getBlockedActions(request);
        expect(blockedActions).toContain('assign');
        expect(blockedActions).toContain('startProgress');
        expect(blockedActions).toContain('createQuote');
      });
    });
  });

  describe('Helper Methods', () => {
    describe('findOrCreateContact()', () => {
      it('should find existing contact by email', async () => {
        const existingContact = createMockContact({ id: 'existing-123' });
        mockContactRepository.findByEmail.mockResolvedValue(
          createMockRepositoryResult(existingContact)
        );

        const result = await (service as any).findOrCreateContact(
          { email: 'test@example.com' },
          'agent'
        );

        expect(result.success).toBe(true);
        expect(result.data.id).toBe('existing-123');
        expect(mockContactRepository.create).not.toHaveBeenCalled();
      });

      it('should create new contact when not found', async () => {
        mockContactRepository.findByEmail.mockResolvedValue(
          createMockRepositoryResult(null, false)
        );
        
        const newContact = createMockContact({ id: 'new-123' });
        mockContactRepository.create.mockResolvedValue(
          createMockRepositoryResult(newContact)
        );

        const result = await (service as any).findOrCreateContact(
          { email: 'new@example.com', firstName: 'New', lastName: 'Contact' },
          'homeowner'
        );

        expect(result.success).toBe(true);
        expect(mockContactRepository.create).toHaveBeenCalledWith({
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'Contact',
          contactType: 'homeowner'
        });
      });
    });

    describe('findOrCreateProperty()', () => {
      it('should find existing property by address', async () => {
        const existingProperty = createMockProperty({ id: 'existing-property' });
        mockPropertyRepository.findByAddress.mockResolvedValue(
          createMockRepositoryResult([existingProperty])
        );

        const result = await (service as any).findOrCreateProperty({
          houseAddress: '123 Main St',
          city: 'Test City'
        });

        expect(result.success).toBe(true);
        expect(result.data.id).toBe('existing-property');
        expect(mockPropertyRepository.create).not.toHaveBeenCalled();
      });

      it('should create new property when not found', async () => {
        mockPropertyRepository.findByAddress.mockResolvedValue(
          createMockRepositoryResult([])
        );
        
        const newProperty = createMockProperty({ id: 'new-property' });
        mockPropertyRepository.create.mockResolvedValue(
          createMockRepositoryResult(newProperty)
        );

        const result = await (service as any).findOrCreateProperty({
          houseAddress: '456 Oak Ave',
          city: 'New City',
          state: 'CA'
        });

        expect(result.success).toBe(true);
        expect(mockPropertyRepository.create).toHaveBeenCalledWith({
          houseAddress: '456 Oak Ave',
          city: 'New City',
          state: 'CA',
          propertyFullAddress: '456 Oak Ave, New City, CA'
        });
      });
    });

    describe('transformForPresentation()', () => {
      it('should transform request for presentation', async () => {
        const baseRequest = createMockRequest({ id: 'request-123' });
        
        // Mock enhancement dependencies
        mockContactRepository.findById.mockResolvedValue(
          createMockRepositoryResult(null, false)
        );
        mockPropertyRepository.findById.mockResolvedValue(
          createMockRepositoryResult(null, false)
        );

        const enhanced = await (service as any).transformForPresentation(baseRequest);

        expect(enhanced).toBeDefined();
        expect(enhanced.id).toBe('request-123');
        expect(enhanced.ageDays).toBeDefined();
        expect(enhanced.isPastDue).toBeDefined();
        expect(enhanced.nextActionRequired).toBeDefined();
        expect(enhanced.priorityScore).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mockRequestRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await service.findById('request-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    it('should handle contact lookup errors during enhancement', async () => {
      const request = createMockRequest({ agentContactId: 'agent-123' });
      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(request));
      mockContactRepository.findById.mockRejectedValue(new Error('Contact lookup failed'));

      const result = await service.findById('request-123');

      expect(result.success).toBe(true); // Should succeed despite enhancement failure
      expect(result.data!.agentSummary).toBeUndefined();
    });

    it('should handle workflow processing errors', async () => {
      mockRequestRepository.findById.mockRejectedValue(new Error('Workflow error'));

      const result = await service.processWorkflow('request-123', 'assign');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Workflow processing failed: Workflow error');
    });
  });
});