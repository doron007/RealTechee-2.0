# Migration Guide: From GraphQL Calls to Service Layer Hooks

This guide helps you migrate from direct GraphQL calls to the new service layer architecture with React hooks.

## Overview

The new architecture provides:
- **Clean Abstraction**: No more direct GraphQL in components
- **Business Logic**: Centralized in services with validation and workflows
- **Optimistic Updates**: Better UX with immediate UI feedback
- **Error Handling**: Consistent error states and retry logic
- **Caching**: Intelligent cache management with React Query
- **TypeScript Support**: Full type safety throughout the stack

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                   React Components                      │
│                 (Presentation Layer)                    │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                  React Hooks                           │
│              (src/api/hooks/useRequests.ts)            │
│           - Data fetching & caching                    │
│           - Optimistic updates                         │
│           - Loading/error states                       │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                RequestService                          │
│         (src/services/domain/request/RequestService)   │
│           - Business logic & workflows                 │
│           - Lead scoring & assignment                  │
│           - Quote generation                           │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│              RequestRepository                         │
│         (src/repositories/RequestRepository.ts)        │
│           - Data access & CRUD operations              │
│           - GraphQL query execution                    │
│           - Status validation                          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────┐
│                 GraphQL Client                         │
│         (src/repositories/base/GraphQLClient.ts)       │
│           - AWS Amplify integration                    │
│           - Authentication                             │
│           - Connection management                      │
└─────────────────────────────────────────────────────────┘
```

## Migration Steps

### Step 1: Setup Services Provider

First, wrap your app with the ServicesProvider:

```tsx
// pages/_app.tsx or app/layout.tsx
import { CompleteServicesProvider } from '../src/api/providers/ServicesProvider';

export default function App({ children }) {
  return (
    <CompleteServicesProvider
      config={{
        enableDevtools: process.env.NODE_ENV === 'development',
        services: {
          features: {
            notifications: true,
            audit: true,
            realTime: true,
            caching: true,
          }
        }
      }}
    >
      {children}
    </CompleteServicesProvider>
  );
}
```

### Step 2: Replace GraphQL Calls with Hooks

#### Before (Direct GraphQL):
```tsx
import { generateClient } from 'aws-amplify/api';
import { listRequests } from '../graphql/queries';

function RequestsList() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        const client = generateClient();
        const result = await client.graphql({ query: listRequests });
        setRequests(result.data.listRequests.items);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {requests.map(request => (
        <div key={request.id}>{request.product}</div>
      ))}
    </div>
  );
}
```

#### After (Service Layer Hooks):
```tsx
import { useRequests } from '../src/api/hooks/useRequests';

function RequestsList() {
  const {
    data: requests = [],
    isLoading: loading,
    error
  } = useRequests();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {requests.map(request => (
        <div key={request.id}>{request.product}</div>
      ))}
    </div>
  );
}
```

### Step 3: Replace Manual Mutations

#### Before (Manual GraphQL Mutation):
```tsx
import { generateClient } from 'aws-amplify/api';
import { updateRequest } from '../graphql/mutations';

function RequestDetail({ requestId }) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      const client = generateClient();
      await client.graphql({
        query: updateRequest,
        variables: {
          input: { id: requestId, status: newStatus }
        }
      });
      // Manual cache invalidation
      window.location.reload();
    } catch (error) {
      alert('Update failed: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <button 
      onClick={() => handleStatusChange('completed')}
      disabled={updating}
    >
      {updating ? 'Updating...' : 'Mark Complete'}
    </button>
  );
}
```

#### After (Optimistic Updates):
```tsx
import { useUpdateRequest } from '../src/api/hooks/useRequests';

