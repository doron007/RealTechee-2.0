import { defineFunction } from '@aws-amplify/backend';

export const reputationMonitor = defineFunction({
  name: 'reputation-monitor',
  entry: './src/index.ts',
  environment: {
    DEBUG_MODE: process.env.DEBUG_MODE || 'false'
  },
  runtime: 20,
  timeoutSeconds: 300, // 5 minutes
  memoryMB: 256,
  schedule: 'every day' // Run daily to update reputation metrics
});