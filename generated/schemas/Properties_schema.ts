// Generated Amplify schema for Properties
// Source: Properties.csv (210 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const propertiesSchema = a.schema({
  Properties: a
    .model({
      ID: a.id().required(),
      propertyFullAddress: a.string(),
      houseAddress: a.string(),
      city: a.string(),
      state: a.string(),
      zip: a.float(),
      propertyType: a.string(),
      bedrooms: a.float(),
      bathrooms: a.float(),
      floors: a.float(),
      sizeSqft: a.float(),
      yearBuilt: a.float(),
      redfinLink: a.url(),
      zillowLink: a.url(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      Owner: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type PropertiesSchema = ClientSchema<typeof propertiesSchema>;

export const propertiesData = defineData({
  schema: propertiesSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});