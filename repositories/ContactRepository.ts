/**
 * Contact repository implementation
 * Handles all data operations for Contact entities
 */

import { BaseRepository } from './core/BaseRepository';
import { apiKeyClient } from './core/GraphQLClient';
import { createLogger } from '../utils/logger';

const logger = createLogger('ContactRepository');

// Contact entity types - matching actual schema
export interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  brokerage?: string;
  owner?: string;
  
  // Notification preferences
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  
  // Role Management System
  roleType?: string; // 'AE', 'PM', 'Admin', 'Customer', etc.
  isActive?: boolean; // Whether contact is active for assignments
  assignmentPriority?: number; // Priority for automatic assignment (1=highest)
  canReceiveNotifications?: boolean; // Master notification toggle
  
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactFilter {
  roleType?: string;
  email?: string;
  isActive?: boolean;
  search?: string; // Search across name, email, phone, company
}

export interface ContactCreateInput {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  brokerage?: string;
  owner?: string;
  
  // Notification preferences
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  
  // Role Management System
  roleType?: string;
  isActive?: boolean;
  assignmentPriority?: number;
  canReceiveNotifications?: boolean;
}

export class ContactRepository extends BaseRepository<Contact, ContactFilter, ContactCreateInput, Partial<Contact>> {
  
  protected modelName = 'Contacts';
  protected client = apiKeyClient;

  constructor() {
    super('Contact');
  }

  // GraphQL queries
  protected getListQuery(): string {
    return /* GraphQL */ `
      query ListContacts($filter: ModelContactsFilterInput, $limit: Int, $nextToken: String) {
        listContacts(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            id
            firstName
            lastName
            fullName
            email
            phone
            mobile
            company
            brokerage
            owner
            emailNotifications
            smsNotifications
            roleType
            isActive
            assignmentPriority
            canReceiveNotifications
            createdAt
            updatedAt
          }
          nextToken
        }
      }
    `;
  }

  protected getByIdQuery(): string {
    return /* GraphQL */ `
      query GetContact($id: ID!) {
        getContacts(id: $id) {
          id
          firstName
          lastName
          fullName
          email
          phone
          mobile
          company
          brokerage
          owner
          emailNotifications
          smsNotifications
          roleType
          isActive
          assignmentPriority
          canReceiveNotifications
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getCreateMutation(): string {
    return /* GraphQL */ `
      mutation CreateContact($input: CreateContactsInput!) {
        createContacts(input: $input) {
          id
          firstName
          lastName
          fullName
          email
          phone
          mobile
          company
          brokerage
          owner
          emailNotifications
          smsNotifications
          roleType
          isActive
          assignmentPriority
          canReceiveNotifications
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getUpdateMutation(): string {
    return /* GraphQL */ `
      mutation UpdateContact($input: UpdateContactsInput!) {
        updateContacts(input: $input) {
          id
          firstName
          lastName
          fullName
          email
          phone
          mobile
          company
          brokerage
          owner
          emailNotifications
          smsNotifications
          roleType
          isActive
          assignmentPriority
          canReceiveNotifications
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getDeleteMutation(): string {
    return /* GraphQL */ `
      mutation DeleteContact($input: DeleteContactsInput!) {
        deleteContacts(input: $input) {
          id
        }
      }
    `;
  }

  // Business logic methods
  async findByEmail(email: string) {
    return this.findOne({ email });
  }

  async findByType(roleType: string) {
    return this.findMany({ roleType });
  }

  async findAgents() {
    return this.findMany({ roleType: 'AE' });
  }

  async findHomeowners() {
    return this.findMany({ roleType: 'Customer' });
  }

  async searchContacts(searchTerm: string) {
    return this.findMany({ search: searchTerm });
  }

  async findById(id: string) {
    return super.findById(id);
  }

  async findAll(options: any = {}) {
    return super.findAll(options);
  }

  // Mapping methods
  protected mapToEntity(data: any): Contact {
    return {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      company: data.company,
      brokerage: data.brokerage,
      owner: data.owner,
      emailNotifications: data.emailNotifications,
      smsNotifications: data.smsNotifications,
      roleType: data.roleType,
      isActive: data.isActive,
      assignmentPriority: data.assignmentPriority,
      canReceiveNotifications: data.canReceiveNotifications,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  protected mapToCreateInput(data: ContactCreateInput): any {
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.firstName || data.lastName),
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      company: data.company,
      brokerage: data.brokerage,
      owner: data.owner,
      emailNotifications: data.emailNotifications !== false, // Default to true
      smsNotifications: data.smsNotifications || false, // Default to false
      roleType: data.roleType || 'Customer',
      isActive: data.isActive !== false, // Default to true
      assignmentPriority: data.assignmentPriority || 1,
      canReceiveNotifications: data.canReceiveNotifications !== false, // Default to true
    };
  }

  protected mapToUpdateInput(data: Partial<Contact>): any {
    const input: any = {};
    
    if (data.firstName !== undefined) input.firstName = data.firstName;
    if (data.lastName !== undefined) input.lastName = data.lastName;
    if (data.fullName !== undefined) input.fullName = data.fullName;
    if (data.email !== undefined) input.email = data.email;
    if (data.phone !== undefined) input.phone = data.phone;
    if (data.mobile !== undefined) input.mobile = data.mobile;
    if (data.company !== undefined) input.company = data.company;
    if (data.brokerage !== undefined) input.brokerage = data.brokerage;
    if (data.owner !== undefined) input.owner = data.owner;
    if (data.emailNotifications !== undefined) input.emailNotifications = data.emailNotifications;
    if (data.smsNotifications !== undefined) input.smsNotifications = data.smsNotifications;
    if (data.roleType !== undefined) input.roleType = data.roleType;
    if (data.isActive !== undefined) input.isActive = data.isActive;
    if (data.assignmentPriority !== undefined) input.assignmentPriority = data.assignmentPriority;
    if (data.canReceiveNotifications !== undefined) input.canReceiveNotifications = data.canReceiveNotifications;
    
    return input;
  }

  protected extractSingleResult(data: any): any {
    return data?.getContacts;
  }

  protected extractListResults(data: any): any[] {
    return data?.listContacts?.items || [];
  }

  protected extractMetadata(data: any): any {
    const listData = data?.listContacts;
    return {
      totalCount: listData?.items?.length || 0,
      nextToken: listData?.nextToken,
    };
  }

  protected buildFilterInput(filter: ContactFilter): any {
    const filterInput: any = {};
    
    if (filter.roleType) {
      filterInput.roleType = { eq: filter.roleType };
    }
    
    if (filter.email) {
      filterInput.email = { eq: filter.email };
    }
    
    if (filter.isActive !== undefined) {
      filterInput.isActive = { eq: filter.isActive };
    }
    
    // Note: Search functionality would typically require a separate search service
    // or custom GraphQL resolver for full-text search
    if (filter.search) {
      // Simple implementation - in production this would be more sophisticated
      filterInput.or = [
        { firstName: { contains: filter.search } },
        { lastName: { contains: filter.search } },
        { fullName: { contains: filter.search } },
        { email: { contains: filter.search } },
        { phone: { contains: filter.search } },
        { mobile: { contains: filter.search } },
        { company: { contains: filter.search } },
        { brokerage: { contains: filter.search } },
      ];
    }
    
    return filterInput;
  }
}

// Export singleton instance
export const contactRepository = new ContactRepository();