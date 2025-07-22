import { backOfficeRequestStatusesAPI, requestsAPI } from '../utils/amplifyAPI';
import { createLogger } from '../utils/logger';

const logger = createLogger('RequestStatusService');

// Status transition engine interfaces
export interface RequestStatus {
  title: string;
  order: number;
  id: string;
}

export interface StatusTransitionRule {
  fromStatus: string;
  toStatus: string;
  trigger: 'automatic' | 'manual' | 'time_based';
  condition?: string;
  delayDays?: number;
  requiredFields?: string[];
  permissions?: string[];
}

export interface StatusChangeOptions {
  userId: string;
  reason?: string;
  triggeredBy: 'user' | 'system' | 'schedule';
  force?: boolean;
  notifyStakeholders?: boolean;
  additionalData?: any;
}

export interface StatusChangeResult {
  success: boolean;
  previousStatus?: string;
  newStatus: string;
  transitionId?: string;
  validationWarnings?: string[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingRequirements?: {
    fields: string[];
    permissions: string[];
  };
}

// Status State Machine Service
export class RequestStatusService {
  private static instance: RequestStatusService;
  private statusCache: Map<string, RequestStatus> = new Map();
  private transitionRules: StatusTransitionRule[] = [];

  private constructor() {
    this.initializeTransitionRules();
  }

  public static getInstance(): RequestStatusService {
    if (!RequestStatusService.instance) {
      RequestStatusService.instance = new RequestStatusService();
    }
    return RequestStatusService.instance;
  }

  /**
   * Initialize the status transition rules based on GROUND TRUTH requirements
   */
  private initializeTransitionRules(): void {
    this.transitionRules = [
      // New(1) → Pending walk-thru(2): Meeting scheduled or AE action
      {
        fromStatus: 'New',
        toStatus: 'Pending walk-thru',
        trigger: 'automatic',
        condition: 'meeting_scheduled',
      },
      
      // Pending walk-thru(2) → Move to Quoting(3): Ready for quote
      {
        fromStatus: 'Pending walk-thru', 
        toStatus: 'Move to Quoting',
        trigger: 'automatic',
        condition: 'quote_ready',
      },
      
      // Any active status → Expired(4): 14 days no activity
      {
        fromStatus: 'New',
        toStatus: 'Expired',
        trigger: 'time_based',
        delayDays: 14,
      },
      {
        fromStatus: 'Pending walk-thru',
        toStatus: 'Expired', 
        trigger: 'time_based',
        delayDays: 14,
      },
      
      // Manual transitions to Archived(5) from any status
      {
        fromStatus: 'New',
        toStatus: 'Archived',
        trigger: 'manual',
        requiredFields: ['reasonForArchive'],
      },
      {
        fromStatus: 'Pending walk-thru',
        toStatus: 'Archived', 
        trigger: 'manual',
        requiredFields: ['reasonForArchive'],
      },
      {
        fromStatus: 'Move to Quoting',
        toStatus: 'Archived',
        trigger: 'manual',
        requiredFields: ['reasonForArchive'],
      },
      
      // Reactivation: Expired/Archived → New
      {
        fromStatus: 'Expired',
        toStatus: 'New',
        trigger: 'manual',
        permissions: ['admin', 'ae'],
      },
      {
        fromStatus: 'Archived',
        toStatus: 'New', 
        trigger: 'manual',
        permissions: ['admin', 'ae'],
      },
    ];
  }

  /**
   * Get all available request statuses from BackOfficeRequestStatuses table
   */
  public async getAvailableStatuses(): Promise<RequestStatus[]> {
    try {
      logger.debug('Fetching available request statuses');
      
      const statuses = await backOfficeRequestStatusesAPI.list();
      const sortedStatuses = statuses.data
        .map((status: any) => ({
          id: status.id,
          title: status.title,
          order: parseInt(status.order as string),
        }))
        .sort((a: any, b: any) => a.order - b.order);

      // Update cache
      this.statusCache.clear();
      sortedStatuses.forEach((status: any) => {
        this.statusCache.set(status.title, status);
      });

      logger.debug(`Retrieved ${sortedStatuses.length} statuses`, { statuses: sortedStatuses });
      return sortedStatuses;
    } catch (error) {
      logger.error('Failed to fetch available statuses', { error });
      throw new Error('Unable to retrieve request statuses');
    }
  }

