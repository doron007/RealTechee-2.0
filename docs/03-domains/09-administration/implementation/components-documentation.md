# Admin Components Documentation

## Overview

This document provides comprehensive documentation for the admin panel components, including their interfaces, usage patterns, and architectural considerations.

## Business Logic Layer

### ProjectsService

The core business logic service for project management with contact resolution and memory optimization.

```typescript
import { projectsService, type EnhancedProject } from '../../../services/projectsService';

// Usage example
const result = await projectsService.getEnhancedProjects({
  limit: 50,
  offset: 0,
  includeArchived: false
});
```

#### Interface
```typescript
interface EnhancedProject {
  // Basic project fields
  id: string;
  title?: string;
  status: string;
  propertyAddress?: string;
  propertyType?: string;
  estimatedValue?: number;
  projectType?: string;
  brokerage?: string;
  businessCreatedDate?: string;
  createdAt?: string;
  createdDate?: string;
  
  // Resolved contact information
  clientName?: string;          // From homeownerContactId
  clientEmail?: string;
  clientPhone?: string;
  agentName?: string;           // From agentContactId
  agentEmail?: string;
  agentPhone?: string;
  agentBrokerage?: string;
  
  // Additional homeowners
  homeowner2Name?: string;      // From homeowner2ContactId
  homeowner3Name?: string;      // From homeowner3ContactId
  
  // Raw contact IDs (for reference)
  agentContactId?: string;
  homeownerContactId?: string;
  homeowner2ContactId?: string;
  homeowner3ContactId?: string;
}
```

#### Methods
- `getEnhancedProjects(options?)` - Fetch projects with resolved contacts
- `clearCache()` - Clear contact cache (development)
- `getCacheStats()` - Get cache debugging information

#### Features
- **Foreign Key Resolution**: Automatically resolves contact IDs to names/details
- **Memory Optimization**: TTL-based caching (5 minutes) with size limits (1000 contacts)
- **Pagination Support**: Optional limit/offset parameters
- **Archive Filtering**: Excludes archived projects by default
- **Error Handling**: Comprehensive error handling with logging

## UI Components

### ProjectsTable

Advanced data grid component for project management with Material React Table.

```typescript
import ProjectsTable from '../../../components/admin/projects/ProjectsTable';

// Usage
<ProjectsTable onRefresh={() => void} />
```

#### Props
```typescript
interface ProjectsTableProps {
  onRefresh?: () => void;  // Optional callback for data refresh
}
```

#### Features
- **Material React Table**: Professional data grid with full feature set
- **Column Definitions**: Smart accessor functions for complex data
- **Sorting**: Works correctly with resolved contact names and addresses
- **Filtering**: Global and column-specific filtering
- **Search**: Global search across all visible columns
- **Pagination**: Configurable page sizes (10, 25, 50, 100)
- **Action Buttons**: Open, Edit, Archive with safety controls
- **Status Management**: Visual status indicators with proper styling
- **Memory Monitoring**: Development-time memory tracking

#### Column Structure
```typescript
const columns: MRT_ColumnDef<EnhancedProject>[] = [
  // Status with StatusPill component
  { accessorKey: 'status', header: 'Status' },
  
  // Address with fallback logic (propertyAddress || title)
  { accessorFn: (row) => row.propertyAddress || row.title || 'No address provided' },
  
  // Created date with multiple field support
  { accessorFn: (row) => row.createdDate || row.createdAt },
  
  // Resolved contact names
  { accessorKey: 'clientName', header: 'Owner' },
  { accessorKey: 'agentName', header: 'Agent' },
  
  // Financial data with formatting
  { accessorKey: 'estimatedValue', header: 'Price' },
  
  // Brokerage with agent fallback
  { accessorFn: (row) => row.brokerage || row.agentBrokerage || 'N/A' },
  
  // Actions (Open, Edit, Archive)
  { id: 'actions', enableSorting: false }
]
```

#### Table Configuration
- **Row Selection**: Multi-select with checkboxes
- **Column Ordering**: Drag-and-drop column reordering
- **Column Resizing**: Dynamic column width adjustment
- **Density Toggle**: Compact/standard/comfortable view modes
- **Full Screen**: Expandable full-screen mode
- **Export**: Data export capabilities (built-in)

### ProjectDetail

Comprehensive project detail and edit component with form sections.

```typescript
import ProjectDetail from '../../../components/admin/projects/ProjectDetail';

// Usage (typically in [id].tsx page)
<ProjectDetail projectId={router.query.id as string} />
```

#### Props
```typescript
interface ProjectDetailProps {
  projectId: string;  // Required project ID
}
```

#### Features
- **Professional Interface**: Modern form layout with sections
- **Gallery Management**: Image upload and management
- **Form Sections**: Organized into logical groups
- **Safety Controls**: Only allows editing of seed project during testing
- **Validation**: Form validation before save
- **Error Handling**: User-friendly error messages
- **Navigation**: Breadcrumb navigation and back button

#### Form Sections
1. **Project Information**: Basic details and status
2. **Property Details**: Address, type, financial information
3. **Contact Information**: Linked homeowner and agent details
4. **Gallery**: Image management and selection
5. **Comments**: Project comments and notes
6. **Audit Trail**: Change history and logging

## Utility Components

