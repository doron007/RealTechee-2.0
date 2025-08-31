/**
 * Request Workflow Service
 * 
 * Manages the business logic for request status progressions and workflow automation.
 * Handles the lifecycle from initial submission through quote-ready status with 
 * automated rules, validations, and notifications.
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { createLogger } from '../utils/logger';
import { caseManagementService } from './caseManagementService';
import type { StatusChange, InformationItem } from './caseManagementService';

const client = generateClient<Schema>({ authMode: 'apiKey' });
const logger = createLogger('RequestWorkflowService');

// Workflow definitions
export const REQUEST_STATUSES = {
  NEW: 'New',
  IN_REVIEW: 'In Review',
  INFORMATION_GATHERING: 'Information Gathering',
  SCOPE_DEFINITION: 'Scope Definition',
  QUOTE_READY: 'Quote Ready',
  QUOTED: 'Quoted',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
} as const;

export type RequestStatus = typeof REQUEST_STATUSES[keyof typeof REQUEST_STATUSES];

// Status transition rules
export const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [REQUEST_STATUSES.NEW]: [
    REQUEST_STATUSES.IN_REVIEW,
    REQUEST_STATUSES.ON_HOLD,
    REQUEST_STATUSES.CANCELLED
  ],
  [REQUEST_STATUSES.IN_REVIEW]: [
    REQUEST_STATUSES.INFORMATION_GATHERING,
    REQUEST_STATUSES.SCOPE_DEFINITION,
    REQUEST_STATUSES.ON_HOLD,
    REQUEST_STATUSES.CANCELLED
  ],
  [REQUEST_STATUSES.INFORMATION_GATHERING]: [
    REQUEST_STATUSES.IN_REVIEW,
    REQUEST_STATUSES.SCOPE_DEFINITION,
    REQUEST_STATUSES.ON_HOLD,
    REQUEST_STATUSES.CANCELLED
  ],
  [REQUEST_STATUSES.SCOPE_DEFINITION]: [
    REQUEST_STATUSES.INFORMATION_GATHERING,
    REQUEST_STATUSES.QUOTE_READY,
    REQUEST_STATUSES.ON_HOLD,
    REQUEST_STATUSES.CANCELLED
  ],
  [REQUEST_STATUSES.QUOTE_READY]: [
    REQUEST_STATUSES.QUOTED,
    REQUEST_STATUSES.SCOPE_DEFINITION,
    REQUEST_STATUSES.ON_HOLD,
    REQUEST_STATUSES.CANCELLED
  ],
  [REQUEST_STATUSES.QUOTED]: [
    REQUEST_STATUSES.ON_HOLD,
    REQUEST_STATUSES.EXPIRED,
    REQUEST_STATUSES.CANCELLED
  ],
  [REQUEST_STATUSES.ON_HOLD]: [
    REQUEST_STATUSES.IN_REVIEW,
    REQUEST_STATUSES.INFORMATION_GATHERING,
    REQUEST_STATUSES.SCOPE_DEFINITION,
    REQUEST_STATUSES.CANCELLED
  ],
  [REQUEST_STATUSES.CANCELLED]: [], // Terminal state
  [REQUEST_STATUSES.EXPIRED]: [
    REQUEST_STATUSES.IN_REVIEW // Allow reactivation
  ],
};

// Workflow automation rules
export interface WorkflowRule {
  name: string;
  description: string;
  trigger: 'status_change' | 'time_based' | 'completion_based';
  conditions: any;
  actions: Array<{
    type: 'status_change' | 'assignment' | 'notification' | 'create_task';
    parameters: any;
  }>;
}

export interface WorkflowValidation {
  isValid: boolean;
  message?: string;
  requiredActions?: string[];
}

/**
 * Request Workflow Service Class
 * 
 * Manages the comprehensive workflow for requests including status transitions,
 * automation rules, validation logic, and business process enforcement.
 */
class RequestWorkflowService {
  
  // =============================================================================
  // STATUS TRANSITION MANAGEMENT
  // =============================================================================
  
