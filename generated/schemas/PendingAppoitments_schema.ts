// Generated Amplify schema for PendingAppoitments
// Source: PendingAppoitments.csv (183 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const pendingappoitmentsSchema = a.schema({
  PendingAppoitments: a
    .model({
      ID: a.id().required(),
      assignedTo: a.string(),
      status: a.string(),
      serviceName: a.string(),
      name: a.string(),
      email: a.email(),
      phone: a.float(),
      agentName: a.string(),
      agentEmail: a.email(),
      agentPhone: a.string(),
      requestAddress: a.string(),
      brokerage: a.string(),
      visitorId: a.id(),
      requestedSlot: a.string(),
      preferredLocation: a.string(),
      requestId: a.id(),
      assignedDate: a.datetime(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type PendingAppoitmentsSchema = ClientSchema<typeof pendingappoitmentsSchema>;

export const pendingappoitmentsData = defineData({
  schema: pendingappoitmentsSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});