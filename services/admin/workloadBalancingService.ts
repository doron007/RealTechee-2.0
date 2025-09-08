import { requestsAPI, contactsAPI } from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';

const logger = createLogger('WorkloadBalancingService');

// Workload and territory interfaces
export interface WorkloadMetrics {
  assigneeId: string;
  assigneeName: string;
  currentAssignments: number;
  maxCapacity: number;
  utilizationRate: number; // 0-1
  averageResponseTime: number; // minutes
  completionRate: number; // 0-1
  overloadRisk: 'low' | 'medium' | 'high' | 'critical';
  trendDirection: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

export interface Territory {
  id: string;
  name: string;
  type: 'geographic' | 'product' | 'client_type' | 'budget_range';
  boundaries: TerritoryBoundaries;
  assignees: TerritoryAssignee[];
  priority: number;
  active: boolean;
  performance: TerritoryPerformance;
}

export interface TerritoryBoundaries {
  // Geographic boundaries
  coordinates?: [number, number][]; // Polygon coordinates
  cities?: string[];
  states?: string[];
  zipCodes?: string[];
  radius?: { center: [number, number]; miles: number };
  
  // Product boundaries
  productTypes?: string[];
  
  // Client boundaries
  clientTypes?: string[];
  budgetMin?: number;
  budgetMax?: number;
}

export interface TerritoryAssignee {
  assigneeId: string;
  assigneeName: string;
  role: 'primary' | 'secondary' | 'backup';
  expertise: number; // 1-5
  capacity: number; // Max assignments for this territory
  currentLoad: number;
  responseTime: number; // Average minutes
}

export interface TerritoryPerformance {
  totalRequests: number;
  averageResponseTime: number;
  completionRate: number;
  customerSatisfaction: number; // 1-5
  revenue: number;
  lastMonth: {
    requests: number;
    completionRate: number;
    satisfaction: number;
  };
}

export interface WorkloadBalancingRules {
  enabled: boolean;
  maxUtilizationThreshold: number; // 0-1
  redistributionTrigger: number; // 0-1, when to auto-redistribute
  balancingMethod: 'even_distribution' | 'capacity_based' | 'performance_weighted';
  prioritizeExperience: boolean;
  allowCrossTerritory: boolean;
  notifyOnOverload: boolean;
  emergencyReassignment: boolean;
}

export interface WorkloadRebalanceRequest {
  reason: 'overload' | 'underutilization' | 'manual' | 'vacation' | 'emergency';
  targetAssignees?: string[];
  excludeAssignees?: string[];
  preserveTerritories: boolean;
  forceRebalance: boolean;
}

export interface WorkloadRebalanceResult {
  success: boolean;
  reassignments: Array<{
    requestId: string;
    fromAssignee: string;
    toAssignee: string;
    reason: string;
    score: number;
  }>;
  newDistribution: WorkloadMetrics[];
  performance: {
    balanceImprovement: number;
    utilizationImprovement: number;
    estimated: {
      responseTimeChange: number;
      completionRateChange: number;
    };
  };
  warnings: string[];
  error?: string;
}

export interface TerritoryAssignmentRequest {
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    coordinates?: [number, number];
  };
  product?: string;
  clientType?: string;
  budget?: number;
  priority: number;
  complexity: 'low' | 'medium' | 'high' | 'expert';
}

export interface TerritoryMatchResult {
  territoryId: string;
  territoryName: string;
  matchScore: number; // 0-1
  matchType: 'exact' | 'overlap' | 'adjacent' | 'fallback';
  assignees: Array<{
    assigneeId: string;
    assigneeName: string;
    role: 'primary' | 'secondary' | 'backup';
    availability: number; // 0-1
    expertise: number; // 1-5
    currentLoad: number;
    recommendationScore: number;
  }>;
  reasons: string[];
}

/**
 * Workload Balancing Service - Manages workload distribution and territory assignments
 */
export class WorkloadBalancingService {
  private workloadCache: Map<string, WorkloadMetrics> = new Map();
  private territoriesCache: Map<string, Territory> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  // Default balancing rules
  private defaultRules: WorkloadBalancingRules = {
    enabled: true,
    maxUtilizationThreshold: 0.85,
    redistributionTrigger: 0.75,
    balancingMethod: 'capacity_based',
    prioritizeExperience: true,
    allowCrossTerritory: false,
    notifyOnOverload: true,
    emergencyReassignment: true
  };

