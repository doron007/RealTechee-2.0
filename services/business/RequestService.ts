/**
 * Request service implementation
 * Handles all business logic for Request entities
 */

import { BaseService, RequiredFieldRule, EmailValidationRule } from '../core/BaseService';
import { IBusinessService, ServiceResult, BusinessState } from '../interfaces/IBaseService';
import { requestRepository, RequestRepository, Request, RequestFilter, RequestCreateInput } from '../../repositories/RequestRepository';
import { contactRepository } from '../../repositories/ContactRepository';
import { propertyRepository } from '../../repositories/PropertyRepository';
import { createLogger } from '../../utils/logger';

const logger = createLogger('RequestService');

// Enhanced request types for business logic
export interface EnhancedRequest extends Request {
  // Computed business fields
  ageDays?: number;
  isPastDue?: boolean;
  nextActionRequired?: string;
  priorityScore?: number;
  
  // Related entity summaries
  agentSummary?: {
    name: string;
    email: string;
    phone: string;
    brokerage: string;
  };
  homeownerSummary?: {
    name: string;
    email: string;
    phone: string;
  };
  propertySummary?: {
    address: string;
    type: string;
    bedrooms?: number;
    bathrooms?: number;
  };
}

export interface RequestBusinessFilter extends RequestFilter {
  isPastDue?: boolean;
  priorityRange?: {
    min: number;
    max: number;
  };
  ageDaysRange?: {
    min: number;
    max: number;
  };
  nextActionRequired?: string;
}

export interface RequestCreateData {
  // Core request data
  message: string;
  relationToProperty?: string;
  budget?: string;
  leadSource?: string;
  
  // Contact information (will create contacts if needed)
  agentInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    brokerage?: string;
  };
  homeownerInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  
  // Property information (will create property if needed)
  propertyInfo?: {
    houseAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
  };
}

// Request status workflow
const REQUEST_STATUSES = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  NEEDS_INFO: 'Needs Information',
  QUOTED: 'Quoted',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
} as const;

