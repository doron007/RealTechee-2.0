/**
 * Request repository implementation
 * Handles all data operations for Request entities
 */

import { BaseRepository } from './core/BaseRepository';
import { IRepositoryWithRelations } from './interfaces/IBaseRepository';
import { apiKeyClient } from './core/GraphQLClient';
import { createLogger } from '../utils/logger';

const logger = createLogger('RequestRepository');

// Request entity types
export interface Request {
  id: string;
  status: string;
  statusImage?: string;
  statusOrder?: number;
  accountExecutive?: string;
  product?: string;
  assignedTo?: string;
  assignedDate?: string;
  message?: string;
  relationToProperty?: string;
  virtualWalkthrough?: string;
  uploadedMedia?: string;
  uplodedDocuments?: string; // Note: typo in schema
  uploadedVideos?: string;
  rtDigitalSelection?: string;
  leadSource?: string;
  needFinance?: boolean;
  leadFromSync?: string;
  leadFromVenturaStone?: string;
  officeNotes?: string;
  archived?: string;
  bookingId?: string;
  requestedSlot?: string;
  requestedVisitDateTime?: string;
  visitorId?: string;
  visitDate?: string;
  moveToQuotingDate?: string;
  expiredDate?: string;
  archivedDate?: string;
  budget?: string;
  owner?: string;
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;
  
  // Enhanced Case Management Fields
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  source?: string;
  tags?: any[];
  estimatedValue?: number;
  followUpDate?: string;
  lastContactDate?: string;
  clientResponseDate?: string;
  informationGatheringStatus?: 'pending' | 'in_progress' | 'completed';
  scopeDefinitionStatus?: 'not_started' | 'in_progress' | 'completed';
  readinessScore?: number;
  missingInformation?: any[];
  
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestWithRelations extends Request {
  address?: {
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
  };
  agent?: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    brokerage?: string;
  };
  homeowner?: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    mobile?: string;
  };
}

