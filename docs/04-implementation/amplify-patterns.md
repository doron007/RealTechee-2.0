# AWS Amplify Gen 2.0 Data Access Patterns

This document outlines the reusable patterns established for working with Amplify Gen 2.0 across the RealTechee project.

## 🎯 **Current Data Access Architecture (2025)**

### **Pattern 1: Service Layer with Dual Access Methods (Recommended)**
```typescript
// 1. Import both GraphQL client and API utility
import { generateClient as generateGraphQLClient } from 'aws-amplify/api';
import { projectsAPI } from '../utils/amplifyAPI';

// 2. Initialize GraphQL client
const graphqlClient = generateGraphQLClient({ authMode: 'apiKey' });

// 3. Use GraphQL for complex queries with relations
const result = await graphqlClient.graphql({
  query: LIST_PROJECTS_WITH_RELATIONS,
  variables: { limit: 2000 }
});

// 4. Use API utility for simple CRUD operations
const updateResult = await projectsAPI.update(projectId, updates);
```

### **Pattern 2: Working vs Non-Working Methods**
- ✅ **WORKS**: GraphQL queries (`client.graphql()`) - Used by form submissions
- ✅ **WORKS**: API utilities for Projects (`projectsAPI.update()`)
- ❌ **FAILS**: API utilities for Requests (`requestsAPI.update()`) - Browser context issue

**Root Cause**: `client.models` is empty in browser during assignment operations

**Fix Priority**:
1. **Immediate**: Use GraphQL pattern for all new features
2. **Future**: Debug why `client.models` becomes empty during assignment
3. **Long-term**: Standardize all services to dual GraphQL/API pattern

### **Pattern 3: Signal-Driven Notification System**
```typescript
// Signal emission pattern for forms
import { signalEmitter } from '@/services/signalEmitter';

await signalEmitter.emitFormSubmission('form_type', {
  customerName: formData.name,
  customerEmail: formData.email,
  dashboardUrl: `${window.location.origin}/admin/path/${recordId}`
});

// Template processing pattern
Handlebars.registerHelper('formatPhone', (phone: string) => { /* implementation */ });
{{{fileLinks uploadedMedia}}} // Triple braces for raw HTML output
```

---

# Legacy Patterns (Pre-2025)

## Architecture Overview

### Three-Tier Loading Strategy
Our implementation uses a three-tier approach to optimize User Perceived Latency (UPL):

1. **Tier 1**: Essential data loads immediately
2. **Tier 2**: Related data loads in background
3. **Tier 3**: Complete data loads on-demand

## Core API Layer

### `amplifyAPI.ts`
Generic API wrapper providing consistent CRUD operations for all 26 data models.

#### Basic Operations
```typescript
import { projectsAPI } from '../utils/amplifyAPI';

// Basic CRUD
const result = await projectsAPI.create(data);
const result = await projectsAPI.list();
const result = await projectsAPI.get(id);
const result = await projectsAPI.update(id, updates);
const result = await projectsAPI.delete(id);
```

#### Optimized Operations
```typescript
// Filtering and pagination
const result = await projectsAPI.listOptimized({
  filter: { status: { eq: 'active' } },
  limit: 20
});

// Load with relationships
const result = await projectsAPI.getWithRelations(id, ['address', 'agent']);
```

### `optimizedProjectsAPI`
Specialized API for projects with three-tier loading strategy.

```typescript
import { optimizedProjectsAPI } from '../utils/amplifyAPI';

// Tier 1: Essential card data
const cards = await optimizedProjectsAPI.loadProjectCards(filter, 6);

// Tier 2: Background enrichment
const enriched = await optimizedProjectsAPI.loadProjectsWithRelations(projectIds);

// Tier 3: Full project data
const full = await optimizedProjectsAPI.loadFullProject(projectId);

// Related data
const comments = await optimizedProjectsAPI.getProjectComments(projectId);
const milestones = await optimizedProjectsAPI.getProjectMilestones(projectId);
const payments = await optimizedProjectsAPI.getProjectPaymentTerms(projectId);
```

## Reusable Hooks