  constructor() {
    this.initializeDefaultTerritories();
  }

  /**
   * Initialize default territories
   */
  private async initializeDefaultTerritories(): Promise<void> {
    const defaultTerritories: Territory[] = [
      {
        id: 'bay_area',
        name: 'San Francisco Bay Area',
        type: 'geographic',
        boundaries: {
          cities: ['San Francisco', 'Oakland', 'San Jose', 'Berkeley', 'Fremont', 'Hayward'],
          states: ['CA']
        },
        assignees: [],
        priority: 1,
        active: true,
        performance: {
          totalRequests: 0,
          averageResponseTime: 30,
          completionRate: 0.95,
          customerSatisfaction: 4.2,
          revenue: 0,
          lastMonth: { requests: 0, completionRate: 0.95, satisfaction: 4.2 }
        }
      },
      {
        id: 'los_angeles',
        name: 'Los Angeles Metropolitan Area',
        type: 'geographic',
        boundaries: {
          cities: ['Los Angeles', 'Beverly Hills', 'Santa Monica', 'Pasadena', 'Long Beach'],
          states: ['CA']
        },
        assignees: [],
        priority: 1,
        active: true,
        performance: {
          totalRequests: 0,
          averageResponseTime: 35,
          completionRate: 0.92,
          customerSatisfaction: 4.1,
          revenue: 0,
          lastMonth: { requests: 0, completionRate: 0.92, satisfaction: 4.1 }
        }
      },
      {
        id: 'luxury_segment',
        name: 'Luxury Properties ($100K+)',
        type: 'budget_range',
        boundaries: {
          budgetMin: 100000,
          clientTypes: ['luxury', 'high_net_worth']
        },
        assignees: [],
        priority: 2,
        active: true,
        performance: {
          totalRequests: 0,
          averageResponseTime: 25,
          completionRate: 0.98,
          customerSatisfaction: 4.5,
          revenue: 0,
          lastMonth: { requests: 0, completionRate: 0.98, satisfaction: 4.5 }
        }
      },
      {
        id: 'commercial_segment',
        name: 'Commercial Properties',
        type: 'client_type',
        boundaries: {
          clientTypes: ['business', 'commercial', 'investment'],
          productTypes: ['Commercial']
        },
        assignees: [],
        priority: 2,
        active: true,
        performance: {
          totalRequests: 0,
          averageResponseTime: 40,
          completionRate: 0.90,
          customerSatisfaction: 4.0,
          revenue: 0,
          lastMonth: { requests: 0, completionRate: 0.90, satisfaction: 4.0 }
        }
      }
    ];

    defaultTerritories.forEach(territory => {
      this.territoriesCache.set(territory.id, territory);
    });

    logger.info('Default territories initialized', { count: defaultTerritories.length });
  }

  /**
   * Get current workload metrics for all assignees
   */
  async getWorkloadMetrics(assigneeIds?: string[]): Promise<WorkloadMetrics[]> {
    try {
      if (this.isCacheExpired()) {
        await this.refreshWorkloadCache();
      }

      const metrics = Array.from(this.workloadCache.values());
      
      if (assigneeIds) {
        return metrics.filter(m => assigneeIds.includes(m.assigneeId));
      }

      return metrics.sort((a, b) => b.utilizationRate - a.utilizationRate);

    } catch (error) {
      logger.error('Error getting workload metrics', error);
      return [];
    }
  }

  /**
   * Get workload metrics for a specific assignee
   */
  async getAssigneeWorkload(assigneeId: string): Promise<WorkloadMetrics | null> {
    try {
      if (this.isCacheExpired()) {
        await this.refreshWorkloadCache();
      }

      return this.workloadCache.get(assigneeId) || null;

    } catch (error) {
      logger.error('Error getting assignee workload', { assigneeId, error });
      return null;
    }
  }

  /**
   * Identify overloaded assignees
   */
  async getOverloadedAssignees(threshold?: number): Promise<WorkloadMetrics[]> {
    const metrics = await this.getWorkloadMetrics();
    const maxUtilization = threshold || this.defaultRules.maxUtilizationThreshold;

    return metrics.filter(m => m.utilizationRate > maxUtilization);
  }

