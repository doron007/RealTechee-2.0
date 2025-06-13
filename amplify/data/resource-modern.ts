import { a } from '@aws-amplify/data-schema';
import { defineData } from '@aws-amplify/backend';

// Modern Amplify Gen2 data schema with proper authorization
// Example showing improved patterns for your existing models

const Projects = a.model({
  ID: a.id().required(),
  title: a.string(),
  status: a.string(),
  description: a.string(),
  originalValue: a.float(),
  listingPrice: a.float(),
  salePrice: a.float(),
  requestDate: a.datetime(),
  createdDate: a.datetime(),
  updatedDate: a.datetime(),
  owner: a.string(),
  
  // Proper relationships (Gen2 best practice)
  agentContactId: a.id(),
  homeownerContactId: a.id(),
  addressId: a.id(),
  
  // Related models
  agent: a.belongsTo('Contacts', 'agentContactId'),
  homeowner: a.belongsTo('Contacts', 'homeownerContactId'),
  address: a.belongsTo('Properties', 'addressId'),
  quotes: a.hasMany('Quotes', 'projectId'),
  comments: a.hasMany('ProjectComments', 'projectId'),
}).authorization((allow) => [
  // Modern security: authenticated users can read, owners can manage
  allow.authenticated().to(['read']),
  allow.owner(),
  allow.group('admin') // For back-office staff
]);

const Contacts = a.model({
  ID: a.id().required(),
  firstName: a.string(),
  lastName: a.string(),
  fullName: a.string(),
  email: a.email(),
  phone: a.string(),
  mobile: a.string(),
  company: a.string(),
  brokerage: a.string(),
  createdDate: a.datetime(),
  updatedDate: a.datetime(),
  owner: a.string(),
  
  // Relationships
  projects: a.hasMany('Projects', 'agentContactId'),
  homeownerProjects: a.hasMany('Projects', 'homeownerContactId'),
}).authorization((allow) => [
  allow.authenticated().to(['read']),
  allow.owner(),
  allow.group('admin')
]);

const Properties = a.model({
  ID: a.id().required(),
  propertyFullAddress: a.string(),
  city: a.string(),
  state: a.string(),
  zip: a.string(), // Changed from float to string for zip codes like "90210"
  propertyType: a.string(),
  bedrooms: a.integer(), // More appropriate than float
  bathrooms: a.float(),
  sizeSqft: a.integer(),
  yearBuilt: a.integer(),
  redfinLink: a.url(),
  zillowLink: a.url(),
  createdDate: a.datetime(),
  updatedDate: a.datetime(),
  owner: a.string(),
  
  // Relationships
  projects: a.hasMany('Projects', 'addressId'),
}).authorization((allow) => [
  allow.authenticated().to(['read']),
  allow.owner(),
  allow.group('admin')
]);

const Quotes = a.model({
  ID: a.id().required(),
  projectId: a.id(),
  status: a.string(),
  title: a.string(),
  budget: a.float(),
  totalCost: a.float(),
  totalPrice: a.float(),
  signed: a.boolean(),
  createdDate: a.datetime(),
  updatedDate: a.datetime(),
  owner: a.string(),
  
  // Relationships
  project: a.belongsTo('Projects', 'projectId'),
  items: a.hasMany('QuoteItems', 'quoteId'),
}).authorization((allow) => [
  allow.authenticated().to(['read']),
  allow.owner(),
  allow.group('admin')
]);

// Back-office models with admin-only access
const BackOfficeAssignTo = a.model({
  ID: a.id().required(),
  name: a.string(),
  email: a.email(),
  mobile: a.string(),
  sendEmailNotifications: a.boolean(),
  sendSmsNotifications: a.boolean(),
  active: a.boolean(),
  order: a.integer(),
  createdDate: a.datetime(),
  updatedDate: a.datetime(),
  owner: a.string(),
}).authorization((allow) => [
  allow.group('admin'), // Only admin access
  allow.group('backoffice')
]);

const schema = a.schema({
  Projects,
  Contacts,
  Properties,
  Quotes,
  BackOfficeAssignTo,
});

// Modern Gen2 configuration with multiple auth modes
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool', // Modern: use Cognito by default
    apiKeyAuthorizationMode: {
      expiresInDays: 7 // Shorter expiry for security
    }
  }
});

export type Schema = typeof schema;