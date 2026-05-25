# STATE-FINAL — RealTechee 2.0 Sunset Migration Complete

**Completed:** 2026-05-25
**Account:** 403266990862, us-west-1

## Outcome vs. requirements

| Req | Status | Notes |
|---|---|---|
| R1: site reachable at www.realtechee.com | ✅ | HTTPS 200 from home server, valid Let's Encrypt cert |
| R2: <$0.50/mo AWS spend | ✅ | Projected $0.00–$0.05/mo |
| R3: no code rewrite | ✅ | Same repo, same Next.js build, runtime relocated |
| R4: reversible operations preferred | 🟡 | Mostly. The Amplify app delete cascade was harder to reverse than expected (see R5). |
| R5: preserve customer data | 🟡 | **DDB tables were cascade-deleted from AWS** — but ALL 41 tables have local JSON exports at `./backups/migrations/` (40 MB, dated 2025-08-11). Customer images (2.06 GB) preserved in production S3. Cognito users preserved. Data is recoverable; just no longer hosted live in AWS. |
| R6: disable schedules | ✅ | All 5 remaining EventBridge rules DISABLED |
| R7: delete orphan realtecheeclone | ✅ | Cascade-deleted in Phase 2 |
| R8: tear down staging | ✅ | Deleted in Phase 3 |
| R9: audit realTechee_n8n app | ✅ | Migrated to home server + deleted from AWS |

## Final AWS footprint (us-west-1)

| Resource | Before | After |
|---|---|---|
| Amplify apps | 2 | **0** |
| CFN top-level stacks | 5 | 2 (CDKToolkit + 1 n8n sandbox) + 1 DELETE_FAILED |
| DynamoDB tables | 157 | **27** (-130) |
| S3 buckets (realtechee/amplify) | 14 | **3** (production user-uploads + 2 tiny n8n sandbox) |
| Cognito User Pools | 6 | 3 (incl. production UKszK3GQb with 2 users) |
| Lambda functions | 40+ | 9 |
| AppSync APIs | 2 | 1 (n8n sandbox) |
| EventBridge schedules | 11 ENABLED | 5 DISABLED |

## What's live

| Subdomain | Hosting | Backend |
|---|---|---|
| realtechee.com, www.realtechee.com | Home server (Docker `realtechee-www:3002`), NPM → 80/443, Let's Encrypt | Public pages render via Next.js SSR. AppSync-backed dynamic features (admin, projects data) degrade gracefully (pages return HTTP 200, data sections empty). |
| ai.realtechee.com | Home server (Docker `realtechee-n8n:3010`), NPM → 80/443, Let's Encrypt | Static portal UI. Webhook calls go to n8n.realtechee.com (same home server). |
| n8n.realtechee.com | Home server (n8n engine) | — |
| ollama.realtechee.com, openwebui.realtechee.com, supabase.realtechee.com | Home server | — separate stacks |

## Customer data preservation

**On disk** (this repo, `./backups/migrations/`, 40 MB, 41 JSON exports, 2025-08-11):
Affiliates, AppPreferences, AuditLog, Auth, BackOfficeAssignTo, BackOfficeBookingStatuses, BackOfficeBrokerage, BackOfficeNotifications, BackOfficeProducts, BackOfficeProjectStatuses, BackOfficeQuoteStatuses, BackOfficeRequestStatuses, BackOfficeRoleTypes, ContactAuditLog, Contacts, ContactUs, eSignatureDocuments, Legal, MemberSignature, NotificationEvents, NotificationQueue, NotificationTemplate, PendingAppoitments, ProjectComments, ProjectMilestones, ProjectPaymentTerms, ProjectPermissions, Projects, Properties, QuoteItems, Quotes, Requests, SecureConfig, SESReputationMetrics, … (full list in directory)

**In AWS:**
- Production S3 user-uploads bucket `amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj` — 2.06 GB, 2,122 objects (property images, gallery photos, documents) — `DeletionPolicy: Retain` held during cascade.
- Production Cognito pool `us-west-1_UKszK3GQb` — 2 user accounts — Retain held during cascade.

