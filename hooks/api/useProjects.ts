/**
 * React Query hooks for Project operations
 * Provides clean frontend interface with loading states and error handling
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { projectService, EnhancedProject, ProjectCreateData, ProjectBusinessFilter } from '../../services/business/ProjectService';
import { ServiceQueryOptions } from '../../services/interfaces/IBaseService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('useProjects');

// Query keys for consistent caching
export const projectQueryKeys = {
  all: ['projects'] as const,
  lists: () => [...projectQueryKeys.all, 'list'] as const,
  list: (filters?: ProjectBusinessFilter) => [...projectQueryKeys.lists(), filters] as const,
  details: () => [...projectQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectQueryKeys.details(), id] as const,
  businessState: (id: string) => [...projectQueryKeys.detail(id), 'businessState'] as const,
  metrics: (id: string) => [...projectQueryKeys.detail(id), 'metrics'] as const,
  overdue: () => [...projectQueryKeys.all, 'overdue'] as const,
  atRisk: () => [...projectQueryKeys.all, 'atRisk'] as const,
  byRequest: (requestId: string) => [...projectQueryKeys.all, 'byRequest', requestId] as const,
  byStatus: (status: string) => [...projectQueryKeys.all, 'byStatus', status] as const,
};

// Hook for fetching all projects
export function useProjects(
  options?: ServiceQueryOptions<ProjectBusinessFilter>,
  queryOptions?: Omit<UseQueryOptions<EnhancedProject[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: projectQueryKeys.list(options?.filter),
    queryFn: async () => {
      logger.debug('Fetching projects', { options });
      const result = await projectService.findAll(options);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch projects');
      }
      
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...queryOptions,
  });
}

// Hook for fetching a single project
export function useProject(
  id: string,
  queryOptions?: Omit<UseQueryOptions<EnhancedProject>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: projectQueryKeys.detail(id),
    queryFn: async () => {
      logger.debug('Fetching project', { id });
      const result = await projectService.findById(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch project');
      }
      
      if (!result.data) {
        throw new Error('Project not found');
      }
      
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for fetching overdue projects
export function useOverdueProjects(
  queryOptions?: Omit<UseQueryOptions<EnhancedProject[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: projectQueryKeys.overdue(),
    queryFn: async () => {
      logger.debug('Fetching overdue projects');
      const result = await projectService.findOverdueProjects();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch overdue projects');
      }
      
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for overdue projects)
    gcTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for fetching at-risk projects
export function useAtRiskProjects(
  queryOptions?: Omit<UseQueryOptions<EnhancedProject[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: projectQueryKeys.atRisk(),
    queryFn: async () => {
      logger.debug('Fetching at-risk projects');
      const result = await projectService.findAtRiskProjects();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch at-risk projects');
      }
      
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for fetching project business state
export function useProjectBusinessState(
  id: string,
  queryOptions?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: projectQueryKeys.businessState(id),
    queryFn: async () => {
      logger.debug('Fetching project business state', { id });
      const result = await projectService.getBusinessState(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch project business state');
      }
      
      return result.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for fetching project metrics
export function useProjectMetrics(
  id: string,
  queryOptions?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: projectQueryKeys.metrics(id),
    queryFn: async () => {
      logger.debug('Fetching project metrics', { id });
      const result = await projectService.getProjectMetrics(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch project metrics');
      }
      
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // Metrics can be cached longer
    gcTime: 10 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for fetching projects by status
export function useProjectsByStatus(
  status: string,
  queryOptions?: Omit<UseQueryOptions<EnhancedProject[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: projectQueryKeys.byStatus(status),
    queryFn: async () => {
      logger.debug('Fetching projects by status', { status });
      const result = await projectService.findByStatus(status);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch projects');
      }
      
      return result.data || [];
    },
    enabled: !!status,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...queryOptions,
  });
}

// Hook for creating projects
export function useCreateProject(
  mutationOptions?: UseMutationOptions<EnhancedProject, Error, ProjectCreateData>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ProjectCreateData) => {
      logger.info('Creating project', { data });
      const result = await projectService.create(data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }
      
      if (!result.data) {
        throw new Error('No data returned from create operation');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      
      // Add the new project to the cache
      queryClient.setQueryData(projectQueryKeys.detail(data.id), data);
      
      // If associated with a request, invalidate that cache too
      if (data.requestId) {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.byRequest(data.requestId) });
      }
      
      // Invalidate status-based queries
      if (data.status) {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.byStatus(data.status) });
      }
      
      logger.info('Project created successfully', { id: data.id });
    },
    onError: (error) => {
      logger.error('Failed to create project', { error });
    },
    ...mutationOptions,
  });
}

// Hook for updating projects
export function useUpdateProject(
  mutationOptions?: UseMutationOptions<EnhancedProject, Error, { id: string; data: Partial<EnhancedProject> }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      logger.info('Updating project', { id, data });
      const result = await projectService.update(id, data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update project');
      }
      
      if (!result.data) {
        throw new Error('No data returned from update operation');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectQueryKeys.detail(data.id), data);
      
      // Invalidate lists to ensure they're updated
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      
      // Invalidate business state and metrics as they may have changed
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.businessState(data.id) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.metrics(data.id) });
      
      // Invalidate risk-based queries
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.atRisk() });
      
      // Invalidate status-based queries
      if (data.status) {
        queryClient.invalidateQueries({ queryKey: [...projectQueryKeys.all, 'byStatus'] });
      }
      
      logger.info('Project updated successfully', { id: data.id });
    },
    onError: (error) => {
      logger.error('Failed to update project', { error });
    },
    ...mutationOptions,
  });
}

// Hook for processing project workflow
export function useProjectWorkflow(
  mutationOptions?: UseMutationOptions<EnhancedProject, Error, { id: string; action: string; data?: any }>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, action, data }) => {
      logger.info('Processing project workflow', { id, action, data });
      const result = await projectService.processWorkflow(id, action, data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to process workflow');
      }
      
      if (!result.data) {
        throw new Error('No data returned from workflow operation');
      }
      
      return result.data;
    },
    onSuccess: (data, { id }) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectQueryKeys.detail(id), data);
      
      // Invalidate comprehensive cache updates
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.businessState(id) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.metrics(id) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.atRisk() });
      queryClient.invalidateQueries({ queryKey: [...projectQueryKeys.all, 'byStatus'] });
      
      logger.info('Project workflow processed successfully', { id });
    },
    onError: (error) => {
      logger.error('Failed to process project workflow', { error });
    },
    ...mutationOptions,
  });
}

// Hook for deleting projects
export function useDeleteProject(
  mutationOptions?: UseMutationOptions<boolean, Error, string>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      logger.info('Deleting project', { id });
      const result = await projectService.delete(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete project');
      }
      
      return result.data || false;
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectQueryKeys.detail(id) });
      queryClient.removeQueries({ queryKey: projectQueryKeys.businessState(id) });
      queryClient.removeQueries({ queryKey: projectQueryKeys.metrics(id) });
      
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.atRisk() });
      queryClient.invalidateQueries({ queryKey: [...projectQueryKeys.all, 'byRequest'] });
      queryClient.invalidateQueries({ queryKey: [...projectQueryKeys.all, 'byStatus'] });
      
      logger.info('Project deleted successfully', { id });
    },
    onError: (error) => {
      logger.error('Failed to delete project', { error });
    },
    ...mutationOptions,
  });
}

// Compound hook for comprehensive project management
export function useProjectManagement(id?: string) {
  const projects = useProjects();
  const project = useProject(id || '', { enabled: !!id });
  const businessState = useProjectBusinessState(id || '', { enabled: !!id });
  const metrics = useProjectMetrics(id || '', { enabled: !!id });
  const overdueProjects = useOverdueProjects();
  const atRiskProjects = useAtRiskProjects();
  
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const processWorkflow = useProjectWorkflow();
  const deleteProject = useDeleteProject();
  
  return {
    // Data
    projects: projects.data || [],
    project: project.data,
    businessState: businessState.data,
    metrics: metrics.data,
    overdueProjects: overdueProjects.data || [],
    atRiskProjects: atRiskProjects.data || [],
    
    // Loading states
    isLoadingProjects: projects.isLoading,
    isLoadingProject: project.isLoading,
    isLoadingBusinessState: businessState.isLoading,
    isLoadingMetrics: metrics.isLoading,
    isLoadingOverdueProjects: overdueProjects.isLoading,
    isLoadingAtRiskProjects: atRiskProjects.isLoading,
    
    // Error states
    projectsError: projects.error,
    projectError: project.error,
    businessStateError: businessState.error,
    metricsError: metrics.error,
    overdueProjectsError: overdueProjects.error,
    atRiskProjectsError: atRiskProjects.error,
    
    // Mutations
    createProject: createProject.mutateAsync,
    updateProject: updateProject.mutateAsync,
    processWorkflow: processWorkflow.mutateAsync,
    deleteProject: deleteProject.mutateAsync,
    
    // Mutation states
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
    isProcessingWorkflow: processWorkflow.isPending,
    isDeleting: deleteProject.isPending,
    
    // Mutation errors
    createError: createProject.error,
    updateError: updateProject.error,
    workflowError: processWorkflow.error,
    deleteError: deleteProject.error,
    
    // Refetch functions
    refetchProjects: projects.refetch,
    refetchProject: project.refetch,
    refetchBusinessState: businessState.refetch,
    refetchMetrics: metrics.refetch,
    refetchOverdueProjects: overdueProjects.refetch,
    refetchAtRiskProjects: atRiskProjects.refetch,
  };
}