/**
 * Quote service implementation
 * Handles all business logic for Quote entities
 */

import { BaseService, RequiredFieldRule } from '../core/BaseService';
import { IBusinessService, ServiceResult, BusinessState } from '../interfaces/IBaseService';
import { quoteRepository, QuoteRepository, Quote, QuoteFilter, QuoteCreateInput } from '../../repositories/QuoteRepository';
import { requestRepository } from '../../repositories/RequestRepository';
import { createLogger } from '../../utils/logger';

const logger = createLogger('QuoteService');

// Enhanced quote types for business logic
export interface EnhancedQuote extends Quote {
  // Computed business fields
  ageDays?: number;
  daysUntilExpiry?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean; // Within 7 days
  profitMargin?: number;
  
  // Related entity summaries
  requestSummary?: {
    id: string;
    status: string;
    message: string;
    clientName: string;
  };
  
  // Business metrics
  conversionProbability?: number;
  revenueImpact?: 'low' | 'medium' | 'high';
}

export interface QuoteBusinessFilter extends QuoteFilter {
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  profitMarginRange?: {
    min: number;
    max: number;
  };
  conversionProbability?: {
    min: number;
    max: number;
  };
}

export interface QuoteCreateData extends QuoteCreateInput {
  // Business-specific fields
  estimatedCost?: number; // For profit margin calculations
  laborHours?: number;
  materialCost?: number;
  
  // Quote line items
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    category?: string;
  }>;
}

// Quote status workflow
const QUOTE_STATUSES = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  UNDER_NEGOTIATION: 'Under Negotiation',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled'
} as const;

