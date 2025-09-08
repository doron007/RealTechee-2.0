// Use a single GraphQL query with nested relations instead of multiple list calls
import { generateClient as generateGraphQLClient } from 'aws-amplify/api';
import { projectsAPI } from '../../utils/amplifyAPI';
import { createLogger } from '../../utils/logger';

const logger = createLogger('EnhancedProjectsService');

// Local GraphQL client (Amplify is already configured in utils/amplifyAPI)
const graphqlClient = generateGraphQLClient({ authMode: 'apiKey' });

// Minimal, safe selection set for Projects with nested relations
// Only fields that exist in amplify/data/resource.ts are requested to avoid validation errors
const LIST_PROJECTS_WITH_RELATIONS = /* GraphQL */ `
  query ListProjectsWithRelations($filter: ModelProjectsFilterInput, $limit: Int, $nextToken: String) {
    listProjects(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        status
        description
        image
        gallery
        createdAt
        createdDate
        updatedDate
        addressId
        agentContactId
        homeownerContactId
        homeowner2ContactId
        homeowner3ContactId
        propertyType
        bedrooms
        bathrooms
        floors
        sizeSqft
        yearBuilt
        zillowLink
        redfinLink
        originalValue
        listingPrice
        salePrice
        boostPrice
        addedValue
        grossProfit
        estimatedGrossProfit
        boosterEstimatedCost
        boosterActualCost
        paidCost
        loanBalance
        revShareAmount
        selectedProducts
        projectManagerEmailList
        projectManagerPhone
        projectAdminProjectId
        statusOrder
        visitorId
        excludeFromDashboard
        requestDate
        proposalDate
        visitReviewDate
        quoteSentDate
        quoteOpenedDate
        quoteSignedDate
        contractDate
        contractSentDate
        contractingStartDate
        underwritingDate
        officeNotes
        documents
        brokerage
        
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
        homeowner2 {
          id
          fullName
          firstName
          lastName
          email
          phone
          mobile
        }
        homeowner3 {
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

// Single project with nested relations
const GET_PROJECT_WITH_RELATIONS = /* GraphQL */ `
  query GetProjectWithRelations($id: ID!) {
    getProjects(id: $id) {
      id
      title
      status
      description
      image
      gallery
      createdAt
      createdDate
      updatedDate
      addressId
      agentContactId
      homeownerContactId
      homeowner2ContactId
      homeowner3ContactId
      propertyType
      bedrooms
      bathrooms
      floors
      sizeSqft
      yearBuilt
      zillowLink
      redfinLink
      originalValue
      listingPrice
      salePrice
      boostPrice
      addedValue
      grossProfit
      estimatedGrossProfit
      boosterEstimatedCost
      boosterActualCost
      paidCost
      loanBalance
      revShareAmount
      selectedProducts
      projectManagerEmailList
      projectManagerPhone
      projectAdminProjectId
      statusOrder
      visitorId
      excludeFromDashboard
      requestDate
      proposalDate
      visitReviewDate
      quoteSentDate
      quoteOpenedDate
      quoteSignedDate
      contractDate
      contractSentDate
      contractingStartDate
      underwritingDate
      officeNotes
      documents
      brokerage

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
      homeowner2 {
        id
        fullName
        firstName
        lastName
        email
        phone
        mobile
      }
      homeowner3 {
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
  propertyFullAddress?: string;
  houseAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  sizeSqft?: number;
  yearBuilt?: number;
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
      logger.info('Fetching projects with full enhancement via GraphQL relations');

      // Single GraphQL query with nested relations to avoid N+1 and model mismatches
      const result = await graphqlClient.graphql({
        query: LIST_PROJECTS_WITH_RELATIONS,
        variables: { limit: 2000 }
      }) as any;

      if (result.errors) {
        logger.warn('GraphQL returned errors for ListProjectsWithRelations', result.errors);
      }

      const rawItems = result.data?.listProjects?.items || [];
      const rawProjects = rawItems
        .filter((p: any) => p && p.status !== 'Archived')
        .sort((a: any, b: any) => {
          // Two-tier sorting: projects without CreatedDate first, then with CreatedDate
          const hasCreatedDateA = a.createdDate && a.createdDate.trim() !== '';
          const hasCreatedDateB = b.createdDate && b.createdDate.trim() !== '';
          
          // If one has CreatedDate and other doesn't, prioritize the one without
          if (!hasCreatedDateA && hasCreatedDateB) return -1; // a (no CreatedDate) comes first
          if (hasCreatedDateA && !hasCreatedDateB) return 1;  // b (no CreatedDate) comes first
          
          // Both in same tier, sort by appropriate date DESC
          if (!hasCreatedDateA && !hasCreatedDateB) {
            // Both have no CreatedDate - sort by CreatedAt DESC
            const dateA = a.createdAt;
            const dateB = b.createdAt;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;  // b comes first
            if (!dateB) return -1; // a comes first
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          } else {
            // Both have CreatedDate - sort by CreatedDate DESC
            const dateA = a.createdDate;
            const dateB = b.createdDate;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;  // b comes first
            if (!dateB) return -1; // a comes first
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          }
        });
      
      logger.info(`Fetched ${rawProjects.length} active projects`);

      // Directly map each project using nested address/contacts
      const enhancedProjects = rawProjects.map((project: any) => this.fullyEnhanceProjectFromRelations(project));

      logger.info(`Fully enhanced ${enhancedProjects.length} projects`);
      return { success: true, data: enhancedProjects };

    } catch (error) {
      logger.error('Error fetching fully enhanced projects:', error);
      return { success: false, error };
    }
  }

  /**
   * Fetch a single project with nested relations by ID
   */
  async getProjectByIdWithRelations(id: string): Promise<{ success: boolean; data?: FullyEnhancedProject; error?: any }> {
    try {
      logger.info('Fetching single project with relations', { id });
      const result = await graphqlClient.graphql({
        query: GET_PROJECT_WITH_RELATIONS,
        variables: { id }
      }) as any;

      if (result.errors) {
        logger.warn('GraphQL returned errors for GetProjectWithRelations', result.errors);
      }

      const proj = result.data?.getProjects;
      if (!proj) {
        return { success: false, error: 'Project not found' };
      }

      const enhanced = this.fullyEnhanceProjectFromRelations(proj);
      return { success: true, data: enhanced };
    } catch (error) {
      logger.error('Error fetching project by id with relations:', error);
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

    // Build property address from Properties table
    let propertyAddress = rawProject.propertyAddress; // Fallback to existing field
    if (property) {
      if (property.propertyFullAddress) {
        propertyAddress = property.propertyFullAddress;
      } else if (property.houseAddress) {
        // Build address from components
        const parts = [property.houseAddress, property.city, property.state, property.zip].filter(Boolean);
        propertyAddress = parts.join(', ');
      }
    }
    // Final fallback to project title if no address found
    if (!propertyAddress) {
      propertyAddress = rawProject.title || 'No address provided';
    }

    return {
      // Core project data
      id: rawProject.id,
      title: rawProject.title,
      status: rawProject.status,
      propertyAddress, // Use resolved address from Properties table
      description: rawProject.description,
      image: rawProject.image,
      gallery: rawProject.gallery,
      createdAt: rawProject.createdAt,
      createdDate: rawProject.createdDate,
      updatedDate: rawProject.updatedDate,
      
      // Property data (prefer Properties table, fallback to project data)
      propertyType: property?.propertyType || rawProject.propertyType,
      bedrooms: property?.bedrooms ? String(property.bedrooms) : (rawProject.bedrooms ? String(rawProject.bedrooms) : undefined),
      bathrooms: property?.bathrooms ? String(property.bathrooms) : (rawProject.bathrooms ? String(rawProject.bathrooms) : undefined),
      floors: property?.floors ? String(property.floors) : (rawProject.floors ? String(rawProject.floors) : undefined),
      sizeSqft: property?.sizeSqft ? String(property.sizeSqft) : (rawProject.sizeSqft ? String(rawProject.sizeSqft) : undefined),
      yearBuilt: property?.yearBuilt ? String(property.yearBuilt) : (rawProject.yearBuilt ? String(rawProject.yearBuilt) : undefined),
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

  /**
   * Enhance a project using nested GraphQL relations already present on the object
   */
  private fullyEnhanceProjectFromRelations(project: any): FullyEnhancedProject {
    // Build property address
    const addr = project.address || null;
    let propertyAddress = project.propertyAddress;
    if (addr) {
      if (addr.propertyFullAddress) {
        propertyAddress = addr.propertyFullAddress;
      } else if (addr.houseAddress) {
        const parts = [addr.houseAddress, addr.city, addr.state, addr.zip].filter(Boolean);
        propertyAddress = parts.join(', ');
      }
    }
    if (!propertyAddress) propertyAddress = project.title || 'No address provided';

    // Contacts
    const agent = project.agent || null;
    const homeowner = project.homeowner || null;
    const homeowner2 = project.homeowner2 || null;
    const homeowner3 = project.homeowner3 || null;

    return {
      id: project.id,
      title: project.title,
      status: project.status,
      propertyAddress,
      description: project.description,
      image: project.image,
      gallery: project.gallery,
      createdAt: project.createdAt,
      createdDate: project.createdDate,
      updatedDate: project.updatedDate,

      // Prefer nested property values; fallback to top-level scalars
      propertyType: addr?.propertyType || project.propertyType,
      bedrooms: addr?.bedrooms ? String(addr.bedrooms) : (project.bedrooms ? String(project.bedrooms) : undefined),
      bathrooms: addr?.bathrooms ? String(addr.bathrooms) : (project.bathrooms ? String(project.bathrooms) : undefined),
      floors: addr?.floors ? String(addr.floors) : (project.floors ? String(project.floors) : undefined),
      sizeSqft: addr?.sizeSqft ? String(addr.sizeSqft) : (project.sizeSqft ? String(project.sizeSqft) : undefined),
      yearBuilt: addr?.yearBuilt ? String(addr.yearBuilt) : (project.yearBuilt ? String(project.yearBuilt) : undefined),
      zillowLink: addr?.zillowLink || project.zillowLink,
      redfinLink: addr?.redfinLink || project.redfinLink,

      originalValue: project.originalValue,
      listingPrice: project.listingPrice,
      salePrice: project.salePrice,
      boostPrice: project.boostPrice,
      addedValue: project.addedValue,
      grossProfit: project.grossProfit,
      estimatedGrossProfit: project.estimatedGrossProfit,
      boosterEstimatedCost: project.boosterEstimatedCost,
      boosterActualCost: project.boosterActualCost,
      paidCost: project.paidCost,
      loanBalance: project.loanBalance,
      revShareAmount: project.revShareAmount,

      clientName: homeowner?.fullName || (homeowner?.firstName && homeowner?.lastName ? `${homeowner.firstName} ${homeowner.lastName}` : homeowner?.firstName || homeowner?.lastName) || 'N/A',
      clientEmail: homeowner?.email,
      clientPhone: homeowner?.phone || homeowner?.mobile,
      homeownerName: homeowner?.fullName || (homeowner?.firstName && homeowner?.lastName ? `${homeowner.firstName} ${homeowner.lastName}` : homeowner?.firstName || homeowner?.lastName),
      homeowner2Name: homeowner2?.fullName || (homeowner2?.firstName && homeowner2?.lastName ? `${homeowner2.firstName} ${homeowner2.lastName}` : homeowner2?.firstName || homeowner2?.lastName),
      homeowner3Name: homeowner3?.fullName || (homeowner3?.firstName && homeowner3?.lastName ? `${homeowner3.firstName} ${homeowner3.lastName}` : homeowner3?.firstName || homeowner3?.lastName),
      agentName: agent?.fullName || (agent?.firstName && agent?.lastName ? `${agent.firstName} ${agent.lastName}` : agent?.firstName || agent?.lastName),
      agentEmail: agent?.email,
      agentPhone: agent?.phone || agent?.mobile,
      brokerage: agent?.brokerage || project.brokerage,

      selectedProducts: project.selectedProducts,
      projectManagerEmailList: project.projectManagerEmailList,
      projectManagerPhone: project.projectManagerPhone,
      projectAdminProjectId: project.projectAdminProjectId,
      statusOrder: project.statusOrder,
      visitorId: project.visitorId,
      excludeFromDashboard: project.excludeFromDashboard,

      requestDate: project.requestDate,
      proposalDate: project.proposalDate,
      visitReviewDate: project.visitReviewDate,
      quoteSentDate: project.quoteSentDate,
      quoteOpenedDate: project.quoteOpenedDate,
      quoteSignedDate: project.quoteSignedDate,
      contractDate: project.contractDate,
      contractSentDate: project.contractSentDate,
      contractingStartDate: project.contractingStartDate,
      underwritingDate: project.underwritingDate,

      officeNotes: project.officeNotes,
      documents: project.documents,
    };
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, updates: Partial<FullyEnhancedProject>): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info(`Updating project ${projectId}`, updates);
      
      const result = await projectsAPI.update(projectId, updates);
      
      if (result.success) {
        // Clear caches to ensure fresh data on next fetch
        this.clearCaches();
        logger.info(`Successfully updated project ${projectId}`);
        return { success: true, data: result.data };
      } else {
        return { 
          success: false, 
          error: typeof result.error === 'string' ? result.error : 'Unknown error' 
        };
      }
    } catch (error) {
      logger.error(`Failed to update project ${projectId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
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