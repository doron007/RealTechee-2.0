import { requestsAPI, projectsAPI, contactsAPI } from '../../utils/amplifyAPI';
import { leadScoringService } from './leadScoringService';
import { leadLifecycleService } from '../business/leadLifecycleService';
import { analyticsService } from './analyticsService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ROITrackingService');

// ROI tracking interfaces
export interface LeadROIMetrics {
  requestId: string;
  leadSource: string;
  acquisitionCost: number;
  conversionValue: number;
  conversionDate?: string;
  lifecycleDays: number;
  roi: number; // Return on Investment as percentage
  ltv: number; // Lifetime Value
  conversionProbability: number;
  actualConversionStatus: 'converted' | 'lost' | 'pending';
  costPerLead: number;
  valuePerLead: number;
  qualityScore: number;
}

export interface SourceROIAnalysis {
  sourceName: string;
  totalLeads: number;
  totalCost: number;
  totalRevenue: number;
  conversions: number;
  conversionRate: number;
  averageLifecycle: number;
  costPerLead: number;
  costPerConversion: number;
  roi: number;
  ltv: number;
  qualityScore: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export interface ConversionFunnelMetrics {
  stage: string;
  totalLeads: number;
  conversions: number;
  conversionRate: number;
  dropoffRate: number;
  averageTimeInStage: number;
  costPerStage: number;
  valueGenerated: number;
  bottleneckRisk: 'low' | 'medium' | 'high';
}

export interface ROIDashboardData {
  overview: {
    totalROI: number;
    totalLeads: number;
    totalRevenue: number;
    totalCost: number;
    averageCostPerLead: number;
    averageConversionValue: number;
    overallConversionRate: number;
  };
  sourceAnalysis: SourceROIAnalysis[];
  funnelMetrics: ConversionFunnelMetrics[];
  topPerformingLeads: LeadROIMetrics[];
  bottomPerformingLeads: LeadROIMetrics[];
  trendData: {
    month: string;
    leads: number;
    revenue: number;
    cost: number;
    roi: number;
  }[];
}

export interface ROIConfiguration {
  defaultAcquisitionCosts: Record<string, number>; // Cost per lead by source
  conversionValueRules: {
    projectTypes: Record<string, number>;
    minimumValue: number;
    averageProjectMargin: number;
  };
  trackingSettings: {
    attributionWindow: number; // days
    includePartialConversions: boolean;
    countReactivationsAsSeparate: boolean;
  };
}

/**
 * ROI Tracking Service - Comprehensive return on investment and conversion tracking
 */
export class ROITrackingService {
  private roiConfig!: ROIConfiguration;
  private metricsCache: Map<string, any> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.initializeConfiguration();
  }

  /**
   * Initialize ROI tracking configuration
   */
  private initializeConfiguration(): void {
    this.roiConfig = {
      defaultAcquisitionCosts: {
        'Equity Union': 45,      // Premium partner - higher cost but better quality
        'Brokerage': 35,         // Standard brokerage referrals
        'Sync Brokerage': 30,    // Lower-performing source
        'Referral': 15,          // Direct referrals - low cost, high value
        'Website': 25,           // Organic website leads
        'Google Ads': 60,        // Paid search - higher cost
        'Facebook Ads': 40,      // Social media advertising
        'E2E_TEST': 0            // Test data - no cost
      },
      conversionValueRules: {
        projectTypes: {
          'Kitchen Renovation': 75000,
          'Bathroom Renovation': 45000,
          'Full Home Renovation': 150000,
          'Commercial': 200000,
          'Outdoor Living': 35000,
          'General': 50000
        },
        minimumValue: 15000,
        averageProjectMargin: 0.25 // 25% profit margin
      },
      trackingSettings: {
        attributionWindow: 90, // 90 days to attribute conversions
        includePartialConversions: true,
        countReactivationsAsSeparate: false
      }
    };

    logger.info('ROI tracking configuration initialized', {
      sources: Object.keys(this.roiConfig.defaultAcquisitionCosts).length,
      projectTypes: Object.keys(this.roiConfig.conversionValueRules.projectTypes).length
    });
  }

