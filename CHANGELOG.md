# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [X.Y.Z] - 2025-08-12
### Added
- Regex legacy backend suffix guard test (`legacySuffixGuard.test.ts`).
- Runtime suffix scan script (`scan-runtime-suffixes.js`) and npm script `scan:runtime:suffixes`.
- Active suffix verification script (`verify-active-suffixes.sh`).
- Cross-repo migration hardening scripts for environment dynamic configuration.

### Changed
- Migration scripts now require explicit suffix env vars and confirmation flags (`--confirm-suffix`).
- Documentation updated: environment variables contract (`environment-variables.md`).
- Removed hardcoded DynamoDB table suffix literals from runtime and tests.

### Migration Notes
- Previous static suffix literals replaced by dynamic `NEXT_PUBLIC_BACKEND_SUFFIX` / `TABLE_SUFFIX` resolution.
- If rotating backend suffix: update env vars, run `npm run verify:active-suffix`, migrate data, then update `EXPECTED_*_SUFFIX` anchors.
- CI should include: `verify:env-contract`, `test:guard:suffix`, `scan:runtime:suffixes` for regression prevention.

### Security
- Eliminated risk of stale table references by centralizing suffix handling.

### Housekeeping
- Plan file `ENVIRONMENT_CONFIG_DYNAMIC_PLAN.md` updated through Phase 6 completion (pending release tag in Phase 7).

