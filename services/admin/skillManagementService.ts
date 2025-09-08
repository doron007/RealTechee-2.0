import { contactsAPI, backOfficeAssignToAPI } from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';

const logger = createLogger('SkillManagementService');

// Skill and specialization interfaces
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description?: string;
  level: number; // 1-5 (Beginner to Expert)
  certifications?: string[];
  active: boolean;
  created: string;
  updated: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  type: 'product' | 'expertise' | 'certification' | 'territory' | 'client_type';
  order: number;
  color?: string;
}

export interface AssigneeSkillProfile {
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  skills: AssigneeSkill[];
  specializations: Specialization[];
  certifications: Certification[];
  experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
  lastUpdated: string;
}

export interface AssigneeSkill {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  proficiencyLevel: number; // 1-5
  experienceYears?: number;
  lastUsed?: string;
  certificationDate?: string;
  notes?: string;
}

export interface Specialization {
  id: string;
  name: string;
  category: string;
  description: string;
  requirements: SkillRequirement[];
  benefits: string[];
  active: boolean;
}

export interface SkillRequirement {
  skillId: string;
  skillName: string;
  minimumLevel: number;
  required: boolean;
  weight: number; // For scoring
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  level: string;
  verificationId?: string;
  attachmentUrl?: string;
}

export interface SkillMatchRequest {
  requestType: string;
  product?: string;
  clientType?: string;
  budget?: number;
  location?: {
    city?: string;
    state?: string;
    zipCode?: string;
  };
  complexity: 'low' | 'medium' | 'high' | 'expert';
  timeframe: 'immediate' | 'urgent' | 'normal' | 'flexible';
  specialRequirements?: string[];
}

export interface SkillMatchResult {
  assigneeId: string;
  assigneeName: string;
  matchScore: number; // 0-1
  matchingSkills: Array<{
    skillId: string;
    skillName: string;
    requiredLevel: number;
    actualLevel: number;
    match: boolean;
  }>;
  missingSkills: Array<{
    skillId: string;
    skillName: string;
    requiredLevel: number;
  }>;
  specializations: string[];
  recommendations: string[];
}

/**
 * Skill Management Service - Manages skills, specializations, and matching
 */
