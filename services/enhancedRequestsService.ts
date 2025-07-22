import { requestsAPI, contactsAPI, propertiesAPI } from '../utils/amplifyAPI';
import { createLogger } from '../utils/logger';

const logger = createLogger('EnhancedRequestsService');

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
      logger.info('Fetching requests with full enhancement (Properties + Contacts)');

      // Check cache validity
      if (this.isCacheExpired()) {
        this.clearCaches();
      }

      // Step 1: Fetch all requests
      const requestsResult = await requestsAPI.list();
      if (!requestsResult.success) {
        return { success: false, error: 'Failed to fetch requests' };
      }

      const rawRequests = requestsResult.data || [];
      logger.info(`Fetched ${rawRequests.length} requests (including archived)`);

      // Step 2: Collect all unique contact and property IDs
      const contactIds = new Set<string>();
      const propertyIds = new Set<string>();
      
      rawRequests.forEach((request: any) => {
        // Collect contact IDs - using homeownerContactId and agentContactId as per user requirements
        if (request.homeownerContactId) contactIds.add(request.homeownerContactId);
        if (request.agentContactId) contactIds.add(request.agentContactId);
        
        // Collect property IDs
        if (request.addressId) propertyIds.add(request.addressId);
      });

      logger.info(`Found ${contactIds.size} contact IDs and ${propertyIds.size} property IDs to resolve`);

      // Step 3: Fetch all related data in parallel
      await Promise.all([
        this.preloadContacts(Array.from(contactIds)),
        this.preloadProperties(Array.from(propertyIds))
      ]);

      // Step 4: Transform requests with all related data
      const enhancedRequests = rawRequests.map((request: any) => this.fullyEnhanceRequest(request));

      logger.info(`Fully enhanced ${enhancedRequests.length} requests`);
      return { success: true, data: enhancedRequests };

    } catch (error) {
      logger.error('Error fetching fully enhanced requests:', error);
      return { success: false, error };
    }
  }

  /**
   * Preload contacts into cache
   */
  private async preloadContacts(contactIds: string[]): Promise<void> {
    try {
      const uncachedIds = contactIds.filter(id => !this.contactCache.has(id));
      if (uncachedIds.length === 0) return;

      logger.info(`Fetching ${uncachedIds.length} contacts`);
      const contactsResult = await contactsAPI.list();
      
      if (contactsResult.success) {
        contactsResult.data.forEach((contact: Contact) => {
          if (uncachedIds.includes(contact.id)) {
            this.contactCache.set(contact.id, contact);
          }
        });
      }
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

      logger.info(`Fetching ${uncachedIds.length} properties`);
      const propertiesResult = await propertiesAPI.list();
      
      if (propertiesResult.success) {
        propertiesResult.data.forEach((property: Property) => {
          if (uncachedIds.includes(property.id)) {
            this.propertyCache.set(property.id, property);
          }
        });
      }
    } catch (error) {
      logger.warn('Error preloading properties:', error);
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