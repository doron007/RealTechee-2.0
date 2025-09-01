# RealTechee API Layer

A comprehensive React hooks-based API layer that provides clean frontend abstraction over the service architecture.

## Features

✅ **Clean Abstraction** - No more GraphQL in components  
✅ **Business Logic** - Centralized services with validation  
✅ **Optimistic Updates** - Immediate UI feedback  
✅ **Error Handling** - Consistent error states  
✅ **Caching** - Intelligent cache management  
✅ **TypeScript** - Full type safety  
✅ **Testing** - Easy to mock and test  
✅ **Performance** - Built-in optimizations  

## Quick Start

### 1. Setup Provider

```tsx
// pages/_app.tsx
import { CompleteServicesProvider } from '../src/api';

export default function App({ Component, pageProps }) {
  return (
    <CompleteServicesProvider>
      <Component {...pageProps} />
    </CompleteServicesProvider>
  );
}
```

### 2. Use Hooks in Components

```tsx
import { useRequest, useUpdateRequest } from '../src/api';

function RequestDetail({ requestId }) {
  const { data: request, isLoading, error } = useRequest(requestId);
  const updateRequest = useUpdateRequest();

  const handleStatusChange = async (newStatus) => {
    await updateRequest.mutateAsync({
      id: requestId,
      updates: { status: newStatus }
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Request {request.id}</h1>
      <p>Status: {request.status}</p>
      <button onClick={() => handleStatusChange('completed')}>
        Complete Request
      </button>
    </div>
  );
}
```

## Architecture

```
Components (Presentation)
    ↓
React Hooks (src/api/hooks)
    ↓  
RequestService (Business Logic)
    ↓
RequestRepository (Data Access)
    ↓
GraphQL Client (AWS Amplify)
```

## Available Hooks

### Query Hooks (Data Fetching)

- `useRequest(id)` - Single request with relations
- `useRequests(options)` - Paginated list with filtering
- `useInfiniteRequests(options)` - Infinite scrolling
- `useRequestsByStatus(status)` - Filtered by status
- `useRequestsSearch(criteria)` - Advanced search
- `useLeadScore(requestId)` - Business intelligence

### Mutation Hooks (Data Operations)

- `useCreateRequest()` - Create with business logic
- `useUpdateRequest()` - Update with optimistic UI
- `useDeleteRequest()` - Delete with confirmation
- `useAssignRequest()` - Agent assignment logic
- `useAddRequestNote()` - Add notes and comments
- `useGenerateQuote()` - Business quote generation
- `useScheduleFollowUp()` - Automated scheduling
- `useMergeRequests()` - Duplicate management

### Utility Hooks

- `useRequestOperations()` - Combined operations
- `usePrefetchRequest()` - Performance optimization
- `useInvalidateRequests()` - Cache management

## Common Patterns

### Basic CRUD Operations

