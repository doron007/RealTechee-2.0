/**
 * Property repository implementation
 * Handles all data operations for Property entities
 */

import { BaseRepository } from './core/BaseRepository';
import { apiKeyClient } from './core/GraphQLClient';
import { createLogger } from '../utils/logger';

const logger = createLogger('PropertyRepository');

// Property entity types - matching actual schema
export interface Property {
  id: string;
  propertyFullAddress?: string;
  houseAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  propertyType?: string;
  bedrooms?: number; // float in schema
  bathrooms?: number; // float in schema
  floors?: number; // integer in schema
  sizeSqft?: number; // float in schema
  yearBuilt?: number; // integer in schema
  redfinLink?: string; // url in schema
  zillowLink?: string; // url in schema
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyFilter {
  propertyType?: string;
  city?: string;
  state?: string;
  zip?: string;
  bedrooms?: number;
  bathrooms?: number;
  yearRange?: {
    min: number;
    max: number;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  search?: string; // Search across address fields
}

export interface PropertyCreateInput {
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
  redfinLink?: string;
  zillowLink?: string;
  owner?: string;
}

export class PropertyRepository extends BaseRepository<Property, PropertyFilter, PropertyCreateInput, Partial<Property>> {
  
  protected modelName = 'Properties';
  protected client = apiKeyClient;

  constructor() {
    super('Property');
  }

  // GraphQL queries
  protected getListQuery(): string {
    return /* GraphQL */ `
      query ListProperties($filter: ModelPropertiesFilterInput, $limit: Int, $nextToken: String) {
        listProperties(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
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
            redfinLink
            zillowLink
            owner
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
      query GetProperty($id: ID!) {
        getProperties(id: $id) {
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
          owner
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getCreateMutation(): string {
    return /* GraphQL */ `
      mutation CreateProperty($input: CreatePropertiesInput!) {
        createProperties(input: $input) {
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
          owner
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getUpdateMutation(): string {
    return /* GraphQL */ `
      mutation UpdateProperty($input: UpdatePropertiesInput!) {
        updateProperties(input: $input) {
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
          owner
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getDeleteMutation(): string {
    return /* GraphQL */ `
      mutation DeleteProperty($input: DeletePropertiesInput!) {
        deleteProperties(input: $input) {
          id
        }
      }
    `;
  }

  // Business logic methods
  async findByAddress(address: string) {
    return this.findMany({ search: address });
  }

  async findByCity(city: string) {
    return this.findMany({ city });
  }

  async findByState(state: string) {
    return this.findMany({ state });
  }

  async findByZip(zip: string) {
    return this.findMany({ zip });
  }

  async findByPropertyType(propertyType: string) {
    return this.findMany({ propertyType });
  }

  async findByBedrooms(bedrooms: number) {
    return this.findMany({ bedrooms });
  }

  async findByYearRange(minYear: number, maxYear: number) {
    return this.findMany({ yearRange: { min: minYear, max: maxYear } });
  }

  async findBySizeRange(minSize: number, maxSize: number) {
    return this.findMany({ sizeRange: { min: minSize, max: maxSize } });
  }

  // Mapping methods
  protected mapToEntity(data: any): Property {
    return {
      id: data.id,
      propertyFullAddress: data.propertyFullAddress,
      houseAddress: data.houseAddress,
      city: data.city,
      state: data.state,
      zip: data.zip,
      propertyType: data.propertyType,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      floors: data.floors,
      sizeSqft: data.sizeSqft,
      yearBuilt: data.yearBuilt,
      zillowLink: data.zillowLink,
      redfinLink: data.redfinLink,
      owner: data.owner,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  protected mapToCreateInput(data: PropertyCreateInput): any {
    return {
      propertyFullAddress: data.propertyFullAddress,
      houseAddress: data.houseAddress,
      city: data.city,
      state: data.state,
      zip: data.zip,
      propertyType: data.propertyType,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      floors: data.floors,
      sizeSqft: data.sizeSqft,
      yearBuilt: data.yearBuilt,
      zillowLink: data.zillowLink,
      redfinLink: data.redfinLink,
      owner: data.owner,
    };
  }

  protected mapToUpdateInput(data: Partial<Property>): any {
    const input: any = {};
    
    if (data.propertyFullAddress !== undefined) input.propertyFullAddress = data.propertyFullAddress;
    if (data.houseAddress !== undefined) input.houseAddress = data.houseAddress;
    if (data.city !== undefined) input.city = data.city;
    if (data.state !== undefined) input.state = data.state;
    if (data.zip !== undefined) input.zip = data.zip;
    if (data.propertyType !== undefined) input.propertyType = data.propertyType;
    if (data.bedrooms !== undefined) input.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined) input.bathrooms = data.bathrooms;
    if (data.floors !== undefined) input.floors = data.floors;
    if (data.sizeSqft !== undefined) input.sizeSqft = data.sizeSqft;
    if (data.yearBuilt !== undefined) input.yearBuilt = data.yearBuilt;
    if (data.zillowLink !== undefined) input.zillowLink = data.zillowLink;
    if (data.redfinLink !== undefined) input.redfinLink = data.redfinLink;
    if (data.owner !== undefined) input.owner = data.owner;
    
    return input;
  }

  protected extractSingleResult(data: any): any {
    return data?.getProperties;
  }

  protected extractListResults(data: any): any[] {
    return data?.listProperties?.items || [];
  }

  protected extractMetadata(data: any): any {
    const listData = data?.listProperties;
    return {
      totalCount: listData?.items?.length || 0,
      nextToken: listData?.nextToken,
    };
  }

  protected buildFilterInput(filter: PropertyFilter): any {
    const filterInput: any = {};
    
    if (filter.propertyType) {
      filterInput.propertyType = { eq: filter.propertyType };
    }
    
    if (filter.city) {
      filterInput.city = { eq: filter.city };
    }
    
    if (filter.state) {
      filterInput.state = { eq: filter.state };
    }
    
    if (filter.zip) {
      filterInput.zip = { eq: filter.zip };
    }
    
    if (filter.bedrooms) {
      filterInput.bedrooms = { eq: filter.bedrooms };
    }
    
    if (filter.bathrooms) {
      filterInput.bathrooms = { eq: filter.bathrooms };
    }
    
    
    if (filter.yearRange) {
      filterInput.yearBuilt = {
        between: [filter.yearRange.min, filter.yearRange.max]
      };
    }
    
    if (filter.sizeRange) {
      filterInput.sizeSqft = {
        between: [filter.sizeRange.min, filter.sizeRange.max]
      };
    }
    
    // Search across address fields
    if (filter.search) {
      filterInput.or = [
        { propertyFullAddress: { contains: filter.search } },
        { houseAddress: { contains: filter.search } },
        { city: { contains: filter.search } },
        { state: { contains: filter.search } },
        { zip: { contains: filter.search } },
      ];
    }
    
    return filterInput;
  }
}

// Export singleton instance
export const propertyRepository = new PropertyRepository();