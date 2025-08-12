#!/bin/bash
# Phase 5.3 CI Guard Script
set -euo pipefail

echo "[Guard] Starting migration scripts guard verification"
FAILURES=0

run_expect_fail() { local desc="$1"; shift; if "$@" >/dev/null 2>&1; then echo "[Guard][FAIL] $desc: command succeeded but should have failed"; FAILURES=$((FAILURES+1)); else echo "[Guard][OK]   $desc failed as expected"; fi; }
run_expect_success() { local desc="$1"; shift; if "$@" >/dev/null 2>&1; then echo "[Guard][OK]   $desc succeeded"; else echo "[Guard][FAIL] $desc: command failed unexpectedly"; FAILURES=$((FAILURES+1)); fi; }

run_expect_fail "validate-migration no env" bash -c 'LEGACY_SUFFIX= STAGING_SUFFIX= PRODUCTION_SUFFIX= ./scripts/validate-migration.sh'
run_expect_success "validate-migration with dummy env" bash -c 'LEGACY_SUFFIX=aaaaaaaaaaaaaaaaaaaaaaaa STAGING_SUFFIX=bbbbbbbbbbbbbbbbbbbbbbbb PRODUCTION_SUFFIX=cccccccccccccccccccccccc ./scripts/validate-migration.sh >/dev/null'
run_expect_fail "simple-migrate analyze no env" bash -c 'SANDBOX_SUFFIX= PRODUCTION_SUFFIX= ./scripts/simple-migrate-data.sh analyze'
run_expect_success "simple-migrate analyze with env" bash -c 'SANDBOX_SUFFIX=dddddddddddddddddddddddd PRODUCTION_SUFFIX=eeeeeeeeeeeeeeeeeeeeeeee ./scripts/simple-migrate-data.sh analyze >/dev/null'
run_expect_fail "migrate-data analyze no env" bash -c './scripts/migrate-data.sh analyze'
run_expect_success "migrate-data analyze with env" bash -c 'SOURCE_BACKEND_SUFFIX=ffffffffffffffffffffffff TARGET_BACKEND_SUFFIX=gggggggggggggggggggggggg ./scripts/migrate-data.sh analyze --confirm-suffix gggggggggggggggggggggggg < /dev/null'

if [[ $FAILURES -gt 0 ]]; then echo "[Guard] Completed with $FAILURES failure(s)" >&2; exit 1; fi

echo "[Guard] All guard checks passed"
