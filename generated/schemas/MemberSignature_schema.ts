// Generated Amplify schema for MemberSignature
// Source: MemberSignature.csv (38 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const membersignatureSchema = a.schema({
  MemberSignature: a
    .model({
      memberEmail: a.email(),
      signature: a.string(),
      initials: a.string(),
      ip: a.string(),
      fullName: a.string(),
      initialsPublicUrl: a.url(),
      initialsWixUrl: a.url(),
      signaturePublicUrl: a.url(),
      signatureWixUrl: a.url(),
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type MemberSignatureSchema = ClientSchema<typeof membersignatureSchema>;

export const membersignatureData = defineData({
  schema: membersignatureSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});