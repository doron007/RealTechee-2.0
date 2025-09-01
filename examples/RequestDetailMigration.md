# RequestDetail Component Migration Example

## Before: Direct GraphQL Usage

```tsx
// OLD: Direct GraphQL and API calls
import { requestsAPI, quotesAPI, projectsAPI } from '../../../utils/amplifyAPI';
import { enhancedRequestsService } from '../../../services/enhancedRequestsService';

function RequestDetail({ requestId }: Props) {
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequest = async () => {
      setLoading(true);
      try {
        // Direct API calls - tightly coupled
        const requestData = await enhancedRequestsService.getById(requestId);
        setRequest(requestData);
      } catch (err) {
        setError('Failed to load request');
      } finally {
        setLoading(false);
      }
    };
    
    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      // Direct service calls - no abstraction
      await requestsAPI.update(requestId, { status: newStatus });
      // Manual state update
      setRequest(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError('Failed to update status');
    }
  };

  // ... rest of component with scattered business logic
}
```

## After: Clean Hook Usage

```tsx
// NEW: Clean hooks with service layer
import { useRequest, useUpdateRequest, useRequestOperations } from '../../../api/hooks/useRequests';
import { ServicesProvider } from '../../../api/providers/ServicesProvider';

function RequestDetail({ requestId }: Props) {
  // Clean data fetching with built-in loading/error states
  const { 
    data: request, 
    isLoading, 
    error,
    refetch 
  } = useRequest(requestId);

  // Mutation with optimistic updates
  const updateRequest = useUpdateRequest();
  
  // Business operations
  const { 
    assignToAgent,
    generateQuote,
    scheduleFollowUp 
  } = useRequestOperations();

  const handleStatusUpdate = async (newStatus: string) => {
    // Clean business logic call
    updateRequest.mutate({
      id: requestId,
      updates: { status: newStatus }
    }, {
      onSuccess: () => {
        // Automatic cache invalidation
        refetch();
      }
    });
  };

  const handleAssignAgent = async (agentId: string) => {
    // Business logic in service layer
    assignToAgent.mutate({
      requestId,
      agentId,
      options: { 
        autoNotify: true,
        balanceWorkload: true 
      }
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      <H1>{request.title}</H1>
      
      {/* Clean component logic - no business rules */}
      <StatusSelector 
        value={request.status}
        onChange={handleStatusUpdate}
        disabled={updateRequest.isLoading}
      />
      
      <AgentAssignment
        request={request}
        onAssign={handleAssignAgent}
        isAssigning={assignToAgent.isLoading}
      />
    </div>
  );
}

// Wrap with provider for service access
export default function RequestDetailPage(props) {
  return (
    <ServicesProvider>
      <RequestDetail {...props} />
    </ServicesProvider>
  );
}
```

## Key Benefits

### 1. **Separation of Concerns**
- **Before**: Business logic mixed with UI
- **After**: UI focused on presentation, services handle business logic

### 2. **Error Handling**
- **Before**: Manual try/catch everywhere
- **After**: Centralized error handling in hooks

### 3. **Loading States**
- **Before**: Manual loading state management
- **After**: Built-in loading states from React Query

### 4. **Cache Management**
- **Before**: Manual state updates and synchronization
- **After**: Automatic cache invalidation and updates

### 5. **Type Safety**
- **Before**: Any types, manual type casting
- **After**: Full TypeScript support throughout

## Migration Steps

1. **Install Provider**: Wrap component tree with `<ServicesProvider>`
2. **Replace API Calls**: Use hooks instead of direct service calls
3. **Remove State Management**: Let React Query handle data state
4. **Update Error Handling**: Use hook error states
5. **Test**: Verify functionality matches original

## Business Logic Examples

### Lead Scoring (Moved to Service)
```tsx
// OLD: In component
const calculateScore = (request) => {
  let score = 0;
  if (request.budget > 10000) score += 20;
  if (request.timeline === 'urgent') score += 15;
  // ... complex scoring logic in UI
  return score;
};

// NEW: In service (called via hook)
const { data: leadScore } = useLeadScore(requestId);
```

### Status Transitions (Moved to Service)
```tsx
// OLD: In component
const canTransitionTo = (currentStatus, newStatus) => {
  const transitions = {
    'new': ['assigned', 'quoted'],
    'assigned': ['in_progress', 'quoted'],
    // ... business rules in UI
  };
  return transitions[currentStatus]?.includes(newStatus);
};

// NEW: In service (automatic validation)
const updateRequest = useUpdateRequest({
  onError: (error) => {
    if (error.code === 'INVALID_STATUS_TRANSITION') {
      showError('Status transition not allowed');
    }
  }
});
```

## Testing Benefits

### Before: Hard to Test
```tsx
// Can't test business logic without rendering component
// Must mock GraphQL client
// Brittle integration tests only
```

### After: Easy to Test
```tsx
// Test business logic independently
import { RequestService } from '../../services/RequestService';

describe('RequestService', () => {
  it('should calculate lead score correctly', () => {
    const mockRepo = createMockRepository();
    const service = new RequestService({ requestRepository: mockRepo });
    
    const score = service.calculateLeadScore(mockRequest);
    expect(score).toBe(85);
  });
});

// Test hooks independently
import { renderHook } from '@testing-library/react-hooks';
import { useRequest } from '../../hooks/useRequests';

describe('useRequest', () => {
  it('should handle loading states', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useRequest('test-id')
    );
    
    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.data).toBeDefined();
  });
});
```

This migration pattern can be applied to any component currently using direct GraphQL calls, providing immediate benefits in maintainability, testability, and developer experience.