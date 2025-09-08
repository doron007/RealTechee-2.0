import { quotesAPI, contactsAPI, propertiesAPI } from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';
import { generateClient } from 'aws-amplify/api';

const logger = createLogger('EnhancedQuotesService');
const graphqlClient = generateClient();

// Single quote with nested relations
const GET_QUOTE_WITH_RELATIONS = /* GraphQL */ `
  query GetQuoteWithRelations($id: ID!) {
    getQuotes(id: $id) {
      id
      title
      status
      quoteNumber
      totalPrice
      totalCost
      budget
      projectedListingPrice
      product
      assignedTo
      operationManagerApproved
      underwritingApproved
      signed
      creditScore
      estimatedWeeksDuration
      requestDate
      sentDate
      openedDate
      signedDate
      expiredDate
      officeNotes
      requestId
      projectId
      agentContactId
      homeownerContactId
      addressId
      bedrooms
      yearBuilt
      bathrooms
      sizeSqft
      createdAt
      updatedAt
      
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

// Enhanced quote interface with all related data
export interface FullyEnhancedQuote {
  // Core quote data
  id: string;
  title?: string;
  description?: string;
  status: string;
  quoteNumber?: number;
  totalPrice?: number;
  totalCost?: number;
  budget?: number;
  projectedListingPrice?: number;
  product?: string;
  assignedTo?: string;
  operationManagerApproved?: boolean;
  underwritingApproved?: boolean;
  signed?: boolean;
  creditScore?: number;
  estimatedWeeksDuration?: string;
  
  // Resolved address from Properties table
  propertyAddress?: string;
  
  // Property data (from Properties table)
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  sizeSqft?: string;
  yearBuilt?: string;
  
  // Contact data (resolved from Contacts table)
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  agentName?: string;
  agentEmail?: string;
  brokerage?: string;
  
  // Dates
  requestDate?: string;
  sentDate?: string;
  openedDate?: string;
  signedDate?: string;
  expiredDate?: string;
  validUntil?: string;
  createdAt?: string;
  updatedAt?: string;
  businessCreatedDate?: string;
  businessUpdatedDate?: string;
  
  // Additional fields
  officeNotes?: string;
  requestId?: string;
  projectId?: string;
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
 * Enhanced service that fetches quotes with full related data
 */
export class EnhancedQuotesService {
  private contactCache: Map<string, Contact> = new Map();
  private propertyCache: Map<string, Property> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch quotes with all related data (Properties and Contacts)
   */
  async getFullyEnhancedQuotes(): Promise<{ success: boolean; data?: FullyEnhancedQuote[]; error?: any }> {
    try {
      logger.info('Fetching quotes with full enhancement (Properties + Contacts)');

      // Check cache validity
      if (this.isCacheExpired()) {
        this.clearCaches();
      }

      // Step 1: Fetch all quotes
      const quotesResult = await quotesAPI.list();
      if (!quotesResult.success) {
        return { success: false, error: 'Failed to fetch quotes' };
      }

      const rawQuotes = quotesResult.data || [];
      logger.info(`Fetched ${rawQuotes.length} quotes (including archived)`);

      // Step 2: Collect all unique contact and property IDs
      const contactIds = new Set<string>();
      const propertyIds = new Set<string>();
      
      rawQuotes.forEach((quote: any) => {
        // Collect contact IDs
        if (quote.agentContactId) contactIds.add(quote.agentContactId);
        if (quote.homeownerContactId) contactIds.add(quote.homeownerContactId);
        
        // Collect property IDs
        if (quote.addressId) propertyIds.add(quote.addressId);
      });

      logger.info(`Found ${contactIds.size} contact IDs and ${propertyIds.size} property IDs to resolve`);

      // Step 3: Fetch all related data in parallel
      await Promise.all([
        this.preloadContacts(Array.from(contactIds)),
        this.preloadProperties(Array.from(propertyIds))
      ]);

      // Step 4: Transform quotes with all related data
      const enhancedQuotes = rawQuotes.map((quote: any) => this.fullyEnhanceQuote(quote));

      logger.info(`Fully enhanced ${enhancedQuotes.length} quotes`);
      return { success: true, data: enhancedQuotes };

    } catch (error) {
      logger.error('Error fetching fully enhanced quotes:', error);
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
   * Enhance a quote with all related data
   */
  private fullyEnhanceQuote(rawQuote: any): FullyEnhancedQuote {
    // Get related data
    const property = rawQuote.addressId ? this.propertyCache.get(rawQuote.addressId) : null;
    const agent = rawQuote.agentContactId ? this.contactCache.get(rawQuote.agentContactId) : null;
    const homeowner = rawQuote.homeownerContactId ? this.contactCache.get(rawQuote.homeownerContactId) : null;

    // Build property address
    let propertyAddress = rawQuote.propertyAddress;
    if (!propertyAddress && property) {
      if (property.propertyFullAddress) {
        propertyAddress = property.propertyFullAddress;
      } else if (property.houseAddress) {
        // Build address from components
        const parts = [property.houseAddress, property.city, property.state, property.zip].filter(Boolean);
        propertyAddress = parts.join(', ');
      }
    }
    // Fallback to quote title if no address found
    if (!propertyAddress) {
      propertyAddress = rawQuote.title || 'No address provided';
    }

    return {
      // Core quote data
      id: rawQuote.id,
      title: rawQuote.title,
      description: rawQuote.description,
      status: rawQuote.status,
      quoteNumber: rawQuote.quoteNumber,
      totalPrice: rawQuote.totalPrice,
      totalCost: rawQuote.totalCost,
      budget: rawQuote.budget,
      projectedListingPrice: rawQuote.projectedListingPrice,
      product: rawQuote.product,
      assignedTo: rawQuote.assignedTo,
      operationManagerApproved: rawQuote.operationManagerApproved,
      underwritingApproved: rawQuote.underwritingApproved,
      signed: rawQuote.signed,
      creditScore: rawQuote.creditScore,
      estimatedWeeksDuration: rawQuote.estimatedWeeksDuration,
      
      // Resolved address
      propertyAddress,
      
      // Property data (prefer Properties table, fallback to quote data)
      propertyType: property?.propertyType || rawQuote.propertyType,
      bedrooms: property?.bedrooms ? String(property.bedrooms) : rawQuote.bedrooms,
      bathrooms: property?.bathrooms ? String(property.bathrooms) : rawQuote.bathrooms,
      sizeSqft: property?.sizeSqft ? String(property.sizeSqft) : rawQuote.sizeSqft,
      yearBuilt: property?.yearBuilt ? String(property.yearBuilt) : rawQuote.yearBuilt,
      
      // Contact data (resolved from Contacts table)
      clientName: homeowner?.fullName || (homeowner?.firstName && homeowner?.lastName ? `${homeowner.firstName} ${homeowner.lastName}` : homeowner?.firstName || homeowner?.lastName) || rawQuote.clientName || 'N/A',
      clientEmail: homeowner?.email || rawQuote.clientEmail,
      clientPhone: homeowner?.phone || homeowner?.mobile || rawQuote.clientPhone,
      agentName: agent?.fullName || (agent?.firstName && agent?.lastName ? `${agent.firstName} ${agent.lastName}` : agent?.firstName || agent?.lastName) || rawQuote.agentName || 'N/A',
      agentEmail: agent?.email,
      brokerage: agent?.brokerage || rawQuote.brokerage || 'N/A',
      
      // Dates
      requestDate: rawQuote.requestDate,
      sentDate: rawQuote.sentDate,
      openedDate: rawQuote.openedDate,
      signedDate: rawQuote.signedDate,
      expiredDate: rawQuote.expiredDate,
      validUntil: rawQuote.validUntil,
      createdAt: rawQuote.createdAt,
      updatedAt: rawQuote.updatedAt,
      businessCreatedDate: rawQuote.businessCreatedDate,
      businessUpdatedDate: rawQuote.businessUpdatedDate,
      
      // Additional fields
      officeNotes: rawQuote.officeNotes,
      requestId: rawQuote.requestId,
      projectId: rawQuote.projectId,
    };
  }

  private isCacheExpired(): boolean {
    return Date.now() - this.cacheTimestamp > this.CACHE_TTL;
  }

  /**
   * Fetch a single quote with nested relations by ID
   */
  async getQuoteByIdWithRelations(id: string): Promise<{ success: boolean; data?: FullyEnhancedQuote; error?: any }> {
    try {
      logger.info('Fetching single quote with relations', { id });
      const result = await graphqlClient.graphql({
        query: GET_QUOTE_WITH_RELATIONS,
        variables: { id }
      }) as any;

      if (result.errors) {
        logger.warn('GraphQL returned errors for GetQuoteWithRelations', result.errors);
      }

      const quote = result.data?.getQuotes;
      if (!quote) {
        return { success: false, error: 'Quote not found' };
      }

      const enhanced = this.fullyEnhanceQuoteFromRelations(quote);
      return { success: true, data: enhanced };
    } catch (error) {
      logger.error('Error fetching quote by id with relations:', error);
      return { success: false, error };
    }
  }

  /**
   * Enhance a quote with all related data using nested relations
   */
  private fullyEnhanceQuoteFromRelations(quote: any): FullyEnhancedQuote {
    // For quotes, we don't have nested address relationship, so use the quote's title as address
    let propertyAddress = quote.title || 'No address provided';

    // Contacts - matching requests pattern
    const agent = quote.agent || null;
    const homeowner = quote.homeowner || null;

    return {
      // Core quote data
      id: quote.id,
      title: quote.title,
      status: quote.status,
      quoteNumber: quote.quoteNumber,
      totalPrice: quote.totalPrice,
      totalCost: quote.totalCost,
      budget: quote.budget,
      projectedListingPrice: quote.projectedListingPrice,
      product: quote.product,
      assignedTo: quote.assignedTo,
      operationManagerApproved: quote.operationManagerApproved,
      underwritingApproved: quote.underwritingApproved,
      signed: quote.signed,
      creditScore: quote.creditScore,
      estimatedWeeksDuration: quote.estimatedWeeksDuration,
      
      // Resolved address
      propertyAddress,
      
      // Property data (use quote's own property fields since no nested address)
      bedrooms: quote.bedrooms,
      bathrooms: quote.bathrooms,
      sizeSqft: quote.sizeSqft,
      yearBuilt: quote.yearBuilt,
      
      // Contact data (resolved from nested relations)
      clientName: homeowner?.fullName || (homeowner?.firstName && homeowner?.lastName ? `${homeowner.firstName} ${homeowner.lastName}` : homeowner?.firstName || homeowner?.lastName) || 'N/A',
      clientEmail: homeowner?.email,
      clientPhone: homeowner?.phone || homeowner?.mobile,
      agentName: agent?.fullName || (agent?.firstName && agent?.lastName ? `${agent.firstName} ${agent.lastName}` : agent?.firstName || agent?.lastName) || 'N/A',
      agentEmail: agent?.email,
      brokerage: agent?.brokerage || quote.brokerage || 'N/A',
      
      // Dates
      requestDate: quote.requestDate,
      sentDate: quote.sentDate,
      openedDate: quote.openedDate,
      signedDate: quote.signedDate,
      expiredDate: quote.expiredDate,
      validUntil: quote.validUntil,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      businessCreatedDate: quote.createdAt,
      businessUpdatedDate: quote.updatedAt,
      
      // Additional fields
      officeNotes: quote.officeNotes,
      requestId: quote.requestId,
      projectId: quote.projectId,
    };
  }

  private clearCaches(): void {
    this.contactCache.clear();
    this.propertyCache.clear();
    this.cacheTimestamp = Date.now();
  }
}

// Export singleton instance
export const enhancedQuotesService = new EnhancedQuotesService();