// Generated Amplify schema for eSignatureDocuments
// Source: eSignatureDocuments.csv (491 records)

import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const esignaturedocumentsSchema = a.schema({
  eSignatureDocuments: a
    .model({
      ID: a.id().required(),
      signed: a.boolean(),
      templateId: a.id(),
      documentData: a.string(),
      pdfGeneratorUrl: a.url(),
      document: a.string(),
      signedBy: a.string(),
      signature: a.string(),
      initials: a.string(),
      quotePdfUrl: a.url(),
      signedDate: a.datetime(),
      signedDocument: a.string(),
      signedPdfGeneratorUrl: a.url(),
      signedQuotePdfPublicUrl: a.url(),
      homeownerEmail: a.email(),
      createdDate: a.datetime(),
      updatedDate: a.datetime(),
      owner: a.string(),
      addressId: a.id(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type eSignatureDocumentsSchema = ClientSchema<typeof esignaturedocumentsSchema>;

export const esignaturedocumentsData = defineData({
  schema: esignaturedocumentsSchema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});