  /**
   * Get allowed status transitions for a request
   */
  public async getAllowedTransitions(
    requestId: string, 
    currentStatus: string,
    userId: string
  ): Promise<string[]> {
    try {
      logger.debug('Getting allowed transitions', { requestId, currentStatus, userId });

      // Get all statuses if cache is empty
      if (this.statusCache.size === 0) {
        await this.getAvailableStatuses();
      }

      // Find applicable transition rules
      const allowedTransitions = this.transitionRules
        .filter(rule => rule.fromStatus === currentStatus)
        .map(rule => rule.toStatus);

      // Add current status (no change option)
      allowedTransitions.push(currentStatus);

      // Remove duplicates and sort by order
      const uniqueTransitions = Array.from(new Set(allowedTransitions))
        .map(statusTitle => this.statusCache.get(statusTitle))
        .filter(status => status !== undefined)
        .sort((a, b) => a!.order - b!.order)
        .map(status => status!.title);

      logger.debug('Allowed transitions calculated', { 
        currentStatus, 
        allowedTransitions: uniqueTransitions 
      });

      return uniqueTransitions;
    } catch (error) {
      logger.error('Failed to get allowed transitions', { error, requestId });
      return [currentStatus]; // Fallback to current status only
    }
  }

  /**
   * Validate a status transition
   */
  public async validateStatusTransition(
    requestId: string,
    fromStatus: string,
    toStatus: string,
    options: StatusChangeOptions
  ): Promise<ValidationResult> {
    try {
      logger.debug('Validating status transition', { 
        requestId, 
        fromStatus, 
        toStatus, 
        triggeredBy: options.triggeredBy 
      });

      const errors: string[] = [];
      const warnings: string[] = [];

      // No change is always valid
      if (fromStatus === toStatus) {
        return { valid: true, errors, warnings };
      }

      // Find applicable transition rule
      const rule = this.transitionRules.find(r => 
        r.fromStatus === fromStatus && r.toStatus === toStatus
      );

      if (!rule) {
        errors.push(`Invalid transition from '${fromStatus}' to '${toStatus}'`);
        return { valid: false, errors, warnings };
      }

      // Check if manual override is allowed for force transitions
      if (options.force && !['admin'].includes(options.userId)) {
        errors.push('Insufficient permissions for forced status transition');
      }

      // Check required fields (if rule specifies them)
      if (rule.requiredFields && rule.requiredFields.length > 0) {
        // For now, just check if reason is provided for manual transitions
        if (rule.trigger === 'manual' && !options.reason) {
          errors.push('Reason is required for manual status changes');
        }
      }

      // Check permissions
      if (rule.permissions && rule.permissions.length > 0) {
        // This would integrate with user role system
        logger.debug('Permission check required', { permissions: rule.permissions });
      }

      const isValid = errors.length === 0;
      logger.debug('Validation result', { 
        valid: isValid, 
        errors, 
        warnings 
      });

      return { valid: isValid, errors, warnings };
    } catch (error) {
      logger.error('Validation error', { error, requestId });
      return { 
        valid: false, 
        errors: ['Validation failed due to system error'], 
        warnings: [] 
      };
    }
  }

