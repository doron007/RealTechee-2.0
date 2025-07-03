---

> **CRITICAL IMPLEMENTATION RULES**
>
> 1. **NO BACKEND/SCHEMA CHANGES WITHOUT EXPLICIT USER APPROVAL**
>    - The AI agent must NOT run `npx ampx ...`, edit any files in `amplify/`, or make any changes to the backend/schema under any circumstances, unless:
>      - A detailed, written explanation is provided, including:
>        - Why the change is needed
>        - The impact and risks
>        - All possible alternatives
>      - The user has reviewed and given explicit YES/NO permission.
>    - All implementation, testing, and documentation must assume the current schema and backend are correct and complete.
>    - Any attempt to bypass this rule is a critical error and must be documented in the status tracker and implementation notes.
>
> 2. **ALL OTHER REQUIREMENTS IN THIS PLAN REMAIN IN FORCE**
>    - The agent must follow all incremental, test-driven, and approval-based workflows as described below.

---

# Admin Pages Implementation Plan (Backoffice)

## Overview
This document outlines the incremental implementation and testing plan for the RealTechee admin (backoffice) pages. The goal is to transition from a single Admin Panel page with three tabs (User Management, Contact Management, Notification Management) to a scalable, multi-page backoffice system, as visualized in the provided Figma designs.

---

## 1. Backoffice Structure & Navigation

- **Sidebar Navigation**: Floating, VSCode-style sidebar for all admin/backoffice navigation.
  - **Figma Desktop**: [Sidebar Design](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1337-5544&m=dev)
  - **Figma Mobile**: suggest based on best practive and maybe the current mobile humborger design
- **Access Control**: All backoffice pages require admin or super admin authorization. Unauthorized users are redirected or shown an error.

---

## 1a. Backoffice Landing Page (`/admin` Dashboard)

- **Purpose**: The `/admin` route serves as the backoffice landing page and dashboard, providing a modern, visual overview and quick access to all admin functions.
- **Layout**: Responsive grid of cards/tiles, each representing a backoffice section (e.g., Projects, Quotes, Requests, Users, Contacts, Notifications, etc.).
  - Each card/tile includes:
    - Icon or illustration
    - Section name
    - Quick stats (e.g., total projects, pending requests)
    - CTA button (e.g., "View All", "Add New")
  - Optionally, show recent activity or alerts.
- **Design Reference**: See `/Users/doron/Desktop/Screenshot 2025-07-01 at 6.13.13 PM.png` for visual inspiration. Use a clean, modern dashboard style (cards, clear icons, responsive grid).
- **Sidebar Menu**: All backoffice sections are listed in the sidebar for direct navigation. Use clear, concise names:
  - Projects
  - Quotes
  - Requests
  - Users (formerly "User Management")
  - Contacts (formerly "Contact Management")
  - Notifications (formerly "Notification Management")
  - (Add more as needed)
- **Navigation**: Clicking a card or sidebar item routes to the corresponding CRUD/list page.
- **Authorization**: Only visible to admin/super admin users.

---

## 2. CRUD Pages for Projects, Quotes, and Requests

### 2.1. List View (Index)
- **Header**: 
  - [Figma Desktop](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1350-11984&m=dev)
  - [Figma Mobile](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1415-20930&m=dev)
- **Main Section**: 
  - [Figma Desktop](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1352-12359&m=dev)
  - [Figma Mobile](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1506-15726&m=dev)
- **Item Navigation**: 
  - [Figma Desktop](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1366-6405&m=dev)
  - [Figma Mobile](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1415-20930&m=dev)
- **Project Card**: 
  - [Figma Desktop](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1422-13876&m=dev)
  - [Figma Mobile](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1506-15803&m=dev)
  - Status flag matches current project card implementation.

#### CTA Buttons (per item):
- **Open Public Project**: Links to `/project?id=[project.id]` (projects list only)
- **Edit Project**: Navigates to project CRUD page
- **Delete Project**: Confirmation modal for selected (checked) projects. On confirm, set `status = "Archived"` (do not delete).  
  - [Confirmation Modal Figma](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1366-10748&m=dev)

