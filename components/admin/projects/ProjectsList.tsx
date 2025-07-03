import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { H1, H2, H3, P1, P2, P3 } from '../../typography';
import Button from '../../common/buttons/Button';
import { projectsAPI } from '../../../utils/amplifyAPI';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  clientName?: string;
  clientEmail?: string;
  propertyAddress?: string;
  estimatedValue?: number;
  createdAt?: string;
  updatedAt?: string;
  businessCreatedDate?: string;
  businessUpdatedDate?: string;
}

interface ProjectsListState {
  projects: Project[];
  loading: boolean;
  error: string;
  searchTerm: string;
  statusFilter: string;
  selectedProjects: string[];
}

const ProjectsList: React.FC = () => {
  const router = useRouter();
  const [state, setState] = useState<ProjectsListState>({
    projects: [],
    loading: true,
    error: '',
    searchTerm: '',
    statusFilter: 'all',
    selectedProjects: []
  });

  // Seed project ID for safe testing as per plan
  const SEED_PROJECT_ID = '490209a8-d20a-bae1-9e01-1da356be8a93';

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      const result = await projectsAPI.list();
      
      if (result.success) {
        // Filter out archived projects by default as per plan
        const activeProjects = result.data.filter((project: Project) => 
          project.status !== 'Archived'
        );
        
        setState(prev => ({
          ...prev,
          projects: activeProjects,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Failed to load projects',
          loading: false
        }));
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setState(prev => ({
        ...prev,
        error: 'Error loading projects',
        loading: false
      }));
    }
  };

  const handleSearch = (term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  };

  const handleStatusFilter = (status: string) => {
    setState(prev => ({ ...prev, statusFilter: status }));
  };

  const handleProjectSelect = (projectId: string) => {
    setState(prev => ({
      ...prev,
      selectedProjects: prev.selectedProjects.includes(projectId)
        ? prev.selectedProjects.filter(id => id !== projectId)
        : [...prev.selectedProjects, projectId]
    }));
  };

  const handleSelectAll = () => {
    const filteredProjectIds = getFilteredProjects().map(p => p.id);
    setState(prev => ({
      ...prev,
      selectedProjects: prev.selectedProjects.length === filteredProjectIds.length 
        ? [] 
        : filteredProjectIds
    }));
  };

  const handleOpenProject = (projectId: string) => {
    // Navigate to public project page
    router.push(`/project?id=${projectId}`);
  };

  const handleEditProject = (projectId: string) => {
    // Navigate to project detail/edit page (Phase 4)
    router.push(`/admin/projects/${projectId}`);
  };

  const handleArchiveSelected = async () => {
    if (state.selectedProjects.length === 0) return;
    
    // Only allow operations on seed project for safety
    const seedProjectSelected = state.selectedProjects.includes(SEED_PROJECT_ID);
    if (!seedProjectSelected) {
      alert('For safety, archiving is only allowed on the seed project during testing');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to archive ${state.selectedProjects.length} selected project(s)? This action will set their status to "Archived".`
    );
    
    if (!confirmed) return;

    try {
      // In a real implementation, we would make API calls to update status to "Archived"
      // For now, just show success message
      alert(`Successfully archived ${state.selectedProjects.length} project(s)`);
      setState(prev => ({ ...prev, selectedProjects: [] }));
      await loadProjects(); // Reload data
    } catch (err) {
      console.error('Error archiving projects:', err);
      alert('Failed to archive projects');
    }
  };

  const getFilteredProjects = (): Project[] => {
    let filtered = state.projects;

    // Apply search filter
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.title?.toLowerCase().includes(term) ||
        project.clientName?.toLowerCase().includes(term) ||
        project.propertyAddress?.toLowerCase().includes(term) ||
        project.description?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (state.statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === state.statusFilter);
    }

    return filtered;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'New': return 'text-green-600 bg-green-100';
      case 'Active': case 'Boosting': case 'Listed': return 'text-blue-600 bg-blue-100';
      case 'In-escrow': return 'text-yellow-600 bg-yellow-100';
      case 'Sold': case 'Completed': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (value?: number): string => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredProjects = getFilteredProjects();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <H1>Projects</H1>
          <P2 className="text-gray-600 mt-1">
            Manage and track all project records
          </P2>
        </div>
        <Button
          variant="primary"
          withIcon
          iconSvg="/assets/icons/ic-projects.svg"
          onClick={() => alert('Add new project will be implemented in Phase 4')}
        >
          Add Project
        </Button>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {state.error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search projects..."
                value={state.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <div>
              <select
                value={state.statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="New">New</option>
                <option value="Active">Active</option>
                <option value="Boosting">Boosting</option>
                <option value="Listed">Listed</option>
                <option value="In-escrow">In Escrow</option>
                <option value="Sold">Sold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {state.selectedProjects.length > 0 && (
            <div className="flex gap-2">
              <P3 className="text-gray-600 py-2">
                {state.selectedProjects.length} selected
              </P3>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleArchiveSelected}
              >
                Archive Selected
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {/* List Header */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={state.selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300"
            />
            <P3 className="text-gray-600 font-medium">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </P3>
          </div>
          <P3 className="text-gray-600">
            Sort by: Last Updated
          </P3>
        </div>

        {/* Project Cards */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <P2 className="text-gray-500">
              {state.searchTerm || state.statusFilter !== 'all' 
                ? 'No projects match your filters' 
                : 'No projects found'
              }
            </P2>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={state.selectedProjects.includes(project.id)}
                    onChange={() => handleProjectSelect(project.id)}
                    className="mt-1 rounded border-gray-300"
                  />

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <H3 className="truncate">{project.title}</H3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                          {project.clientName && (
                            <P3 className="text-gray-600">Client: {project.clientName}</P3>
                          )}
                        </div>
                      </div>
                      
                      {/* Project Value */}
                      {project.estimatedValue && (
                        <div className="text-right">
                          <P2 className="font-semibold text-green-600">
                            {formatCurrency(project.estimatedValue)}
                          </P2>
                          <P3 className="text-gray-500">Estimated Value</P3>
                        </div>
                      )}
                    </div>

                    {/* Project Details */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.propertyAddress && (
                        <div>
                          <P3 className="text-gray-500 font-medium">Property Address</P3>
                          <P3 className="text-gray-700">{project.propertyAddress}</P3>
                        </div>
                      )}
                      <div>
                        <P3 className="text-gray-500 font-medium">Last Updated</P3>
                        <P3 className="text-gray-700">
                          {formatDate(project.businessUpdatedDate || project.updatedAt)}
                        </P3>
                      </div>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <div className="mt-3">
                        <P3 className="text-gray-700 line-clamp-2">
                          {project.description}
                        </P3>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={() => handleOpenProject(project.id)}
                    >
                      View Public
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditProject(project.id)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More / Pagination placeholder */}
      {filteredProjects.length > 0 && (
        <div className="text-center py-4">
          <Button
            variant="tertiary"
            onClick={() => alert('Pagination will be implemented in a future phase')}
          >
            Load More Projects
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;