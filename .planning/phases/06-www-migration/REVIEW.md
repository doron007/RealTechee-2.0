# PLAN Review — Phase 6 www Migration

**Date:** 2026-05-25
**Reviewer:** Agent B (self-review pass)
**Plan under review:** [PLAN.md](PLAN.md)

## Method

Re-read PLAN.md critically. Cross-checked against the live codebase, AWS state, and home-server inventory for gaps the plan would hit at execution time. Below are the gaps surfaced, the resulting PLAN amendments, and the residual caveats the user should know.

---

## Gaps Found

### G1 — API routes need AWS credentials at runtime (HIGH severity)
**Found in:**
- [pages/api/trigger-notification-processor.ts:5](../../../pages/api/trigger-notification-processor.ts#L5) — instantiates `LambdaClient` with no explicit creds → AWS SDK default credential chain.
- [services/notifications/notificationService.ts:114,121](../../../services/notifications/notificationService.ts#L114) — reads `process.env.AWS_ACCESS_KEY_ID` directly.

**Why this matters:** On Amplify Hosting the SSR runtime had an attached IAM role; `aws-sdk` picked credentials up automatically. On the home server there is no AWS role — these calls will throw at runtime unless we supply IAM user keys via `.env.production.local`.

**Mitigation (added to PLAN Step 5):**
1. Create a dedicated IAM user `realtechee-www-server` with a **least-privilege** policy:
   - `lambda:InvokeFunction` on `arn:aws:lambda:us-west-1:403266990862:function:amplify-d200k2wsaf8th3-pr-notificationprocessorlam-*`
   - `ses:SendEmail`, `ses:SendRawEmail` constrained to `notifications@realtechee.com` / `support@realtechee.com` identities
   - No DDB / S3 / Cognito perms (frontend uses AppSync for DDB and API-key/Cognito-token paths for the rest)
2. Generate an access key pair, store in `.env.production.local` on the server as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` plus `AWS_REGION=us-west-1`.
3. Document the key in `prod-env-vars.json` (the planning artifact) with the value REDACTED — only key ID is stored for traceability.
4. Add `NOTIFICATION_PROCESSOR_FUNCTION_NAME` to `.env.production.local` with the **production** lambda name (NOT the hard-coded sandbox name from the route's fallback). Resolve via `aws lambda list-functions --region us-west-1 | grep amplify-d200k2wsaf8th3-pr-notificationprocessor`.

**Caveat:** business is closed, no real traffic — these API routes likely never fire in practice. But putting credentials in place is cheap insurance and avoids "looks broken in admin UI" if user logs in later.

### G2 — Production-branch Amplify env vars exposed sensitive API_KEY (LOW severity, FYI)
**Found in:** `aws amplify get-branch --branch-name production` output — `API_KEY: da2-7fasxrqt5bgf3jcbo6baezztg4`. This is an AppSync API key (public-tier read/write per [amplify_outputs.json:73-77](../../../amplify_outputs.json#L73-L77) auth rules).

**Why this matters:** the key already lives in the rendered HTML/JS the public site serves today, so it is effectively public. No change needed — just be aware the patched `amplify_outputs.json` contains this key and it ships to clients. This is the existing security posture, NOT a regression.

**No PLAN change required.**

### G3 — `amplify_outputs.json` patching might miss the `storage` block
**Found in:** Step 5 of PLAN only patches `auth` and `data`. The `storage` block (S3 bucket + region) is also in `amplify_outputs.json` and the production value (`amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj`) may already match — but it might not.

**Mitigation (PLAN Step 5 updated):**
Extend the `jq` script to also set the storage block:
```bash
jq '... | .storage.bucket_name = "amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj"
       | .storage.aws_region = "us-west-1"' ...
```
And read the current state with `jq '.storage' amplify_outputs.json` first to confirm shape.

### G4 — Apex `realtechee.com` uses CNAME (non-standard)
**Found in:** `aws amplify get-domain-association` shows `realtechee.com` with `Prefix: null` and `DnsRecord:  CNAME d2nw47m4livry7.cloudfront.net`. Pure DNS does not allow CNAME on apex per RFC 1034, but the user's DNS provider clearly supports ALIAS/ANAME or CNAME-flattening (Cloudflare, AWS Route53 alias, Vercel-style ANAME).

**Why this matters:** the AGENT-B-DNS-READY.md instructions must say "use whatever ALIAS/ANAME mechanism your provider supports to point apex at `hetzim.ddns.net`" — and offer the A-record fallback (`104.172.172.235`) with the IP-rotation caveat.

**Mitigation (PLAN Step 10 updated):** added explicit ALIAS/ANAME/CNAME-flatten guidance plus A-record fallback.

### G5 — No automatic site-warmup after PM2 cold start
**Found in:** Without traffic the home server's `next start` lives in a "cold" state — first request after deploy/restart triggers JIT compilation of dynamic routes, ~1.5–3 s. The repo has `scripts/prime-pages.sh` ([package.json:10](../../../package.json#L10)) used by `dev:primed`.

**Mitigation (PLAN Step 7 updated):**
Add a PM2 post-start hook that runs `scripts/prime-pages.sh` (curl-loops the main routes) so first real user gets warm SSR. If the script's hardcoded `localhost:3000` doesn't match port 3002, just wrap with `BASE_URL=http://127.0.0.1:3002 ./scripts/prime-pages.sh` (or skip if the script doesn't accept env override — non-blocking).

### G6 — `prod-env-vars.json` artifact not explicit in PLAN
**Found in:** PLAN mentions saving the env-var manifest but doesn't say where or what format.

**Mitigation (PLAN Step 1 updated):**
File location: `.planning/phases/06-www-migration/prod-env-vars.json`.
Contents: full `aws amplify get-branch --branch-name production --query 'branch.environmentVariables'` output. Marked with `"_NOTE": "Secrets included. Treat as sensitive. Do not commit to a public repo."` and added to `.gitignore` pattern. Confirmed already covered by existing patterns (file's name doesn't match a current gitignore entry — add explicit ignore in `.planning/.gitignore` if it doesn't already exist).

### G7 — `npm ci` may fail on `puppeteer` chromium download in offline-ish env
**Found in:** package.json includes `puppeteer ^24.11.1` — full Chromium ~170 MB download. On home server first build this might be slow but should succeed.

**Mitigation (PLAN Step 6 updated):**
Already added `PUPPETEER_SKIP_DOWNLOAD=true` — puppeteer is used by migration scripts, NOT runtime. Setting this skips Chromium and saves ~170 MB + 30 s.

### G8 — `engines.node` strict-mode could fail on Node 20 minor mismatches
**Found in:** [package.json:6](../../../package.json#L6) says `"node": "20.x"`. nvm's `nvm install 20` picks the latest 20.x which is fine — but if `npm ci` is run with a different Node version active, it errors.

**Mitigation (PLAN Step 7 updated):**
The PM2 ecosystem.config.js now also specifies `interpreter: '/home/doron/.nvm/versions/node/v20.x.x/bin/node'` explicitly (resolved at deploy time) so PM2 doesn't accidentally pick system Node 22.

### G9 — Next.js 15 image optimizer in Sharp mode at runtime
**Found in:** Next 15 ships its own image optimizer using `sharp`. On Linux x64 the `sharp` postinstall fetches platform-specific binaries. Should "just work" but a fresh box might miss libvips system deps.

**Mitigation (PLAN Step 6 updated):**
After `npm ci`, run `node -e "require('sharp')"` as a smoke test. If it errors, install system deps: `sudo apt-get install -y libvips`.

### G10 — No log-rotation / disk-fill protection
**Found in:** PM2 logs go to `/home/doron/apps/realtechee/logs/`. Without rotation, an error loop could fill the disk over weeks. At zero traffic this is theoretical, but cheap to add.

**Mitigation (PLAN Step 7 updated):**
After `pm2 save`, run `pm2 install pm2-logrotate && pm2 set pm2-logrotate:max_size 10M && pm2 set pm2-logrotate:retain 7`.

### G11 — Plan does not specify how to verify production sign-in actually works (Step 9 #4)
**Found in:** Cognito production pool `us-west-1_UKszK3GQb` has 2 users. We don't have credentials for those users in this session.

**Mitigation (PLAN Step 9 updated):**
For login verification, do NOT attempt actual sign-in (we don't have user creds). Instead:
- Open `/login` (or `/admin` which redirects to login) on the test domain.
- Open browser devtools → Network → reload.
- Confirm the request to `cognito-idp.us-west-1.amazonaws.com` (or any Cognito-related call from Amplify lib) includes the **right user pool ID** in the body (`us-west-1_UKszK3GQb`, NOT `5pFbWcwtU`).
- Confirm no JavaScript errors about "User pool not found".
This proves the patched `amplify_outputs.json` made it into the bundle.

### G12 — DNS instructions for user lack TTL pre-flight
**Found in:** Current TTL is 4 hours. If user wants to cut over fast (say, on a weekend), they should lower TTL to 300s the day BEFORE flipping. PLAN mentions this in passing but doesn't bake it into the user-facing instructions.

**Mitigation (PLAN Step 10 updated):**
`AGENT-B-DNS-READY.md` will include a "Pre-flight (optional, recommended)" section telling the user to drop both records' TTL to 300s, wait the current TTL (4 h), then flip; that way actual cutover propagates in ~5 min.

---

## PLAN Amendments Applied

All G1–G12 mitigations are folded into [PLAN.md](PLAN.md) as inline updates to the affected steps. The PLAN's success criteria, rollback, and risk table remain valid.

---

## Residual Caveats (user must know)

1. **AWS IAM user creation is a manual side-task** Agent B will perform in Step 5. The access key will live ONLY on the home server's `.env.production.local`, never committed.
2. **AppSync API key is effectively public** — same as today. Not a regression.
3. **First-user latency** post-restart: ~1.5–3 s for SSR cold-start despite prime-pages. Acceptable at zero-traffic.
4. **Home-server uptime SLO** is not a managed service; outages here mean www.realtechee.com is down with no auto-failover. Rollback to Amplify Hosting requires user to re-flip DNS (documented).
5. **Cert renewal** is automatic via NPM/Let's Encrypt; if it ever fails (e.g., LE rate-limit), the cert expires at 90 days and HTTPS breaks. Uptime-Kuma on the box already monitors certs (per home-server inventory) — confirm during execution.
6. **The test domain `wwwtest.realtechee.com` requires the user to add ONE DNS record before Step 8** (CNAME wwwtest → hetzim.ddns.net). If user hasn't done this yet, Agent B will substitute `realtechee.hetzim.ddns.net` and proceed; the final cutover for production DNS still requires the user.

---

## Verdict

**READY TO EXECUTE** with the G1–G12 amendments applied.

Critical-path items that must complete in order:
1. Pre-deploy verification on Mac (Step 1) — owns IAM user creation
2. Home-server Node 20 + PM2 install (Step 2)
3. Clone + scp configs + patch outputs + write env file (Steps 3–5)
4. Build + PM2 start (Steps 6–7)
5. NPM proxy host + cert (Step 8)
6. End-to-end smoke (Step 9)
7. Write AGENT-B-DNS-READY.md (Step 10) — **HARD STOP**

Agent B HALTS after Step 10. Amplify hosting deletion is a Step-11 task gated on user DNS confirmation.
