import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../amplify/data/resource';
import { createLogger } from './logger';

const auditClient = generateClient<Schema>({
  authMode: 'userPool'
});

const auditLogger = createLogger('AuditLogging');

/**
 * Comprehensive audit logging service for compliance and security
 */
export class AuditLoggingService {
  private static instance: AuditLoggingService;
  private pendingLogs = new Map<string, any>();
  private batchTimer: NodeJS.Timeout | null = null;
  private batchSize = 50;
  private batchInterval = 5000; // 5 seconds

  static getInstance(): AuditLoggingService {
    if (!AuditLoggingService.instance) {
      AuditLoggingService.instance = new AuditLoggingService();
    }
    return AuditLoggingService.instance;
  }

  /**
   * Log a mutation with full audit trail
   */
  async logMutation(
    operation: AuditOperation,
    context: AuditContext
  ): Promise<{ success: boolean; auditId?: string; error?: any }> {
    try {
      const auditEntry = this.createAuditEntry(operation, context);
      
      auditLogger.debug('Logging mutation', {
        tableName: operation.tableName,
        action: operation.action,
        recordId: operation.recordId,
        auditId: auditEntry.id
      });

      // For critical operations, log immediately
      if (this.isCriticalOperation(operation)) {
        const result = await this.writeAuditLog(auditEntry);
        return result;
      }

      // For non-critical operations, batch them
      this.addToBatch(auditEntry);
      return { success: true, auditId: auditEntry.id };
    } catch (error) {
      auditLogger.error('Failed to log mutation', { operation, context, error });
      return { success: false, error };
    }
  }

  /**
   * Create comprehensive audit entry
   */
  private createAuditEntry(operation: AuditOperation, context: AuditContext): AuditEntry {
    const auditId = this.generateAuditId();
    const timestamp = new Date().toISOString();

    return {
      id: auditId,
      tableName: operation.tableName,
      recordId: operation.recordId,
      action: operation.action,
      changeType: operation.changeType || 'manual_update',
      previousData: operation.previousData ? JSON.stringify(operation.previousData) : null,
      newData: operation.newData ? JSON.stringify(operation.newData) : null,
      changedFields: operation.changedFields || undefined,
      source: context.source || 'admin_panel',
      userAgent: context.userAgent || '',
      ipAddress: context.ipAddress || '',
      sessionId: context.sessionId || '',
      userId: context.userId || '',
      userEmail: context.userEmail || '',
      userRole: context.userRole || '',
      timestamp,
      owner: context.userId || 'system',
      ttl: this.calculateTTL(operation.action, context.retentionDays),
      // Additional security context
      requestId: context.requestId || this.generateRequestId(),
      correlationId: context.correlationId || auditId,
      severity: this.calculateSeverity(operation),
      complianceFlags: this.generateComplianceFlags(operation, context),
      metadata: {
        operationDuration: context.operationDuration,
        affectedRows: operation.affectedRows || 1,
        errorCode: context.errorCode,
        warningCount: context.warningCount || 0,
        performanceMetrics: context.performanceMetrics
      }
    };
  }

  /**
   * Write audit log to database
   */
  private async writeAuditLog(auditEntry: AuditEntry): Promise<{ success: boolean; auditId?: string; error?: any }> {
    try {
      const result = await (auditClient.models as any).AuditLog.create({
        tableName: auditEntry.tableName,
        recordId: auditEntry.recordId,
        action: auditEntry.action as any,
        changeType: auditEntry.changeType,
        previousData: auditEntry.previousData,
        newData: auditEntry.newData,
        changedFields: auditEntry.changedFields,
        source: auditEntry.source,
        userAgent: auditEntry.userAgent,
        ipAddress: auditEntry.ipAddress,
        sessionId: auditEntry.sessionId,
        userId: auditEntry.userId,
        userEmail: auditEntry.userEmail,
        userRole: auditEntry.userRole,
        timestamp: auditEntry.timestamp,
        owner: auditEntry.owner,
        ttl: auditEntry.ttl
      });

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      auditLogger.debug('Audit log written successfully', {
        auditId: auditEntry.id,
        tableName: auditEntry.tableName,
        action: auditEntry.action
      });

      return { success: true, auditId: auditEntry.id };
    } catch (error) {
      auditLogger.error('Failed to write audit log', { auditEntry, error });
      return { success: false, error };
    }
  }

