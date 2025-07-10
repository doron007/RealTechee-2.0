import { projectsAPI, contactsAPI } from '../utils/amplifyAPI';
import { createLogger } from '../utils/logger';

const logger = createLogger('EnhancedProjectsService');

// Enhanced project interface with all related data
export interface FullyEnhancedProject {
  // Core project data
  id: string;
  title?: string;
  status: string;
  propertyAddress?: string; // For backward compatibility
  description?: string;
  image?: string;
  gallery?: string;
  createdAt?: string; // For backward compatibility
  createdDate?: string;
  updatedDate?: string;
  
  // Property data (from Properties table)
  propertyType?: string;
  bedrooms?: string; // Keep as string for compatibility
  bathrooms?: string; // Keep as string for compatibility
  floors?: string; // Keep as string for compatibility
  sizeSqft?: string; // Keep as string for compatibility
  yearBuilt?: string; // Keep as string for compatibility
  zillowLink?: string;
  redfinLink?: string;
  
  // Financial data
  originalValue?: number;
  listingPrice?: number;
  salePrice?: number;
  boostPrice?: number;
  addedValue?: number;
  grossProfit?: string;
  estimatedGrossProfit?: string;
  boosterEstimatedCost?: number;
  boosterActualCost?: number;
  paidCost?: string;
  loanBalance?: string;
  revShareAmount?: number;
  
  // Contact data (resolved from Contacts table)
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  homeownerName?: string;
  homeowner2Name?: string;
  homeowner3Name?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  brokerage?: string;
  
  // Project management
  selectedProducts?: string;
  projectManagerEmailList?: string;
  projectManagerPhone?: string;
  projectAdminProjectId?: string;
  statusOrder?: string;
  visitorId?: string;
  excludeFromDashboard?: boolean;
  
  // Dates
  requestDate?: string;
  proposalDate?: string;
  visitReviewDate?: string;
  quoteSentDate?: string;
  quoteOpenedDate?: string;
  quoteSignedDate?: string;
  contractDate?: string;
  contractSentDate?: string;
  contractingStartDate?: string;
  underwritingDate?: string;
  
  // Additional fields
  officeNotes?: string;
  documents?: string;
}

interface Property {
  id: string;
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  floors?: string;
  sizeSqft?: string;
  yearBuilt?: string;
  zillowLink?: string;
  redfinLink?: string;
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
 * Enhanced service that fetches projects with full related data
 */
export class EnhancedProjectsService {
  private contactCache: Map<string, Contact> = new Map();
  private propertyCache: Map<string, Property> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch projects with all related data (Properties and Contacts)
   */
  async getFullyEnhancedProjects(): Promise<{ success: boolean; data?: FullyEnhancedProject[]; error?: any }> {
    try {
      logger.info('Fetching projects with full enhancement (Properties + Contacts)');

      // Check cache validity
      if (this.isCacheExpired()) {
        this.clearCaches();
      }

      // Step 1: Fetch all projects
      const projectsResult = await projectsAPI.list();
      if (!projectsResult.success) {
        return { success: false, error: 'Failed to fetch projects' };
      }

      const rawProjects = projectsResult.data.filter((project: any) => project.status !== 'Archived');
      logger.info(`Fetched ${rawProjects.length} active projects`);

      // Step 2: Collect all unique contact and property IDs
      const contactIds = new Set<string>();
      const propertyIds = new Set<string>();
      
      rawProjects.forEach((project: any) => {
        // Collect contact IDs
        if (project.agentContactId) contactIds.add(project.agentContactId);
        if (project.homeownerContactId) contactIds.add(project.homeownerContactId);
        if (project.homeowner2ContactId) contactIds.add(project.homeowner2ContactId);
        if (project.homeowner3ContactId) contactIds.add(project.homeowner3ContactId);
        
        // Collect property IDs
        if (project.addressId) propertyIds.add(project.addressId);
      });

      logger.info(`Found ${contactIds.size} contact IDs and ${propertyIds.size} property IDs to resolve`);

      // Step 3: Fetch all related data in parallel
      await Promise.all([
        this.preloadContacts(Array.from(contactIds)),
        this.preloadProperties(Array.from(propertyIds))
      ]);

      // Step 4: Transform projects with all related data
      const enhancedProjects = rawProjects.map((project: any) => this.fullyEnhanceProject(project));

      logger.info(`Fully enhanced ${enhancedProjects.length} projects`);
      return { success: true, data: enhancedProjects };

    } catch (error) {
      logger.error('Error fetching fully enhanced projects:', error);
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
      
      // Note: You'll need to implement propertiesAPI similar to contactsAPI
      // For now, we'll use a placeholder that imports from amplifyAPI
      const { propertiesAPI } = await import('../utils/amplifyAPI');
      const propertiesResult = await propertiesAPI.list();
      
      if (propertiesResult.success) {
        propertiesResult.data.forEach((property: Property) => {
          if (uncachedIds.includes(property.id)) {
            this.propertyCache.set(property.id, property);
          }
        });
      }
    } catch (error) {
      logger.warn('Properties API not available, using project data only:', error);
    }
  }

