import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enhancedProjectsService } from '../services/business/enhancedProjectsService';
import { queryKeys, invalidateQueries } from '../lib/queryClient';
import { useNotification } from '../contexts/NotificationContext';

export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => {
      const result = await enhancedProjectsService.getFullyEnhancedProjects();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch projects');
      }
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProjectQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: async () => {
      // For now, get all projects and filter by ID
      // In a real app, this would be a dedicated getById endpoint
      const result = await enhancedProjectsService.getFullyEnhancedProjects();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch projects');
      }
      const project = result.data?.find(p => p.id === id);
      if (!project) {
        throw new Error('Project not found');
      }
      return project;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute for individual projects
  });
}

export function useProjectMutations() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const archiveProject = useMutation({
    mutationFn: async (id: string) => {
      // Use the updateProject method to set status to archived
      const result = await enhancedProjectsService.updateProject(id, { status: 'archived' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to archive project');
      }
      return result.data;
    },
    onSuccess: (data, id) => {
      // Update the specific project in cache
      queryClient.setQueryData(queryKeys.project(id), data);
      invalidateQueries.projects();
      invalidateQueries.analytics();
      showSuccess('Project Archived', 'Project has been archived successfully');
    },
    onError: (error: Error) => {
      showError('Archive Failed', error.message);
    },
  });

  return {
    archiveProject,
  };
}

// Optimized search hook with debouncing
export function useProjectsSearch(searchCriteria: Record<string, any>, debounceMs: number = 500) {
  return useQuery({
    queryKey: queryKeys.projectsSearch(searchCriteria),
    queryFn: async () => {
      // If no search criteria, return all projects
      if (!searchCriteria || Object.keys(searchCriteria).length === 0) {
        const result = await enhancedProjectsService.getFullyEnhancedProjects();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch projects');
        }
        return result.data || [];
      }

      // Perform client-side filtering for now
      // In a real app, this would be server-side filtering
      const result = await enhancedProjectsService.getFullyEnhancedProjects();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch projects');
      }
      
      const projects = result.data || [];
      
      // Apply search criteria
      return projects.filter(project => {
        return Object.entries(searchCriteria).every(([key, value]) => {
          if (!value || (typeof value === 'string' && !value.trim())) return true;
          
          const projectValue = project[key as keyof typeof project];
          
          if (typeof value === 'string') {
            return projectValue && String(projectValue).toLowerCase().includes(value.toLowerCase());
          } else if (Array.isArray(value)) {
            return value.length === 0 || value.includes(String(projectValue));
          } else if (typeof value === 'object' && value !== null) {
            // Handle range queries (dates, numbers)
            if (value.from || value.to) {
              const projectVal = projectValue ? new Date(String(projectValue)).getTime() : 0;
              const from = value.from ? new Date(value.from).getTime() : 0;
              const to = value.to ? new Date(value.to).getTime() : Infinity;
              return projectVal >= from && projectVal <= to;
            }
          }
          
          return true;
        });
      });
    },
    enabled: true,
    staleTime: 30 * 1000, // 30 seconds for search results
  });
}

// Prefetch hook for performance optimization
export function usePrefetchProjects() {
  const queryClient = useQueryClient();

  const prefetchProject = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.project(id),
      queryFn: async () => {
        const result = await enhancedProjectsService.getFullyEnhancedProjects();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch projects');
        }
        const project = result.data?.find(p => p.id === id);
        if (!project) {
          throw new Error('Project not found');
        }
        return project;
      },
      staleTime: 1 * 60 * 1000,
    });
  };

  return { prefetchProject };
}