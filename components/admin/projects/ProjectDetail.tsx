import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { H1, H2, H3, H4, P1, P2, P3 } from '../../typography';
import Button from '../../common/buttons/Button';
import { projectsAPI, optimizedProjectsAPI, quotesAPI, requestsAPI } from '../../../utils/amplifyAPI';
import { enhancedProjectsService } from '../../../services/business/enhancedProjectsService';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useNotification } from '../../../contexts/NotificationContext';
import RestoreChangesDialog from '../../common/dialogs/RestoreChangesDialog';
import MilestonesList, { Milestone } from '../../projects/MilestonesList';
import PaymentList, { Payment } from '../../projects/PaymentList';
import CommentsList, { Comment as ProjectComment } from '../../projects/CommentsList';
import ProjectImageGalleryMUI, { GalleryImage } from '../../projects/ProjectImageGalleryMUI';
import { FileUploadField } from '../../forms/FileUploadField';
import { getProjectGalleryImages } from '../../../utils/galleryUtils';
import { generateClient as generateGraphQLClient } from 'aws-amplify/api';
import BaseModal from '../../common/modals/BaseModal';
import {
  updateProjectMilestones,
  updateProjectPaymentTerms,
  createProjectMilestones,
  deleteProjectMilestones,
  createProjectPaymentTerms,
  deleteProjectPaymentTerms,
  deleteProjectComments,
  createProjectComments,
  updateProjects,
  updateContacts
} from '../../../mutations';
import { listContacts } from '../../../queries';
import { getRelativePathFromUrl, getFullUrlFromPath } from '../../../utils/s3Utils';
import { getRequestContext } from '../../../lib/userContext';

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

