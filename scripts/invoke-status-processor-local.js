#!/usr/bin/env node
/**
 * Local invocation harness for status-processor Lambda.
 * Usage (example):
 *   TABLE_SUFFIX=localsuffix DRY_RUN=true node scripts/invoke-status-processor-local.js
 */

/* eslint-disable no-console */

require('ts-node/register');
process.env.AWS_REGION = process.env.AWS_REGION || 'us-west-1';
process.env.DRY_RUN = process.env.DRY_RUN || 'true';

if (!process.env.TABLE_SUFFIX && !process.env.NEXT_PUBLIC_BACKEND_SUFFIX) {
  console.warn('⚠️  Neither TABLE_SUFFIX nor NEXT_PUBLIC_BACKEND_SUFFIX set. Using placeholder suffix for local test.');
  process.env.TABLE_SUFFIX = 'localtestsuffix';
}

(async () => {
  try {
    // Ensure function is built before invoking (dist/index.js)
    try { await import('../amplify/functions/status-processor/dist/index.js'); } catch (_) {
      console.log('[Harness] Building function...');
      const { spawnSync } = await import('node:child_process');
      const build = spawnSync('npm', ['run', 'build'], { cwd: 'amplify/functions/status-processor', stdio: 'inherit' });
      if (build.status !== 0) throw new Error('Build failed for status-processor');
    }
    const mod = await import('../amplify/functions/status-processor/dist/index.js');
  const handler = mod.handler;
  const fakeEvent = { time: new Date().toISOString(), resources: ['local/manual'] };
  await handler(fakeEvent, {}, () => {});
    console.log('✅ Local invocation completed.');
  } catch (err) {
    console.error('❌ Local invocation failed:', err);
    process.exit(1);
  }
})();
