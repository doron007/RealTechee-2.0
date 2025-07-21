import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ErrorMessage } from '@hookform/error-message';
import { H1, H2, H3, H4, P1, P2, P3 } from '../../typography';
import Button from '../../common/buttons/Button';
import { requestsAPI, quotesAPI, projectsAPI, backOfficeProductsAPI, contactsAPI, propertiesAPI } from '../../../utils/amplifyAPI';
import { assignmentService, type AEProfile } from '../../../services/assignmentService';
import { requestStatusService, type RequestStatus } from '../../../services/requestStatusService';
import { quoteCreationService } from '../../../services/quoteCreationService';
import ContactModal from '../../common/modals/ContactModal';
import PropertyModal from '../../common/modals/PropertyModal';
import { MeetingScheduler } from '../meetings';
import StatusAuditTrail from './StatusAuditTrail';
import { FileUploadField } from '../../forms/FileUploadField';
import LeadArchivalDialog from './LeadArchivalDialog';
import LeadReactivationWorkflow from '../lifecycle/LeadReactivationWorkflow';
import type { Contact as ContactType, Property as PropertyType } from '../../../services/dataValidationService';
import type { MeetingDetails } from '../../../services/projectManagerService';
import { IconButton, Button as MuiButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

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

interface Product {
  id: string;
  title: string;
  owner?: string;
  order?: number;
}

// Use the types from the service to avoid conflicts
type Contact = ContactType;
type Property = PropertyType;

// Validation schema for the request detail form
const requestValidationSchema = yup.object({
  status: yup.string().required('Status is required'),
  product: yup.string().required('Product is required'),
  message: yup.string().required('Message is required'),
  relationToProperty: yup.string().required('Relation to property is required'),
  budget: yup.string().required('Budget is required'),
  leadSource: yup.string().required('Lead source is required'),
  assignedTo: yup.string().required('Assignment is required'),
  officeNotes: yup.string().optional(),
  needFinance: yup.boolean().optional(),
  requestedVisitDateTime: yup.string().optional(),
  visitDate: yup.string().optional(),
  virtualWalkthrough: yup.string().optional(),
  rtDigitalSelection: yup.string().optional(),
}).required();

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  key: string;
  category: 'images' | 'videos' | 'docs';
}

interface RequestDetailState {
  request: Request | null;
  media: RequestMedia[];
  documents: RequestDocument[];
  comments: RequestComment[];
  relatedQuotes: RelatedEntity[];
  relatedProjects: RelatedEntity[];
  availableAEs: AEProfile[];
  availableProducts: Product[];
  availableStatuses: RequestStatus[];
  allowedStatusTransitions: string[];
  // Contact and Property data
  homeownerContact: Contact | null;
  agentContact: Contact | null;
  propertyData: Property | null;
  // Loading and error states
  loading: boolean;
  saving: boolean;
  error: string;
  creatingQuote: boolean;
  hasUnsavedChanges: boolean;
  // Tab and modal states
  activeTab: 'details' | 'media' | 'documents' | 'comments';
  showAddMediaModal: boolean;
  showAddDocumentModal: boolean;
  showAddCommentModal: boolean;
  editingMedia: RequestMedia | null;
  editingDocument: RequestDocument | null;
  // Contact and Property modal states
  showContactModal: boolean;
  showPropertyModal: boolean;
  editingContact: Contact | null;
  editingProperty: Property | null;
  contactModalMode: 'create' | 'edit' | 'view';
  propertyModalMode: 'create' | 'edit' | 'view';
  // Lifecycle management states
  showArchivalDialog: boolean;
  showReactivationDialog: boolean;
  // File upload state
  uploadedFiles: UploadedFile[];
  sessionId: string;
}

interface RequestDetailProps {
  requestId: string;
}

