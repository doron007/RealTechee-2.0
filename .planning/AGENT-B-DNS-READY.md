# Agent B — Ready for DNS Switch (with one manual NPM step)

**Date:** 2026-05-25 12:15 PDT
**Status:** Home-server runtime is built, verified, and serving HTTP 200 on `realtechee-www:3002` (Docker, joined to `docker_default` network). The remaining steps require your action: (1) add an NPM proxy host, (2) flip DNS.

---

## TL;DR

1. **YOU:** add an NPM proxy host pointing your chosen test subdomain at `realtechee-www:3002`. ~60 seconds.
2. **YOU:** verify the test domain works end-to-end (login form loads, GraphQL responds).
3. **YOU:** flip the production DNS for `realtechee.com` and `www.realtechee.com` from `d2nw47m4livry7.cloudfront.net` to `hetzim.ddns.net`.
4. **AGENT B (after your confirmation):** delete the Amplify hosting app `d200k2wsaf8th3`. (NOT done yet.)

---

## What's already done

- Repo cloned to `~/apps/realtechee/app` at commit `8054616` (matches local).
- `amplify_outputs.json` patched to **production** Cognito pool (`us-west-1_UKszK3GQb`), production AppSync URL (`lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com`), and production S3 bucket (`amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj`). Verified via `grep` on built JS chunks — only the PRODUCTION pool appears; the older sandbox pool `5pFbWcwtU` is NOT in any served bundle.
- `.env.production` and `.env.production.local` populated with the runtime env vars (BACKEND_SUFFIX, GRAPHQL_URL, USER_POOL_ID, USER_POOL_CLIENT_ID, S3_BUCKET, NEXT_PUBLIC_* analogues, GA_MEASUREMENT_ID, SITE_URL).
- `npm ci` (2260 packages, 55s) + `npm run build` (all routes compiled) ran clean.
- Runtime is a **Docker container** named `realtechee-www` (image `realtechee-www:latest`):
  - On the `docker_default` network alongside NPM, gitea, n8n, OWUI, etc.
  - Port 3002 mapped: `127.0.0.1:3002 -> 3002` on the host, plus container-name DNS `realtechee-www:3002` from inside Docker.
  - `--restart unless-stopped` — survives reboots.
  - Smoke-tested after a `docker restart`: container back up in <10s, all routes return 200.

### Smoke tests passed (from inside the home server)

```
/             HTTP 200  (homepage with "RealTechee - Real Estate Technology Platform" title)
/contact      HTTP 200
/sitemap.xml  HTTP 200  (real XML, ~hundreds of URLs)
/login        HTTP 200
/privacy /terms /products /projects /about — all HTTP 200
AppSync       HTTP 200  (curl https://lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com/graphql with API key)
```

### Known caveat (NOT a blocker for general site usage)

API routes that invoke AWS Lambda or SES directly (`pages/api/trigger-notification-processor.ts`, `services/notifications/notificationService.ts`) need an IAM access key the auto-mode classifier blocked Agent B from creating. See `.planning/AGENT-B-BLOCKER.md` for the resolution path (4 CLI commands). Impact: admin-only "Resend" / "Trigger notification processor" buttons in `/admin/notification-monitor` will return 500. Main public site (forms, public pages, image loading, GraphQL reads) is unaffected.

---

## STEP A — Add Nginx Proxy Manager proxy host (you do this)

### A.1 Decide your test domain

**Preferred:** `wwwtest.realtechee.com` — exercises real-TLD cookie/CORS behavior identical to production. Requires you to first add a DNS CNAME `wwwtest.realtechee.com → hetzim.ddns.net` at your DNS provider (TTL 300s — short for testing).

**Fallback if you don't want to touch realtechee.com DNS yet:** `realtechee.hetzim.ddns.net` — you control DDNS, no production-zone change.

### A.2 Add the proxy host

1. Open NPM admin: `http://192.168.4.200:81` (or whatever your remote URL is for it; you already use it for `n8n.realtechee.com`, `ai.sef.energy`, etc.)
2. Login with your admin credentials.
3. **Hosts → Proxy Hosts → Add Proxy Host.**
4. **Details tab:**
   - **Domain Names:** `wwwtest.realtechee.com` (or `realtechee.hetzim.ddns.net`)
   - **Scheme:** `http`
   - **Forward Hostname / IP:** `realtechee-www` (Docker container name on the `docker_default` network — NPM resolves it by name)
   - **Forward Port:** `3002`
   - **Cache Assets:** off (Next.js handles caching headers)
   - **Block Common Exploits:** on
   - **Websockets Support:** ON (for Next.js streaming / RSC)
