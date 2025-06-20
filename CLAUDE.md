# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run test` - Run Jest test suite
- `npm run test -- --watch` - Run tests in watch mode
- `npx ampx sandbox` - Start Amplify development environment

### Code Quality
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.2.1 with React 18.3.1 and TypeScript
- **Backend**: AWS Amplify Gen 2 with GraphQL API
- **Database**: DynamoDB with 26+ models including Projects, ProjectComments, Contacts
- **Auth**: AWS Cognito with user groups (public, basic, member, agent, admin)
- **Storage**: AWS S3 via Amplify Storage
- **Styling**: Tailwind CSS + Material-UI with custom design system

### Key Directories
- `amplify/` - Amplify Gen 2 configuration (backend.ts, data/resource.ts, auth/resource.ts)
- `components/` - Feature-organized React components with barrel exports
- `hooks/` - Custom React hooks (useCommentsData, useProjectData, etc.)
- `pages/` - Next.js pages and API routes
- `lib/` - Utility functions and configurations
- `types/` - TypeScript type definitions

### Data Architecture
The GraphQL schema defines complex relationships between models:
- Projects have many ProjectComments, Quotes, and Milestones
- Users belong to hierarchical groups with role-based permissions
- File attachments are managed through S3 storage integration

### Component Patterns
- **Component-Oriented Output (COO)** approach with props-only styling
- TypeScript interfaces for all components with strict typing
- Barrel exports via index.ts files for clean imports
- Custom hooks for data management and state

### Authentication Flow
- AWS Cognito integration with custom user attributes (contactId, membershipTier)
- User groups determine access levels and feature availability
- Authorization modes: userPool, apiKey, owner-based access control

### File Upload System
- S3 integration for project attachments and images
- Public/private access patterns based on user permissions
- Image preview with modal display functionality
- Progress tracking during uploads

## Development Notes

### Amplify Commands
- `npx ampx generate graphql-client-code` - Regenerate GraphQL types after schema changes
- `npx ampx sandbox delete` - Clean up sandbox environment

### Testing Patterns
- Jest with React Testing Library for component testing
- Custom render helpers for components requiring auth context
- Mock Amplify hooks and GraphQL operations in tests

### Code Conventions
- Use TypeScript strict mode throughout
- Follow established component organization patterns
- Implement proper error handling for async operations
- Maintain design system consistency using Tailwind utilities

### Important Configuration Files
- `amplify/backend.ts` - Main Amplify configuration
- `amplify/data/resource.ts` - GraphQL schema with all models
- `next.config.js` - Next.js config with image optimization for Wix media
- `tailwind.config.js` - Custom design system configuration