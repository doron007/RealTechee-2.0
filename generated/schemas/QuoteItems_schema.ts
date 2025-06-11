// Generated Amplify schema for QuoteItems
// Source: QuoteItems.csv (1745 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const quoteitemsSchema = a.schema({
  QuoteItems: a
    .model({
      ID: a.id().required(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
      projectID: a.id(),
      itemName: a.string(),
      itemCompleted: a.boolean(),
      parentStageId: a.id(),
      order: a.float(),
      isCategory: a.boolean(),
      description: a.string(),
      quantity: a.float(),
      unitPrice: a.string(),
      total: a.string(),
      type: a.string(),
      recommendItem: a.boolean(),
      image: a.string(),
      internal: a.boolean(),
      marginPercent: a.float(),
      cost: a.float(),
      price: a.float(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type QuoteItemsSchema = ClientSchema<typeof quoteitemsSchema>;

export const quoteitemsData = defineData({
  schema: quoteitemsSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});