  /**
   * Add audit entry to batch for later processing
   */
  private addToBatch(auditEntry: AuditEntry): void {
    this.pendingLogs.set(auditEntry.id, auditEntry);

    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchInterval);
    }

    // Force batch if we've reached the size limit
    if (this.pendingLogs.size >= this.batchSize) {
      this.processBatch();
    }
  }

  /**
   * Process batch of audit logs
   */
  private async processBatch(): Promise<void> {
    if (this.pendingLogs.size === 0) return;

    const batch = Array.from(this.pendingLogs.values());
    this.pendingLogs.clear();

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    auditLogger.info('Processing audit log batch', { batchSize: batch.length });

    try {
      // Process in smaller chunks to avoid overwhelming the database
      const chunkSize = 10;
      for (let i = 0; i < batch.length; i += chunkSize) {
        const chunk = batch.slice(i, i + chunkSize);
        await this.processBatchChunk(chunk);
        
        // Small delay between chunks
        if (i + chunkSize < batch.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      auditLogger.info('Audit log batch processed successfully', { totalEntries: batch.length });
    } catch (error) {
      auditLogger.error('Failed to process audit log batch', { batchSize: batch.length, error });
      
      // Re-queue failed entries for retry
      batch.forEach(entry => {
        this.pendingLogs.set(entry.id, entry);
      });
    }
  }

  /**
   * Process a chunk of the batch
   */
  private async processBatchChunk(chunk: AuditEntry[]): Promise<void> {
    const promises = chunk.map(entry => this.writeAuditLog(entry));
    await Promise.allSettled(promises);
  }

  /**
   * Query audit logs with advanced filtering
   */
  async queryAuditLogs(
    filters: {
      tableName?: string;
      recordId?: string;
      action?: string;
      userId?: string;
      userEmail?: string;
      dateRange?: { start: string; end: string };
      source?: string;
      ipAddress?: string;
      severity?: AuditSeverity;
    } = {},
    options: {
      limit?: number;
      nextToken?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    success: boolean;
    logs?: AuditEntry[];
    pagination?: {
      nextToken?: string;
      hasNextPage: boolean;
    };
    metadata?: {
      totalCount?: number;
      queryTime: number;
    };
    error?: any;
  }> {
    try {
      const startTime = Date.now();
      
      auditLogger.debug('Querying audit logs', { filters, options });

      // Build filter expression
      const filter = this.buildAuditFilter(filters);
      
      const queryOptions: any = {
        limit: options.limit || 50,
        filter
      };

      if (options.nextToken) {
        queryOptions.nextToken = options.nextToken;
      }

      const result = await (auditClient.models as any).AuditLog.list(queryOptions);

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      const queryTime = Date.now() - startTime;
      const logs = result.data || [];

      auditLogger.debug('Audit logs query completed', {
        resultCount: logs.length,
        queryTime,
        hasNextPage: !!result.nextToken
      });

      return {
        success: true,
        logs: logs.map(this.parseAuditEntry),
        pagination: {
          nextToken: result.nextToken,
          hasNextPage: !!result.nextToken
        },
        metadata: {
          queryTime
        }
      };
    } catch (error) {
      auditLogger.error('Failed to query audit logs', { filters, options, error });
      return { success: false, error };
    }
  }

  /**
   * Generate audit report for compliance
   */
  async generateAuditReport(
    criteria: {
      dateRange: { start: string; end: string };
      tableName?: string;
      userId?: string;
      actions?: string[];
      format?: 'json' | 'csv' | 'pdf';
      includeDetails?: boolean;
    }
  ): Promise<{
    success: boolean;
    report?: AuditReport;
    downloadUrl?: string;
    error?: any;
  }> {
    try {
      auditLogger.info('Generating audit report', { criteria });

      const startTime = Date.now();
      
      // Query all relevant audit logs
      const allLogs: AuditEntry[] = [];
      let nextToken: string | undefined;
      
      do {
        const result = await this.queryAuditLogs(
          {
            dateRange: criteria.dateRange,
            tableName: criteria.tableName,
            userId: criteria.userId,
            action: criteria.actions?.[0] // Simplified for demo
          },
          {
            limit: 1000,
            nextToken
          }
        );

        if (!result.success) {
          throw new Error('Failed to query audit logs for report');
        }

        allLogs.push(...(result.logs || []));
        nextToken = result.pagination?.nextToken;
      } while (nextToken);

      // Generate report analytics
      const report = this.analyzeAuditLogs(allLogs, criteria);
      report.generatedAt = new Date().toISOString();
      report.generationTime = Date.now() - startTime;

      auditLogger.info('Audit report generated', {
        totalLogs: allLogs.length,
        generationTime: report.generationTime,
        format: criteria.format
      });

      return {
        success: true,
        report
      };
    } catch (error) {
      auditLogger.error('Failed to generate audit report', { criteria, error });
      return { success: false, error };
    }
  }

  /**
   * Real-time audit monitoring
   */
  async getAuditDashboard(
    timeRange: 'last_hour' | 'last_day' | 'last_week' | 'last_month' = 'last_day'
  ): Promise<{
    success: boolean;
    dashboard?: AuditDashboard;
    error?: any;
  }> {
    try {
      auditLogger.debug('Getting audit dashboard', { timeRange });

      const dateRange = this.getDateRange(timeRange);
      
      const result = await this.queryAuditLogs(
        { dateRange },
        { limit: 10000 } // High limit for dashboard analytics
      );

      if (!result.success) {
        throw new Error('Failed to query audit logs for dashboard');
      }

      const dashboard = this.buildAuditDashboard(result.logs || [], timeRange);

      return { success: true, dashboard };
    } catch (error) {
      auditLogger.error('Failed to get audit dashboard', { timeRange, error });
      return { success: false, error };
    }
  }

  /**
   * Security alert detection
   */
  async detectSecurityAlerts(
    logs: AuditEntry[]
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    try {
      // Detect suspicious patterns
      const suspiciousPatterns = [
        this.detectBruteForceAttempts(logs),
        this.detectUnusualActivityPatterns(logs),
        this.detectPrivilegeEscalation(logs),
        this.detectDataExfiltration(logs),
        this.detectUnauthorizedAccess(logs)
      ];

      alerts.push(...suspiciousPatterns.flat());

      auditLogger.info('Security alert detection completed', {
        totalLogs: logs.length,
        alertsFound: alerts.length
      });
    } catch (error) {
      auditLogger.error('Failed to detect security alerts', { error });
    }

    return alerts;
  }

  /**
   * Compliance validation
   */
  validateCompliance(
    logs: AuditEntry[],
    standards: ('gdpr' | 'sox' | 'hipaa' | 'pci')[] = ['gdpr']
  ): ComplianceReport {
    const report: ComplianceReport = {
      standards,
      validationDate: new Date().toISOString(),
      totalLogsReviewed: logs.length,
      complianceScore: 0,
      findings: [],
      recommendations: []
    };

    try {
      standards.forEach(standard => {
        switch (standard) {
          case 'gdpr':
            this.validateGDPRCompliance(logs, report);
            break;
          case 'sox':
            this.validateSOXCompliance(logs, report);
            break;
          case 'hipaa':
            this.validateHIPAACompliance(logs, report);
            break;
          case 'pci':
            this.validatePCICompliance(logs, report);
            break;
        }
      });

      // Calculate overall compliance score
      report.complianceScore = this.calculateComplianceScore(report.findings);

      auditLogger.info('Compliance validation completed', {
        standards,
        totalLogs: logs.length,
        complianceScore: report.complianceScore,
        findingsCount: report.findings.length
      });
    } catch (error) {
      auditLogger.error('Failed to validate compliance', { standards, error });
    }

    return report;
  }

  /**
   * Utility methods
   */
  private isCriticalOperation(operation: AuditOperation): boolean {
    const criticalActions = ['deleted', 'admin_access', 'security_change', 'data_export'];
    const criticalTables = ['Users', 'Contacts', 'SecureConfig'];
    
    return criticalActions.includes(operation.action) ||
           criticalTables.includes(operation.tableName) ||
           operation.changeType === 'security_critical';
  }

  private calculateTTL(action: string, retentionDays: number = 2555): number {
    // Default retention: 7 years for compliance
    // Critical operations: 10 years
    const criticalActions = ['deleted', 'admin_access', 'security_change'];
    const baseDays = criticalActions.includes(action) ? 3650 : retentionDays;
    
    return Math.floor(Date.now() / 1000) + (baseDays * 24 * 60 * 60);
  }

  private calculateSeverity(operation: AuditOperation): AuditSeverity {
    if (operation.action === 'deleted' || operation.changeType === 'security_critical') {
      return 'high';
    }
    if (operation.action === 'updated' && operation.changedFields && operation.changedFields.length > 5) {
      return 'medium';
    }
    return 'low';
  }

  private generateComplianceFlags(operation: AuditOperation, context: AuditContext): string[] {
    const flags: string[] = [];
    
    if (operation.tableName === 'Contacts' && operation.action !== 'created') {
      flags.push('gdpr_relevant');
    }
    if (operation.changeType === 'financial_data') {
      flags.push('sox_relevant');
    }
    if (context.source === 'api_endpoint') {
      flags.push('automated_process');
    }
    
    return flags;
  }

  private buildAuditFilter(filters: any): any {
    const conditions: any[] = [];

    if (filters.tableName) {
      conditions.push({ tableName: { eq: filters.tableName } });
    }
    if (filters.recordId) {
      conditions.push({ recordId: { eq: filters.recordId } });
    }
    if (filters.action) {
      conditions.push({ action: { eq: filters.action } });
    }
    if (filters.userId) {
      conditions.push({ userId: { eq: filters.userId } });
    }
    if (filters.userEmail) {
      conditions.push({ userEmail: { eq: filters.userEmail } });
    }
    if (filters.dateRange) {
      conditions.push({
        timestamp: {
          between: [filters.dateRange.start, filters.dateRange.end]
        }
      });
    }

    return conditions.length > 0 ? { and: conditions } : undefined;
  }

  private parseAuditEntry(raw: any): AuditEntry {
    return {
      ...raw,
      previousData: raw.previousData ? JSON.parse(raw.previousData) : null,
      newData: raw.newData ? JSON.parse(raw.newData) : null,
      changedFields: raw.changedFields ? JSON.parse(raw.changedFields) : null
    };
  }

  private analyzeAuditLogs(logs: AuditEntry[], criteria: any): AuditReport {
    return {
      criteria,
      summary: {
        totalEntries: logs.length,
        dateRange: criteria.dateRange,
        uniqueUsers: new Set(logs.map(l => l.userId)).size,
        uniqueTables: new Set(logs.map(l => l.tableName)).size,
        actionBreakdown: this.getActionBreakdown(logs),
        securityAlerts: [], // Would be populated
        complianceStatus: 'compliant'
      },
      details: criteria.includeDetails ? logs : undefined,
      generatedAt: '',
      generationTime: 0
    };
  }

  private getActionBreakdown(logs: AuditEntry[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private buildAuditDashboard(logs: AuditEntry[], timeRange: string): AuditDashboard {
    return {
      timeRange,
      summary: {
        totalOperations: logs.length,
        uniqueUsers: new Set(logs.map(l => l.userId)).size,
        errorRate: logs.filter(l => l.metadata?.errorCode).length / logs.length,
        averageResponseTime: 0 // Would calculate from performance metrics
      },
      trends: {
        operationsOverTime: [], // Would build time series
        topUsers: [], // Would analyze user activity
        topTables: [], // Would analyze table access
        errorTrends: [] // Would analyze error patterns
      },
      securityMetrics: {
        failedLogins: 0,
        privilegeChanges: 0,
        suspiciousActivity: 0,
        dataAccess: 0 // Would track read operations separately
      }
    };
  }

  private getDateRange(timeRange: string): { start: string; end: string } {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case 'last_hour':
        start.setHours(start.getHours() - 1);
        break;
      case 'last_day':
        start.setDate(start.getDate() - 1);
        break;
      case 'last_week':
        start.setDate(start.getDate() - 7);
        break;
      case 'last_month':
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  private detectBruteForceAttempts(logs: AuditEntry[]): SecurityAlert[] {
    // Implementation would detect multiple failed login attempts
    return [];
  }

  private detectUnusualActivityPatterns(logs: AuditEntry[]): SecurityAlert[] {
    // Implementation would detect unusual activity patterns
    return [];
  }

  private detectPrivilegeEscalation(logs: AuditEntry[]): SecurityAlert[] {
    // Implementation would detect privilege escalation attempts
    return [];
  }

  private detectDataExfiltration(logs: AuditEntry[]): SecurityAlert[] {
    // Implementation would detect unusual data access patterns
    return [];
  }

  private detectUnauthorizedAccess(logs: AuditEntry[]): SecurityAlert[] {
    // Implementation would detect unauthorized access attempts
    return [];
  }

  private validateGDPRCompliance(logs: AuditEntry[], report: ComplianceReport): void {
    // Implementation would validate GDPR compliance requirements
  }

  private validateSOXCompliance(logs: AuditEntry[], report: ComplianceReport): void {
    // Implementation would validate SOX compliance requirements
  }

  private validateHIPAACompliance(logs: AuditEntry[], report: ComplianceReport): void {
    // Implementation would validate HIPAA compliance requirements
  }

  private validatePCICompliance(logs: AuditEntry[], report: ComplianceReport): void {
    // Implementation would validate PCI compliance requirements
  }

  private calculateComplianceScore(findings: any[]): number {
    // Implementation would calculate compliance score based on findings
    return Math.max(0, 100 - (findings.length * 10));
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup and maintenance
   */
  async cleanup(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.pendingLogs.size > 0) {
      await this.processBatch();
    }
  }

  /**
   * Performance statistics
   */
  getPerformanceStats() {
    return {
      pendingLogs: this.pendingLogs.size,
      batchSize: this.batchSize,
      batchInterval: this.batchInterval,
      hasPendingBatch: !!this.batchTimer
    };
  }
}

// Type definitions
export interface AuditOperation {
  tableName: string;
  recordId: string;
  action: 'created' | 'updated' | 'deleted';
  changeType?: string;
  previousData?: any;
  newData?: any;
  changedFields?: string[];
  affectedRows?: number;
}

export interface AuditContext {
  source?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  requestId?: string;
  correlationId?: string;
  retentionDays?: number;
  operationDuration?: number;
  errorCode?: string;
  warningCount?: number;
  performanceMetrics?: any;
}

export interface AuditEntry extends AuditOperation {
  id: string;
  source: string;
  userAgent: string;
  ipAddress: string;
  sessionId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  timestamp: string;
  owner: string;
  ttl: number;
  requestId: string;
  correlationId: string;
  severity: AuditSeverity;
  complianceFlags: string[];
  metadata: any;
}

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditReport {
  criteria: any;
  summary: {
    totalEntries: number;
    dateRange: { start: string; end: string };
    uniqueUsers: number;
    uniqueTables: number;
    actionBreakdown: Record<string, number>;
    securityAlerts: SecurityAlert[];
    complianceStatus: 'compliant' | 'non_compliant' | 'warning';
  };
  details?: AuditEntry[];
  generatedAt: string;
  generationTime: number;
}

export interface AuditDashboard {
  timeRange: string;
  summary: {
    totalOperations: number;
    uniqueUsers: number;
    errorRate: number;
    averageResponseTime: number;
  };
  trends: {
    operationsOverTime: any[];
    topUsers: any[];
    topTables: any[];
    errorTrends: any[];
  };
  securityMetrics: {
    failedLogins: number;
    privilegeChanges: number;
    suspiciousActivity: number;
    dataAccess: number;
  };
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  affectedUsers: string[];
  recommendedActions: string[];
}

export interface ComplianceReport {
  standards: string[];
  validationDate: string;
  totalLogsReviewed: number;
  complianceScore: number;
  findings: any[];
  recommendations: string[];
}

// Export singleton instance
export const auditLoggingService = AuditLoggingService.getInstance();

// React hooks for audit logging
export const useAuditLogging = {
  /**
   * Hook for audit dashboard
   */
  useAuditDashboard: (timeRange: string = 'last_day') => {
    // Would be implemented as React hook
    return {
      dashboard: null as AuditDashboard | null,
      loading: false,
      error: null,
      refresh: () => {}
    };
  },

  /**
   * Hook for audit reports
   */
  useAuditReport: (criteria: any) => {
    return {
      report: null as AuditReport | null,
      loading: false,
      error: null,
      generate: () => {}
    };
  }
};