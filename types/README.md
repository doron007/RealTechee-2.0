# TypeScript Type Definitions

This directory contains TypeScript type definitions for the RealTechee project. These types provide documentation and type safety for components and data structures used throughout the application.

## Directory Structure

- `/components` - Type definitions for React components
  - `/common` - Types for common/shared components
    - `buttons.d.ts` - Button component types
    - `layout.d.ts` - Layout component types
    - `ui.d.ts` - UI component types
- `index.d.ts` - Central type declaration file that exports all types

## Usage

When migrating the project to TypeScript, these type definitions can be imported and used to provide type safety for components:

```tsx
import { ButtonProps } from '@types/components/common/buttons';

const CustomButton: React.FC<ButtonProps> = ({ 
  variant = 'primary',
  text,
  onClick,
  ...props
}) => {
  // Component implementation
};
```

## Adding New Types

When creating new components, add corresponding type definitions in this directory following the established pattern:

1. Create a `.d.ts` file in the appropriate subdirectory
2. Define interfaces for component props using JSDoc comments for documentation
3. Export the interfaces for use in components
4. Import and re-export the types in `index.d.ts` if they should be available globally