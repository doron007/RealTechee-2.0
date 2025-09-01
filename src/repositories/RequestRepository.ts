/**
 * RequestRepository - Enterprise-grade repository for Request management
 * 
 * Handles all CRUD operations for Requests with:
 * - Related entity loading (notes, assignments, status history)
 * - Business-specific queries and filters
 * - Status transition validation
 * - Assignment operations
 * - Case management functionality
 */

import { BaseRepository } from './base/BaseRepository';
import { GraphQLClient } from './base/GraphQLClient';
import {
  ServiceResult,
  FilterOptions,
  ListOptions,
  CreateInput,
  UpdateInput,
  BaseModel,
  PaginatedResult
} from './base/types';
import {
  ValidationError,
  NotFoundError,
  RepositoryError,
  RepositoryErrorCode,
  createRepositoryError
} from './base/RepositoryError';
import { createLogger } from '../../utils/logger';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Request model interface matching the GraphQL schema
 */
export interface Request extends BaseModel {
  // Core fields
  status?: string;
  statusImage?: string;
  statusOrder?: number;
  accountExecutive?: number;
  product?: string;
  assignedTo?: string;
  assignedDate?: string;
  message?: string;
  relationToProperty?: string;
  virtualWalkthrough?: string;
  uploadedMedia?: string;
  uplodedDocuments?: string;
  uploadedVideos?: string;
  rtDigitalSelection?: string;
  leadSource?: string;
  needFinance?: boolean;
  leadFromSync?: string;
  leadFromVenturaStone?: string;
  officeNotes?: string;
  archived?: string;
  bookingId?: string;
  requestedSlot?: string;
  requestedVisitDateTime?: string;
  visitorId?: string;
  visitDate?: string;
  moveToQuotingDate?: string;
  expiredDate?: string;
  archivedDate?: string;
  budget?: string;

  // Enhanced case management fields
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  source?: string;
  tags?: string[];
  estimatedValue?: number;
  followUpDate?: string;
  lastContactDate?: string;
  clientResponseDate?: string;
  informationGatheringStatus?: 'pending' | 'in_progress' | 'completed';
  scopeDefinitionStatus?: 'not_started' | 'in_progress' | 'completed';
  readinessScore?: number;
  missingInformation?: string[];

  // Foreign keys
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;

  // Related entities (loaded on demand)
  agent?: any;
  homeowner?: any;
  address?: any;
  notes?: RequestNote[];
  assignments?: RequestAssignment[];
  statusHistory?: RequestStatusHistory[];
  informationItems?: RequestInformationItem[];
  scopeItems?: RequestScopeItem[];
  workflowStates?: RequestWorkflowState[];
}

/**
 * Related entity types
 */
