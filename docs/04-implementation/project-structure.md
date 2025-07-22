# RealTechee Project Structure

This document provides an overview of the project structure and organization.

## Directory Structure

- `/components` - React components organized by feature
  - `/common` - Reusable components shared across multiple pages
    - `/buttons` - Button components
    - `/layout` - Layout components (Header, Footer, Layout)
    - `/ui` - UI elements and design components (StatusPill, Card, etc.)
  - `/home` - Components specific to the home page
  - `/about` - Components for the about page
  - `/products` - Product-specific components
  - `/style-guide` - Components for the style guide
  - `/contact` - Contact page components
  - `/admin` - Admin/backoffice components with CRUD functionality
    - `/projects` - Project management components (ProjectsTable, ProjectDetail)
    - `/quotes` - Quote management components
    - Contains Material React Table implementations with business logic separation
  - `/typography` - Modern semantic typography system (H1-H6, P1-P3)

- `/pages` - Next.js pages that define routes
  - `/products` - Pages for product sections

- `/public` - Static assets
  - `/actions` - Action-related icons and images
  - `/brand-assets` - Brand-related assets
  - `/fonts` - Custom fonts
  - `/icons` - UI icons
  - `/images` - General images
  - `/logo` - Logo variations
  - `/videos` - Video content

- `/styles` - CSS and styling files
  - `globals.css` - Global CSS styles

- `/types` - TypeScript type definitions
  - `/components` - Type definitions for components

- `/utils` - Utility functions and helpers
  - `componentUtils.ts` - Utility functions for components
  - `animationUtils.ts` - Animation-related utilities
  - `amplifyAPI.ts` - AWS Amplify API wrapper with generic model interface
  - `memoryMonitor.ts` - Memory usage monitoring and leak detection
  - `logger.ts` - Structured logging system

- `/services` - Business logic layer (NEW)
  - `projectsService.ts` - Projects with contact resolution and caching
  - Implements MVC separation with optimized memory management

- `/hooks` - Custom React hooks
  - `useMemoryMonitor.ts` - Development memory monitoring hook

- `/scripts` - Utility scripts for the project
  - `convertToTypeScript.js` - Script used for JS to TS conversion

## TypeScript Configuration

The project uses TypeScript for type safety and better development experience. Key TypeScript files:

- `tsconfig.json` - TypeScript configuration
- `next-env.d.ts` - Next.js TypeScript declarations
- `types/index.d.ts` - Project-wide type declarations

## Import Conventions

Components are exported through index.ts barrel files in each directory, enabling cleaner imports:

```typescript
// Instead of:
import Button from '../components/common/buttons/Buttons';

// You can use:
import { Button } from '../components/common/buttons';
```

## Adding New Features

When adding new features:

1. Place components in the appropriate directory based on their purpose
2. Update the corresponding index.ts barrel file
3. Add type definitions in the `/types` directory
4. Use the existing folder structure for organizing related assets

## Documentation

- Component documentation is available in README.md files within each directory
- TypeScript type definitions provide additional documentation for component props and data structures