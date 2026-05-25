# Phase 6 — Migrate www.realtechee.com Next.js Runtime to Home Server

**Owner:** Agent B
**Date:** 2026-05-25
**Status:** PLAN (not yet executed)

## Goal

Move the **Next.js frontend runtime** from AWS Amplify Hosting (`d200k2wsaf8th3`) onto the home server (`192.168.4.200` / `hetzim.ddns.net`). **Zero code rewrite.** The AWS backend (Cognito, AppSync, DynamoDB, S3 user-uploads, Lambdas, SES) stays exactly as it is — those are forever-free at this scale. Only the SSR Node.js process and image-optimizer move.

Final outcome: `www.realtechee.com` resolves to home server → home-server `next start` serves SSR pages → pages connect to AWS AppSync / Cognito / S3 just like they do today. Amplify hosting app gets deleted after user confirms DNS propagation.

## Evidence-Based Pre-Flight (already gathered)

### Production frontend stack
- Next.js 15.2.1, React 18.3.1, Node 20.x required ([package.json:6](../../package.json#L6), [package.json:120](../../package.json#L120))
- Build: `npm run build` → `next start` ([package.json:14-15](../../package.json#L14-L15))
- SSR pages exist (admin/*, sitemap.xml.tsx, sitemap-index.xml.tsx) — **static export is NOT viable**; must run `next start` for SSR + image optimization
- Image optimizer tuned for Amplify quirks ([next.config.js:22-27](../../next.config.js#L22-L27)) — works fine on stock Node 20

### Backend endpoints (frontend connects to these AS-IS)
From `aws amplify get-branch --branch-name production` (the build-time authoritative values):
| Variable | Value |
|---|---|
| `USER_POOL_ID` | `us-west-1_UKszK3GQb` (2 users) |
| `USER_POOL_CLIENT_ID` | `792b3vvu4or3pk0oemerbium36` |
| `IDENTITY_POOL_ID` | `us-west-1:52b0f8c0-b01f-4109-9f25-dc1a9c81d430` |
| `GRAPHQL_URL` | `https://lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com/graphql` |
| `API_KEY` | `da2-7fasxrqt5bgf3jcbo6baezztg4` (verified 200 OK via curl) |
| `BACKEND_SUFFIX` | `yk6ecaswg5aehjn3ev76xzpbfe` |
| `S3_BUCKET` | `amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj` |
| `SITE_URL` | `https://www.realtechee.com` |
| `GA_MEASUREMENT_ID` | `G-P9K530YSRT` |

**CRITICAL:** the committed `amplify_outputs.json` shows `us-west-1_5pFbWcwtU` (older pool). The live production site is actually authenticated against `us-west-1_UKszK3GQb` because Amplify Hosting overrides at build time via `.env.production` → `amplify_outputs.json` injection. We must replicate this on the home server by writing a production-correct `amplify_outputs.json` BEFORE `next build`. See "Build strategy" below.

### Repo / git
- `amplify_outputs.json` is in `.gitignore` (line 76 of `.gitignore` matches `**/local env files... .env*.local` block; explicit ignore confirmed by `git check-ignore amplify_outputs.json`) — NOT in git. Must scp.
- `.env.local`, `.env.production`, `.env.staging` are gitignored (`.gitignore: /.env*.local` and `.env.production`/`.env.staging` explicit). Must scp.
- Repo on disk: `/Users/doron/Projects/RealTechee 2.0` branch `main`, clean working tree.
- Remote: `https://github.com/doron007/RealTechee-2.0`

### Home server inventory (probed via SSH 2026-05-25 18:51 PDT)
- **Host:** `doron@192.168.4.200`, Ubuntu, kernel modern
- **Node:** v22.22.2 system-wide. **App requires Node 20.x** → must install via nvm/nodesource and pin to 20
- **PM2:** NOT installed → install globally inside the Node 20 nvm context
- **Docker:** v29.4.3 present — but we go PM2 route (see "Runtime choice")
- **Disk:** 727 GB free
- **RAM:** 27 GB total, 15 GB available
- **Free ports (verified):** 3002, 3003, 3004, 3005, 3006, 4000, 4001, 5000, 5001, 8081, 8090. Will use **3002**.
- **NPM admin:** `http://192.168.4.200:81` (HTML responds — already in use)
- **Existing docker stack:** `nginx-proxy-manager` (80/81/443), `n8n` (5678), `n8n-postgres`, `open-webui` (8080), `gitea` (3000), `uptime-kuma` (3001), `portainer` (8000/9443), `filebrowser` (8085), `syncthing`, `wg-easy`, `sef-rehearsal-owui`, `sef-rehearsal-db` — these define the operational pattern.
- **No `~/apps` / `~/projects`** — will create `~/apps/realtechee` as the canonical location.

### Live site verification
- `curl -I https://www.realtechee.com` → `HTTP/2 200`, `x-powered-by: Next.js`, served via CloudFront pop LAX54-P9.
- Production AppSync responds 200 to API-key probe.
- DNS today (per `aws amplify get-domain-association`): root `realtechee.com` and `www.realtechee.com` both CNAME `d2nw47m4livry7.cloudfront.net`.

## Decisions

### D1 — Runtime: PM2 (NOT Docker)
**Rationale:** PM2 matches the lightest-touch deploy. The home-server pattern uses Docker for *prebuilt third-party services* (n8n, OWUI, Gitea), but a self-built Next.js app is simpler under PM2: one `ecosystem.config.js`, native logs, `pm2 startup` for systemd persistence, no Dockerfile authoring, no image registry, no SBOM headache. Total memory cost ~150 MB idle. If we later want isolation, we can pack into Docker without code changes (`FROM node:20-alpine`). Reversible.

### D2 — Port allocation: 3002
**Rationale:** 3000 (gitea) and 3001 (uptime-kuma) are taken; 3002 is the lowest free port in the conventional Next-style range and groups with the other "app" services.

### D3 — Test domain: `wwwtest.realtechee.com` (subdomain of the production zone)
**Rationale:** Tests under the actual TLD so cookie/CORS/auth flows behave identically to production. User adds one DNS record (CNAME `wwwtest` → `hetzim.ddns.net`) and Let's Encrypt issues a cert. If user does not want to add a realtechee.com record before final cutover, fall back to `realtechee.hetzim.ddns.net` (we control this DDNS).

### D4 — Build strategy: production env vars injected via `.env.production` + regenerated `amplify_outputs.json`
**Rationale:** Replicate Amplify Hosting's build behavior. Step-by-step (executed in step 5 below):
1. Write a production-correct `amplify_outputs.json` (derived from the production-branch env vars table above + the committed file's `data.model_introspection`) — this gives the build the right Cognito pool & AppSync URL.
2. Write `.env.production.local` on the home server with `BACKEND_SUFFIX`, `GRAPHQL_URL`, `USER_POOL_ID`, etc. so the runtime `.env.production` template (`/.env.production:14-27`) interpolates correctly.
3. `next build` consumes both files and bakes the right config into the static bundle.

### D5 — Frontend keeps connecting to AWS backend
Per project decision, **no backend changes**. The home-server runtime hits:
- AppSync GraphQL (us-west-1, production endpoint)
- Cognito (us-west-1, `UKszK3GQb`)
- S3 image origin via `next/image` remotePatterns ([next.config.js:50-69](../../next.config.js#L50-L69))
- SES/SendGrid/Twilio remain Lambda-side; frontend only triggers them via AppSync mutations

### D6 — Image optimizer runs on home server
`next/image` with `next start` ships its own optimizer (sharp + a worker process). The 504-mitigation tunings in [next.config.js:22-27](../../next.config.js#L22-L27) are still useful but no longer "fighting Amplify" — they just become slightly conservative. No code change needed.

## Plan Steps

### Step 1 — Local pre-deploy verification (+ artifact)
On the dev Mac:
1. Confirm clean working tree: `git status` (already clean per session start).
2. `npm run type-check` (best-effort; do not block on warnings — the production app is already deployed at this commit so any pre-existing TS noise is non-blocking for the migration).
3. Snapshot the gitignored runtime files we will scp:
   - `amplify_outputs.json` (261 KB — must be patched to production values; see Step 5)
   - `.env.local` (analytics only)
   - `.env.production` (template; lives in repo but is gitignored to prevent accidental commits — confirmed present locally)
4. Save the production env-var manifest as `.planning/phases/06-www-migration/prod-env-vars.json` (raw output of `aws amplify get-branch --branch-name production --query 'branch.environmentVariables'` with a `_NOTE` field marking it as secrets — DO NOT commit; verify covered by `.gitignore` or add explicit ignore).
5. **[G1]** Create a least-privilege IAM user `realtechee-www-server`:
   - Policy: `lambda:InvokeFunction` on `arn:aws:lambda:us-west-1:403266990862:function:amplify-d200k2wsaf8th3-pr-notificationprocessorlam-*`; `ses:SendEmail`/`SendRawEmail` constrained to verified identities `notifications@realtechee.com` and `support@realtechee.com`.
   - Generate access key. Store key ID + secret in a local file `.planning/phases/06-www-migration/iam-keys.txt` (gitignored), to scp to the server's `.env.production.local`.
6. **[G1]** Resolve production notification-processor function name: `aws lambda list-functions --region us-west-1 --query 'Functions[?starts_with(FunctionName, \`amplify-d200k2wsaf8th3-pr-notificationprocessor\`)].FunctionName' --output text`. Save into `prod-env-vars.json` as `NOTIFICATION_PROCESSOR_FUNCTION_NAME`.

**Success:** All 3 config files + `prod-env-vars.json` + `iam-keys.txt` present locally; IAM user has policy attached; lambda name resolved.

### Step 2 — Home-server bootstrap
SSH `doron@192.168.4.200`:
1. Install nvm (one-liner from nvm-sh repo).
2. `nvm install 20 && nvm alias default 20 && nvm use 20`.
3. `npm install -g pm2`.
4. `mkdir -p ~/apps/realtechee && cd ~/apps/realtechee`.
5. Open firewall implicitly via Docker NPM (no firewall changes needed — NPM listens on 80/443 publicly; 3002 is bound localhost via PM2 config + NPM proxy_pass).

**Success:** `node -v` outputs `v20.x.x` under the nvm shell. `pm2 -v` works. `~/apps/realtechee` exists.

### Step 3 — Clone repo
```bash
cd ~/apps/realtechee
git clone https://github.com/doron007/RealTechee-2.0.git app
cd app
git checkout main
```

If repo is private, use a deploy key or PAT. Verify with `git log -1`.

**Success:** Repo cloned, on `main`, latest commit matches local `git log -1` (currently `8054616 .`).

### Step 4 — scp gitignored secrets/config
From Mac:
```bash
scp "amplify_outputs.json" doron@192.168.4.200:~/apps/realtechee/app/amplify_outputs.json
scp ".env.local"             doron@192.168.4.200:~/apps/realtechee/app/.env.local
scp ".env.production"        doron@192.168.4.200:~/apps/realtechee/app/.env.production
```

**Success:** Three files present on server; checksums match.

### Step 5 — Patch amplify_outputs.json for production endpoints + populate runtime env

**[G3]** First inspect the current `storage` block: `jq '.storage' amplify_outputs.json` to confirm shape.
The committed file points at the old (sandbox/staging-era) Cognito pool. Patch to the production-branch values from `prod-env-vars.json`:

```jsonc
{
  "auth": {
    "user_pool_id": "us-west-1_UKszK3GQb",
    "user_pool_client_id": "792b3vvu4or3pk0oemerbium36",
    "identity_pool_id": "us-west-1:52b0f8c0-b01f-4109-9f25-dc1a9c81d430",
    "aws_region": "us-west-1",
    /* keep existing groups, password_policy, etc. */
  },
  "data": {
    "url": "https://lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com/graphql",
    "aws_region": "us-west-1",
    "api_key": "da2-7fasxrqt5bgf3jcbo6baezztg4",
    "default_authorization_type": "AMAZON_COGNITO_USER_POOLS",
    "authorization_types": ["API_KEY", "AWS_IAM"],
    /* keep existing model_introspection block intact */
  },
  "storage": { /* keep, but verify bucket value matches production env */ }
}
```

Execute as a `jq` script on the server (preserves the 8700-line model_introspection block):
```bash
jq '.auth.user_pool_id = "us-west-1_UKszK3GQb"
    | .auth.user_pool_client_id = "792b3vvu4or3pk0oemerbium36"
    | .auth.identity_pool_id = "us-west-1:52b0f8c0-b01f-4109-9f25-dc1a9c81d430"
    | .data.url = "https://lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com/graphql"
    | .data.api_key = "da2-7fasxrqt5bgf3jcbo6baezztg4"' \
   amplify_outputs.json > amplify_outputs.prod.json \
&& mv amplify_outputs.prod.json amplify_outputs.json
```

Also write `~/apps/realtechee/app/.env.production.local` with the resolved variables so the `${VAR}` placeholders in `.env.production` are satisfied at build time. Next.js loads `.env.production.local` after `.env.production` and it wins:
```
NODE_ENV=production
BACKEND_SUFFIX=yk6ecaswg5aehjn3ev76xzpbfe
GRAPHQL_URL=https://lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com/graphql
USER_POOL_ID=us-west-1_UKszK3GQb
USER_POOL_CLIENT_ID=792b3vvu4or3pk0oemerbium36
S3_BUCKET=amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj
GA_MEASUREMENT_ID=G-P9K530YSRT
SITE_URL=https://www.realtechee.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-P9K530YSRT
NEXT_PUBLIC_SITE_URL=https://www.realtechee.com
# [G1] AWS creds for SES/Lambda calls from API routes
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=<from iam-keys.txt>
AWS_SECRET_ACCESS_KEY=<from iam-keys.txt>
NOTIFICATION_PROCESSOR_FUNCTION_NAME=<from Step 1 lambda resolution>
```

**Success:** `jq '.auth.user_pool_id' amplify_outputs.json` returns `"us-west-1_UKszK3GQb"`. `cat .env.production.local | grep USER_POOL_ID` returns the production value.

### Step 6 — Install + build

**[G7]** Skip puppeteer's Chromium download (~170 MB, unused at runtime):
```bash
cd ~/apps/realtechee/app
nvm use 20
export PUPPETEER_SKIP_DOWNLOAD=true
npm ci --no-audit --no-fund 2>&1 | tee /tmp/realtechee-install.log
```

**[G9]** Smoke-check sharp (image optimizer):
```bash
node -e "require('sharp'); console.log('sharp OK')"
# if this errors, sudo apt-get install -y libvips
```

Build:
```bash
npm run build 2>&1 | tee /tmp/realtechee-build.log
```

Expected duration: 5–8 min on this hardware. If type-check or lint warnings appear, ignore unless they become fatal — production already deployed this commit successfully.

**Success:** `.next/` directory present, `npm run build` exits 0, no "Failed to compile" lines.

### Step 7 — PM2 ecosystem
Write `~/apps/realtechee/ecosystem.config.js`:
```js
module.exports = {
  apps: [{
    name: 'realtechee-www',
    cwd: '/home/doron/apps/realtechee/app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3002 -H 127.0.0.1',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '1500M',
    env: {
      NODE_ENV: 'production',
      PORT: '3002',
      // PM2 sees these at start; .env.production + .env.production.local
      // already define the rest at build/runtime time.
    },
    error_file: '/home/doron/apps/realtechee/logs/error.log',
    out_file: '/home/doron/apps/realtechee/logs/out.log',
    time: true,
  }]
};
```

**[G8]** PM2 must use the nvm Node 20 binary, not system Node 22. Update `ecosystem.config.js`:
```js
interpreter: '/home/doron/.nvm/versions/node/v20.<resolved>/bin/node',
```
(Resolve exact path with `which node` inside the `nvm use 20` shell.)

Then:
```bash
mkdir -p ~/apps/realtechee/logs
pm2 start ~/apps/realtechee/ecosystem.config.js
pm2 save
pm2 startup systemd -u doron --hp /home/doron   # outputs sudo cmd
# (run the sudo cmd it prints — one-time)
```

**[G10]** Install log rotation:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**[G5]** Warm the SSR cache (optional, best-effort):
```bash
for p in / /contact /about /privacy /terms /sitemap.xml; do
  curl -sk -o /dev/null -w "%{http_code} $p\n" "http://127.0.0.1:3002$p"
done
```

**Success:** `pm2 ls` shows `realtechee-www` online. `curl -s http://127.0.0.1:3002/` returns HTML containing `<html` and `Next.js`.

### Step 8 — Nginx Proxy Manager host for test domain
In NPM admin UI (`http://192.168.4.200:81`):
1. **Hosts → Proxy Hosts → Add Proxy Host**
2. **Domain Names:** `wwwtest.realtechee.com` (preferred — user adds DNS CNAME `wwwtest.realtechee.com → hetzim.ddns.net`)
   - Fallback: `realtechee.hetzim.ddns.net` if user hasn't added the realtechee.com record yet
3. **Scheme:** `http`
4. **Forward Hostname / IP:** `127.0.0.1`
5. **Forward Port:** `3002`
6. **Block Common Exploits:** on. **Websockets Support:** ON (Next.js streams + RSC need it).
7. **SSL tab:** Request new SSL certificate, "Force SSL", "HTTP/2", "HSTS" on, agree to Let's Encrypt.
8. **Advanced tab** — paste:
   ```
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_set_header Host $host;
   client_max_body_size 25m;   # match S3 upload size
   proxy_read_timeout 60s;
   ```

**Success:** `curl -I https://wwwtest.realtechee.com` returns `200` and `x-powered-by: Next.js`. Cert from Let's Encrypt valid > 80 days.

### Step 9 — End-to-end smoke verification on the test URL
With the test domain live:
1. **Home page:** Load `https://wwwtest.realtechee.com`. Expect 200, hero image loads from S3 via `next/image` optimizer.
2. **Image optimizer:** Inspect a hero image's `srcset` — should be `_next/image?url=...amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj.s3...` and respond 200.
3. **Sitemap SSR:** `curl https://wwwtest.realtechee.com/sitemap.xml` → 200 XML.
4. **Cognito pool ID baked into bundle (proxy for login working) [G11]:**
   - `curl -s https://wwwtest.realtechee.com/_next/static/chunks/*.js | grep -o 'us-west-1_[A-Za-z0-9]*' | sort -u`
   - Expect `us-west-1_UKszK3GQb` to appear; expect NO `us-west-1_5pFbWcwtU`.
   - Alternative: open `/login` or `/admin` in a browser, open devtools → Network → reload, confirm Cognito calls reference `UKszK3GQb`. Do NOT attempt actual sign-in (we don't have user creds).
5. **GraphQL query:** Open a public page that does an AppSync read (homepage projects gallery if present) — verify a 200 from `lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com`.
6. **PM2 stability:** `pm2 logs realtechee-www --lines 50` shows no fatal errors. `pm2 ls` reports memory < 1 GB.

**Success:** All six checks green. If any fails → write to `AGENT-B-BLOCKER.md`, halt before Step 10.

### Step 10 — Notify ready for DNS switch
Write `.planning/AGENT-B-DNS-READY.md` with:
- Test URL: `https://wwwtest.realtechee.com` (or fallback URL)
- Verification proof: cert info, sample curl outputs, screenshot ref
- **[G12] Pre-flight (optional, recommended):** drop TTL on both DNS records to 300s, wait the current TTL (~4 hours), then proceed. Speeds actual cutover from ~4h to ~5 min.
- **[G4] Exact DNS changes user must make** (root `@` and `www`):
  - **www subdomain:** change CNAME `d2nw47m4livry7.cloudfront.net` → `hetzim.ddns.net`
  - **Apex (root `realtechee.com`):** the existing record is CNAME at apex (non-standard, your DNS provider supports it). Use the same provider feature (ALIAS / ANAME / CNAME-flatten) to point to `hetzim.ddns.net`. If the provider does not allow this, fall back to A records pointing at the DDNS-resolved IP `104.172.172.235` — **caveat:** if your ISP rotates the public IP, you'll need to update A records manually OR rely on `hetzim.ddns.net` CNAME (preferred path).
- Verification commands user can run post-propagation:
  - `dig www.realtechee.com +short` → expect `hetzim.ddns.net.` then the IP
  - `curl -I https://www.realtechee.com` → expect 200, `x-powered-by: Next.js`, NO `via: cloudfront`

### Step 11 — STOP. Do NOT delete Amplify app.
Per instructions, Agent B halts after Step 10. Amplify app deletion happens **only** after user confirms DNS propagated and home-server is serving the live www.realtechee.com.

## What stays on AWS (NOT touched)
- Cognito User Pool `us-west-1_UKszK3GQb` + client + identity pool
- AppSync API (URL above) + 43-model schema
- DynamoDB tables (production suffix `yk6ecaswg5aehjn3ev76xzpbfe`)
- S3 user-uploads bucket `amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj`
- Lambdas: `notificationProcessor`, `userAdmin`, `statusProcessor`, `sesBounceHandler`, `reputationMonitor`
- SES domain identity, suppression list
- IAM roles backing the above

## What gets deleted (only after user DNS confirmation, in a future step)
- Amplify Hosting app `d200k2wsaf8th3` (the HOSTING SHELL only — backend stacks live in independent CFN stacks named `amplify-d200k2wsaf8th3-production-branch-*` which **stay**)
- Two domain associations (`realtechee.com`, `www`) on that Amplify app

## Cost impact
- Today: ~$1.16/mo (per MIGRATION-BRIEF.md §2.1)
- After Phase 1-5 cleanup: ~$0.10–$0.50/mo (baseline)
- After Phase 6 (this phase) cutover + Amplify hosting app deletion: **~$0/mo** on AWS for hosting (DDB/Cognito/Lambda stay Always-Free at this scale; S3 GET egress to home server is ~pennies/mo at zero traffic).
- Home server: $0 marginal — already running 24/7 for n8n/OWUI.
- **Estimated final AWS bill: $0.05–$0.20/mo** (S3 storage of 2 GB user-uploads + occasional Lambda invocations).

## Rollback plan

### If home-server build fails (Step 6)
No production impact — DNS still points at Amplify. Write blocker, debug logs.

### If home-server runtime crashes (Step 7-9)
No production impact. `pm2 logs`, fix, restart. Worst case `pm2 delete realtechee-www` and try Docker route.

### If DNS cut over but home-server site breaks
1. User reverts DNS:
   - `@` and `www` CNAME → `d2nw47m4livry7.cloudfront.net` (the Amplify-managed CloudFront)
2. Propagation: up to 4 hr (current TTL). If TTL was lowered to 300s earlier, ~5 min.
3. Amplify hosting app is untouched at this point — still serves live.
4. Home server stays up on `wwwtest.realtechee.com` for further debugging.

### If Amplify app has already been deleted and home-server fails
**Avoidable scenario** by following the strict "DNS first, then verify, then delete" sequence. But if it happens:
1. Re-create Amplify app: `aws amplify create-app --name RealTechee-Gen2 --repository https://github.com/doron007/RealTechee-2.0 --platform WEB_COMPUTE ...`
2. Re-create production branch with same env vars (saved in `prod-env-vars.json`).
3. Trigger a build.
4. Re-associate domain (this takes Amplify ~15 min for cert provisioning).
Estimated MTTR: 30–45 min, no data loss because backend was untouched.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Home-server power/network outage | Low (server is on UPS + cable internet) | High — site offline | Uptime-Kuma monitor already present; user notified within minutes; DNS fallback to CloudFront is a documented procedure |
| Public IP rotation (cable ISP) | Medium-low | Brief outage until DDNS updates | DDNS already in place (`hetzim.ddns.net`); A/CNAME-to-hostname pattern handles rotation automatically |
| Node 22 vs Node 20 drift | Low | Build/runtime errors | Pin via `nvm use 20` in PM2 launch context; `engines.node` enforced |
| Image-optimizer cold-start latency | Low | First image slow | Tunings in next.config.js already mitigate; warm via `prime-pages.sh`-style script if desired |
| TLS cert renewal failure (Let's Encrypt) | Low | TLS errors at 90d | NPM handles renewal automatically; Uptime-Kuma cert monitor catches |
| Amplify Hosting deletion deletes CFN backend stack by mistake | Low (different stacks) | Catastrophic | Only delete the *app*, not nested backend stacks. Verify stack names start with `amplify-d200k2wsaf8th3-production-branch-` and EXCLUDE them. Will be re-verified at deletion time. |
| Build-time secrets in repo | Already mitigated | Leak risk | `amplify_outputs.json` + `.env*` already gitignored; scp directly to server, never commit |
| Forms (4 submission flows) break due to wrong API_KEY in patched outputs | Medium | Forms silently fail | API key in production-branch env vars verified working via curl (200 to GraphQL); will smoke-test a form submission on test domain before DNS switch |

## Success Criteria for Phase 6 (Agent B scope, pre-DNS-switch)
1. Home-server `npm run build` exits 0.
2. `pm2 ls` shows `realtechee-www` online for ≥ 30 min stable.
3. `https://wwwtest.realtechee.com` returns 200 and renders the home page identically to live.
4. SSR sitemap, image optimizer, Cognito login form, and one AppSync read all work on the test domain.
5. `AGENT-B-DNS-READY.md` written with exact instructions for the user.

Once user flips DNS and confirms, Agent B's continuation will:
6. Verify `www.realtechee.com` and `realtechee.com` resolve to home server.
7. Delete Amplify hosting app `d200k2wsaf8th3`.
8. Write `AGENT-B-COMPLETE.md`.
