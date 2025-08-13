#!/usr/bin/env node
/**
 * validate-env.js (Deprecated Wrapper)
 * ------------------------------------
 * Retained for backward compatibility. Delegates to the Phase 1 contract
 * verifier. Prefer calling `npm run verify:env-contract` directly.
 */
/* eslint-disable no-console */
const { spawnSync } = require('child_process');
console.log('🔁 Delegating to scripts/verify-env-contract.js ...');
const result = spawnSync('node', ['scripts/verify-env-contract.js'], { stdio: 'inherit' });
process.exit(result.status ?? 1);