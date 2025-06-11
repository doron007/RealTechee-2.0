// Generated Amplify schema for BackOfficeBookingStatuses
// Source: BackOfficeBookingStatuses.csv (3 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const backofficeBookingstatusesSchema = a.schema({
  BackOfficeBookingStatuses: a
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

export type BackOfficeBookingStatusesSchema = ClientSchema<typeof backofficeBookingstatusesSchema>;

export const backofficeBookingstatusesData = defineData({
  schema: backofficeBookingstatusesSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});