export class RequestService extends BaseService<Request, RequestBusinessFilter, RequestCreateData, Partial<Request>, RequestRepository> 
  implements IBusinessService<Request, RequestBusinessFilter> {
  
  protected repository = requestRepository;
  protected entityName = 'Request';

  constructor() {
    super();
    this.setupValidationRules();
  }

  private setupValidationRules() {
    // Core validation rules
    this.addValidationRule(new RequiredFieldRule('message', 'message', 'Message'));
    
    // Business-specific validation rules
    this.addValidationRule({
      name: 'budgetFormat',
      async validate(data: any) {
        if (!data.budget) return { valid: true, errors: [] };
        
        const budget = String(data.budget).replace(/[,$]/g, '');
        const isNumeric = /^\d+$/.test(budget);
        
        return {
          valid: isNumeric,
          errors: isNumeric ? [] : [{
            field: 'budget',
            message: 'Budget must be a valid number',
            code: 'INVALID_BUDGET'
          }]
        };
      }
    });
  }

  // Enhanced CRUD operations with business logic
  async create(data: RequestCreateData): Promise<ServiceResult<EnhancedRequest>> {
    try {
      logger.info('Creating request with business logic', { data });
      
      // Create or find contacts
      let agentContactId: string | undefined;
      let homeownerContactId: string | undefined;
      
      if (data.agentInfo) {
        const agentResult = await this.findOrCreateContact(data.agentInfo, 'agent');
        if (!agentResult.success) {
          return { success: false, error: `Failed to create agent contact: ${agentResult.error}` };
        }
        agentContactId = agentResult.data!.id;
      }
      
      if (data.homeownerInfo) {
        const homeownerResult = await this.findOrCreateContact(data.homeownerInfo, 'homeowner');
        if (!homeownerResult.success) {
          return { success: false, error: `Failed to create homeowner contact: ${homeownerResult.error}` };
        }
        homeownerContactId = homeownerResult.data!.id;
      }
      
      // Create or find property
      let addressId: string | undefined;
      if (data.propertyInfo) {
        const propertyResult = await this.findOrCreateProperty(data.propertyInfo);
        if (!propertyResult.success) {
          return { success: false, error: `Failed to create property: ${propertyResult.error}` };
        }
        addressId = propertyResult.data!.id;
      }
      
      // Create request input
      const requestInput: RequestCreateInput = {
        status: REQUEST_STATUSES.NEW,
        message: data.message || 'No message provided',
        relationToProperty: data.relationToProperty,
        budget: data.budget,
        leadSource: data.leadSource,
        agentContactId,
        homeownerContactId,
        addressId,
      };
      
      // Use base service create
      const result = await super.create(requestInput as any);
      
      if (!result.success) {
        return result as ServiceResult<EnhancedRequest>;
      }
      
      // Enhance the result with business data
      const enhanced = await this.enhanceRequest(result.data!);
      
      return {
        success: true,
        data: enhanced,
        warnings: result.warnings
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in RequestService.create', { error: errorMessage });
      return { success: false, error: `Failed to create request: ${errorMessage}` };
    }
  }

  async findById(id: string): Promise<ServiceResult<EnhancedRequest>> {
    const result = await super.findById(id);
    if (!result.success) {
      return result as ServiceResult<EnhancedRequest>;
    }
    
    const enhanced = await this.enhanceRequest(result.data!);
    return { ...result, data: enhanced };
  }

  async findAll(options = {}): Promise<ServiceResult<EnhancedRequest[]>> {
    const result = await super.findAll(options);
    if (!result.success) {
      return result as ServiceResult<EnhancedRequest[]>;
    }
    
    const enhanced = await Promise.all(
      (result.data || []).map(request => this.enhanceRequest(request))
    );
    
    return { ...result, data: enhanced };
  }

  // Business workflow operations
  async processWorkflow(id: string, action: string, data?: any): Promise<ServiceResult<EnhancedRequest>> {
    try {
      logger.info('Processing request workflow', { id, action, data });
      
      const currentRequest = await this.repository.findById(id);
      if (!currentRequest.success || !currentRequest.data) {
        return { success: false, error: 'Request not found' };
      }
      
      const current = currentRequest.data;
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
      logger.error('Error in workflow processing', { id, action, error: errorMessage });
      return { success: false, error: `Workflow processing failed: ${errorMessage}` };
    }
  }

  async getBusinessState(id: string): Promise<ServiceResult<BusinessState>> {
    try {
      const result = await this.repository.findById(id);
      if (!result.success || !result.data) {
        return { success: false, error: 'Request not found' };
      }
      
      const request = result.data;
      const businessState: BusinessState = {
        status: request.status || REQUEST_STATUSES.NEW,
        stage: this.calculateStage(request),
        nextActions: this.getNextActions(request),
        blockedActions: this.getBlockedActions(request),
        metadata: {
          ageDays: this.calculateAgeDays(request),
          isPastDue: this.calculateIsPastDue(request),
          priorityScore: this.calculatePriorityScore(request)
        }
      };
      
      return { success: true, data: businessState };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting business state', { id, error: errorMessage });
      return { success: false, error: `Failed to get business state: ${errorMessage}` };
    }
  }

  async updateBusinessState(id: string, state: Partial<BusinessState>): Promise<ServiceResult<EnhancedRequest>> {
    const updates: Partial<Request> = {};
    
    if (state.status) {
      updates.status = state.status;
    }
    
    return this.update(id, updates);
  }

  getBusinessRules() {
    return [
      {
        name: 'RequireContactForQuote',
        description: 'A request must have at least one contact to move to quoted status',
        condition: (request: Request) => !!request.homeownerContactId || !!request.agentContactId,
        action: async (request: Request) => {
          // Business rule enforcement logic
        }
      },
      {
        name: 'AutoAssignByLeadSource',
        description: 'Automatically assign requests based on lead source',
        condition: (request: Request) => !!request.leadSource && !request.assignedTo,
        action: async (request: Request) => {
          // Auto-assignment logic based on lead source
        }
      }
    ];
  }

  async checkPermissions(action: string, userId?: string): Promise<boolean> {
    // Implement permission checking based on user roles and request status
    return true; // Simplified for now
  }

  // Business logic methods
  private async enhanceRequest(request: Request): Promise<EnhancedRequest> {
    const enhanced: EnhancedRequest = {
      ...request,
      ageDays: this.calculateAgeDays(request),
      isPastDue: this.calculateIsPastDue(request),
      nextActionRequired: this.calculateNextAction(request),
      priorityScore: this.calculatePriorityScore(request),
    };
    
    // Add related entity summaries
    if (request.agentContactId) {
      const agentResult = await contactRepository.findById(request.agentContactId);
      if (agentResult.success && agentResult.data) {
        const agent = agentResult.data;
        enhanced.agentSummary = {
          name: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`.trim(),
          email: agent.email || '',
          phone: agent.phone || agent.mobile || '',
          brokerage: agent.brokerage || '',
        };
      }
    }
    
    if (request.homeownerContactId) {
      const homeownerResult = await contactRepository.findById(request.homeownerContactId);
      if (homeownerResult.success && homeownerResult.data) {
        const homeowner = homeownerResult.data;
        enhanced.homeownerSummary = {
          name: homeowner.fullName || `${homeowner.firstName || ''} ${homeowner.lastName || ''}`.trim(),
          email: homeowner.email || '',
          phone: homeowner.phone || homeowner.mobile || '',
        };
      }
    }
    
    if (request.addressId) {
      const propertyResult = await propertyRepository.findById(request.addressId);
      if (propertyResult.success && propertyResult.data) {
        const property = propertyResult.data;
        enhanced.propertySummary = {
          address: property.propertyFullAddress || 
                  `${property.houseAddress || ''}, ${property.city || ''}, ${property.state || ''}`.trim(),
          type: property.propertyType || '',
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
        };
      }
    }
    
    return enhanced;
  }

  private calculateAgeDays(request: Request): number {
    if (!request.createdAt) return 0;
    const created = new Date(request.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateIsPastDue(request: Request): boolean {
    // Business rule: requests are past due after 7 days without progress
    const ageDays = this.calculateAgeDays(request);
    const hasRecentActivity = request.updatedAt !== request.createdAt;
    return ageDays > 7 && !hasRecentActivity;
  }

  private calculateNextAction(request: Request): string {
    const status = request.status;
    
    switch (status) {
      case REQUEST_STATUSES.NEW:
        return 'Assign to team member';
      case REQUEST_STATUSES.ASSIGNED:
        return 'Begin initial assessment';
      case REQUEST_STATUSES.IN_PROGRESS:
        return 'Continue assessment or request more information';
      case REQUEST_STATUSES.NEEDS_INFO:
        return 'Follow up with client for additional information';
      case REQUEST_STATUSES.QUOTED:
        return 'Follow up on quote status';
      default:
        return 'Review request status';
    }
  }

  private calculatePriorityScore(request: Request): number {
    let score = 0;
    
    // Age factor (older = higher priority)
    const ageDays = this.calculateAgeDays(request);
    score += Math.min(ageDays * 2, 20);
    
    // Budget factor (higher budget = higher priority)
    if (request.budget) {
      const budget = parseFloat(request.budget.replace(/[,$]/g, ''));
      if (budget > 100000) score += 15;
      else if (budget > 50000) score += 10;
      else if (budget > 25000) score += 5;
    }
    
    // Lead source factor
    if (request.leadSource === 'referral') score += 10;
    else if (request.leadSource === 'website') score += 5;
    
    return Math.min(score, 100); // Cap at 100
  }

  private calculateStage(request: Request): string {
    const status = request.status;
    
    if ([REQUEST_STATUSES.NEW, REQUEST_STATUSES.ASSIGNED].includes(status as any)) {
      return 'Initial';
    } else if ([REQUEST_STATUSES.IN_PROGRESS, REQUEST_STATUSES.NEEDS_INFO].includes(status as any)) {
      return 'Assessment';
    } else if (status === REQUEST_STATUSES.QUOTED) {
      return 'Quoted';
    } else if ([REQUEST_STATUSES.APPROVED, REQUEST_STATUSES.COMPLETED].includes(status as any)) {
      return 'Execution';
    } else {
      return 'Closed';
    }
  }

  private getNextActions(request: Request): string[] {
    const status = request.status;
    const actions: string[] = [];
    
    switch (status) {
      case REQUEST_STATUSES.NEW:
        actions.push('assign', 'needsInfo');
        break;
      case REQUEST_STATUSES.ASSIGNED:
        actions.push('startProgress', 'needsInfo');
        break;
      case REQUEST_STATUSES.IN_PROGRESS:
        actions.push('createQuote', 'needsInfo', 'complete');
        break;
      case REQUEST_STATUSES.NEEDS_INFO:
        actions.push('continueProgress', 'createQuote');
        break;
      case REQUEST_STATUSES.QUOTED:
        actions.push('approve', 'reviseQuote');
        break;
    }
    
    // Always allow status updates and cancellation
    actions.push('updateStatus', 'cancel');
    
    return actions;
  }

  private getBlockedActions(request: Request): string[] {
    const blocked: string[] = [];
    
    // Business rules for blocked actions
    if (!request.homeownerContactId && !request.agentContactId) {
      blocked.push('createQuote', 'approve');
    }
    
    if (request.status === REQUEST_STATUSES.COMPLETED) {
      blocked.push('assign', 'startProgress', 'createQuote');
    }
    
    return blocked;
  }

  private async calculateWorkflowUpdates(
    current: Request, 
    action: string, 
    data?: any
  ): Promise<Partial<Request> | null> {
    const updates: Partial<Request> = {};
    
    switch (action) {
      case 'assign':
        updates.status = REQUEST_STATUSES.ASSIGNED;
        updates.assignedTo = data?.assignedTo;
        updates.assignedDate = new Date().toISOString();
        break;
        
      case 'startProgress':
        updates.status = REQUEST_STATUSES.IN_PROGRESS;
        break;
        
      case 'needsInfo':
        updates.status = REQUEST_STATUSES.NEEDS_INFO;
        break;
        
      case 'createQuote':
        updates.status = REQUEST_STATUSES.QUOTED;
        updates.moveToQuotingDate = new Date().toISOString();
        break;
        
      case 'approve':
        updates.status = REQUEST_STATUSES.APPROVED;
        break;
        
      case 'complete':
        updates.status = REQUEST_STATUSES.COMPLETED;
        break;
        
      case 'cancel':
        updates.status = REQUEST_STATUSES.CANCELLED;
        updates.archivedDate = new Date().toISOString();
        break;
        
      default:
        return null;
    }
    
    return updates;
  }

  private async triggerWorkflowNotifications(id: string, action: string, request: Request): Promise<void> {
    // Business notification logic would go here
    logger.info('Triggering workflow notifications', { id, action, status: request.status });
    
    // Example: Send email notifications, create tasks, update dashboards, etc.
  }

  private async findOrCreateContact(contactInfo: any, type: 'agent' | 'homeowner') {
    // Try to find existing contact by email
    if (contactInfo.email) {
      const existing = await contactRepository.findByEmail(contactInfo.email);
      if (existing.success && existing.data) {
        return existing;
      }
    }
    
    // Create new contact
    return contactRepository.create({
      ...contactInfo,
      contactType: type,
    });
  }

  private async findOrCreateProperty(propertyInfo: any) {
    // Try to find existing property by address
    const addressString = `${propertyInfo.houseAddress || ''}, ${propertyInfo.city || ''}, ${propertyInfo.state || ''}`.trim();
    
    if (addressString) {
      const existing = await propertyRepository.findByAddress(addressString);
      if (existing.success && existing.data && existing.data.length > 0) {
        return { success: true, data: existing.data[0] };
      }
    }
    
    // Create new property
    return propertyRepository.create({
      ...propertyInfo,
      propertyFullAddress: addressString,
    });
  }

  // Transform methods for BaseService
  protected async transformForPresentation(data: Request): Promise<EnhancedRequest> {
    return this.enhanceRequest(data);
  }
}

// Export singleton instance
export const requestService = new RequestService();