import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';
import { generateClient as generateGraphQLClient } from 'aws-amplify/api';
import { listProjects, listProjectComments, listProjectMilestones, listProjectPaymentTerms } from '../queries';
import { createLogger } from './logger';

// Configure Amplify with your sandbox outputs
Amplify.configure(outputs);

// Generate a typed client for your schema with API key auth for anonymous access
const client = generateClient<Schema>({
  authMode: 'apiKey'
});

// Generate GraphQL client for custom queries
const graphqlClient = generateGraphQLClient({
  authMode: 'apiKey'
});

// Create module loggers
const apiLogger = createLogger('AmplifyAPI');
const projectsLogger = createLogger('ProjectsAPI');
const relationLogger = createLogger('RelationAPI');

// Generic API helper for any model
const createModelAPI = (modelName: string) => ({
  async create(data: any) {
    try {
      const result = await (client.models as any)[modelName].create(data);
      return { success: true, data: result.data };
    } catch (error) {
      console.error(`Error creating ${modelName}:`, error);
      return { success: false, error };
    }
  },

  async list() {
    try {
      // Use GraphQL query for models with createdDate/updatedDate to get all fields
      if (modelName === 'Projects') {
        const result = await graphqlClient.graphql({
          query: listProjects,
          variables: { limit: 2000 }
        });
        return { success: true, data: result.data.listProjects.items };
      }
      
      if (modelName === 'ProjectComments') {
        const result = await graphqlClient.graphql({
          query: listProjectComments,
          variables: { limit: 2000 }
        });
        return { success: true, data: result.data.listProjectComments.items };
      }
      
      if (modelName === 'ProjectMilestones') {
        const result = await graphqlClient.graphql({
          query: listProjectMilestones,
          variables: { limit: 2000 }
        });
        return { success: true, data: result.data.listProjectMilestones.items };
      }
      
      if (modelName === 'ProjectPaymentTerms') {
        const result = await graphqlClient.graphql({
          query: listProjectPaymentTerms,
          variables: { limit: 2000 }
        });
        return { success: true, data: result.data.listProjectPaymentTerms.items };
      }
      
      const result = await (client.models as any)[modelName].list({limit: 2000});
      return { success: true, data: result.data };
    } catch (error) {
      console.error(`Error listing ${modelName}:`, error);
      return { success: false, error };
    }
  },

  // Optimized list with filtering, sorting, pagination
  async listOptimized(options?: {
    filter?: any;
    sort?: { field: string; direction: 'asc' | 'desc' };
    limit?: number;
    nextToken?: string;
  }) {
    try {
      const queryOptions: any = { 
        limit: options?.limit || 50 
      };
      
      if (options?.filter) queryOptions.filter = options.filter;
      if (options?.nextToken) queryOptions.nextToken = options.nextToken;
      
      // Use GraphQL query for models with createdDate/updatedDate to get all fields
      if (modelName === 'Projects') {
        const result = await graphqlClient.graphql({
          query: listProjects,
          variables: queryOptions
        });
        return { 
          success: true, 
          data: result.data.listProjects.items, 
          nextToken: result.data.listProjects.nextToken,
          totalCount: result.data.listProjects.items?.length 
        };
      }
      
      if (modelName === 'ProjectComments') {
        const result = await graphqlClient.graphql({
          query: listProjectComments,
          variables: queryOptions
        });
        return { 
          success: true, 
          data: result.data.listProjectComments.items, 
          nextToken: result.data.listProjectComments.nextToken,
          totalCount: result.data.listProjectComments.items?.length 
        };
      }
      
      if (modelName === 'ProjectMilestones') {
        const result = await graphqlClient.graphql({
          query: listProjectMilestones,
          variables: queryOptions
        });
        return { 
          success: true, 
          data: result.data.listProjectMilestones.items, 
          nextToken: result.data.listProjectMilestones.nextToken,
          totalCount: result.data.listProjectMilestones.items?.length 
        };
      }
      
      if (modelName === 'ProjectPaymentTerms') {
        const result = await graphqlClient.graphql({
          query: listProjectPaymentTerms,
          variables: queryOptions
        });
        return { 
          success: true, 
          data: result.data.listProjectPaymentTerms.items, 
          nextToken: result.data.listProjectPaymentTerms.nextToken,
          totalCount: result.data.listProjectPaymentTerms.items?.length 
        };
      }
      
      const result = await (client.models as any)[modelName].list(queryOptions);
      return { 
        success: true, 
        data: result.data, 
        nextToken: result.nextToken,
        totalCount: result.data?.length 
      };
    } catch (error) {
      console.error(`Error listing optimized ${modelName}:`, error);
      return { success: false, error };
    }
  },

  async get(id: string) {
    try {
      const result = await (client.models as any)[modelName].get({ id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error(`Error getting ${modelName}:`, error);
      return { success: false, error };
    }
  },

  // Get with relationships (leverages Amplify Gen2 relationships)
  async getWithRelations(id: string, includes: string[] = []) {
    try {
      // For now, just get the basic record - relationships will be auto-included by Amplify
      const result = await (client.models as any)[modelName].get({ id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error(`Error getting ${modelName} with relations:`, error);
      return { success: false, error };
    }
  },

  async update(id: string, updates: any) {
    try {
      const result = await (client.models as any)[modelName].update({ id, ...updates });
      return { success: true, data: result.data };
    } catch (error) {
      console.error(`Error updating ${modelName}:`, error);
      return { success: false, error };
    }
  },

  async delete(id: string) {
    try {
      const result = await (client.models as any)[modelName].delete({ id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error(`Error deleting ${modelName}:`, error);
      return { success: false, error };
    }
  }
});

// Lazy-loaded API instances to reduce main bundle size
const apiCache = new Map<string, any>();

function getAPI(modelName: string) {
  if (!apiCache.has(modelName)) {
    apiCache.set(modelName, createModelAPI(modelName));
  }
  return apiCache.get(modelName);
}

// Create getter functions for lazy loading
export function getAffiliatesAPI() { return getAPI('Affiliates'); }
export function getAuthAPI() { return getAPI('Auth'); }
export function getBackOfficeAssignToAPI() { return getAPI('BackOfficeAssignTo'); }
export function getBackOfficeBookingStatusesAPI() { return getAPI('BackOfficeBookingStatuses'); }
export function getBackOfficeBrokerageAPI() { return getAPI('BackOfficeBrokerage'); }
export function getBackOfficeNotificationsAPI() { return getAPI('BackOfficeNotifications'); }
export function getBackOfficeProductsAPI() { return getAPI('BackOfficeProducts'); }
export function getBackOfficeProjectStatusesAPI() { return getAPI('BackOfficeProjectStatuses'); }
export function getBackOfficeQuoteStatusesAPI() { return getAPI('BackOfficeQuoteStatuses'); }
export function getBackOfficeRequestStatusesAPI() { return getAPI('BackOfficeRequestStatuses'); }
export function getBackOfficeRoleTypesAPI() { return getAPI('BackOfficeRoleTypes'); }
export function getContactUsAPI() { return getAPI('ContactUs'); }
export function getContactsAPI() { return getAPI('Contacts'); }
export function getLegalAPI() { return getAPI('Legal'); }
export function getMemberSignatureAPI() { return getAPI('MemberSignature'); }
export function getPendingAppoitmentsAPI() { return getAPI('PendingAppoitments'); }
export function getProjectCommentsAPI() { return getAPI('ProjectComments'); }
export function getProjectMilestonesAPI() { return getAPI('ProjectMilestones'); }
export function getProjectPaymentTermsAPI() { return getAPI('ProjectPaymentTerms'); }
export function getProjectPermissionsAPI() { return getAPI('ProjectPermissions'); }
export function getProjectsAPI() { return getAPI('Projects'); }
export function getPropertiesAPI() { return getAPI('Properties'); }
export function getQuoteItemsAPI() { return getAPI('QuoteItems'); }
export function getQuotesAPI() { return getAPI('Quotes'); }
export function getRequestsAPI() { return getAPI('Requests'); }
export function getESignatureDocumentsAPI() { return getAPI('eSignatureDocuments'); }
export function getNotificationTemplatesAPI() { return getAPI('NotificationTemplate'); }
export function getNotificationQueueAPI() { return getAPI('NotificationQueue'); }
export function getNotificationEventsAPI() { return getAPI('NotificationEvents'); }

// Core APIs that are frequently used - create immediately
export const contactsAPI = getAPI('Contacts');
export const propertiesAPI = getAPI('Properties'); 
export const requestsAPI = getAPI('Requests');
export const backOfficeRequestStatusesAPI = getAPI('BackOfficeRequestStatuses');
export const backOfficeProductsAPI = getAPI('BackOfficeProducts');

// Admin-only APIs - lazy loaded to reduce main bundle  
export const projectsAPI = getAPI('Projects');
export const quotesAPI = getAPI('Quotes');
export const projectCommentsAPI = getAPI('ProjectComments');
export const notificationQueueAPI = getAPI('NotificationQueue');

// Less frequently used APIs - function exports for lazy loading
export const getAffiliatesAPIInstance = getAffiliatesAPI;
export const getAuthAPIInstance = getAuthAPI;
export const getBackOfficeAssignToAPIInstance = getBackOfficeAssignToAPI;
export const getBackOfficeBookingStatusesAPIInstance = getBackOfficeBookingStatusesAPI;
export const getBackOfficeBrokerageAPIInstance = getBackOfficeBrokerageAPI;
export const getBackOfficeNotificationsAPIInstance = getBackOfficeNotificationsAPI;
export const getBackOfficeProjectStatusesAPIInstance = getBackOfficeProjectStatusesAPI;
export const getBackOfficeQuoteStatusesAPIInstance = getBackOfficeQuoteStatusesAPI;
export const getBackOfficeRoleTypesAPIInstance = getBackOfficeRoleTypesAPI;
export const getContactUsAPIInstance = getContactUsAPI;
export const getLegalAPIInstance = getLegalAPI;
export const getMemberSignatureAPIInstance = getMemberSignatureAPI;
export const getPendingAppoitmentsAPIInstance = getPendingAppoitmentsAPI;
export const getProjectMilestonesAPIInstance = getProjectMilestonesAPI;
export const getProjectPaymentTermsAPIInstance = getProjectPaymentTermsAPI;
export const getProjectPermissionsAPIInstance = getProjectPermissionsAPI;
export const getQuoteItemsAPIInstance = getQuoteItemsAPI;
export const getESignatureDocumentsAPIInstance = getESignatureDocumentsAPI;
export const getNotificationTemplatesAPIInstance = getNotificationTemplatesAPI;
export const getNotificationEventsAPIInstance = getNotificationEventsAPI;

// Backward compatibility - create instances for existing code
export const affiliatesAPI = getAPI('Affiliates');
export const authAPI = getAPI('Auth');
export const backOfficeAssignToAPI = getAPI('BackOfficeAssignTo');
export const backOfficeBookingStatusesAPI = getAPI('BackOfficeBookingStatuses');
export const backOfficeBrokerageAPI = getAPI('BackOfficeBrokerage');
export const backOfficeNotificationsAPI = getAPI('BackOfficeNotifications');
export const backOfficeProjectStatusesAPI = getAPI('BackOfficeProjectStatuses');
export const backOfficeQuoteStatusesAPI = getAPI('BackOfficeQuoteStatuses');
export const backOfficeRoleTypesAPI = getAPI('BackOfficeRoleTypes');
export const contactUsAPI = getAPI('ContactUs');
export const legalAPI = getAPI('Legal');
export const memberSignatureAPI = getAPI('MemberSignature');
export const pendingAppoitmentsAPI = getAPI('PendingAppoitments');
export const projectMilestonesAPI = getAPI('ProjectMilestones');
export const projectPaymentTermsAPI = getAPI('ProjectPaymentTerms');
export const projectPermissionsAPI = getAPI('ProjectPermissions');
export const quoteItemsAPI = getAPI('QuoteItems');
export const eSignatureDocumentsAPI = getAPI('eSignatureDocuments');
export const notificationTemplatesAPI = getAPI('NotificationTemplate');
export const notificationEventsAPI = getAPI('NotificationEvents');

// Export the raw client for advanced usage
export { client };
export type { Schema };

// Relational query helpers  
export const relationAPI = {
  // Test if foreign keys are working properly
  async testRelations(): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      // Get a sample project
      const projects = await projectsAPI.list();
      if (!projects.success || !projects.data?.length) {
        return { success: false, error: 'No projects found to test relations' };
      }
      
      const projectId = projects.data[0].id;
      console.log('Testing relations with project ID:', projectId);
      
      // Test if related records exist with correct foreign key format
      const comments = await this.getProjectComments(projectId);
      const milestones = await this.getProjectMilestones(projectId);
      const paymentTerms = await this.getProjectPaymentTerms(projectId);
      const permissions = await this.getProjectPermissions(projectId);
      
      return {
        success: true,
        data: {
          projectId,
          relatedCounts: {
            comments: comments.data?.length || 0,
            milestones: milestones.data?.length || 0,
            paymentTerms: paymentTerms.data?.length || 0,
            permissions: permissions.data?.length || 0
          }
        }
      };
    } catch (error) {
      console.error('Error testing relations:', error);
      return { success: false, error };
    }
  },

  // Get all quote items for a specific quote
  async getQuoteItems(quoteId: string): Promise<{ success: boolean; data?: any[]; filterUsed?: any; note?: string; error?: any }> {
    try {
      // Try multiple foreign key formats to see which one works
      const formats = [
        { quoteId: { eq: quoteId } },      // Standard lowercase
        { QuoteId: { eq: quoteId } },      // Camel case  
        { quote_id: { eq: quoteId } },     // Snake case
        { QUOTE_ID: { eq: quoteId } }      // Uppercase
      ];
      
      for (const filter of formats) {
        try {
          const result = await (client.models as any).QuoteItems.list({ filter });
          if (result.data?.length > 0) {
            console.log('QuoteItems relation works with filter:', filter);
            return { success: true, data: result.data, filterUsed: filter };
          }
        } catch (e) {
          console.log('Failed filter format:', filter);
        }
      }
      
      // If no results, try without filter to see all items
      const result = await (client.models as any).QuoteItems.list();
      return { success: true, data: result.data || [], note: 'No specific quote filter worked' };
    } catch (error) {
      console.error('Error getting quote items:', error);
      return { success: false, error };
    }
  },

  // Get all project comments for a specific project  
  async getProjectComments(projectId: string): Promise<{ success: boolean; data?: any[]; filterUsed?: any; note?: string; error?: any }> {
    try {
      relationLogger.info('Looking for project comments', { projectId, projectIdType: typeof projectId });
      
      // Use simple client.models approach (working version)
      const filter = { projectId: { eq: projectId } };
      const result = await (client.models as any).ProjectComments.list({ filter, limit: 1000 });
      
      relationLogger.info('Comments query result', {
        success: !!result.data,
        count: result.data?.length || 0,
        hasErrors: !!result.errors,
        sampleFields: result.data?.[0] ? Object.keys(result.data[0]) : []
      });
      
      // Enhanced debugging for date fields investigation
      if (result.data?.[0]) {
        relationLogger.debug('Sample comment date fields', {
          id: result.data[0].id,
          createdAt: result.data[0].createdAt,
          createdDate: result.data[0].createdDate,
          updatedAt: result.data[0].updatedAt,
          updatedDate: result.data[0].updatedDate,
          hasCreatedDate: 'createdDate' in result.data[0],
          hasUpdatedDate: 'updatedDate' in result.data[0]
        });
      }
      
      if (result.errors) {
        relationLogger.error('ProjectComments query errors', result.errors);
      }
      
      return { 
        success: true, 
        data: result.data || [], 
        filterUsed: filter,
        note: result.data?.length === 0 ? 'No comments found for this project' : undefined
      };
    } catch (error) {
      relationLogger.error('Error getting project comments', error);
      return { success: false, error };
    }
  },

  // Get all project milestones for a specific project
  async getProjectMilestones(projectId: string): Promise<{ success: boolean; data?: any[]; filterUsed?: any; note?: string; error?: any }> {
    try {
      relationLogger.info('Looking for project milestones', { projectId, projectIdType: typeof projectId });
      
      // Use client.models to get all fields (including legacy fields from DynamoDB)
      const filter = { projectId: { eq: projectId } };
      const result = await (client.models as any).ProjectMilestones.list({ filter, limit: 1000 });
      
      relationLogger.info('Milestones query result', {
        success: !!result.data,
        count: result.data?.length || 0,
        hasErrors: !!result.errors,
        sampleFields: result.data?.[0] ? Object.keys(result.data[0]) : []
      });
      
      // Enhanced debugging for date fields investigation
      if (result.data?.[0]) {
        relationLogger.debug('Sample milestone date fields', {
          id: result.data[0].id,
          name: result.data[0].name,
          createdAt: result.data[0].createdAt,
          createdDate: result.data[0].createdDate,
          updatedAt: result.data[0].updatedAt,
          updatedDate: result.data[0].updatedDate,
          hasCreatedDate: 'createdDate' in result.data[0],
          hasUpdatedDate: 'updatedDate' in result.data[0]
        });
      }
      
      if (result.errors) {
        relationLogger.error('ProjectMilestones query errors', result.errors);
      }
      
      // Always check what exists in the table for debugging
      if (result.data?.length <= 1) {
        console.log('relationAPI.getProjectMilestones: No results with filter, checking total records...');
        try {
          // Search with higher limit to find project 68 records
          const allResult = await (client.models as any).ProjectMilestones.list({ limit: 100 });
          const project68Records = allResult.data?.filter((item: any) => item?.projectId === "68");
          console.log('relationAPI.getProjectMilestones: Searching 100 records for project 68...');
          console.log('relationAPI.getProjectMilestones: Found project 68 records:', project68Records?.length || 0);
          if (project68Records?.length > 0) {
            console.log('relationAPI.getProjectMilestones: Project 68 milestone details:', project68Records.map((item: any) => ({
              id: item?.id,
              projectId: item?.projectId,
              name: item?.name
            })));
          }
        } catch (e) {
          console.log('relationAPI.getProjectMilestones: Failed to search records');
        }
      }

      return { 
        success: true, 
        data: result.data || [], 
        filterUsed: filter,
        note: result.data?.length === 0 ? 'No milestones found for this project' : undefined
      };
    } catch (error) {
      console.error('Error getting project milestones:', error);
      return { success: false, error };
    }
  },

  // Get all project payment terms for a specific project
  async getProjectPaymentTerms(projectId: string): Promise<{ success: boolean; data?: any[]; filterUsed?: any; note?: string; error?: any }> {
    try {
      relationLogger.info('Looking for project payment terms', { projectId, projectIdType: typeof projectId, filterNote: 'filtering for type="byClient" only' });
      
      // Use client.models to get all fields (including legacy fields from DynamoDB)
      // Filter by projectId AND type = "byClient" to only show client payments
      const filter = { 
        and: [
          { projectId: { eq: projectId } },
          { type: { eq: "byClient" } }
        ]
      };
      const result = await (client.models as any).ProjectPaymentTerms.list({ filter, limit: 1000 });
      
      relationLogger.info('Payment terms query result', {
        success: !!result.data,
        count: result.data?.length || 0,
        hasErrors: !!result.errors,
        sampleFields: result.data?.[0] ? Object.keys(result.data[0]) : []
      });
      
      // Enhanced debugging for date fields investigation
      if (result.data?.[0]) {
        relationLogger.debug('Sample payment term date fields', {
          id: result.data[0].id,
          paymentName: result.data[0].paymentName,
          createdAt: result.data[0].createdAt,
          createdDate: result.data[0].createdDate,
          updatedAt: result.data[0].updatedAt,
          updatedDate: result.data[0].updatedDate,
          hasCreatedDate: 'createdDate' in result.data[0],
          hasUpdatedDate: 'updatedDate' in result.data[0]
        });
      }
      
      if (result.errors) {
        relationLogger.error('ProjectPaymentTerms query errors', result.errors);
      }
      
      // Always check what exists in the table for debugging if we get <= 1 results
      if (result.data?.length <= 1) {
        console.log('relationAPI.getProjectPaymentTerms: Limited results, checking total records...');
        try {
          // Search with higher limit to find project 68 records
          const allResult = await (client.models as any).ProjectPaymentTerms.list({ limit: 100 });
          const project68Records = allResult.data?.filter((item: any) => item?.projectId === "68");
          console.log('relationAPI.getProjectPaymentTerms: Searching 100 records for project 68...');
          console.log('relationAPI.getProjectPaymentTerms: Found project 68 records:', project68Records?.length || 0);
          if (project68Records?.length > 0) {
            console.log('relationAPI.getProjectPaymentTerms: Project 68 payment details:', project68Records.map((item: any) => ({
              id: item?.id,
              projectId: item?.projectId,
              paymentName: item?.paymentName
            })));
          }
        } catch (e) {
          console.log('relationAPI.getProjectPaymentTerms: Failed to search records');
        }
      }

      return { 
        success: true, 
        data: result.data || [], 
        filterUsed: filter,
        note: result.data?.length === 0 ? 'No client payments found for this project' : undefined
      };
    } catch (error) {
      console.error('Error getting project payment terms:', error);
      return { success: false, error };
    }
  },

  // Get all project permissions for a specific project
  async getProjectPermissions(projectId: string): Promise<{ success: boolean; data?: any[]; filterUsed?: any; note?: string; error?: any }> {
    try {
      const formats = [
        { projectId: { eq: projectId } },      
        { ProjectId: { eq: projectId } },      
        { project_id: { eq: projectId } },     
        { PROJECT_ID: { eq: projectId } }      
      ];
      
      for (const filter of formats) {
        try {
          const result = await (client.models as any).ProjectPermissions.list({ filter });
          if (result.data?.length > 0) {
            console.log('ProjectPermissions relation works with filter:', filter);
            return { success: true, data: result.data, filterUsed: filter };
          }
        } catch (e) {
          console.log('Failed filter format:', filter);
        }
      }
      
      const result = await (client.models as any).ProjectPermissions.list();
      return { success: true, data: result.data || [], note: 'No specific project filter worked' };
    } catch (error) {
      console.error('Error getting project permissions:', error);
      return { success: false, error };
    }
  }
};

// Project status order - matches original CSV implementation
const PROJECT_STATUS_ORDER: Record<string, number> = {
  'New': 1,
  'Boosting': 2,
  'Buyer Servicing': 3,
  'Pre-listing': 4,
  'Listed': 5,
  'In-escrow': 6,
  'Sold': 7,
  'Completed': 8,
  'Archived': 9
};

// Optimized Projects API - Three-tier loading strategy for UPL optimization
export const optimizedProjectsAPI = {
  // Tier 1: Essential card data for immediate display (optimized for 6-card grid)
  async loadProjectCards(filter?: {
    category?: string;
    location?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    includeArchived?: boolean;
  }, limit = 6) {
    try {
      // Get all projects first (Amplify doesn't support complex sorting in filter)
      const result = await projectsAPI.listOptimized({
        limit: 1000 // Use high limit to ensure we get ALL projects (same fix as related data)
      });

      if (!result.success || !result.data) {
        return { success: false, error: 'Failed to fetch projects' };
      }

      projectsLogger.info('Loaded projects', { totalProjects: result.data?.length || 0 });

      // Apply filters (matching original CSV logic)
      const filteredProjects = result.data.filter((project: any) => {
        // Skip null/undefined projects
        if (!project) {
          return false;
        }

        // Filter out archived projects unless explicitly included
        if (!filter?.includeArchived && (project.status === 'Archived' || project.archived === 'true')) {
          return false;
        }

        // Apply category filter if provided
        if (filter?.category && project.status !== filter.category) {
          return false;
        }
        
        // Apply location filter if provided (would need address relationship)
        if (filter?.location && project.location && !project.location.includes(filter.location)) {
          return false;
        }
        
        // Apply featured filter if provided
        if (filter?.featured !== undefined && project.featured !== filter.featured) {
          return false;
        }
        
        // Apply status filter if provided
        if (filter?.status && project.status !== filter.status) {
          return false;
        }
        
        // Apply search filter if provided
        if (filter?.search) {
          const searchTerm = filter.search.toLowerCase();
          return (
            (project.title && project.title.toLowerCase().includes(searchTerm)) || 
            (project.description && project.description.toLowerCase().includes(searchTerm)) ||
            (project.status && project.status.toLowerCase().includes(searchTerm))
          );
        }
        
        return true;
      });

      // Sort projects (matching original CSV logic)
      const sortedProjects = filteredProjects.sort((a: any, b: any) => {
        // Skip null/undefined projects in sorting
        if (!a || !b) return 0;
        
        // Get status order, defaulting to highest number if status not found
        const aOrder = a.status && PROJECT_STATUS_ORDER[a.status] ? PROJECT_STATUS_ORDER[a.status] : 999;
        const bOrder = b.status && PROJECT_STATUS_ORDER[b.status] ? PROJECT_STATUS_ORDER[b.status] : 999;
        
        // First sort by status order
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // Then sort by business date in descending order (prioritize business dates over system timestamps)
        // Priority: createdDate > updatedDate > contractDate > requestDate > updatedAt > createdAt
        let aBusinessDate = a.createdDate || a.createdAt || 0;
        let bBusinessDate = b.createdDate || b.createdAt || 0;
        const aDate = new Date(aBusinessDate);
        const bDate = new Date(bBusinessDate);
        return bDate.getTime() - aDate.getTime();
      });

      // Return all sorted results for client-side pagination
      return {
        success: true,
        data: sortedProjects,
        totalCount: sortedProjects.length
      };
    } catch (error) {
      console.error('Error loading project cards:', error);
      return { success: false, error };
    }
  },

  // Tier 2: Background loading of related data for enhanced cards
  async loadProjectsWithRelations(projectIds: string[]) {
    const results = await Promise.all(
      projectIds.map(id => 
        projectsAPI.getWithRelations(id, ['address', 'agent', 'homeowner'])
      )
    );
    
    // Return a Map for O(1) lookups
    return results.reduce((map, result) => {
      if (result.success && result.data) {
        map.set(result.data.id, result.data);
      }
      return map;
    }, new Map());
  },

  // Tier 3: Full project with all relationships (for project detail page)
  async loadFullProject(projectId: string) {
    projectsLogger.info('Loading project by id', { projectId });
    
    try {
      // Query by auto-generated id field
      const result = await (client.models as any).Projects.get({ 
        id: projectId
      });
      
      projectsLogger.debug('Project query result', {
        success: !!result.data,
        hasErrors: !!result.errors,
        projectFound: result.data?.id
      });
      
      if (result.errors) {
        projectsLogger.error('Project get failed', result.errors);
        return { success: false, error: result.errors };
      }
      
      if (result.data) {
        projectsLogger.info('Project loaded successfully', { projectId: result.data.id });
        return { success: true, data: result.data };
      } else {
        projectsLogger.warn('No project found', { projectId });
        return { success: false, error: `No project found with id: ${projectId}` };
      }
    } catch (error) {
      projectsLogger.error('Error loading full project', error);
      return { success: false, error };
    }
  },

  // Get project comments with proper foreign key relationship
  async getProjectComments(projectId: string) {
    return relationAPI.getProjectComments(projectId);
  },

  // Get project milestones with proper foreign key relationship  
  async getProjectMilestones(projectId: string) {
    return relationAPI.getProjectMilestones(projectId);
  },

  // Get project payment terms with proper foreign key relationship
  async getProjectPaymentTerms(projectId: string) {
    return relationAPI.getProjectPaymentTerms(projectId);
  },

  // Get project contacts (agent, homeowner, etc.) by contact IDs
  async getProjectContacts(project: any) {
    try {
      relationLogger.info('Loading contacts for project', { projectId: project.id });
      
      const contactIds = [
        project.agentContactId,
        project.homeownerContactId,
        project.homeowner2ContactId,
        project.homeowner3ContactId
      ].filter(id => id && id.trim() !== ''); // Remove empty/null IDs

      relationLogger.debug('Contact IDs to fetch', { contactIds });

      if (contactIds.length === 0) {
        relationLogger.warn('No contact IDs found in project', { projectId: project.id });
        return { success: true, data: { agent: null, homeowner: null, homeowner2: null, homeowner3: null } };
      }

      // Load all contacts in parallel
      const contactPromises = contactIds.map(async (contactId) => {
        try {
          const result = await (client.models as any).Contacts.get({ id: contactId });
          return { contactId, success: !!result.data, data: result.data, error: result.errors };
        } catch (error) {
          relationLogger.warn('Failed to load contact', { contactId, error });
          return { contactId, success: false, data: null, error };
        }
      });

      const contactResults = await Promise.all(contactPromises);
      
      // Map contacts to their roles
      const contacts: {
        agent: any | null;
        homeowner: any | null;
        homeowner2: any | null;
        homeowner3: any | null;
      } = {
        agent: null,
        homeowner: null,
        homeowner2: null,
        homeowner3: null
      };

      contactResults.forEach(result => {
        if (result.success && result.data) {
          if (result.contactId === project.agentContactId) {
            contacts.agent = result.data;
          } else if (result.contactId === project.homeownerContactId) {
            contacts.homeowner = result.data;
          } else if (result.contactId === project.homeowner2ContactId) {
            contacts.homeowner2 = result.data;
          } else if (result.contactId === project.homeowner3ContactId) {
            contacts.homeowner3 = result.data;
          }
        }
      });

      relationLogger.info('Contacts loaded successfully', {
        agent: !!contacts.agent,
        homeowner: !!contacts.homeowner,
        homeowner2: !!contacts.homeowner2,
        homeowner3: !!contacts.homeowner3,
        agentName: contacts.agent?.fullName || 
          (contacts.agent?.firstName && contacts.agent?.lastName 
            ? `${contacts.agent.firstName} ${contacts.agent.lastName}` 
            : 'Unknown')
      });

      return { success: true, data: contacts };
    } catch (error) {
      relationLogger.error('Error loading project contacts', error);
      return { success: false, error };
    }
  }
};
       