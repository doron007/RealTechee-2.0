/**
 * Project repository implementation
 * Handles all data operations for Project entities
 */

import { BaseRepository } from './core/BaseRepository';
import { IRepositoryWithRelations } from './interfaces/IBaseRepository';
import { apiKeyClient } from './core/GraphQLClient';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProjectRepository');

// Project entity types
export interface Project {
  id: string;
  title: string;
  description?: string;
  status?: string;
  statusImage?: string;
  statusOrder?: number;
  accountExecutive?: string;
  assignedTo?: string;
  assignedDate?: string;
  startDate?: string;
  completionDate?: string;
  budget?: string;
  actualCost?: number;
  notes?: string;
  archived?: boolean;
  requestId?: string;
  quoteId?: string;
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectWithRelations extends Project {
  request?: {
    id: string;
    status?: string;
    message?: string;
  };
  quote?: {
    id: string;
    quoteNumber?: string;
    totalAmount?: number;
  };
  address?: {
    id: string;
    propertyFullAddress?: string;
    houseAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    propertyType?: string;
  };
  agent?: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    brokerage?: string;
  };
  homeowner?: {
    id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  comments?: Array<{
    id: string;
    comment: string;
    author: string;
    createdAt: string;
  }>;
  milestones?: Array<{
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    completedDate?: string;
    status: string;
  }>;
  paymentTerms?: Array<{
    id: string;
    description: string;
    amount: number;
    dueDate?: string;
    paidDate?: string;
    status: string;
  }>;
}

export interface ProjectFilter {
  status?: string;
  assignedTo?: string;
  archived?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  budgetRange?: {
    min: string;
    max: string;
  };
}

export interface ProjectCreateInput {
  title: string;
  description?: string;
  status?: string;
  startDate?: string;
  completionDate?: string;
  budget?: string;
  notes?: string;
  requestId?: string;
  quoteId?: string;
  agentContactId?: string;
  homeownerContactId?: string;
  addressId?: string;
}

export class ProjectRepository extends BaseRepository<Project, ProjectFilter, ProjectCreateInput, Partial<Project>> 
  implements IRepositoryWithRelations<Project, ProjectFilter> {
  
  protected modelName = 'Projects';
  protected client = apiKeyClient;

  constructor() {
    super('Project');
  }

  // GraphQL queries
  protected getListQuery(): string {
    return /* GraphQL */ `
      query ListProjects($filter: ModelProjectsFilterInput, $limit: Int, $nextToken: String) {
        listProjects(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            id
            title
            description
            status
            statusImage
            statusOrder
            accountExecutive
            assignedTo
            assignedDate
            startDate
            completionDate
            budget
            actualCost
            notes
            archived
            requestId
            quoteId
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
      query GetProject($id: ID!) {
        getProjects(id: $id) {
          id
          title
          description
          status
          statusImage
          statusOrder
          accountExecutive
          assignedTo
          assignedDate
          startDate
          completionDate
          budget
          actualCost
          notes
          archived
          requestId
          quoteId
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
      query ListProjectsWithRelations($filter: ModelProjectsFilterInput, $limit: Int, $nextToken: String) {
        listProjects(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            id
            title
            description
            status
            statusImage
            statusOrder
            accountExecutive
            assignedTo
            assignedDate
            startDate
            completionDate
            budget
            actualCost
            notes
            archived
            requestId
            quoteId
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
            quote {
              id
              quoteNumber
              totalAmount
            }
            address {
              id
              propertyFullAddress
              houseAddress
              city
              state
              zip
              propertyType
            }
            agent {
              id
              fullName
              email
              phone
              brokerage
            }
            homeowner {
              id
              fullName
              email
              phone
            }
            comments {
              items {
                id
                comment
                author
                createdAt
              }
            }
            milestones {
              items {
                id
                title
                description
                dueDate
                completedDate
                status
              }
            }
            paymentTerms {
              items {
                id
                description
                amount
                dueDate
                paidDate
                status
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
      query GetProjectWithRelations($id: ID!) {
        getProjects(id: $id) {
          id
          title
          description
          status
          statusImage
          statusOrder
          accountExecutive
          assignedTo
          assignedDate
          startDate
          completionDate
          budget
          actualCost
          notes
          archived
          requestId
          quoteId
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
          quote {
            id
            quoteNumber
            totalAmount
          }
          address {
            id
            propertyFullAddress
            houseAddress
            city
            state
            zip
            propertyType
          }
          agent {
            id
            fullName
            email
            phone
            brokerage
          }
          homeowner {
            id
            fullName
            email
            phone
          }
          comments {
            items {
              id
              comment
              author
              createdAt
            }
          }
          milestones {
            items {
              id
              title
              description
              dueDate
              completedDate
              status
            }
          }
          paymentTerms {
            items {
              id
              description
              amount
              dueDate
              paidDate
              status
            }
          }
        }
      }
    `;
  }

  protected getCreateMutation(): string {
    return /* GraphQL */ `
      mutation CreateProject($input: CreateProjectsInput!) {
        createProjects(input: $input) {
          id
          title
          description
          status
          startDate
          completionDate
          budget
          notes
          requestId
          quoteId
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
      mutation UpdateProject($input: UpdateProjectsInput!) {
        updateProjects(input: $input) {
          id
          title
          description
          status
          statusImage
          statusOrder
          accountExecutive
          assignedTo
          assignedDate
          startDate
          completionDate
          budget
          actualCost
          notes
          archived
          requestId
          quoteId
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
      mutation DeleteProject($input: DeleteProjectsInput!) {
        deleteProjects(input: $input) {
          id
        }
      }
    `;
  }

  // Repository with relations methods
  async findByIdWithRelations(id: string, include?: string[]) {
    try {
      logger.debug('Finding project by ID with relations', { id, include });
      
      const result = await this.client.query(
        this.getByIdWithRelationsQuery(),
        { id }
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error('Failed to find project by ID with relations', { id, error });
        return { success: false, error };
      }

      const projectData = (result.data as any)?.getProjects;
      if (!projectData) {
        return { success: false, error: 'Project not found' };
      }

      const project = this.mapToEntity(projectData);
      return { success: true, data: project };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error finding project by ID with relations', { id, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async findAllWithRelations(options = {}) {
    try {
      logger.debug('Finding all projects with relations', { options });
      
      const variables = this.buildQueryVariables(options);
      const result = await this.client.query(
        this.getListWithRelationsQuery(),
        variables
      );

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0].message;
        logger.error('Failed to find projects with relations', { error });
        return { success: false, error };
      }

      const items = this.extractListResults(result.data);
      const projects = items.map(item => this.mapToEntity(item));
      
      const metadata = this.extractMetadata(result.data);
      
      logger.info(`Successfully found ${projects.length} projects with relations`);
      return { success: true, data: projects, metadata };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error finding projects with relations', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // Business logic methods
  async findByRequestId(requestId: string) {
    return this.findMany({ requestId } as any);
  }

  async findByStatus(status: string) {
    return this.findMany({ status });
  }

  async findActive() {
    return this.findMany({ archived: false });
  }

  async findByAssignee(assignedTo: string) {
    return this.findMany({ assignedTo } as any);
  }

  // Mapping methods
  protected mapToEntity(data: any): Project {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      statusImage: data.statusImage,
      statusOrder: data.statusOrder,
      accountExecutive: data.accountExecutive,
      assignedTo: data.assignedTo,
      assignedDate: data.assignedDate,
      startDate: data.startDate,
      completionDate: data.completionDate,
      budget: data.budget,
      actualCost: data.actualCost,
      notes: data.notes,
      archived: data.archived,
      requestId: data.requestId,
      quoteId: data.quoteId,
      agentContactId: data.agentContactId,
      homeownerContactId: data.homeownerContactId,
      addressId: data.addressId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  protected mapToCreateInput(data: ProjectCreateInput): any {
    return {
      title: data.title,
      description: data.description,
      status: data.status || 'Planning',
      startDate: data.startDate,
      completionDate: data.completionDate,
      budget: data.budget,
      notes: data.notes,
      requestId: data.requestId,
      quoteId: data.quoteId,
      agentContactId: data.agentContactId,
      homeownerContactId: data.homeownerContactId,
      addressId: data.addressId,
    };
  }

  protected mapToUpdateInput(data: Partial<Project>): any {
    const input: any = {};
    
    if (data.title !== undefined) input.title = data.title;
    if (data.description !== undefined) input.description = data.description;
    if (data.status !== undefined) input.status = data.status;
    if (data.assignedTo !== undefined) input.assignedTo = data.assignedTo;
    if (data.assignedDate !== undefined) input.assignedDate = data.assignedDate;
    if (data.startDate !== undefined) input.startDate = data.startDate;
    if (data.completionDate !== undefined) input.completionDate = data.completionDate;
    if (data.budget !== undefined) input.budget = data.budget;
    if (data.actualCost !== undefined) input.actualCost = data.actualCost;
    if (data.notes !== undefined) input.notes = data.notes;
    if (data.archived !== undefined) input.archived = data.archived;
    
    return input;
  }

  protected extractSingleResult(data: any): any {
    return data?.getProjects || null;
  }

  protected extractListResults(data: any): any[] {
    return data?.listProjects?.items || [];
  }

  protected extractMetadata(data: any): any {
    const listData = data?.listProjects;
    return {
      totalCount: listData?.items?.length || 0,
      nextToken: listData?.nextToken,
    };
  }

  protected buildFilterInput(filter: ProjectFilter): any {
    const filterInput: any = {};
    
    if (filter.status) {
      filterInput.status = { eq: filter.status };
    }
    
    if (filter.assignedTo) {
      filterInput.assignedTo = { eq: filter.assignedTo };
    }
    
    if (filter.archived !== undefined) {
      filterInput.archived = { eq: filter.archived };
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
export const projectRepository = new ProjectRepository();