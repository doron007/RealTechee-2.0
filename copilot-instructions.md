# COO Rules: Component-Oriented Output & Code Only Once

## Symbol Map
`!`=not, `+`=ext/add, `@`=req, `*`=all, `->`=maps to, `w/`=with, `w/o`=without, `~`=about, `TS`=TypeScript, `int`=interface, `impl`=implementation, `comp`=component

## Purpose
Enforce dual COO: **props-only styling** + **! duplicate comps** for scalable library.

## Core Reqs
1. **COO**: Props-only styling + ! duplicate
2. **Existing only** - ! new comps w/o approval  
3. **TS strict** - Complete typing compliance
4. **Props-only** - ! external CSS deps
5. **Approval @** - * comp changes @ confirmation

## COO Rules

**Props-Only Styling:**
- Internal styling via props only, ! external CSS deps
- Client focuses on behavior, ! appearance

**! Duplicate:**
- + existing comps, ! duplicate
- One comp per unique functionality, reuse ints + patterns

**Priorities:**
1. + comp ints over wrapper comps
2. Min DOM nesting - React.Fragment over divs  
3. + style props vs className manipulation
4. Direct solutions over complex workarounds

## Existing Comp Library

**Typography:** `PageHeader` `SectionTitle` `Subtitle` `SectionLabel` `BodyContent` `SubContent` `CardTitle` `CardSubtitle` `CardContent` `ButtonText`

**UI:** `Card` (default|feature|dealBreaker|step) • `Button` (primary|secondary|tertiary) • `FeatureCard` • `BenefitCard` • `OptionCard` • `BenefitBlock` • `TestimonialCard` • `StatItem` • `SliderNavBar`

**Layout:** `Layout` `Section` `Header` `Footer` `ContentWrapper` `GridContainer` `ContainerTwoColumns` `ContainerThreeColumns`

**MUI:** See [docs](https://mui.com/components/)
- **Input:** Autocomplete, Button, ButtonGroup, Checkbox, FAB, RadioGroup, Rating, Select, Slider, Switch, TextField, TransferList, ToggleButton
- **Display:** Avatar, Badge, Chip, Divider, Icons, List, Table, Tooltip, Typography  
- **Feedback:** Alert, Backdrop, Dialog, Progress, Skeleton, Snackbar
- **Surface:** Accordion, AppBar, Card, Paper
- **Navigation:** BottomNavigation, Breadcrumbs, Drawer, Link, Menu, Pagination, SpeedDial, Stepper, Tabs
- **Layout:** Box, Container, Grid, Stack, ImageList
- **Utility:** ClickAwayListener, CssBaseline, Modal, NoSsr, Popover, Popper, Portal, TextareaAutosize, Transitions, useMediaQuery

**MUI-X:** DataGrid, TreeView, Charts, DatePicker, TimePicker, DateTimePicker, DateRangePicker, CalendarPicker *(Pro/Premium licenses @)*

## Workflow
1. Review existing comps before impl
2. Doc @ exts, submit change proposal  
3. Impl w/ backward compat

## Technical Rules
1. ! new comps w/o approval
2. ! duplicate/overlapping ints
3. Bias toward ! external styling deps unless simpler
4. ! unnecessary DOM nesting/wrappers
5. @ TS strict compliance
6. Props = sole config method
7. Prop config over class overrides
8. Follow TS ints exactly

## Docs Reqs
1. Doc * int exts w/ examples (style-guide.tsx)
2. Include prop docs w/ types + defaults  
3. Doc * approved deviations

## Amplify Gen2 @
- **Deploy:** `npx ampx sandbox` (! `ampx deploy`)
- **! USE:** `ampx status` (doesn't exist)
- **Envs:** dev (doron), staging only
- **Status:** `npx ampx sandbox` + wait ~1min

## Decision Rules
**100% Confidence @ Before Action:**
1. Issue identified + clear plan
2. Aligns w/ COO + impact understood

**Ask Confirmation If:**
- Any doubt/arch changes/multiple solutions/critical functionality

**Format:**
```
Issue: [problem] | Analysis: [findings] | Solution: [steps] | Impact: [risks] | Alternatives: [options] | Proceed?
```

## Figma Extraction

**Analysis Structure:**
1. **Comp Name:** [Figma node] - scope (reusable|section|layout)
2. **Elements:** List top-down, map -> existing comps
3. **Layout:** Type, direction, alignment, responsive (sm|md|lg|xl)  
4. **Typography:** Map -> existing typo comps, note overrides
5. **Media:** Assets, sizes, interactions, a11y

**Impl Rules:**
1. Map Figma -> existing comps first
2. + comp props vs new comps
3. Use typo comps vs raw HTML
4. Leverage existing layout comps
5. Flat hierarchies

**Goal:** Impl Figma w/ existing library, + vs duplicate.

## Confirmation @
Respond "Understood" to confirm compliance.
