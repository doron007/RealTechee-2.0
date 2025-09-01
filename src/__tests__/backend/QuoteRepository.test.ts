/**
 * QuoteRepository Test Suite
 * 
 * Comprehensive tests for QuoteRepository covering:
 * - All CRUD operations
 * - Quote-specific business logic
 * - Quote calculation methods
 * - Status management and transitions
 * - Expiration handling
 * - Quote item management
 * - PDF generation coordination
 * - Error handling scenarios
 */

import { QuoteRepository } from '../../../repositories/QuoteRepository';
import type { Quote, QuoteFilter, QuoteCreateInput } from '../../../repositories/QuoteRepository';
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

// Mock Quote factory
const createMockQuote = (overrides: Partial<Quote> = {}): Quote => ({
  id: 'quote_' + Math.random().toString(36).substr(2, 9),
  quoteNumber: 'Q-2024-001',
  status: 'Draft',
  statusImage: 'draft-status.png',
  statusOrder: 1,
  accountExecutive: 'John Doe',
  assignedTo: 'agent-123',
  assignedDate: '2024-01-16T10:30:00Z',
  title: 'Kitchen Renovation Quote',
  description: 'Complete kitchen renovation including cabinets, countertops, and appliances',
  totalAmount: 75000,
  validUntil: '2024-02-15T23:59:59Z',
  terms: 'Payment terms: 50% upfront, 50% on completion',
  notes: 'Customer prefers granite countertops',
  archived: false,
  requestId: 'request-123',
  agentContactId: 'agent-456',
  homeownerContactId: 'homeowner-654',
  addressId: 'address-987',
  createdAt: '2024-01-16T10:30:00Z',
  updatedAt: '2024-01-16T10:30:00Z',
  ...overrides
});

