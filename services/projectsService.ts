import { projectsAPI, contactsAPI } from '../utils/amplifyAPI';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProjectsService');

// Enhanced Project interface with resolved contact information
export interface EnhancedProject {
  id: string;
  title?: string;
  status: string;
  propertyAddress?: string;
  propertyType?: string;
  estimatedValue?: number;
  projectType?: string;
  brokerage?: string;
  businessCreatedDate?: string;
  createdAt?: string;
  createdDate?: string;
  
  // Resolved contact information
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  agentBrokerage?: string;
  
  // Additional homeowners (if any)
  homeowner2Name?: string;
  homeowner3Name?: string;
  
  // Raw contact IDs (for reference)
  agentContactId?: string;
  homeownerContactId?: string;
  homeowner2ContactId?: string;
  homeowner3ContactId?: string;
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

interface RawProject {
  id: string;
  title?: string;
  status: string;
  propertyAddress?: string;
  propertyType?: string;
  estimatedValue?: number;
  projectType?: string;
  brokerage?: string;
  businessCreatedDate?: string;
  createdAt?: string;
  createdDate?: string;
  agentContactId?: string;
  homeownerContactId?: string;
  homeowner2ContactId?: string;
  homeowner3ContactId?: string;
  [key: string]: any;
}

/**
 * Business logic service for managing projects with contact resolution
 */
export class ProjectsService {
  private contactCache: Map<string, Contact> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000; // Limit cache size

  /**
   * Fetch all projects with resolved contact information
   * @param options - Optional parameters for pagination and filtering
   */
  async getEnhancedProjects(options?: {
    limit?: number;
    offset?: number;
    includeArchived?: boolean;
  }): Promise<{ success: boolean; data?: EnhancedProject[]; total?: number; error?: any }> {
    try {
      logger.info('Fetching projects with contact resolution');

      // Check cache validity
      if (this.isCacheExpired()) {
        this.clearCache();
      }

      // Step 1: Fetch all projects
      const projectsResult = await projectsAPI.list();
      if (!projectsResult.success) {
        return { success: false, error: 'Failed to fetch projects' };
      }

      let rawProjects: RawProject[] = projectsResult.data;
      
      // Filter archived projects unless explicitly requested
      if (!options?.includeArchived) {
        rawProjects = rawProjects.filter(project => project.status !== 'Archived');
      }

      logger.info(`Fetched ${rawProjects.length} projects (filtered: ${!options?.includeArchived})`);

      // Step 2: Collect all unique contact IDs
      const contactIds = new Set<string>();
      rawProjects.forEach(project => {
        if (project.agentContactId) contactIds.add(project.agentContactId);
        if (project.homeownerContactId) contactIds.add(project.homeownerContactId);
        if (project.homeowner2ContactId) contactIds.add(project.homeowner2ContactId);
        if (project.homeowner3ContactId) contactIds.add(project.homeowner3ContactId);
      });

      logger.info(`Found ${contactIds.size} unique contact IDs to resolve`);

      // Step 3: Fetch all contacts in batch
      await this.preloadContacts(Array.from(contactIds));

      // Step 4: Transform projects with resolved contact information
      const enhancedProjects = await Promise.all(
        rawProjects.map(project => this.enhanceProject(project))
      );

      // Apply pagination if requested
      const total = enhancedProjects.length;
      let paginatedProjects = enhancedProjects;
      
      if (options?.limit) {
        const start = options.offset || 0;
        paginatedProjects = enhancedProjects.slice(start, start + options.limit);
      }

      logger.info(`Enhanced ${enhancedProjects.length} projects, returning ${paginatedProjects.length}`);

      return { success: true, data: paginatedProjects, total };

    } catch (error) {
      logger.error('Error fetching enhanced projects:', error);
      return { success: false, error };
    }
  }

  /**
   * Check if cache has expired
   */
  private isCacheExpired(): boolean {
    return Date.now() - this.cacheTimestamp > this.CACHE_TTL;
  }

