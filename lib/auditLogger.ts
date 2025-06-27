/**
 * Generic Audit Logging System for DynamoDB Table Changes
 * 
 * Features:
 * - Tracks all CRUD operations across any DynamoDB table
 * - Stores complete before/after snapshots as JSON
 * - Tracks changed fields for efficient diffing
 * - Includes request context and user information
 * - Configurable TTL for automatic cleanup
 * - Type-safe with full TypeScript support
 */

import { generateClient } from 'aws-amplify/api';
import { createAuditLog } from '../mutations';
import { AuditLogAction } from '../API';
import { getAuditUserContext, getFormSubmissionContext } from './userContext';
import logger from './logger';

// Types for audit logging
export interface AuditContext {
  // Required context
  source: string; // 'get_estimate_form', 'admin_panel', 'api_endpoint', etc.
  changeType: string; // 'form_submission', 'admin_update', 'bulk_import', etc.
  
  // Optional request context
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  
  // Optional user context
  userId?: string;
  userEmail?: string;
  userRole?: string; // 'admin', 'agent', 'member', 'public'
  
  // Optional TTL override (default: 30 days)
  ttlDays?: number;
}

export interface AuditEntry {
  tableName: string;
  recordId: string;
  action: AuditLogAction;
  previousData?: any; // null for creates
  newData?: any; // null for deletes
  context: AuditContext;
}

export class AuditLogger {
  private client = generateClient();
  private defaultTTLDays = 30;

