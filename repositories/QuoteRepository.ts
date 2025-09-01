/**
 * Quote repository implementation
 * Handles all data operations for Quote entities
 */

import { BaseRepository } from './core/BaseRepository';
import { IRepositoryWithRelations } from './interfaces/IBaseRepository';
import { apiKeyClient } from './core/GraphQLClient';
import { createLogger } from '../utils/logger';

const logger = createLogger('QuoteRepository');

// Quote entity types
export interface Quote {
  id: string;
  quoteNumber?: string;
  status?: string;
  statusImage?: string;
  statusOrder?: number;
  accountExecutive?: string;
  assignedTo?: string;
  assignedDate?: string;
  title?: string;
  description?: string;
  totalAmount?: number;
  validUntil?: string;
  terms?: string;
  notes?: string;
  archived?: boolean;
  requestId?: string;
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteWithRelations extends Quote {
  request?: {
    id: string;
    status?: string;
    message?: string;
  };
  address?: {
    id: string;
    propertyFullAddress?: string;
    houseAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  agent?: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  homeowner?: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface QuoteFilter {
  status?: string;
  assignedTo?: string;
  requestId?: string;
  archived?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  totalAmountRange?: {
    min: number;
    max: number;
  };
}

export interface QuoteCreateInput {
  quoteNumber?: string;
  status?: string;
  title: string;
  description?: string;
  totalAmount?: number;
  validUntil?: string;
  terms?: string;
  notes?: string;
  requestId?: string;
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;
}

export class QuoteRepository extends BaseRepository<Quote, QuoteFilter, QuoteCreateInput, Partial<Quote>> 
  implements IRepositoryWithRelations<Quote, QuoteFilter> {
  
  protected modelName = 'Quotes';
  protected client = apiKeyClient;

  constructor() {
    super('Quote');
  }

  // GraphQL queries
  protected getListQuery(): string {
    return /* GraphQL */ `
      query ListQuotes($filter: ModelQuotesFilterInput, $limit: Int, $nextToken: String) {
        listQuotes(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            id
            quoteNumber
            status
            statusImage
            statusOrder
            accountExecutive
            assignedTo
            assignedDate
            title
            description
            totalAmount
            validUntil
            terms
            notes
            archived
            requestId
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
      query GetQuote($id: ID!) {
        getQuotes(id: $id) {
          id
          quoteNumber
          status
          statusImage
          statusOrder
          accountExecutive
          assignedTo
          assignedDate
          title
          description
          totalAmount
          validUntil
          terms
          notes
          archived
          requestId
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
      query ListQuotesWithRelations($filter: ModelQuotesFilterInput, $limit: Int, $nextToken: String) {
        listQuotes(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            id
            quoteNumber
            status
            statusImage
            statusOrder
            accountExecutive
            assignedTo
            assignedDate
            title
            description
            totalAmount
            validUntil
            terms
            notes
            archived
            requestId
            agentContactId
            homeownerContactId
            addressId
            createdAt
            updatedAt
            
            request {
              id
              status
              message
            }
            address {
              id
              propertyFullAddress
              houseAddress
              city
              state
              zip
            }
            agent {
              id
              fullName
              email
              phone
            }
            homeowner {
              id
              fullName
              email
              phone
            }
            items {
              items {
                id
                description
                quantity
                unitPrice
                totalPrice
              }
            }
          }
          nextToken
        }
      }
    `;
  }

  protected getByIdWithRelationsQuery(): string {
    return /* GraphQL */ `
      query GetQuoteWithRelations($id: ID!) {
        getQuotes(id: $id) {
          id
          quoteNumber
          status
          statusImage
          statusOrder
          accountExecutive
          assignedTo
          assignedDate
          title
          description
          totalAmount
          validUntil
          terms
          notes
          archived
          requestId
          agentContactId
          homeownerContactId
          addressId
          createdAt
          updatedAt
          
          request {
            id
            status
            message
          }
          address {
            id
            propertyFullAddress
            houseAddress
            city
            state
            zip
          }
          agent {
            id
            fullName
            email
            phone
          }
          homeowner {
            id
            fullName
            email
            phone
          }
          items {
            items {
              id
              description
              quantity
              unitPrice
              totalPrice
            }
          }
        }
      }
    `;
  }

  protected getCreateMutation(): string {
    return /* GraphQL */ `
      mutation CreateQuote($input: CreateQuotesInput!) {
        createQuotes(input: $input) {
          id
          quoteNumber
          status
          title
          description
          totalAmount
          validUntil
          terms
          notes
          requestId
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
      mutation UpdateQuote($input: UpdateQuotesInput!) {
        updateQuotes(input: $input) {
          id
          quoteNumber
          status
          statusImage
          statusOrder
          accountExecutive
          assignedTo
          assignedDate
          title
          description
          totalAmount
          validUntil
          terms
          notes
          archived
          requestId
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
      mutation DeleteQuote($input: DeleteQuotesInput!) {
        deleteQuotes(input: $input) {
          id
        }
      }
    `;
  }

  // Repository with relations methods
  async findByIdWithRelations(id: string, include?: string[]) {
    try {
      logger.debug('Finding quote by ID with relations', { id, include });
      
      const result = await this.client.query(
        this.getByIdWithRelationsQuery(),
        { id }
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error('Failed to find quote by ID with relations', { id, error });
        return { success: false, error };
      }

      const quoteData = (result.data as any)?.getQuotes;
      if (!quoteData) {
        return { success: false, error: 'Quote not found' };
      }

      const quote = this.mapToEntity(quoteData);
      return { success: true, data: quote };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error finding quote by ID with relations', { id, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async findAllWithRelations(options = {}) {
    try {
      logger.debug('Finding all quotes with relations', { options });
      
      const variables = this.buildQueryVariables(options);
      const result = await this.client.query(
        this.getListWithRelationsQuery(),
        variables
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error('Failed to find quotes with relations', { error });
        return { success: false, error };
      }

      const items = this.extractListResults(result.data);
      const quotes = items.map(item => this.mapToEntity(item));
      
      const metadata = this.extractMetadata(result.data);
      
      logger.info(`Successfully found ${quotes.length} quotes with relations`);
      return { success: true, data: quotes, metadata };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error finding quotes with relations', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // Business logic methods
  async findByRequestId(requestId: string) {
    return this.findMany({ requestId });
  }

  async findByStatus(status: string) {
    return this.findMany({ status });
  }

  async findExpiring(days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    // This would need a more complex filter - simplified for now
    return this.findAll({
      filter: {
        dateRange: {
          start: new Date().toISOString(),
          end: futureDate.toISOString()
        }
      }
    });
  }

  // Mapping methods
  protected mapToEntity(data: any): Quote {
    return {
      id: data.id,
      quoteNumber: data.quoteNumber,
      status: data.status,
      statusImage: data.statusImage,
      statusOrder: data.statusOrder,
      accountExecutive: data.accountExecutive,
      assignedTo: data.assignedTo,
      assignedDate: data.assignedDate,
      title: data.title,
      description: data.description,
      totalAmount: data.totalAmount,
      validUntil: data.validUntil,
      terms: data.terms,
      notes: data.notes,
      archived: data.archived,
      requestId: data.requestId,
      agentContactId: data.agentContactId,
      homeownerContactId: data.homeownerContactId,
      addressId: data.addressId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  protected mapToCreateInput(data: QuoteCreateInput): any {
    return {
      quoteNumber: data.quoteNumber,
      status: data.status || 'Draft',
      title: data.title,
      description: data.description,
      totalAmount: data.totalAmount,
      validUntil: data.validUntil,
      terms: data.terms,
      notes: data.notes,
      requestId: data.requestId,
      agentContactId: data.agentContactId,
      homeownerContactId: data.homeownerContactId,
      addressId: data.addressId,
    };
  }

  protected mapToUpdateInput(data: Partial<Quote>): any {
    const input: any = {};
    
    if (data.status !== undefined) input.status = data.status;
    if (data.assignedTo !== undefined) input.assignedTo = data.assignedTo;
    if (data.assignedDate !== undefined) input.assignedDate = data.assignedDate;
    if (data.title !== undefined) input.title = data.title;
    if (data.description !== undefined) input.description = data.description;
    if (data.totalAmount !== undefined) input.totalAmount = data.totalAmount;
    if (data.validUntil !== undefined) input.validUntil = data.validUntil;
    if (data.terms !== undefined) input.terms = data.terms;
    if (data.notes !== undefined) input.notes = data.notes;
    if (data.archived !== undefined) input.archived = data.archived;
    
    return input;
  }

  protected extractSingleResult(data: any): any {
    return data?.getQuotes || null;
  }

  protected extractListResults(data: any): any[] {
    return data?.listQuotes?.items || [];
  }

  protected extractMetadata(data: any): any {
    const listData = data?.listQuotes;
    return {
      totalCount: listData?.items?.length || 0,
      nextToken: listData?.nextToken,
    };
  }

  protected buildFilterInput(filter: QuoteFilter): any {
    const filterInput: any = {};
    
    if (filter.status) {
      filterInput.status = { eq: filter.status };
    }
    
    if (filter.assignedTo) {
      filterInput.assignedTo = { eq: filter.assignedTo };
    }
    
    if (filter.requestId) {
      filterInput.requestId = { eq: filter.requestId };
    }
    
    if (filter.archived !== undefined) {
      filterInput.archived = { eq: filter.archived };
    }
    
    if (filter.dateRange) {
      filterInput.createdAt = {
        between: [filter.dateRange.start, filter.dateRange.end]
      };
    }
    
    if (filter.totalAmountRange) {
      filterInput.totalAmount = {
        between: [filter.totalAmountRange.min, filter.totalAmountRange.max]
      };
    }
    
    return filterInput;
  }
}

// Export singleton instance
export const quoteRepository = new QuoteRepository();