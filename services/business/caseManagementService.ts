/**
 * Case Management Service
 * 
 * Comprehensive backend service for managing the request lifecycle from 
 * initial submission through quote-ready status, including:
 * - Case assignment and transfer management
 * - Internal notes and communication tracking
 * - Status progression with audit trails
 * - Information gathering workflows
 * - Scope definition processes
 */

import { 
  requestNotesAPI,
  requestAssignmentsAPI, 
  requestStatusHistoryAPI,
  requestInformationItemsAPI,
  requestScopeItemsAPI,
  requestsAPI
} from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CaseManagementService');

// Types for case management
export interface CaseNote {
  id?: string;
  requestId: string;
  content: string;
  type: 'internal' | 'client_communication' | 'technical' | 'follow_up';
  category?: string;
  isPrivate: boolean;
  authorId: string;
  authorName: string;
  authorRole: string;
  attachments?: string[];
  communicationMethod?: 'phone' | 'email' | 'text' | 'in_person' | 'other';
  clientResponse?: 'pending' | 'responded' | 'no_response';
  followUpRequired?: boolean;
  followUpDate?: string;
  priority?: 'normal' | 'important' | 'urgent';
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CaseAssignment {
  id?: string;
  requestId: string;
  assignedToId: string;
  assignedToName: string;
  assignedToRole: string;
  assignmentType: 'primary' | 'secondary' | 'observer';
  assignedById: string;
  assignedByName: string;
  assignmentReason?: string;
  status: 'active' | 'completed' | 'transferred' | 'cancelled';
  priority?: 'normal' | 'high' | 'urgent';
  dueDate?: string;
  estimatedHours?: number;
}

export interface StatusChange {
  requestId: string;
  previousStatus?: string;
  newStatus: string;
  statusReason?: string;
  triggeredBy: 'user' | 'system' | 'automation';
  triggeredById?: string;
  triggeredByName?: string;
  businessImpact?: 'none' | 'low' | 'medium' | 'high';
  clientNotified?: boolean;
}

export interface InformationItem {
  id?: string;
  requestId: string;
  category: 'property' | 'client' | 'project' | 'financial' | 'technical';
  itemName: string;
  description?: string;
  status: 'missing' | 'requested' | 'received' | 'verified';
  importance: 'required' | 'important' | 'optional';
  value?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface ScopeItem {
  id?: string;
  requestId: string;
  category: 'room' | 'area' | 'system' | 'material' | 'service';
  name: string;
  description?: string;
  parentItemId?: string;
  specifications?: any;
  materials?: any;
  estimatedCost?: number;
  estimatedHours?: number;
  complexity?: 'simple' | 'moderate' | 'complex' | 'very_complex';
  status: 'draft' | 'defined' | 'approved' | 'quoted';
  clientApproval?: 'pending' | 'approved' | 'rejected' | 'modified';
}

export interface CaseOverview {
  requestId: string;
  currentStatus: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedRole?: string;
  readinessScore: number;
  totalNotes: number;
  pendingInformationItems: number;
  completedScopeItems: number;
  lastActivity?: string;
  nextFollowUp?: string;
  estimatedValue?: number;
}

/**
 * Case Management Service Class
 * 
 * Provides comprehensive case management functionality for requests
 * using the existing AmplifyAPI infrastructure for safe client access.
 */
class CaseManagementService {
  
  // =============================================================================
  // CASE NOTES MANAGEMENT
  // =============================================================================
  
  /**
   * Add a note to a request case
   */
  async addNote(noteData: CaseNote): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info('Adding note to request', { requestId: noteData.requestId, type: noteData.type });
      
