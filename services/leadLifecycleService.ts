import { requestsAPI, backOfficeRequestStatusesAPI } from '../utils/amplifyAPI';
import { requestStatusService } from './requestStatusService';
// import { notificationService } from './notificationService';
import { leadNotificationService } from './leadNotificationService';
import { createLogger } from '../utils/logger';

const logger = createLogger('LeadLifecycleService');

// Lead lifecycle interfaces
export interface LeadLifecycleRules {
  expirationEnabled: boolean;
  expirationDays: number; // Default 14 days
  warningDays: number; // Days before expiration to send warning
  autoArchiveExpired: boolean;
  reactivationEnabled: boolean;
  maxReactivations: number;
  customRulesBySource: Record<string, Partial<LeadLifecycleRules>>;
}

export interface ArchivalReason {
  id: string;
  category: 'completed' | 'cancelled' | 'expired' | 'duplicate' | 'unqualified' | 'other';
  label: string;
  description: string;
  requiresNotes: boolean;
  order: number;
}

export interface LeadExpirationCheck {
  requestId: string;
  currentStatus: string;
  daysSinceCreated: number;
  daysSinceLastActivity: number;
  expirationDate: Date;
  warningDate: Date;
  isExpired: boolean;
  needsWarning: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ArchivalRequest {
  requestId: string;
  reasonId: string;
  notes?: string;
  userId: string;
  preserveForAnalytics: boolean;
  notifyStakeholders: boolean;
}

export interface ArchivalResult {
  success: boolean;
  requestId: string;
  archivedDate: string;
  reason: ArchivalReason;
  previousStatus: string;
  error?: string;
}

export interface ReactivationRequest {
  requestId: string;
  reasonForReactivation: string;
  newAssignee?: string;
  userId: string;
  resetExpirationTimer: boolean;
}

export interface ReactivationResult {
  success: boolean;
  requestId: string;
  reactivatedDate: string;
  newStatus: string;
  assignedTo: string;
  reactivationCount: number;
  error?: string;
}

export interface LeadLifecycleMetrics {
  totalLeads: number;
  activeLeads: number;
  expiredLeads: number;
  archivedLeads: number;
  conversionRate: number;
  averageLifecycleDays: number;
  expirationRate: number;
  reactivationSuccessRate: number;
  statusDistribution: Record<string, number>;
  sourcePerformance: Record<string, {
    totalLeads: number;
    conversionRate: number;
    averageLifecycleDays: number;
    expirationRate: number;
  }>;
}

export interface BulkArchivalRequest {
  filters: {
    statuses?: string[];
    olderThanDays?: number;
    leadSources?: string[];
    assignees?: string[];
  };
  reasonId: string;
  notes?: string;
  userId: string;
  dryRun: boolean;
}

export interface BulkArchivalResult {
  success: boolean;
  processedCount: number;
  successfulArchives: string[];
  failedArchives: Array<{ requestId: string; error: string }>;
  estimatedOnly: boolean;
}

/**
 * Lead Lifecycle Management Service - Handles expiration, archival, and reactivation
 */
export class LeadLifecycleService {
  private lifecycleRules!: LeadLifecycleRules;
  private archivalReasons!: ArchivalReason[];
  private metricsCache: LeadLifecycleMetrics | null = null;
  private metricsCacheTimestamp: number = 0;
  private readonly METRICS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeDefaultRules();
    this.initializeArchivalReasons();
  }

  /**
   * Initialize default lifecycle rules
   */
  private initializeDefaultRules(): void {
    this.lifecycleRules = {
      expirationEnabled: true,
      expirationDays: 14,
      warningDays: 3, // 3 days before expiration
      autoArchiveExpired: true,
      reactivationEnabled: true,
      maxReactivations: 3,
      customRulesBySource: {
        'Equity Union': { expirationDays: 21 }, // Extended for key partner
        'Referral': { expirationDays: 30 }, // Extended for referrals
        'E2E_TEST': { expirationEnabled: false } // Never expire test data
      }
    };

    logger.info('Lead lifecycle rules initialized', this.lifecycleRules);
  }