  /**
   * Calculate TTL timestamp for automatic cleanup
   */
  private calculateTTL(days: number = this.defaultTTLDays): number {
    return Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60);
  }

  /**
   * Extract changed fields by comparing old and new data
   */
  private getChangedFields(oldData: any, newData: any): string[] {
    if (!oldData) return Object.keys(newData || {}); // All fields for creates
    if (!newData) return Object.keys(oldData || {}); // All fields for deletes
    
    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    for (const key of Array.from(allKeys)) {
      // Skip system fields that always change
      if (['updatedAt', '__typename'].includes(key)) continue;
      
      const oldValue = oldData[key];
      const newValue = newData[key];
      
      // Deep comparison for objects, simple comparison for primitives
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push(key);
      }
    }
    
    return changedFields;
  }

  /**
   * Clean data objects by removing system fields
   */
  private cleanDataForAudit(data: any): any {
    if (!data) return null;
    
    const { __typename, createdAt, updatedAt, ...cleanData } = data;
    return cleanData;
  }

  /**
   * Log a single audit entry
   */
  async logAudit(entry: AuditEntry): Promise<void> {
    try {
      const cleanPreviousData = this.cleanDataForAudit(entry.previousData);
      const cleanNewData = this.cleanDataForAudit(entry.newData);
      const changedFields = this.getChangedFields(cleanPreviousData, cleanNewData);
      
      const auditLogInput = {
        tableName: entry.tableName,
        recordId: entry.recordId,
        action: entry.action,
        changeType: entry.context.changeType,
        
        // Data snapshots
        previousData: cleanPreviousData ? JSON.stringify(cleanPreviousData) : null,
        newData: cleanNewData ? JSON.stringify(cleanNewData) : null,
        changedFields: JSON.stringify(changedFields),
        
        // Context
        source: entry.context.source,
        userAgent: entry.context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'server'),
        ipAddress: entry.context.ipAddress || 'unknown',
        sessionId: entry.context.sessionId || 'unknown',
        
        // User context
        userId: entry.context.userId || 'system',
        userEmail: entry.context.userEmail || null,
        userRole: entry.context.userRole || 'public',
        
        // Timestamps
        timestamp: new Date().toISOString(),
        // createdAt is automatically managed by Amplify
        owner: entry.context.userId || 'system',
        
        // TTL for automatic cleanup
        ttl: this.calculateTTL(entry.context.ttlDays)
      };

      await this.client.graphql({
        query: createAuditLog,
        variables: { input: auditLogInput }
      });

      logger.info(`✅ Audit log created for ${entry.tableName} ${entry.action}`, {
        tableName: entry.tableName,
        recordId: entry.recordId,
        action: entry.action,
        changedFieldsCount: changedFields.length,
        source: entry.context.source
      });
      
    } catch (error) {
      logger.error('Failed to create audit log', { 
        error: error instanceof Error ? error.message : String(error),
        tableName: entry.tableName,
        recordId: entry.recordId,
        action: entry.action,
        source: entry.context.source
      });
      // Don't throw - audit log failure shouldn't break the main flow
    }
  }

  /**
   * Log multiple audit entries in sequence
   */
  async logBulkAudits(entries: AuditEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.logAudit(entry);
    }
  }

  /**
   * Log audit with automatic user context detection
   * Preferred method for capturing authenticated user information
   */
  async logAuditWithUserContext(
    tableName: string,
    recordId: string,
    action: AuditLogAction,
    source: string,
    changeType: string,
    previousData?: any,
    newData?: any,
    ttlDays?: number
  ): Promise<void> {
    try {
      const userContext = await getAuditUserContext(source, changeType);
      
      const context: AuditContext = {
        source,
        changeType,
        userAgent: userContext.userAgent,
        ipAddress: userContext.ipAddress,
        sessionId: userContext.sessionId,
        userId: userContext.userId || undefined,
        userEmail: userContext.userEmail || undefined,
        userRole: userContext.userRole,
        ttlDays
      };

      await this.logAudit({
        tableName,
        recordId,
        action,
        previousData,
        newData,
        context
      });
    } catch (error) {
      logger.error('Failed to log audit with user context', {
        error: error instanceof Error ? error.message : String(error),
        tableName,
        recordId,
        action,
        source
      });
    }
  }

  /**
   * Convenience method for logging record creation
   */
  async logCreate(
    tableName: string, 
    recordId: string, 
    newData: any, 
    context: AuditContext
  ): Promise<void> {
    await this.logAudit({
      tableName,
      recordId,
      action: AuditLogAction.created,
      newData,
      context
    });
  }

  /**
   * Convenience method for logging record updates
   */
  async logUpdate(
    tableName: string, 
    recordId: string, 
    previousData: any, 
    newData: any, 
    context: AuditContext
  ): Promise<void> {
    await this.logAudit({
      tableName,
      recordId,
      action: AuditLogAction.updated,
      previousData,
      newData,
      context
    });
  }

  /**
   * Convenience method for logging record deletion
   */
  async logDelete(
    tableName: string, 
    recordId: string, 
    previousData: any, 
    context: AuditContext
  ): Promise<void> {
    await this.logAudit({
      tableName,
      recordId,
      action: AuditLogAction.deleted,
      previousData,
      context
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Export utility functions for common patterns
export const createAuditContext = (
  source: string,
  changeType: string,
  options: Partial<AuditContext> = {}
): AuditContext => ({
  source,
  changeType,
  ...options
});

// Enhanced convenience methods with automatic user context
export const auditWithUser = {
  /**
   * Log create operation with automatic user detection
   */
  async logCreate(
    tableName: string,
    recordId: string,
    newData: any,
    source: string,
    changeType: string = 'record_creation'
  ): Promise<void> {
    await auditLogger.logAuditWithUserContext(
      tableName,
      recordId,
      AuditLogAction.created,
      source,
      changeType,
      undefined,
      newData
    );
  },

  /**
   * Log update operation with automatic user detection
   */
  async logUpdate(
    tableName: string,
    recordId: string,
    previousData: any,
    newData: any,
    source: string,
    changeType: string = 'record_update'
  ): Promise<void> {
    await auditLogger.logAuditWithUserContext(
      tableName,
      recordId,
      AuditLogAction.updated,
      source,
      changeType,
      previousData,
      newData
    );
  },

  /**
   * Log delete operation with automatic user detection
   */
  async logDelete(
    tableName: string,
    recordId: string,
    previousData: any,
    source: string,
    changeType: string = 'record_deletion'
  ): Promise<void> {
    await auditLogger.logAuditWithUserContext(
      tableName,
      recordId,
      AuditLogAction.deleted,
      source,
      changeType,
      previousData,
      undefined
    );
  },

  /**
   * Log form submission with enhanced context
   */
  async logFormSubmission(
    tableName: string,
    recordId: string,
    formData: any,
    formType: string,
    action: AuditLogAction = AuditLogAction.created
  ): Promise<void> {
    const context = await getFormSubmissionContext(formType);
    
    const auditContext: AuditContext = {
      source: `${formType}_form`,
      changeType: 'form_submission',
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      sessionId: context.sessionId,
      userId: context.userId || undefined,
      userEmail: context.userEmail || undefined,
      userRole: context.userRole
    };

    await auditLogger.logAudit({
      tableName,
      recordId,
      action,
      newData: formData,
      context: auditContext
    });
  }
};

// Legacy: Common audit contexts for form submissions (maintained for backward compatibility)
export const FORM_AUDIT_CONTEXTS = {
  GET_ESTIMATE: (userEmail?: string) => createAuditContext(
    'get_estimate_form',
    'form_submission',
    { userEmail, userRole: 'public' }
  ),
  
  ADMIN_UPDATE: (userId: string, userEmail: string) => createAuditContext(
    'admin_panel',
    'admin_update',
    { userId, userEmail, userRole: 'admin' }
  ),
  
  API_BULK_IMPORT: (userId: string) => createAuditContext(
    'api_endpoint',
    'bulk_import',
    { userId, userRole: 'admin', ttlDays: 90 } // Keep bulk imports longer
  )
};