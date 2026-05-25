# RealTechee 2.0 — AWS Cost Reduction / Migration Brief

**Date:** 2026-05-25
**Trigger:** AWS 12-month free-tier expiring; business is closed; goal is minimal/zero ongoing footprint with no code rewrite.
**Approach:** Evidence-based — every claim cited to AWS CLI output or file:line.

---

## 1. Current AWS Footprint (verified via `aws` CLI, account 403266990862, us-west-1)

### 1.1 Active production
- **App:** `RealTechee-Gen2` (appId `d200k2wsaf8th3`) — platform `WEB_COMPUTE` (SSR Next.js)
- **Domain:** `realtechee.com` + `www.realtechee.com` → branch `production` (DomainStatus: `AVAILABLE`)
- **Branches:** `production` (PRODUCTION, lastJob `0000000081`, 2025-10-27), `staging` (lastJob `0000000059`, 2025-10-27)
- **Repo:** https://github.com/doron007/RealTechee-2.0

### 1.2 Backend resources (defined in [amplify/backend.ts:12-21](amplify/backend.ts#L12-L21))
- **auth** — Cognito User Pool `us-west-1_5pFbWcwtU` (2 users), 8 groups (super_admin, admin, accounting, srm, agent, homeowner, provider, …) — [amplify_outputs.json:1-50](amplify_outputs.json#L1-L50)
- **data** — 43-model GraphQL schema (DynamoDB tables, PAY_PER_REQUEST)
- **storage** — S3 user-uploads bucket
- **functions** — 5 Lambdas: `notificationProcessor`, `userAdmin`, `statusProcessor`, `sesBounceHandler`, `reputationMonitor`

### 1.3 Inventory totals (us-west-1)
| Resource | Count | Notes |
|---|---|---|
| Amplify apps | 2 | RealTechee-Gen2 (live), realTechee_n8n (separate effort) |
| Cognito User Pools | 6 | 4 with 2 users (orphans from redeploys), 2 empty |
| DynamoDB tables | 157 | 3 active suffix groups × 43 tables + 17 legacy `RealTechee*` + 11 misc |
| S3 buckets | 14 | ~10.4 GB total |
| Lambda functions | 40+ | mostly per-env duplicates from 3 deploy generations |
| EventBridge scheduled rules | **11** | **All ENABLED** — the actual cost driver |
| CloudFront distributions | 0 | (Amplify uses internal CDN) |
| Route53 hosted zones | 0 | (DNS managed by Amplify Domain Association) |

---

## 2. Cost Reality (from `aws ce get-cost-and-usage`)

### 2.1 Last 30 days actual billed
| Service | Amount |
|---|---|
| **Amazon DynamoDB** | **$0.59** |
| **AWS KMS** | **$0.50** |
| Amazon S3 | $0.08 |
| AWS Lambda | $0 (within Always-Free 1M/mo) |
| AWS Amplify | $0 (no SSR traffic + free tier) |
| AWS AppSync | $0 |
| Amazon CloudWatch | $0 |
| **Total** | **~$1.16/mo** |

### 2.2 Where the cost actually comes from (per user's intuition — **confirmed**)

**11 EventBridge schedules drive internal DDB/KMS writes with no public traffic involved:**

| Rule | Schedule | Target | Status |
|---|---|---|---|
| `amplify-d200k2wsaf8th3-pr-notificationprocessorlamb-...` | `cron(*/2 * * * ? *)` | prod notification-processor | ENABLED |
| `amplify-d200k2wsaf8th3-pr-reputationmonitorlambdasc-...` | `cron(0 0 * * ? *)` | prod reputation-monitor | ENABLED |
| `amplify-d200k2wsaf8th3-pr-statusprocessorlambdasche-...` | `cron(0 0 * * ? *)` | prod status-processor | ENABLED |
| `amplify-d200k2wsaf8th3-st-notificationprocessorlamb-...` | `cron(*/2 * * * ? *)` | staging notification-processor | ENABLED |
| `amplify-d200k2wsaf8th3-st-reputationmonitorlambdasc-...` | `cron(0 0 * * ? *)` | staging reputation-monitor | ENABLED |
| `amplify-d200k2wsaf8th3-st-statusprocessorlambdasche-...` | `cron(0 0 * * ? *)` | staging status-processor | ENABLED |
| `amplify-realtecheeclone-d-notificationprocessorlamb-...` | `cron(*/2 * * * ? *)` | **ORPHAN** stack notif | ENABLED |
| `amplify-realtecheeclone-d-reputationmonitorlambdasc-...` | `cron(0 0 * * ? *)` | **ORPHAN** | ENABLED |
| `amplify-realtecheeclone-d-statusprocessorlambdasche-...` | `cron(0 0 * * ? *)` | **ORPHAN** | ENABLED |
| `notification-processor-schedule` | `rate(5 minutes)` | **ORPHAN** clone-p notif | ENABLED |
| `realtechee-daily-api-key-check` | `cron(0 0 * * ? *)` | api-key-monitor | ENABLED |

**Invocation budget per month from `*/2 min` schedules alone:** 3 rules × 21,600 invocations = **64,800 invocations/month** of `notification-processor`, each one querying NotificationQueue + SignalEvents + (potentially) writing audit/event records.

This is **the entire reason your bill isn't $0**.

### 2.3 What free-tier expiry actually changes
| Component | Currently | After 12-mo free tier expires |
|---|---|---|
| DynamoDB | $0.59/mo (cron-driven) | Same — DDB is **Always-Free** at 25GB + 25 RCU/WCU |
| Lambda | $0 (well under 1M/mo) | Same — Lambda is **Always-Free** at 1M/mo + 400K GB-s |
| Cognito (50K MAU) | $0 (4 active users) | Same — Cognito **Always-Free** at 50K MAUs |
| S3 (10.4GB) | $0.08 (mostly free tier) | **+$0.13/mo** (10.4GB × $0.023 after 5GB free expires) |
| Amplify Hosting | $0 (no SSR traffic) | **+$0.10–$2/mo** (artifact storage; SSR compute stays $0 with no traffic) |
| KMS | $0.50 (cron-driven) | Same — KMS API ops not free-tiered |
| **Projected post-expiry total** | $1.16/mo | **~$1.40–$3.50/mo** if you change nothing |

**Important:** Free-tier expiry is **NOT a cliff event**. The "Always-Free" services (DDB, Lambda, Cognito) keep their allowances forever; only the 12-month-only allowances (Amplify build mins, S3 5GB, etc.) lapse — and at this usage level the delta is pennies.

---

## 3. Architectural facts (for migration feasibility)

- **Next.js 15.2.1** SSR — [package.json:120](package.json#L120)
- **45 page files**, 8 with `getServerSideProps`/`getStaticProps` (mostly admin + sitemap)
- **5 API routes**: media, notifications, process-signals, projects, trigger-notification-processor
- **Public site is mostly static-renderable**; admin + forms genuinely need a backend
- **Image optimization** depends on Amplify SSR runtime — [next.config.js:22-79](next.config.js#L22-L79)
- **No CloudFront/Route53 of yours** — Amplify managed the cert + DNS for free
- **Business is closed** → admin functions, forms, notification pipeline have **no users**

---

## 4. Recommended path (no rewrite, fact-based)

### Option A — "Pause everything internal, keep site live" (RECOMMENDED FIRST STEP)
**Effort:** ~15 minutes, AWS CLI only. **No code change. Reversible.**

1. **Disable all 11 EventBridge schedules** → no more cron-driven DDB/KMS activity
2. **Delete orphan CFN stack** `amplify-realtecheeclone-doron-sandbox-648934873b` (old sandbox; not currently serving traffic — confirm before delete)
3. **Empty + delete the 3 orphan S3 user-upload buckets** (`realtecheeclone-d`, `realtecheeclone-p`, and either `staging` or `production` if you collapse to one env)
4. **Delete 4 orphan Cognito User Pools** (`1eQCIgm5h`, `NeGfFuVD7`, `UKszK3GQb`, `fLtUjZYOt`, `xsnVCuXmu`) — keep only `5pFbWcwtU` (current prod pool)
5. **Disable staging branch auto-build** and optionally tear down the staging-suffix DDB tables (43 of them)

**Projected result:** $0.10–$0.50/mo. Site stays at www.realtechee.com on Amplify. No code touched. Reversible.

### Option B — "Free hosting + minimal AWS backend"
**Effort:** ~half-day. **No code rewrite, but `next.config.js` edits + DNS cutover.**

After Option A:
- Build site as **Next.js static export** for public pages → host on **Cloudflare Pages** (truly free, unlimited bandwidth)
- Move `realtechee.com` DNS off Amplify Domain Association to Cloudflare
- Keep tiny DDB/Cognito/Lambda backend for admin if you ever need it (all on AWS Always-Free)
- Delete Amplify app entirely

**Risk:** Admin pages (`/admin/*`) and forms relying on Amplify-served Next.js SSR will not work statically. Since business is closed, this likely doesn't matter.

**Projected result:** **$0/mo** AWS (Always-Free only). Site stays at www.realtechee.com via Cloudflare.

### Option C — "Full migration to Supabase + Cloudflare"
**Per global CLAUDE.md, this matches your other-project stack — but it IS a rewrite.** Excluded per your "no rewrite" constraint.

---

## 5. What I am NOT doing without your approval

Per evidence-based development rules, **no destructive action taken**. The following commands are prepared but not run:

```bash
# Step 1: Disable all schedules (reversible)
aws events disable-rule --name <rule-name> --region us-west-1

# Step 2: Delete orphan CFN stack (irreversible, after S3 bucket empty)
aws cloudformation delete-stack --stack-name amplify-realtecheeclone-doron-sandbox-648934873b --region us-west-1

# Step 3: Empty + delete orphan S3 buckets (irreversible)
aws s3 rm s3://<bucket> --recursive
aws s3api delete-bucket --bucket <bucket>

# Step 4: Delete orphan Cognito pools (irreversible)
aws cognito-idp delete-user-pool --user-pool-id <pool-id> --region us-west-1
```

---

## 6. Open questions for you

1. **Confirm `realTechee_n8n` app (d2basdqti48ssd) is unrelated** to this migration — leave it alone, or include in cleanup?
2. **The 2GB user-uploads bucket on production** — is this real customer/project data you want to preserve? If yes, we keep it; if no, we delete to save the storage cost.
3. **Staging branch + 43 staging DDB tables** — okay to tear down completely?
4. **Should we proceed with Option A immediately**, then decide on B later based on the post-A bill?

---

## 7. Suggested GSD framing

This is a milestone, not a new project. Once you choose A/B, I'll:

- Initialize `.planning/PROJECT.md` (single context doc — project is in maintenance/sunset mode)
- Create `.planning/ROADMAP.md` with the chosen phases
- Run `/gsd-plan-phase` for Phase 1 (cleanup), produce atomic plan with rollback steps
- Execute via `/gsd-execute-phase` with checkpointed AWS CLI commands

No code commits in Phase 1 (pure AWS CLI ops); commits start in Phase 2 only if you choose Option B.
