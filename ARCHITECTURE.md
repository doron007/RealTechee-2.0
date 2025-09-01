# RealTechee 2.0 - Complete 3-Layer Architecture

## Overview

This document describes the complete backend/frontend separation architecture implemented for RealTechee 2.0. The architecture follows clean architecture principles with clear separation of concerns, dependency injection, and comprehensive type safety.

## Architecture Layers

### 1. Repository Layer (`/repositories`)
**Purpose**: Data access abstraction with centralized GraphQL operations

#### Key Components:
- **BaseRepository**: Abstract base class providing common CRUD operations
- **GraphQLClient**: Centralized GraphQL client with retry logic and error handling
- **Entity Repositories**: RequestRepository, QuoteRepository, ProjectRepository, ContactRepository, PropertyRepository
- **Caching**: Built-in caching with TTL and cache invalidation
- **Relations Support**: Native support for GraphQL relations and nested data

#### Features:
- ✅ Zero direct GraphQL calls from business logic
- ✅ Consistent error handling and logging
- ✅ Type-safe operations with full TypeScript support
- ✅ Automatic caching with configurable TTL
- ✅ Query optimization and batch operations
- ✅ Retry logic with exponential backoff

### 2. Service Layer (`/services`)
**Purpose**: Business logic, validation, and workflow management

#### Key Components:
- **BaseService**: Abstract service with validation patterns and business rules
- **Business Services**: RequestService, QuoteService, ProjectService
- **Validation Framework**: Field validation, business rule validation, custom validators
- **Workflow Engine**: State management and business process automation
- **Event System**: Business event notifications and audit trails

#### Features:
- ✅ Complete business logic isolation from UI
- ✅ Comprehensive validation (required fields, formats, business rules)
- ✅ Workflow state management
- ✅ Business event handling
- ✅ Enhanced entities with computed fields
- ✅ Permission and access control
- ✅ Audit logging

### 3. Frontend Layer (`/hooks/api`)
**Purpose**: React hooks providing clean frontend interface

#### Key Components:
- **React Query Integration**: Caching, background updates, optimistic updates
- **Management Hooks**: Comprehensive hooks combining all operations
- **Query Key Management**: Consistent cache invalidation strategies
- **Loading States**: Granular loading states for all operations
- **Error Handling**: User-friendly error messages and recovery

#### Features:
- ✅ Zero direct service/repository calls from components
- ✅ Automatic background data fetching and updates
- ✅ Optimistic updates for better UX
- ✅ Comprehensive loading and error states
- ✅ Cache invalidation strategies
- ✅ Type-safe operations throughout

## Dependency Flow

```
Frontend Components
         ↓ (uses)
    React Hooks
         ↓ (calls)
   Business Services  
         ↓ (uses)
    Repositories
         ↓ (queries)
     GraphQL API
```

## Implementation Details

### Repository Pattern Implementation

```typescript
// repositories/RequestRepository.ts
export class RequestRepository extends BaseRepository<Request, RequestFilter> {
  protected modelName = 'Requests';
  protected client = apiKeyClient;
  
  // Automatic caching, error handling, retry logic
  // GraphQL query optimization
  // Relations support
}
```

### Service Layer Implementation

```typescript
// services/business/RequestService.ts
export class RequestService extends BaseService<Request, RequestFilter> {
  protected repository = requestRepository;
  
  // Business validation rules
  // Workflow management
  // Enhanced entities with computed fields
  // Event handling
}
```

### Frontend Hook Implementation

```typescript
// hooks/api/useRequests.ts
export function useRequestManagement(id?: string) {
  // React Query integration
  // Comprehensive data management
  // Cache strategies
  // Loading/error states
  // Optimistic updates
}
```

## Architecture Benefits

### 1. **Complete Separation of Concerns**
- UI components only handle presentation
- Services handle all business logic
- Repositories handle all data access
- No direct database/GraphQL calls from frontend

### 2. **Type Safety Throughout**
- End-to-end TypeScript with strict mode
- Type-safe service methods
- Type-safe React hooks
- Compile-time error detection

### 3. **Testability**
- Each layer can be tested independently
- Dependency injection enables mocking
- Business logic tests without UI
- Repository tests without business logic

