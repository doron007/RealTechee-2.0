import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient as generateGraphQLClient } from 'aws-amplify/api';
import { listProjects, getProjects, listProjectComments, listProjectMilestones, listProjectPaymentTerms, listQuotes, listRequests, listContacts, listBackOfficeProjectStatuses, listBackOfficeQuoteStatuses, listBackOfficeRequestStatuses, listBackOfficeAssignTos } from '../queries';
import { createLogger } from './logger';
import { logClientConfigOnce } from './environmentConfig';

// Fallback to hardcoded values for development when env vars not available
import outputs from '../amplify_outputs.json';

// Dynamic Amplify configuration based on environment variables
const amplifyConfig = {
  Auth: outputs.auth ? {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || outputs.auth.user_pool_id,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || outputs.auth.user_pool_client_id,
      identityPoolId: outputs.auth.identity_pool_id,
      region: process.env.NEXT_PUBLIC_AWS_REGION || outputs.auth.aws_region,
      mfaMethods: outputs.auth.mfa_methods,
      standardRequiredAttributes: outputs.auth.standard_required_attributes,
      usernameAttributes: outputs.auth.username_attributes,
      userVerificationTypes: outputs.auth.user_verification_types
    }
  } : {},
  API: outputs.data ? {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_GRAPHQL_URL || outputs.data.url,
      region: process.env.NEXT_PUBLIC_AWS_REGION || outputs.data.aws_region,
      defaultAuthMode: outputs.data.default_authorization_type === 'API_KEY' ? 'apiKey' : 'userPool',
      apiKey: outputs.data.api_key
    }
  } : {},
  Storage: outputs.storage || {},
  // Include the full data config for Amplify Gen 2 Data client
  data: outputs.data ? {
    url: process.env.NEXT_PUBLIC_GRAPHQL_URL || outputs.data.url,
    aws_region: process.env.NEXT_PUBLIC_AWS_REGION || outputs.data.aws_region,
    api_key: outputs.data.api_key,
    default_authorization_type: outputs.data.default_authorization_type,
    authorization_types: outputs.data.authorization_types,
    model_introspection: outputs.data.model_introspection
  } : {}
};

// Configure Amplify with environment-based configuration
Amplify.configure(amplifyConfig);

// Debug: Log environment configuration on initialization
if (typeof window !== 'undefined') {
  // Log new unified environment configuration once per session
  logClientConfigOnce();
}

// Generate a typed client for your schema with API key auth for anonymous access
const client = generateClient<Schema>({
  authMode: 'apiKey'
});

// Generate authenticated client for logged-in users
const authenticatedClient = generateClient<Schema>({
  authMode: 'userPool'
});

// Generate GraphQL client for custom queries
const graphqlClient = generateGraphQLClient({
  authMode: 'apiKey'
});

// Create module loggers
const apiLogger = createLogger('AmplifyAPI');
const projectsLogger = createLogger('ProjectsAPI');
const relationLogger = createLogger('RelationAPI');

