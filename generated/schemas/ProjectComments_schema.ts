// Generated Amplify schema for ProjectComments
// Source: ProjectComments.csv (240 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const projectcommentsSchema = a.schema({
  ProjectComments: a
    .model({
      postedByContactId: a.id(),
      nickname: a.string(),
      projectId: a.id(),
      files: a.string(),
      comment: a.string(),
      isPrivate: a.boolean(),
      postedByProfileImage: a.string(),
      addToGallery: a.string(),
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type ProjectCommentsSchema = ClientSchema<typeof projectcommentsSchema>;

export const projectcommentsData = defineData({
  schema: projectcommentsSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});