/**
 * QuoteService (Business Layer) - Comprehensive Test Suite
 * 
 * Tests for 100% coverage of business logic QuoteService including:
 * - Enhanced CRUD operations with quote-specific logic
 * - Quote number generation and calculations
 * - Status workflow management
 * - Expiry and conversion probability calculations
 * - Business state and rule management
 * - Quote duplication and item management
 * - Validation rules and business constraints
 * - Error handling and resilience
 */

const { QuoteService } = require('../../../services/business/QuoteService');

// Create mock repositories manually to avoid TypeScript issues
const mockQuoteRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByRequestId: jest.fn()
};

const mockRequestRepository = {
  findById: jest.fn()
};

// Mock the repository modules
jest.mock('../../../repositories/QuoteRepository', () => ({
  quoteRepository: mockQuoteRepository
}));

jest.mock('../../../repositories/RequestRepository', () => ({
  requestRepository: mockRequestRepository
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
const createMockQuote = (overrides = {}) => ({
  id: 'quote-123',
  quoteNumber: 'Q202501-123456',
  title: 'Test Quote',
  description: 'Test quote description',
  totalAmount: 50000,
  status: 'Draft',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  terms: 'Standard terms',
  notes: 'Test notes',
  requestId: 'request-123',
  agentContactId: 'agent-123',
  homeownerContactId: 'homeowner-123',
  addressId: 'address-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

const createMockRequest = (overrides = {}) => ({
  id: 'request-123',
  status: 'In Progress',
  message: 'Looking for renovation',
  ...overrides
});

const createMockRepositoryResult = (data, success = true, error = null) => ({
  success,
  data,
  error: success ? undefined : error
});

describe('QuoteService (Business Layer) - Complete Coverage', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuoteService();
  });

  describe('Initialization & Setup', () => {
    test('should initialize with validation rules', () => {
      expect(service).toBeInstanceOf(QuoteService);
      // Validation rules should be set up in constructor
      expect(service.validationRules.length).toBeGreaterThan(0);
    });
  });

  describe('create() - Enhanced Quote Creation', () => {
    const validQuoteData = {
      title: 'Kitchen Renovation Quote',
      description: 'Complete kitchen renovation',
      totalAmount: 75000,
      requestId: 'request-123',
      items: [
        { description: 'Cabinets', quantity: 10, unitPrice: 5000, category: 'Materials' },
        { description: 'Labor', quantity: 40, unitPrice: 100, category: 'Labor' }
      ]
    };

    beforeEach(() => {
      const createdQuote = createMockQuote({
        id: 'new-quote-123',
        ...validQuoteData,
        quoteNumber: 'Q202501-789012'
      });
      
      mockQuoteRepository.create.mockResolvedValue(createMockRepositoryResult(createdQuote));
      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(createdQuote));
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockRequest({ id: 'request-123' }))
      );
    });

    test('should create quote with business workflow', async () => {
      const result = await service.create(validQuoteData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('new-quote-123');
      expect(result.data.ageDays).toBeDefined();
      expect(result.data.daysUntilExpiry).toBeDefined();
      expect(result.data.isExpired).toBeDefined();
      expect(result.data.conversionProbability).toBeDefined();

      // Verify quote creation with calculated total
      const createCall = mockQuoteRepository.create.mock.calls[0][0];
      expect(createCall.totalAmount).toBe(54000); // 10*5000 + 40*100
      expect(createCall.quoteNumber).toBeDefined();
      expect(createCall.validUntil).toBeDefined();
    });

    test('should generate quote number if not provided', async () => {
      const result = await service.create(validQuoteData);

      expect(result.success).toBe(true);
      const createCall = mockQuoteRepository.create.mock.calls[0][0];
      expect(createCall.quoteNumber).toMatch(/^Q\d{6}-\d{6}$/);
    });

    test('should calculate total from items', async () => {
      const quoteWithItems = {
        title: 'Test Quote',
        items: [
          { description: 'Item 1', quantity: 2, unitPrice: 100 },
          { description: 'Item 2', quantity: 3, unitPrice: 200 }
        ]
      };

      const result = await service.create(quoteWithItems);

      expect(result.success).toBe(true);
      const createCall = mockQuoteRepository.create.mock.calls[0][0];
      expect(createCall.totalAmount).toBe(800); // 2*100 + 3*200
    });

    test('should set default valid until date', async () => {
      const result = await service.create({ title: 'Test Quote' });

      expect(result.success).toBe(true);
      const createCall = mockQuoteRepository.create.mock.calls[0][0];
      expect(createCall.validUntil).toBeDefined();
      
      const validUntil = new Date(createCall.validUntil);
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      expect(Math.abs(validUntil.getTime() - thirtyDaysFromNow.getTime())).toBeLessThan(5000); // Within 5 seconds
    });

    test('should handle quote creation failure', async () => {
      mockQuoteRepository.create.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Quote creation failed')
      );

      const result = await service.create(validQuoteData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quote creation failed');
    });

    test('should validate total amount', async () => {
      const invalidQuoteData = {
        title: 'Test Quote',
        totalAmount: -5000 // Invalid negative amount
      };

      // Create the service and test validation
      const validationResult = await service.validate(invalidQuoteData);
      
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'totalAmount',
            message: 'Total amount must be a positive number',
            code: 'INVALID_AMOUNT'
          })
        ])
      );
    });

    test('should validate valid until date', async () => {
      const invalidQuoteData = {
        title: 'Test Quote',
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Past date
      };

      const validationResult = await service.validate(invalidQuoteData);
      
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'validUntil',
            message: 'Valid until date must be in the future',
            code: 'INVALID_DATE'
          })
        ])
      );
    });

    test('should handle enhancement failure gracefully', async () => {
      const createdQuote = createMockQuote();
      mockQuoteRepository.create.mockResolvedValue(createMockRepositoryResult(createdQuote));
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Request not found')
      );

      const result = await service.create(validQuoteData);

      expect(result.success).toBe(true);
      expect(result.data.requestSummary).toBeUndefined(); // Enhancement should fail gracefully
    });

    test('should handle unexpected errors', async () => {
      mockQuoteRepository.create.mockRejectedValue(new Error('Unexpected error'));

      const result = await service.create(validQuoteData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create quote: Unexpected error');
    });
  });

  describe('findById() - Enhanced Quote Retrieval', () => {
    beforeEach(() => {
      const quote = createMockQuote({
        requestId: 'request-123',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days old
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days until expiry
      });

      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(quote));
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(createMockRequest())
      );
    });

    test('should return enhanced quote with business data', async () => {
      const result = await service.findById('quote-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const enhanced = result.data;
      expect(enhanced.id).toBe('quote-123');
      expect(enhanced.ageDays).toBe(5);
      expect(enhanced.daysUntilExpiry).toBe(10);
      expect(enhanced.isExpired).toBe(false);
      expect(enhanced.isExpiringSoon).toBe(false);
      expect(enhanced.conversionProbability).toBeDefined();
      expect(enhanced.revenueImpact).toBeDefined();
      expect(enhanced.requestSummary).toBeDefined();
    });

    test('should handle quote not found', async () => {
      mockQuoteRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Quote not found')
      );

      const result = await service.findById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quote not found');
    });
  });

  describe('findAll() - Enhanced Quote Listing', () => {
    test('should return enhanced quotes list', async () => {
      const quotes = [
        createMockQuote({ id: 'quote-1' }),
        createMockQuote({ id: 'quote-2' })
      ];

      mockQuoteRepository.findAll.mockResolvedValue(createMockRepositoryResult(quotes));
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false)
      );

      const result = await service.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].ageDays).toBeDefined();
      expect(result.data[1].ageDays).toBeDefined();
    });
  });

  describe('processWorkflow() - Business Workflow Management', () => {
    beforeEach(() => {
      const currentQuote = createMockQuote({
        status: 'Draft'
      });

      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(currentQuote));
      
      const updatedQuote = createMockQuote({
        status: 'Pending Review'
      });
      mockQuoteRepository.update.mockResolvedValue(createMockRepositoryResult(updatedQuote));

      // Mock enhancement
      mockRequestRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false)
      );
    });

    test('should process submitForReview workflow action', async () => {
      const result = await service.processWorkflow('quote-123', 'submitForReview');

      expect(result.success).toBe(true);
      expect(mockQuoteRepository.update).toHaveBeenCalledWith('quote-123', {
        status: 'Pending Review'
      });
    });

    test('should process send workflow action', async () => {
      const result = await service.processWorkflow('quote-123', 'send');

      expect(result.success).toBe(true);
      expect(mockQuoteRepository.update).toHaveBeenCalledWith('quote-123', {
        status: 'Sent'
      });
    });

    test('should process negotiate workflow action', async () => {
      const result = await service.processWorkflow('quote-123', 'negotiate');

      expect(result.success).toBe(true);
      expect(mockQuoteRepository.update).toHaveBeenCalledWith('quote-123', {
        status: 'Under Negotiation'
      });
    });

    test('should process finalizeTerms workflow action', async () => {
      const result = await service.processWorkflow('quote-123', 'finalizeTerms');

      expect(result.success).toBe(true);
      expect(mockQuoteRepository.update).toHaveBeenCalledWith('quote-123', {
        status: 'Approved'
      });
    });

    test('should process expire workflow action', async () => {
      const result = await service.processWorkflow('quote-123', 'expire');

      expect(result.success).toBe(true);
      expect(mockQuoteRepository.update).toHaveBeenCalledWith('quote-123', {
        status: 'Expired'
      });
    });

    test('should handle invalid workflow action', async () => {
      const result = await service.processWorkflow('quote-123', 'invalidAction');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid workflow action');
    });

    test('should handle quote not found', async () => {
      mockQuoteRepository.findById.mockResolvedValue(
        createMockRepositoryResult(null, false, 'Quote not found')
      );

      const result = await service.processWorkflow('nonexistent', 'send');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quote not found');
    });
  });

  describe('getBusinessState() - Business State Calculation', () => {
    test('should calculate business state for draft quote', async () => {
      const quote = createMockQuote({
        status: 'Draft',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days old
        validUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString() // 25 days until expiry
      });

      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(quote));

      const result = await service.getBusinessState('quote-123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('Draft');
      expect(result.data.stage).toBe('Preparation');
      expect(result.data.nextActions).toContain('submitForReview');
      expect(result.data.nextActions).toContain('edit');
      expect(result.data.metadata.ageDays).toBe(3);
      expect(result.data.metadata.daysUntilExpiry).toBe(25);
      expect(result.data.metadata.isExpired).toBe(false);
    });

    test('should calculate business state for sent quote', async () => {
      const quote = createMockQuote({
        status: 'Sent'
      });

      mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(quote));

      const result = await service.getBusinessState('quote-123');

      expect(result.success).toBe(true);
      expect(result.data.stage).toBe('Client Review');
      expect(result.data.nextActions).toContain('followUp');
      expect(result.data.nextActions).toContain('revise');
    });
  });

  describe('Business Logic Calculations', () => {
    describe('calculateAgeDays()', () => {
      test('should calculate age in days', () => {
        const quote = createMockQuote({
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        });

        const ageDays = service.calculateAgeDays(quote);
        expect(ageDays).toBe(7);
      });

      test('should handle missing createdAt', () => {
        const quote = createMockQuote({ createdAt: undefined });
        const ageDays = service.calculateAgeDays(quote);
        expect(ageDays).toBe(0);
      });
    });

    describe('calculateDaysUntilExpiry()', () => {
      test('should calculate days until expiry', () => {
        const quote = createMockQuote({
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
        });

        const daysUntilExpiry = service.calculateDaysUntilExpiry(quote);
        expect(daysUntilExpiry).toBe(14);
      });

      test('should return Infinity for quotes without expiry', () => {
        const quote = createMockQuote({ validUntil: undefined });
        const daysUntilExpiry = service.calculateDaysUntilExpiry(quote);
        expect(daysUntilExpiry).toBe(Infinity);
      });
    });

    describe('calculateIsExpired()', () => {
      test('should detect expired quotes', () => {
        const quote = createMockQuote({
          validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        });

        const isExpired = service.calculateIsExpired(quote);
        expect(isExpired).toBe(true);
      });

      test('should detect non-expired quotes', () => {
        const quote = createMockQuote({
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
        });

        const isExpired = service.calculateIsExpired(quote);
        expect(isExpired).toBe(false);
      });
    });

    describe('calculateIsExpiringSoon()', () => {
      test('should detect quotes expiring soon', () => {
        const quote = createMockQuote({
          validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
        });

        const isExpiringSoon = service.calculateIsExpiringSoon(quote);
        expect(isExpiringSoon).toBe(true);
      });

      test('should not mark distant expiry as expiring soon', () => {
        const quote = createMockQuote({
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        });

        const isExpiringSoon = service.calculateIsExpiringSoon(quote);
        expect(isExpiringSoon).toBe(false);
      });
    });

    describe('calculateConversionProbability()', () => {
      test('should calculate probability based on status', () => {
        const testCases = [
          { status: 'Draft', expectedMin: 45, expectedMax: 55 },
          { status: 'Viewed', expectedMin: 55, expectedMax: 65 },
          { status: 'Under Negotiation', expectedMin: 70, expectedMax: 80 },
          { status: 'Approved', expected: 100 },
          { status: 'Rejected', expected: 0 },
          { status: 'Expired', expected: 0 }
        ];

        for (const testCase of testCases) {
          const quote = createMockQuote({ status: testCase.status });
          const probability = service.calculateConversionProbability(quote);
          
          if (testCase.expected !== undefined) {
            expect(probability).toBe(testCase.expected);
          } else {
            expect(probability).toBeGreaterThanOrEqual(testCase.expectedMin);
            expect(probability).toBeLessThanOrEqual(testCase.expectedMax);
          }
        }
      });

      test('should factor in quote age', () => {
        const newQuote = createMockQuote({
          status: 'Draft',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days old
        });
        
        const oldQuote = createMockQuote({
          status: 'Draft',
          createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days old
        });

        const newProbability = service.calculateConversionProbability(newQuote);
        const oldProbability = service.calculateConversionProbability(oldQuote);
        
        expect(newProbability).toBeGreaterThan(oldProbability);
      });

      test('should factor in quote amount', () => {
        const lowAmountQuote = createMockQuote({
          status: 'Draft',
          totalAmount: 25000
        });
        
        const highAmountQuote = createMockQuote({
          status: 'Draft',
          totalAmount: 600000
        });

        const lowProbability = service.calculateConversionProbability(lowAmountQuote);
        const highProbability = service.calculateConversionProbability(highAmountQuote);
        
        expect(lowProbability).toBeGreaterThan(highProbability);
      });
    });

    describe('calculateRevenueImpact()', () => {
      test('should categorize revenue impact', () => {
        const testCases = [
          { amount: 25000, expected: 'low' },
          { amount: 75000, expected: 'medium' },
          { amount: 150000, expected: 'high' },
          { amount: null, expected: 'low' }
        ];

        for (const testCase of testCases) {
          const quote = createMockQuote({ totalAmount: testCase.amount });
          const impact = service.calculateRevenueImpact(quote);
          expect(impact).toBe(testCase.expected);
        }
      });
    });

    describe('calculateStage()', () => {
      test('should determine correct stage for each status', () => {
        const testCases = [
          { status: 'Draft', expected: 'Preparation' },
          { status: 'Pending Review', expected: 'Preparation' },
          { status: 'Sent', expected: 'Client Review' },
          { status: 'Viewed', expected: 'Client Review' },
          { status: 'Under Negotiation', expected: 'Negotiation' },
          { status: 'Approved', expected: 'Approved' },
          { status: 'Rejected', expected: 'Closed' },
          { status: 'Expired', expected: 'Closed' }
        ];

        for (const testCase of testCases) {
          const quote = createMockQuote({ status: testCase.status });
          const stage = service.calculateStage(quote);
          expect(stage).toBe(testCase.expected);
        }
      });
    });

    describe('getNextActions()', () => {
      test('should return valid next actions for each status', () => {
        const testCases = [
          { status: 'Draft', expectedActions: ['submitForReview', 'edit'] },
          { status: 'Pending Review', expectedActions: ['approve', 'requestRevisions'] },
          { status: 'Sent', expectedActions: ['followUp', 'revise'] },
          { status: 'Viewed', expectedActions: ['negotiate', 'followUp'] },
          { status: 'Under Negotiation', expectedActions: ['revise', 'finalizeTerms'] }
        ];

        for (const testCase of testCases) {
          const quote = createMockQuote({ status: testCase.status });
          const actions = service.getNextActions(quote);
          
          for (const expectedAction of testCase.expectedActions) {
            expect(actions).toContain(expectedAction);
          }
          
          // All quotes should have these universal actions
          expect(actions).toContain('duplicate');
          expect(actions).toContain('archive');
        }
      });
    });

    describe('getBlockedActions()', () => {
      test('should block edit/delete for approved quotes', () => {
        const quote = createMockQuote({ status: 'Approved' });
        const blockedActions = service.getBlockedActions(quote);
        expect(blockedActions).toContain('edit');
        expect(blockedActions).toContain('delete');
      });

      test('should block send/approve for expired quotes', () => {
        const quote = createMockQuote({
          validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Expired
        });
        const blockedActions = service.getBlockedActions(quote);
        expect(blockedActions).toContain('send');
        expect(blockedActions).toContain('approve');
      });
    });
  });

  describe('Business-Specific Methods', () => {
    describe('findExpiring()', () => {
      test('should find expiring quotes', async () => {
        const quotes = [createMockQuote()];
        mockQuoteRepository.findAll.mockResolvedValue(createMockRepositoryResult(quotes));
        mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

        const result = await service.findExpiring(7);

        expect(result.success).toBe(true);
        expect(mockQuoteRepository.findAll).toHaveBeenCalledWith({ filter: { isExpiringSoon: true } });
      });
    });

    describe('findByRequest()', () => {
      test('should find quotes by request ID', async () => {
        const quotes = [createMockQuote({ requestId: 'request-123' })];
        mockQuoteRepository.findByRequestId.mockResolvedValue(createMockRepositoryResult(quotes));

        const result = await service.findByRequest('request-123');

        expect(result.success).toBe(true);
        expect(mockQuoteRepository.findByRequestId).toHaveBeenCalledWith('request-123');
      });
    });

    describe('duplicateQuote()', () => {
      test('should duplicate quote with modifications', async () => {
        const originalQuote = createMockQuote({
          id: 'original-123',
          title: 'Original Quote'
        });
        
        mockQuoteRepository.findById.mockResolvedValue(createMockRepositoryResult(originalQuote));
        
        const duplicatedQuote = createMockQuote({
          id: 'duplicate-123',
          title: 'Copy of Original Quote'
        });
        
        mockQuoteRepository.create.mockResolvedValue(createMockRepositoryResult(duplicatedQuote));
        mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

        const result = await service.duplicateQuote('original-123', {
          title: 'Custom Copy Title'
        });

        expect(result.success).toBe(true);
        
        const createCall = mockQuoteRepository.create.mock.calls[0][0];
        expect(createCall.title).toBe('Custom Copy Title');
        expect(createCall.totalAmount).toBe(originalQuote.totalAmount);
      });

      test('should handle original quote not found', async () => {
        mockQuoteRepository.findById.mockResolvedValue(
          createMockRepositoryResult(null, false, 'Quote not found')
        );

        const result = await service.duplicateQuote('nonexistent');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Original quote not found');
      });
    });
  });

  describe('Helper Methods', () => {
    describe('generateQuoteNumber()', () => {
      test('should generate unique quote numbers', async () => {
        const number1 = await service.generateQuoteNumber();
        const number2 = await service.generateQuoteNumber();
        
        expect(number1).toMatch(/^Q\d{6}-\d{6}$/);
        expect(number2).toMatch(/^Q\d{6}-\d{6}$/);
        expect(number1).not.toBe(number2);
      });
    });

    describe('calculateTotalFromItems()', () => {
      test('should calculate total from item list', () => {
        const items = [
          { quantity: 2, unitPrice: 100 },
          { quantity: 3, unitPrice: 150 },
          { quantity: 1, unitPrice: 500 }
        ];

        const total = service.calculateTotalFromItems(items);
        expect(total).toBe(1150); // 200 + 450 + 500
      });

      test('should handle empty items array', () => {
        const total = service.calculateTotalFromItems([]);
        expect(total).toBe(0);
      });
    });

    describe('transformForPresentation()', () => {
      test('should transform quote for presentation', async () => {
        const quote = createMockQuote();
        mockRequestRepository.findById.mockResolvedValue(createMockRepositoryResult(null, false));

        const enhanced = await service.transformForPresentation(quote);

        expect(enhanced).toBeDefined();
        expect(enhanced.id).toBe(quote.id);
        expect(enhanced.ageDays).toBeDefined();
        expect(enhanced.daysUntilExpiry).toBeDefined();
        expect(enhanced.conversionProbability).toBeDefined();
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
      const result = await service.checkPermissions('edit', 'user-123');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    test('should handle repository errors gracefully', async () => {
      mockQuoteRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await service.findById('quote-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    test('should handle workflow processing errors', async () => {
      mockQuoteRepository.findById.mockRejectedValue(new Error('Workflow error'));

      const result = await service.processWorkflow('quote-123', 'send');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quote workflow processing failed: Workflow error');
    });

    test('should handle business state calculation errors', async () => {
      mockQuoteRepository.findById.mockRejectedValue(new Error('State calculation error'));

      const result = await service.getBusinessState('quote-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get quote business state: State calculation error');
    });
  });
});