export interface RequestNote extends BaseModel {
  requestId: string;
  content: string;
  type?: 'internal' | 'client_communication' | 'technical' | 'follow_up';
  category?: string;
  isPrivate?: boolean;
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  attachments?: any[];
  relatedToStatusChange?: boolean;
  priority?: 'normal' | 'important' | 'urgent';
  tags?: string[];
  communicationMethod?: 'phone' | 'email' | 'text' | 'in_person' | 'other';
  clientResponse?: 'pending' | 'responded' | 'no_response';
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface RequestAssignment extends BaseModel {
  requestId: string;
  assignedToId: string;
  assignedToName: string;
  assignedToRole: string;
  assignmentType?: 'primary' | 'secondary' | 'observer';
  assignedById: string;
  assignedByName: string;
  assignmentReason?: string;
  status?: 'active' | 'completed' | 'transferred' | 'cancelled';
  priority?: 'normal' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;
  transferredAt?: string;
  transferredToId?: string;
  transferredToName?: string;
  transferReason?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface RequestStatusHistory extends BaseModel {
  requestId: string;
  previousStatus?: string;
  newStatus: string;
  statusReason?: string;
  triggeredBy?: 'user' | 'system' | 'automation';
  triggeredById?: string;
  triggeredByName?: string;
  automationRule?: string;
  businessImpact?: 'none' | 'low' | 'medium' | 'high';
  clientNotified?: boolean;
  internalNotification?: boolean;
  timeInPreviousStatus?: number;
  expectedDuration?: number;
  metadata?: any;
  timestamp?: string;
}

export interface RequestInformationItem extends BaseModel {
  requestId: string;
  category?: 'property' | 'client' | 'project' | 'financial' | 'technical';
  itemName: string;
  description?: string;
  status?: 'missing' | 'requested' | 'received' | 'verified';
  importance?: 'required' | 'important' | 'optional';
  requestedDate?: string;
  receivedDate?: string;
  verifiedDate?: string;
  requestedBy?: string;
  source?: 'client' | 'agent' | 'inspection' | 'documents';
  value?: string;
  attachments?: any[];
  notes?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  remindersSent?: number;
}

export interface RequestScopeItem extends BaseModel {
  requestId: string;
  category?: 'room' | 'area' | 'system' | 'material' | 'service';
  name: string;
  description?: string;
  parentItemId?: string;
  orderIndex?: number;
  isCategory?: boolean;
  specifications?: any;
  materials?: any;
  laborRequirements?: any;
  timeline?: string;
  estimatedCost?: number;
  estimatedHours?: number;
  complexity?: 'simple' | 'moderate' | 'complex' | 'very_complex';
  status?: 'draft' | 'defined' | 'approved' | 'quoted';
  approvedBy?: string;
  approvedDate?: string;
  clientApproval?: 'pending' | 'approved' | 'rejected' | 'modified';
  clientNotes?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface RequestWorkflowState extends BaseModel {
  requestId: string;
  workflowName: string;
  currentState: string;
  availableActions?: string[];
  stateData?: any;
  progress?: number;
  totalSteps?: number;
  completedSteps?: number;
  startedAt?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  automationEnabled?: boolean;
  nextAutomationCheck?: string;
}

/**
 * Request with all related data loaded
 */
export interface EnhancedRequest extends Request {
  agent: any;
  homeowner: any;
  address: any;
  notes: RequestNote[];
  assignments: RequestAssignment[];
  statusHistory: RequestStatusHistory[];
  informationItems: RequestInformationItem[];
  scopeItems: RequestScopeItem[];
  workflowStates: RequestWorkflowState[];
}

/**
 * Business-specific filter options
 */
export interface RequestFilterOptions {
  status?: string | string[];
  assignedTo?: string | string[];
  priority?: string | string[];
  leadSource?: string | string[];
  dateRange?: {
    field: 'createdAt' | 'visitDate' | 'followUpDate' | 'assignedDate';
    start: string;
    end: string;
  };
  hasAgent?: boolean;
  hasProperty?: boolean;
  isArchived?: boolean;
  needsFollowUp?: boolean;
  readinessScoreMin?: number;
}

/**
 * Status transition validation result
 */
export interface StatusTransitionResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  requiredFields?: string[];
  businessRules?: string[];
}

// ============================================================================
// GraphQL Queries and Mutations
// ============================================================================

const GET_REQUEST_QUERY = /* GraphQL */ `
  query GetRequest($id: ID!) {
    getRequests(id: $id) {
      id
      status
      statusImage
      statusOrder
      accountExecutive
      product
      assignedTo
      assignedDate
      message
      relationToProperty
      virtualWalkthrough
      uploadedMedia
      uplodedDocuments
      uploadedVideos
      rtDigitalSelection
      leadSource
      needFinance
      leadFromSync
      leadFromVenturaStone
      officeNotes
      archived
      bookingId
      requestedSlot
      requestedVisitDateTime
      visitorId
      visitDate
      moveToQuotingDate
      expiredDate
      archivedDate
      budget
      priority
      source
      tags
      estimatedValue
      followUpDate
      lastContactDate
      clientResponseDate
      informationGatheringStatus
      scopeDefinitionStatus
      readinessScore
      missingInformation
      agentContactId
      homeownerContactId
      addressId
      createdAt
      updatedAt
      owner
      agent {
        id
        firstName
        lastName
        fullName
        email
        phone
        mobile
        company
        roleType
      }
      homeowner {
        id
        firstName
        lastName
        fullName
        email
        phone
        mobile
        company
      }
      address {
        id
        propertyFullAddress
        houseAddress
        city
        state
        zip
        propertyType
        bedrooms
        bathrooms
        floors
        sizeSqft
        yearBuilt
      }
    }
  }
`;

const LIST_REQUESTS_QUERY = /* GraphQL */ `
  query ListRequests(
    $filter: ModelRequestsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listRequests(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        status
        statusImage
        statusOrder
        accountExecutive
        product
        assignedTo
        assignedDate
        message
        leadSource
        needFinance
        officeNotes
        budget
        priority
        source
        estimatedValue
        followUpDate
        lastContactDate
        readinessScore
        agentContactId
        homeownerContactId
        addressId
        createdAt
        updatedAt
        agent {
          id
          firstName
          lastName
          fullName
          email
          roleType
        }
        homeowner {
          id
          firstName
          lastName
          fullName
          email
        }
        address {
          id
          propertyFullAddress
          city
          state
        }
      }
      nextToken
    }
  }
`;

const GET_REQUEST_WITH_RELATIONS_QUERY = /* GraphQL */ `
  query GetRequestWithRelations($id: ID!) {
    getRequests(id: $id) {
      id
      status
      statusImage
      statusOrder
      accountExecutive
      product
      assignedTo
      assignedDate
      message
      relationToProperty
      virtualWalkthrough
      uploadedMedia
      uplodedDocuments
      uploadedVideos
      rtDigitalSelection
      leadSource
      needFinance
      officeNotes
      budget
      priority
      source
      tags
      estimatedValue
      followUpDate
      lastContactDate
      clientResponseDate
      informationGatheringStatus
      scopeDefinitionStatus
      readinessScore
      missingInformation
      agentContactId
      homeownerContactId
      addressId
      createdAt
      updatedAt
      owner
      agent {
        id
        firstName
        lastName
        fullName
        email
        phone
        mobile
        company
        roleType
        isActive
      }
      homeowner {
        id
        firstName
        lastName
        fullName
        email
        phone
        mobile
        company
      }
      address {
        id
        propertyFullAddress
        houseAddress
        city
        state
        zip
        propertyType
        bedrooms
        bathrooms
        floors
        sizeSqft
        yearBuilt
        redfinLink
        zillowLink
      }
      notes {
        items {
          id
          content
          type
          category
          isPrivate
          authorId
          authorName
          authorRole
          attachments
          priority
          tags
          communicationMethod
          clientResponse
          followUpRequired
          followUpDate
          createdAt
          updatedAt
        }
      }
      assignments {
        items {
          id
          assignedToId
          assignedToName
          assignedToRole
          assignmentType
          assignedById
          assignedByName
          status
          priority
          dueDate
          estimatedHours
          actualHours
          createdAt
          updatedAt
        }
      }
      statusHistory {
        items {
          id
          previousStatus
          newStatus
          statusReason
          triggeredBy
          triggeredById
          triggeredByName
          businessImpact
          clientNotified
          internalNotification
          timeInPreviousStatus
          expectedDuration
          timestamp
          createdAt
        }
      }
      informationItems {
        items {
          id
          category
          itemName
          description
          status
          importance
          requestedDate
          receivedDate
          verifiedDate
          value
          notes
          followUpRequired
          followUpDate
          remindersSent
          createdAt
          updatedAt
        }
      }
      scopeItems {
        items {
          id
          category
          name
          description
          orderIndex
          isCategory
          specifications
          materials
          timeline
          estimatedCost
          estimatedHours
          complexity
          status
          approvedBy
          approvedDate
          clientApproval
          clientNotes
          createdAt
          updatedAt
        }
      }
      workflowStates {
        items {
          id
          workflowName
          currentState
          availableActions
          stateData
          progress
          totalSteps
          completedSteps
          startedAt
          expectedCompletionDate
          actualCompletionDate
          automationEnabled
          createdAt
          updatedAt
        }
      }
    }
  }
`;

const CREATE_REQUEST_MUTATION = /* GraphQL */ `
  mutation CreateRequest($input: CreateRequestsInput!) {
    createRequests(input: $input) {
      id
      status
      statusOrder
      product
      assignedTo
      message
      leadSource
      budget
      priority
      source
      estimatedValue
      agentContactId
      homeownerContactId
      addressId
      createdAt
      updatedAt
      owner
    }
  }
`;

const UPDATE_REQUEST_MUTATION = /* GraphQL */ `
  mutation UpdateRequest($input: UpdateRequestsInput!) {
    updateRequests(input: $input) {
      id
      status
      statusImage
      statusOrder
      accountExecutive
      product
      assignedTo
      assignedDate
      message
      leadSource
      officeNotes
      budget
      priority
      source
      estimatedValue
      followUpDate
      lastContactDate
      readinessScore
      informationGatheringStatus
      scopeDefinitionStatus
      agentContactId
      homeownerContactId
      addressId
      createdAt
      updatedAt
      owner
    }
  }
`;

const DELETE_REQUEST_MUTATION = /* GraphQL */ `
  mutation DeleteRequest($input: DeleteRequestsInput!) {
    deleteRequests(input: $input) {
      id
    }
  }
`;

// Related entity mutations
const CREATE_REQUEST_NOTE_MUTATION = /* GraphQL */ `
  mutation CreateRequestNote($input: CreateRequestNotesInput!) {
    createRequestNotes(input: $input) {
      id
      requestId
      content
      type
      category
      isPrivate
      authorId
      authorName
      authorRole
      priority
      tags
      communicationMethod
      followUpRequired
      followUpDate
      createdAt
      updatedAt
    }
  }
`;

const CREATE_REQUEST_ASSIGNMENT_MUTATION = /* GraphQL */ `
  mutation CreateRequestAssignment($input: CreateRequestAssignmentsInput!) {
    createRequestAssignments(input: $input) {
      id
      requestId
      assignedToId
      assignedToName
      assignedToRole
      assignmentType
      assignedById
      assignedByName
      status
      priority
      dueDate
      estimatedHours
      createdAt
      updatedAt
    }
  }
`;

const CREATE_REQUEST_STATUS_HISTORY_MUTATION = /* GraphQL */ `
  mutation CreateRequestStatusHistory($input: CreateRequestStatusHistoryInput!) {
    createRequestStatusHistory(input: $input) {
      id
      requestId
      previousStatus
      newStatus
      statusReason
      triggeredBy
      triggeredById
      triggeredByName
      businessImpact
      clientNotified
      internalNotification
      timestamp
      createdAt
      updatedAt
    }
  }
`;

// ============================================================================
// Repository Implementation
// ============================================================================

/**
 * RequestRepository - Complete repository for Request management
 */
export class RequestRepository extends BaseRepository<Request> {
  protected readonly requestLogger = createLogger('RequestRepository');

  constructor(client: GraphQLClient) {
    super(client, {
      modelName: 'Request',
      graphqlTypeName: 'Requests',
      defaultAuthMode: 'apiKey',
      enableValidation: true,
      enableAuditLog: true,
      defaultPageSize: 20,
      maxPageSize: 1000
    });
  }

  // ============================================================================
  // Abstract Method Implementations
  // ============================================================================

  protected getCreateMutation(): string {
    return CREATE_REQUEST_MUTATION;
  }

  protected getUpdateMutation(): string {
    return UPDATE_REQUEST_MUTATION;
  }

  protected getDeleteMutation(): string {
    return DELETE_REQUEST_MUTATION;
  }

  protected getGetQuery(): string {
    return GET_REQUEST_QUERY;
  }

  protected getListQuery(): string {
    return LIST_REQUESTS_QUERY;
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  protected async validateCreate(data: Omit<Request, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const errors: { field: string; message: string }[] = [];

    // Required fields validation
    if (!data.homeownerContactId && !data.agentContactId) {
      errors.push({
        field: 'contact',
        message: 'Either homeowner or agent contact is required'
      });
    }

    // Priority validation
    if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
      errors.push({
        field: 'priority',
        message: 'Priority must be one of: low, medium, high, urgent'
      });
    }

    // Readiness score validation
    if (data.readinessScore !== undefined && (data.readinessScore < 0 || data.readinessScore > 100)) {
      errors.push({
        field: 'readinessScore',
        message: 'Readiness score must be between 0 and 100'
      });
    }

    // Estimated value validation
    if (data.estimatedValue !== undefined && data.estimatedValue < 0) {
      errors.push({
        field: 'estimatedValue',
        message: 'Estimated value cannot be negative'
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Request validation failed', errors);
    }
  }

  protected async validateUpdate(id: string, data: Partial<Omit<Request, 'id' | 'createdAt'>>): Promise<void> {
    await super.validateUpdate(id, data);

    const errors: { field: string; message: string }[] = [];

    // Status transition validation if status is being updated
    if (data.status) {
      const currentRequest = await this.get(id);
      if (currentRequest.success && currentRequest.data) {
        const transitionResult = await this.validateStatusTransition(
          currentRequest.data.status || '',
          data.status
        );
        if (!transitionResult.isValid) {
          errors.push({
            field: 'status',
            message: `Invalid status transition: ${transitionResult.errors?.join(', ')}`
          });
        }
      }
    }

    // Same validation as create for relevant fields
    if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
      errors.push({
        field: 'priority',
        message: 'Priority must be one of: low, medium, high, urgent'
      });
    }

    if (data.readinessScore !== undefined && (data.readinessScore < 0 || data.readinessScore > 100)) {
      errors.push({
        field: 'readinessScore',
        message: 'Readiness score must be between 0 and 100'
      });
    }

    if (data.estimatedValue !== undefined && data.estimatedValue < 0) {
      errors.push({
        field: 'estimatedValue',
        message: 'Estimated value cannot be negative'
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Request update validation failed', errors);
    }
  }

  // ============================================================================
  // Data Transformation Methods
  // ============================================================================

  protected transformCreateInput(data: Omit<Request, 'id' | 'createdAt' | 'updatedAt'>): Record<string, any> {
    const transformed = { ...data };

    // Set default values
    if (!transformed.status) {
      transformed.status = 'new';
    }
    if (!transformed.priority) {
      transformed.priority = 'medium';
    }
    if (!transformed.source) {
      transformed.source = 'manual';
    }
    if (transformed.readinessScore === undefined) {
      transformed.readinessScore = 0;
    }

    // Convert arrays to JSON strings for GraphQL
    if (transformed.tags && Array.isArray(transformed.tags)) {
      (transformed as any).tags = JSON.stringify(transformed.tags);
    }
    if (transformed.missingInformation && Array.isArray(transformed.missingInformation)) {
      (transformed as any).missingInformation = JSON.stringify(transformed.missingInformation);
    }

    return transformed;
  }

  protected transformUpdateInput(data: Partial<Omit<Request, 'id' | 'createdAt'>>): Record<string, any> {
    const transformed = { ...data };

    // Convert arrays to JSON strings for GraphQL
    if (transformed.tags && Array.isArray(transformed.tags)) {
      (transformed as any).tags = JSON.stringify(transformed.tags);
    }
    if (transformed.missingInformation && Array.isArray(transformed.missingInformation)) {
      (transformed as any).missingInformation = JSON.stringify(transformed.missingInformation);
    }

    // Update timestamp
    transformed.updatedAt = new Date().toISOString();

    return transformed;
  }

  protected transformResponseData(data: any): Request {
    const transformed = { ...data };

    // Parse JSON strings back to arrays
    if (transformed.tags && typeof transformed.tags === 'string') {
      try {
        transformed.tags = JSON.parse(transformed.tags);
      } catch (e) {
        transformed.tags = [];
      }
    }
    if (transformed.missingInformation && typeof transformed.missingInformation === 'string') {
      try {
        transformed.missingInformation = JSON.parse(transformed.missingInformation);
      } catch (e) {
        transformed.missingInformation = [];
      }
    }

    return transformed as Request;
  }

  // ============================================================================
  // Business-Specific Query Methods
  // ============================================================================

  /**
   * Get request with all related entities loaded
   */
  async getWithRelations(id: string): Promise<ServiceResult<EnhancedRequest>> {
    try {
      this.requestLogger.info('Getting request with relations', { id });

      const result = await this.client.query(
        GET_REQUEST_WITH_RELATIONS_QUERY,
        { id },
        {
          authMode: this.config.defaultAuthMode,
          operation: 'getWithRelations',
          model: this.config.modelName
        }
      );

      if (!result.success) {
        throw result.error;
      }

      const data = this.extractQueryResult(result.data, 'get');
      if (!data) {
        throw new NotFoundError(this.config.modelName, id);
      }

      // Transform the data with proper relation parsing
      const transformedData = this.transformResponseData(data);

      // Transform related entities
      const enhancedRequest: EnhancedRequest = {
        ...transformedData,
        agent: data.agent,
        homeowner: data.homeowner,
        address: data.address,
        notes: data.notes?.items || [],
        assignments: data.assignments?.items || [],
        statusHistory: data.statusHistory?.items || [],
        informationItems: data.informationItems?.items || [],
        scopeItems: data.scopeItems?.items || [],
        workflowStates: data.workflowStates?.items || []
      };

      this.requestLogger.info('Request with relations retrieved successfully', {
        id,
        notesCount: enhancedRequest.notes.length,
        assignmentsCount: enhancedRequest.assignments.length,
        statusHistoryCount: enhancedRequest.statusHistory.length
      });

      return {
        success: true,
        data: enhancedRequest,
        meta: result.meta
      };

    } catch (error) {
      const repositoryError = createRepositoryError(error, 'getWithRelations', this.config.modelName);
      this.requestLogger.error('Get with relations failed', {
        id,
        error: repositoryError.message
      });

      return {
        success: false,
        error: repositoryError
      };
    }
  }

  /**
   * Find requests by status
   */
  async findByStatus(status: string | string[], options?: Omit<ListOptions, 'filter'>): Promise<ServiceResult<Request[]>> {
    const statusArray = Array.isArray(status) ? status : [status];
    
    return this.find({
      or: statusArray.map(s => ({ status: { eq: s } }))
    }, options);
  }

  /**
   * Find unassigned requests
   */
  async findUnassigned(options?: ListOptions): Promise<ServiceResult<Request[]>> {
    return this.find({
      or: [
        { assignedTo: { attributeExists: false } },
        { assignedTo: { eq: null } },
        { assignedTo: { eq: '' } }
      ]
    }, options);
  }

  /**
   * Find requests expiring soon (follow-up date approaching)
   */
  async findExpiring(daysAhead: number = 7, options?: ListOptions): Promise<ServiceResult<Request[]>> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateString = futureDate.toISOString().split('T')[0];

    return this.find({
      followUpDate: {
        le: futureDateString
      }
    }, options);
  }

  /**
   * Find requests by agent
   */
  async findByAgent(agentContactId: string, options?: ListOptions): Promise<ServiceResult<Request[]>> {
    return this.find({
      agentContactId: { eq: agentContactId }
    }, options);
  }

  /**
   * Find requests by homeowner
   */
  async findByHomeowner(homeownerContactId: string, options?: ListOptions): Promise<ServiceResult<Request[]>> {
    return this.find({
      homeownerContactId: { eq: homeownerContactId }
    }, options);
  }

  /**
   * Find requests by priority
   */
  async findByPriority(priority: string | string[], options?: ListOptions): Promise<ServiceResult<Request[]>> {
    const priorityArray = Array.isArray(priority) ? priority : [priority];
    
    return this.find({
      or: priorityArray.map(p => ({ priority: { eq: p } }))
    }, options);
  }

  /**
   * Find requests needing follow-up
   */
  async findNeedingFollowUp(options?: ListOptions): Promise<ServiceResult<Request[]>> {
    const today = new Date().toISOString().split('T')[0];
    
    return this.find({
      and: [
        { followUpDate: { le: today } },
        { followUpDate: { attributeExists: true } },
        { 
          or: [
            { status: { ne: 'completed' } },
            { status: { ne: 'cancelled' } },
            { status: { ne: 'archived' } }
          ]
        }
      ]
    }, options);
  }

  /**
   * Search requests with business-specific filters
   */
  async searchRequests(filters: RequestFilterOptions, options?: ListOptions): Promise<ServiceResult<PaginatedResult<Request>>> {
    const graphqlFilter: FilterOptions = {};

    // Status filter
    if (filters.status) {
      const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
      graphqlFilter.or = statusArray.map(s => ({ status: { eq: s } }));
    }

    // Assignment filter
    if (filters.assignedTo) {
      const assignedArray = Array.isArray(filters.assignedTo) ? filters.assignedTo : [filters.assignedTo];
      const assignmentFilter = { or: assignedArray.map(a => ({ assignedTo: { eq: a } })) };
      
      if (graphqlFilter.and) {
        graphqlFilter.and.push(assignmentFilter);
      } else {
        graphqlFilter.and = [assignmentFilter];
      }
    }

    // Priority filter
    if (filters.priority) {
      const priorityArray = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      const priorityFilter = { or: priorityArray.map(p => ({ priority: { eq: p } })) };
      
      if (graphqlFilter.and) {
        graphqlFilter.and.push(priorityFilter);
      } else {
        graphqlFilter.and = [priorityFilter];
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const dateFilter: any = {};
      dateFilter[filters.dateRange.field] = {
        between: [filters.dateRange.start, filters.dateRange.end]
      };
      
      if (graphqlFilter.and) {
        graphqlFilter.and.push(dateFilter);
      } else {
        graphqlFilter.and = [dateFilter];
      }
    }

    // Boolean filters
    if (filters.hasAgent === true) {
      const hasAgentFilter = { agentContactId: { attributeExists: true } };
      if (graphqlFilter.and) {
        graphqlFilter.and.push(hasAgentFilter);
      } else {
        graphqlFilter.and = [hasAgentFilter];
      }
    }

    if (filters.hasProperty === true) {
      const hasPropertyFilter = { addressId: { attributeExists: true } };
      if (graphqlFilter.and) {
        graphqlFilter.and.push(hasPropertyFilter);
      } else {
        graphqlFilter.and = [hasPropertyFilter];
      }
    }

    if (filters.isArchived === false) {
      const notArchivedFilter = {
        or: [
          { archived: { attributeExists: false } },
          { archived: { eq: null } },
          { archived: { eq: '' } }
        ]
      };
      if (graphqlFilter.and) {
        graphqlFilter.and.push(notArchivedFilter);
      } else {
        graphqlFilter.and = [notArchivedFilter];
      }
    }

    // Readiness score filter
    if (filters.readinessScoreMin !== undefined) {
      const readinessFilter = { readinessScore: { ge: filters.readinessScoreMin } };
      if (graphqlFilter.and) {
        graphqlFilter.and.push(readinessFilter);
      } else {
        graphqlFilter.and = [readinessFilter];
      }
    }

    return this.list({
      ...options,
      filter: graphqlFilter
    });
  }

  // ============================================================================
  // Status Management Methods
  // ============================================================================

  /**
   * Validate status transition
   */
  async validateStatusTransition(fromStatus: string, toStatus: string): Promise<StatusTransitionResult> {
    // Define valid status transitions (business rules)
    const validTransitions: Record<string, string[]> = {
      'new': ['assigned', 'in_progress', 'cancelled'],
      'assigned': ['in_progress', 'on_hold', 'cancelled'],
      'in_progress': ['quote_ready', 'on_hold', 'requires_info', 'cancelled'],
      'requires_info': ['in_progress', 'on_hold', 'cancelled'],
      'quote_ready': ['quote_sent', 'cancelled'],
      'quote_sent': ['quote_approved', 'quote_rejected', 'expired'],
      'quote_approved': ['converted', 'contracted'],
      'quote_rejected': ['follow_up', 'archived'],
      'on_hold': ['assigned', 'in_progress', 'cancelled'],
      'follow_up': ['in_progress', 'archived'],
      'contracted': ['completed'],
      'converted': ['completed'],
      'completed': [], // Terminal state
      'cancelled': [], // Terminal state
      'archived': [], // Terminal state
      'expired': ['follow_up', 'archived']
    };

    const allowedTransitions = validTransitions[fromStatus] || [];
    const isValid = allowedTransitions.includes(toStatus) || fromStatus === toStatus;

    const result: StatusTransitionResult = {
      isValid,
      errors: [],
      warnings: [],
      requiredFields: [],
      businessRules: []
    };

    if (!isValid) {
      result.errors?.push(`Cannot transition from '${fromStatus}' to '${toStatus}'`);
      result.businessRules?.push(`Allowed transitions from '${fromStatus}': ${allowedTransitions.join(', ')}`);
    }

    // Add warnings for specific transitions
    if (toStatus === 'cancelled' && fromStatus === 'in_progress') {
      result.warnings?.push('Cancelling request in progress - consider adding cancellation reason');
    }

    if (toStatus === 'quote_ready' && fromStatus !== 'in_progress') {
      result.warnings?.push('Moving to quote ready from non-active status');
    }

    // Required fields for specific transitions
    if (toStatus === 'assigned') {
      result.requiredFields?.push('assignedTo');
    }

    if (toStatus === 'quote_sent') {
      result.requiredFields?.push('Quote must be generated first');
    }

    return result;
  }

  /**
   * Update request status with validation and history tracking
   */
  async updateStatus(
    id: string, 
    newStatus: string, 
    options: {
      reason?: string;
      userId?: string;
      userName?: string;
      businessImpact?: 'none' | 'low' | 'medium' | 'high';
      notifyClient?: boolean;
    } = {}
  ): Promise<ServiceResult<Request>> {
    try {
      this.requestLogger.info('Updating request status', { id, newStatus, options });

      // Get current request
      const currentResult = await this.get(id);
      if (!currentResult.success || !currentResult.data) {
        throw new NotFoundError(this.config.modelName, id);
      }

      const currentRequest = currentResult.data;
      const previousStatus = currentRequest.status || '';

      // Validate status transition
      const transitionResult = await this.validateStatusTransition(previousStatus, newStatus);
      if (!transitionResult.isValid) {
        throw new RepositoryError(
          RepositoryErrorCode.VALIDATION_FAILED,
          `Invalid status transition from '${previousStatus}' to '${newStatus}'`,
          `Cannot transition request status`,
          {
            from: previousStatus,
            to: newStatus,
            errors: transitionResult.errors,
            businessRules: transitionResult.businessRules
          }
        );
      }

      // Update the request
      const updateResult = await this.update({
        id,
        data: { 
          status: newStatus,
          lastContactDate: new Date().toISOString()
        }
      });

      if (!updateResult.success) {
        throw updateResult.error;
      }

      // Create status history record
      try {
        await this.client.mutate(
          CREATE_REQUEST_STATUS_HISTORY_MUTATION,
          {
            input: {
              requestId: id,
              previousStatus,
              newStatus,
              statusReason: options.reason,
              triggeredBy: options.userId ? 'user' : 'system',
              triggeredById: options.userId,
              triggeredByName: options.userName,
              businessImpact: options.businessImpact || 'low',
              clientNotified: options.notifyClient || false,
              internalNotification: true,
              timestamp: new Date().toISOString()
            }
          },
          {
            authMode: this.config.defaultAuthMode,
            operation: 'createStatusHistory',
            model: 'RequestStatusHistory'
          }
        );
      } catch (historyError) {
        // Log the error but don't fail the main operation
        this.requestLogger.warn('Failed to create status history', {
          requestId: id,
          error: historyError
        });
      }

      this.requestLogger.info('Request status updated successfully', {
        id,
        previousStatus,
        newStatus,
        hasWarnings: (transitionResult.warnings?.length || 0) > 0
      });

      return {
        success: true,
        data: updateResult.data!,
        meta: {
          ...updateResult.meta,
          warnings: transitionResult.warnings || []
        }
      };

    } catch (error) {
      const repositoryError = createRepositoryError(error, 'updateStatus', this.config.modelName);
      this.requestLogger.error('Status update failed', {
        id,
        newStatus,
        error: repositoryError.message
      });

      return {
        success: false,
        error: repositoryError
      };
    }
  }

  // ============================================================================
  // Assignment Management Methods
  // ============================================================================

  /**
   * Assign request to a user
   */
  async assignRequest(
    requestId: string,
    assignToId: string,
    assignToName: string,
    assignToRole: string,
    options: {
      assignedById?: string;
      assignedByName?: string;
      assignmentType?: 'primary' | 'secondary' | 'observer';
      reason?: string;
      priority?: 'normal' | 'high' | 'urgent';
      dueDate?: string;
      estimatedHours?: number;
    } = {}
  ): Promise<ServiceResult<RequestAssignment>> {
    try {
      this.requestLogger.info('Assigning request', { requestId, assignToId, assignToName, options });

      // First update the request's assignedTo field
      const updateResult = await this.update({
        id: requestId,
        data: {
          assignedTo: assignToName,
          assignedDate: new Date().toISOString(),
          status: 'assigned' // Auto-transition to assigned status
        }
      });

      if (!updateResult.success) {
        throw updateResult.error;
      }

      // Create assignment record
      const assignmentResult = await this.client.mutate(
        CREATE_REQUEST_ASSIGNMENT_MUTATION,
        {
          input: {
            requestId,
            assignedToId: assignToId,
            assignedToName: assignToName,
            assignedToRole: assignToRole,
            assignmentType: options.assignmentType || 'primary',
            assignedById: options.assignedById || 'system',
            assignedByName: options.assignedByName || 'System',
            assignmentReason: options.reason,
            status: 'active',
            priority: options.priority || 'normal',
            dueDate: options.dueDate,
            estimatedHours: options.estimatedHours
          }
        },
        {
          authMode: this.config.defaultAuthMode,
          operation: 'createAssignment',
          model: 'RequestAssignment'
        }
      );

      if (!assignmentResult.success) {
        throw assignmentResult.error;
      }

      const assignment = assignmentResult.data?.createRequestAssignments;

      this.requestLogger.info('Request assigned successfully', {
        requestId,
        assignmentId: assignment?.id,
        assignToName
      });

      return {
        success: true,
        data: assignment as RequestAssignment,
        meta: assignmentResult.meta
      };

    } catch (error) {
      const repositoryError = createRepositoryError(error, 'assignRequest', this.config.modelName);
      this.requestLogger.error('Assignment failed', {
        requestId,
        assignToId,
        error: repositoryError.message
      });

      return {
        success: false,
        error: repositoryError
      };
    }
  }

  // ============================================================================
  // Note Management Methods
  // ============================================================================

  /**
   * Add note to request
   */
  async addNote(
    requestId: string,
    content: string,
    options: {
      type?: 'internal' | 'client_communication' | 'technical' | 'follow_up';
      category?: string;
      isPrivate?: boolean;
      authorId?: string;
      authorName?: string;
      authorRole?: string;
      priority?: 'normal' | 'important' | 'urgent';
      tags?: string[];
      communicationMethod?: 'phone' | 'email' | 'text' | 'in_person' | 'other';
      followUpRequired?: boolean;
      followUpDate?: string;
    } = {}
  ): Promise<ServiceResult<RequestNote>> {
    try {
      this.requestLogger.info('Adding note to request', { requestId, contentLength: content.length, options });

      const noteResult = await this.client.mutate(
        CREATE_REQUEST_NOTE_MUTATION,
        {
          input: {
            requestId,
            content,
            type: options.type || 'internal',
            category: options.category,
            isPrivate: options.isPrivate !== undefined ? options.isPrivate : true,
            authorId: options.authorId,
            authorName: options.authorName,
            authorRole: options.authorRole,
            priority: options.priority || 'normal',
            tags: options.tags ? JSON.stringify(options.tags) : null,
            communicationMethod: options.communicationMethod,
            followUpRequired: options.followUpRequired || false,
            followUpDate: options.followUpDate
          }
        },
        {
          authMode: this.config.defaultAuthMode,
          operation: 'createNote',
          model: 'RequestNote'
        }
      );

      if (!noteResult.success) {
        throw noteResult.error;
      }

      // Update request's lastContactDate
      await this.update({
        id: requestId,
        data: {
          lastContactDate: new Date().toISOString()
        }
      });

      const note = noteResult.data?.createRequestNotes;

      this.requestLogger.info('Note added successfully', {
        requestId,
        noteId: note?.id,
        type: options.type
      });

      return {
        success: true,
        data: note as RequestNote,
        meta: noteResult.meta
      };

    } catch (error) {
      const repositoryError = createRepositoryError(error, 'addNote', this.config.modelName);
      this.requestLogger.error('Add note failed', {
        requestId,
        error: repositoryError.message
      });

      return {
        success: false,
        error: repositoryError
      };
    }
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  /**
   * Bulk update request status
   */
  async bulkUpdateStatus(
    requestIds: string[], 
    newStatus: string,
    options: {
      reason?: string;
      userId?: string;
      userName?: string;
    } = {}
  ): Promise<ServiceResult<{ successful: string[]; failed: Array<{ id: string; error: string }> }>> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    this.requestLogger.info('Starting bulk status update', { 
      requestIds: requestIds.length, 
      newStatus 
    });

    for (const requestId of requestIds) {
      try {
        const result = await this.updateStatus(requestId, newStatus, options);
        if (result.success) {
          successful.push(requestId);
        } else {
          failed.push({ 
            id: requestId, 
            error: result.error?.message || 'Unknown error' 
          });
        }
      } catch (error) {
        failed.push({ 
          id: requestId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    this.requestLogger.info('Bulk status update completed', {
      total: requestIds.length,
      successful: successful.length,
      failed: failed.length
    });

    return {
      success: failed.length === 0,
      data: { successful, failed },
      meta: {
        totalCount: requestIds.length,
        executionTime: Date.now(),
        warnings: failed.map(f => `Failed to update ${f.id}: ${f.error}`)
      }
    };
  }

  /**
   * Bulk assignment operation
   */
  async bulkAssign(
    requestIds: string[],
    assignToId: string,
    assignToName: string,
    assignToRole: string,
    options: {
      assignedById?: string;
      assignedByName?: string;
      reason?: string;
    } = {}
  ): Promise<ServiceResult<{ successful: string[]; failed: Array<{ id: string; error: string }> }>> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    this.requestLogger.info('Starting bulk assignment', { 
      requestIds: requestIds.length, 
      assignToName 
    });

    for (const requestId of requestIds) {
      try {
        const result = await this.assignRequest(requestId, assignToId, assignToName, assignToRole, options);
        if (result.success) {
          successful.push(requestId);
        } else {
          failed.push({ 
            id: requestId, 
            error: result.error?.message || 'Unknown error' 
          });
        }
      } catch (error) {
        failed.push({ 
          id: requestId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    this.requestLogger.info('Bulk assignment completed', {
      total: requestIds.length,
      successful: successful.length,
      failed: failed.length
    });

    return {
      success: failed.length === 0,
      data: { successful, failed },
      meta: {
        totalCount: requestIds.length,
        executionTime: Date.now(),
        warnings: failed.map(f => `Failed to update ${f.id}: ${f.error}`)
      }
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new RequestRepository instance
 */
export function createRequestRepository(client?: GraphQLClient): RequestRepository {
  const graphqlClient = client || new GraphQLClient({
    defaultAuthMode: 'apiKey',
    enableLogging: true,
    loggerName: 'RequestRepository'
  });

  return new RequestRepository(graphqlClient);
}

// ============================================================================
// Default Export
// ============================================================================

export default RequestRepository;