import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { Amplify } from 'aws-amplify';

// Configure Amplify with your sandbox outputs
Amplify.configure(outputs);

// Generate a typed client for your schema
const client = generateClient<Schema>();

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
      const result = await (client.models as any)[modelName].list();
      return { success: true, data: result.data };
    } catch (error) {
      console.error(`Error listing ${modelName}:`, error);
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

// All 26 migrated table APIs
export const affiliatesAPI = createModelAPI('Affiliates');
export const authAPI = createModelAPI('Auth');
export const backOfficeAssignToAPI = createModelAPI('BackOfficeAssignTo');
export const backOfficeBookingStatusesAPI = createModelAPI('BackOfficeBookingStatuses');
export const backOfficeBrokerageAPI = createModelAPI('BackOfficeBrokerage');
export const backOfficeNotificationsAPI = createModelAPI('BackOfficeNotifications');
export const backOfficeProductsAPI = createModelAPI('BackOfficeProducts');
export const backOfficeProjectStatusesAPI = createModelAPI('BackOfficeProjectStatuses');
export const backOfficeQuoteStatusesAPI = createModelAPI('BackOfficeQuoteStatuses');
export const backOfficeRequestStatusesAPI = createModelAPI('BackOfficeRequestStatuses');
export const backOfficeRoleTypesAPI = createModelAPI('BackOfficeRoleTypes');
export const contactUsAPI = createModelAPI('ContactUs');
export const contactsAPI = createModelAPI('Contacts');
export const legalAPI = createModelAPI('Legal');
export const memberSignatureAPI = createModelAPI('MemberSignature');
export const pendingAppoitmentsAPI = createModelAPI('PendingAppoitments');
export const projectCommentsAPI = createModelAPI('ProjectComments');
export const projectMilestonesAPI = createModelAPI('ProjectMilestones');
export const projectPaymentTermsAPI = createModelAPI('ProjectPaymentTerms');
export const projectPermissionsAPI = createModelAPI('ProjectPermissions');
export const projectsAPI = createModelAPI('Projects');
export const propertiesAPI = createModelAPI('Properties');
export const quoteItemsAPI = createModelAPI('QuoteItems');
export const quotesAPI = createModelAPI('Quotes');
export const requestsAPI = createModelAPI('Requests');
export const eSignatureDocumentsAPI = createModelAPI('eSignatureDocuments');

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
      // Try multiple foreign key formats
      const formats = [
        { projectId: { eq: projectId } },      
        { ProjectId: { eq: projectId } },      
        { project_id: { eq: projectId } },     
        { PROJECT_ID: { eq: projectId } }      
      ];
      
      for (const filter of formats) {
        try {
          const result = await (client.models as any).ProjectComments.list({ filter });
          if (result.data?.length > 0) {
            console.log('ProjectComments relation works with filter:', filter);
            return { success: true, data: result.data, filterUsed: filter };
          }
        } catch (e) {
          console.log('Failed filter format:', filter);
        }
      }
      
      const result = await (client.models as any).ProjectComments.list();
      return { success: true, data: result.data || [], note: 'No specific project filter worked' };
    } catch (error) {
      console.error('Error getting project comments:', error);
      return { success: false, error };
    }
  },

  // Get all project milestones for a specific project
  async getProjectMilestones(projectId: string): Promise<{ success: boolean; data?: any[]; filterUsed?: any; note?: string; error?: any }> {
    try {
      const formats = [
        { projectId: { eq: projectId } },      
        { ProjectId: { eq: projectId } },      
        { project_id: { eq: projectId } },     
        { PROJECT_ID: { eq: projectId } }      
      ];
      
      for (const filter of formats) {
        try {
          const result = await (client.models as any).ProjectMilestones.list({ filter });
          if (result.data?.length > 0) {
            console.log('ProjectMilestones relation works with filter:', filter);
            return { success: true, data: result.data, filterUsed: filter };
          }
        } catch (e) {
          console.log('Failed filter format:', filter);
        }
      }
      
      const result = await (client.models as any).ProjectMilestones.list();
      return { success: true, data: result.data || [], note: 'No specific project filter worked' };
    } catch (error) {
      console.error('Error getting project milestones:', error);
      return { success: false, error };
    }
  },

  // Get all project payment terms for a specific project
  async getProjectPaymentTerms(projectId: string): Promise<{ success: boolean; data?: any[]; filterUsed?: any; note?: string; error?: any }> {
    try {
      const formats = [
        { projectId: { eq: projectId } },      
        { ProjectId: { eq: projectId } },      
        { project_id: { eq: projectId } },     
        { PROJECT_ID: { eq: projectId } }      
      ];
      
      for (const filter of formats) {
        try {
          const result = await (client.models as any).ProjectPaymentTerms.list({ filter });
          if (result.data?.length > 0) {
            console.log('ProjectPaymentTerms relation works with filter:', filter);
            return { success: true, data: result.data, filterUsed: filter };
          }
        } catch (e) {
          console.log('Failed filter format:', filter);
        }
      }
      
      const result = await (client.models as any).ProjectPaymentTerms.list();
      return { success: true, data: result.data || [], note: 'No specific project filter worked' };
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
       