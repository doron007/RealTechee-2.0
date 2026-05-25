# STATE — RealTechee 2.0 Sunset

## Project Reference

- **Core value:** Keep www.realtechee.com live at minimum AWS cost; no rewrite.
- **Current focus:** Phase 1 — Disable EventBridge schedules.

## Current Position

- **Milestone:** Cost Reduction to Maintenance Baseline
- **Phase:** 1 of 5 — Pause internal activity
- **Status:** Plan written, awaiting execution authorization on two open items (n8n app fate + orphan upload bucket fate).

## Progress

```
[░░░░░░░░░░] 0% — Planning complete, execution pending
```

## Recent Decisions

| Date | Decision |
|---|---|
| 2026-05-25 | Option A chosen over Option B/C — stay on Amplify, no rewrite, accept ~$0.50/mo |
| 2026-05-25 | Production user-uploads bucket preserved (R5) |
| 2026-05-25 | Staging branch will be torn down |
| 2026-05-25 | Orphan `realtecheeclone` stack will be deleted (preserves user-uploads only if user wants the duplicate) |

## Pending Decisions

1. **realTechee_n8n app fate:** User to verify https://ai.realtechee.com — keep or delete the Amplify app `d2basdqti48ssd`.
2. **Orphan user-uploads buckets (3 duplicates):** Delete (recommended, saves $0.18/mo + clarity) or retain as redundant backups?

## Blockers / Concerns

- None blocking Phase 1 execution. Phase 1 (schedule disable) is fully approved and can run immediately.

## Session Continuity

- Last session: 2026-05-25
- Stopped at: Planning artifacts written. Awaiting two confirmations before Phase 2-4 execution. Phase 1 can run anytime.
- Resume file: none (clean state)