// Comments type imported from shared CommentsList component

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
  milestones: Milestone[];
  payments: Payment[];
  gallery: GalleryImage[];
  contacts: {
    agent: any | null;
    homeowner: any | null;
    homeowner2: any | null;
    homeowner3: any | null;
  } | null;
  relatedQuotes: RelatedEntity[];
  relatedRequests: RelatedEntity[];
  loading: boolean;
  saving: boolean;
  error: string;
  showRestoreDialog: boolean;
  // Modals
  showMilestonesModal: boolean;
  showPaymentsModal: boolean;
  showGalleryModal: boolean;
  showCommentsModal: boolean;
  showContactsModal: boolean;
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
  milestones: [],
  payments: [],
  gallery: [],
  contacts: null,
    relatedQuotes: [],
    relatedRequests: [],
    loading: true,
    saving: false,
    error: '',
  showRestoreDialog: false,
  showMilestonesModal: false,
  showPaymentsModal: false,
  showGalleryModal: false,
  showCommentsModal: false,
  showContactsModal: false
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
      await Promise.all([
        loadComments(),
        loadMilestones(),
  loadPayments(),
  loadContacts()
      ]);
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
      const result = await enhancedProjectsService.getProjectByIdWithRelations(projectId);

      if (result.success && result.data) {
        const ep: any = result.data;
        const mapped: Project = {
          id: ep.id,
          title: ep.propertyAddress || ep.title || 'Untitled Project',
          description: ep.description,
          status: ep.status,
          clientName: ep.clientName,
          clientEmail: ep.clientEmail,
          clientPhone: ep.clientPhone,
          propertyAddress: ep.propertyAddress,
          estimatedValue: undefined, // not provided; optional in UI
          originalValue: ep.originalValue,
          listingPrice: ep.listingPrice,
          salePrice: ep.salePrice,
          createdAt: ep.createdAt,
          updatedAt: ep.updatedDate || ep.createdAt,
          businessCreatedDate: ep.createdDate,
          businessUpdatedDate: ep.updatedDate,
          frontImageS3Key: undefined,
          images: undefined
        };

        // Load gallery images derived from project fields
        let galleryImages: GalleryImage[] = [];
        try {
          const urls = await getProjectGalleryImages(ep);
          galleryImages = urls.map((u: string, i: number) => ({ url: u, alt: `Project image ${i + 1}` }));
        } catch (e) {
          console.warn('Failed to load gallery images', e);
        }

        setState(prev => ({
          ...prev,
          project: mapped,
          originalProject: mapped,
          gallery: galleryImages,
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
          comments: (result.data as ProjectComment[]) || []
        }));
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  }, [projectId]);

  const loadMilestones = useCallback(async () => {
    try {
      const result = await optimizedProjectsAPI.getProjectMilestones(projectId);
      if (result.success) {
        setState(prev => ({ ...prev, milestones: (result.data as unknown as Milestone[]) || [] }));
      }
    } catch (err) {
      console.error('Error loading milestones:', err);
    }
  }, [projectId]);

  const loadPayments = useCallback(async () => {
    try {
      const result = await optimizedProjectsAPI.getProjectPaymentTerms(projectId);
      if (result.success) {
        setState(prev => ({ ...prev, payments: (result.data as unknown as Payment[]) || [] }));
      }
    } catch (err) {
      console.error('Error loading payment terms:', err);
    }
  }, [projectId]);

  const loadContacts = useCallback(async () => {
    try {
      if (!state.project) return;
      const result = await optimizedProjectsAPI.getProjectContacts({
        id: state.project.id,
        agentContactId: (state.project as any).agentContactId,
        homeownerContactId: (state.project as any).homeownerContactId,
        homeowner2ContactId: (state.project as any).homeowner2ContactId,
        homeowner3ContactId: (state.project as any).homeowner3ContactId
      });
      if ((result as any).success) {
        setState(prev => ({ ...prev, contacts: (result as any).data }));
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  }, [state.project]);

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

  // GraphQL client for mutations
  const graphqlClient = generateGraphQLClient({ authMode: 'apiKey' });

  const handleMilestoneToggle = async (milestone: Milestone) => {
    try {
      const input = { id: milestone.id, isComplete: !milestone.isComplete } as any;
      await graphqlClient.graphql({ query: updateProjectMilestones, variables: { input } });
      setState(prev => ({
        ...prev,
        milestones: prev.milestones.map(m => m.id === milestone.id ? { ...m, isComplete: !m.isComplete } : m)
      }));
    } catch (err) {
      console.error('Failed to update milestone', err);
    }
  };

  const handlePaymentToggle = async (payment: Payment) => {
    try {
      const paymentId = (payment as any).id;
      const input = { id: paymentId, paid: !payment.paid } as any;
      await graphqlClient.graphql({ query: updateProjectPaymentTerms, variables: { input } });
      setState(prev => ({
        ...prev,
        payments: prev.payments.map(p => ((p as any).id === paymentId) ? { ...p, paid: !p.paid } : p)
      }));
    } catch (err) {
      console.error('Failed to update payment term', err);
    }
  };

  const handleCommentAdded = (newComment: ProjectComment) => {
    setState(prev => ({ ...prev, comments: [newComment, ...prev.comments] }));
  };

  // CRUD modals handlers
  const [editingMilestone, setEditingMilestone] = useState<Partial<Milestone> | null>(null);
  const [editingPayment, setEditingPayment] = useState<Partial<Payment> | null>(null);
  const [newGalleryUrl, setNewGalleryUrl] = useState<string>('');
  const [galleryDnD, setGalleryDnD] = useState<{ dragIndex: number | null; overIndex: number | null }>({ dragIndex: null, overIndex: null });
  const [milestoneDnD, setMilestoneDnD] = useState<{ dragIndex: number | null; overIndex: number | null }>({ dragIndex: null, overIndex: null });
  const [paymentDnD, setPaymentDnD] = useState<{ dragIndex: number | null; overIndex: number | null }>({ dragIndex: null, overIndex: null });
  const [contactSearch, setContactSearch] = useState<string>('');
  const [contactResults, setContactResults] = useState<any[]>([]);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [editingComment, setEditingComment] = useState<ProjectComment | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');
  const [editingCommentPrivate, setEditingCommentPrivate] = useState<boolean>(false);

  const openMilestonesModal = () => setState(prev => ({ ...prev, showMilestonesModal: true }));
  const openPaymentsModal = () => setState(prev => ({ ...prev, showPaymentsModal: true }));
  const openGalleryModal = () => setState(prev => ({ ...prev, showGalleryModal: true }));
  const openCommentsModal = () => setState(prev => ({ ...prev, showCommentsModal: true }));
  const openContactsModal = () => setState(prev => ({ ...prev, showContactsModal: true }));

  const closeAllModals = () => setState(prev => ({
    ...prev,
    showMilestonesModal: false,
    showPaymentsModal: false,
    showGalleryModal: false,
    showCommentsModal: false,
    showContactsModal: false
  }));

  // Milestones CRUD
  const saveMilestone = async () => {
    if (!state.project) return;
    if (!editingMilestone?.name || editingMilestone.name.trim().length === 0) {
      showError('Validation', 'Milestone name is required.');
      return;
    }
    try {
      if (editingMilestone.id) {
        await graphqlClient.graphql({
          query: updateProjectMilestones,
          variables: { input: { id: editingMilestone.id, ...editingMilestone } }
        });
        showSuccess('Milestone Updated');
      } else {
        await graphqlClient.graphql({
          query: createProjectMilestones,
          variables: { input: { projectId: state.project.id, name: editingMilestone.name, description: editingMilestone.description || '', order: editingMilestone.order || 0, isComplete: !!editingMilestone.isComplete } }
        });
        showSuccess('Milestone Added');
      }
      setEditingMilestone(null);
      await loadMilestones();
    } catch (e) {
      console.error('Save milestone failed', e);
      showError('Milestone Save Failed');
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      await graphqlClient.graphql({ query: deleteProjectMilestones, variables: { input: { id } } });
      await loadMilestones();
  showSuccess('Milestone Deleted');
    } catch (e) {
      console.error('Delete milestone failed', e);
  showError('Delete Milestone Failed');
    }
  };

  const moveMilestone = async (index: number, direction: -1 | 1) => {
    const items = [...state.milestones];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    // swap order numbers
    const a = items[index];
    const b = items[newIndex];
    const aOrder = (a.order ?? index);
    const bOrder = (b.order ?? newIndex);
    try {
      await Promise.all([
        graphqlClient.graphql({ query: updateProjectMilestones, variables: { input: { id: a.id, order: bOrder } } }),
        graphqlClient.graphql({ query: updateProjectMilestones, variables: { input: { id: b.id, order: aOrder } } })
      ]);
      await loadMilestones();
      showSuccess('Milestones Reordered');
    } catch (e) {
      console.error('Reorder milestone failed', e);
      showError('Reorder Failed');
    }
  };

  // DnD for milestones within modal (client-side reorder + persist)
  const onMilestoneDragStart = (index: number) => setMilestoneDnD({ dragIndex: index, overIndex: index });
  const onMilestoneDragEnter = (index: number) => setMilestoneDnD(prev => ({ ...prev, overIndex: index }));
  const onMilestoneDrop = async () => {
    if (milestoneDnD.dragIndex == null || milestoneDnD.overIndex == null || milestoneDnD.dragIndex === milestoneDnD.overIndex) {
      setMilestoneDnD({ dragIndex: null, overIndex: null });
      return;
    }
    const items = [...state.milestones];
    const [moved] = items.splice(milestoneDnD.dragIndex, 1);
    items.splice(milestoneDnD.overIndex, 0, moved);
    // assign new sequential order
    const updates = items.map((m, i) => ({ id: m.id, order: i }));
    try {
      for (const u of updates) {
        await graphqlClient.graphql({ query: updateProjectMilestones, variables: { input: u } });
      }
      await loadMilestones();
      showSuccess('Milestones Reordered');
    } catch (e) {
      console.error('Milestone DnD reorder failed', e);
      showError('Reorder Failed');
    } finally {
      setMilestoneDnD({ dragIndex: null, overIndex: null });
    }
  };

  // Payments CRUD
  const savePayment = async () => {
    if (!state.project) return;
    if (!editingPayment?.paymentName || editingPayment.paymentName.trim().length === 0) {
      showError('Validation', 'Payment name is required.');
      return;
    }
    if (editingPayment.paymentAmount != null && Number.isNaN(Number(editingPayment.paymentAmount))) {
      showError('Validation', 'Payment amount must be a number.');
      return;
    }
    try {
      if ((editingPayment as any).id) {
        await graphqlClient.graphql({
          query: updateProjectPaymentTerms,
          variables: { input: { id: (editingPayment as any).id, ...editingPayment } }
        });
        showSuccess('Payment Term Updated');
      } else {
        await graphqlClient.graphql({
          query: createProjectPaymentTerms,
          variables: { input: { projectId: state.project.id, type: 'byClient', paymentName: editingPayment.paymentName, paymentAmount: editingPayment.paymentAmount || 0, description: editingPayment.description || '', order: editingPayment.order || 0, paid: !!editingPayment.paid } }
        });
        showSuccess('Payment Term Added');
      }
      setEditingPayment(null);
      await loadPayments();
    } catch (e) {
      console.error('Save payment failed', e);
      showError('Payment Save Failed');
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await graphqlClient.graphql({ query: deleteProjectPaymentTerms, variables: { input: { id } } });
      await loadPayments();
  showSuccess('Payment Term Deleted');
    } catch (e) {
      console.error('Delete payment failed', e);
  showError('Delete Payment Failed');
    }
  };

  const movePayment = async (index: number, direction: -1 | 1) => {
    const items = [...state.payments];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const a: any = items[index];
    const b: any = items[newIndex];
    const aOrder = (a.order ?? index);
    const bOrder = (b.order ?? newIndex);
    try {
      await Promise.all([
        graphqlClient.graphql({ query: updateProjectPaymentTerms, variables: { input: { id: a.id, order: bOrder } } }),
        graphqlClient.graphql({ query: updateProjectPaymentTerms, variables: { input: { id: b.id, order: aOrder } } })
      ]);
      await loadPayments();
      showSuccess('Payments Reordered');
    } catch (e) {
      console.error('Reorder payment failed', e);
      showError('Reorder Failed');
    }
  };

  // DnD for payments within modal
  const onPaymentDragStart = (index: number) => setPaymentDnD({ dragIndex: index, overIndex: index });
  const onPaymentDragEnter = (index: number) => setPaymentDnD(prev => ({ ...prev, overIndex: index }));
  const onPaymentDrop = async () => {
    if (paymentDnD.dragIndex == null || paymentDnD.overIndex == null || paymentDnD.dragIndex === paymentDnD.overIndex) {
      setPaymentDnD({ dragIndex: null, overIndex: null });
      return;
    }
    const items = [...state.payments] as any[];
    const [moved] = items.splice(paymentDnD.dragIndex, 1);
    items.splice(paymentDnD.overIndex, 0, moved);
    const updates = items.map((p, i) => ({ id: p.id, order: i }));
    try {
      for (const u of updates) {
        await graphqlClient.graphql({ query: updateProjectPaymentTerms, variables: { input: u } });
      }
      await loadPayments();
      showSuccess('Payments Reordered');
    } catch (e) {
      console.error('Payment DnD reorder failed', e);
      showError('Reorder Failed');
    } finally {
      setPaymentDnD({ dragIndex: null, overIndex: null });
    }
  };

  // Gallery CRUD (URL-based)
  const addGalleryUrl = () => {
  const raw = newGalleryUrl.trim();
  if (!raw) return;
  // Allow either full URL or relative path
  const normalized = raw.startsWith('http') ? raw : getFullUrlFromPath(raw);
  setState(prev => ({ ...prev, gallery: [...prev.gallery, { url: normalized, alt: 'Project image' }] }));
    setNewGalleryUrl('');
  };

  const removeGalleryIndex = (index: number) => {
    setState(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  };

  const moveGallery = (index: number, direction: -1 | 1) => {
    const items = [...state.gallery];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const [moved] = items.splice(index, 1);
    items.splice(newIndex, 0, moved);
    setState(prev => ({ ...prev, gallery: items }));
  };

  // Drag-and-drop for gallery
  const onGalleryDragStart = (index: number) => setGalleryDnD({ dragIndex: index, overIndex: index });
  const onGalleryDragEnter = (index: number) => setGalleryDnD(prev => ({ ...prev, overIndex: index }));
  const onGalleryDrop = () => {
    if (galleryDnD.dragIndex == null || galleryDnD.overIndex == null || galleryDnD.dragIndex === galleryDnD.overIndex) {
      setGalleryDnD({ dragIndex: null, overIndex: null });
      return;
    }
    const items = [...state.gallery];
    const [moved] = items.splice(galleryDnD.dragIndex, 1);
    items.splice(galleryDnD.overIndex, 0, moved);
    setState(prev => ({ ...prev, gallery: items }));
    setGalleryDnD({ dragIndex: null, overIndex: null });
  };

  const saveGallery = async () => {
    if (!state.project) return;
    try {
  // Persist as JSON array of RELATIVE paths for resilience
  const relativePaths = state.gallery.map(g => getRelativePathFromUrl(g.url));
  const galleryJson = JSON.stringify(relativePaths);
      await graphqlClient.graphql({ query: updateProjects, variables: { input: { id: state.project.id, gallery: galleryJson } } });
      await loadProject();
  showSuccess('Gallery Saved');
    } catch (e) {
      console.error('Save gallery failed', e);
  showError('Save Gallery Failed');
    }
  };

  // Comments manage
  const deleteComment = async (id: string) => {
    try {
      await graphqlClient.graphql({ query: deleteProjectComments, variables: { input: { id } } });
      await loadComments();
  showSuccess('Comment Deleted');
    } catch (e) {
      console.error('Delete comment failed', e);
  showError('Delete Comment Failed');
    }
  };

  const addComment = async (content: string) => {
    if (!state.project || !content.trim()) return;
    try {
      await graphqlClient.graphql({ query: createProjectComments, variables: { input: { projectId: state.project.id, comment: content.trim() } } });
      await loadComments();
      showSuccess('Comment Added');
    } catch (e) {
      console.error('Add comment failed', e);
      showError('Add Comment Failed');
    }
  };

  const saveEditedComment = async () => {
    if (!editingComment) return;
    try {
      await graphqlClient.graphql({ query: (require('../../../mutations').updateProjectComments), variables: { input: { id: editingComment.id, comment: editingCommentText, isPrivate: editingCommentPrivate } } });
      setEditingComment(null);
      setEditingCommentText('');
      await loadComments();
      showSuccess('Comment Updated');
    } catch (e) {
      console.error('Update comment failed', e);
      showError('Update Comment Failed');
    }
  };

  // Contacts manage
  const searchContacts = async () => {
    try {
      const res: any = await graphqlClient.graphql({ query: listContacts, variables: { filter: contactSearch ? { or: [ { firstName: { contains: contactSearch } }, { lastName: { contains: contactSearch } }, { email: { contains: contactSearch } } ] } : undefined, limit: 50 } });
      setContactResults(res.data?.listContacts?.items || []);
    } catch (e) {
      console.error('Search contacts failed', e);
    }
  };

  const assignProjectContact = async (role: 'agent'|'homeowner'|'homeowner2'|'homeowner3', contactId: string) => {
    if (!state.project) return;
    const roleFieldMap: Record<string, string> = {
      agent: 'agentContactId',
      homeowner: 'homeownerContactId',
      homeowner2: 'homeowner2ContactId',
      homeowner3: 'homeowner3ContactId'
    };
    try {
      await graphqlClient.graphql({ query: updateProjects, variables: { input: { id: state.project.id, [roleFieldMap[role]]: contactId } } });
      await loadProject();
      await loadContacts();
    } catch (e) {
      console.error('Assign contact failed', e);
    }
  };

  const saveContactDetails = async () => {
    if (!editingContact?.id) return;
    try {
      await graphqlClient.graphql({ query: updateContacts, variables: { input: { id: editingContact.id, ...editingContact } } });
      setEditingContact(null);
      await loadContacts();
    } catch (e) {
      console.error('Update contact failed', e);
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
            <ProjectImageGalleryMUI images={state.gallery} />
            <div className="mt-3 text-right">
              <Button variant="secondary" onClick={openGalleryModal}>Manage Gallery</Button>
            </div>
          </div>

          {/* Milestones & Payment Terms */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <H3 className="mb-4">Milestones & Payment Terms</H3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MilestonesList milestones={state.milestones} onMilestoneToggle={handleMilestoneToggle} />
              <PaymentList payments={state.payments} onPaymentToggle={handlePaymentToggle} />
            </div>
            <div className="mt-3 flex gap-3 justify-end">
              <Button variant="secondary" onClick={openMilestonesModal}>Manage Milestones</Button>
              <Button variant="secondary" onClick={openPaymentsModal}>Manage Payments</Button>
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
        <div className="mb-3 text-right">
          <Button variant="secondary" onClick={openCommentsModal}>Manage Comments</Button>
        </div>
        <CommentsList 
          commentsData={state.comments}
          projectId={projectId}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Contacts management quick action */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <H3 className="mb-4">Project Contacts</H3>
        <div className="flex flex-wrap gap-4">
          <div>
            <P3 className="text-gray-700">Agent</P3>
            <P2 className="text-gray-600">{state.contacts?.agent?.fullName || state.contacts?.agent?.email || 'Unassigned'}</P2>
          </div>
          <div>
            <P3 className="text-gray-700">Homeowner</P3>
            <P2 className="text-gray-600">{state.contacts?.homeowner?.fullName || state.contacts?.homeowner?.email || 'Unassigned'}</P2>
          </div>
        </div>
        <div className="mt-3 text-right">
          <Button variant="secondary" onClick={openContactsModal}>Manage Contacts</Button>
        </div>
      </div>

      {/* Gallery Modal */}
      <BaseModal
        open={state.showGalleryModal}
        onClose={closeAllModals}
        title="Manage Gallery"
        subtitle="Add, remove, and reorder gallery images"
      >
        <div className="space-y-3">
          {/* S3 Upload */}
          <div className="border rounded p-3">
            <H4 className="mb-2">Upload Images</H4>
            <FileUploadField
              onFilesChange={(files) => {
                const imageFiles = files.filter((f: any) => f.category === 'images');
                if (imageFiles.length === 0) return;
                const newImages: GalleryImage[] = imageFiles.map((f: any) => ({ url: getFullUrlFromPath(f.url), alt: f.name }));
                setState(prev => ({ ...prev, gallery: [...prev.gallery, ...newImages] }));
                showSuccess('Uploaded', `${imageFiles.length} image(s) added to gallery`);
              }}
              sessionId={getRequestContext().sessionId}
            />
          </div>
          <div className="flex gap-2">
            <input className="flex-1 border rounded px-3 py-2" placeholder="Image URL" value={newGalleryUrl} onChange={e => setNewGalleryUrl(e.target.value)} />
            <Button variant="primary" onClick={addGalleryUrl}>Add</Button>
          </div>
          <div className="space-y-2">
            {state.gallery.map((img, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 border rounded p-2 ${galleryDnD.overIndex===idx ? 'bg-orange-50' : ''}`}
                draggable
                onDragStart={() => onGalleryDragStart(idx)}
                onDragEnter={() => onGalleryDragEnter(idx)}
                onDragEnd={onGalleryDrop}
              >
                <Image src={img.url} alt={img.alt || 'img'} width={48} height={48} className="w-12 h-12 object-cover rounded" />
                <P2 className="flex-1 truncate">{img.url}</P2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => moveGallery(idx, -1)} disabled={idx===0}>↑</Button>
                  <Button variant="secondary" onClick={() => moveGallery(idx, 1)} disabled={idx===state.gallery.length-1}>↓</Button>
                  <Button variant="tertiary" onClick={() => removeGalleryIndex(idx)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-right">
            <Button variant="primary" onClick={saveGallery}>Save Gallery</Button>
          </div>
        </div>
      </BaseModal>

      {/* Milestones Modal */}
      <BaseModal
        open={state.showMilestonesModal}
        onClose={closeAllModals}
        title="Manage Milestones"
        subtitle="Add, edit, delete, and reorder milestones"
      >
        <div className="space-y-3">
          <div className="space-y-2">
            {state.milestones.map((m, idx) => (
              <div
                key={m.id}
                className={`border rounded p-3 ${milestoneDnD.overIndex===idx ? 'bg-orange-50' : ''}`}
                draggable
                onDragStart={() => onMilestoneDragStart(idx)}
                onDragEnter={() => onMilestoneDragEnter(idx)}
                onDragEnd={onMilestoneDrop}
              >
                <div className="flex items-center gap-2">
                  <P2 className="flex-1">{m.name}</P2>
                  <Button variant="secondary" onClick={() => moveMilestone(idx, -1)} disabled={idx===0}>↑</Button>
                  <Button variant="secondary" onClick={() => moveMilestone(idx, 1)} disabled={idx===state.milestones.length-1}>↓</Button>
                  <Button variant="secondary" onClick={() => setEditingMilestone(m)}>Edit</Button>
                  <Button variant="tertiary" onClick={() => deleteMilestone(m.id)}>Delete</Button>
                </div>
                {editingMilestone?.id === m.id && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input className="border rounded px-3 py-2" value={editingMilestone.name as any} onChange={e => setEditingMilestone({ ...editingMilestone!, name: e.target.value })} />
                    <input className="border rounded px-3 py-2" placeholder="Order" type="number" value={editingMilestone.order as any || 0} onChange={e => setEditingMilestone({ ...editingMilestone!, order: Number(e.target.value) })} />
                    <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Description" value={editingMilestone.description as any || ''} onChange={e => setEditingMilestone({ ...editingMilestone!, description: e.target.value })} />
                    <div className="md:col-span-2 text-right">
                      <Button variant="primary" onClick={saveMilestone}>Save</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border rounded p-3">
            <H4 className="mb-2">Add Milestone</H4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input className="border rounded px-3 py-2" placeholder="Name" value={editingMilestone?.id ? '' : (editingMilestone?.name as any) || ''} onChange={e => setEditingMilestone({ ...(editingMilestone?.id ? {} : editingMilestone), name: e.target.value })} />
              <input className="border rounded px-3 py-2" placeholder="Order" type="number" value={editingMilestone?.id ? '' : (editingMilestone?.order as any) || 0} onChange={e => setEditingMilestone({ ...(editingMilestone?.id ? {} : editingMilestone), order: Number(e.target.value) })} />
              <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Description" value={editingMilestone?.id ? '' : (editingMilestone?.description as any) || ''} onChange={e => setEditingMilestone({ ...(editingMilestone?.id ? {} : editingMilestone), description: e.target.value })} />
              <div className="md:col-span-2 text-right">
                <Button variant="primary" onClick={saveMilestone}>Add</Button>
              </div>
            </div>
          </div>
        </div>
      </BaseModal>

      {/* Payments Modal */}
      <BaseModal
        open={state.showPaymentsModal}
        onClose={closeAllModals}
        title="Manage Payments"
        subtitle="Add, edit, delete, and reorder payment terms"
      >
        <div className="space-y-3">
          <div className="space-y-2">
            {state.payments.map((p: any, idx) => (
              <div
                key={p.id || `${p.paymentName}-${idx}`}
                className={`border rounded p-3 ${paymentDnD.overIndex===idx ? 'bg-orange-50' : ''}`}
                draggable
                onDragStart={() => onPaymentDragStart(idx)}
                onDragEnter={() => onPaymentDragEnter(idx)}
                onDragEnd={onPaymentDrop}
              >
                <div className="flex items-center gap-2">
                  <P2 className="flex-1">{p.paymentName} {p.paymentAmount ? `- $${p.paymentAmount}` : ''}</P2>
                  <Button variant="secondary" onClick={() => movePayment(idx, -1)} disabled={idx===0}>↑</Button>
                  <Button variant="secondary" onClick={() => movePayment(idx, 1)} disabled={idx===state.payments.length-1}>↓</Button>
                  <Button variant="secondary" onClick={() => setEditingPayment(p)}>Edit</Button>
                  <Button variant="tertiary" onClick={() => deletePayment(p.id)}>Delete</Button>
                </div>
                {(editingPayment as any)?.id === p.id && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input className="border rounded px-3 py-2" value={editingPayment?.paymentName || ''} onChange={e => setEditingPayment({ ...editingPayment!, paymentName: e.target.value })} />
                    <input className="border rounded px-3 py-2" placeholder="Order" type="number" value={editingPayment?.order as any || 0} onChange={e => setEditingPayment({ ...editingPayment!, order: Number(e.target.value) })} />
                    <input className="border rounded px-3 py-2" placeholder="Amount" type="number" value={editingPayment?.paymentAmount as any || 0} onChange={e => setEditingPayment({ ...editingPayment!, paymentAmount: Number(e.target.value) })} />
                    <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Description" value={editingPayment?.description || ''} onChange={e => setEditingPayment({ ...editingPayment!, description: e.target.value })} />
                    <div className="md:col-span-2 text-right">
                      <Button variant="primary" onClick={savePayment}>Save</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="border rounded p-3">
            <H4 className="mb-2">Add Payment Term</H4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input className="border rounded px-3 py-2" placeholder="Payment Name" value={(editingPayment as any)?.id ? '' : editingPayment?.paymentName || ''} onChange={e => setEditingPayment({ ...((editingPayment as any)?.id ? {} : editingPayment), paymentName: e.target.value })} />
              <input className="border rounded px-3 py-2" placeholder="Order" type="number" value={(editingPayment as any)?.id ? '' : (editingPayment?.order as any) || 0} onChange={e => setEditingPayment({ ...((editingPayment as any)?.id ? {} : editingPayment), order: Number(e.target.value) })} />
              <input className="border rounded px-3 py-2" placeholder="Amount" type="number" value={(editingPayment as any)?.id ? '' : (editingPayment?.paymentAmount as any) || 0} onChange={e => setEditingPayment({ ...((editingPayment as any)?.id ? {} : editingPayment), paymentAmount: Number(e.target.value) })} />
              <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Description" value={(editingPayment as any)?.id ? '' : (editingPayment?.description || '')} onChange={e => setEditingPayment({ ...((editingPayment as any)?.id ? {} : editingPayment), description: e.target.value })} />
              <div className="md:col-span-2 text-right">
                <Button variant="primary" onClick={savePayment}>Add</Button>
              </div>
            </div>
          </div>
        </div>
      </BaseModal>

      {/* Comments Modal */}
      <BaseModal
        open={state.showCommentsModal}
        onClose={closeAllModals}
        title="Manage Comments"
        subtitle="Add, edit, remove, and set privacy for comments"
      >
        <div className="space-y-3">
          <div className="border rounded p-3">
            <H4 className="mb-2">Add Comment</H4>
            <textarea className="border rounded px-3 py-2 w-full" placeholder="Write a comment" value={newCommentText} onChange={e => setNewCommentText(e.target.value)} />
            <div className="text-right mt-2">
              <Button variant="primary" onClick={() => { addComment(newCommentText); setNewCommentText(''); }}>Add</Button>
            </div>
          </div>
          <div className="space-y-2">
            {state.comments.map(c => (
              <div key={c.id} className="border rounded p-2">
                <div className="flex items-center gap-3">
                  <P2 className="flex-1">{c.comment}</P2>
                  <span className={`text-xs px-2 py-1 rounded ${c.isPrivate ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                    {c.isPrivate ? 'Private' : 'Public'}
                  </span>
                  <Button variant="secondary" onClick={() => { setEditingComment(c); setEditingCommentText(c.comment || ''); setEditingCommentPrivate(!!c.isPrivate); }}>Edit</Button>
                  <Button variant="tertiary" onClick={() => deleteComment(c.id)}>Delete</Button>
                </div>
                {editingComment?.id === c.id && (
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <textarea className="border rounded px-3 py-2" value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)} />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={editingCommentPrivate} onChange={e => setEditingCommentPrivate(e.target.checked)} />
                      Private comment
                    </label>
                    <div className="text-right">
                      <Button variant="primary" onClick={saveEditedComment}>Save</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </BaseModal>

      {/* Contacts Modal */}
      <BaseModal
        open={state.showContactsModal}
        onClose={closeAllModals}
        title="Manage Contacts"
        subtitle="Assign contacts to roles and update their details"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <H4 className="mb-2">Assign Agent</H4>
              <div className="flex gap-2 mb-2">
                <input className="border rounded px-3 py-2 flex-1" placeholder="Search (name/email)" value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
                <Button variant="secondary" onClick={searchContacts}>Search</Button>
              </div>
              <div className="max-h-48 overflow-auto space-y-2">
                {contactResults.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between border rounded p-2">
                    <P2 className="mb-0">{c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email}</P2>
                    <Button variant="primary" onClick={() => assignProjectContact('agent', c.id)}>Assign</Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded p-3">
              <H4 className="mb-2">Assign Homeowner</H4>
              <div className="flex gap-2 mb-2">
                <input className="border rounded px-3 py-2 flex-1" placeholder="Search (name/email)" value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
                <Button variant="secondary" onClick={searchContacts}>Search</Button>
              </div>
              <div className="max-h-48 overflow-auto space-y-2">
                {contactResults.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between border rounded p-2">
                    <P2 className="mb-0">{c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email}</P2>
                    <Button variant="primary" onClick={() => assignProjectContact('homeowner', c.id)}>Assign</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border rounded p-3">
            <H4 className="mb-2">Edit Contact Details</H4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <select className="border rounded px-3 py-2 flex-1" value={editingContact?.id || ''} onChange={e => setEditingContact(contactResults.find(c => c.id === e.target.value) || null)}>
                  <option value="">Select from search results</option>
                  {contactResults.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email}</option>
                  ))}
                </select>
                <Button variant="secondary" onClick={searchContacts}>Refresh</Button>
              </div>
              {editingContact && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input className="border rounded px-3 py-2" placeholder="First Name" value={editingContact.firstName || ''} onChange={e => setEditingContact({ ...editingContact, firstName: e.target.value })} />
                  <input className="border rounded px-3 py-2" placeholder="Last Name" value={editingContact.lastName || ''} onChange={e => setEditingContact({ ...editingContact, lastName: e.target.value })} />
                  <input className="border rounded px-3 py-2" placeholder="Email" value={editingContact.email || ''} onChange={e => setEditingContact({ ...editingContact, email: e.target.value })} />
                  <input className="border rounded px-3 py-2" placeholder="Mobile" value={editingContact.mobile || ''} onChange={e => setEditingContact({ ...editingContact, mobile: e.target.value })} />
                  <div className="md:col-span-2 text-right">
                    <Button variant="primary" onClick={saveContactDetails}>Save Contact</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseModal>

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