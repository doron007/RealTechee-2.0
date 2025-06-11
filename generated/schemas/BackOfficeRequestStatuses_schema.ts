// Generated Amplify schema for BackOfficeRequestStatuses
// Source: BackOfficeRequestStatuses.csv (5 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const backofficeRequeststatusesSchema = a.schema({
  BackOfficeRequestStatuses: a
    .model({
      title: a.string(),
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
      order: a.float(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type BackOfficeRequestStatusesSchema = ClientSchema<typeof backofficeRequeststatusesSchema>;

export const backofficeRequeststatusesData = defineData({
  schema: backofficeRequeststatusesSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});