/**
 * ContactRepository Test Suite
 * 
 * Comprehensive tests for ContactRepository covering:
 * - All CRUD operations
 * - Contact type filtering
 * - Search functionality
 * - Email-based lookups
 * - Active/inactive status management
 * - Name composition and formatting
 * - Business logic methods
 * - Error handling scenarios
 */

import { ContactRepository } from '../../../repositories/ContactRepository';
import type { Contact, ContactFilter, ContactCreateInput } from '../../../repositories/ContactRepository';
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

// Mock Contact factory
const createMockContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: 'contact_' + Math.random().toString(36).substr(2, 9),
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  phone: '555-123-4567',
  mobile: '555-987-6543',
  company: 'ABC Construction',
  brokerage: 'XYZ Realty',
  owner: 'system',
  emailNotifications: true,
  smsNotifications: false,
  roleType: 'Customer',
  isActive: true,
  assignmentPriority: 1,
  canReceiveNotifications: true,
  createdAt: '2024-01-10T09:00:00Z',
  updatedAt: '2024-01-15T14:20:00Z',
  ...overrides
});

describe('ContactRepository', () => {
  let contactRepository: ContactRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create repository instance with mocked dependencies
    contactRepository = new ContactRepository();
    (contactRepository as any).client = mockGraphQLClient;
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(contactRepository).toBeInstanceOf(ContactRepository);
      expect((contactRepository as any).modelName).toBe('Contacts');
      expect((contactRepository as any).entityName).toBe('Contact');
    });
  });

  describe('create', () => {
    it('should create a new contact successfully', async () => {
      const createInput: ContactCreateInput = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '555-456-7890',
        mobile: '555-654-3210',
        company: 'Smith Realty',
        roleType: 'AE',
        emailNotifications: true,
        smsNotifications: false,
        isActive: true
      };

      const mockCreatedContact = createMockContact({
        id: 'new-contact-id',
        ...createInput,
        fullName: 'Jane Smith' // Should auto-compose from firstName + lastName
      });

      const mockGraphQLResponse = {
        data: {
          createContacts: mockCreatedContact
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.create(createInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('new-contact-id');
      expect(result.data?.fullName).toBe('Jane Smith');
      expect(result.data?.roleType).toBe('AE');
      expect(result.data?.isActive).toBe(true); // Should default to true
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation CreateContact'),
        { input: expect.objectContaining({
          ...createInput,
          fullName: 'Jane Smith',
          isActive: true
        }) }
      );
    });

    it('should auto-compose fullName from firstName and lastName', async () => {
      const createInput: ContactCreateInput = {
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'michael.johnson@example.com',
        roleType: 'Contractor'
      };

      const mockCreatedContact = createMockContact({
        ...createInput,
        fullName: 'Michael Johnson'
      });

      const mockGraphQLResponse = {
        data: {
          createContacts: mockCreatedContact
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.create(createInput);

      expect(result.success).toBe(true);
      expect(result.data?.fullName).toBe('Michael Johnson');
    });

    it('should use provided fullName when available', async () => {
      const createInput: ContactCreateInput = {
        firstName: 'Dr. Sarah',
        lastName: 'Wilson',
        fullName: 'Dr. Sarah Wilson, MD',
        email: 'sarah.wilson@example.com',
        roleType: 'Customer'
      };

      const mockCreatedContact = createMockContact({
        ...createInput
      });

      const mockGraphQLResponse = {
        data: {
          createContacts: mockCreatedContact
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.create(createInput);

      expect(result.success).toBe(true);
      expect(result.data?.fullName).toBe('Dr. Sarah Wilson, MD');
    });

    it('should default roleType to "Customer" when not provided', async () => {
      const createInput: ContactCreateInput = {
        firstName: 'Robert',
        lastName: 'Brown',
        email: 'robert.brown@example.com'
      };

      const mockCreatedContact = createMockContact({
        ...createInput,
        roleType: 'Customer'
      });

      const mockGraphQLResponse = {
        data: {
          createContacts: mockCreatedContact
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.create(createInput);

      expect(result.success).toBe(true);
      expect(result.data?.roleType).toBe('Customer');
    });

    it('should handle validation errors', async () => {
      const createInput: ContactCreateInput = {
        firstName: '',
        email: 'invalid-email' // Invalid email format
      };

      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Validation error: invalid email format' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await contactRepository.create(createInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error: invalid email format');
    });
  });

  describe('findById', () => {
    const mockContactId = 'contact-123';

    it('should find contact by ID successfully', async () => {
      const mockContact = createMockContact({ id: mockContactId });
      
      const mockGraphQLResponse = {
        data: {
          getContacts: mockContact
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.findById(mockContactId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(mockContactId);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query GetContact'),
        { id: mockContactId }
      );
    });

    it('should handle not found cases', async () => {
      const mockGraphQLResponse = {
        data: { getContacts: null },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.findById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Contact not found');
    });

    it('should return cached contact when available', async () => {
      const mockContact = createMockContact({ id: mockContactId });
      
      // First call to populate cache
      const mockGraphQLResponse = {
        data: { getContacts: mockContact },
        errors: null
      };
      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);
      
      await contactRepository.findById(mockContactId);
      
      // Second call should use cache
      const result = await contactRepository.findById(mockContactId);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockContactId);
      expect(result.metadata?.cached).toBe(true);
    });
  });

  describe('findByEmail', () => {
    it('should find contact by email address', async () => {
      const email = 'john.doe@example.com';
      const mockContact = createMockContact({ email });

      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: [mockContact],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.findByEmail(email);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe(email);
    });

    it('should return null when email not found', async () => {
      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: [],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.findByEmail('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('findByType', () => {
    it('should find contacts by type', async () => {
      const roleType = 'AE';
      const mockContacts = [
        createMockContact({ id: 'contact-1', roleType }),
        createMockContact({ id: 'contact-2', roleType })
      ];

      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: mockContacts,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.findByType(roleType);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].roleType).toBe(roleType);
      expect(result.data?.[1].roleType).toBe(roleType);
    });
  });

  describe('findAgents', () => {
    it('should find all agent contacts', async () => {
      const mockAgents = [
        createMockContact({ 
          id: 'agent-1', 
          roleType: 'AE',
          fullName: 'Agent Smith',
          brokerage: 'ABC Realty'
        }),
        createMockContact({ 
          id: 'agent-2', 
          roleType: 'AE',
          fullName: 'Agent Johnson',
          brokerage: 'XYZ Properties'
        })
      ];

      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: mockAgents,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.findAgents();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.every(contact => contact.roleType === 'AE')).toBe(true);
    });
  });

  describe('findHomeowners', () => {
    it('should find all homeowner contacts', async () => {
      const mockHomeowners = [
        createMockContact({ 
          id: 'homeowner-1', 
          roleType: 'Customer',
          fullName: 'John Homeowner'
        }),
        createMockContact({ 
          id: 'homeowner-2', 
          roleType: 'Customer',
          fullName: 'Jane Homeowner'
        })
      ];

      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: mockHomeowners,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.findHomeowners();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.every(contact => contact.roleType === 'Customer')).toBe(true);
    });
  });

  describe('searchContacts', () => {
    it('should search contacts by name', async () => {
      const searchTerm = 'Smith';
      const mockContacts = [
        createMockContact({ 
          id: 'contact-1', 
          fullName: 'John Smith',
          roleType: 'Customer'
        }),
        createMockContact({ 
          id: 'contact-2', 
          fullName: 'Agent Smith',
          roleType: 'AE'
        })
      ];

      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: mockContacts,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.searchContacts(searchTerm);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListContacts'),
        expect.objectContaining({
          filter: expect.objectContaining({
            or: expect.arrayContaining([
              { firstName: { contains: searchTerm } },
              { lastName: { contains: searchTerm } },
              { fullName: { contains: searchTerm } },
              { email: { contains: searchTerm } },
              { phone: { contains: searchTerm } },
              { mobile: { contains: searchTerm } },
              { company: { contains: searchTerm } },
              { brokerage: { contains: searchTerm } }
            ])
          })
        })
      );
    });

    it('should search contacts by email', async () => {
      const searchTerm = 'example.com';
      const mockContacts = [
        createMockContact({ 
          id: 'contact-1', 
          email: 'user1@example.com'
        })
      ];

      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: mockContacts,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.searchContacts(searchTerm);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].email).toContain('example.com');
    });

    it('should search contacts by phone', async () => {
      const searchTerm = '555-123';
      const mockContacts = [
        createMockContact({ 
          id: 'contact-1', 
          phone: '555-123-4567'
        })
      ];

      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: mockContacts,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.searchContacts(searchTerm);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].phone).toContain('555-123');
    });
  });

  describe('update', () => {
    const mockContactId = 'contact-123';

    it('should update contact successfully', async () => {
      const updateData = {
        phone: '555-999-8888',
        mobile: '555-888-7777',
        company: 'Updated Company',
        notes: 'Contact information updated',
        active: false
      };

      const mockUpdatedContact = createMockContact({
        id: mockContactId,
        ...updateData
      });

      const mockGraphQLResponse = {
        data: {
          updateContacts: mockUpdatedContact
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.update(mockContactId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.phone).toBe('555-999-8888');
      expect(result.data?.company).toBe('Updated Company');
      expect(result.data?.isActive).toBe(false);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation UpdateContact'),
        {
          input: expect.objectContaining({
            id: mockContactId,
            ...updateData
          })
        }
      );
    });

    it('should handle partial updates', async () => {
      const updateData = { email: 'newemail@example.com' };

      const mockUpdatedContact = createMockContact({
        id: mockContactId,
        email: 'newemail@example.com'
      });

      const mockGraphQLResponse = {
        data: { updateContacts: mockUpdatedContact },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.update(mockContactId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('newemail@example.com');
    });

    it('should handle email uniqueness validation errors', async () => {
      const updateData = { email: 'existing@example.com' };

      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Email address already exists' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await contactRepository.update(mockContactId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email address already exists');
    });
  });

  describe('delete', () => {
    const mockContactId = 'contact-123';

    it('should delete contact successfully', async () => {
      const mockGraphQLResponse = {
        data: {
          deleteContacts: { id: mockContactId }
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.delete(mockContactId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation DeleteContact'),
        { input: { id: mockContactId } }
      );
    });

    it('should prevent deletion of contacts with active relationships', async () => {
      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Cannot delete contact: has active relationships' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await contactRepository.delete(mockContactId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete contact: has active relationships');
    });
  });

  describe('filtering and pagination', () => {
    it('should handle complex filters', async () => {
      const filter: ContactFilter = {
        roleType: 'AE',
        isActive: true,
        search: 'ABC Realty'
      };

      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: [createMockContact()],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.findAll({ filter });

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListContacts'),
        expect.objectContaining({
          filter: expect.objectContaining({
            roleType: { eq: 'AE' },
            isActive: { eq: true },
            or: expect.arrayContaining([
              { firstName: { contains: 'ABC Realty' } },
              { lastName: { contains: 'ABC Realty' } },
              { fullName: { contains: 'ABC Realty' } },
              { email: { contains: 'ABC Realty' } },
              { phone: { contains: 'ABC Realty' } },
              { mobile: { contains: 'ABC Realty' } },
              { company: { contains: 'ABC Realty' } },
              { brokerage: { contains: 'ABC Realty' } }
            ])
          })
        })
      );
    });

    it('should handle pagination properly', async () => {
      const mockContacts = [createMockContact({ id: 'contact-1' })];

      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: mockContacts,
            nextToken: 'next-page-token'
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.findAll({
        limit: 25,
        nextToken: 'current-token'
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.metadata?.nextToken).toBe('next-page-token');
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListContacts'),
        expect.objectContaining({
          limit: 25,
          nextToken: 'current-token'
        })
      );
    });
  });

  describe('mapping methods', () => {
    it('should map GraphQL data to entity correctly', () => {
      const repository = contactRepository as any;
      
      const graphqlData = {
        id: 'contact-123',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        roleType: 'Customer',
        active: true,
        createdAt: '2024-01-15T10:00:00Z'
      };

      const entity = repository.mapToEntity(graphqlData);

      expect(entity.id).toBe('contact-123');
      expect(entity.firstName).toBe('John');
      expect(entity.lastName).toBe('Doe');
      expect(entity.fullName).toBe('John Doe');
      expect(entity.email).toBe('john.doe@example.com');
      expect(entity.roleType).toBe('Customer');
      expect(entity.isActive).toBe(true);
      expect(entity.createdAt).toBe('2024-01-15T10:00:00Z');
    });

    it('should map create input with name composition', () => {
      const repository = contactRepository as any;
      
      const createInput: ContactCreateInput = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        roleType: 'AE'
      };

      const mappedInput = repository.mapToCreateInput(createInput);

      expect(mappedInput).toEqual({
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: undefined,
        mobile: undefined,
        company: undefined,
        brokerage: undefined,
        roleType: 'AE',
        notes: undefined,
        active: true
      });
    });

    it('should handle single name inputs', () => {
      const repository = contactRepository as any;
      
      const createInputFirstOnly: ContactCreateInput = {
        firstName: 'Madonna',
        email: 'madonna@example.com'
      };

      const mappedInput = repository.mapToCreateInput(createInputFirstOnly);
      expect(mappedInput.fullName).toBe('Madonna');
    });

    it('should map update input correctly', () => {
      const repository = contactRepository as any;
      
      const updateData = {
        phone: '555-new-phone',
        email: 'updated@example.com',
        notes: 'Updated contact info',
        active: false
      };

      const mappedInput = repository.mapToUpdateInput(updateData);

      expect(mappedInput).toEqual(updateData);
    });

    it('should filter out undefined values in update mapping', () => {
      const repository = contactRepository as any;
      
      const updateData = {
        firstName: 'Updated',
        lastName: undefined,
        email: 'new@example.com'
      };

      const mappedInput = repository.mapToUpdateInput(updateData);

      expect(mappedInput).toEqual({
        firstName: 'Updated',
        email: 'new@example.com'
      });
      expect(mappedInput.lastName).toBeUndefined();
    });
  });

  describe('error scenarios', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockGraphQLClient.query.mockRejectedValue(networkError);

      const result = await contactRepository.findById('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network connection failed');
    });

    it('should handle GraphQL errors', async () => {
      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Access denied to contact data' }]
      };

      mockGraphQLClient.query.mockResolvedValue(mockErrorResponse);

      const result = await contactRepository.findAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied to contact data');
    });

    it('should handle malformed responses', async () => {
      const malformedResponse = {
        data: undefined,
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(malformedResponse);

      const result = await contactRepository.findById('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Contact not found');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockGraphQLClient.query.mockRejectedValue(timeoutError);

      const result = await contactRepository.searchContacts('Smith');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });
  });

  describe('cache functionality', () => {
    beforeEach(() => {
      contactRepository.clearCache();
    });

    it('should cache contacts after retrieval', async () => {
      const mockContact = createMockContact({ id: 'cached-contact' });
      const mockGraphQLResponse = {
        data: { getContacts: mockContact },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      // First call should hit the database
      const result1 = await contactRepository.findById('cached-contact');
      expect(result1.success).toBe(true);

      // Second call should hit the cache
      const result2 = await contactRepository.findById('cached-contact');
      expect(result2.success).toBe(true);
      expect(result2.metadata?.cached).toBe(true);

      // Should only call GraphQL once
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(1);
    });

    it('should clear cache successfully', () => {
      contactRepository.clearCache();
      
      const stats = contactRepository.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('count and exists methods', () => {
    it('should count contacts correctly', async () => {
      const mockContacts = [
        createMockContact({ id: 'contact-1' }),
        createMockContact({ id: 'contact-2' }),
        createMockContact({ id: 'contact-3' })
      ];

      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: mockContacts,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.count();

      expect(result.success).toBe(true);
      expect(result.data).toBe(3);
    });

    it('should count with filter', async () => {
      const filter: ContactFilter = { roleType: 'AE' };
      
      const mockGraphQLResponse = {
        data: {
          listContacts: {
            items: [createMockContact({ roleType: 'AE' })],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.count(filter);

      expect(result.success).toBe(true);
      expect(result.data).toBe(1);
    });

    it('should check existence correctly', async () => {
      const mockContact = createMockContact({ id: 'existing-contact' });
      const mockGraphQLResponse = {
        data: { getContacts: mockContact },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.exists('existing-contact');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for non-existent contact', async () => {
      const mockGraphQLResponse = {
        data: { getContacts: null },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await contactRepository.exists('non-existent-contact');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });
});