import { requestsAPI, contactsAPI, propertiesAPI } from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';

const logger = createLogger('LeadScoringService');

// Lead scoring interfaces
export interface LeadScore {
  requestId: string;
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  conversionProbability: number; // 0-1
  lastCalculated: string;
  factors: ScoringFactors;
  recommendations: string[];
  priorityLevel: 'urgent' | 'high' | 'medium' | 'low';
}

export interface ScoringFactors {
  dataCompleteness: {
    score: number;
    weight: number;
    details: {
      hasCompleteContact: boolean;
      hasBudget: boolean;
      hasProduct: boolean;
      hasPropertyDetails: boolean;
      hasTimeframe: boolean;
    };
  };
  sourceQuality: {
    score: number;
    weight: number;
    details: {
      sourceName: string;
      sourceReliability: number;
      historicalConversionRate: number;
      partnershipLevel: 'premium' | 'standard' | 'new';
    };
  };
  engagementLevel: {
    score: number;
    weight: number;
    details: {
      hasAttachments: boolean;
      hasDetailedMessage: boolean;
      requestedMeeting: boolean;
      responseSpeed: number; // hours
    };
  };
  budgetAlignment: {
    score: number;
    weight: number;
    details: {
      budgetRange: string;
      isRealistic: boolean;
      alignsWithServices: boolean;
      budgetToValueRatio: number;
    };
  };
  projectComplexity: {
    score: number;
    weight: number;
    details: {
      productType: string;
      complexityLevel: 'simple' | 'moderate' | 'complex' | 'luxury';
      skillRequirements: string[];
      estimatedDuration: number; // weeks
    };
  };
  geographicFit: {
    score: number;
    weight: number;
    details: {
      inServiceArea: boolean;
      distanceFromOffice: number; // miles
      localMarketStrength: number;
      territoryAssignment: string;
    };
  };
  urgencyIndicators: {
    score: number;
    weight: number;
    details: {
      requestedTimeframe: string;
      competitiveMarket: boolean;
      seasonalFactors: number;
      clientAvailability: number;
    };
  };
}

export interface ScoringWeights {
  dataCompleteness: number;
  sourceQuality: number;
  engagementLevel: number;
  budgetAlignment: number;
  projectComplexity: number;
  geographicFit: number;
  urgencyIndicators: number;
}

export interface QualityMetrics {
  completenessScore: number; // 0-100
  engagementScore: number; // 0-100
  viabilityScore: number; // 0-100
  urgencyScore: number; // 0-100
  qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  riskFactors: string[];
  strengthFactors: string[];
}

export interface ConversionPrediction {
  probability: number; // 0-1
  confidence: number; // 0-1
  timeToConversion: number; // days
  valueEstimate: number; // dollars
  riskFactors: string[];
  successFactors: string[];
  recommendedActions: string[];
}

export interface BudgetAnalysis {
  budgetRange: {
    min: number;
    max: number;
    midpoint: number;
  };
  realismScore: number; // 0-1
  alignmentWithServices: number; // 0-1
  profitabilityScore: number; // 0-1
  competitivePosition: 'strong' | 'moderate' | 'weak';
  recommendations: string[];
}

export interface SourcePerformanceMetrics {
  sourceName: string;
  totalLeads: number;
  conversionRate: number;
  averageScore: number;
  averageValue: number;
  averageTimeToConversion: number;
  reliabilityScore: number; // 0-1
  trendDirection: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

/**
 * Lead Scoring Service - Provides comprehensive lead quality assessment and scoring
 */
export class LeadScoringService {
  private scoringWeights!: ScoringWeights;
  private sourceMetricsCache: Map<string, SourcePerformanceMetrics> = new Map();
  private scoreCache: Map<string, LeadScore> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.initializeScoringWeights();
    this.initializeSourceMetrics();
  }

