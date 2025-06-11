// Generated Amplify schema for ProjectPermissions
// Source: ProjectPermissions.csv (68 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const projectpermissionsSchema = a.schema({
  ProjectPermissions: a
    .model({
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      projectId: a.id(),
      ID: a.id().required(),
      owner: a.string(),
      na: a.string(),
      permissions: a.boolean(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type ProjectPermissionsSchema = ClientSchema<typeof projectpermissionsSchema>;

export const projectpermissionsData = defineData({
  schema: projectpermissionsSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});