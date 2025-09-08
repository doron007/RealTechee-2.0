import { requestsAPI, contactsAPI, propertiesAPI } from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';
import { generateClient } from 'aws-amplify/api';

const logger = createLogger('EnhancedRequestsService');
const graphqlClient = generateClient();

// GraphQL query for requests - WITH NESTED RELATIONS for FK resolution
const LIST_REQUESTS_WITH_RELATIONS = /* GraphQL */ `
  query ListRequestsWithRelations($filter: ModelRequestsFilterInput, $limit: Int, $nextToken: String) {
    listRequests(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        status
        statusImage
        statusOrder
        accountExecutive
        product
        assignedTo
        assignedDate
        message
        relationToProperty
        virtualWalkthrough
        uploadedMedia
        uplodedDocuments
        uploadedVideos
        rtDigitalSelection
        leadSource
        needFinance
        leadFromSync
        leadFromVenturaStone
        officeNotes
        archived
        bookingId
        requestedSlot
        requestedVisitDateTime
        visitorId
        visitDate
        moveToQuotingDate
        expiredDate
        archivedDate
        budget
        owner
        agentContactId
        homeownerContactId
        addressId
        createdAt
        updatedAt
        
        address {
          id
          propertyFullAddress
          houseAddress
          city
          state
          zip
          propertyType
          bedrooms
          bathrooms
          floors
          sizeSqft
          yearBuilt
          zillowLink
          redfinLink
        }
        agent {
          id
          fullName
          firstName
          lastName
          email
          phone
          mobile
          brokerage
        }
        homeowner {
          id
          fullName
          firstName
          lastName
          email
          phone
          mobile
        }
      }
      nextToken
    }
  }
`;

// Single request with nested relations
const GET_REQUEST_WITH_RELATIONS = /* GraphQL */ `
  query GetRequestWithRelations($id: ID!) {
    getRequests(id: $id) {
      id
      status
      statusImage
      statusOrder
      accountExecutive
      product
      assignedTo
      assignedDate
      message
      relationToProperty
      virtualWalkthrough
      uploadedMedia
      uplodedDocuments
      uploadedVideos
      rtDigitalSelection
      leadSource
      needFinance
      leadFromSync
      leadFromVenturaStone
      officeNotes
      archived
      bookingId
      requestedSlot
      requestedVisitDateTime
      visitorId
      visitDate
      moveToQuotingDate
      expiredDate
      archivedDate
      budget
      owner
      agentContactId
      homeownerContactId
      addressId
      createdAt
      updatedAt
      
      address {
        id
        propertyFullAddress
        houseAddress
        city
        state
        zip
        propertyType
        bedrooms
        bathrooms
        floors
        sizeSqft
        yearBuilt
        zillowLink
        redfinLink
      }
      agent {
        id
        fullName
        firstName
        lastName
        email
        phone
        mobile
        brokerage
      }
      homeowner {
        id
        fullName
        firstName
        lastName
        email
        phone
        mobile
      }
    }
  }
`;

// Enhanced request interface with all related data
export interface FullyEnhancedRequest {
  // Core request data
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
  requestedVisitDateTime?: string;
  visitDate?: string;
  moveToQuotingDate?: string;
  expiredDate?: string;
  archivedDate?: string;
  officeNotes?: string;
  archived?: string;
  
  // Resolved address from Properties table
  propertyAddress?: string;
  
  // Property data (from Properties table)
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  sizeSqft?: string;
  yearBuilt?: string;
  
  // Contact data (resolved from Contacts table using homeownerContactId and agentContactId)
  clientName?: string; // homeowner name (owner)
  clientEmail?: string;
  clientPhone?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  brokerage?: string;
  
  // Dates
  createdAt?: string;
  updatedAt?: string;
  businessCreatedDate?: string;
  businessUpdatedDate?: string;
  
  // Additional fields
  visitorId?: string;
  bookingId?: string;
  requestedSlot?: string;
  uploadedMedia?: string;
  uplodedDocuments?: string; // Note: typo in schema
  uploadedVideos?: string;
  virtualWalkthrough?: string;
  rtDigitalSelection?: string;
  leadFromSync?: string;
  leadFromVenturaStone?: string;
  