#### Filters, Search, and Sort
- **Filter Warning**: [Figma](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1415-15575&m=dev)
- **Advanced Search Dialog**: [Figma](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1352-13510&m=dev)
- **Sort Options**: By status, date, name, etc. (details to be finalized per Figma)

#### Notifications
- **Snackbar for Status/Notifications**: These are examples. Use NPM package if it simplifies implementation.
  - **Error Example**: [Figma](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1415-15935&m=dev)
  - **Positive Example**: [Figma](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=1366-12000&m=dev)

---

## 3. Project, Quote, and Request CRUD (Detail/Edit)

### Section Order and Requirements (per Figma and Business Logic):

#### Project CRUD Page
- **Header**: [Figma](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=777-7020&m=dev)
- **Image Gallery Editing**: [Figma](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=805-6977&m=dev)
- **Main Form Section**: [Figma](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=692-7812&m=dev)
- **Project Attributes (Milestones, Payment Terms, Documents)**: [Figma](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=692-7812&m=dev)
- **Project Comments CRUD**: [Figma](https://www.figma.com/design/TXcYWiSywAE8GRGoY3FPot/RealTechee-2.0?node-id=776-5839&m=dev)
- **Audit Log**: Capture and display all updates in the audit log.
- **Save/Post Button**: Should remain visible while scrolling (consider header/sidebar/other persistent placement).
- **Form Validation**: All changes are saved only after validation and explicit save click.
- **Session/Page Storage**: Track unsaved changes in session/page storage. On reload/crash, prompt user to restore unsaved changes. Provide clear/refresh-from-DB option to undo changes.

#### Quote CRUD Page
- **Design and Logic:**
  - Follows the same design guidelines and UX patterns as the Project CRUD page.
  - Includes:
    - Header (with quote details and status)
    - Milestones/Items management (QuoteItems)
    - Payment Terms management (ProjectPaymentTerms, FK to quote.id)
    - Media and Documents management
    - Comments/Notes section
    - Audit Log for all changes
    - State machine controls for quote lifecycle (draft, review, sent, signed, etc.)
    - Change Order creation (if applicable)
    - Navigation to related Request and Project
    - Save/Post button (persistent)
    - Form validation and session/page storage for unsaved changes
  - **Figma:** Please provide Figma links for Quote CRUD detail/edit page (desktop and mobile) if different from Project CRUD.

#### Request CRUD Page
- **Design and Logic:**
  - Follows the same design guidelines and UX patterns as the Project CRUD page.
  - Includes:
    - Header (with request details and status)
    - Message, media, and document management
    - Meta-data editing
    - Comments/Notes section
    - Audit Log for all changes
    - State machine controls for request lifecycle (submitted, reviewed, quoted, etc.)
    - Navigation to related Quotes and Projects
    - Save/Post button (persistent)
    - Form validation and session/page storage for unsaved changes
  - **Figma:** Please provide Figma links for Request CRUD detail/edit page (desktop and mobile) if different from Project CRUD.

---

## 4. Authorization & Reuse
- **Authorization**: All backoffice pages require admin or super admin access.
- **Form Reuse**: Leverage form components and logic from the public contacts pages for consistency and maintainability.

---

## 5. Figma Links (To Be Provided)
- For each section above, add mobile Figma links when available.
- **Missing Figma Links:**
  - Please provide mobile Figma links for:
    - Sidebar navigation (if different from desktop)
    - CRUD detail/edit pages for Quote and Request (if different from Project)
    - Any unique flows or dialogs not already linked (e.g., advanced filters, bulk actions, audit log views, session restore prompts)
  - If any new features or flows are added, please provide corresponding Figma links for both desktop and mobile.

---

## 6. Incremental Implementation Steps
1. **Sidebar Navigation**: Implement floating sidebar with routing and access control.
2. **CRUD List Pages**: Build list views for projects, quotes, requests with filters, search, sort, and batch actions.
3. **Project CRUD Page**: Implement detail/edit page with all sections, persistent save, and audit log.
4. **Session Storage**: Add unsaved changes tracking and restore prompt.
5. **Notifications**: Integrate snackbar for user feedback.
6. **Authorization**: Enforce admin/super admin access on all routes.
7. **Testing**: Automated tests for each feature and flow.

---

## 7. Testing Plan
- **Unit Tests**: For all CRUD logic, form validation, and storage helpers.
- **Integration Tests**: For navigation, access control, and end-to-end flows.
- **Manual QA**: Visual and UX checks against Figma, including responsive and accessibility testing.

---

## 8. Open Questions / TODOs
- Confirm final sort/filter/search requirements per business needs.
- Confirm audit log data model and display requirements.
- Confirm session storage/restore UX details.

---

## 9. AI Agent Implementation Prompt (Incremental Phased Approach)

**Prompt for AI Agent:**

You are an expert full-stack engineer tasked with incrementally implementing the RealTechee backoffice/admin plan as described above. Follow these rules and workflow for each phase:

### General Rules
- **No backend/schema changes**: Assume DynamoDB tables and GraphQL schema are correct and complete.
- **Strict TypeScript**: All code must pass strict TS checks.
- **Test-Driven/Continuous Testing**: Use Puppeteer (or Playwright) for E2E and regression tests. Aim for TDD where practical.
- **Build & Validate**: After each phase, run build, typecheck, and all tests. Do not proceed if any fail.
- **Data Integrity**: Never mutate or delete real data. All destructive actions must only mark as archived (soft delete). Always filter out archived by default.
- **Seed/Groundhog Data**: Use the following records for safe, repeatable CRUD testing:
  - Project: `490209a8-d20a-bae1-9e01-1da356be8a93`
  - Quote: `66611536-0182-450f-243a-d245afe54439`
  - Request: `52cf1fb5-0f62-4dd4-9289-e7ecc4a0faea`
- **CRUD Flow**: Only operate on these seed records unless otherwise instructed.
- **No data corruption**: All mutations must be idempotent and safe for repeated test runs.
- **Authorization**: All admin/backoffice pages must check for admin or super admin access. (super admin creds: info@realtechee.com pass: Sababa123!)

### Workflow for Each Phase
1. **Plan**: Briefly describe the goal and scope of the phase.
2. **Implement**: Write code for the phase, following all project and COO rules.
3. **Build & Typecheck**: Run `npm run build` and TypeScript checks. Fix all errors.
4. **Test**: Write/extend Puppeteer (or Playwright) tests to cover new/changed functionality. Run all tests.
5. **Verify**: Ensure all tests pass and no regressions are introduced.
6. **Document**: Update this plan and code comments as needed.
7. **Commit**: Only after all checks pass, commit with a clear message.
8. **Repeat**: Move to the next phase.

### Example Phases
- Phase 1: Implement `/admin` dashboard landing page with cards/tiles for each backoffice section, using only seed data for stats.
- Phase 2: Implement sidebar navigation and routing for all backoffice sections.
- Phase 3: Implement CRUD list view for Projects, using only seed project for mutation tests.
- Phase 4: Implement CRUD list view for Quotes and Requests, using only seed records.
- Phase 5: Implement Project detail/edit page, including gallery, milestones, payment terms, and comments, using only seed project.
- Phase 6: Implement advanced search, filters, and sort for all list views.
- Phase 7: Implement notifications/snackbar for all user actions.
- Phase 8: Implement session/page storage for unsaved changes and restore prompt.
- Phase 9: Implement archive/trash view and restore for all entities.
- Phase 10: Add/extend E2E and regression tests for all flows.

### Special Notes
- **Request/Quote/Project Flow (Expanded):**
  - The backoffice is a project management, task management, and CRM system with a state machine for each entity.
  - **Request:**
    - Submitted by a user (with message, media, documents, and meta-data).
    - SRM reviews and can create one or more Quotes for a Request.
    - Requests can be filtered, searched, and managed in the backoffice.
  - **Quote:**
    - Created by SRM for a Request.
    - SRM adds milestones/items and payment terms (saved to QuoteItems and ProjectPaymentTerms tables).
    - Additional media and documents can be attached.
    - SRM can navigate between related Requests and Quotes.
    - Multiple Quotes can exist for a single Request.
    - Quotes go through review (BA, PM, Underwriting, Accounting), client signature, and approval flows.
    - Change Orders (CO) are new Quotes linked to the same Request and Project, for additional scope/milestones/payment terms.
  - **Project:**
    - Created when a Quote is fully approved and signed.
    - New Project record is created; QuoteItems are copied to ProjectMilestones, and PaymentTerms are duplicated (with correct FK).
    - Project supports gallery images, front page image selection, documents, milestone/payment term management, comments, and meta-data.
    - PM can create Change Orders, which follow the Quote flow and, when approved, merge new milestones/payment terms into the Project.
    - All CRUD actions are soft delete (archive), with ability to restore or view archived items.
    - Navigation between related Requests, Quotes, and Projects is always available.
  - **State Machine:**
    - Each entity (Request, Quote, Project) has a defined set of states and transitions, managed in the backoffice.
    - State changes are logged in the audit log and reflected in the UI.
  - **Task Management:**
    - Tasks and approvals (e.g., BA review, PM review, Underwriting, Accounting, Client Signature) are tracked and surfaced in the UI for each entity.
    - The backoffice provides clear visibility into the current state, pending actions, and history for each item.

---

## 10. Implementation Status & Task Tracker

### Implementation Task Tracker (ASCII Format)

Phase | Area       | Task                                                                | Status       | Notes
----- | ---------- | ------------------------------------------------------------------- | ------------ | -----
1     | Dashboard  | Implement /admin dashboard landing page (cards/tiles, stats, seed)  | ✅ Completed | Modern cards, real stats, COO compliance, responsive design     
2     | Navigation | Implement sidebar navigation & routing for all backoffice sections  | ✅ Completed | Sidebar with persistent state, tooltips, COO compliance, TDD tests
3     | Projects   | CRUD list view for Projects (seed project only)                     | Not Started  |      
4     | Projects   | Project detail/edit page (gallery, milestones, payment, comments)   | Not Started  |      
5     | Quotes     | CRUD list view for Quotes (seed quote only)                         | Not Started  |      
6     | Quotes     | Quote detail/edit page (gallery, milestones, payment, comments)     | Not Started  |      
7     | Requests   | CRUD list view for Requests (seed request only)                     | Not Started  |      
8     | Requests   | Request detail/edit page (message, media, docs, meta, seed request) | Not Started  |      
9     | Shared     | Advanced search, filters, sort for all list views                   | Not Started  |      
10    | Shared     | Notifications/snackbar for all user actions                         | Not Started  |      
11    | Shared     | Session/page storage for unsaved changes and restore prompt         | Not Started  |      
12    | Shared     | Archive/trash view and restore for all entities                     | Not Started  |      
13    | Shared     | Add/extend E2E and regression tests for all flows                   | Not Started  |      

_Note: This tracker must be updated by the AI agent at the end of each phase, with build/test summary and links to code/tests as appropriate._

---

## 11. Additional Requirements & Clarifications

- **Nothing lost, no conflicts, no gaps:** This plan must always reflect the latest user requirements and explanations. The AI agent must review and reconcile all user input before each phase, ensuring no information is lost, no requirements conflict, and no gaps remain in the design or implementation.
- **TDD & Incremental Implementation:** All work must follow a test-driven, incremental approach. Each phase should be as small as practical to allow for early feedback and course correction.
- **User Feedback & Permission:** At the end of each phase, the AI agent must:
  - Provide a build and test summary (including what was tested and test results)
  - Update the status table above
  - Request explicit user permission before moving to the next phase
- **Accessibility (a11y):** All UI must meet accessibility best practices (keyboard navigation, ARIA, color contrast, etc.).
- **Error Handling:** All flows must handle and display errors gracefully, with user-friendly messages and logging for debugging.
- **Audit Log:** All significant admin actions (create, update, archive, restore) must be recorded in the audit log, which should be viewable per entity.
- **Session Management:** Ensure session timeouts, auto-logout, and re-auth flows are handled for admin security.
- **Bulk Actions:** List views must support bulk archive/restore and multi-select actions, with confirmation modals.
- **Data Consistency:** Always fetch fresh data after mutations and handle optimistic/pessimistic UI updates as appropriate.
- **Admin-Only Controls:** Certain actions (e.g., Change Order, archive/restore, audit log view) may be restricted to super admin or specific roles.
- **Documentation:** All new components, utilities, and flows must be documented with usage and prop types.
- **Manual QA:** Each phase must include a manual QA checklist for visual, UX, and accessibility review.

---

## 12. Anticipated AI Agent Challenges & User Approval Checkpoints

The following areas are likely to be challenging for an AI agent. For each, the agent must highlight the approach and request explicit user approval (yes/no) before proceeding if any ambiguity or risk is detected. No context or requirements should be lost or changed.

### 1. Complex State Machine & Workflow Logic
- Translating business flows (Request → Quote → Project, Change Orders, multi-stage approvals) into robust, maintainable state machines.
- Ensuring all state transitions, edge cases, and audit logging are handled and reflected in the UI.
- **Checkpoint:** Present state diagrams or transition tables for user approval before implementation.

### 2. Data Consistency & Idempotency
- Guaranteeing all CRUD operations (especially soft delete/archive/restore) are idempotent, safe, and do not corrupt or duplicate data.
- Managing relationships and foreign keys (e.g., copying QuoteItems to ProjectMilestones, handling Change Orders) without backend changes.
- **Checkpoint:** Describe data flow and mutation strategies for user approval before implementation.

### 3. Seed/Groundhog Data Management
- Implementing reliable cleanup and reseeding logic for test data and audit logs, especially in a shared or production-like environment.
- Avoiding accidental pollution of the real database or leaving orphaned test data.
- **Checkpoint:** Present the cleanup and reseed strategy for user approval before implementation.

### 4. UI/UX Consistency & Accessibility
- Strictly following the design system (COO, props-only styling, no duplicate components, correct use of typography/layout).
- Ensuring accessibility (a11y) and responsive design across all flows, especially for complex forms and tables.
- **Checkpoint:** Present UI/UX patterns and accessibility approach for user approval if deviating from Figma or design system.

### 5. Authorization & Role-Based Controls
- Correctly enforcing admin/super admin access, and restricting sensitive actions (e.g., Change Order, audit log view) to the right roles.
- Handling session management, timeouts, and re-auth flows securely.
- **Checkpoint:** Present role matrix and access control logic for user approval if any ambiguity.

### 6. Testing & TDD Discipline
- Writing meaningful, maintainable E2E tests for all flows, including edge cases and error handling.
- Keeping tests up to date as requirements evolve, and ensuring tests are not brittle or flaky.
- **Checkpoint:** Present test plan and coverage for user approval if any gaps or tradeoffs are needed.

### 7. Bulk Actions & Performance
- Implementing efficient, user-friendly bulk archive/restore and multi-select actions, with proper confirmation and feedback.
- Ensuring list views and filters remain performant as data grows.
- **Checkpoint:** Present bulk action UX and performance strategy for user approval if any deviation from plan.

### 8. Error Handling & User Feedback
- Surfacing errors in a user-friendly way, with actionable messages and proper logging for debugging.
- Integrating notifications/snackbar feedback for all user actions, including failures and edge cases.
- **Checkpoint:** Present error handling and notification approach for user approval if not standard.

### 9. Documentation & Communication
- Keeping the plan, status tracker, and code documentation up to date.
- Providing clear build/test summaries and asking for user feedback/permission at each phase.
- **Checkpoint:** Always request user approval before moving to the next phase, and highlight any area where requirements are unclear or at risk.

### 10. Adoption of External Packages
- Evaluating and integrating public NPM packages without deviating from project design, and clearly communicating pros/cons and seeking approval.
- **Checkpoint:** Present package options, pros/cons, and request explicit user approval before adoption.

---

**Note:**
- The AI agent must never proceed in any of these areas without explicit user approval if there is any ambiguity, risk, or deviation from the plan. All checkpoints must be documented in the status tracker and implementation notes.
