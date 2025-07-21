import { assignmentService, AssignmentResult, AEProfile } from './assignmentService';
import { backOfficeRoleTypesAPI, contactsAPI, requestsAPI } from '../utils/amplifyAPI';
import { createLogger } from '../utils/logger';

const logger = createLogger('FlexibleAssignmentService');

// Role-based assignment interfaces
export interface RoleDefinition {
  id: string;
  title: string;
  order: number;
  permissions: RolePermissions;
  assignmentRules: RoleAssignmentRules;
  skills: SkillRequirement[];
  territories: Territory[];
}

export interface RolePermissions {
  canReceiveRequests: boolean;
  canReceiveMeetings: boolean;
  canCreateQuotes: boolean;
  canManageProjects: boolean;
  maxConcurrentAssignments: number;
  priorityLevel: number; // 1-10, higher = more priority
}

export interface RoleAssignmentRules {
  enabled: boolean;
  assignmentMethod: 'round_robin' | 'workload_balanced' | 'skill_based' | 'hybrid';
  workloadWeight: number; // 0-1, importance of workload in assignment
  skillWeight: number; // 0-1, importance of skill match in assignment
  territoryWeight: number; // 0-1, importance of territory match
  availabilityRequired: boolean;
  businessHoursOnly: boolean;
  fallbackToOtherRoles: boolean;
}

export interface SkillRequirement {
  id: string;
  name: string;
  category: string; // 'product', 'expertise', 'certification', 'territory'
  level: number; // 1-5, skill proficiency level
  required: boolean;
  weight: number; // Assignment scoring weight
}

export interface Territory {
  id: string;
  name: string;
  type: 'geographic' | 'product' | 'client_type';
  boundaries: any; // Geographic boundaries, product categories, etc.
  priority: number;
}

export interface AssigneeProfile {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role: RoleDefinition;
  skills: SkillProficiency[];
  territories: Territory[];
  availability: AvailabilitySchedule;
  workload: WorkloadMetrics;
  active: boolean;
  preferences: AssignmentPreferences;
}

export interface SkillProficiency {
  skillId: string;
  skillName: string;
  category: string;
  level: number; // 1-5, actual proficiency
  certifications?: string[];
  experience?: number; // years
}

export interface AvailabilitySchedule {
  businessHours: {
    timezone: string;
    schedule: DaySchedule[];
  };
  exceptions: AvailabilityException[];
  vacations: DateRange[];
  currentStatus: 'available' | 'busy' | 'offline';
}

export interface DaySchedule {
  dayOfWeek: number; // 0-6, Sunday=0
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  breaks?: TimeRange[];
}

export interface AvailabilityException {
  date: string;
  type: 'unavailable' | 'limited' | 'extended';
  timeRanges?: TimeRange[];
  reason?: string;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface WorkloadMetrics {
  currentAssignments: number;
  maxCapacity: number;
  utilizationRate: number; // 0-1
  averageResponseTime: number; // minutes
  completionRate: number; // 0-1
  priorityScore: number; // Calculated priority for new assignments
}

export interface AssignmentPreferences {
  preferredRequestTypes: string[];
  preferredClientTypes: string[];
  avoidRequestTypes?: string[];
  maxDailyAssignments?: number;
  notificationChannels: string[];
}

export interface FlexibleAssignmentRequest {
  requestId: string;
  requestType: string;
  product?: string;
  priority: number; // 1-10
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    coordinates?: [number, number]; // [lat, lng]
  };
  requiredSkills?: SkillRequirement[];
  estimatedWorkload: number; // Hours or complexity score
  timeframe?: 'immediate' | 'urgent' | 'normal' | 'flexible';
  clientType?: string;
  budget?: number;
}

export interface FlexibleAssignmentResult extends AssignmentResult {
  assigneeProfile?: AssigneeProfile;
  matchScore?: number;
  matchingFactors?: {
    skillMatch: number;
    workloadBalance: number;
    territoryMatch: number;
    availabilityMatch: number;
    roleMatch: number;
  };
  alternativeAssignees?: Array<{
    profile: AssigneeProfile;
    score: number;
    reasons: string[];
  }>;
}

/**
 * Flexible Assignment Service - Advanced role-based assignment with multiple criteria
 */