### `useProjectData` - Project Detail Pages
```typescript
import { useProjectData } from '../hooks';

const ProjectDetailPage = () => {
  const { project, milestones, payments, comments, loading, error } = useProjectData({
    projectId,
    loadFromSessionStorage: true
  });

  // Component renders with loading states handled
};
```

### `useAmplifyData` - Generic Data Loading
```typescript
import { useAmplifyData } from '../hooks';

const { data, loading, error, refetch } = useAmplifyData({
  fetchFunction: () => contactsAPI.list(),
  dependencies: [filter]
});
```

### `usePaginatedAmplifyData` - Paginated Lists
```typescript
import { usePaginatedAmplifyData } from '../hooks';

const { data, loading, hasMore, loadMore } = usePaginatedAmplifyData({
  fetchFunction: ({ limit, nextToken }) => quotesAPI.listOptimized({ limit, nextToken }),
  pageSize: 20
});
```

### `useListData` - List Pages with Filtering
```typescript
import { useListData } from '../hooks';

const ListPage = () => {
  const {
    currentItems,
    loading,
    error,
    currentPage,
    totalPages,
    updateFilter,
    goToNextPage,
    goToPreviousPage
  } = useListData({
    fetchFunction: (filter) => entityAPI.loadCards(filter),
    itemsPerPage: 6,
    defaultFilter: { status: 'active' }
  });
};
```

## Implementation Examples

### Migrating a List Page

**Before (REST API):**
```typescript
// Old pattern
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/entities')
    .then(res => res.json())
    .then(setData)
    .finally(() => setLoading(false));
}, []);
```

**After (Amplify + Hooks):**
```typescript
// New pattern
const { currentItems, loading, error, updateFilter } = useListData({
  fetchFunction: (filter) => optimizedEntityAPI.loadCards(filter),
  itemsPerPage: 6
});
```

### Migrating a Detail Page

**Before:**
```typescript
// Old pattern - multiple API calls, complex state management
const [entity, setEntity] = useState(null);
const [related, setRelated] = useState([]);
// ... complex useEffect with multiple fetch calls
```

**After:**
```typescript
// New pattern - single hook handles everything
const { entity, related, loading, error } = useEntityData({
  entityId,
  loadFromSessionStorage: true
});
```

## Field Mapping

When migrating from CSV to Amplify, ensure field name compatibility:

```typescript
// Map Amplify fields to legacy field names for component compatibility
const mappedData = amplifyData.map(item => ({
  ...item,
  'Legacy Field Name': item.modernFieldName,
  'Status': item.status,
  'Bedrooms': item.bedrooms || 0
}));
```

## Error Handling

All hooks provide consistent error handling:

```typescript
const { data, loading, error } = useAmplifyData({ ... });

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <DataComponent data={data} />;
```

## Performance Optimizations

1. **Selective Loading**: Only load data needed for immediate display
2. **Background Enrichment**: Load related data while user views main content
3. **On-Demand Loading**: Load complete data only when needed
4. **Session Storage**: Cache data for instant navigation
5. **Parallel Requests**: Use Promise.all for independent data loads

## Best Practices

1. **Always use the hook pattern** for data loading
2. **Leverage session storage** for navigation performance
3. **Handle loading and error states** consistently
4. **Use TypeScript interfaces** for type safety
5. **Follow the three-tier loading strategy** for read-heavy operations
6. **Map field names** when migrating from legacy systems
7. **Test with real Amplify data** to ensure compatibility

## Adding New Entities

To add support for a new entity:

1. **Extend amplifyAPI.ts** if needed
2. **Create specialized API** (like optimizedProjectsAPI)
3. **Create custom hook** (like useProjectData)
4. **Follow established patterns** for consistency
5. **Update this documentation** with new patterns

## Migration Checklist

- [ ] Replace REST API calls with Amplify API
- [ ] Implement proper field mapping
- [ ] Add loading and error states
- [ ] Use appropriate hook pattern
- [ ] Test with real data
- [ ] Update imports
- [ ] Remove old API files
- [ ] Update tests if applicable