  /**
   * Initialize default scoring weights
   */
  private initializeScoringWeights(): void {
    this.scoringWeights = {
      dataCompleteness: 0.20,    // 20% - Complete information
      sourceQuality: 0.18,       // 18% - Lead source reliability
      engagementLevel: 0.17,     // 17% - Client engagement indicators
      budgetAlignment: 0.15,     // 15% - Budget realism and fit
      projectComplexity: 0.12,   // 12% - Project scope and complexity
      geographicFit: 0.10,       // 10% - Geographic alignment
      urgencyIndicators: 0.08    // 8% - Time sensitivity factors
    };

    logger.info('Lead scoring weights initialized', this.scoringWeights);
  }

  /**
   * Initialize source performance metrics
   */
  private async initializeSourceMetrics(): Promise<void> {
    // Default source performance data (would be calculated from historical data)
    const defaultSourceMetrics: SourcePerformanceMetrics[] = [
      {
        sourceName: 'Equity Union',
        totalLeads: 580,
        conversionRate: 0.32,
        averageScore: 78,
        averageValue: 85000,
        averageTimeToConversion: 12,
        reliabilityScore: 0.92,
        trendDirection: 'improving',
        lastUpdated: new Date().toISOString()
      },
      {
        sourceName: 'Brokerage',
        totalLeads: 250,
        conversionRate: 0.28,
        averageScore: 74,
        averageValue: 65000,
        averageTimeToConversion: 15,
        reliabilityScore: 0.85,
        trendDirection: 'stable',
        lastUpdated: new Date().toISOString()
      },
      {
        sourceName: 'Referral',
        totalLeads: 30,
        conversionRate: 0.47,
        averageScore: 85,
        averageValue: 95000,
        averageTimeToConversion: 8,
        reliabilityScore: 0.95,
        trendDirection: 'improving',
        lastUpdated: new Date().toISOString()
      },
      {
        sourceName: 'Sync Brokerage',
        totalLeads: 45,
        conversionRate: 0.24,
        averageScore: 68,
        averageValue: 55000,
        averageTimeToConversion: 18,
        reliabilityScore: 0.78,
        trendDirection: 'declining',
        lastUpdated: new Date().toISOString()
      }
    ];

    defaultSourceMetrics.forEach(metrics => {
      this.sourceMetricsCache.set(metrics.sourceName, metrics);
    });

    logger.info('Source performance metrics initialized', { sources: defaultSourceMetrics.length });
  }

  /**
   * Calculate comprehensive lead score
   */
  async calculateLeadScore(requestId: string): Promise<LeadScore> {
    try {
      logger.debug('Calculating lead score', { requestId });

      // Get request data
      const requestResult = await requestsAPI.get(requestId);
      if (!requestResult.success) {
        throw new Error('Request not found');
      }

      const request = requestResult.data;
      
      // Calculate individual scoring factors
      const factors = await this.calculateScoringFactors(request);
      
      // Calculate weighted overall score
      const overallScore = this.calculateWeightedScore(factors);
      
      // Determine grade and priority
      const grade = this.calculateGrade(overallScore);
      const priorityLevel = this.calculatePriorityLevel(overallScore, factors);
      
      // Calculate conversion probability
      const conversionProbability = this.calculateConversionProbability(overallScore, factors);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(factors, overallScore);

      const leadScore: LeadScore = {
        requestId,
        overallScore,
        grade,
        conversionProbability,
        lastCalculated: new Date().toISOString(),
        factors,
        recommendations,
        priorityLevel
      };

      // Cache the score
      this.scoreCache.set(requestId, leadScore);

      logger.debug('Lead score calculated', {
        requestId,
        overallScore: overallScore.toFixed(1),
        grade,
        conversionProbability: (conversionProbability * 100).toFixed(1) + '%'
      });

      return leadScore;

    } catch (error) {
      logger.error('Error calculating lead score', { requestId, error });
      
      // Return default score on error
      return {
        requestId,
        overallScore: 0,
        grade: 'F',
        conversionProbability: 0,
        lastCalculated: new Date().toISOString(),
        factors: {} as ScoringFactors,
        recommendations: ['Unable to calculate score - please review manually'],
        priorityLevel: 'low'
      };
    }
  }

