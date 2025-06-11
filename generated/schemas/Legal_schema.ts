// Generated Amplify schema for Legal
// Source: Legal.csv (3 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const legalSchema = a.schema({
  Legal: a
    .model({
      title: a.string(),
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
      content: a.string(),
      legalDocumentId: a.id(),
      documentId: a.id(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type LegalSchema = ClientSchema<typeof legalSchema>;

export const legalData = defineData({
  schema: legalSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});