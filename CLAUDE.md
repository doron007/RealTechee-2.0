# CLAUDE.md

## Symbol Map
`!`=not, `+`=ext/add, `@`=req, `*`=all, `w/`=with, `TS`=TypeScript, `comp`=component

## Commands
**Dev:** `npm run dev|build|test|lint` • `npm run type-check` • `npx ampx sandbox`
**E2E Testing:** `npm run test:e2e` • `npm run test:e2e:admin` • `npm run test:e2e:ui` • `npm run test:e2e:report` • Tests in `/e2e/` • Credentials: info@realtechee.com / Sababa123!
**Data Protection:** `./scripts/backup-data.sh` • `node ./scripts/restore-cognito-users.js <backup> <pool-id>`
**Data Cleanup:** `node ./scripts/deduplicateContacts.js [--dry-run]` • `node ./scripts/createUsersFromContacts.js`

## Session Management (CRITICAL)
**ALWAYS run `killall "node"` before starting dev server or build processes:**
- `killall "node" && npm run dev` - Clean dev server start
- `killall "node" && npm run build` - Clean build (prevents _document errors)
- Port 3000 conflicts cause navigation timeouts in tests
- Multiple node processes cause compilation errors and server conflicts

## Performance Characteristics
**First access after build/changes**: SLOW (seconds) - Next.js compilation
**Subsequent access**: FAST (milliseconds) - Cached/compiled
**Test Strategy**: Monitor server terminal logs + Chrome console for compilation status
**Polling**: Use intelligent polling that adapts to compilation vs cached access patterns

## Amplify Gen 2 (NOT Gen 1)
**CRITICAL:** This project uses Amplify Gen 2. ! use deprecated Gen 1 patterns/commands.

**Commands:** `npx ampx <command>`
- `ampx sandbox` - Deploy/watch backend (primary dev command)
- `ampx generate` - Generate post-deployment artifacts (types/hooks)
- `ampx info` - Troubleshooting info
- `ampx notices` - View notifications/compatibility issues
- `ampx configure` - Configure AWS Amplify
- `! ampx pipeline-deploy` - CI/CD only, ! use locally

**Backend Access:** Use generated GraphQL hooks (useQuery, useMutation) from `npx ampx generate` - ! custom /api routes for backend operations

**GraphQL Field Access:** For models w/ custom business date fields (e.g., Projects.createdDate/updatedDate), use direct GraphQL queries rather than client.models to ensure all schema fields are retrieved. Amplify Gen 2 client.models may not include all fields by default.

## Typography System (MODERN H1-H6, P1-P3)

### New Semantic Typography Components
**CRITICAL:** Use ONLY H1-H6, P1-P3 components. Legacy typography components deprecated.

**Headings (H1-H6):**
- `H1` - Main page titles (semantic page hierarchy)
- `H2` - Section headings (primary sections)
- `H3` - Subsection titles (cards, features)
- `H4` - Minor headings (form sections)
- `H5` - Small headings (navigation)
- `H6` - Labels and smallest headings

**Paragraphs (P1-P3):**
- `P1` - Important/emphasis body text (20px→16px responsive)
- `P2` - Standard body text (16px→14px responsive)
- `P3` - Supporting text, captions, labels (14px→12px responsive)

**Key Features:**
- CSS clamp() for fluid responsive scaling
- Semantic HTML for accessibility/SEO
- No complex props - just pick hierarchy level
- Context-independent styling

**Usage Examples:**
```tsx
<H1>Page Title</H1>              // Always main page title
<H2>Section Heading</H2>         // Always section header
<H3>Card Title</H3>              // Always subsection/card
<P1>Important content</P1>       // Emphasis body text
<P2>Regular content</P2>         // Standard paragraphs
<P3>Small text/labels</P3>       // Supporting info
```

**Migration from Legacy:**
```tsx
// OLD (DEPRECATED) → NEW (REQUIRED)
PageHeader → H1              // Page titles
SectionTitle → H2            // Section headers  
Subtitle → H2 or H3          // Depends on hierarchy
CardTitle → H3               // Card headers
BodyContent → P1 or P2       // Based on importance
SubContent → P3              // Supporting text
SectionLabel → P3            // Labels with styling
```