  /**
   * Calculate individual scoring factors
   */
  private async calculateScoringFactors(request: any): Promise<ScoringFactors> {
    // Data Completeness Factor
    const dataCompleteness = await this.calculateDataCompleteness(request);
    
    // Source Quality Factor
    const sourceQuality = this.calculateSourceQuality(request);
    
    // Engagement Level Factor
    const engagementLevel = this.calculateEngagementLevel(request);
    
    // Budget Alignment Factor
    const budgetAlignment = this.calculateBudgetAlignment(request);
    
    // Project Complexity Factor
    const projectComplexity = this.calculateProjectComplexity(request);
    
    // Geographic Fit Factor
    const geographicFit = await this.calculateGeographicFit(request);
    
    // Urgency Indicators Factor
    const urgencyIndicators = this.calculateUrgencyIndicators(request);

    return {
      dataCompleteness: {
        score: dataCompleteness.score,
        weight: this.scoringWeights.dataCompleteness,
        details: dataCompleteness.details
      },
      sourceQuality: {
        score: sourceQuality.score,
        weight: this.scoringWeights.sourceQuality,
        details: sourceQuality.details
      },
      engagementLevel: {
        score: engagementLevel.score,
        weight: this.scoringWeights.engagementLevel,
        details: engagementLevel.details
      },
      budgetAlignment: {
        score: budgetAlignment.score,
        weight: this.scoringWeights.budgetAlignment,
        details: budgetAlignment.details
      },
      projectComplexity: {
        score: projectComplexity.score,
        weight: this.scoringWeights.projectComplexity,
        details: projectComplexity.details
      },
      geographicFit: {
        score: geographicFit.score,
        weight: this.scoringWeights.geographicFit,
        details: geographicFit.details
      },
      urgencyIndicators: {
        score: urgencyIndicators.score,
        weight: this.scoringWeights.urgencyIndicators,
        details: urgencyIndicators.details
      }
    };
  }

  /**
   * Calculate data completeness score
   */
  private async calculateDataCompleteness(request: any): Promise<{ score: number; details: any }> {
    const details = {
      hasCompleteContact: false,
      hasBudget: false,
      hasProduct: false,
      hasPropertyDetails: false,
      hasTimeframe: false
    };

    let completenessPoints = 0;
    const maxPoints = 5;

    // Check contact completeness
    if (request.agentContactId || request.homeownerContactId) {
      details.hasCompleteContact = true;
      completenessPoints++;
    }

    // Check budget information
    if (request.budget && request.budget !== 'Not specified') {
      details.hasBudget = true;
      completenessPoints++;
    }

    // Check product specification
    if (request.product && request.product !== 'General') {
      details.hasProduct = true;
      completenessPoints++;
    }

    // Check property details
    if (request.addressId) {
      details.hasPropertyDetails = true;
      completenessPoints++;
    }

    // Check timeframe (meeting request or message indicating urgency)
    if (request.requestedVisitDateTime || request.message?.toLowerCase().includes('urgent')) {
      details.hasTimeframe = true;
      completenessPoints++;
    }

    const score = (completenessPoints / maxPoints) * 100;

    return { score, details };
  }

  /**
   * Calculate source quality score
   */
  private calculateSourceQuality(request: any): { score: number; details: any } {
    const leadSource = request.leadSource || 'Unknown';
    const sourceMetrics = this.sourceMetricsCache.get(leadSource);

    let sourceReliability = 0.5; // Default for unknown sources
    let historicalConversionRate = 0.2; // Default
    let partnershipLevel: 'premium' | 'standard' | 'new' = 'new';

    if (sourceMetrics) {
      sourceReliability = sourceMetrics.reliabilityScore;
      historicalConversionRate = sourceMetrics.conversionRate;
      
      // Determine partnership level
      if (sourceMetrics.conversionRate > 0.35 && sourceMetrics.reliabilityScore > 0.9) {
        partnershipLevel = 'premium';
      } else if (sourceMetrics.conversionRate > 0.25 && sourceMetrics.reliabilityScore > 0.8) {
        partnershipLevel = 'standard';
      }
    }

    // Calculate composite score
    const reliabilityScore = sourceReliability * 50;
    const conversionScore = historicalConversionRate * 50;
    const score = reliabilityScore + conversionScore;

    const details = {
      sourceName: leadSource,
      sourceReliability,
      historicalConversionRate,
      partnershipLevel
    };

    return { score, details };
  }