  // FK IDs for reference
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;
}

interface Property {
  id: string;
  propertyFullAddress?: string;
  houseAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqft?: number;
  yearBuilt?: number;
}

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  brokerage?: string;
}

/**
 * Enhanced service that fetches requests with full related data
 */
export class EnhancedRequestsService {
  private contactCache: Map<string, Contact> = new Map();
  private propertyCache: Map<string, Property> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch requests with all related data (Properties and Contacts)
   */
  async getFullyEnhancedRequests(): Promise<{ success: boolean; data?: FullyEnhancedRequest[]; error?: any }> {
    try {
      logger.info('Fetching requests with full enhancement via GraphQL relations');

      // Single GraphQL query - BASIC VERSION to test data retrieval
      const result = await graphqlClient.graphql({
        query: LIST_REQUESTS_WITH_RELATIONS,
        variables: { limit: 2000 }
      }) as any;

      if (result.errors) {
        logger.warn('GraphQL returned errors for ListRequestsWithRelations', result.errors);
      }

      const rawItems = result.data?.listRequests?.items || [];
      
      const rawRequests = rawItems
        .filter((r: any) => r && r.status !== 'Archived')
        .sort((a: any, b: any) => {
          // Sort by createdAt DESC (newest first)
          const dateA = a.createdAt;
          const dateB = b.createdAt;
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;  // b comes first
          if (!dateB) return -1; // a comes first
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
      
      logger.info(`Fetched ${rawRequests.length} active requests`);

      // Directly map each request using nested address/contacts - MATCHING Projects pattern exactly
      const enhancedRequests = rawRequests.map((request: any) => this.fullyEnhanceRequestFromRelations(request));

      logger.info(`Fully enhanced ${enhancedRequests.length} requests`);
      return { success: true, data: enhancedRequests };

    } catch (error) {
      logger.error('Error fetching fully enhanced requests:', error);
      return { success: false, error };
    }
  }

  private fullyEnhanceRequestFromRelations(request: any): FullyEnhancedRequest {
    // Build property address - EXACTLY matching Projects pattern
    const addr = request.address || null;
    let propertyAddress = request.propertyAddress;
    if (addr) {
      if (addr.propertyFullAddress) {
        propertyAddress = addr.propertyFullAddress;
      } else if (addr.houseAddress) {
        const parts = [addr.houseAddress, addr.city, addr.state, addr.zip].filter(Boolean);
        propertyAddress = parts.join(', ');
      }
    }
    if (!propertyAddress) propertyAddress = 'No address provided';

    // Contacts - EXACTLY matching Projects pattern
    const agent = request.agent || null;
    const homeowner = request.homeowner || null;

    return {
      // Core request data
      id: request.id,
      status: request.status,
      product: request.product,
      message: request.message,
      relationToProperty: request.relationToProperty,
      needFinance: request.needFinance,
      budget: request.budget,
      leadSource: request.leadSource,
      assignedTo: request.assignedTo,
      assignedDate: request.assignedDate,
      requestedVisitDateTime: request.requestedVisitDateTime,
      visitDate: request.visitDate,
      moveToQuotingDate: request.moveToQuotingDate,
      expiredDate: request.expiredDate,
      archivedDate: request.archivedDate,
      officeNotes: request.officeNotes,
      archived: request.archived,
      
      // Resolved address
      propertyAddress,
      
      // Property data (prefer nested property values; fallback to top-level scalars) - MATCHING Projects
      propertyType: addr?.propertyType || request.propertyType,
      bedrooms: addr?.bedrooms ? String(addr.bedrooms) : undefined,
      bathrooms: addr?.bathrooms ? String(addr.bathrooms) : undefined,
      sizeSqft: addr?.sizeSqft ? String(addr.sizeSqft) : undefined,
      yearBuilt: addr?.yearBuilt ? String(addr.yearBuilt) : undefined,
      
      // Contact data (resolved from nested relations) - EXACTLY matching Projects pattern
      clientName: homeowner?.fullName || (homeowner?.firstName && homeowner?.lastName ? `${homeowner.firstName} ${homeowner.lastName}` : homeowner?.firstName || homeowner?.lastName) || 'N/A',
      clientEmail: homeowner?.email,
      clientPhone: homeowner?.phone || homeowner?.mobile,
      agentName: agent?.fullName || (agent?.firstName && agent?.lastName ? `${agent.firstName} ${agent.lastName}` : agent?.firstName || agent?.lastName) || 'N/A',
      agentEmail: agent?.email,
      agentPhone: agent?.phone || agent?.mobile,
      brokerage: agent?.brokerage || 'N/A',
      
      // Dates
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      businessCreatedDate: request.createdAt,
      businessUpdatedDate: request.updatedAt,
      
      // Additional fields
      visitorId: request.visitorId,
      bookingId: request.bookingId,
      requestedSlot: request.requestedSlot,
      uploadedMedia: request.uploadedMedia,
      uplodedDocuments: request.uplodedDocuments,
      uploadedVideos: request.uploadedVideos,
      virtualWalkthrough: request.virtualWalkthrough,
      rtDigitalSelection: request.rtDigitalSelection,
      leadFromSync: request.leadFromSync,
      leadFromVenturaStone: request.leadFromVenturaStone,
      
      // FK IDs for reference
      agentContactId: request.agentContactId,
      homeownerContactId: request.homeownerContactId,
      addressId: request.addressId,
    };
  }

  /**
   * Fetch a single request with nested relations by ID
   */
  async getRequestByIdWithRelations(id: string): Promise<{ success: boolean; data?: FullyEnhancedRequest; error?: any }> {
    try {
      logger.info('Fetching single request with relations', { id });
      const result = await graphqlClient.graphql({
        query: GET_REQUEST_WITH_RELATIONS,
        variables: { id }
      }) as any;

      if (result.errors) {
        logger.warn('GraphQL returned errors for GetRequestWithRelations', result.errors);
      }

      const request = result.data?.getRequests;
      if (!request) {
        return { success: false, error: 'Request not found' };
      }

      const enhanced = this.fullyEnhanceRequestFromRelations(request);
      return { success: true, data: enhanced };
    } catch (error) {
      logger.error('Error fetching request by id with relations:', error);
      return { success: false, error };
    }
  }

  async updateRequest(requestId: string, updates: Partial<FullyEnhancedRequest>): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info(`Updating request ${requestId}`, updates);
      
      const result = await requestsAPI.update(requestId, updates);
      
      if (result.success) {
        // Clear caches to ensure fresh data on next fetch
        this.clearCaches();
        logger.info(`Successfully updated request ${requestId}`);
        return { success: true, data: result.data };
      } else {
        return { 
          success: false, 
          error: typeof result.error === 'string' ? result.error : 'Unknown error' 
        };
      }
    } catch (error) {
      logger.error(`Failed to update request ${requestId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Preload contacts into cache
   */
  private async preloadContacts(contactIds: string[]): Promise<void> {
    try {
      const uncachedIds = contactIds.filter(id => !this.contactCache.has(id));
      if (uncachedIds.length === 0) return;

      logger.info(`Skipping separate contact preload for ${uncachedIds.length} IDs (using nested GraphQL relations)`);
      return;
    } catch (error) {
      logger.error('Error preloading contacts:', error);
    }
  }

  /**
   * Preload properties into cache
   */
  private async preloadProperties(propertyIds: string[]): Promise<void> {
    try {
      const uncachedIds = propertyIds.filter(id => !this.propertyCache.has(id));
      if (uncachedIds.length === 0) return;

      logger.info(`Skipping separate properties preload for ${uncachedIds.length} IDs (using nested GraphQL relations)`);
      return;
    } catch (error) {
      logger.warn('Properties API not available, using request data only:', error);
    }
  }

  /**
   * Enhance a request with all related data
   */
  private fullyEnhanceRequest(rawRequest: any): FullyEnhancedRequest {
    // Get related data
    const property = rawRequest.addressId ? this.propertyCache.get(rawRequest.addressId) : null;
    const homeowner = rawRequest.homeownerContactId ? this.contactCache.get(rawRequest.homeownerContactId) : null;
    const agent = rawRequest.agentContactId ? this.contactCache.get(rawRequest.agentContactId) : null;

    // Build property address
    let propertyAddress = rawRequest.propertyAddress;
    if (!propertyAddress && property) {
      if (property.propertyFullAddress) {
        propertyAddress = property.propertyFullAddress;
      } else if (property.houseAddress) {
        // Build address from components
        const parts = [property.houseAddress, property.city, property.state, property.zip].filter(Boolean);
        propertyAddress = parts.join(', ');
      }
    }
    // Fallback to a default message if no address found
    if (!propertyAddress) {
      propertyAddress = 'No address provided';
    }

    return {
      // Core request data
      id: rawRequest.id,
      status: rawRequest.status,
      product: rawRequest.product,
      message: rawRequest.message,
      relationToProperty: rawRequest.relationToProperty,
      needFinance: rawRequest.needFinance,
      budget: rawRequest.budget,
      leadSource: rawRequest.leadSource,
      assignedTo: rawRequest.assignedTo,
      assignedDate: rawRequest.assignedDate,
      requestedVisitDateTime: rawRequest.requestedVisitDateTime,
      visitDate: rawRequest.visitDate,
      moveToQuotingDate: rawRequest.moveToQuotingDate,
      expiredDate: rawRequest.expiredDate,
      archivedDate: rawRequest.archivedDate,
      officeNotes: rawRequest.officeNotes,
      archived: rawRequest.archived,
      
      // Resolved address
      propertyAddress,
      
      // Property data (prefer Properties table, fallback to request data)
      propertyType: property?.propertyType,
      bedrooms: property?.bedrooms ? String(property.bedrooms) : undefined,
      bathrooms: property?.bathrooms ? String(property.bathrooms) : undefined,
      sizeSqft: property?.sizeSqft ? String(property.sizeSqft) : undefined,
      yearBuilt: property?.yearBuilt ? String(property.yearBuilt) : undefined,
      
      // Contact data (resolved from Contacts table)
      // homeowner = owner, agent = agent (per user requirements)
      clientName: homeowner?.fullName || (homeowner?.firstName && homeowner?.lastName ? `${homeowner.firstName} ${homeowner.lastName}` : homeowner?.firstName || homeowner?.lastName) || rawRequest.clientName || 'N/A',
      clientEmail: homeowner?.email || rawRequest.clientEmail,
      clientPhone: homeowner?.phone || homeowner?.mobile || rawRequest.clientPhone,
      agentName: agent?.fullName || (agent?.firstName && agent?.lastName ? `${agent.firstName} ${agent.lastName}` : agent?.firstName || agent?.lastName) || rawRequest.agentName || 'N/A',
      agentEmail: agent?.email,
      agentPhone: agent?.phone || agent?.mobile,
      brokerage: agent?.brokerage || 'N/A',
      
      // Dates
      createdAt: rawRequest.createdAt,
      updatedAt: rawRequest.updatedAt,
      businessCreatedDate: rawRequest.businessCreatedDate,
      businessUpdatedDate: rawRequest.businessUpdatedDate,
      
      // Additional fields
      visitorId: rawRequest.visitorId,
      bookingId: rawRequest.bookingId,
      requestedSlot: rawRequest.requestedSlot,
      uploadedMedia: rawRequest.uploadedMedia,
      uplodedDocuments: rawRequest.uplodedDocuments,
      uploadedVideos: rawRequest.uploadedVideos,
      virtualWalkthrough: rawRequest.virtualWalkthrough,
      rtDigitalSelection: rawRequest.rtDigitalSelection,
      leadFromSync: rawRequest.leadFromSync,
      leadFromVenturaStone: rawRequest.leadFromVenturaStone,
      
      // FK IDs for reference
      agentContactId: rawRequest.agentContactId,
      homeownerContactId: rawRequest.homeownerContactId,
      addressId: rawRequest.addressId,
    };
  }

  private isCacheExpired(): boolean {
    return Date.now() - this.cacheTimestamp > this.CACHE_TTL;
  }

  private clearCaches(): void {
    this.contactCache.clear();
    this.propertyCache.clear();
    this.cacheTimestamp = Date.now();
  }
}

// Export singleton instance
export const enhancedRequestsService = new EnhancedRequestsService();