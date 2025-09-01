/**
 * Repository-Service Integration Tests
 * 
 * Tests the integration between:
 * - AmplifyAPI (Repository layer) ↔ EnhancedRequestsService (Service layer)
 * - GraphQL client ↔ Service data transformation
 * - Error handling between layers
 * - Cache management integration
 * - Business logic application in service layer
 */

// Mock external dependencies first
jest.mock('aws-amplify/api');
jest.mock('../../utils/amplifyAPI');

// Use CommonJS imports for Jest compatibility
const { enhancedRequestsService } = require('../../services/enhancedRequestsService');
const { generateClient } = require('aws-amplify/api');
const { requestsAPI } = require('../../utils/amplifyAPI');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('RepositoryServiceIntegration');

// Mocks are already set up above

const mockGraphQLClient = {
  graphql: jest.fn()
};
generateClient.mockReturnValue(mockGraphQLClient);

const mockAmplifyAPI = {
  update: jest.fn()
};
requestsAPI.update = mockAmplifyAPI.update;

describe('Repository-Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GraphQL Repository → Service Data Flow', () => {
    test('service correctly processes GraphQL response with nested relations', async () => {
      // Arrange: Mock GraphQL response with complete nested data
      const mockGraphQLResponse = {
        data: {
          listRequests: {
            items: [{
              id: 'req-service-001',
              status: 'New Lead',
              product: 'Kitchen Remodel',
              message: 'Complete kitchen renovation needed',
              budget: '$45,000',
              leadSource: 'Website Form',
              needFinance: true,
              relationToProperty: 'Owner',
              createdAt: '2024-01-15T10:30:00Z',
              updatedAt: '2024-01-15T10:30:00Z',
              
              // Nested address relationship
              address: {
                id: 'addr-001',
                propertyFullAddress: '123 Service Integration St, Test City, CA 94000',
                houseAddress: '123 Service Integration St',
                city: 'Test City',
                state: 'CA',
                zip: '94000',
                propertyType: 'Single Family',
                bedrooms: 3,
                bathrooms: 2,
                sizeSqft: 1800,
                yearBuilt: 1995
              },
              
              // Nested homeowner relationship
              homeowner: {
                id: 'homeowner-001',
                firstName: 'John',
                lastName: 'ServiceTest',
                fullName: 'John ServiceTest',
                email: 'john.servicetest@example.com',
                phone: '+1-555-0101',
                mobile: '+1-555-0102'
              },
              
              // Nested agent relationship
              agent: {
                id: 'agent-001',
                firstName: 'Sarah',
                lastName: 'ServiceAgent',
                fullName: 'Sarah ServiceAgent',
                email: 'sarah.serviceagent@realty.com',
                phone: '+1-555-0201',
                mobile: '+1-555-0202',
                brokerage: 'Service Integration Realty LLC'
              }
            }]
          }
        }
      };

      mockGraphQLClient.graphql.mockResolvedValue(mockGraphQLResponse);

      // Act: Service processes the GraphQL response
      const result = await enhancedRequestsService.getFullyEnhancedRequests();

      // Assert: Service correctly transforms and enhances data
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      
      const enhancedRequest = result.data[0];
      
      // Core request data preservation
      expect(enhancedRequest.id).toBe('req-service-001');
      expect(enhancedRequest.status).toBe('New Lead');
      expect(enhancedRequest.product).toBe('Kitchen Remodel');
      expect(enhancedRequest.budget).toBe('$45,000');
      
      // Address transformation and enhancement
      expect(enhancedRequest.propertyAddress).toBe('123 Service Integration St, Test City, CA 94000');
      expect(enhancedRequest.propertyType).toBe('Single Family');
      expect(enhancedRequest.bedrooms).toBe('3'); // Number to string conversion
      expect(enhancedRequest.bathrooms).toBe('2');
      
      // Contact data transformation and enhancement
      expect(enhancedRequest.clientName).toBe('John ServiceTest');
      expect(enhancedRequest.clientEmail).toBe('john.servicetest@example.com');
      expect(enhancedRequest.clientPhone).toBe('+1-555-0101'); // Prefers phone over mobile
      expect(enhancedRequest.agentName).toBe('Sarah ServiceAgent');
      expect(enhancedRequest.agentEmail).toBe('sarah.serviceagent@realty.com');
      expect(enhancedRequest.brokerage).toBe('Service Integration Realty LLC');

      // Verify GraphQL query was called correctly
      expect(mockGraphQLClient.graphql).toHaveBeenCalledWith({
        query: expect.any(String), // The GraphQL query string
        variables: { limit: 2000 }
      });

      logger.info('✓ GraphQL → Service integration validated', {
        requestId: enhancedRequest.id,
        transformationsApplied: ['address', 'contacts', 'typeConversions'],
        dataIntegrity: 'complete'
      });
    });

    test('service handles missing nested data gracefully', async () => {
      // Arrange: GraphQL response with partial/missing nested data
      const partialResponse = {
        data: {
          listRequests: {
            items: [{
              id: 'req-partial-001',
              status: 'Incomplete Data',
              product: 'Test Product',
              
              // Missing address relationship
              address: null,
              
              // Partial homeowner data
              homeowner: {
                id: 'homeowner-partial',
                firstName: 'Partial',
                lastName: null, // Missing last name
                fullName: null, // Missing full name
                email: 'partial@example.com'
                // Missing phone numbers
              },
              
              // Missing agent relationship
              agent: null
            }]
          }
        }
      };

      mockGraphQLClient.graphql.mockResolvedValue(partialResponse);

      // Act: Service processes partial data
      const result = await enhancedRequestsService.getFullyEnhancedRequests();

      // Assert: Service provides appropriate fallbacks
      expect(result.success).toBe(true);
      const request = result.data[0];
      
      // Address fallback
      expect(request.propertyAddress).toBe('No address provided');
      
      // Contact name composition from available parts
      expect(request.clientName).toBe('Partial'); // Uses firstName when lastName/fullName missing
      expect(request.clientEmail).toBe('partial@example.com');
      expect(request.clientPhone).toBeUndefined(); // No phone data available
      
      // Agent fallbacks
      expect(request.agentName).toBe('N/A');
      expect(request.agentEmail).toBeUndefined();
      expect(request.brokerage).toBe('N/A');

      logger.info('✓ Partial data handling validated', {
        fallbacksApplied: ['address', 'agentName', 'brokerage'],
        dataComposition: 'firstName only'
      });
    });

    test('service properly handles address composition from components', async () => {
      // Arrange: Address data without propertyFullAddress
      const componentAddressResponse = {
        data: {
          listRequests: {
            items: [{
              id: 'req-address-comp-001',
              status: 'Address Test',
              
              address: {
                id: 'addr-comp-001',
                propertyFullAddress: null, // Force component-based composition
                houseAddress: '456 Component Ave',
                city: 'Composition City',
                state: 'TX',
                zip: '75001'
              },
              
              homeowner: { fullName: 'Address TestClient' },
              agent: { fullName: 'Address TestAgent' }
            }]
          }
        }
      };

      mockGraphQLClient.graphql.mockResolvedValue(componentAddressResponse);

      // Act: Service should compose address from components
      const result = await enhancedRequestsService.getFullyEnhancedRequests();

      // Assert: Address correctly composed
      expect(result.success).toBe(true);
      const request = result.data[0];
      expect(request.propertyAddress).toBe('456 Component Ave, Composition City, TX, 75001');

      logger.info('✓ Address composition from components validated');
    });
  });

  describe('Service → Repository Update Integration', () => {
    test('service update method correctly integrates with amplifyAPI', async () => {
      // Arrange: Mock successful update response
      const updateData = {
        status: 'In Progress',
        assignedTo: 'contractor-001',
        assignedDate: '2024-01-15T15:00:00Z',
        officeNotes: 'Assigned to senior contractor for kitchen project'
      };

      mockAmplifyAPI.update.mockResolvedValue({
        success: true,
        data: { id: 'req-update-001', ...updateData }
      });

      // Act: Service calls repository update
      const result = await enhancedRequestsService.updateRequest('req-update-001', updateData);

      // Assert: Update integration successful
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('req-update-001');
      expect(result.data.status).toBe('In Progress');
      
      // Verify repository method called correctly
      expect(mockAmplifyAPI.update).toHaveBeenCalledWith('req-update-001', updateData);

      logger.info('✓ Service → Repository update integration validated', {
        requestId: 'req-update-001',
        fieldsUpdated: Object.keys(updateData).length
      });
    });

    test('service handles repository update errors properly', async () => {
      // Arrange: Mock repository error
      const updateError = 'Validation failed: Invalid status transition';
      mockAmplifyAPI.update.mockResolvedValue({
        success: false,
        error: updateError
      });

      // Act: Service attempts update
      const result = await enhancedRequestsService.updateRequest('req-error-001', {
        status: 'Invalid Status'
      });

      // Assert: Error handled and propagated correctly
      expect(result.success).toBe(false);
      expect(result.error).toBe(updateError);
      expect(mockAmplifyAPI.update).toHaveBeenCalled();

      logger.info('✓ Repository error handling validated');
    });

    test('service update triggers cache clearing', async () => {
      // Arrange: Mock successful update
      mockAmplifyAPI.update.mockResolvedValue({
        success: true,
        data: { id: 'req-cache-001', status: 'Updated' }
      });

      // Setup initial cache with data
      mockGraphQLClient.graphql.mockResolvedValueOnce({
        data: {
          listRequests: {
            items: [{ 
              id: 'req-cache-001', 
              status: 'Old Status',
              address: { propertyFullAddress: 'Cache Test' },
              homeowner: { fullName: 'Cache Client' },
              agent: { fullName: 'Cache Agent' }
            }]
          }
        }
      });

      // Get initial data (populates cache)
      await enhancedRequestsService.getFullyEnhancedRequests();
      
      // Act: Update request (should clear cache)
      await enhancedRequestsService.updateRequest('req-cache-001', { status: 'Updated' });

      // Next fetch should call GraphQL again due to cache clearing
      mockGraphQLClient.graphql.mockResolvedValueOnce({
        data: {
          listRequests: {
            items: [{ 
              id: 'req-cache-001', 
              status: 'Updated',
              address: { propertyFullAddress: 'Cache Test' },
              homeowner: { fullName: 'Cache Client' },
              agent: { fullName: 'Cache Agent' }
            }]
          }
        }
      });

      await enhancedRequestsService.getFullyEnhancedRequests();

      // Assert: GraphQL called twice (initial + after cache clear)
      expect(mockGraphQLClient.graphql).toHaveBeenCalledTimes(2);

      logger.info('✓ Cache clearing on update validated');
    });
  });

  describe('Error Handling Integration', () => {
    test('GraphQL errors handled gracefully by service', async () => {
      // Arrange: GraphQL returns errors
      mockGraphQLClient.graphql.mockResolvedValue({
        data: null,
        errors: [
          { message: 'Field resolution error', path: ['listRequests'] },
          { message: 'Database connection timeout', code: 'TIMEOUT' }
        ]
      });

      // Act: Service handles GraphQL errors
      const result = await enhancedRequestsService.getFullyEnhancedRequests();

      // Assert: Service gracefully handles errors
      expect(result.success).toBe(true); // Service still returns success with empty data
      expect(result.data).toEqual([]); // Empty array for safety

      logger.info('✓ GraphQL error graceful handling validated');
    });

    test('GraphQL exceptions handled by service', async () => {
      // Arrange: GraphQL throws exception
      const graphQLError = new Error('Network connection failed');
      mockGraphQLClient.graphql.mockRejectedValue(graphQLError);

      // Act: Service catches and handles exception
      const result = await enhancedRequestsService.getFullyEnhancedRequests();

      // Assert: Exception properly handled
      expect(result.success).toBe(false);
      expect(result.error).toBe(graphQLError);

      logger.info('✓ GraphQL exception handling validated');
    });

    test('service exception handling in update operations', async () => {
      // Arrange: Repository update throws exception
      mockAmplifyAPI.update.mockRejectedValue(new Error('Database write failed'));

      // Act: Service handles update exception
      const result = await enhancedRequestsService.updateRequest('req-exception-001', {
        status: 'Test Update'
      });

      // Assert: Exception handled gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database write failed');

      logger.info('✓ Update exception handling validated');
    });
  });

  describe('Business Logic Integration', () => {
    test('service applies sorting logic to repository data', async () => {
      // Arrange: Unsorted GraphQL response
      const unsortedResponse = {
        data: {
          listRequests: {
            items: [
              {
                id: 'req-oldest',
                status: 'Old',
                createdAt: '2024-01-01T12:00:00Z',
                address: { propertyFullAddress: 'Old Address' },
                homeowner: { fullName: 'Old Client' },
                agent: { fullName: 'Old Agent' }
              },
              {
                id: 'req-newest',
                status: 'New',
                createdAt: '2024-01-03T12:00:00Z',
                address: { propertyFullAddress: 'New Address' },
                homeowner: { fullName: 'New Client' },
                agent: { fullName: 'New Agent' }
              },
              {
                id: 'req-middle',
                status: 'Middle',
                createdAt: '2024-01-02T12:00:00Z',
                address: { propertyFullAddress: 'Middle Address' },
                homeowner: { fullName: 'Middle Client' },
                agent: { fullName: 'Middle Agent' }
              }
            ]
          }
        }
      };

      mockGraphQLClient.graphql.mockResolvedValue(unsortedResponse);

      // Act: Service processes and sorts data
      const result = await enhancedRequestsService.getFullyEnhancedRequests();

      // Assert: Data sorted by createdAt DESC (newest first)
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0].id).toBe('req-newest'); // 2024-01-03
      expect(result.data[1].id).toBe('req-middle'); // 2024-01-02
      expect(result.data[2].id).toBe('req-oldest'); // 2024-01-01

      logger.info('✓ Business logic sorting integration validated');
    });

    test('service applies filtering logic to repository data', async () => {
      // Arrange: Mixed status GraphQL response
      const mixedStatusResponse = {
        data: {
          listRequests: {
            items: [
              {
                id: 'req-active',
                status: 'New Lead',
                createdAt: '2024-01-01T12:00:00Z',
                address: { propertyFullAddress: 'Active Address' },
                homeowner: { fullName: 'Active Client' },
                agent: { fullName: 'Active Agent' }
              },
              {
                id: 'req-archived',
                status: 'Archived',
                createdAt: '2024-01-02T12:00:00Z',
                address: { propertyFullAddress: 'Archived Address' },
                homeowner: { fullName: 'Archived Client' },
                agent: { fullName: 'Archived Agent' }
              },
              {
                id: 'req-progress',
                status: 'In Progress',
                createdAt: '2024-01-03T12:00:00Z',
                address: { propertyFullAddress: 'Progress Address' },
                homeowner: { fullName: 'Progress Client' },
                agent: { fullName: 'Progress Agent' }
              }
            ]
          }
        }
      };

      mockGraphQLClient.graphql.mockResolvedValue(mixedStatusResponse);

      // Act: Service filters out archived requests
      const result = await enhancedRequestsService.getFullyEnhancedRequests();

      // Assert: Archived requests filtered out
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data.some(r => r.status === 'Archived')).toBe(false);
      expect(result.data.some(r => r.id === 'req-active')).toBe(true);
      expect(result.data.some(r => r.id === 'req-progress')).toBe(true);

      logger.info('✓ Business logic filtering integration validated');
    });
  });

  describe('Single Request Repository Integration', () => {
    test('getRequestByIdWithRelations integrates correctly', async () => {
      // Arrange: Single request GraphQL response
      const singleRequestResponse = {
        data: {
          getRequests: {
            id: 'req-single-001',
            status: 'Single Request Test',
            product: 'Single Product',
            address: {
              propertyFullAddress: '789 Single Request St'
            },
            homeowner: {
              fullName: 'Single Client'
            },
            agent: {
              fullName: 'Single Agent'
            }
          }
        }
      };

      mockGraphQLClient.graphql.mockResolvedValue(singleRequestResponse);

      // Act: Get single request
      const result = await enhancedRequestsService.getRequestByIdWithRelations('req-single-001');

      // Assert: Single request processed correctly
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('req-single-001');
      expect(result.data.propertyAddress).toBe('789 Single Request St');
      expect(result.data.clientName).toBe('Single Client');

      // Verify correct GraphQL query used
      expect(mockGraphQLClient.graphql).toHaveBeenCalledWith({
        query: expect.any(String), // GET_REQUEST_WITH_RELATIONS query
        variables: { id: 'req-single-001' }
      });

      logger.info('✓ Single request repository integration validated');
    });
  });
});