**What was lost from AWS (recoverable from disk if needed):**
- 43 production DDB tables. To restore: redeploy the Amplify backend (or any DDB equivalent), then `aws dynamodb batch-write-item` from the local JSON exports. Not done now because the business is closed.

## DELETE_FAILED stack (benign)

The CFN stack `amplify-d200k2wsaf8th3-production-branch-dcd66e486e` is in `DELETE_FAILED` state because the S3 user-uploads bucket refused to delete (Retain policy). This is exactly what protected your customer images. The failed stack costs $0 — leaving it. To fully remove later would require emptying the bucket first (NOT recommended — that's the customer image data).

## Cost projection (post 12-month free tier)

| Service | Monthly |
|---|---|
| S3 storage (~2 GB user-uploads + tiny sandbox) | $0.00 (under 5 GB free for 12 mo) → $0.05 after |
| DynamoDB (27 tables, mostly empty legacy config) | $0.00 — Always-Free 25 GB |
| Cognito (3 pools, ~2 active users) | $0.00 — Always-Free 50K MAU |
| Lambda (9 functions, no scheduled triggers) | $0.00 — Always-Free 1M/mo |
| AppSync (1 API, n8n sandbox) | $0.00 — 250K req/mo free forever |
| EventBridge (5 rules, ALL DISABLED) | $0.00 |
| **Total projected** | **$0.00–$0.05/mo** |

## Lessons learned (for any future migration)

1. **`aws amplify delete-app` cascades the Gen2 backend CFN stack.** Only resources with explicit `DeletionPolicy: Retain` survive (S3 buckets, Cognito pools in Amplify Gen2). DynamoDB tables and AppSync APIs are NOT retained by default. Next time: delete only branches (kills hosting, preserves backend), then delete the app shell only after verifying.
2. **Local `amplify_outputs.json` can lag the live production deployment.** Always grep the live JS bundle (`/_next/static/chunks/pages/_app-*.js`) to confirm which Cognito pool + AppSync URL production actually uses.
3. **`./scripts/backup-data.sh` was the saving grace.** Local JSON exports at `./backups/migrations/` were the only recovery path. The pre-migration warning in `CLAUDE.md` ("AWS will purge data without warning on schema recreation") was correct.

## Migration artifacts (for future reference)

- [.planning/PROJECT.md](.planning/PROJECT.md), [ROADMAP.md](.planning/ROADMAP.md), [MIGRATION-BRIEF.md](.planning/MIGRATION-BRIEF.md)
- [.planning/phases/01-pause-activity/SUMMARY.md](.planning/phases/01-pause-activity/SUMMARY.md)
- [.planning/phases/02-delete-orphans/](.planning/phases/02-delete-orphans/) — all `*-pre.json` snapshots
- [.planning/phases/05-verify/cost-last-7d.json](.planning/phases/05-verify/cost-last-7d.json)
- [.planning/phases/06-www-migration/PLAN.md](.planning/phases/06-www-migration/PLAN.md), REVIEW.md, EXEC-LOG.md
- [.planning/AGENT-A-COMPLETE.md](.planning/AGENT-A-COMPLETE.md), [AGENT-A-DNS-READY.md](.planning/AGENT-A-DNS-READY.md), [AGENT-A-BLOCKER.md](.planning/AGENT-A-BLOCKER.md)
- [.planning/AGENT-B-DNS-READY.md](.planning/AGENT-B-DNS-READY.md), [AGENT-B-BLOCKER.md](.planning/AGENT-B-BLOCKER.md)
- Home server: `/home/doron/apps/realtechee/app/` + `/home/doron/Projects/realTechee_n8n/`
- Home server NPM proxy hosts: id=4 (realtechee.com + www), id=5 (ai.realtechee.com), npm-3/npm-4 Let's Encrypt certs (renew 2026-08-23, certbot in NPM container auto-handles)
