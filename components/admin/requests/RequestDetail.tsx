import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { H1, H2, H3, H4, P1, P2, P3 } from '../../typography';
import Button from '../../common/buttons/Button';
import { requestsAPI, quotesAPI, projectsAPI } from '../../../utils/amplifyAPI';
import { assignmentService, type AEProfile } from '../../../services/assignmentService';

interface Request {
  id: string;
  status: string;
  product?: string;
  message?: string;
  relationToProperty?: string;
  needFinance?: boolean;
  budget?: string;
  leadSource?: string;
  assignedTo?: string;
  assignedDate?: string;
  requestedVisitDateTime?: string;
  visitDate?: string;
  moveToQuotingDate?: string;
  expiredDate?: string;
  archivedDate?: string;
  officeNotes?: string;
  archived?: string;
  propertyAddress?: string;
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  sizeSqft?: string;
  yearBuilt?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  brokerage?: string;
  createdAt?: string;
  updatedAt?: string;
  businessCreatedDate?: string;
  businessUpdatedDate?: string;
  visitorId?: string;
  bookingId?: string;
  requestedSlot?: string;
  uploadedMedia?: string;
  uplodedDocuments?: string; // Note: typo in schema
  uploadedVideos?: string;
  virtualWalkthrough?: string;
  rtDigitalSelection?: string;
  leadFromSync?: string;
  leadFromVenturaStone?: string;
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;
}

interface RequestMedia {
  id: string;
  requestId: string;
  mediaType?: string;
  fileName?: string;
  fileUrl?: string;
  description?: string;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
}

interface RequestDocument {
  id: string;
  requestId: string;
  documentType?: string;
  fileName?: string;
  fileUrl?: string;
  description?: string;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
}