  /**
   * Identify underutilized assignees
   */
  async getUnderutilizedAssignees(threshold: number = 0.4): Promise<WorkloadMetrics[]> {
    const metrics = await this.getWorkloadMetrics();
    
    return metrics.filter(m => m.utilizationRate < threshold && m.maxCapacity > 0);
  }

  /**
   * Rebalance workload across assignees
   */
  async rebalanceWorkload(request: WorkloadRebalanceRequest): Promise<WorkloadRebalanceResult> {
    try {
      logger.info('Starting workload rebalancing', { reason: request.reason });

      // Get current workload state
      const currentMetrics = await this.getWorkloadMetrics();
      const overloadedAssignees = await this.getOverloadedAssignees();
      const underutilizedAssignees = await this.getUnderutilizedAssignees();

      if (overloadedAssignees.length === 0 && request.reason !== 'manual') {
        return {
          success: true,
          reassignments: [],
          newDistribution: currentMetrics,
          performance: {
            balanceImprovement: 0,
            utilizationImprovement: 0,
            estimated: { responseTimeChange: 0, completionRateChange: 0 }
          },
          warnings: ['No rebalancing needed - workload is already balanced']
        };
      }

      // Find reassignment candidates
      const reassignments = await this.findReassignmentCandidates(
        overloadedAssignees,
        underutilizedAssignees,
        request
      );

      // Execute reassignments
      const executionResults = await this.executeReassignments(reassignments);

      // Calculate new distribution
      const newDistribution = await this.calculateNewDistribution(
        currentMetrics,
        executionResults.successful
      );

      // Calculate performance improvements
      const performance = this.calculatePerformanceImprovement(
        currentMetrics,
        newDistribution
      );

      logger.info('Workload rebalancing completed', {
        reassignments: executionResults.successful.length,
        failed: executionResults.failed.length,
        balanceImprovement: performance.balanceImprovement.toFixed(2)
      });

      return {
        success: true,
        reassignments: executionResults.successful,
        newDistribution,
        performance,
        warnings: executionResults.warnings
      };

    } catch (error) {
      logger.error('Error in workload rebalancing', error);
      return {
        success: false,
        reassignments: [],
        newDistribution: await this.getWorkloadMetrics(),
        performance: {
          balanceImprovement: 0,
          utilizationImprovement: 0,
          estimated: { responseTimeChange: 0, completionRateChange: 0 }
        },
        warnings: [],
        error: 'Failed to rebalance workload'
      };
    }
  }