  /**
   * Validate if a status transition is allowed
   */
  async validateStatusTransition(
    requestId: string,
    currentStatus: RequestStatus,
    newStatus: RequestStatus,
    userId: string
  ): Promise<WorkflowValidation> {
    try {
      logger.info('Validating status transition', { requestId, currentStatus, newStatus });
      
      // Check if transition is allowed by rules
      const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedTransitions.includes(newStatus)) {
        return {
          isValid: false,
          message: `Transition from "${currentStatus}" to "${newStatus}" is not allowed`
        };
      }
      
      // Status-specific validations
      const validation = await this.validateStatusRequirements(requestId, newStatus);
      if (!validation.isValid) {
        return validation;
      }
      
      return { isValid: true };
    } catch (error) {
      logger.error('Error validating status transition', error);
      return {
        isValid: false,
        message: 'Error validating transition'
      };
    }
  }
  
  /**
   * Execute status transition with all business logic
   */
  async transitionStatus(
    requestId: string,
    newStatus: RequestStatus,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current status
  const requestResult = await (client.models as any).Requests.get({ id: requestId });
      if (!requestResult.data) {
        return { success: false, error: 'Request not found' };
      }
      
      const currentStatus = requestResult.data.status as RequestStatus;
      
      // Validate transition
      const validation = await this.validateStatusTransition(requestId, currentStatus, newStatus, userId);
      if (!validation.isValid) {
        return { success: false, error: validation.message };
      }
      
      // Execute the transition
      const statusChange: StatusChange = {
        requestId,
        previousStatus: currentStatus,
        newStatus,
        statusReason: reason,
        triggeredBy: 'user',
        triggeredById: userId,
        triggeredByName: 'User', // TODO: Get actual user name
        businessImpact: this.getBusinessImpact(currentStatus, newStatus),
      };
      
      const result = await caseManagementService.changeRequestStatus(statusChange);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      // Execute post-transition actions
      await this.executePostTransitionActions(requestId, currentStatus, newStatus, userId);
      
      return { success: true };
    } catch (error) {
      logger.error('Error transitioning status', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get allowed transitions for current status
   */
  getAllowedTransitions(currentStatus: RequestStatus): RequestStatus[] {
    return STATUS_TRANSITIONS[currentStatus] || [];
  }
  
  // =============================================================================
  // WORKFLOW AUTOMATION
  // =============================================================================
  
  /**
   * Initialize default workflow for new request
   */
  async initializeRequestWorkflow(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Initializing request workflow', { requestId });
      
      // Create standard information gathering checklist
      const standardInfoItems: InformationItem[] = [
        {
          requestId,
          category: 'property',
          itemName: 'Property Address Verification',
          description: 'Confirm exact property address and access requirements',
          status: 'missing',
          importance: 'required',
        },
        {
          requestId,
          category: 'client',
          itemName: 'Client Contact Information',
          description: 'Complete client contact details including preferred communication method',
          status: 'missing',
          importance: 'required',
        },
        {
          requestId,
          category: 'project',
          itemName: 'Project Timeline Requirements',
          description: 'Client\'s preferred start date and completion timeline',
          status: 'missing',
          importance: 'important',
        },
        {
          requestId,
          category: 'financial',
          itemName: 'Budget Confirmation',
          description: 'Confirm and document realistic budget expectations',
          status: 'missing',
          importance: 'required',
        },
        {
          requestId,
          category: 'technical',
          itemName: 'Site Assessment Requirements',
          description: 'Determine need for on-site visit or virtual assessment',
          status: 'missing',
          importance: 'required',
        },
      ];
      
      // Add information items
      for (const item of standardInfoItems) {
        await caseManagementService.addInformationItem(item);
      }
      
      // Create workflow state record
  await (client.models as any).RequestWorkflowStates.create({
        requestId,
        workflowName: 'standard_request_workflow',
        currentState: 'initialization',
        availableActions: JSON.stringify(['assign_ae', 'schedule_review']),
        stateData: JSON.stringify({
          initialized: true,
          initializationDate: new Date().toISOString(),
        }),
        progress: 10,
        totalSteps: 10,
        completedSteps: 1,
        startedAt: new Date().toISOString(),
        automationEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Error initializing request workflow', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Check for automated workflow triggers
   */
  async checkWorkflowAutomation(requestId: string): Promise<{ success: boolean; actions?: string[]; error?: string }> {
    try {
      const actions: string[] = [];
      
      // Get request data
  const requestResult = await (client.models as any).Requests.get({ id: requestId });
      if (!requestResult.data) {
        return { success: false, error: 'Request not found' };
      }
      
      const request = requestResult.data;
      const currentStatus = request.status as RequestStatus;
      
      // Check for automatic status progression
      if (currentStatus === REQUEST_STATUSES.INFORMATION_GATHERING) {
        const infoComplete = await this.isInformationGatheringComplete(requestId);
        if (infoComplete) {
          actions.push(`Auto-transition to ${REQUEST_STATUSES.SCOPE_DEFINITION}`);
        }
      }
      
      if (currentStatus === REQUEST_STATUSES.SCOPE_DEFINITION) {
        const scopeComplete = await this.isScopeDefinitionComplete(requestId);
        if (scopeComplete) {
          actions.push(`Auto-transition to ${REQUEST_STATUSES.QUOTE_READY}`);
        }
      }
      
      // Check for follow-up requirements
      const followUpNeeded = await this.checkFollowUpRequirements(requestId);
      if (followUpNeeded.length > 0) {
        actions.push(...followUpNeeded);
      }
      
      // Check for stale requests
      const staleCheck = await this.checkForStaleRequest(requestId);
      if (staleCheck.isStale) {
        actions.push(staleCheck.action);
      }
      
      return { success: true, actions };
    } catch (error) {
      logger.error('Error checking workflow automation', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // =============================================================================
  // BUSINESS LOGIC VALIDATION
  // =============================================================================
  
  /**
   * Validate requirements for specific status
   */
  private async validateStatusRequirements(requestId: string, status: RequestStatus): Promise<WorkflowValidation> {
    try {
      switch (status) {
        case REQUEST_STATUSES.SCOPE_DEFINITION:
          return await this.validateScopeDefinitionRequirements(requestId);
        
        case REQUEST_STATUSES.QUOTE_READY:
          return await this.validateQuoteReadyRequirements(requestId);
        
        default:
          return { isValid: true };
      }
    } catch (error) {
      return {
        isValid: false,
        message: 'Error validating requirements'
      };
    }
  }
  
  /**
   * Validate requirements for scope definition phase
   */
  private async validateScopeDefinitionRequirements(requestId: string): Promise<WorkflowValidation> {
    const requiredActions: string[] = [];
    
    // Check if basic information is gathered
    const infoResult = await caseManagementService.getInformationChecklist(requestId);
    if (infoResult.success && infoResult.data) {
      const requiredItems = infoResult.data.filter(item => 
        item.importance === 'required' && item.status !== 'verified'
      );
      
      if (requiredItems.length > 0) {
        requiredActions.push(`Complete ${requiredItems.length} required information items`);
      }
    }
    
    // Check if client contact has been established
    const notesResult = await caseManagementService.getRequestNotes(requestId, { 
      type: 'client_communication' 
    });
    
    if (notesResult.success && notesResult.data) {
      const recentContact = notesResult.data.some(note => {
        const noteDate = new Date(note.createdAt || '');
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        return noteDate > threeDaysAgo;
      });
      
      if (!recentContact) {
        requiredActions.push('Establish recent client communication');
      }
    }
    
    return {
      isValid: requiredActions.length === 0,
      message: requiredActions.length > 0 ? 'Requirements not met for scope definition' : undefined,
      requiredActions
    };
  }
  
  /**
   * Validate requirements for quote-ready status
   */
  private async validateQuoteReadyRequirements(requestId: string): Promise<WorkflowValidation> {
    const requiredActions: string[] = [];
    
    // Check scope definition completeness
    const scopeResult = await caseManagementService.getScopeDefinition(requestId);
    if (scopeResult.success && scopeResult.data) {
      const approvedItems = scopeResult.data.filter(item => item.status === 'approved');
      if (approvedItems.length === 0) {
        requiredActions.push('Define and approve at least one scope item');
      }
    } else {
      requiredActions.push('Create scope definition');
    }
    
    // Check readiness score
    const overviewResult = await caseManagementService.getCaseOverview(requestId);
    if (overviewResult.success && overviewResult.data) {
      if (overviewResult.data.readinessScore < 80) {
        requiredActions.push(`Improve readiness score (currently ${overviewResult.data.readinessScore}/100)`);
      }
    }
    
    return {
      isValid: requiredActions.length === 0,
      message: requiredActions.length > 0 ? 'Requirements not met for quote-ready status' : undefined,
      requiredActions
    };
  }
  
  // =============================================================================
  // AUTOMATION HELPERS
  // =============================================================================
  
  /**
   * Check if information gathering is complete
   */
  private async isInformationGatheringComplete(requestId: string): Promise<boolean> {
    const infoResult = await caseManagementService.getInformationChecklist(requestId);
    if (infoResult.success && infoResult.data) {
      const requiredItems = infoResult.data.filter(item => item.importance === 'required');
      const completedRequired = requiredItems.filter(item => item.status === 'verified');
      return completedRequired.length === requiredItems.length && requiredItems.length > 0;
    }
    return false;
  }
  
  /**
   * Check if scope definition is complete
   */
  private async isScopeDefinitionComplete(requestId: string): Promise<boolean> {
    const scopeResult = await caseManagementService.getScopeDefinition(requestId);
    if (scopeResult.success && scopeResult.data) {
      const approvedItems = scopeResult.data.filter(item => item.status === 'approved');
      return approvedItems.length > 0; // At least one approved scope item
    }
    return false;
  }
  
  /**
   * Check for required follow-ups
   */
  private async checkFollowUpRequirements(requestId: string): Promise<string[]> {
    const actions: string[] = [];
    
    // Check for overdue follow-ups in notes
    const notesResult = await caseManagementService.getRequestNotes(requestId);
    if (notesResult.success && notesResult.data) {
      const overdueFollowUps = notesResult.data.filter(note => {
        if (note.followUpRequired && note.followUpDate) {
          const followUpDate = new Date(note.followUpDate);
          return followUpDate < new Date();
        }
        return false;
      });
      
      if (overdueFollowUps.length > 0) {
        actions.push(`${overdueFollowUps.length} overdue follow-ups require attention`);
      }
    }
    
    return actions;
  }
  
  /**
   * Check if request has become stale
   */
  private async checkForStaleRequest(requestId: string): Promise<{ isStale: boolean; action: string }> {
  const requestResult = await (client.models as any).Requests.get({ id: requestId });
    if (requestResult.data) {
      const lastUpdate = new Date(requestResult.data.updatedAt || requestResult.data.createdAt || '');
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      if (lastUpdate < sevenDaysAgo) {
        return {
          isStale: true,
          action: 'Request has been inactive for over 7 days - consider follow-up or status review'
        };
      }
    }
    
    return { isStale: false, action: '' };
  }
  
  /**
   * Execute actions after status transition
   */
  private async executePostTransitionActions(
    requestId: string,
    previousStatus: RequestStatus,
    newStatus: RequestStatus,
    userId: string
  ): Promise<void> {
    try {
      // Status-specific actions
      switch (newStatus) {
        case REQUEST_STATUSES.IN_REVIEW:
          await this.handleInReviewTransition(requestId, userId);
          break;
        
        case REQUEST_STATUSES.INFORMATION_GATHERING:
          await this.handleInformationGatheringTransition(requestId, userId);
          break;
        
        case REQUEST_STATUSES.SCOPE_DEFINITION:
          await this.handleScopeDefinitionTransition(requestId, userId);
          break;
        
        case REQUEST_STATUSES.QUOTE_READY:
          await this.handleQuoteReadyTransition(requestId, userId);
          break;
      }
    } catch (error) {
      logger.error('Error executing post-transition actions', error);
    }
  }
  
  /**
   * Handle transition to In Review status
   */
  private async handleInReviewTransition(requestId: string, userId: string): Promise<void> {
    // Auto-assign if not already assigned
  const requestResult = await (client.models as any).Requests.get({ id: requestId });
    if (requestResult.data && !requestResult.data.assignedTo) {
      // TODO: Implement auto-assignment logic based on workload, expertise, etc.
      logger.info('Request moved to review - assignment required', { requestId });
    }
  }
  
  /**
   * Handle transition to Information Gathering status
   */
  private async handleInformationGatheringTransition(requestId: string, userId: string): Promise<void> {
    // Set follow-up reminder for 3 days
    const followUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    
  await (client.models as any).Requests.update({
      id: requestId,
      followUpDate: followUpDate.toISOString(),
    });
    
    await caseManagementService.addNote({
      requestId,
      content: 'Information gathering phase initiated. Follow-up scheduled for client contact.',
      type: 'internal',
      category: 'workflow',
      isPrivate: true,
      authorId: userId,
      authorName: 'System',
      authorRole: 'System',
      followUpRequired: true,
      followUpDate: followUpDate.toISOString(),
    });
  }
  
  /**
   * Handle transition to Scope Definition status
   */
  private async handleScopeDefinitionTransition(requestId: string, userId: string): Promise<void> {
    await caseManagementService.addNote({
      requestId,
      content: 'Scope definition phase initiated. Begin defining project specifications and requirements.',
      type: 'internal',
      category: 'workflow',
      isPrivate: true,
      authorId: userId,
      authorName: 'System',
      authorRole: 'System',
    });
  }
  
  /**
   * Handle transition to Quote Ready status
   */
  private async handleQuoteReadyTransition(requestId: string, userId: string): Promise<void> {
    await caseManagementService.addNote({
      requestId,
      content: 'Request is now ready for quote generation. All required information and scope items have been completed.',
      type: 'internal',
      category: 'workflow',
      isPrivate: true,
      authorId: userId,
      authorName: 'System',
      authorRole: 'System',
      priority: 'important',
    });
    
    // TODO: Trigger quote creation notification
  }
  
  /**
   * Determine business impact of status change
   */
  private getBusinessImpact(previousStatus: RequestStatus, newStatus: RequestStatus): 'none' | 'low' | 'medium' | 'high' {
    // High impact transitions
    if (newStatus === REQUEST_STATUSES.QUOTE_READY || newStatus === REQUEST_STATUSES.CANCELLED) {
      return 'high';
    }
    
    // Medium impact transitions
    if (newStatus === REQUEST_STATUSES.ON_HOLD || newStatus === REQUEST_STATUSES.EXPIRED) {
      return 'medium';
    }
    
    // Forward progress is generally low impact
    return 'low';
  }
}

// Export singleton instance
export const requestWorkflowService = new RequestWorkflowService();

// Note: Types and constants are exported at their declarations above.
// Avoid re-export blocks to prevent duplicate export conflicts.