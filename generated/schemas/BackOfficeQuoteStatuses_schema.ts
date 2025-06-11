// Generated Amplify schema for BackOfficeQuoteStatuses
// Source: BackOfficeQuoteStatuses.csv (12 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const backofficeQuotestatusesSchema = a.schema({
  BackOfficeQuoteStatuses: a
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

export type BackOfficeQuoteStatusesSchema = ClientSchema<typeof backofficeQuotestatusesSchema>;

export const backofficeQuotestatusesData = defineData({
  schema: backofficeQuotestatusesSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});