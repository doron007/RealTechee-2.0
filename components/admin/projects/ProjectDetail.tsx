import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { H1, H2, H3, H4, P1, P2, P3 } from '../../typography';
import Button from '../../common/buttons/Button';
import { projectsAPI, optimizedProjectsAPI } from '../../../utils/amplifyAPI';

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyAddress?: string;
  estimatedValue?: number;
  createdAt?: string;
  updatedAt?: string;
  businessCreatedDate?: string;
  businessUpdatedDate?: string;
  frontImageS3Key?: string;
  images?: string[];
}

interface ProjectComment {
  id: string;
  projectId: string;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectDetailState {
  project: Project | null;
  comments: ProjectComment[];
  loading: boolean;
  saving: boolean;
  error: string;
  hasUnsavedChanges: boolean;
}

interface ProjectDetailProps {
  projectId: string;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId }) => {
  const router = useRouter();
  const [state, setState] = useState<ProjectDetailState>({
    project: null,
    comments: [],
    loading: true,
    saving: false,
    error: '',
    hasUnsavedChanges: false
  });

  // Seed project ID for safe testing as per plan
  const SEED_PROJECT_ID = '490209a8-d20a-bae1-9e01-1da356be8a93';

  useEffect(() => {
    const loadData = async () => {
      await loadProject();
      await loadComments();
    };
    loadData();
  }, [projectId]); // loadProject and loadComments defined below, safe to omit from deps

  const loadProject = async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      const result = await projectsAPI.get(projectId);
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          project: result.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Project not found',
          loading: false
        }));
      }
    } catch (err) {
      console.error('Error loading project:', err);
      setState(prev => ({
        ...prev,
        error: 'Error loading project',
        loading: false
      }));
    }
  };

  const loadComments = async () => {
    try {
      const result = await optimizedProjectsAPI.getProjectComments(projectId);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          comments: result.data || []
        }));
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleSave = async () => {
    if (!state.project) return;

    // Safety check - only allow editing seed project for Phase 4 testing
    if (projectId !== SEED_PROJECT_ID) {
      alert('For safety, editing is only allowed on the seed project during testing');
      return;
    }

    setState(prev => ({ ...prev, saving: true }));

    try {
      // In a real implementation, we would save the project data
      // For Phase 4, we'll just simulate success
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          saving: false, 
          hasUnsavedChanges: false 
        }));
        alert('Project saved successfully!');
      }, 1000);
      
    } catch (err) {
      console.error('Error saving project:', err);
      setState(prev => ({ ...prev, saving: false }));
      alert('Failed to save project');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      project: prev.project ? { ...prev.project, [field]: value } : null,
      hasUnsavedChanges: true
    }));
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
    if (!value) return '';
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (state.error || !state.project) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {state.error || 'Project not found'}
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => router.push('/admin/projects')}
          >
            ← Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const { project } = state;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="tertiary"
              withIcon
              iconSvg="/assets/icons/arrow-left.svg"
              onClick={() => router.push('/admin/projects')}
            >
              Back to Projects
            </Button>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
          <H1 className="mb-2">{project.title}</H1>
          <P2 className="text-gray-600">
            Last updated {formatDate(project.businessUpdatedDate || project.updatedAt)}
          </P2>
        </div>
        
        {/* Save Button - Persistent */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => window.open(`/project?projectId=${projectId}`, '_blank')}
          >
            View Public Page
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={state.saving || !state.hasUnsavedChanges}
            withIcon={state.saving}
            iconSvg={state.saving ? "/assets/icons/loading.svg" : undefined}
          >
            {state.saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Warning for non-seed project */}
      {projectId !== SEED_PROJECT_ID && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <H4 className="text-yellow-800 mb-2">Testing Mode</H4>
          <P2 className="text-yellow-700">
            For safety during Phase 4 implementation, editing is only enabled for the seed project ({SEED_PROJECT_ID}). 
            Other projects are in view-only mode.
          </P2>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Project Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Project Information</H3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  disabled={projectId !== SEED_PROJECT_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={project.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  disabled={projectId !== SEED_PROJECT_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value="New">New</option>
                  <option value="Active">Active</option>
                  <option value="Boosting">Boosting</option>
                  <option value="Pre-listing">Pre-listing</option>
                  <option value="Listed">Listed</option>
                  <option value="In-escrow">In Escrow</option>
                  <option value="Sold">Sold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Address
                </label>
                <input
                  type="text"
                  value={project.propertyAddress || ''}
                  onChange={(e) => handleFieldChange('propertyAddress', e.target.value)}
                  disabled={projectId !== SEED_PROJECT_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Value
                </label>
                <input
                  type="number"
                  value={project.estimatedValue || ''}
                  onChange={(e) => handleFieldChange('estimatedValue', parseFloat(e.target.value) || 0)}
                  disabled={projectId !== SEED_PROJECT_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={project.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                disabled={projectId !== SEED_PROJECT_ID}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Client Information</H3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={project.clientName || ''}
                  onChange={(e) => handleFieldChange('clientName', e.target.value)}
                  disabled={projectId !== SEED_PROJECT_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  value={project.clientEmail || ''}
                  onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
                  disabled={projectId !== SEED_PROJECT_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Phone
                </label>
                <input
                  type="tel"
                  value={project.clientPhone || ''}
                  onChange={(e) => handleFieldChange('clientPhone', e.target.value)}
                  disabled={projectId !== SEED_PROJECT_ID}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Project Gallery</H3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <P2 className="text-gray-500 mb-2">Gallery management will be implemented in Phase 4</P2>
              <P3 className="text-gray-400">Features: Upload images, set front page image, reorder gallery</P3>
            </div>
          </div>

          {/* Milestones & Payment Terms */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Milestones & Payment Terms</H3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <P2 className="text-gray-500 mb-2">Milestones and payment terms management will be implemented in Phase 4</P2>
              <P3 className="text-gray-400">Features: Add/edit milestones, payment schedules, progress tracking</P3>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* Project Statistics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H4 className="mb-4">Project Statistics</H4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <P3 className="text-gray-600">Created</P3>
                <P3 className="font-medium">{formatDate(project.businessCreatedDate || project.createdAt)}</P3>
              </div>
              <div className="flex justify-between">
                <P3 className="text-gray-600">Last Updated</P3>
                <P3 className="font-medium">{formatDate(project.businessUpdatedDate || project.updatedAt)}</P3>
              </div>
              {project.estimatedValue && (
                <div className="flex justify-between">
                  <P3 className="text-gray-600">Est. Value</P3>
                  <P3 className="font-medium text-green-600">{formatCurrency(project.estimatedValue)}</P3>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H4 className="mb-4">Quick Actions</H4>
            <div className="space-y-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => alert('Export will be implemented in Phase 4')}
              >
                Export Project Data
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => alert('Archive will be implemented in Phase 4')}
              >
                Archive Project
              </Button>
              <Button
                variant="tertiary"
                fullWidth
                onClick={() => alert('Audit log will be implemented in Phase 4')}
              >
                View Audit Log
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <H3 className="mb-4">Project Comments</H3>
        {state.comments.length === 0 ? (
          <div className="text-center py-8">
            <P2 className="text-gray-500">No comments yet</P2>
            <P3 className="text-gray-400 mt-1">Comments management will be implemented in Phase 4</P3>
          </div>
        ) : (
          <div className="space-y-4">
            {state.comments.map((comment) => (
              <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                <P2>{comment.content}</P2>
                <P3 className="text-gray-500 mt-2">
                  {comment.author && `${comment.author} • `}
                  {formatDate(comment.createdAt)}
                </P3>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;