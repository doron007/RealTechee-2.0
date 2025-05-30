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

### Material-UI Components
The following components from Material-UI (MUI) core library are available:

#### Input Components
- `Autocomplete`: Dynamic search and selection
- `Button`: Standard, outlined, and text buttons
- `ButtonGroup`: Group of related buttons
- `Checkbox`: Selection controls
- `FloatingActionButton`: Circular action button
- `RadioGroup`: Single-selection controls
- `Rating`: Star rating input
- `Select`: Dropdown selection
- `Slider`: Range selection
- `Switch`: Toggle controls
- `TextField`: Text input fields
- `TransferList`: List transfer interface
- `ToggleButton`: Exclusive selection

#### Data Display
- `Avatar`: User or item avatars
- `Badge`: Counter and status badges
- `Chip`: Tags and selections
- `Divider`: Section separators
- `Icons`: Material icons
- `List`: Item lists
- `Table`: Data tables
- `Tooltip`: Information on hover
- `Typography`: Text styling system

#### Feedback Components
- `Alert`: Success, info, warning, error messages
- `Backdrop`: Modal background
- `Dialog`: Modal dialogs
- `Progress`: Loading indicators
- `Skeleton`: Loading placeholders
- `Snackbar`: Toast messages

#### Surface Components
- `Accordion`: Expandable panels
- `AppBar`: Top navigation bars
- `Card`: Content containers
- `Paper`: Surface elements

#### Navigation Components
- `BottomNavigation`: Mobile bottom nav
- `Breadcrumbs`: Page navigation trails
- `Drawer`: Side navigation panels
- `Link`: Navigation links
- `Menu`: Dropdown menus
- `Pagination`: Page navigation
- `SpeedDial`: Floating action menu
- `Stepper`: Progress steps
- `Tabs`: Tabbed navigation

#### Layout Components
- `Box`: Layout wrapper
- `Container`: Content container
- `Grid`: 12-column grid system
- `Stack`: 1D layouts
- `ImageList`: Image galleries

#### Utility Components
- `ClickAwayListener`: Outside click detection
- `CssBaseline`: CSS normalization
- `Modal`: Modal dialogs
- `NoSsr`: Server-side rendering control
- `Popover`: Positioned popovers
- `Popper`: Positioned content
- `Portal`: DOM rendering control
- `TextareaAutosize`: Auto-resizing textarea
- `Transitions`: Animation components
- `useMediaQuery`: Responsive hooks

### MUI-X Components
The following advanced UI components from MUI-X are available for use:

#### Data Display & Manipulation
- `DataGrid`: Advanced data grid/table component with sorting, filtering, and pagination
- `TreeView`: Hierarchical view component for displaying tree structures
- `Charts`: Various chart components for data visualization

#### Date & Time
- `DatePicker`: Date selection component
- `TimePicker`: Time selection component
- `DateTimePicker`: Combined date and time selection
- `DateRangePicker`: Select a range of dates
- `CalendarPicker`: Calendar view component

Note: Some MUI-X components may require Pro or Premium licenses for advanced features. Consult the MUI-X documentation for specific feature availability.

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