  /**
   * Change request status with full validation and audit trail
   */
  public async changeStatus(
    requestId: string,
    newStatus: string,
    options: StatusChangeOptions
  ): Promise<StatusChangeResult> {
    try {
      logger.info('Initiating status change', { 
        requestId, 
        newStatus, 
        userId: options.userId,
        triggeredBy: options.triggeredBy 
      });

      // Get current request
      const request = await requestsAPI.get(requestId);
      if (!request.data) {
        return {
          success: false,
          newStatus,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Request not found',
          }
        };
      }

      const currentStatus = request.data.status || 'New';

      // Validate transition
      const validation = await this.validateStatusTransition(
        requestId,
        currentStatus,
        newStatus,
        options
      );

      if (!validation.valid && !options.force) {
        return {
          success: false,
          newStatus,
          error: {
            code: 'INVALID_TRANSITION',
            message: validation.errors.join(', '),
            details: validation
          }
        };
      }

      // Update request status with date tracking
      const updateData: any = {
        status: newStatus,
      };

      // Set status-specific date fields based on transition
      const now = new Date().toISOString();
      switch (newStatus) {
        case 'Pending walk-thru':
          updateData.requestedVisitDateTime = now;
          break;
        case 'Move to Quoting':
          updateData.moveToQuotingDate = now;
          break;
        case 'Expired':
          updateData.expiredDate = now;
          break;
        case 'Archived':
          updateData.archivedDate = now;
          if (options.reason) {
            updateData.reasonForArchive = options.reason;
          }
          break;
      }

      // Add audit trail to office notes
      const auditEntry = `[${now}] Status changed from '${currentStatus}' to '${newStatus}' by ${options.userId}${options.reason ? ` - Reason: ${options.reason}` : ''}`;
      const currentNotes = request.data.officeNotes || '';
      updateData.officeNotes = currentNotes ? `${currentNotes}\n${auditEntry}` : auditEntry;

      // Perform the update
      const updateResult = await requestsAPI.update(requestId, updateData);

      if (updateResult.data) {
        logger.info('Status change successful', { 
          requestId, 
          fromStatus: currentStatus, 
          toStatus: newStatus 
        });

        return {
          success: true,
          previousStatus: currentStatus,
          newStatus,
          validationWarnings: validation.warnings,
        };
      } else {
        throw new Error('Update operation failed');
      }
    } catch (error) {
      logger.error('Status change failed', { 
        error, 
        requestId, 
        newStatus 
      });

      return {
        success: false,
        newStatus,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update request status',
          details: error
        }
      };
    }
  }

  /**
   * Process automatic status transitions for requests (14-day expiration rule)
   */
  public async processAutomaticTransitions(requestId?: string): Promise<StatusChangeResult[]> {
    try {
      logger.info('Processing automatic status transitions', { requestId });

      const results: StatusChangeResult[] = [];
      
      // Get requests that might need automatic transitions
      const requests = requestId 
        ? [await requestsAPI.get(requestId)]
        : []; // TODO: Implement query for requests needing auto-transition

      for (const requestResponse of requests) {
        if (!requestResponse.data) continue;

        const request = requestResponse.data;
        const currentStatus = request.status || 'New';

        // Check for 14-day expiration rule
        if (['New', 'Pending walk-thru'].includes(currentStatus)) {
          const lastUpdated = new Date(request.updatedAt || request.createdAt);
          const daysSinceUpdate = Math.floor(
            (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceUpdate >= 14) {
            logger.info('Auto-expiring request due to 14-day rule', { 
              requestId: request.id, 
              daysSinceUpdate 
            });

            const result = await this.changeStatus(request.id, 'Expired', {
              userId: 'system',
              triggeredBy: 'schedule',
              reason: `Automatically expired after ${daysSinceUpdate} days of inactivity`,
            });

            results.push(result);
          }
        }
      }

      logger.info('Automatic transitions processed', { 
        processed: results.length,
        successful: results.filter(r => r.success).length 
      });

      return results;
    } catch (error) {
      logger.error('Failed to process automatic transitions', { error });
      return [];
    }
  }

  /**
   * Get status analytics and metrics
   */
  public async getStatusAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    assignedTo?: string;
  }): Promise<any> {
    try {
      logger.debug('Generating status analytics', { filters });

      // Get all statuses for reference
      const statuses = await this.getAvailableStatuses();
      
      // TODO: Implement comprehensive analytics
      // This would query requests and generate:
      // - Status distribution
      // - Average time in each status
      // - Conversion rates
      // - Trend analysis
      
      return {
        statusDistribution: statuses.map(status => ({
          status: status.title,
          count: 0, // TODO: Calculate actual counts
          percentage: 0
        })),
        averageTimeInStatus: statuses.map(status => ({
          status: status.title,
          averageDays: 0 // TODO: Calculate actual averages
        })),
        totalRequests: 0,
        conversionRate: 0
      };
    } catch (error) {
      logger.error('Failed to generate status analytics', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const requestStatusService = RequestStatusService.getInstance();
export default requestStatusService;