import { defineFunction } from '@aws-amplify/backend';

export const postConfirmationHandler = defineFunction({
  name: 'post-confirmation-handler',
  entry: './src/index.ts',
  runtime: 20,
  timeoutSeconds: 30,
  environment: {
    CONTACTS_TABLE: 'Contacts',
    DEBUG_MODE: 'false'
  }
});