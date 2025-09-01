/**
 * RequestService - Business logic layer for Request operations
 * 
 * Orchestrates complex business workflows by coordinating between:
 * - RequestRepository for data access
 * - NotificationService for communications
 * - ContactService for customer data
 * - PropertyService for property validation
 * - AuditService for logging
 * 
 * This service encapsulates all business rules and workflows,
 * keeping UI components thin and focused on presentation.
 */

import { 
  RequestRepository, 
  Request, 
  EnhancedRequest,
  RequestNote,
  RequestAssignment,
  StatusTransitionResult
} from '../../../repositories/RequestRepository';
import { ServiceResult, FilterOptions } from '../../../repositories/base/types';
// Logger utility - would be imported from actual logger implementation
const createLogger = (name: string) => ({
  info: (message: string, meta?: any) => console.log(`[${name}] INFO:`, message, meta),
  warn: (message: string, meta?: any) => console.warn(`[${name}] WARN:`, message, meta),
  error: (message: string, meta?: any) => console.error(`[${name}] ERROR:`, message, meta),
  debug: (message: string, meta?: any) => console.debug(`[${name}] DEBUG:`, message, meta)
});

// ============================================================================
// Business Logic Interfaces
// ============================================================================

/**
 * Lead scoring result with business insights
 */
export interface LeadScoreResult {
  requestId: string;
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  conversionProbability: number; // 0-1
  priorityLevel: 'urgent' | 'high' | 'medium' | 'low';
  factors: {
    dataCompleteness: number;
    sourceQuality: number; 
    engagementLevel: number;
    budgetAlignment: number;
    projectComplexity: number;
    geographicFit: number;
    urgencyIndicators: number;
  };
  recommendations: string[];
  calculatedAt: string;
}

/**
 * Agent assignment with load balancing
 */
export interface AgentAssignment {
  agentId: string;
  agentName: string;
  agentRole: string;
  assignmentReason: 'skill_match' | 'geographic' | 'workload_balance' | 'availability' | 'specialty' | 'manual' | 'auto_balance';
  confidence: number; // 0-1
  workloadBefore: number;
  workloadAfter: number;
  estimatedCapacity: number;
  specialtyMatch: boolean;
  distanceScore: number;
}

/**
 * Quote generation parameters
 */
export interface QuoteGenerationInput {
  basePrice?: number;
  adjustmentFactors?: {
    complexity: number;
    materials: number;
    timeline: number;
    location: number;
  };
  includeAlternatives: boolean;
  validityPeriod: number; // days
  notes?: string;
}

/**
 * Follow-up scheduling configuration
 */
export interface FollowUpSchedule {
  requestId: string;
  followUpType: 'initial_contact' | 'information_request' | 'quote_follow_up' | 'check_in' | 'closing';
  scheduledDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  message?: string;
  reminderDays: number[];
  autoReschedule: boolean;
}

/**
 * Request workflow state
 */
export interface RequestWorkflow {
  requestId: string;
  currentStage: string;
  nextStages: string[];
  blockedReasons?: string[];
  requiredActions: string[];
  estimatedCompletionDate?: string;
  milestones: {
    name: string;
    status: 'completed' | 'in_progress' | 'pending' | 'blocked';
    completedAt?: string;
    estimatedDate?: string;
  }[];
}

/**
 * Request merge operation result
 */
export interface RequestMergeResult {
  primaryRequestId: string;
  mergedRequestIds: string[];
  combinedData: Partial<Request>;
  conflictResolutions: Array<{
    field: string;
    primaryValue: any;
    mergedValue: any;
    resolution: 'keep_primary' | 'use_merged' | 'combine' | 'manual_review';
  }>;
  mergedNotes: RequestNote[];
  mergedAssignments: RequestAssignment[];
}

/**
 * Service dependencies interface for dependency injection
 */
export interface RequestServiceDependencies {
  requestRepository: RequestRepository;
  notificationService?: any; // Will be injected
  contactService?: any;      // Will be injected
  propertyService?: any;     // Will be injected
  auditService?: any;        // Will be injected
}

// ============================================================================
// Main Service Implementation
// ============================================================================

/**
 * RequestService - Complete business logic for Request management
 */
export class RequestService {
  private readonly logger = createLogger('RequestService');
  private readonly requestRepository: RequestRepository;
  
  // Optional service dependencies (injected)
  private notificationService?: any;
  private contactService?: any;
  private propertyService?: any;
  private auditService?: any;

