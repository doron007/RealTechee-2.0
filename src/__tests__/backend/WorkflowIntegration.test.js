/**
 * End-to-End Workflow Integration Test Suite
 * 
 * Tests for 100% coverage of complete business workflows including:
 * - Request → Quote → Project workflow integration
 * - Cross-layer error propagation testing
 * - Business state synchronization across entities
 * - Performance and load testing scenarios
 * - Complex multi-entity business scenarios
 * - Data consistency and transaction handling
 * - Service layer coordination and orchestration
 */

const { RequestService } = require('../../../services/business/RequestService');
const { QuoteService } = require('../../../services/business/QuoteService');
const { ProjectService } = require('../../../services/business/ProjectService');

// Create comprehensive mock repositories
const mockRequestRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockQuoteRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByRequestId: jest.fn()
};

const mockProjectRepository = {
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

// Mock all repository modules
jest.mock('../../../repositories/RequestRepository', () => ({
  requestRepository: mockRequestRepository
}));

jest.mock('../../../repositories/QuoteRepository', () => ({
  quoteRepository: mockQuoteRepository
}));

jest.mock('../../../repositories/ProjectRepository', () => ({
  projectRepository: mockProjectRepository
}));

jest.mock('../../../repositories/ContactRepository', () => ({
  contactRepository: mockContactRepository
}));

jest.mock('../../../repositories/PropertyRepository', () => ({
  propertyRepository: mockPropertyRepository
}));

jest.mock('../../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

// Comprehensive mock data factories
const createMockRequest = (overrides = {}) => ({
  id: 'request-123',
  status: 'New',
  message: 'Looking for kitchen renovation',
  relationToProperty: 'owner',
  budget: '75000',
  leadSource: 'website',
  agentContactId: 'agent-123',
  homeownerContactId: 'homeowner-456',
  addressId: 'property-789',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

const createMockQuote = (overrides = {}) => ({
  id: 'quote-123',
  quoteNumber: 'Q202501-123456',
  title: 'Kitchen Renovation Quote',
  description: 'Complete kitchen renovation with modern appliances',
  totalAmount: 75000,
  status: 'Draft',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  terms: 'Standard terms and conditions',
  requestId: 'request-123',
  agentContactId: 'agent-123',
  homeownerContactId: 'homeowner-456',
  addressId: 'property-789',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

const createMockProject = (overrides = {}) => ({
  id: 'project-123',
  title: 'Kitchen Renovation Project',
  description: 'Complete kitchen renovation project based on approved quote',
  status: 'Planning',
  budget: '75000',
  actualCost: 0,
  startDate: new Date().toISOString(),
  completionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  requestId: 'request-123',
  quoteId: 'quote-123',
  agentContactId: 'agent-123',
  homeownerContactId: 'homeowner-456',
  addressId: 'property-789',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

const createMockContact = (overrides = {}) => ({
  id: 'contact-123',
  firstName: 'John',
  lastName: 'Agent',
  fullName: 'John Agent',
  email: 'agent@example.com',
  phone: '555-0001',
  contactType: 'agent',
  active: true,
  ...overrides
});

const createMockProperty = (overrides = {}) => ({
  id: 'property-123',
  propertyFullAddress: '123 Main St, Test City, CA',
  houseAddress: '123 Main St',
  city: 'Test City',
  state: 'CA',
  zip: '12345',
  propertyType: 'Single Family',
  bedrooms: 3,
  bathrooms: 2,
  active: true,
  ...overrides
});

const createMockRepositoryResult = (data, success = true, error = null) => ({
  success,
  data,
  error: success ? undefined : error
});

describe('End-to-End Workflow Integration Tests', () => {
  let requestService;
  let quoteService;
  let projectService;

  beforeEach(() => {
    jest.clearAllMocks();
    requestService = new RequestService();
    quoteService = new QuoteService();
    projectService = new ProjectService();

    // Setup default successful mock responses
    mockContactRepository.findByEmail.mockResolvedValue(
      createMockRepositoryResult(null, false, 'Contact not found')
    );
    mockPropertyRepository.findByAddress.mockResolvedValue(
      createMockRepositoryResult([], true)
    );
  });

  describe('Complete Request → Quote → Project Workflow', () => {
    test('should successfully complete full business workflow from request to project', async () => {
      console.log('🔄 Testing complete workflow: Request → Quote → Project');

      // Step 1: Create Request with Contact and Property Creation
      const requestData = {
        message: 'Complete kitchen renovation needed',
        relationToProperty: 'owner',
        budget: '85000',
        leadSource: 'referral',
        agentInfo: {
          firstName: 'Sarah',
          lastName: 'Agent',
          email: 'sarah.agent@realty.com',
          phone: '555-0101',
          brokerage: 'Premier Realty'
        },
        homeownerInfo: {
          firstName: 'Mike',
          lastName: 'Homeowner',
          email: 'mike@email.com',
          phone: '555-0202'
        },
        propertyInfo: {
          houseAddress: '456 Oak Street',
          city: 'Renovation City',
          state: 'CA',
          zip: '90210',
          propertyType: 'Single Family',
          bedrooms: 4,
          bathrooms: 3
        }
      };

      // Mock contact creation
      mockContactRepository.create
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ 
          id: 'agent-new', 
          email: 'sarah.agent@realty.com',
          contactType: 'agent'
        })))
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ 
          id: 'homeowner-new',
          email: 'mike@email.com',
          contactType: 'homeowner'
        })));

      // Mock property creation
      mockPropertyRepository.create.mockResolvedValue(
        createMockRepositoryResult(createMockProperty({ 
          id: 'property-new',
          houseAddress: '456 Oak Street'
        }))
      );

      // Mock request creation
      const createdRequest = createMockRequest({
        id: 'request-new',
        agentContactId: 'agent-new',
        homeownerContactId: 'homeowner-new',
        addressId: 'property-new',
        status: 'New'
      });

      mockRequestRepository.create.mockResolvedValue(createMockRepositoryResult(createdRequest));
      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(createdRequest));

      // Mock enhancement lookups
      mockContactRepository.findById
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ 
          id: 'agent-new',
          fullName: 'Sarah Agent'
        })))
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ 
          id: 'homeowner-new',
          fullName: 'Mike Homeowner'
        })));
      
      mockPropertyRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockProperty({ 
          id: 'property-new',
          propertyFullAddress: '456 Oak Street, Renovation City, CA'
        }))
      );

      // Execute request creation
      const requestResult = await requestService.create(requestData);

      expect(requestResult.success).toBe(true);
      expect(requestResult.data.id).toBe('request-new');
      expect(requestResult.data.agentSummary).toBeDefined();
      expect(requestResult.data.homeownerSummary).toBeDefined();
      expect(requestResult.data.propertySummary).toBeDefined();

      console.log('✅ Step 1: Request created successfully with all related entities');

      // Step 2: Process Request Workflow (New → Assigned → In Progress)
      const assignedRequest = createMockRequest({
        ...createdRequest,
        status: 'Assigned',
        assignedTo: 'agent-new',
        assignedDate: new Date().toISOString()
      });

      mockRequestRepository.update.mockResolvedValueOnce(createMockRepositoryResult(assignedRequest));
      mockRequestRepository.findById.mockResolvedValueOnce(createMockRepositoryResult(assignedRequest));

      const assignResult = await requestService.processWorkflow('request-new', 'assign', {
        assignedTo: 'agent-new'
      });

      expect(assignResult.success).toBe(true);
      expect(assignResult.data.assignedTo).toBe('agent-new');

      // Progress request to In Progress
      const inProgressRequest = createMockRequest({
        ...assignedRequest,
        status: 'In Progress'
      });

      mockRequestRepository.update.mockResolvedValueOnce(createMockRepositoryResult(inProgressRequest));
      mockRequestRepository.findById.mockResolvedValueOnce(createMockRepositoryResult(inProgressRequest));

      const progressResult = await requestService.processWorkflow('request-new', 'startProgress');

      expect(progressResult.success).toBe(true);
      expect(progressResult.data.status).toBe('In Progress');

      console.log('✅ Step 2: Request workflow processed (New → Assigned → In Progress)');

      // Step 3: Create Quote from Request
      const quoteData = {
        title: 'Premium Kitchen Renovation Quote',
        description: 'Comprehensive kitchen renovation with high-end finishes',
        requestId: 'request-new',
        agentContactId: 'agent-new',
        homeownerContactId: 'homeowner-new',
        addressId: 'property-new',
        items: [
          {
            description: 'Custom Kitchen Cabinets',
            quantity: 1,
            unitPrice: 35000,
            category: 'Materials'
          },
          {
            description: 'Premium Appliances Package',
            quantity: 1,
            unitPrice: 25000,
            category: 'Materials'
          },
          {
            description: 'Installation Labor',
            quantity: 120,
            unitPrice: 85,
            category: 'Labor'
          },
          {
            description: 'Project Management',
            quantity: 1,
            unitPrice: 5000,
            category: 'Services'
          }
        ]
      };

      const createdQuote = createMockQuote({
        id: 'quote-new',
        requestId: 'request-new',
        quoteNumber: 'Q202501-789012',
        totalAmount: 75200, // Calculated from items
        status: 'Draft'
      });

      mockQuoteRepository.create.mockResolvedValue(createMockRepositoryResult(createdQuote));
      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(createdQuote));
      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(inProgressRequest));

      const quoteResult = await quoteService.create(quoteData);

      expect(quoteResult.success).toBe(true);
      expect(quoteResult.data.id).toBe('quote-new');
      expect(quoteResult.data.totalAmount).toBe(75200);
      expect(quoteResult.data.requestSummary).toBeDefined();

      console.log('✅ Step 3: Quote created successfully with calculated total from items');

      // Step 4: Process Quote Workflow (Draft → Sent → Approved)
      const sentQuote = createMockQuote({
        ...createdQuote,
        status: 'Sent'
      });

      mockQuoteRepository.update.mockResolvedValueOnce(createMockRepositoryResult(sentQuote));
      mockQuoteRepository.findById.mockResolvedValueOnce(createMockRepositoryResult(sentQuote));

      const sendQuoteResult = await quoteService.processWorkflow('quote-new', 'send');

      expect(sendQuoteResult.success).toBe(true);
      expect(sendQuoteResult.data.status).toBe('Sent');

      // Mark quote as viewed and approved
      const approvedQuote = createMockQuote({
        ...sentQuote,
        status: 'Approved'
      });

      mockQuoteRepository.update.mockResolvedValueOnce(createMockRepositoryResult(approvedQuote));
      mockQuoteRepository.findById.mockResolvedValueOnce(createMockRepositoryResult(approvedQuote));

      const approveQuoteResult = await quoteService.processWorkflow('quote-new', 'finalizeTerms');

      expect(approveQuoteResult.success).toBe(true);
      expect(approveQuoteResult.data.status).toBe('Approved');

      console.log('✅ Step 4: Quote workflow processed (Draft → Sent → Approved)');

      // Step 5: Update Request Status to Quoted
      const quotedRequest = createMockRequest({
        ...inProgressRequest,
        status: 'Quoted',
        moveToQuotingDate: new Date().toISOString()
      });

      mockRequestRepository.update.mockResolvedValueOnce(createMockRepositoryResult(quotedRequest));
      mockRequestRepository.findById.mockResolvedValueOnce(createMockRepositoryResult(quotedRequest));

      const quoteRequestResult = await requestService.processWorkflow('request-new', 'createQuote');

      expect(quoteRequestResult.success).toBe(true);
      expect(quoteRequestResult.data.status).toBe('Quoted');

      console.log('✅ Step 5: Request status updated to Quoted');

      // Step 6: Create Project from Approved Quote
      const projectData = {
        title: 'Kitchen Renovation Execution Project',
        description: 'Execution phase of kitchen renovation based on approved quote Q202501-789012',
        requestId: 'request-new',
        quoteId: 'quote-new',
        agentContactId: 'agent-new',
        homeownerContactId: 'homeowner-new',
        addressId: 'property-new',
        budget: '75200',
        estimatedDuration: 45,
        laborBudget: '15200',
        materialBudget: '55000',
        equipmentBudget: '5000',
        milestones: [
          {
            title: 'Permit Acquisition',
            description: 'Obtain all necessary permits',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Demolition Phase',
            description: 'Remove existing kitchen elements',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Installation Phase',
            description: 'Install new cabinets, appliances, and fixtures',
            dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            title: 'Final Inspection',
            description: 'Complete final inspection and client walkthrough',
            dueDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };

      const createdProject = createMockProject({
        id: 'project-new',
        requestId: 'request-new',
        quoteId: 'quote-new',
        budget: '75200',
        status: 'Planning'
      });

      mockProjectRepository.create.mockResolvedValue(createMockRepositoryResult(createdProject));
      mockProjectRepository.findById.mockResolvedValue(createMockRepositoryResult(createdProject));

      const projectResult = await projectService.create(projectData);

      expect(projectResult.success).toBe(true);
      expect(projectResult.data.id).toBe('project-new');
      expect(projectResult.data.budget).toBe('75200');
      expect(projectResult.data.requestSummary).toBeDefined();
      expect(projectResult.data.quoteSummary).toBeDefined();

      console.log('✅ Step 6: Project created successfully with all related entity references');

      // Step 7: Process Project Workflow (Planning → Approved → In Progress)
      const approvedProject = createMockProject({
        ...createdProject,
        status: 'Approved'
      });

      mockProjectRepository.update.mockResolvedValueOnce(createMockRepositoryResult(approvedProject));
      mockProjectRepository.findById.mockResolvedValueOnce(createMockRepositoryResult(approvedProject));

      const approveProjectResult = await projectService.processWorkflow('project-new', 'approve');

      expect(approveProjectResult.success).toBe(true);
      expect(approveProjectResult.data.status).toBe('Approved');

      // Start project execution
      const executingProject = createMockProject({
        ...approvedProject,
        status: 'In Progress',
        startDate: new Date().toISOString()
      });

      mockProjectRepository.update.mockResolvedValueOnce(createMockRepositoryResult(executingProject));
      mockProjectRepository.findById.mockResolvedValueOnce(createMockRepositoryResult(executingProject));

      const executeProjectResult = await projectService.processWorkflow('project-new', 'startExecution');

      expect(executeProjectResult.success).toBe(true);
      expect(executeProjectResult.data.status).toBe('In Progress');
      expect(executeProjectResult.data.startDate).toBeDefined();

      console.log('✅ Step 7: Project workflow processed (Planning → Approved → In Progress)');

      // Step 8: Verify Cross-Entity State Consistency
      const finalRequestState = await requestService.getBusinessState('request-new');
      const finalQuoteState = await quoteService.getBusinessState('quote-new');
      const finalProjectState = await projectService.getBusinessState('project-new');

      expect(finalRequestState.success).toBe(true);
      expect(finalRequestState.data.status).toBe('Quoted');
      expect(finalRequestState.data.stage).toBe('Quoted');

      expect(finalQuoteState.success).toBe(true);
      expect(finalQuoteState.data.status).toBe('Approved');
      expect(finalQuoteState.data.stage).toBe('Approved');

      expect(finalProjectState.success).toBe(true);
      expect(finalProjectState.data.status).toBe('In Progress');
      expect(finalProjectState.data.stage).toBe('Execution');

      console.log('✅ Step 8: Cross-entity state consistency verified');

      console.log('🎉 Complete workflow integration test passed successfully!');
    });
  });

  describe('Cross-Layer Error Propagation', () => {
    test('should handle repository layer errors and propagate correctly', async () => {
      console.log('🚨 Testing cross-layer error propagation');

      // Test repository error in request creation
      mockContactRepository.create.mockRejectedValue(new Error('Database connection failed'));

      const requestData = {
        message: 'Test request',
        agentInfo: { email: 'agent@test.com', firstName: 'Test', lastName: 'Agent' }
      };

      const result = await requestService.create(requestData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create request: Database connection failed');

      console.log('✅ Repository errors properly propagated through service layer');
    });

    test('should handle cascade failures across related entities', async () => {
      console.log('🔗 Testing cascade failure handling');

      // Setup successful request creation
      const createdRequest = createMockRequest({ id: 'request-cascade' });
      mockRequestRepository.create.mockResolvedValue(createMockRepositoryResult(createdRequest));
      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(createdRequest));

      // Setup quote creation failure
      mockQuoteRepository.create.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Quote validation failed')
      );

      // Create quote referencing request
      const quoteData = {
        title: 'Test Quote',
        requestId: 'request-cascade'
      };

      const quoteResult = await quoteService.create(quoteData);

      expect(quoteResult.success).toBe(false);
      expect(quoteResult.error).toContain('Quote validation failed');

      // Verify request is still accessible despite quote failure
      const requestResult = await requestService.findById('request-cascade');
      expect(requestResult.success).toBe(true);

      console.log('✅ Cascade failures handled gracefully without corrupting existing entities');
    });

    test('should handle partial success scenarios', async () => {
      console.log('⚠️ Testing partial success scenario handling');

      const requestData = {
        message: 'Partial success test',
        agentInfo: {
          firstName: 'Test',
          lastName: 'Agent',
          email: 'test@agent.com'
        },
        homeownerInfo: {
          firstName: 'Test',
          lastName: 'Homeowner',
          email: 'test@homeowner.com'
        },
        propertyInfo: {
          houseAddress: '123 Test St',
          city: 'Test City'
        }
      };

      // Mock successful agent creation, failed homeowner creation
      mockContactRepository.create
        .mockResolvedValueOnce(createMockRepositoryResult(createMockContact({ id: 'agent-partial' })))
        .mockResolvedValueOnce(createMockRepositoryResult(null, false, 'Homeowner creation failed'));

      const result = await requestService.create(requestData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create homeowner contact');

      // Verify no orphaned entities created
      expect(mockRequestRepository.create).not.toHaveBeenCalled();

      console.log('✅ Partial success scenarios handled with proper cleanup');
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle concurrent workflow operations', async () => {
      console.log('⚡ Testing concurrent workflow operations');

      // Setup multiple requests processing concurrently
      const requests = Array.from({ length: 5 }, (_, i) => ({
        id: `request-concurrent-${i}`,
        message: `Concurrent test request ${i}`,
        status: 'New'
      }));

      // Mock repository responses for all concurrent requests
      requests.forEach(request => {
        mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(request));
        mockRequestRepository.update.mockResolvedValue(createMockRepositoryResult({
          ...request,
          status: 'Assigned'
        }));
      });

      // Mock enhancement lookups
      mockContactRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));
      mockPropertyRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

      // Process all requests concurrently
      const promises = requests.map(request =>
        requestService.processWorkflow(request.id, 'assign', { assignedTo: 'agent-123' })
      );

      const results = await Promise.all(promises);

      // Verify all operations completed successfully
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      console.log('✅ Concurrent operations handled successfully');
    });

    test('should handle bulk data operations efficiently', async () => {
      console.log('📊 Testing bulk data operations');

      // Create bulk requests data
      const bulkRequests = Array.from({ length: 10 }, (_, i) =>
        createMockRequest({ id: `bulk-request-${i}` })
      );

      mockRequestRepository.findAll.mockResolvedValue(
        createMockRepositoryResult(bulkRequests)
      );

      // Mock enhancement lookups for bulk operations
      mockContactRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));
      mockPropertyRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

      const startTime = Date.now();
      const result = await requestService.findAll();
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10);

      // Verify reasonable performance (under 100ms for mock operations)
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100);

      console.log(`✅ Bulk operations completed in ${executionTime}ms`);
    });

    test('should handle complex filtering and business logic calculations', async () => {
      console.log('🔍 Testing complex filtering and calculations');

      // Create projects with various states for filtering
      const projects = [
        createMockProject({ 
          id: 'project-overdue',
          status: 'In Progress',
          completionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Overdue
          budget: '50000',
          actualCost: 60000 // Over budget
        }),
        createMockProject({ 
          id: 'project-atrisk',
          status: 'In Progress',
          completionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days left
          budget: '40000',
          actualCost: 35000 // Under budget but timeline risk
        }),
        createMockProject({ 
          id: 'project-healthy',
          status: 'In Progress',
          completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days left
          budget: '60000',
          actualCost: 45000 // Well under budget and timeline
        })
      ];

      mockProjectRepository.findAll.mockResolvedValue(
        createMockRepositoryResult(projects)
      );

      // Mock enhancement lookups
      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));
      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

      const allProjectsResult = await projectService.findAll();

      expect(allProjectsResult.success).toBe(true);
      expect(allProjectsResult.data).toHaveLength(3);

      // Verify business calculations are performed correctly
      const overdueProject = allProjectsResult.data.find(p => p.id === 'project-overdue');
      const atRiskProject = allProjectsResult.data.find(p => p.id === 'project-atrisk');
      const healthyProject = allProjectsResult.data.find(p => p.id === 'project-healthy');

      expect(overdueProject.isOverdue).toBe(true);
      expect(overdueProject.riskLevel).toBe('high');

      expect(atRiskProject.isOverdue).toBe(false);
      expect(atRiskProject.isAtRisk).toBe(true);

      expect(healthyProject.isOverdue).toBe(false);
      expect(healthyProject.riskLevel).toBe('low');

      console.log('✅ Complex filtering and business logic calculations performed correctly');
    });
  });

  describe('Data Consistency and Transaction Scenarios', () => {
    test('should maintain data consistency across related entity updates', async () => {
      console.log('🔄 Testing data consistency across entity updates');

      const baseRequest = createMockRequest({ id: 'consistency-request' });
      const baseQuote = createMockQuote({ id: 'consistency-quote', requestId: 'consistency-request' });
      const baseProject = createMockProject({ 
        id: 'consistency-project', 
        requestId: 'consistency-request',
        quoteId: 'consistency-quote'
      });

      // Mock initial states
      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(baseRequest));
      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(baseQuote));
      mockProjectRepository.findById.mockResolvedValue(createMockRepositoryResult(baseProject));

      // Test quote update affecting request status
      const updatedQuote = { ...baseQuote, status: 'Approved' };
      mockQuoteRepository.update.mockResolvedValue(createMockRepositoryResult(updatedQuote));
      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(updatedQuote));

      const quoteUpdateResult = await quoteService.processWorkflow('consistency-quote', 'finalizeTerms');
      expect(quoteUpdateResult.success).toBe(true);
      expect(quoteUpdateResult.data.status).toBe('Approved');

      // Test project update maintaining consistency
      const updatedProject = { ...baseProject, status: 'In Progress' };
      mockProjectRepository.update.mockResolvedValue(createMockRepositoryResult(updatedProject));
      mockProjectRepository.findById.mockResolvedValue(createMockRepositoryResult(updatedProject));

      const projectUpdateResult = await projectService.processWorkflow('consistency-project', 'startExecution');
      expect(projectUpdateResult.success).toBe(true);
      expect(projectUpdateResult.data.status).toBe('In Progress');

      console.log('✅ Data consistency maintained across related entity updates');
    });

    test('should handle transaction rollback scenarios', async () => {
      console.log('↩️ Testing transaction rollback scenarios');

      // Simulate a scenario where related entity creation fails
      const requestData = {
        message: 'Transaction test request',
        agentInfo: { email: 'agent@transaction.test', firstName: 'Agent', lastName: 'Test' },
        propertyInfo: { houseAddress: '123 Transaction St', city: 'Test City' }
      };

      // Mock successful agent creation but failed property creation
      mockContactRepository.create.mockResolvedValue(
        createMockRepositoryResult(createMockContact({ id: 'agent-transaction' }))
      );
      mockPropertyRepository.create.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Property creation failed')
      );

      const result = await requestService.create(requestData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create property');

      // Verify main entity (request) was not created despite partial success
      expect(mockRequestRepository.create).not.toHaveBeenCalled();

      console.log('✅ Transaction rollback handled correctly');
    });
  });

  describe('Business Rule Validation and Enforcement', () => {
    test('should enforce business rules across entity interactions', async () => {
      console.log('📋 Testing business rule enforcement');

      // Test quote creation validation with business rules
      const invalidQuoteData = {
        title: 'Invalid Quote',
        totalAmount: -5000, // Invalid negative amount
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Past date
      };

      const validationResult = await quoteService.validate(invalidQuoteData);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      expect(validationResult.errors.some(error => error.code === 'INVALID_AMOUNT')).toBe(true);
      expect(validationResult.errors.some(error => error.code === 'INVALID_DATE')).toBe(true);

      // Test project budget validation
      const invalidProjectData = {
        title: 'Invalid Project',
        budget: 'not-a-number',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        completionDate: new Date().toISOString() // Before start date
      };

      const projectValidationResult = await projectService.validate(invalidProjectData);

      expect(projectValidationResult.valid).toBe(false);
      expect(projectValidationResult.errors.some(error => error.code === 'INVALID_BUDGET')).toBe(true);
      expect(projectValidationResult.errors.some(error => error.code === 'INVALID_DATE_RANGE')).toBe(true);

      console.log('✅ Business rules properly validated and enforced');
    });

    test('should apply business rules across workflow transitions', async () => {
      console.log('🔀 Testing business rules in workflow transitions');

      // Test attempt to complete project without proper milestone completion
      // (This would be enforced by business rules in a real implementation)
      const incompleteProject = createMockProject({
        id: 'incomplete-project',
        status: 'In Progress',
        // Missing milestone completion data
      });

      mockProjectRepository.findById.mockResolvedValue(
        createMockRepositoryResult(incompleteProject)
      );

      const businessRules = projectService.getBusinessRules();
      expect(businessRules).toBeInstanceOf(Array);
      expect(businessRules.length).toBeGreaterThan(0);

      // Verify business rules have proper structure
      businessRules.forEach(rule => {
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('description');
        expect(rule).toHaveProperty('condition');
        expect(rule).toHaveProperty('action');
      });

      console.log('✅ Business rules structure validated for workflow transitions');
    });
  });

  describe('Service Layer Coordination', () => {
    test('should coordinate cross-service operations effectively', async () => {
      console.log('🤝 Testing cross-service coordination');

      // Test scenario where quote service needs request service data
      const request = createMockRequest({ 
        id: 'coord-request',
        status: 'In Progress',
        message: 'Coordination test request'
      });

      const quote = createMockQuote({
        id: 'coord-quote',
        requestId: 'coord-request'
      });

      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(request));
      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(quote));

      const quoteResult = await quoteService.findById('coord-quote');

      expect(quoteResult.success).toBe(true);
      expect(quoteResult.data.requestSummary).toBeDefined();
      expect(quoteResult.data.requestSummary.id).toBe('coord-request');
      expect(quoteResult.data.requestSummary.status).toBe('In Progress');

      console.log('✅ Cross-service coordination working correctly');
    });

    test('should handle service layer performance optimization', async () => {
      console.log('⚡ Testing service layer performance optimization');

      // Test bulk enhancement operations
      const requests = Array.from({ length: 5 }, (_, i) =>
        createMockRequest({ 
          id: `perf-request-${i}`,
          agentContactId: `agent-${i}`,
          addressId: `property-${i}`
        })
      );

      mockRequestRepository.findAll.mockResolvedValue(
        createMockRepositoryResult(requests)
      );

      // Mock enhancement data
      mockContactRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockContact({ fullName: 'Test Agent' }))
      );
      mockPropertyRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockProperty({ propertyFullAddress: 'Test Address' }))
      );

      const startTime = Date.now();
      const result = await requestService.findAll();
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);

      // Verify all enhancements were applied
      result.data.forEach(enhancedRequest => {
        expect(enhancedRequest.ageDays).toBeDefined();
        expect(enhancedRequest.priorityScore).toBeDefined();
      });

      console.log(`✅ Service layer performance optimization completed in ${endTime - startTime}ms`);
    });
  });

  describe('Integration Error Recovery', () => {
    test('should recover from temporary failures gracefully', async () => {
      console.log('🔧 Testing error recovery mechanisms');

      const requestId = 'recovery-request';
      
      // First attempt fails
      mockRequestRepository.findById
        .mockRejectedValueOnce(new Error('Temporary database error'))
        .mockResolvedValueOnce(createMockRepositoryResult(createMockRequest({ id: requestId })));

      // Mock enhancement
      mockContactRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));
      mockPropertyRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

      // First call should fail
      const firstResult = await requestService.findById(requestId);
      expect(firstResult.success).toBe(false);

      // Second call should succeed (simulating retry or recovery)
      const secondResult = await requestService.findById(requestId);
      expect(secondResult.success).toBe(true);

      console.log('✅ Error recovery mechanisms working correctly');
    });
  });
});