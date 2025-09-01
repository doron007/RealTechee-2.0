/**
 * Contact Repository Implementation
 * Example implementation showing how to use the BaseRepository pattern
 */

import { BaseRepository, GraphQLClient, ValidationError } from './base';
import { BaseModel, ServiceResult } from './base/types';

/**
 * Contact model interface extending BaseModel
 */
export interface Contact extends BaseModel {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  brokerage?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  roleType?: string;
  isActive?: boolean;
  assignmentPriority?: number;
  canReceiveNotifications?: boolean;
  owner?: string;
}

/**
 * Contact Repository with GraphQL isolation
 * Demonstrates proper usage of BaseRepository pattern
 */
export class ContactRepository extends BaseRepository<Contact> {
  
  constructor(client: GraphQLClient) {
    super(client, {
      modelName: 'Contact',
      graphqlTypeName: 'Contacts', // Note: matches the GraphQL schema type name
      defaultAuthMode: 'apiKey',
      enableValidation: true,
      enableAuditLog: true,
      defaultPageSize: 20,
      maxPageSize: 100
    });
  }

  /**
   * GraphQL Mutations and Queries
   * These isolate the GraphQL operations from the business logic
   */
  
  protected getCreateMutation(): string {
    return `
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
          emailNotifications
          smsNotifications
          roleType
          isActive
          assignmentPriority
          canReceiveNotifications
          owner
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getUpdateMutation(): string {
    return `
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
          emailNotifications
          smsNotifications
          roleType
          isActive
          assignmentPriority
          canReceiveNotifications
          owner
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getDeleteMutation(): string {
    return `
      mutation DeleteContact($input: DeleteContactsInput!) {
        deleteContacts(input: $input) {
          id
        }
      }
    `;
  }

  protected getGetQuery(): string {
    return `
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
          emailNotifications
          smsNotifications
          roleType
          isActive
          assignmentPriority
          canReceiveNotifications
          owner
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getListQuery(): string {
    return `
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
            emailNotifications
            smsNotifications
            roleType
            isActive
            assignmentPriority
            canReceiveNotifications
            owner
            createdAt
            updatedAt
          }
          nextToken
        }
      }
    `;
  }

  protected getCountQuery(): string {
    return `
      query CountContacts($filter: ModelContactsFilterInput) {
        listContacts(filter: $filter, limit: 1000) {
          items {
            id
          }
        }
      }
    `;
  }

  /**
   * Enhanced validation for Contact-specific business rules
   */
  protected async validateCreate(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await super.validateCreate(data);

    const errors: Array<{ field: string; message: string }> = [];

    // Email validation
    if (!data.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    // Name validation - require at least firstName or fullName
    if (!data.firstName && !data.fullName) {
      errors.push({ field: 'firstName', message: 'First name or full name is required' });
    }

    // Phone validation
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
    }

    if (data.mobile && !this.isValidPhone(data.mobile)) {
      errors.push({ field: 'mobile', message: 'Please enter a valid mobile number' });
    }

    // Role validation
    if (data.roleType && !this.isValidRoleType(data.roleType)) {
      errors.push({ field: 'roleType', message: 'Invalid role type' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Contact validation failed', errors);
    }
  }

  protected async validateUpdate(id: string, data: Partial<Omit<Contact, 'id' | 'createdAt'>>): Promise<void> {
    await super.validateUpdate(id, data);

    const errors: Array<{ field: string; message: string }> = [];

    // Email validation (if provided)
    if (data.email !== undefined) {
      if (!data.email) {
        errors.push({ field: 'email', message: 'Email cannot be empty' });
      } else if (!this.isValidEmail(data.email)) {
        errors.push({ field: 'email', message: 'Please enter a valid email address' });
      }
    }

    // Phone validation (if provided)
    if (data.phone !== undefined && data.phone && !this.isValidPhone(data.phone)) {
      errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
    }

    if (data.mobile !== undefined && data.mobile && !this.isValidPhone(data.mobile)) {
      errors.push({ field: 'mobile', message: 'Please enter a valid mobile number' });
    }

    // Role validation (if provided)
    if (data.roleType !== undefined && data.roleType && !this.isValidRoleType(data.roleType)) {
      errors.push({ field: 'roleType', message: 'Invalid role type' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Contact update validation failed', errors);
    }
  }

  /**
   * Transform input data to ensure consistency
   */
  protected transformCreateInput(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Record<string, any> {
    const transformed = { ...data };

    // Auto-generate fullName if not provided
    if (!transformed.fullName && (transformed.firstName || transformed.lastName)) {
      transformed.fullName = [transformed.firstName, transformed.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
    }

    // Set default values
    if (transformed.emailNotifications === undefined) {
      transformed.emailNotifications = true;
    }

    if (transformed.smsNotifications === undefined) {
      transformed.smsNotifications = false;
    }

    if (transformed.isActive === undefined) {
      transformed.isActive = true;
    }

    if (transformed.canReceiveNotifications === undefined) {
      transformed.canReceiveNotifications = true;
    }

    if (transformed.assignmentPriority === undefined) {
      transformed.assignmentPriority = 1;
    }

    // Normalize email to lowercase
    if (transformed.email) {
      transformed.email = transformed.email.toLowerCase().trim();
    }

    // Clean up phone numbers
    if (transformed.phone) {
      transformed.phone = this.cleanPhoneNumber(transformed.phone);
    }

    if (transformed.mobile) {
      transformed.mobile = this.cleanPhoneNumber(transformed.mobile);
    }

    return transformed;
  }

  protected transformUpdateInput(data: Partial<Omit<Contact, 'id' | 'createdAt'>>): Record<string, any> {
    const transformed = { ...data };

    // Auto-update fullName if firstName or lastName changed
    if (transformed.firstName !== undefined || transformed.lastName !== undefined) {
      // Note: In a real implementation, you might want to fetch current values
      // This is simplified for example purposes
      if (transformed.firstName || transformed.lastName) {
        transformed.fullName = [transformed.firstName, transformed.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
      }
    }

    // Normalize email if provided
    if (transformed.email !== undefined && transformed.email) {
      transformed.email = transformed.email.toLowerCase().trim();
    }

    // Clean up phone numbers if provided
    if (transformed.phone !== undefined && transformed.phone) {
      transformed.phone = this.cleanPhoneNumber(transformed.phone);
    }

    if (transformed.mobile !== undefined && transformed.mobile) {
      transformed.mobile = this.cleanPhoneNumber(transformed.mobile);
    }

    return transformed;
  }

  /**
   * Business Logic Methods
   * These methods provide Contact-specific functionality
   */

  /**
   * Find contacts by email (case-insensitive)
   */
  async findByEmail(email: string): Promise<ServiceResult<Contact[]>> {
    return this.find({
      email: { eq: email.toLowerCase().trim() }
    });
  }

  /**
   * Find active contacts by role type
   */
  async findActiveByRole(roleType: string): Promise<ServiceResult<Contact[]>> {
    return this.find({
      and: [
        { roleType: { eq: roleType } },
        { isActive: { eq: true } }
      ]
    }, {
      sort: { field: 'assignmentPriority', direction: 'asc' }
    });
  }

  /**
   * Find contacts available for notifications
   */
  async findAvailableForNotifications(): Promise<ServiceResult<Contact[]>> {
    return this.find({
      and: [
        { isActive: { eq: true } },
        { canReceiveNotifications: { eq: true } }
      ]
    });
  }

  /**
   * Update notification preferences for a contact
   */
  async updateNotificationPreferences(
    id: string, 
    preferences: {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      canReceiveNotifications?: boolean;
    }
  ): Promise<ServiceResult<Contact>> {
    return this.update({
      id,
      data: preferences
    });
  }

  /**
   * Deactivate a contact (soft delete)
   */
  async deactivate(id: string, reason?: string): Promise<ServiceResult<Contact>> {
    return this.update({
      id,
      data: {
        isActive: false,
        canReceiveNotifications: false
      },
      audit: {
        source: 'contact_deactivation',
        metadata: { reason }
      }
    });
  }

  /**
   * Reactivate a contact
   */
  async reactivate(id: string): Promise<ServiceResult<Contact>> {
    return this.update({
      id,
      data: {
        isActive: true,
        canReceiveNotifications: true
      },
      audit: {
        source: 'contact_reactivation'
      }
    });
  }

  /**
   * Private helper methods for validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - accepts various formats
    const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)\.]{8,}$/;
    return phoneRegex.test(phone);
  }

  private isValidRoleType(roleType: string): boolean {
    const validRoles = ['AE', 'PM', 'Admin', 'Customer', 'Agent', 'Homeowner'];
    return validRoles.includes(roleType);
  }

  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    return phone.replace(/[^\d\+]/g, '');
  }
}