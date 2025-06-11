// Generated Amplify schema for ContactUs
// Source: ContactUs.csv (18 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const contactusSchema = a.schema({
  ContactUs: a
    .model({
      submissionTime: a.datetime(),
      contactId: a.id(),
      subject: a.string(),
      message: a.string(),
      product: a.string(),
      ID: a.id().required(),
      owner: a.string(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      addressId: a.id(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type ContactUsSchema = ClientSchema<typeof contactusSchema>;

export const contactusData = defineData({
  schema: contactusSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});