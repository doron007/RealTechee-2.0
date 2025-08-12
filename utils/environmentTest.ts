/**
 * DEPRECATED (Phase 2): environmentTest
 * --------------------------------------------------
 * This legacy utility previously duplicated environment resolution logic
 * and hard‑coded backend suffix heuristics. It is now a thin compatibility
 * adapter over the new environmentConfig module so existing imports do not
 * break mid‑refactor. All new code MUST import from `environmentConfig`.
 *
 * Removal Plan:
 *  - Phase 3: Eliminate remaining imports (amplifyAPI, SystemConfigPage, etc.)
 *  - Phase 4: Delete this file once no references remain and verifier passes
 */
import { getClientConfig, logClientConfigOnce } from './environmentConfig';

export const getEnvironmentInfo = () => {
  const cfg = getClientConfig();
  return {
    environment: cfg.environment,
    usingEnvironmentVariables: !!cfg.backendSuffix,
    envVars: {
      NEXT_PUBLIC_BACKEND_SUFFIX: cfg.backendSuffix,
      NEXT_PUBLIC_GRAPHQL_URL: cfg.graphqlUrl,
      NEXT_PUBLIC_USER_POOL_ID: cfg.cognito.userPoolId,
      NEXT_PUBLIC_USER_POOL_CLIENT_ID: cfg.cognito.clientId,
      NEXT_PUBLIC_AWS_REGION: cfg.region
    },
    fallbackValues: {},
    effectiveConfig: {
      backendSuffix: cfg.backendSuffix,
      graphqlUrl: cfg.graphqlUrl,
      userPoolId: cfg.cognito.userPoolId,
      userPoolClientId: cfg.cognito.clientId,
      region: cfg.region
    },
    buildTime: cfg.build.timestamp,
    nodeEnv: cfg.build.nodeEnv,
  };
};

export const logEnvironmentInfo = () => {
  logClientConfigOnce();
  const info = getEnvironmentInfo();
  console.log('🔧 Environment Configuration (compat adapter):', info);
  return info;
};