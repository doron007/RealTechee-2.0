# Analytics System Documentation

## Overview
The RealTechee 2.0 Analytics System provides comprehensive business intelligence capabilities for the admin backoffice. This system offers real-time insights into project performance, revenue analytics, and operational metrics with advanced filtering and visualization capabilities.

---

## 🎯 **System Architecture**

### **Core Components**
```
Analytics Dashboard (AnalyticsDashboard.tsx)
├── KPI Cards (Revenue, Projects, Conversion Rates)
├── Interactive Charts (Recharts integration)
├── Advanced Filters (AdvancedFilters.tsx)
├── Real-time Data (TanStack Query)
└── Export Functionality (JSON/CSV)
```

### **Data Flow**
```
GraphQL/DynamoDB → analyticsService.ts → TanStack Query → React Components → UI
                                     ↓
                              Filtered Analytics Methods
                                     ↓
                              AdvancedFilters Component
```

---

## 📊 **Analytics Dashboard Features**

### **Key Performance Indicators (KPIs)**
- **Total Projects**: All-time project count with monthly growth trend
- **Active Projects**: Currently in-progress projects
- **Total Revenue**: Cumulative revenue with percentage breakdown
- **Conversion Rate**: Completion rate with trend indicators

### **Interactive Visualizations**
- **Revenue Trends**: Area chart showing revenue and profit over time
- **Project Status Distribution**: Pie chart with status breakdown
- **Projects Over Time**: Line chart tracking project creation
- **Top Performing Agents**: Bar chart with revenue and project counts
- **Revenue by Product**: Product performance analysis
- **Quick Stats**: Average project value, growth rate, and period metrics

### **Real-time Features**
- **Auto-refresh**: 5-minute interval updates
- **Manual Refresh**: On-demand data reload
- **Live Indicators**: Visual feedback for data freshness
- **Optimistic Updates**: Immediate UI updates with background sync

---

## 🔍 **Advanced Filtering System**

### **Date Range Filtering**
```typescript
interface DateRangeFilter {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  preset: string; // 'last7days', 'last30days', 'thisMonth', etc.
}
```

**Preset Options:**
- Last 7/30/90 days
- This/Last Month
- This/Last Quarter  
- This/Last Year
- Custom Range

### **Multi-Criteria Data Filters**
```typescript
interface DataFilters {
  statuses: string[];    // Project statuses
  agents: string[];      // Agent names
  products: string[];    // Product types
  brokerages: string[];  // Brokerage companies
}
```

### **Metric Controls**
```typescript
interface MetricToggles {
  revenue: boolean;      // Show/hide revenue metrics
  projects: boolean;     // Show/hide project metrics
  conversion: boolean;   // Show/hide conversion metrics
  growth: boolean;       // Show/hide growth metrics
}
```

### **Advanced Options**
- **Grouping**: Month/Quarter/Year data aggregation
- **Compare Mode**: Period-over-period comparison
- **Show Projections**: Future trend forecasting
- **Filter Persistence**: State management and URL parameters (ready)

---

## 🛠 **Technical Implementation**

### **Analytics Service (analyticsService.ts)**

#### **Core Methods**
```typescript
class AnalyticsService {
  // Basic analytics
  async getOverviewMetrics(): Promise<AnalyticsOverview>
  async getProjectAnalytics(): Promise<ProjectAnalytics>
  async getRevenueAnalytics(): Promise<RevenueAnalytics>
  async getTimeRangeData(range: TimeRange): Promise<TimeRangeData>
  
  // Filtered analytics
  async getFilteredOverviewMetrics(filters: AnalyticsFilters): Promise<AnalyticsOverview>
  async getFilteredProjectAnalytics(filters: AnalyticsFilters): Promise<ProjectAnalytics>
  async getFilteredRevenueAnalytics(filters: AnalyticsFilters): Promise<RevenueAnalytics>
  
  // Utility methods
  async getFilterOptions(): Promise<FilterOptions>
  async exportAnalyticsData(format: 'json' | 'csv'): Promise<string>
  clearCache(): void
}
```

