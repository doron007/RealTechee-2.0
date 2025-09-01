/**
 * Project service implementation
 * Handles all business logic for Project entities
 */

import { BaseService, RequiredFieldRule } from '../core/BaseService';
import { IBusinessService, ServiceResult, BusinessState } from '../interfaces/IBaseService';
import { projectRepository, ProjectRepository, Project, ProjectFilter, ProjectCreateInput } from '../../repositories/ProjectRepository';
import { requestRepository } from '../../repositories/RequestRepository';
import { quoteRepository } from '../../repositories/QuoteRepository';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ProjectService');

// Enhanced project types for business logic
export interface EnhancedProject extends Project {
  // Computed business fields
  ageDays?: number;
  daysToCompletion?: number;
  isOverdue?: boolean;
  isAtRisk?: boolean;
  progressPercentage?: number;
  budgetVariance?: number;
  budgetVariancePercentage?: number;
  
  // Related entity summaries
  requestSummary?: {
    id: string;
    status: string;
    message: string;
  };
  quoteSummary?: {
    id: string;
    quoteNumber: string;
    totalAmount: number;
  };
  
  // Business metrics
  profitability?: 'profitable' | 'break-even' | 'loss';
  riskLevel?: 'low' | 'medium' | 'high';
  clientSatisfactionScore?: number;
}