  /**
   * Calculate engagement level score
   */
  private calculateEngagementLevel(request: any): { score: number; details: any } {
    const details = {
      hasAttachments: false,
      hasDetailedMessage: false,
      requestedMeeting: false,
      responseSpeed: 24 // Default 24 hours
    };

    let engagementPoints = 0;
    const maxPoints = 4;

    // Check for file attachments
    const hasFiles = (request.uploadedMedia && request.uploadedMedia.length > 0) ||
                    (request.uploadedDocuments && request.uploadedDocuments.length > 0) ||
                    (request.uploadedVideos && request.uploadedVideos.length > 0);
    
    if (hasFiles) {
      details.hasAttachments = true;
      engagementPoints++;
    }

    // Check for detailed message
    if (request.message && request.message.length > 100) {
      details.hasDetailedMessage = true;
      engagementPoints++;
    }

    // Check for meeting request
    if (request.requestedVisitDateTime) {
      details.requestedMeeting = true;
      engagementPoints++;
    }

    // Response speed (if responded to initial contact)
    // This would be calculated from actual response data
    // For now, give points for immediate submission
    const createdAt = new Date(request.createdAt);
    const now = new Date();
    const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursOld < 4) { // Submitted recently shows urgency
      engagementPoints++;
      details.responseSpeed = hoursOld;
    }

    const score = (engagementPoints / maxPoints) * 100;