5. **SSL tab:**
   - **SSL Certificate:** Request a new SSL Certificate (Let's Encrypt)
   - **Force SSL:** on
   - **HTTP/2 Support:** on
   - **HSTS Enabled:** on
   - Email: your usual LE email
   - Agree to Terms.
6. **Advanced tab — paste:**

   ```
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_set_header Host $host;
   client_max_body_size 25m;
   proxy_read_timeout 60s;
   ```

7. Click **Save**. NPM provisions the cert (Let's Encrypt) and reloads nginx.

### A.3 Verify the test domain

From your laptop or anywhere on the internet:

```bash
curl -sI https://wwwtest.realtechee.com
# Expect: HTTP/2 200, x-powered-by: Next.js, server: openresty/nginx, NO via: cloudfront
```

Open in a browser:
- `https://wwwtest.realtechee.com/` — homepage renders identically to https://www.realtechee.com
- `https://wwwtest.realtechee.com/login` — auth form loads
- `https://wwwtest.realtechee.com/sitemap.xml` — XML

In browser devtools (Network tab), filter for `cognito` or `amazonaws`:
- The Cognito user-pool ID in the body of any auth-related request should be `us-west-1_UKszK3GQb` (NOT `us-west-1_5pFbWcwtU`).
- The AppSync URL in any GraphQL request should be `lwccoiztzrervozzmsgavaql5i.appsync-api.us-west-1.amazonaws.com`.

**If something looks wrong:** see "Rollback" at the bottom. The live site at www.realtechee.com is untouched at this point.

---

## STEP B — Flip production DNS (you do this)

### B.1 Pre-flight (recommended, optional)

Drop the TTL of both DNS records to 300 seconds. Save. Wait the **current** TTL (4 hours per your DNS screenshot) — this lets caches expire so the upcoming flip propagates in ~5 min instead of 4 hr.

### B.2 The DNS changes

You currently have:

| Name | Type | Current Value | TTL |
|---|---|---|---|
| `realtechee.com` (apex `@`) | CNAME-at-apex (ALIAS / ANAME / flatten — provider-specific) | `d2nw47m4livry7.cloudfront.net` | 4h |
| `www.realtechee.com` | CNAME | `d2nw47m4livry7.cloudfront.net` | 4h |

Change BOTH values to `hetzim.ddns.net`:

| Name | Type | New Value | TTL |
|---|---|---|---|
| `realtechee.com` (apex `@`) | Same record type your provider uses for the existing CNAME-at-apex (ALIAS / ANAME / CNAME-flatten) | `hetzim.ddns.net` | 300s |
| `www.realtechee.com` | CNAME | `hetzim.ddns.net` | 300s |

**Apex fallback (only if your provider doesn't support ALIAS/ANAME/flatten any more):** add an A record for `realtechee.com` pointing at `104.172.172.235` (the current home-server public IP). Caveat: if your ISP rotates your public IP, you'd have to update the A record manually. Prefer the ALIAS/ANAME/flatten path so DDNS handles rotation transparently.

### B.3 Verify after propagation

```bash
dig www.realtechee.com +short
# Expect:  hetzim.ddns.net.
#          104.172.172.235  (or whatever your current public IP is)

dig realtechee.com +short
# Same as above

curl -sI https://www.realtechee.com
# Expect: HTTP/2 200, x-powered-by: Next.js, NO "via: 1.1 ... cloudfront"
# (today it returns "via: 1.1 ... cloudfront.net (CloudFront)")
```

Browser test on a few cold devices / incognito tabs / mobile data → confirms global propagation.

---

## STEP C — Confirm to Agent B (you tell me)

Once Steps A and B verify clean, tell me **"DNS is live on home server"** and Agent B will:

1. Verify `dig www.realtechee.com +short` resolves to home-server IP.
2. Confirm one more `curl -sI https://www.realtechee.com` shows no CloudFront via header.
3. Delete the Amplify hosting app `d200k2wsaf8th3` and remove the two domain associations on it.
4. Write `.planning/AGENT-B-COMPLETE.md` summarizing what shipped and the new AWS bill estimate.

**Critically:** the AWS backend (Cognito pool `us-west-1_UKszK3GQb`, AppSync, DynamoDB tables with the `yk6ecaswg5aehjn3ev76xzpbfe` suffix, S3 bucket `amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj`, all 5 Lambdas, SES) is **NOT touched**. Only the Amplify hosting *shell* gets deleted.

---

## Rollback procedures

### Rollback after Step A (NPM not working / test domain broken)
No production impact. www.realtechee.com still served by Amplify/CloudFront. Diagnose NPM logs:
```bash
docker logs nginx-proxy-manager --tail 100
docker logs realtechee-www --tail 100
```

### Rollback after Step B (DNS flipped, site broken at home server)
1. In your DNS provider, revert both records to `d2nw47m4livry7.cloudfront.net`.
2. Propagation: 5 min (if TTL was 300s) or up to 4 hr (if TTL not lowered first).
3. Amplify hosting app still exists at this point (we have NOT deleted it). It will resume serving live traffic.
4. Home server stays up on `wwwtest.realtechee.com` for further debugging.

### Rollback after Step C (Amplify hosting deleted, site broken at home server)
Avoidable by following Steps A and B verification gates strictly. But if needed:
1. Re-create Amplify app: `aws amplify create-app --name RealTechee-Gen2 --repository https://github.com/doron007/RealTechee-2.0 --platform WEB_COMPUTE ...`
2. Create production branch with the env vars from `.planning/phases/06-www-migration/prod-env-vars.json`.
3. Trigger a build (15-20 min) + re-associate domain (~15 min for cert).
4. Update DNS back to the new CloudFront pointer.
Estimated MTTR: 30-45 min. **No data loss** because backend was untouched.

---

## Files / artifacts for your reference

- Build artifacts: `~/apps/realtechee/app/.next/` on the home server (build size ~200 MB)
- Container image: `realtechee-www:latest` in local Docker
- Logs: `docker logs realtechee-www` (and pm2 log rotation history at `/home/doron/apps/realtechee/logs/` from the earlier PM2 phase — can be deleted; PM2 itself was switched off)
- Planning artifacts:
  - `.planning/phases/06-www-migration/PLAN.md`
  - `.planning/phases/06-www-migration/REVIEW.md`
  - `.planning/phases/06-www-migration/EXEC-LOG.md`
  - `.planning/phases/06-www-migration/prod-env-vars.json` (gitignored; contains secrets)
  - `.planning/AGENT-B-BLOCKER.md` (IAM user creation gap — needs your authorization)
  - `.planning/AGENT-B-DNS-READY.md` (this file)
