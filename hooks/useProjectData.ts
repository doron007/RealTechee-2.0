import { useState, useEffect } from 'react';
import { optimizedProjectsAPI } from '../utils/amplifyAPI';
import { Project } from '../types/projects';
import { Milestone } from '../components/projects/MilestonesList';
import { Payment } from '../components/projects/PaymentList';
import { Comment } from '../components/projects/CommentsList';
import { createLogger } from '../utils/logger';

export interface ProjectDataState {
  project: Project | null;
  milestones: Milestone[];
  payments: Payment[];
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

export interface UseProjectDataOptions {
  projectId: string | undefined;
  loadFromSessionStorage?: boolean;
  forceRefresh?: boolean; // Force fresh data from backend
}

/**
 * Reusable hook for loading project data with Amplify API
 * Follows the three-tier loading strategy for optimal UPL
 */
const logger = createLogger('useProjectData');

export function useProjectData({ 
  projectId, 
  loadFromSessionStorage = true,
  forceRefresh = false
}: UseProjectDataOptions): ProjectDataState {
  const [state, setState] = useState<ProjectDataState>({
    project: null,
    milestones: [],
    payments: [],
    comments: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!projectId) {
      logger.warn('No project ID provided');
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'No project ID provided'
      }));
      return;
    }

    async function loadProjectData() {
      logger.info('Loading project data', { projectId, loadFromSessionStorage, forceRefresh });
      
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        let projectData: Project | null = null;

        // Tier 1: Try to get from sessionStorage first (instant load) - unless force refresh
        if (loadFromSessionStorage && !forceRefresh && typeof window !== 'undefined') {
          try {
            const storedProject = sessionStorage.getItem('currentProject');
            console.log('useProjectData: Found stored project:', !!storedProject);
            
            if (storedProject) {
              const parsedProject = JSON.parse(storedProject) as Project;
              console.log('useProjectData: Parsed project ID:', parsedProject.id, 'matches:', parsedProject.id === projectId);
              
              if (parsedProject.id === projectId) {
                projectData = parsedProject;
                setState(prev => ({ ...prev, project: projectData }));
                
                // Check if stored project already has complete data (from ProjectsGridSection click)
                const hasCompleteData = (parsedProject as any).comments || (parsedProject as any).milestones || (parsedProject as any).payments;
                console.log('useProjectData: Has complete data:', hasCompleteData);
                console.log('useProjectData: Stored project structure:', {
                  hasComments: !!(parsedProject as any).comments,
                  hasMilestones: !!(parsedProject as any).milestones,
                  hasPayments: !!(parsedProject as any).payments,
                  commentsType: typeof (parsedProject as any).comments,
                  milestonesType: typeof (parsedProject as any).milestones,
                  paymentsType: typeof (parsedProject as any).payments,
                  commentsLength: Array.isArray((parsedProject as any).comments) ? (parsedProject as any).comments.length : 'not array',
                  milestonesLength: Array.isArray((parsedProject as any).milestones) ? (parsedProject as any).milestones.length : 'not array',
                  paymentsLength: Array.isArray((parsedProject as any).payments) ? (parsedProject as any).payments.length : 'not array'
                });
                
                if (hasCompleteData) {
                  // Use the complete data from sessionStorage
                  console.log('useProjectData: Using complete data from sessionStorage');
                  setState(prev => ({
                    ...prev,
                    project: parsedProject,
                    milestones: (parsedProject as any).milestones || [],
                    payments: (parsedProject as any).payments || [],
                    comments: (parsedProject as any).comments || [],
                    loading: false
                  }));
                  return; // Skip API calls since we have complete data
                }
              }
            }
          } catch (e) {
            console.warn('Failed to retrieve project from sessionStorage:', e);
          }
        }

        // Tier 2: If not in sessionStorage, fetch from Amplify API
        if (!projectData && projectId) {
          const result = await optimizedProjectsAPI.loadFullProject(projectId);
          
          if (result.success && result.data) {
            // Transform API data to match Project interface
            projectData = {
              ...result.data,
              title: result.data.title || 'Untitled Project', // Handle nullable title
              status: result.data.status || 'New' // Handle nullable status
            } as Project;
            setState(prev => ({ ...prev, project: projectData }));
          } else {
            throw new Error('Project not found');
          }
        }

        // Tier 3: Load related data in parallel
        if (projectData && projectId) {
          console.log('useProjectData: Loading related data...');
          
          // Use the GUID id for foreign key lookups
          const projectIdForRelatedData = projectData.id;
          console.log('useProjectData: Using project id for related data:', projectIdForRelatedData);
          
          if (projectIdForRelatedData) {
            const [milestonesResult, paymentsResult, commentsResult, contactsResult] = await Promise.all([
              optimizedProjectsAPI.getProjectMilestones(projectIdForRelatedData),
              optimizedProjectsAPI.getProjectPaymentTerms(projectIdForRelatedData),
              optimizedProjectsAPI.getProjectComments(projectIdForRelatedData),
              optimizedProjectsAPI.getProjectContacts(projectData)
            ]);

            logger.info('Related data loaded', {
              milestones: milestonesResult.success ? milestonesResult.data?.length : 'failed',
              payments: paymentsResult.success ? paymentsResult.data?.length : 'failed',
              comments: commentsResult.success ? commentsResult.data?.length : 'failed',
              contacts: contactsResult.success ? 'loaded' : 'failed',
              agentLoaded: contactsResult.success && contactsResult.data?.agent ? 'yes' : 'no'
            });

            // Merge contact data into the project object
            const updatedProject = {
              ...projectData,
              ...(contactsResult.success && contactsResult.data ? contactsResult.data : {})
            } as Project;

            setState(prev => ({
              ...prev,
              project: updatedProject,
              milestones: milestonesResult.success ? milestonesResult.data || [] : [],
              payments: paymentsResult.success ? paymentsResult.data || [] : [],
              comments: commentsResult.success ? commentsResult.data || [] : [],
              loading: false
            }));
          } else {
            console.warn('useProjectData: No project id found, cannot load related data');
            setState(prev => ({
              ...prev,
              loading: false
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Project not found. It may have been removed or the ID is invalid.'
          }));
        }
      } catch (error) {
        console.error('Error loading project data:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load project details. Please try again later.'
        }));
      }
    }

    loadProjectData();
  }, [projectId, loadFromSessionStorage, forceRefresh]);

  return state;
}