      const result = await requestNotesAPI.create({
        requestId: noteData.requestId,
        content: noteData.content,
        type: noteData.type,
        category: noteData.category,
        isPrivate: noteData.isPrivate,
        authorId: noteData.authorId,
        authorName: noteData.authorName,
        authorRole: noteData.authorRole,
        attachments: noteData.attachments ? JSON.stringify(noteData.attachments) : null,
        communicationMethod: noteData.communicationMethod,
        clientResponse: noteData.clientResponse,
        followUpRequired: noteData.followUpRequired || false,
        followUpDate: noteData.followUpDate,
        priority: noteData.priority || 'normal',
        tags: noteData.tags ? JSON.stringify(noteData.tags) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      if (result.success) {
        logger.info('Note added successfully', { noteId: result.data?.id });
        
        // Update request activity timestamp
        await this.updateRequestActivity(noteData.requestId, 'note_added');
        
        return result;
      } else {
        logger.error('Failed to add note', result.error);
        return { success: false, error: 'Failed to add note' };
      }
    } catch (error) {
      logger.error('Error adding note', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get all notes for a request
   */
  async getRequestNotes(requestId: string, filters?: {
    type?: string;
    isPrivate?: boolean;
    authorRole?: string;
  }): Promise<{ success: boolean; data?: CaseNote[]; error?: string }> {
    try {
      logger.info('Getting notes for request', { requestId, filters });
      
      // Use simple list and filter in-memory for now
      // TODO: Implement server-side filtering when available
      const result = await requestNotesAPI.list();
      
      if (result.success && result.data) {
        // Filter notes for this request
        let notes = result.data.filter((note: any) => note.requestId === requestId);
        
        // Apply additional filters
        if (filters?.type) {
          notes = notes.filter((note: any) => note.type === filters.type);
        }
        
        if (filters?.isPrivate !== undefined) {
          notes = notes.filter((note: any) => note.isPrivate === filters.isPrivate);
        }
        
        if (filters?.authorRole) {
          notes = notes.filter((note: any) => note.authorRole === filters.authorRole);
        }
        
        // Transform to interface format
        const formattedNotes = notes.map((note: any) => ({
          id: note.id,
          requestId: note.requestId,
          content: note.content,
          type: note.type,
          category: note.category,
          isPrivate: note.isPrivate,
          authorId: note.authorId,
          authorName: note.authorName,
          authorRole: note.authorRole,
          attachments: note.attachments ? JSON.parse(note.attachments) : [],
          communicationMethod: note.communicationMethod,
          clientResponse: note.clientResponse,
          followUpRequired: note.followUpRequired,
          followUpDate: note.followUpDate,
          priority: note.priority,
          tags: note.tags ? JSON.parse(note.tags) : [],
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        }));
        
        return { success: true, data: formattedNotes };
      } else {
        return { success: false, error: 'Failed to fetch notes' };
      }
    } catch (error) {
      logger.error('Error getting request notes', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // =============================================================================
  // CASE ASSIGNMENT MANAGEMENT
  // =============================================================================
  
  /**
   * Assign a request to a team member
   */
  async assignRequest(assignmentData: CaseAssignment): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info('Assigning request', { 
        requestId: assignmentData.requestId, 
        assignedTo: assignmentData.assignedToName,
        type: assignmentData.assignmentType 
      });
      
      const result = await requestAssignmentsAPI.create({
        requestId: assignmentData.requestId,
        assignedToId: assignmentData.assignedToId,
        assignedToName: assignmentData.assignedToName,
        assignedToRole: assignmentData.assignedToRole,
        assignmentType: assignmentData.assignmentType,
        assignedById: assignmentData.assignedById,
        assignedByName: assignmentData.assignedByName,
        assignmentReason: assignmentData.assignmentReason,
        status: 'active',
        priority: assignmentData.priority || 'normal',
        dueDate: assignmentData.dueDate,
        estimatedHours: assignmentData.estimatedHours,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      if (result.success) {
        // Update the main request record with primary assignment
        if (assignmentData.assignmentType === 'primary') {
          await requestsAPI.update(assignmentData.requestId, {
            assignedTo: assignmentData.assignedToName,
            assignedDate: new Date().toISOString(),
          });
        }
        
        // Add assignment note
        await this.addNote({
          requestId: assignmentData.requestId,
          content: `Request assigned to ${assignmentData.assignedToName} (${assignmentData.assignedToRole})${assignmentData.assignmentReason ? ` - ${assignmentData.assignmentReason}` : ''}`,
          type: 'internal',
          category: 'assignment',
          isPrivate: true,
          authorId: assignmentData.assignedById,
          authorName: assignmentData.assignedByName,
          authorRole: 'Admin',
        });
        
        return result;
      } else {
        return { success: false, error: 'Failed to create assignment' };
      }
    } catch (error) {
      logger.error('Error assigning request', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get assignment history for a request
   */
  async getAssignmentHistory(requestId: string): Promise<{ success: boolean; data?: CaseAssignment[]; error?: string }> {
    try {
      const result = await requestAssignmentsAPI.list();
      
      if (result.success && result.data) {
        // Filter assignments for this request
        const assignments = result.data
          .filter((assignment: any) => assignment.requestId === requestId)
          .map((assignment: any) => ({
            id: assignment.id,
            requestId: assignment.requestId,
            assignedToId: assignment.assignedToId,
            assignedToName: assignment.assignedToName,
            assignedToRole: assignment.assignedToRole,
            assignmentType: assignment.assignmentType,
            assignedById: assignment.assignedById,
            assignedByName: assignment.assignedByName,
            assignmentReason: assignment.assignmentReason,
            status: assignment.status,
            priority: assignment.priority,
            dueDate: assignment.dueDate,
            estimatedHours: assignment.estimatedHours,
          }));
        
        return { success: true, data: assignments };
      } else {
        return { success: false, error: 'Failed to fetch assignments' };
      }
    } catch (error) {
      logger.error('Error getting assignment history', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // =============================================================================
  // STATUS PROGRESSION MANAGEMENT
  // =============================================================================
  
  /**
   * Change request status with full audit trail
   */
  async changeRequestStatus(statusChange: StatusChange): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info('Changing request status', { 
        requestId: statusChange.requestId, 
        from: statusChange.previousStatus, 
        to: statusChange.newStatus 
      });
      
      // Record status change in history
      const historyResult = await requestStatusHistoryAPI.create({
        requestId: statusChange.requestId,
        previousStatus: statusChange.previousStatus,
        newStatus: statusChange.newStatus,
        statusReason: statusChange.statusReason,
        triggeredBy: statusChange.triggeredBy,
        triggeredById: statusChange.triggeredById,
        triggeredByName: statusChange.triggeredByName,
        businessImpact: statusChange.businessImpact || 'medium',
        clientNotified: statusChange.clientNotified || false,
        internalNotification: true,
        timestamp: new Date().toISOString(),
      });
      
      if (historyResult.success) {
        // Update the main request record
        await requestsAPI.update(statusChange.requestId, {
          status: statusChange.newStatus,
        });
        
        // Add status change note
        await this.addNote({
          requestId: statusChange.requestId,
          content: `Status changed from "${statusChange.previousStatus || 'Unknown'}" to "${statusChange.newStatus}"${statusChange.statusReason ? ` - ${statusChange.statusReason}` : ''}`,
          type: 'internal',
          category: 'status_update',
          isPrivate: true,
          authorId: statusChange.triggeredById || 'system',
          authorName: statusChange.triggeredByName || 'System',
          authorRole: 'System',
        });
        
        // Update request activity
        await this.updateRequestActivity(statusChange.requestId, 'status_changed');
        
        return historyResult;
      } else {
        return { success: false, error: 'Failed to record status change' };
      }
    } catch (error) {
      logger.error('Error changing request status', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get status progression history for a request
   */
  async getStatusHistory(requestId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const result = await requestStatusHistoryAPI.list();
      
      if (result.success && result.data) {
        const history = result.data.filter((item: any) => item.requestId === requestId);
        return { success: true, data: history };
      } else {
        return { success: false, error: 'Failed to fetch status history' };
      }
    } catch (error) {
      logger.error('Error getting status history', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // =============================================================================
  // INFORMATION GATHERING WORKFLOW
  // =============================================================================
  
  /**
   * Add information item to gathering checklist
   */
  async addInformationItem(itemData: InformationItem): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await requestInformationItemsAPI.create({
        requestId: itemData.requestId,
        category: itemData.category,
        itemName: itemData.itemName,
        description: itemData.description,
        status: itemData.status,
        importance: itemData.importance,
        requestedDate: new Date().toISOString(),
        followUpRequired: itemData.followUpRequired || false,
        followUpDate: itemData.followUpDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      if (result.success) {
        await this.updateInformationGatheringProgress(itemData.requestId);
        return result;
      } else {
        return { success: false, error: 'Failed to add information item' };
      }
    } catch (error) {
      logger.error('Error adding information item', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get information gathering checklist for a request
   */
  async getInformationChecklist(requestId: string): Promise<{ success: boolean; data?: InformationItem[]; error?: string }> {
    try {
      const result = await requestInformationItemsAPI.list();
      
      if (result.success && result.data) {
        const items = result.data
          .filter((item: any) => item.requestId === requestId)
          .map((item: any) => ({
            id: item.id,
            requestId: item.requestId,
            category: item.category,
            itemName: item.itemName,
            description: item.description,
            status: item.status,
            importance: item.importance,
            value: item.value,
            followUpRequired: item.followUpRequired,
            followUpDate: item.followUpDate,
          }));
        
        return { success: true, data: items };
      } else {
        return { success: false, error: 'Failed to fetch information checklist' };
      }
    } catch (error) {
      logger.error('Error getting information checklist', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // =============================================================================
  // SCOPE DEFINITION FEATURES
  // =============================================================================
  
  /**
   * Add scope item to project definition
   */
  async addScopeItem(itemData: ScopeItem): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const result = await requestScopeItemsAPI.create({
        requestId: itemData.requestId,
        category: itemData.category,
        name: itemData.name,
        description: itemData.description,
        parentItemId: itemData.parentItemId,
        specifications: itemData.specifications ? JSON.stringify(itemData.specifications) : null,
        materials: itemData.materials ? JSON.stringify(itemData.materials) : null,
        estimatedCost: itemData.estimatedCost,
        estimatedHours: itemData.estimatedHours,
        complexity: itemData.complexity,
        status: itemData.status,
        clientApproval: itemData.clientApproval,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      if (result.success) {
        await this.updateScopeDefinitionProgress(itemData.requestId);
        return result;
      } else {
        return { success: false, error: 'Failed to add scope item' };
      }
    } catch (error) {
      logger.error('Error adding scope item', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Get scope definition for a request
   */
  async getScopeDefinition(requestId: string): Promise<{ success: boolean; data?: ScopeItem[]; error?: string }> {
    try {
      const result = await requestScopeItemsAPI.list();
      
      if (result.success && result.data) {
        const items = result.data
          .filter((item: any) => item.requestId === requestId)
          .map((item: any) => ({
            id: item.id,
            requestId: item.requestId,
            category: item.category,
            name: item.name,
            description: item.description,
            parentItemId: item.parentItemId,
            specifications: item.specifications ? JSON.parse(item.specifications) : null,
            materials: item.materials ? JSON.parse(item.materials) : null,
            estimatedCost: item.estimatedCost,
            estimatedHours: item.estimatedHours,
            complexity: item.complexity,
            status: item.status,
            clientApproval: item.clientApproval,
          }));
        
        return { success: true, data: items };
      } else {
        return { success: false, error: 'Failed to fetch scope definition' };
      }
    } catch (error) {
      logger.error('Error getting scope definition', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // =============================================================================
  // CASE OVERVIEW AND ANALYTICS
  // =============================================================================
  
  /**
   * Get comprehensive case overview
   */
  async getCaseOverview(requestId: string): Promise<{ success: boolean; data?: CaseOverview; error?: string }> {
    try {
      logger.info('Getting case overview', { requestId });
      
      // Get base request data
      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success || !requestResult.data) {
        return { success: false, error: 'Request not found' };
      }
      
      // Get notes count
      const notesResult = await this.getRequestNotes(requestId);
      const totalNotes = notesResult.success ? notesResult.data?.length || 0 : 0;
      
      // Get pending information items
      const infoResult = await this.getInformationChecklist(requestId);
      const pendingInfoItems = infoResult.success ? 
        infoResult.data?.filter(item => item.status === 'missing' || item.status === 'requested').length || 0 : 0;
      
      // Get completed scope items
      const scopeResult = await this.getScopeDefinition(requestId);
      const completedScopeItems = scopeResult.success ?
        scopeResult.data?.filter(item => item.status === 'approved' || item.status === 'quoted').length || 0 : 0;
      
      // Calculate readiness score
      const readinessScore = await this.calculateReadinessScore(requestId);
      
      const overview: CaseOverview = {
        requestId,
        currentStatus: requestResult.data.status || 'Unknown',
        priority: requestResult.data.priority || 'medium',
        assignedTo: requestResult.data.assignedTo,
        readinessScore: readinessScore.score,
        totalNotes,
        pendingInformationItems: pendingInfoItems,
        completedScopeItems,
        lastActivity: requestResult.data.updatedAt,
        nextFollowUp: requestResult.data.followUpDate,
        estimatedValue: requestResult.data.estimatedValue,
      };
      
      return { success: true, data: overview };
    } catch (error) {
      logger.error('Error getting case overview', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================
  
  /**
   * Update request activity timestamp
   */
  private async updateRequestActivity(requestId: string, activityType: string): Promise<void> {
    try {
      await requestsAPI.update(requestId, {
        lastContactDate: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error updating request activity', error);
    }
  }
  
  /**
   * Update information gathering progress
   */
  private async updateInformationGatheringProgress(requestId: string): Promise<void> {
    try {
      const infoResult = await this.getInformationChecklist(requestId);
      if (infoResult.success && infoResult.data) {
        const total = infoResult.data.length;
        const completed = infoResult.data.filter(item => item.status === 'verified').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        let status: 'pending' | 'in_progress' | 'completed' = 'pending';
        if (progress > 0 && progress < 100) status = 'in_progress';
        if (progress === 100) status = 'completed';
        
        await requestsAPI.update(requestId, {
          informationGatheringStatus: status,
        });
      }
    } catch (error) {
      logger.error('Error updating information gathering progress', error);
    }
  }
  
  /**
   * Update scope definition progress
   */
  private async updateScopeDefinitionProgress(requestId: string): Promise<void> {
    try {
      const scopeResult = await this.getScopeDefinition(requestId);
      if (scopeResult.success && scopeResult.data) {
        const total = scopeResult.data.length;
        const completed = scopeResult.data.filter(item => item.status === 'approved').length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
        if (total > 0 && progress < 100) status = 'in_progress';
        if (progress === 100) status = 'completed';
        
        await requestsAPI.update(requestId, {
          scopeDefinitionStatus: status,
        });
      }
    } catch (error) {
      logger.error('Error updating scope definition progress', error);
    }
  }
  
  /**
   * Calculate readiness score for quote generation
   */
  private async calculateReadinessScore(requestId: string): Promise<{ score: number; factors: string[] }> {
    try {
      let score = 0;
      const factors: string[] = [];
      
      // Information gathering (40 points max)
      const infoResult = await this.getInformationChecklist(requestId);
      if (infoResult.success && infoResult.data) {
        const required = infoResult.data.filter(item => item.importance === 'required');
        const requiredComplete = required.filter(item => item.status === 'verified');
        if (required.length > 0) {
          const infoScore = Math.round((requiredComplete.length / required.length) * 40);
          score += infoScore;
          factors.push(`Information: ${requiredComplete.length}/${required.length} required items`);
        }
      }
      
      // Scope definition (40 points max)
      const scopeResult = await this.getScopeDefinition(requestId);
      if (scopeResult.success && scopeResult.data) {
        const approved = scopeResult.data.filter(item => item.status === 'approved');
        const scopeScore = Math.min(40, approved.length * 10); // 10 points per approved scope item, max 40
        score += scopeScore;
        factors.push(`Scope: ${approved.length} items defined`);
      }
      
      // Communication and notes (20 points max)
      const notesResult = await this.getRequestNotes(requestId, { type: 'client_communication' });
      if (notesResult.success && notesResult.data) {
        const recentComms = notesResult.data.filter(note => {
          const noteDate = new Date(note.createdAt || '');
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return noteDate > weekAgo;
        });
        const commScore = Math.min(20, recentComms.length * 5); // 5 points per recent communication, max 20
        score += commScore;
        factors.push(`Communication: ${recentComms.length} recent interactions`);
      }
      
      return { score: Math.min(100, score), factors };
    } catch (error) {
      logger.error('Error calculating readiness score', error);
      return { score: 0, factors: ['Error calculating score'] };
    }
  }
}

// Export singleton instance
export const caseManagementService = new CaseManagementService();

// Export types
// Types are defined in types/caseManagement and should be imported from there by consumers to avoid re-export conflicts.