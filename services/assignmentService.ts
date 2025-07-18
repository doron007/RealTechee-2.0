import { backOfficeAssignToAPI, contactsAPI, requestsAPI } from '../utils/amplifyAPI';
import { createLogger } from '../utils/logger';

const logger = createLogger('AssignmentService');

// Assignment configuration interface
export interface AssignmentRules {
  enabled: boolean;
  assignmentMethod: 'round_robin' | 'workload_balanced' | 'skill_based';
  businessHours: {
    enabled: boolean;
    timezone: string;
    startHour: number;
    endHour: number;
    workDays: number[]; // 0-6, Sunday=0
  };
  fallbackAssignee?: string;
  autoAssignOnCreate: boolean;
  notifyOnAssignment: boolean;
}

// AE profile interface
export interface AEProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  active: boolean;
  order: number;
  sendEmailNotifications: boolean;
  sendSmsNotifications: boolean;
  contactId?: string;
  currentWorkload?: number;
}

// Assignment result interface
export interface AssignmentResult {
  success: boolean;
  assignedTo?: string;
  assignedAE?: AEProfile;
  reason?: string;
  error?: any;
}

// Assignment metrics interface
export interface AssignmentMetrics {
  totalAssignments: number;
  avgResponseTime: number;
  workloadDistribution: Array<{
    aeId: string;
    aeName: string;
    assignmentCount: number;
    percentage: number;
  }>;
  successRate: number;
}

/**
 * Assignment Service - Handles default AE assignment logic
 */
export class AssignmentService {
  private aeCache: Map<string, AEProfile> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private lastAssignedIndex = 0; // For round-robin assignment

