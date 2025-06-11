// Generated Amplify schema for BackOfficeAssignTo
// Source: BackOfficeAssignTo.csv (10 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const backofficeAssigntoSchema = a.schema({
  BackOfficeAssignTo: a
    .model({
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
      name: a.string(),
      email: a.email(),
      mobile: a.float(),
      sendEmailNotifications: a.email(),
      sendSmsNotifications: a.boolean(),
      active: a.boolean(),
      order: a.float(),
      contactId: a.id(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type BackOfficeAssignToSchema = ClientSchema<typeof backofficeAssigntoSchema>;

export const backofficeAssigntoData = defineData({
  schema: backofficeAssigntoSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});