# Component Development Guidelines

## Purpose
Enforce consistent component implementation using the principle of "Code Only Once" (COO) to maintain a scalable, maintainable component library.

## Core Requirements
1. Exclusively use and extend the approved component library (detailed below) - no new component creation without approval
2. Maintain strict TypeScript typing and interfaces
3. Maintain internal, prop-based component styling
4. Follow established configuration patterns
5. Obtain approval before creating new components or modifications

## Approved Component Library

### Text Components
- `PageHeader`: Main page headings
- `SectionTitle`: Section headings
- `Subtitle`: Secondary titles
- `SectionLabel`: Category labels
- `BodyContent`: Main text
- `SubContent`: Secondary text
- `CardTitle`, `CardSubtitle`, `CardContent`: Card-specific text
- `ButtonText`: Button labels

### UI Components
- `Card`: (default, feature, dealBreaker, step)
- `Button`: (primary, secondary, tertiary)
- `FeatureCard`, `BenefitCard`, `OptionCard`: Special purpose cards
- `BenefitBlock`: Image-based benefits
- `TestimonialCard`: Customer quotes
- `StatItem`: Statistics
- `SliderNavBar`: Carousel controls

### Layout Components
- `Layout`: Page wrapper
- `Section`: Standard container
- `Header`, `Footer`: Page structure
- `ContentWrapper`: Content sections
- `GridContainer`: Grid layouts
- `ContainerTwoColumns`, `ContainerThreeColumns`: Column layouts

## Development Workflow
1. Review existing components before implementation
2. Document required extensions
3. Submit change proposal for approval
4. Implement changes while maintaining backward compatibility

## Technical Guidelines
1. No creation of new components without prior approval
2. No duplicate or overlapping interfaces
3. bias toward not using external styling dependencies or className overrides unless this is simpler solution
4. No unnecessary DOM nesting or wrapper elements
5. Mandatory TypeScript strict mode compliance
6. Props must be the sole configuration method
7. Use prop configuration over class overrides
8. Follow TypeScript interfaces exactly

## Documentation Requirements
1. Document all interface extensions
2. Maintain up-to-date component usage examples (style-guide.tsx page)
3. Include prop documentation with types and defaults
4. Document any approved deviations from standards

To proceed with implementation, respond with "Understood" to confirm compliance with these guidelines.