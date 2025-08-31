/**
 * TypeScript definitions for Case Management System
 * 
 * Defines all types used throughout the case management workflow
 * from initial submission through quote-ready status.
 */

// =============================================================================
// CORE CASE MANAGEMENT TYPES
// =============================================================================

export interface CaseNote {
  id?: string;
  requestId: string;
  content: string;
  type: 'internal' | 'client_communication' | 'technical' | 'follow_up';
  category?: string;
  isPrivate: boolean;
  authorId: string;
  authorName: string;
  authorRole: string;
  attachments?: string[];
  relatedToStatusChange?: boolean;
  priority?: 'normal' | 'important' | 'urgent';
  tags?: string[];
  
  // Client communication tracking
  communicationMethod?: 'phone' | 'email' | 'text' | 'in_person' | 'other';
  clientResponse?: 'pending' | 'responded' | 'no_response';
  followUpRequired?: boolean;
  followUpDate?: string;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface CaseAssignment {
  id?: string;
  requestId: string;
  assignedToId: string;
  assignedToName: string;
  assignedToRole: string;
  assignmentType: 'primary' | 'secondary' | 'observer';
  assignedById: string;
  assignedByName: string;
  assignmentReason?: string;
  status: 'active' | 'completed' | 'transferred' | 'cancelled';
  priority?: 'normal' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;
  transferredAt?: string;
  transferredToId?: string;
  transferredToName?: string;
  transferReason?: string;
  
  // Workload tracking
  estimatedHours?: number;
  actualHours?: number;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusHistoryEntry {
  id?: string;
  requestId: string;
  previousStatus?: string;
  newStatus: string;
  statusReason?: string;
  triggeredBy: 'user' | 'system' | 'automation';
  triggeredById?: string;
  triggeredByName?: string;
  automationRule?: string;
  
  // Business context
  businessImpact?: 'none' | 'low' | 'medium' | 'high';
  clientNotified?: boolean;
  internalNotification?: boolean;
  
  // Duration tracking
  timeInPreviousStatus?: number; // Minutes
  expectedDuration?: number; // Minutes
  
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface InformationItem {
  id?: string;
  requestId: string;
  category: 'property' | 'client' | 'project' | 'financial' | 'technical';
  itemName: string;
  description?: string;
  status: 'missing' | 'requested' | 'received' | 'verified';
  importance: 'required' | 'important' | 'optional';
  requestedDate?: string;
  receivedDate?: string;
  verifiedDate?: string;
  requestedBy?: string;
  source?: 'client' | 'agent' | 'inspection' | 'documents';
  
  // Content
  value?: string;
  attachments?: string[];
  notes?: string;
  
  // Follow-up
  followUpRequired?: boolean;
  followUpDate?: string;
  remindersSent?: number;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface ScopeItem {
  id?: string;
  requestId: string;
  category: 'room' | 'area' | 'system' | 'material' | 'service';
  name: string;
  description?: string;
  
  // Hierarchy
  parentItemId?: string;
  orderIndex?: number;
  isCategory?: boolean;
  
  // Scope definition
  specifications?: Record<string, any>;
  materials?: Record<string, any>;
  laborRequirements?: Record<string, any>;
  timeline?: string;
  
  // Estimates
  estimatedCost?: number;
  estimatedHours?: number;
  complexity?: 'simple' | 'moderate' | 'complex' | 'very_complex';
  
  // Status
  status: 'draft' | 'defined' | 'approved' | 'quoted';
  approvedBy?: string;
  approvedDate?: string;
  
  // Client interaction
  clientApproval?: 'pending' | 'approved' | 'rejected' | 'modified';
  clientNotes?: string;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Hierarchical structure
  childItems?: ScopeItem[];
}

export interface WorkflowState {
  id?: string;
  requestId: string;
  workflowName: string;
  currentState: string;
  availableActions: string[];
  stateData: Record<string, any>;
  
  // Progress tracking
  progress: number; // 0-100%
  totalSteps: number;
  completedSteps: number;
  
  // Timing
  startedAt: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  
  // Automation
  automationEnabled: boolean;
  nextAutomationCheck?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// ENHANCED REQUEST TYPES
// =============================================================================

export interface EnhancedRequest {
  // Base request properties
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
  officeNotes?: string;
  
  // Enhanced case management fields
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  tags: string[];
  estimatedValue?: number;
  followUpDate?: string;
  lastContactDate?: string;
  clientResponseDate?: string;
  informationGatheringStatus: 'pending' | 'in_progress' | 'completed';
  scopeDefinitionStatus: 'not_started' | 'in_progress' | 'completed';
  readinessScore: number;
  missingInformation: string[];
  
  // Contact and property data
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Related data
  notes?: CaseNote[];
  assignments?: CaseAssignment[];
  statusHistory?: StatusHistoryEntry[];
  informationItems?: InformationItem[];
  scopeItems?: ScopeItem[];
  workflowState?: WorkflowState;
}

// =============================================================================
// WORKFLOW TYPES
// =============================================================================

export interface WorkflowValidation {
  isValid: boolean;
  message?: string;
  requiredActions?: string[];
  warnings?: string[];
}

export interface StatusTransition {
  from: string;
  to: string;
  validation: WorkflowValidation;
  automaticActions?: string[];
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: 'status_change' | 'time_based' | 'completion_based' | 'manual';
  conditions: Record<string, any>;
  actions: Array<{
    type: 'status_change' | 'assignment' | 'notification' | 'create_task' | 'send_email';
    parameters: Record<string, any>;
  }>;
  isActive: boolean;
  priority: number;
}

// =============================================================================
// DASHBOARD AND ANALYTICS TYPES
// =============================================================================

export interface CaseOverview {
  requestId: string;
  currentStatus: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedRole?: string;
  readinessScore: number;
  totalNotes: number;
  pendingInformationItems: number;
  completedScopeItems: number;
  lastActivity?: string;
  nextFollowUp?: string;
  estimatedValue?: number;
  clientName?: string;
  propertyAddress?: string;
  daysSinceCreated: number;
  daysInCurrentStatus: number;
}

export interface CaseMetrics {
  totalCases: number;
  casesByStatus: Record<string, number>;
  casesByPriority: Record<string, number>;
  averageReadinessScore: number;
  overdueFollowUps: number;
  casesReadyForQuote: number;
  averageTimeToQuoteReady: number; // in days
  conversionRate: number; // percentage
}

export interface AssignmentWorkload {
  assigneeId: string;
  assigneeName: string;
  role: string;
  activeCases: number;
  averageReadinessScore: number;
  overdueItems: number;
  estimatedWorkloadHours: number;
  completionRate: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface CaseManagementApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextToken?: string;
}

// =============================================================================
// FORM AND UI TYPES
// =============================================================================

export interface NoteFormData {
  content: string;
  type: CaseNote['type'];
  category?: string;
  isPrivate: boolean;
  communicationMethod?: CaseNote['communicationMethod'];
  followUpRequired?: boolean;
  followUpDate?: string;
  priority?: CaseNote['priority'];
  tags?: string[];
}

export interface AssignmentFormData {
  assignedToId: string;
  assignedToName: string;
  assignedToRole: string;
  assignmentType: CaseAssignment['assignmentType'];
  assignmentReason?: string;
  priority?: CaseAssignment['priority'];
  dueDate?: string;
  estimatedHours?: number;
}

export interface InformationItemFormData {
  category: InformationItem['category'];
  itemName: string;
  description?: string;
  importance: InformationItem['importance'];
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface ScopeItemFormData {
  category: ScopeItem['category'];
  name: string;
  description?: string;
  parentItemId?: string;
  specifications?: Record<string, any>;
  materials?: Record<string, any>;
  estimatedCost?: number;
  estimatedHours?: number;
  complexity?: ScopeItem['complexity'];
}

// =============================================================================
// FILTER AND SEARCH TYPES
// =============================================================================

export interface CaseFilters {
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  dateRange?: {
    start: string;
    end: string;
    field: 'createdAt' | 'updatedAt' | 'followUpDate';
  };
  readinessScore?: {
    min: number;
    max: number;
  };
  hasOverdueItems?: boolean;
  tags?: string[];
  search?: string;
}

export interface NotesFilters {
  type?: CaseNote['type'][];
  isPrivate?: boolean;
  authorRole?: string[];
  communicationMethod?: CaseNote['communicationMethod'][];
  hasFollowUp?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================
// Note: Types and interfaces in this file are already exported at declaration.
// Avoid re-exporting them in a block to prevent TS2484 conflicts.

// Export constants
export const CASE_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const NOTE_TYPES = ['internal', 'client_communication', 'technical', 'follow_up'] as const;
export const ASSIGNMENT_TYPES = ['primary', 'secondary', 'observer'] as const;
export const INFORMATION_CATEGORIES = ['property', 'client', 'project', 'financial', 'technical'] as const;
export const INFORMATION_STATUSES = ['missing', 'requested', 'received', 'verified'] as const;
export const INFORMATION_IMPORTANCE = ['required', 'important', 'optional'] as const;
export const SCOPE_CATEGORIES = ['room', 'area', 'system', 'material', 'service'] as const;
export const SCOPE_STATUSES = ['draft', 'defined', 'approved', 'quoted'] as const;
export const SCOPE_COMPLEXITY = ['simple', 'moderate', 'complex', 'very_complex'] as const;