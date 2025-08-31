import { a } from '@aws-amplify/data-schema';
import { defineData } from '@aws-amplify/backend';

// Consolidated models from 26 migrated tables
// Generated from CSV to DynamoDB migration

const Affiliates = a.model({
  title: a.string(),
  company: a.string(),
  serviceType: a.string(),
  name: a.string(),
  email: a.email(),
  phone: a.string(),
  owner: a.string(),
  workersCompensationInsurance: a.string(),
  license: a.string(),
  environmentalFactor: a.string(),
  oshaCompliance: a.string(),
  signedNda: a.string(),
  safetyPlan: a.string(),
  waterSystem: a.string(),
  numEmployees: a.integer(),
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
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const Auth = a.model({
  owner: a.string(),
  email: a.email(),
  hash: a.boolean(),
  token: a.string(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const BackOfficeAssignTo = a.model({
  owner: a.string(),
  name: a.string(),
  email: a.email(),
  mobile: a.string(),
  sendEmailNotifications: a.boolean(),
  sendSmsNotifications: a.boolean(),
  active: a.boolean(),
  order: a.integer(),
  contactId: a.id(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const BackOfficeBookingStatuses = a.model({
  title: a.string(),
  owner: a.string(),
  order: a.integer(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const BackOfficeBrokerage = a.model({
  title: a.string(),
  owner: a.string(),
  order: a.float(),
  live: a.boolean(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const BackOfficeNotifications = a.model({
  owner: a.string(),
  key: a.string(),
  to: a.string(),
  cc: a.string(),
  bcc: a.string(),
  subject: a.string(),
  body: a.string(),
  bodyAsSimpleText: a.string(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const BackOfficeProducts = a.model({
  title: a.string(),
  owner: a.string(),
  order: a.integer(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const BackOfficeProjectStatuses = a.model({
  title: a.string(),
  owner: a.string(),
  order: a.integer(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const BackOfficeQuoteStatuses = a.model({
  title: a.string(),
  owner: a.string(),
  order: a.integer(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const BackOfficeRequestStatuses = a.model({
  title: a.string(),
  owner: a.string(),
  order: a.integer(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const BackOfficeRoleTypes = a.model({
  title: a.string(),
  owner: a.string(),
  order: a.integer(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const ContactUs = a.model({
  submissionTime: a.datetime(),
  contactId: a.id(),
  subject: a.string(),
  message: a.string(),
  product: a.string(),
  owner: a.string(),
  addressId: a.id(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const Contacts = a.model({
  firstName: a.string(),
  lastName: a.string(),
  fullName: a.string(),
  email: a.email(),
  phone: a.string(),
  mobile: a.string(),
  company: a.string(),
  brokerage: a.string(),
  owner: a.string(),
  
  // Notification preferences - simplified
  emailNotifications: a.boolean().default(true), // Email notifications enabled
  smsNotifications: a.boolean().default(false),  // SMS notifications enabled
  
  // Role Management System
  roleType: a.string(), // 'AE', 'PM', 'Admin', 'Customer', etc.
  isActive: a.boolean().default(true), // Whether contact is active for assignments
  assignmentPriority: a.integer().default(1), // Priority for automatic assignment (1=highest)
  canReceiveNotifications: a.boolean().default(true), // Master notification toggle
  
  // Reverse relationships - see all projects for this contact
  agentProjects: a.hasMany('Projects', 'agentContactId'),
  homeownerProjects: a.hasMany('Projects', 'homeownerContactId'),
  homeowner2Projects: a.hasMany('Projects', 'homeowner2ContactId'),
  homeowner3Projects: a.hasMany('Projects', 'homeowner3ContactId'),
  agentQuotes: a.hasMany('Quotes', 'agentContactId'),
  homeownerQuotes: a.hasMany('Quotes', 'homeownerContactId'),
  
  // Reverse relationships for Requests - matching Projects pattern
  agentRequests: a.hasMany('Requests', 'agentContactId'),
  homeownerRequests: a.hasMany('Requests', 'homeownerContactId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

// Generic Audit Log for all DynamoDB table changes
const AuditLog = a.model({
  // Table and record identification
  tableName: a.string().required(), // 'Contacts', 'Properties', 'Projects', etc.
  recordId: a.id().required(), // ID of the record that was changed
  
  // Action performed
  action: a.enum(['created', 'updated', 'deleted']),
  
  // Change context
  changeType: a.string(), // 'form_submission', 'admin_update', 'bulk_import', etc.
  
  // Data snapshots (JSON strings for complete flexibility)
  previousData: a.json(), // Full object before change (null for creates)
  newData: a.json(), // Full object after change (null for deletes)
  
  // Change metadata  
  changedFields: a.json(), // Array of field names that changed
  source: a.string(), // 'get_estimate_form', 'admin_panel', 'api_endpoint', etc.
  
  // Request context
  userAgent: a.string(),
  ipAddress: a.string(),
  sessionId: a.string(),
  
  // User context (when available)
  userId: a.string(), // Cognito user ID if authenticated
  userEmail: a.email(), // User email if available
  userRole: a.string(), // 'admin', 'agent', 'member', 'public'
  
  // Timestamps
  timestamp: a.datetime().required(),
  owner: a.string(),
  
  // TTL for automatic cleanup (configurable, default 30 days)
  ttl: a.integer()
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.groups(['admin', 'agent'])
]);

// Keep ContactAuditLog for backward compatibility during transition
const ContactAuditLog = a.model({
  contactId: a.id().required(), // ID of the contact that was changed
  email: a.email().required(), // Email for easy reference
  action: a.enum(['created', 'updated']),
  changeType: a.string(), // 'contact_update', 'form_submission', etc.
  
  // Previous values (JSON string for flexibility)
  previousData: a.json(),
  
  // New values (JSON string)
  newData: a.json(),
  
  // Metadata
  source: a.string(), // 'get_estimate_form', 'admin_panel', etc.
  userAgent: a.string(),
  ipAddress: a.string(),
  
  // Timestamps
  timestamp: a.datetime().required(),
  owner: a.string(),
  
  // TTL for automatic cleanup (30 days = 2592000 seconds)
  ttl: a.integer(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const Legal = a.model({
  title: a.string(),
  owner: a.string(),
  content: a.string(),
  legalDocumentId: a.id(),
  documentId: a.id(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const MemberSignature = a.model({
  memberEmail: a.email(),
  signature: a.string(),
  initials: a.string(),
  ip: a.string(),
  fullName: a.string(),
  initialsPublicUrl: a.url(),
  initialsWixUrl: a.url(),
  signaturePublicUrl: a.url(),
  signatureWixUrl: a.url(),
  owner: a.string(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const PendingAppoitments = a.model({
  assignedTo: a.string(),
  status: a.string(),
  serviceName: a.string(),
  name: a.string(),
  email: a.email(),
  phone: a.string(),
  agentName: a.string(),
  agentEmail: a.email(),
  agentPhone: a.string(),
  requestAddress: a.string(),
  brokerage: a.string(),
  visitorId: a.id(),
  requestedSlot: a.string(),
  preferredLocation: a.string(),
  requestId: a.id(),
  assignedDate: a.datetime(),
  owner: a.string(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const ProjectComments = a.model({
  postedByContactId: a.id(),
  nickname: a.string(),
  projectId: a.id(),
  files: a.string(),
  comment: a.string(),
  isPrivate: a.boolean(),
  postedByProfileImage: a.string(),
  addToGallery: a.string(),
  owner: a.string(),
  createdDate: a.datetime(),
  updatedDate: a.datetime(),
  
  // Relationships
  project: a.belongsTo('Projects', 'projectId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.owner(),
  allow.groups(['admin', 'agent'])
]);

const ProjectMilestones = a.model({
  owner: a.string(),
  name: a.string(),
  description: a.string(),
  projectId: a.id(),
  order: a.float(),
  isComplete: a.boolean(),
  estimatedStart: a.string(),
  estimatedFinish: a.datetime(),
  isCategory: a.boolean(),
  isInternal: a.boolean(),
  createdDate: a.datetime(),
  updatedDate: a.datetime(),
  
  // Relationships
  project: a.belongsTo('Projects', 'projectId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const ProjectPaymentTerms = a.model({
  projectId: a.id(),
  type: a.string(),
  paymentName: a.string(),
  paymentAmount: a.float(),
  paymentDue: a.string(),
  description: a.string(),
  order: a.float(),
  paid: a.boolean(),
  parentPaymentId: a.id(),
  isCategory: a.boolean(),
  internal: a.boolean(),
  owner: a.string(),
  createdDate: a.datetime(),
  updatedDate: a.datetime(),
  
  // Relationships
  project: a.belongsTo('Projects', 'projectId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const ProjectPermissions = a.model({
  projectId: a.id(),
  owner: a.string(),
  na: a.string(),
  permissions: a.boolean(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const Projects = a.model({
  title: a.string(),
  status: a.string(),
  statusImage: a.string(),
  statusOrder: a.float(),
  propertyType: a.string(),
  description: a.string(),
  image: a.string(),
  gallery: a.string(),
  bedrooms: a.float(),
  bathrooms: a.float(),
  floors: a.integer(),
  sizeSqft: a.float(),
  yearBuilt: a.integer(),
  redfinLink: a.url(),
  zillowLink: a.url(),
  originalValue: a.float(),
  listingPrice: a.float(),
  salePrice: a.float(),
  boostPrice: a.float(),
  boosterEstimatedCost: a.float(),
  boosterActualCost: a.float(),
  paidByEscrow: a.string(),
  addedValue: a.float(),
  grossProfit: a.string(),
  estimatedGrossProfit: a.string(),
  paidCost: a.string(),
  daysOnMarket: a.string(),
  revShareAmount: a.float(),
  loanBalance: a.string(),
  carryCost: a.string(),
  openEscrowWithinDays: a.float(),
  carryDays: a.string(),
  boosterActualPrice: a.string(),
  budget: a.string(),
  requestDate: a.datetime(),
  visitReviewDate: a.datetime(),
  proposalDate: a.datetime(),
  contractDate: a.datetime(),
  escrowDate: a.datetime(),
  estimatedClosingDate: a.datetime(),
  closingDate: a.datetime(),
  revSharePayDate: a.datetime(),
  underwritingDate: a.datetime(),
  escrowPaymentDate: a.datetime(),
  boosterCompletionDate: a.datetime(),
  invoiceDate: a.datetime(),
  escrowCompanyName: a.string(),
  escrowContactInfo: a.string(),
  excludeFromDashboard: a.boolean(),
  invoiceNumber: a.string(),
  brokerage: a.string(),
  selectedProducts: a.string(),
  signedContracts: a.string(),
  linkProjects1Title2: a.url(),
  estimate: a.string(),
  priceQuoteInfo: a.string(),
  quoteUrl: a.url(),
  documents: a.string(),
  permissionPublic: a.boolean(),
  permissionPrivateRoles: a.boolean(),
  permissionPrivateUsers: a.boolean(),
  projectManagerEmailList: a.email(),
  projectManagerPhone: a.string(),
  visitorId: a.id(),
  quoteId: a.id(),
  requestId: a.id(),
  assignedTo: a.string(),
  assignedDate: a.datetime(),
  officeNotes: a.string(),
  quoteSentDate: a.datetime(),
  quoteOpenedDate: a.datetime(),
  quoteSignedDate: a.datetime(),
  contractingStartDate: a.datetime(),
  contractSentDate: a.datetime(),
  archivedDate: a.datetime(),
  estimatedWeeksDuration: a.string(),
  accountExecutive: a.float(),
  link04ProjectsTitle: a.url(),
  projectAdminProjectId: a.id(),
  owner: a.string(),
  contractUrl: a.url(),
  archived: a.string(),
  item04Projects: a.string(),
  agentContactId: a.id(),
  homeownerContactId: a.id(),
  homeowner2ContactId: a.id(),
  homeowner3ContactId: a.id(),
  addressId: a.id(),
  createdDate: a.datetime(),
  updatedDate: a.datetime(),
  
  // Relationships - This is the Gen2 superpower!
  agent: a.belongsTo('Contacts', 'agentContactId'),
  homeowner: a.belongsTo('Contacts', 'homeownerContactId'),
  homeowner2: a.belongsTo('Contacts', 'homeowner2ContactId'),
  homeowner3: a.belongsTo('Contacts', 'homeowner3ContactId'),
  address: a.belongsTo('Properties', 'addressId'),
  quotes: a.hasMany('Quotes', 'projectId'),
  comments: a.hasMany('ProjectComments', 'projectId'),
  milestones: a.hasMany('ProjectMilestones', 'projectId'),
  paymentTerms: a.hasMany('ProjectPaymentTerms', 'projectId'),
  quoteItems: a.hasMany('QuoteItems', 'projectId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const Properties = a.model({
  propertyFullAddress: a.string(),
  houseAddress: a.string(),
  city: a.string(),
  state: a.string(),
  zip: a.string(),
  propertyType: a.string(),
  bedrooms: a.float(),
  bathrooms: a.float(),
  floors: a.integer(),
  sizeSqft: a.float(),
  yearBuilt: a.integer(),
  redfinLink: a.url(),
  zillowLink: a.url(),
  owner: a.string(),
  
  // Reverse relationships - see all projects for this property
  projects: a.hasMany('Projects', 'addressId'),
  requests: a.hasMany('Requests', 'addressId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const QuoteItems = a.model({
  owner: a.string(),
  projectId: a.id(),
  itemName: a.string(),
  itemCompleted: a.boolean(),
  parentStageId: a.id(),
  order: a.integer(),
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
  
  // Relationships
  project: a.belongsTo('Projects', 'projectId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const Quotes = a.model({
  requestId: a.id(),
  projectId: a.id(),
  status: a.string(),
  statusImage: a.string(),
  statusOrder: a.float(),
  assignedTo: a.string(),
  assignedDate: a.datetime(),
  quoteNumber: a.integer(),
  title: a.string(),
  visitorId: a.id(),
  pdfGeneratorUrl: a.url(),
  document: a.string(),
  documents: a.string(),
  images: a.string(),
  budget: a.float(),
  totalCost: a.float(),
  totalPrice: a.float(),
  product: a.string(),
  operationManagerApproved: a.boolean(),
  underwritingApproved: a.boolean(),
  signed: a.boolean(),
  signee1Name: a.string(),
  signature: a.string(),
  projectedListingPrice: a.float(),
  loanBalance: a.float(),
  creditScore: a.float(),
  eSignatureDocumentId: a.id(),
  quotePdfUrl: a.url(),
  viewedBy: a.string(),
  associatedProject: a.string(),
  changeOrder: a.string(),
  requestDate: a.datetime(),
  visitDate: a.datetime(),
  operationManagerApprovedDate: a.datetime(),
  sentDate: a.datetime(),
  openedDate: a.datetime(),
  signedDate: a.datetime(),
  underwritingApprovedDate: a.datetime(),
  contractingStartDate: a.datetime(),
  contractSentDate: a.datetime(),
  contractSignedDate: a.datetime(),
  convertedDate: a.datetime(),
  expiredDate: a.datetime(),
  archivedDate: a.datetime(),
  rejectedDate: a.datetime(),
  brokerage: a.string(),
  officeNotes: a.string(),
  reasonForArchive: a.string(),
  estimatedWeeksDuration: a.string(),
  accountExecutive: a.float(),
  bedrooms: a.string(),
  yearBuilt: a.string(),
  floors: a.string(),
  bathrooms: a.string(),
  sizeSqft: a.string(),
  totalPaymentsByClient: a.string(),
  totalPaymentsToGc: a.string(),
  quoteESignatureId: a.id(),
  owner: a.string(),
  agentContactId: a.id(),
  homeownerContactId: a.id(),
  homeowner2ContactId: a.id(),
  homeowner3ContactId: a.id(),
  addressId: a.id(),
  
  // Relationships
  project: a.belongsTo('Projects', 'projectId'),
  agent: a.belongsTo('Contacts', 'agentContactId'),
  homeowner: a.belongsTo('Contacts', 'homeownerContactId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const Requests = a.model({
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
  visitDate: a.datetime(),
  moveToQuotingDate: a.datetime(),
  expiredDate: a.datetime(),
  archivedDate: a.datetime(),
  budget: a.string(),
  owner: a.string(),
  agentContactId: a.id(),
  homeownerContactId: a.id(),
  addressId: a.id(),
  
  // Enhanced Case Management Fields
  priority: a.enum(['low', 'medium', 'high', 'urgent']),
  source: a.string(), // 'form_submission', 'phone_call', 'email', 'referral'
  tags: a.json(), // Array of tags for categorization
  estimatedValue: a.float(), // Potential project value
  followUpDate: a.datetime(), // Next scheduled follow-up
  lastContactDate: a.datetime(), // Last time client was contacted
  clientResponseDate: a.datetime(), // Last client response
  informationGatheringStatus: a.enum(['pending', 'in_progress', 'completed']),
  scopeDefinitionStatus: a.enum(['not_started', 'in_progress', 'completed']),
  readinessScore: a.integer().default(0), // 0-100 score for quote readiness
  missingInformation: a.json(), // Array of missing information items
  
  // Relationships - Match Projects pattern exactly!
  agent: a.belongsTo('Contacts', 'agentContactId'),
  homeowner: a.belongsTo('Contacts', 'homeownerContactId'),
  address: a.belongsTo('Properties', 'addressId'),
  
  // Case management relationships
  notes: a.hasMany('RequestNotes', 'requestId'),
  assignments: a.hasMany('RequestAssignments', 'requestId'),
  statusHistory: a.hasMany('RequestStatusHistory', 'requestId'),
  informationItems: a.hasMany('RequestInformationItems', 'requestId'),
  scopeItems: a.hasMany('RequestScopeItems', 'requestId'),
  workflowStates: a.hasMany('RequestWorkflowStates', 'requestId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const eSignatureDocuments = a.model({
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
  owner: a.string(),
  addressId: a.id(),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

// Signal-Driven Notification System Models

// Signal Events Store - All emitted signals
const SignalEvents = a.model({
  signalType: a.string().required(), // 'form_contact_us_submission'
  payload: a.json().required(),      // Form data or event data
  emittedAt: a.datetime().required(),
  emittedBy: a.string(),            // User or system identifier
  source: a.string(),               // 'contact_form', 'admin_action', etc.
  processed: a.boolean(),
  
  // Relationships
  triggeredNotifications: a.hasMany('NotificationQueue', 'signalEventId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

// Signal-to-Notification Mapping Configuration
const SignalNotificationHooks = a.model({
  signalType: a.string().required(),
  notificationTemplateId: a.id().required(),
  channel: a.string(), // 'email' or 'sms'
  enabled: a.boolean(),
  priority: a.string(), // 'low', 'medium', 'high'
  
  // Recipient Configuration
  recipientEmails: a.json(),
  recipientRoles: a.json(),
  recipientDynamic: a.json(),
  
  // Advanced Configuration
  conditions: a.json(),
  deliveryDelay: a.integer(),
  maxRetries: a.integer(),
  
  // Audit fields
  createdBy: a.string(),
  lastModifiedBy: a.string(),
  
  // Legacy support (deprecated)
  channels: a.json(),
  
  // Relationships
  template: a.belongsTo('NotificationTemplate', 'notificationTemplateId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

// Notification System Models
const NotificationTemplate = a.model({
  // Form identification
  name: a.string().required(),
  formType: a.string(), // 'contact-us', 'get-estimate', 'get-qualified', 'affiliate'
  
  // Email content (HTML + subject)
  emailSubject: a.string().required(),
  emailContentHtml: a.string().required(),
  
  // SMS content (plain text)
  smsContent: a.string().required(),
  
  // Template metadata
  variables: a.json(),
  previewData: a.json(),
  isActive: a.boolean(),
  version: a.string(),
  
  // Audit fields
  createdBy: a.string(),
  lastModifiedBy: a.string(),
  owner: a.string(),
  
  // Legacy support (deprecated)
  subject: a.string(),
  contentHtml: a.string(),
  contentText: a.string(),
  channel: a.enum(['EMAIL', 'SMS', 'TELEGRAM', 'WHATSAPP']),
  
  // Reverse relationships
  notifications: a.hasMany('NotificationQueue', 'templateId'),
  signalHooks: a.hasMany('SignalNotificationHooks', 'notificationTemplateId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

const NotificationQueue = a.model({
  eventType: a.string().required(),
  
  // Signal-driven architecture support
  signalEventId: a.id(),                               // Reference to originating signal
  
  // Legacy template-based approach (for backward compatibility)
  payload: a.json(), // Dynamic data for template injection
  templateId: a.id(),
  
  // New direct content approach (decoupled from templates)
  directContent: a.json(), // Pre-generated email/SMS content
  
  // Multi-channel consolidated approach (replaces legacy channels field)
  channels: a.json().required(), // { email: {...}, sms: {...}, push: {...} }
  
  recipientIds: a.json().required(), // Array of Contact IDs
  scheduledAt: a.datetime(),
  status: a.enum(['PENDING', 'SENT', 'FAILED', 'RETRYING']),
  priority: a.enum(['LOW', 'MEDIUM', 'HIGH']),
  retryCount: a.integer(),
  errorMessage: a.string(),
  sentAt: a.datetime(),
  owner: a.string(),
  
  // Audit timestamps
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  
  // Relationships (optional for backward compatibility)
  template: a.belongsTo('NotificationTemplate', 'templateId'),
  signalEvent: a.belongsTo('SignalEvents', 'signalEventId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated()
]);

// App Preferences and Settings
const AppPreferences = a.model({
  // Core settings
  id: a.id(),
  category: a.string().required(), // e.g., 'notifications', 'general', 'security'
  key: a.string().required(), // e.g., 'debug_mode', 'default_timezone'
  value: a.string().required(), // JSON string for complex values
  dataType: a.enum(['string', 'number', 'boolean', 'json', 'encrypted']),
  
  // Metadata
  description: a.string(),
  isSystemSetting: a.boolean().default(false),
  isEncrypted: a.boolean().default(false),
  environment: a.enum(['dev', 'staging', 'prod', 'all']),
  
  // Validation
  validationRules: a.string(), // JSON string with validation rules
  defaultValue: a.string(),
  
  // Audit
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  createdBy: a.string(),
  updatedBy: a.string(),
  owner: a.string(),
  
  // Composite key for category + key uniqueness
  categoryKey: a.string().required() // Will be set to `${category}:${key}`
}).authorization((allow) => [
  allow.publicApiKey().to(['read']),
  allow.authenticated().to(['read']),
  allow.groups(['admin']).to(['create', 'read', 'update', 'delete']),
  allow.groups(['super_admin']).to(['create', 'read', 'update', 'delete'])
]);

// Secure Configuration (for sensitive data)
const SecureConfig = a.model({
  id: a.id(),
  key: a.string().required(), // e.g., 'sendgrid_api_key'
  service: a.string().required(), // e.g., 'sendgrid', 'twilio'
  environment: a.enum(['dev', 'staging', 'prod']),
  
  // Metadata only - actual values stored in Parameter Store
  parameterPath: a.string().required(), // AWS SSM Parameter Store path
  description: a.string(),
  isActive: a.boolean().default(true),
  
  // Audit
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  createdBy: a.string(),
  updatedBy: a.string(),
  owner: a.string()
}).authorization((allow) => [
  allow.groups(['admin']).to(['read']),
  allow.groups(['super_admin']).to(['create', 'read', 'update', 'delete'])
]);

// Notification Events for comprehensive logging
const NotificationEvents = a.model({
  eventId: a.string().required(),
  notificationId: a.string().required(),
  eventType: a.enum(['NOTIFICATION_QUEUED', 'NOTIFICATION_PROCESSING', 'EMAIL_ATTEMPT', 'SMS_ATTEMPT', 'EMAIL_SUCCESS', 'SMS_SUCCESS', 'EMAIL_FAILED', 'SMS_FAILED', 'NOTIFICATION_COMPLETED', 'NOTIFICATION_FAILED', 'EMAIL_BOUNCE', 'EMAIL_COMPLAINT']),
  channel: a.enum(['EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM']),
  recipient: a.string(),
  provider: a.enum(['SES', 'SENDGRID', 'TWILIO', 'DEBUG']),
  providerId: a.string(), // SES message ID, SendGrid message ID or Twilio SID
  providerStatus: a.string(), // Provider-specific status
  errorCode: a.string(),
  errorMessage: a.string(),
  metadata: a.json(), // Additional provider-specific data
  timestamp: a.datetime().required(),
  processingTimeMs: a.integer(),
  owner: a.string(),
  
  // TTL for automatic cleanup (configurable, default 90 days)
  ttl: a.integer()
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.groups(['admin', 'agent'])
]);

// Email Suppression List for AWS SES compliance
const EmailSuppressionList = a.model({
  emailAddress: a.email().required(),
  suppressionType: a.enum(['BOUNCE', 'COMPLAINT', 'MANUAL']),
  reason: a.string(),
  bounceType: a.enum(['PERMANENT', 'TRANSIENT']), // For bounces
  bounceSubType: a.string(), // Detailed bounce reason
  complaintType: a.string(), // For complaints
  originalMessageId: a.string(), // SES message ID
  suppressedAt: a.datetime().required(),
  source: a.enum(['SES_NOTIFICATION', 'MANUAL_ADMIN', 'USER_REQUEST']),
  metadata: a.json(), // Additional data from SES notifications
  isActive: a.boolean().default(true),
  owner: a.string(),
  
  // Audit fields
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  createdBy: a.string(),
  updatedBy: a.string()
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.groups(['admin'])
]);

// SES Reputation Monitoring
const SESReputationMetrics = a.model({
  metricDate: a.date().required(),
  totalEmailsSent: a.integer().default(0),
  totalBounces: a.integer().default(0),
  totalComplaints: a.integer().default(0),
  bounceRate: a.float().default(0), // Percentage
  complaintRate: a.float().default(0), // Percentage
  deliveryRate: a.float().default(0), // Percentage
  reputationScore: a.float(), // Custom reputation score
  sendingQuotaUsed: a.integer().default(0),
  sendingQuotaMax: a.integer().default(0),
  sendRateMax: a.float().default(0), // Messages per second
  
  // Alert thresholds
  bounceRateAlert: a.boolean().default(false), // Triggered if > 5%
  complaintRateAlert: a.boolean().default(false), // Triggered if > 0.1%
  
  // Metadata
  owner: a.string(),
  createdAt: a.datetime(),
  updatedAt: a.datetime()
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.groups(['admin'])
]);

// Case Management Models
const RequestNotes = a.model({
  requestId: a.id().required(),
  content: a.string().required(),
  type: a.enum(['internal', 'client_communication', 'technical', 'follow_up']),
  category: a.string(), // 'status_update', 'meeting_notes', 'client_call', etc.
  isPrivate: a.boolean().default(true), // Internal notes vs client-visible
  authorId: a.string(), // Cognito user ID
  authorName: a.string(),
  authorRole: a.string(), // 'AE', 'PM', 'Admin'
  attachments: a.json(), // Array of file references
  relatedToStatusChange: a.boolean().default(false),
  priority: a.enum(['normal', 'important', 'urgent']),
  tags: a.json(), // Array of tags
  
  // Client communication tracking
  communicationMethod: a.enum(['phone', 'email', 'text', 'in_person', 'other']),
  clientResponse: a.enum(['pending', 'responded', 'no_response']),
  followUpRequired: a.boolean().default(false),
  followUpDate: a.datetime(),
  
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  
  // Relationships
  request: a.belongsTo('Requests', 'requestId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.groups(['admin', 'agent', 'project_manager'])
]);

const RequestAssignments = a.model({
  requestId: a.id().required(),
  assignedToId: a.string().required(), // Contact ID or user ID
  assignedToName: a.string().required(),
  assignedToRole: a.string().required(), // 'AE', 'PM', 'Admin'
  assignmentType: a.enum(['primary', 'secondary', 'observer']),
  assignedById: a.string().required(), // Who made the assignment
  assignedByName: a.string().required(),
  assignmentReason: a.string(),
  status: a.enum(['active', 'completed', 'transferred', 'cancelled']),
  priority: a.enum(['normal', 'high', 'urgent']),
  dueDate: a.datetime(),
  completedAt: a.datetime(),
  transferredAt: a.datetime(),
  transferredToId: a.string(),
  transferredToName: a.string(),
  transferReason: a.string(),
  
  // Workload tracking
  estimatedHours: a.float(),
  actualHours: a.float(),
  
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  
  // Relationships
  request: a.belongsTo('Requests', 'requestId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.groups(['admin', 'agent'])
]);

const RequestStatusHistory = a.model({
  requestId: a.id().required(),
  previousStatus: a.string(),
  newStatus: a.string().required(),
  statusReason: a.string(),
  triggeredBy: a.enum(['user', 'system', 'automation']),
  triggeredById: a.string(), // User ID if triggered by user
  triggeredByName: a.string(),
  automationRule: a.string(), // If triggered by automation
  
  // Business context
  businessImpact: a.enum(['none', 'low', 'medium', 'high']),
  clientNotified: a.boolean().default(false),
  internalNotification: a.boolean().default(true),
  
  // Duration tracking
  timeInPreviousStatus: a.integer(), // Minutes spent in previous status
  expectedDuration: a.integer(), // Expected minutes for current status
  
  metadata: a.json(), // Additional context data
  
  timestamp: a.datetime(),
  
  // Relationships
  request: a.belongsTo('Requests', 'requestId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.groups(['admin', 'agent'])
]);

const RequestInformationItems = a.model({
  requestId: a.id().required(),
  category: a.enum(['property', 'client', 'project', 'financial', 'technical']),
  itemName: a.string().required(),
  description: a.string(),
  status: a.enum(['missing', 'requested', 'received', 'verified']),
  importance: a.enum(['required', 'important', 'optional']),
  requestedDate: a.datetime(),
  receivedDate: a.datetime(),
  verifiedDate: a.datetime(),
  requestedBy: a.string(),
  source: a.enum(['client', 'agent', 'inspection', 'documents']),
  
  // Content
  value: a.string(), // The actual information when received
  attachments: a.json(), // Related files/documents
  notes: a.string(),
  
  // Follow-up
  followUpRequired: a.boolean().default(false),
  followUpDate: a.datetime(),
  remindersSent: a.integer().default(0),
  
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  
  // Relationships
  request: a.belongsTo('Requests', 'requestId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.groups(['admin', 'agent', 'project_manager'])
]);

const RequestScopeItems = a.model({
  requestId: a.id().required(),
  category: a.enum(['room', 'area', 'system', 'material', 'service']),
  name: a.string().required(),
  description: a.string(),
  
  // Hierarchy
  parentItemId: a.id(), // For nested scope items
  orderIndex: a.integer().default(0),
  isCategory: a.boolean().default(false),
  
  // Scope definition
  specifications: a.json(), // Detailed specs as structured data
  materials: a.json(), // Material requirements
  laborRequirements: a.json(), // Labor specifications
  timeline: a.string(), // Time estimates
  
  // Estimates
  estimatedCost: a.float(),
  estimatedHours: a.float(),
  complexity: a.enum(['simple', 'moderate', 'complex', 'very_complex']),
  
  // Status
  status: a.enum(['draft', 'defined', 'approved', 'quoted']),
  approvedBy: a.string(),
  approvedDate: a.datetime(),
  
  // Client interaction
  clientApproval: a.enum(['pending', 'approved', 'rejected', 'modified']),
  clientNotes: a.string(),
  
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  createdBy: a.string(),
  updatedBy: a.string(),
  
  // Relationships
  request: a.belongsTo('Requests', 'requestId'),
  parentItem: a.belongsTo('RequestScopeItems', 'parentItemId'),
  childItems: a.hasMany('RequestScopeItems', 'parentItemId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.groups(['admin', 'agent', 'project_manager'])
]);

const RequestWorkflowStates = a.model({
  requestId: a.id().required(),
  workflowName: a.string().required(), // 'information_gathering', 'scope_definition'
  currentState: a.string().required(),
  availableActions: a.json(), // Array of possible next actions
  stateData: a.json(), // Workflow-specific data
  
  // Progress tracking
  progress: a.integer().default(0), // 0-100%
  totalSteps: a.integer(),
  completedSteps: a.integer(),
  
  // Timing
  startedAt: a.datetime(),
  expectedCompletionDate: a.datetime(),
  actualCompletionDate: a.datetime(),
  
  // Automation
  automationEnabled: a.boolean().default(true),
  nextAutomationCheck: a.datetime(),
  
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  
  // Relationships
  request: a.belongsTo('Requests', 'requestId'),
}).authorization((allow) => [
  allow.publicApiKey(),
  allow.authenticated(),
  allow.groups(['admin', 'agent'])
]);

const schema = a.schema({
  Affiliates,
  Auth,
  BackOfficeAssignTo,
  BackOfficeBookingStatuses,
  BackOfficeBrokerage,
  BackOfficeNotifications,
  BackOfficeProducts,
  BackOfficeProjectStatuses,
  BackOfficeQuoteStatuses,
  BackOfficeRequestStatuses,
  BackOfficeRoleTypes,
  ContactUs,
  Contacts,
  AuditLog,
  ContactAuditLog,
  Legal,
  MemberSignature,
  SignalEvents,
  SignalNotificationHooks,
  NotificationTemplate,
  NotificationQueue,
  NotificationEvents,
  EmailSuppressionList,
  SESReputationMetrics,
  PendingAppoitments,
  ProjectComments,
  ProjectMilestones,
  ProjectPaymentTerms,
  ProjectPermissions,
  Projects,
  Properties,
  QuoteItems,
  Quotes,
  Requests,
  RequestNotes,
  RequestAssignments,
  RequestStatusHistory,
  RequestInformationItems,
  RequestScopeItems,
  RequestWorkflowStates,
  eSignatureDocuments,
  AppPreferences,
  SecureConfig
});

// Export the data configuration
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30
    }
  }
});

// Export the schema type for use in other files
export type Schema = typeof schema;
