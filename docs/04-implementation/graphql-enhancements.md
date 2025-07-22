# GraphQL Enhancement Implementation Guide

## Overview

This document outlines the comprehensive GraphQL enhancements implemented for the RealTechee 2.0 platform. These enhancements provide real-time data updates, advanced caching, pagination, filtering, and audit logging capabilities.

## Implemented Services

### 1. Subscription Service (`utils/subscriptionService.ts`)

Provides real-time data updates through GraphQL subscriptions.

#### Key Features:
- Real-time model updates (onCreate, onUpdate, onDelete)
- Automatic React Query cache updates
- Multi-model subscription support
- Connection management and cleanup

#### Usage Example:
```typescript
import { useRealTimeData } from '../utils/subscriptionService';

// In a React component
const ProjectsPage = () => {
  // Subscribe to real-time project updates
  useRealTimeData.useProjects((data) => {
    console.log('Project updated:', data);
  });

  // Subscribe to specific project comments
  useRealTimeData.useProjectComments(projectId, (data) => {
    console.log('Comment updated:', data);
  });

  return <div>Projects with real-time updates</div>;
};
```

### 2. Enhanced GraphQL Service (`utils/enhancedGraphQLService.ts`)

Advanced query optimization with intelligent caching and request deduplication.

#### Key Features:
- Query deduplication
- Stale-while-revalidate caching
- Background revalidation
- Batch query processing
- Performance monitoring

#### Usage Example:
```typescript
import { enhancedGraphQLService } from '../utils/enhancedGraphQLService';

// Optimized query with caching
const result = await enhancedGraphQLService.optimizedQuery(
  'projects_list',
  () => projectsAPI.list(),
  {
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true,
    deduplicate: true
  }
);

// Batch multiple queries
const batchResults = await enhancedGraphQLService.batchQueries([
  { key: 'projects', fn: () => projectsAPI.list() },
  { key: 'quotes', fn: () => quotesAPI.list() },
  { key: 'requests', fn: () => requestsAPI.list() }
]);
```

### 3. Pagination Service (`utils/paginationService.ts`)

Advanced pagination with virtual scrolling and intelligent prefetching.

#### Key Features:
- Standard pagination with prefetching
- Virtual scrolling for large datasets
- Cursor-based pagination
- Search with pagination
- Performance analytics

#### Usage Example:
```typescript
import { paginationService } from '../utils/paginationService';

// Standard pagination
const result = await paginationService.paginateQuery('Projects', {
  pageSize: 25,
  currentPage: 1,
  filters: { status: { eq: 'Active' } },
  prefetchPages: 2
});

// Virtual scrolling for large lists
const virtualData = await paginationService.getVirtualScrollData('Projects', {
  startIndex: 0,
  endIndex: 100,
  itemHeight: 60,
  containerHeight: 600
});
```

### 4. Advanced Filtering Service (`utils/advancedFilteringService.ts`)

Complex filtering with user-friendly filter definitions and suggestions.

#### Key Features:
- Type-safe filter definitions
- Field validation and suggestions
- Saved filters
- Complex query builder
- Performance optimization

#### Usage Example:
```typescript
import { advancedFilteringService, FilterDefinition } from '../utils/advancedFilteringService';

// Build complex filter
const filterDefinition: FilterDefinition = {
  and: [
    { field: 'status', operator: 'eq', value: 'Active' },
    { field: 'budget', operator: 'between', value: [10000, 50000] },
    {
      or: [
        { field: 'assignedTo', operator: 'contains', value: 'john' },
        { field: 'assignedTo', operator: 'contains', value: 'jane' }
      ]
    }
  ]
};

const result = await advancedFilteringService.executeAdvancedQuery('Projects', {
  filters: filterDefinition,
  sort: [{ field: 'createdDate', direction: 'desc' }],
  pagination: { limit: 50 }
});

// Get filter suggestions
const suggestions = await advancedFilteringService.getFilterSuggestions(
  'Projects',
  'status',
  'Act'
);
```

### 5. Audit Logging Service (`utils/auditLoggingService.ts`)

Comprehensive audit logging for compliance and security monitoring.

#### Key Features:
- Automatic mutation logging
- Batch processing for performance
- Security alert detection
- Compliance validation (GDPR, SOX, HIPAA, PCI)
- Real-time dashboard

#### Usage Example:
```typescript
import { auditLoggingService } from '../utils/auditLoggingService';

// Log a mutation
await auditLoggingService.logMutation(
  {
    tableName: 'Projects',
    recordId: '123',
    action: 'updated',
    changeType: 'status_change',
    previousData: { status: 'Draft' },
    newData: { status: 'Active' },
    changedFields: ['status']
  },
  {
    userId: 'user123',
    userEmail: 'user@example.com',
    userRole: 'admin',
    source: 'admin_panel',
    ipAddress: '192.168.1.1'
  }
);

// Query audit logs
const auditLogs = await auditLoggingService.queryAuditLogs({
  tableName: 'Projects',
  dateRange: {
    start: '2025-01-01T00:00:00Z',
    end: '2025-01-31T23:59:59Z'
  }
});

// Generate compliance report
const report = await auditLoggingService.generateAuditReport({
  dateRange: {
    start: '2025-01-01T00:00:00Z',
    end: '2025-01-31T23:59:59Z'
  },
  format: 'json',
  includeDetails: true
});
```

