// Generated Amplify schema for BackOfficeRoleTypes
// Source: BackOfficeRoleTypes.csv (7 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const backofficeRoletypesSchema = a.schema({
  BackOfficeRoleTypes: a
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

export type BackOfficeRoleTypesSchema = ClientSchema<typeof backofficeRoletypesSchema>;

export const backofficeRoletypesData = defineData({
  schema: backofficeRoletypesSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});