# RealTechee Project Structure

This document provides an overview of the current project structure and organization based on the September 2025 implementation.

## Directory Structure

### `/components` - React Components (13 Feature Directories)

- **`/common`** - Reusable components shared across multiple pages
  - `/buttons` - Button components
  - `/layout` - Layout components (Header, Footer, Layout)
  - `/ui` - UI elements and design components (StatusPill, Card, etc.)
- **`/home`** - Components specific to the home page
- **`/about`** - Components for the about page  
- **`/products`** - Product-specific components
- **`/projects`** - Project-related public components
- **`/contact`** - Contact page components
- **`/forms`** - Form components and form-related utilities
- **`/style-guide`** - Components for the style guide
- **`/typography`** - Modern semantic typography system (H1-H6, P1-P3)
- **`/seo`** - SEO-related components (meta tags, structured data)
- **`/notifications`** - Notification display components  
- **`/analytics`** - Analytics and tracking components
- **`/admin`** - Comprehensive admin/backoffice system (15 subdirectories)
  - `/assignments/` - Task and resource assignment
  - `/analytics/` - Business analytics and reporting
  - `/contacts/` - Contact and CRM management
  - `/lifecycle/` - Lead lifecycle management
  - `/meetings/` - Meeting scheduling and management
  - `/modals/` - Admin-specific modal components
  - `/notifications/` - Real-time notification monitoring
  - `/projects/` - Project management with full CRUD
  - `/quotes/` - Quote management with workflow
  - `/requests/` - Request management and processing
  - `/signals/` - Signal processing and monitoring
  - `/system/` - System administration components
  - `/templates/` - Template management
  - `/users/` - User management components
  - `/common/` - Shared admin components
  - **Features**: Material React Table with virtual scrolling, advanced filtering, bulk operations, real-time updates, foreign key resolution

### `/services` - Business Logic Layer (7 Organized Directories)

**Architecture**: Domain-driven design with clear service boundaries and interface-based contracts.

- **`/core/`** - Base services and utilities (3 services)
  - `BaseService.ts` - Abstract base service class with common functionality
  - `sessionStorageService.ts` - Browser storage management  
  - `dataValidationService.ts` - Data validation utilities

- **`/business/`** - Domain-specific business logic (13 services)
  - `RequestService.ts`, `QuoteService.ts`, `ProjectService.ts` - Core business entities
  - `enhancedRequestsService.ts`, `enhancedQuotesService.ts`, `enhancedProjectsService.ts` - Enhanced versions
  - `caseManagementService.ts`, `leadLifecycleService.ts` - Specialized workflows
  - `requestWorkflowService.ts`, `requestStatusService.ts` - Status management
  - `projectManagerService.ts`, `quoteCreationService.ts` - Domain-specific logic

- **`/admin/`** - Admin-specific services (5 services)
  - `taskManagementService.ts` - Task assignment and tracking
  - `assignmentService.ts`, `flexibleAssignmentService.ts` - Assignment management
  - `workloadBalancingService.ts`, `skillManagementService.ts` - Resource optimization

- **`/notifications/`** - All notification services (8 services)
  - `signalEmitter.ts`, `signalProcessor.ts` - Signal-driven notifications
  - `formNotificationIntegration.ts` - Form-specific notifications (active)
  - `notificationService.ts`, `notificationRetryService.ts` - Core notification logic
  - `leadNotificationService.ts`, `meetingNotificationService.ts` - Specialized notifications
  - `clientTemplateProcessor.ts` - Template processing

- **`/analytics/`** - Analytics and tracking (3 services)
  - `analyticsService.ts`, `roiTrackingService.ts`, `leadScoringService.ts`

- **`/interfaces/`** - TypeScript interfaces and contracts
  - `IBaseService.ts` - Service interface definitions

- **`/integrations/`** - External service integrations (future expansion)

- **`index.ts`** - Centralized service exports with organized re-exports

### `/pages` - Next.js Route Structure
- **`/products`** - Pages for product sections
- **`/admin`** - Admin interface routes with comprehensive CRUD pages
- **`/contact`** - Contact and form pages  
- **`/api`** - API routes and serverless functions

### `/public` - Static Assets
- `/actions` - Action-related icons and images
- `/brand-assets` - Brand-related assets
- `/fonts` - Custom fonts
- `/icons` - UI icons
- `/images` - General images
- `/logo` - Logo variations
- `/videos` - Video content

### `/styles` - CSS and Styling
- `globals.css` - Global CSS styles

### `/types` - TypeScript Type Definitions
- Domain-specific type definitions organized by feature
- Component prop interfaces
- Service layer contracts
- API response types
- Database model types (auto-generated from Amplify schema)

### `/utils` - Utility Functions and Helpers
- `componentUtils.ts` - Component utility functions
- `animationUtils.ts` - Animation utilities
- `amplifyAPI.ts` - AWS Amplify API wrapper with generic model interface
- `memoryMonitor.ts` - Memory monitoring and leak detection
- `logger.ts` - Structured logging system
- `notificationService.ts` - Notification utilities