```tsx
function RequestManager() {
  const { data: requests } = useRequests();
  const { createRequest, updateRequest, deleteRequest } = useRequestOperations();

  return (
    <div>
      {/* Create */}
      <button onClick={() => createRequest.mutate({ 
        requestData: { product: 'Kitchen Remodel', status: 'new' }
      })}>
        Create Request
      </button>

      {/* List */}
      {requests?.map(request => (
        <div key={request.id}>
          {request.product}
          
          {/* Update */}
          <button onClick={() => updateRequest.mutate({
            id: request.id,
            updates: { status: 'in_progress' }
          })}>
            Update
          </button>

          {/* Delete */}
          <button onClick={() => deleteRequest.mutate(request.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Advanced Business Operations

```tsx
function BusinessWorkflow({ requestId }) {
  const { 
    assignRequest, 
    generateQuote, 
    scheduleFollowUp 
  } = useRequestOperations();

  const runCompleteWorkflow = async () => {
    try {
      // Auto-assign to best agent
      const assignment = await assignRequest.mutateAsync({
        requestId,
        options: { 
          strategy: 'auto_balance', 
          considerSpecialty: true 
        }
      });

      // Generate quote with business rules
      const quote = await generateQuote.mutateAsync({
        requestId,
        quoteInput: {
          includeAlternatives: true,
          validityPeriod: 30,
          adjustmentFactors: {
            complexity: 1.2,
            materials: 1.0,
            timeline: 0.9,
            location: 1.1
          }
        }
      });

      // Schedule intelligent follow-up
      await scheduleFollowUp.mutateAsync({
        requestId,
        schedule: {
          followUpType: 'quote_follow_up',
          priority: 'high',
          reminderDays: [1, 3, 7, 14],
          autoReschedule: true
        }
      });

    } catch (error) {
      console.error('Workflow failed:', error);
    }
  };

  return (
    <button onClick={runCompleteWorkflow}>
      Run Complete Workflow
    </button>
  );
}
```

### Search and Filtering

```tsx
function RequestsSearch() {
  const [searchCriteria, setSearchCriteria] = useState({
    status: '',
    product: '',
    assignedTo: '',
    dateRange: { from: '', to: '' }
  });

  const { 
    data: searchResults, 
    isLoading: searching 
  } = useRequestsSearch(searchCriteria, { debounceMs: 300 });

  return (
    <div>
      <input
        placeholder="Search product..."
        onChange={(e) => setSearchCriteria({
          ...searchCriteria,
          product: e.target.value
        })}
      />

      <select
        onChange={(e) => setSearchCriteria({
          ...searchCriteria,
          status: e.target.value
        })}
      >
        <option value="">All Statuses</option>
        <option value="new">New</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      {searching ? (
        <div>Searching...</div>
      ) : (
        <div>
          {searchResults?.map(request => (
            <div key={request.id}>
              {request.product} - {request.status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Lead Intelligence

```tsx
function LeadIntelligence({ requestId }) {
  const { 
    data: leadScore, 
    isLoading: calculating,
    refetch: recalculate
  } = useLeadScore(requestId);

  if (calculating) return <div>Calculating lead score...</div>;

  return (
    <div>
      <h3>Lead Intelligence</h3>
      
      <div>
        <strong>Overall Score:</strong> {leadScore?.overallScore}/100
        <span className={`grade-${leadScore?.grade?.toLowerCase()}`}>
          (Grade {leadScore?.grade})
        </span>
      </div>

      <div>
        <strong>Priority:</strong> 
        <span className={`priority-${leadScore?.priorityLevel}`}>
          {leadScore?.priorityLevel?.toUpperCase()}
        </span>
      </div>

      <div>
        <strong>Conversion Probability:</strong> 
        {(leadScore?.conversionProbability * 100)?.toFixed(1)}%
      </div>

      <div>
        <strong>Key Factors:</strong>
        <ul>
          <li>Data Completeness: {leadScore?.factors?.dataCompleteness}/100</li>
          <li>Source Quality: {leadScore?.factors?.sourceQuality}/100</li>
          <li>Engagement Level: {leadScore?.factors?.engagementLevel}/100</li>
          <li>Budget Alignment: {leadScore?.factors?.budgetAlignment}/100</li>
        </ul>
      </div>

      <div>
        <strong>Recommendations:</strong>
        <ul>
          {leadScore?.recommendations?.map((rec, idx) => (
            <li key={idx}>{rec}</li>
          ))}
        </ul>
      </div>

      <button onClick={() => recalculate()}>
        Recalculate Score
      </button>
    </div>
  );
}
```

### Performance Optimization

```tsx
function OptimizedRequestsList() {
  // Infinite scrolling for large datasets
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteRequests({ pageSize: 20 });

  const prefetchRequest = usePrefetchRequest();
  const requests = data?.pages.flatMap(page => page.data) ?? [];

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

      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Error Handling

All hooks provide consistent error handling:

```tsx
function RequestWithErrorHandling({ requestId }) {
  const { 
    data: request, 
    isLoading, 
    error,
    refetch 
  } = useRequest(requestId);

  const updateRequest = useUpdateRequest();

  // Query error handling
  if (error) {
    return (
      <div className="error">
        <h3>Failed to load request</h3>
        <p>{error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  // Mutation error handling
  const handleUpdate = async () => {
    try {
      await updateRequest.mutateAsync({
        id: requestId,
        updates: { status: 'completed' }
      });
    } catch (error) {
      // Error state is automatically managed by the hook
      alert(`Update failed: ${error.message}`);
    }
  };

  return (
    <div>
      {isLoading ? 'Loading...' : request?.product}
      
      <button onClick={handleUpdate} disabled={updateRequest.isPending}>
        {updateRequest.isPending ? 'Updating...' : 'Complete Request'}
      </button>

      {updateRequest.isError && (
        <div className="error">
          Update failed: {updateRequest.error?.message}
        </div>
      )}
    </div>
  );
}
```

## Configuration

### Basic Configuration

```tsx
import { CompleteServicesProvider } from '../src/api';

function App() {
  return (
    <CompleteServicesProvider
      config={{
        enableDevtools: process.env.NODE_ENV === 'development',
        services: {
          features: {
            notifications: true,
            audit: true,
            realTime: false, // Disable for better performance
            caching: true,
          }
        }
      }}
    >
      <YourApp />
    </CompleteServicesProvider>
  );
}
```

### Advanced Configuration

```tsx
import { QueryClient } from '@tanstack/react-query';
import { ServicesProvider, configureServices } from '../src/api';

// Custom React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
    },
  },
});

// Custom service configuration
configureServices({
  graphql: {
    endpoint: 'https://your-api.com/graphql',
    authMode: 'cognito',
  },
  features: {
    notifications: true,
    audit: true,
    realTime: true,
    caching: true,
  },
  environment: 'production',
});

function App() {
  return (
    <ServicesProvider config={{ queryClient }}>
      <YourApp />
    </ServicesProvider>
  );
}
```

## Testing

The hooks are easy to test with Jest and React Testing Library:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RequestDetail from './RequestDetail';

// Mock the hooks
jest.mock('../src/api/hooks/useRequests', () => ({
  useRequest: jest.fn(),
  useUpdateRequest: jest.fn(),
}));

describe('RequestDetail', () => {
  let queryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  test('displays request details', async () => {
    const { useRequest, useUpdateRequest } = require('../src/api/hooks/useRequests');
    
    useRequest.mockReturnValue({
      data: { 
        id: '1', 
        product: 'Kitchen Remodel', 
        status: 'new' 
      },
      isLoading: false,
      error: null,
    });

    useUpdateRequest.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RequestDetail requestId="1" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  test('handles update operations', async () => {
    const mockMutateAsync = jest.fn();
    const { useRequest, useUpdateRequest } = require('../src/api/hooks/useRequests');
    
    useRequest.mockReturnValue({
      data: { id: '1', product: 'Kitchen Remodel', status: 'new' },
      isLoading: false,
      error: null,
    });

    useUpdateRequest.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RequestDetail requestId="1" />
      </QueryClientProvider>
    );

    const updateButton = screen.getByText('Complete Request');
    await userEvent.click(updateButton);

    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: '1',
      updates: { status: 'completed' }
    });
  });
});
```

## Migration from GraphQL

See the [Migration Guide](./docs/MigrationGuide.md) for detailed steps to migrate from direct GraphQL calls to this service layer.

## TypeScript Support

All hooks are fully typed with TypeScript:

```tsx
import type { Request, EnhancedRequest, ServiceResult } from '../src/api';

function TypedRequestComponent({ requestId }: { requestId: string }) {
  // Fully typed hook results
  const { 
    data: request, // Type: EnhancedRequest | undefined
    isLoading,     // Type: boolean
    error          // Type: Error | null
  } = useRequest(requestId);

  const updateRequest = useUpdateRequest();

  const handleUpdate = async (updates: Partial<Request>) => {
    // Fully typed mutation
    const result = await updateRequest.mutateAsync({
      id: requestId,
      updates // Type-checked against Request interface
    });
    // result is typed as Request
  };

  return <div>{request?.product}</div>;
}
```

## Performance Tips

1. **Use prefetching** for anticipated navigation
2. **Enable optimistic updates** for immediate feedback
3. **Implement infinite scrolling** for large lists
4. **Use status-based filtering** to reduce data transfer
5. **Enable background refetching** for real-time feel
6. **Configure appropriate stale times** for your use case

## Debugging

Enable debug mode in development:

```tsx
<CompleteServicesProvider
  config={{ enableDevtools: true }}
  showDebugInfo={true}
>
  <App />
</CompleteServicesProvider>
```

This will show:
- React Query DevTools
- Service initialization status
- Real-time debugging overlay

## Support

For questions and issues:
1. Check the [Migration Guide](./docs/MigrationGuide.md)
2. Look at [example implementations](./examples/)
3. Review the service layer documentation
4. Contact the development team