### Figma → Code Migration (7-Step Process)
**When updating components w/ Figma reference:**

1. **Figma Link** - Provide desktop+mobile URLs
2. **Extract Tokens** - Capture size/weight/lineHeight for both breakpoints
3. **Semantic Map** - Content hierarchy > Figma names (H1=page title, H2=sections, H3=cards, P1=emphasis, P2=body, P3=labels)
4. **Update Code** - Replace w/ H*/P* components
5. **Build Check** - `npm run build` verify
6. **Visual Check** - Compare w/ Figma intent
7. **Responsive Test** - Verify clamp() scaling

**Mapping Rules:**
- Main page title → H1 (always, ! Figma semantic)
- Section headers → H2 | Subsections → H3 | Cards → H3
- Important text → P1 | Standard body → P2 | Labels/small → P3
- Use CSS clamp() | Readability > exact pixels | Semantic HTML priority

## COO: Component-Oriented Output

### Rules
1. Props-only styling + ! duplicate comps + ! new comps w/o approval
2. TS strict compliance + ! external CSS deps
3. Min DOM nesting (React.Fragment over divs) + direct solutions
4. Props = sole config method + prop config over class overrides

### Component Priority (for consistent look + single customization point)
1. **H1-H6, P1-P3 Typography** (ALWAYS use semantic typography first)
2. **Existing custom comps** (UI/Layout components below)
3. **MUI/MUI-X** (comprehensive component library)  
4. **Native Next.js/React** (last resort only)

### Available Components
**Typography:** `H1` `H2` `H3` `H4` `H5` `H6` `P1` `P2` `P3` (modern semantic system with CSS clamp() responsive scaling)
**UI:** `Card` `Button` `FeatureCard` `BenefitCard` `OptionCard` `BenefitBlock` `TestimonialCard` `StatItem` `SliderNavBar`
**Layout:** `Layout` `Section` `Header` `Footer` `ContentWrapper` `GridContainer` `ContainerTwoColumns` `ContainerThreeColumns`
**MUI:** All standard components available - Input, Display, Feedback, Surface, Navigation, Layout, Utility
**MUI-X:** DataGrid, TreeView, Charts, DatePickers *(Pro/Premium licenses @)*

## Architecture

### Stack
Next.js 15.2.1 + React 18.3.1 + TS + AWS Amplify Gen 2 + GraphQL + DynamoDB + S3 + Tailwind + MUI

### Key Directories
`amplify/` (backend.ts, data/resource.ts, auth/resource.ts) • `components/` (feature-organized w/ barrel exports) • `hooks/` (custom) • `pages/` • `lib/` • `types/`

### Data & Auth
- GraphQL schema: 26+ models (Projects, ProjectComments, Contacts) w/ complex relationships
- AWS Cognito: user groups (public, basic, member, agent, admin) w/ custom attributes (contactId, membershipTier)
- Authorization: userPool, apiKey, owner-based access control
- S3: project attachments + images w/ public/private access + preview + progress tracking

## Technical Rules
1. ! new comps w/o approval + ! duplicate/overlapping ints
2. Amplify Gen 2 structure + GraphQL Transformer v2 (@model, @auth, @index)
3. Assume amplify codegen generates types + hooks automatically
4. React + TS best practices + Next.js App Router (app/ directory, server components, route.ts)
5. Structure mutations + queries for performance/scalability (pagination, filtering)
6. TS strict mode + proper error handling + Tailwind consistency
7. **MANDATORY DATA BACKUP**: Always backup data before schema changes that may cause AWS to purge/recreate resources

## Decision Rules
**Proceed if:** Issue identified + clear plan + aligns w/ COO + impact understood
**Ask confirmation if:** Any doubt/arch changes/multiple solutions/critical functionality
**Format:** `Issue: [x] | Analysis: [x] | Solution: [x] | Impact: [x] | Alternatives: [x] | Proceed?`

## Workflow
1. Review existing comps before impl
2. Doc @ exts, submit change proposal  
3. **BACKUP DATA** if schema changes required: `./scripts/backup-data.sh`
4. Impl w/ backward compat
5. Notify about CLI commands, schema updates, config changes + side effects
6. If data loss occurred, restore using backup scripts in `./scripts/`