    return { score, details };
  }

  /**
   * Calculate budget alignment score
   */
  private calculateBudgetAlignment(request: any): { score: number; details: any } {
    const budgetStr = request.budget || 'Not specified';
    
    const details = {
      budgetRange: budgetStr,
      isRealistic: false,
      alignsWithServices: false,
      budgetToValueRatio: 0
    };

    let score = 20; // Base score for any budget info

    if (budgetStr === 'Not specified' || budgetStr === '$0') {
      return { score: 10, details }; // Low score for no budget
    }

    // Parse budget amount
    const budgetAmount = this.parseBudgetAmount(budgetStr);
    
    if (budgetAmount > 0) {
      // Check if budget is realistic for services
      if (budgetAmount >= 15000) { // Minimum viable project
        details.isRealistic = true;
        score += 30;
      }

      if (budgetAmount >= 25000) { // Good project size
        details.alignsWithServices = true;
        score += 20;
      }

      if (budgetAmount >= 50000) { // High-value project
        score += 20;
      }

      if (budgetAmount >= 100000) { // Premium project
        score += 10;
      }

      // Calculate budget to value ratio (simplified)
      const estimatedProjectValue = this.estimateProjectValue(request.product);
      details.budgetToValueRatio = budgetAmount / estimatedProjectValue;
    }

    return { score: Math.min(score, 100), details };
  }

  /**
   * Parse budget amount from string
   */
  private parseBudgetAmount(budgetStr: string): number {
    // Remove $ and commas, extract number
    const cleanBudget = budgetStr.replace(/[$,]/g, '');
    const amount = parseFloat(cleanBudget);
    return isNaN(amount) ? 0 : amount;
  }

  /**
   * Estimate project value based on product type
   */
  private estimateProjectValue(product: string): number {
    const productValues: Record<string, number> = {
      'Kitchen Renovation': 75000,
      'Bathroom Renovation': 45000,
      'Full Home Renovation': 150000,
      'Commercial': 200000,
      'Outdoor Living': 35000,
      'General': 50000
    };

    return productValues[product] || 50000;
  }

  /**
   * Calculate project complexity score
   */
  private calculateProjectComplexity(request: any): { score: number; details: any } {
    const product = request.product || 'General';
    
    // Define complexity levels
    const complexityMap: Record<string, { level: string; baseScore: number; duration: number; skills: string[] }> = {
      'Kitchen Renovation': { 
        level: 'moderate', 
        baseScore: 70, 
        duration: 4, 
        skills: ['design', 'plumbing', 'electrical'] 
      },
      'Bathroom Renovation': { 
        level: 'moderate', 
        baseScore: 65, 
        duration: 3, 
        skills: ['design', 'plumbing', 'tiling'] 
      },
      'Full Home Renovation': { 
        level: 'complex', 
        baseScore: 90, 
        duration: 12, 
        skills: ['design', 'project_management', 'multiple_trades'] 
      },
      'Commercial': { 
        level: 'complex', 
        baseScore: 85, 
        duration: 8, 
        skills: ['commercial_design', 'project_management', 'permits'] 
      },
      'Outdoor Living': { 
        level: 'simple', 
        baseScore: 60, 
        duration: 2, 
        skills: ['landscape_design', 'construction'] 
      },
      'General': { 
        level: 'simple', 
        baseScore: 50, 
        duration: 1, 
        skills: ['general'] 
      }
    };

    const complexity = complexityMap[product] || complexityMap['General'];
    
    // Adjust score based on budget (higher budget often means luxury/complex)
    let score = complexity.baseScore;
    const budgetAmount = this.parseBudgetAmount(request.budget || '0');
    
    if (budgetAmount > 100000) {
      score = Math.min(score + 15, 100); // Luxury project bonus
    } else if (budgetAmount < 25000) {
      score = Math.max(score - 10, 30); // Simple project reduction
    }

    const details = {
      productType: product,
      complexityLevel: complexity.level as 'simple' | 'moderate' | 'complex' | 'luxury',
      skillRequirements: complexity.skills,
      estimatedDuration: complexity.duration
    };

    return { score, details };
  }

  /**
   * Calculate geographic fit score
   */
  private async calculateGeographicFit(request: any): Promise<{ score: number; details: any }> {
    const details = {
      inServiceArea: true, // Default assumption
      distanceFromOffice: 15, // Default miles
      localMarketStrength: 0.8, // Default market strength
      territoryAssignment: 'General'
    };

    let score = 70; // Base score for being in general area

    // For now, use simplified geographic scoring
    // In real implementation, would use actual address and geographic analysis
    
    if (request.addressId) {
      // Property address exists
      score += 20;
      
      // Could integrate with geographic services to calculate:
      // - Actual distance from office
      // - Market strength in that area
      // - Territory assignment optimization
    }

    // Bonus for Bay Area (premium market)
    if (request.city?.toLowerCase().includes('san francisco') || 
        request.city?.toLowerCase().includes('oakland') ||
        request.city?.toLowerCase().includes('berkeley')) {
      score += 10;
      details.localMarketStrength = 0.95;
      details.territoryAssignment = 'Bay Area Premium';
    }

    return { score: Math.min(score, 100), details };
  }

  /**
   * Calculate urgency indicators score
   */
  private calculateUrgencyIndicators(request: any): { score: number; details: any } {
    const details = {
      requestedTimeframe: 'flexible',
      competitiveMarket: true,
      seasonalFactors: 0.8,
      clientAvailability: 0.7
    };

    let score = 50; // Base score

    // Check for urgency in message
    const message = (request.message || '').toLowerCase();
    const urgencyKeywords = ['urgent', 'asap', 'quickly', 'soon', 'immediate', 'fast'];
    const hasUrgencyKeywords = urgencyKeywords.some(keyword => message.includes(keyword));
    
    if (hasUrgencyKeywords) {
      score += 25;
      details.requestedTimeframe = 'urgent';
    }

    // Check for meeting request (indicates ready to move forward)
    if (request.requestedVisitDateTime) {
      score += 15;
      details.clientAvailability = 0.9;
    }

    // Seasonal factors (construction season)
    const month = new Date().getMonth();
    if (month >= 3 && month <= 9) { // April to October (construction season)
      score += 10;
      details.seasonalFactors = 0.9;
    }

    return { score: Math.min(score, 100), details };
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedScore(factors: ScoringFactors): number {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.values(factors).forEach(factor => {
      weightedSum += factor.score * factor.weight;
      totalWeight += factor.weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate grade based on score
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Calculate priority level
   */
  private calculatePriorityLevel(score: number, factors: ScoringFactors): 'urgent' | 'high' | 'medium' | 'low' {
    // Check for urgent indicators
    if (factors.urgencyIndicators.details.requestedTimeframe === 'urgent' && score >= 70) {
      return 'urgent';
    }
    
    if (score >= 85) return 'high';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Calculate conversion probability
   */
  private calculateConversionProbability(score: number, factors: ScoringFactors): number {
    // Base probability from score
    let probability = score / 100 * 0.6; // Max 60% from score alone

    // Source quality bonus
    probability += factors.sourceQuality.details.historicalConversionRate * 0.3;

    // Engagement bonus
    if (factors.engagementLevel.details.hasAttachments) {
      probability += 0.05;
    }
    
    if (factors.engagementLevel.details.requestedMeeting) {
      probability += 0.1;
    }

    // Budget alignment bonus
    if (factors.budgetAlignment.details.isRealistic) {
      probability += 0.05;
    }

    return Math.min(probability, 0.95); // Cap at 95%
  }

  /**
   * Generate recommendations based on scoring factors
   */
  private generateRecommendations(factors: ScoringFactors, overallScore: number): string[] {
    const recommendations: string[] = [];

    // Data completeness recommendations
    if (factors.dataCompleteness.score < 70) {
      if (!factors.dataCompleteness.details.hasBudget) {
        recommendations.push('Gather budget information to better qualify lead');
      }
      if (!factors.dataCompleteness.details.hasPropertyDetails) {
        recommendations.push('Collect complete property details for accurate scoping');
      }
    }

    // Engagement recommendations
    if (factors.engagementLevel.score < 60) {
      recommendations.push('Increase engagement with follow-up questions about project vision');
    }

    // Budget recommendations
    if (!factors.budgetAlignment.details.isRealistic) {
      recommendations.push('Discuss budget expectations and project scope alignment');
    }

    // Urgency recommendations
    if (factors.urgencyIndicators.score > 70) {
      recommendations.push('Priority lead - schedule meeting ASAP');
    }

    // Overall score recommendations
    if (overallScore >= 80) {
      recommendations.push('High-quality lead - prioritize immediate follow-up');
    } else if (overallScore < 50) {
      recommendations.push('Qualify lead further before investing significant time');
    }

    return recommendations.length > 0 ? recommendations : ['Lead ready for standard follow-up process'];
  }

  /**
   * Get lead score (cached or calculate new)
   */
  async getLeadScore(requestId: string): Promise<LeadScore> {
    // Check cache first
    const cached = this.scoreCache.get(requestId);
    if (cached && this.isCacheValid(cached.lastCalculated)) {
      return cached;
    }

    // Calculate new score
    return await this.calculateLeadScore(requestId);
  }

  /**
   * Calculate quality metrics for a lead
   */
  async calculateQualityMetrics(requestId: string): Promise<QualityMetrics> {
    const leadScore = await this.getLeadScore(requestId);
    const factors = leadScore.factors;

    const completenessScore = factors.dataCompleteness.score;
    const engagementScore = factors.engagementLevel.score;
    const viabilityScore = (factors.budgetAlignment.score + factors.geographicFit.score) / 2;
    const urgencyScore = factors.urgencyIndicators.score;

    // Calculate quality grade
    const avgScore = (completenessScore + engagementScore + viabilityScore + urgencyScore) / 4;
    let qualityGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
    
    if (avgScore >= 95) qualityGrade = 'A+';
    else if (avgScore >= 90) qualityGrade = 'A';
    else if (avgScore >= 85) qualityGrade = 'B+';
    else if (avgScore >= 80) qualityGrade = 'B';
    else if (avgScore >= 75) qualityGrade = 'C+';
    else if (avgScore >= 70) qualityGrade = 'C';
    else if (avgScore >= 60) qualityGrade = 'D';
    else qualityGrade = 'F';

    // Identify risk and strength factors
    const riskFactors: string[] = [];
    const strengthFactors: string[] = [];

    if (completenessScore < 60) riskFactors.push('Incomplete information');
    if (engagementScore < 50) riskFactors.push('Low engagement level');
    if (viabilityScore < 60) riskFactors.push('Budget or location concerns');
    if (factors.sourceQuality.details.historicalConversionRate < 0.2) riskFactors.push('Low-performing source');

    if (completenessScore > 80) strengthFactors.push('Complete information provided');
    if (engagementScore > 70) strengthFactors.push('High engagement level');
    if (viabilityScore > 80) strengthFactors.push('Strong budget and location fit');
    if (urgencyScore > 70) strengthFactors.push('Time-sensitive opportunity');

    return {
      completenessScore,
      engagementScore,
      viabilityScore,
      urgencyScore,
      qualityGrade,
      riskFactors,
      strengthFactors
    };
  }

  /**
   * Get conversion prediction for a lead
   */
  async getConversionPrediction(requestId: string): Promise<ConversionPrediction> {
    const leadScore = await this.getLeadScore(requestId);
    const probability = leadScore.conversionProbability;
    
    // Calculate confidence based on data completeness and source reliability
    const dataCompleteness = leadScore.factors.dataCompleteness.score / 100;
    const sourceReliability = leadScore.factors.sourceQuality.details.sourceReliability;
    const confidence = (dataCompleteness + sourceReliability) / 2;

    // Estimate time to conversion
    const urgencyFactor = leadScore.factors.urgencyIndicators.score / 100;
    const baseTimeToConversion = 14; // days
    const timeToConversion = Math.max(3, baseTimeToConversion * (1 - urgencyFactor * 0.5));

    // Estimate value
    const budgetAmount = this.parseBudgetAmount(leadScore.factors.budgetAlignment.details.budgetRange);
    const valueEstimate = budgetAmount > 0 ? budgetAmount : this.estimateProjectValue(
      leadScore.factors.projectComplexity.details.productType
    );

    return {
      probability,
      confidence,
      timeToConversion,
      valueEstimate,
      riskFactors: leadScore.recommendations.filter(r => r.includes('concern') || r.includes('risk')),
      successFactors: leadScore.recommendations.filter(r => r.includes('quality') || r.includes('priority')),
      recommendedActions: leadScore.recommendations
    };
  }

  /**
   * Batch calculate scores for multiple leads
   */
  async batchCalculateScores(requestIds: string[]): Promise<LeadScore[]> {
    const scores: LeadScore[] = [];
    
    for (const requestId of requestIds) {
      try {
        const score = await this.getLeadScore(requestId);
        scores.push(score);
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        logger.error('Error calculating score in batch', { requestId, error });
      }
    }

    return scores;
  }

  /**
   * Get source performance metrics
   */
  getSourcePerformanceMetrics(): SourcePerformanceMetrics[] {
    return Array.from(this.sourceMetricsCache.values());
  }

  /**
   * Update scoring weights
   */
  updateScoringWeights(newWeights: Partial<ScoringWeights>): void {
    this.scoringWeights = { ...this.scoringWeights, ...newWeights };
    
    // Clear score cache since weights changed
    this.scoreCache.clear();
    
    logger.info('Scoring weights updated', this.scoringWeights);
  }

  /**
   * Get current scoring weights
   */
  getScoringWeights(): ScoringWeights {
    return { ...this.scoringWeights };
  }

  /**
   * Check if cached score is still valid
   */
  private isCacheValid(lastCalculated: string): boolean {
    const cacheAge = Date.now() - new Date(lastCalculated).getTime();
    return cacheAge < this.CACHE_TTL;
  }

  /**
   * Clear scoring cache
   */
  clearCache(): void {
    this.scoreCache.clear();
    logger.info('Lead scoring cache cleared');
  }
}

// Export singleton instance
export const leadScoringService = new LeadScoringService();
export default leadScoringService;