#### **Caching Strategy**
- **Cache Duration**: 5 minutes for analytics data
- **Cache Keys**: Unique keys based on filters and refresh state
- **Invalidation**: Manual refresh and data mutations
- **Memory Management**: Automatic cleanup and size limits

#### **Data Processing**
- **Real-time Calculations**: Dynamic metric computation
- **Relationship Resolution**: Foreign key lookups with caching
- **Performance Optimization**: Efficient data aggregation
- **Error Handling**: Comprehensive error boundaries

### **Query Integration (TanStack Query)**

#### **Query Configuration**
```typescript
const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
  queryKey: [...queryKeys.analyticsOverview, refreshKey, filters],
  queryFn: () => hasActiveFilters 
    ? analyticsService.getFilteredOverviewMetrics(filters)
    : analyticsService.getOverviewMetrics(),
  refetchInterval: 5 * 60 * 1000, // 5 minutes
});
```

#### **Smart Filtering**
- **Conditional Queries**: Uses filtered methods only when filters are active
- **Optimistic Performance**: Regular methods for unfiltered data
- **Cache Optimization**: Separate cache keys for filtered vs unfiltered data
- **Background Updates**: Automatic data refresh with visual indicators

### **Filter State Management**

#### **State Structure**
```typescript
const [filters, setFilters] = useState<AnalyticsFilters>({
  dateRange: {
    startDate: null,
    endDate: null,
    preset: 'last30days',
  },
  metrics: {
    revenue: true,
    projects: true,
    conversion: true,
    growth: true,
  },
  dataFilters: {
    statuses: [],
    agents: [],
    products: [],
    brokerages: [],
  },
  groupBy: 'month',
  compareMode: false,
  showProjections: false,
});
```

#### **Filter Logic**
- **Active Detection**: Smart detection of applied filters
- **Performance**: Only processes filtered data when necessary
- **Persistence**: Ready for URL parameter integration
- **Reset Functionality**: One-click filter clearing

---

## 📈 **Data Visualization (Recharts)**

### **Chart Types**
- **Area Charts**: Revenue trends with gradient fills
- **Pie Charts**: Status distribution with custom colors
- **Line Charts**: Project count over time
- **Bar Charts**: Agent performance and product revenue

### **Chart Configuration**
```typescript
// Revenue Trends (Area Chart)
<AreaChart data={revenueAnalytics.monthlyRevenue}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip formatter={(value: number) => [formatCurrencyFull(value), '']} />
  <Legend />
  <Area type="monotone" dataKey="revenue" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} />
  <Area type="monotone" dataKey="profit" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.6} />
</AreaChart>
```

### **Responsive Design**
- **ResponsiveContainer**: Automatic sizing for all screen sizes
- **Breakpoint Adaptation**: Mobile-optimized chart layouts
- **Touch Interaction**: Mobile-friendly chart interactions
- **Accessibility**: ARIA labels and keyboard navigation

---

## 🎨 **UI/UX Features**

### **Material-UI Integration**
- **Date Pickers**: Material-UI X date components with dayjs
- **Autocomplete**: Multi-select filter components
- **Cards**: Elevated KPI display cards
- **Grid System**: Responsive layout system
- **Typography**: Semantic H1-H6, P1-P3 components

### **Visual Indicators**
- **Active Filters**: Chip-based active filter display
- **Loading States**: Circular progress indicators
- **Error Handling**: Alert components for error states
- **Trends**: Color-coded trend indicators (green/red)

### **Interaction Patterns**
- **Filter Expansion**: Collapsible filter panel
- **Export Actions**: Download buttons with progress
- **Refresh Controls**: Manual refresh with loading states
- **Navigation**: Breadcrumb and context navigation

---

## 🔧 **Configuration & Customization**

### **Chart Colors**
```typescript
const COLORS = ['#1976d2', '#dc004e', '#ed6c02', '#2e7d32', '#9c27b0', '#d32f2f'];
```