## Integration with Existing Code

### React Query Integration

All services are designed to work seamlessly with the existing React Query setup:

```typescript
// In lib/queryClient.ts - Add new query keys
export const queryKeys = {
  // ... existing keys
  
  // Enhanced query keys
  optimizedProjects: (filters: any) => ['projects', 'optimized', filters] as const,
  paginatedQuotes: (page: number, filters: any) => ['quotes', 'paginated', page, filters] as const,
  auditLogs: (filters: any) => ['audit', 'logs', filters] as const,
} as const;
```

### Component Integration

```typescript
// Enhanced component with real-time updates and advanced features
const ProjectsTable = () => {
  const [filters, setFilters] = useState<FilterDefinition>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Real-time updates
  useRealTimeData.useProjects((updatedProject) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  });

  // Paginated query with caching
  const { data, loading, error } = useQuery({
    queryKey: queryKeys.paginatedProjects(currentPage, filters),
    queryFn: () => paginationService.paginateQuery('Projects', {
      pageSize: 25,
      currentPage,
      filters,
      prefetchPages: 2
    }),
    staleTime: 5 * 60 * 1000
  });

  return (
    <div>
      <AdvancedFilter onFiltersChange={setFilters} />
      <ProjectsList data={data?.data} />
      <Pagination 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        hasNextPage={data?.pagination.hasNextPage}
      />
    </div>
  );
};
```

## Performance Optimizations

### 1. Query Deduplication
Identical queries are automatically deduplicated to prevent unnecessary network requests.

### 2. Intelligent Caching
- Memory-based caching with TTL
- Stale-while-revalidate for better UX
- Background revalidation
- Cache invalidation patterns

### 3. Batch Processing
- Multiple queries batched together
- Configurable batch sizes and delays
- Automatic error handling and retries

### 4. Prefetching
- Intelligent page prefetching
- Background data loading
- Predictive caching based on user behavior

## Security Features

### 1. Audit Logging
- All mutations automatically logged
- User context tracking
- IP address and session monitoring
- Compliance flags and retention policies

### 2. Access Control
- Role-based query filtering
- User context validation
- Sensitive data protection

### 3. Security Monitoring
- Anomaly detection
- Brute force protection
- Privilege escalation detection
- Data exfiltration monitoring

## Monitoring and Analytics

### 1. Performance Metrics
```typescript
// Get performance statistics
const stats = enhancedGraphQLService.getPerformanceMetrics();
console.log('Cache hit rate:', stats.cacheStats.freshEntries / stats.cacheStats.totalEntries);

const paginationStats = paginationService.getPerformanceStats();
console.log('Average response time:', paginationStats.avgResponseTime);
```

### 2. Audit Dashboard
```typescript
// Real-time audit monitoring
const dashboard = await auditLoggingService.getAuditDashboard('last_day');
console.log('Security alerts:', dashboard.securityMetrics);
```

## Best Practices

### 1. Query Optimization
- Use specific query keys for better cache management
- Implement proper loading states
- Handle errors gracefully
- Use pagination for large datasets

### 2. Real-time Updates
- Subscribe only to necessary models
- Implement proper cleanup in useEffect
- Handle connection failures
- Debounce frequent updates

### 3. Filtering and Search
- Validate filter inputs
- Use saved filters for common queries
- Implement progressive disclosure for complex filters
- Provide clear feedback for empty results

### 4. Security and Compliance
- Log all sensitive operations
- Implement proper user context
- Regular compliance audits
- Monitor for security anomalies

## Troubleshooting

### Common Issues

1. **Subscription Connection Failures**
   ```typescript
   // Check subscription status
   const status = subscriptionService.getSubscriptionStatus();
   console.log('Active subscriptions:', status.activeSubscriptions);
   ```

2. **Cache Performance Issues**
   ```typescript
   // Clean up stale cache entries
   enhancedGraphQLService.cacheManager.cleanup();
   ```

3. **Pagination Issues**
   ```typescript
   // Clear pagination cache
   paginationService.clearCaches();
   ```

4. **Audit Log Performance**
   ```typescript
   // Force batch processing
   await auditLoggingService.cleanup();
   ```

## Migration Guide

### From Standard Amplify Queries

Before:
```typescript
const result = await client.models.Projects.list();
```

After:
```typescript
const result = await enhancedGraphQLService.optimizedQuery(
  'projects_list',
  () => client.models.Projects.list(),
  { ttl: 5 * 60 * 1000 }
);
```

### Adding Real-time Updates

Before:
```typescript
const ProjectsPage = () => {
  const { data } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.list()
  });
  return <ProjectsList data={data} />;
};
```

After:
```typescript
const ProjectsPage = () => {
  const { data } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsAPI.list()
  });

  // Add real-time updates
  useRealTimeData.useProjects();

  return <ProjectsList data={data} />;
};
```

## Conclusion

These GraphQL enhancements provide a robust foundation for building high-performance, real-time applications with comprehensive audit logging and security monitoring. The modular design allows for easy integration and customization based on specific requirements.

For detailed API documentation, refer to the TypeScript interfaces and JSDoc comments in each service file.