import { defineFunction } from '@aws-amplify/backend';

export const userAdmin = defineFunction({
  name: 'user-admin',
  entry: './handler.ts',
  environment: {
    USER_POOL_ID: process.env.USER_POOL_ID || '',
  },
  runtime: 20
});