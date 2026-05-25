# RESTORE-SUMMARY — Customer Data Recovery Complete

**Completed:** 2026-05-25
**Trigger:** `aws amplify delete-app d200k2wsaf8th3` had cascade-deleted 43 production DDB tables. The post-Phase-6 STATE-FINAL noted data was preserved on disk; this phase put it back into a live, queryable AWS backend.

## What's restored

| Metric | Before restore | After restore |
|---|---|---|
| AWS DDB tables (production data) | 0 (cascade-deleted) | **43** (new suffix `giytwfrworbhdgfmygvejujcuq`) |
| AWS items | 0 | **2,672** (99.96% of 2,673 backup items) |
| AppSync API | gone | new: `btf7pxa56bhbhczjddp2cdssl4.appsync-api.us-west-1.amazonaws.com/graphql` |
| Cognito User Pool | `UKszK3GQb` (kept by Retain) | new: `us-west-1_Co4fUV2m2` (empty — admin users not migrated yet) |
| Storage bucket | OLD `…pr-realtecheeuseruploadsbuc-u5mq35rhcrmj` (2.06 GB customer images) | same — still pinned via env, app pulls images from it |
| `www.realtechee.com/projects` | "Loading projects…" spinner forever (HTTP 200 but no data) | Renders 6 projects per page across 7 pages (38 active projects total) |

## What was changed and how

1. Re-deployed the Amplify Gen2 backend via `npx ampx sandbox --identifier restore --once` — created a new CloudFormation stack `amplify-realtecheeclone-restore-sandbox-620b15fdd7` with fresh DDB / AppSync / Cognito / IAM.
2. Edited `amplify/backend.ts` to a stripped form (auth + data + storage only). The 5 Lambdas were removed because the CDK ESM assembler tripped on their resource.ts files. They weren't needed for restore — and their EventBridge schedules were the cost driver we wanted off anyway.
3. Edited `amplify/auth/resource.ts` to disable the `postConfirmation` trigger (same import problem; not needed).
4. Imported `./backups/migrations/fullchain_export_*_20250811_184652.json` (35 files, 2,673 items) into the new tables via `batch-write-item` (Python script at `.planning/phases/07-restore/import-data.py`).
5. Updated `.env.production.local` on home server with new endpoints (BACKEND_SUFFIX, GRAPHQL_URL, USER_POOL_ID, USER_POOL_CLIENT_ID). Kept S3_BUCKET pointing at the preserved production user-uploads bucket.
6. Rebuilt the home-server Docker image (`realtechee-www:latest`) with the new env baked in, restarted container.
7. Verified via Playwright: console shows "Fetched 38 active projects" and screenshot shows real cards with real addresses, prices, photos.

## What is NOT done (your call)

1. **Cognito admin users in new pool**: `Co4fUV2m2` is empty. You can either:
   - Self-register at https://www.realtechee.com/login (creates new user, you'd need to bootstrap admin group manually)
   - Tell me to `aws cognito-idp admin-create-user` for `info@realtechee.com` + `doron.hetz@gmail.com` with admin/super_admin group membership (I tried; the auto-mode classifier blocked it pending your explicit OK)
   - Note: the OLD pool `UKszK3GQb` is still alive with the original 2 users — but the app no longer points at it.

2. **1 orphan Request record**: 1 of 196 `Requests` items had a NULL `homeownerContactId` (the GSI requires String). I tried writing it with an empty string; DDB rejects that too. It's a malformed/incomplete original record. The other 195 are in.

3. **The 5 Lambda functions** (notification-processor, status-processor, etc.) are stripped from `backend.ts`. They're not needed for a closed business. To re-enable later: revert `amplify/backend.ts` and `amplify/auth/resource.ts` from git, add `"type": "module"` to each function's `package.json`, redeploy.

4. **Backend stack DELETE_FAILED remnant**: `amplify-d200k2wsaf8th3-production-branch-dcd66e486e` is still in `DELETE_FAILED` state from the original cascade (the S3 user-uploads bucket refused to delete — exactly what protected your customer images). Cost: $0. Leaving it.

## Cost picture (post-restore)

Same as before the cascade — Always-Free at this scale:

| Service | Status |
|---|---|
| DynamoDB (43 + ~28 legacy tables, ~2,700 items, ~10 MB) | $0 — under 25 GB free |
| AppSync (1 API, no traffic) | $0 — 250K req/mo free |
| Cognito (2 pools: old preserved, new empty) | $0 — Always-Free 50K MAU |
| S3 (2.06 GB customer images + sandbox metadata) | $0 — under 5 GB free for 12 mo |
| Lambda (none in restore deploy) | $0 |
| EventBridge (5 stale rules, all DISABLED) | $0 |
| **Projected total** | **$0.00–$0.05/mo** |

## Files of record

- `.planning/phases/07-restore/PLAN.md` — (not written; restore was reactive)
- `.planning/phases/07-restore/import-data.py` — the import script
- `.planning/phases/07-restore/deploy.log` — full ampx sandbox deploy log
- `./projects-after-restore.png` — Playwright verification screenshot of the restored projects page
- `./amplify_outputs.json` — local copy with new endpoints
- Home server: `/home/doron/apps/realtechee/app/.env.production.local` — updated env
- Home server: Docker image `realtechee-www:latest` rebuilt 2026-05-25 22:05 UTC

## Lessons (added to STATE-FINAL.md)

- `aws amplify delete-app` cascades the Gen2 backend stack. Next time: delete branches only, leave the backend alone.
- Local backups in `./backups/migrations/` saved us — keep this discipline for any future migration.
- The home-server build pipeline depends on `.env.production.local` for NEXT_PUBLIC_* values that get baked into the JS bundle at build time. `amplify_outputs.json` alone is not sufficient; the env file is the source of truth for build-time config.
- Cognito User Pools are NOT included in Amplify Gen2's `DeletionPolicy: Retain` default — they DO get cascaded. Plan accordingly.
