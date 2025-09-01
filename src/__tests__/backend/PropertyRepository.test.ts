/**
 * PropertyRepository Test Suite
 * 
 * Comprehensive tests for PropertyRepository covering:
 * - All CRUD operations
 * - Address-based lookups and searches
 * - Location filtering (city, state, zip)
 * - Property characteristics filtering (bedrooms, bathrooms, size, year)
 * - Range-based queries
 * - Property type categorization
 * - External links management (Zillow, Redfin)
 * - Business logic methods
 * - Error handling scenarios
 */

import { PropertyRepository } from '../../../repositories/PropertyRepository';
import type { Property, PropertyFilter, PropertyCreateInput } from '../../../repositories/PropertyRepository';
import { 
  createMockGraphQLResponse,
  createMockServiceResult,
  createMockRepositoryError
} from '../testDataFactories';

// Mock dependencies
jest.mock('../../../repositories/core/GraphQLClient');
jest.mock('../../../utils/logger');

// Mock the GraphQL client
const mockGraphQLClient = {
  query: jest.fn(),
  mutate: jest.fn()
};

// Mock Property factory
const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: 'property_' + Math.random().toString(36).substr(2, 9),
  propertyFullAddress: '123 Main Street, San Francisco, CA 94105',
  houseAddress: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94105',
  propertyType: 'Single Family Home',
  bedrooms: 4,
  bathrooms: 2.5,
  floors: 2,
  sizeSqft: 2500,
  yearBuilt: 1995,
  zillowLink: 'https://zillow.com/property/123',
  redfinLink: 'https://redfin.com/property/123',
  owner: 'system',
  createdAt: '2024-01-10T08:00:00Z',
  updatedAt: '2024-01-15T12:30:00Z',
  ...overrides
});