export class FlexibleAssignmentService {
  private roleCache: Map<string, RoleDefinition> = new Map();
  private assigneeCache: Map<string, AssigneeProfile> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  /**
   * Assign using flexible role-based criteria
   */
  async assignWithFlexibleCriteria(
    assignmentRequest: FlexibleAssignmentRequest
  ): Promise<FlexibleAssignmentResult> {
    try {
      logger.info('Starting flexible assignment', { 
        requestId: assignmentRequest.requestId,
        requestType: assignmentRequest.requestType 
      });

      // Refresh caches if needed
      if (this.isCacheExpired()) {
        await this.refreshCaches();
      }

      // Get eligible assignees based on role requirements
      const eligibleAssignees = await this.getEligibleAssignees(assignmentRequest);
      if (eligibleAssignees.length === 0) {
        logger.warn('No eligible assignees found', { requestId: assignmentRequest.requestId });
        
        // Fallback to standard assignment service
        const fallbackResult = await assignmentService.assignDefaultAE(assignmentRequest.requestId);
        return {
          ...fallbackResult,
          reason: 'No eligible assignees found, used fallback assignment'
        };
      }

      // Score and rank assignees
      const scoredAssignees = await this.scoreAssignees(eligibleAssignees, assignmentRequest);
      scoredAssignees.sort((a, b) => b.score - a.score);

      const bestMatch = scoredAssignees[0];
      logger.info('Best assignee match found', {
        requestId: assignmentRequest.requestId,
        assigneeName: bestMatch.profile.name,
        score: bestMatch.score
      });

      // Update request with assignment
      const updateResult = await requestsAPI.update(assignmentRequest.requestId, {
        assignedTo: bestMatch.profile.name,
        assignedDate: new Date().toISOString()
      });

      if (!updateResult.success) {
        logger.error('Failed to update request with flexible assignment', {
          requestId: assignmentRequest.requestId,
          error: updateResult.error
        });
        return { success: false, error: 'Failed to update request' };
      }

      // Update assignee workload
      await this.updateAssigneeWorkload(bestMatch.profile.id, 1);

      return {
        success: true,
        assignedTo: bestMatch.profile.name,
        assigneeProfile: bestMatch.profile,
        matchScore: bestMatch.score,
        matchingFactors: bestMatch.factors,
        alternativeAssignees: scoredAssignees.slice(1, 4), // Top 3 alternatives
        reason: `Assigned using flexible criteria with ${(bestMatch.score * 100).toFixed(1)}% match`
      };

    } catch (error) {
      logger.error('Error in flexible assignment', { 
        requestId: assignmentRequest.requestId, 
        error 
      });
      return { success: false, error };
    }
  }