export interface ProjectBusinessFilter extends ProjectFilter {
  isOverdue?: boolean;
  isAtRisk?: boolean;
  progressRange?: {
    min: number;
    max: number;
  };
  budgetVarianceRange?: {
    min: number;
    max: number;
  };
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface ProjectCreateData extends ProjectCreateInput {
  // Business-specific fields
  estimatedDuration?: number; // in days
  teamMembers?: string[];
  milestones?: Array<{
    title: string;
    description?: string;
    dueDate: string;
    dependencies?: string[];
  }>;
  
  // Budget breakdown
  laborBudget?: string;
  materialBudget?: string;
  equipmentBudget?: string;
  contingencyPercentage?: number;
}

// Project status workflow
const PROJECT_STATUSES = {
  PLANNING: 'Planning',
  APPROVED: 'Approved',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  REVIEW: 'Under Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ARCHIVED: 'Archived'
} as const;

export class ProjectService extends BaseService<Project, ProjectBusinessFilter, ProjectCreateData, Partial<Project>, ProjectRepository> 
  implements IBusinessService<Project, ProjectBusinessFilter> {
  
  protected repository = projectRepository;
  protected entityName = 'Project';

  constructor() {
    super();
    this.setupValidationRules();
  }

  private setupValidationRules() {
    // Core validation rules
    this.addValidationRule(new RequiredFieldRule('title', 'title', 'Title'));
    
    // Business-specific validation rules
    this.addValidationRule({
      name: 'budgetValidation',
      async validate(data: any) {
        if (!data.budget) return { valid: true, errors: [] };
        
        const budget = String(data.budget).replace(/[,$]/g, '');
        const isNumeric = /^\d+$/.test(budget);
        const amount = parseFloat(budget);
        
        const errors = [];
        if (!isNumeric) {
          errors.push({
            field: 'budget',
            message: 'Budget must be a valid number',
            code: 'INVALID_BUDGET'
          });
        } else if (amount <= 0) {
          errors.push({
            field: 'budget',
            message: 'Budget must be greater than zero',
            code: 'INVALID_BUDGET_AMOUNT'
          });
        }
        
        return { valid: errors.length === 0, errors };
      }
    });

    this.addValidationRule({
      name: 'dateValidation',
      async validate(data: any) {
        const errors = [];
        
        if (data.startDate && data.completionDate) {
          const startDate = new Date(data.startDate);
          const completionDate = new Date(data.completionDate);
          
          if (completionDate <= startDate) {
            errors.push({
              field: 'completionDate',
              message: 'Completion date must be after start date',
              code: 'INVALID_DATE_RANGE'
            });
          }
        }
        
        return { valid: errors.length === 0, errors };
      }
    });
  }

  // Enhanced CRUD operations with business logic
  async create(data: ProjectCreateData): Promise<ServiceResult<EnhancedProject>> {
    try {
      logger.info('Creating project with business logic', { data });
      
      // Set default status if not provided
      if (!data.status) {
        data.status = PROJECT_STATUSES.PLANNING;
      }
      
      // Calculate total budget from components if provided
      if (data.laborBudget || data.materialBudget || data.equipmentBudget) {
        const totalBudget = this.calculateTotalBudget(data);
        if (totalBudget > 0) {
          data.budget = totalBudget.toString();
        }
      }
      
      // Use base service create
      const result = await super.create(data);
      
      if (!result.success) {
        return result as ServiceResult<EnhancedProject>;
      }
      
      // Create project milestones if provided
      if (data.milestones) {
        await this.createProjectMilestones(result.data!.id, data.milestones);
      }
      
      // Enhance the result with business data
      const enhanced = await this.enhanceProject(result.data!);
      
      return {
        success: true,
        data: enhanced,
        warnings: result.warnings
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in ProjectService.create', { error: errorMessage });
      return { success: false, error: `Failed to create project: ${errorMessage}` };
    }
  }

  async findById(id: string): Promise<ServiceResult<EnhancedProject>> {
    const result = await super.findById(id);
    if (!result.success) {
      return result as ServiceResult<EnhancedProject>;
    }
    
    const enhanced = await this.enhanceProject(result.data!);
    return { ...result, data: enhanced };
  }

  async findAll(options = {}): Promise<ServiceResult<EnhancedProject[]>> {
    const result = await super.findAll(options);
    if (!result.success) {
      return result as ServiceResult<EnhancedProject[]>;
    }
    
    const enhanced = await Promise.all(
      (result.data || []).map(project => this.enhanceProject(project))
    );
    
    return { ...result, data: enhanced };
  }

  // Business workflow operations
  async processWorkflow(id: string, action: string, data?: any): Promise<ServiceResult<EnhancedProject>> {
    try {
      logger.info('Processing project workflow', { id, action, data });
      
      const currentProject = await this.repository.findById(id);
      if (!currentProject.success || !currentProject.data) {
        return { success: false, error: 'Project not found' };
      }
      
      const current = currentProject.data;
      const updates = await this.calculateWorkflowUpdates(current, action, data);
      
      if (!updates) {
        return { success: false, error: `Invalid workflow action: ${action}` };
      }
      
      const result = await this.update(id, updates);
      
      // Trigger business notifications
      if (result.success) {
        await this.triggerWorkflowNotifications(id, action, result.data!);
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in project workflow processing', { id, action, error: errorMessage });
      return { success: false, error: `Project workflow processing failed: ${errorMessage}` };
    }
  }

  async getBusinessState(id: string): Promise<ServiceResult<BusinessState>> {
    try {
      const result = await this.repository.findById(id);
      if (!result.success || !result.data) {
        return { success: false, error: 'Project not found' };
      }
      
      const project = result.data;
      const businessState: BusinessState = {
        status: project.status || PROJECT_STATUSES.PLANNING,
        stage: this.calculateStage(project),
        nextActions: this.getNextActions(project),
        blockedActions: this.getBlockedActions(project),
        metadata: {
          ageDays: this.calculateAgeDays(project),
          progressPercentage: this.calculateProgressPercentage(project),
          isOverdue: this.calculateIsOverdue(project),
          riskLevel: this.calculateRiskLevel(project)
        }
      };
      
      return { success: true, data: businessState };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting project business state', { id, error: errorMessage });
      return { success: false, error: `Failed to get project business state: ${errorMessage}` };
    }
  }

  async updateBusinessState(id: string, state: Partial<BusinessState>): Promise<ServiceResult<EnhancedProject>> {
    const updates: Partial<Project> = {};
    
    if (state.status) {
      updates.status = state.status;
    }
    
    return this.update(id, updates);
  }

  getBusinessRules() {
    return [
      {
        name: 'PreventCompletionWithoutAllMilestones',
        description: 'Projects cannot be completed until all milestones are finished',
        condition: (project: Project) => true, // Would check milestone status
        action: async (project: Project) => {
          // Logic to verify all milestones are complete
        }
      },
      {
        name: 'RequireApprovalForBudgetIncrease',
        description: 'Budget increases over 10% require approval',
        condition: (project: Project) => true, // Would check budget variance
        action: async (project: Project) => {
          // Logic to require approval
        }
      }
    ];
  }

  async checkPermissions(action: string, userId?: string): Promise<boolean> {
    // Implement permission checking based on user roles and project status
    return true; // Simplified for now
  }

  // Business-specific methods
  async findOverdueProjects(): Promise<ServiceResult<EnhancedProject[]>> {
    return this.findAll({ filter: { isOverdue: true } });
  }

  async findAtRiskProjects(): Promise<ServiceResult<EnhancedProject[]>> {
    return this.findAll({ filter: { isAtRisk: true } });
  }

  async findByStatus(status: string): Promise<ServiceResult<EnhancedProject[]>> {
    return this.findAll({ filter: { status } });
  }

  async getProjectMetrics(id: string): Promise<ServiceResult<ProjectMetrics>> {
    try {
      const result = await this.repository.findById(id);
      if (!result.success || !result.data) {
        return { success: false, error: 'Project not found' };
      }
      
      const project = result.data;
      const metrics: ProjectMetrics = {
        budgetUtilization: this.calculateBudgetUtilization(project),
        schedulePerformance: this.calculateSchedulePerformance(project),
        qualityMetrics: await this.calculateQualityMetrics(project),
        riskAssessment: this.calculateRiskAssessment(project),
        teamPerformance: await this.calculateTeamPerformance(project.id)
      };
      
      return { success: true, data: metrics };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting project metrics', { id, error: errorMessage });
      return { success: false, error: `Failed to get project metrics: ${errorMessage}` };
    }
  }

  // Private business logic methods
  private async enhanceProject(project: Project): Promise<EnhancedProject> {
    const enhanced: EnhancedProject = {
      ...project,
      ageDays: this.calculateAgeDays(project),
      daysToCompletion: this.calculateDaysToCompletion(project),
      isOverdue: this.calculateIsOverdue(project),
      isAtRisk: this.calculateIsAtRisk(project),
      progressPercentage: this.calculateProgressPercentage(project),
      budgetVariance: this.calculateBudgetVariance(project),
      budgetVariancePercentage: this.calculateBudgetVariancePercentage(project),
      profitability: this.calculateProfitability(project),
      riskLevel: this.calculateRiskLevel(project),
    };
    
    // Add related entity summaries
    if (project.requestId) {
      const requestResult = await requestRepository.findById(project.requestId);
      if (requestResult.success && requestResult.data) {
        const request = requestResult.data;
        enhanced.requestSummary = {
          id: request.id,
          status: request.status || 'Unknown',
          message: request.message || '',
        };
      }
    }
    
    if (project.quoteId) {
      const quoteResult = await quoteRepository.findById(project.quoteId);
      if (quoteResult.success && quoteResult.data) {
        const quote = quoteResult.data;
        enhanced.quoteSummary = {
          id: quote.id,
          quoteNumber: quote.quoteNumber || 'N/A',
          totalAmount: quote.totalAmount || 0,
        };
      }
    }
    
    return enhanced;
  }

  private calculateAgeDays(project: Project): number {
    if (!project.createdAt) return 0;
    const created = new Date(project.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateDaysToCompletion(project: Project): number {
    if (!project.completionDate) return Infinity;
    const completion = new Date(project.completionDate);
    const now = new Date();
    return Math.ceil((completion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateIsOverdue(project: Project): boolean {
    if (!project.completionDate || project.status === PROJECT_STATUSES.COMPLETED) {
      return false;
    }
    return this.calculateDaysToCompletion(project) < 0;
  }

  private calculateIsAtRisk(project: Project): boolean {
    const daysToCompletion = this.calculateDaysToCompletion(project);
    const progressPercentage = this.calculateProgressPercentage(project);
    const budgetVariancePercentage = this.calculateBudgetVariancePercentage(project);
    
    // At risk if: less than 14 days to completion but less than 80% complete
    // OR budget variance is over 15%
    return (
      (daysToCompletion < 14 && progressPercentage < 80) ||
      budgetVariancePercentage > 15
    );
  }

  private calculateProgressPercentage(project: Project): number {
    // This would typically be calculated from milestones or tasks
    // For now, use a simplified calculation based on status and dates
    
    if (project.status === PROJECT_STATUSES.COMPLETED) return 100;
    if (project.status === PROJECT_STATUSES.PLANNING) return 0;
    
    if (project.startDate && project.completionDate) {
      const start = new Date(project.startDate);
      const end = new Date(project.completionDate);
      const now = new Date();
      
      const totalDuration = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      
      const percentage = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
      return Math.round(percentage);
    }
    
    // Default progress based on status
    switch (project.status) {
      case PROJECT_STATUSES.APPROVED: return 10;
      case PROJECT_STATUSES.IN_PROGRESS: return 50;
      case PROJECT_STATUSES.REVIEW: return 85;
      default: return 0;
    }
  }

  private calculateBudgetVariance(project: Project): number {
    if (!project.budget || !project.actualCost) return 0;
    
    const budget = parseFloat(String(project.budget).replace(/[,$]/g, ''));
    const actual = project.actualCost;
    
    return actual - budget;
  }

  private calculateBudgetVariancePercentage(project: Project): number {
    if (!project.budget) return 0;
    
    const budget = parseFloat(String(project.budget).replace(/[,$]/g, ''));
    const variance = this.calculateBudgetVariance(project);
    
    return budget > 0 ? (variance / budget) * 100 : 0;
  }

  private calculateProfitability(project: Project): 'profitable' | 'break-even' | 'loss' {
    const variancePercentage = this.calculateBudgetVariancePercentage(project);
    
    if (variancePercentage > 5) return 'loss';
    if (variancePercentage > -5) return 'break-even';
    return 'profitable';
  }

  private calculateRiskLevel(project: Project): 'low' | 'medium' | 'high' {
    const isOverdue = this.calculateIsOverdue(project);
    const isAtRisk = this.calculateIsAtRisk(project);
    const budgetVariancePercentage = Math.abs(this.calculateBudgetVariancePercentage(project));
    
    if (isOverdue || budgetVariancePercentage > 25) return 'high';
    if (isAtRisk || budgetVariancePercentage > 15) return 'medium';
    return 'low';
  }

  private calculateStage(project: Project): string {
    const status = project.status;
    
    if ([PROJECT_STATUSES.PLANNING, PROJECT_STATUSES.APPROVED].includes(status as any)) {
      return 'Pre-Execution';
    } else if ([PROJECT_STATUSES.IN_PROGRESS, PROJECT_STATUSES.ON_HOLD].includes(status as any)) {
      return 'Execution';
    } else if (status === PROJECT_STATUSES.REVIEW) {
      return 'Review';
    } else if (status === PROJECT_STATUSES.COMPLETED) {
      return 'Complete';
    } else {
      return 'Closed';
    }
  }

  private getNextActions(project: Project): string[] {
    const status = project.status;
    const actions: string[] = [];
    
    switch (status) {
      case PROJECT_STATUSES.PLANNING:
        actions.push('approve', 'requestChanges');
        break;
      case PROJECT_STATUSES.APPROVED:
        actions.push('startExecution', 'reviseplan');
        break;
      case PROJECT_STATUSES.IN_PROGRESS:
        actions.push('updateProgress', 'addMilestone', 'putOnHold');
        break;
      case PROJECT_STATUSES.ON_HOLD:
        actions.push('resume', 'cancel');
        break;
      case PROJECT_STATUSES.REVIEW:
        actions.push('approve', 'requestRevisions', 'complete');
        break;
    }
    
    // Always allow certain actions
    actions.push('updateNotes', 'viewMetrics');
    
    return actions;
  }

  private getBlockedActions(project: Project): string[] {
    const blocked: string[] = [];
    
    if (project.status === PROJECT_STATUSES.COMPLETED) {
      blocked.push('startExecution', 'updateProgress', 'putOnHold');
    }
    
    if (project.status === PROJECT_STATUSES.CANCELLED) {
      blocked.push('startExecution', 'updateProgress', 'complete');
    }
    
    return blocked;
  }

  private async calculateWorkflowUpdates(
    current: Project, 
    action: string, 
    data?: any
  ): Promise<Partial<Project> | null> {
    const updates: Partial<Project> = {};
    
    switch (action) {
      case 'approve':
        updates.status = PROJECT_STATUSES.APPROVED;
        break;
        
      case 'startExecution':
        updates.status = PROJECT_STATUSES.IN_PROGRESS;
        updates.startDate = new Date().toISOString();
        break;
        
      case 'putOnHold':
        updates.status = PROJECT_STATUSES.ON_HOLD;
        break;
        
      case 'resume':
        updates.status = PROJECT_STATUSES.IN_PROGRESS;
        break;
        
      case 'submitForReview':
        updates.status = PROJECT_STATUSES.REVIEW;
        break;
        
      case 'complete':
        updates.status = PROJECT_STATUSES.COMPLETED;
        updates.completionDate = new Date().toISOString();
        break;
        
      case 'cancel':
        updates.status = PROJECT_STATUSES.CANCELLED;
        break;
        
      case 'archive':
        updates.status = PROJECT_STATUSES.ARCHIVED;
        updates.archived = true;
        break;
        
      default:
        return null;
    }
    
    return updates;
  }

  private async triggerWorkflowNotifications(id: string, action: string, project: Project): Promise<void> {
    logger.info('Triggering project workflow notifications', { id, action, status: project.status });
    // Notification logic would go here
  }

  private calculateTotalBudget(data: ProjectCreateData): number {
    const laborBudget = parseFloat(String(data.laborBudget || '0').replace(/[,$]/g, ''));
    const materialBudget = parseFloat(String(data.materialBudget || '0').replace(/[,$]/g, ''));
    const equipmentBudget = parseFloat(String(data.equipmentBudget || '0').replace(/[,$]/g, ''));
    
    let total = laborBudget + materialBudget + equipmentBudget;
    
    // Apply contingency percentage if provided
    if (data.contingencyPercentage && data.contingencyPercentage > 0) {
      total = total * (1 + data.contingencyPercentage / 100);
    }
    
    return total;
  }

  private async createProjectMilestones(projectId: string, milestones: any[]): Promise<void> {
    logger.info('Creating project milestones', { projectId, milestoneCount: milestones.length });
    // Implementation would depend on ProjectMilestones repository
  }

  private calculateBudgetUtilization(project: Project): BudgetUtilization {
    const budget = parseFloat(String(project.budget || '0').replace(/[,$]/g, ''));
    const actualCost = project.actualCost || 0;
    
    return {
      budgeted: budget,
      actual: actualCost,
      variance: actualCost - budget,
      variancePercentage: budget > 0 ? ((actualCost - budget) / budget) * 100 : 0,
      remaining: budget - actualCost,
      utilizationPercentage: budget > 0 ? (actualCost / budget) * 100 : 0
    };
  }

  private calculateSchedulePerformance(project: Project): SchedulePerformance {
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const completionDate = project.completionDate ? new Date(project.completionDate) : null;
    const now = new Date();
    
    return {
      startDate: startDate?.toISOString(),
      plannedCompletionDate: completionDate?.toISOString(),
      actualCompletionDate: project.status === PROJECT_STATUSES.COMPLETED ? now.toISOString() : undefined,
      daysRemaining: completionDate ? Math.ceil((completionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      isOnSchedule: !this.calculateIsOverdue(project),
      progressPercentage: this.calculateProgressPercentage(project)
    };
  }

  private async calculateQualityMetrics(project: Project): Promise<QualityMetrics> {
    // This would typically integrate with quality management systems
    return {
      defectRate: 0,
      customerSatisfaction: 0,
      reworkPercentage: 0,
      testPassRate: 100
    };
  }

  private calculateRiskAssessment(project: Project): RiskAssessment {
    return {
      overallRiskLevel: this.calculateRiskLevel(project),
      budgetRisk: this.calculateBudgetVariancePercentage(project) > 15 ? 'high' : 'low',
      scheduleRisk: this.calculateIsOverdue(project) ? 'high' : 'low',
      qualityRisk: 'low', // Would be calculated from actual quality metrics
      resourceRisk: 'medium' // Would be calculated from resource availability
    };
  }

  private async calculateTeamPerformance(projectId: string): Promise<TeamPerformance> {
    // This would integrate with HR/resource management systems
    return {
      productivity: 85,
      utilization: 92,
      satisfaction: 78,
      turnover: 5
    };
  }

  // Transform methods for BaseService
  protected async transformForPresentation(data: Project): Promise<EnhancedProject> {
    return this.enhanceProject(data);
  }
}

// Supporting interfaces for metrics
interface ProjectMetrics {
  budgetUtilization: BudgetUtilization;
  schedulePerformance: SchedulePerformance;
  qualityMetrics: QualityMetrics;
  riskAssessment: RiskAssessment;
  teamPerformance: TeamPerformance;
}

interface BudgetUtilization {
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  remaining: number;
  utilizationPercentage: number;
}

interface SchedulePerformance {
  startDate?: string;
  plannedCompletionDate?: string;
  actualCompletionDate?: string;
  daysRemaining: number;
  isOnSchedule: boolean;
  progressPercentage: number;
}

interface QualityMetrics {
  defectRate: number;
  customerSatisfaction: number;
  reworkPercentage: number;
  testPassRate: number;
}

interface RiskAssessment {
  overallRiskLevel: 'low' | 'medium' | 'high';
  budgetRisk: 'low' | 'medium' | 'high';
  scheduleRisk: 'low' | 'medium' | 'high';
  qualityRisk: 'low' | 'medium' | 'high';
  resourceRisk: 'low' | 'medium' | 'high';
}

interface TeamPerformance {
  productivity: number;
  utilization: number;
  satisfaction: number;
  turnover: number;
}

// Export singleton instance
export const projectService = new ProjectService();