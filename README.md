# RealTechee Website

This is a Next.js-based website for RealTechee, a company that helps property owners add value to their properties through strategic renovations and expert real estate services.

## Features

- Responsive design for mobile and desktop users
- Modern UI with brand-consistent styling
- Interactive components
- Contact form for customer inquiries
- Server-side image processing for Wix media URLs

## Dynamic Environment Configuration (Backend Suffix)

Environment table suffixes are now dynamic (no hardcoded IDs). See `docs/ENVIRONMENT_CONFIG_DYNAMIC_PLAN.md`.

Key points:
- `NEXT_PUBLIC_BACKEND_SUFFIX` (and Lambda `TABLE_SUFFIX`) compose table names: `ModelName-<suffix>-NONE`.
- Config templates rendered via: `npm run render:configs`.
- Smoke test for staging/backends: `npm run smoke:staging` (requires AWS creds + suffix vars).
- Guard script: `npm run verify:env-contract` enforces no legacy literals.

This enables safer environment rotations and eliminates brittle static identifiers.

See `CHANGELOG.md` (version X.Y.Z) for detailed migration notes on the dynamic environment configuration rollout.

## Technologies Used

- Next.js
- React
- CSS
- TypeScript
- Server-side API routes for media processing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/components` - React components
- `/pages` - Next.js pages and API routes
- `/public` - Static assets
- `/styles` - CSS files
- `/utils` - Utility functions including server-side media processing
- `/scripts` - Utility scripts for development, testing and deployment
- `/docs` - Project documentation and guides

## Media URL Handling

This project includes a robust solution for handling Wix media URLs in both client and server environments. For details, see [SERVER_MEDIA_MIGRATION.md](./docs/SERVER_MEDIA_MIGRATION.md).

### Key Features

- Server-side conversion of complex Wix media URLs
- API endpoints for media URL processing
- Client utilities for simplified media handling
- Caching to improve performance
- Comprehensive error handling