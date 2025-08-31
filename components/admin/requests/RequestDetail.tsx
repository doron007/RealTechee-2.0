import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ErrorMessage } from '@hookform/error-message';
import { H1, H2, H3, H4, P1, P2, P3 } from '../../typography';
import Button from '../../common/buttons/Button';
import { requestsAPI, quotesAPI, projectsAPI, getBackOfficeProductsAPI, contactsAPI, propertiesAPI } from '../../../utils/amplifyAPI';
import { enhancedRequestsService } from '../../../services/enhancedRequestsService';
import { assignmentService, type AEProfile } from '../../../services/assignmentService';
import { requestStatusService, type RequestStatus } from '../../../services/requestStatusService';
import { quoteCreationService } from '../../../services/quoteCreationService';
import { enhancedCaseService } from '../../../services/enhancedCaseService';
import { caseManagementService } from '../../../services/caseManagementService';
import { requestWorkflowService, REQUEST_STATUSES } from '../../../services/requestWorkflowService';
import ContactModal from '../../common/modals/ContactModal';
import PropertyModal from '../../common/modals/PropertyModal';
import { MeetingScheduler } from '../meetings';
import StatusAuditTrail from './StatusAuditTrail';
import { FileUploadField } from '../../forms/FileUploadField';
import LeadArchivalDialog from './LeadArchivalDialog';
import LeadReactivationWorkflow from '../lifecycle/LeadReactivationWorkflow';
import MediaPreviewModal from './MediaPreviewModal';
import type { Contact as ContactType, Property as PropertyType } from '../../../services/dataValidationService';
import type { MeetingDetails } from '../../../services/projectManagerService';
import {
  type EnhancedRequest,
  type CaseOverview,
  type CaseNote,
  type CaseAssignment,
  type InformationItem,
  type ScopeItem,
  type NoteFormData,
  type AssignmentFormData,
  type InformationItemFormData,
  type ScopeItemFormData,
  NOTE_TYPES,
  INFORMATION_CATEGORIES,
  INFORMATION_STATUSES,
  SCOPE_CATEGORIES
} from '../../../types/caseManagement';
import { IconButton, Button as MuiButton, Chip, LinearProgress, Collapse, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Accordion, AccordionSummary, AccordionDetails, Card, CardContent, CardHeader, Typography, Tooltip, Badge } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotesIcon from '@mui/icons-material/Notes';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import TimelineIcon from '@mui/icons-material/Timeline';
import ListIcon from '@mui/icons-material/List';
import BuildIcon from '@mui/icons-material/Build';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import MessageIcon from '@mui/icons-material/Message';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StatusPill from '../../common/ui/StatusPill';
import { getFullUrlFromPath, parseFileUrlsToRelativePaths } from '../../../utils/s3Utils';

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
  activeTab: 'details' | 'media' | 'documents' | 'comments' | 'case-management';
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
  // Database file URLs parsed from JSON strings
  existingMediaFiles: string[];
  existingVideoFiles: string[];
  existingDocumentFiles: string[];
  // Media preview modal states
  showPreviewModal: boolean;
  previewModalData: {
    url: string;
    type: 'image' | 'video' | 'document';
    fileName: string;
  } | null;
  // Case management states
  caseOverview: CaseOverview | null;
  caseNotes: CaseNote[];
  caseAssignments: CaseAssignment[];
  informationItems: InformationItem[];
  scopeItems: ScopeItem[];
  caseLoading: boolean;
  // Case management modals
  showAddNoteModal: boolean;
  showAddAssignmentModal: boolean;
  showAddInformationModal: boolean;
  showAddScopeModal: boolean;
  showTransferAssignmentModal: boolean;
  editingNoteId: string | null;
  editingAssignmentId: string | null;
  selectedAssignmentForTransfer: CaseAssignment | null;
  // Case management form data
  noteFormData: NoteFormData;
  assignmentFormData: AssignmentFormData;
  informationFormData: InformationItemFormData;
  scopeFormData: ScopeItemFormData;
  transferFormData: { transferToId: string; transferToName: string; reason: string };
  // Case management filters and display
  notesFilter: 'all' | 'internal' | 'client_communication' | 'follow_up';
  showPrivateNotes: boolean;
  expandedSections: {
    overview: boolean;
    notes: boolean;
    assignments: boolean;
    information: boolean;
    scope: boolean;
    workflow: boolean;
  };
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
    // Database file URLs parsed from JSON strings
    existingMediaFiles: [],
    existingVideoFiles: [],
    existingDocumentFiles: [],
    // Media preview modal states
    showPreviewModal: false,
    previewModalData: null,
    // Case management states
    caseOverview: null,
    caseNotes: [],
    caseAssignments: [],
    informationItems: [],
    scopeItems: [],
    caseLoading: false,
    // Case management modals
    showAddNoteModal: false,
    showAddAssignmentModal: false,
    showAddInformationModal: false,
    showAddScopeModal: false,
    showTransferAssignmentModal: false,
    editingNoteId: null,
    editingAssignmentId: null,
    selectedAssignmentForTransfer: null,
    // Case management form data
    noteFormData: {
      content: '',
      type: 'internal',
      category: '',
      isPrivate: true,
      followUpRequired: false,
      priority: 'normal',
      tags: []
    },
    assignmentFormData: {
      assignedToId: '',
      assignedToName: '',
      assignedToRole: '',
      assignmentType: 'primary',
      assignmentReason: '',
      priority: 'normal'
    },
    informationFormData: {
      category: 'client',
      itemName: '',
      description: '',
      importance: 'required',
      followUpRequired: false
    },
    scopeFormData: {
      category: 'room',
      name: '',
      description: '',
      complexity: 'moderate'
    },
    transferFormData: { transferToId: '', transferToName: '', reason: '' },
    // Case management filters and display
    notesFilter: 'all',
    showPrivateNotes: true,
    expandedSections: {
      overview: true,
      notes: true,
      assignments: false,
      information: false,
      scope: false,
      workflow: false
    }
  });

  // Development protection removed - all requests can be edited

  const updateState = useCallback((updates: Partial<RequestDetailState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  const loadRequest = useCallback(async () => {
    try {
      updateState({ loading: true, error: '' });
      const result = await enhancedRequestsService.getRequestByIdWithRelations(requestId);
      
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
        
        // Since the enhanced service provides related data through GraphQL relations,
        // we need to construct the contact and property objects from the request data
        const homeownerContact = request.clientName ? {
          id: request.homeownerContactId || 'from-request-data',
          fullName: request.clientName,
          firstName: request.clientName?.split(' ')[0] || '',
          lastName: request.clientName?.split(' ').slice(1).join(' ') || '',
          email: request.clientEmail,
          phone: request.clientPhone,
          mobile: request.clientPhone,
        } as Contact : null;

        const agentContact = request.agentName ? {
          id: request.agentContactId || 'from-request-data',
          fullName: request.agentName,
          firstName: request.agentName?.split(' ')[0] || '',
          lastName: request.agentName?.split(' ').slice(1).join(' ') || '',
          email: request.agentEmail,
          phone: request.agentPhone,
          mobile: request.agentPhone,
          brokerage: request.brokerage,
        } as Contact : null;

        const propertyData = request.propertyAddress ? {
          id: request.addressId || 'from-request-data',
          propertyFullAddress: request.propertyAddress,
          houseAddress: request.propertyAddress?.split(',')[0] || '',
          city: request.propertyAddress?.split(',')[1]?.trim() || '',
          state: request.propertyAddress?.split(',')[2]?.trim() || '',
          zip: request.propertyAddress?.split(',')[3]?.trim() || '',
          propertyType: request.propertyType,
          bedrooms: parseInt(request.bedrooms || '0') || undefined,
          bathrooms: parseInt(request.bathrooms || '0') || undefined,
          sizeSqft: parseInt(request.sizeSqft || '0') || undefined,
          yearBuilt: parseInt(request.yearBuilt || '0') || undefined,
        } as Property : null;

        // Parse existing files from database JSON strings
        const existingMediaFiles = parseFileUrlsToRelativePaths(result.data.uploadedMedia || null);
        const existingVideoFiles = parseFileUrlsToRelativePaths(result.data.uploadedVideos || null);
        const existingDocumentFiles = parseFileUrlsToRelativePaths(result.data.uplodedDocuments || null); // Note: typo in field name
        
        updateState({
          request: result.data,
          homeownerContact,
          agentContact,
          propertyData,
          existingMediaFiles,
          existingVideoFiles,
          existingDocumentFiles,
          loading: false,
        });
      } else {
        updateState({
          error: result.error || 'Failed to load request',
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
    // Use static fallback products to completely avoid BackOfficeProducts model runtime errors
    // This prevents "Model BackOfficeProducts not available on client" errors
    const defaultProducts: Product[] = [
      { id: '1', title: 'Kitchen Renovation', order: 1 },
      { id: '2', title: 'Bathroom Renovation', order: 2 },
      { id: '3', title: 'Full Home Renovation', order: 3 },
      { id: '4', title: 'Custom Project', order: 4 },
    ];
    
    updateState({ availableProducts: defaultProducts });
    console.log('✅ Using static fallback products (BackOfficeProducts API disabled to prevent runtime errors)');
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

  const loadCaseManagementData = useCallback(async () => {
    if (!requestId) return;
    
    try {
      updateState({ caseLoading: true });
      
      // Load case overview and all related data with graceful handling
      const [overviewResult, notesResult, assignmentsResult, informationResult, scopeResult] = await Promise.all([
        enhancedCaseService.getCaseOverview(requestId).catch(err => {
          console.warn('Case overview unavailable:', err.message);
          return { success: false, data: null };
        }),
        enhancedCaseService.getCaseNotes(requestId).catch(err => {
          console.warn('Case notes unavailable:', err.message);
          return { success: false, data: [] };
        }),
        caseManagementService.getAssignmentHistory(requestId).catch(err => {
          console.warn('Assignment history unavailable:', err.message);
          return { success: false, data: [] };
        }),
        caseManagementService.getInformationChecklist(requestId).catch(err => {
          console.warn('Information checklist unavailable:', err.message);
          return { success: false, data: [] };
        }),
        caseManagementService.getScopeDefinition(requestId).catch(err => {
          console.warn('Scope definition unavailable:', err.message);
          return { success: false, data: [] };
        })
      ]);
      
      updateState({
        caseOverview: overviewResult.success ? overviewResult.data || null : null,
        caseNotes: notesResult.success ? notesResult.data || [] : [],
        caseAssignments: assignmentsResult.success ? assignmentsResult.data || [] : [],
        informationItems: informationResult.success ? informationResult.data || [] : [],
        scopeItems: scopeResult.success ? scopeResult.data || [] : [],
        caseLoading: false,
      });
    } catch (error) {
      console.error('Error loading case management data:', error);
      updateState({ caseLoading: false });
    }
  }, [requestId, updateState]);

  useEffect(() => {
    if (requestId) {
      loadRequest();
      loadRelatedEntities();
      loadAEs();
      loadProducts();
      loadStatuses();
    }
  }, [requestId, loadRequest, loadRelatedEntities, loadAEs, loadProducts, loadStatuses]);

  // Load allowed transitions when request data is available
  useEffect(() => {
    if (state.request) {
      loadAllowedTransitions();
    }
  }, [state.request, loadAllowedTransitions]);

  // Load case management data when case management tab is activated
  useEffect(() => {
    if (state.activeTab === 'case-management' && requestId && !state.caseLoading) {
      loadCaseManagementData();
    }
  }, [state.activeTab, requestId, state.caseLoading, loadCaseManagementData]);

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
      
      // Update other request fields using enhanced service
      const result = await enhancedRequestsService.updateRequest(state.request.id, {
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
      
      // Reload request data to get updated information
      await loadRequest();
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
      
      // Reload request data to get updated information
      await loadRequest();
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

  // Media preview handlers
  const handleOpenPreview = (url: string, type: 'image' | 'video' | 'document', fileName: string) => {
    updateState({
      showPreviewModal: true,
      previewModalData: { url, type, fileName }
    });
  };

  const handleClosePreview = () => {
    updateState({
      showPreviewModal: false,
      previewModalData: null
    });
  };

  const handleDownloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  };

  // =============================================================================
  // CASE MANAGEMENT DATA LOADING - MOVED ABOVE FOR PROPER HOISTING
  // =============================================================================

  // =============================================================================
  // CASE MANAGEMENT HANDLERS - NOTES
  // =============================================================================

  const handleAddNote = async () => {
    if (!requestId || !state.noteFormData.content.trim()) return;
    
    try {
      const result = await enhancedCaseService.addNote(
        requestId,
        state.noteFormData,
        'current-user', // TODO: Replace with actual user ID
        'Current User', // TODO: Replace with actual user name
        'Admin' // TODO: Replace with actual user role
      );
      
      if (result.success) {
        updateState({
          showAddNoteModal: false,
          noteFormData: {
            content: '',
            type: 'internal',
            category: '',
            isPrivate: true,
            followUpRequired: false,
            priority: 'normal',
            tags: []
          }
        });
        await loadCaseManagementData();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // =============================================================================
  // CASE MANAGEMENT HANDLERS - ASSIGNMENTS
  // =============================================================================

  const handleAddAssignment = async () => {
    if (!requestId || !state.assignmentFormData.assignedToId) return;
    
    try {
      const result = await enhancedCaseService.assignCase(
        requestId,
        state.assignmentFormData,
        'current-user', // TODO: Replace with actual user ID
        'Current User' // TODO: Replace with actual user name
      );
      
      if (result.success) {
        updateState({
          showAddAssignmentModal: false,
          assignmentFormData: {
            assignedToId: '',
            assignedToName: '',
            assignedToRole: '',
            assignmentType: 'primary',
            assignmentReason: '',
            priority: 'normal'
          }
        });
        await loadCaseManagementData();
        await loadRequest(); // Reload to update main request assignment
      }
    } catch (error) {
      console.error('Error adding assignment:', error);
    }
  };

  const handleTransferAssignment = async () => {
    if (!state.selectedAssignmentForTransfer || !state.transferFormData.transferToId) return;
    
    try {
      const result = await enhancedCaseService.transferCaseAssignment(
        state.selectedAssignmentForTransfer.id!,
        state.transferFormData.transferToId,
        state.transferFormData.transferToName,
        state.transferFormData.reason,
        'current-user', // TODO: Replace with actual user ID
        'Current User' // TODO: Replace with actual user name
      );
      
      if (result.success) {
        updateState({
          showTransferAssignmentModal: false,
          selectedAssignmentForTransfer: null,
          transferFormData: { transferToId: '', transferToName: '', reason: '' }
        });
        await loadCaseManagementData();
        await loadRequest();
      }
    } catch (error) {
      console.error('Error transferring assignment:', error);
    }
  };

  // =============================================================================
  // CASE MANAGEMENT HANDLERS - INFORMATION GATHERING
  // =============================================================================

  const handleAddInformationItem = async () => {
    if (!requestId || !state.informationFormData.itemName.trim()) return;
    
    try {
      const result = await enhancedCaseService.addInformationItem(requestId, state.informationFormData);
      
      if (result.success) {
        updateState({
          showAddInformationModal: false,
          informationFormData: {
            category: 'client',
            itemName: '',
            description: '',
            importance: 'required',
            followUpRequired: false
          }
        });
        await loadCaseManagementData();
      }
    } catch (error) {
      console.error('Error adding information item:', error);
    }
  };

  const handleUpdateInformationItem = async (itemId: string, updates: Partial<InformationItem>) => {
    try {
      const result = await enhancedCaseService.updateInformationItem(itemId, updates);
      
      if (result.success) {
        await loadCaseManagementData();
      }
    } catch (error) {
      console.error('Error updating information item:', error);
    }
  };

  // =============================================================================
  // CASE MANAGEMENT HANDLERS - SCOPE DEFINITION
  // =============================================================================

  const handleAddScopeItem = async () => {
    if (!requestId || !state.scopeFormData.name.trim()) return;
    
    try {
      const result = await enhancedCaseService.addScopeItem(requestId, state.scopeFormData);
      
      if (result.success) {
        updateState({
          showAddScopeModal: false,
          scopeFormData: {
            category: 'room',
            name: '',
            description: '',
            complexity: 'moderate'
          }
        });
        await loadCaseManagementData();
      }
    } catch (error) {
      console.error('Error adding scope item:', error);
    }
  };

  // =============================================================================
  // CASE MANAGEMENT UI HELPERS
  // =============================================================================

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Recently';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getReadinessScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50'; // Green
    if (score >= 70) return '#ff9800'; // Orange
    if (score >= 50) return '#f44336'; // Red
    return '#9e9e9e'; // Gray
  };

  const getCommunicationIcon = (method?: string) => {
    switch (method) {
      case 'phone': return <PhoneIcon fontSize="small" />;
      case 'email': return <EmailIcon fontSize="small" />;
      case 'text': return <MessageIcon fontSize="small" />;
      case 'in_person': return <PersonIcon fontSize="small" />;
      default: return <MessageIcon fontSize="small" />;
    }
  };

  const toggleSection = (section: keyof typeof state.expandedSections) => {
    updateState({
      expandedSections: {
        ...state.expandedSections,
        [section]: !state.expandedSections[section]
      }
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
          
          {/* Display existing media files from database */}
          {(state.existingMediaFiles.length > 0 || state.existingVideoFiles.length > 0) && (
            <div className="mt-6">
              <H4 className="mb-4">Existing Media Files</H4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Images */}
                {state.existingMediaFiles.map((filePath, index) => {
                  const fileName = filePath.split('/').pop() || `Image ${index + 1}`;
                  return (
                    <div 
                      key={`image-${index}`} 
                      className="relative group cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenPreview(getFullUrlFromPath(filePath), 'image', fileName);
                      }}
                    >
                      <Image
                        src={getFullUrlFromPath(filePath)}
                        alt={fileName}
                        width={128}
                        height={128}
                        className="w-full h-32 object-cover rounded border border-[#E4E4E4] hover:border-blue-400 transition-colors pointer-events-none"
                        onError={(e) => {
                          console.error('Failed to load image:', filePath);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <P3 className="text-white text-center px-2">
                          {fileName}
                        </P3>
                      </div>
                    </div>
                  );
                })}
                
                {/* Videos */}
                {state.existingVideoFiles.map((filePath, index) => {
                  const fileName = filePath.split('/').pop() || `Video ${index + 1}`;
                  return (
                    <div 
                      key={`video-${index}`} 
                      className="relative group cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenPreview(getFullUrlFromPath(filePath), 'video', fileName);
                      }}
                    >
                      <video
                        src={getFullUrlFromPath(filePath)}
                        className="w-full h-32 object-cover rounded border border-[#E4E4E4] hover:border-blue-400 transition-colors pointer-events-none"
                        muted
                        preload="metadata"
                        onError={(e) => {
                          console.error('Failed to load video:', filePath);
                          (e.target as HTMLVideoElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <P3 className="text-white text-center px-2">
                          {fileName}
                        </P3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Display uploaded media files */}
          {state.uploadedFiles.filter(f => f.category === 'images' || f.category === 'videos').length > 0 && (
            <div className="mt-6">
              <H4 className="mb-4">Newly Uploaded Media</H4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {state.uploadedFiles
                  .filter(f => f.category === 'images' || f.category === 'videos')
                  .map((file) => (
                    <div 
                      key={file.id} 
                      className="relative group cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenPreview(
                          getFullUrlFromPath(file.url), 
                          file.category === 'images' ? 'image' : 'video', 
                          file.name
                        );
                      }}
                    >
                      {file.category === 'images' ? (
                        <Image
                          src={getFullUrlFromPath(file.url)}
                          alt={file.name}
                          width={128}
                          height={128}
                          className="w-full h-32 object-cover rounded border border-[#E4E4E4] hover:border-blue-400 transition-colors pointer-events-none"
                          draggable={false}
                        />
                      ) : (
                        <video
                          src={getFullUrlFromPath(file.url)}
                          className="w-full h-32 object-cover rounded border border-[#E4E4E4] hover:border-blue-400 transition-colors pointer-events-none"
                          muted
                          preload="metadata"
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
          
          {/* Show message when no media files exist */}
          {state.existingMediaFiles.length === 0 && state.existingVideoFiles.length === 0 && state.uploadedFiles.filter(f => f.category === 'images' || f.category === 'videos').length === 0 && (
            <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
              <P2 className="text-gray-500 mb-2">No media files found</P2>
              <P3 className="text-gray-400">Upload images or videos using the field above</P3>
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
          
          {/* Display existing documents from database */}
          {state.existingDocumentFiles.length > 0 && (
            <div className="mt-6">
              <H4 className="mb-4">Existing Documents</H4>
              <div className="space-y-3">
                {state.existingDocumentFiles.map((filePath, index) => {
                  const fileName = filePath.split('/').pop() || `Document ${index + 1}`;
                  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                  const fileIcon = ['pdf'].includes(fileExtension) ? '📄' : 
                                  ['doc', 'docx'].includes(fileExtension) ? '📝' : 
                                  ['xls', 'xlsx'].includes(fileExtension) ? '📊' : 
                                  ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension) ? '🖼️' : '📄';
                  
                  return (
                    <div key={`doc-${index}`} className="flex items-center gap-4 p-4 bg-[#F9F4F3] border border-[#E4E4E4] rounded hover:bg-gray-50 transition-colors">
                      <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center text-2xl">
                        {fileIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <P3 className="font-medium text-[#2A2B2E] truncate">
                          {fileName}
                        </P3>
                        <P3 className="text-[#646469] text-sm">
                          {fileExtension.toUpperCase()} file
                        </P3>
                      </div>
                      <div className="flex gap-2">
                        <MuiButton
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenPreview(getFullUrlFromPath(filePath), 'document', fileName)}
                        >
                          View
                        </MuiButton>
                        <MuiButton
                          variant="outlined"
                          size="small"
                          onClick={() => handleDownloadFile(getFullUrlFromPath(filePath), fileName)}
                        >
                          Download
                        </MuiButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Display uploaded documents */}
          {state.uploadedFiles.filter(f => f.category === 'docs').length > 0 && (
            <div className="mt-6">
              <H4 className="mb-4">Newly Uploaded Documents</H4>
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
                          onClick={() => handleOpenPreview(getFullUrlFromPath(file.url), 'document', file.name)}
                        >
                          View
                        </MuiButton>
                        <MuiButton
                          variant="outlined"
                          size="small"
                          onClick={() => handleDownloadFile(getFullUrlFromPath(file.url), file.name)}
                        >
                          Download
                        </MuiButton>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Show message when no documents exist */}
          {state.existingDocumentFiles.length === 0 && state.uploadedFiles.filter(f => f.category === 'docs').length === 0 && (
            <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
              <P2 className="text-gray-500 mb-2">No documents found</P2>
              <P3 className="text-gray-400">Upload documents using the field above</P3>
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

  // =============================================================================
  // CASE MANAGEMENT TAB RENDERER
  // =============================================================================

  const renderCaseManagementTab = () => {
    if (state.caseLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Case Overview Panel */}
        <Card>
          <CardHeader
            title={(
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUpIcon className="text-blue-600" />
                  <H3>Case Overview</H3>
                </div>
                <IconButton onClick={() => toggleSection('overview')} size="small">
                  <ExpandMoreIcon 
                    style={{ 
                      transform: state.expandedSections.overview ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </IconButton>
              </div>
            )}
          />
          <Collapse in={state.expandedSections.overview}>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Priority */}
                <div className="text-center">
                  <Chip
                    label={state.caseOverview?.priority || 'Medium'}
                    color={getPriorityColor(state.caseOverview?.priority || 'medium') as any}
                    className="mb-2"
                  />
                  <P3 className="text-gray-600">Priority</P3>
                </div>

                {/* Readiness Score */}
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <div 
                      className="absolute inset-0 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getReadinessScoreColor(state.caseOverview?.readinessScore || 0) }}
                    >
                      {state.caseOverview?.readinessScore || 0}
                    </div>
                  </div>
                  <P3 className="text-gray-600">Readiness Score</P3>
                </div>

                {/* Assignment */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <AssignmentIcon className="text-gray-400 mr-2" />
                    <P2 className="font-medium">
                      {state.caseOverview?.assignedTo || 'Unassigned'}
                    </P2>
                  </div>
                  <P3 className="text-gray-600">Assigned To</P3>
                </div>

                {/* Last Activity */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CalendarTodayIcon className="text-gray-400 mr-2" />
                    <P2 className="font-medium">
                      {formatTimeAgo(state.caseOverview?.lastActivity)}
                    </P2>
                  </div>
                  <P3 className="text-gray-600">Last Activity</P3>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <P3 className="font-medium">Information Gathering</P3>
                    <P3 className="text-gray-500">
                      {state.informationItems.filter(item => item.status === 'verified').length}/{state.informationItems.length}
                    </P3>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={state.informationItems.length > 0 ? 
                      (state.informationItems.filter(item => item.status === 'verified').length / state.informationItems.length) * 100 : 0
                    }
                    className="h-2 rounded"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <P3 className="font-medium">Scope Definition</P3>
                    <P3 className="text-gray-500">
                      {state.scopeItems.filter(item => item.status === 'approved').length}/{state.scopeItems.length}
                    </P3>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={state.scopeItems.length > 0 ? 
                      (state.scopeItems.filter(item => item.status === 'approved').length / state.scopeItems.length) * 100 : 0
                    }
                    className="h-2 rounded"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <P3 className="font-medium">Communication</P3>
                    <P3 className="text-gray-500">
                      {state.caseNotes.filter(note => note.type === 'client_communication').length} interactions
                    </P3>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, state.caseNotes.filter(note => note.type === 'client_communication').length * 20)}
                    className="h-2 rounded"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => updateState({ showAddNoteModal: true })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Add Note
                </Button>
                <Button
                  onClick={() => updateState({ showAddAssignmentModal: true })}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Assign
                </Button>
                <Button
                  onClick={() => updateState({ showAddInformationModal: true })}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                >
                  Add Info Item
                </Button>
              </div>
            </CardContent>
          </Collapse>
        </Card>

        {/* Notes & Communication Section */}
        <Card>
          <CardHeader
            title={(
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <NotesIcon className="text-green-600" />
                  <H3>Notes & Communication</H3>
                  <Badge badgeContent={state.caseNotes.length} color="primary" />
                </div>
                <div className="flex items-center gap-2">
                  <FormControl size="small" className="min-w-[120px]">
                    <Select
                      value={state.notesFilter}
                      onChange={(e) => updateState({ notesFilter: e.target.value as any })}
                      variant="outlined"
                    >
                      <MenuItem value="all">All Notes</MenuItem>
                      <MenuItem value="internal">Internal</MenuItem>
                      <MenuItem value="client_communication">Client Comm</MenuItem>
                      <MenuItem value="follow_up">Follow-up</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton onClick={() => toggleSection('notes')} size="small">
                    <ExpandMoreIcon 
                      style={{ 
                        transform: state.expandedSections.notes ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }} 
                    />
                  </IconButton>
                </div>
              </div>
            )}
            action={
              <Button
                onClick={() => updateState({ showAddNoteModal: true })}
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
              >
                Add Note
              </Button>
            }
          />
          <Collapse in={state.expandedSections.notes}>
            <CardContent>
              {state.caseNotes
                .filter(note => state.notesFilter === 'all' || note.type === state.notesFilter)
                .filter(note => state.showPrivateNotes || !note.isPrivate)
                .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
                .map((note, index) => (
                  <div key={note.id || index} className="border-b border-gray-200 last:border-b-0 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <StatusPill status={note.type.replace('_', ' ')} />
                        {note.priority && note.priority !== 'normal' && (
                          <Chip 
                            label={note.priority} 
                            size="small" 
                            color={getPriorityColor(note.priority) as any}
                          />
                        )}
                        {note.isPrivate && <Chip label="Private" size="small" color="secondary" />}
                        {note.followUpRequired && (
                          <Tooltip title={`Follow-up: ${note.followUpDate}`}>
                            <Chip label="Follow-up" size="small" color="warning" />
                          </Tooltip>
                        )}
                      </div>
                      <div className="text-right">
                        <P3 className="text-gray-500">
                          {note.authorName} • {formatTimeAgo(note.createdAt)}
                        </P3>
                      </div>
                    </div>
                    <P2 className="text-gray-800 mb-2">{note.content}</P2>
                    {note.communicationMethod && (
                      <div className="flex items-center gap-2 text-gray-500">
                        {getCommunicationIcon(note.communicationMethod)}
                        <P3>{note.communicationMethod.replace('_', ' ')}</P3>
                      </div>
                    )}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {note.tags.map((tag, tagIndex) => (
                          <Chip key={tagIndex} label={tag} size="small" variant="outlined" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              {state.caseNotes.length === 0 && (
                <div className="text-center py-8">
                  <NotesIcon className="text-gray-300 mx-auto mb-2" style={{ fontSize: 48 }} />
                  <P2 className="text-gray-500">No notes yet</P2>
                  <P3 className="text-gray-400">Add your first note to start tracking case progress</P3>
                </div>
              )}
            </CardContent>
          </Collapse>
        </Card>

        {/* Assignment Management */}
        <Card>
          <CardHeader
            title={(
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AssignmentIcon className="text-purple-600" />
                  <H3>Assignment Management</H3>
                  <Badge badgeContent={state.caseAssignments.filter(a => a.status === 'active').length} color="primary" />
                </div>
                <IconButton onClick={() => toggleSection('assignments')} size="small">
                  <ExpandMoreIcon 
                    style={{ 
                      transform: state.expandedSections.assignments ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </IconButton>
              </div>
            )}
            action={
              <Button
                onClick={() => updateState({ showAddAssignmentModal: true })}
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
              >
                Add Assignment
              </Button>
            }
          />
          <Collapse in={state.expandedSections.assignments}>
            <CardContent>
              {state.caseAssignments
                .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
                .map((assignment, index) => (
                  <div key={assignment.id || index} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <H4>{assignment.assignedToName}</H4>
                          <StatusPill status={assignment.status} />
                          <Chip label={assignment.assignmentType} size="small" variant="outlined" />
                          {assignment.priority && assignment.priority !== 'normal' && (
                            <Chip 
                              label={assignment.priority} 
                              size="small" 
                              color={getPriorityColor(assignment.priority) as any}
                            />
                          )}
                        </div>
                        <P3 className="text-gray-600">{assignment.assignedToRole}</P3>
                        {assignment.assignmentReason && (
                          <P3 className="text-gray-500 mt-1">{assignment.assignmentReason}</P3>
                        )}
                      </div>
                      <div className="text-right">
                        <P3 className="text-gray-500 mb-1">
                          Assigned {formatTimeAgo(assignment.createdAt)}
                        </P3>
                        {assignment.status === 'active' && (
                          <Button
                            onClick={() => updateState({ 
                              selectedAssignmentForTransfer: assignment,
                              showTransferAssignmentModal: true 
                            })}
                            size="small"
                            variant="outlined"
                          >
                            Transfer
                          </Button>
                        )}
                      </div>
                    </div>
                    {assignment.dueDate && (
                      <div className="flex items-center gap-2 mt-2">
                        <CalendarTodayIcon fontSize="small" className="text-gray-400" />
                        <P3 className="text-gray-500">Due: {new Date(assignment.dueDate).toLocaleDateString()}</P3>
                      </div>
                    )}
                    {assignment.estimatedHours && (
                      <div className="flex items-center gap-2 mt-1">
                        <TimelineIcon fontSize="small" className="text-gray-400" />
                        <P3 className="text-gray-500">Estimated: {assignment.estimatedHours}h</P3>
                      </div>
                    )}
                  </div>
                ))}
              {state.caseAssignments.length === 0 && (
                <div className="text-center py-8">
                  <AssignmentIcon className="text-gray-300 mx-auto mb-2" style={{ fontSize: 48 }} />
                  <P2 className="text-gray-500">No assignments yet</P2>
                  <P3 className="text-gray-400">Assign this case to a team member to get started</P3>
                </div>
              )}
            </CardContent>
          </Collapse>
        </Card>

        {/* Information Gathering Tracker */}
        <Card>
          <CardHeader
            title={(
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ListIcon className="text-orange-600" />
                  <H3>Information Gathering</H3>
                  <Badge 
                    badgeContent={state.informationItems.filter(item => item.status !== 'verified').length} 
                    color="warning" 
                  />
                </div>
                <IconButton onClick={() => toggleSection('information')} size="small">
                  <ExpandMoreIcon 
                    style={{ 
                      transform: state.expandedSections.information ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </IconButton>
              </div>
            )}
            action={
              <Button
                onClick={() => updateState({ showAddInformationModal: true })}
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
              >
                Add Item
              </Button>
            }
          />
          <Collapse in={state.expandedSections.information}>
            <CardContent>
              {state.informationItems.map((item, index) => (
                <div key={item.id || index} className="border border-gray-200 rounded-lg p-4 mb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <H4>{item.itemName}</H4>
                        <StatusPill status={item.status} />
                        <Chip 
                          label={item.importance} 
                          size="small" 
                          color={item.importance === 'required' ? 'error' : item.importance === 'important' ? 'warning' : 'default'}
                        />
                        <Chip label={item.category} size="small" variant="outlined" />
                      </div>
                      {item.description && (
                        <P3 className="text-gray-600 mb-2">{item.description}</P3>
                      )}
                      {item.followUpRequired && item.followUpDate && (
                        <div className="flex items-center gap-2">
                          <CalendarTodayIcon fontSize="small" className="text-orange-500" />
                          <P3 className="text-orange-600">
                            Follow-up: {new Date(item.followUpDate).toLocaleDateString()}
                          </P3>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {item.status !== 'verified' && (
                        <>
                          <Button
                            onClick={() => handleUpdateInformationItem(item.id!, { status: 'received' })}
                            size="small"
                            variant="outlined"
                            disabled={(item.status as any) === 'received' || (item.status as any) === 'verified'}
                          >
                            Mark Received
                          </Button>
                          <Button
                            onClick={() => handleUpdateInformationItem(item.id!, { status: 'verified' })}
                            size="small"
                            variant="contained"
                            color="success"
                            disabled={(item.status as any) === 'verified'}
                          >
                            Mark Verified
                          </Button>
                        </>
                      )}
                      {item.status === 'verified' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircleIcon fontSize="small" />
                          <P3>Verified</P3>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {state.informationItems.length === 0 && (
                <div className="text-center py-8">
                  <ListIcon className="text-gray-300 mx-auto mb-2" style={{ fontSize: 48 }} />
                  <P2 className="text-gray-500">No information items yet</P2>
                  <P3 className="text-gray-400">Add items to track required information gathering</P3>
                </div>
              )}
            </CardContent>
          </Collapse>
        </Card>

        {/* Scope Definition Interface */}
        <Card>
          <CardHeader
            title={(
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BuildIcon className="text-indigo-600" />
                  <H3>Scope Definition</H3>
                  <Badge badgeContent={state.scopeItems.length} color="primary" />
                </div>
                <IconButton onClick={() => toggleSection('scope')} size="small">
                  <ExpandMoreIcon 
                    style={{ 
                      transform: state.expandedSections.scope ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </IconButton>
              </div>
            )}
            action={
              <Button
                onClick={() => updateState({ showAddScopeModal: true })}
                startIcon={<AddIcon />}
                variant="contained"
                size="small"
              >
                Add Scope Item
              </Button>
            }
          />
          <Collapse in={state.expandedSections.scope}>
            <CardContent>
              {state.scopeItems.map((item, index) => (
                <div key={item.id || index} className="border border-gray-200 rounded-lg p-4 mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <H4>{item.name}</H4>
                        <StatusPill status={item.status} />
                        <Chip label={item.category} size="small" variant="outlined" />
                        <Chip 
                          label={item.complexity} 
                          size="small" 
                          color={item.complexity === 'very_complex' ? 'error' : 
                                 item.complexity === 'complex' ? 'warning' : 'default'}
                        />
                      </div>
                      {item.description && (
                        <P3 className="text-gray-600 mb-2">{item.description}</P3>
                      )}
                    </div>
                    <div className="text-right">
                      {item.estimatedCost && (
                        <P3 className="font-medium text-green-600">
                          ${item.estimatedCost.toLocaleString()}
                        </P3>
                      )}
                      {item.estimatedHours && (
                        <P3 className="text-gray-500">{item.estimatedHours}h</P3>
                      )}
                    </div>
                  </div>
                  {item.clientApproval && (
                    <div className="flex items-center gap-2 mt-2">
                      <StatusPill status={`client ${item.clientApproval}`} />
                    </div>
                  )}
                </div>
              ))}
              {state.scopeItems.length === 0 && (
                <div className="text-center py-8">
                  <BuildIcon className="text-gray-300 mx-auto mb-2" style={{ fontSize: 48 }} />
                  <P2 className="text-gray-500">No scope items defined yet</P2>
                  <P3 className="text-gray-400">Start defining the project scope to prepare for quoting</P3>
                </div>
              )}
            </CardContent>
          </Collapse>
        </Card>

        {/* Status Workflow Manager */}
        <Card>
          <CardHeader
            title={(
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TimelineIcon className="text-blue-600" />
                  <H3>Status Workflow</H3>
                </div>
                <IconButton onClick={() => toggleSection('workflow')} size="small">
                  <ExpandMoreIcon 
                    style={{ 
                      transform: state.expandedSections.workflow ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </IconButton>
              </div>
            )}
          />
          <Collapse in={state.expandedSections.workflow}>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <StatusPill status={state.request?.status || 'new'} />
                <P2 className="text-gray-600">Current Status</P2>
              </div>
              
              {state.allowedStatusTransitions.length > 0 && (
                <div className="mb-4">
                  <P3 className="font-medium mb-2">Available Transitions:</P3>
                  <div className="flex gap-2 flex-wrap">
                    {state.allowedStatusTransitions.map((status) => (
                      <Button
                        key={status}
                        onClick={() => {
                          setValue('status', status);
                          handleSubmit(handleSaveRequest)();
                        }}
                        size="small"
                        variant="outlined"
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow Suggestions */}
              <Alert severity="info" className="mt-4">
                <strong>Next Steps:</strong>
                <ul className="mt-2 ml-4 list-disc">
                  {state.informationItems.filter(item => item.status !== 'verified').length > 0 && (
                    <li>Complete {state.informationItems.filter(item => item.status !== 'verified').length} pending information items</li>
                  )}
                  {state.scopeItems.length === 0 && (
                    <li>Define initial scope items for the project</li>
                  )}
                  {state.caseNotes.filter(note => note.type === 'client_communication').length === 0 && (
                    <li>Establish client communication</li>
                  )}
                  {state.caseOverview?.readinessScore && state.caseOverview.readinessScore < 80 && (
                    <li>Improve readiness score to 80+ for quote generation</li>
                  )}
                </ul>
              </Alert>
            </CardContent>
          </Collapse>
        </Card>
      </div>
    );
  };

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
            <H1 className="mb-2">{state.propertyData?.propertyFullAddress || state.request?.propertyAddress || `Request #${state.request.id.slice(0, 8)}`}</H1>
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
            {(['details', 'case-management', 'media', 'documents', 'comments'] as const).map((tab) => {
              const tabLabel = tab === 'case-management' ? 'Case Management' : tab.charAt(0).toUpperCase() + tab.slice(1);
              const hasUpdates = tab === 'case-management' && (
                state.informationItems.some(item => item.followUpRequired && item.followUpDate && new Date(item.followUpDate) < new Date()) ||
                state.caseNotes.some(note => note.followUpRequired && note.followUpDate && new Date(note.followUpDate) < new Date())
              );
              
              return (
                <button
                  key={tab}
                  onClick={() => updateState({ activeTab: tab })}
                  className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                    state.activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tabLabel}
                  {hasUpdates && (
                    <Badge 
                      color="error" 
                      variant="dot" 
                      sx={{ 
                        position: 'absolute', 
                        top: '2px', 
                        right: '-6px'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {state.activeTab === 'details' && renderDetailsTab()}
        {state.activeTab === 'case-management' && renderCaseManagementTab()}
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

      {/* Media Preview Modal */}
      {state.previewModalData && (
        <MediaPreviewModal
          open={state.showPreviewModal}
          onClose={handleClosePreview}
          mediaUrl={state.previewModalData.url}
          mediaType={state.previewModalData.type}
          fileName={state.previewModalData.fileName}
          onDownload={() => handleDownloadFile(state.previewModalData!.url, state.previewModalData!.fileName)}
        />
      )}

      {/* Case Management Modals */}
      
      {/* Add Note Modal */}
      <Dialog 
        open={state.showAddNoteModal} 
        onClose={() => updateState({ showAddNoteModal: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Case Note</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <FormControl fullWidth>
              <InputLabel>Note Type</InputLabel>
              <Select
                value={state.noteFormData.type}
                label="Note Type"
                onChange={(e) => updateState({
                  noteFormData: { ...state.noteFormData, type: e.target.value as any }
                })}
              >
                {NOTE_TYPES.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Category"
              value={state.noteFormData.category}
              onChange={(e) => updateState({
                noteFormData: { ...state.noteFormData, category: e.target.value }
              })}
              fullWidth
              placeholder="e.g., assignment, status_update, client_call"
            />

            <TextField
              label="Note Content"
              value={state.noteFormData.content}
              onChange={(e) => updateState({
                noteFormData: { ...state.noteFormData, content: e.target.value }
              })}
              multiline
              rows={4}
              fullWidth
              required
            />

            {state.noteFormData.type === 'client_communication' && (
              <FormControl fullWidth>
                <InputLabel>Communication Method</InputLabel>
                <Select
                  value={state.noteFormData.communicationMethod || ''}
                  label="Communication Method"
                  onChange={(e) => updateState({
                    noteFormData: { ...state.noteFormData, communicationMethod: e.target.value as any }
                  })}
                >
                  <MenuItem value="phone">Phone</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="in_person">In Person</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={state.noteFormData.priority || 'normal'}
                label="Priority"
                onChange={(e) => updateState({
                  noteFormData: { ...state.noteFormData, priority: e.target.value as any }
                })}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="important">Important</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={state.noteFormData.isPrivate}
                  onChange={(e) => updateState({
                    noteFormData: { ...state.noteFormData, isPrivate: e.target.checked }
                  })}
                />
              }
              label="Private note (internal only)"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={state.noteFormData.followUpRequired || false}
                  onChange={(e) => updateState({
                    noteFormData: { ...state.noteFormData, followUpRequired: e.target.checked }
                  })}
                />
              }
              label="Requires follow-up"
            />

            {state.noteFormData.followUpRequired && (
              <TextField
                label="Follow-up Date"
                type="date"
                value={state.noteFormData.followUpDate || ''}
                onChange={(e) => updateState({
                  noteFormData: { ...state.noteFormData, followUpDate: e.target.value }
                })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => updateState({ showAddNoteModal: false })}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained" disabled={!state.noteFormData.content.trim()}>
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Assignment Modal */}
      <Dialog 
        open={state.showAddAssignmentModal} 
        onClose={() => updateState({ showAddAssignmentModal: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Assignment</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={state.assignmentFormData.assignedToId}
                label="Assign To"
                onChange={(e) => {
                  const ae = state.availableAEs.find(ae => ae.id === e.target.value);
                  updateState({
                    assignmentFormData: {
                      ...state.assignmentFormData,
                      assignedToId: e.target.value,
                      assignedToName: ae?.name || '',
                      assignedToRole: (ae as any)?.role || 'Account Executive'
                    }
                  });
                }}
              >
                {state.availableAEs.map(ae => (
                  <MenuItem key={ae.id} value={ae.id}>
                    {ae.name} ({(ae as any).role || 'Account Executive'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Assignment Type</InputLabel>
              <Select
                value={state.assignmentFormData.assignmentType}
                label="Assignment Type"
                onChange={(e) => updateState({
                  assignmentFormData: { ...state.assignmentFormData, assignmentType: e.target.value as any }
                })}
              >
                <MenuItem value="primary">Primary</MenuItem>
                <MenuItem value="secondary">Secondary</MenuItem>
                <MenuItem value="observer">Observer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Assignment Reason"
              value={state.assignmentFormData.assignmentReason}
              onChange={(e) => updateState({
                assignmentFormData: { ...state.assignmentFormData, assignmentReason: e.target.value }
              })}
              multiline
              rows={2}
              fullWidth
              placeholder="Why is this person being assigned?"
            />

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={state.assignmentFormData.priority || 'normal'}
                label="Priority"
                onChange={(e) => updateState({
                  assignmentFormData: { ...state.assignmentFormData, priority: e.target.value as any }
                })}
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Due Date"
              type="date"
              value={state.assignmentFormData.dueDate || ''}
              onChange={(e) => updateState({
                assignmentFormData: { ...state.assignmentFormData, dueDate: e.target.value }
              })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Estimated Hours"
              type="number"
              value={state.assignmentFormData.estimatedHours || ''}
              onChange={(e) => updateState({
                assignmentFormData: { ...state.assignmentFormData, estimatedHours: parseFloat(e.target.value) || undefined }
              })}
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => updateState({ showAddAssignmentModal: false })}>Cancel</Button>
          <Button onClick={handleAddAssignment} variant="contained" disabled={!state.assignmentFormData.assignedToId}>
            Add Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Assignment Modal */}
      <Dialog 
        open={state.showTransferAssignmentModal} 
        onClose={() => updateState({ showTransferAssignmentModal: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Transfer Assignment</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <Alert severity="info">
              Transferring assignment from {state.selectedAssignmentForTransfer?.assignedToName}
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Transfer To</InputLabel>
              <Select
                value={state.transferFormData.transferToId}
                label="Transfer To"
                onChange={(e) => {
                  const ae = state.availableAEs.find(ae => ae.id === e.target.value);
                  updateState({
                    transferFormData: {
                      ...state.transferFormData,
                      transferToId: e.target.value,
                      transferToName: ae?.name || ''
                    }
                  });
                }}
              >
                {state.availableAEs
                  .filter(ae => ae.id !== state.selectedAssignmentForTransfer?.assignedToId)
                  .map(ae => (
                    <MenuItem key={ae.id} value={ae.id}>
                      {ae.name} ({(ae as any).role || 'Account Executive'})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              label="Transfer Reason"
              value={state.transferFormData.reason}
              onChange={(e) => updateState({
                transferFormData: { ...state.transferFormData, reason: e.target.value }
              })}
              multiline
              rows={3}
              fullWidth
              required
              placeholder="Why is this assignment being transferred?"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => updateState({ showTransferAssignmentModal: false })}>Cancel</Button>
          <Button 
            onClick={handleTransferAssignment} 
            variant="contained" 
            disabled={!state.transferFormData.transferToId || !state.transferFormData.reason.trim()}
          >
            Transfer Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Information Item Modal */}
      <Dialog 
        open={state.showAddInformationModal} 
        onClose={() => updateState({ showAddInformationModal: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Information Item</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={state.informationFormData.category}
                label="Category"
                onChange={(e) => updateState({
                  informationFormData: { ...state.informationFormData, category: e.target.value as any }
                })}
              >
                {INFORMATION_CATEGORIES.map(category => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Item Name"
              value={state.informationFormData.itemName}
              onChange={(e) => updateState({
                informationFormData: { ...state.informationFormData, itemName: e.target.value }
              })}
              fullWidth
              required
              placeholder="e.g., Property floor plans, Budget confirmation"
            />

            <TextField
              label="Description"
              value={state.informationFormData.description}
              onChange={(e) => updateState({
                informationFormData: { ...state.informationFormData, description: e.target.value }
              })}
              multiline
              rows={2}
              fullWidth
              placeholder="Additional details about what information is needed"
            />

            <FormControl fullWidth>
              <InputLabel>Importance</InputLabel>
              <Select
                value={state.informationFormData.importance}
                label="Importance"
                onChange={(e) => updateState({
                  informationFormData: { ...state.informationFormData, importance: e.target.value as any }
                })}
              >
                <MenuItem value="required">Required</MenuItem>
                <MenuItem value="important">Important</MenuItem>
                <MenuItem value="optional">Optional</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={state.informationFormData.followUpRequired || false}
                  onChange={(e) => updateState({
                    informationFormData: { ...state.informationFormData, followUpRequired: e.target.checked }
                  })}
                />
              }
              label="Requires follow-up"
            />

            {state.informationFormData.followUpRequired && (
              <TextField
                label="Follow-up Date"
                type="date"
                value={state.informationFormData.followUpDate || ''}
                onChange={(e) => updateState({
                  informationFormData: { ...state.informationFormData, followUpDate: e.target.value }
                })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => updateState({ showAddInformationModal: false })}>Cancel</Button>
          <Button onClick={handleAddInformationItem} variant="contained" disabled={!state.informationFormData.itemName.trim()}>
            Add Information Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Scope Item Modal */}
      <Dialog 
        open={state.showAddScopeModal} 
        onClose={() => updateState({ showAddScopeModal: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Scope Item</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={state.scopeFormData.category}
                label="Category"
                onChange={(e) => updateState({
                  scopeFormData: { ...state.scopeFormData, category: e.target.value as any }
                })}
              >
                {SCOPE_CATEGORIES.map(category => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Scope Item Name"
              value={state.scopeFormData.name}
              onChange={(e) => updateState({
                scopeFormData: { ...state.scopeFormData, name: e.target.value }
              })}
              fullWidth
              required
              placeholder="e.g., Kitchen cabinets, Bathroom flooring"
            />

            <TextField
              label="Description"
              value={state.scopeFormData.description}
              onChange={(e) => updateState({
                scopeFormData: { ...state.scopeFormData, description: e.target.value }
              })}
              multiline
              rows={3}
              fullWidth
              placeholder="Detailed description of the work involved"
            />

            <FormControl fullWidth>
              <InputLabel>Complexity</InputLabel>
              <Select
                value={state.scopeFormData.complexity || 'moderate'}
                label="Complexity"
                onChange={(e) => updateState({
                  scopeFormData: { ...state.scopeFormData, complexity: e.target.value as any }
                })}
              >
                <MenuItem value="simple">Simple</MenuItem>
                <MenuItem value="moderate">Moderate</MenuItem>
                <MenuItem value="complex">Complex</MenuItem>
                <MenuItem value="very_complex">Very Complex</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Estimated Cost"
              type="number"
              value={state.scopeFormData.estimatedCost || ''}
              onChange={(e) => updateState({
                scopeFormData: { ...state.scopeFormData, estimatedCost: parseFloat(e.target.value) || undefined }
              })}
              fullWidth
              InputProps={{ startAdornment: '$' }}
              placeholder="0"
            />

            <TextField
              label="Estimated Hours"
              type="number"
              value={state.scopeFormData.estimatedHours || ''}
              onChange={(e) => updateState({
                scopeFormData: { ...state.scopeFormData, estimatedHours: parseFloat(e.target.value) || undefined }
              })}
              fullWidth
              placeholder="0"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => updateState({ showAddScopeModal: false })}>Cancel</Button>
          <Button onClick={handleAddScopeItem} variant="contained" disabled={!state.scopeFormData.name.trim()}>
            Add Scope Item
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RequestDetail;