# Repository Pattern Implementation

This directory contains the repository pattern implementation for GraphQL isolation in the RealTechee project. The pattern provides a clean abstraction layer over AWS Amplify GraphQL operations with comprehensive error handling, validation, and type safety.

## Architecture Overview

```
src/repositories/
├── base/
│   ├── BaseRepository.ts      # Generic CRUD operations
│   ├── GraphQLClient.ts       # Amplify GraphQL wrapper
│   ├── RepositoryError.ts     # Error handling classes
│   ├── types.ts               # Common types and interfaces
│   └── index.ts               # Exports
├── ContactRepository.ts       # Example implementation
└── README.md                  # This file
```

## Key Features

- **GraphQL Isolation**: All GraphQL operations are encapsulated within repository classes
- **Type Safety**: Full TypeScript support with generic interfaces
- **Error Handling**: Comprehensive error classes with user-friendly messages
- **Validation**: Built-in and extensible validation system
- **Metrics**: Optional performance monitoring
- **Audit Logging**: Support for operation auditing
- **Retry Logic**: Automatic retries for transient failures
- **Pagination**: Consistent pagination support across all repositories

## Usage Examples

### 1. Basic Repository Usage

```typescript
import { GraphQLClient } from '@/repositories/base';
import { ContactRepository } from '@/repositories/ContactRepository';

// Initialize client and repository
const client = new GraphQLClient({
  defaultAuthMode: 'apiKey',
  enableLogging: true
});

const contactRepo = new ContactRepository(client);

// Create a contact
const result = await contactRepo.create({
  data: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1-555-0123'
  }
});

if (result.success) {
  console.log('Contact created:', result.data);
} else {
  console.error('Error:', result.error.userMessage);
}
```

### 2. List with Filtering and Pagination

```typescript
// List contacts with filtering
const contacts = await contactRepo.list({
  filter: {
    and: [
      { roleType: { eq: 'Agent' } },
      { isActive: { eq: true } }
    ]
  },
  pagination: { limit: 20 },
  sort: { field: 'createdAt', direction: 'desc' }
});

if (contacts.success) {
  console.log(`Found ${contacts.data.items.length} contacts`);
  console.log('Has more pages:', contacts.data.hasMore);
}
```

### 3. Business Logic Methods

```typescript
// Find by email (business logic method)
const contactByEmail = await contactRepo.findByEmail('john@example.com');

// Update notification preferences
const updated = await contactRepo.updateNotificationPreferences('contact-id', {
  emailNotifications: true,
  smsNotifications: false
});

// Deactivate contact
const deactivated = await contactRepo.deactivate('contact-id', 'User requested');
```

### 4. Error Handling

```typescript
const result = await contactRepo.get('invalid-id');

if (!result.success) {
  const error = result.error;
  
  // Check error type
  if (error.code === 'RECORD_NOT_FOUND') {
    console.log('Contact not found');
  }
  
  // User-friendly message
  console.log('User message:', error.userMessage);
  
  // Developer details
  console.log('Technical error:', error.message);
  
  // Check if retryable
  if (error.isRetryable()) {
    // Retry the operation
  }
}
```

## Creating New Repositories

### Step 1: Define Your Model Interface

```typescript
import { BaseModel } from '@/repositories/base';

export interface Project extends BaseModel {
  title: string;
  status: string;
  description?: string;
  budget?: number;
  // ... other fields
}
```

### Step 2: Implement Repository Class