  /**
   * Enforce cache size limit using LRU eviction
   */
  private enforceCacheLimit(): void {
    if (this.contactCache.size > this.MAX_CACHE_SIZE) {
      const keysToRemove = Array.from(this.contactCache.keys()).slice(0, 
        this.contactCache.size - this.MAX_CACHE_SIZE + 100
      );
      keysToRemove.forEach(key => this.contactCache.delete(key));
      logger.info(`Evicted ${keysToRemove.length} contacts from cache`);
    }
  }

  /**
   * Preload contacts into cache for efficient lookup
   */
  private async preloadContacts(contactIds: string[]): Promise<void> {
    try {
      // Fetch contacts that aren't already cached
      const uncachedIds = contactIds.filter(id => !this.contactCache.has(id));
      
      if (uncachedIds.length === 0) {
        logger.info('All contacts already cached');
        return;
      }

      logger.info(`Fetching ${uncachedIds.length} contacts from API`);

      // Fetch all contacts (since we don't have a batch get method)
      const contactsResult = await contactsAPI.list();
      if (contactsResult.success) {
        const allContacts: Contact[] = contactsResult.data;
        
        // Cache contacts we need
        allContacts.forEach(contact => {
          if (uncachedIds.includes(contact.id)) {
            this.contactCache.set(contact.id, contact);
          }
        });

        this.cacheTimestamp = Date.now();
        this.enforceCacheLimit();
        logger.info(`Cached ${uncachedIds.length} contacts`);
      } else {
        logger.warn('Failed to fetch contacts for caching');
      }
    } catch (error) {
      logger.error('Error preloading contacts:', error);
    }
  }

  /**
   * Enhance a single project with contact information
   */
  private async enhanceProject(project: RawProject): Promise<EnhancedProject> {
    const enhanced: EnhancedProject = {
      // Copy all basic project properties
      id: project.id,
      title: project.title,
      status: project.status,
      propertyAddress: project.propertyAddress,
      propertyType: project.propertyType,
      estimatedValue: project.estimatedValue,
      projectType: project.projectType,
      brokerage: project.brokerage,
      businessCreatedDate: project.businessCreatedDate,
      createdAt: project.createdAt,
      createdDate: project.createdDate,
      
      // Store raw contact IDs for reference
      agentContactId: project.agentContactId,
      homeownerContactId: project.homeownerContactId,
      homeowner2ContactId: project.homeowner2ContactId,
      homeowner3ContactId: project.homeowner3ContactId,
    };

    // Resolve agent contact
    if (project.agentContactId) {
      const agent = this.contactCache.get(project.agentContactId);
      if (agent) {
        enhanced.agentName = this.formatContactName(agent);
        enhanced.agentEmail = agent.email;
        enhanced.agentPhone = agent.phone || agent.mobile;
        enhanced.agentBrokerage = agent.brokerage;
      }
    }

    // Resolve homeowner contact
    if (project.homeownerContactId) {
      const homeowner = this.contactCache.get(project.homeownerContactId);
      if (homeowner) {
        enhanced.clientName = this.formatContactName(homeowner);
        enhanced.clientEmail = homeowner.email;
        enhanced.clientPhone = homeowner.phone || homeowner.mobile;
      }
    }

    // Resolve additional homeowners
    if (project.homeowner2ContactId) {
      const homeowner2 = this.contactCache.get(project.homeowner2ContactId);
      if (homeowner2) {
        enhanced.homeowner2Name = this.formatContactName(homeowner2);
      }
    }

    if (project.homeowner3ContactId) {
      const homeowner3 = this.contactCache.get(project.homeowner3ContactId);
      if (homeowner3) {
        enhanced.homeowner3Name = this.formatContactName(homeowner3);
      }
    }

    return enhanced;
  }

  /**
   * Format contact name consistently
   */
  private formatContactName(contact: Contact): string {
    if (contact.fullName) {
      return contact.fullName;
    }
    
    if (contact.firstName || contact.lastName) {
      return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    }
    
    if (contact.company) {
      return contact.company;
    }
    
    return 'Unknown Contact';
  }

  /**
   * Clear contact cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.contactCache.clear();
    this.cacheTimestamp = 0;
    logger.info('Contact cache cleared');
  }

  /**
   * Get cache stats (for debugging)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.contactCache.size,
      keys: Array.from(this.contactCache.keys())
    };
  }
}

// Export singleton instance
export const projectsService = new ProjectsService();