# CLAUDE.md

## Symbol Map
`!`=not, `+`=ext/add, `@`=req, `*`=all, `w/`=with, `TS`=TypeScript, `comp`=component

## Commands
**Dev:** `npm run dev|build|test|lint` • `npm run type-check` • `npx ampx sandbox`

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

## COO: Component-Oriented Output

### Rules
1. Props-only styling + ! duplicate comps + ! new comps w/o approval
2. TS strict compliance + ! external CSS deps
3. Min DOM nesting (React.Fragment over divs) + direct solutions
4. Props = sole config method + prop config over class overrides

### Component Priority (for consistent look + single customization point)
1. **Existing custom comps** (first choice - Typography/UI/Layout below)
2. **MUI/MUI-X** (second choice - comprehensive component library)  
3. **Native Next.js/React** (last resort only)

### Available Components
**Typography:** `PageHeader` `SectionTitle` `Subtitle` `SectionLabel` `BodyContent` `SubContent` `CardTitle` `CardSubtitle` `CardContent` `ButtonText`
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

## Decision Rules
**Proceed if:** Issue identified + clear plan + aligns w/ COO + impact understood
**Ask confirmation if:** Any doubt/arch changes/multiple solutions/critical functionality
**Format:** `Issue: [x] | Analysis: [x] | Solution: [x] | Impact: [x] | Alternatives: [x] | Proceed?`

## Workflow
1. Review existing comps before impl
2. Doc @ exts, submit change proposal  
3. Impl w/ backward compat
4. Notify about CLI commands, schema updates, config changes + side effects

## Testing & Quality
Jest + React Testing Library + custom render helpers + mock Amplify hooks/GraphQL operations