  // Default assignment rules
  private defaultRules: AssignmentRules = {
    enabled: true,
    assignmentMethod: 'round_robin',
    businessHours: {
      enabled: false,
      timezone: 'America/Los_Angeles',
      startHour: 9,
      endHour: 17,
      workDays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    autoAssignOnCreate: true,
    notifyOnAssignment: true
  };

  /**
   * Assign default AE to a request
   */
  async assignDefaultAE(requestId: string): Promise<AssignmentResult> {
    try {
      logger.info('Starting default AE assignment', { requestId });

      // Get assignment rules
      const rules = await this.getAssignmentRules();
      if (!rules.enabled || !rules.autoAssignOnCreate) {
        logger.info('Auto-assignment disabled', { requestId });
        return { success: true, reason: 'Auto-assignment disabled' };
      }

      // Get available AEs (exclude "Unassigned" from auto-assignment)
      const availableAEs = await this.getAvailableAEs();
      const assignableAEs = availableAEs.filter(ae => ae.name !== 'Unassigned');
      
      if (assignableAEs.length === 0) {
        logger.warn('No assignable AEs found', { requestId });
        return { success: false, error: 'No assignable AEs found' };
      }

      // Select AE based on assignment method
      const selectedAE = await this.selectAE(assignableAEs, rules);
      if (!selectedAE) {
        logger.warn('Failed to select AE', { requestId });
        return { success: false, error: 'Failed to select AE' };
      }

      // Update request with assignment
      const updateResult = await requestsAPI.update(requestId, {
        assignedTo: selectedAE.name,
        assignedDate: new Date().toISOString()
      });

      if (!updateResult.success) {
        logger.error('Failed to update request with assignment', { requestId, error: updateResult.error });
        return { success: false, error: 'Failed to update request' };
      }

      logger.info('Successfully assigned AE to request', {
        requestId,
        assignedTo: selectedAE.name,
        assignmentMethod: rules.assignmentMethod
      });

      return {
        success: true,
        assignedTo: selectedAE.name,
        assignedAE: selectedAE,
        reason: `Assigned using ${rules.assignmentMethod} method`
      };

    } catch (error) {
      logger.error('Error assigning default AE', { requestId, error });
      return { success: false, error };
    }
  }

  /**
   * Get all available AEs (active and ordered, including "Unassigned")
   */
  async getAvailableAEs(): Promise<AEProfile[]> {
    try {
      // Check cache validity
      if (this.isCacheExpired()) {
        await this.refreshAECache();
      }

      const aes = Array.from(this.aeCache.values())
        .filter(ae => ae.active || ae.name === 'Unassigned') // Include "Unassigned" even if inactive
        .sort((a, b) => a.order - b.order);

      logger.info('Retrieved available AEs', { count: aes.length });
      return aes;

    } catch (error) {
      logger.error('Error getting available AEs', error);
      return [];
    }
  }

  /**
   * Validate assignment (check if AE exists and is active, or is "Unassigned")
   */
  async validateAssignment(aeName: string, requestId: string): Promise<boolean> {
    try {
      // "Unassigned" is always valid
      if (aeName === 'Unassigned') {
        logger.info('Assignment validated - Unassigned', { aeName, requestId });
        return true;
      }

      const availableAEs = await this.getAvailableAEs();
      const ae = availableAEs.find(a => a.name === aeName);
      
      if (!ae) {
        logger.warn('AE not found or inactive', { aeName, requestId });
        return false;
      }

      // Check if AE is active (unless it's "Unassigned")
      if (!ae.active && ae.name !== 'Unassigned') {
        logger.warn('AE is not active', { aeName, requestId });
        return false;
      }

      logger.info('Assignment validated', { aeName, requestId });
      return true;

    } catch (error) {
      logger.error('Error validating assignment', { aeName, requestId, error });
      return false;
    }
  }

  /**
   * Get assignment rules (currently returns default, can be extended to read from database)
   */
  async getAssignmentRules(): Promise<AssignmentRules> {
    // For now, return default rules
    // In the future, this could read from a configuration table
    return this.defaultRules;
  }

  /**
   * Update assignment rules
   */
  async updateAssignmentRules(rules: AssignmentRules): Promise<{ success: boolean; error?: any }> {
    try {
      // For now, just update in-memory defaults
      // In the future, this could save to a configuration table
      this.defaultRules = { ...rules };
      
      logger.info('Assignment rules updated', { rules });
      return { success: true };

    } catch (error) {
      logger.error('Error updating assignment rules', error);
      return { success: false, error };
    }
  }

  /**
   * Get assignment metrics
   */
  async getAssignmentMetrics(): Promise<AssignmentMetrics> {
    try {
      // This would typically query assignment history from database
      // For now, return mock data structure
      const availableAEs = await this.getAvailableAEs();
      
      return {
        totalAssignments: 0,
        avgResponseTime: 0,
        workloadDistribution: availableAEs.map(ae => ({
          aeId: ae.id,
          aeName: ae.name,
          assignmentCount: 0,
          percentage: 0
        })),
        successRate: 100
      };

    } catch (error) {
      logger.error('Error getting assignment metrics', error);
      return {
        totalAssignments: 0,
        avgResponseTime: 0,
        workloadDistribution: [],
        successRate: 0
      };
    }
  }

  /**
   * Get workload distribution data
   */
  async getWorkloadDistribution(): Promise<Array<{ aeId: string; aeName: string; activeRequests: number; totalRequests: number }>> {
    try {
      // This would typically query active requests by assignee
      // For now, return empty array
      return [];

    } catch (error) {
      logger.error('Error getting workload distribution', error);
      return [];
    }
  }

  /**
   * Select AE based on assignment method
   */
  private async selectAE(availableAEs: AEProfile[], rules: AssignmentRules): Promise<AEProfile | null> {
    if (availableAEs.length === 0) return null;

    switch (rules.assignmentMethod) {
      case 'round_robin':
        return this.selectRoundRobin(availableAEs);
      
      case 'workload_balanced':
        return await this.selectWorkloadBalanced(availableAEs);
      
      case 'skill_based':
        return await this.selectSkillBased(availableAEs);
      
      default:
        return this.selectRoundRobin(availableAEs);
    }
  }

  /**
   * Round-robin selection
   */
  private selectRoundRobin(availableAEs: AEProfile[]): AEProfile {
    // Rotate to next AE
    this.lastAssignedIndex = (this.lastAssignedIndex + 1) % availableAEs.length;
    const selectedAE = availableAEs[this.lastAssignedIndex];
    
    logger.info('Selected AE using round-robin', {
      selectedAE: selectedAE.name,
      index: this.lastAssignedIndex,
      totalAEs: availableAEs.length
    });

    return selectedAE;
  }

  /**
   * Workload-balanced selection (future implementation)
   */
  private async selectWorkloadBalanced(availableAEs: AEProfile[]): Promise<AEProfile> {
    // For now, fall back to round-robin
    // Future: Query active requests per AE and select least loaded
    logger.info('Workload-balanced selection not yet implemented, using round-robin');
    return this.selectRoundRobin(availableAEs);
  }

  /**
   * Skill-based selection (future implementation)
   */
  private async selectSkillBased(availableAEs: AEProfile[]): Promise<AEProfile> {
    // For now, fall back to round-robin
    // Future: Consider request type, property type, location, etc.
    logger.info('Skill-based selection not yet implemented, using round-robin');
    return this.selectRoundRobin(availableAEs);
  }

  /**
   * Refresh AE cache from database
   */
  private async refreshAECache(): Promise<void> {
    try {
      logger.info('Refreshing AE cache');

      const result = await backOfficeAssignToAPI.list();
      if (!result.success) {
        logger.error('Failed to fetch AEs from database', result.error);
        return;
      }

      // Clear cache and rebuild
      this.aeCache.clear();
      
      result.data.forEach((ae: any) => {
        const aeProfile: AEProfile = {
          id: ae.id,
          name: ae.name || 'Unknown',
          email: ae.email || '',
          mobile: ae.mobile,
          active: ae.active ?? true,
          order: ae.order || 999,
          sendEmailNotifications: ae.sendEmailNotifications ?? true,
          sendSmsNotifications: ae.sendSmsNotifications ?? true,
          contactId: ae.contactId
        };
        
        this.aeCache.set(ae.id, aeProfile);
      });

      this.cacheTimestamp = Date.now();
      logger.info('AE cache refreshed', { count: this.aeCache.size });

    } catch (error) {
      logger.error('Error refreshing AE cache', error);
    }
  }

  /**
   * Check if cache is expired
   */
  private isCacheExpired(): boolean {
    return Date.now() - this.cacheTimestamp > this.CACHE_TTL;
  }

  /**
   * Force cache refresh
   */
  async refreshCache(): Promise<void> {
    await this.refreshAECache();
  }
}

// Export singleton instance
export const assignmentService = new AssignmentService();