### **Date Presets**
```typescript
const DATE_PRESETS = [
  { value: 'custom', label: 'Custom Range' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  // ... additional presets
];
```

### **Refresh Intervals**
- **Analytics Data**: 5 minutes
- **Filter Options**: 10 minutes
- **Manual Refresh**: Immediate
- **Background Sync**: Intelligent batching

---

## 📊 **Export Functionality**

### **Supported Formats**
- **JSON**: Complete data export with metadata
- **CSV**: Simplified tabular format for Excel
- **Future**: PDF reports, Excel with charts

### **Export Implementation**
```typescript
async exportAnalyticsData(format: 'json' | 'csv' = 'json'): Promise<string> {
  const [overview, projects, revenue] = await Promise.all([
    this.getOverviewMetrics(),
    this.getProjectAnalytics(),
    this.getRevenueAnalytics()
  ]);

  const data = {
    overview,
    projects,
    revenue,
    exportedAt: new Date().toISOString()
  };

  return format === 'json' ? JSON.stringify(data, null, 2) : this.convertToCSV(data);
}
```

---

## 🚀 **Performance Optimization**

### **Caching Strategy**
- **Service-Level Cache**: 5-minute TTL with Map-based storage
- **Query Cache**: TanStack Query with intelligent invalidation
- **Filter Cache**: Persistent filter options with 10-minute TTL
- **Memory Management**: Automatic cleanup and monitoring

### **Data Processing**
- **Efficient Aggregation**: Optimized reduce operations
- **Lazy Loading**: On-demand data fetching
- **Memoization**: React hooks optimization
- **Background Updates**: Non-blocking data refresh

### **Rendering Optimization**
- **Virtual Scrolling**: Large dataset handling
- **Chart Optimization**: Responsive container sizing
- **Component Memoization**: React.memo for expensive components
- **Bundle Splitting**: Lazy loading of analytics components

---

## 🔒 **Security & Access Control**

### **Authorization**
- **Admin Access**: Required for analytics dashboard
- **Role-Based**: Different access levels for different metrics
- **Session Management**: Secure authentication flows
- **Data Filtering**: User-specific data access controls

### **Data Privacy**
- **Sensitive Data**: No personal information exposure
- **Aggregated Metrics**: Only statistical summaries
- **Audit Logging**: Access and export tracking
- **Compliance**: GDPR and data protection standards

---

## 📝 **Development Guidelines**

### **Adding New Metrics**
1. **Service Layer**: Add calculation logic to analyticsService.ts
2. **Interface**: Update TypeScript interfaces
3. **UI Component**: Create visualization component
4. **Integration**: Add to dashboard with proper loading states
5. **Testing**: Add comprehensive test coverage

### **Adding New Filters**
1. **Filter Interface**: Update AnalyticsFilters interface
2. **UI Component**: Add filter control to AdvancedFilters
3. **Service Logic**: Implement filtering in applyFiltersToProjects
4. **State Management**: Update filter state handling
5. **Persistence**: Add to URL parameter system (when ready)

### **Performance Considerations**
- **Data Size**: Monitor query performance with large datasets
- **Cache Efficiency**: Optimize cache hit rates
- **Bundle Size**: Keep analytics components lazy-loaded
- **Memory Usage**: Monitor component memory consumption

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- **Service Methods**: Analytics calculation logic
- **Utility Functions**: Data transformation and formatting
- **Component Logic**: Filter state management
- **Hook Testing**: Custom hook behavior

### **Integration Tests**
- **API Integration**: GraphQL query validation
- **Cache Behavior**: TanStack Query integration
- **Filter Logic**: End-to-end filtering workflows
- **Export Functionality**: Data export validation

### **E2E Tests**
- **Dashboard Loading**: Full page load testing
- **Filter Interactions**: User workflow testing
- **Chart Rendering**: Visual regression testing
- **Export Workflows**: Download functionality testing

---

This analytics system provides a robust foundation for business intelligence within the RealTechee 2.0 admin system, offering both current insights and the flexibility for future enhancements.