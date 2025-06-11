// Generated Amplify schema for Affiliates
// Source: Affiliates.csv (7 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const affiliatesSchema = a.schema({
  Affiliates: a
    .model({
      ID: a.id().required(),
      title: a.string(),
      company: a.string(),
      serviceType: a.string(),
      name: a.string(),
      email: a.email(),
      phone: a.float(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
      workersCompensationInsurance: a.string(),
      license: a.float(),
      environmentalFactor: a.string(),
      oshaCompliance: a.string(),
      signedNda: a.string(),
      safetyPlan: a.string(),
      waterSystem: a.string(),
      numEmployees: a.float(),
      generalGuidelines: a.string(),
      communication: a.string(),
      materialUtilization: a.string(),
      qualityAssurance: a.string(),
      projectRemnantList: a.boolean(),
      warrantyPeriod: a.string(),
      accounting: a.float(),
      qualifierName: a.string(),
      date: a.datetime(),
      qualifierSignature: a.string(),
      slaAll: a.string(),
      slaCompanyEmail: a.email(),
      linkSla2Name: a.url(),
      contactId: a.id(),
      addressId: a.id(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type AffiliatesSchema = ClientSchema<typeof affiliatesSchema>;

export const affiliatesData = defineData({
  schema: affiliatesSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});