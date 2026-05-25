# PROJECT: RealTechee 2.0 — Sunset Maintenance

## What This Is

RealTechee 2.0 is a Next.js 15 SSR application on AWS Amplify Gen2 that previously served the RealTechee real-estate-services business. **The business is now closed.** The site remains live at www.realtechee.com but receives no public traffic. This planning workspace governs a transition into **low/no-cost maintenance mode** without rewriting the application.

## Core Value (current phase)

Keep www.realtechee.com reachable indefinitely at the minimum possible AWS cost, with the codebase preserved as-is so the business could (hypothetically) be reactivated. Optimize for **operational cost**, not user features.

## Requirements

### Validated (decisions locked 2026-05-25)

- **R1.** Site must remain reachable at www.realtechee.com (no rewrite, no rebuild) — preserves the deployment as-is for possible future reactivation.
- **R2.** Monthly AWS bill target: under $0.50/mo steady state (currently $1.16/mo).
- **R3.** No code rewrites. Pure AWS resource-level operations (CLI/console).
- **R4.** Reversible operations preferred; only delete resources confirmed to be orphans (no longer connected to the live production stack).
- **R5.** Preserve current production customer data (the `amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj` user-uploads bucket — 2.06 GB / 2,122 objects).

### Active

- **R6.** Disable EventBridge schedules driving internal background activity (the dominant cost line).
- **R7.** Delete orphan deployment generation `realtecheeclone-*` (June 2025 sandbox/clone), preserving the user-uploads bucket only if user wants the duplicate retained.
- **R8.** Tear down the unused `staging` branch and associated 43 DDB tables.
- **R9.** Audit the `realTechee_n8n` Amplify app (d2basdqti48ssd) — keep or delete per user verification of ai.realtechee.com.

### Out of Scope

- Migrating off AWS Amplify (Option B from MIGRATION-BRIEF.md) — only revisited if post-Phase-1 bill exceeds R2.
- Migrating to Supabase or any other backend (Option C) — explicitly rejected: no rewrites.
- Adding features, content, or fixes to the running application.

## Key Decisions

| ID | Decision | Rationale |
|---|---|---|
| D1 | Stay on AWS Amplify | Per R3, no rewrite; the cost is small enough to absorb |
| D2 | Cost driver = internal EventBridge schedules, NOT public traffic | Verified via `aws events list-rules` — 11 ENABLED schedules across 3 deploy generations; site has zero public traffic |
| D3 | Free-tier expiry is not a cliff event | DDB, Lambda, Cognito are Always-Free at this usage; only ~$0.15–$2/mo delta on the 12-month-only allowances |
| D4 | Phase 1 is pure CLI ops, no code commits | Lower blast radius; no app behavior changes |

## Constraints

- Production domain wiring (`realtechee.com` + `www.realtechee.com` → branch `production`) must not break.
- Production Cognito User Pool `us-west-1_UKszK3GQb` must remain (verified 2026-05-25 by inspecting live JS bundles on www.realtechee.com — the local `amplify_outputs.json` references a stale sandbox pool `5pFbWcwtU` and is NOT authoritative).
- Production CloudFormation stack `amplify-d200k2wsaf8th3-production-branch-dcd66e486e` is untouched.
- All operations must be runnable from local AWS CLI (already authenticated: account 403266990862, region us-west-1).

## Source-of-Truth References

- [MIGRATION-BRIEF.md](MIGRATION-BRIEF.md) — full evidence-based analysis and inventory
- [amplify/backend.ts](../amplify/backend.ts) — current backend resource graph
- [amplify_outputs.json](../amplify_outputs.json) — runtime Amplify configuration
- [next.config.js](../next.config.js) — frontend build configuration
