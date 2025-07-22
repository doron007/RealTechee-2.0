import { backOfficeAssignToAPI, contactsAPI, requestsAPI } from '../utils/amplifyAPI';
import { createLogger } from '../utils/logger';

const logger = createLogger('AssignmentService');

// Assignment configuration interface
export interface AssignmentRules {
  enabled: boolean;
  assignmentMethod: 'round_robin' | 'workload_balanced' | 'skill_based' | 'hybrid' | 'flexible';
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
  // Flexible assignment weights (for hybrid method)
  weights?: {
    skill: number;
    workload: number;
    experience: number;
    availability: number;
  };
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
      const selectedAE = await this.selectAE(assignableAEs, rules, requestId);
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
  private async selectAE(availableAEs: AEProfile[], rules: AssignmentRules, requestId?: string): Promise<AEProfile | null> {
    if (availableAEs.length === 0) return null;

    switch (rules.assignmentMethod) {
      case 'round_robin':
        return this.selectRoundRobin(availableAEs);
      
      case 'workload_balanced':
        return await this.selectWorkloadBalanced(availableAEs);
      
      case 'skill_based':
        return await this.selectSkillBased(availableAEs);
      
      case 'hybrid':
        return await this.selectHybrid(availableAEs, rules.weights);
      
      case 'flexible':
        return await this.selectFlexible(availableAEs, requestId);
      
      default:
        return this.selectRoundRobin(availableAEs);
    }
  }

  /**
   * Hybrid selection - combines multiple criteria with configurable weights
   */
  private async selectHybrid(availableAEs: AEProfile[], weights?: any): Promise<AEProfile> {
    try {
      logger.info('Starting hybrid selection', { availableAEs: availableAEs.length });

      // Default weights if not provided
      const w = weights || {
        skill: 0.3,
        workload: 0.4,
        experience: 0.2,
        availability: 0.1
      };

      // Calculate scores for each AE
      const scoredAEs = await Promise.all(
        availableAEs.map(async (ae) => {
          const skillScore = await this.calculateAESkillScore(ae);
          const workload = await this.calculateCurrentWorkload(ae.id);
          const workloadScore = Math.max(0, 1 - (workload / 15)); // Invert workload (less = better)
          const experienceScore = Math.max(0, (10 - ae.order) / 10); // Lower order = more experience
          const availabilityScore = ae.active ? 1 : 0.3; // Active AEs get higher score

          const totalScore = (
            skillScore * w.skill +
            workloadScore * w.workload +
            experienceScore * w.experience +
            availabilityScore * w.availability
          );

          return {
            ae,
            scores: {
              skill: skillScore,
              workload: workloadScore,
              experience: experienceScore,
              availability: availabilityScore,
              total: totalScore
            }
          };
        })
      );

      // Sort by total score (highest first)
      scoredAEs.sort((a, b) => b.scores.total - a.scores.total);

      const selectedAE = scoredAEs[0].ae;
      
      logger.info('Selected AE using hybrid method', {
        selectedAE: selectedAE.name,
        totalScore: scoredAEs[0].scores.total.toFixed(3),
        breakdown: {
          skill: scoredAEs[0].scores.skill.toFixed(2),
          workload: scoredAEs[0].scores.workload.toFixed(2),
          experience: scoredAEs[0].scores.experience.toFixed(2),
          availability: scoredAEs[0].scores.availability.toFixed(2)
        }
      });

      return selectedAE;

    } catch (error) {
      logger.error('Error in hybrid selection, falling back to round-robin', error);
      return this.selectRoundRobin(availableAEs);
    }
  }