function RequestDetail({ requestId }) {
  const updateRequest = useUpdateRequest();

  const handleStatusChange = async (newStatus) => {
    try {
      await updateRequest.mutateAsync({
        id: requestId,
        updates: { status: newStatus }
      });
      // Automatic cache updates and UI feedback
    } catch (error) {
      // Error handled automatically by the hook
      console.error('Update failed:', error);
    }
  };

  return (
    <button 
      onClick={() => handleStatusChange('completed')}
      disabled={updateRequest.isPending}
    >
      {updateRequest.isPending ? 'Updating...' : 'Mark Complete'}
    </button>
  );
}
```

### Step 4: Use Business Logic Hooks

#### Before (Manual Business Logic):
```tsx
function RequestDetail({ requestId }) {
  const [leadScore, setLeadScore] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const calculateLeadScore = async () => {
    setCalculating(true);
    try {
      // Manual calculation logic
      const request = await fetchRequest(requestId);
      const score = calculateScore(request); // Custom logic
      setLeadScore(score);
    } catch (error) {
      console.error('Score calculation failed:', error);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div>
      <button onClick={calculateLeadScore} disabled={calculating}>
        Calculate Lead Score
      </button>
      {leadScore && (
        <div>Score: {leadScore}/100</div>
      )}
    </div>
  );
}
```

#### After (Service Layer Business Logic):
```tsx
import { useLeadScore } from '../src/api/hooks/useRequests';

function RequestDetail({ requestId }) {
  const {
    data: leadScore,
    isLoading: calculating,
    refetch: calculateLeadScore
  } = useLeadScore(requestId);

  return (
    <div>
      <button onClick={() => calculateLeadScore()} disabled={calculating}>
        Calculate Lead Score
      </button>
      {leadScore && (
        <div>
          <div>Score: {leadScore.overallScore}/100</div>
          <div>Grade: {leadScore.grade}</div>
          <div>Priority: {leadScore.priorityLevel}</div>
          <div>Recommendations:</div>
          <ul>
            {leadScore.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Common Patterns

### 1. List with Filtering

```tsx
import { useRequests } from '../src/api/hooks/useRequests';

function FilteredRequestsList() {
  const [statusFilter, setStatusFilter] = useState('');
  
  const { data: requests, isLoading } = useRequests({
    filters: statusFilter ? { status: { eq: statusFilter } } : undefined
  });

  return (
    <div>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="">All Statuses</option>
        <option value="new">New</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        requests?.map(request => (
          <div key={request.id}>{request.product} - {request.status}</div>
        ))
      )}
    </div>
  );
}
```

### 2. Complex Operations

```tsx
import { useRequestOperations } from '../src/api/hooks/useRequests';

function RequestActions({ requestId }) {
  const {
    assignRequest,
    generateQuote,
    scheduleFollowUp,
    isLoading
  } = useRequestOperations();

  const handleComplexWorkflow = async () => {
    try {
      // Auto-assign to best agent
      const assignment = await assignRequest.mutateAsync({
        requestId,
        options: { strategy: 'auto_balance', considerSpecialty: true }
      });

      // Generate quote
      const quote = await generateQuote.mutateAsync({
        requestId,
        quoteInput: { includeAlternatives: true, validityPeriod: 30 }
      });

      // Schedule follow-up
      await scheduleFollowUp.mutateAsync({
        requestId,
        schedule: { 
          followUpType: 'quote_follow_up',
          priority: 'high',
          reminderDays: [1, 3, 7]
        }
      });

      alert('Workflow completed successfully!');
    } catch (error) {
      alert('Workflow failed: ' + error.message);
    }
  };

  return (
    <button onClick={handleComplexWorkflow} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Start Workflow'}
    </button>
  );
}
```

### 3. Real-time Updates

```tsx
import { useRequest, useInvalidateRequests } from '../src/api/hooks/useRequests';

function RequestDetailWithRealTime({ requestId }) {
  const { data: request } = useRequest(requestId);
  const invalidateRequests = useInvalidateRequests();

  // Simulate real-time updates (you could use WebSockets, SSE, etc.)
  useEffect(() => {
    const interval = setInterval(() => {
      invalidateRequests.detail(requestId);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [requestId]);

  return (
    <div>
      <h1>Request {request?.id}</h1>
      <p>Status: {request?.status}</p>
      <p>Last updated: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}
```

## Performance Optimizations

### 1. Prefetching

```tsx
import { usePrefetchRequest } from '../src/api/hooks/useRequests';

function RequestsGrid({ requests }) {
  const prefetchRequest = usePrefetchRequest();

  return (
    <div>
      {requests.map(request => (
        <div 
          key={request.id}
          onMouseEnter={() => prefetchRequest(request.id)} // Prefetch on hover
        >
          <Link href={`/requests/${request.id}`}>
            {request.product}
          </Link>
        </div>
      ))}
    </div>
  );
}
```

### 2. Infinite Scrolling

```tsx
import { useInfiniteRequests } from '../src/api/hooks/useRequests';

function InfiniteRequestsList() {
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteRequests({ pageSize: 20 });

  const requests = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <div>
      {requests.map(request => (
        <div key={request.id}>{request.product}</div>
      ))}
      
      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Error Handling

The new hooks provide consistent error handling:

```tsx
import { useRequest, useUpdateRequest } from '../src/api/hooks/useRequests';

function RequestWithErrorHandling({ requestId }) {
  const { 
    data: request, 
    isLoading, 
    error: fetchError,
    refetch 
  } = useRequest(requestId);
  
  const updateRequest = useUpdateRequest();

  if (fetchError) {
    return (
      <div>
        <p>Failed to load request: {fetchError.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const handleUpdate = async (updates) => {
    try {
      await updateRequest.mutateAsync({ id: requestId, updates });
    } catch (error) {
      // Error is automatically handled by React Query
      // You can add custom handling here if needed
      console.error('Update failed:', error);
    }
  };

  return (
    <div>
      {isLoading ? 'Loading...' : request?.product}
      {updateRequest.isError && (
        <div>Update failed: {updateRequest.error?.message}</div>
      )}
    </div>
  );
}
```

## Testing

The new architecture is much easier to test:

```tsx
// __tests__/RequestDetail.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RequestDetail from '../RequestDetail';

// Mock the hooks
jest.mock('../src/api/hooks/useRequests', () => ({
  useRequest: jest.fn(),
  useUpdateRequest: jest.fn(),
}));

test('displays request details', () => {
  const mockUseRequest = require('../src/api/hooks/useRequests').useRequest;
  const mockUseUpdateRequest = require('../src/api/hooks/useRequests').useUpdateRequest;
  
  mockUseRequest.mockReturnValue({
    data: { id: '1', product: 'Kitchen Remodel', status: 'new' },
    isLoading: false,
    error: null
  });
  
  mockUseUpdateRequest.mockReturnValue({
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false
  });

  const queryClient = new QueryClient();
  
  render(
    <QueryClientProvider client={queryClient}>
      <RequestDetail requestId="1" />
    </QueryClientProvider>
  );

  expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
  expect(screen.getByText('new')).toBeInTheDocument();
});
```

## Benefits Summary

1. **Cleaner Components**: No GraphQL boilerplate in UI components
2. **Better UX**: Optimistic updates and loading states
3. **Business Logic**: Centralized in services with proper validation
4. **Type Safety**: Full TypeScript support throughout the stack
5. **Caching**: Intelligent cache management with React Query
6. **Error Handling**: Consistent error states and retry logic
7. **Testing**: Much easier to mock and test
8. **Performance**: Built-in optimizations like prefetching and infinite scrolling

## Migration Checklist

- [ ] Wrap app with ServicesProvider
- [ ] Replace direct GraphQL calls with useRequests hooks
- [ ] Replace manual mutations with operation hooks
- [ ] Move business logic to service layer
- [ ] Update error handling to use hook states
- [ ] Add loading states using hook states
- [ ] Remove manual cache invalidation
- [ ] Update tests to mock hooks instead of GraphQL
- [ ] Add prefetching for performance where needed
- [ ] Remove unused GraphQL query/mutation imports

This migration will significantly improve the maintainability, testability, and user experience of your application.