  /**
   * Enhance a project with all related data
   */
  private fullyEnhanceProject(rawProject: any): FullyEnhancedProject {
    // Get related data
    const property = rawProject.addressId ? this.propertyCache.get(rawProject.addressId) : null;
    const homeowner = rawProject.homeownerContactId ? this.contactCache.get(rawProject.homeownerContactId) : null;
    const homeowner2 = rawProject.homeowner2ContactId ? this.contactCache.get(rawProject.homeowner2ContactId) : null;
    const homeowner3 = rawProject.homeowner3ContactId ? this.contactCache.get(rawProject.homeowner3ContactId) : null;
    const agent = rawProject.agentContactId ? this.contactCache.get(rawProject.agentContactId) : null;

    return {
      // Core project data
      id: rawProject.id,
      title: rawProject.title,
      status: rawProject.status,
      propertyAddress: rawProject.title, // Use title as address for compatibility
      description: rawProject.description,
      image: rawProject.image,
      gallery: rawProject.gallery,
      createdAt: rawProject.createdAt,
      createdDate: rawProject.createdDate,
      updatedDate: rawProject.updatedDate,
      
      // Property data (prefer Properties table, fallback to project data)
      propertyType: property?.propertyType || rawProject.propertyType,
      bedrooms: property?.bedrooms || (rawProject.bedrooms ? String(rawProject.bedrooms) : undefined),
      bathrooms: property?.bathrooms || (rawProject.bathrooms ? String(rawProject.bathrooms) : undefined),
      floors: property?.floors || (rawProject.floors ? String(rawProject.floors) : undefined),
      sizeSqft: property?.sizeSqft || (rawProject.sizeSqft ? String(rawProject.sizeSqft) : undefined),
      yearBuilt: property?.yearBuilt || (rawProject.yearBuilt ? String(rawProject.yearBuilt) : undefined),
      zillowLink: property?.zillowLink || rawProject.zillowLink,
      redfinLink: property?.redfinLink || rawProject.redfinLink,
      
      // Financial data
      originalValue: rawProject.originalValue,
      listingPrice: rawProject.listingPrice,
      salePrice: rawProject.salePrice,
      boostPrice: rawProject.boostPrice,
      addedValue: rawProject.addedValue,
      grossProfit: rawProject.grossProfit,
      estimatedGrossProfit: rawProject.estimatedGrossProfit,
      boosterEstimatedCost: rawProject.boosterEstimatedCost,
      boosterActualCost: rawProject.boosterActualCost,
      paidCost: rawProject.paidCost,
      loanBalance: rawProject.loanBalance,
      revShareAmount: rawProject.revShareAmount,
      
      // Contact data (resolved from Contacts table)
      clientName: homeowner?.fullName || (homeowner?.firstName && homeowner?.lastName ? `${homeowner.firstName} ${homeowner.lastName}` : homeowner?.firstName || homeowner?.lastName) || 'N/A',
      clientEmail: homeowner?.email,
      clientPhone: homeowner?.phone || homeowner?.mobile,
      homeownerName: homeowner?.fullName || (homeowner?.firstName && homeowner?.lastName ? `${homeowner.firstName} ${homeowner.lastName}` : homeowner?.firstName || homeowner?.lastName),
      homeowner2Name: homeowner2?.fullName || (homeowner2?.firstName && homeowner2?.lastName ? `${homeowner2.firstName} ${homeowner2.lastName}` : homeowner2?.firstName || homeowner2?.lastName),
      homeowner3Name: homeowner3?.fullName || (homeowner3?.firstName && homeowner3?.lastName ? `${homeowner3.firstName} ${homeowner3.lastName}` : homeowner3?.firstName || homeowner3?.lastName),
      agentName: agent?.fullName || (agent?.firstName && agent?.lastName ? `${agent.firstName} ${agent.lastName}` : agent?.firstName || agent?.lastName),
      agentEmail: agent?.email,
      agentPhone: agent?.phone || agent?.mobile,
      brokerage: agent?.brokerage || rawProject.brokerage,
      
      // Project management
      selectedProducts: rawProject.selectedProducts,
      projectManagerEmailList: rawProject.projectManagerEmailList,
      projectManagerPhone: rawProject.projectManagerPhone,
      projectAdminProjectId: rawProject.projectAdminProjectId,
      statusOrder: rawProject.statusOrder,
      visitorId: rawProject.visitorId,
      excludeFromDashboard: rawProject.excludeFromDashboard,
      
      // Dates
      requestDate: rawProject.requestDate,
      proposalDate: rawProject.proposalDate,
      visitReviewDate: rawProject.visitReviewDate,
      quoteSentDate: rawProject.quoteSentDate,
      quoteOpenedDate: rawProject.quoteOpenedDate,
      quoteSignedDate: rawProject.quoteSignedDate,
      contractDate: rawProject.contractDate,
      contractSentDate: rawProject.contractSentDate,
      contractingStartDate: rawProject.contractingStartDate,
      underwritingDate: rawProject.underwritingDate,
      
      // Additional fields
      officeNotes: rawProject.officeNotes,
      documents: rawProject.documents,
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
export const enhancedProjectsService = new EnhancedProjectsService();