export interface RequestFilter {
  status?: string;
  assignedTo?: string;
  leadSource?: string;
  archived?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface RequestCreateInput {
  status: string;
  message?: string;
  relationToProperty?: string;
  budget?: string;
  leadSource?: string;
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;
}

export class RequestRepository extends BaseRepository<Request, RequestFilter, RequestCreateInput, Partial<Request>> 
  implements IRepositoryWithRelations<Request, RequestFilter> {
  
  protected modelName = 'Requests';
  protected client = apiKeyClient;

  constructor() {
    super('Request');
  }

  // GraphQL queries
  protected getListQuery(): string {
    return /* GraphQL */ `
      query ListRequests($filter: ModelRequestsFilterInput, $limit: Int, $nextToken: String) {
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
          }
          nextToken
        }
      }
    `;
  }

  protected getByIdQuery(): string {
    return /* GraphQL */ `
      query GetRequest($id: ID!) {
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
        }
      }
    `;
  }

  protected getListWithRelationsQuery(): string {
    return /* GraphQL */ `
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
  }

  protected getByIdWithRelationsQuery(): string {
    return /* GraphQL */ `
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
  }

  protected getCreateMutation(): string {
    return /* GraphQL */ `
      mutation CreateRequest($input: CreateRequestsInput!) {
        createRequests(input: $input) {
          id
          status
          message
          relationToProperty
          budget
          leadSource
          agentContactId
          homeownerContactId
          addressId
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getUpdateMutation(): string {
    return /* GraphQL */ `
      mutation UpdateRequest($input: UpdateRequestsInput!) {
        updateRequests(input: $input) {
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
        }
      }
    `;
  }

  protected getDeleteMutation(): string {
    return /* GraphQL */ `
      mutation DeleteRequest($input: DeleteRequestsInput!) {
        deleteRequests(input: $input) {
          id
        }
      }
    `;
  }

  // Repository with relations methods
  async findByIdWithRelations(id: string, include?: string[]) {
    try {
      logger.debug('Finding request by ID with relations', { id, include });
      
      const result = await this.client.query(
        this.getByIdWithRelationsQuery(),
        { id }
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error('Failed to find request by ID with relations', { id, error });
        return { success: false, error };
      }

      const requestData = (result.data as any)?.getRequests;
      if (!requestData) {
        return { success: false, error: 'Request not found' };
      }

      const request = this.mapToEntity(requestData);
      return { success: true, data: request };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error finding request by ID with relations', { id, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async findAllWithRelations(options = {}) {
    try {
      logger.debug('Finding all requests with relations', { options });
      
      const variables = this.buildQueryVariables(options);
      const result = await this.client.query(
        this.getListWithRelationsQuery(),
        variables
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error('Failed to find requests with relations', { error });
        return { success: false, error };
      }

      const items = this.extractListResults(result.data);
      const requests = items.map(item => this.mapToEntity(item));
      
      const metadata = this.extractMetadata(result.data);
      
      logger.info(`Successfully found ${requests.length} requests with relations`);
      return { success: true, data: requests, metadata };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error finding requests with relations', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // Mapping methods
  protected mapToEntity(data: any): Request {
    return {
      id: data.id,
      status: data.status,
      statusImage: data.statusImage,
      statusOrder: data.statusOrder,
      accountExecutive: data.accountExecutive,
      product: data.product,
      assignedTo: data.assignedTo,
      assignedDate: data.assignedDate,
      message: data.message,
      relationToProperty: data.relationToProperty,
      virtualWalkthrough: data.virtualWalkthrough,
      uploadedMedia: data.uploadedMedia,
      uplodedDocuments: data.uplodedDocuments,
      uploadedVideos: data.uploadedVideos,
      rtDigitalSelection: data.rtDigitalSelection,
      leadSource: data.leadSource,
      needFinance: data.needFinance,
      leadFromSync: data.leadFromSync,
      leadFromVenturaStone: data.leadFromVenturaStone,
      officeNotes: data.officeNotes,
      archived: data.archived,
      bookingId: data.bookingId,
      requestedSlot: data.requestedSlot,
      requestedVisitDateTime: data.requestedVisitDateTime,
      visitorId: data.visitorId,
      visitDate: data.visitDate,
      moveToQuotingDate: data.moveToQuotingDate,
      expiredDate: data.expiredDate,
      archivedDate: data.archivedDate,
      budget: data.budget,
      owner: data.owner,
      agentContactId: data.agentContactId,
      homeownerContactId: data.homeownerContactId,
      addressId: data.addressId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  protected mapToCreateInput(data: RequestCreateInput): any {
    return {
      status: data.status,
      message: data.message,
      relationToProperty: data.relationToProperty,
      budget: data.budget,
      leadSource: data.leadSource,
      agentContactId: data.agentContactId,
      homeownerContactId: data.homeownerContactId,
      addressId: data.addressId,
    };
  }

  protected mapToUpdateInput(data: Partial<Request>): any {
    const input: any = {};
    
    if (data.status !== undefined) input.status = data.status;
    if (data.assignedTo !== undefined) input.assignedTo = data.assignedTo;
    if (data.assignedDate !== undefined) input.assignedDate = data.assignedDate;
    if (data.message !== undefined) input.message = data.message;
    if (data.officeNotes !== undefined) input.officeNotes = data.officeNotes;
    if (data.archived !== undefined) input.archived = data.archived;
    if (data.budget !== undefined) input.budget = data.budget;
    
    return input;
  }

  protected extractSingleResult(data: any): any {
    return data?.getRequests || null;
  }

  protected extractListResults(data: any): any[] {
    return data?.listRequests?.items || [];
  }

  protected extractMetadata(data: any): any {
    const listData = data?.listRequests;
    return {
      totalCount: listData?.items?.length || 0,
      nextToken: listData?.nextToken,
    };
  }

  protected buildFilterInput(filter: RequestFilter): any {
    const filterInput: any = {};
    
    if (filter.status) {
      filterInput.status = { eq: filter.status };
    }
    
    if (filter.assignedTo) {
      filterInput.assignedTo = { eq: filter.assignedTo };
    }
    
    if (filter.leadSource) {
      filterInput.leadSource = { eq: filter.leadSource };
    }
    
    if (filter.archived !== undefined) {
      filterInput.archived = { eq: filter.archived ? 'true' : 'false' };
    }
    
    if (filter.dateRange) {
      filterInput.createdAt = {
        between: [filter.dateRange.start, filter.dateRange.end]
      };
    }
    
    return filterInput;
  }
}

// Export singleton instance
export const requestRepository = new RequestRepository();