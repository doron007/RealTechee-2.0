import { defineFunction } from '@aws-amplify/backend';

export const sesBounceHandler = defineFunction({
  name: 'ses-bounce-handler',
  entry: './src/index.ts',
  environment: {
    DEBUG_MODE: process.env.DEBUG_MODE || 'false',
    DEBUG_EMAIL: process.env.DEBUG_EMAIL || 'info@realtechee.com'
  },
  runtime: 20,
  timeoutSeconds: 300, // 5 minutes
  memoryMB: 256
});