export class SkillManagementService {
  private skillsCache: Map<string, Skill> = new Map();
  private categoriesCache: Map<string, SkillCategory> = new Map();
  private assigneeSkillsCache: Map<string, AssigneeSkillProfile> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.initializeDefaultSkills();
  }

  /**
   * Initialize default skill categories and skills
   */
  private async initializeDefaultSkills(): Promise<void> {
    try {
      // Default skill categories
      const defaultCategories: SkillCategory[] = [
        { id: 'product', name: 'Product Specialization', type: 'product', order: 1, color: '#2196F3' },
        { id: 'expertise', name: 'Technical Expertise', type: 'expertise', order: 2, color: '#4CAF50' },
        { id: 'certification', name: 'Certifications', type: 'certification', order: 3, color: '#FF9800' },
        { id: 'territory', name: 'Territory Knowledge', type: 'territory', order: 4, color: '#9C27B0' },
        { id: 'client_type', name: 'Client Specialization', type: 'client_type', order: 5, color: '#F44336' }
      ];

      // Default skills
      const defaultSkills: Skill[] = [
        // Product Specialization
        { id: 'kitchen_renovation', name: 'Kitchen Renovation', category: defaultCategories[0], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'bathroom_renovation', name: 'Bathroom Renovation', category: defaultCategories[0], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'full_home_renovation', name: 'Full Home Renovation', category: defaultCategories[0], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'commercial_renovation', name: 'Commercial Renovation', category: defaultCategories[0], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'outdoor_living', name: 'Outdoor Living Spaces', category: defaultCategories[0], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        
        // Technical Expertise
        { id: 'project_management', name: 'Project Management', category: defaultCategories[1], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'design_consultation', name: 'Design Consultation', category: defaultCategories[1], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'cost_estimation', name: 'Cost Estimation', category: defaultCategories[1], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'permit_process', name: 'Permit & Regulatory Process', category: defaultCategories[1], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'vendor_management', name: 'Vendor Management', category: defaultCategories[1], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        
        // Territory Knowledge
        { id: 'bay_area', name: 'San Francisco Bay Area', category: defaultCategories[3], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'los_angeles', name: 'Los Angeles Area', category: defaultCategories[3], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'sacramento', name: 'Sacramento Region', category: defaultCategories[3], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        
        // Client Specialization
        { id: 'luxury_clients', name: 'Luxury Home Clients', category: defaultCategories[4], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'first_time_renovators', name: 'First-Time Renovators', category: defaultCategories[4], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() },
        { id: 'investment_properties', name: 'Investment Properties', category: defaultCategories[4], level: 1, active: true, created: new Date().toISOString(), updated: new Date().toISOString() }
      ];

      // Cache the default data
      defaultCategories.forEach(category => {
        this.categoriesCache.set(category.id, category);
      });

      defaultSkills.forEach(skill => {
        this.skillsCache.set(skill.id, skill);
      });

      logger.info('Default skills and categories initialized', {
        categories: defaultCategories.length,
        skills: defaultSkills.length
      });

    } catch (error) {
      logger.error('Error initializing default skills', error);
    }
  }

  /**
   * Get all available skills
   */
  async getAvailableSkills(): Promise<Skill[]> {
    if (this.isCacheExpired()) {
      await this.refreshSkillCache();
    }

    return Array.from(this.skillsCache.values()).filter(skill => skill.active);
  }

  /**
   * Get skill categories
   */
  async getSkillCategories(): Promise<SkillCategory[]> {
    if (this.isCacheExpired()) {
      await this.refreshSkillCache();
    }

    return Array.from(this.categoriesCache.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get assignee skill profile
   */
  async getAssigneeSkillProfile(assigneeId: string): Promise<AssigneeSkillProfile | null> {
    try {
      if (this.isCacheExpired()) {
        await this.refreshAssigneeSkillCache();
      }

      return this.assigneeSkillsCache.get(assigneeId) || null;

    } catch (error) {
      logger.error('Error getting assignee skill profile', { assigneeId, error });
      return null;
    }
  }

  /**
   * Update assignee skill profile
   */
  async updateAssigneeSkillProfile(
    assigneeId: string, 
    skillUpdates: Partial<AssigneeSkillProfile>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existingProfile = await this.getAssigneeSkillProfile(assigneeId);
      
      const updatedProfile: AssigneeSkillProfile = {
        ...existingProfile,
        ...skillUpdates,
        assigneeId,
        lastUpdated: new Date().toISOString()
      } as AssigneeSkillProfile;

      // In a real implementation, this would save to the database
      this.assigneeSkillsCache.set(assigneeId, updatedProfile);

      logger.info('Assignee skill profile updated', { assigneeId });
      return { success: true };

    } catch (error) {
      logger.error('Error updating assignee skill profile', { assigneeId, error });
      return { success: false, error: 'Failed to update skill profile' };
    }
  }

  /**
   * Match assignees to skill requirements
   */
  async matchAssigneesToSkills(
    matchRequest: SkillMatchRequest,
    assigneeIds?: string[]
  ): Promise<SkillMatchResult[]> {
    try {
      logger.info('Starting skill matching', { 
        requestType: matchRequest.requestType,
        complexity: matchRequest.complexity 
      });

      // Get assignees to evaluate
      const targetAssignees = assigneeIds || Array.from(this.assigneeSkillsCache.keys());
      
      const results: SkillMatchResult[] = [];

      for (const assigneeId of targetAssignees) {
        const profile = await this.getAssigneeSkillProfile(assigneeId);
        if (!profile) continue;

        const matchResult = await this.calculateSkillMatch(profile, matchRequest);
        results.push(matchResult);
      }

      // Sort by match score (highest first)
      results.sort((a, b) => b.matchScore - a.matchScore);

      logger.info('Skill matching completed', { 
        totalAssignees: results.length,
        bestMatch: results[0]?.matchScore.toFixed(2) || 'none'
      });

      return results;

    } catch (error) {
      logger.error('Error in skill matching', error);
      return [];
    }
  }

  /**
   * Calculate skill match score for an assignee
   */
  private async calculateSkillMatch(
    profile: AssigneeSkillProfile,
    matchRequest: SkillMatchRequest
  ): Promise<SkillMatchResult> {
    // Determine required skills based on request
    const requiredSkills = this.determineRequiredSkills(matchRequest);
    
    let totalScore = 0;
    let weightSum = 0;
    const matchingSkills: any[] = [];
    const missingSkills: any[] = [];

    // Evaluate each required skill
    for (const required of requiredSkills) {
      const assigneeSkill = profile.skills.find(s => s.skillId === required.skillId);
      
      if (assigneeSkill) {
        const levelMatch = Math.min(assigneeSkill.proficiencyLevel / required.minimumLevel, 1);
        totalScore += levelMatch * required.weight;
        
        matchingSkills.push({
          skillId: required.skillId,
          skillName: required.skillName,
          requiredLevel: required.minimumLevel,
          actualLevel: assigneeSkill.proficiencyLevel,
          match: assigneeSkill.proficiencyLevel >= required.minimumLevel
        });
      } else {
        missingSkills.push({
          skillId: required.skillId,
          skillName: required.skillName,
          requiredLevel: required.minimumLevel
        });
        
        if (required.required) {
          // Severe penalty for missing required skills
          totalScore -= required.weight * 0.5;
        }
      }
      
      weightSum += required.weight;
    }

    // Normalize score
    const matchScore = weightSum > 0 ? Math.max(0, Math.min(1, totalScore / weightSum)) : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(profile, matchRequest, missingSkills);

    return {
      assigneeId: profile.assigneeId,
      assigneeName: profile.assigneeName,
      matchScore,
      matchingSkills,
      missingSkills,
      specializations: profile.specializations.map(s => s.name),
      recommendations
    };
  }

  /**
   * Determine required skills based on match request
   */
  private determineRequiredSkills(matchRequest: SkillMatchRequest): SkillRequirement[] {
    const skills: SkillRequirement[] = [];

    // Product-based skills
    if (matchRequest.product) {
      const productSkillMap: Record<string, { skillId: string; level: number }> = {
        'Kitchen Renovation': { skillId: 'kitchen_renovation', level: 3 },
        'Bathroom Renovation': { skillId: 'bathroom_renovation', level: 3 },
        'Full Home Renovation': { skillId: 'full_home_renovation', level: 4 },
        'Commercial': { skillId: 'commercial_renovation', level: 4 },
        'Outdoor Living': { skillId: 'outdoor_living', level: 3 }
      };

      const productSkill = productSkillMap[matchRequest.product];
      if (productSkill) {
        skills.push({
          skillId: productSkill.skillId,
          skillName: matchRequest.product,
          minimumLevel: productSkill.level,
          required: true,
          weight: 1.0
        });
      }
    }

    // Complexity-based skills
    const complexityLevel = {
      'low': 2,
      'medium': 3,
      'high': 4,
      'expert': 5
    }[matchRequest.complexity] || 2;

    skills.push({
      skillId: 'project_management',
      skillName: 'Project Management',
      minimumLevel: complexityLevel,
      required: true,
      weight: 0.8
    });

    // Budget-based skills
    if (matchRequest.budget && matchRequest.budget > 75000) {
      skills.push({
        skillId: 'luxury_clients',
        skillName: 'Luxury Home Clients',
        minimumLevel: 3,
        required: false,
        weight: 0.6
      });
    }

    // Location-based skills
    if (matchRequest.location?.city) {
      const citySkillMap: Record<string, string> = {
        'San Francisco': 'bay_area',
        'Oakland': 'bay_area',
        'San Jose': 'bay_area',
        'Los Angeles': 'los_angeles',
        'Sacramento': 'sacramento'
      };

      const territorySkill = citySkillMap[matchRequest.location.city];
      if (territorySkill) {
        skills.push({
          skillId: territorySkill,
          skillName: `${matchRequest.location.city} Territory`,
          minimumLevel: 2,
          required: false,
          weight: 0.4
        });
      }
    }

    return skills;
  }

  /**
   * Generate recommendations for improving match
   */
  private generateRecommendations(
    profile: AssigneeSkillProfile,
    matchRequest: SkillMatchRequest,
    missingSkills: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (missingSkills.length > 0) {
      recommendations.push(`Consider developing skills in: ${missingSkills.map(s => s.skillName).join(', ')}`);
    }

    if (matchRequest.complexity === 'expert' && profile.experienceLevel !== 'expert') {
      recommendations.push('This request requires expert-level experience');
    }

    if (matchRequest.budget && matchRequest.budget > 100000) {
      const hasLuxurySkill = profile.skills.some(s => s.skillId === 'luxury_clients');
      if (!hasLuxurySkill) {
        recommendations.push('Consider gaining experience with luxury home projects');
      }
    }

    return recommendations;
  }

  /**
   * Refresh skill cache from database
   */
  private async refreshSkillCache(): Promise<void> {
    try {
      // In a real implementation, this would load from database
      // For now, we rely on the initialized default skills
      this.cacheTimestamp = Date.now();
      
      logger.info('Skill cache refreshed');

    } catch (error) {
      logger.error('Error refreshing skill cache', error);
    }
  }

  /**
   * Refresh assignee skill cache from database
   */
  private async refreshAssigneeSkillCache(): Promise<void> {
    try {
      // Get all AEs and create basic skill profiles
      const aesResult = await backOfficeAssignToAPI.list();
      if (!aesResult.success) {
        logger.warn('Failed to fetch AEs for skill cache');
        return;
      }

      this.assigneeSkillsCache.clear();

      for (const ae of aesResult.data) {
        // Create basic skill profile for each AE
        const basicProfile: AssigneeSkillProfile = {
          assigneeId: ae.id,
          assigneeName: ae.name || 'Unknown',
          assigneeEmail: ae.email || '',
          skills: this.getDefaultSkillsForAE(ae),
          specializations: [],
          certifications: [],
          experienceLevel: this.determineExperienceLevel(ae),
          lastUpdated: new Date().toISOString()
        };

        this.assigneeSkillsCache.set(ae.id, basicProfile);
      }

      this.cacheTimestamp = Date.now();
      logger.info('Assignee skill cache refreshed', { count: this.assigneeSkillsCache.size });

    } catch (error) {
      logger.error('Error refreshing assignee skill cache', error);
    }
  }

  /**
   * Get default skills for an AE based on their profile
   */
  private getDefaultSkillsForAE(ae: any): AssigneeSkill[] {
    const baseLevel = Math.max(1, 6 - (ae.order || 5)); // Lower order = higher skill level
    const categories = Array.from(this.categoriesCache.values());

    return [
      {
        skillId: 'kitchen_renovation',
        skillName: 'Kitchen Renovation',
        category: categories.find(c => c.id === 'product')!,
        proficiencyLevel: baseLevel,
        experienceYears: Math.max(1, baseLevel - 1)
      },
      {
        skillId: 'bathroom_renovation',
        skillName: 'Bathroom Renovation',
        category: categories.find(c => c.id === 'product')!,
        proficiencyLevel: baseLevel,
        experienceYears: Math.max(1, baseLevel - 1)
      },
      {
        skillId: 'project_management',
        skillName: 'Project Management',
        category: categories.find(c => c.id === 'expertise')!,
        proficiencyLevel: baseLevel,
        experienceYears: Math.max(1, baseLevel - 1)
      },
      {
        skillId: 'cost_estimation',
        skillName: 'Cost Estimation',
        category: categories.find(c => c.id === 'expertise')!,
        proficiencyLevel: Math.max(1, baseLevel - 1),
        experienceYears: Math.max(1, baseLevel - 2)
      }
    ];
  }

  /**
   * Determine experience level based on AE profile
   */
  private determineExperienceLevel(ae: any): 'junior' | 'mid' | 'senior' | 'expert' {
    const order = ae.order || 5;
    
    if (order <= 2) return 'expert';
    if (order <= 4) return 'senior';
    if (order <= 6) return 'mid';
    return 'junior';
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
    await this.refreshSkillCache();
    await this.refreshAssigneeSkillCache();
  }
}

// Export singleton instance
export const skillManagementService = new SkillManagementService();
export default skillManagementService;