### StatusPill

Visual status indicator component with consistent styling.

```typescript
import StatusPill from '../../../components/common/ui/StatusPill';

// Usage
<StatusPill status="Active" />
<StatusPill status="Completed" />
<StatusPill status="Archived" />
```

#### Props
```typescript
interface StatusPillProps {
  status: string;  // Status text to display
}
```

#### Features
- **Color Coding**: Automatic color assignment based on status
- **Consistent Styling**: Uniform appearance across components
- **Accessibility**: Proper contrast and screen reader support

## Memory Management Components

### MemoryMonitor Utility

Development-time memory monitoring and leak detection.

```typescript
import { memoryMonitor } from '../../../utils/memoryMonitor';

// Usage examples
memoryMonitor.track('Component: Before operation');
memoryMonitor.logCurrentUsage('ProjectsTable loaded');
const usage = memoryMonitor.getCurrentUsage();
const trend = memoryMonitor.getTrend();
const leakCheck = memoryMonitor.checkForLeaks();
```

#### Key Methods
- `track(label)` - Record memory usage with label
- `logCurrentUsage(context)` - Log current memory to console
- `getCurrentUsage()` - Get formatted memory statistics
- `getTrend()` - Analyze memory usage trends
- `checkForLeaks()` - Detect potential memory leaks
- `startPeriodicMonitoring()` - Begin automatic monitoring

#### Leak Detection
- **Growth Patterns**: Detects consistent memory growth over time
- **Thresholds**: Alerts when memory exceeds 512MB
- **Recommendations**: Provides actionable remediation suggestions
- **Development Only**: Automatically disabled in production

### useMemoryMonitor Hook

React hook for component-level memory monitoring.

```typescript
import { useMemoryMonitor } from '../../../hooks/useMemoryMonitor';

// Usage in components
const ProjectsTable = () => {
  const { track, getCurrentUsage, getTrend } = useMemoryMonitor('ProjectsTable');
  
  // Manual tracking
  track('Before data load');
  
  // Automatic monitoring on mount/unmount
  // Periodic monitoring every 30 seconds
  // Leak detection on unmount
};
```

#### Features
- **Automatic Monitoring**: Tracks mount/unmount automatically
- **Periodic Checks**: Configurable monitoring intervals
- **Component Naming**: Associates monitoring with specific components
- **Manual Tracking**: Additional tracking points as needed

## Typography Components

### Semantic Typography System

Modern H1-H6 and P1-P3 components with responsive scaling.

```typescript
import { H1, H2, H3, H4, H5, H6, P1, P2, P3 } from '../../../components/typography';

// Usage examples
<H1>Main Page Title</H1>        // Always main page title
<H2>Section Heading</H2>        // Always section header
<H3>Card Title</H3>             // Always subsection/card
<P1>Important content</P1>      // Emphasis body text
<P2>Regular content</P2>        // Standard paragraphs
<P3>Small text/labels</P3>      // Supporting info
```

#### Features
- **CSS Clamp()**: Fluid responsive scaling between breakpoints
- **Semantic HTML**: Proper heading hierarchy for accessibility
- **No Props**: Simple component interface without complex configuration
- **Context Independent**: Consistent styling regardless of location

#### Responsive Scaling
- **H1**: 48px→32px responsive scaling
- **H2**: 36px→24px responsive scaling
- **H3**: 24px→20px responsive scaling
- **P1**: 20px→16px responsive scaling (emphasis)
- **P2**: 16px→14px responsive scaling (standard)
- **P3**: 14px→12px responsive scaling (supporting)

## Development Guidelines

### Memory Optimization

1. **Use Business Logic Layer**: Always use ProjectsService for data operations
2. **Monitor Memory**: Use memory monitoring in development
3. **Clean Up**: Implement proper cleanup in useEffect
4. **Cache Wisely**: Leverage TTL caching but avoid memory leaks

### Component Architecture

1. **COO Compliance**: Use props-only styling, no CSS duplication
2. **Typography First**: Always use H1-H6, P1-P3 for text content
3. **Accessibility**: Ensure keyboard navigation and screen reader support
4. **Error Handling**: Implement comprehensive error boundaries

### Testing Strategy

1. **Memory Testing**: Monitor memory usage during tests
2. **Integration Testing**: Test foreign key resolution accuracy
3. **Performance Testing**: Validate table performance with large datasets
4. **Accessibility Testing**: Ensure WCAG compliance

## Performance Considerations

### Table Performance
- **Virtualization**: Material React Table handles large datasets efficiently
- **Pagination**: Server-side pagination for very large datasets
- **Column Virtualization**: Only renders visible columns
- **Memory Management**: Automatic cleanup of unused data

### Data Loading
- **Batch Operations**: Contact resolution in single API call
- **Caching Strategy**: TTL-based caching with size limits
- **Lazy Loading**: Load data on demand
- **Error Recovery**: Graceful degradation for failed operations

### Memory Management
- **Development Monitoring**: Track memory usage patterns
- **Production Optimization**: Disable monitoring in production
- **Cache Limits**: Prevent unbounded memory growth
- **Cleanup Patterns**: Proper component unmount cleanup

This documentation provides a comprehensive guide for working with the admin panel components and understanding their architecture, performance characteristics, and memory management features.