### 4. **Performance Optimization**
- Repository-level caching
- React Query caching and background updates
- Query optimization and batching
- Optimistic updates

### 5. **Error Handling**
- Centralized error handling in repositories
- Business error handling in services
- User-friendly error messages in hooks
- Comprehensive logging throughout

### 6. **Scalability**
- Easy to add new entities (follow existing patterns)
- Service layer scales with business complexity
- Repository layer handles data growth
- Frontend hooks handle UI complexity

## Usage Examples

### Creating a Request

```typescript
// Component usage
function CreateRequestForm() {
  const { createRequest, isCreating, createError } = useRequestManagement();
  
  const handleSubmit = async (data: RequestCreateData) => {
    await createRequest(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create Request'}
      </button>
      {createError && <ErrorMessage error={createError} />}
    </form>
  );
}
```

### Processing Workflow

```typescript
// Component usage
function RequestWorkflow({ requestId }: { requestId: string }) {
  const { processWorkflow, businessState } = useRequestManagement(requestId);
  
  const handleAction = async (action: string) => {
    await processWorkflow({ id: requestId, action });
  };
  
  return (
    <div>
      <p>Status: {businessState?.status}</p>
      <p>Next Actions: {businessState?.nextActions.join(', ')}</p>
      {businessState?.nextActions.map(action => (
        <button key={action} onClick={() => handleAction(action)}>
          {action}
        </button>
      ))}
    </div>
  );
}
```

## Initialization

```typescript
// lib/architecture/index.ts
import { initializeArchitecture } from './lib/architecture';

// Initialize the complete architecture
await initializeArchitecture({
  validateOnInit: true,
  environment: 'production',
  enableMetrics: true,
  enableCaching: true
});
```

## File Structure

```
├── repositories/              # Data Access Layer
│   ├── interfaces/           # Repository interfaces
│   ├── core/                # Base classes and GraphQL client
│   ├── RequestRepository.ts  # Entity-specific repositories
│   ├── QuoteRepository.ts
│   └── ProjectRepository.ts
├── services/                 # Business Logic Layer
│   ├── interfaces/          # Service interfaces
│   ├── core/               # Base service classes
│   ├── business/           # Business service implementations
│   └── index.ts
├── hooks/api/               # Frontend API Layer
│   ├── useRequests.ts      # Entity-specific hooks
│   ├── useQuotes.ts
│   ├── useProjects.ts
│   └── index.ts
├── lib/                     # Infrastructure
│   ├── di/                 # Dependency injection
│   └── architecture/       # Architecture initialization
└── ARCHITECTURE.md         # This documentation
```

## Migration Strategy

### For Existing Components:
1. Replace direct amplifyAPI calls with React hooks
2. Move business logic from components to services
3. Update type definitions to use enhanced entities
4. Implement error handling with new error states

### For New Features:
1. Create repository if new entity
2. Create service with business logic
3. Create React hooks for frontend
4. Register services in DI container
5. Use hooks in components

## Performance Considerations

- **Repository caching**: 5-minute TTL for most entities
- **React Query stale time**: 5 minutes for lists, 2 minutes for business state
- **Cache invalidation**: Automatic invalidation on mutations
- **Query optimization**: Batch requests where possible
- **Background updates**: Automatic refetch on window focus

## Testing Strategy

- **Repository Layer**: Test data access patterns, caching, error handling
- **Service Layer**: Test business logic, validation, workflows
- **Frontend Layer**: Test React hooks, loading states, error handling
- **Integration Tests**: Test complete flows end-to-end
- **E2E Tests**: Test user workflows with Playwright

## Future Enhancements

1. **Event Sourcing**: Complete audit trail of all business events
2. **Real-time Updates**: WebSocket integration for live updates
3. **Background Jobs**: Queue-based processing for long operations
4. **Metrics Dashboard**: Performance and business metrics
5. **Feature Flags**: Gradual rollout of new features
6. **API Rate Limiting**: Protection against abuse
7. **Data Export**: Business intelligence and reporting

---

This architecture provides a solid foundation for scaling RealTechee 2.0 to handle enterprise-level requirements while maintaining code quality and developer productivity.