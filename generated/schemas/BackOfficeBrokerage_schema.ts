// Generated Amplify schema for BackOfficeBrokerage
// Source: BackOfficeBrokerage.csv (10 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const backofficeBrokerageSchema = a.schema({
  BackOfficeBrokerage: a
    .model({
      title: a.string(),
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
      order: a.float(),
      live: a.boolean(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type BackOfficeBrokerageSchema = ClientSchema<typeof backofficeBrokerageSchema>;

export const backofficeBrokerageData = defineData({
  schema: backofficeBrokerageSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});