describe('PropertyRepository', () => {
  let propertyRepository: PropertyRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create repository instance with mocked dependencies
    propertyRepository = new PropertyRepository();
    (propertyRepository as any).client = mockGraphQLClient;
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(propertyRepository).toBeInstanceOf(PropertyRepository);
      expect((propertyRepository as any).modelName).toBe('Properties');
      expect((propertyRepository as any).entityName).toBe('Property');
    });
  });

  describe('create', () => {
    it('should create a new property successfully', async () => {
      const createInput: PropertyCreateInput = {
        propertyFullAddress: '456 Oak Avenue, Los Angeles, CA 90210',
        houseAddress: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90210',
        propertyType: 'Condo',
        bedrooms: 3,
        bathrooms: 2,
        floors: 1,
        sizeSqft: 1800,
        yearBuilt: 2010,
        zillowLink: 'https://zillow.com/property/456',
        redfinLink: 'https://redfin.com/property/456',
        owner: 'system'
      };

      const mockCreatedProperty = createMockProperty({
        id: 'new-property-id',
        ...createInput
      });

      const mockGraphQLResponse = {
        data: {
          createProperties: mockCreatedProperty
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.create(createInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('new-property-id');
      expect(result.data?.city).toBe('Los Angeles');
      expect(result.data?.propertyType).toBe('Condo');
      expect(result.data?.owner).toBe(true); // Should default to true
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation CreateProperty'),
        { input: expect.objectContaining({
          ...createInput,
          }) }
      );
    });

    it('should default active to true when not specified', async () => {
      const createInput: PropertyCreateInput = {
        propertyFullAddress: '789 Pine Street, Seattle, WA 98101',
        city: 'Seattle',
        state: 'WA',
        propertyType: 'Townhouse'
      };

      const mockCreatedProperty = createMockProperty({
        ...createInput,
      });

      const mockGraphQLResponse = {
        data: {
          createProperties: mockCreatedProperty
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.create(createInput);

      expect(result.success).toBe(true);
      expect(result.data?.owner).toBe(true);
    });

    it('should handle validation errors', async () => {
      const createInput: PropertyCreateInput = {
        bedrooms: -1, // Invalid negative bedrooms
        bathrooms: 0.25, // Invalid partial bathroom count
        yearBuilt: 3000 // Future year
      };

      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Validation error: invalid property specifications' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await propertyRepository.create(createInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error: invalid property specifications');
    });
  });

  describe('findById', () => {
    const mockPropertyId = 'property-123';

    it('should find property by ID successfully', async () => {
      const mockProperty = createMockProperty({ id: mockPropertyId });
      
      const mockGraphQLResponse = {
        data: {
          getProperties: mockProperty
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findById(mockPropertyId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(mockPropertyId);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query GetProperty'),
        { id: mockPropertyId }
      );
    });

    it('should handle not found cases', async () => {
      const mockGraphQLResponse = {
        data: { getProperties: null },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Property not found');
    });

    it('should return cached property when available', async () => {
      const mockProperty = createMockProperty({ id: mockPropertyId });
      
      // First call to populate cache
      const mockGraphQLResponse = {
        data: { getProperties: mockProperty },
        errors: null
      };
      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);
      
      await propertyRepository.findById(mockPropertyId);
      
      // Second call should use cache
      const result = await propertyRepository.findById(mockPropertyId);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockPropertyId);
      expect(result.metadata?.cached).toBe(true);
    });
  });

  describe('findByAddress', () => {
    it('should find properties by address search', async () => {
      const searchAddress = '123 Main Street';
      const mockProperties = [
        createMockProperty({ 
          id: 'property-1', 
          houseAddress: '123 Main Street',
          city: 'San Francisco'
        }),
        createMockProperty({ 
          id: 'property-2', 
          propertyFullAddress: '123 Main Street Unit B, San Francisco, CA'
        })
      ];

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: mockProperties,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findByAddress(searchAddress);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListProperties'),
        expect.objectContaining({
          filter: expect.objectContaining({
            or: expect.arrayContaining([
              { propertyFullAddress: { contains: searchAddress } },
              { houseAddress: { contains: searchAddress } },
              { city: { contains: searchAddress } },
              { state: { contains: searchAddress } },
              { zip: { contains: searchAddress } }
            ])
          })
        })
      );
    });
  });

  describe('findByCity', () => {
    it('should find properties in specific city', async () => {
      const city = 'San Francisco';
      const mockProperties = [
        createMockProperty({ id: 'property-1', city }),
        createMockProperty({ id: 'property-2', city })
      ];

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: mockProperties,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findByCity(city);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.every(property => property.city === city)).toBe(true);
    });
  });

  describe('findByState', () => {
    it('should find properties in specific state', async () => {
      const state = 'CA';
      const mockProperties = [
        createMockProperty({ id: 'property-1', state, city: 'San Francisco' }),
        createMockProperty({ id: 'property-2', state, city: 'Los Angeles' })
      ];

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: mockProperties,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findByState(state);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.every(property => property.state === state)).toBe(true);
    });
  });

  describe('findByZip', () => {
    it('should find properties in specific zip code', async () => {
      const zip = '94105';
      const mockProperties = [
        createMockProperty({ id: 'property-1', zip }),
        createMockProperty({ id: 'property-2', zip })
      ];

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: mockProperties,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findByZip(zip);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.every(property => property.zip === zip)).toBe(true);
    });
  });

  describe('findByPropertyType', () => {
    it('should find properties by type', async () => {
      const propertyType = 'Single Family Home';
      const mockProperties = [
        createMockProperty({ id: 'property-1', propertyType }),
        createMockProperty({ id: 'property-2', propertyType })
      ];

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: mockProperties,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findByPropertyType(propertyType);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.every(property => property.propertyType === propertyType)).toBe(true);
    });
  });

  describe('findByBedrooms', () => {
    it('should find properties with specific bedroom count', async () => {
      const bedrooms = 3;
      const mockProperties = [
        createMockProperty({ id: 'property-1', bedrooms }),
        createMockProperty({ id: 'property-2', bedrooms })
      ];

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: mockProperties,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findByBedrooms(bedrooms);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.every(property => property.bedrooms === bedrooms)).toBe(true);
    });
  });

  describe('findByYearRange', () => {
    it('should find properties built within year range', async () => {
      const minYear = 1990;
      const maxYear = 2000;
      const mockProperties = [
        createMockProperty({ id: 'property-1', yearBuilt: 1995 }),
        createMockProperty({ id: 'property-2', yearBuilt: 1998 })
      ];

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: mockProperties,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findByYearRange(minYear, maxYear);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListProperties'),
        expect.objectContaining({
          filter: expect.objectContaining({
            yearBuilt: {
              between: [minYear, maxYear]
            }
          })
        })
      );
    });
  });

  describe('findBySizeRange', () => {
    it('should find properties within size range', async () => {
      const minSize = 2000;
      const maxSize = 3000;
      const mockProperties = [
        createMockProperty({ id: 'property-1', sizeSqft: 2200 }),
        createMockProperty({ id: 'property-2', sizeSqft: 2800 })
      ];

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: mockProperties,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findBySizeRange(minSize, maxSize);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListProperties'),
        expect.objectContaining({
          filter: expect.objectContaining({
            sizeSqft: {
              between: [minSize, maxSize]
            }
          })
        })
      );
    });
  });

  describe('update', () => {
    const mockPropertyId = 'property-123';

    it('should update property successfully', async () => {
      const updateData = {
        bedrooms: 5,
        bathrooms: 3,
        sizeSqft: 3200,
        owner: 'Recently renovated with additional bedroom',
        zillowLink: 'https://zillow.com/updated-property/123'
      };

      const mockUpdatedProperty = createMockProperty({
        id: mockPropertyId,
        ...updateData
      });

      const mockGraphQLResponse = {
        data: {
          updateProperties: mockUpdatedProperty
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.update(mockPropertyId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.bedrooms).toBe(5);
      expect(result.data?.bathrooms).toBe(3);
      expect(result.data?.sizeSqft).toBe(3200);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation UpdateProperty'),
        {
          input: expect.objectContaining({
            id: mockPropertyId,
            ...updateData
          })
        }
      );
    });

    it('should handle partial updates', async () => {
      const updateData = { owner: 'Updated property notes' };

      const mockUpdatedProperty = createMockProperty({
        id: mockPropertyId,
        owner: 'Updated property notes'
      });

      const mockGraphQLResponse = {
        data: { updateProperties: mockUpdatedProperty },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.update(mockPropertyId, updateData);

      expect(result.success).toBe(true);
      expect(result.data?.owner).toBe('Updated property notes');
    });

    it('should handle validation errors', async () => {
      const updateData = { 
        bedrooms: -2, // Invalid negative bedrooms
        sizeSqft: 0 // Invalid zero size
      };

      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Validation error: invalid property specifications' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await propertyRepository.update(mockPropertyId, updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation error: invalid property specifications');
    });
  });

  describe('delete', () => {
    const mockPropertyId = 'property-123';

    it('should delete property successfully', async () => {
      const mockGraphQLResponse = {
        data: {
          deleteProperties: { id: mockPropertyId }
        },
        errors: null
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.delete(mockPropertyId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockGraphQLClient.mutate).toHaveBeenCalledWith(
        expect.stringContaining('mutation DeleteProperty'),
        { input: { id: mockPropertyId } }
      );
    });

    it('should prevent deletion of properties with active relationships', async () => {
      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Cannot delete property: has active relationships' }]
      };

      mockGraphQLClient.mutate.mockResolvedValue(mockErrorResponse);

      const result = await propertyRepository.delete(mockPropertyId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete property: has active relationships');
    });
  });

  describe('filtering and pagination', () => {
    it('should handle complex filters', async () => {
      const filter: PropertyFilter = {
        city: 'San Francisco',
        state: 'CA',
        propertyType: 'Single Family Home',
        bedrooms: 3,
        bathrooms: 2,
        yearRange: {
          min: 1990,
          max: 2010
        },
        sizeRange: {
          min: 2000,
          max: 4000
        },
              search: 'Victorian'
      };

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: [createMockProperty()],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findAll({ filter });

      expect(result.success).toBe(true);
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListProperties'),
        expect.objectContaining({
          filter: expect.objectContaining({
            city: { eq: 'San Francisco' },
            state: { eq: 'CA' },
            propertyType: { eq: 'Single Family Home' },
            bedrooms: { eq: 3 },
            bathrooms: { eq: 2 },
            yearBuilt: {
              between: [1990, 2010]
            },
            sizeSqft: {
              between: [2000, 4000]
            },
            or: expect.arrayContaining([
              { propertyFullAddress: { contains: 'Victorian' } },
              { houseAddress: { contains: 'Victorian' } },
              { city: { contains: 'Victorian' } },
              { state: { contains: 'Victorian' } },
              { zip: { contains: 'Victorian' } }
            ])
          })
        })
      );
    });

    it('should handle pagination properly', async () => {
      const mockProperties = [createMockProperty({ id: 'property-1' })];

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: mockProperties,
            nextToken: 'next-page-token'
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findAll({
        limit: 20,
        nextToken: 'current-token'
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.metadata?.nextToken).toBe('next-page-token');
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.stringContaining('query ListProperties'),
        expect.objectContaining({
          limit: 20,
          nextToken: 'current-token'
        })
      );
    });
  });

  describe('mapping methods', () => {
    it('should map GraphQL data to entity correctly', () => {
      const repository = propertyRepository as any;
      
      const graphqlData = {
        id: 'property-123',
        propertyFullAddress: '123 Main St, San Francisco, CA 94105',
        houseAddress: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        propertyType: 'Single Family Home',
        bedrooms: 4,
        bathrooms: 2.5,
        sizeSqft: 2500,
        yearBuilt: 1995,
              createdAt: '2024-01-15T10:00:00Z'
      };

      const entity = repository.mapToEntity(graphqlData);

      expect(entity.id).toBe('property-123');
      expect(entity.propertyFullAddress).toBe('123 Main St, San Francisco, CA 94105');
      expect(entity.houseAddress).toBe('123 Main St');
      expect(entity.city).toBe('San Francisco');
      expect(entity.state).toBe('CA');
      expect(entity.zip).toBe('94105');
      expect(entity.propertyType).toBe('Single Family Home');
      expect(entity.bedrooms).toBe(4);
      expect(entity.bathrooms).toBe(2.5);
      expect(entity.sizeSqft).toBe(2500);
      expect(entity.yearBuilt).toBe(1995);
      expect(entity.createdAt).toBe('2024-01-15T10:00:00Z');
    });

    it('should map create input with defaults', () => {
      const repository = propertyRepository as any;
      
      const createInput: PropertyCreateInput = {
        propertyFullAddress: '456 Oak Ave, Los Angeles, CA 90210',
        city: 'Los Angeles',
        state: 'CA',
        propertyType: 'Condo',
        bedrooms: 2,
        bathrooms: 2
      };

      const mappedInput = repository.mapToCreateInput(createInput);

      expect(mappedInput).toEqual({
        ...createInput,
        active: true // Should default to true
      });
    });

    it('should map update input correctly', () => {
      const repository = propertyRepository as any;
      
      const updateData = {
        bedrooms: 5,
        bathrooms: 3,
        sizeSqft: 3500,
        owner: 'Recently renovated',
      };

      const mappedInput = repository.mapToUpdateInput(updateData);

      expect(mappedInput).toEqual(updateData);
    });

    it('should filter out undefined values in update mapping', () => {
      const repository = propertyRepository as any;
      
      const updateData = {
        bedrooms: 4,
        bathrooms: undefined,
        sizeSqft: 3000
      };

      const mappedInput = repository.mapToUpdateInput(updateData);

      expect(mappedInput).toEqual({
        bedrooms: 4,
        sizeSqft: 3000
      });
      expect(mappedInput.bathrooms).toBeUndefined();
    });
  });

  describe('error scenarios', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockGraphQLClient.query.mockRejectedValue(networkError);

      const result = await propertyRepository.findById('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network connection failed');
    });

    it('should handle GraphQL errors', async () => {
      const mockErrorResponse = {
        data: null,
        errors: [{ message: 'Access denied to property data' }]
      };

      mockGraphQLClient.query.mockResolvedValue(mockErrorResponse);

      const result = await propertyRepository.findAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied to property data');
    });

    it('should handle malformed responses', async () => {
      const malformedResponse = {
        data: undefined,
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(malformedResponse);

      const result = await propertyRepository.findById('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Property not found');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      mockGraphQLClient.query.mockRejectedValue(timeoutError);

      const result = await propertyRepository.findByCity('San Francisco');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });
  });

  describe('cache functionality', () => {
    beforeEach(() => {
      propertyRepository.clearCache();
    });

    it('should cache properties after retrieval', async () => {
      const mockProperty = createMockProperty({ id: 'cached-property' });
      const mockGraphQLResponse = {
        data: { getProperties: mockProperty },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      // First call should hit the database
      const result1 = await propertyRepository.findById('cached-property');
      expect(result1.success).toBe(true);

      // Second call should hit the cache
      const result2 = await propertyRepository.findById('cached-property');
      expect(result2.success).toBe(true);
      expect(result2.metadata?.cached).toBe(true);

      // Should only call GraphQL once
      expect(mockGraphQLClient.query).toHaveBeenCalledTimes(1);
    });

    it('should clear cache successfully', () => {
      propertyRepository.clearCache();
      
      const stats = propertyRepository.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('count and exists methods', () => {
    it('should count properties correctly', async () => {
      const mockProperties = [
        createMockProperty({ id: 'property-1' }),
        createMockProperty({ id: 'property-2' }),
        createMockProperty({ id: 'property-3' })
      ];

      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: mockProperties,
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.count();

      expect(result.success).toBe(true);
      expect(result.data).toBe(3);
    });

    it('should count with filter', async () => {
      const filter: PropertyFilter = { propertyType: 'Condo' };
      
      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: [createMockProperty({ propertyType: 'Condo' })],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.count(filter);

      expect(result.success).toBe(true);
      expect(result.data).toBe(1);
    });

    it('should check existence correctly', async () => {
      const mockProperty = createMockProperty({ id: 'existing-property' });
      const mockGraphQLResponse = {
        data: { getProperties: mockProperty },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.exists('existing-property');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for non-existent property', async () => {
      const mockGraphQLResponse = {
        data: { getProperties: null },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.exists('non-existent-property');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('findMany and findOne', () => {
    it('should find many properties with filter', async () => {
      const filter: PropertyFilter = { bedrooms: 3 };
      
      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: [createMockProperty({ bedrooms: 3 })],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findMany(filter);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should find one property with filter', async () => {
      const filter: PropertyFilter = { zip: '94105' };
      
      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: [createMockProperty({ zip: '94105' })],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findOne(filter);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockGraphQLClient.query).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ limit: 1 })
      );
    });

    it('should return null when no matches found', async () => {
      const filter: PropertyFilter = { city: 'NonExistentCity' };
      
      const mockGraphQLResponse = {
        data: {
          listProperties: {
            items: [],
            nextToken: null
          }
        },
        errors: null
      };

      mockGraphQLClient.query.mockResolvedValue(mockGraphQLResponse);

      const result = await propertyRepository.findOne(filter);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });
});