// Generic API helper for any model with client safety checks
const createModelAPI = (modelName: string) => {
  
  // Helper function to ensure client is ready before making API calls
  const ensureClientReady = () => {
    if (!client.models || !(client.models as any)[modelName]) {
      throw new Error(`Model ${modelName} not available on client. Client may not be initialized properly.`);
    }
  };

  // Helper function to ensure API key client is ready (for models requiring public access)
  const ensureApiKeyClientReady = () => {
    if (!client.models || !(client.models as any)[modelName]) {
      throw new Error(`Model ${modelName} not available on API key client. Client may not be initialized properly.`);
    }
  };
  
  return {
  async create(data: any) {
    try {
      ensureClientReady();
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
        
        // Debug: Log the first few project IDs to help with local testing
        if (result.data?.listProjects?.items?.length > 0) {
          console.log('Available project IDs for local testing:', 
            result.data.listProjects.items.slice(0, 5).map((p: any) => p.id)
          );
        }
        
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
      
      if (modelName === 'Quotes') {
        try {
          // Use minimal query to avoid field validation errors
          const minimalQuotesQuery = `
            query ListQuotesMinimal($limit: Int) {
              listQuotes(limit: $limit) {
                items {
                  id
                  status
                  title
                  requestId
                  projectId
                  assignedTo
                  quoteNumber
                  budget
                  totalPrice
                  product
                  createdAt
                  updatedAt
                  __typename
                }
                nextToken
                __typename
              }
            }
          `;
          
          const result = await graphqlClient.graphql({
            query: minimalQuotesQuery,
            variables: { limit: 2000 }
          }) as any; // Cast to any to handle GraphQL type issues
          
          console.log(`📊 Quotes query result: ${result.data?.listQuotes?.items?.length || 0} items returned`);
          
          // Handle GraphQL errors gracefully - log but continue with partial data
          if (result.errors) {
            console.warn(`GraphQL validation errors for Quotes (${result.errors.length} errors) - using partial data`);
            console.debug('First few errors:', result.errors.slice(0, 3).map((e: any) => e.message));
          }
          
          return { success: true, data: result.data?.listQuotes?.items || [] };
        } catch (graphqlError) {
          console.warn('Quotes GraphQL query failed completely, returning empty array:', graphqlError);
          return { success: true, data: [] };
        }
      }
      
      if (modelName === 'Requests') {
        try {
          // Use minimal query to avoid field validation errors
          const minimalRequestsQuery = `
            query ListRequestsMinimal($limit: Int) {
              listRequests(limit: $limit) {
                items {
                  id
                  status
                  product
                  assignedTo
                  message
                  leadSource
                  archived
                  createdAt
                  updatedAt
                  __typename
                }
                nextToken
                __typename
              }
            }
          `;
          
          const result = await graphqlClient.graphql({
            query: minimalRequestsQuery,
            variables: { limit: 2000 }
          }) as any; // Cast to any to handle GraphQL type issues
          
          console.log(`📊 Requests query result: ${result.data?.listRequests?.items?.length || 0} items returned`);
          
          // Handle GraphQL errors gracefully - log but continue with partial data
          if (result.errors) {
            console.warn(`GraphQL validation errors for Requests (${result.errors.length} errors) - using partial data`);
          }
          
          return { success: true, data: result.data?.listRequests?.items || [] };
        } catch (graphqlError) {
          console.warn('Requests GraphQL query failed completely, returning empty array:', graphqlError);
          return { success: true, data: [] };
        }
      }
      
      if (modelName === 'Contacts') {
        try {
          const result = await graphqlClient.graphql({
            query: listContacts,
            variables: { limit: 2000 }
          });
          
          // Handle GraphQL errors gracefully - log but continue with partial data
          if (result.errors) {
            console.warn(`GraphQL validation errors for Contacts (${result.errors.length} errors) - using partial data`);
          }
          
          return { success: true, data: result.data?.listContacts?.items || [] };
        } catch (graphqlError) {
          console.warn('Contacts GraphQL query failed completely, returning empty array:', graphqlError);
          return { success: true, data: [] };
        }
      }
      
      if (modelName === 'BackOfficeProjectStatuses') {
        const result = await graphqlClient.graphql({
          query: listBackOfficeProjectStatuses,
          variables: { limit: 2000 }
        });
        return { success: true, data: result.data.listBackOfficeProjectStatuses.items };
      }
      
      if (modelName === 'BackOfficeQuoteStatuses') {
        const result = await graphqlClient.graphql({
          query: listBackOfficeQuoteStatuses,
          variables: { limit: 2000 }
        });
        return { success: true, data: result.data.listBackOfficeQuoteStatuses.items };
      }
      
      if (modelName === 'BackOfficeRequestStatuses') {
        const result = await graphqlClient.graphql({
          query: listBackOfficeRequestStatuses,
          variables: { limit: 2000 }
        });
        return { success: true, data: result.data.listBackOfficeRequestStatuses.items };
      }
      
      if (modelName === 'BackOfficeAssignTo') {
        const result = await graphqlClient.graphql({
          query: listBackOfficeAssignTos,
          variables: { limit: 2000 }
        });
        return { success: true, data: result.data.listBackOfficeAssignTos.items };
      }
      
      if (modelName === 'NotificationTemplate') {
        try {
          // First try minimal query to get template IDs
          const minimalTemplatesQuery = `
            query ListNotificationTemplatesMinimal($limit: Int) {
              listNotificationTemplates(limit: $limit) {
                items {
                  id
                  name
                  formType
                  isActive
                  version
                  createdBy
                  lastModifiedBy
                  createdAt
                  updatedAt
                  variables
                  previewData
                  __typename
                }
                nextToken
                __typename
              }
            }
          `;
          
          const listResult = await graphqlClient.graphql({
            query: minimalTemplatesQuery,
            variables: { limit: 2000 }
          }) as any;
          
          const templateIds = listResult.data?.listNotificationTemplates?.items || [];
          console.log(`📊 Found ${templateIds.length} template IDs, fetching full content for each...`);
          
          // For each template, try to get full content individually (more error tolerant)
          const fullTemplates = await Promise.allSettled(
            templateIds.map(async (template: any) => {
              try {
                const getTemplateQuery = `
                  query GetNotificationTemplate($id: ID!) {
                    getNotificationTemplate(id: $id) {
                      id
                      name
                      formType
                      emailSubject
                      emailContentHtml
                      smsContent
                      variables
                      previewData
                      isActive
                      version
                      createdBy
                      lastModifiedBy
                      createdAt
                      updatedAt
                      __typename
                    }
                  }
                `;
                
                const getResult = await graphqlClient.graphql({
                  query: getTemplateQuery,
                  variables: { id: template.id }
                }) as any;
                
                return getResult.data?.getNotificationTemplate || template;
              } catch (error) {
                console.warn(`Failed to get full content for template ${template.id}, using partial data:`, error);
                return template; // Fallback to minimal data
              }
            })
          );
          
          // Extract successful results
          const validTemplates = fullTemplates
            .filter(result => result.status === 'fulfilled')
            .map(result => (result as PromiseFulfilledResult<any>).value)
            .filter(template => template); // Remove nulls
          
          console.log(`📊 Successfully loaded ${validTemplates.length} templates with full content`);
          return { success: true, data: validTemplates };
          
        } catch (graphqlError) {
          console.warn('NotificationTemplates GraphQL query failed completely, returning empty array:', graphqlError);
          return { success: true, data: [] };
        }
      }
      
      if (modelName === 'SignalEvents') {
        try {
          console.log('🔍 Fetching SignalEvents via generated query...');
          
          // Import the generated query
          const { listSignalEvents } = await import('../queries');
          
          const result = await graphqlClient.graphql({
            query: listSignalEvents,
            variables: { limit: 100 }
          }) as any;
          
          console.log(`📊 SignalEvents result: ${result.data?.listSignalEvents?.items?.length || 0} items returned`);
          
          // Check for GraphQL errors in the response
          if (result.errors && result.errors.length > 0) {
            console.log(`⚠️ SignalEvents has ${result.errors.length} GraphQL validation errors (but data still returned):`);
            result.errors.forEach((error: any, index: number) => {
              console.log(`   ${index + 1}. ${error.message}`);
              if (error.path) console.log(`      Path: ${JSON.stringify(error.path)}`);
              if (error.extensions) console.log(`      Extensions: ${JSON.stringify(error.extensions)}`);
            });
          }
          
          return { success: true, data: result.data?.listSignalEvents?.items || [] };
        } catch (error: any) {
          // Handle case where GraphQL returns data but wrapped in an error object
          console.log('❌ SignalEvents catch block - checking if data exists in error object...');
          
          if (error?.data?.listSignalEvents?.items) {
            console.log(`📊 Found SignalEvents data in error object: ${error.data.listSignalEvents.items.length} items`);
            
            if (error?.errors && error.errors.length > 0) {
              console.log(`⚠️ SignalEvents has ${error.errors.length} GraphQL validation errors (but data extracted):`);
              error.errors.forEach((err: any, index: number) => {
                console.log(`   ${index + 1}. ${err.message}`);
              });
            }
            
            return { success: true, data: error.data.listSignalEvents.items };
          }
          
          console.log('❌ No data found in SignalEvents error object');
          console.log('   Error type:', typeof error);
          console.log('   Error message:', error?.message || 'No message');
          console.warn('SignalEvents query failed completely, returning empty array:', error);
          return { success: true, data: [] };
        }
      }
      
      if (modelName === 'NotificationQueue') {
        try {
          console.log('🔍 Fetching NotificationQueue via generated query...');
          
          // Import the generated query
          const { listNotificationQueues } = await import('../queries');
          
          const result = await graphqlClient.graphql({
            query: listNotificationQueues,
            variables: { limit: 200 }
          }) as any;
          
          console.log(`📊 NotificationQueue result: ${result.data?.listNotificationQueues?.items?.length || 0} items returned`);
          
          if (result.errors) {
            console.error(`❌ NotificationQueue errors (${result.errors.length} errors):`, result.errors.map((e: any) => e.message).slice(0, 3));
            console.error('Full error details:', result.errors.slice(0, 2));
          }
          
          return { success: true, data: result.data?.listNotificationQueues?.items || [] };
        } catch (error) {
          console.warn('NotificationQueue query failed, returning empty array:', error);
          return { success: true, data: [] };
        }
      }
      
      if (modelName === 'SignalNotificationHooks') {
        try {
          console.log('🔍 Fetching SignalNotificationHooks via generated query...');
          
          // Import the generated query
          const { listSignalNotificationHooks } = await import('../queries');
          
          const result = await graphqlClient.graphql({
            query: listSignalNotificationHooks,
            variables: { limit: 100 }
          }) as any;
          
          console.log(`📊 SignalNotificationHooks result: ${result.data?.listSignalNotificationHooks?.items?.length || 0} items returned`);
          
          // Check for GraphQL errors in the response
          if (result.errors && result.errors.length > 0) {
            console.log(`⚠️ SignalNotificationHooks has ${result.errors.length} GraphQL validation errors (but data still returned):`);
            result.errors.forEach((error: any, index: number) => {
              console.log(`   ${index + 1}. ${error.message}`);
              if (error.path) console.log(`      Path: ${JSON.stringify(error.path)}`);
            });
          }
          
          return { success: true, data: result.data?.listSignalNotificationHooks?.items || [] };
        } catch (error: any) {
          // Handle case where GraphQL returns data but wrapped in an error object
          console.log('❌ SignalNotificationHooks catch block - checking if data exists in error object...');
          
          if (error?.data?.listSignalNotificationHooks?.items) {
            console.log(`📊 Found SignalNotificationHooks data in error object: ${error.data.listSignalNotificationHooks.items.length} items`);
            
            if (error?.errors && error.errors.length > 0) {
              console.log(`⚠️ SignalNotificationHooks has ${error.errors.length} GraphQL validation errors (but data extracted):`);
              error.errors.forEach((err: any, index: number) => {
                console.log(`   ${index + 1}. ${err.message}`);
              });
            }
            
            return { success: true, data: error.data.listSignalNotificationHooks.items };
          }
          
          console.log('❌ No data found in SignalNotificationHooks error object');
          console.log('   Error type:', typeof error);
          console.log('   Error message:', error?.message || 'No message');
          console.warn('SignalNotificationHooks query failed completely, returning empty array:', error);
          return { success: true, data: [] };
        }
      }
      
      ensureClientReady();
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
      
      if (modelName === 'Quotes') {
        const result = await graphqlClient.graphql({
          query: listQuotes,
          variables: queryOptions
        });
        return { 
          success: true, 
          data: result.data.listQuotes.items, 
          nextToken: result.data.listQuotes.nextToken,
          totalCount: result.data.listQuotes.items?.length 
        };
      }
      
      if (modelName === 'Requests') {
        const result = await graphqlClient.graphql({
          query: listRequests,
          variables: queryOptions
        });
        return { 
          success: true, 
          data: result.data.listRequests.items, 
          nextToken: result.data.listRequests.nextToken,
          totalCount: result.data.listRequests.items?.length 
        };
      }
      
      if (modelName === 'Contacts') {
        const result = await graphqlClient.graphql({
          query: listContacts,
          variables: queryOptions
        });
        return { 
          success: true, 
          data: result.data.listContacts.items, 
          nextToken: result.data.listContacts.nextToken,
          totalCount: result.data.listContacts.items?.length 
        };
      }
      
      if (modelName === 'BackOfficeProjectStatuses') {
        const result = await graphqlClient.graphql({
          query: listBackOfficeProjectStatuses,
          variables: queryOptions
        });
        return { 
          success: true, 
          data: result.data.listBackOfficeProjectStatuses.items, 
          nextToken: result.data.listBackOfficeProjectStatuses.nextToken,
          totalCount: result.data.listBackOfficeProjectStatuses.items?.length 
        };
      }
      
      if (modelName === 'BackOfficeQuoteStatuses') {
        const result = await graphqlClient.graphql({
          query: listBackOfficeQuoteStatuses,
          variables: queryOptions
        });
        return { 
          success: true, 
          data: result.data.listBackOfficeQuoteStatuses.items, 
          nextToken: result.data.listBackOfficeQuoteStatuses.nextToken,
          totalCount: result.data.listBackOfficeQuoteStatuses.items?.length 
        };
      }
      
      if (modelName === 'BackOfficeRequestStatuses') {
        const result = await graphqlClient.graphql({
          query: listBackOfficeRequestStatuses,
          variables: queryOptions
        });
        return { 
          success: true, 
          data: result.data.listBackOfficeRequestStatuses.items, 
          nextToken: result.data.listBackOfficeRequestStatuses.nextToken,
          totalCount: result.data.listBackOfficeRequestStatuses.items?.length 
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
      ensureClientReady();
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
      // Safety check: ensure client.models is available
      if (!client.models || !(client.models as any)[modelName]) {
        console.error(`Client debug info for ${modelName}:`, {
          clientExists: !!client,
          modelsExists: !!client.models,
          availableModels: client.models ? Object.keys(client.models) : [],
          requestedModel: modelName,
          hasProjectsModel: !!(client.models as any)?.Projects
        });
        throw new Error(`Model ${modelName} not available on client. Available models: ${client.models ? Object.keys(client.models).join(', ') : 'none'}`);
      }
      
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
      ensureClientReady();
      const result = await (client.models as any)[modelName].update({ id, ...updates });
      return { success: true, data: result.data };
    } catch (error) {
      console.error(`Error updating ${modelName}:`, error);
      return { success: false, error };
    }
  },


  async delete(id: string) {
    try {
      ensureClientReady();
      const result = await (client.models as any)[modelName].delete({ id });
      return { success: true, data: result.data };
    } catch (error) {
      console.error(`Error deleting ${modelName}:`, error);
      return { success: false, error };
    }
  }
  };
};

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
export function getSignalEventsAPI() { return getAPI('SignalEvents'); }
export function getSignalNotificationHooksAPI() { return getAPI('SignalNotificationHooks'); }

// Core APIs that are frequently used - create immediately
export const contactsAPI = getAPI('Contacts');
export const propertiesAPI = getAPI('Properties'); 
export const requestsAPI = getAPI('Requests');
export const backOfficeRequestStatusesAPI = getAPI('BackOfficeRequestStatuses');

// Admin-only APIs - lazy loaded to reduce main bundle  
export const projectsAPI = getAPI('Projects');
export const quotesAPI = getAPI('Quotes');
export const projectCommentsAPI = getAPI('ProjectComments');
export const notificationQueueAPI = getAPI('NotificationQueue');
export const backOfficeProductsAPI = getAPI('BackOfficeProducts');

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
export const getSignalEventsAPIInstance = getSignalEventsAPI;
export const getSignalNotificationHooksAPIInstance = getSignalNotificationHooksAPI;

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
export const signalEventsAPI = getAPI('SignalEvents');
export const signalNotificationHooksAPI = getAPI('SignalNotificationHooks');

// Export the raw client for advanced usage
export { client };
export type { Schema };

// Export Cognito groups if available (for reference, not used in auth config)
// Safe access with type guard to handle server-generated outputs that may lack groups
const authGroups = (outputs as any).auth?.groups ?? [];
export const definedGroups = authGroups.map((g: any) => Object.keys(g)[0]).filter(Boolean);
export const groupPrecedence: Record<string, number> = Object.fromEntries(
  authGroups.flatMap((g: any) => {
    const name = Object.keys(g)[0];
    return name ? [[name, g[name].precedence ?? 999]] : [];
  })
);

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
      
      // Use GraphQL client for reliable query execution
      const filter = { projectId: { eq: projectId } };
      const result = await graphqlClient.graphql({
        query: listProjectComments,
        variables: { filter, limit: 1000 }
      });
      
      const comments = result.data?.listProjectComments?.items || [];
      
      relationLogger.info('Comments query result', {
        success: !!result.data,
        count: comments.length,
        hasErrors: !!result.errors,
        firstItem: comments[0]
      });
      
      if (result.errors) {
        relationLogger.error('ProjectComments query errors', result.errors);
      }
      
      return { 
        success: true, 
        data: comments, 
        filterUsed: filter,
        note: comments.length === 0 ? 'No comments found for this project' : undefined
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
      
      // Use GraphQL client for reliable query execution
      const filter = { projectId: { eq: projectId } };
      const result = await graphqlClient.graphql({
        query: listProjectMilestones,
        variables: { filter, limit: 1000 }
      });
      
      const milestones = result.data?.listProjectMilestones?.items || [];
      
      relationLogger.info('Milestones query result', {
        success: !!result.data,
        count: milestones.length,
        hasErrors: !!result.errors,
        firstItem: milestones[0]
      });
      
      if (result.errors) {
        relationLogger.error('ProjectMilestones query errors', result.errors);
      }

      return { 
        success: true, 
        data: milestones, 
        filterUsed: filter,
        note: milestones.length === 0 ? 'No milestones found for this project' : undefined
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
      
      // Use GraphQL client for reliable query execution
      // Filter by projectId AND type = "byClient" to only show client payments
      const filter = { 
        and: [
          { projectId: { eq: projectId } },
          { type: { eq: "byClient" } }
        ]
      };
      const result = await graphqlClient.graphql({
        query: listProjectPaymentTerms,
        variables: { filter, limit: 1000 }
      });
      
      const paymentTerms = result.data?.listProjectPaymentTerms?.items || [];
      
      relationLogger.info('Payment terms query result', {
        success: !!result.data,
        count: paymentTerms.length,
        hasErrors: !!result.errors,
        firstItem: paymentTerms[0]
      });
      
      if (result.errors) {
        relationLogger.error('ProjectPaymentTerms query errors', result.errors);
      }

      return { 
        success: true, 
        data: paymentTerms, 
        filterUsed: filter,
        note: paymentTerms.length === 0 ? 'No client payments found for this project' : undefined
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
    // Check if client.models is available before attempting relations loading
    if (!client.models || Object.keys(client.models).length === 0) {
      console.warn('Client models not available, skipping relations loading for projects:', projectIds.length);
      // Return empty map since relations loading is not critical for basic functionality
      return new Map();
    }
    
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
      // FIXED: listProjects filtering is broken in GraphQL, but getProjects works
      // Use direct getProjects query instead of broken listProjects filter
      const result = await graphqlClient.graphql({
        query: getProjects,
        variables: { id: projectId }
      });
      
      const projectData = result.data?.getProjects;
      
      projectsLogger.debug('Project query result', {
        success: !!projectData,
        hasErrors: !!result.errors,
        projectFound: projectData?.id
      });
      
      if (result.errors) {
        projectsLogger.error('Project get failed', result.errors);
        return { success: false, error: result.errors };
      }
      
      if (projectData) {
        projectsLogger.info('Project loaded successfully', { projectId: projectData.id });
        return { success: true, data: projectData };
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
       