/**
 * Task Management Service
 * Handles creating and managing tasks for project managers and team members
 */

import { projectMilestonesAPI, projectsAPI } from '../../utils/amplifyAPI';
import type { MeetingDetails } from '../business/projectManagerService';

export interface TaskTemplate {
  name: string;
  description: string;
  order: number;
  estimatedDuration?: string; // e.g., "2 hours", "1 day"
  isInternal?: boolean;
  category?: string;
}

export interface CreatedTask {
  id: string;
  name: string;
  description: string;
  projectId: string;
  order: number;
  isComplete: boolean;
  estimatedFinish?: string;
  isInternal: boolean;
}

class TaskManagementService {
  private static instance: TaskManagementService;

  static getInstance(): TaskManagementService {
    if (!TaskManagementService.instance) {
      TaskManagementService.instance = new TaskManagementService();
    }
    return TaskManagementService.instance;
  }

  /**
   * Create tasks for a project manager when assigned to a meeting
   */
  async createMeetingAssignmentTasks(
    requestId: string, 
    meetingDetails: MeetingDetails,
    projectManagerName: string
  ): Promise<CreatedTask[]> {
    try {
      // Check if there's already a project for this request
      let projectId = await this.findOrCreateProjectForRequest(requestId);
      
      // Get task templates for meeting assignment
      const taskTemplates = this.getMeetingAssignmentTaskTemplates(meetingDetails, projectManagerName);
      
      // Create the tasks
      const createdTasks: CreatedTask[] = [];
      
      for (const template of taskTemplates) {
        const task = await this.createTask(projectId, template);
        if (task) {
          createdTasks.push(task);
        }
      }

      return createdTasks;
    } catch (error) {
      console.error('Error creating meeting assignment tasks:', error);
      throw error;
    }
  }

  /**
   * Find existing project for request or create a new one
   */
  private async findOrCreateProjectForRequest(requestId: string): Promise<string> {
    try {
      // Check if there's already a project for this request
      const projectsResult = await projectsAPI.list();
      if (projectsResult.success && projectsResult.data) {
        const existingProject = projectsResult.data.find((project: any) => 
          project.title?.includes(requestId.slice(0, 8)) || 
          project.description?.includes(requestId)
        );
        
        if (existingProject) {
          return existingProject.id;
        }
      }

      // Create a new project for this request
      const newProject = await projectsAPI.create({
        title: `Property Assessment - Request #${requestId.slice(0, 8)}`,
        description: `Project created for property assessment meeting from request ${requestId}`,
        status: 'planning',
        statusOrder: 1,
        businessCreatedDate: new Date().toISOString(),
        businessUpdatedDate: new Date().toISOString(),
      });

      if (!newProject.success || !newProject.data) {
        throw new Error('Failed to create project for request');
      }

      return newProject.data.id;
    } catch (error) {
      console.error('Error finding/creating project for request:', error);
      throw error;
    }
  }

  /**
   * Create a single task/milestone
   */
  private async createTask(projectId: string, template: TaskTemplate): Promise<CreatedTask | null> {
    try {
      const estimatedFinish = template.estimatedDuration ? 
        this.calculateEstimatedFinish(template.estimatedDuration) : undefined;

      const taskData = {
        name: template.name,
        description: template.description,
        projectId: projectId,
        order: template.order,
        isComplete: false,
        estimatedStart: new Date().toISOString(),
        estimatedFinish: estimatedFinish,
        isCategory: false,
        isInternal: template.isInternal || true,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };

      const result = await projectMilestonesAPI.create(taskData);

      if (!result.success || !result.data) {
        console.error('Failed to create task:', template.name);
        return null;
      }

      return {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description,
        projectId: result.data.projectId,
        order: result.data.order,
        isComplete: result.data.isComplete,
        estimatedFinish: result.data.estimatedFinish,
        isInternal: result.data.isInternal,
      };
    } catch (error) {
      console.error('Error creating task:', template.name, error);
      return null;
    }
  }

