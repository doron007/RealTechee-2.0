/**
 * ProjectRepository Test Suite
 * 
 * Comprehensive tests for ProjectRepository covering:
 * - All CRUD operations
 * - Project lifecycle management
 * - Milestone tracking
 * - Budget and cost tracking
 * - Status transitions
 * - Assignment operations
 * - Relations loading (request, quote, contacts)
 * - Business logic methods
 * - Error handling scenarios
 */

import { ProjectRepository } from '../../../repositories/ProjectRepository';
import type { Project, ProjectFilter, ProjectCreateInput } from '../../../repositories/ProjectRepository';
import { 
  createMockGraphQLResponse,
  createMockServiceResult,
  createMockRepositoryError
} from '../testDataFactories';

// Mock dependencies
jest.mock('../../repositories/core/GraphQLClient');
jest.mock('../../../utils/logger');

// Mock the GraphQL client
const mockGraphQLClient = {
  query: jest.fn(),
  mutate: jest.fn()
};

// Mock Project factory
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project_' + Math.random().toString(36).substr(2, 9),
  title: 'Kitchen Renovation Project',
  description: 'Complete kitchen renovation based on approved quote',
  status: 'In Progress',
  statusImage: 'progress-status.png',
  statusOrder: 2,
  accountExecutive: 'John Doe',
  assignedTo: 'manager-123',
  assignedDate: '2024-02-01T08:00:00Z',
  startDate: '2024-02-01T08:00:00Z',
  completionDate: '2024-03-15T17:00:00Z',
  budget: '75000',
  actualCost: 45000,
  notes: 'Project on track, materials ordered',
  archived: false,
  requestId: 'request-123',
  quoteId: 'quote-456',
  agentContactId: 'agent-789',
  homeownerContactId: 'homeowner-654',
  addressId: 'address-987',
  createdAt: '2024-02-01T08:00:00Z',
  updatedAt: '2024-02-10T15:30:00Z',
  ...overrides
});

