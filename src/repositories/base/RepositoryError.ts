/**
 * Custom error classes for repository operations
 * Provides consistent error handling and user-friendly messages
 */

/**
 * Repository error codes for different failure scenarios
 */
export enum RepositoryErrorCode {
  // Connection and Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  
  // Authentication and Authorization Errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
  FIELD_TOO_LONG = 'FIELD_TOO_LONG',
  FIELD_TOO_SHORT = 'FIELD_TOO_SHORT',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  INVALID_PHONE_FORMAT = 'INVALID_PHONE_FORMAT',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  
  // Data Errors
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  RECORD_ALREADY_EXISTS = 'RECORD_ALREADY_EXISTS',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // Operation Errors
  CREATE_FAILED = 'CREATE_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  LIST_FAILED = 'LIST_FAILED',
  GET_FAILED = 'GET_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
  
  // GraphQL Specific Errors
  GRAPHQL_ERROR = 'GRAPHQL_ERROR',
  INVALID_QUERY = 'INVALID_QUERY',
  QUERY_COMPLEXITY_TOO_HIGH = 'QUERY_COMPLEXITY_TOO_HIGH',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  WORKFLOW_ERROR = 'WORKFLOW_ERROR',
  STATUS_TRANSITION_INVALID = 'STATUS_TRANSITION_INVALID',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Unknown/Generic Error
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Base repository error class
 * Extends Error with additional repository-specific metadata
 */
export class RepositoryError extends Error {
  public readonly code: RepositoryErrorCode;
  public readonly userMessage: string;
  public readonly details?: Record<string, any>;
  public readonly originalError?: Error;
  public readonly timestamp: Date;
  public readonly operation?: string;
  public readonly model?: string;

  constructor(
    code: RepositoryErrorCode,
    message: string,
    userMessage: string,
    details?: Record<string, any>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepositoryError);
    }
  }

  /**
   * Set operation context for better error tracking
   */
  setOperationContext(operation: string, model: string): this {
    (this as any).operation = operation;
    (this as any).model = model;
    return this;
  }

  /**
   * Convert to JSON for logging/API responses
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      details: this.details,
      operation: this.operation,
      model: this.model,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }

  /**
   * Check if error is retryable based on error code
   */
  isRetryable(): boolean {
    const retryableCodes = [
      RepositoryErrorCode.NETWORK_ERROR,
      RepositoryErrorCode.TIMEOUT_ERROR,
      RepositoryErrorCode.CONNECTION_FAILED,
      RepositoryErrorCode.SERVICE_UNAVAILABLE,
      RepositoryErrorCode.RESOURCE_EXHAUSTED,
      RepositoryErrorCode.RATE_LIMIT_EXCEEDED
    ];
    return retryableCodes.includes(this.code);
  }

  /**
   * Check if error should be exposed to end users
   */
  isPublicError(): boolean {
    const publicCodes = [
      RepositoryErrorCode.VALIDATION_FAILED,
      RepositoryErrorCode.REQUIRED_FIELD_MISSING,
      RepositoryErrorCode.INVALID_FIELD_VALUE,
      RepositoryErrorCode.RECORD_NOT_FOUND,
      RepositoryErrorCode.RECORD_ALREADY_EXISTS,
      RepositoryErrorCode.AUTHORIZATION_DENIED,
      RepositoryErrorCode.BUSINESS_RULE_VIOLATION
    ];
    return publicCodes.includes(this.code);
  }
}

/**
 * Validation-specific error class
 */
export class ValidationError extends RepositoryError {
  public readonly fieldErrors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;

  constructor(
    message: string,
    fieldErrors: Array<{ field: string; message: string; value?: any }>,
    details?: Record<string, any>
  ) {
    const userMessage = fieldErrors.length === 1 
      ? `Invalid ${fieldErrors[0].field}: ${fieldErrors[0].message}`
      : `Validation failed for ${fieldErrors.length} fields`;

    super(
      RepositoryErrorCode.VALIDATION_FAILED,
      message,
      userMessage,
      { ...details, fieldErrors }
    );

    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }

  /**
   * Get error messages for specific field
   */
  getFieldErrors(fieldName: string): string[] {
    return this.fieldErrors
      .filter(error => error.field === fieldName)
      .map(error => error.message);
  }