  constructor(dependencies: RequestServiceDependencies) {
    this.requestRepository = dependencies.requestRepository;
    this.notificationService = dependencies.notificationService;
    this.contactService = dependencies.contactService;
    this.propertyService = dependencies.propertyService;
    this.auditService = dependencies.auditService;

    this.logger.info('RequestService initialized', {
      hasNotificationService: !!this.notificationService,
      hasContactService: !!this.contactService,
      hasPropertyService: !!this.propertyService,
      hasAuditService: !!this.auditService
    });
  }

  // ============================================================================
  // Core Business Operations
  // ============================================================================

  /**
   * Process a new request with complete workflow initialization
   */
  async processNewRequest(
    requestData: Omit<Request, 'id' | 'createdAt' | 'updatedAt'>,
    options: {
      autoAssign?: boolean;
      autoScore?: boolean;
      autoScheduleFollowUp?: boolean;
      sendNotifications?: boolean;
      skipValidation?: boolean;
    } = {}
  ): Promise<ServiceResult<EnhancedRequest>> {
    try {
      this.logger.info('Processing new request', { options });

      // 1. Validate and create the request
      const createResult = await this.requestRepository.create({ data: requestData });
      if (!createResult.success) {
        return {
          success: false,
          error: createResult.error
        };
      }

      const newRequest = createResult.data!;

      // 2. Calculate lead score if requested
      let leadScore: LeadScoreResult | undefined;
      if (options.autoScore) {
        const scoreResult = await this.calculateLeadScore(newRequest.id);
        if (scoreResult.success) {
          leadScore = scoreResult.data;
          
          // Update request with lead score
          await this.requestRepository.update({
            id: newRequest.id,
            data: {
              readinessScore: leadScore?.overallScore,
              priority: leadScore?.priorityLevel
            }
          });
        }
      }

      // 3. Auto-assign if requested
      let assignment: AgentAssignment | undefined;
      if (options.autoAssign) {
        const assignmentResult = await this.assignToAgent(newRequest.id, {
          strategy: 'auto_balance',
          considerSpecialty: true,
          considerLocation: true
        });
        if (assignmentResult.success) {
          assignment = assignmentResult.data;
        }
      }

      // 4. Schedule follow-up if requested
      if (options.autoScheduleFollowUp) {
        await this.scheduleFollowUp(newRequest.id, {
          followUpType: 'initial_contact',
          priority: leadScore?.priorityLevel || 'medium',
          reminderDays: [1, 3, 7],
          autoReschedule: true
        });
      }

      // 5. Send notifications if requested
      if (options.sendNotifications && this.notificationService) {
        await this.notificationService.sendNewRequestNotifications(newRequest.id, {
          includeAgent: !!assignment,
          includeLead: true,
          includeAdmin: true
        });
      }

      // 6. Audit log
      if (this.auditService) {
        await this.auditService.logRequestCreated(newRequest.id, {
          autoAssigned: !!assignment,
          leadScore: leadScore?.overallScore,
          initialPriority: leadScore?.priorityLevel
        });
      }

      // 7. Get the complete request with relations
      const enhancedResult = await this.requestRepository.getWithRelations(newRequest.id);
      if (!enhancedResult.success) {
        return enhancedResult;
      }

      this.logger.info('New request processed successfully', {
        requestId: newRequest.id,
        leadScore: leadScore?.overallScore,
        assigned: !!assignment,
        priorityLevel: leadScore?.priorityLevel
      });

      return {
        success: true,
        data: enhancedResult.data!,
        meta: {
          ...enhancedResult.meta,
          executionTime: Date.now(),
          warnings: [
            ...(enhancedResult.meta?.warnings || []),
            `Processing steps: created=true, scored=${!!leadScore}, assigned=${!!assignment}`
          ]
        }
      };

    } catch (error) {
      this.logger.error('New request processing failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error processing request')
      };
    }
  }

  /**
   * Generate quote from request with business rule validation
   */
  async generateQuoteFromRequest(
    requestId: string,
    quoteInput: QuoteGenerationInput
  ): Promise<ServiceResult<any>> {
    try {
      this.logger.info('Generating quote from request', { requestId, quoteInput });

      // 1. Validate request status
      const requestResult = await this.requestRepository.get(requestId);
      if (!requestResult.success || !requestResult.data) {
        return {
          success: false,
          error: new Error('Request not found')
        };
      }

      const request = requestResult.data;

      // 2. Validate status transition
      if (!['in_progress', 'requires_info'].includes(request.status || '')) {
        return {
          success: false,
          error: new Error(`Cannot generate quote for request in status: ${request.status}`)
        };
      }

      // 3. Validate required information
      const missingInfo = await this.validateQuoteRequirements(requestId);
      if (missingInfo.length > 0) {
        return {
          success: false,
          error: new Error(`Missing required information: ${missingInfo.join(', ')}`)
        };
      }

      // 4. Calculate pricing (mock implementation - would use pricing service)
      const pricing = await this.calculateQuotePricing(request, quoteInput);

      // 5. Create quote record (would use QuoteService)
      const quoteData = {
        requestId,
        basePrice: pricing.basePrice,
        totalPrice: pricing.totalPrice,
        adjustmentFactors: quoteInput.adjustmentFactors,
        validityPeriod: quoteInput.validityPeriod,
        status: 'draft',
        createdBy: 'system', // Would use actual user context
        notes: quoteInput.notes
      };

      // Mock quote creation - replace with actual QuoteService call
      const quote = { id: `quote_${Date.now()}`, ...quoteData };

      // 6. Update request status
      await this.requestRepository.updateStatus(requestId, 'quote_ready', {
        reason: 'Quote generated',
        businessImpact: 'medium'
      });

      // 7. Add note about quote generation
      await this.requestRepository.addNote(requestId, 
        `Quote generated with total price $${pricing.totalPrice.toLocaleString()}`, {
        type: 'internal',
        category: 'quote_generation',
        priority: 'normal'
      });

      // 8. Schedule follow-up
      await this.scheduleFollowUp(requestId, {
        followUpType: 'quote_follow_up',
        priority: 'high',
        reminderDays: [1, 3, 7, 14],
        autoReschedule: false
      });

      this.logger.info('Quote generated successfully', {
        requestId,
        quoteId: quote.id,
        totalPrice: pricing.totalPrice
      });

      return {
        success: true,
        data: quote,
        meta: {
          executionTime: Date.now(),
          warnings: [`Quote generated with ${quoteInput.validityPeriod} day validity`]
        }
      };

    } catch (error) {
      this.logger.error('Quote generation failed', { requestId, error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error generating quote')
      };
    }
  }

  /**
   * Assign request to agent with intelligent load balancing
   */
  async assignToAgent(
    requestId: string,
    options: {
      agentId?: string; // Manual assignment
      strategy?: 'manual' | 'round_robin' | 'skill_match' | 'geographic' | 'auto_balance';
      considerSpecialty?: boolean;
      considerLocation?: boolean;
      considerWorkload?: boolean;
    } = {}
  ): Promise<ServiceResult<AgentAssignment>> {
    try {
      this.logger.info('Assigning request to agent', { requestId, options });

      // 1. Get request details
      const requestResult = await this.requestRepository.getWithRelations(requestId);
      if (!requestResult.success || !requestResult.data) {
        return {
          success: false,
          error: new Error('Request not found')
        };
      }

      const request = requestResult.data;

      // 2. Find best agent based on strategy
      let selectedAgent: AgentAssignment;

      if (options.agentId) {
        // Manual assignment
        selectedAgent = await this.getAgentForManualAssignment(options.agentId);
      } else {
        // Intelligent assignment
        selectedAgent = await this.findBestAgent(request, options);
      }

      // 3. Perform the assignment
      const assignmentResult = await this.requestRepository.assignRequest(
        requestId,
        selectedAgent.agentId,
        selectedAgent.agentName,
        selectedAgent.agentRole,
        {
          assignmentType: 'primary',
          reason: `Auto-assigned using ${options.strategy} strategy`,
          priority: request.priority === 'urgent' ? 'urgent' : 'normal'
        }
      );

      if (!assignmentResult.success) {
        // Transform RequestAssignment to AgentAssignment for return
      const agentAssignmentResult: ServiceResult<AgentAssignment> = {
        success: true,
        data: selectedAgent,
        meta: assignmentResult.meta
      };
      return agentAssignmentResult;
      }

      // 4. Update request priority if needed
      if (selectedAgent.confidence > 0.8 && request.priority !== 'urgent') {
        await this.requestRepository.update({
          id: requestId,
          data: {
            priority: 'high' // Boost priority for high-confidence matches
          }
        });
      }

      // 5. Send assignment notifications
      if (this.notificationService) {
        await this.notificationService.sendAssignmentNotification(
          selectedAgent.agentId, 
          requestId,
          selectedAgent.assignmentReason
        );
      }

      // 6. Schedule follow-up based on priority
      const followUpHours = request.priority === 'urgent' ? 2 : 
                           request.priority === 'high' ? 4 : 
                           request.priority === 'medium' ? 24 : 48;

      await this.scheduleFollowUp(requestId, {
        followUpType: 'initial_contact',
        scheduledDate: new Date(Date.now() + followUpHours * 60 * 60 * 1000).toISOString(),
        priority: request.priority || 'medium',
        assignedTo: selectedAgent.agentId,
        reminderDays: [0], // Reminder on due date
        autoReschedule: true
      });

      this.logger.info('Request assigned successfully', {
        requestId,
        agentId: selectedAgent.agentId,
        agentName: selectedAgent.agentName,
        confidence: selectedAgent.confidence,
        reason: selectedAgent.assignmentReason
      });

      return {
        success: true,
        data: selectedAgent,
        meta: {
          executionTime: Date.now(),
          warnings: [`Assignment confidence: ${selectedAgent.confidence}`]
        }
      };

    } catch (error) {
      this.logger.error('Agent assignment failed', { requestId, error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error assigning agent')
      };
    }
  }

  /**
   * Calculate comprehensive lead score
   */
  async calculateLeadScore(requestId: string): Promise<ServiceResult<LeadScoreResult>> {
    try {
      this.logger.info('Calculating lead score', { requestId });

      // 1. Get request with all related data
      const requestResult = await this.requestRepository.getWithRelations(requestId);
      if (!requestResult.success || !requestResult.data) {
        return {
          success: false,
          error: new Error('Request not found')
        };
      }

      const request = requestResult.data;

      // 2. Calculate scoring factors
      const factors = {
        dataCompleteness: this.calculateDataCompletenessScore(request),
        sourceQuality: this.calculateSourceQualityScore(request),
        engagementLevel: this.calculateEngagementScore(request),
        budgetAlignment: this.calculateBudgetAlignmentScore(request),
        projectComplexity: this.calculateProjectComplexityScore(request),
        geographicFit: this.calculateGeographicFitScore(request),
        urgencyIndicators: this.calculateUrgencyScore(request)
      };

      // 3. Weight factors and calculate overall score
      const weights = {
        dataCompleteness: 0.20,
        sourceQuality: 0.15,
        engagementLevel: 0.15,
        budgetAlignment: 0.20,
        projectComplexity: 0.10,
        geographicFit: 0.10,
        urgencyIndicators: 0.10
      };

      const overallScore = Math.round(
        factors.dataCompleteness * weights.dataCompleteness +
        factors.sourceQuality * weights.sourceQuality +
        factors.engagementLevel * weights.engagementLevel +
        factors.budgetAlignment * weights.budgetAlignment +
        factors.projectComplexity * weights.projectComplexity +
        factors.geographicFit * weights.geographicFit +
        factors.urgencyIndicators * weights.urgencyIndicators
      );

      // 4. Determine grade and priority
      const grade = overallScore >= 90 ? 'A' :
                   overallScore >= 80 ? 'B' :
                   overallScore >= 70 ? 'C' :
                   overallScore >= 60 ? 'D' : 'F';

      const priorityLevel = overallScore >= 85 ? 'urgent' :
                           overallScore >= 70 ? 'high' :
                           overallScore >= 50 ? 'medium' : 'low';

      const conversionProbability = Math.min(overallScore / 100 * 0.9, 0.95); // Cap at 95%

      // 5. Generate recommendations
      const recommendations = this.generateLeadRecommendations(factors, overallScore);

      const leadScore: LeadScoreResult = {
        requestId,
        overallScore,
        grade,
        conversionProbability,
        priorityLevel,
        factors,
        recommendations,
        calculatedAt: new Date().toISOString()
      };

      // 6. Update request with calculated score
      await this.requestRepository.update({
        id: requestId,
        data: {
          readinessScore: overallScore,
          priority: priorityLevel
        }
      });

      this.logger.info('Lead score calculated', {
        requestId,
        overallScore,
        grade,
        priorityLevel
      });

      return {
        success: true,
        data: leadScore,
        meta: {
          executionTime: Date.now(),
          warnings: [`Calculated ${Object.keys(factors).length} scoring factors`]
        }
      };

    } catch (error) {
      this.logger.error('Lead scoring failed', { requestId, error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error calculating lead score')
      };
    }
  }

  /**
   * Schedule follow-up with intelligent timing
   */
  async scheduleFollowUp(
    requestId: string,
    schedule: Omit<FollowUpSchedule, 'requestId'>
  ): Promise<ServiceResult<FollowUpSchedule>> {
    try {
      this.logger.info('Scheduling follow-up', { requestId, schedule });

      // 1. Calculate optimal follow-up date if not provided
      let scheduledDate = schedule.scheduledDate;
      if (!scheduledDate) {
        scheduledDate = this.calculateOptimalFollowUpDate(
          schedule.followUpType, 
          schedule.priority
        );
      }

      const followUpSchedule: FollowUpSchedule = {
        requestId,
        ...schedule,
        scheduledDate
      };

      // 2. Create follow-up note
      await this.requestRepository.addNote(requestId, 
        `Follow-up scheduled for ${new Date(scheduledDate).toLocaleDateString()} - ${schedule.followUpType}`,
        {
          type: 'follow_up',
          category: 'scheduling',
          priority: schedule.priority === 'urgent' ? 'urgent' : 
                   schedule.priority === 'high' ? 'important' : 'normal',
          followUpRequired: true,
          followUpDate: scheduledDate
        }
      );

      // 3. Update request follow-up date
      await this.requestRepository.update({
        id: requestId,
        data: {
          followUpDate: scheduledDate
        }
      });

      // 4. Create reminders if needed
      if (schedule.reminderDays.length > 0) {
        for (const daysBefore of schedule.reminderDays) {
          const reminderDate = new Date(scheduledDate);
          reminderDate.setDate(reminderDate.getDate() - daysBefore);
          
          if (reminderDate > new Date()) {
            // Would schedule reminder with notification service
            if (this.notificationService) {
              await this.notificationService.scheduleReminder({
                requestId,
                reminderDate: reminderDate.toISOString(),
                message: `Follow-up due in ${daysBefore} day(s): ${schedule.followUpType}`,
                recipientId: schedule.assignedTo
              });
            }
          }
        }
      }

      this.logger.info('Follow-up scheduled successfully', {
        requestId,
        scheduledDate,
        followUpType: schedule.followUpType
      });

      return {
        success: true,
        data: followUpSchedule,
        meta: {
          executionTime: Date.now(),
          warnings: [`Scheduled ${schedule.reminderDays.length} reminders`]
        }
      };

    } catch (error) {
      this.logger.error('Follow-up scheduling failed', { requestId, error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error scheduling follow-up')
      };
    }
  }

  /**
   * Validate status transition with business rules
   */
  async validateStatusTransition(
    requestId: string, 
    newStatus: string,
    context?: {
      userId?: string;
      reason?: string;
      bypassValidation?: boolean;
    }
  ): Promise<ServiceResult<StatusTransitionResult>> {
    try {
      this.logger.info('Validating status transition', { requestId, newStatus, context });

      // 1. Get current request
      const requestResult = await this.requestRepository.get(requestId);
      if (!requestResult.success || !requestResult.data) {
        return {
          success: false,
          error: new Error('Request not found')
        };
      }

      const request = requestResult.data;
      const currentStatus = request.status || 'new';

      // 2. Use repository's built-in validation
      const validationResult = await this.requestRepository.validateStatusTransition(
        currentStatus, 
        newStatus
      );

      // 3. Add business-specific validation
      const businessValidation = await this.validateBusinessRules(
        request, 
        currentStatus, 
        newStatus,
        context
      );

      // 4. Combine results
      const combinedResult: StatusTransitionResult = {
        isValid: validationResult.isValid && businessValidation.isValid,
        errors: [
          ...(validationResult.errors || []),
          ...(businessValidation.errors || [])
        ],
        warnings: [
          ...(validationResult.warnings || []),
          ...(businessValidation.warnings || [])
        ],
        requiredFields: [
          ...(validationResult.requiredFields || []),
          ...(businessValidation.requiredFields || [])
        ],
        businessRules: [
          ...(validationResult.businessRules || []),
          ...(businessValidation.businessRules || [])
        ]
      };

      return {
        success: true,
        data: combinedResult,
        meta: {
          executionTime: Date.now(),
          warnings: [`Status transition: ${currentStatus} -> ${newStatus}`]
        }
      };

    } catch (error) {
      this.logger.error('Status transition validation failed', { requestId, error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error validating status transition')
      };
    }
  }

  /**
   * Merge duplicate requests intelligently
   */
  async mergeRequests(
    primaryRequestId: string, 
    requestsToMerge: string[],
    options: {
      conflictResolution?: 'keep_primary' | 'use_latest' | 'manual_review';
      preserveHistory?: boolean;
      notifyStakeholders?: boolean;
    } = {}
  ): Promise<ServiceResult<RequestMergeResult>> {
    try {
      this.logger.info('Merging requests', { primaryRequestId, requestsToMerge, options });

      // 1. Get all requests with relations
      const primaryResult = await this.requestRepository.getWithRelations(primaryRequestId);
      if (!primaryResult.success || !primaryResult.data) {
        return {
          success: false,
          error: new Error('Primary request not found')
        };
      }

      const requestsToMergeData = await Promise.all(
        requestsToMerge.map(id => this.requestRepository.getWithRelations(id))
      );

      // 2. Identify conflicts and merge data
      const mergeResult = this.performRequestMerge(
        primaryResult.data,
        requestsToMergeData.filter(r => r.success).map(r => r.data!),
        options
      );

      // 3. Update primary request with merged data
      await this.requestRepository.update({
        id: primaryRequestId,
        data: mergeResult.combinedData
      });

      // 4. Migrate notes and assignments
      for (const note of mergeResult.mergedNotes) {
        await this.requestRepository.addNote(primaryRequestId, note.content, {
          type: note.type,
          category: note.category,
          isPrivate: note.isPrivate,
          authorName: `[MERGED] ${note.authorName}`,
          priority: note.priority
        });
      }

      // 5. Archive merged requests
      for (const requestId of requestsToMerge) {
        await this.requestRepository.update({
          id: requestId,
          data: {
            archived: new Date().toISOString(),
            status: 'merged',
            officeNotes: `Merged into request ${primaryRequestId}`
          }
        });
      }

      // 6. Create merge history record
      await this.requestRepository.addNote(primaryRequestId,
        `Merged ${requestsToMerge.length} duplicate request(s): ${requestsToMerge.join(', ')}`, {
        type: 'internal',
        category: 'merge_operation',
        priority: 'normal',
        isPrivate: true
      });

      // 7. Notifications
      if (options.notifyStakeholders && this.notificationService) {
        await this.notificationService.sendMergeNotification(
          primaryRequestId,
          requestsToMerge,
          mergeResult.conflictResolutions.length
        );
      }

      this.logger.info('Requests merged successfully', {
        primaryRequestId,
        mergedCount: requestsToMerge.length,
        conflictsResolved: mergeResult.conflictResolutions.length
      });

      return {
        success: true,
        data: mergeResult,
        meta: {
          executionTime: Date.now(),
          warnings: [`Merged ${requestsToMerge.length} requests with ${mergeResult.conflictResolutions.length} conflicts`]
        }
      };

    } catch (error) {
      this.logger.error('Request merge failed', { primaryRequestId, error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error merging requests')
      };
    }
  }

  /**
   * Archive old requests based on business rules
   */
  async archiveOldRequests(
    options: {
      olderThanDays?: number;
      statuses?: string[];
      excludeActiveQuotes?: boolean;
      batchSize?: number;
      dryRun?: boolean;
    } = {}
  ): Promise<ServiceResult<{ archived: number; skipped: number; errors: string[] }>> {
    try {
      const {
        olderThanDays = 365,
        statuses = ['completed', 'cancelled', 'expired'],
        excludeActiveQuotes = true,
        batchSize = 50,
        dryRun = false
      } = options;

      this.logger.info('Archiving old requests', { options });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      const cutoffString = cutoffDate.toISOString();

      // Find candidates for archival
      const candidatesResult = await this.requestRepository.find({
        and: [
          { or: statuses.map(status => ({ status: { eq: status } })) },
          { updatedAt: { lt: cutoffString } },
          { archived: { attributeExists: false } }
        ]
      }, {
        pagination: { limit: batchSize }
      });

      if (!candidatesResult.success || !candidatesResult.data) {
        return {
          success: false,
          error: candidatesResult.error || new Error('Failed to find archival candidates')
        };
      }

      let archived = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const request of candidatesResult.data) {
        try {
          // Skip if has active quotes (if option enabled)
          if (excludeActiveQuotes) {
            // Would check with QuoteService for active quotes
            const hasActiveQuotes = false; // Mock check
            if (hasActiveQuotes) {
              skipped++;
              continue;
            }
          }

          if (!dryRun) {
            // Archive the request
            await this.requestRepository.update({
              id: request.id,
              data: {
                archived: new Date().toISOString(),
                archivedDate: new Date().toISOString()
              }
            });

            // Add archive note
            await this.requestRepository.addNote(request.id, 
              `Automatically archived - inactive for ${olderThanDays} days`, {
              type: 'internal',
              category: 'archival',
              isPrivate: true,
              priority: 'normal'
            });
          }

          archived++;

        } catch (error) {
          errors.push(`Failed to archive request ${request.id}: ${error}`);
          skipped++;
        }
      }

      this.logger.info('Archival completed', { archived, skipped, errors: errors.length });

      return {
        success: true,
        data: { archived, skipped, errors },
        meta: {
          executionTime: Date.now(),
          warnings: [`Archival completed: ${archived} archived, ${skipped} skipped`]
        }
      };

    } catch (error) {
      this.logger.error('Archival failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error during archival')
      };
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validate quote generation requirements
   */
  private async validateQuoteRequirements(requestId: string): Promise<string[]> {
    // Mock implementation - would check actual requirements
    const missingInfo: string[] = [];

    // Example validation logic
    const request = await this.requestRepository.get(requestId);
    if (request.success && request.data) {
      if (!request.data.product) missingInfo.push('Product selection');
      if (!request.data.budget) missingInfo.push('Budget information');
      if (!request.data.addressId) missingInfo.push('Property details');
      if (!request.data.homeownerContactId) missingInfo.push('Customer contact');
    }

    return missingInfo;
  }

  /**
   * Calculate quote pricing based on request details
   */
  private async calculateQuotePricing(
    request: Request, 
    input: QuoteGenerationInput
  ): Promise<{ basePrice: number; totalPrice: number; breakdown: any }> {
    // Mock pricing calculation - would use actual pricing service
    const basePrice = input.basePrice || 10000;
    const adjustments = input.adjustmentFactors || {
      complexity: 1.0,
      materials: 1.0,
      timeline: 1.0,
      location: 1.0
    };
    
    const complexityMultiplier = adjustments.complexity || 1.0;
    const materialMultiplier = adjustments.materials || 1.0;
    const timelineMultiplier = adjustments.timeline || 1.0;
    const locationMultiplier = adjustments.location || 1.0;

    const totalPrice = Math.round(
      basePrice * complexityMultiplier * materialMultiplier * 
      timelineMultiplier * locationMultiplier
    );

    return {
      basePrice,
      totalPrice,
      breakdown: {
        base: basePrice,
        complexity: Math.round((complexityMultiplier - 1) * basePrice),
        materials: Math.round((materialMultiplier - 1) * basePrice),
        timeline: Math.round((timelineMultiplier - 1) * basePrice),
        location: Math.round((locationMultiplier - 1) * basePrice)
      }
    };
  }

  /**
   * Find best agent for assignment
   */
  private async findBestAgent(
    request: EnhancedRequest, 
    options: any
  ): Promise<AgentAssignment> {
    // Mock implementation - would use actual agent service
    return {
      agentId: 'agent_123',
      agentName: 'John Smith',
      agentRole: 'Account Executive',
      assignmentReason: 'workload_balance',
      confidence: 0.85,
      workloadBefore: 5,
      workloadAfter: 6,
      estimatedCapacity: 10,
      specialtyMatch: true,
      distanceScore: 0.9
    };
  }

  /**
   * Get agent details for manual assignment
   */
  private async getAgentForManualAssignment(agentId: string): Promise<AgentAssignment> {
    // Mock implementation - would use contact service
    return {
      agentId,
      agentName: 'Manual Assignment',
      agentRole: 'Agent',
      assignmentReason: 'manual',
      confidence: 1.0,
      workloadBefore: 0,
      workloadAfter: 1,
      estimatedCapacity: 10,
      specialtyMatch: false,
      distanceScore: 0.0
    };
  }

  /**
   * Calculate optimal follow-up date
   */
  private calculateOptimalFollowUpDate(
    followUpType: string, 
    priority: string
  ): string {
    const now = new Date();
    let hoursToAdd: number;

    switch (followUpType) {
      case 'initial_contact':
        hoursToAdd = priority === 'urgent' ? 2 : priority === 'high' ? 4 : 24;
        break;
      case 'information_request':
        hoursToAdd = 48;
        break;
      case 'quote_follow_up':
        hoursToAdd = 72;
        break;
      case 'check_in':
        hoursToAdd = 168; // 1 week
        break;
      case 'closing':
        hoursToAdd = 24;
        break;
      default:
        hoursToAdd = 48;
    }

    const followUpDate = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
    return followUpDate.toISOString();
  }

  // ============================================================================
  // Lead Scoring Helper Methods
  // ============================================================================

  private calculateDataCompletenessScore(request: EnhancedRequest): number {
    const fields = [
      !!request.homeownerContactId,
      !!request.agentContactId,
      !!request.addressId,
      !!request.product,
      !!request.budget,
      !!request.message,
      !!request.leadSource,
      !!request.relationToProperty
    ];
    
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  }

  private calculateSourceQualityScore(request: EnhancedRequest): number {
    // Mock scoring based on lead source
    const sourceScores: Record<string, number> = {
      'referral': 90,
      'website': 80,
      'agent_direct': 85,
      'social_media': 70,
      'advertisement': 60,
      'cold_outreach': 40,
      'unknown': 30
    };

    return sourceScores[request.leadSource || 'unknown'] || 50;
  }

  private calculateEngagementScore(request: EnhancedRequest): number {
    let score = 50; // Base score

    // Message quality
    if (request.message) {
      if (request.message.length > 100) score += 20;
      if (request.message.includes('urgent') || request.message.includes('ASAP')) score += 10;
    }

    // Media attachments
    if (request.uploadedMedia || request.uplodedDocuments || request.uploadedVideos) {
      score += 15;
    }

    // Meeting requested
    if (request.requestedVisitDateTime) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  private calculateBudgetAlignmentScore(request: EnhancedRequest): number {
    // Mock budget analysis
    const budgetStr = request.budget?.toLowerCase();
    if (!budgetStr) return 30;

    if (budgetStr.includes('no budget') || budgetStr.includes('free')) return 10;
    if (budgetStr.includes('$100k+') || budgetStr.includes('luxury')) return 95;
    if (budgetStr.includes('$50k') || budgetStr.includes('$75k')) return 85;
    if (budgetStr.includes('$25k') || budgetStr.includes('$30k')) return 70;
    if (budgetStr.includes('$10k') || budgetStr.includes('$15k')) return 60;

    return 50; // Default for unclear budget
  }

  private calculateProjectComplexityScore(request: EnhancedRequest): number {
    // Higher complexity can mean higher value but also higher risk
    const product = request.product?.toLowerCase();
    if (!product) return 50;

    if (product.includes('kitchen') || product.includes('bathroom')) return 80;
    if (product.includes('addition') || product.includes('extension')) return 85;
    if (product.includes('renovation') || product.includes('remodel')) return 75;
    if (product.includes('repair') || product.includes('maintenance')) return 60;

    return 65;
  }

  private calculateGeographicFitScore(request: EnhancedRequest): number {
    // Mock geographic scoring - would use actual location data
    if (request.address) {
      // In service area
      return 85;
    }
    return 50; // Unknown location
  }

  private calculateUrgencyScore(request: EnhancedRequest): number {
    let score = 50;

    if (request.requestedVisitDateTime) {
      const visitDate = new Date(request.requestedVisitDateTime);
      const now = new Date();
      const daysFromNow = (visitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysFromNow <= 7) score += 30;
      else if (daysFromNow <= 14) score += 20;
      else if (daysFromNow <= 30) score += 10;
    }

    if (request.message?.toLowerCase().includes('urgent')) score += 20;
    if (request.message?.toLowerCase().includes('asap')) score += 15;

    return Math.min(score, 100);
  }

  private generateLeadRecommendations(factors: any, overallScore: number): string[] {
    const recommendations: string[] = [];

    if (factors.dataCompleteness < 70) {
      recommendations.push('Gather missing customer and property information');
    }

    if (factors.engagementLevel < 60) {
      recommendations.push('Follow up to increase engagement and gather project details');
    }

    if (factors.budgetAlignment < 50) {
      recommendations.push('Qualify budget and set realistic expectations');
    }

    if (overallScore >= 85) {
      recommendations.push('High-priority lead - schedule immediate consultation');
    } else if (overallScore >= 70) {
      recommendations.push('Schedule consultation within 24-48 hours');
    } else if (overallScore < 50) {
      recommendations.push('Consider lead nurturing campaign before direct outreach');
    }

    return recommendations;
  }

  /**
   * Validate business-specific rules for status transitions
   */
  private async validateBusinessRules(
    request: Request,
    currentStatus: string,
    newStatus: string,
    context?: any
  ): Promise<StatusTransitionResult> {
    const result: StatusTransitionResult = {
      isValid: true,
      errors: [],
      warnings: [],
      requiredFields: [],
      businessRules: []
    };

    // Business hour restrictions
    if (newStatus === 'quote_sent' && this.isOutsideBusinessHours()) {
      result.warnings?.push('Sending quote outside business hours - consider scheduling for next business day');
    }

    // Assignment requirements
    if (['assigned', 'in_progress'].includes(newStatus) && !request.assignedTo) {
      result.errors?.push('Request must be assigned to an agent before status change');
      result.isValid = false;
    }

    // Quote requirements
    if (newStatus === 'quote_sent' && !request.budget) {
      result.warnings?.push('No budget information available - may affect quote accuracy');
    }

    return result;
  }

  private isOutsideBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Weekend or outside 9-5
    return day === 0 || day === 6 || hour < 9 || hour >= 17;
  }

  /**
   * Perform the actual request merge operation
   */
  private performRequestMerge(
    primary: EnhancedRequest,
    toMerge: EnhancedRequest[],
    options: any
  ): RequestMergeResult {
    // Mock implementation - would have complex merge logic
    const combinedData: Partial<Request> = { ...primary };
    const conflictResolutions: any[] = [];
    const mergedNotes: RequestNote[] = [];
    const mergedAssignments: RequestAssignment[] = [];

    // Combine notes from all requests
    for (const request of toMerge) {
      mergedNotes.push(...request.notes);
      mergedAssignments.push(...request.assignments);
    }

    return {
      primaryRequestId: primary.id,
      mergedRequestIds: toMerge.map(r => r.id),
      combinedData,
      conflictResolutions,
      mergedNotes,
      mergedAssignments
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new RequestService instance with dependencies
 */
export function createRequestService(dependencies: RequestServiceDependencies): RequestService {
  return new RequestService(dependencies);
}

// ============================================================================
// Default Export
// ============================================================================

export default RequestService;