export class QuoteService extends BaseService<Quote, QuoteBusinessFilter, QuoteCreateData, Partial<Quote>, QuoteRepository> 
  implements IBusinessService<Quote, QuoteBusinessFilter> {
  
  protected repository = quoteRepository;
  protected entityName = 'Quote';

  constructor() {
    super();
    this.setupValidationRules();
  }

  private setupValidationRules() {
    // Core validation rules
    this.addValidationRule(new RequiredFieldRule('title', 'title', 'Title'));
    
    // Business-specific validation rules
    this.addValidationRule({
      name: 'totalAmountValidation',
      async validate(data: any) {
        if (!data.totalAmount) return { valid: true, errors: [] };
        
        const amount = Number(data.totalAmount);
        const isValidAmount = !isNaN(amount) && amount > 0;
        
        return {
          valid: isValidAmount,
          errors: isValidAmount ? [] : [{
            field: 'totalAmount',
            message: 'Total amount must be a positive number',
            code: 'INVALID_AMOUNT'
          }]
        };
      }
    });

    this.addValidationRule({
      name: 'validUntilFuture',
      async validate(data: any) {
        if (!data.validUntil) return { valid: true, errors: [] };
        
        const validUntil = new Date(data.validUntil);
        const now = new Date();
        const isFuture = validUntil > now;
        
        return {
          valid: isFuture,
          errors: isFuture ? [] : [{
            field: 'validUntil',
            message: 'Valid until date must be in the future',
            code: 'INVALID_DATE'
          }]
        };
      }
    });
  }

  // Enhanced CRUD operations with business logic
  async create(data: QuoteCreateData): Promise<ServiceResult<EnhancedQuote>> {
    try {
      logger.info('Creating quote with business logic', { data });
      
      // Generate quote number if not provided
      if (!data.quoteNumber) {
        data.quoteNumber = await this.generateQuoteNumber();
      }
      
      // Calculate total from items if provided
      if (data.items && data.items.length > 0) {
        data.totalAmount = this.calculateTotalFromItems(data.items);
      }
      
      // Set default valid until date (30 days from now)
      if (!data.validUntil) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
        data.validUntil = validUntil.toISOString();
      }
      
      // Use base service create
      const result = await super.create(data);
      
      if (!result.success) {
        return result as ServiceResult<EnhancedQuote>;
      }
      
      // Create quote items if provided
      if (data.items) {
        await this.createQuoteItems(result.data!.id, data.items);
      }
      
      // Enhance the result with business data
      const enhanced = await this.enhanceQuote(result.data!);
      
      return {
        success: true,
        data: enhanced,
        warnings: result.warnings
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in QuoteService.create', { error: errorMessage });
      return { success: false, error: `Failed to create quote: ${errorMessage}` };
    }
  }

  async findById(id: string): Promise<ServiceResult<EnhancedQuote>> {
    const result = await super.findById(id);
    if (!result.success) {
      return result as ServiceResult<EnhancedQuote>;
    }
    
    const enhanced = await this.enhanceQuote(result.data!);
    return { ...result, data: enhanced };
  }

  async findAll(options = {}): Promise<ServiceResult<EnhancedQuote[]>> {
    const result = await super.findAll(options);
    if (!result.success) {
      return result as ServiceResult<EnhancedQuote[]>;
    }
    
    const enhanced = await Promise.all(
      (result.data || []).map(quote => this.enhanceQuote(quote))
    );
    
    return { ...result, data: enhanced };
  }

  // Business workflow operations
  async processWorkflow(id: string, action: string, data?: any): Promise<ServiceResult<EnhancedQuote>> {
    try {
      logger.info('Processing quote workflow', { id, action, data });
      
      const currentQuote = await this.repository.findById(id);
      if (!currentQuote.success || !currentQuote.data) {
        return { success: false, error: 'Quote not found' };
      }
      
      const current = currentQuote.data;
      const updates = await this.calculateWorkflowUpdates(current, action, data);
      
      if (!updates) {
        return { success: false, error: `Invalid workflow action: ${action}` };
      }
      
      const result = await this.update(id, updates);
      
      // Trigger business notifications
      if (result.success) {
        await this.triggerWorkflowNotifications(id, action, result.data!);
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in quote workflow processing', { id, action, error: errorMessage });
      return { success: false, error: `Quote workflow processing failed: ${errorMessage}` };
    }
  }

  async getBusinessState(id: string): Promise<ServiceResult<BusinessState>> {
    try {
      const result = await this.repository.findById(id);
      if (!result.success || !result.data) {
        return { success: false, error: 'Quote not found' };
      }
      
      const quote = result.data;
      const businessState: BusinessState = {
        status: quote.status || QUOTE_STATUSES.DRAFT,
        stage: this.calculateStage(quote),
        nextActions: this.getNextActions(quote),
        blockedActions: this.getBlockedActions(quote),
        metadata: {
          ageDays: this.calculateAgeDays(quote),
          daysUntilExpiry: this.calculateDaysUntilExpiry(quote),
          isExpired: this.calculateIsExpired(quote),
          conversionProbability: this.calculateConversionProbability(quote)
        }
      };
      
      return { success: true, data: businessState };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting quote business state', { id, error: errorMessage });
      return { success: false, error: `Failed to get quote business state: ${errorMessage}` };
    }
  }

  async updateBusinessState(id: string, state: Partial<BusinessState>): Promise<ServiceResult<EnhancedQuote>> {
    const updates: Partial<Quote> = {};
    
    if (state.status) {
      updates.status = state.status;
    }
    
    return this.update(id, updates);
  }

  getBusinessRules() {
    return [
      {
        name: 'PreventEditingApprovedQuotes',
        description: 'Approved quotes cannot be edited',
        condition: (quote: Quote) => quote.status !== QUOTE_STATUSES.APPROVED,
        action: async (quote: Quote) => {
          throw new Error('Cannot edit approved quotes');
        }
      },
      {
        name: 'AutoExpireQuotes',
        description: 'Automatically expire quotes past their valid until date',
        condition: (quote: Quote) => {
          const validUntil = quote.validUntil ? new Date(quote.validUntil) : null;
          return validUntil ? validUntil < new Date() : false;
        },
        action: async (quote: Quote) => {
          // Auto-expire logic would be handled by a background job
        }
      }
    ];
  }

  async checkPermissions(action: string, userId?: string): Promise<boolean> {
    // Implement permission checking based on user roles and quote status
    return true; // Simplified for now
  }

  // Business-specific methods
  async findExpiring(days: number = 7): Promise<ServiceResult<EnhancedQuote[]>> {
    return this.findAll({ filter: { isExpiringSoon: true } });
  }

  async findByRequest(requestId: string): Promise<ServiceResult<EnhancedQuote[]>> {
    return this.repository.findByRequestId(requestId) as Promise<ServiceResult<EnhancedQuote[]>>;
  }

  async duplicateQuote(id: string, modifications?: Partial<QuoteCreateData>): Promise<ServiceResult<EnhancedQuote>> {
    try {
      const original = await this.repository.findById(id);
      if (!original.success || !original.data) {
        return { success: false, error: 'Original quote not found' };
      }
      
      const duplicateData: QuoteCreateData = {
        title: `Copy of ${original.data.title}`,
        description: original.data.description,
        totalAmount: original.data.totalAmount,
        terms: original.data.terms,
        notes: original.data.notes,
        requestId: original.data.requestId,
        agentContactId: original.data.agentContactId,
        homeownerContactId: original.data.homeownerContactId,
        addressId: original.data.addressId,
        ...modifications
      };
      
      return this.create(duplicateData);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error duplicating quote', { id, error: errorMessage });
      return { success: false, error: `Failed to duplicate quote: ${errorMessage}` };
    }
  }

  // Private business logic methods
  private async enhanceQuote(quote: Quote): Promise<EnhancedQuote> {
    const enhanced: EnhancedQuote = {
      ...quote,
      ageDays: this.calculateAgeDays(quote),
      daysUntilExpiry: this.calculateDaysUntilExpiry(quote),
      isExpired: this.calculateIsExpired(quote),
      isExpiringSoon: this.calculateIsExpiringSoon(quote),
      conversionProbability: this.calculateConversionProbability(quote),
      revenueImpact: this.calculateRevenueImpact(quote),
    };
    
    // Add related entity summaries
    if (quote.requestId) {
      const requestResult = await requestRepository.findById(quote.requestId);
      if (requestResult.success && requestResult.data) {
        const request = requestResult.data;
        enhanced.requestSummary = {
          id: request.id,
          status: request.status || 'Unknown',
          message: request.message || '',
          clientName: 'Client Name', // Would be resolved from contacts
        };
      }
    }
    
    return enhanced;
  }

  private calculateAgeDays(quote: Quote): number {
    if (!quote.createdAt) return 0;
    const created = new Date(quote.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateDaysUntilExpiry(quote: Quote): number {
    if (!quote.validUntil) return Infinity;
    const validUntil = new Date(quote.validUntil);
    const now = new Date();
    return Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateIsExpired(quote: Quote): boolean {
    return this.calculateDaysUntilExpiry(quote) < 0;
  }

  private calculateIsExpiringSoon(quote: Quote): boolean {
    const daysUntilExpiry = this.calculateDaysUntilExpiry(quote);
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  }

  private calculateConversionProbability(quote: Quote): number {
    let probability = 50; // Base 50%
    
    // Status affects probability
    switch (quote.status) {
      case QUOTE_STATUSES.VIEWED:
        probability += 10;
        break;
      case QUOTE_STATUSES.UNDER_NEGOTIATION:
        probability += 25;
        break;
      case QUOTE_STATUSES.APPROVED:
        probability = 100;
        break;
      case QUOTE_STATUSES.REJECTED:
      case QUOTE_STATUSES.EXPIRED:
        probability = 0;
        break;
    }
    
    // Age affects probability (newer quotes more likely to convert)
    const ageDays = this.calculateAgeDays(quote);
    if (ageDays > 30) probability -= 20;
    else if (ageDays > 14) probability -= 10;
    
    // Amount affects probability (very high amounts less likely)
    if (quote.totalAmount) {
      if (quote.totalAmount > 500000) probability -= 15;
      else if (quote.totalAmount > 100000) probability -= 5;
    }
    
    return Math.max(0, Math.min(100, probability));
  }

  private calculateRevenueImpact(quote: Quote): 'low' | 'medium' | 'high' {
    if (!quote.totalAmount) return 'low';
    
    if (quote.totalAmount > 100000) return 'high';
    if (quote.totalAmount > 50000) return 'medium';
    return 'low';
  }

  private calculateStage(quote: Quote): string {
    const status = quote.status;
    
    if ([QUOTE_STATUSES.DRAFT, QUOTE_STATUSES.PENDING_REVIEW].includes(status as any)) {
      return 'Preparation';
    } else if ([QUOTE_STATUSES.SENT, QUOTE_STATUSES.VIEWED].includes(status as any)) {
      return 'Client Review';
    } else if (status === QUOTE_STATUSES.UNDER_NEGOTIATION) {
      return 'Negotiation';
    } else if (status === QUOTE_STATUSES.APPROVED) {
      return 'Approved';
    } else {
      return 'Closed';
    }
  }

  private getNextActions(quote: Quote): string[] {
    const status = quote.status;
    const actions: string[] = [];
    
    switch (status) {
      case QUOTE_STATUSES.DRAFT:
        actions.push('submitForReview', 'edit');
        break;
      case QUOTE_STATUSES.PENDING_REVIEW:
        actions.push('approve', 'requestRevisions');
        break;
      case QUOTE_STATUSES.SENT:
        actions.push('followUp', 'revise');
        break;
      case QUOTE_STATUSES.VIEWED:
        actions.push('negotiate', 'followUp');
        break;
      case QUOTE_STATUSES.UNDER_NEGOTIATION:
        actions.push('revise', 'finalizeTerms');
        break;
    }
    
    // Always allow certain actions
    actions.push('duplicate', 'archive');
    
    return actions;
  }

  private getBlockedActions(quote: Quote): string[] {
    const blocked: string[] = [];
    
    if (quote.status === QUOTE_STATUSES.APPROVED) {
      blocked.push('edit', 'delete');
    }
    
    if (this.calculateIsExpired(quote)) {
      blocked.push('send', 'approve');
    }
    
    return blocked;
  }

  private async calculateWorkflowUpdates(
    current: Quote, 
    action: string, 
    data?: any
  ): Promise<Partial<Quote> | null> {
    const updates: Partial<Quote> = {};
    
    switch (action) {
      case 'submitForReview':
        updates.status = QUOTE_STATUSES.PENDING_REVIEW;
        break;
        
      case 'approve':
        updates.status = QUOTE_STATUSES.SENT;
        break;
        
      case 'send':
        updates.status = QUOTE_STATUSES.SENT;
        break;
        
      case 'markViewed':
        updates.status = QUOTE_STATUSES.VIEWED;
        break;
        
      case 'negotiate':
        updates.status = QUOTE_STATUSES.UNDER_NEGOTIATION;
        break;
        
      case 'finalizeTerms':
        updates.status = QUOTE_STATUSES.APPROVED;
        break;
        
      case 'reject':
        updates.status = QUOTE_STATUSES.REJECTED;
        break;
        
      case 'expire':
        updates.status = QUOTE_STATUSES.EXPIRED;
        break;
        
      default:
        return null;
    }
    
    return updates;
  }

  private async triggerWorkflowNotifications(id: string, action: string, quote: Quote): Promise<void> {
    logger.info('Triggering quote workflow notifications', { id, action, status: quote.status });
    // Notification logic would go here
  }

  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `Q${year}${month}-${timestamp}`;
  }

  private calculateTotalFromItems(items: Array<{ quantity: number; unitPrice: number }>): number {
    return items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  }

  private async createQuoteItems(quoteId: string, items: any[]): Promise<void> {
    // This would create quote items in the database
    logger.info('Creating quote items', { quoteId, itemCount: items.length });
    // Implementation would depend on QuoteItems repository
  }

  // Transform methods for BaseService
  protected async transformForPresentation(data: Quote): Promise<EnhancedQuote> {
    return this.enhanceQuote(data);
  }
}

// Export singleton instance
export const quoteService = new QuoteService();