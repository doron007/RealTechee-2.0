/**
 * Service layer exports
 * Centralized access to all services and their interfaces
 * Updated: Services reorganized into logical directories for better maintainability
 */

// Core service interfaces and base classes
export type { ValidationResult } from './interfaces/IBaseService';
export type { IService } from './interfaces/IBaseService';
export { BaseService } from './core/BaseService';

// Core utilities
export * from './core/dataValidationService';
export * from './core/sessionStorageService';

// Business service implementations
export * from './business/RequestService';
export * from './business/QuoteService';
export { ProjectService } from './business/ProjectService';
export type { EnhancedProject } from './business/ProjectService';
export { enhancedCaseService } from './business/enhancedCaseService';
export { caseManagementService } from './business/caseManagementService';
export * from './business/enhancedQuotesService';
export * from './business/quoteCreationService';
export * from './business/enhancedProjectsService';
export * from './business/projectsService';
export * from './business/projectManagerService';
export * from './business/enhancedRequestsService';
export { requestWorkflowService } from './business/requestWorkflowService';
export type { RequestStatus } from './business/requestWorkflowService';
export * from './business/requestStatusService';
export * from './business/leadLifecycleService';

// Notification services
export * from './notifications/notificationService';
export * from './notifications/leadNotificationService';
export * from './notifications/meetingNotificationService';
export * from './notifications/notificationRetryService';
export * from './notifications/signalEmitter';
export * from './notifications/signalProcessor';
export * from './notifications/clientTemplateProcessor';
export * from './notifications/formNotificationIntegration';

// Analytics services
export * from './analytics/analyticsService';
export * from './analytics/roiTrackingService';
export * from './analytics/leadScoringService';

// Admin services
export * from './admin/taskManagementService';
export * from './admin/assignmentService';
export { flexibleAssignmentService } from './admin/flexibleAssignmentService';
export type { Territory, WorkloadMetrics, SkillRequirement } from './admin/flexibleAssignmentService';
export * from './admin/workloadBalancingService';
export * from './admin/skillManagementService';

// Service instances for easy import
export { requestService } from './business/RequestService';
export { quoteService } from './business/QuoteService';
export { projectService } from './business/ProjectService';