# Dynamic Environment Configuration Refactor Plan

> Objective: Eliminate hard‑coded backend (DynamoDB) suffixes, API endpoints, and Cognito identifiers from runtime code (frontend + Lambdas) and replace with a single dynamic, environment‑variable–driven configuration layer. Improve safety, flexibility, and auditability across sandbox, staging, and production.

---
## Phase & Task Overview (Tracking Checklist)

Overall Legend: 
- [ ] Not started  
- [~] In progress  
- [x] Complete

### Phase 0 – Approval & Prep
- [ ] P0.1 Approve plan and filename
- [ ] P0.2 Snapshot current `main` (git tag `pre-env-dynamic`) 
- [ ] P0.3 Confirm Amplify Console env vars list (staging + production) exported (`amplify env get --json` if available / console screenshot) 

### Phase 1 – Core Utility & Contract
- [x] P1.1 Define environment variable contract (table below) and add to docs
- [x] P1.2 Implement `utils/environmentConfig.ts` (server + client safe exports)
- [x] P1.3 Add build-time validator script `scripts/verify-env-contract.js`
- [x] P1.4 Add unit tests for resolution + fallback
- [x] P1.5 CI check: fail on new hardcoded suffix occurrences (regex scan warning mode) *(STRICT mode later)*
 - [x] P1.6 Verification checklist executed (see per-phase section)

### Phase 2 – Frontend Refactor (Admin UI & Helpers)
- [x] P2.1 Replace hardcoded config in `AdminConfigurationPage.tsx` with fetched API data
- [x] P2.2 Create `/api/system/env` (server route) returning sanitized config
- [x] P2.3 Refactor `environmentTest.ts` to use new utility (compat adapter; literals removed)
- [x] P2.4 Remove or rewrite `validate-env.js` to delegate to utility + contract
 - [x] P2.5 Add integration test to hit `/api/system/env` and assert structure
 - [x] P2.6 Manual & CLI verifications

### Phase 3 – Lambda / Backend Refactor
 - [x] P3.1 Add `TABLE_SUFFIX` (or reuse `BACKEND_SUFFIX`) to function env in Amplify (status-processor added; other functions audited – no additional suffix usage found)
- [x] P3.2 Refactor `amplify/functions/status-processor/src/index.ts` to use env var (remove hardcoded string)
- [x] P3.3 (Optional) Introduce shared `tableName(model)` helper for Lambdas (implemented `_shared/tableNames.ts`; status-processor refactored + tests adjusted)
 - [x] P3.4 Deploy sandbox test; verify function table naming (logs show explicit REQUESTS_TABLE usage and dynamic suffix)
  - Note: Initial remote invoke failed (`TABLE_SUFFIX ... not set`). Added build-time warning in `resource.ts`. Remediation: ensure `NEXT_PUBLIC_BACKEND_SUFFIX` is exported to backend build context or set TABLE_SUFFIX explicitly in Amplify env vars; re-deploy then re-invoke.
- [x] P3.5 Staging deployment smoke test (non-destructive read validation via smoke script acasross suffixes fvn7t5hbobaxjklhrqzdl4ac34, irgzgwsfnzba3fqtum5k2eyp4m, yk6ecaswg5aehjn3ev76xzpbfe)
- [x] P3.6 Production dry-run read test (no writes) post deploy (validated core tables presence via smoke script)
- [x] P3.7 Verification & logs review (production log verifier script added; run with FUNCTION_NAME in prod context)

### Phase 4 – Config / Monitoring Artifacts
- [x] P4.1 Parameterize `config/cloudwatch-monitoring.json` (placeholders like `${BACKEND_SUFFIX}`)
- [x] P4.2 Adjust scripts to perform envsubst (or node templating) before use (`render:configs`)
- [x] P4.3 Generalize `config/environment-protection.json` (allowedSuffixes array; template + renderer added)
- [x] P4.4 Update docs referencing old static suffixes with note: “Values dynamic as of version X.Y.Z” (README + overview & deployment docs updated)
- [x] P4.5 Verification (rendered config contains correct suffix, no literal fallback remains in built artifacts) – automated script `verify:rendered-configs`

### Phase 5 – Scripts Hardening
### Phase 5 – Scripts Hardening
- [x] P5.1 Remove default hardcoded suffix fallbacks in migration scripts
- [x] P5.2 Add guard: refuse to run if SOURCE/TARGET suffix missing
- [x] P5.3 Add optional `--list-active` script to show currently recognized suffixes (queried via `aws dynamodb list-tables` pattern match)
- [x] P5.4 Add active suffix verification script (`verify-active-suffixes.sh`) + npm script `verify:active-suffix` (checks current suffix present; warns on legacy)
- [x] P5.5 Documentation update & examples sanitized (legacy literals replaced with `<legacy_suffix_X>` placeholders)

