// Generated Amplify schema for Auth
// Source: Auth.csv (58 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const authSchema = a.schema({
  Auth: a
    .model({
      owner: a.string(),
      email: a.email(),
      hash: a.boolean(),
      token: a.string(),
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type AuthSchema = ClientSchema<typeof authSchema>;

export const authData = defineData({
  schema: authSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});