interface RequestComment {
  id: string;
  requestId: string;
  content: string;
  author?: string;
  isInternal?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RelatedEntity {
  id: string;
  title?: string;
  status?: string;
  quoteNumber?: number;
}

interface RequestDetailState {
  request: Request | null;
  media: RequestMedia[];
  documents: RequestDocument[];
  comments: RequestComment[];
  relatedQuotes: RelatedEntity[];
  relatedProjects: RelatedEntity[];
  availableAEs: AEProfile[];
  loading: boolean;
  saving: boolean;
  error: string;
  hasUnsavedChanges: boolean;
  activeTab: 'details' | 'media' | 'documents' | 'comments';
  showAddMediaModal: boolean;
  showAddDocumentModal: boolean;
  showAddCommentModal: boolean;
  editingMedia: RequestMedia | null;
  editingDocument: RequestDocument | null;
}

interface RequestDetailProps {
  requestId: string;
}

const RequestDetail: React.FC<RequestDetailProps> = ({ requestId }) => {
  const router = useRouter();
  const [state, setState] = useState<RequestDetailState>({
    request: null,
    media: [],
    documents: [],
    comments: [],
    relatedQuotes: [],
    relatedProjects: [],
    availableAEs: [],
    loading: true,
    saving: false,
    error: '',
    hasUnsavedChanges: false,
    activeTab: 'details',
    showAddMediaModal: false,
    showAddDocumentModal: false,
    showAddCommentModal: false,
    editingMedia: null,
    editingDocument: null,
  });

  // Development protection removed - all requests can be edited

  const updateState = useCallback((updates: Partial<RequestDetailState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  const loadRequest = useCallback(async () => {
    try {
      updateState({ loading: true, error: '' });
      const result = await requestsAPI.get(requestId);
      
      if (result.success && result.data) {
        updateState({
          request: result.data,
          loading: false,
        });
      } else {
        updateState({
          error: 'Failed to load request',
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error loading request:', error);
      updateState({
        error: 'Error loading request',
        loading: false,
      });
    }
  }, [requestId, updateState]);

  const loadRelatedEntities = useCallback(async () => {
    try {
      // Load related quotes (quotes that reference this request)
      const quotesResult = await quotesAPI.list();
      if (quotesResult.success) {
        const relatedQuotes = quotesResult.data
          .filter((quote: any) => quote.requestId === requestId)
          .map((quote: any) => ({
            id: quote.id,
            title: quote.title || `Quote #${quote.quoteNumber || quote.id.slice(0, 8)}`,
            status: quote.status,
            quoteNumber: quote.quoteNumber,
          }));
        
        updateState({ relatedQuotes });
      }

      // Load related projects (projects that might be connected through quotes)
      const projectsResult = await projectsAPI.list();
      if (projectsResult.success) {
        // Find projects connected through quotes
        const connectedProjectIds = quotesResult.success 
          ? quotesResult.data
              .filter((quote: any) => quote.requestId === requestId && quote.projectId)
              .map((quote: any) => quote.projectId)
          : [];

        const relatedProjects = projectsResult.data
          .filter((project: any) => connectedProjectIds.includes(project.id))
          .map((project: any) => ({
            id: project.id,
            title: project.title || `Project ${project.id.slice(0, 8)}`,
            status: project.status,
          }));
        
        updateState({ relatedProjects });
      }
    } catch (error) {
      console.error('Error loading related entities:', error);
    }
  }, [requestId, updateState]);

  const loadAEs = useCallback(async () => {
    try {
      const availableAEs = await assignmentService.getAvailableAEs();
      updateState({ availableAEs });
    } catch (error) {
      console.error('Error loading available AEs:', error);
    }
  }, [updateState]);

  useEffect(() => {
    if (requestId) {
      loadRequest();
      loadRelatedEntities();
      loadAEs();
    }
  }, [requestId, loadRequest, loadRelatedEntities, loadAEs]);

  const handleSaveRequest = async () => {
    if (!state.request) return;

    try {
      updateState({ saving: true, error: '' });
      
      const result = await requestsAPI.update(state.request.id, {
        status: state.request.status,
        product: state.request.product,
        message: state.request.message,
        relationToProperty: state.request.relationToProperty,
        needFinance: state.request.needFinance,
        budget: state.request.budget,
        leadSource: state.request.leadSource,
        assignedTo: state.request.assignedTo || 'Unassigned', // Ensure assignment is never empty
        assignedDate: state.request.assignedDate,
        requestedVisitDateTime: state.request.requestedVisitDateTime,
        visitDate: state.request.visitDate,
        moveToQuotingDate: state.request.moveToQuotingDate,
        expiredDate: state.request.expiredDate,
        officeNotes: state.request.officeNotes,
        businessUpdatedDate: new Date().toISOString(),
      });

      if (result.success) {
        updateState({
          saving: false,
          hasUnsavedChanges: false,
        });
        // Reload to get fresh data
        await loadRequest();
      } else {
        throw new Error(typeof result.error === 'string' ? result.error : 'Failed to save request');
      }
    } catch (error) {
      console.error('Error saving request:', error);
      updateState({
        saving: false,
        error: error instanceof Error ? error.message : 'Error saving request',
      });
    }
  };

  const handleRequestChange = (field: keyof Request, value: any) => {
    if (!state.request) return;

    updateState({
      request: { ...state.request, [field]: value },
      hasUnsavedChanges: true,
    });
  };

  const handleAssignmentChange = async (newAssignee: string) => {
    if (!state.request) return;
    
    // Validate assignment if not "Unassigned"
    if (newAssignee && newAssignee !== 'Unassigned') {
      const isValid = await assignmentService.validateAssignment(newAssignee, state.request.id);
      if (!isValid) {
        alert('Selected AE is not available or invalid. Please choose another.');
        return;
      }
    }
    
    // Update assignment and assignedDate
    const assignedDate = newAssignee && newAssignee !== 'Unassigned' 
      ? new Date().toISOString() 
      : null; // Use null instead of undefined for better database compatibility
    
    updateState({
      request: { 
        ...state.request, 
        assignedTo: newAssignee || 'Unassigned', // Ensure we always have a value
        assignedDate: assignedDate || undefined
      },
      hasUnsavedChanges: true,
    });
  };

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <H3 className="mb-4">Request Information</H3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Status</P3>
              <select
                value={state.request?.status || ''}
                onChange={(e) => handleRequestChange('status', e.target.value)}
                disabled={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="submitted">Submitted</option>
                <option value="reviewing">Reviewing</option>
                <option value="quoted">Quoted</option>
                <option value="approved">Approved</option>
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
          
          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Product</P3>
              <input
                type="text"
                value={state.request?.product || ''}
                onChange={(e) => handleRequestChange('product', e.target.value)}
                disabled={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Budget</P3>
              <input
                type="text"
                value={state.request?.budget || ''}
                onChange={(e) => handleRequestChange('budget', e.target.value)}
                disabled={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Lead Source</P3>
              <input
                type="text"
                value={state.request?.leadSource || ''}
                onChange={(e) => handleRequestChange('leadSource', e.target.value)}
                disabled={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Assigned To</P3>
              <select
                value={state.request?.assignedTo || ''}
                onChange={(e) => handleAssignmentChange(e.target.value)}
                disabled={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select AE...</option>
                {state.availableAEs.map((ae) => (
                  <option key={ae.id} value={ae.name}>
                    {ae.name} {ae.email ? `(${ae.email})` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Relation to Property</P3>
              <input
                type="text"
                value={state.request?.relationToProperty || ''}
                onChange={(e) => handleRequestChange('relationToProperty', e.target.value)}
                disabled={false}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block">
            <P3 className="font-medium text-gray-700 mb-1">Message</P3>
            <textarea
              value={state.request?.message || ''}
              onChange={(e) => handleRequestChange('message', e.target.value)}
              disabled={false}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </label>
        </div>

        <div className="mt-4">
          <label className="block">
            <P3 className="font-medium text-gray-700 mb-1">Office Notes</P3>
            <textarea
              value={state.request?.officeNotes || ''}
              onChange={(e) => handleRequestChange('officeNotes', e.target.value)}
              disabled={false}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </label>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={state.request?.needFinance || false}
              onChange={(e) => handleRequestChange('needFinance', e.target.checked)}
              disabled={false}
              className="mr-2"
            />
            <P3 className="text-gray-700">Needs Finance</P3>
          </label>
        </div>
      </div>

      {/* Property Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <H3 className="mb-4">Property Information</H3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <P3 className="font-medium text-gray-700 mb-1">Address</P3>
            <P2 className="text-gray-600">{state.request?.propertyAddress || 'Not provided'}</P2>
          </div>
          
          <div>
            <P3 className="font-medium text-gray-700 mb-1">Property Type</P3>
            <P2 className="text-gray-600">{state.request?.propertyType || 'Not specified'}</P2>
          </div>

          <div>
            <P3 className="font-medium text-gray-700 mb-1">Bedrooms</P3>
            <P2 className="text-gray-600">{state.request?.bedrooms || 'Not specified'}</P2>
          </div>

          <div>
            <P3 className="font-medium text-gray-700 mb-1">Bathrooms</P3>
            <P2 className="text-gray-600">{state.request?.bathrooms || 'Not specified'}</P2>
          </div>

          <div>
            <P3 className="font-medium text-gray-700 mb-1">Size (sq ft)</P3>
            <P2 className="text-gray-600">{state.request?.sizeSqft || 'Not specified'}</P2>
          </div>

          <div>
            <P3 className="font-medium text-gray-700 mb-1">Year Built</P3>
            <P2 className="text-gray-600">{state.request?.yearBuilt || 'Not specified'}</P2>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <H3 className="mb-4">Contact Information</H3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <P3 className="font-medium text-gray-700 mb-1">Client Name</P3>
            <P2 className="text-gray-600">{state.request?.clientName || 'Not provided'}</P2>
          </div>
          
          <div>
            <P3 className="font-medium text-gray-700 mb-1">Client Email</P3>
            <P2 className="text-gray-600">{state.request?.clientEmail || 'Not provided'}</P2>
          </div>

          <div>
            <P3 className="font-medium text-gray-700 mb-1">Client Phone</P3>
            <P2 className="text-gray-600">{state.request?.clientPhone || 'Not provided'}</P2>
          </div>

          <div>
            <P3 className="font-medium text-gray-700 mb-1">Agent Name</P3>
            <P2 className="text-gray-600">{state.request?.agentName || 'Not provided'}</P2>
          </div>

          <div>
            <P3 className="font-medium text-gray-700 mb-1">Agent Email</P3>
            <P2 className="text-gray-600">{state.request?.agentEmail || 'Not provided'}</P2>
          </div>

          <div>
            <P3 className="font-medium text-gray-700 mb-1">Brokerage</P3>
            <P2 className="text-gray-600">{state.request?.brokerage || 'Not provided'}</P2>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMediaTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <H3>Media Files</H3>
          <Button
            onClick={() => updateState({ showAddMediaModal: true })}
            disabled={false}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
          >
            Add Media
          </Button>
        </div>
        
        {state.request?.uploadedMedia ? (
          <div className="text-center py-8">
            <P2 className="text-gray-600">Media URLs: {state.request.uploadedMedia}</P2>
            <P3 className="text-gray-500 mt-2">Media management interface coming soon</P3>
          </div>
        ) : (
          <div className="text-center py-8">
            <P2 className="text-gray-500">No media files uploaded</P2>
          </div>
        )}
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <H3>Documents</H3>
          <Button
            onClick={() => updateState({ showAddDocumentModal: true })}
            disabled={false}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
          >
            Add Document
          </Button>
        </div>
        
        {state.request?.uplodedDocuments ? (
          <div className="text-center py-8">
            <P2 className="text-gray-600">Document URLs: {state.request.uplodedDocuments}</P2>
            <P3 className="text-gray-500 mt-2">Document management interface coming soon</P3>
          </div>
        ) : (
          <div className="text-center py-8">
            <P2 className="text-gray-500">No documents uploaded</P2>
          </div>
        )}
      </div>
    </div>
  );

  const renderCommentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <H3>Comments & Notes</H3>
          <Button
            onClick={() => updateState({ showAddCommentModal: true })}
            disabled={false}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
          >
            Add Comment
          </Button>
        </div>
        
        <div className="text-center py-8">
          <P2 className="text-gray-500">No comments yet</P2>
          <P3 className="text-gray-500 mt-2">Comments interface coming soon</P3>
        </div>
      </div>
    </div>
  );

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="text-center py-12">
        <P1 className="text-red-600 mb-4">Error: {state.error}</P1>
        <Button onClick={loadRequest} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          Retry
        </Button>
      </div>
    );
  }

  if (!state.request) {
    return (
      <div className="text-center py-12">
        <P1 className="text-gray-600">Request not found</P1>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <H1 className="mb-2">Request #{state.request.id.slice(0, 8)}</H1>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                state.request.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                state.request.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                state.request.status === 'quoted' ? 'bg-green-100 text-green-800' :
                state.request.status === 'approved' ? 'bg-green-100 text-green-800' :
                state.request.status === 'expired' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {state.request.status}
              </span>
              {state.request.product && (
                <P2 className="text-gray-600">{state.request.product}</P2>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/admin/requests')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
            >
              Back to Requests
            </Button>
            {state.hasUnsavedChanges && (
              <Button
                onClick={handleSaveRequest}
                disabled={state.saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-blue-400"
              >
                {state.saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>


        {/* Related Entities Navigation */}
        {(state.relatedQuotes.length > 0 || state.relatedProjects.length > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <H4 className="mb-3">Related Records</H4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Related Quotes */}
              {state.relatedQuotes.length > 0 && (
                <div>
                  <P3 className="font-medium text-gray-700 mb-2">Quotes ({state.relatedQuotes.length})</P3>
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

              {/* Related Projects */}
              {state.relatedProjects.length > 0 && (
                <div>
                  <P3 className="font-medium text-gray-700 mb-2">Projects ({state.relatedProjects.length})</P3>
                  <div className="space-y-2">
                    {state.relatedProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div>
                          <P3 className="font-medium">{project.title}</P3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            project.status === 'active' ? 'bg-green-100 text-green-800' :
                            project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <Button
                          onClick={() => router.push(`/admin/projects/${project.id}`)}
                          className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['details', 'media', 'documents', 'comments'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => updateState({ activeTab: tab })}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  state.activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {state.activeTab === 'details' && renderDetailsTab()}
        {state.activeTab === 'media' && renderMediaTab()}
        {state.activeTab === 'documents' && renderDocumentsTab()}
        {state.activeTab === 'comments' && renderCommentsTab()}
      </div>
    </div>
  );
};

export default RequestDetail;