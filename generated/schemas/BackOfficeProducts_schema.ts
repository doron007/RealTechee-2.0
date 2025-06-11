// Generated Amplify schema for BackOfficeProducts
// Source: BackOfficeProducts.csv (5 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const backofficeProductsSchema = a.schema({
  BackOfficeProducts: a
    .model({
      title: a.string(),
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
      order: a.float(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type BackOfficeProductsSchema = ClientSchema<typeof backofficeProductsSchema>;

export const backofficeProductsData = defineData({
  schema: backofficeProductsSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});