```typescript
import { BaseRepository, GraphQLClient } from '@/repositories/base';

export class ProjectRepository extends BaseRepository<Project> {
  
  constructor(client: GraphQLClient) {
    super(client, {
      modelName: 'Project',
      graphqlTypeName: 'Projects', // Must match GraphQL schema
      defaultAuthMode: 'apiKey',
      enableValidation: true
    });
  }

  // Implement required GraphQL operations
  protected getCreateMutation(): string {
    return `
      mutation CreateProject($input: CreateProjectsInput!) {
        createProjects(input: $input) {
          id
          title
          status
          description
          budget
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getUpdateMutation(): string {
    return `
      mutation UpdateProject($input: UpdateProjectsInput!) {
        updateProjects(input: $input) {
          id
          title
          status
          description
          budget
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getDeleteMutation(): string {
    return `
      mutation DeleteProject($input: DeleteProjectsInput!) {
        deleteProjects(input: $input) {
          id
        }
      }
    `;
  }

  protected getGetQuery(): string {
    return `
      query GetProject($id: ID!) {
        getProjects(id: $id) {
          id
          title
          status
          description
          budget
          createdAt
          updatedAt
        }
      }
    `;
  }

  protected getListQuery(): string {
    return `
      query ListProjects($filter: ModelProjectsFilterInput, $limit: Int, $nextToken: String) {
        listProjects(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            id
            title
            status
            description
            budget
            createdAt
            updatedAt
          }
          nextToken
        }
      }
    `;
  }

  // Add custom validation
  protected async validateCreate(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await super.validateCreate(data);

    if (!data.title) {
      throw new ValidationError('Validation failed', [
        { field: 'title', message: 'Title is required' }
      ]);
    }

    if (data.budget && data.budget < 0) {
      throw new ValidationError('Validation failed', [
        { field: 'budget', message: 'Budget must be positive' }
      ]);
    }
  }

  // Add business logic methods
  async findByStatus(status: string): Promise<ServiceResult<Project[]>> {
    return this.find({ status: { eq: status } });
  }

  async updateStatus(id: string, status: string, reason?: string): Promise<ServiceResult<Project>> {
    return this.update({
      id,
      data: { status },
      audit: {
        source: 'status_update',
        metadata: { reason }
      }
    });
  }
}
```

### Step 3: Use the Repository

```typescript
const client = new GraphQLClient();
const projectRepo = new ProjectRepository(client);

// Standard operations work automatically
const project = await projectRepo.create({
  data: {
    title: 'Kitchen Remodel',
    status: 'New',
    budget: 50000
  }
});

// Custom business logic
const newProjects = await projectRepo.findByStatus('New');
const updated = await projectRepo.updateStatus(project.data.id, 'In Progress');
```

## Best Practices

### 1. Repository Design
- One repository per aggregate root
- Keep repositories focused on data access
- Implement business logic as repository methods
- Use descriptive method names that reflect business operations

### 2. Error Handling
- Always check `result.success` before accessing `result.data`
- Use specific error types for different scenarios
- Provide user-friendly error messages
- Log technical details for debugging

### 3. Validation
- Validate at repository level for data integrity
- Validate at service level for business rules
- Use consistent error message formats
- Don't expose internal validation details to users

### 4. Performance
- Use pagination for large datasets
- Implement proper filtering to reduce data transfer
- Cache frequently accessed data when appropriate
- Monitor repository metrics in production

### 5. Testing
- Mock the GraphQL client for unit tests
- Test error scenarios extensively
- Verify validation rules thoroughly
- Use integration tests for end-to-end flows

## GraphQL Query Patterns

### Filtering
```typescript
// Simple filter
{ status: { eq: 'Active' } }

// Complex filter with AND/OR
{
  and: [
    { status: { eq: 'Active' } },
    { or: [
      { priority: { eq: 'High' } },
      { dueDate: { lt: '2024-12-31' } }
    ]}
  ]
}

// String operations
{ name: { contains: 'John' } }
{ email: { beginsWith: 'admin' } }

// Numeric operations
{ budget: { between: [1000, 5000] } }
{ priority: { in: [1, 2, 3] } }
```

### Sorting
```typescript
// Single field sort
{ field: 'createdAt', direction: 'desc' }

// Note: Multiple field sorting requires custom GraphQL implementation
```

### Pagination
```typescript
// First page
{ limit: 20 }

// Subsequent pages
{ limit: 20, nextToken: 'previous-page-token' }
```

## Integration with Existing Code

The repository pattern is designed to gradually replace direct GraphQL calls in the existing codebase:

### Before (Direct GraphQL)
```typescript
import { generateClient } from 'aws-amplify/api';

const client = generateClient({ authMode: 'apiKey' });

const result = await client.graphql({
  query: listContacts,
  variables: { limit: 100 }
});

// Manual error handling
if (result.errors) {
  console.error('GraphQL errors:', result.errors);
}

const contacts = result.data?.listContacts?.items || [];
```

### After (Repository Pattern)
```typescript
import { ContactRepository, GraphQLClient } from '@/repositories';

const client = new GraphQLClient({ defaultAuthMode: 'apiKey' });
const contactRepo = new ContactRepository(client);

const result = await contactRepo.list({ pagination: { limit: 100 } });

// Structured error handling
if (!result.success) {
  console.error('User message:', result.error.userMessage);
  console.error('Technical details:', result.error.message);
  return;
}

const contacts = result.data.items;
```

## Migration Strategy

1. **Phase 1**: Implement base repository classes (✅ Complete)
2. **Phase 2**: Create repositories for core models (Contacts, Projects, Requests)
3. **Phase 3**: Gradually replace direct GraphQL calls in components
4. **Phase 4**: Add advanced features (caching, metrics, etc.)
5. **Phase 5**: Remove direct GraphQL dependencies

## Configuration

### GraphQL Client Configuration
```typescript
const client = new GraphQLClient({
  defaultAuthMode: 'apiKey',      // Default auth mode
  enableLogging: true,            // Request/response logging
  timeout: 30000,                 // 30 second timeout
  maxRetries: 3,                  // Retry failed requests
  retryDelay: 1000,              // 1 second between retries
  enableMetrics: true            // Performance monitoring
});
```

### Repository Configuration
```typescript
const repository = new ContactRepository(client, {
  modelName: 'Contact',           // For logging
  graphqlTypeName: 'Contacts',    // GraphQL schema type
  defaultAuthMode: 'apiKey',      // Auth mode override
  enableValidation: true,         // Input validation
  enableAuditLog: true,          // Operation auditing
  defaultPageSize: 20,           // Default list page size
  maxPageSize: 100               // Maximum allowed page size
});
```

This repository pattern provides a solid foundation for scalable data access in the RealTechee application while maintaining clean separation of concerns and comprehensive error handling.