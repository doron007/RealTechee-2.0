# RealTechee Website

This is a Next.js-based website for RealTechee, a company that helps property owners add value to their properties through strategic renovations and expert real estate services.

## Features

- Responsive design for mobile and desktop users
- Modern UI with brand-consistent styling
- Interactive components
- Contact form for customer inquiries
- Server-side image processing for Wix media URLs

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

## Media URL Handling

This project includes a robust solution for handling Wix media URLs in both client and server environments. For details, see [SERVER_MEDIA_MIGRATION.md](./SERVER_MEDIA_MIGRATION.md).

### Key Features

- Server-side conversion of complex Wix media URLs
- API endpoints for media URL processing
- Client utilities for simplified media handling
- Caching to improve performance
- Comprehensive error handling