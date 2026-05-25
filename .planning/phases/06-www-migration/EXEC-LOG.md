# Phase 6 Execution Log

Live log of execution steps. One line per major step.

- 2026-05-25 11:55 PDT — Step 1 partial. prod-env-vars.json saved. Lambda name resolved: amplify-d200k2wsaf8th3-pr-notificationprocessorlam-baS6VFLeXNeh. SES domain `realtechee.com` + `info@realtechee.com` verified.
- 2026-05-25 11:56 PDT — IAM user creation DENIED by auto-mode classifier (backend scoped as "stays as-is"). Wrote `.planning/AGENT-B-BLOCKER.md` documenting partial blocker. Proceeding without IAM user; admin-only API routes will 500. Site main paths unaffected.
- 2026-05-25 12:01 PDT — Step 2 done. nvm installed at ~/.nvm, Node v20.20.2 active, PM2 installed (npm -g, lands at /home/doron/.nvm/versions/node/v20.20.2/bin/pm2). ~/apps/realtechee/logs created.
- 2026-05-25 12:03 PDT — Step 3 done. Repo cloned to ~/apps/realtechee/app at commit 8054616 (matches local). 351 MB.
- 2026-05-25 12:04 PDT — Step 4 done. scp amplify_outputs.json (md5 297280cd... matches), .env.local, .env.production to server.
- 2026-05-25 12:05 PDT — Step 5 done. Patched amplify_outputs.json: user_pool_id us-west-1_UKszK3GQb, client 792b3vvu..., identity_pool 52b0f8c0..., AppSync lwccoiztz..., S3 bucket amplify-d200k2wsaf8th3-pr-realtecheeuseruploadsbuc-u5mq35rhcrmj. Wrote .env.production.local with all NEXT_PUBLIC_ vars + empty AWS creds.
- 2026-05-25 12:08 PDT — Step 6 done. npm ci 55s, 2260 packages, exit 0. sharp OK. npm run build exit 0, all routes compiled, 5 dynamic API routes + static + SSG pages.
- 2026-05-25 12:09 PDT — Step 7 attempted PM2 fork. PM2 launched correctly, bound 127.0.0.1:3002 then 0.0.0.0:3002. Discovered NPM container on docker_default user-bridge could NOT reach host:3002 (UFW blocks docker→host).
- 2026-05-25 12:13 PDT — Step 7 PIVOT: switched runtime from PM2 to Docker container `realtechee-www` joined to docker_default network. Built Dockerfile.runtime image (prebuilt .next/ + node_modules baked in). Container running, auto-restart enabled. NPM container reaches `http://realtechee-www:3002` → HTTP 200. Host curl 127.0.0.1:3002 → 200. Sitemap, contact, login all 200.
- 2026-05-25 12:14 PDT — Step 7 verification: docker restart test passed (container recovers in <10s). Production Cognito pool us-west-1_UKszK3GQb confirmed baked in chunks/2600-*.js; OLD pool us-west-1_5pFbWcwtU NOT in any bundle. AppSync URL lwccoiztzrervozzmsgavaql5i baked in. Cache warmed via curl loop (/, /contact, /about, /privacy, /terms, /products, /projects, /sitemap.xml, /login all HTTP 200).
- 2026-05-25 12:15 PDT — Step 8 partial: NPM proxy host requires admin UI auth which is non-autonomous. Container is ready; user must add proxy host manually (instructions in AGENT-B-DNS-READY.md). Test domain endpoint not yet live.
- 2026-05-25 12:18 PDT — Final container health: uptime 2 min, 105.5 MiB / 27 GiB RAM, 0.01% CPU. All 5 routes (/, /contact, /sitemap.xml, /login, /privacy) return HTTP 200. Container set to `--restart unless-stopped` so it survives host reboots.
- 2026-05-25 12:18 PDT — HALT per instructions. Wrote `.planning/AGENT-B-DNS-READY.md` with Step A (NPM proxy host), Step B (DNS flip), Step C (post-flip Amplify deletion gated on user confirmation). Wrote `.planning/phases/06-www-migration/.gitignore` to prevent accidental commit of prod-env-vars.json or iam-keys.txt.
