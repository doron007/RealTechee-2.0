# RealTechee Component Structure

This directory contains all the React components used throughout the RealTechee application, organized by purpose and usage.

## Directory Structure

### `/common`
Reusable components that are used across multiple pages and features:

- **`/buttons`**: Button components including primary, secondary, and specialized action buttons
  - `Buttons.js`: Base button component with various styling options
  - `StyleGuideButton.js`: Special button implementation for the style guide

- **`/layout`**: Components that define the application layout
  - `Header.js`: Site-wide navigation header
  - `Footer.js`: Site-wide footer with links and copyright information
  - `Layout.js`: Main layout wrapper component with meta data handling

- **`/ui`**: Reusable UI elements
  - `ColorTile.js`: Color sample component used in the style guide
  - `StatItem.js`: Statistics display component for metrics

### `/home`
Components specific to the home page:

- `Hero.js`: Main hero/banner section
- `Features.js`: Product features section
- `HowItWorks.js`: Process explanation section
- `Partners.js`: Partner logos and information
- `Stats.js`: Statistics display component
- `StatsSection.js`: Wrapper for stats components
- `Testimonials.js`: Customer testimonials section
- `CtaSection.js`: Call-to-action section

### `/about`
Components for the about page:

- `AboutSection.js`: Main about content
- `Milestones.js`: Company milestones and timeline
- `Portfolio.js`: Company portfolio and case studies

### `/products`
Product-specific components:

- **`/for-sellers`**: Components related to the seller-focused product features

### `/style-guide`
Components for the brand style guide:

- `BrandGuidelines.js`: Main style guide component
- `BrandIdentitySection.js`: Brand identity display
- `Typography.js`: Typography examples and guidelines

### `/contact`
Contact page components:

- `Contact.js`: Contact form and information

## Component Usage Guidelines

1. **Common components** should be imported from their respective subdirectories:
   ```jsx
   import Button from '../components/common/buttons/Buttons';
   import Header from '../components/common/layout/Header';
   ```

2. **Page-specific components** should be imported directly from their page folder:
   ```jsx
   import Hero from '../components/home/Hero';
   import AboutSection from '../components/about/AboutSection';
   ```

3. When creating new components, place them in the appropriate directory based on their usage. If a component will be used across multiple pages, add it to the `/common` directory in the relevant subdirectory.