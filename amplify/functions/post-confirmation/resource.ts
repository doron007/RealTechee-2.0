import { defineFunction } from '@aws-amplify/backend';

export const postConfirmationHandler = defineFunction({
  name: 'post-confirmation-handler',
  entry: './src/index.ts',
  runtime: 20,
  timeoutSeconds: 30,
  environment: {
    DEBUG_MODE: 'false'
  },
  resourceGroupName: 'auth' // Assign to auth stack since it's an auth trigger
});