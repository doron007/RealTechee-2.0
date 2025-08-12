/**
 * Dynamic Environment Configuration Utility (Phase 1)
 * --------------------------------------------------
 * Single source of truth for environment-derived runtime config.
 * Reads from process.env (preferred) with fallback to Amplify generated outputs
 * for local sandbox development. Provides server + client safe variants.
 *
 * No hardcoded backend suffixes or URLs live outside this module after refactor.
 */
import outputs from '../amplify_outputs.json';

export type RuntimeEnvironment = 'sandbox' | 'staging' | 'production' | 'unknown';

export interface DriftInfo {
  expectedSuffix?: string;
  actualSuffix?: string;
  status: 'ok' | 'mismatch' | 'unknown';
  message?: string;
}

export interface ClientConfig {
  environment: RuntimeEnvironment;
  backendSuffix: string | undefined;
  graphqlUrl: string | undefined;
  region: string | undefined;
  cognito: { userPoolId?: string; clientId?: string; };
  storage: { publicBaseUrl?: string; };
  flags: { isProd: boolean; isStaging: boolean; isSandbox: boolean; };
  drift: DriftInfo;
  build: { nodeEnv?: string; timestamp: string; };
}

export interface ServerConfig extends ClientConfig {
  secrets: { graphqlApiKey?: string; };
}

const cached: { server?: ServerConfig; client?: ClientConfig } = {};

function determineEnvironment(explicit?: string, suffix?: string): RuntimeEnvironment {
  if (explicit === 'production') return 'production';
  if (explicit === 'staging') return 'staging';
  if (explicit === 'sandbox' || explicit === 'development') return 'sandbox';
  if (suffix && /^[a-z0-9]{20,40}$/.test(suffix)) return 'unknown';
  return 'unknown';
}

function computeDrift(env: RuntimeEnvironment, backendSuffix?: string): DriftInfo {
  const expectedVar = env === 'production' ? process.env.EXPECTED_PROD_SUFFIX
    : env === 'staging' ? process.env.EXPECTED_STAGING_SUFFIX
    : undefined;
  if (!expectedVar) return { status: 'unknown', actualSuffix: backendSuffix };
  if (!backendSuffix) return { status: 'mismatch', expectedSuffix: expectedVar, message: 'Backend suffix missing', actualSuffix: backendSuffix };
  if (backendSuffix === expectedVar) return { status: 'ok', expectedSuffix: expectedVar, actualSuffix: backendSuffix };
  return { status: 'mismatch', expectedSuffix: expectedVar, actualSuffix: backendSuffix, message: `Suffix drift detected (expected ${expectedVar} got ${backendSuffix})` };
}

export function mask(value?: string, visible = 6): string | undefined {
  if (!value) return value;
  if (value.length <= visible) return '*'.repeat(value.length);
  return value.slice(0, visible) + '*'.repeat(Math.max(0, value.length - visible));
}

function buildBase() {
  const backendSuffix = process.env.NEXT_PUBLIC_BACKEND_SUFFIX;
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || outputs.data?.url;
  const region = process.env.NEXT_PUBLIC_AWS_REGION || outputs.auth?.aws_region || outputs.data?.aws_region;
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || outputs.auth?.user_pool_id;
  const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || outputs.auth?.user_pool_client_id;
  const publicBaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
  const explicitEnv = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV;
  const environment = determineEnvironment(explicitEnv, backendSuffix);
  const drift = computeDrift(environment, backendSuffix);
  return { environment, backendSuffix, graphqlUrl, region, cognito: { userPoolId, clientId: userPoolClientId }, storage: { publicBaseUrl }, flags: { isProd: environment === 'production', isStaging: environment === 'staging', isSandbox: environment === 'sandbox' }, drift, build: { nodeEnv: process.env.NODE_ENV, timestamp: new Date().toISOString() } };
}

export function getServerConfig(): ServerConfig {
  if (cached.server) return cached.server;
  const base = buildBase();
  const server: ServerConfig = { ...base, secrets: { graphqlApiKey: outputs.data?.api_key } };
  cached.server = server;
  return server;
}

export function getClientConfig(): ClientConfig {
  if (cached.client) return cached.client;
  const { secrets, ...server } = getServerConfig();
  cached.client = server;
  return server;
}

export function logClientConfigOnce() {
  if (typeof window === 'undefined') return;
  if ((window as any).__ENV_CONFIG_LOGGED__) return;
  (window as any).__ENV_CONFIG_LOGGED__ = true;
  const cfg = getClientConfig();
  console.log('🧩 Environment Config (client)', { ...cfg, backendSuffix: cfg.backendSuffix, graphqlUrl: cfg.graphqlUrl, cognito: cfg.cognito, storage: cfg.storage, drift: cfg.drift });
}

export function assertRequiredForProduction() {
  const cfg = getServerConfig();
  if (cfg.environment === 'production') {
    const missing: string[] = [];
    if (!cfg.backendSuffix) missing.push('NEXT_PUBLIC_BACKEND_SUFFIX');
    if (!cfg.graphqlUrl) missing.push('NEXT_PUBLIC_GRAPHQL_URL');
    if (!cfg.cognito.userPoolId) missing.push('NEXT_PUBLIC_USER_POOL_ID');
    if (!cfg.cognito.clientId) missing.push('NEXT_PUBLIC_USER_POOL_CLIENT_ID');
    if (!cfg.storage.publicBaseUrl) missing.push('NEXT_PUBLIC_S3_PUBLIC_BASE_URL');
    if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

export default { getServerConfig, getClientConfig, logClientConfigOnce, assertRequiredForProduction };