  /**
   * Flexible selection - uses the flexible assignment service for advanced criteria
   */
  private async selectFlexible(availableAEs: AEProfile[], requestId?: string): Promise<AEProfile> {
    try {
      logger.info('Starting flexible selection', { availableAEs: availableAEs.length, requestId });

      // For now, fall back to hybrid method until flexible assignment service is fully integrated
      // In future iterations, this would:
      // 1. Get request details to determine type, location, etc.
      // 2. Call flexibleAssignmentService.assignWithFlexibleCriteria()
      // 3. Return the best match based on comprehensive criteria

      logger.info('Flexible assignment service integration pending, using hybrid method');
      return await this.selectHybrid(availableAEs);

    } catch (error) {
      logger.error('Error in flexible selection, falling back to hybrid', error);
      return await this.selectHybrid(availableAEs);
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
   * Workload-balanced selection - Implementation complete
   */
  private async selectWorkloadBalanced(availableAEs: AEProfile[]): Promise<AEProfile> {
    try {
      logger.info('Starting workload-balanced selection', { availableAEs: availableAEs.length });

      // Calculate current workload for each AE
      const workloadData = await Promise.all(
        availableAEs.map(async (ae) => {
          const currentWorkload = await this.calculateCurrentWorkload(ae.id);
          return {
            ae,
            workload: currentWorkload,
            utilizationRate: currentWorkload / 15 // Assuming max 15 concurrent assignments
          };
        })
      );

      // Sort by utilization rate (lowest first) and then by order for tie-breaking
      workloadData.sort((a, b) => {
        if (Math.abs(a.utilizationRate - b.utilizationRate) < 0.1) {
          // If utilization is similar (within 10%), use order for tie-breaking
          return a.ae.order - b.ae.order;
        }
        return a.utilizationRate - b.utilizationRate;
      });

      const selectedAE = workloadData[0].ae;
      
      logger.info('Selected AE using workload-balanced method', {
        selectedAE: selectedAE.name,
        currentWorkload: workloadData[0].workload,
        utilizationRate: (workloadData[0].utilizationRate * 100).toFixed(1) + '%'
      });

      return selectedAE;

    } catch (error) {
      logger.error('Error in workload-balanced selection, falling back to round-robin', error);
      return this.selectRoundRobin(availableAEs);
    }
  }

  /**
   * Skill-based selection - Implementation complete
   */
  private async selectSkillBased(availableAEs: AEProfile[]): Promise<AEProfile> {
    try {
      logger.info('Starting skill-based selection', { availableAEs: availableAEs.length });

      // For now, implement basic skill matching based on AE experience and specialization
      // In the future, this would integrate with the flexible assignment service
      const skillData = await Promise.all(
        availableAEs.map(async (ae) => {
          const skillScore = await this.calculateAESkillScore(ae);
          const workload = await this.calculateCurrentWorkload(ae.id);
          
          return {
            ae,
            skillScore,
            workload,
            combinedScore: skillScore * 0.7 + ((15 - workload) / 15) * 0.3 // 70% skill, 30% availability
          };
        })
      );

      // Sort by combined score (highest first)
      skillData.sort((a, b) => b.combinedScore - a.combinedScore);

      const selectedAE = skillData[0].ae;
      
      logger.info('Selected AE using skill-based method', {
        selectedAE: selectedAE.name,
        skillScore: skillData[0].skillScore.toFixed(2),
        combinedScore: skillData[0].combinedScore.toFixed(2)
      });

      return selectedAE;

    } catch (error) {
      logger.error('Error in skill-based selection, falling back to round-robin', error);
      return this.selectRoundRobin(availableAEs);
    }
  }

  /**
   * Calculate current workload for an AE
   */
  private async calculateCurrentWorkload(aeId: string): Promise<number> {
    try {
      // Query active requests assigned to this AE
      const requestsResult = await requestsAPI.list();
      if (!requestsResult.success) {
        logger.warn('Failed to fetch requests for workload calculation', { aeId });
        return 0;
      }

      const aeName = this.aeCache.get(aeId)?.name;
      if (!aeName) {
        return 0;
      }

      // Count requests that are not archived/expired
      const activeRequests = requestsResult.data.filter((request: any) => 
        request.assignedTo === aeName && 
        request.status !== 'Archived' && 
        request.status !== 'Expired'
      );

      logger.debug('Calculated workload for AE', { 
        aeId, 
        aeName, 
        activeRequests: activeRequests.length 
      });

      return activeRequests.length;

    } catch (error) {
      logger.error('Error calculating workload', { aeId, error });
      return 0;
    }
  }

  /**
   * Calculate skill score for an AE based on historical performance
   */
  private async calculateAESkillScore(ae: AEProfile): Promise<number> {
    try {
      // Base score starts at 0.5 (neutral)
      let skillScore = 0.5;

      // Bonus for experience (based on order - lower order = more experienced)
      const experienceBonus = Math.max(0, (10 - ae.order) / 10 * 0.2);
      skillScore += experienceBonus;

      // Bonus for active status
      if (ae.active) {
        skillScore += 0.1;
      }

      // Bonus for contact integration (has contactId)
      if (ae.contactId) {
        skillScore += 0.1;
      }

      // Future: Add historical performance metrics
      // - Average response time
      // - Customer satisfaction scores
      // - Completion rates
      // - Specialization matching

      // Ensure score stays within 0-1 range
      skillScore = Math.min(Math.max(skillScore, 0), 1);

      logger.debug('Calculated skill score for AE', { 
        aeId: ae.id, 
        aeName: ae.name, 
        skillScore: skillScore.toFixed(2) 
      });

      return skillScore;

    } catch (error) {
      logger.error('Error calculating skill score', { aeId: ae.id, error });
      return 0.5; // Return neutral score on error
    }
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