# ROADMAP: RealTechee 2.0 Sunset

## Milestone: Cost Reduction to Maintenance Baseline

**Goal:** Reduce monthly AWS spend from $1.16/mo → under $0.50/mo while preserving www.realtechee.com reachability and current production customer data.

---

## Phase 1 — Pause internal activity (stops the bleeding)

**Goal:** Disable the 11 EventBridge schedules that drive ~all current DynamoDB + KMS billing. Reversible. Zero production-traffic impact.

**Success criteria:**
- All 11 EventBridge rules → `State: DISABLED`
- 24 hours later, daily DynamoDB cost is ≤ $0.02/day (down from ~$0.020/day cron-driven; expected ≤ $0.001/day idle)
- www.realtechee.com still returns HTTP 200 with home page

**Effort:** ~5 minutes
**Risk:** None — purely disabling schedules, all reversible via `aws events enable-rule`

---

## Phase 2 — Delete orphan `realtecheeclone` deployment generation

**Goal:** Remove the abandoned June 2025 sandbox stack and its 43 DDB tables, 3 Lambdas, 3 EventBridge rules, Cognito pool, and (per user choice) 2 duplicate S3 user-uploads buckets.

**Success criteria:**
- CloudFormation stack `amplify-realtecheeclone-doron-sandbox-648934873b` and all its nested children → DELETED
- 43 DDB tables with suffix matching the orphan stack → DELETED (verified mapping first)
- 3 orphan EventBridge rules (`amplify-realtecheeclone-d-*`, `notification-processor-schedule`) → DELETED
- Orphan Cognito pools `us-west-1_1eQCIgm5h` and others tied to clone stack → DELETED
- (Conditional on R7 / user choice) S3 buckets `amplify-realtecheeclone-d-realtecheeuseruploadsbuc-*` and `amplify-realtecheeclone-p-realtecheeuseruploadsbuc-*` emptied and deleted

**Effort:** ~30 minutes
**Risk:** Low — orphan stack is not connected to production. Risk mitigation: take a manifest of resources before delete; use `--retain-resources` if any shared resource pops up.

---

## Phase 3 — Tear down staging branch

**Goal:** Remove the `staging` branch and its 43 DDB tables, 3 Lambdas, 3 EventBridge rules, Cognito pool `us-west-1_NeGfFuVD7` (likely), and duplicate S3 staging uploads bucket.

**Success criteria:**
- Amplify branch `staging` (on app `d200k2wsaf8th3`) → deleted
- CloudFormation stack `amplify-d200k2wsaf8th3-staging-branch-11d429917d` and nested → DELETED
- 43 DDB tables for staging suffix → DELETED
- 3 staging EventBridge rules → DELETED
- Staging Cognito pool → DELETED
- Staging user-uploads S3 bucket → DELETED (duplicate confirmed)

**Effort:** ~20 minutes
**Risk:** Low — staging is unused. Only risk is mis-identifying the staging DDB suffix; mitigated by verifying suffix-to-stack mapping before deletion.

---

## Phase 4 — Audit `realTechee_n8n` Amplify app

**Goal:** User to verify https://ai.realtechee.com. If unneeded, delete app `d2basdqti48ssd` and all its CFN stacks. If kept, ensure its schedules (if any) are disabled.

**Success criteria:**
- User decision recorded
- If delete: all `d2basdqti48ssd` and `amplify-realtecheen8n-*` stacks → DELETED
- If keep: any EventBridge schedules on its stacks → DISABLED

**Effort:** ~5 minutes (if delete), 0 minutes (if keep)
**Risk:** None.

---

## Phase 5 — Verify and snapshot

**Goal:** Confirm new baseline cost and produce a small "what's still running" doc for future-you.

**Success criteria:**
- 24-hour cost report shows ≤ $0.02/day (≤ $0.60/mo projected)
- `STATE.md` snapshot of remaining resources written
- www.realtechee.com still returns HTTP 200

**Effort:** ~10 minutes (mostly waiting for next-day cost data)
**Risk:** None.

---

## Out of phase (deferred — only revisit if Phase 5 cost > R2 target)

- **Phase 6 (deferred):** Migrate hosting to Cloudflare Pages / Vercel free tier (per MIGRATION-BRIEF.md Option B). Requires `next.config.js` static export work + DNS cutover. ~Half day.