  /**
   * Check if a specific field has errors
   */
  hasFieldError(fieldName: string): boolean {
    return this.fieldErrors.some(error => error.field === fieldName);
  }
}

/**
 * Authentication-specific error class
 */
export class AuthenticationError extends RepositoryError {
  constructor(message: string, details?: Record<string, any>, originalError?: Error) {
    super(
      RepositoryErrorCode.AUTHENTICATION_FAILED,
      message,
      'Authentication failed. Please log in and try again.',
      details,
      originalError
    );
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization-specific error class
 */
export class AuthorizationError extends RepositoryError {
  constructor(message: string, requiredRole?: string, details?: Record<string, any>) {
    const userMessage = requiredRole 
      ? `Access denied. Required role: ${requiredRole}`
      : 'You do not have permission to perform this action.';

    super(
      RepositoryErrorCode.AUTHORIZATION_DENIED,
      message,
      userMessage,
      { ...details, requiredRole }
    );
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends RepositoryError {
  constructor(model: string, identifier: string, details?: Record<string, any>) {
    const message = `${model} not found with identifier: ${identifier}`;
    const userMessage = `The requested ${model.toLowerCase()} could not be found.`;

    super(
      RepositoryErrorCode.RECORD_NOT_FOUND,
      message,
      userMessage,
      { ...details, model, identifier }
    );
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class (for duplicates, etc.)
 */
export class ConflictError extends RepositoryError {
  constructor(message: string, conflictType: string, details?: Record<string, any>) {
    const userMessage = `Conflict detected: ${conflictType}. Please check your data and try again.`;

    super(
      RepositoryErrorCode.RECORD_ALREADY_EXISTS,
      message,
      userMessage,
      { ...details, conflictType }
    );
    this.name = 'ConflictError';
  }
}

/**
 * Network/connectivity error class
 */
export class NetworkError extends RepositoryError {
  constructor(message: string, details?: Record<string, any>, originalError?: Error) {
    super(
      RepositoryErrorCode.NETWORK_ERROR,
      message,
      'Network connection failed. Please check your connection and try again.',
      details,
      originalError
    );
    this.name = 'NetworkError';
  }
}

/**
 * GraphQL-specific error class
 */
export class GraphQLError extends RepositoryError {
  public readonly graphqlErrors: Array<{
    message: string;
    path?: Array<string | number>;
    locations?: Array<{ line: number; column: number }>;
    extensions?: Record<string, any>;
  }>;

  constructor(
    graphqlErrors: Array<any>,
    details?: Record<string, any>
  ) {
    const primaryError = graphqlErrors[0];
    const message = `GraphQL Error: ${primaryError.message}`;
    const userMessage = 'A data processing error occurred. Please try again.';

    super(
      RepositoryErrorCode.GRAPHQL_ERROR,
      message,
      userMessage,
      { ...details, graphqlErrors }
    );

    this.name = 'GraphQLError';
    this.graphqlErrors = graphqlErrors;
  }

  /**
   * Check if any GraphQL errors are validation-related
   */
  hasValidationErrors(): boolean {
    return this.graphqlErrors.some(error => 
      error.extensions?.code === 'VALIDATION_ERROR' ||
      error.message.toLowerCase().includes('validation')
    );
  }

  /**
   * Extract field validation errors from GraphQL errors
   */
  extractFieldErrors(): Array<{ field: string; message: string }> {
    const fieldErrors: Array<{ field: string; message: string }> = [];

    this.graphqlErrors.forEach(error => {
      if (error.path && error.path.length > 0) {
        const field = error.path[error.path.length - 1];
        if (typeof field === 'string') {
          fieldErrors.push({
            field,
            message: error.message
          });
        }
      }
    });

    return fieldErrors;
  }
}

/**
 * Utility function to create appropriate error from unknown error
 */
export function createRepositoryError(
  error: any,
  operation?: string,
  model?: string
): RepositoryError {
  // Already a RepositoryError
  if (error instanceof RepositoryError) {
    return error.setOperationContext(operation || '', model || '');
  }

  // GraphQL errors
  if (error?.errors && Array.isArray(error.errors)) {
    return new GraphQLError(error.errors).setOperationContext(operation || '', model || '');
  }

  // Network/timeout errors
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
    return new NetworkError(
      error.message || 'Network error occurred',
      { originalCode: error.code },
      error
    ).setOperationContext(operation || '', model || '');
  }

  // Generic error
  const repositoryError = new RepositoryError(
    RepositoryErrorCode.UNKNOWN_ERROR,
    error?.message || 'Unknown error occurred',
    'An unexpected error occurred. Please try again.',
    { originalError: error },
    error
  );

  return repositoryError.setOperationContext(operation || '', model || '');
}

/**
 * User-friendly error message mappings
 */
export const ERROR_MESSAGES: Record<RepositoryErrorCode, string> = {
  [RepositoryErrorCode.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [RepositoryErrorCode.TIMEOUT_ERROR]: 'The request took too long. Please try again.',
  [RepositoryErrorCode.CONNECTION_FAILED]: 'Failed to connect to the server. Please try again later.',
  
  [RepositoryErrorCode.AUTHENTICATION_FAILED]: 'Please log in to continue.',
  [RepositoryErrorCode.AUTHORIZATION_DENIED]: 'You do not have permission to perform this action.',
  [RepositoryErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [RepositoryErrorCode.INVALID_CREDENTIALS]: 'Invalid login credentials.',
  
  [RepositoryErrorCode.VALIDATION_FAILED]: 'Please check your input and try again.',
  [RepositoryErrorCode.REQUIRED_FIELD_MISSING]: 'Required information is missing.',
  [RepositoryErrorCode.INVALID_FIELD_VALUE]: 'Invalid information provided.',
  [RepositoryErrorCode.FIELD_TOO_LONG]: 'Input is too long.',
  [RepositoryErrorCode.FIELD_TOO_SHORT]: 'Input is too short.',
  [RepositoryErrorCode.INVALID_EMAIL_FORMAT]: 'Please enter a valid email address.',
  [RepositoryErrorCode.INVALID_PHONE_FORMAT]: 'Please enter a valid phone number.',
  [RepositoryErrorCode.INVALID_DATE_FORMAT]: 'Please enter a valid date.',
  
  [RepositoryErrorCode.RECORD_NOT_FOUND]: 'The requested item could not be found.',
  [RepositoryErrorCode.RECORD_ALREADY_EXISTS]: 'This item already exists.',
  [RepositoryErrorCode.DUPLICATE_KEY]: 'This information is already in use.',
  [RepositoryErrorCode.FOREIGN_KEY_VIOLATION]: 'Cannot complete operation due to related data.',
  [RepositoryErrorCode.CONSTRAINT_VIOLATION]: 'Data constraint violation occurred.',
  
  [RepositoryErrorCode.CREATE_FAILED]: 'Failed to create the item.',
  [RepositoryErrorCode.UPDATE_FAILED]: 'Failed to update the item.',
  [RepositoryErrorCode.DELETE_FAILED]: 'Failed to delete the item.',
  [RepositoryErrorCode.LIST_FAILED]: 'Failed to load the list.',
  [RepositoryErrorCode.GET_FAILED]: 'Failed to load the item.',
  [RepositoryErrorCode.QUERY_FAILED]: 'Query execution failed.',
  
  [RepositoryErrorCode.GRAPHQL_ERROR]: 'A data processing error occurred.',
  [RepositoryErrorCode.INVALID_QUERY]: 'Invalid data query.',
  [RepositoryErrorCode.QUERY_COMPLEXITY_TOO_HIGH]: 'Query is too complex.',
  [RepositoryErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait and try again.',
  
  [RepositoryErrorCode.BUSINESS_RULE_VIOLATION]: 'Business rule violation occurred.',
  [RepositoryErrorCode.WORKFLOW_ERROR]: 'Workflow error occurred.',
  [RepositoryErrorCode.STATUS_TRANSITION_INVALID]: 'Invalid status change.',
  
  [RepositoryErrorCode.INTERNAL_ERROR]: 'An internal error occurred.',
  [RepositoryErrorCode.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable.',
  [RepositoryErrorCode.RESOURCE_EXHAUSTED]: 'System resources are exhausted.',
  [RepositoryErrorCode.CONFIGURATION_ERROR]: 'System configuration error.',
  
  [RepositoryErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred.'
};