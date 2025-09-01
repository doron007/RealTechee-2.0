/**
 * Base service interface for business logic operations
 * Provides standardized business operations and validation patterns
 */

export interface IService<T, TFilter = any, TCreate = any, TUpdate = any> {
  // Core business operations
  create(data: TCreate): Promise<ServiceResult<T>>;
  findById(id: string): Promise<ServiceResult<T>>;
  findAll(options?: ServiceQueryOptions<TFilter>): Promise<ServiceResult<T[]>>;
  update(id: string, data: TUpdate): Promise<ServiceResult<T>>;
  delete(id: string): Promise<ServiceResult<boolean>>;
  
  // Business validation
  validate(data: TCreate | TUpdate): Promise<ValidationResult>;
  
  // Business rules
  canCreate(data: TCreate): Promise<boolean>;
  canUpdate(id: string, data: TUpdate): Promise<boolean>;
  canDelete(id: string): Promise<boolean>;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  metadata?: {
    totalCount?: number;
    nextToken?: string;
    cached?: boolean;
    validationErrors?: ValidationError[];
  };
}

export interface ServiceQueryOptions<TFilter> {
  filter?: TFilter;
  limit?: number;
  offset?: number;
  nextToken?: string;
  orderBy?: ServiceOrderBy[];
  includeRelations?: boolean;
  validateAccess?: boolean;
}

export interface ServiceOrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Enhanced service interface for entities with complex business logic
 */
export interface IBusinessService<T, TFilter = any> extends IService<T, TFilter> {
  // Business workflow operations
  processWorkflow(id: string, action: string, data?: any): Promise<ServiceResult<T>>;
  
  // Business state management
  getBusinessState(id: string): Promise<ServiceResult<BusinessState>>;
  updateBusinessState(id: string, state: Partial<BusinessState>): Promise<ServiceResult<T>>;
  
  // Business rules and permissions
  getBusinessRules(): BusinessRule[];
  checkPermissions(action: string, userId?: string): Promise<boolean>;
}

export interface BusinessState {
  status: string;
  stage: string;
  nextActions: string[];
  blockedActions: string[];
  metadata: Record<string, any>;
}

export interface BusinessRule {
  name: string;
  description: string;
  condition: (data: any) => boolean;
  action: (data: any) => Promise<void>;
}

/**
 * Notification service interface for business events
 */
export interface INotificationService {
  sendBusinessNotification(event: BusinessEvent): Promise<ServiceResult<boolean>>;
  subscribeToEvents(entityType: string, entityId: string, callback: (event: BusinessEvent) => void): void;
  unsubscribeFromEvents(entityType: string, entityId: string): void;
}

export interface BusinessEvent {
  type: string;
  entityType: string;
  entityId: string;
  data: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

/**
 * Audit service interface for business operations tracking
 */
export interface IAuditService {
  logBusinessAction(action: BusinessAction): Promise<ServiceResult<boolean>>;
  getAuditTrail(entityType: string, entityId: string): Promise<ServiceResult<BusinessAction[]>>;
}

export interface BusinessAction {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  timestamp: Date;
  data: Record<string, any>;
  result: 'success' | 'failure' | 'warning';
}