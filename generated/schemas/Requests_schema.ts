// Generated Amplify schema for Requests
// Source: Requests.csv (203 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const requestsSchema = a.schema({
  Requests: a
    .model({
      createdDate: a.datetime(),
      ID: a.id().required(),
      status: a.string(),
      statusImage: a.string(),
      statusOrder: a.float(),
      accountExecutive: a.float(),
      product: a.string(),
      assignedTo: a.string(),
      assignedDate: a.datetime(),
      message: a.string(),
      relationToProperty: a.string(),
      virtualWalkthrough: a.string(),
      uploadedMedia: a.string(),
      uplodedDocuments: a.string(),
      uploadedVideos: a.string(),
      rtDigitalSelection: a.string(),
      leadSource: a.string(),
      needFinance: a.boolean(),
      leadFromSync: a.string(),
      leadFromVenturaStone: a.string(),
      officeNotes: a.string(),
      archived: a.string(),
      bookingId: a.id(),
      requestedSlot: a.string(),
      requestedVisitDateTime: a.datetime(),
      visitorId: a.id(),
      updatedDate: a.datetime(),
      visitDate: a.datetime(),
      moveToQuotingDate: a.datetime(),
      expiredDate: a.datetime(),
      archivedDate: a.datetime(),
      budget: a.string(),
      owner: a.string(),
      agentContactId: a.id(),
      homeownerContactId: a.id(),
      addressId: a.id(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type RequestsSchema = ClientSchema<typeof requestsSchema>;

export const requestsData = defineData({
  schema: requestsSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});