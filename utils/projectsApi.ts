/**
 * Frontend service for interacting with the projects API
 */

import { Project, ProjectFilter } from '../types/projects';
import { ProjectMilestone, ProjectPayment, ProjectComment } from '../types/projectItems';

/**
 * Get all projects with optional filtering
 */
export async function getProjects(filter?: ProjectFilter): Promise<Project[]> {
  try {
    // Build query string from filter
    const queryParams = new URLSearchParams();
    
    if (filter?.category) {
      queryParams.append('category', filter.category);
    }
    
    if (filter?.location) {
      queryParams.append('location', filter.location);
    }
    
    if (filter?.featured !== undefined) {
      queryParams.append('featured', filter.featured.toString());
    }
    
    if (filter?.search) {
      queryParams.append('search', filter.search);
    }
    
    const queryString = queryParams.toString();
    const url = `/api/projects${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

/**
 * Get a project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const response = await fetch(`/api/projects/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    return null;
  }
}

/**
 * Create a new project
 */
export async function createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project | null> {
  try {
    const response = await fetch('/api/projects/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project | null> {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    return null;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    return false;
  }
}

/**
 * Get all project categories
 */
export async function getProjectCategories(): Promise<string[]> {
  try {
    const response = await fetch('/api/projects/categories');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.categories;
  } catch (error) {
    console.error('Error fetching project categories:', error);
    return [];
  }
}

/**
 * Get all project locations
 */
export async function getProjectLocations(): Promise<string[]> {
  try {
    const response = await fetch('/api/projects/locations');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.locations;
  } catch (error) {
    console.error('Error fetching project locations:', error);
    return [];
  }
}

/**
 * Get all milestones for a project
 */
export async function getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
  try {
    const response = await fetch(`/api/projects/milestones?projectId=${projectId}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.milestones;
  } catch (error) {
    console.error('Error fetching project milestones:', error);
    return [];
  }
}

/**
 * Get all payments for a project
 */
export async function getProjectPayments(projectId: string): Promise<ProjectPayment[]> {
  try {
    const response = await fetch(`/api/projects/payments?projectId=${projectId}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.payments;
  } catch (error) {
    console.error('Error fetching project payments:', error);
    return [];
  }
}

/**
 * Get all comments for a project
 */
export async function getProjectComments(projectId: string): Promise<ProjectComment[]> {
  try {
    const response = await fetch(`/api/projects/comments?projectId=${projectId}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.comments;
  } catch (error) {
    console.error('Error fetching project comments:', error);
    return [];
  }
}
