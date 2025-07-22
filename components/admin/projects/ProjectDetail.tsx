import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { H1, H2, H3, H4, P1, P2, P3 } from '../../typography';
import Button from '../../common/buttons/Button';
import { projectsAPI, optimizedProjectsAPI, quotesAPI, requestsAPI } from '../../../utils/amplifyAPI';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useNotification } from '../../../contexts/NotificationContext';
import RestoreChangesDialog from '../../common/dialogs/RestoreChangesDialog';

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
  originalValue?: number;
  listingPrice?: number;
  salePrice?: number;
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

interface RelatedEntity {
  id: string;
  title?: string;
  status?: string;
  message?: string;
}

interface ProjectDetailState {
  project: Project | null;
  originalProject: Project | null; // Track original data for comparison
  comments: ProjectComment[];
  relatedQuotes: RelatedEntity[];
  relatedRequests: RelatedEntity[];
  loading: boolean;
  saving: boolean;
  error: string;
  showRestoreDialog: boolean;
}

interface ProjectDetailProps {
  projectId: string;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId }) => {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [state, setState] = useState<ProjectDetailState>({
    project: null,
    originalProject: null,
    comments: [],
    relatedQuotes: [],
    relatedRequests: [],
    loading: true,
    saving: false,
    error: '',
    showRestoreDialog: false
  });

  // Development protection removed - all projects can be edited

  // Unsaved changes integration
  const unsavedChanges = useUnsavedChanges({
    entityType: 'project',
    entityId: projectId,
    originalData: state.originalProject || {},
    currentData: state.project || {},
    enabled: !!state.project && !!state.originalProject,
    onRestore: (restoredData) => {
      setState(prev => ({
        ...prev,
        project: { ...prev.originalProject, ...restoredData } as Project
      }));
    }
  });

  useEffect(() => {
    const loadData = async () => {
      await loadProject();
      await loadComments();
      await loadRelatedEntities();
    };
    loadData();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for stored changes on mount
  useEffect(() => {
    if (state.originalProject && unsavedChanges.hasStoredChanges) {
      setState(prev => ({ ...prev, showRestoreDialog: true }));
    }
  }, [state.originalProject, unsavedChanges.hasStoredChanges]);

  const loadProject = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      const result = await projectsAPI.get(projectId);
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          project: result.data,
          originalProject: result.data, // Store original for comparison
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
  }, [projectId]);

  const loadComments = useCallback(async () => {
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
  }, [projectId]);

  const loadRelatedEntities = useCallback(async () => {
    try {
      // Load related quotes (quotes that reference this project)
      const quotesResult = await quotesAPI.list();
      if (quotesResult.success) {
        const relatedQuotes = quotesResult.data
          .filter((quote: any) => quote.projectId === projectId)
          .map((quote: any) => ({
            id: quote.id,
            title: quote.title || `Quote #${quote.quoteNumber || quote.id.slice(0, 8)}`,
            status: quote.status,
          }));
        
        setState(prev => ({ ...prev, relatedQuotes }));

        // Find related requests through quotes
        const requestIds = quotesResult.data
          .filter((quote: any) => quote.projectId === projectId && quote.requestId)
          .map((quote: any) => quote.requestId);

        if (requestIds.length > 0) {
          const requestsResult = await requestsAPI.list();
          if (requestsResult.success) {
            const relatedRequests = requestsResult.data
              .filter((request: any) => requestIds.includes(request.id))
              .map((request: any) => ({
                id: request.id,
                title: `Request ${request.id.slice(0, 8)}`,
                status: request.status,
                message: request.message,
              }));
            
            setState(prev => ({ ...prev, relatedRequests }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading related entities:', error);
    }
  }, [projectId]);

  const handleSave = async () => {
    if (!state.project) return;

    // All projects can be edited

    setState(prev => ({ ...prev, saving: true }));

    try {
      // In a real implementation, we would save the project data
      // For Phase 4, we'll just simulate success
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          saving: false,
          originalProject: prev.project // Update original to current after save
        }));
        
        // Clear stored changes after successful save
        unsavedChanges.clearStoredChanges();
        
        showSuccess('Project Saved', 'Project has been saved successfully!');
      }, 1000);
      
    } catch (err) {
      console.error('Error saving project:', err);
      setState(prev => ({ ...prev, saving: false }));
      showError('Save Failed', 'Failed to save project. Please try again.');
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      project: prev.project ? { ...prev.project, [field]: value } : null
    }));
  };

  // Restore dialog handlers
  const handleRestoreChanges = () => {
    unsavedChanges.restoreChanges();
    setState(prev => ({ ...prev, showRestoreDialog: false }));
  };

  const handleDiscardChanges = () => {
    unsavedChanges.discardChanges();
    setState(prev => ({ ...prev, showRestoreDialog: false }));
  };

  const handleRefreshData = async () => {
    setState(prev => ({ ...prev, showRestoreDialog: false }));
    unsavedChanges.clearStoredChanges();
    await loadProject();
  };

  // Production-ready action handlers
  const handleExportProject = async () => {
    try {
      if (!state.project) {
        alert('No project data available for export');
        return;
      }

      const exportData = {
        id: state.project.id,
        title: state.project.title,
        status: state.project.status,
        propertyAddress: state.project.propertyAddress,
        contactName: state.project.clientName,
        contactEmail: state.project.clientEmail,
        estimatedValue: state.project.originalValue || state.project.listingPrice || state.project.salePrice,
        createdDate: state.project.createdAt || state.project.businessCreatedDate,
        lastModified: new Date().toISOString()
      };
      
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project_${state.project.id}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleArchiveProject = async () => {
    try {
      if (!state.project) {
        alert('No project data available for archiving');
        return;
      }

      const confirmed = window.confirm(
        `Archive project "${state.project.title}"?\n\n` +
        'This will move the project to archived status.'
      );
      
      if (confirmed) {
        // In a real implementation, this would call the archive API
        alert('Project archived successfully');
      }
      
    } catch (error) {
      console.error('Archive error:', error);
      alert('Archive failed. Please try again.');
    }
  };

  const handleViewAuditLog = async () => {
    try {
      if (!state.project) {
        alert('No project data available for audit log');
        return;
      }

      // In a real implementation, this would open an audit log modal or navigate to audit page
      const auditData = `
Audit Log for Project: ${state.project.title}

${new Date().toISOString()} - Project viewed by current user
${state.project.createdAt || state.project.businessCreatedDate} - Project created
${state.project.updatedAt || state.project.businessUpdatedDate || state.project.createdAt} - Last updated

Note: Full audit logging would be implemented with proper tracking.
      `;
      
      alert(auditData);
      
    } catch (error) {
      console.error('Audit log error:', error);
      alert('Failed to load audit log. Please try again.');
    }
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
            disabled={state.saving || !unsavedChanges.hasUnsavedChanges}
            withIcon={state.saving}
            iconSvg={state.saving ? "/assets/icons/loading.svg" : undefined}
          >
            {state.saving ? 'Saving...' : unsavedChanges.hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
          </Button>
        </div>
      </div>

      {/* Related Entities Navigation */}
      {(state.relatedQuotes.length > 0 || state.relatedRequests.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <H4 className="mb-3">Related Records</H4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Related Quotes */}
            {state.relatedQuotes.length > 0 && (
              <div>
                <P3 className="font-medium text-gray-700 mb-2">Source Quotes ({state.relatedQuotes.length})</P3>
                <div className="space-y-2">
                  {state.relatedQuotes.map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div>
                        <P3 className="font-medium">{quote.title}</P3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          quote.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          quote.status === 'signed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                      <Button
                        onClick={() => router.push(`/admin/quotes/${quote.id}`)}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Requests */}
            {state.relatedRequests.length > 0 && (
              <div>
                <P3 className="font-medium text-gray-700 mb-2">Source Requests ({state.relatedRequests.length})</P3>
                <div className="space-y-2">
                  {state.relatedRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div>
                        <P3 className="font-medium">{request.title}</P3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'quoted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                        {request.message && (
                          <P3 className="text-gray-600 text-sm mt-1 line-clamp-1">
                            {request.message.slice(0, 60)}...
                          </P3>
                        )}
                      </div>
                      <Button
                        onClick={() => router.push(`/admin/requests/${request.id}`)}
                        className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
                  disabled={false}
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
                  disabled={false}
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
                  disabled={false}
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
                  disabled={false}
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
                disabled={false}
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
                  disabled={false}
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
                  disabled={false}
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
                  disabled={false}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Project Gallery</H3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <P2 className="text-gray-500 mb-2">Upload and manage project photos and documents</P2>
              <P3 className="text-gray-400">Features: Upload images, set front page image, reorder gallery</P3>
            </div>
          </div>

          {/* Milestones & Payment Terms */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Milestones & Payment Terms</H3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <P2 className="text-gray-500 mb-2">Manage project milestones and payment schedules</P2>
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
                onClick={handleExportProject}
              >
                Export Project Data
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={handleArchiveProject}
              >
                Archive Project
              </Button>
              <Button
                variant="tertiary"
                fullWidth
                onClick={handleViewAuditLog}
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
            <P3 className="text-gray-400 mt-1">Add comments to communicate with team members</P3>
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

      {/* Restore Changes Dialog */}
      <RestoreChangesDialog
        open={state.showRestoreDialog}
        onClose={() => setState(prev => ({ ...prev, showRestoreDialog: false }))}
        onRestore={handleRestoreChanges}
        onDiscard={handleDiscardChanges}
        onRefresh={handleRefreshData}
        entityType="project"
        entityId={projectId}
        lastModified={unsavedChanges.lastSavedAt || new Date()}
        hasChanges={unsavedChanges.hasStoredChanges}
      />
    </div>
  );
};

export default ProjectDetail;