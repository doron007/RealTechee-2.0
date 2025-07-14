/**
 * Lazy-loaded admin components for performance optimization
 * Phase 18: Bundle splitting and code optimization
 */

import { lazy } from 'react';

// Analytics components - loaded only when needed
export const AnalyticsDashboard = lazy(() => import('./analytics/AnalyticsDashboard'));

// Data grid components - loaded on demand
export const ProjectsDataGrid = lazy(() => import('./projects/ProjectsDataGrid'));
export const QuotesDataGrid = lazy(() => import('./quotes/QuotesDataGrid'));
export const RequestsDataGrid = lazy(() => import('./requests/RequestsDataGrid'));

// Detail components - loaded when viewing specific items
export const ProjectDetail = lazy(() => import('./projects/ProjectDetail'));
export const QuoteDetail = lazy(() => import('./quotes/QuoteDetail'));
export const RequestDetail = lazy(() => import('./requests/RequestDetail'));

// Advanced components - loaded when specific features are accessed
export const AdvancedSearchDialog = lazy(() => import('./common/AdvancedSearchDialog'));
export const VirtualizedDataGrid = lazy(() => import('./common/VirtualizedDataGrid'));

// Note: These components will be implemented in future phases
// export const ExportDialog = lazy(() => import('./common/ExportDialog'));
// export const BulkOperationsDialog = lazy(() => import('./common/BulkOperationsDialog'));
// export const PerformanceMonitor = lazy(() => import('./common/PerformanceMonitor'));

// Loading fallback component for all lazy components
export { default as LazyLoadingFallback } from './common/LazyLoadingFallback';