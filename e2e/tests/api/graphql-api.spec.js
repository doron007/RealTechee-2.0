/**
 * GraphQL API Testing
 * 
 * Comprehensive testing of GraphQL queries, mutations, and subscriptions.
 * Tests data integrity, authorization, and performance for Amplify Gen 2 backend.
 */

const { test, expect } = require('@playwright/test');

test.describe('GraphQL API Tests', () => {
  let apiContext;
  let authHeaders;

  test.beforeAll(async ({ playwright }) => {
    // Create API context for GraphQL requests
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Content-Type': 'application/json'
      }
    });
  });

  test.beforeEach(async ({ page }) => {
    // Authenticate and get auth headers
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'info@realtechee.com');
    await page.fill('input[name="password"]', 'Sababa123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin|dashboard/);

    // Extract auth tokens from localStorage
    const authTokens = await page.evaluate(() => {
      const storage = localStorage;
      const keys = Object.keys(storage);
      const cognitoKeys = keys.filter(key => key.includes('CognitoIdentityServiceProvider'));
      
      const tokens = {};
      cognitoKeys.forEach(key => {
        if (key.includes('.accessToken')) {
          tokens.accessToken = storage.getItem(key);
        }
        if (key.includes('.idToken')) {
          tokens.idToken = storage.getItem(key);
        }
      });
      
      return tokens;
    });

    authHeaders = {
      'Authorization': `Bearer ${authTokens.accessToken}`,
      'X-Id-Token': authTokens.idToken
    };
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe('Projects API', () => {
    test('Query all projects with proper authorization', async () => {
      const query = `
        query ListProjects {
          listProjects {
            items {
              id
              title
              description
              status
              createdDate
              updatedDate
              owner
            }
            nextToken
          }
        }
      `;

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: query
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('data');
      expect(responseData.data).toHaveProperty('listProjects');
      expect(responseData.data.listProjects).toHaveProperty('items');
      expect(Array.isArray(responseData.data.listProjects.items)).toBe(true);

      // Validate project structure
      if (responseData.data.listProjects.items.length > 0) {
        const project = responseData.data.listProjects.items[0];
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('title');
        expect(project).toHaveProperty('status');
        expect(project).toHaveProperty('createdDate');
      }
    });

    test('Query single project by ID', async () => {
      // First get list of projects to get a valid ID
      const listQuery = `
        query ListProjects {
          listProjects {
            items {
              id
              title
            }
          }
        }
      `;

      const listResponse = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: { query: listQuery }
      });

      const listData = await listResponse.json();
      
      if (listData.data.listProjects.items.length > 0) {
        const projectId = listData.data.listProjects.items[0].id;
        
        const getQuery = `
          query GetProject($id: ID!) {
            getProject(id: $id) {
              id
              title
              description
              status
              address
              budget
              timeline
              tags
              attachments
              createdDate
              updatedDate
              owner
            }
          }
        `;

        const response = await apiContext.post('/api/graphql', {
          headers: authHeaders,
          data: {
            query: getQuery,
            variables: { id: projectId }
          }
        });

        expect(response.status()).toBe(200);
        
        const responseData = await response.json();
        expect(responseData.data.getProject.id).toBe(projectId);
        expect(responseData.data.getProject).toHaveProperty('title');
      }
    });

    test('Create new project via mutation', async () => {
      const mutation = `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
            title
            description
            status
            address
            budget
            timeline
            createdDate
            owner
          }
        }
      `;

      const projectInput = {
        title: `Test Project ${Date.now()}`,
        description: 'GraphQL API test project for automated testing',
        status: 'active',
        address: '123 Test Street, Houston, TX 77001',
        budget: 50000,
        timeline: '8-10 weeks',
        tags: ['test', 'graphql', 'api']
      };

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: mutation,
          variables: { input: projectInput }
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('data');
      expect(responseData.data).toHaveProperty('createProject');
      
      const createdProject = responseData.data.createProject;
      expect(createdProject.title).toBe(projectInput.title);
      expect(createdProject.description).toBe(projectInput.description);
      expect(createdProject.status).toBe(projectInput.status);
      expect(createdProject).toHaveProperty('id');
      expect(createdProject).toHaveProperty('createdDate');
    });

    test('Update project via mutation', async () => {
      // First create a project to update
      const createMutation = `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
            title
            status
          }
        }
      `;

      const createResponse = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: createMutation,
          variables: {
            input: {
              title: `Update Test Project ${Date.now()}`,
              description: 'Project to be updated',
              status: 'planning'
            }
          }
        }
      });

      const createData = await createResponse.json();
      const projectId = createData.data.createProject.id;

      // Now update the project
      const updateMutation = `
        mutation UpdateProject($input: UpdateProjectInput!) {
          updateProject(input: $input) {
            id
            title
            status
            updatedDate
          }
        }
      `;

      const updateResponse = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: updateMutation,
          variables: {
            input: {
              id: projectId,
              status: 'in-progress',
              title: 'Updated Test Project Title'
            }
          }
        }
      });

      expect(updateResponse.status()).toBe(200);
      
      const updateData = await updateResponse.json();
      expect(updateData.data.updateProject.id).toBe(projectId);
      expect(updateData.data.updateProject.status).toBe('in-progress');
      expect(updateData.data.updateProject.title).toBe('Updated Test Project Title');
    });

    test('Delete project via mutation', async () => {
      // First create a project to delete
      const createMutation = `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
            title
          }
        }
      `;

      const createResponse = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: createMutation,
          variables: {
            input: {
              title: `Delete Test Project ${Date.now()}`,
              description: 'Project to be deleted',
              status: 'planning'
            }
          }
        }
      });

      const createData = await createResponse.json();
      const projectId = createData.data.createProject.id;

      // Now delete the project
      const deleteMutation = `
        mutation DeleteProject($input: DeleteProjectInput!) {
          deleteProject(input: $input) {
            id
            title
          }
        }
      `;

      const deleteResponse = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: deleteMutation,
          variables: {
            input: { id: projectId }
          }
        }
      });

      expect(deleteResponse.status()).toBe(200);
      
      const deleteData = await deleteResponse.json();
      expect(deleteData.data.deleteProject.id).toBe(projectId);

      // Verify project is deleted by trying to query it
      const getQuery = `
        query GetProject($id: ID!) {
          getProject(id: $id) {
            id
            title
          }
        }
      `;

      const getResponse = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: getQuery,
          variables: { id: projectId }
        }
      });

      const getData = await getResponse.json();
      expect(getData.data.getProject).toBeNull();
    });
  });

  test.describe('Quotes API', () => {
    test('Query all quotes', async () => {
      const query = `
        query ListQuotes {
          listQuotes {
            items {
              id
              projectTitle
              clientName
              clientEmail
              amount
              status
              validUntil
              createdDate
            }
            nextToken
          }
        }
      `;

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: { query: query }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.data).toHaveProperty('listQuotes');
      expect(responseData.data.listQuotes).toHaveProperty('items');
      expect(Array.isArray(responseData.data.listQuotes.items)).toBe(true);
    });

    test('Create new quote', async () => {
      const mutation = `
        mutation CreateQuote($input: CreateQuoteInput!) {
          createQuote(input: $input) {
            id
            projectTitle
            clientName
            clientEmail
            amount
            status
            description
            validUntil
            createdDate
          }
        }
      `;

      const quoteInput = {
        projectTitle: `API Test Quote ${Date.now()}`,
        clientName: 'GraphQL Test Client',
        clientEmail: 'graphql.test@example.com',
        clientPhone: '+1-713-555-0123',
        amount: 75000,
        status: 'pending',
        description: 'GraphQL API test quote for automated testing',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: mutation,
          variables: { input: quoteInput }
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      const createdQuote = responseData.data.createQuote;
      
      expect(createdQuote.projectTitle).toBe(quoteInput.projectTitle);
      expect(createdQuote.clientName).toBe(quoteInput.clientName);
      expect(createdQuote.amount).toBe(quoteInput.amount);
      expect(createdQuote.status).toBe(quoteInput.status);
    });
  });

  test.describe('Requests API', () => {
    test('Query all requests', async () => {
      const query = `
        query ListRequests {
          listRequests {
            items {
              id
              title
              clientName
              clientEmail
              priority
              status
              type
              description
              createdDate
            }
            nextToken
          }
        }
      `;

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: { query: query }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.data).toHaveProperty('listRequests');
      expect(responseData.data.listRequests).toHaveProperty('items');
      expect(Array.isArray(responseData.data.listRequests.items)).toBe(true);
    });

    test('Create new request', async () => {
      const mutation = `
        mutation CreateRequest($input: CreateRequestInput!) {
          createRequest(input: $input) {
            id
            title
            clientName
            clientEmail
            priority
            status
            type
            description
            createdDate
          }
        }
      `;

      const requestInput = {
        title: `API Test Request ${Date.now()}`,
        clientName: 'GraphQL API Client',
        clientEmail: 'api.test@example.com',
        clientPhone: '+1-713-555-0124',
        priority: 'medium',
        status: 'new',
        type: 'consultation',
        description: 'GraphQL API test request for automated testing'
      };

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: mutation,
          variables: { input: requestInput }
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      const createdRequest = responseData.data.createRequest;
      
      expect(createdRequest.title).toBe(requestInput.title);
      expect(createdRequest.clientName).toBe(requestInput.clientName);
      expect(createdRequest.priority).toBe(requestInput.priority);
      expect(createdRequest.status).toBe(requestInput.status);
    });
  });

  test.describe('Authorization and Security', () => {
    test('Reject unauthenticated requests', async () => {
      const query = `
        query ListProjects {
          listProjects {
            items {
              id
              title
            }
          }
        }
      `;

      const response = await apiContext.post('/api/graphql', {
        data: { query: query }
        // No auth headers
      });

      expect(response.status()).toBe(401);
    });

    test('Respect user permissions and ownership', async () => {
      // Create a project as admin user
      const mutation = `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
            title
            owner
          }
        }
      `;

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: mutation,
          variables: {
            input: {
              title: `Ownership Test Project ${Date.now()}`,
              description: 'Testing ownership and permissions',
              status: 'active'
            }
          }
        }
      });

      const responseData = await response.json();
      const project = responseData.data.createProject;
      
      // Verify owner is set correctly
      expect(project.owner).toBeTruthy();
      expect(project.owner).toContain('info@realtechee.com');
    });

    test('Validate input data and constraints', async () => {
      const mutation = `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
            title
          }
        }
      `;

      // Try to create project with invalid data
      const invalidInput = {
        title: '', // Empty title should be invalid
        description: 'A'.repeat(10000), // Overly long description
        budget: -1000 // Negative budget
      };

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: mutation,
          variables: { input: invalidInput }
        }
      });

      const responseData = await response.json();
      
      // Should have validation errors
      expect(responseData).toHaveProperty('errors');
      expect(Array.isArray(responseData.errors)).toBe(true);
      expect(responseData.errors.length).toBeGreaterThan(0);
    });
  });

  test.describe('Performance and Pagination', () => {
    test('Handle large result sets with pagination', async () => {
      const query = `
        query ListProjects($limit: Int, $nextToken: String) {
          listProjects(limit: $limit, nextToken: $nextToken) {
            items {
              id
              title
              createdDate
            }
            nextToken
          }
        }
      `;

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: query,
          variables: { limit: 10 }
        }
      });

      expect(response.status()).toBe(200);
      
      const responseData = await response.json();
      const projects = responseData.data.listProjects;
      
      expect(projects.items.length).toBeLessThanOrEqual(10);
      
      // If there are more results, nextToken should be provided
      if (projects.items.length === 10) {
        expect(projects.nextToken).toBeTruthy();
      }
    });

    test('Query performance within acceptable limits', async () => {
      const startTime = Date.now();
      
      const query = `
        query ListProjects {
          listProjects(limit: 50) {
            items {
              id
              title
              description
              status
              createdDate
              updatedDate
            }
          }
        }
      `;

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: { query: query }
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;
      
      expect(response.status()).toBe(200);
      expect(queryTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      console.log(`📊 GraphQL query performance: ${queryTime}ms`);
    });

    test('Batch operations performance', async () => {
      const startTime = Date.now();
      
      // Create multiple queries in a single request
      const batchQuery = `
        query BatchQueries {
          projects: listProjects(limit: 20) {
            items {
              id
              title
            }
          }
          quotes: listQuotes(limit: 20) {
            items {
              id
              projectTitle
              amount
            }
          }
          requests: listRequests(limit: 20) {
            items {
              id
              title
              status
            }
          }
        }
      `;

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: { query: batchQuery }
      });

      const endTime = Date.now();
      const batchTime = endTime - startTime;
      
      expect(response.status()).toBe(200);
      expect(batchTime).toBeLessThan(8000); // Batch should complete within 8 seconds
      
      const responseData = await response.json();
      expect(responseData.data).toHaveProperty('projects');
      expect(responseData.data).toHaveProperty('quotes');
      expect(responseData.data).toHaveProperty('requests');
      
      console.log(`📊 GraphQL batch query performance: ${batchTime}ms`);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('Handle malformed GraphQL queries', async () => {
      const malformedQuery = `
        query InvalidQuery {
          listProjects {
            items {
              nonExistentField
              anotherBadField
            }
          }
        }
      `;

      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: { query: malformedQuery }
      });

      const responseData = await response.json();
      expect(responseData).toHaveProperty('errors');
      expect(responseData.errors.length).toBeGreaterThan(0);
    });

    test('Handle network timeouts gracefully', async () => {
      const query = `
        query ListProjects {
          listProjects {
            items {
              id
              title
            }
          }
        }
      `;

      // Set a very short timeout to simulate network issues
      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: { query: query },
        timeout: 1 // 1ms timeout to force failure
      });

      // Should handle timeout appropriately
      expect([408, 504, 500]).toContain(response.status());
    });

    test('Validate field-level permissions', async () => {
      const query = `
        query GetProjectWithSensitiveData($id: ID!) {
          getProject(id: $id) {
            id
            title
            owner
            internalNotes
            sensitiveData
          }
        }
      `;

      // Try to query sensitive fields that may not be accessible
      const response = await apiContext.post('/api/graphql', {
        headers: authHeaders,
        data: {
          query: query,
          variables: { id: 'test-project-id' }
        }
      });

      const responseData = await response.json();
      
      // Either should succeed with accessible fields only, or return permission errors
      if (responseData.errors) {
        expect(responseData.errors.some(error => 
          error.message.includes('permission') || 
          error.message.includes('unauthorized') ||
          error.message.includes('access')
        )).toBe(true);
      }
    });
  });
});