## Data Protection & Schema Changes

### **CRITICAL: Data Backup Requirements**
**MANDATORY BEFORE ANY SCHEMA CHANGE:**

1. **Backup All Data Before Schema Changes**
   - **DynamoDB Tables**: Export all tables using AWS CLI or console
   - **Cognito Users**: Export user pool data including custom attributes
   - **S3 Files**: Backup critical files if storage config changes
   - **Create restore scripts** before making changes

2. **Schema Change Protocol**
   - ✅ **ALWAYS** backup data first
   - ✅ **ALWAYS** create restore strategy
   - ✅ **TEST** on development/staging first
   - ❌ **NEVER** deploy schema changes without backup
   - ❌ **NEVER** assume AWS won't purge data

3. **Backup Commands**
   ```bash
   # DynamoDB backup
   aws dynamodb list-tables --region us-west-1
   aws dynamodb scan --table-name TableName --region us-west-1 > backup_table.json
   
   # Cognito backup
   aws cognito-idp list-users --user-pool-id USER_POOL_ID --region us-west-1 > backup_users.json
   
   # S3 backup (if needed)
   aws s3 sync s3://bucket-name/path/ ./backup/s3/ --region us-west-1
   ```

4. **Restore Strategy**
   - Document restore procedure before changes
   - Test restore process on development
   - Have rollback plan ready
   - Validate data integrity post-restore

5. **When Schema Changes Require Recreation**
   - Adding Cognito custom attributes
   - Changing DynamoDB key schemas
   - Modifying S3 bucket configurations
   - Any change that AWS marks as "requires replacement"

**Remember: AWS will purge data without warning when resources are recreated. Always backup first!**

## Testing & Quality
Jest + React Testing Library + custom render helpers + mock Amplify hooks/GraphQL operations

## Test Credentials
**Admin Testing:** Always use `info@realtechee.com` / `Sababa123!` for admin/authentication testing
- This user has admin privileges for testing admin pages
- Use consistently across all Puppeteer tests and manual testing
- Required for admin/projects, admin/quotes, admin/dashboard access

## Enterprise E2E Testing Framework (Playwright)

### Directory Structure
**Location:** `/e2e/` - All testing infrastructure consolidated
```
e2e/
├── tests/                   # All test files organized by category
│   ├── admin/              # Admin interface tests
│   ├── public/             # Public page tests  
│   ├── responsive/         # Device/breakpoint tests
│   ├── accessibility/      # WCAG compliance tests
│   ├── performance/        # Lighthouse & Core Web Vitals
│   ├── visual/             # Screenshot regression tests
│   └── api/                # GraphQL API tests
├── playwright-report/      # Interactive HTML reports
├── test-results/           # JSON results & artifacts
├── playwright/             # Browser storage & auth state
└── legacy-framework/       # Archived Puppeteer frameworks
```

### Modern Playwright Commands:
```bash
npm run test:e2e                # Run all tests
npm run test:e2e:admin          # All admin pages
npm run test:e2e:public         # All public pages
npm run test:e2e:responsive     # Cross-device testing
npm run test:e2e:ui            # Interactive test runner
npm run test:e2e:report        # View HTML reports

# Individual admin pages
npm run test:e2e:admin:projects
npm run test:e2e:admin:quotes  
npm run test:e2e:admin:requests

# Interactive debugging
npm run test:e2e:ui           # Visual test runner
npm run test:e2e:debug        # Debug mode
npm run test:e2e:report       # View HTML reports
```

### Enterprise Features
- **584+ Comprehensive Tests** across all functionality
- **Project-Based Execution** for isolated testing
- **Automatic Authentication** with persistent state
- **Cross-Device Testing** (mobile, tablet, desktop)
- **Visual Regression Testing** with screenshot comparison
- **Performance Monitoring** with Lighthouse integration
- **Accessibility Testing** with axe-core WCAG 2.1 AA compliance
- **Load Testing** with concurrent user simulation
- **Test Analytics Dashboard** with health scoring
- **Database Seeding** for consistent test environments