import { defineFunction } from '@aws-amplify/backend';

export const statusProcessor = defineFunction({
  name: 'status-processor',
  entry: './src/index.ts',
  environment: {
    AMPLIFY_DATA_GRAPHQL_ENDPOINT: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || '',
    AMPLIFY_DATA_GRAPHQL_API_KEY: process.env.AMPLIFY_DATA_GRAPHQL_API_KEY || '',
  // Inject dynamic table suffix (reuse public env if set, otherwise expect pipeline to set TABLE_SUFFIX explicitly)
  TABLE_SUFFIX: (process.env.NEXT_PUBLIC_BACKEND_SUFFIX || process.env.TABLE_SUFFIX || ''),
  },
  schedule: 'every day', // Run daily using natural language expression
});

// Build-time visibility: warn if suffix empty (will cause runtime failure) 
if (!(process.env.NEXT_PUBLIC_BACKEND_SUFFIX || process.env.TABLE_SUFFIX)) {
  // eslint-disable-next-line no-console
  console.warn('[status-processor] Warning: TABLE_SUFFIX not resolved at build time. Ensure sandbox/staging/prod env exports NEXT_PUBLIC_BACKEND_SUFFIX or TABLE_SUFFIX.');
}