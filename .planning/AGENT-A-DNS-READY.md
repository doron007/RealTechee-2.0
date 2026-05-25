# ai.realtechee.com — Home Server Migration Ready for DNS Switch

**Status:** Home server deployment is LIVE and verified. Awaiting your DNS switch.

## What's running

A Dockerized Next.js build of the `realTechee_n8n` repo is deployed on the home server:

- Host: `192.168.4.200` (LAN) / `hetzim.ddns.net` (public — current public IP `104.172.172.235`)
- Container: `realtechee-n8n`
- Port: `127.0.0.1:3010` inside host, fronted by Nginx Proxy Manager
- Working dir: `/home/doron/Projects/realTechee_n8n`
- Docker compose: `/home/doron/Projects/realTechee_n8n/docker-compose.yml`
- Restart policy: `unless-stopped`
- NPM proxy_host record id=3, server_name `ai-test.realtechee.com`, conf at `/data/nginx/proxy_host/3.conf` inside the NPM container
- AWS Cognito + AppSync wiring preserved (uses `us-west-1_xsnVCuXmu` and `wpfbkvmninf25i6eyhtwerl6x4` per the existing `amplify-d2basdqti48ssd-master-branch-...` stack — auth/data still backed by AWS until you decide to migrate them)

## Test it NOW (before DNS switch)

The deployment is reachable via HTTP using a Host header override:

```bash
curl -sI -H "Host: ai-test.realtechee.com" http://hetzim.ddns.net/
# Expected: HTTP/1.1 200 OK, Server: openresty
```

To open in a browser without DNS change, add this line to your local `/etc/hosts` (Mac: `sudo vi /etc/hosts`):

```
104.172.172.235 ai-test.realtechee.com
```

Then browse to `http://ai-test.realtechee.com/`. You should see the RealTechee N8N portal page with Design Agent / Prompt Agent / Real-Time Insights tiles. Remove the `/etc/hosts` entry when done.

## The DNS switch (one record change)

Change the DNS record for `ai.realtechee.com` in whichever DNS provider hosts `realtechee.com`:

| Field | From | To |
|---|---|---|
| Type | CNAME | CNAME |
| Name | `ai.realtechee.com` | `ai.realtechee.com` |
| Target | `d2fjtrmkngn8qb.cloudfront.net.` | `hetzim.ddns.net.` |
| TTL | (current) | 300 seconds recommended |

This is the same pattern already in use for `n8n.realtechee.com` and `ollama.realtechee.com`.

## What happens after the DNS change propagates

1. Add the production proxy_host in NPM:
   - Either via NPM web UI at `http://192.168.4.200:81` → Hosts → Proxy Hosts → Add Proxy Host: `ai.realtechee.com` → forward to `realtechee-n8n:3010` (HTTP, websockets ON) → SSL tab: Request a new SSL Certificate (Let's Encrypt), enable Force SSL + HTTP/2.
   - Or by editing the existing `ai-test.realtechee.com` record (proxy_host id=3) to swap its `domain_names` to `["ai.realtechee.com"]` then issuing a cert.
2. Let's Encrypt HTTP-01 challenge will succeed once DNS resolves to `hetzim.ddns.net`.
3. Verify: `curl -sI https://ai.realtechee.com/` should return `HTTP/2 200`.

## After you verify https://ai.realtechee.com works on the home server

The AWS Amplify app `d2basdqti48ssd` and its CFN stacks can be deleted:

```bash
# Delete branch first (auto-fails on the running deployment URL)
aws amplify delete-branch --app-id d2basdqti48ssd --branch-name master --region us-west-1

# Wait for branch CFN stack to delete (cascade ~5 min)
# Stack: amplify-d2basdqti48ssd-master-branch-8919ba5de1

# Then delete the app
aws amplify delete-app --app-id d2basdqti48ssd --region us-west-1

# Then delete the sandbox stack (if no longer needed for auth/data)
aws cloudformation delete-stack --stack-name amplify-realtecheen8n-doron-sandbox-8bdb6ede52 --region us-west-1
```

This will also cascade-delete Cognito pools `us-west-1_xsnVCuXmu` and `us-west-1_fLtUjZYOt`, AppSync API `lsruhe7g4rcw5f4o44hklexzcm`, and the realtecheen8n DDB tables.

**Do NOT delete the Amplify app until you have signed in to the running app at https://ai.realtechee.com on the home server** — once Cognito `us-west-1_xsnVCuXmu` is gone, the app's login will break unless you've already migrated to a different auth backend.

## Rollback if needed

To revert: change the DNS CNAME back to `d2fjtrmkngn8qb.cloudfront.net.` — original AWS Amplify deployment is still running at app id `d2basdqti48ssd`, branch `master`, untouched.

On the home server, to stop the new deployment:

```bash
ssh doron@192.168.4.200 "cd /home/doron/Projects/realTechee_n8n && docker compose down"
```

## Notes / open items

- The cloned repo on the home server got a custom `Dockerfile` + `docker-compose.yml` that I authored (not committed back to GitHub). If you want them in source control, commit them from `/home/doron/Projects/realTechee_n8n` on the home server, or copy the files back to your dev laptop's clone.
- The `amplify_outputs.json` I generated on the home server is reconstructed from the live AWS stack; not committed (it's gitignored).
- The app code itself was not modified.
