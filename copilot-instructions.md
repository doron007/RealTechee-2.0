# Component-Oriented Output (COO) Guidelines for GitHub Copilot

When providing code solutions in this project, please follow these principles:

1. **Prefer extending component interfaces over creating wrapper components**
   - Add properties directly to existing components rather than creating HOCs or wrapper elements
   - Look for opportunities to extend component interfaces first

2. **Minimize DOM nesting and avoid unnecessary wrapper elements**
   - Avoid creating additional HTML elements simply for styling or layout purposes
   - Use React.Fragment or component composition instead of wrapper divs

3. **Components should handle their styling internally**
   - Follow strict Component-Oriented Output design principles
   - Styling logic should be encapsulated within components
   - Props should control styling behavior, not require client-side CSS

4. **Extend component props before resorting to wrappers or className hacks**
   - If a component needs new capabilities, extend its props interface
   - Avoid inline styles directly in JSX when possible - add style props to the component
   - Avoid className manipulation for styling that could be controlled by props

5. **Keep client code clean by implementing styling logic within components**
   - Client code should focus on what a component does, not how it's styled
   - Component APIs should be intuitive and not leak implementation details
   - Use sensible defaults with override capabilities

6. **Prefer direct solutions over complex workarounds**
   - Look for the simplest and most direct solution first
   - Avoid complex patterns when a simple property addition would suffice

## Existing Component Library

Use these existing components when possible instead of creating new ones:

### Typography Components

| Component | Description |
|-----------|-------------|
| `PageHeader` | Main page heading with responsive sizing |
| `SectionTitle` | Section headings with responsive sizing |
| `Subtitle` | Secondary title for sections |
| `SectionLabel` | Labels and category headings (uppercase) |
| `BodyContent` | Main body text component |
| `SubContent` | Smaller body text for secondary content |
| `CardTitle` | Title text specifically for cards |
| `CardSubtitle` | Subtitle text for cards |
| `CardContent` | Body text for cards |
| `ButtonText` | Text specifically for buttons |

### UI Components

| Component | Description |
|-----------|-------------|
| `Card` | Versatile card component with variants (default, feature, dealBreaker, step) |
| `Button` | Button component with variants (primary, secondary, tertiary) |
| `FeatureCard` | Specialized card for feature displays |
| `BenefitCard` | Interactive card with hover effects for benefits |
| `OptionCard` | Card with primary/secondary variants for options |
| `BenefitBlock` | Component for displaying benefits with an image |
| `TestimonialCard` | Card for displaying testimonials |
| `StatItem` | Component for displaying statistics |
| `SliderNavBar` | Navigation bar for sliders/carousels |

### Layout Components

| Component | Description |
|-----------|-------------|
| `Layout` | Main layout wrapper with header and footer |
| `Section` | Standardized section container |
| `Header` | Site navigation header |
| `Footer` | Site footer with navigation |
| `ContentWrapper` | Wrapper for content sections |
| `GridContainer` | Grid layout container |
| `ContainerTwoColumns` | Two-column layout container |
| `ContainerThreeColumns` | Three-column layout container |

## Figma Design Extraction Guidelines

When converting Figma designs to code, follow this structured approach while adhering to the COO principles above and utilizing the existing component library.

### Analysis Structure

Create a detailed specification using this format before implementing:

#### Component Name
[Use the Figma node/layer/frame name]

#### Component Scope
Identify if this is a small reusable component, a full section, or an entire page layout.

#### Element Breakdown
List children top-down, grouped by type. Map to existing components where possible:

1. **[ContentType]**: "[Visible text]"  
   - Map to: [Which existing component to use]  
   - Role: [e.g., Primary CTA, Supporting Text, Decorative Icon]  
   - Layer name: [Figma name]  

2. [Continue for all elements]

#### Layout & Structure
- Layout type: [Flex/Grid/Absolute]
- Direction & alignment
- Responsive rules per breakpoint (sm, md, lg, xl)
- Container padding & gaps
- Map to existing layout components when possible

#### Typography
For each text type used:
- Map to existing typography components
- Note any style overrides needed
- Always use project typography components over raw HTML elements

#### Colors & Visuals
- Use theme colors from the project
- Backgrounds (solid, gradients, images, overlays)
- Border: [radius, color, thickness]
- Shadows, transparency
- Note any new colors that need to be added to the theme

#### Spacing
- Document consistent spacing patterns
- Use project spacing constants rather than arbitrary values
- Maintain responsive spacing considerations

#### Media
- Image/Icon assets: [source or name], alt text
- Sizes, alignment, visual behavior (contain/cover)
- Document all required assets and their usage

#### Interactions
- Hover/click/tap states
- Animations or transitions
- Aria or accessibility notes

### Implementation Guidelines

1. **Component Mapping**: After analysis, map Figma elements to existing components first
2. **Prop Extension**: Extend component props when needed rather than creating new components
3. **Typography Consistency**: Always use typography components rather than raw text elements
4. **Layout Reuse**: Leverage existing layout components before creating custom containers
5. **Minimal Nesting**: Maintain flat component hierarchies when possible

Remember: The goal is to implement Figma designs using our existing component library, extending as necessary, rather than creating duplicate components that serve the same purpose.