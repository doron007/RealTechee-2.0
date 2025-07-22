import { defineFunction } from '@aws-amplify/backend';

export const statusProcessor = defineFunction({
  name: 'status-processor',
  entry: './src/index.ts',
  environment: {
    AMPLIFY_DATA_GRAPHQL_ENDPOINT: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || '',
    AMPLIFY_DATA_GRAPHQL_API_KEY: process.env.AMPLIFY_DATA_GRAPHQL_API_KEY || '',
  },
  schedule: 'every day', // Run daily using natural language expression
});