  /**
   * Initialize archival reason taxonomy
   */
  private initializeArchivalReasons(): void {
    this.archivalReasons = [
      {
        id: 'completed_successful',
        category: 'completed',
        label: 'Project Completed Successfully',
        description: 'Lead converted to project and completed successfully',
        requiresNotes: false,
        order: 1
      },
      {
        id: 'completed_quote_accepted',
        category: 'completed',
        label: 'Quote Accepted - Project Pending',
        description: 'Quote was accepted, project will be tracked separately',
        requiresNotes: false,
        order: 2
      },
      {
        id: 'cancelled_no_response',
        category: 'cancelled',
        label: 'No Response from Client',
        description: 'Multiple attempts to contact client with no response',
        requiresNotes: true,
        order: 10
      },
      {
        id: 'cancelled_budget_mismatch',
        category: 'cancelled',
        label: 'Budget Mismatch',
        description: 'Client budget does not align with project requirements',
        requiresNotes: true,
        order: 11
      },
      {
        id: 'cancelled_timeline_conflict',
        category: 'cancelled',
        label: 'Timeline Conflict',
        description: 'Unable to meet client timeline requirements',
        requiresNotes: false,
        order: 12
      },
      {
        id: 'cancelled_client_decision',
        category: 'cancelled',
        label: 'Client Decided Not to Proceed',
        description: 'Client actively decided against proceeding with project',
        requiresNotes: true,
        order: 13
      },
      {
        id: 'expired_automatic',
        category: 'expired',
        label: 'Automatically Expired',
        description: 'Lead expired based on configured expiration rules',
        requiresNotes: false,
        order: 20
      },
      {
        id: 'expired_manual',
        category: 'expired',
        label: 'Manually Expired',
        description: 'Lead manually marked as expired by team member',
        requiresNotes: true,
        order: 21
      },
      {
        id: 'duplicate_request',
        category: 'duplicate',
        label: 'Duplicate Request',
        description: 'This request is a duplicate of another request',
        requiresNotes: true,
        order: 30
      },
      {
        id: 'unqualified_outside_area',
        category: 'unqualified',
        label: 'Outside Service Area',
        description: 'Property is outside our service area',
        requiresNotes: false,
        order: 40
      },
      {
        id: 'unqualified_scope',
        category: 'unqualified',
        label: 'Out of Scope',
        description: 'Project type is outside our service offerings',
        requiresNotes: true,
        order: 41
      },
      {
        id: 'other_reason',
        category: 'other',
        label: 'Other Reason',
        description: 'Other reason not covered by standard categories',
        requiresNotes: true,
        order: 50
      }
    ];

    logger.info('Archival reasons initialized', { count: this.archivalReasons.length });
  }