### `/hooks` - Custom React Hooks
- `useMemoryMonitor.ts` - Development memory monitoring
- `useProjectsQuery.ts`, `useRequestsQuery.ts` - Data fetching hooks
- `useUnsavedChanges.ts` - Unsaved changes detection

### `/lib` - Libraries and Configurations  
- `queryClient.ts` - TanStack Query configuration
- `logger.ts` - Logging configuration
- `analytics.ts` - Analytics tracking

### `/scripts` - Development Scripts
- Utility scripts for development and deployment

## Database Architecture

- **43 Data Models** - Complete business entity coverage with Amplify Gen 2
- **Core Entities**: Requests, Contacts, Projects, Properties, Quotes, SignalEvents
- **Supporting Models**: NotificationQueue, BackOfficeRequestStatuses, audit tables
- **Production Scale**: 1,449+ records, auto-scaling DynamoDB
- **Schema Location**: `/amplify/data/resource.ts`

## Architecture Patterns

### Service Layer Organization (September 2025)
- **Domain-Driven Design**: Services organized by business capability
- **Separation of Concerns**: Clear boundaries between core, business, and infrastructure  
- **Enterprise Patterns**: Interface-based design with dependency injection
- **Performance**: Intelligent caching and memory management

### Component Architecture  
- **Component-Oriented Output (COO)**: Props-only styling, no external CSS
- **Modern Typography**: Semantic H1-H6, P1-P3 components
- **Material Design**: MUI/MUI-X for admin interfaces
- **Accessibility**: WCAG 2.1 AA compliance throughout

### Import Conventions

Services and components use barrel exports for clean imports:

```typescript
// Service imports - organized by domain
import { requestService, quoteService, projectService } from '@/services';
import { signalEmitter } from '@/services/notifications';
import { analyticsService } from '@/services/analytics';

// Component imports - feature-based
import { Button, Card, StatusPill } from '@/components/common';
import { AdminDataGrid, VirtualizedDataGrid } from '@/components/admin/common';
```

## Development Workflow

### Adding New Business Logic
1. **Identify Domain**: Core, business, admin, notifications, or analytics
2. **Service Creation**: Follow interface patterns in appropriate directory  
3. **Type Definitions**: Add to `/types` and service interfaces
4. **Export Integration**: Update service index files
5. **Testing**: Follow comprehensive testing patterns (584+ tests)

### Adding New UI Components
1. **Component Placement**: Feature-based organization (admin vs public)
2. **Follow Patterns**: Use COO architecture and existing components as templates
3. **Type Safety**: Define prop interfaces with strict typing
4. **Barrel Exports**: Update index.ts files for clean imports
5. **Accessibility**: Ensure WCAG compliance and keyboard navigation

### Adding New Admin Features  
1. **CRUD Pattern**: Follow existing admin component patterns
2. **Material React Table**: Use virtualized table patterns for large datasets
3. **Foreign Key Resolution**: Implement relationship navigation
4. **Real-time Updates**: Integrate with TanStack Query caching
5. **Testing**: Add to comprehensive admin test suite

## Performance Patterns

- **Memory Management**: Established patterns for large dataset handling
- **Virtual Scrolling**: Automatic for datasets >100 items
- **Caching Strategy**: 5-minute stale time with intelligent invalidation  
- **Bundle Optimization**: Code splitting and lazy loading for admin components
- **Build Performance**: Turbopack enabled, 19-second builds

## Production Environment Status (September 2025)

### Current State
- **Status**: 100% Operational on AWS Amplify Gen 2
- **URL**: `https://d200k2wsaf8th3.amplifyapp.com`
- **Data**: 1,449 production records with complete dev/prod isolation
- **Performance**: <200ms API responses, 77% bundle size reduction
- **Scale**: Optimized for 100-1000 visitors/month with 10x growth capacity

### System Capabilities
- **Admin System**: Comprehensive CRUD for all business entities
- **Real-time Monitoring**: Live notification tracking and system health
- **Form Processing**: All 4 forms with signal-driven notifications
- **Multi-channel Notifications**: Email/SMS with retry logic and template management
- **Business Intelligence**: Analytics dashboard with interactive charts
- **User Management**: 8 role types with granular permissions
- **Testing**: 584+ comprehensive tests with CI/CD integration

### Essential Commands
- `npm run dev:primed` - Development server with auto-prime (Turbopack)
- `npm run type-check` - TypeScript validation (required for production)  
- `npx ampx sandbox` - Deploy backend changes
- `CI=true npx playwright test` - Run comprehensive test suite

## Documentation Structure

- **Enterprise Organization**: Complete SDLC documentation in organized folders
- **Implementation Guides**: Technical documentation by domain (docs/03-domains/)
- **API Documentation**: GraphQL schema and service layer documentation
- **Component Library**: Comprehensive component and pattern documentation
- **Operational Guides**: Deployment, monitoring, and troubleshooting (docs/07-operations/)

This project structure demonstrates enterprise-grade organization with clear separation of concerns, comprehensive business logic coverage, and production-ready scalability patterns.