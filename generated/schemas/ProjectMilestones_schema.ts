// Generated Amplify schema for ProjectMilestones
// Source: ProjectMilestones.csv (142 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const projectmilestonesSchema = a.schema({
  ProjectMilestones: a
    .model({
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
      name: a.string(),
      description: a.string(),
      projectId: a.id(),
      order: a.float(),
      isComplete: a.boolean(),
      estimatedStart: a.string(),
      estimatedFinish: a.boolean(),
      isCategory: a.boolean(),
      isInternal: a.boolean(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type ProjectMilestonesSchema = ClientSchema<typeof projectmilestonesSchema>;

export const projectmilestonesData = defineData({
  schema: projectmilestonesSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});