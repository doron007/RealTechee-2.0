/**
 * ProjectService (Business Layer) - Comprehensive Test Suite
 * 
 * Tests for 100% coverage of business logic ProjectService including:
 * - Enhanced CRUD operations with project-specific logic
 * - Milestone and budget management
 * - Status workflow management and transitions  
 * - Progress and risk calculations
 * - Business state and metrics management
 * - Project performance tracking
 * - Validation rules and business constraints
 * - Error handling and resilience
 */

const { ProjectService } = require('../../../services/business/ProjectService');

// Create mock repositories manually to avoid TypeScript issues
const mockProjectRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockRequestRepository = {
  findById: jest.fn()
};

const mockQuoteRepository = {
  findById: jest.fn()
};

// Mock the repository modules
jest.mock('../../../repositories/ProjectRepository', () => ({
  projectRepository: mockProjectRepository
}));

jest.mock('../../../repositories/RequestRepository', () => ({
  requestRepository: mockRequestRepository
}));

jest.mock('../../../repositories/QuoteRepository', () => ({
  quoteRepository: mockQuoteRepository
}));

jest.mock('../../../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

// Mock data factories
const createMockProject = (overrides = {}) => ({
  id: 'project-123',
  title: 'Kitchen Renovation Project',
  description: 'Complete kitchen renovation with modern appliances',
  status: 'Planning',
  budget: '75000',
  actualCost: 65000,
  startDate: new Date().toISOString(),
  completionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
  requestId: 'request-123',
  quoteId: 'quote-123',
  agentContactId: 'agent-123',
  homeownerContactId: 'homeowner-123',
  addressId: 'address-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

const createMockRequest = (overrides = {}) => ({
  id: 'request-123',
  status: 'Approved',
  message: 'Kitchen renovation request',
  ...overrides
});

const createMockQuote = (overrides = {}) => ({
  id: 'quote-123',
  quoteNumber: 'Q202501-123456',
  totalAmount: 75000,
  ...overrides
});

const createMockRepositoryResult = (data, success = true, error = null) => ({
  success,
  data,
  error: success ? undefined : error
});

describe('ProjectService (Business Layer) - Complete Coverage', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectService();
  });

  describe('Initialization & Setup', () => {
    test('should initialize with validation rules', () => {
      expect(service).toBeInstanceOf(ProjectService);
      // Validation rules should be set up in constructor
      expect(service.validationRules.length).toBeGreaterThan(0);
    });
  });

  describe('create() - Enhanced Project Creation', () => {
    const validProjectData = {
      title: 'Bathroom Renovation',
      description: 'Complete bathroom renovation',
      budget: '50000',
      requestId: 'request-123',
      laborBudget: '25000',
      materialBudget: '20000',
      equipmentBudget: '5000',
      contingencyPercentage: 10,
      milestones: [
        {
          title: 'Design Phase',
          description: 'Complete design and planning',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          title: 'Construction Phase',
          description: 'Complete renovation work',
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    beforeEach(() => {
      const createdProject = createMockProject({
        id: 'new-project-123',
        ...validProjectData,
        status: 'Planning'
      });
      
      mockProjectRepository.create.mockResolvedValue(createMockRepositoryResult(createdProject));
      mockProjectRepository.findById.mockResolvedValue(createMockRepositoryResult(createdProject));
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockRequest({ id: 'request-123' }))
      );
      mockQuoteRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockQuote({ id: 'quote-123' }))
      );
    });

    test('should create project with business workflow', async () => {
      const result = await service.create(validProjectData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('new-project-123');
      expect(result.data.ageDays).toBeDefined();
      expect(result.data.daysToCompletion).toBeDefined();
      expect(result.data.isOverdue).toBeDefined();
      expect(result.data.progressPercentage).toBeDefined();
      expect(result.data.riskLevel).toBeDefined();

      // Verify project creation with calculated budget
      const createCall = mockProjectRepository.create.mock.calls[0][0];
      expect(createCall.budget).toBe('55000'); // 25000 + 20000 + 5000 + 10% contingency
      expect(createCall.status).toBe('Planning');
    });

    test('should set default status if not provided', async () => {
      const result = await service.create({ title: 'Test Project' });

      expect(result.success).toBe(true);
      const createCall = mockProjectRepository.create.mock.calls[0][0];
      expect(createCall.status).toBe('Planning');
    });

    test('should calculate total budget from components', async () => {
      const projectWithBudgetComponents = {
        title: 'Test Project',
        laborBudget: '30000',
        materialBudget: '15000',
        equipmentBudget: '5000',
        contingencyPercentage: 20
      };

      const result = await service.create(projectWithBudgetComponents);

      expect(result.success).toBe(true);
      const createCall = mockProjectRepository.create.mock.calls[0][0];
      expect(createCall.budget).toBe('60000'); // (30000 + 15000 + 5000) * 1.2
    });

    test('should handle project creation failure', async () => {
      mockProjectRepository.create.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Project creation failed')
      );

      const result = await service.create(validProjectData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project creation failed');
    });

    test('should validate budget format', async () => {
      const invalidProjectData = {
        title: 'Test Project',
        budget: 'invalid-budget'
      };

      const validationResult = await service.validate(invalidProjectData);
      
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

    test('should validate budget amount', async () => {
      const invalidProjectData = {
        title: 'Test Project',
        budget: '0'
      };

      const validationResult = await service.validate(invalidProjectData);
      
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'budget',
            message: 'Budget must be greater than zero',
            code: 'INVALID_BUDGET_AMOUNT'
          })
        ])
      );
    });

    test('should validate date range', async () => {
      const invalidProjectData = {
        title: 'Test Project',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        completionDate: new Date().toISOString() // Today
      };

      const validationResult = await service.validate(invalidProjectData);
      
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'completionDate',
            message: 'Completion date must be after start date',
            code: 'INVALID_DATE_RANGE'
          })
        ])
      );
    });

    test('should handle enhancement failure gracefully', async () => {
      const createdProject = createMockProject();
      mockProjectRepository.create.mockResolvedValue(createMockRepositoryResult(createdProject));
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Request not found')
      );

      const result = await service.create(validProjectData);

      expect(result.success).toBe(true);
      expect(result.data.requestSummary).toBeUndefined(); // Enhancement should fail gracefully
    });

    test('should handle unexpected errors', async () => {
      mockProjectRepository.create.mockRejectedValue(new Error('Unexpected error'));

      const result = await service.create(validProjectData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create project: Unexpected error');
    });
  });

  describe('findById() - Enhanced Project Retrieval', () => {
    beforeEach(() => {
      const project = createMockProject({
        requestId: 'request-123',
        quoteId: 'quote-123',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days old
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Started 5 days ago
        completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'In Progress'
      });

      mockProjectRepository.findById.mockResolvedValue(createMockRepositoryResult(project));
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockRequest())
      );
      mockQuoteRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockQuote())
      );
    });

    test('should return enhanced project with business data', async () => {
      const result = await service.findById('project-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const enhanced = result.data;
      expect(enhanced.id).toBe('project-123');
      expect(enhanced.ageDays).toBe(10);
      expect(enhanced.daysToCompletion).toBe(30);
      expect(enhanced.isOverdue).toBe(false);
      expect(enhanced.progressPercentage).toBeDefined();
      expect(enhanced.budgetVariance).toBeDefined();
      expect(enhanced.profitability).toBeDefined();
      expect(enhanced.riskLevel).toBeDefined();
      expect(enhanced.requestSummary).toBeDefined();
      expect(enhanced.quoteSummary).toBeDefined();
    });

    test('should handle project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Project not found')
      );

      const result = await service.findById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project not found');
    });
  });

  describe('processWorkflow() - Business Workflow Management', () => {
    beforeEach(() => {
      const currentProject = createMockProject({
        status: 'Planning'
      });

      mockProjectRepository.findById.mockResolvedValue(createMockRepositoryResult(currentProject));
      
      const updatedProject = createMockProject({
        status: 'Approved'
      });
      mockProjectRepository.update.mockResolvedValue(createMockRepositoryResult(updatedProject));

      // Mock enhancement
      mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));
      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));
    });

    test('should process approve workflow action', async () => {
      const result = await service.processWorkflow('project-123', 'approve');

      expect(result.success).toBe(true);
      expect(mockProjectRepository.update).toHaveBeenCalledWith('project-123', {
        status: 'Approved'
      });
    });

    test('should process startExecution workflow action', async () => {
      const result = await service.processWorkflow('project-123', 'startExecution');

      expect(result.success).toBe(true);
      expect(mockProjectRepository.update).toHaveBeenCalledWith('project-123', {
        status: 'In Progress',
        startDate: expect.any(String)
      });
    });

    test('should process putOnHold workflow action', async () => {
      const result = await service.processWorkflow('project-123', 'putOnHold');

      expect(result.success).toBe(true);
      expect(mockProjectRepository.update).toHaveBeenCalledWith('project-123', {
        status: 'On Hold'
      });
    });

    test('should process complete workflow action', async () => {
      const result = await service.processWorkflow('project-123', 'complete');

      expect(result.success).toBe(true);
      expect(mockProjectRepository.update).toHaveBeenCalledWith('project-123', {
        status: 'Completed',
        completionDate: expect.any(String)
      });
    });

    test('should process archive workflow action', async () => {
      const result = await service.processWorkflow('project-123', 'archive');

      expect(result.success).toBe(true);
      expect(mockProjectRepository.update).toHaveBeenCalledWith('project-123', {
        status: 'Archived',
        archived: true
      });
    });

    test('should handle invalid workflow action', async () => {
      const result = await service.processWorkflow('project-123', 'invalidAction');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid workflow action');
    });

    test('should handle project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Project not found')
      );

      const result = await service.processWorkflow('nonexistent', 'approve');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Project not found');
    });
  });

  describe('getBusinessState() - Business State Calculation', () => {
    test('should calculate business state for planning project', async () => {
      const project = createMockProject({
        status: 'Planning',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days old
        completionDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days from now
      });

      mockProjectRepository.findById.mockResolvedValue(createMockRepositoryResult(project));

      const result = await service.getBusinessState('project-123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('Planning');
      expect(result.data.stage).toBe('Pre-Execution');
      expect(result.data.nextActions).toContain('approve');
      expect(result.data.metadata.ageDays).toBe(5);
      expect(result.data.metadata.isOverdue).toBe(false);
    });

    test('should calculate business state for in-progress project', async () => {
      const project = createMockProject({
        status: 'In Progress'
      });

      mockProjectRepository.findById.mockResolvedValue(createMockRepositoryResult(project));

      const result = await service.getBusinessState('project-123');

      expect(result.success).toBe(true);
      expect(result.data.stage).toBe('Execution');
      expect(result.data.nextActions).toContain('updateProgress');
      expect(result.data.nextActions).toContain('addMilestone');
    });
  });

  describe('Business Logic Calculations', () => {
    describe('calculateAgeDays()', () => {
      test('should calculate age in days', () => {
        const project = createMockProject({
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
        });

        const ageDays = service.calculateAgeDays(project);
        expect(ageDays).toBe(14);
      });

      test('should handle missing createdAt', () => {
        const project = createMockProject({ createdAt: undefined });
        const ageDays = service.calculateAgeDays(project);
        expect(ageDays).toBe(0);
      });
    });

    describe('calculateDaysToCompletion()', () => {
      test('should calculate days to completion', () => {
        const project = createMockProject({
          completionDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString() // 21 days from now
        });

        const daysToCompletion = service.calculateDaysToCompletion(project);
        expect(daysToCompletion).toBe(21);
      });

      test('should return Infinity for projects without completion date', () => {
        const project = createMockProject({ completionDate: undefined });
        const daysToCompletion = service.calculateDaysToCompletion(project);
        expect(daysToCompletion).toBe(Infinity);
      });
    });

    describe('calculateIsOverdue()', () => {
      test('should detect overdue projects', () => {
        const project = createMockProject({
          status: 'In Progress',
          completionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        });

        const isOverdue = service.calculateIsOverdue(project);
        expect(isOverdue).toBe(true);
      });

      test('should not mark completed projects as overdue', () => {
        const project = createMockProject({
          status: 'Completed',
          completionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        });

        const isOverdue = service.calculateIsOverdue(project);
        expect(isOverdue).toBe(false);
      });

      test('should not mark projects without completion date as overdue', () => {
        const project = createMockProject({
          status: 'In Progress',
          completionDate: undefined
        });

        const isOverdue = service.calculateIsOverdue(project);
        expect(isOverdue).toBe(false);
      });
    });

    describe('calculateIsAtRisk()', () => {
      test('should detect projects at risk due to schedule', () => {
        const project = createMockProject({
          completionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
          status: 'In Progress' // This would result in ~50% progress, which is less than 80%
        });

        const isAtRisk = service.calculateIsAtRisk(project);
        expect(isAtRisk).toBe(true);
      });

      test('should detect projects at risk due to budget variance', () => {
        const project = createMockProject({
          budget: '50000',
          actualCost: 60000 // 20% over budget
        });

        const isAtRisk = service.calculateIsAtRisk(project);
        expect(isAtRisk).toBe(true);
      });
    });

    describe('calculateProgressPercentage()', () => {
      test('should return 100% for completed projects', () => {
        const project = createMockProject({ status: 'Completed' });
        const progress = service.calculateProgressPercentage(project);
        expect(progress).toBe(100);
      });

      test('should return 0% for planning projects', () => {
        const project = createMockProject({ status: 'Planning' });
        const progress = service.calculateProgressPercentage(project);
        expect(progress).toBe(0);
      });

      test('should calculate progress based on date range', () => {
        const now = new Date();
        const project = createMockProject({
          status: 'In Progress',
          startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          completionDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days from now
        });

        const progress = service.calculateProgressPercentage(project);
        expect(progress).toBe(33); // 10 days elapsed out of 30 total days = 33%
      });

      test('should use default progress for status without dates', () => {
        const testCases = [
          { status: 'Approved', expected: 10 },
          { status: 'In Progress', expected: 50 },
          { status: 'Under Review', expected: 85 }
        ];

        for (const testCase of testCases) {
          const project = createMockProject({ 
            status: testCase.status,
            startDate: undefined,
            completionDate: undefined
          });
          const progress = service.calculateProgressPercentage(project);
          expect(progress).toBe(testCase.expected);
        }
      });
    });

    describe('calculateBudgetVariance()', () => {
      test('should calculate positive variance (over budget)', () => {
        const project = createMockProject({
          budget: '50000',
          actualCost: 55000
        });

        const variance = service.calculateBudgetVariance(project);
        expect(variance).toBe(5000);
      });

      test('should calculate negative variance (under budget)', () => {
        const project = createMockProject({
          budget: '50000',
          actualCost: 45000
        });

        const variance = service.calculateBudgetVariance(project);
        expect(variance).toBe(-5000);
      });

      test('should return 0 for missing budget or actual cost', () => {
        const project1 = createMockProject({ budget: undefined, actualCost: 50000 });
        const project2 = createMockProject({ budget: '50000', actualCost: undefined });

        expect(service.calculateBudgetVariance(project1)).toBe(0);
        expect(service.calculateBudgetVariance(project2)).toBe(0);
      });
    });

    describe('calculateProfitability()', () => {
      test('should categorize profitability correctly', () => {
        const testCases = [
          { actualCost: 45000, expected: 'profitable' }, // 10% under budget
          { actualCost: 48000, expected: 'break-even' },  // 4% under budget
          { actualCost: 52500, expected: 'break-even' },  // 5% over budget
          { actualCost: 55000, expected: 'loss' }         // 10% over budget
        ];

        for (const testCase of testCases) {
          const project = createMockProject({
            budget: '50000',
            actualCost: testCase.actualCost
          });
          const profitability = service.calculateProfitability(project);
          expect(profitability).toBe(testCase.expected);
        }
      });
    });

    describe('calculateRiskLevel()', () => {
      test('should return high risk for overdue projects', () => {
        const project = createMockProject({
          status: 'In Progress',
          completionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Overdue
        });

        const riskLevel = service.calculateRiskLevel(project);
        expect(riskLevel).toBe('high');
      });

      test('should return high risk for high budget variance', () => {
        const project = createMockProject({
          budget: '50000',
          actualCost: 70000 // 40% over budget
        });

        const riskLevel = service.calculateRiskLevel(project);
        expect(riskLevel).toBe('high');
      });

      test('should return medium risk for at-risk projects', () => {
        const project = createMockProject({
          budget: '50000',
          actualCost: 58000 // 16% over budget
        });

        const riskLevel = service.calculateRiskLevel(project);
        expect(riskLevel).toBe('medium');
      });

      test('should return low risk for healthy projects', () => {
        const project = createMockProject({
          budget: '50000',
          actualCost: 45000, // 10% under budget
          status: 'In Progress',
          completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Not overdue
        });

        const riskLevel = service.calculateRiskLevel(project);
        expect(riskLevel).toBe('low');
      });
    });

    describe('calculateStage()', () => {
      test('should determine correct stage for each status', () => {
        const testCases = [
          { status: 'Planning', expected: 'Pre-Execution' },
          { status: 'Approved', expected: 'Pre-Execution' },
          { status: 'In Progress', expected: 'Execution' },
          { status: 'On Hold', expected: 'Execution' },
          { status: 'Under Review', expected: 'Review' },
          { status: 'Completed', expected: 'Complete' },
          { status: 'Cancelled', expected: 'Closed' },
          { status: 'Archived', expected: 'Closed' }
        ];

        for (const testCase of testCases) {
          const project = createMockProject({ status: testCase.status });
          const stage = service.calculateStage(project);
          expect(stage).toBe(testCase.expected);
        }
      });
    });

    describe('getNextActions()', () => {
      test('should return valid next actions for each status', () => {
        const testCases = [
          { status: 'Planning', expectedActions: ['approve', 'requestChanges'] },
          { status: 'Approved', expectedActions: ['startExecution', 'reviseplan'] },
          { status: 'In Progress', expectedActions: ['updateProgress', 'addMilestone', 'putOnHold'] },
          { status: 'On Hold', expectedActions: ['resume', 'cancel'] },
          { status: 'Under Review', expectedActions: ['approve', 'requestRevisions', 'complete'] }
        ];

        for (const testCase of testCases) {
          const project = createMockProject({ status: testCase.status });
          const actions = service.getNextActions(project);
          
          for (const expectedAction of testCase.expectedActions) {
            expect(actions).toContain(expectedAction);
          }
          
          // All projects should have these universal actions
          expect(actions).toContain('updateNotes');
          expect(actions).toContain('viewMetrics');
        }
      });
    });

    describe('getBlockedActions()', () => {
      test('should block execution actions for completed projects', () => {
        const project = createMockProject({ status: 'Completed' });
        const blockedActions = service.getBlockedActions(project);
        expect(blockedActions).toContain('startExecution');
        expect(blockedActions).toContain('updateProgress');
        expect(blockedActions).toContain('putOnHold');
      });

      test('should block execution actions for cancelled projects', () => {
        const project = createMockProject({ status: 'Cancelled' });
        const blockedActions = service.getBlockedActions(project);
        expect(blockedActions).toContain('startExecution');
        expect(blockedActions).toContain('updateProgress');
        expect(blockedActions).toContain('complete');
      });
    });
  });

  describe('Business-Specific Methods', () => {
    describe('findOverdueProjects()', () => {
      test('should find overdue projects', async () => {
        const projects = [createMockProject()];
        mockProjectRepository.findAll.mockResolvedValue(createMockRepositoryResult(projects));
        mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));
        mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

        const result = await service.findOverdueProjects();

        expect(result.success).toBe(true);
        expect(mockProjectRepository.findAll).toHaveBeenCalledWith({ filter: { isOverdue: true } });
      });
    });

    describe('findAtRiskProjects()', () => {
      test('should find at-risk projects', async () => {
        const projects = [createMockProject()];
        mockProjectRepository.findAll.mockResolvedValue(createMockRepositoryResult(projects));
        mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));
        mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

        const result = await service.findAtRiskProjects();

        expect(result.success).toBe(true);
        expect(mockProjectRepository.findAll).toHaveBeenCalledWith({ filter: { isAtRisk: true } });
      });
    });

    describe('findByStatus()', () => {
      test('should find projects by status', async () => {
        const projects = [createMockProject({ status: 'In Progress' })];
        mockProjectRepository.findAll.mockResolvedValue(createMockRepositoryResult(projects));
        mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));
        mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

        const result = await service.findByStatus('In Progress');

        expect(result.success).toBe(true);
        expect(mockProjectRepository.findAll).toHaveBeenCalledWith({ filter: { status: 'In Progress' } });
      });
    });

    describe('getProjectMetrics()', () => {
      test('should calculate comprehensive project metrics', async () => {
        const project = createMockProject({
          budget: '50000',
          actualCost: 45000,
          startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          completionDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'In Progress'
        });

        mockProjectRepository.findById.mockResolvedValue(createMockRepositoryResult(project));

        const result = await service.getProjectMetrics('project-123');

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.budgetUtilization).toBeDefined();
        expect(result.data.schedulePerformance).toBeDefined();
        expect(result.data.qualityMetrics).toBeDefined();
        expect(result.data.riskAssessment).toBeDefined();
        expect(result.data.teamPerformance).toBeDefined();

        // Verify specific calculations
        expect(result.data.budgetUtilization.budgeted).toBe(50000);
        expect(result.data.budgetUtilization.actual).toBe(45000);
        expect(result.data.budgetUtilization.variance).toBe(-5000);
        expect(result.data.schedulePerformance.isOnSchedule).toBe(true);
      });

      test('should handle project not found for metrics', async () => {
        mockProjectRepository.findById.mockResolvedValue(
          createMockRepositoryResult(null, false, 'Project not found')
        );

        const result = await service.getProjectMetrics('nonexistent');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Project not found');
      });
    });
  });

  describe('Helper Methods', () => {
    describe('calculateTotalBudget()', () => {
      test('should calculate total from budget components', () => {
        const data = {
          laborBudget: '30000',
          materialBudget: '15000',
          equipmentBudget: '5000'
        };

        const total = service.calculateTotalBudget(data);
        expect(total).toBe(50000);
      });

      test('should apply contingency percentage', () => {
        const data = {
          laborBudget: '30000',
          materialBudget: '15000',
          equipmentBudget: '5000',
          contingencyPercentage: 10
        };

        const total = service.calculateTotalBudget(data);
        expect(total).toBe(55000); // 50000 * 1.1
      });

      test('should handle missing budget components', () => {
        const data = {
          laborBudget: '20000'
          // materialBudget and equipmentBudget missing
        };

        const total = service.calculateTotalBudget(data);
        expect(total).toBe(20000);
      });
    });

    describe('transformForPresentation()', () => {
      test('should transform project for presentation', async () => {
        const project = createMockProject();
        mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));
        mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

        const enhanced = await service.transformForPresentation(project);

        expect(enhanced).toBeDefined();
        expect(enhanced.id).toBe(project.id);
        expect(enhanced.ageDays).toBeDefined();
        expect(enhanced.progressPercentage).toBeDefined();
        expect(enhanced.riskLevel).toBeDefined();
      });
    });
  });

  describe('getBusinessRules()', () => {
    test('should return business rules array', () => {
      const rules = service.getBusinessRules();

      expect(rules).toBeInstanceOf(Array);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty('name');
      expect(rules[0]).toHaveProperty('description');
      expect(rules[0]).toHaveProperty('condition');
      expect(rules[0]).toHaveProperty('action');
    });
  });

  describe('checkPermissions()', () => {
    test('should check permissions for actions', async () => {
      const result = await service.checkPermissions('approve', 'user-123');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    test('should handle repository errors gracefully', async () => {
      mockProjectRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await service.findById('project-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    test('should handle workflow processing errors', async () => {
      mockProjectRepository.findById.mockRejectedValue(new Error('Workflow error'));

      const result = await service.processWorkflow('project-123', 'approve');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Project workflow processing failed: Workflow error');
    });

    test('should handle business state calculation errors', async () => {
      mockProjectRepository.findById.mockRejectedValue(new Error('State calculation error'));

      const result = await service.getBusinessState('project-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get project business state: State calculation error');
    });

    test('should handle metrics calculation errors', async () => {
      mockProjectRepository.findById.mockRejectedValue(new Error('Metrics error'));

      const result = await service.getProjectMetrics('project-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get project metrics: Metrics error');
    });
  });
});