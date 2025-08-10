// Environment Configuration Test Utility
import outputs from '../amplify_outputs.json';

export const getEnvironmentInfo = () => {
  const envVars = {
    NEXT_PUBLIC_BACKEND_SUFFIX: process.env.NEXT_PUBLIC_BACKEND_SUFFIX,
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL,
    NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
    NEXT_PUBLIC_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
  };

  const fallbackValues = {
    GRAPHQL_URL: outputs.data?.url,
    USER_POOL_ID: outputs.auth?.user_pool_id,
    USER_POOL_CLIENT_ID: outputs.auth?.user_pool_client_id,
    AWS_REGION: outputs.auth?.aws_region || outputs.data?.aws_region,
  };

  const effectiveConfig = {
    backendSuffix: envVars.NEXT_PUBLIC_BACKEND_SUFFIX || 'NOT_SET',
    graphqlUrl: envVars.NEXT_PUBLIC_GRAPHQL_URL || fallbackValues.GRAPHQL_URL,
    userPoolId: envVars.NEXT_PUBLIC_USER_POOL_ID || fallbackValues.USER_POOL_ID,
    userPoolClientId: envVars.NEXT_PUBLIC_USER_POOL_CLIENT_ID || fallbackValues.USER_POOL_CLIENT_ID,
    region: envVars.NEXT_PUBLIC_AWS_REGION || fallbackValues.AWS_REGION,
  };

  // Detect environment based on table suffix
  const environment = (() => {
    if (effectiveConfig.backendSuffix?.includes('aqnqdrctpzfwfjwyxxsmu6peoq')) return 'production';
    if (effectiveConfig.backendSuffix?.includes('fvn7t5hbobaxjklhrqzdl4ac34')) return 'development/staging';
    if (effectiveConfig.graphqlUrl?.includes('aqnqdrctpzfwfjwyxxsmu6peoq')) return 'production';
    if (effectiveConfig.graphqlUrl?.includes('fvn7t5hbobaxjklhrqzdl4ac34')) return 'development/staging';
    return 'unknown';
  })();

  return {
    environment,
    usingEnvironmentVariables: !!envVars.NEXT_PUBLIC_BACKEND_SUFFIX,
    envVars,
    fallbackValues,
    effectiveConfig,
    buildTime: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
  };
};

// Console logger for debugging
export const logEnvironmentInfo = () => {
  const info = getEnvironmentInfo();
  console.log('🔧 Environment Configuration Test:', info);
  return info;
};