describe('ProjectRepository', () => {
  let projectRepository: ProjectRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create repository instance with mocked dependencies
    projectRepository = new ProjectRepository();
    (projectRepository as any).client = mockGraphQLClient;
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(projectRepository).toBeInstanceOf(ProjectRepository);
      expect((projectRepository as any).modelName).toBe('Projects');
      expect((projectRepository as any).entityName).toBe('Project');
    });
  });

  describe('create', () => {
    it('should create a new project successfully', async () => {
      const createInput: ProjectCreateInput = {
        title: 'Bathroom Renovation Project',
        description: 'Complete bathroom renovation with modern fixtures',
        startDate: '2024-03-01T08:00:00Z',
        completionDate: '2024-04-15T17:00:00Z',
        budget: '35000',
        notes: 'Customer requested eco-friendly materials',
        requestId: 'request-456',
        quoteId: 'quote-789',
        agentContactId: 'agent-123',
        homeownerContactId: 'homeowner-456',
        addressId: 'address-789'
      };

      const mockCreatedProject = createMockProject({
        id: 'new-project-id',
        ...createInput
      });

      const mockGraphQLResponse = {
        data: {
          createProjects: mockCreatedProject
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.create(createInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('new-project-id');
      expect(result.data?.title).toBe('Bathroom Renovation Project');
      expect(result.data?.status).toBe('Planning'); // Should default to Planning
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation CreateProject'),
        { input: expect.objectContaining({
          ...createInput,
          status: 'Planning'
        }) }
      );
    });

    it('should validate required title field', async () => {
      const createInput = {
        title: '', // Empty title should fail validation
        description: 'Test project'
      } as ProjectCreateInput;

      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Validation error: title is required' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await projectRepository.create(createInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error: title is required');
    });

    it('should handle network errors during creation', async () => {
      const createInput: ProjectCreateInput = {
        title: 'Test Project'
      };

      const networkError = new Error('Network connection failed');
      mockGraphQLClient.mutate.mockRejectedValue(networkError);

      const result = await projectRepository.create(createInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network connection failed');
    });
  });

  describe('findById', () => {
    const mockProjectId = 'project-123';

    it('should find project by ID successfully', async () => {
      const mockProject = createMockProject({ id: mockProjectId });
      
      const mockGraphQLResponse = {
        data: {
          getProjects: mockProject
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findById(mockProjectId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(mockProjectId);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query GetProject'),
        { id: mockProjectId }
      );
    });

    it('should handle not found cases', async () => {
      const mockGraphQLResponse = {
        data: { getProjects: null },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Project not found');
    });

    it('should return cached project when available', async () => {
      const mockProject = createMockProject({ id: mockProjectId });
      
      // First call to populate cache
      const mockGraphQLResponse = {
        data: { getProjects: mockProject },
        errors: null
      };
      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);
      
      await projectRepository.findById(mockProjectId);
      
      // Second call should use cache
      const result = await projectRepository.findById(mockProjectId);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockProjectId);
      expect(result.metadata?.cached).toBe(true);
    });
  });

  describe('findByRequestId', () => {
    it('should find projects associated with a request', async () => {
      const requestId = 'request-123';
      const mockProjects = [
        createMockProject({ id: 'project-1', requestId }),
        createMockProject({ id: 'project-2', requestId })
      ];

      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: mockProjects,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findByRequestId(requestId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].requestId).toBe(requestId);
      expect(result.data?.[1].requestId).toBe(requestId);
    });
  });

  describe('findByStatus', () => {
    it('should find projects by status', async () => {
      const status = 'In Progress';
      const mockProjects = [
        createMockProject({ id: 'project-1', status }),
        createMockProject({ id: 'project-2', status })
      ];

      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: mockProjects,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findByStatus(status);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].status).toBe(status);
    });
  });

  describe('findActive', () => {
    it('should find active (non-archived) projects', async () => {
      const mockActiveProjects = [
        createMockProject({ id: 'project-1', archived: false }),
        createMockProject({ id: 'project-2', archived: false })
      ];

      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: mockActiveProjects,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findActive();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.every(project => !project.archived)).toBe(true);
    });
  });

  describe('findByAssignee', () => {
    it('should find projects assigned to specific user', async () => {
      const assignedTo = 'manager-456';
      const mockProjects = [
        createMockProject({ id: 'project-1', assignedTo }),
        createMockProject({ id: 'project-2', assignedTo })
      ];

      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: mockProjects,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findByAssignee(assignedTo);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].assignedTo).toBe(assignedTo);
    });
  });

  describe('findByIdWithRelations', () => {
    const mockProjectId = 'project-123';

    it('should find project with all relations successfully', async () => {
      const mockProjectWithRelations = {
        ...createMockProject({ id: mockProjectId }),
        request: {
          id: 'request-123',
          status: 'Active',
          message: 'Kitchen renovation request'
        },
        quote: {
          id: 'quote-456',
          quoteNumber: 'Q-2024-001',
          totalAmount: 75000
        },
        address: {
          id: 'address-789',
          propertyFullAddress: '123 Main St, City, ST 12345',
          city: 'City',
          state: 'ST',
          propertyType: 'Single Family Home'
        },
        agent: {
          id: 'agent-456',
          fullName: 'Agent Smith',
          email: 'agent@example.com',
          phone: '555-123-4567',
          brokerage: 'ABC Realty'
        },
        homeowner: {
          id: 'homeowner-654',
          fullName: 'John Homeowner',
          email: 'homeowner@example.com',
          phone: '555-987-6543'
        },
        comments: {
          items: [
            {
              id: 'comment-1',
              comment: 'Materials have arrived',
              author: 'Project Manager',
              createdAt: '2024-02-05T10:00:00Z'
            }
          ]
        },
        milestones: {
          items: [
            {
              id: 'milestone-1',
              title: 'Demolition Complete',
              description: 'Remove existing kitchen fixtures',
              dueDate: '2024-02-10T17:00:00Z',
              completedDate: '2024-02-09T15:30:00Z',
              status: 'Completed'
            }
          ]
        },
        paymentTerms: {
          items: [
            {
              id: 'payment-1',
              description: 'Initial payment',
              amount: 25000,
              dueDate: '2024-02-01T00:00:00Z',
              paidDate: '2024-01-31T14:22:00Z',
              status: 'Paid'
            }
          ]
        }
      };

      const mockGraphQLResponse = {
        data: {
          getProjects: mockProjectWithRelations
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findByIdWithRelations(mockProjectId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query GetProjectWithRelations'),
        { id: mockProjectId }
      );
    });

    it('should handle relations loading errors', async () => {
      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Failed to load project relations' }]
      };

      mockGraphQLClient.query.mockResolvedValue(mockErrorResponse);

      const result = await projectRepository.findByIdWithRelations(mockProjectId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load project relations');
    });
  });

  describe('findAllWithRelations', () => {
    it('should find all projects with relations successfully', async () => {
      const mockProjectsWithRelations = [
        {
          ...createMockProject({ id: 'project-1' }),
          request: { id: 'request-1', status: 'Active' },
          quote: { id: 'quote-1', quoteNumber: 'Q-2024-001' },
          address: { id: 'addr-1', city: 'City1' }
        },
        {
          ...createMockProject({ id: 'project-2' }),
          request: { id: 'request-2', status: 'Completed' },
          quote: { id: 'quote-2', quoteNumber: 'Q-2024-002' },
          address: { id: 'addr-2', city: 'City2' }
        }
      ];

      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: mockProjectsWithRelations,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findAllWithRelations();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListProjectsWithRelations'),
        {}
      );
    });
  });

  describe('update', () => {
    const mockProjectId = 'project-123';

    it('should update project successfully', async () => {
      const updateData = {
        status: 'Completed',
        actualCost: 72000,
        completionDate: '2024-03-12T16:00:00Z',
        notes: 'Project completed successfully'
      };

      const mockUpdatedProject = createMockProject({
        id: mockProjectId,
        ...updateData
      });

      const mockGraphQLResponse = {
        data: {
          updateProjects: mockUpdatedProject
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.update(mockProjectId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('Completed');
      expect(result.data?.actualCost).toBe(72000);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation UpdateProject'),
        {
          input: expect.objectContaining({
            id: mockProjectId,
            ...updateData
          })
        }
      );
    });

    it('should handle partial updates correctly', async () => {
      const updateData = { status: 'On Hold' };

      const mockUpdatedProject = createMockProject({
        id: mockProjectId,
        status: 'On Hold'
      });

      const mockGraphQLResponse = {
        data: { updateProjects: mockUpdatedProject },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.update(mockProjectId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('On Hold');
    });

    it('should handle validation errors', async () => {
      const updateData = { actualCost: -5000 }; // Negative cost should fail

      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Validation error: actual cost cannot be negative' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await projectRepository.update(mockProjectId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error: actual cost cannot be negative');
    });
  });

  describe('delete', () => {
    const mockProjectId = 'project-123';

    it('should delete project successfully', async () => {
      const mockGraphQLResponse = {
        data: {
          deleteProjects: { id: mockProjectId }
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.delete(mockProjectId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation DeleteProject'),
        { input: { id: mockProjectId } }
      );
    });

    it('should prevent deletion of active projects', async () => {
      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Cannot delete project with status: In Progress' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await projectRepository.delete(mockProjectId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete project with status: In Progress');
    });
  });

  describe('filtering and pagination', () => {
    it('should handle complex filters', async () => {
      const filter: ProjectFilter = {
        status: 'In Progress',
        assignedTo: 'manager-123',
        archived: false,
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z'
        }
      };

      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: [createMockProject()],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findAll({ filter });

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListProjects'),
        expect.objectContaining({
          filter: expect.objectContaining({
            status: { eq: 'In Progress' },
            assignedTo: { eq: 'manager-123' },
            archived: { eq: false },
            createdAt: {
              between: ['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z']
            }
          })
        })
      );
    });

    it('should handle pagination properly', async () => {
      const mockProjects = [createMockProject({ id: 'project-1' })];

      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: mockProjects,
            nextToken: 'next-page-token'
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findAll({
        limit: 10,
        nextToken: 'current-token'
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.metadata?.nextToken).toBe('next-page-token');
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListProjects'),
        expect.objectContaining({
          limit: 10,
          nextToken: 'current-token'
        })
      );
    });
  });

  describe('mapping methods', () => {
    it('should map GraphQL data to entity correctly', () => {
      const repository = projectRepository as any;
      
      const graphqlData = {
        id: 'project-123',
        title: 'Kitchen Renovation',
        status: 'In Progress',
        budget: '75000',
        actualCost: 45000,
        createdAt: '2024-02-01T08:00:00Z'
      };

      const entity = repository.mapToEntity(graphqlData);

      expect(entity.id).toBe('project-123');
      expect(entity.title).toBe('Kitchen Renovation');
      expect(entity.status).toBe('In Progress');
      expect(entity.budget).toBe('75000');
      expect(entity.actualCost).toBe(45000);
      expect(entity.createdAt).toBe('2024-02-01T08:00:00Z');
    });

    it('should map create input correctly with defaults', () => {
      const repository = projectRepository as any;
      
      const createInput: ProjectCreateInput = {
        title: 'New Project',
        description: 'Project description',
        budget: '50000',
        requestId: 'request-123'
      };

      const mappedInput = repository.mapToCreateInput(createInput);

      expect(mappedInput).toEqual({
        ...createInput,
        status: 'Planning' // Should set default status
      });
    });

    it('should map update input correctly', () => {
      const repository = projectRepository as any;
      
      const updateData = {
        status: 'Completed',
        actualCost: 80000,
        notes: 'Project completed on time',
        archived: false
      };

      const mappedInput = repository.mapToUpdateInput(updateData);

      expect(mappedInput).toEqual(updateData);
    });

    it('should filter out undefined values in update mapping', () => {
      const repository = projectRepository as any;
      
      const updateData = {
        status: 'In Progress',
        actualCost: undefined,
        notes: 'Updated notes'
      };

      const mappedInput = repository.mapToUpdateInput(updateData);

      expect(mappedInput).toEqual({
        status: 'In Progress',
        notes: 'Updated notes'
      });
      expect(mappedInput.actualCost).toBeUndefined();
    });
  });

  describe('error scenarios', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockGraphQLClient.query.mockRejectedValue(networkError);

      const result = await projectRepository.findById('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network connection failed');
    });

    it('should handle GraphQL errors', async () => {
      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Access denied to project data' }]
      };

      mockGraphQLClient.query.mockResolvedValue(mockErrorResponse);

      const result = await projectRepository.findAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied to project data');
    });

    it('should handle malformed responses', async () => {
      const malformedResponse = {
        data: undefined,
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(malformedResponse);

      const result = await projectRepository.findById('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Project not found');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockGraphQLClient.query.mockRejectedValue(timeoutError);

      const result = await projectRepository.findAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });
  });

  describe('cache functionality', () => {
    beforeEach(() => {
      projectRepository.clearCache();
    });

    it('should cache projects after retrieval', async () => {
      const mockProject = createMockProject({ id: 'cached-project' });
      const mockGraphQLResponse = {
        data: { getProjects: mockProject },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      // First call should hit the database
      const result1 = await projectRepository.findById('cached-project');
      expect(result1.success).toBe(true);

      // Second call should hit the cache
      const result2 = await projectRepository.findById('cached-project');
      expect(result2.success).toBe(true);
      expect(result2.metadata?.cached).toBe(true);

      // Should only call GraphQL once
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(1);
    });

    it('should clear cache successfully', () => {
      projectRepository.clearCache();
      
      const stats = projectRepository.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should warm cache by loading projects', async () => {
      const mockProjects = Array.from({ length: 5 }, (_, i) => 
        createMockProject({ id: `project-${i}` })
      );

      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: mockProjects,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      await projectRepository.warmCache();

      const stats = projectRepository.getCacheStats();
      expect(stats.size).toBe(5);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ limit: 1000 })
      );
    });
  });

  describe('count and exists methods', () => {
    it('should count projects correctly', async () => {
      const mockProjects = [
        createMockProject({ id: 'project-1' }),
        createMockProject({ id: 'project-2' }),
        createMockProject({ id: 'project-3' })
      ];

      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: mockProjects,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.count();

      expect(result.success).toBe(true);
      expect(result.data).toBe(3);
    });

    it('should count with filter', async () => {
      const filter: ProjectFilter = { status: 'In Progress' };
      
      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: [createMockProject()],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.count(filter);

      expect(result.success).toBe(true);
      expect(result.data).toBe(1);
    });

    it('should check existence correctly', async () => {
      const mockProject = createMockProject({ id: 'existing-project' });
      const mockGraphQLResponse = {
        data: { getProjects: mockProject },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.exists('existing-project');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for non-existent project', async () => {
      const mockGraphQLResponse = {
        data: { getProjects: null },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.exists('non-existent-project');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('findMany and findOne', () => {
    it('should find many projects with filter', async () => {
      const filter: ProjectFilter = { status: 'In Progress' };
      
      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: [createMockProject()],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findMany(filter);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should find one project with filter', async () => {
      const filter: ProjectFilter = { status: 'Planning' };
      
      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: [createMockProject()],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findOne(filter);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ limit: 1 })
      );
    });

    it('should return null when no matches found', async () => {
      const filter: ProjectFilter = { status: 'NonExistent' };
      
      const mockGraphQLResponse = {
        data: {
          listProjects: {
            items: [],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await projectRepository.findOne(filter);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });
});