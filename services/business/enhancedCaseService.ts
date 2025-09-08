/**
 * Enhanced Case Service
 * 
 * High-level service that orchestrates all case management functionality
 * and provides a unified API for the frontend components.
 */

import { caseManagementService } from './caseManagementService';
import { requestWorkflowService, REQUEST_STATUSES } from './requestWorkflowService';
import { requestsAPI } from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';
import type {
  EnhancedRequest,
  CaseOverview,
  CaseNote,
  CaseAssignment,
  InformationItem,
  ScopeItem,
  WorkflowValidation,
  CaseManagementApiResponse,
  NoteFormData,
  AssignmentFormData,
  InformationItemFormData,
  ScopeItemFormData,
  CaseFilters,
} from '../../types/caseManagement';

const logger = createLogger('EnhancedCaseService');

/**
 * Enhanced Case Service Class
 * 
 * Provides a comprehensive, high-level API for managing requests through
 * their complete lifecycle with all case management features integrated.
 */
class EnhancedCaseService {
  
  // =============================================================================
  // CASE OVERVIEW AND MANAGEMENT
  // =============================================================================
  
  /**
   * Get complete case information with all related data
   */
  async getCompleteCase(requestId: string): Promise<CaseManagementApiResponse<EnhancedRequest>> {
    try {
      logger.info('Getting complete case data', { requestId });
      
      // Get base request data
      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success || !requestResult.data) {
        return { success: false, error: 'Request not found' };
      }
      
      // Get all related case management data in parallel
      const [
        notesResult,
        assignmentsResult,
        statusHistoryResult,
        informationItemsResult,
        scopeItemsResult,
      ] = await Promise.all([
        caseManagementService.getRequestNotes(requestId),
        caseManagementService.getAssignmentHistory(requestId),
        caseManagementService.getStatusHistory(requestId),
        caseManagementService.getInformationChecklist(requestId),
        caseManagementService.getScopeDefinition(requestId),
      ]);
      
      // Calculate readiness score and overview
      const overviewResult = await caseManagementService.getCaseOverview(requestId);
      
      const enhancedRequest: EnhancedRequest = {
        // Base request data
        id: requestResult.data.id,
        status: requestResult.data.status || 'New',
        product: requestResult.data.product,
        message: requestResult.data.message,
        relationToProperty: requestResult.data.relationToProperty,
        needFinance: requestResult.data.needFinance,
        budget: requestResult.data.budget,
        leadSource: requestResult.data.leadSource,
        assignedTo: requestResult.data.assignedTo,
        assignedDate: requestResult.data.assignedDate,
        officeNotes: requestResult.data.officeNotes,
        
        // Enhanced fields
        priority: requestResult.data.priority || 'medium',
        source: requestResult.data.leadSource || 'unknown',
        tags: requestResult.data.tags ? JSON.parse(requestResult.data.tags) : [],
        estimatedValue: requestResult.data.estimatedValue,
        followUpDate: requestResult.data.followUpDate,
        lastContactDate: requestResult.data.lastContactDate,
        clientResponseDate: requestResult.data.clientResponseDate,
        informationGatheringStatus: requestResult.data.informationGatheringStatus || 'pending',
        scopeDefinitionStatus: requestResult.data.scopeDefinitionStatus || 'not_started',
        readinessScore: overviewResult.success ? overviewResult.data?.readinessScore || 0 : 0,
        missingInformation: requestResult.data.missingInformation ? 
          JSON.parse(requestResult.data.missingInformation) : [],
        
        // Contact and property references
        agentContactId: requestResult.data.agentContactId,
        homeownerContactId: requestResult.data.homeownerContactId,
        addressId: requestResult.data.addressId,
        
        // Timestamps
        createdAt: requestResult.data.createdAt || new Date().toISOString(),
        updatedAt: requestResult.data.updatedAt || new Date().toISOString(),
        
        // Related data
        notes: notesResult.success ? notesResult.data : [],
        assignments: assignmentsResult.success ? assignmentsResult.data : [],
        statusHistory: statusHistoryResult.success ? statusHistoryResult.data : [],
        informationItems: informationItemsResult.success ? informationItemsResult.data : [],
        scopeItems: scopeItemsResult.success ? scopeItemsResult.data : [],
      };
      
      return { success: true, data: enhancedRequest };
    } catch (error) {
      logger.error('Error getting complete case', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Get case overview for dashboard display
   */
  async getCaseOverview(requestId: string): Promise<CaseManagementApiResponse<CaseOverview>> {
    try {
  const result = await caseManagementService.getCaseOverview(requestId);
  // Ensure the return type matches CaseManagementApiResponse<CaseOverview> from types module
  return result as unknown as CaseManagementApiResponse<CaseOverview>;
    } catch (error) {
      logger.error('Error getting case overview', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Initialize case management for new request
   */
  async initializeNewCase(requestId: string): Promise<CaseManagementApiResponse<boolean>> {
    try {
      logger.info('Initializing new case', { requestId });
      
      // Initialize workflow
      const workflowResult = await requestWorkflowService.initializeRequestWorkflow(requestId);
      if (!workflowResult.success) {
        return { success: false, error: workflowResult.error };
      }
      
      // Add initial note
      await caseManagementService.addNote({
        requestId,
        content: 'Case management initialized. Request is ready for review and assignment.',
        type: 'internal',
        category: 'initialization',
        isPrivate: true,
        authorId: 'system',
        authorName: 'System',
        authorRole: 'System',
      });
      
      // Set initial status if not already set
      const requestResult = await requestsAPI.get(requestId);
      if (requestResult.success && requestResult.data) {
        if (!requestResult.data.status || requestResult.data.status === '') {
          await requestWorkflowService.transitionStatus(
            requestId,
            REQUEST_STATUSES.NEW,
            'system',
            'Initial status assignment'
          );
        }
      }
      
      return { success: true, data: true };
    } catch (error) {
      logger.error('Error initializing new case', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // =============================================================================
  // NOTES MANAGEMENT
  // =============================================================================
  
  /**
   * Add note to case
   */
  async addNote(
    requestId: string, 
    noteData: NoteFormData, 
    authorId: string, 
    authorName: string, 
    authorRole: string
  ): Promise<CaseManagementApiResponse<CaseNote>> {
    try {
      const note: CaseNote = {
        requestId,
        content: noteData.content,
        type: noteData.type,
        category: noteData.category,
        isPrivate: noteData.isPrivate,
        authorId,
        authorName,
        authorRole,
        communicationMethod: noteData.communicationMethod,
        followUpRequired: noteData.followUpRequired,
        followUpDate: noteData.followUpDate,
        priority: noteData.priority,
        tags: noteData.tags,
      };
      
      return await caseManagementService.addNote(note);
    } catch (error) {
      logger.error('Error adding note', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Get notes for case with filtering
   */
  async getCaseNotes(requestId: string, filters?: {
    type?: string;
    isPrivate?: boolean;
    authorRole?: string;
  }): Promise<CaseManagementApiResponse<CaseNote[]>> {
    try {
      return await caseManagementService.getRequestNotes(requestId, filters);
    } catch (error) {
      logger.error('Error getting case notes', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // =============================================================================
  // ASSIGNMENT MANAGEMENT
  // =============================================================================
  
  /**
   * Assign case to team member
   */
  async assignCase(
    requestId: string, 
    assignmentData: AssignmentFormData, 
    assignedById: string, 
    assignedByName: string
  ): Promise<CaseManagementApiResponse<CaseAssignment>> {
    try {
      const assignment: CaseAssignment = {
        requestId,
        assignedToId: assignmentData.assignedToId,
        assignedToName: assignmentData.assignedToName,
        assignedToRole: assignmentData.assignedToRole,
        assignmentType: assignmentData.assignmentType,
        assignedById,
        assignedByName,
        assignmentReason: assignmentData.assignmentReason,
        priority: assignmentData.priority,
        dueDate: assignmentData.dueDate,
        estimatedHours: assignmentData.estimatedHours,
        status: 'active',
      };
      
      return await caseManagementService.assignRequest(assignment);
    } catch (error) {
      logger.error('Error assigning case', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Transfer case assignment
   */
  async transferCaseAssignment(
    assignmentId: string,
    transferToId: string,
    transferToName: string,
    transferReason: string,
    transferredById: string,
    transferredByName: string
  ): Promise<CaseManagementApiResponse<CaseAssignment>> {
    try {
  // Transfer assignment is implemented on caseManagementService; if missing in local class typings, cast to any
  return await (caseManagementService as any).transferAssignment(assignmentId, {
        transferredToId: transferToId,
        transferredToName: transferToName,
        transferReason,
        transferredById,
        transferredByName,
      });
    } catch (error) {
      logger.error('Error transferring assignment', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // =============================================================================
  // STATUS MANAGEMENT
  // =============================================================================
  
  /**
   * Change case status with validation
   */
  async changeCaseStatus(
    requestId: string,
    newStatus: string,
    userId: string,
    reason?: string
  ): Promise<CaseManagementApiResponse<boolean>> {
    try {
      const result = await requestWorkflowService.transitionStatus(
        requestId,
        newStatus as any,
        userId,
        reason
      );
      
      return { success: result.success, data: result.success, error: result.error };
    } catch (error) {
      logger.error('Error changing case status', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Get allowed status transitions for current status
   */
  async getAllowedStatusTransitions(requestId: string): Promise<CaseManagementApiResponse<string[]>> {
    try {
      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success || !requestResult.data) {
        return { success: false, error: 'Request not found' };
      }
      
      const currentStatus = requestResult.data.status;
      const allowedTransitions = requestWorkflowService.getAllowedTransitions(currentStatus as any);
      
      return { success: true, data: allowedTransitions };
    } catch (error) {
      logger.error('Error getting allowed transitions', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Validate status transition
   */
  async validateStatusChange(
    requestId: string,
    newStatus: string,
    userId: string
  ): Promise<CaseManagementApiResponse<WorkflowValidation>> {
    try {
      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success || !requestResult.data) {
        return { success: false, error: 'Request not found' };
      }
      
      const currentStatus = requestResult.data.status;
      const validation = await requestWorkflowService.validateStatusTransition(
        requestId,
        currentStatus as any,
        newStatus as any,
        userId
      );
      
      return { success: true, data: validation };
    } catch (error) {
      logger.error('Error validating status change', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // =============================================================================
  // INFORMATION GATHERING
  // =============================================================================
  
  /**
   * Add information item to checklist
   */
  async addInformationItem(
    requestId: string, 
    itemData: InformationItemFormData
  ): Promise<CaseManagementApiResponse<InformationItem>> {
    try {
      const item: InformationItem = {
        requestId,
        category: itemData.category,
        itemName: itemData.itemName,
        description: itemData.description,
        status: 'missing',
        importance: itemData.importance,
        followUpRequired: itemData.followUpRequired,
        followUpDate: itemData.followUpDate,
      };
      
      return await caseManagementService.addInformationItem(item);
    } catch (error) {
      logger.error('Error adding information item', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Update information item status
   */
  async updateInformationItem(
    itemId: string, 
    updates: Partial<InformationItem>
  ): Promise<CaseManagementApiResponse<InformationItem>> {
    try {
  // updateInformationItem exists on service; if typing mismatch occurs, cast
  return await (caseManagementService as any).updateInformationItem(itemId, updates);
    } catch (error) {
      logger.error('Error updating information item', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Get information gathering progress
   */
  async getInformationGatheringProgress(requestId: string): Promise<CaseManagementApiResponse<{
    items: InformationItem[];
    totalItems: number;
    completedItems: number;
    progress: number;
  }>> {
    try {
      const result = await caseManagementService.getInformationChecklist(requestId);
      
      if (result.success && result.data) {
        const items = result.data;
        const totalItems = items.length;
        const completedItems = items.filter(item => item.status === 'verified').length;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        return {
          success: true,
          data: {
            items,
            totalItems,
            completedItems,
            progress,
          }
        };
      }
      
      // Normalize to the richer progress payload when only arrays are returned
      if (result.success && Array.isArray(result.data)) {
        const items = result.data;
        const totalItems = items.length;
        const completedItems = items.filter(i => i.status === 'verified').length;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        return { success: true, data: { items, totalItems, completedItems, progress } };
      }
      return result as unknown as CaseManagementApiResponse<{ items: InformationItem[]; totalItems: number; completedItems: number; progress: number; }>;
    } catch (error) {
      logger.error('Error getting information gathering progress', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // =============================================================================
  // SCOPE DEFINITION
  // =============================================================================
  
  /**
   * Add scope item to project definition
   */
  async addScopeItem(
    requestId: string, 
    itemData: ScopeItemFormData
  ): Promise<CaseManagementApiResponse<ScopeItem>> {
    try {
      const item: ScopeItem = {
        requestId,
        category: itemData.category,
        name: itemData.name,
        description: itemData.description,
        parentItemId: itemData.parentItemId,
        specifications: itemData.specifications,
        materials: itemData.materials,
        estimatedCost: itemData.estimatedCost,
        estimatedHours: itemData.estimatedHours,
        complexity: itemData.complexity,
        status: 'draft',
      };
      
      return await caseManagementService.addScopeItem(item);
    } catch (error) {
      logger.error('Error adding scope item', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Get scope definition progress
   */
  async getScopeDefinitionProgress(requestId: string): Promise<CaseManagementApiResponse<{
    items: ScopeItem[];
    totalItems: number;
    approvedItems: number;
    progress: number;
    totalEstimatedCost: number;
    totalEstimatedHours: number;
  }>> {
    try {
      const result = await caseManagementService.getScopeDefinition(requestId);
      
      if (result.success && result.data) {
        const items = result.data;
        const totalItems = items.length;
        const approvedItems = items.filter(item => item.status === 'approved').length;
        const progress = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
        const totalEstimatedCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
        const totalEstimatedHours = items.reduce((sum, item) => sum + (item.estimatedHours || 0), 0);
        
        return {
          success: true,
          data: {
            items,
            totalItems,
            approvedItems,
            progress,
            totalEstimatedCost,
            totalEstimatedHours,
          }
        };
      }
      
      if (result.success && Array.isArray(result.data)) {
        const items = result.data;
        const totalItems = items.length;
        const approvedItems = items.filter(i => (i as any).approved === true).length;
        const completedCost = items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
        const completedHours = items.reduce((sum, i) => sum + (i.estimatedHours || 0), 0);
        const progress = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
        return {
          success: true,
          data: { items, totalItems, approvedItems, progress, totalEstimatedCost: completedCost, totalEstimatedHours: completedHours }
        };
      }
      return result as unknown as CaseManagementApiResponse<{ items: ScopeItem[]; totalItems: number; approvedItems: number; progress: number; totalEstimatedCost: number; totalEstimatedHours: number; }>;
    } catch (error) {
      logger.error('Error getting scope definition progress', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // =============================================================================
  // WORKFLOW AUTOMATION
  // =============================================================================
  
  /**
   * Check and execute workflow automation for a case
   */
  async checkWorkflowAutomation(requestId: string): Promise<CaseManagementApiResponse<string[]>> {
    try {
      const result = await requestWorkflowService.checkWorkflowAutomation(requestId);
      return {
        success: result.success,
        data: result.actions,
        error: result.error,
      };
    } catch (error) {
      logger.error('Error checking workflow automation', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Execute workflow automation actions
   */
  async executeWorkflowActions(requestId: string, actions: string[]): Promise<CaseManagementApiResponse<boolean>> {
    try {
      // This would implement actual automation execution
      // For now, just log the actions that would be executed
      logger.info('Workflow actions to execute', { requestId, actions });
      
      // TODO: Implement actual automation execution logic
      
      return { success: true, data: true };
    } catch (error) {
      logger.error('Error executing workflow actions', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const enhancedCaseService = new EnhancedCaseService();