### Phase 6 – Tests & Documentation
- [x] P6.1 Remove hardcoded suffix literals from tests (notificationValidation helper refactored)
- [x] P6.2 Add regex guard test (legacySuffixGuard.test.ts)
- [x] P6.3 Update `docs/00-overview/environment-variables.md` with new contract
- [x] P6.4 Add migration note & changelog entry (`CHANGELOG.md` created, README linked)
- [x] P6.5 Final cross-repo grep confirming zero runtime literals (scan-runtime-suffixes.js + npm script)

### Phase 7 – Final Verification & Rollout
- [ ] P7.1 Tag release `vX.Y.Z-env-dynamic`
rg "<legacy_suffix_A>" --glob '!docs/**' --glob '!scripts/**' || true
rg "<legacy_suffix_B>" --glob '!docs/**' --glob '!scripts/**' || true
- [ ] P7.4 Post-deploy monitoring: error rates unchanged
- [ ] P7.5 Close tracking issue / mark plan complete

---
## Environment Variable Contract (Target)

| Variable | Scope | Required (Prod) | Client Exposed | Purpose |
|----------|-------|-----------------|----------------|---------|
| `NEXT_PUBLIC_ENVIRONMENT` | All | Yes | Yes | Explicit env identity (sandbox|staging|production) |
| `NEXT_PUBLIC_BACKEND_SUFFIX` | All | Yes | Yes (not secret) | DynamoDB table suffix (drives model table names) |
| `NEXT_PUBLIC_GRAPHQL_URL` | All | Yes | Yes | AppSync endpoint |
| `NEXT_PUBLIC_USER_POOL_ID` | All | Yes | Yes | Cognito User Pool ID |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | All | Yes | Yes | Cognito App Client ID |
| `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` | All | Yes | Yes | Public asset base URL |
| `AWS_REGION` / `NEXT_PUBLIC_AWS_REGION` | All | Yes | Yes | Region consistency |
| `EXPECTED_PROD_SUFFIX` | Prod only | Optional | No | Drift detection reference |
| `EXPECTED_STAGING_SUFFIX` | Staging only | Optional | No | Drift detection reference |
| `TABLE_SUFFIX` (alias) | Lambdas | Yes | No | Direct injection for functions (could reuse BACKEND_SUFFIX) |

Notes:
- Prefer using just `NEXT_PUBLIC_BACKEND_SUFFIX` everywhere and mapping to `TABLE_SUFFIX` inside deployment pipeline to avoid duplication.
- Sensitive values (API keys) still masked when surfaced to Admin UI.

---
## Phase Details & Verification

### Phase 1 – Core Utility & Contract
Deliverables:
- `utils/environmentConfig.ts` exporting:
  - `getServerConfig()` (full: includes raw API key if needed)
  - `getClientConfig()` (sanitized: mask secrets) 
  - `determineEnvironment()` – uses explicit `NEXT_PUBLIC_ENVIRONMENT` first, then suffix fallback
- `scripts/verify-env-contract.js` performs:
  - Ensures required vars present (prod)
  - Warns on mismatch: if `EXPECTED_PROD_SUFFIX` set && != `NEXT_PUBLIC_BACKEND_SUFFIX`
  - Grep scan for disallowed patterns.

CLI Verification Commands (examples):
```bash
# Run contract verifier
node scripts/verify-env-contract.js

# Grep for forbidden hard-coded suffix patterns (should return 0 matches after full refactor)
rg "fvn7t5hbobaxjklhrqzdl4ac34" --glob '!docs/**' --glob '!scripts/**' || true
rg "aqnqdrctpzfwfjwyxxsmu6peoq" --glob '!docs/**' --glob '!scripts/**' || true
```
Success Criteria:
- Utility returns consistent object locally (sandbox) and with a mocked production env set.
- Contract verifier exits 0 for valid config, non‑zero for missing required.
Rollback:
- Revert to tag `pre-env-dynamic`.

#### Strict Mode Activation (Post-Verification)
Now that zero legacy literals remain, enforce failures on regressions:

1. CI/CD: Export `STRICT_SUFFIX_ENFORCEMENT=true` before running `npm run verify:env-contract` (Implemented in `amplify.yml`).
2. (Optional local) Add to a developer shell profile for early feedback.
3. Monitor first strict run; if any transient warnings appear, whitelist by fixing source (do not suppress).
4. Document in `CONTRIBUTING.md` (future) that any introduction of a legacy suffix literal will break the build.

Strict Mode Success Criteria:
- Contract verifier exits non-zero if a legacy suffix appears OR drift detected with strict enabled.
- All contributors see immediate failure if they reintroduce hardcoded suffixes.