  /**
   * Get territories and their assignments
   */
  async getTerritories(): Promise<Territory[]> {
    if (this.isCacheExpired()) {
      await this.refreshTerritoriesCache();
    }

    return Array.from(this.territoriesCache.values())
      .filter(t => t.active)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Find the best territory match for a request
   */
  async findTerritoryMatch(request: TerritoryAssignmentRequest): Promise<TerritoryMatchResult[]> {
    try {
      const territories = await this.getTerritories();
      const matches: TerritoryMatchResult[] = [];

      for (const territory of territories) {
        const matchScore = this.calculateTerritoryMatch(territory, request);
        
        if (matchScore > 0) {
          const assignees = await this.getAvailableTerritoryAssignees(territory, request);
          
          matches.push({
            territoryId: territory.id,
            territoryName: territory.name,
            matchScore,
            matchType: this.determineTerritoryMatchType(territory, request, matchScore),
            assignees,
            reasons: this.getTerritoryMatchReasons(territory, request, matchScore)
          });
        }
      }

      // Sort by match score (highest first)
      matches.sort((a, b) => b.matchScore - a.matchScore);

      logger.info('Territory matching completed', {
        requestType: request.product,
        location: request.location?.city,
        matches: matches.length,
        bestMatch: matches[0]?.matchScore.toFixed(2) || 'none'
      });

      return matches;

    } catch (error) {
      logger.error('Error finding territory match', error);
      return [];
    }
  }

  /**
   * Calculate territory match score
   */
  private calculateTerritoryMatch(territory: Territory, request: TerritoryAssignmentRequest): number {
    let score = 0;
    let factors = 0;

    // Geographic matching
    if (territory.type === 'geographic' && request.location) {
      const geoMatch = this.calculateGeographicMatch(territory, request.location);
      score += geoMatch * 0.4;
      factors += 0.4;
    }

    // Product matching
    if (territory.type === 'product' && request.product) {
      const productMatch = territory.boundaries.productTypes?.includes(request.product) ? 1 : 0;
      score += productMatch * 0.3;
      factors += 0.3;
    }

    // Budget matching
    if (territory.type === 'budget_range' && request.budget) {
      const budgetMatch = this.calculateBudgetMatch(territory, request.budget);
      score += budgetMatch * 0.3;
      factors += 0.3;
    }

    // Client type matching
    if (territory.type === 'client_type' && request.clientType) {
      const clientMatch = territory.boundaries.clientTypes?.includes(request.clientType) ? 1 : 0;
      score += clientMatch * 0.2;
      factors += 0.2;
    }

    // Territory performance bonus
    const performanceBonus = (territory.performance.completionRate * 0.1) + 
                            (territory.performance.customerSatisfaction / 5 * 0.1);
    score += performanceBonus;

    return factors > 0 ? score / Math.max(factors, 1) : 0;
  }

  /**
   * Calculate geographic match
   */
  private calculateGeographicMatch(territory: Territory, location: any): number {
    const boundaries = territory.boundaries;
    
    // City match
    if (boundaries.cities && location.city) {
      return boundaries.cities.includes(location.city) ? 1 : 0;
    }

    // State match
    if (boundaries.states && location.state) {
      return boundaries.states.includes(location.state) ? 0.7 : 0;
    }

    // ZIP code match
    if (boundaries.zipCodes && location.zipCode) {
      return boundaries.zipCodes.includes(location.zipCode) ? 1 : 0;
    }

    return 0;
  }

  /**
   * Calculate budget match
   */
  private calculateBudgetMatch(territory: Territory, budget: number): number {
    const boundaries = territory.boundaries;
    
    if (boundaries.budgetMin && budget >= boundaries.budgetMin) {
      if (boundaries.budgetMax && budget <= boundaries.budgetMax) {
        return 1; // Perfect match within range
      } else if (!boundaries.budgetMax) {
        return 1; // Above minimum with no maximum
      }
    }

    return 0;
  }

  /**
   * Get available assignees for a territory
   */
  private async getAvailableTerritoryAssignees(
    territory: Territory, 
    request: TerritoryAssignmentRequest
  ): Promise<any[]> {
    // In a real implementation, this would check actual assignee availability
    // For now, return simulated assignees based on territory configuration
    
    return territory.assignees.map(assignee => ({
      ...assignee,
      availability: Math.max(0, 1 - (assignee.currentLoad / assignee.capacity)),
      recommendationScore: this.calculateAssigneeRecommendationScore(assignee, request)
    })).filter(a => a.availability > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  /**
   * Calculate assignee recommendation score for territory assignment
   */
  private calculateAssigneeRecommendationScore(assignee: TerritoryAssignee, request: TerritoryAssignmentRequest): number {
    let score = 0;

    // Role priority
    const roleWeight = { primary: 1.0, secondary: 0.7, backup: 0.4 };
    score += roleWeight[assignee.role] * 0.3;

    // Expertise match
    const complexityRequirement = { low: 2, medium: 3, high: 4, expert: 5 };
    const requiredExpertise = complexityRequirement[request.complexity];
    const expertiseMatch = Math.min(assignee.expertise / requiredExpertise, 1);
    score += expertiseMatch * 0.4;

    // Availability (inverse of current load)
    const availability = Math.max(0, 1 - (assignee.currentLoad / assignee.capacity));
    score += availability * 0.2;

    // Response time performance (inverse scoring - lower is better)
    const responseTimeScore = Math.max(0, 1 - (assignee.responseTime / 120)); // 120 min baseline
    score += responseTimeScore * 0.1;

    return score;
  }

  /**
   * Determine territory match type
   */
  private determineTerritoryMatchType(
    territory: Territory, 
    request: TerritoryAssignmentRequest, 
    score: number
  ): 'exact' | 'overlap' | 'adjacent' | 'fallback' {
    if (score >= 0.9) return 'exact';
    if (score >= 0.6) return 'overlap';
    if (score >= 0.3) return 'adjacent';
    return 'fallback';
  }

  /**
   * Get territory match reasons
   */
  private getTerritoryMatchReasons(
    territory: Territory, 
    request: TerritoryAssignmentRequest, 
    score: number
  ): string[] {
    const reasons: string[] = [];

    if (territory.type === 'geographic' && request.location?.city) {
      if (territory.boundaries.cities?.includes(request.location.city)) {
        reasons.push(`Exact geographic match for ${request.location.city}`);
      }
    }

    if (territory.type === 'budget_range' && request.budget) {
      if (territory.boundaries.budgetMin && request.budget >= territory.boundaries.budgetMin) {
        reasons.push(`Budget range match ($${territory.boundaries.budgetMin.toLocaleString()}+)`);
      }
    }

    if (score < 0.5) {
      reasons.push('Fallback territory - consider expanding primary territories');
    }

    if (territory.performance.completionRate > 0.95) {
      reasons.push('High-performing territory');
    }

    return reasons;
  }

  /**
   * Refresh workload cache
   */
  private async refreshWorkloadCache(): Promise<void> {
    try {
      // Get all requests to calculate current workload
      const requestsResult = await requestsAPI.list();
      if (!requestsResult.success) {
        logger.warn('Failed to fetch requests for workload calculation');
        return;
      }

      // Group requests by assignee
      const assigneeWorkload = new Map<string, any[]>();
      requestsResult.data.forEach((request: any) => {
        if (request.assignedTo && request.assignedTo !== 'Unassigned') {
          const requests = assigneeWorkload.get(request.assignedTo) || [];
          requests.push(request);
          assigneeWorkload.set(request.assignedTo, requests);
        }
      });

      // Calculate metrics for each assignee
      this.workloadCache.clear();
      
      for (const [assigneeName, requests] of Array.from(assigneeWorkload.entries())) {
        const activeRequests = requests.filter((r: any) => 
          r.status !== 'Archived' && r.status !== 'Expired'
        );

        const metrics: WorkloadMetrics = {
          assigneeId: assigneeName, // Using name as ID for now
          assigneeName,
          currentAssignments: activeRequests.length,
          maxCapacity: 15, // Default capacity
          utilizationRate: activeRequests.length / 15,
          averageResponseTime: 30, // Default, would calculate from actual data
          completionRate: 0.95, // Default, would calculate from actual data
          overloadRisk: this.calculateOverloadRisk(activeRequests.length / 15),
          trendDirection: 'stable', // Would calculate from historical data
          lastUpdated: new Date().toISOString()
        };

        this.workloadCache.set(assigneeName, metrics);
      }

      this.cacheTimestamp = Date.now();
      logger.info('Workload cache refreshed', { assignees: this.workloadCache.size });

    } catch (error) {
      logger.error('Error refreshing workload cache', error);
    }
  }

  /**
   * Calculate overload risk level
   */
  private calculateOverloadRisk(utilizationRate: number): 'low' | 'medium' | 'high' | 'critical' {
    if (utilizationRate >= 1.0) return 'critical';
    if (utilizationRate >= 0.85) return 'high';
    if (utilizationRate >= 0.7) return 'medium';
    return 'low';
  }

  /**
   * Find reassignment candidates
   */
  private async findReassignmentCandidates(
    overloaded: WorkloadMetrics[],
    underutilized: WorkloadMetrics[],
    request: WorkloadRebalanceRequest
  ): Promise<any[]> {
    // Simplified reassignment logic
    // In real implementation, would consider request priorities, deadlines, etc.
    return [];
  }

  /**
   * Execute reassignments
   */
  private async executeReassignments(reassignments: any[]): Promise<any> {
    return {
      successful: [],
      failed: [],
      warnings: []
    };
  }

  /**
   * Calculate new distribution after reassignments
   */
  private async calculateNewDistribution(
    current: WorkloadMetrics[],
    reassignments: any[]
  ): Promise<WorkloadMetrics[]> {
    return current; // Simplified for now
  }

  /**
   * Calculate performance improvement
   */
  private calculatePerformanceImprovement(
    before: WorkloadMetrics[],
    after: WorkloadMetrics[]
  ): any {
    return {
      balanceImprovement: 0,
      utilizationImprovement: 0,
      estimated: {
        responseTimeChange: 0,
        completionRateChange: 0
      }
    };
  }

  /**
   * Refresh territories cache
   */
  private async refreshTerritoriesCache(): Promise<void> {
    // In real implementation, would load from database
    this.cacheTimestamp = Date.now();
    logger.info('Territories cache refreshed');
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
    await this.refreshWorkloadCache();
    await this.refreshTerritoriesCache();
  }
}

// Export singleton instance
export const workloadBalancingService = new WorkloadBalancingService();
export default workloadBalancingService;