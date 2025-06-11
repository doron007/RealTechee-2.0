// Generated Amplify schema for BackOfficeProjectStatuses
// Source: BackOfficeProjectStatuses.csv (9 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const backofficeProjectstatusesSchema = a.schema({
  BackOfficeProjectStatuses: a
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

export type BackOfficeProjectStatusesSchema = ClientSchema<typeof backofficeProjectstatusesSchema>;

export const backofficeProjectstatusesData = defineData({
  schema: backofficeProjectstatusesSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});