  /**
   * Get task templates for meeting assignment
   */
  private getMeetingAssignmentTaskTemplates(
    meetingDetails: MeetingDetails, 
    projectManagerName: string
  ): TaskTemplate[] {
    const templates: TaskTemplate[] = [
      {
        name: 'Review Meeting Details',
        description: `Review meeting scheduled for ${meetingDetails.meetingDate} at ${meetingDetails.meetingTime}. Meeting type: ${meetingDetails.meetingType}. ${meetingDetails.meetingNotes ? 'Notes: ' + meetingDetails.meetingNotes : ''}`,
        order: 1,
        estimatedDuration: '30 minutes',
        isInternal: true,
        category: 'preparation',
      },
      {
        name: 'Prepare Assessment Materials',
        description: 'Gather necessary tools, measurement devices, and documentation for property assessment',
        order: 2,
        estimatedDuration: '1 hour',
        isInternal: true,
        category: 'preparation',
      },
      {
        name: 'Contact Property Owner',
        description: 'Confirm meeting details and any special access requirements with property owner',
        order: 3,
        estimatedDuration: '15 minutes',
        isInternal: true,
        category: 'communication',
      },
    ];

    // Add location-specific tasks
    if (meetingDetails.meetingType === 'in-person') {
      templates.push({
        name: 'Plan Travel Route',
        description: `Plan travel route to meeting location: ${meetingDetails.meetingLocation || 'Property address'}`,
        order: 4,
        estimatedDuration: '15 minutes',
        isInternal: true,
        category: 'preparation',
      });
    } else if (meetingDetails.meetingType === 'virtual') {
      templates.push({
        name: 'Set Up Virtual Meeting',
        description: 'Prepare virtual meeting platform and send connection details to participants',
        order: 4,
        estimatedDuration: '10 minutes',
        isInternal: true,
        category: 'preparation',
      });
    }

    // Add post-meeting tasks
    templates.push(
      {
        name: 'Conduct Property Assessment',
        description: 'Complete thorough property assessment including measurements, photos, and condition evaluation',
        order: 10,
        estimatedDuration: '2 hours',
        isInternal: true,
        category: 'assessment',
      },
      {
        name: 'Document Assessment Findings',
        description: 'Create detailed assessment report with photos, measurements, and recommendations',
        order: 11,
        estimatedDuration: '1 hour',
        isInternal: true,
        category: 'documentation',
      },
      {
        name: 'Generate Initial Quote',
        description: 'Prepare initial cost estimates and project timeline based on assessment',
        order: 12,
        estimatedDuration: '2 hours',
        isInternal: true,
        category: 'estimation',
      },
      {
        name: 'Follow Up with Client',
        description: 'Schedule follow-up meeting to discuss assessment results and next steps',
        order: 13,
        estimatedDuration: '30 minutes',
        isInternal: true,
        category: 'communication',
      }
    );

    return templates;
  }

  /**
   * Calculate estimated finish time based on duration string
   */
  private calculateEstimatedFinish(duration: string): string {
    const now = new Date();
    
    // Parse duration string (e.g., "2 hours", "1 day", "30 minutes")
    const matches = duration.match(/(\d+)\s*(minute|hour|day)s?/i);
    if (!matches) {
      // Default to 1 hour if can't parse
      now.setHours(now.getHours() + 1);
      return now.toISOString();
    }

    const amount = parseInt(matches[1]);
    const unit = matches[2].toLowerCase();

    switch (unit) {
      case 'minute':
        now.setMinutes(now.getMinutes() + amount);
        break;
      case 'hour':
        now.setHours(now.getHours() + amount);
        break;
      case 'day':
        now.setDate(now.getDate() + amount);
        break;
      default:
        now.setHours(now.getHours() + 1);
    }

    return now.toISOString();
  }

  /**
   * Get all tasks for a project
   */
  async getProjectTasks(projectId: string): Promise<CreatedTask[]> {
    try {
      const result = await projectMilestonesAPI.list();
      if (!result.success || !result.data) {
        return [];
      }

      return result.data
        .filter((milestone: any) => milestone.projectId === projectId)
        .map((milestone: any) => ({
          id: milestone.id,
          name: milestone.name,
          description: milestone.description,
          projectId: milestone.projectId,
          order: milestone.order,
          isComplete: milestone.isComplete,
          estimatedFinish: milestone.estimatedFinish,
          isInternal: milestone.isInternal,
        }))
        .sort((a: CreatedTask, b: CreatedTask) => a.order - b.order);
    } catch (error) {
      console.error('Error getting project tasks:', error);
      return [];
    }
  }

  /**
   * Mark a task as complete
   */
  async completeTask(taskId: string): Promise<boolean> {
    try {
      const result = await projectMilestonesAPI.update(taskId, {
        isComplete: true,
        updatedDate: new Date().toISOString(),
      });

      return result.success;
    } catch (error) {
      console.error('Error completing task:', taskId, error);
      return false;
    }
  }

  /**
   * Update task progress
   */
  async updateTask(taskId: string, updates: Partial<CreatedTask>): Promise<boolean> {
    try {
      const updateData = {
        ...updates,
        updatedDate: new Date().toISOString(),
      };

      const result = await projectMilestonesAPI.update(taskId, updateData);
      return result.success;
    } catch (error) {
      console.error('Error updating task:', taskId, error);
      return false;
    }
  }
}

export const taskManagementService = TaskManagementService.getInstance();