# AGENT A — Critical Finding (NOT a hard blocker, but a deviation from locked decisions)

**Discovered:** 2026-05-25
**Status:** Resolved by evidence — proceeding with corrected plan

## What the locked decision said
> "Delete orphan Cognito pools (keep only `us-west-1_5pFbWcwtU` = production)"

## What the evidence shows
Production runtime (www.realtechee.com) uses Cognito pool **`us-west-1_UKszK3GQb`**, NOT `us-west-1_5pFbWcwtU`.

### Evidence chain
1. `aws cloudformation list-stack-resources --stack-name amplify-d200k2wsaf8th3-production-branch-dcd66e486e-auth179371D7-1WA616LSNR3YP` returns Cognito pool `us-west-1_UKszK3GQb` as the auth resource owned by the **actual production CFN stack**.
2. `curl https://www.realtechee.com/_next/static/chunks/pages/_app-0af1b1681f092de8.js | grep cognito` → `us-west-1_UKszK3GQb` is baked into the deployed JS bundle.
3. The local `amplify_outputs.json` references `us-west-1_5pFbWcwtU` — but this is a **stale local sandbox file** that does not reflect what is actually deployed.
4. The realtecheeclone-doron-sandbox CFN stack **owns** pool `5pFbWcwtU` — confirming `5pFbWcwtU` is the sandbox/dev pool, not production.

## Corrected plan
- **PRESERVE `us-west-1_UKszK3GQb`** (real production pool, owned by `amplify-d200k2wsaf8th3-production-branch-dcd66e486e-auth179371D7-1WA616LSNR3YP`)
- **DELETE `us-west-1_5pFbWcwtU`** — sandbox pool owned by the orphan realtecheeclone stack (will be deleted as part of the stack cascade)
- **DELETE the other 4 orphans:** `1eQCIgm5h`, `NeGfFuVD7`, `fLtUjZYOt`, `xsnVCuXmu`
- **Production stack `amplify-d200k2wsaf8th3-production-branch-dcd66e486e` remains untouched** (it owns the real production pool, S3 bucket, DDB tables)

## Verification post-cleanup
After Phase 2: re-run `curl https://www.realtechee.com/ -I` and confirm HTTP 200. The runtime does not authenticate against `5pFbWcwtU`, so deleting it must have zero impact on the live site.