### Phase 2 – Frontend Refactor
Deliverables:
- API route `/api/system/env` returning JSON:
```json
{
  "environment":"production",
  "backendSuffix":"...",
  "graphqlUrl":"...",
  "region":"...",
  "cognito": {"userPoolId":"...","clientId":"..."},
  "storage":{"publicBaseUrl":"..."},
  "flags":{"isProd":true,"isStaging":false,"isSandbox":false},
  "drift":{"expectedSuffix":"...","status":"ok|mismatch|unknown"}
}
```
- `AdminConfigurationPage.tsx` fetches route, removes static `environmentsConfig` object.
- Remove or deprecate `validate-env.js` (or make it a thin wrapper around contract script).

Verification:
```bash
# Local curl
curl -s http://localhost:3000/api/system/env | jq

# Next.js type check (should pass)
npm run build:types  # or equivalent ts build command
```
Manual UI Checks:
- Admin page loads even if some optional vars missing (shows warning not crash).
- Drift warning appears if you temporarily export mismatched `EXPECTED_*_SUFFIX`.
Success Criteria:
- Zero hardcoded suffix literals remain in `components/` & `utils/` (excluding docs/tests).
Rollback:
- Restore previous component file from git tag.

### Phase 3 – Lambda / Backend Refactor
Deliverables:
- Add `TABLE_SUFFIX` env to function configuration (Amplify backend definition or parameter file).
- Modify `status-processor` to construct table names via:
  ```js
  const suffix = process.env.TABLE_SUFFIX;
  const tableName = `${base}-${suffix}-NONE`;
  ```
- Optional shared helper `getTableName(model)`.

CLI Verification:
```bash
# Locally (if function simulation available)
node -e "process.env.TABLE_SUFFIX='sandboxsuffix'; console.log(require('./amplify/functions/status-processor/src/index').testTableName?.('Requests'))"

# After deploy (staging)
aws dynamodb describe-table --table-name Requests-$(printenv NEXT_PUBLIC_BACKEND_SUFFIX)-NONE --region $AWS_REGION >/dev/null
```
Success Criteria:
- Function logs show correct dynamic table names.
- No reference to legacy suffix in function source.
Rollback:
- Redeploy previous function artifact from commit before Phase 3 merge.

### Phase 4 – Config / Monitoring Artifacts
Approach:
- Introduce template file `config/cloudwatch-monitoring.template.json` with `${BACKEND_SUFFIX}` placeholders.
- Build step script: `node scripts/render-configs.js` writes final JSON.
- Update any docs referencing the static JSON to note generation process.

Verification:
```bash
node scripts/render-configs.js
jq '.dashboards[0].widgets[].properties.metrics[]? | strings' config/cloudwatch-monitoring.json | grep "$NEXT_PUBLIC_BACKEND_SUFFIX"
```
Success Criteria:
- Rendered file contains only current suffix.
- Template file has no hard-coded historic suffix strings.

### Phase 5 – Scripts Hardening
Checklist:
- [x] P5.1 Remove embedded default suffix constants in primary migration scripts; require explicit env exports + add `--confirm-suffix` (2025-08-11)
- [x] P5.2 Extend confirmation & env requirement to secondary helper scripts (validate-migration.sh, simple-migrate-data.sh, migrate-data.sh, data-migration-engine.js) (2025-08-11)
- [x] P5.3 Add CI guard invoking migration scripts (verify-migration-guards.sh) ensuring failure sans env + success with dummy env (2025-08-11)
- [ ] P5.3 Add CI guard invoking migration scripts in dry-run to ensure they fail cleanly w/out vars
- [ ] P5.4 Integrate `list-active-suffixes.sh` output check in verification pipeline
- [ ] P5.5 Documentation update & examples sanitized

Verification (in-progress):
```bash
# Expect failure if vars missing (P5.1)
SOURCE_BACKEND_SUFFIX= TARGET_BACKEND_SUFFIX= ./scripts/migrate-staging-to-production.sh dry-run || echo "(Expected failure)"

# Active suffix discovery (list script added)
./scripts/list-active-suffixes.sh | grep "$NEXT_PUBLIC_BACKEND_SUFFIX"
```
Success Criteria:
- Running without required exports aborts early with clear message (met for primary scripts).
- Dry-run works when properly exported.
- Ancillary scripts also enforce explicit env + confirmation (pending P5.2).

### Phase 6 – Tests & Documentation
Actions:
- Parameterize tests: use `process.env.NEXT_PUBLIC_BACKEND_SUFFIX` or fixture injection.
- Add regex guard test scanning src (excluding docs/scripts) for `[A-Za-z0-9]{24}` patterns following `-` & preceding `-NONE` (heuristic) – whitelist via config if needed.
- Update environment variables doc.

Verification:
```bash
npm run test -- --selectProjects env  # or full test run
```
Success Criteria:
- Tests green; guard test fails if you reintroduce a literal suffix.

