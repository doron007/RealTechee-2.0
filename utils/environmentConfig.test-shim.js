// Lightweight CommonJS shim for unit tests (avoids ESM/TypeScript loader complexity)
// Mirrors the runtime behavior of environmentConfig.ts for tested surface only.
const fs = require('fs');
const path = require('path');

let outputs = {};
try {
  const raw = fs.readFileSync(path.join(__dirname, '../amplify_outputs.json'), 'utf8');
  outputs = JSON.parse(raw);
} catch (_) {}

function determineEnvironment(explicit, suffix) {
  if (explicit === 'production') return 'production';
  if (explicit === 'staging') return 'staging';
  if (explicit === 'sandbox' || explicit === 'development') return 'sandbox';
  if (suffix && /^[a-z0-9]{20,40}$/.test(suffix)) return 'unknown';
  return 'unknown';
}

function computeDrift(env, backendSuffix) {
  const expectedVar = env === 'production' ? process.env.EXPECTED_PROD_SUFFIX
    : env === 'staging' ? process.env.EXPECTED_STAGING_SUFFIX
    : undefined;
  if (!expectedVar) return { status: 'unknown', actualSuffix: backendSuffix };
  if (!backendSuffix) return { status: 'mismatch', expectedSuffix: expectedVar, message: 'Backend suffix missing', actualSuffix: backendSuffix };
  if (backendSuffix === expectedVar) return { status: 'ok', expectedSuffix: expectedVar, actualSuffix: backendSuffix };
  return { status: 'mismatch', expectedSuffix: expectedVar, actualSuffix: backendSuffix, message: `Suffix drift detected (expected ${expectedVar} got ${backendSuffix})` };
}

let cached;
function getServerConfig() {
  if (cached) return cached;
  const backendSuffix = process.env.NEXT_PUBLIC_BACKEND_SUFFIX;
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || outputs.data?.url;
  const region = process.env.NEXT_PUBLIC_AWS_REGION || outputs.auth?.aws_region || outputs.data?.aws_region;
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || outputs.auth?.user_pool_id;
  const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || outputs.auth?.user_pool_client_id;
  const publicBaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
  const explicitEnv = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV;
  const environment = determineEnvironment(explicitEnv, backendSuffix);
  const drift = computeDrift(environment, backendSuffix);
  cached = { environment, backendSuffix, graphqlUrl, region, cognito: { userPoolId, clientId: userPoolClientId }, storage: { publicBaseUrl }, flags: { isProd: environment === 'production', isStaging: environment === 'staging', isSandbox: environment === 'sandbox' }, drift, build: { nodeEnv: process.env.NODE_ENV, timestamp: new Date().toISOString() } };
  return cached;
}

module.exports = { getServerConfig };