  /**
   * Calculate ROI metrics for a specific lead
   */
  async calculateLeadROI(requestId: string): Promise<LeadROIMetrics> {
    try {
      logger.debug('Calculating ROI for lead', { requestId });

      // Get request details
      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success) {
        throw new Error('Request not found');
      }

      const request = requestResult.data;

      // Get lead score for quality assessment
      let leadScore: any = null;
      try {
        leadScore = await leadScoringService.getLeadScore(requestId);
      } catch (err) {
        logger.warn('Could not get lead score for ROI calculation', { requestId });
      }

      // Calculate acquisition cost
      const acquisitionCost = this.calculateAcquisitionCost(request.leadSource);

      // Calculate conversion value and status
      const conversionData = await this.calculateConversionValue(request);

      // Calculate lifecycle metrics
      const lifecycleDays = this.calculateLifecycleDays(request);

      // Calculate ROI
      const roi = conversionData.value > 0 
        ? ((conversionData.value - acquisitionCost) / acquisitionCost) * 100
        : -100;

      // Calculate LTV (Lifetime Value)
      const ltv = this.calculateLifetimeValue(request, conversionData.value);

      const roiMetrics: LeadROIMetrics = {
        requestId,
        leadSource: request.leadSource || 'Unknown',
        acquisitionCost,
        conversionValue: conversionData.value,
        conversionDate: conversionData.date,
        lifecycleDays,
        roi,
        ltv,
        conversionProbability: leadScore?.conversionProbability || 0,
        actualConversionStatus: conversionData.status,
        costPerLead: acquisitionCost,
        valuePerLead: conversionData.value,
        qualityScore: leadScore?.overallScore || 0
      };

      logger.debug('ROI metrics calculated', {
        requestId,
        roi: roi.toFixed(1),
        conversionValue: conversionData.value,
        acquisitionCost
      });

      return roiMetrics;

    } catch (error) {
      logger.error('Error calculating lead ROI', { requestId, error });
      
      // Return default metrics on error
      return {
        requestId,
        leadSource: 'Unknown',
        acquisitionCost: 0,
        conversionValue: 0,
        lifecycleDays: 0,
        roi: 0,
        ltv: 0,
        conversionProbability: 0,
        actualConversionStatus: 'pending',
        costPerLead: 0,
        valuePerLead: 0,
        qualityScore: 0
      };
    }
  }

  /**
   * Analyze ROI by lead source
   */
  async analyzeSourceROI(): Promise<SourceROIAnalysis[]> {
    try {
      logger.info('Analyzing ROI by source');

      const cacheKey = 'source-roi-analysis';
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Get all requests (excluding test data)
      const requestsResult = await requestsAPI.list();
      if (!requestsResult.success) {
        throw new Error('Failed to fetch requests');
      }

      const requests = requestsResult.data.filter((req: any) => req.leadSource !== 'E2E_TEST');

      // Group requests by source
      const sourceGroups = requests.reduce((groups: any, request: any) => {
        const source = request.leadSource || 'Unknown';
        if (!groups[source]) groups[source] = [];
        groups[source].push(request);
        return groups;
      }, {});

      const sourceAnalysis: SourceROIAnalysis[] = [];

      for (const [sourceName, sourceRequests] of Object.entries(sourceGroups)) {
        const analysis = await this.calculateSourceAnalysis(sourceName, sourceRequests as any[]);
        sourceAnalysis.push(analysis);
      }

      // Sort by ROI (highest first)
      sourceAnalysis.sort((a, b) => b.roi - a.roi);

      this.setCachedData(cacheKey, sourceAnalysis);

      logger.info('Source ROI analysis completed', {
        sources: sourceAnalysis.length,
        totalLeads: sourceAnalysis.reduce((sum, s) => sum + s.totalLeads, 0)
      });

      return sourceAnalysis;

    } catch (error) {
      logger.error('Error analyzing source ROI', error);
      return [];
    }
  }

  /**
   * Calculate conversion funnel metrics
   */
  async calculateConversionFunnel(): Promise<ConversionFunnelMetrics[]> {
    try {
      logger.info('Calculating conversion funnel metrics');

      const cacheKey = 'conversion-funnel';
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      // Define funnel stages based on request statuses
      const funnelStages = [
        { stage: 'New', order: 1 },
        { stage: 'Pending walk-thru', order: 2 },
        { stage: 'Move to Quoting', order: 3 },
        { stage: 'Converted', order: 4 } // Would map to completed projects
      ];

      const requestsResult = await requestsAPI.list();
      if (!requestsResult.success) {
        throw new Error('Failed to fetch requests');
      }

      const requests = requestsResult.data.filter((req: any) => req.leadSource !== 'E2E_TEST');

      const funnelMetrics: ConversionFunnelMetrics[] = [];

      for (let i = 0; i < funnelStages.length; i++) {
        const stage = funnelStages[i];
        const stageRequests = requests.filter((req: any) => req.status === stage.stage);
        
        const nextStage = funnelStages[i + 1];
        const nextStageRequests = nextStage 
          ? requests.filter((req: any) => req.status === nextStage.stage)
          : [];

        const totalLeads = stageRequests.length;
        const conversions = nextStageRequests.length;
        const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;
        const dropoffRate = 100 - conversionRate;

        // Calculate average time in stage (simplified)
        const averageTimeInStage = 3; // Would calculate from actual data

        // Calculate cost and value metrics
        const costPerStage = this.calculateStageCost(stageRequests);
        const valueGenerated = this.calculateStageValue(stageRequests);

        // Assess bottleneck risk
        const bottleneckRisk = dropoffRate > 70 ? 'high' : dropoffRate > 40 ? 'medium' : 'low';

        funnelMetrics.push({
          stage: stage.stage,
          totalLeads,
          conversions,
          conversionRate,
          dropoffRate,
          averageTimeInStage,
          costPerStage,
          valueGenerated,
          bottleneckRisk
        });
      }

      this.setCachedData(cacheKey, funnelMetrics);

      logger.info('Conversion funnel calculated', { stages: funnelMetrics.length });

      return funnelMetrics;

    } catch (error) {
      logger.error('Error calculating conversion funnel', error);
      return [];
    }
  }

  /**
   * Get comprehensive ROI dashboard data
   */
  async getROIDashboardData(): Promise<ROIDashboardData> {
    try {
      logger.info('Generating ROI dashboard data');

      const [sourceAnalysis, funnelMetrics] = await Promise.all([
        this.analyzeSourceROI(),
        this.calculateConversionFunnel()
      ]);

      // Calculate overview metrics
      const overview = this.calculateOverviewMetrics(sourceAnalysis);

      // Get trend data (last 12 months)
      const trendData = await this.calculateTrendData();

      // Get top and bottom performing leads
      const { topPerforming, bottomPerforming } = await this.getPerformanceExtremes();

      const dashboardData: ROIDashboardData = {
        overview,
        sourceAnalysis,
        funnelMetrics,
        topPerformingLeads: topPerforming,
        bottomPerformingLeads: bottomPerforming,
        trendData
      };

      logger.info('ROI dashboard data generated successfully', {
        sources: sourceAnalysis.length,
        topLeads: topPerforming.length,
        trendMonths: trendData.length
      });

      return dashboardData;

    } catch (error) {
      logger.error('Error generating ROI dashboard data', error);
      throw error;
    }
  }

  /**
   * Calculate acquisition cost for a lead source
   */
  private calculateAcquisitionCost(leadSource: string): number {
    return this.roiConfig.defaultAcquisitionCosts[leadSource] || 
           this.roiConfig.defaultAcquisitionCosts['General'] || 
           30; // Default cost if source not found
  }

  /**
   * Calculate conversion value and status
   */
  private async calculateConversionValue(request: any): Promise<{
    value: number;
    status: 'converted' | 'lost' | 'pending';
    date?: string;
  }> {
    try {
      // Check if lead has converted to a project
      // This would typically query the projects table for related projects
      
      // For now, estimate based on status and product type
      let value = 0;
      let status: 'converted' | 'lost' | 'pending' = 'pending';
      let date: string | undefined;

      if (request.status === 'Archived') {
        // Check archival reason to determine if it's a conversion or loss
        const officeNotes = request.officeNotes || '';
        if (officeNotes.includes('completed') || officeNotes.includes('accepted')) {
          status = 'converted';
          value = this.roiConfig.conversionValueRules.projectTypes[request.product] || 
                  this.roiConfig.conversionValueRules.projectTypes['General'];
          date = request.archivedDate;
        } else {
          status = 'lost';
          value = 0;
        }
      } else if (request.status === 'Expired') {
        status = 'lost';
        value = 0;
      } else {
        status = 'pending';
        // Estimate potential value for pending leads
        value = (this.roiConfig.conversionValueRules.projectTypes[request.product] || 
                this.roiConfig.conversionValueRules.projectTypes['General']) * 
                this.roiConfig.conversionValueRules.averageProjectMargin;
      }

      return { value, status, date };

    } catch (error) {
      logger.error('Error calculating conversion value', { requestId: request.id, error });
      return { value: 0, status: 'pending' };
    }
  }

  /**
   * Calculate lifecycle days for a request
   */
  private calculateLifecycleDays(request: any): number {
    const createdDate = new Date(request.createdAt);
    const endDate = request.archivedDate ? new Date(request.archivedDate) : new Date();
    return Math.floor((endDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate lifetime value for a lead
   */
  private calculateLifetimeValue(request: any, conversionValue: number): number {
    // Simplified LTV calculation
    // In reality, this would consider repeat business, referrals, etc.
    const referralMultiplier = request.leadSource === 'Referral' ? 1.5 : 1.2;
    const qualityMultiplier = this.getQualityMultiplier(request.product);
    
    return conversionValue * referralMultiplier * qualityMultiplier;
  }

  /**
   * Get quality multiplier based on project type
   */
  private getQualityMultiplier(product: string): number {
    const multipliers: Record<string, number> = {
      'Full Home Renovation': 1.8,
      'Commercial': 2.0,
      'Kitchen Renovation': 1.4,
      'Bathroom Renovation': 1.2,
      'Outdoor Living': 1.1,
      'General': 1.0
    };

    return multipliers[product] || 1.0;
  }

  /**
   * Calculate comprehensive source analysis
   */
  private async calculateSourceAnalysis(sourceName: string, requests: any[]): Promise<SourceROIAnalysis> {
    const totalLeads = requests.length;
    const acquisitionCost = this.calculateAcquisitionCost(sourceName);
    const totalCost = totalLeads * acquisitionCost;

    let totalRevenue = 0;
    let conversions = 0;
    let totalLifecycleDays = 0;
    let qualityScoreSum = 0;

    for (const request of requests) {
      const conversionData = await this.calculateConversionValue(request);
      if (conversionData.status === 'converted') {
        totalRevenue += conversionData.value;
        conversions++;
      }

      totalLifecycleDays += this.calculateLifecycleDays(request);

      // Get quality score
      try {
        const leadScore = await leadScoringService.getLeadScore(request.id);
        qualityScoreSum += leadScore.overallScore;
      } catch (err) {
        qualityScoreSum += 50; // Default score
      }
    }

    const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;
    const averageLifecycle = totalLeads > 0 ? totalLifecycleDays / totalLeads : 0;
    const costPerLead = acquisitionCost;
    const costPerConversion = conversions > 0 ? totalCost / conversions : 0;
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
    const ltv = totalLeads > 0 ? (totalRevenue * 1.3) / totalLeads : 0; // Include referral factor
    const qualityScore = totalLeads > 0 ? qualityScoreSum / totalLeads : 0;

    // Determine trend direction (simplified)
    const trendDirection = roi > 50 ? 'improving' : roi > 0 ? 'stable' : 'declining';

    // Generate recommendations
    const recommendations = this.generateSourceRecommendations({
      conversionRate,
      roi,
      costPerLead,
      qualityScore,
      sourceName
    });

    return {
      sourceName,
      totalLeads,
      totalCost,
      totalRevenue,
      conversions,
      conversionRate,
      averageLifecycle,
      costPerLead,
      costPerConversion,
      roi,
      ltv,
      qualityScore,
      trendDirection,
      recommendations
    };
  }

  /**
   * Generate recommendations for lead source optimization
   */
  private generateSourceRecommendations(metrics: {
    conversionRate: number;
    roi: number;
    costPerLead: number;
    qualityScore: number;
    sourceName: string;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.roi < 0) {
      recommendations.push('Review acquisition strategy - negative ROI indicates cost optimization needed');
    }

    if (metrics.conversionRate < 15) {
      recommendations.push('Focus on lead quality improvement - low conversion rate');
    }

    if (metrics.qualityScore < 60) {
      recommendations.push('Implement lead scoring filters to improve quality');
    }

    if (metrics.costPerLead > 50) {
      recommendations.push('Negotiate better rates or optimize targeting to reduce acquisition costs');
    }

    if (metrics.roi > 100 && metrics.conversionRate > 25) {
      recommendations.push('Scale up investment - source showing excellent performance');
    }

    if (recommendations.length === 0) {
      recommendations.push('Source performing within acceptable parameters - maintain current strategy');
    }

    return recommendations;
  }

  /**
   * Calculate stage-specific costs
   */
  private calculateStageCost(stageRequests: any[]): number {
    return stageRequests.reduce((total, request) => {
      return total + this.calculateAcquisitionCost(request.leadSource);
    }, 0);
  }

  /**
   * Calculate stage-specific value
   */
  private calculateStageValue(stageRequests: any[]): number {
    return stageRequests.reduce((total, request) => {
      const estimatedValue = this.roiConfig.conversionValueRules.projectTypes[request.product] || 
                           this.roiConfig.conversionValueRules.projectTypes['General'];
      return total + (estimatedValue * 0.1); // 10% probability weighting for estimation
    }, 0);
  }

  /**
   * Calculate overview metrics from source analysis
   */
  private calculateOverviewMetrics(sourceAnalysis: SourceROIAnalysis[]) {
    const totals = sourceAnalysis.reduce((acc, source) => ({
      leads: acc.leads + source.totalLeads,
      revenue: acc.revenue + source.totalRevenue,
      cost: acc.cost + source.totalCost,
      conversions: acc.conversions + source.conversions
    }), { leads: 0, revenue: 0, cost: 0, conversions: 0 });

    return {
      totalROI: totals.cost > 0 ? ((totals.revenue - totals.cost) / totals.cost) * 100 : 0,
      totalLeads: totals.leads,
      totalRevenue: totals.revenue,
      totalCost: totals.cost,
      averageCostPerLead: totals.leads > 0 ? totals.cost / totals.leads : 0,
      averageConversionValue: totals.conversions > 0 ? totals.revenue / totals.conversions : 0,
      overallConversionRate: totals.leads > 0 ? (totals.conversions / totals.leads) * 100 : 0
    };
  }

  /**
   * Calculate trend data for the last 12 months
   */
  private async calculateTrendData(): Promise<Array<{
    month: string;
    leads: number;
    revenue: number;
    cost: number;
    roi: number;
  }>> {
    try {
      // This would typically aggregate data by month
      // For now, return mock trend data
      const trendData = [];
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Mock data - would be calculated from actual requests
        const leads = Math.floor(Math.random() * 50) + 20;
        const cost = leads * 35; // Average cost per lead
        const revenue = leads * 25000 * 0.2; // 20% conversion at 25k average
        const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

        trendData.push({
          month: monthKey,
          leads,
          revenue,
          cost,
          roi
        });
      }

      return trendData;

    } catch (error) {
      logger.error('Error calculating trend data', error);
      return [];
    }
  }

  /**
   * Get top and bottom performing leads
   */
  private async getPerformanceExtremes(): Promise<{
    topPerforming: LeadROIMetrics[];
    bottomPerforming: LeadROIMetrics[];
  }> {
    try {
      // Get sample of recent requests for performance analysis
      const requestsResult = await requestsAPI.list();
      if (!requestsResult.success) {
        return { topPerforming: [], bottomPerforming: [] };
      }

      const recentRequests = requestsResult.data
        .filter((req: any) => req.leadSource !== 'E2E_TEST')
        .slice(0, 50); // Analyze last 50 requests

      const roiMetrics: LeadROIMetrics[] = [];

      for (const request of recentRequests) {
        try {
          const metrics = await this.calculateLeadROI(request.id);
          roiMetrics.push(metrics);
        } catch (err) {
          // Skip failed calculations
        }
      }

      // Sort by ROI
      roiMetrics.sort((a, b) => b.roi - a.roi);

      return {
        topPerforming: roiMetrics.slice(0, 5),
        bottomPerforming: roiMetrics.slice(-5).reverse()
      };

    } catch (error) {
      logger.error('Error getting performance extremes', error);
      return { topPerforming: [], bottomPerforming: [] };
    }
  }

  /**
   * Cache management methods
   */
  private getCachedData(key: string): any {
    const cached = this.metricsCache.get(key);
    if (cached && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return cached;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.metricsCache.set(key, data);
    this.cacheTimestamp = Date.now();
  }

  /**
   * Clear all cached metrics
   */
  clearCache(): void {
    this.metricsCache.clear();
    this.cacheTimestamp = 0;
    logger.info('ROI tracking cache cleared');
  }

  /**
   * Update ROI configuration
   */
  updateConfiguration(newConfig: Partial<ROIConfiguration>): void {
    this.roiConfig = { ...this.roiConfig, ...newConfig };
    this.clearCache(); // Clear cache when configuration changes
    logger.info('ROI configuration updated', newConfig);
  }

  /**
   * Get current ROI configuration
   */
  getConfiguration(): ROIConfiguration {
    return { ...this.roiConfig };
  }
}

// Export singleton instance
export const roiTrackingService = new ROITrackingService();
export default roiTrackingService;