  /**
   * Get assignees eligible for a specific request
   */
  private async getEligibleAssignees(
    assignmentRequest: FlexibleAssignmentRequest
  ): Promise<AssigneeProfile[]> {
    const allAssignees = Array.from(this.assigneeCache.values());
    
    return allAssignees.filter(assignee => {
      // Must be active
      if (!assignee.active) return false;

      // Must have role that can receive requests
      if (!assignee.role.permissions.canReceiveRequests) return false;

      // Check availability if required
      if (assignee.role.assignmentRules.availabilityRequired) {
        if (!this.isAssigneeAvailable(assignee, assignmentRequest.timeframe)) {
          return false;
        }
      }

      // Check capacity
      if (assignee.workload.currentAssignments >= assignee.role.permissions.maxConcurrentAssignments) {
        return false;
      }

      // Check business hours requirement
      if (assignee.role.assignmentRules.businessHoursOnly) {
        if (!this.isWithinBusinessHours(assignee.availability.businessHours)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Score assignees based on multiple criteria
   */
  private async scoreAssignees(
    assignees: AssigneeProfile[],
    assignmentRequest: FlexibleAssignmentRequest
  ): Promise<Array<{
    profile: AssigneeProfile;
    score: number;
    factors: any;
    reasons: string[];
  }>> {
    const scoredAssignees = [];

    for (const assignee of assignees) {
      const skillMatch = this.calculateSkillMatch(assignee, assignmentRequest);
      const workloadBalance = this.calculateWorkloadBalance(assignee);
      const territoryMatch = this.calculateTerritoryMatch(assignee, assignmentRequest);
      const availabilityMatch = this.calculateAvailabilityMatch(assignee, assignmentRequest);
      const roleMatch = this.calculateRoleMatch(assignee, assignmentRequest);

      const rules = assignee.role.assignmentRules;
      const overallScore = (
        (skillMatch * rules.skillWeight) +
        (workloadBalance * rules.workloadWeight) +
        (territoryMatch * rules.territoryWeight) +
        (availabilityMatch * 0.1) + // Fixed low weight for availability
        (roleMatch * 0.2) // Fixed moderate weight for role match
      ) / (rules.skillWeight + rules.workloadWeight + rules.territoryWeight + 0.1 + 0.2);

      const reasons = [];
      if (skillMatch > 0.8) reasons.push('Excellent skill match');
      if (workloadBalance > 0.7) reasons.push('Good workload balance');
      if (territoryMatch > 0.8) reasons.push('Territory specialist');
      if (availabilityMatch === 1) reasons.push('Immediately available');

      scoredAssignees.push({
        profile: assignee,
        score: overallScore,
        factors: {
          skillMatch,
          workloadBalance,
          territoryMatch,
          availabilityMatch,
          roleMatch
        },
        reasons
      });
    }

    return scoredAssignees;
  }

  /**
   * Calculate skill match score (0-1)
   */
  private calculateSkillMatch(
    assignee: AssigneeProfile,
    assignmentRequest: FlexibleAssignmentRequest
  ): number {
    if (!assignmentRequest.requiredSkills || assignmentRequest.requiredSkills.length === 0) {
      return 0.5; // Neutral score if no specific skills required
    }

    let totalScore = 0;
    let totalWeight = 0;

    for (const requiredSkill of assignmentRequest.requiredSkills) {
      const assigneeSkill = assignee.skills.find(s => s.skillId === requiredSkill.id);
      
      if (!assigneeSkill) {
        if (requiredSkill.required) {
          return 0; // Missing required skill = 0 score
        }
        continue;
      }

      // Compare skill levels
      const levelMatch = Math.min(assigneeSkill.level / requiredSkill.level, 1);
      totalScore += levelMatch * requiredSkill.weight;
      totalWeight += requiredSkill.weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }

  /**
   * Calculate workload balance score (0-1)
   */
  private calculateWorkloadBalance(assignee: AssigneeProfile): number {
    const utilization = assignee.workload.utilizationRate;
    // Lower utilization = higher score (better for assignment)
    return Math.max(0, 1 - utilization);
  }

  /**
   * Calculate territory match score (0-1)
   */
  private calculateTerritoryMatch(
    assignee: AssigneeProfile,
    assignmentRequest: FlexibleAssignmentRequest
  ): number {
    if (!assignmentRequest.location) {
      return 0.5; // Neutral if no location specified
    }

    // Check if assignee has territories that match the request location
    for (const territory of assignee.territories) {
      if (territory.type === 'geographic') {
        // Simplified check - in real implementation, would use geospatial queries
        if (this.isLocationInTerritory(assignmentRequest.location, territory)) {
          return 1.0;
        }
      }
    }

    return 0.2; // Low but non-zero score for no territory match
  }

  /**
   * Calculate availability match score (0-1)
   */
  private calculateAvailabilityMatch(
    assignee: AssigneeProfile,
    assignmentRequest: FlexibleAssignmentRequest
  ): number {
    if (assignee.availability.currentStatus === 'offline') return 0;
    if (assignee.availability.currentStatus === 'busy') return 0.3;
    
    // Check timeframe requirements
    switch (assignmentRequest.timeframe) {
      case 'immediate':
        return assignee.availability.currentStatus === 'available' ? 1 : 0;
      case 'urgent':
        return assignee.availability.currentStatus === 'available' ? 1 : 0.5;
      default:
        return 0.8; // Good match for normal/flexible timeframes
    }
  }

  /**
   * Calculate role match score (0-1)
   */
  private calculateRoleMatch(
    assignee: AssigneeProfile,
    assignmentRequest: FlexibleAssignmentRequest
  ): number {
    const role = assignee.role;
    
    // Check if role preferences align with request
    if (assignee.preferences.preferredRequestTypes.includes(assignmentRequest.requestType)) {
      return 1.0;
    }

    if (assignee.preferences.avoidRequestTypes?.includes(assignmentRequest.requestType)) {
      return 0.1;
    }

    // Check role priority level
    return Math.min(role.permissions.priorityLevel / 10, 1);
  }

  /**
   * Check if assignee is currently available
   */
  private isAssigneeAvailable(assignee: AssigneeProfile, timeframe?: string): boolean {
    if (assignee.availability.currentStatus === 'offline') return false;
    
    if (timeframe === 'immediate' && assignee.availability.currentStatus !== 'available') {
      return false;
    }

    // Check for vacation periods
    const now = new Date();
    for (const vacation of assignee.availability.vacations) {
      const start = new Date(vacation.startDate);
      const end = new Date(vacation.endDate);
      if (now >= start && now <= end) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if current time is within business hours
   */
  private isWithinBusinessHours(businessHours: any): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

    const todaySchedule = businessHours.schedule.find((s: any) => s.dayOfWeek === dayOfWeek);
    if (!todaySchedule) return false;

    const startTime = parseInt(todaySchedule.startTime.replace(':', ''));
    const endTime = parseInt(todaySchedule.endTime.replace(':', ''));

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Check if location is within territory (simplified)
   */
  private isLocationInTerritory(location: any, territory: Territory): boolean {
    // Simplified implementation - would use actual geospatial calculations
    if (location.city && territory.boundaries?.cities) {
      return territory.boundaries.cities.includes(location.city);
    }
    if (location.state && territory.boundaries?.states) {
      return territory.boundaries.states.includes(location.state);
    }
    return false;
  }

  /**
   * Update assignee workload
   */
  private async updateAssigneeWorkload(assigneeId: string, change: number): Promise<void> {
    const assignee = this.assigneeCache.get(assigneeId);
    if (assignee) {
      assignee.workload.currentAssignments += change;
      assignee.workload.utilizationRate = 
        assignee.workload.currentAssignments / assignee.role.permissions.maxConcurrentAssignments;
    }
  }

  /**
   * Refresh role and assignee caches
   */
  private async refreshCaches(): Promise<void> {
    try {
      logger.info('Refreshing flexible assignment caches');

      // Load roles
      const rolesResult = await backOfficeRoleTypesAPI.list();
      if (rolesResult.success) {
        this.roleCache.clear();
        rolesResult.data.forEach((role: any) => {
          // Create enhanced role definition with defaults
          const roleDefinition: RoleDefinition = {
            id: role.id,
            title: role.title,
            order: role.order || 999,
            permissions: this.getDefaultPermissionsForRole(role.title),
            assignmentRules: this.getDefaultAssignmentRulesForRole(role.title),
            skills: [],
            territories: []
          };
          this.roleCache.set(role.id, roleDefinition);
        });
      }

      // Load assignees (enhanced AE profiles)
      const aes = await assignmentService.getAvailableAEs();
      this.assigneeCache.clear();

      for (const ae of aes) {
        // Get role for this AE (default to Account Executive role)
        const role = Array.from(this.roleCache.values())
          .find(r => r.title.includes('Account Executive')) || 
          Array.from(this.roleCache.values())[0];

        if (role) {
          const assigneeProfile: AssigneeProfile = {
            id: ae.id,
            name: ae.name,
            email: ae.email,
            roleId: role.id,
            role: role,
            skills: this.getDefaultSkillsForAE(ae),
            territories: [],
            availability: this.getDefaultAvailability(),
            workload: await this.calculateCurrentWorkload(ae.id),
            active: ae.active,
            preferences: this.getDefaultPreferences()
          };
          this.assigneeCache.set(ae.id, assigneeProfile);
        }
      }

      this.cacheTimestamp = Date.now();
      logger.info('Flexible assignment caches refreshed', {
        roles: this.roleCache.size,
        assignees: this.assigneeCache.size
      });

    } catch (error) {
      logger.error('Error refreshing flexible assignment caches', error);
    }
  }

  /**
   * Get default permissions for a role
   */
  private getDefaultPermissionsForRole(roleTitle: string): RolePermissions {
    const lowerTitle = roleTitle.toLowerCase();
    
    if (lowerTitle.includes('account') || lowerTitle.includes('executive')) {
      return {
        canReceiveRequests: true,
        canReceiveMeetings: true,
        canCreateQuotes: true,
        canManageProjects: false,
        maxConcurrentAssignments: 15,
        priorityLevel: 8
      };
    }
    
    if (lowerTitle.includes('project') || lowerTitle.includes('manager')) {
      return {
        canReceiveRequests: false,
        canReceiveMeetings: true,
        canCreateQuotes: false,
        canManageProjects: true,
        maxConcurrentAssignments: 10,
        priorityLevel: 7
      };
    }

    return {
      canReceiveRequests: true,
      canReceiveMeetings: true,
      canCreateQuotes: false,
      canManageProjects: false,
      maxConcurrentAssignments: 10,
      priorityLevel: 5
    };
  }

  /**
   * Get default assignment rules for a role
   */
  private getDefaultAssignmentRulesForRole(roleTitle: string): RoleAssignmentRules {
    return {
      enabled: true,
      assignmentMethod: 'hybrid',
      workloadWeight: 0.4,
      skillWeight: 0.4,
      territoryWeight: 0.2,
      availabilityRequired: true,
      businessHoursOnly: false,
      fallbackToOtherRoles: true
    };
  }

  /**
   * Get default skills for an AE
   */
  private getDefaultSkillsForAE(ae: AEProfile): SkillProficiency[] {
    return [
      {
        skillId: 'general_sales',
        skillName: 'General Sales',
        category: 'expertise',
        level: 4,
        experience: 3
      },
      {
        skillId: 'customer_service',
        skillName: 'Customer Service',
        category: 'expertise',
        level: 4,
        experience: 3
      }
    ];
  }

  /**
   * Get default availability schedule
   */
  private getDefaultAvailability(): AvailabilitySchedule {
    return {
      businessHours: {
        timezone: 'America/Los_Angeles',
        schedule: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' }
        ]
      },
      exceptions: [],
      vacations: [],
      currentStatus: 'available'
    };
  }

  /**
   * Calculate current workload for an assignee
   */
  private async calculateCurrentWorkload(assigneeId: string): Promise<WorkloadMetrics> {
    // In a real implementation, this would query current assignments
    return {
      currentAssignments: 0,
      maxCapacity: 15,
      utilizationRate: 0,
      averageResponseTime: 30,
      completionRate: 0.95,
      priorityScore: 1.0
    };
  }

  /**
   * Get default assignment preferences
   */
  private getDefaultPreferences(): AssignmentPreferences {
    return {
      preferredRequestTypes: ['general'],
      preferredClientTypes: ['homeowner'],
      notificationChannels: ['email', 'sms']
    };
  }

  /**
   * Check if cache is expired
   */
  private isCacheExpired(): boolean {
    return Date.now() - this.cacheTimestamp > this.CACHE_TTL;
  }

  /**
   * Get role configuration interface data
   */
  async getRoleConfiguration(): Promise<{
    roles: RoleDefinition[];
    assignees: AssigneeProfile[];
    skills: SkillRequirement[];
    territories: Territory[];
  }> {
    if (this.isCacheExpired()) {
      await this.refreshCaches();
    }

    // Get available skills and territories (would come from database in real implementation)
    const availableSkills: SkillRequirement[] = [
      { id: 'kitchen_renovation', name: 'Kitchen Renovation', category: 'product', level: 1, required: false, weight: 1.0 },
      { id: 'bathroom_renovation', name: 'Bathroom Renovation', category: 'product', level: 1, required: false, weight: 1.0 },
      { id: 'full_home_renovation', name: 'Full Home Renovation', category: 'product', level: 1, required: false, weight: 1.0 },
      { id: 'luxury_homes', name: 'Luxury Homes', category: 'expertise', level: 1, required: false, weight: 1.2 },
      { id: 'commercial_properties', name: 'Commercial Properties', category: 'expertise', level: 1, required: false, weight: 1.1 }
    ];

    const availableTerritories: Territory[] = [
      { id: 'bay_area', name: 'San Francisco Bay Area', type: 'geographic', boundaries: { cities: ['San Francisco', 'Oakland', 'San Jose'] }, priority: 1 },
      { id: 'los_angeles', name: 'Los Angeles Area', type: 'geographic', boundaries: { cities: ['Los Angeles', 'Beverly Hills', 'Santa Monica'] }, priority: 1 },
      { id: 'luxury_segment', name: 'Luxury Properties', type: 'client_type', boundaries: { budgetMin: 100000 }, priority: 2 }
    ];

    return {
      roles: Array.from(this.roleCache.values()),
      assignees: Array.from(this.assigneeCache.values()),
      skills: availableSkills,
      territories: availableTerritories
    };
  }

  /**
   * Force cache refresh
   */
  async refreshCacheData(): Promise<void> {
    await this.refreshCaches();
  }
}

// Export singleton instance
export const flexibleAssignmentService = new FlexibleAssignmentService();
export default flexibleAssignmentService;