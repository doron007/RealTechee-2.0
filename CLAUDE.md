# RealTechee Development Guide

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting checks
- `npm run lint -- --fix` - Fix linting issues

## Code Style Guidelines
- **Components**: Functional components with named exports
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Imports**: Group imports by: 1) React/Next, 2) libraries, 3) components, 4) styles
- **State Management**: useState for local state, avoid prop drilling
- **CSS**: Use CSS variables defined in globals.css for colors and spacing
- **Fonts**: Nunito Sans for headings, Roboto for body text
- **Images**: Always use Next.js Image component with width/height attributes
- **Links**: Use Next.js Link component for internal navigation
- **Error Handling**: Use try/catch blocks for async operations
- **Accessibility**: Include proper ARIA attributes and semantic HTML

## Design System
- Primary: #000000, Secondary: #FFFFFF, Accent: #D11919
- Standard spacing: 50px section padding with responsive adjustments