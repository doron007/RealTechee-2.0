# Agent A — Final Completion Report

**Mission:** AWS cleanup + ai.realtechee.com migration for RealTechee 2.0 sunset
**Executed:** 2026-05-25
**Final HTTP checks:** www.realtechee.com → 200, ai.realtechee.com → 200, home-server ai-test → 200

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 1 — Pause schedules | DONE (pre-existing) | All 11 EventBridge rules DISABLED |
| 2 — Delete orphan realtecheeclone stack | **DONE** | CFN cascade complete; 43 DDB + 2 S3 + Cognito + AppSync + Lambdas removed |
| 3 — Tear down staging | **DONE** (with coordinator hand-off for delete commands) | Branch + 43 DDB + Cognito `NeGfFuVD7` + AppSync + 3 Lambdas + S3 + EventBridge all gone |
| 4 — Migrate ai.realtechee.com to home server | **DEPLOYMENT READY** | Docker app running on 192.168.4.200:3010, NPM proxy host installed for ai-test.realtechee.com, verified externally; gated on user DNS switch |
| 5 — Verify + final state | **DONE** | Cost snapshot captured (pre-Phase-1 baseline), final inventory in `.planning/STATE-FINAL.md` |

## Before → After resource counts

| Resource | Pre-cleanup | Post-cleanup | Delta |
|---|---|---|---|
| CloudFormation stacks (all) | ~120 | 62 | -58 |
| CloudFormation top-level stacks | 5 | 4 | -1 (realtecheeclone) |
| DynamoDB tables | 157 | 71 | -86 (43 realtecheeclone + 43 staging) |
| S3 buckets | 14 | 8 | -6 (5 orphan + 1 cascade) |
| Cognito User Pools | 6 | 4 | -2 (`5pFbWcwtU` realtecheeclone, `NeGfFuVD7` staging) |
| Lambda functions | 40+ | 26 | -14+ |
| EventBridge rules | 11 | 5 | -6 (3 realtecheeclone + 3 staging) |
| EventBridge rules ENABLED | 11 | 0 | -11 (all DISABLED — Phase 1) |

## Cost

- Pre-Phase-1 7-day actual: $0.30 (≈$1.29/mo extrapolated)
- Post-Phase-1 steady state: not yet measurable (cost reports lag 24-48h)
- Target (R2): <$0.50/mo
- Expected: well under target — primary drivers (cron-driven DDB writes, KMS API ops) eliminated

7-day breakdown (2026-05-18 → 2026-05-24): DynamoDB $0.14, KMS $0.13, S3 $0.03, everything else $0. Raw JSON at `.planning/phases/05-verify/cost-last-7d.json`.

## ai.realtechee.com migration — what's done, what's pending user

**Done by Agent A on home server (192.168.4.200):**
- Cloned repo to `/home/doron/Projects/realTechee_n8n`
- Generated `amplify_outputs.json` matching live AWS Cognito (`us-west-1_xsnVCuXmu`) + AppSync (`wpfbkvmninf25i6eyhtwerl6x4`)
- Authored `Dockerfile` + `docker-compose.yml` using existing home-server `docker_default` network pattern
- Built and started container `realtechee-n8n` on `127.0.0.1:3010` (restart=unless-stopped, healthcheck enabled)
- Inserted NPM `proxy_host` record id=3 (server_name `ai-test.realtechee.com`, forward to `realtechee-n8n:3010`)
- Installed `/data/nginx/proxy_host/3.conf` and reloaded nginx
- Verified externally: `curl -H 'Host: ai-test.realtechee.com' http://hetzim.ddns.net/` returns the RealTechee N8N portal HTML with HTTP 200

**Pending user action 1 — DNS switch (the only step that requires you):**
- Change CNAME `ai.realtechee.com` from `d2fjtrmkngn8qb.cloudfront.net.` → `hetzim.ddns.net.`
- See `.planning/AGENT-A-DNS-READY.md` for the full instructions including pre-DNS test command, post-DNS NPM/Let's Encrypt steps, and rollback path

**Pending user action 2 — after DNS resolves and you've verified https://ai.realtechee.com on the home server:**
- Open NPM UI at `http://192.168.4.200:81`, edit proxy_host id=3 to rename `ai-test.realtechee.com` → `ai.realtechee.com`, request Let's Encrypt cert (HTTP-01 will succeed once DNS resolves), enable Force SSL + HTTP/2
- Delete the AWS Amplify app: `aws amplify delete-app --app-id d2basdqti48ssd --region us-west-1` (this cascade-deletes Cognito `xsnVCuXmu`, AppSync `lsruhe7g4rcw5f4o44hklexzcm`, related DDB + Lambdas)
- Delete the sandbox stack: `aws cloudformation delete-stack --stack-name amplify-realtecheen8n-doron-sandbox-8bdb6ede52 --region us-west-1` (cascades Cognito `fLtUjZYOt`)

## Critical correction made during execution

The locked decision document said "keep only `us-west-1_5pFbWcwtU` = production". Evidence (grep on `/_next/static/chunks/pages/_app-*.js` from the live www.realtechee.com bundle) showed the actual production runtime uses Cognito `us-west-1_UKszK3GQb`, owned by `amplify-d200k2wsaf8th3-production-branch-dcd66e486e-auth179371D7-1WA616LSNR3YP`. The local `amplify_outputs.json` in the repo is stale (references the old sandbox pool). Detailed evidence chain at `.planning/AGENT-A-BLOCKER.md`. Coordinator subsequently confirmed this finding.

This meant the realtecheeclone stack deletion (Phase 2) was correctly safe to proceed — it cascade-deleted the `5pFbWcwtU` sandbox pool with zero impact on production auth.

## Optional follow-up (not in scope, surfaced for awareness)

- 2 orphan Lambdas `amplify-realtecheeclone-p-*` (PostConfirmation + CustomS3AutoDeleteObjects) — no parent CFN stack manages them. Safe to delete manually.
- Cognito pool `us-west-1_1eQCIgm5h` — orphan, references the above PostConfirmation Lambda. Safe to delete.
- 28 legacy `RealTechee*` DDB tables (pre-Amplify era, no active stack) — would need user authorization to remove (data may be archival).

## Artifacts produced

- `.planning/phases/02-delete-orphans/stack-resources-pre.json` — orphan stack snapshot
- `.planning/phases/02-delete-orphans/ddb-tables-pre.json` — 157-table pre-cleanup inventory
- `.planning/phases/02-delete-orphans/s3-buckets-pre.json` — 14-bucket pre-cleanup inventory
- `.planning/phases/02-delete-orphans/cognito-pools-pre.json` — 6-pool pre-cleanup inventory
- `.planning/phases/02-delete-orphans/all-stacks-pre.json` — CFN stack pre-cleanup snapshot
- `.planning/phases/02-delete-orphans/suffix-mapping.json` — verified DDB suffix → environment mapping
- `.planning/phases/05-verify/cost-last-7d.json` — raw AWS Cost Explorer 7-day output
- `.planning/AGENT-A-BLOCKER.md` — Cognito pool runtime-verification correction
- `.planning/AGENT-A-DNS-READY.md` — DNS switch instructions for user
- `.planning/STATE-FINAL.md` — comprehensive post-cleanup AWS footprint
- `.planning/AGENT-A-COMPLETE.md` — this file
- Home server: `/home/doron/Projects/realTechee_n8n/Dockerfile`, `docker-compose.yml`, `amplify_outputs.json`
- Home server: `/data/nginx/proxy_host/3.conf` (inside `nginx-proxy-manager` container)
