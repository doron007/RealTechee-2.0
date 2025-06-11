// Generated Amplify schema for BackOfficeNotifications
// Source: BackOfficeNotifications.csv (21 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const backofficeNotificationsSchema = a.schema({
  BackOfficeNotifications: a
    .model({
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
      key: a.string(),
      to: a.string(),
      cc: a.string(),
      bcc: a.string(),
      subject: a.string(),
      body: a.string(),
      bodyAsSimpleText: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type BackOfficeNotificationsSchema = ClientSchema<typeof backofficeNotificationsSchema>;

export const backofficeNotificationsData = defineData({
  schema: backofficeNotificationsSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});