const RequestDetail: React.FC<RequestDetailProps> = ({ requestId }) => {
  const router = useRouter();
  
  // React Hook Form setup for validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isDirty }
  } = useForm({
    resolver: yupResolver(requestValidationSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      status: '',
      product: '',
      message: '',
      relationToProperty: '',
      budget: '',
      leadSource: '',
      assignedTo: '',
      officeNotes: '',
      needFinance: false,
      requestedVisitDateTime: '',
      visitDate: '',
      virtualWalkthrough: '',
      rtDigitalSelection: '',
    }
  });
  
  const [state, setState] = useState<RequestDetailState>({
    request: null,
    media: [],
    documents: [],
    comments: [],
    relatedQuotes: [],
    relatedProjects: [],
    availableAEs: [],
    availableProducts: [],
    availableStatuses: [],
    allowedStatusTransitions: [],
    // Contact and Property data
    homeownerContact: null,
    agentContact: null,
    propertyData: null,
    // Loading and error states
    loading: true,
    saving: false,
    error: '',
    creatingQuote: false,
    hasUnsavedChanges: false,
    // Tab and modal states
    activeTab: 'details',
    showAddMediaModal: false,
    showAddDocumentModal: false,
    showAddCommentModal: false,
    editingMedia: null,
    editingDocument: null,
    // Contact and Property modal states
    showContactModal: false,
    showPropertyModal: false,
    editingContact: null,
    editingProperty: null,
    contactModalMode: 'create',
    propertyModalMode: 'create',
    // Lifecycle management states
    showArchivalDialog: false,
    showReactivationDialog: false,
    // File upload state
    uploadedFiles: [],
    sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        // Update form values with the loaded request data
        const request = result.data;
        setValue('status', request.status || '');
        setValue('product', request.product || '');
        setValue('message', request.message || '');
        setValue('relationToProperty', request.relationToProperty || '');
        setValue('budget', request.budget || '');
        setValue('leadSource', request.leadSource || '');
        setValue('assignedTo', request.assignedTo || '');
        setValue('officeNotes', request.officeNotes || '');
        setValue('needFinance', request.needFinance || false);
        setValue('requestedVisitDateTime', request.requestedVisitDateTime || '');
        setValue('visitDate', request.visitDate || '');
        setValue('virtualWalkthrough', request.virtualWalkthrough || '');
        setValue('rtDigitalSelection', request.rtDigitalSelection || '');
        
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
  }, [requestId, updateState, setValue]);

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

  const loadProducts = useCallback(async () => {
    try {
      const result = await backOfficeProductsAPI.list();
      if (result.success && result.data) {
        // Sort products by order field, then by title
        const sortedProducts = result.data.sort((a: Product, b: Product) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return (a.title || '').localeCompare(b.title || '');
        });
        updateState({ availableProducts: sortedProducts });
      }
    } catch (error) {
      console.error('Error loading available products:', error);
    }
  }, [updateState]);

  const loadStatuses = useCallback(async () => {
    try {
      const availableStatuses = await requestStatusService.getAvailableStatuses();
      updateState({ availableStatuses });
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  }, [updateState]);

  const loadAllowedTransitions = useCallback(async () => {
    if (!state.request?.id || !state.request?.status) return;
    
    try {
      const allowedTransitions = await requestStatusService.getAllowedTransitions(
        state.request.id,
        state.request.status,
        'current-user' // TODO: Replace with actual user ID
      );
      updateState({ allowedStatusTransitions: allowedTransitions });
    } catch (error) {
      console.error('Error loading allowed transitions:', error);
    }
  }, [state.request?.id, state.request?.status, updateState]);

  const loadContactAndPropertyData = useCallback(async () => {
    if (!state.request) return;

    try {
      // Load homeowner contact
      if (state.request.homeownerContactId) {
        const homeownerResult = await contactsAPI.get(state.request.homeownerContactId);
        if (homeownerResult.success && homeownerResult.data) {
          updateState({ homeownerContact: homeownerResult.data });
        }
      }

      // Load agent contact
      if (state.request.agentContactId) {
        const agentResult = await contactsAPI.get(state.request.agentContactId);
        if (agentResult.success && agentResult.data) {
          updateState({ agentContact: agentResult.data });
        }
      }

      // Load property data
      if (state.request.addressId) {
        const propertyResult = await propertiesAPI.get(state.request.addressId);
        if (propertyResult.success && propertyResult.data) {
          updateState({ propertyData: propertyResult.data });
        }
      }
    } catch (error) {
      console.error('Error loading contact and property data:', error);
    }
  }, [state.request, updateState]);

  useEffect(() => {
    if (requestId) {
      loadRequest();
      loadRelatedEntities();
      loadAEs();
      loadProducts();
      loadStatuses();
    }
  }, [requestId, loadRequest, loadRelatedEntities, loadAEs, loadProducts, loadStatuses]);

  // Load contact and property data when request data is available
  useEffect(() => {
    if (state.request) {
      loadContactAndPropertyData();
      loadAllowedTransitions();
    }
  }, [state.request, loadContactAndPropertyData, loadAllowedTransitions]);

  const handleSaveRequest = async (formData: any) => {
    if (!state.request) return;

    try {
      updateState({ saving: true, error: '' });
      
      // Get the original request to compare status changes
      const originalResult = await requestsAPI.get(state.request.id);
      const originalStatus = originalResult.success ? originalResult.data?.status : null;
      const statusChanged = originalStatus && originalStatus !== formData.status;
      
      // If status changed, use the status service to handle the change with audit trail
      if (statusChanged) {
        const statusResult = await requestStatusService.changeStatus(
          state.request.id,
          formData.status,
          {
            userId: 'current-user', // TODO: Replace with actual user ID
            triggeredBy: 'user',
            reason: `Status changed from '${originalStatus}' to '${formData.status}' by user`,
          }
        );
        
        if (!statusResult.success) {
          throw new Error(statusResult.error?.message || 'Status change failed');
        }
      }
      
      // Update other request fields
      const result = await requestsAPI.update(state.request.id, {
        status: formData.status,
        product: formData.product,
        message: formData.message,
        relationToProperty: formData.relationToProperty,
        needFinance: formData.needFinance,
        budget: formData.budget,
        leadSource: formData.leadSource,
        assignedTo: formData.assignedTo || 'Unassigned', // Ensure assignment is never empty
        assignedDate: state.request.assignedDate,
        requestedVisitDateTime: formData.requestedVisitDateTime,
        visitDate: formData.visitDate,
        virtualWalkthrough: formData.virtualWalkthrough,
        rtDigitalSelection: formData.rtDigitalSelection,
        moveToQuotingDate: state.request.moveToQuotingDate,
        expiredDate: state.request.expiredDate,
        officeNotes: formData.officeNotes,
        businessUpdatedDate: new Date().toISOString(),
      });

      if (result.success) {
        updateState({
          saving: false,
          hasUnsavedChanges: false,
        });
        // Reload to get fresh data and update allowed transitions
        await loadRequest();
        await loadAllowedTransitions();
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

  // Watch form changes to detect unsaved changes
  const watchedValues = watch();
  const hasUnsavedChanges = isDirty && Object.keys(errors).length === 0;

  // Lifecycle management handlers
  const handleOpenArchivalDialog = () => {
    updateState({ showArchivalDialog: true });
  };

  const handleCloseArchivalDialog = () => {
    updateState({ showArchivalDialog: false });
  };

  const handleArchivalSuccess = () => {
    // Reload the request to get updated status
    loadRequest();
    updateState({ showArchivalDialog: false });
  };

  const handleOpenReactivationDialog = () => {
    updateState({ showReactivationDialog: true });
  };

  const handleCloseReactivationDialog = () => {
    updateState({ showReactivationDialog: false });
  };

  const handleReactivationSuccess = () => {
    // Reload the request to get updated status
    loadRequest();
    updateState({ showReactivationDialog: false });
  };

  const handleCreateQuote = async () => {
    if (!state.request) return;

    try {
      updateState({ creatingQuote: true, error: '' });

      const result = await quoteCreationService.createQuoteFromRequest(
        state.request.id,
        {
          userId: 'current-user', // TODO: Replace with actual user ID
          automaticStatusUpdate: true,
          additionalData: {
            title: `Quote for ${state.request.id.slice(0, 8)} - ${state.request.product || 'Services'}`,
            assignedTo: state.request.assignedTo,
          }
        }
      );

      if (result.success && result.quoteId) {
        updateState({ creatingQuote: false });
        
        // Reload related entities to show the new quote
        loadRelatedEntities();
        
        // Navigate to the new quote
        router.push(`/admin/quotes/${result.quoteId}`);
      } else {
        throw new Error(result.error?.message || 'Quote creation failed');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      updateState({
        creatingQuote: false,
        error: error instanceof Error ? error.message : 'Error creating quote',
      });
    }
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
    
    // Update assignment and assignedDate in the local state
    const assignedDate = newAssignee && newAssignee !== 'Unassigned' 
      ? new Date().toISOString() 
      : null;
    
    updateState({
      request: { 
        ...state.request, 
        assignedTo: newAssignee || 'Unassigned',
        assignedDate: assignedDate || undefined
      },
    });
  };

  // Contact modal handlers
  const handleOpenContactModal = (contact: Contact | null, mode: 'create' | 'edit' | 'view') => {
    updateState({
      showContactModal: true,
      editingContact: contact,
      contactModalMode: mode,
    });
  };

  const handleCloseContactModal = () => {
    updateState({
      showContactModal: false,
      editingContact: null,
      contactModalMode: 'create',
    });
  };

  const handleSaveContact = async (contact: Contact) => {
    if (!state.request || !contact.id) return;
    
    try {
      // Determine if this is a homeowner or agent contact based on context
      // This is a simplified approach - in a real implementation you might want to be more explicit
      const isAgent = contact.brokerage || state.editingContact === state.agentContact;
      
      const updateData: any = {
        businessUpdatedDate: new Date().toISOString(),
      };
      
      if (isAgent) {
        updateData.agentContactId = contact.id;
      } else {
        updateData.homeownerContactId = contact.id;
      }
      
      // Update the request to link to the contact
      const result = await requestsAPI.update(state.request.id, updateData);
      
      if (!result.success) {
        console.error('Failed to link contact to request:', result.error);
        alert('Contact saved but failed to link to request. Please try refreshing the page.');
        return;
      }
      
      // Update local state
      updateState({
        request: { ...state.request, ...updateData }
      });
      
      // Refresh contact data to show the updated information
      await loadContactAndPropertyData();
    } catch (error) {
      console.error('Error linking contact to request:', error);
      alert('Contact saved but failed to link to request. Please try refreshing the page.');
    }
  };

  // Property modal handlers
  const handleOpenPropertyModal = (property: Property | null, mode: 'create' | 'edit' | 'view') => {
    updateState({
      showPropertyModal: true,
      editingProperty: property,
      propertyModalMode: mode,
    });
  };

  const handleClosePropertyModal = () => {
    updateState({
      showPropertyModal: false,
      editingProperty: null,
      propertyModalMode: 'create',
    });
  };

  const handleSaveProperty = async (property: Property) => {
    if (!state.request) return;
    
    try {
      // Update the request to link to the property
      if (property.id && property.id !== state.request.addressId) {
        const result = await requestsAPI.update(state.request.id, {
          addressId: property.id,
          businessUpdatedDate: new Date().toISOString(),
        });
        
        if (!result.success) {
          console.error('Failed to link property to request:', result.error);
          alert('Property saved but failed to link to request. Please try refreshing the page.');
          return;
        }
        
        // Update local state
        updateState({
          request: { ...state.request, addressId: property.id }
        });
      }
      
      // Refresh property data to show the updated information
      await loadContactAndPropertyData();
    } catch (error) {
      console.error('Error linking property to request:', error);
      alert('Property saved but failed to link to request. Please try refreshing the page.');
    }
  };

  // Meeting scheduler handler
  const handleMeetingScheduled = async (meetingDetails: MeetingDetails) => {
    // Reload request to get updated meeting data
    await loadRequest();
  };

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <H3 className="mb-4">Request Information</H3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Status*</P3>
              <div className="flex gap-2">
                <select
                  {...register('status')}
                  disabled={state.saving}
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                    errors.status ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Status...</option>
                  {state.allowedStatusTransitions.length > 0 ? (
                    state.allowedStatusTransitions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))
                  ) : (
                    state.availableStatuses.map((status) => (
                      <option key={status.id} value={status.title}>
                        {status.title}
                      </option>
                    ))
                  )}
                </select>
                {state.request?.status !== 'New' && state.request?.status && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue('status', 'New');
                      updateState({
                        hasUnsavedChanges: true,
                      });
                    }}
                    disabled={state.saving}
                    className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 text-sm whitespace-nowrap"
                    title="Reset status to 'New' to restart the state machine"
                  >
                    Reset to New
                  </button>
                )}
              </div>
              <ErrorMessage
                errors={errors}
                name="status"
                render={({ message }) => (
                  <P3 className="text-red-600 mt-1">{message}</P3>
                )}
              />
            </label>
          </div>
          
          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Product*</P3>
              <select
                {...register('product')}
                disabled={state.saving}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  errors.product ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Product...</option>
                {state.availableProducts.map((product) => (
                  <option key={product.id} value={product.title}>
                    {product.title}
                  </option>
                ))}
              </select>
              <ErrorMessage
                errors={errors}
                name="product"
                render={({ message }) => (
                  <P3 className="text-red-600 mt-1">{message}</P3>
                )}
              />
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Budget*</P3>
              <input
                type="text"
                {...register('budget')}
                disabled={state.saving}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  errors.budget ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <ErrorMessage
                errors={errors}
                name="budget"
                render={({ message }) => (
                  <P3 className="text-red-600 mt-1">{message}</P3>
                )}
              />
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Lead Source*</P3>
              <select
                {...register('leadSource')}
                disabled={state.saving}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  errors.leadSource ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Lead Source...</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Real Estate Agent">Real Estate Agent</option>
                <option value="Social Media">Social Media</option>
                <option value="Google Search">Google Search</option>
                <option value="Print Advertisement">Print Advertisement</option>
                <option value="Trade Show">Trade Show</option>
                <option value="Direct Mail">Direct Mail</option>
                <option value="Other">Other</option>
              </select>
              <ErrorMessage
                errors={errors}
                name="leadSource"
                render={({ message }) => (
                  <P3 className="text-red-600 mt-1">{message}</P3>
                )}
              />
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Assigned To*</P3>
              <select
                {...register('assignedTo')}
                onChange={(e) => {
                  setValue('assignedTo', e.target.value);
                  handleAssignmentChange(e.target.value);
                }}
                disabled={state.saving}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  errors.assignedTo ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select AE...</option>
                {state.availableAEs.map((ae) => (
                  <option key={ae.id} value={ae.name}>
                    {ae.name} {ae.email ? `(${ae.email})` : ''}
                  </option>
                ))}
              </select>
              <ErrorMessage
                errors={errors}
                name="assignedTo"
                render={({ message }) => (
                  <P3 className="text-red-600 mt-1">{message}</P3>
                )}
              />
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Relation to Property*</P3>
              <select
                {...register('relationToProperty')}
                disabled={state.saving}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                  errors.relationToProperty ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Relation...</option>
                <option value="Owner">Owner</option>
                <option value="Real Estate Agent">Real Estate Agent</option>
                <option value="Family Member">Family Member</option>
                <option value="Property Manager">Property Manager</option>
                <option value="Contractor">Contractor</option>
                <option value="Other">Other</option>
              </select>
              <ErrorMessage
                errors={errors}
                name="relationToProperty"
                render={({ message }) => (
                  <P3 className="text-red-600 mt-1">{message}</P3>
                )}
              />
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block">
            <P3 className="font-medium text-gray-700 mb-1">Message*</P3>
            <textarea
              {...register('message')}
              disabled={state.saving}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <ErrorMessage
              errors={errors}
              name="message"
              render={({ message }) => (
                <P3 className="text-red-600 mt-1">{message}</P3>
              )}
            />
          </label>
        </div>

        <div className="mt-4">
          <label className="block">
            <P3 className="font-medium text-gray-700 mb-1">Office Notes</P3>
            <textarea
              {...register('officeNotes')}
              disabled={state.saving}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </label>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('needFinance')}
              disabled={state.saving}
              className="mr-2"
            />
            <P3 className="text-gray-700">Needs Finance</P3>
          </label>
        </div>
      </div>

      {/* Meeting Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <H3 className="mb-4">Meeting Information</H3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Requested Visit Date/Time</P3>
              <input
                type="datetime-local"
                {...register('requestedVisitDateTime')}
                disabled={state.saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Virtual Walkthrough</P3>
              <select
                {...register('virtualWalkthrough')}
                disabled={state.saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Option...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Either">Either</option>
              </select>
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">Visit Date</P3>
              <input
                type="date"
                {...register('visitDate')}
                disabled={state.saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </label>
          </div>

          <div>
            <label className="block">
              <P3 className="font-medium text-gray-700 mb-1">RT Digital Selection</P3>
              <select
                {...register('rtDigitalSelection')}
                disabled={state.saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Option...</option>
                <option value="upload">Upload</option>
                <option value="meeting">Meeting</option>
                <option value="both">Both</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Meeting Scheduling & PM Assignment */}
      <MeetingScheduler
        requestId={state.request?.id || ''}
        currentMeetingData={{
          requestedVisitDateTime: state.request?.requestedVisitDateTime,
          visitDate: state.request?.visitDate,
          virtualWalkthrough: state.request?.virtualWalkthrough,
        }}
        contactInfo={{
          homeownerContactId: state.request?.homeownerContactId,
          agentContactId: state.request?.agentContactId,
          propertyAddress: state.propertyData?.propertyFullAddress || state.request?.propertyAddress,
        }}
        onMeetingScheduled={handleMeetingScheduled}
        disabled={state.saving}
      />

      {/* Property Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <H3>Property Information</H3>
          <div className="flex gap-2">
            {state.propertyData ? (
              <IconButton
                onClick={() => handleOpenPropertyModal(state.propertyData, 'edit')}
                className="text-blue-600 hover:text-blue-800"
                size="small"
              >
                <EditIcon />
              </IconButton>
            ) : (
              <IconButton
                onClick={() => handleOpenPropertyModal(null, 'create')}
                className="text-green-600 hover:text-green-800"
                size="small"
              >
                <AddIcon />
              </IconButton>
            )}
          </div>
        </div>
        
        {state.propertyData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <P3 className="font-medium text-gray-700 mb-1">Address</P3>
              <P2 className="text-gray-600">{state.propertyData.propertyFullAddress || 'Not provided'}</P2>
            </div>
            
            <div>
              <P3 className="font-medium text-gray-700 mb-1">Property Type</P3>
              <P2 className="text-gray-600">{state.propertyData.propertyType || 'Not specified'}</P2>
            </div>

            <div>
              <P3 className="font-medium text-gray-700 mb-1">Bedrooms</P3>
              <P2 className="text-gray-600">{state.propertyData.bedrooms || 'Not specified'}</P2>
            </div>

            <div>
              <P3 className="font-medium text-gray-700 mb-1">Bathrooms</P3>
              <P2 className="text-gray-600">{state.propertyData.bathrooms || 'Not specified'}</P2>
            </div>

            <div>
              <P3 className="font-medium text-gray-700 mb-1">Size (sq ft)</P3>
              <P2 className="text-gray-600">{state.propertyData.sizeSqft || 'Not specified'}</P2>
            </div>

            <div>
              <P3 className="font-medium text-gray-700 mb-1">Year Built</P3>
              <P2 className="text-gray-600">{state.propertyData.yearBuilt || 'Not specified'}</P2>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <P2 className="text-gray-500 mb-2">No property information available</P2>
            <P3 className="text-gray-400">Click the + button to add property details</P3>
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <H3 className="mb-4">Contact Information</H3>
        
        {/* Homeowner Contact */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <H4>Homeowner Contact</H4>
            <div className="flex gap-2">
              {state.homeownerContact ? (
                <IconButton
                  onClick={() => handleOpenContactModal(state.homeownerContact, 'edit')}
                  className="text-blue-600 hover:text-blue-800"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              ) : (
                <IconButton
                  onClick={() => handleOpenContactModal(null, 'create')}
                  className="text-green-600 hover:text-green-800"
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              )}
            </div>
          </div>
          
          {state.homeownerContact ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <P3 className="font-medium text-gray-700 mb-1">Name</P3>
                <P2 className="text-gray-600">{state.homeownerContact.fullName || 'Not provided'}</P2>
              </div>
              <div>
                <P3 className="font-medium text-gray-700 mb-1">Email</P3>
                <P2 className="text-gray-600">{state.homeownerContact.email || 'Not provided'}</P2>
              </div>
              <div>
                <P3 className="font-medium text-gray-700 mb-1">Phone</P3>
                <P2 className="text-gray-600">{state.homeownerContact.phone || 'Not provided'}</P2>
              </div>
              <div>
                <P3 className="font-medium text-gray-700 mb-1">Mobile</P3>
                <P2 className="text-gray-600">{state.homeownerContact.mobile || 'Not provided'}</P2>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <P2 className="text-gray-500 mb-2">No homeowner contact information</P2>
              <P3 className="text-gray-400">Click the + button to add contact details</P3>
            </div>
          )}
        </div>

        {/* Agent Contact */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <H4>Agent Contact</H4>
            <div className="flex gap-2">
              {state.agentContact ? (
                <IconButton
                  onClick={() => handleOpenContactModal(state.agentContact, 'edit')}
                  className="text-blue-600 hover:text-blue-800"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              ) : (
                <IconButton
                  onClick={() => handleOpenContactModal(null, 'create')}
                  className="text-green-600 hover:text-green-800"
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              )}
            </div>
          </div>
          
          {state.agentContact ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <P3 className="font-medium text-gray-700 mb-1">Name</P3>
                <P2 className="text-gray-600">{state.agentContact.fullName || 'Not provided'}</P2>
              </div>
              <div>
                <P3 className="font-medium text-gray-700 mb-1">Email</P3>
                <P2 className="text-gray-600">{state.agentContact.email || 'Not provided'}</P2>
              </div>
              <div>
                <P3 className="font-medium text-gray-700 mb-1">Phone</P3>
                <P2 className="text-gray-600">{state.agentContact.phone || 'Not provided'}</P2>
              </div>
              <div>
                <P3 className="font-medium text-gray-700 mb-1">Brokerage</P3>
                <P2 className="text-gray-600">{state.agentContact.brokerage || 'Not provided'}</P2>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <P2 className="text-gray-500 mb-2">No agent contact information</P2>
              <P3 className="text-gray-400">Click the + button to add contact details</P3>
            </div>
          )}
        </div>

        {/* Fallback to Request Data */}
        {(!state.homeownerContact || !state.agentContact) && (
          <div className="border-t pt-4">
            <H4 className="mb-4">Request Form Data</H4>
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
        )}
      </div>

      {/* Status Audit Trail */}
      <StatusAuditTrail
        requestId={state.request?.id || ''}
        officeNotes={state.request?.officeNotes || ''}
        className="mt-6"
      />
    </div>
  );

  const renderMediaTab = () => {
    const addressInfo = state.propertyData ? {
      streetAddress: state.propertyData.houseAddress || '',
      city: state.propertyData.city || '',
      state: state.propertyData.state || '',
      zip: state.propertyData.zip || ''
    } : {
      streetAddress: state.request?.propertyAddress || 'unknown',
      city: 'unknown',
      state: 'unknown',
      zip: 'unknown'
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <H3 className="mb-4">Media Files</H3>
          <P3 className="text-[#646469] mb-6">
            Upload images and videos related to this request. Files will be organized by address and session.
          </P3>
          
          <FileUploadField
            onFilesChange={(files) => {
              const mediaFiles = files.filter(f => f.category === 'images' || f.category === 'videos');
              updateState({ uploadedFiles: [...state.uploadedFiles.filter(f => f.category === 'docs'), ...mediaFiles] });
            }}
            maxFileSize={25}
            addressInfo={addressInfo}
            sessionId={state.sessionId}
          />
          
          {/* Display uploaded media files */}
          {state.uploadedFiles.filter(f => f.category === 'images' || f.category === 'videos').length > 0 && (
            <div className="mt-6">
              <H4 className="mb-4">Uploaded Media</H4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {state.uploadedFiles
                  .filter(f => f.category === 'images' || f.category === 'videos')
                  .map((file) => (
                    <div key={file.id} className="relative group">
                      {file.category === 'images' ? (
                        <Image
                          src={file.url}
                          alt={file.name}
                          width={128}
                          height={128}
                          className="w-full h-32 object-cover rounded border border-[#E4E4E4]"
                        />
                      ) : (
                        <video
                          src={file.url}
                          className="w-full h-32 object-cover rounded border border-[#E4E4E4]"
                          controls
                        />
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <P3 className="text-white text-center px-2">
                          {file.name}
                        </P3>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDocumentsTab = () => {
    const addressInfo = state.propertyData ? {
      streetAddress: state.propertyData.houseAddress || '',
      city: state.propertyData.city || '',
      state: state.propertyData.state || '',
      zip: state.propertyData.zip || ''
    } : {
      streetAddress: state.request?.propertyAddress || 'unknown',
      city: 'unknown',
      state: 'unknown',
      zip: 'unknown'
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <H3 className="mb-4">Document Files</H3>
          <P3 className="text-[#646469] mb-6">
            Upload documents such as PDFs, Word files, or other relevant files for this request.
          </P3>
          
          <FileUploadField
            onFilesChange={(files) => {
              const docFiles = files.filter(f => f.category === 'docs');
              updateState({ uploadedFiles: [...state.uploadedFiles.filter(f => f.category !== 'docs'), ...docFiles] });
            }}
            maxFileSize={15}
            addressInfo={addressInfo}
            sessionId={state.sessionId}
          />
          
          {/* Display uploaded documents */}
          {state.uploadedFiles.filter(f => f.category === 'docs').length > 0 && (
            <div className="mt-6">
              <H4 className="mb-4">Uploaded Documents</H4>
              <div className="space-y-3">
                {state.uploadedFiles
                  .filter(f => f.category === 'docs')
                  .map((file) => (
                    <div key={file.id} className="flex items-center gap-4 p-4 bg-[#F9F4F3] border border-[#E4E4E4] rounded hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <P3 className="font-medium text-[#2A2B2E] truncate">
                          {file.name}
                        </P3>
                        <P3 className="text-[#646469] text-sm">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                        </P3>
                      </div>
                      <div className="flex gap-2">
                        <MuiButton
                          variant="outlined"
                          size="small"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          View
                        </MuiButton>
                        <MuiButton
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.download = file.name;
                            link.click();
                          }}
                        >
                          Download
                        </MuiButton>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

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
            
            {/* Archive Button - Show for active requests */}
            {['New', 'Pending walk-thru', 'Move to Quoting'].includes(state.request.status) && (
              <Button
                onClick={handleOpenArchivalDialog}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Archive Lead
              </Button>
            )}

            {/* Reactivate Button - Show for archived/expired requests */}
            {(['Archived', 'Expired'].includes(state.request.status)) && (
              <Button
                onClick={handleOpenReactivationDialog}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md"
              >
                Reactivate Lead
              </Button>
            )}

            {/* Create Quote Button - Show when request is ready */}
            {(state.request.status === 'Move to Quoting' || state.request.status === 'Pending walk-thru') && (
              <Button
                onClick={handleCreateQuote}
                disabled={state.creatingQuote}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:bg-green-400"
              >
                {state.creatingQuote ? 'Creating Quote...' : 'Create Quote'}
              </Button>
            )}
            
            {hasUnsavedChanges && (
              <Button
                onClick={handleSubmit(handleSaveRequest)}
                disabled={state.saving || !isValid}
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

      {/* Contact Modal */}
      <ContactModal
        open={state.showContactModal}
        onClose={handleCloseContactModal}
        contact={state.editingContact}
        onSave={handleSaveContact}
        mode={state.contactModalMode}
      />

      {/* Property Modal */}
      <PropertyModal
        open={state.showPropertyModal}
        onClose={handleClosePropertyModal}
        property={state.editingProperty}
        onSave={handleSaveProperty}
        mode={state.propertyModalMode}
      />

      {/* Lead Archival Dialog */}
      <LeadArchivalDialog
        open={state.showArchivalDialog}
        onClose={handleCloseArchivalDialog}
        requestId={state.request?.id || ''}
        requestData={state.request}
        onSuccess={handleArchivalSuccess}
      />

      {/* Lead Reactivation Workflow */}
      <LeadReactivationWorkflow
        open={state.showReactivationDialog}
        onClose={handleCloseReactivationDialog}
        requestId={state.request?.id || ''}
        requestData={state.request}
        onSuccess={handleReactivationSuccess}
      />
    </div>
  );
};

export default RequestDetail;