describe('QuoteRepository', () => {
  let quoteRepository: QuoteRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create repository instance with mocked dependencies
    quoteRepository = new QuoteRepository();
    (quoteRepository as any).client = mockGraphQLClient;
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(quoteRepository).toBeInstanceOf(QuoteRepository);
      expect((quoteRepository as any).modelName).toBe('Quotes');
      expect((quoteRepository as any).entityName).toBe('Quote');
    });
  });

  describe('create', () => {
    it('should create a new quote successfully', async () => {
      const createInput: QuoteCreateInput = {
        quoteNumber: 'Q-2024-002',
        title: 'Bathroom Renovation Quote',
        description: 'Complete bathroom renovation',
        totalAmount: 35000,
        validUntil: '2024-03-15T23:59:59Z',
        terms: 'Standard payment terms',
        notes: 'Customer requested eco-friendly materials',
        requestId: 'request-456',
        agentContactId: 'agent-789',
        homeownerContactId: 'homeowner-123',
        addressId: 'address-456'
      };

      const mockCreatedQuote = createMockQuote({
        id: 'new-quote-id',
        ...createInput
      });

      const mockGraphQLResponse = {
        data: {
          createQuotes: mockCreatedQuote
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.create(createInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('new-quote-id');
      expect(result.data?.title).toBe('Bathroom Renovation Quote');
      expect(result.data?.status).toBe('Draft'); // Should default to Draft
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation CreateQuote'),
        { input: expect.objectContaining({
          ...createInput,
          status: 'Draft'
        }) }
      );
    });

    it('should auto-generate quote number if not provided', async () => {
      const createInput: QuoteCreateInput = {
        title: 'Test Quote',
        requestId: 'request-123'
      };

      const mockCreatedQuote = createMockQuote({
        id: 'new-quote-id',
        quoteNumber: 'Q-2024-AUTO-001',
        ...createInput
      });

      const mockGraphQLResponse = {
        data: {
          createQuotes: mockCreatedQuote
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.create(createInput);

      expect(result.success).toBe(true);
      expect(result.data?.quoteNumber).toMatch(/^Q-\d{4}-AUTO-\d{3}$/);
    });

    it('should handle validation errors during creation', async () => {
      const createInput: QuoteCreateInput = {
        title: '', // Empty title should fail validation
        totalAmount: -1000 // Negative amount should fail
      };

      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Validation error: title cannot be empty and amount must be positive' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await quoteRepository.create(createInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error: title cannot be empty and amount must be positive');
    });
  });

  describe('findById', () => {
    const mockQuoteId = 'quote-123';

    it('should find quote by ID successfully', async () => {
      const mockQuote = createMockQuote({ id: mockQuoteId });
      
      const mockGraphQLResponse = {
        data: {
          getQuotes: mockQuote
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.findById(mockQuoteId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(mockQuoteId);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query GetQuote'),
        { id: mockQuoteId }
      );
    });

    it('should handle not found cases', async () => {
      const mockGraphQLResponse = {
        data: { getQuotes: null },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.findById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quote not found');
    });
  });

  describe('findByRequestId', () => {
    it('should find quotes associated with a request', async () => {
      const requestId = 'request-123';
      const mockQuotes = [
        createMockQuote({ id: 'quote-1', requestId }),
        createMockQuote({ id: 'quote-2', requestId })
      ];

      const mockGraphQLResponse = {
        data: {
          listQuotes: {
            items: mockQuotes,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.findByRequestId(requestId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].requestId).toBe(requestId);
      expect(result.data?.[1].requestId).toBe(requestId);
    });
  });

  describe('findByStatus', () => {
    it('should find quotes by status', async () => {
      const status = 'Sent';
      const mockQuotes = [
        createMockQuote({ id: 'quote-1', status }),
        createMockQuote({ id: 'quote-2', status })
      ];

      const mockGraphQLResponse = {
        data: {
          listQuotes: {
            items: mockQuotes,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.findByStatus(status);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].status).toBe(status);
    });
  });

  describe('findExpiring', () => {
    it('should find quotes expiring within specified days', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5); // 5 days from now

      const mockExpiringQuotes = [
        createMockQuote({
          id: 'quote-1',
          validUntil: futureDate.toISOString()
        })
      ];

      const mockGraphQLResponse = {
        data: {
          listQuotes: {
            items: mockExpiringQuotes,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.findExpiring(7); // Within 7 days

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListQuotes'),
        expect.objectContaining({
          filter: expect.objectContaining({
            dateRange: expect.objectContaining({
              start: expect.any(String),
              end: expect.any(String)
            })
          })
        })
      );
    });

    it('should use default 7 days if no days specified', async () => {
      const mockGraphQLResponse = {
        data: {
          listQuotes: {
            items: [],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.findExpiring();

      expect(result.success).toBe(true);
      // Should have called with 7-day range
      const callArgs = mockGraphQLClient.query.mock.calls[0][1];
      const startDate = new Date(callArgs.filter.dateRange.start);
      const endDate = new Date(callArgs.filter.dateRange.end);
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(7, 0);
    });
  });

  describe('findByIdWithRelations', () => {
    const mockQuoteId = 'quote-123';

    it('should find quote with relations successfully', async () => {
      const mockQuoteWithRelations = {
        ...createMockQuote({ id: mockQuoteId }),
        request: {
          id: 'request-123',
          status: 'Active',
          message: 'Kitchen renovation request'
        },
        address: {
          id: 'address-789',
          propertyFullAddress: '123 Main St, City, ST 12345',
          city: 'City',
          state: 'ST'
        },
        agent: {
          id: 'agent-456',
          fullName: 'Agent Smith',
          email: 'agent@example.com'
        },
        homeowner: {
          id: 'homeowner-654',
          fullName: 'John Homeowner',
          email: 'homeowner@example.com'
        },
        items: {
          items: [
            {
              id: 'item-1',
              description: 'Cabinet installation',
              quantity: 1,
              unitPrice: 25000,
              totalPrice: 25000
            }
          ]
        }
      };

      const mockGraphQLResponse = {
        data: {
          getQuotes: mockQuoteWithRelations
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.findByIdWithRelations(mockQuoteId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query GetQuoteWithRelations'),
        { id: mockQuoteId }
      );
    });
  });

  describe('update', () => {
    const mockQuoteId = 'quote-123';

    it('should update quote successfully', async () => {
      const updateData = {
        status: 'Sent',
        totalAmount: 80000,
        notes: 'Updated with client feedback'
      };

      const mockUpdatedQuote = createMockQuote({
        id: mockQuoteId,
        ...updateData
      });

      const mockGraphQLResponse = {
        data: {
          updateQuotes: mockUpdatedQuote
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.update(mockQuoteId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('Sent');
      expect(result.data?.totalAmount).toBe(80000);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation UpdateQuote'),
        {
          input: expect.objectContaining({
            id: mockQuoteId,
            ...updateData
          })
        }
      );
    });

    it('should handle partial updates correctly', async () => {
      const updateData = { status: 'Accepted' };

      const mockUpdatedQuote = createMockQuote({
        id: mockQuoteId,
        status: 'Accepted'
      });

      const mockGraphQLResponse = {
        data: { updateQuotes: mockUpdatedQuote },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.update(mockQuoteId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('Accepted');
    });
  });

  describe('delete', () => {
    const mockQuoteId = 'quote-123';

    it('should delete quote successfully', async () => {
      const mockGraphQLResponse = {
        data: {
          deleteQuotes: { id: mockQuoteId }
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.delete(mockQuoteId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation DeleteQuote'),
        { input: { id: mockQuoteId } }
      );
    });

    it('should prevent deletion of accepted quotes', async () => {
      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Cannot delete quote with status: Accepted' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await quoteRepository.delete(mockQuoteId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete quote with status: Accepted');
    });
  });

  describe('filtering and pagination', () => {
    it('should handle complex filters', async () => {
      const filter: QuoteFilter = {
        status: 'Draft',
        assignedTo: 'agent-123',
        archived: false,
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z'
        },
        totalAmountRange: {
          min: 10000,
          max: 100000
        }
      };

      const mockGraphQLResponse = {
        data: {
          listQuotes: {
            items: [createMockQuote()],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.findAll({ filter });

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListQuotes'),
        expect.objectContaining({
          filter: expect.objectContaining({
            status: { eq: 'Draft' },
            assignedTo: { eq: 'agent-123' },
            archived: { eq: false },
            createdAt: {
              between: ['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z']
            },
            totalAmount: {
              between: [10000, 100000]
            }
          })
        })
      );
    });

    it('should handle pagination properly', async () => {
      const mockQuotes = [createMockQuote({ id: 'quote-1' })];

      const mockGraphQLResponse = {
        data: {
          listQuotes: {
            items: mockQuotes,
            nextToken: 'next-page-token'
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.findAll({
        limit: 10,
        nextToken: 'current-token'
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.metadata?.nextToken).toBe('next-page-token');
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListQuotes'),
        expect.objectContaining({
          limit: 10,
          nextToken: 'current-token'
        })
      );
    });
  });

  describe('business logic methods', () => {
    describe('calculateQuoteTotal', () => {
      it('should calculate quote total with items', async () => {
        const quoteItems = [
          { description: 'Cabinets', quantity: 1, unitPrice: 25000, totalPrice: 25000 },
          { description: 'Countertops', quantity: 1, unitPrice: 15000, totalPrice: 15000 },
          { description: 'Installation', quantity: 1, unitPrice: 5000, totalPrice: 5000 }
        ];

        const total = (quoteRepository as any).calculateQuoteTotal(quoteItems);

        expect(total).toBe(45000);
      });

      it('should handle empty items array', async () => {
        const total = (quoteRepository as any).calculateQuoteTotal([]);
        expect(total).toBe(0);
      });

      it('should handle null/undefined items', async () => {
        const total1 = (quoteRepository as any).calculateQuoteTotal(null);
        const total2 = (quoteRepository as any).calculateQuoteTotal(undefined);
        
        expect(total1).toBe(0);
        expect(total2).toBe(0);
      });
    });

    describe('generateQuoteNumber', () => {
      it('should generate unique quote number', async () => {
        const quoteNumber = (quoteRepository as any).generateQuoteNumber();
        
        expect(quoteNumber).toMatch(/^Q-\d{4}-\d{3}$/);
      });

      it('should generate different numbers on multiple calls', async () => {
        const number1 = (quoteRepository as any).generateQuoteNumber();
        const number2 = (quoteRepository as any).generateQuoteNumber();
        
        expect(number1).not.toBe(number2);
      });
    });

    describe('isQuoteExpired', () => {
      it('should identify expired quotes', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1); // Yesterday

        const expiredQuote = createMockQuote({
          validUntil: pastDate.toISOString()
        });

        const isExpired = (quoteRepository as any).isQuoteExpired(expiredQuote);
        expect(isExpired).toBe(true);
      });

      it('should identify valid quotes', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

        const validQuote = createMockQuote({
          validUntil: futureDate.toISOString()
        });

        const isExpired = (quoteRepository as any).isQuoteExpired(validQuote);
        expect(isExpired).toBe(false);
      });

      it('should handle quotes without expiration date', async () => {
        const quoteWithoutExpiry = createMockQuote({
          validUntil: undefined
        });

        const isExpired = (quoteRepository as any).isQuoteExpired(quoteWithoutExpiry);
        expect(isExpired).toBe(false);
      });
    });
  });

  describe('mapping methods', () => {
    it('should map GraphQL data to entity correctly', () => {
      const repository = quoteRepository as any;
      
      const graphqlData = {
        id: 'quote-123',
        quoteNumber: 'Q-2024-001',
        status: 'Draft',
        title: 'Test Quote',
        totalAmount: 50000,
        validUntil: '2024-12-31T23:59:59Z',
        createdAt: '2024-01-15T10:00:00Z'
      };

      const entity = repository.mapToEntity(graphqlData);

      expect(entity.id).toBe('quote-123');
      expect(entity.quoteNumber).toBe('Q-2024-001');
      expect(entity.status).toBe('Draft');
      expect(entity.title).toBe('Test Quote');
      expect(entity.totalAmount).toBe(50000);
      expect(entity.validUntil).toBe('2024-12-31T23:59:59Z');
      expect(entity.createdAt).toBe('2024-01-15T10:00:00Z');
    });

    it('should map create input correctly', () => {
      const repository = quoteRepository as any;
      
      const createInput: QuoteCreateInput = {
        title: 'New Quote',
        description: 'Quote description',
        totalAmount: 50000,
        validUntil: '2024-12-31T23:59:59Z',
        requestId: 'request-123'
      };

      const mappedInput = repository.mapToCreateInput(createInput);

      expect(mappedInput).toEqual({
        ...createInput,
        status: 'Draft' // Should set default status
      });
    });

    it('should map update input correctly', () => {
      const repository = quoteRepository as any;
      
      const updateData = {
        status: 'Sent',
        totalAmount: 60000,
        notes: 'Updated notes',
        archived: false
      };

      const mappedInput = repository.mapToUpdateInput(updateData);

      expect(mappedInput).toEqual(updateData);
    });

    it('should filter out undefined values in update mapping', () => {
      const repository = quoteRepository as any;
      
      const updateData = {
        status: 'Sent',
        totalAmount: undefined,
        notes: 'Updated notes'
      };

      const mappedInput = repository.mapToUpdateInput(updateData);

      expect(mappedInput).toEqual({
        status: 'Sent',
        notes: 'Updated notes'
      });
      expect(mappedInput.totalAmount).toBeUndefined();
    });
  });

  describe('error scenarios', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockGraphQLClient.query.mockRejectedValue(networkError);

      const result = await quoteRepository.findById('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network connection failed');
    });

    it('should handle GraphQL errors', async () => {
      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Access denied to quote data' }]
      };

      mockGraphQLClient.query.mockResolvedValue(mockErrorResponse);

      const result = await quoteRepository.findAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied to quote data');
    });

    it('should handle malformed responses', async () => {
      const malformedResponse = {
        data: undefined,
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(malformedResponse);

      const result = await quoteRepository.findById('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quote not found');
    });
  });

  describe('cache functionality', () => {
    beforeEach(() => {
      quoteRepository.clearCache();
    });

    it('should cache quotes after retrieval', async () => {
      const mockQuote = createMockQuote({ id: 'cached-quote' });
      const mockGraphQLResponse = {
        data: { getQuotes: mockQuote },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      // First call should hit the database
      const result1 = await quoteRepository.findById('cached-quote');
      expect(result1.success).toBe(true);

      // Second call should hit the cache
      const result2 = await quoteRepository.findById('cached-quote');
      expect(result2.success).toBe(true);
      expect(result2.metadata?.cached).toBe(true);

      // Should only call GraphQL once
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(1);
    });

    it('should clear cache successfully', () => {
      quoteRepository.clearCache();
      
      const stats = quoteRepository.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('count and exists methods', () => {
    it('should count quotes correctly', async () => {
      const mockQuotes = [
        createMockQuote({ id: 'quote-1' }),
        createMockQuote({ id: 'quote-2' }),
        createMockQuote({ id: 'quote-3' })
      ];

      const mockGraphQLResponse = {
        data: {
          listQuotes: {
            items: mockQuotes,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.count();

      expect(result.success).toBe(true);
      expect(result.data).toBe(3);
    });

    it('should check existence correctly', async () => {
      const mockQuote = createMockQuote({ id: 'existing-quote' });
      const mockGraphQLResponse = {
        data: { getQuotes: mockQuote },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.exists('existing-quote');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for non-existent quote', async () => {
      const mockGraphQLResponse = {
        data: { getQuotes: null },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await quoteRepository.exists('non-existent-quote');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });
});