  /**
   * Check for leads that need expiration warnings or are expired
   */
  async checkLeadExpirations(): Promise<LeadExpirationCheck[]> {
    try {
      logger.info('Starting lead expiration check');

      const requestsResult = await requestsAPI.list();
      if (!requestsResult.success) {
        throw new Error('Failed to fetch requests for expiration check');
      }

      const activeStatuses = ['New', 'Pending walk-thru', 'Move to Quoting'];
      const activeRequests = requestsResult.data.filter((request: any) => 
        activeStatuses.includes(request.status) && 
        request.leadSource !== 'E2E_TEST' // Exclude test data
      );

      const expirationChecks: LeadExpirationCheck[] = [];

      for (const request of activeRequests) {
        const check = this.calculateExpirationCheck(request);
        expirationChecks.push(check);
      }

      // Sort by risk level and days until expiration
      expirationChecks.sort((a, b) => {
        const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        }
        return a.daysSinceCreated - b.daysSinceCreated;
      });

      logger.info('Lead expiration check completed', {
        totalChecked: activeRequests.length,
        needsWarning: expirationChecks.filter(c => c.needsWarning).length,
        expired: expirationChecks.filter(c => c.isExpired).length
      });

      return expirationChecks;

    } catch (error) {
      logger.error('Error checking lead expirations', error);
      return [];
    }
  }

  /**
   * Calculate expiration status for a single request
   */
  private calculateExpirationCheck(request: any): LeadExpirationCheck {
    const rules = this.getEffectiveRulesForLead(request);
    const createdDate = new Date(request.createdAt);
    const now = new Date();
    
    const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate last activity (could be assignment date, last status change, etc.)
    const lastActivityDate = request.assignedDate ? 
      new Date(Math.max(createdDate.getTime(), new Date(request.assignedDate).getTime())) : 
      createdDate;
    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    const expirationDate = new Date(createdDate.getTime() + (rules.expirationDays * 24 * 60 * 60 * 1000));
    const warningDate = new Date(expirationDate.getTime() - (rules.warningDays * 24 * 60 * 60 * 1000));

    const isExpired = now > expirationDate;
    const needsWarning = now > warningDate && !isExpired;

    // Calculate risk level
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    
    if (isExpired) {
      riskLevel = 'critical';
    } else if (daysUntilExpiration <= 1) {
      riskLevel = 'high';
    } else if (daysUntilExpiration <= rules.warningDays) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      requestId: request.id,
      currentStatus: request.status,
      daysSinceCreated,
      daysSinceLastActivity,
      expirationDate,
      warningDate,
      isExpired,
      needsWarning,
      riskLevel
    };
  }

  /**
   * Get effective expiration rules for a specific lead
   */
  private getEffectiveRulesForLead(request: any): LeadLifecycleRules {
    const baseRules = this.lifecycleRules;
    const sourceRules = baseRules.customRulesBySource[request.leadSource];
    
    return sourceRules ? { ...baseRules, ...sourceRules } : baseRules;
  }

  /**
   * Process automatic expiration for leads
   */
  async processAutomaticExpirations(): Promise<{ expired: string[]; warnings: string[] }> {
    try {
      logger.info('Starting automatic expiration processing');

      const expirationChecks = await this.checkLeadExpirations();
      const expiredLeads = expirationChecks.filter(check => check.isExpired);
      const warningLeads = expirationChecks.filter(check => check.needsWarning);

      const expired: string[] = [];
      const warnings: string[] = [];

      // Process expired leads
      for (const check of expiredLeads) {
        if (this.lifecycleRules.autoArchiveExpired) {
          const archivalResult = await this.archiveLead({
            requestId: check.requestId,
            reasonId: 'expired_automatic',
            userId: 'system',
            preserveForAnalytics: true,
            notifyStakeholders: true
          });

          if (archivalResult.success) {
            expired.push(check.requestId);
          }
        } else {
          // Just mark as expired without archiving
          const statusResult = await requestStatusService.changeStatus(
            check.requestId,
            'Expired',
            {
              userId: 'system',
              triggeredBy: 'system',
              reason: 'Automatic expiration after 14 days'
            }
          );

          if (statusResult.success) {
            expired.push(check.requestId);
          }
        }
      }

      // Send warning notifications
      for (const check of warningLeads) {
        await this.sendExpirationWarning(check);
        warnings.push(check.requestId);
      }

      logger.info('Automatic expiration processing completed', {
        expired: expired.length,
        warnings: warnings.length
      });

      return { expired, warnings };

    } catch (error) {
      logger.error('Error processing automatic expirations', error);
      return { expired: [], warnings: [] };
    }
  }

  /**
   * Send expiration warning notification
   */
  private async sendExpirationWarning(check: LeadExpirationCheck): Promise<void> {
    try {
      // Get request details for notification
      const requestResult = await requestsAPI.get(check.requestId);
      if (!requestResult.success) return;

      const request = requestResult.data;
      const daysUntilExpiration = Math.ceil(
        (check.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Send enhanced notification using lead notification service
      if (request.assignedTo && request.assignedTo !== 'Unassigned') {
        await leadNotificationService.sendExpirationWarning(
          check.requestId,
          request.assignedTo,
          daysUntilExpiration
        );
      }

      logger.debug('Expiration warning sent', { 
        requestId: check.requestId, 
        assignedTo: request.assignedTo,
        daysUntilExpiration
      });

    } catch (error) {
      logger.error('Error sending expiration warning', { requestId: check.requestId, error });
    }
  }

  /**
   * Archive a lead with specified reason
   */
  async archiveLead(request: ArchivalRequest): Promise<ArchivalResult> {
    try {
      logger.info('Archiving lead', { requestId: request.requestId, reasonId: request.reasonId });

      // Get current request details
      const requestResult = await requestsAPI.get(request.requestId);
      if (!requestResult.success) {
        throw new Error('Request not found');
      }

      const currentRequest = requestResult.data;
      const reason = this.archivalReasons.find(r => r.id === request.reasonId);
      if (!reason) {
        throw new Error('Invalid archival reason');
      }

      // Validate notes requirement
      if (reason.requiresNotes && !request.notes) {
        throw new Error('Notes are required for this archival reason');
      }

      // Update request status to Archived
      const statusResult = await requestStatusService.changeStatus(
        request.requestId,
        'Archived',
        {
          userId: request.userId,
          triggeredBy: 'user',
          reason: `Archived: ${reason.label}`
        }
      );

      if (!statusResult.success) {
        throw new Error('Failed to update request status');
      }

      // Update request with archival details
      const updateResult = await requestsAPI.update(request.requestId, {
        archivedDate: new Date().toISOString(),
        officeNotes: request.notes ? 
          `${currentRequest.officeNotes || ''}\n\nArchived: ${reason.label}\nNotes: ${request.notes}`.trim() :
          `${currentRequest.officeNotes || ''}\n\nArchived: ${reason.label}`.trim()
      });

      if (!updateResult.success) {
        logger.warn('Failed to update request with archival details', { requestId: request.requestId });
      }

      // Send notifications if requested
      if (request.notifyStakeholders) {
        await this.sendArchivalNotifications(currentRequest, reason, request.notes);
      }

      logger.info('Lead archived successfully', {
        requestId: request.requestId,
        reason: reason.label,
        previousStatus: currentRequest.status
      });

      return {
        success: true,
        requestId: request.requestId,
        archivedDate: new Date().toISOString(),
        reason,
        previousStatus: currentRequest.status
      };

    } catch (error) {
      logger.error('Error archiving lead', { requestId: request.requestId, error });
      return {
        success: false,
        requestId: request.requestId,
        archivedDate: '',
        reason: this.archivalReasons.find(r => r.id === request.reasonId)!,
        previousStatus: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send archival notifications to stakeholders
   */
  private async sendArchivalNotifications(request: any, reason: ArchivalReason, notes?: string): Promise<void> {
    try {
      // Send enhanced notification using lead notification service
      if (request.assignedTo && request.assignedTo !== 'Unassigned') {
        await leadNotificationService.sendArchivedNotification(
          request.id,
          request.assignedTo,
          reason.label,
          notes
        );
      }

    } catch (error) {
      logger.error('Error sending archival notifications', { requestId: request.id, error });
    }
  }

  /**
   * Reactivate an archived or expired lead
   */
  async reactivateLead(request: ReactivationRequest): Promise<ReactivationResult> {
    try {
      logger.info('Reactivating lead', { requestId: request.requestId });

      // Get current request details
      const requestResult = await requestsAPI.get(request.requestId);
      if (!requestResult.success) {
        throw new Error('Request not found');
      }

      const currentRequest = requestResult.data;
      
      // Validate current status allows reactivation
      if (!['Expired', 'Archived'].includes(currentRequest.status)) {
        throw new Error('Only expired or archived leads can be reactivated');
      }

      // Check reactivation limits
      const currentReactivationCount = currentRequest.reactivationCount || 0;
      if (currentReactivationCount >= this.lifecycleRules.maxReactivations) {
        throw new Error(`Maximum reactivations (${this.lifecycleRules.maxReactivations}) exceeded`);
      }

      // Determine new status (typically back to where it was before expiration)
      const newStatus = 'Pending walk-thru'; // Safe default status
      
      // Update request status
      const statusResult = await requestStatusService.changeStatus(
        request.requestId,
        newStatus,
        {
          userId: request.userId,
          triggeredBy: 'user',
          reason: `Reactivated: ${request.reasonForReactivation}`
        }
      );

      if (!statusResult.success) {
        throw new Error('Failed to update request status');
      }

      // Update request with reactivation details
      const updateData: any = {
        reactivationCount: currentReactivationCount + 1,
        officeNotes: `${currentRequest.officeNotes || ''}\n\nReactivated: ${request.reasonForReactivation}`.trim()
      };

      // Reset expiration timer if requested
      if (request.resetExpirationTimer) {
        updateData.createdAt = new Date().toISOString(); // Reset creation date for expiration calculation
      }

      // Handle assignment
      let assignedTo = currentRequest.assignedTo;
      if (request.newAssignee) {
        updateData.assignedTo = request.newAssignee;
        updateData.assignedDate = new Date().toISOString();
        assignedTo = request.newAssignee;
      } else if (!assignedTo || assignedTo === 'Unassigned') {
        // Auto-assign if not currently assigned
        // Could integrate with assignment service here
        assignedTo = 'Unassigned';
      }

      const updateResult = await requestsAPI.update(request.requestId, updateData);
      if (!updateResult.success) {
        logger.warn('Failed to update request with reactivation details', { requestId: request.requestId });
      }

      // Send reactivation notifications
      await this.sendReactivationNotifications(currentRequest, request.reasonForReactivation, assignedTo);

      logger.info('Lead reactivated successfully', {
        requestId: request.requestId,
        newStatus,
        assignedTo,
        reactivationCount: currentReactivationCount + 1
      });

      return {
        success: true,
        requestId: request.requestId,
        reactivatedDate: new Date().toISOString(),
        newStatus,
        assignedTo,
        reactivationCount: currentReactivationCount + 1
      };

    } catch (error) {
      logger.error('Error reactivating lead', { requestId: request.requestId, error });
      return {
        success: false,
        requestId: request.requestId,
        reactivatedDate: '',
        newStatus: '',
        assignedTo: '',
        reactivationCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send reactivation notifications
   */
  private async sendReactivationNotifications(request: any, reason: string, assignedTo: string): Promise<void> {
    try {
      const reactivationCount = (request.reactivationCount || 0) + 1;

      if (assignedTo && assignedTo !== 'Unassigned') {
        await leadNotificationService.sendReactivatedNotification(
          request.id,
          assignedTo,
          reason,
          reactivationCount
        );
      }

    } catch (error) {
      logger.error('Error sending reactivation notifications', { requestId: request.id, error });
    }
  }

  /**
   * Perform bulk archival of leads
   */
  async bulkArchiveLeads(request: BulkArchivalRequest): Promise<BulkArchivalResult> {
    try {
      logger.info('Starting bulk archival', { filters: request.filters, dryRun: request.dryRun });

      // Get requests matching filters
      const requestsResult = await requestsAPI.list();
      if (!requestsResult.success) {
        throw new Error('Failed to fetch requests');
      }

      let candidates = requestsResult.data.filter((req: any) => {
        // Apply filters
        if (request.filters.statuses && !request.filters.statuses.includes(req.status)) {
          return false;
        }

        if (request.filters.leadSources && !request.filters.leadSources.includes(req.leadSource)) {
          return false;
        }

        if (request.filters.assignees && req.assignedTo && !request.filters.assignees.includes(req.assignedTo)) {
          return false;
        }

        if (request.filters.olderThanDays) {
          const createdDate = new Date(req.createdAt);
          const cutoffDate = new Date(Date.now() - (request.filters.olderThanDays * 24 * 60 * 60 * 1000));
          if (createdDate > cutoffDate) {
            return false;
          }
        }

        return true;
      });

      // Exclude test data
      candidates = candidates.filter((req: any) => req.leadSource !== 'E2E_TEST');

      if (request.dryRun) {
        return {
          success: true,
          processedCount: candidates.length,
          successfulArchives: candidates.map((req: any) => req.id),
          failedArchives: [],
          estimatedOnly: true
        };
      }

      // Process actual archival
      const successfulArchives: string[] = [];
      const failedArchives: Array<{ requestId: string; error: string }> = [];

      for (const candidate of candidates) {
        const archivalResult = await this.archiveLead({
          requestId: candidate.id,
          reasonId: request.reasonId,
          notes: request.notes,
          userId: request.userId,
          preserveForAnalytics: true,
          notifyStakeholders: false // Skip individual notifications for bulk operations
        });

        if (archivalResult.success) {
          successfulArchives.push(candidate.id);
        } else {
          failedArchives.push({
            requestId: candidate.id,
            error: archivalResult.error || 'Unknown error'
          });
        }

        // Add small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info('Bulk archival completed', {
        total: candidates.length,
        successful: successfulArchives.length,
        failed: failedArchives.length
      });

      return {
        success: true,
        processedCount: candidates.length,
        successfulArchives,
        failedArchives,
        estimatedOnly: false
      };

    } catch (error) {
      logger.error('Error in bulk archival', error);
      return {
        success: false,
        processedCount: 0,
        successfulArchives: [],
        failedArchives: [],
        estimatedOnly: request.dryRun
      };
    }
  }

  /**
   * Get lifecycle rules
   */
  getLifecycleRules(): LeadLifecycleRules {
    return { ...this.lifecycleRules };
  }

  /**
   * Update lifecycle rules
   */
  updateLifecycleRules(newRules: Partial<LeadLifecycleRules>): void {
    this.lifecycleRules = { ...this.lifecycleRules, ...newRules };
    logger.info('Lifecycle rules updated', this.lifecycleRules);
  }

  /**
   * Get available archival reasons
   */
  getArchivalReasons(): ArchivalReason[] {
    return [...this.archivalReasons];
  }

  /**
   * Get lead lifecycle metrics
   */
  async getLeadLifecycleMetrics(): Promise<LeadLifecycleMetrics> {
    try {
      // Check cache
      if (this.metricsCache && Date.now() - this.metricsCacheTimestamp < this.METRICS_CACHE_TTL) {
        return this.metricsCache;
      }

      logger.info('Calculating lead lifecycle metrics');

      const requestsResult = await requestsAPI.list();
      if (!requestsResult.success) {
        throw new Error('Failed to fetch requests for metrics');
      }

      const allRequests = requestsResult.data.filter((req: any) => req.leadSource !== 'E2E_TEST');
      
      // Calculate basic metrics
      const totalLeads = allRequests.length;
      const activeLeads = allRequests.filter((req: any) => 
        ['New', 'Pending walk-thru', 'Move to Quoting'].includes(req.status)
      ).length;
      const expiredLeads = allRequests.filter((req: any) => req.status === 'Expired').length;
      const archivedLeads = allRequests.filter((req: any) => req.status === 'Archived').length;

      // Calculate conversion rate (archived as completed vs total)
      const completedLeads = archivedLeads; // Simplified - would need to check archival reasons
      const conversionRate = totalLeads > 0 ? completedLeads / totalLeads : 0;

      // Calculate average lifecycle days
      const averageLifecycleDays = this.calculateAverageLifecycleDays(allRequests);

      // Calculate expiration rate
      const expirationRate = totalLeads > 0 ? expiredLeads / totalLeads : 0;

      // Status distribution
      const statusDistribution: Record<string, number> = {};
      allRequests.forEach((req: any) => {
        statusDistribution[req.status] = (statusDistribution[req.status] || 0) + 1;
      });

      // Source performance
      const sourcePerformance: Record<string, any> = {};
      const sourceGroups = allRequests.reduce((groups: any, req: any) => {
        const source = req.leadSource || 'Unknown';
        if (!groups[source]) groups[source] = [];
        groups[source].push(req);
        return groups;
      }, {});

      Object.entries(sourceGroups).forEach(([source, requests]: [string, any]) => {
        const sourceCompleted = requests.filter((req: any) => req.status === 'Archived').length;
        const sourceExpired = requests.filter((req: any) => req.status === 'Expired').length;
        
        sourcePerformance[source] = {
          totalLeads: requests.length,
          conversionRate: requests.length > 0 ? sourceCompleted / requests.length : 0,
          averageLifecycleDays: this.calculateAverageLifecycleDays(requests),
          expirationRate: requests.length > 0 ? sourceExpired / requests.length : 0
        };
      });

      const metrics: LeadLifecycleMetrics = {
        totalLeads,
        activeLeads,
        expiredLeads,
        archivedLeads,
        conversionRate,
        averageLifecycleDays,
        expirationRate,
        reactivationSuccessRate: 0, // Would need to track reactivation outcomes
        statusDistribution,
        sourcePerformance
      };

      // Cache the metrics
      this.metricsCache = metrics;
      this.metricsCacheTimestamp = Date.now();

      logger.info('Lead lifecycle metrics calculated', {
        totalLeads,
        activeLeads,
        conversionRate: (conversionRate * 100).toFixed(1) + '%'
      });

      return metrics;

    } catch (error) {
      logger.error('Error calculating lead lifecycle metrics', error);
      
      // Return empty metrics on error
      return {
        totalLeads: 0,
        activeLeads: 0,
        expiredLeads: 0,
        archivedLeads: 0,
        conversionRate: 0,
        averageLifecycleDays: 0,
        expirationRate: 0,
        reactivationSuccessRate: 0,
        statusDistribution: {},
        sourcePerformance: {}
      };
    }
  }

  /**
   * Calculate average lifecycle days for a set of requests
   */
  private calculateAverageLifecycleDays(requests: any[]): number {
    if (requests.length === 0) return 0;

    const completedRequests = requests.filter(req => ['Archived', 'Expired'].includes(req.status));
    if (completedRequests.length === 0) return 0;

    const totalDays = completedRequests.reduce((sum, req) => {
      const createdDate = new Date(req.createdAt);
      const completedDate = req.archivedDate ? new Date(req.archivedDate) : new Date();
      const days = Math.floor((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return totalDays / completedRequests.length;
  }

  /**
   * Force metrics cache refresh
   */
  async refreshMetricsCache(): Promise<void> {
    this.metricsCache = null;
    this.metricsCacheTimestamp = 0;
    await this.getLeadLifecycleMetrics();
  }
}

// Export singleton instance
export const leadLifecycleService = new LeadLifecycleService();
export default leadLifecycleService;