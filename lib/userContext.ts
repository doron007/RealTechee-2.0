/**
 * User Context Detection for Audit Logging
 * 
 * Captures authenticated user information for proper audit trail attribution.
 * Handles both authenticated and anonymous users gracefully.
 */

import { getCurrentUser } from 'aws-amplify/auth';
import logger from './logger';

export interface UserContext {
  userId: string | null;
  userEmail: string | null;
  userRole: string;
  isAuthenticated: boolean;
  groups: string[];
}

export interface RequestContext {
  userAgent: string;
  ipAddress: string;
  sessionId: string;
  timestamp: string;
}

/**
 * Get current authenticated user context
 * Returns null values for anonymous users
 */
export async function getCurrentUserContext(): Promise<UserContext> {
  try {
    const user = await getCurrentUser();
    
    // Extract user groups from Cognito attributes
    const groups = user.signInDetails?.loginId ? ['authenticated'] : [];
    
    // Determine user role based on groups or other attributes
    let userRole = 'authenticated';
    if (groups.includes('admin')) userRole = 'admin';
    else if (groups.includes('agent')) userRole = 'agent';
    else if (groups.includes('member')) userRole = 'member';
    
    const userContext: UserContext = {
      userId: user.userId,
      userEmail: user.signInDetails?.loginId || null,
      userRole,
      isAuthenticated: true,
      groups
    };
    
    logger.info('User context captured for audit', {
      userId: userContext.userId,
      userEmail: userContext.userEmail,
      userRole: userContext.userRole,
      hasGroups: groups.length > 0
    });
    
    return userContext;
    
  } catch (error) {
    // User is not authenticated or error occurred
    logger.info('Anonymous user context for audit', {
      error: error instanceof Error ? error.message : 'Unknown auth error'
    });
    
    return {
      userId: null,
      userEmail: null,
      userRole: 'anonymous',
      isAuthenticated: false,
      groups: []
    };
  }
}

/**
 * Get request context for audit logging
 * Captures browser/request metadata
 */
export function getRequestContext(): RequestContext {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    ipAddress: 'unknown', // Would need server-side integration for real IP
    sessionId: typeof window !== 'undefined' ? 
      (window.sessionStorage?.getItem('sessionId') || generateSessionId()) : 
      'server-session',
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate a simple session ID for tracking
 */
function generateSessionId(): string {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

/**
 * Get complete audit context combining user and request info
 */
export async function getAuditUserContext(source: string, changeType: string): Promise<{
  userId: string;
  userEmail: string | null;
  userRole: string;
  userAgent: string;
  ipAddress: string;
  sessionId: string;
  source: string;
  changeType: string;
  isAuthenticated: boolean;
}> {
  const userContext = await getCurrentUserContext();
  const requestContext = getRequestContext();
  
  return {
    userId: userContext.userId || 'anonymous',
    userEmail: userContext.userEmail,
    userRole: userContext.userRole,
    userAgent: requestContext.userAgent,
    ipAddress: requestContext.ipAddress,
    sessionId: requestContext.sessionId,
    source,
    changeType,
    isAuthenticated: userContext.isAuthenticated
  };
}

/**
 * Determine owner field value for database records
 * Returns user ID for authenticated users, 'anonymous' for public users
 */
export async function getRecordOwner(): Promise<string> {
  const userContext = await getCurrentUserContext();
  return userContext.userId || 'anonymous';
}

/**
 * Enhanced context for form submissions with user detection
 */
export async function getFormSubmissionContext(
  formType: string,
  targetEmail?: string
): Promise<{
  userId: string;
  userEmail: string | null;
  userRole: string;
  userAgent: string;
  ipAddress: string;
  sessionId: string;
  source: string;
  changeType: string;
  targetEmail?: string;
  authStatus: 'authenticated' | 'anonymous';
}> {
  const auditContext = await getAuditUserContext(`${formType}_form`, 'form_submission');
  
  return {
    ...auditContext,
    targetEmail,
    authStatus: auditContext.isAuthenticated ? 'authenticated' : 'anonymous'
  };
}