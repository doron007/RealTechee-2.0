// Generated Amplify schema for ProjectPaymentTerms
// Source: ProjectPaymentTerms.csv (313 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const projectpaymenttermsSchema = a.schema({
  ProjectPaymentTerms: a
    .model({
      ID: a.id().required(),
      projectID: a.id(),
      type: a.string(),
      paymentName: a.string(),
      paymentAmount: a.float(),
      paymentDue: a.string(),
      description: a.string(),
      order: a.float(),
      paid: a.id(),
      parentPaymentId: a.id(),
      isCategory: a.boolean(),
      internal: a.boolean(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type ProjectPaymentTermsSchema = ClientSchema<typeof projectpaymenttermsSchema>;

export const projectpaymenttermsData = defineData({
  schema: projectpaymenttermsSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});