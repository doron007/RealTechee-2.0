// Generated Amplify schema for Contacts
// Source: Contacts.csv (233 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const contactsSchema = a.schema({
  Contacts: a
    .model({
      ID: a.id().required(),
      firstName: a.string(),
      lastName: a.string(),
      fullName: a.string(),
      email: a.email(),
      phone: a.float(),
      mobile: a.float(),
      company: a.string(),
      brokerage: a.string(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type ContactsSchema = ClientSchema<typeof contactsSchema>;

export const contactsData = defineData({
  schema: contactsSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});