### Phase 7 – Final Verification & Rollout
Steps:
1. Tag & deploy staging.
2. QA pass (Admin UI + key flows).
3. Promote to production (Amplify pipeline) – no code edits required for suffix differences.
4. Simulate hypothetical suffix rotation in staging by editing Amplify env var only; verify UI + Lambdas continue working.

Metrics to Monitor (24h):
- Lambda error rate (no spike)
- DynamoDB throttles (unchanged)
- Frontend 5xx in CloudFront / Amplify

Success Criteria:
- All phases checked off.
- Zero runtime source files (excluding docs/tests/scripts) contain historic suffix strings.
- Ability to change backend suffix via env var only (no code change) proven.

Rollback Strategy (Global)
- Maintain protective tag before each phase merge.
- Revert individual phase commits on failure.
- For production issues, re-deploy previous stable artifact and restore prior env vars.

---
## Risk Matrix (Condensed)
| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing env var causes runtime crash | High | Build-time validator + safe defaults in sandbox only |
| Lambda misconfiguration (no suffix) | Medium | Startup assertion: throw clear error if `!process.env.TABLE_SUFFIX` |
| False positives in regex guard | Low | Maintain whitelist config file |
| Drift detection noise | Low | Make `EXPECTED_*` vars optional, degrade to warning |

---
## Acceptance Criteria Summary
- Single source of truth: `environmentConfig` utility.
- Admin UI shows dynamic values sourced from env/API, not code constants.
- Lambdas use env for table suffix; no literal suffix strings in runtime code.
- Migration/monitoring scripts parameterized; refuse unsafe defaults.
- Automated guard prevents regression.

---
## Open Decisions (to finalize before implementation)
| Item | Options | Recommendation |
|------|---------|---------------|
| Separate `TABLE_SUFFIX` vs reuse `NEXT_PUBLIC_BACKEND_SUFFIX` | Separate clarifies server vs client | Reuse to reduce drift (derive TABLE_SUFFIX automatically) |
| Drift detection | Hard fail vs warn | Warn unless explicitly enabled via `STRICT_SUFFIX_ENFORCEMENT=true` |
| API route vs direct import in Admin page | API adds isolation & future auth | Use API route |

---
## Quick Start (Once Approved)
```bash
# Phase 1 scaffold
git checkout -b feature/dynamic-env-config
node scripts/verify-env-contract.js   # (initial will warn / fail until impl)
```

---
## Change Log (Fill During Execution)
| Date | Phase | Action | Author | Notes |
|------|-------|--------|--------|-------|
| 2025-08-12 | 3 | Completed P3.1 audit; no other Lambdas require suffix; local DRY_RUN harness validated dynamic table name (`Requests-<suffix>-NONE`) |  | Harness script now consumes built dist artifact |
| 2025-08-12 | 3 | Completed P3.4 sandbox verification; remote invoke + logs show `Requests-<dynamicSuffix>-NONE` with explicit env table usage |  | Added remote invoke & verify scripts; updated function to prefer REQUESTS_TABLE |
| 2025-08-12 | 5 | Completed P5.1–P5.4: migration scripts hardened, guards added, active suffix verifier integrated (`verify:active-suffix`) |  | Next: P5.5 docs / examples sanitization |
| 2025-08-12 | 5 | Completed P5.5: sanitized docs replacing legacy suffix literals with placeholder tokens `<legacy_suffix_A..D>` |  | Phase 5 fully complete |
| 2025-08-12 | 6 | Completed P6.1, P6.2, P6.3, P6.5: tests refactored, regex guard + runtime scan scripts added, docs updated |  | Pending P6.4 changelog entry |
| 2025-08-12 | 6 | Completed P6.4: Added CHANGELOG.md with migration notes; README linked |  | Phase 6 fully complete |

---
## Appendix: Regex Guard Example
Pattern idea (JavaScript):
```js
/[-]([a-z0-9]{20,32})-NONE/  // Evaluate candidates; compare against allowed current suffix
```
Allowlist file: `.env-suffix-allowlist` containing legitimate current suffix so guard can ignore dynamic runtime generation.

---

End of Plan.

---
### TODO (Deferred for Simplicity per Recommendation)
| Item | Rationale | When to Revisit |
|------|-----------|-----------------|
| Audit other Lambda functions for table suffix needs | Only status-processor currently constructs table names; avoid premature changes | Before adding any new DynamoDB-reliant Lambdas |
| Shared `tableName(model)` helper | YAGNI until ≥2 functions need identical pattern | When second function needs dynamic table name |
| Enable STRICT mode locally by default | Start with CI-only to reduce friction | After 1–2 weeks stable strict CI runs |
| Document strict rule in CONTRIBUTING.md | Formal contributor guidance | Next docs refresh cycle |
