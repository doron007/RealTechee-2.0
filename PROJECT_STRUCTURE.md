# RealTechee Project Structure

This document provides an overview of the project structure and organization.

## Directory Structure

- `/components` - React components organized by feature
  - `/common` - Reusable components shared across multiple pages
    - `/buttons` - Button components
    - `/layout` - Layout components (Header, Footer, Layout)
    - `/ui` - UI elements and design components
  - `/home` - Components specific to the home page
  - `/about` - Components for the about page
  - `/products` - Product-specific components
  - `/style-guide` - Components for the style guide
  - `/contact` - Contact page components

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
  - `componentUtils.js` - Utility functions for components
  - `animationUtils.js` - Animation-related utilities

## Import Conventions

Components are exported through index.js barrel files in each directory, enabling cleaner imports:

```javascript
// Instead of:
import Button from '../components/common/buttons/Buttons';

// You can use:
import { Button } from '../components/common/buttons';
```

## Adding New Features

When adding new features:

1. Place components in the appropriate directory based on their purpose
2. Update the corresponding index.js barrel file
3. If it's a TypeScript component, add type definitions in the `/types` directory
4. Use the existing folder structure for organizing related assets

## Documentation

- Component documentation is available in README.md files within each directory
- TypeScript type definitions provide additional documentation for component props and data structures