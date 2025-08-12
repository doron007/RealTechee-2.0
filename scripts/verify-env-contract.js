#!/usr/bin/env node
/**
 * verify-env-contract.js (Phase 1)
 * Validates dynamic environment configuration contract.
 */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const REQUIRED_BASE = [
  'NEXT_PUBLIC_BACKEND_SUFFIX',
  'NEXT_PUBLIC_GRAPHQL_URL',
  'NEXT_PUBLIC_USER_POOL_ID',
  'NEXT_PUBLIC_USER_POOL_CLIENT_ID',
  'NEXT_PUBLIC_S3_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_AWS_REGION'
];

const ENV = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development';
const isProd = ENV === 'production';
const isStaging = ENV === 'staging';
let exitCode = 0;

function section(title) { console.log(`\n=== ${title} ===`); }

section('Environment Variable Presence');
const missing = REQUIRED_BASE.filter(v => !process.env[v]);
if ((isProd || isStaging) && missing.length) { console.error('❌ Missing required environment variables:', missing.join(', ')); exitCode = 1; }
else if (missing.length) { console.warn('⚠️  Missing (non-fatal in sandbox) variables:', missing.join(', ')); }
else { console.log('✅ All required variables present'); }

section('Suffix Drift Detection');
const actualSuffix = process.env.NEXT_PUBLIC_BACKEND_SUFFIX;
const expected = isProd ? process.env.EXPECTED_PROD_SUFFIX : (isStaging ? process.env.EXPECTED_STAGING_SUFFIX : undefined);
if (expected) {
  if (expected === actualSuffix) console.log(`✅ Suffix matches expected (${expected})`);
  else { console.warn(`⚠️  Suffix drift: expected ${expected} got ${actualSuffix}`); if (process.env.STRICT_SUFFIX_ENFORCEMENT === 'true') exitCode = 1; }
} else { console.log('ℹ️  No EXPECTED_* suffix specified; drift detection skipped'); }

section('Hardcoded Suffix Scan');
const LEGACY_IDS = [ 'fvn7t5hbobaxjklhrqzdl4ac34', 'aqnqdrctpzfwfjwyxxsmu6peoq' ];
const ROOT = process.cwd();
const RUNTIME_DIRS = ['components', 'utils', 'amplify/functions'];
const EXCLUDE_FILES = new Set(['environmentConfig.ts']);

function walk(dir) { if (!fs.existsSync(dir)) return []; return fs.readdirSync(dir).flatMap(name => { const fp = path.join(dir, name); const stat = fs.statSync(fp); if (stat.isDirectory()) return walk(fp); return [fp]; }); }

const offenders = [];
for (const d of RUNTIME_DIRS) {
  const abs = path.join(ROOT, d); if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    if (!/\.(t|j)sx?$/.test(file)) continue;
    if (EXCLUDE_FILES.has(path.basename(file))) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const legacy of LEGACY_IDS) { if (content.includes(legacy)) offenders.push({ file: path.relative(ROOT, file), legacy }); }
  }
}

if (offenders.length) {
  console.warn('⚠️  Found hardcoded legacy suffix occurrences (to be removed in later phases):');
  offenders.slice(0, 20).forEach(o => console.warn(`  - ${o.file} -> ${o.legacy}`));
  if (process.env.STRICT_SUFFIX_ENFORCEMENT === 'true') { console.error('❌ STRICT_SUFFIX_ENFORCEMENT enabled: failing build.'); exitCode = 1; }
} else { console.log('✅ No legacy suffix literals found in runtime sources'); }

section('Summary');
if (exitCode === 0) console.log('✅ Environment contract verification PASSED');
else console.error('❌ Environment contract verification FAILED');
process.exit(exitCode);
