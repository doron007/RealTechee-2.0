/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createAffiliates = /* GraphQL */ `mutation CreateAffiliates(
  $condition: ModelAffiliatesConditionInput
  $input: CreateAffiliatesInput!
) {
  createAffiliates(condition: $condition, input: $input) {
    accounting
    addressId
    communication
    company
    contactId
    createdAt
    date
    email
    environmentalFactor
    generalGuidelines
    id
    license
    linkSla2Name
    materialUtilization
    name
    numEmployees
    oshaCompliance
    owner
    phone
    projectRemnantList
    qualifierName
    qualifierSignature
    qualityAssurance
    safetyPlan
    serviceType
    signedNda
    slaAll
    slaCompanyEmail
    title
    updatedAt
    warrantyPeriod
    waterSystem
    workersCompensationInsurance
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateAffiliatesMutationVariables,
  APITypes.CreateAffiliatesMutation
>;
export const createAppPreferences = /* GraphQL */ `mutation CreateAppPreferences(
  $condition: ModelAppPreferencesConditionInput
  $input: CreateAppPreferencesInput!
) {
  createAppPreferences(condition: $condition, input: $input) {
    category
    categoryKey
    createdAt
    createdBy
    dataType
    defaultValue
    description
    environment
    id
    isEncrypted
    isSystemSetting
    key
    owner
    updatedAt
    updatedBy
    validationRules
    value
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateAppPreferencesMutationVariables,
  APITypes.CreateAppPreferencesMutation
>;
export const createAuditLog = /* GraphQL */ `mutation CreateAuditLog(
  $condition: ModelAuditLogConditionInput
  $input: CreateAuditLogInput!
) {
  createAuditLog(condition: $condition, input: $input) {
    action
    changeType
    changedFields
    createdAt
    id
    ipAddress
    newData
    owner
    previousData
    recordId
    sessionId
    source
    tableName
    timestamp
    ttl
    updatedAt
    userAgent
    userEmail
    userId
    userRole
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateAuditLogMutationVariables,
  APITypes.CreateAuditLogMutation
>;
export const createAuth = /* GraphQL */ `mutation CreateAuth(
  $condition: ModelAuthConditionInput
  $input: CreateAuthInput!
) {
  createAuth(condition: $condition, input: $input) {
    createdAt
    email
    hash
    id
    owner
    token
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateAuthMutationVariables,
  APITypes.CreateAuthMutation
>;
export const createBackOfficeAssignTo = /* GraphQL */ `mutation CreateBackOfficeAssignTo(
  $condition: ModelBackOfficeAssignToConditionInput
  $input: CreateBackOfficeAssignToInput!
) {
  createBackOfficeAssignTo(condition: $condition, input: $input) {
    active
    contactId
    createdAt
    email
    id
    mobile
    name
    order
    owner
    sendEmailNotifications
    sendSmsNotifications
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateBackOfficeAssignToMutationVariables,
  APITypes.CreateBackOfficeAssignToMutation
>;
export const createBackOfficeBookingStatuses = /* GraphQL */ `mutation CreateBackOfficeBookingStatuses(
  $condition: ModelBackOfficeBookingStatusesConditionInput
  $input: CreateBackOfficeBookingStatusesInput!
) {
  createBackOfficeBookingStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateBackOfficeBookingStatusesMutationVariables,
  APITypes.CreateBackOfficeBookingStatusesMutation
>;
export const createBackOfficeBrokerage = /* GraphQL */ `mutation CreateBackOfficeBrokerage(
  $condition: ModelBackOfficeBrokerageConditionInput
  $input: CreateBackOfficeBrokerageInput!
) {
  createBackOfficeBrokerage(condition: $condition, input: $input) {
    createdAt
    id
    live
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateBackOfficeBrokerageMutationVariables,
  APITypes.CreateBackOfficeBrokerageMutation
>;
export const createBackOfficeNotifications = /* GraphQL */ `mutation CreateBackOfficeNotifications(
  $condition: ModelBackOfficeNotificationsConditionInput
  $input: CreateBackOfficeNotificationsInput!
) {
  createBackOfficeNotifications(condition: $condition, input: $input) {
    bcc
    body
    bodyAsSimpleText
    cc
    createdAt
    id
    key
    owner
    subject
    to
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateBackOfficeNotificationsMutationVariables,
  APITypes.CreateBackOfficeNotificationsMutation
>;
export const createBackOfficeProducts = /* GraphQL */ `mutation CreateBackOfficeProducts(
  $condition: ModelBackOfficeProductsConditionInput
  $input: CreateBackOfficeProductsInput!
) {
  createBackOfficeProducts(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateBackOfficeProductsMutationVariables,
  APITypes.CreateBackOfficeProductsMutation
>;
export const createBackOfficeProjectStatuses = /* GraphQL */ `mutation CreateBackOfficeProjectStatuses(
  $condition: ModelBackOfficeProjectStatusesConditionInput
  $input: CreateBackOfficeProjectStatusesInput!
) {
  createBackOfficeProjectStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateBackOfficeProjectStatusesMutationVariables,
  APITypes.CreateBackOfficeProjectStatusesMutation
>;
export const createBackOfficeQuoteStatuses = /* GraphQL */ `mutation CreateBackOfficeQuoteStatuses(
  $condition: ModelBackOfficeQuoteStatusesConditionInput
  $input: CreateBackOfficeQuoteStatusesInput!
) {
  createBackOfficeQuoteStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateBackOfficeQuoteStatusesMutationVariables,
  APITypes.CreateBackOfficeQuoteStatusesMutation
>;
export const createBackOfficeRequestStatuses = /* GraphQL */ `mutation CreateBackOfficeRequestStatuses(
  $condition: ModelBackOfficeRequestStatusesConditionInput
  $input: CreateBackOfficeRequestStatusesInput!
) {
  createBackOfficeRequestStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateBackOfficeRequestStatusesMutationVariables,
  APITypes.CreateBackOfficeRequestStatusesMutation
>;
export const createBackOfficeRoleTypes = /* GraphQL */ `mutation CreateBackOfficeRoleTypes(
  $condition: ModelBackOfficeRoleTypesConditionInput
  $input: CreateBackOfficeRoleTypesInput!
) {
  createBackOfficeRoleTypes(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateBackOfficeRoleTypesMutationVariables,
  APITypes.CreateBackOfficeRoleTypesMutation
>;
export const createContactAuditLog = /* GraphQL */ `mutation CreateContactAuditLog(
  $condition: ModelContactAuditLogConditionInput
  $input: CreateContactAuditLogInput!
) {
  createContactAuditLog(condition: $condition, input: $input) {
    action
    changeType
    contactId
    createdAt
    email
    id
    ipAddress
    newData
    owner
    previousData
    source
    timestamp
    ttl
    updatedAt
    userAgent
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateContactAuditLogMutationVariables,
  APITypes.CreateContactAuditLogMutation
>;
export const createContactUs = /* GraphQL */ `mutation CreateContactUs(
  $condition: ModelContactUsConditionInput
  $input: CreateContactUsInput!
) {
  createContactUs(condition: $condition, input: $input) {
    addressId
    contactId
    createdAt
    id
    message
    owner
    product
    subject
    submissionTime
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateContactUsMutationVariables,
  APITypes.CreateContactUsMutation
>;
export const createContacts = /* GraphQL */ `mutation CreateContacts(
  $condition: ModelContactsConditionInput
  $input: CreateContactsInput!
) {
  createContacts(condition: $condition, input: $input) {
    agentProjects {
      nextToken
      __typename
    }
    agentQuotes {
      nextToken
      __typename
    }
    assignmentPriority
    brokerage
    canReceiveNotifications
    company
    createdAt
    email
    emailNotifications
    firstName
    fullName
    homeowner2Projects {
      nextToken
      __typename
    }
    homeowner3Projects {
      nextToken
      __typename
    }
    homeownerProjects {
      nextToken
      __typename
    }
    homeownerQuotes {
      nextToken
      __typename
    }
    id
    isActive
    lastName
    mobile
    owner
    phone
    roleType
    smsNotifications
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateContactsMutationVariables,
  APITypes.CreateContactsMutation
>;
export const createESignatureDocuments = /* GraphQL */ `mutation CreateESignatureDocuments(
  $condition: ModelESignatureDocumentsConditionInput
  $input: CreateESignatureDocumentsInput!
) {
  createESignatureDocuments(condition: $condition, input: $input) {
    addressId
    createdAt
    document
    documentData
    homeownerEmail
    id
    initials
    owner
    pdfGeneratorUrl
    quotePdfUrl
    signature
    signed
    signedBy
    signedDate
    signedDocument
    signedPdfGeneratorUrl
    signedQuotePdfPublicUrl
    templateId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateESignatureDocumentsMutationVariables,
  APITypes.CreateESignatureDocumentsMutation
>;
export const createEmailSuppressionList = /* GraphQL */ `mutation CreateEmailSuppressionList(
  $condition: ModelEmailSuppressionListConditionInput
  $input: CreateEmailSuppressionListInput!
) {
  createEmailSuppressionList(condition: $condition, input: $input) {
    bounceSubType
    bounceType
    complaintType
    createdAt
    createdBy
    emailAddress
    id
    isActive
    metadata
    originalMessageId
    owner
    reason
    source
    suppressedAt
    suppressionType
    updatedAt
    updatedBy
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateEmailSuppressionListMutationVariables,
  APITypes.CreateEmailSuppressionListMutation
>;
export const createLegal = /* GraphQL */ `mutation CreateLegal(
  $condition: ModelLegalConditionInput
  $input: CreateLegalInput!
) {
  createLegal(condition: $condition, input: $input) {
    content
    createdAt
    documentId
    id
    legalDocumentId
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateLegalMutationVariables,
  APITypes.CreateLegalMutation
>;
export const createMemberSignature = /* GraphQL */ `mutation CreateMemberSignature(
  $condition: ModelMemberSignatureConditionInput
  $input: CreateMemberSignatureInput!
) {
  createMemberSignature(condition: $condition, input: $input) {
    createdAt
    fullName
    id
    initials
    initialsPublicUrl
    initialsWixUrl
    ip
    memberEmail
    owner
    signature
    signaturePublicUrl
    signatureWixUrl
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateMemberSignatureMutationVariables,
  APITypes.CreateMemberSignatureMutation
>;
export const createNotificationEvents = /* GraphQL */ `mutation CreateNotificationEvents(
  $condition: ModelNotificationEventsConditionInput
  $input: CreateNotificationEventsInput!
) {
  createNotificationEvents(condition: $condition, input: $input) {
    channel
    createdAt
    errorCode
    errorMessage
    eventId
    eventType
    id
    metadata
    notificationId
    owner
    processingTimeMs
    provider
    providerId
    providerStatus
    recipient
    timestamp
    ttl
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateNotificationEventsMutationVariables,
  APITypes.CreateNotificationEventsMutation
>;
export const createNotificationQueue = /* GraphQL */ `mutation CreateNotificationQueue(
  $condition: ModelNotificationQueueConditionInput
  $input: CreateNotificationQueueInput!
) {
  createNotificationQueue(condition: $condition, input: $input) {
    channels
    createdAt
    directContent
    errorMessage
    eventType
    id
    owner
    payload
    priority
    recipientIds
    retryCount
    scheduledAt
    sentAt
    signalEvent {
      createdAt
      emittedAt
      emittedBy
      id
      payload
      processed
      signalType
      source
      updatedAt
      __typename
    }
    signalEventId
    status
    template {
      channel
      contentHtml
      contentText
      createdAt
      id
      isActive
      name
      owner
      subject
      updatedAt
      variables
      __typename
    }
    templateId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateNotificationQueueMutationVariables,
  APITypes.CreateNotificationQueueMutation
>;
export const createNotificationTemplate = /* GraphQL */ `mutation CreateNotificationTemplate(
  $condition: ModelNotificationTemplateConditionInput
  $input: CreateNotificationTemplateInput!
) {
  createNotificationTemplate(condition: $condition, input: $input) {
    channel
    contentHtml
    contentText
    createdAt
    id
    isActive
    name
    notifications {
      nextToken
      __typename
    }
    owner
    signalHooks {
      nextToken
      __typename
    }
    subject
    updatedAt
    variables
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateNotificationTemplateMutationVariables,
  APITypes.CreateNotificationTemplateMutation
>;
export const createPendingAppoitments = /* GraphQL */ `mutation CreatePendingAppoitments(
  $condition: ModelPendingAppoitmentsConditionInput
  $input: CreatePendingAppoitmentsInput!
) {
  createPendingAppoitments(condition: $condition, input: $input) {
    agentEmail
    agentName
    agentPhone
    assignedDate
    assignedTo
    brokerage
    createdAt
    email
    id
    name
    owner
    phone
    preferredLocation
    requestAddress
    requestId
    requestedSlot
    serviceName
    status
    updatedAt
    visitorId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreatePendingAppoitmentsMutationVariables,
  APITypes.CreatePendingAppoitmentsMutation
>;
export const createProjectComments = /* GraphQL */ `mutation CreateProjectComments(
  $condition: ModelProjectCommentsConditionInput
  $input: CreateProjectCommentsInput!
) {
  createProjectComments(condition: $condition, input: $input) {
    addToGallery
    comment
    createdAt
    createdDate
    files
    id
    isPrivate
    nickname
    owner
    postedByContactId
    postedByProfileImage
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateProjectCommentsMutationVariables,
  APITypes.CreateProjectCommentsMutation
>;
export const createProjectMilestones = /* GraphQL */ `mutation CreateProjectMilestones(
  $condition: ModelProjectMilestonesConditionInput
  $input: CreateProjectMilestonesInput!
) {
  createProjectMilestones(condition: $condition, input: $input) {
    createdAt
    createdDate
    description
    estimatedFinish
    estimatedStart
    id
    isCategory
    isComplete
    isInternal
    name
    order
    owner
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateProjectMilestonesMutationVariables,
  APITypes.CreateProjectMilestonesMutation
>;
export const createProjectPaymentTerms = /* GraphQL */ `mutation CreateProjectPaymentTerms(
  $condition: ModelProjectPaymentTermsConditionInput
  $input: CreateProjectPaymentTermsInput!
) {
  createProjectPaymentTerms(condition: $condition, input: $input) {
    createdAt
    createdDate
    description
    id
    internal
    isCategory
    order
    owner
    paid
    parentPaymentId
    paymentAmount
    paymentDue
    paymentName
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    type
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateProjectPaymentTermsMutationVariables,
  APITypes.CreateProjectPaymentTermsMutation
>;
export const createProjectPermissions = /* GraphQL */ `mutation CreateProjectPermissions(
  $condition: ModelProjectPermissionsConditionInput
  $input: CreateProjectPermissionsInput!
) {
  createProjectPermissions(condition: $condition, input: $input) {
    createdAt
    id
    na
    owner
    permissions
    projectId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateProjectPermissionsMutationVariables,
  APITypes.CreateProjectPermissionsMutation
>;
export const createProjects = /* GraphQL */ `mutation CreateProjects(
  $condition: ModelProjectsConditionInput
  $input: CreateProjectsInput!
) {
  createProjects(condition: $condition, input: $input) {
    accountExecutive
    addedValue
    address {
      bathrooms
      bedrooms
      city
      createdAt
      floors
      houseAddress
      id
      owner
      propertyFullAddress
      propertyType
      redfinLink
      sizeSqft
      state
      updatedAt
      yearBuilt
      zillowLink
      zip
      __typename
    }
    addressId
    agent {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    agentContactId
    archived
    archivedDate
    assignedDate
    assignedTo
    bathrooms
    bedrooms
    boostPrice
    boosterActualCost
    boosterActualPrice
    boosterCompletionDate
    boosterEstimatedCost
    brokerage
    budget
    carryCost
    carryDays
    closingDate
    comments {
      nextToken
      __typename
    }
    contractDate
    contractSentDate
    contractUrl
    contractingStartDate
    createdAt
    createdDate
    daysOnMarket
    description
    documents
    escrowCompanyName
    escrowContactInfo
    escrowDate
    escrowPaymentDate
    estimate
    estimatedClosingDate
    estimatedGrossProfit
    estimatedWeeksDuration
    excludeFromDashboard
    floors
    gallery
    grossProfit
    homeowner {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner2 {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner2ContactId
    homeowner3 {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner3ContactId
    homeownerContactId
    id
    image
    invoiceDate
    invoiceNumber
    item04Projects
    link04ProjectsTitle
    linkProjects1Title2
    listingPrice
    loanBalance
    milestones {
      nextToken
      __typename
    }
    officeNotes
    openEscrowWithinDays
    originalValue
    owner
    paidByEscrow
    paidCost
    paymentTerms {
      nextToken
      __typename
    }
    permissionPrivateRoles
    permissionPrivateUsers
    permissionPublic
    priceQuoteInfo
    projectAdminProjectId
    projectManagerEmailList
    projectManagerPhone
    propertyType
    proposalDate
    quoteId
    quoteItems {
      nextToken
      __typename
    }
    quoteOpenedDate
    quoteSentDate
    quoteSignedDate
    quoteUrl
    quotes {
      nextToken
      __typename
    }
    redfinLink
    requestDate
    requestId
    revShareAmount
    revSharePayDate
    salePrice
    selectedProducts
    signedContracts
    sizeSqft
    status
    statusImage
    statusOrder
    title
    underwritingDate
    updatedAt
    updatedDate
    visitReviewDate
    visitorId
    yearBuilt
    zillowLink
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateProjectsMutationVariables,
  APITypes.CreateProjectsMutation
>;
export const createProperties = /* GraphQL */ `mutation CreateProperties(
  $condition: ModelPropertiesConditionInput
  $input: CreatePropertiesInput!
) {
  createProperties(condition: $condition, input: $input) {
    bathrooms
    bedrooms
    city
    createdAt
    floors
    houseAddress
    id
    owner
    projects {
      nextToken
      __typename
    }
    propertyFullAddress
    propertyType
    redfinLink
    sizeSqft
    state
    updatedAt
    yearBuilt
    zillowLink
    zip
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreatePropertiesMutationVariables,
  APITypes.CreatePropertiesMutation
>;
export const createQuoteItems = /* GraphQL */ `mutation CreateQuoteItems(
  $condition: ModelQuoteItemsConditionInput
  $input: CreateQuoteItemsInput!
) {
  createQuoteItems(condition: $condition, input: $input) {
    cost
    createdAt
    description
    id
    image
    internal
    isCategory
    itemCompleted
    itemName
    marginPercent
    order
    owner
    parentStageId
    price
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    quantity
    recommendItem
    total
    type
    unitPrice
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateQuoteItemsMutationVariables,
  APITypes.CreateQuoteItemsMutation
>;
export const createQuotes = /* GraphQL */ `mutation CreateQuotes(
  $condition: ModelQuotesConditionInput
  $input: CreateQuotesInput!
) {
  createQuotes(condition: $condition, input: $input) {
    accountExecutive
    addressId
    agent {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    agentContactId
    archivedDate
    assignedDate
    assignedTo
    associatedProject
    bathrooms
    bedrooms
    brokerage
    budget
    changeOrder
    contractSentDate
    contractSignedDate
    contractingStartDate
    convertedDate
    createdAt
    creditScore
    document
    documents
    eSignatureDocumentId
    estimatedWeeksDuration
    expiredDate
    floors
    homeowner {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner2ContactId
    homeowner3ContactId
    homeownerContactId
    id
    images
    loanBalance
    officeNotes
    openedDate
    operationManagerApproved
    operationManagerApprovedDate
    owner
    pdfGeneratorUrl
    product
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    projectedListingPrice
    quoteESignatureId
    quoteNumber
    quotePdfUrl
    reasonForArchive
    rejectedDate
    requestDate
    requestId
    sentDate
    signature
    signed
    signedDate
    signee1Name
    sizeSqft
    status
    statusImage
    statusOrder
    title
    totalCost
    totalPaymentsByClient
    totalPaymentsToGc
    totalPrice
    underwritingApproved
    underwritingApprovedDate
    updatedAt
    viewedBy
    visitDate
    visitorId
    yearBuilt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateQuotesMutationVariables,
  APITypes.CreateQuotesMutation
>;
export const createRequests = /* GraphQL */ `mutation CreateRequests(
  $condition: ModelRequestsConditionInput
  $input: CreateRequestsInput!
) {
  createRequests(condition: $condition, input: $input) {
    accountExecutive
    addressId
    agentContactId
    archived
    archivedDate
    assignedDate
    assignedTo
    bookingId
    budget
    createdAt
    expiredDate
    homeownerContactId
    id
    leadFromSync
    leadFromVenturaStone
    leadSource
    message
    moveToQuotingDate
    needFinance
    officeNotes
    owner
    product
    relationToProperty
    requestedSlot
    requestedVisitDateTime
    rtDigitalSelection
    status
    statusImage
    statusOrder
    updatedAt
    uploadedMedia
    uploadedVideos
    uplodedDocuments
    virtualWalkthrough
    visitDate
    visitorId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateRequestsMutationVariables,
  APITypes.CreateRequestsMutation
>;
export const createSESReputationMetrics = /* GraphQL */ `mutation CreateSESReputationMetrics(
  $condition: ModelSESReputationMetricsConditionInput
  $input: CreateSESReputationMetricsInput!
) {
  createSESReputationMetrics(condition: $condition, input: $input) {
    bounceRate
    bounceRateAlert
    complaintRate
    complaintRateAlert
    createdAt
    deliveryRate
    id
    metricDate
    owner
    reputationScore
    sendRateMax
    sendingQuotaMax
    sendingQuotaUsed
    totalBounces
    totalComplaints
    totalEmailsSent
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateSESReputationMetricsMutationVariables,
  APITypes.CreateSESReputationMetricsMutation
>;
export const createSecureConfig = /* GraphQL */ `mutation CreateSecureConfig(
  $condition: ModelSecureConfigConditionInput
  $input: CreateSecureConfigInput!
) {
  createSecureConfig(condition: $condition, input: $input) {
    createdAt
    createdBy
    description
    environment
    id
    isActive
    key
    owner
    parameterPath
    service
    updatedAt
    updatedBy
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateSecureConfigMutationVariables,
  APITypes.CreateSecureConfigMutation
>;
export const createSignalEvents = /* GraphQL */ `mutation CreateSignalEvents(
  $condition: ModelSignalEventsConditionInput
  $input: CreateSignalEventsInput!
) {
  createSignalEvents(condition: $condition, input: $input) {
    createdAt
    emittedAt
    emittedBy
    id
    payload
    processed
    signalType
    source
    triggeredNotifications {
      nextToken
      __typename
    }
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateSignalEventsMutationVariables,
  APITypes.CreateSignalEventsMutation
>;
export const createSignalNotificationHooks = /* GraphQL */ `mutation CreateSignalNotificationHooks(
  $condition: ModelSignalNotificationHooksConditionInput
  $input: CreateSignalNotificationHooksInput!
) {
  createSignalNotificationHooks(condition: $condition, input: $input) {
    channels
    conditions
    createdAt
    enabled
    id
    notificationTemplateId
    priority
    recipientDynamic
    recipientEmails
    recipientRoles
    signalType
    template {
      channel
      contentHtml
      contentText
      createdAt
      id
      isActive
      name
      owner
      subject
      updatedAt
      variables
      __typename
    }
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateSignalNotificationHooksMutationVariables,
  APITypes.CreateSignalNotificationHooksMutation
>;
export const deleteAffiliates = /* GraphQL */ `mutation DeleteAffiliates(
  $condition: ModelAffiliatesConditionInput
  $input: DeleteAffiliatesInput!
) {
  deleteAffiliates(condition: $condition, input: $input) {
    accounting
    addressId
    communication
    company
    contactId
    createdAt
    date
    email
    environmentalFactor
    generalGuidelines
    id
    license
    linkSla2Name
    materialUtilization
    name
    numEmployees
    oshaCompliance
    owner
    phone
    projectRemnantList
    qualifierName
    qualifierSignature
    qualityAssurance
    safetyPlan
    serviceType
    signedNda
    slaAll
    slaCompanyEmail
    title
    updatedAt
    warrantyPeriod
    waterSystem
    workersCompensationInsurance
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteAffiliatesMutationVariables,
  APITypes.DeleteAffiliatesMutation
>;
export const deleteAppPreferences = /* GraphQL */ `mutation DeleteAppPreferences(
  $condition: ModelAppPreferencesConditionInput
  $input: DeleteAppPreferencesInput!
) {
  deleteAppPreferences(condition: $condition, input: $input) {
    category
    categoryKey
    createdAt
    createdBy
    dataType
    defaultValue
    description
    environment
    id
    isEncrypted
    isSystemSetting
    key
    owner
    updatedAt
    updatedBy
    validationRules
    value
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteAppPreferencesMutationVariables,
  APITypes.DeleteAppPreferencesMutation
>;
export const deleteAuditLog = /* GraphQL */ `mutation DeleteAuditLog(
  $condition: ModelAuditLogConditionInput
  $input: DeleteAuditLogInput!
) {
  deleteAuditLog(condition: $condition, input: $input) {
    action
    changeType
    changedFields
    createdAt
    id
    ipAddress
    newData
    owner
    previousData
    recordId
    sessionId
    source
    tableName
    timestamp
    ttl
    updatedAt
    userAgent
    userEmail
    userId
    userRole
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteAuditLogMutationVariables,
  APITypes.DeleteAuditLogMutation
>;
export const deleteAuth = /* GraphQL */ `mutation DeleteAuth(
  $condition: ModelAuthConditionInput
  $input: DeleteAuthInput!
) {
  deleteAuth(condition: $condition, input: $input) {
    createdAt
    email
    hash
    id
    owner
    token
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteAuthMutationVariables,
  APITypes.DeleteAuthMutation
>;
export const deleteBackOfficeAssignTo = /* GraphQL */ `mutation DeleteBackOfficeAssignTo(
  $condition: ModelBackOfficeAssignToConditionInput
  $input: DeleteBackOfficeAssignToInput!
) {
  deleteBackOfficeAssignTo(condition: $condition, input: $input) {
    active
    contactId
    createdAt
    email
    id
    mobile
    name
    order
    owner
    sendEmailNotifications
    sendSmsNotifications
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteBackOfficeAssignToMutationVariables,
  APITypes.DeleteBackOfficeAssignToMutation
>;
export const deleteBackOfficeBookingStatuses = /* GraphQL */ `mutation DeleteBackOfficeBookingStatuses(
  $condition: ModelBackOfficeBookingStatusesConditionInput
  $input: DeleteBackOfficeBookingStatusesInput!
) {
  deleteBackOfficeBookingStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteBackOfficeBookingStatusesMutationVariables,
  APITypes.DeleteBackOfficeBookingStatusesMutation
>;
export const deleteBackOfficeBrokerage = /* GraphQL */ `mutation DeleteBackOfficeBrokerage(
  $condition: ModelBackOfficeBrokerageConditionInput
  $input: DeleteBackOfficeBrokerageInput!
) {
  deleteBackOfficeBrokerage(condition: $condition, input: $input) {
    createdAt
    id
    live
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteBackOfficeBrokerageMutationVariables,
  APITypes.DeleteBackOfficeBrokerageMutation
>;
export const deleteBackOfficeNotifications = /* GraphQL */ `mutation DeleteBackOfficeNotifications(
  $condition: ModelBackOfficeNotificationsConditionInput
  $input: DeleteBackOfficeNotificationsInput!
) {
  deleteBackOfficeNotifications(condition: $condition, input: $input) {
    bcc
    body
    bodyAsSimpleText
    cc
    createdAt
    id
    key
    owner
    subject
    to
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteBackOfficeNotificationsMutationVariables,
  APITypes.DeleteBackOfficeNotificationsMutation
>;
export const deleteBackOfficeProducts = /* GraphQL */ `mutation DeleteBackOfficeProducts(
  $condition: ModelBackOfficeProductsConditionInput
  $input: DeleteBackOfficeProductsInput!
) {
  deleteBackOfficeProducts(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteBackOfficeProductsMutationVariables,
  APITypes.DeleteBackOfficeProductsMutation
>;
export const deleteBackOfficeProjectStatuses = /* GraphQL */ `mutation DeleteBackOfficeProjectStatuses(
  $condition: ModelBackOfficeProjectStatusesConditionInput
  $input: DeleteBackOfficeProjectStatusesInput!
) {
  deleteBackOfficeProjectStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteBackOfficeProjectStatusesMutationVariables,
  APITypes.DeleteBackOfficeProjectStatusesMutation
>;
export const deleteBackOfficeQuoteStatuses = /* GraphQL */ `mutation DeleteBackOfficeQuoteStatuses(
  $condition: ModelBackOfficeQuoteStatusesConditionInput
  $input: DeleteBackOfficeQuoteStatusesInput!
) {
  deleteBackOfficeQuoteStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteBackOfficeQuoteStatusesMutationVariables,
  APITypes.DeleteBackOfficeQuoteStatusesMutation
>;
export const deleteBackOfficeRequestStatuses = /* GraphQL */ `mutation DeleteBackOfficeRequestStatuses(
  $condition: ModelBackOfficeRequestStatusesConditionInput
  $input: DeleteBackOfficeRequestStatusesInput!
) {
  deleteBackOfficeRequestStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteBackOfficeRequestStatusesMutationVariables,
  APITypes.DeleteBackOfficeRequestStatusesMutation
>;
export const deleteBackOfficeRoleTypes = /* GraphQL */ `mutation DeleteBackOfficeRoleTypes(
  $condition: ModelBackOfficeRoleTypesConditionInput
  $input: DeleteBackOfficeRoleTypesInput!
) {
  deleteBackOfficeRoleTypes(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteBackOfficeRoleTypesMutationVariables,
  APITypes.DeleteBackOfficeRoleTypesMutation
>;
export const deleteContactAuditLog = /* GraphQL */ `mutation DeleteContactAuditLog(
  $condition: ModelContactAuditLogConditionInput
  $input: DeleteContactAuditLogInput!
) {
  deleteContactAuditLog(condition: $condition, input: $input) {
    action
    changeType
    contactId
    createdAt
    email
    id
    ipAddress
    newData
    owner
    previousData
    source
    timestamp
    ttl
    updatedAt
    userAgent
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteContactAuditLogMutationVariables,
  APITypes.DeleteContactAuditLogMutation
>;
export const deleteContactUs = /* GraphQL */ `mutation DeleteContactUs(
  $condition: ModelContactUsConditionInput
  $input: DeleteContactUsInput!
) {
  deleteContactUs(condition: $condition, input: $input) {
    addressId
    contactId
    createdAt
    id
    message
    owner
    product
    subject
    submissionTime
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteContactUsMutationVariables,
  APITypes.DeleteContactUsMutation
>;
export const deleteContacts = /* GraphQL */ `mutation DeleteContacts(
  $condition: ModelContactsConditionInput
  $input: DeleteContactsInput!
) {
  deleteContacts(condition: $condition, input: $input) {
    agentProjects {
      nextToken
      __typename
    }
    agentQuotes {
      nextToken
      __typename
    }
    assignmentPriority
    brokerage
    canReceiveNotifications
    company
    createdAt
    email
    emailNotifications
    firstName
    fullName
    homeowner2Projects {
      nextToken
      __typename
    }
    homeowner3Projects {
      nextToken
      __typename
    }
    homeownerProjects {
      nextToken
      __typename
    }
    homeownerQuotes {
      nextToken
      __typename
    }
    id
    isActive
    lastName
    mobile
    owner
    phone
    roleType
    smsNotifications
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteContactsMutationVariables,
  APITypes.DeleteContactsMutation
>;
export const deleteESignatureDocuments = /* GraphQL */ `mutation DeleteESignatureDocuments(
  $condition: ModelESignatureDocumentsConditionInput
  $input: DeleteESignatureDocumentsInput!
) {
  deleteESignatureDocuments(condition: $condition, input: $input) {
    addressId
    createdAt
    document
    documentData
    homeownerEmail
    id
    initials
    owner
    pdfGeneratorUrl
    quotePdfUrl
    signature
    signed
    signedBy
    signedDate
    signedDocument
    signedPdfGeneratorUrl
    signedQuotePdfPublicUrl
    templateId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteESignatureDocumentsMutationVariables,
  APITypes.DeleteESignatureDocumentsMutation
>;
export const deleteEmailSuppressionList = /* GraphQL */ `mutation DeleteEmailSuppressionList(
  $condition: ModelEmailSuppressionListConditionInput
  $input: DeleteEmailSuppressionListInput!
) {
  deleteEmailSuppressionList(condition: $condition, input: $input) {
    bounceSubType
    bounceType
    complaintType
    createdAt
    createdBy
    emailAddress
    id
    isActive
    metadata
    originalMessageId
    owner
    reason
    source
    suppressedAt
    suppressionType
    updatedAt
    updatedBy
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteEmailSuppressionListMutationVariables,
  APITypes.DeleteEmailSuppressionListMutation
>;
export const deleteLegal = /* GraphQL */ `mutation DeleteLegal(
  $condition: ModelLegalConditionInput
  $input: DeleteLegalInput!
) {
  deleteLegal(condition: $condition, input: $input) {
    content
    createdAt
    documentId
    id
    legalDocumentId
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteLegalMutationVariables,
  APITypes.DeleteLegalMutation
>;
export const deleteMemberSignature = /* GraphQL */ `mutation DeleteMemberSignature(
  $condition: ModelMemberSignatureConditionInput
  $input: DeleteMemberSignatureInput!
) {
  deleteMemberSignature(condition: $condition, input: $input) {
    createdAt
    fullName
    id
    initials
    initialsPublicUrl
    initialsWixUrl
    ip
    memberEmail
    owner
    signature
    signaturePublicUrl
    signatureWixUrl
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteMemberSignatureMutationVariables,
  APITypes.DeleteMemberSignatureMutation
>;
export const deleteNotificationEvents = /* GraphQL */ `mutation DeleteNotificationEvents(
  $condition: ModelNotificationEventsConditionInput
  $input: DeleteNotificationEventsInput!
) {
  deleteNotificationEvents(condition: $condition, input: $input) {
    channel
    createdAt
    errorCode
    errorMessage
    eventId
    eventType
    id
    metadata
    notificationId
    owner
    processingTimeMs
    provider
    providerId
    providerStatus
    recipient
    timestamp
    ttl
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteNotificationEventsMutationVariables,
  APITypes.DeleteNotificationEventsMutation
>;
export const deleteNotificationQueue = /* GraphQL */ `mutation DeleteNotificationQueue(
  $condition: ModelNotificationQueueConditionInput
  $input: DeleteNotificationQueueInput!
) {
  deleteNotificationQueue(condition: $condition, input: $input) {
    channels
    createdAt
    directContent
    errorMessage
    eventType
    id
    owner
    payload
    priority
    recipientIds
    retryCount
    scheduledAt
    sentAt
    signalEvent {
      createdAt
      emittedAt
      emittedBy
      id
      payload
      processed
      signalType
      source
      updatedAt
      __typename
    }
    signalEventId
    status
    template {
      channel
      contentHtml
      contentText
      createdAt
      id
      isActive
      name
      owner
      subject
      updatedAt
      variables
      __typename
    }
    templateId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteNotificationQueueMutationVariables,
  APITypes.DeleteNotificationQueueMutation
>;
export const deleteNotificationTemplate = /* GraphQL */ `mutation DeleteNotificationTemplate(
  $condition: ModelNotificationTemplateConditionInput
  $input: DeleteNotificationTemplateInput!
) {
  deleteNotificationTemplate(condition: $condition, input: $input) {
    channel
    contentHtml
    contentText
    createdAt
    id
    isActive
    name
    notifications {
      nextToken
      __typename
    }
    owner
    signalHooks {
      nextToken
      __typename
    }
    subject
    updatedAt
    variables
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteNotificationTemplateMutationVariables,
  APITypes.DeleteNotificationTemplateMutation
>;
export const deletePendingAppoitments = /* GraphQL */ `mutation DeletePendingAppoitments(
  $condition: ModelPendingAppoitmentsConditionInput
  $input: DeletePendingAppoitmentsInput!
) {
  deletePendingAppoitments(condition: $condition, input: $input) {
    agentEmail
    agentName
    agentPhone
    assignedDate
    assignedTo
    brokerage
    createdAt
    email
    id
    name
    owner
    phone
    preferredLocation
    requestAddress
    requestId
    requestedSlot
    serviceName
    status
    updatedAt
    visitorId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeletePendingAppoitmentsMutationVariables,
  APITypes.DeletePendingAppoitmentsMutation
>;
export const deleteProjectComments = /* GraphQL */ `mutation DeleteProjectComments(
  $condition: ModelProjectCommentsConditionInput
  $input: DeleteProjectCommentsInput!
) {
  deleteProjectComments(condition: $condition, input: $input) {
    addToGallery
    comment
    createdAt
    createdDate
    files
    id
    isPrivate
    nickname
    owner
    postedByContactId
    postedByProfileImage
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteProjectCommentsMutationVariables,
  APITypes.DeleteProjectCommentsMutation
>;
export const deleteProjectMilestones = /* GraphQL */ `mutation DeleteProjectMilestones(
  $condition: ModelProjectMilestonesConditionInput
  $input: DeleteProjectMilestonesInput!
) {
  deleteProjectMilestones(condition: $condition, input: $input) {
    createdAt
    createdDate
    description
    estimatedFinish
    estimatedStart
    id
    isCategory
    isComplete
    isInternal
    name
    order
    owner
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteProjectMilestonesMutationVariables,
  APITypes.DeleteProjectMilestonesMutation
>;
export const deleteProjectPaymentTerms = /* GraphQL */ `mutation DeleteProjectPaymentTerms(
  $condition: ModelProjectPaymentTermsConditionInput
  $input: DeleteProjectPaymentTermsInput!
) {
  deleteProjectPaymentTerms(condition: $condition, input: $input) {
    createdAt
    createdDate
    description
    id
    internal
    isCategory
    order
    owner
    paid
    parentPaymentId
    paymentAmount
    paymentDue
    paymentName
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    type
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteProjectPaymentTermsMutationVariables,
  APITypes.DeleteProjectPaymentTermsMutation
>;
export const deleteProjectPermissions = /* GraphQL */ `mutation DeleteProjectPermissions(
  $condition: ModelProjectPermissionsConditionInput
  $input: DeleteProjectPermissionsInput!
) {
  deleteProjectPermissions(condition: $condition, input: $input) {
    createdAt
    id
    na
    owner
    permissions
    projectId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteProjectPermissionsMutationVariables,
  APITypes.DeleteProjectPermissionsMutation
>;
export const deleteProjects = /* GraphQL */ `mutation DeleteProjects(
  $condition: ModelProjectsConditionInput
  $input: DeleteProjectsInput!
) {
  deleteProjects(condition: $condition, input: $input) {
    accountExecutive
    addedValue
    address {
      bathrooms
      bedrooms
      city
      createdAt
      floors
      houseAddress
      id
      owner
      propertyFullAddress
      propertyType
      redfinLink
      sizeSqft
      state
      updatedAt
      yearBuilt
      zillowLink
      zip
      __typename
    }
    addressId
    agent {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    agentContactId
    archived
    archivedDate
    assignedDate
    assignedTo
    bathrooms
    bedrooms
    boostPrice
    boosterActualCost
    boosterActualPrice
    boosterCompletionDate
    boosterEstimatedCost
    brokerage
    budget
    carryCost
    carryDays
    closingDate
    comments {
      nextToken
      __typename
    }
    contractDate
    contractSentDate
    contractUrl
    contractingStartDate
    createdAt
    createdDate
    daysOnMarket
    description
    documents
    escrowCompanyName
    escrowContactInfo
    escrowDate
    escrowPaymentDate
    estimate
    estimatedClosingDate
    estimatedGrossProfit
    estimatedWeeksDuration
    excludeFromDashboard
    floors
    gallery
    grossProfit
    homeowner {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner2 {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner2ContactId
    homeowner3 {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner3ContactId
    homeownerContactId
    id
    image
    invoiceDate
    invoiceNumber
    item04Projects
    link04ProjectsTitle
    linkProjects1Title2
    listingPrice
    loanBalance
    milestones {
      nextToken
      __typename
    }
    officeNotes
    openEscrowWithinDays
    originalValue
    owner
    paidByEscrow
    paidCost
    paymentTerms {
      nextToken
      __typename
    }
    permissionPrivateRoles
    permissionPrivateUsers
    permissionPublic
    priceQuoteInfo
    projectAdminProjectId
    projectManagerEmailList
    projectManagerPhone
    propertyType
    proposalDate
    quoteId
    quoteItems {
      nextToken
      __typename
    }
    quoteOpenedDate
    quoteSentDate
    quoteSignedDate
    quoteUrl
    quotes {
      nextToken
      __typename
    }
    redfinLink
    requestDate
    requestId
    revShareAmount
    revSharePayDate
    salePrice
    selectedProducts
    signedContracts
    sizeSqft
    status
    statusImage
    statusOrder
    title
    underwritingDate
    updatedAt
    updatedDate
    visitReviewDate
    visitorId
    yearBuilt
    zillowLink
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteProjectsMutationVariables,
  APITypes.DeleteProjectsMutation
>;
export const deleteProperties = /* GraphQL */ `mutation DeleteProperties(
  $condition: ModelPropertiesConditionInput
  $input: DeletePropertiesInput!
) {
  deleteProperties(condition: $condition, input: $input) {
    bathrooms
    bedrooms
    city
    createdAt
    floors
    houseAddress
    id
    owner
    projects {
      nextToken
      __typename
    }
    propertyFullAddress
    propertyType
    redfinLink
    sizeSqft
    state
    updatedAt
    yearBuilt
    zillowLink
    zip
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeletePropertiesMutationVariables,
  APITypes.DeletePropertiesMutation
>;
export const deleteQuoteItems = /* GraphQL */ `mutation DeleteQuoteItems(
  $condition: ModelQuoteItemsConditionInput
  $input: DeleteQuoteItemsInput!
) {
  deleteQuoteItems(condition: $condition, input: $input) {
    cost
    createdAt
    description
    id
    image
    internal
    isCategory
    itemCompleted
    itemName
    marginPercent
    order
    owner
    parentStageId
    price
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    quantity
    recommendItem
    total
    type
    unitPrice
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteQuoteItemsMutationVariables,
  APITypes.DeleteQuoteItemsMutation
>;
export const deleteQuotes = /* GraphQL */ `mutation DeleteQuotes(
  $condition: ModelQuotesConditionInput
  $input: DeleteQuotesInput!
) {
  deleteQuotes(condition: $condition, input: $input) {
    accountExecutive
    addressId
    agent {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    agentContactId
    archivedDate
    assignedDate
    assignedTo
    associatedProject
    bathrooms
    bedrooms
    brokerage
    budget
    changeOrder
    contractSentDate
    contractSignedDate
    contractingStartDate
    convertedDate
    createdAt
    creditScore
    document
    documents
    eSignatureDocumentId
    estimatedWeeksDuration
    expiredDate
    floors
    homeowner {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner2ContactId
    homeowner3ContactId
    homeownerContactId
    id
    images
    loanBalance
    officeNotes
    openedDate
    operationManagerApproved
    operationManagerApprovedDate
    owner
    pdfGeneratorUrl
    product
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    projectedListingPrice
    quoteESignatureId
    quoteNumber
    quotePdfUrl
    reasonForArchive
    rejectedDate
    requestDate
    requestId
    sentDate
    signature
    signed
    signedDate
    signee1Name
    sizeSqft
    status
    statusImage
    statusOrder
    title
    totalCost
    totalPaymentsByClient
    totalPaymentsToGc
    totalPrice
    underwritingApproved
    underwritingApprovedDate
    updatedAt
    viewedBy
    visitDate
    visitorId
    yearBuilt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteQuotesMutationVariables,
  APITypes.DeleteQuotesMutation
>;
export const deleteRequests = /* GraphQL */ `mutation DeleteRequests(
  $condition: ModelRequestsConditionInput
  $input: DeleteRequestsInput!
) {
  deleteRequests(condition: $condition, input: $input) {
    accountExecutive
    addressId
    agentContactId
    archived
    archivedDate
    assignedDate
    assignedTo
    bookingId
    budget
    createdAt
    expiredDate
    homeownerContactId
    id
    leadFromSync
    leadFromVenturaStone
    leadSource
    message
    moveToQuotingDate
    needFinance
    officeNotes
    owner
    product
    relationToProperty
    requestedSlot
    requestedVisitDateTime
    rtDigitalSelection
    status
    statusImage
    statusOrder
    updatedAt
    uploadedMedia
    uploadedVideos
    uplodedDocuments
    virtualWalkthrough
    visitDate
    visitorId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteRequestsMutationVariables,
  APITypes.DeleteRequestsMutation
>;
export const deleteSESReputationMetrics = /* GraphQL */ `mutation DeleteSESReputationMetrics(
  $condition: ModelSESReputationMetricsConditionInput
  $input: DeleteSESReputationMetricsInput!
) {
  deleteSESReputationMetrics(condition: $condition, input: $input) {
    bounceRate
    bounceRateAlert
    complaintRate
    complaintRateAlert
    createdAt
    deliveryRate
    id
    metricDate
    owner
    reputationScore
    sendRateMax
    sendingQuotaMax
    sendingQuotaUsed
    totalBounces
    totalComplaints
    totalEmailsSent
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteSESReputationMetricsMutationVariables,
  APITypes.DeleteSESReputationMetricsMutation
>;
export const deleteSecureConfig = /* GraphQL */ `mutation DeleteSecureConfig(
  $condition: ModelSecureConfigConditionInput
  $input: DeleteSecureConfigInput!
) {
  deleteSecureConfig(condition: $condition, input: $input) {
    createdAt
    createdBy
    description
    environment
    id
    isActive
    key
    owner
    parameterPath
    service
    updatedAt
    updatedBy
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteSecureConfigMutationVariables,
  APITypes.DeleteSecureConfigMutation
>;
export const deleteSignalEvents = /* GraphQL */ `mutation DeleteSignalEvents(
  $condition: ModelSignalEventsConditionInput
  $input: DeleteSignalEventsInput!
) {
  deleteSignalEvents(condition: $condition, input: $input) {
    createdAt
    emittedAt
    emittedBy
    id
    payload
    processed
    signalType
    source
    triggeredNotifications {
      nextToken
      __typename
    }
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteSignalEventsMutationVariables,
  APITypes.DeleteSignalEventsMutation
>;
export const deleteSignalNotificationHooks = /* GraphQL */ `mutation DeleteSignalNotificationHooks(
  $condition: ModelSignalNotificationHooksConditionInput
  $input: DeleteSignalNotificationHooksInput!
) {
  deleteSignalNotificationHooks(condition: $condition, input: $input) {
    channels
    conditions
    createdAt
    enabled
    id
    notificationTemplateId
    priority
    recipientDynamic
    recipientEmails
    recipientRoles
    signalType
    template {
      channel
      contentHtml
      contentText
      createdAt
      id
      isActive
      name
      owner
      subject
      updatedAt
      variables
      __typename
    }
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteSignalNotificationHooksMutationVariables,
  APITypes.DeleteSignalNotificationHooksMutation
>;
export const updateAffiliates = /* GraphQL */ `mutation UpdateAffiliates(
  $condition: ModelAffiliatesConditionInput
  $input: UpdateAffiliatesInput!
) {
  updateAffiliates(condition: $condition, input: $input) {
    accounting
    addressId
    communication
    company
    contactId
    createdAt
    date
    email
    environmentalFactor
    generalGuidelines
    id
    license
    linkSla2Name
    materialUtilization
    name
    numEmployees
    oshaCompliance
    owner
    phone
    projectRemnantList
    qualifierName
    qualifierSignature
    qualityAssurance
    safetyPlan
    serviceType
    signedNda
    slaAll
    slaCompanyEmail
    title
    updatedAt
    warrantyPeriod
    waterSystem
    workersCompensationInsurance
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateAffiliatesMutationVariables,
  APITypes.UpdateAffiliatesMutation
>;
export const updateAppPreferences = /* GraphQL */ `mutation UpdateAppPreferences(
  $condition: ModelAppPreferencesConditionInput
  $input: UpdateAppPreferencesInput!
) {
  updateAppPreferences(condition: $condition, input: $input) {
    category
    categoryKey
    createdAt
    createdBy
    dataType
    defaultValue
    description
    environment
    id
    isEncrypted
    isSystemSetting
    key
    owner
    updatedAt
    updatedBy
    validationRules
    value
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateAppPreferencesMutationVariables,
  APITypes.UpdateAppPreferencesMutation
>;
export const updateAuditLog = /* GraphQL */ `mutation UpdateAuditLog(
  $condition: ModelAuditLogConditionInput
  $input: UpdateAuditLogInput!
) {
  updateAuditLog(condition: $condition, input: $input) {
    action
    changeType
    changedFields
    createdAt
    id
    ipAddress
    newData
    owner
    previousData
    recordId
    sessionId
    source
    tableName
    timestamp
    ttl
    updatedAt
    userAgent
    userEmail
    userId
    userRole
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateAuditLogMutationVariables,
  APITypes.UpdateAuditLogMutation
>;
export const updateAuth = /* GraphQL */ `mutation UpdateAuth(
  $condition: ModelAuthConditionInput
  $input: UpdateAuthInput!
) {
  updateAuth(condition: $condition, input: $input) {
    createdAt
    email
    hash
    id
    owner
    token
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateAuthMutationVariables,
  APITypes.UpdateAuthMutation
>;
export const updateBackOfficeAssignTo = /* GraphQL */ `mutation UpdateBackOfficeAssignTo(
  $condition: ModelBackOfficeAssignToConditionInput
  $input: UpdateBackOfficeAssignToInput!
) {
  updateBackOfficeAssignTo(condition: $condition, input: $input) {
    active
    contactId
    createdAt
    email
    id
    mobile
    name
    order
    owner
    sendEmailNotifications
    sendSmsNotifications
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateBackOfficeAssignToMutationVariables,
  APITypes.UpdateBackOfficeAssignToMutation
>;
export const updateBackOfficeBookingStatuses = /* GraphQL */ `mutation UpdateBackOfficeBookingStatuses(
  $condition: ModelBackOfficeBookingStatusesConditionInput
  $input: UpdateBackOfficeBookingStatusesInput!
) {
  updateBackOfficeBookingStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateBackOfficeBookingStatusesMutationVariables,
  APITypes.UpdateBackOfficeBookingStatusesMutation
>;
export const updateBackOfficeBrokerage = /* GraphQL */ `mutation UpdateBackOfficeBrokerage(
  $condition: ModelBackOfficeBrokerageConditionInput
  $input: UpdateBackOfficeBrokerageInput!
) {
  updateBackOfficeBrokerage(condition: $condition, input: $input) {
    createdAt
    id
    live
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateBackOfficeBrokerageMutationVariables,
  APITypes.UpdateBackOfficeBrokerageMutation
>;
export const updateBackOfficeNotifications = /* GraphQL */ `mutation UpdateBackOfficeNotifications(
  $condition: ModelBackOfficeNotificationsConditionInput
  $input: UpdateBackOfficeNotificationsInput!
) {
  updateBackOfficeNotifications(condition: $condition, input: $input) {
    bcc
    body
    bodyAsSimpleText
    cc
    createdAt
    id
    key
    owner
    subject
    to
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateBackOfficeNotificationsMutationVariables,
  APITypes.UpdateBackOfficeNotificationsMutation
>;
export const updateBackOfficeProducts = /* GraphQL */ `mutation UpdateBackOfficeProducts(
  $condition: ModelBackOfficeProductsConditionInput
  $input: UpdateBackOfficeProductsInput!
) {
  updateBackOfficeProducts(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateBackOfficeProductsMutationVariables,
  APITypes.UpdateBackOfficeProductsMutation
>;
export const updateBackOfficeProjectStatuses = /* GraphQL */ `mutation UpdateBackOfficeProjectStatuses(
  $condition: ModelBackOfficeProjectStatusesConditionInput
  $input: UpdateBackOfficeProjectStatusesInput!
) {
  updateBackOfficeProjectStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateBackOfficeProjectStatusesMutationVariables,
  APITypes.UpdateBackOfficeProjectStatusesMutation
>;
export const updateBackOfficeQuoteStatuses = /* GraphQL */ `mutation UpdateBackOfficeQuoteStatuses(
  $condition: ModelBackOfficeQuoteStatusesConditionInput
  $input: UpdateBackOfficeQuoteStatusesInput!
) {
  updateBackOfficeQuoteStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateBackOfficeQuoteStatusesMutationVariables,
  APITypes.UpdateBackOfficeQuoteStatusesMutation
>;
export const updateBackOfficeRequestStatuses = /* GraphQL */ `mutation UpdateBackOfficeRequestStatuses(
  $condition: ModelBackOfficeRequestStatusesConditionInput
  $input: UpdateBackOfficeRequestStatusesInput!
) {
  updateBackOfficeRequestStatuses(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateBackOfficeRequestStatusesMutationVariables,
  APITypes.UpdateBackOfficeRequestStatusesMutation
>;
export const updateBackOfficeRoleTypes = /* GraphQL */ `mutation UpdateBackOfficeRoleTypes(
  $condition: ModelBackOfficeRoleTypesConditionInput
  $input: UpdateBackOfficeRoleTypesInput!
) {
  updateBackOfficeRoleTypes(condition: $condition, input: $input) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateBackOfficeRoleTypesMutationVariables,
  APITypes.UpdateBackOfficeRoleTypesMutation
>;
export const updateContactAuditLog = /* GraphQL */ `mutation UpdateContactAuditLog(
  $condition: ModelContactAuditLogConditionInput
  $input: UpdateContactAuditLogInput!
) {
  updateContactAuditLog(condition: $condition, input: $input) {
    action
    changeType
    contactId
    createdAt
    email
    id
    ipAddress
    newData
    owner
    previousData
    source
    timestamp
    ttl
    updatedAt
    userAgent
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateContactAuditLogMutationVariables,
  APITypes.UpdateContactAuditLogMutation
>;
export const updateContactUs = /* GraphQL */ `mutation UpdateContactUs(
  $condition: ModelContactUsConditionInput
  $input: UpdateContactUsInput!
) {
  updateContactUs(condition: $condition, input: $input) {
    addressId
    contactId
    createdAt
    id
    message
    owner
    product
    subject
    submissionTime
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateContactUsMutationVariables,
  APITypes.UpdateContactUsMutation
>;
export const updateContacts = /* GraphQL */ `mutation UpdateContacts(
  $condition: ModelContactsConditionInput
  $input: UpdateContactsInput!
) {
  updateContacts(condition: $condition, input: $input) {
    agentProjects {
      nextToken
      __typename
    }
    agentQuotes {
      nextToken
      __typename
    }
    assignmentPriority
    brokerage
    canReceiveNotifications
    company
    createdAt
    email
    emailNotifications
    firstName
    fullName
    homeowner2Projects {
      nextToken
      __typename
    }
    homeowner3Projects {
      nextToken
      __typename
    }
    homeownerProjects {
      nextToken
      __typename
    }
    homeownerQuotes {
      nextToken
      __typename
    }
    id
    isActive
    lastName
    mobile
    owner
    phone
    roleType
    smsNotifications
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateContactsMutationVariables,
  APITypes.UpdateContactsMutation
>;
export const updateESignatureDocuments = /* GraphQL */ `mutation UpdateESignatureDocuments(
  $condition: ModelESignatureDocumentsConditionInput
  $input: UpdateESignatureDocumentsInput!
) {
  updateESignatureDocuments(condition: $condition, input: $input) {
    addressId
    createdAt
    document
    documentData
    homeownerEmail
    id
    initials
    owner
    pdfGeneratorUrl
    quotePdfUrl
    signature
    signed
    signedBy
    signedDate
    signedDocument
    signedPdfGeneratorUrl
    signedQuotePdfPublicUrl
    templateId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateESignatureDocumentsMutationVariables,
  APITypes.UpdateESignatureDocumentsMutation
>;
export const updateEmailSuppressionList = /* GraphQL */ `mutation UpdateEmailSuppressionList(
  $condition: ModelEmailSuppressionListConditionInput
  $input: UpdateEmailSuppressionListInput!
) {
  updateEmailSuppressionList(condition: $condition, input: $input) {
    bounceSubType
    bounceType
    complaintType
    createdAt
    createdBy
    emailAddress
    id
    isActive
    metadata
    originalMessageId
    owner
    reason
    source
    suppressedAt
    suppressionType
    updatedAt
    updatedBy
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateEmailSuppressionListMutationVariables,
  APITypes.UpdateEmailSuppressionListMutation
>;
export const updateLegal = /* GraphQL */ `mutation UpdateLegal(
  $condition: ModelLegalConditionInput
  $input: UpdateLegalInput!
) {
  updateLegal(condition: $condition, input: $input) {
    content
    createdAt
    documentId
    id
    legalDocumentId
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateLegalMutationVariables,
  APITypes.UpdateLegalMutation
>;
export const updateMemberSignature = /* GraphQL */ `mutation UpdateMemberSignature(
  $condition: ModelMemberSignatureConditionInput
  $input: UpdateMemberSignatureInput!
) {
  updateMemberSignature(condition: $condition, input: $input) {
    createdAt
    fullName
    id
    initials
    initialsPublicUrl
    initialsWixUrl
    ip
    memberEmail
    owner
    signature
    signaturePublicUrl
    signatureWixUrl
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateMemberSignatureMutationVariables,
  APITypes.UpdateMemberSignatureMutation
>;
export const updateNotificationEvents = /* GraphQL */ `mutation UpdateNotificationEvents(
  $condition: ModelNotificationEventsConditionInput
  $input: UpdateNotificationEventsInput!
) {
  updateNotificationEvents(condition: $condition, input: $input) {
    channel
    createdAt
    errorCode
    errorMessage
    eventId
    eventType
    id
    metadata
    notificationId
    owner
    processingTimeMs
    provider
    providerId
    providerStatus
    recipient
    timestamp
    ttl
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateNotificationEventsMutationVariables,
  APITypes.UpdateNotificationEventsMutation
>;
export const updateNotificationQueue = /* GraphQL */ `mutation UpdateNotificationQueue(
  $condition: ModelNotificationQueueConditionInput
  $input: UpdateNotificationQueueInput!
) {
  updateNotificationQueue(condition: $condition, input: $input) {
    channels
    createdAt
    directContent
    errorMessage
    eventType
    id
    owner
    payload
    priority
    recipientIds
    retryCount
    scheduledAt
    sentAt
    signalEvent {
      createdAt
      emittedAt
      emittedBy
      id
      payload
      processed
      signalType
      source
      updatedAt
      __typename
    }
    signalEventId
    status
    template {
      channel
      contentHtml
      contentText
      createdAt
      id
      isActive
      name
      owner
      subject
      updatedAt
      variables
      __typename
    }
    templateId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateNotificationQueueMutationVariables,
  APITypes.UpdateNotificationQueueMutation
>;
export const updateNotificationTemplate = /* GraphQL */ `mutation UpdateNotificationTemplate(
  $condition: ModelNotificationTemplateConditionInput
  $input: UpdateNotificationTemplateInput!
) {
  updateNotificationTemplate(condition: $condition, input: $input) {
    channel
    contentHtml
    contentText
    createdAt
    id
    isActive
    name
    notifications {
      nextToken
      __typename
    }
    owner
    signalHooks {
      nextToken
      __typename
    }
    subject
    updatedAt
    variables
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateNotificationTemplateMutationVariables,
  APITypes.UpdateNotificationTemplateMutation
>;
export const updatePendingAppoitments = /* GraphQL */ `mutation UpdatePendingAppoitments(
  $condition: ModelPendingAppoitmentsConditionInput
  $input: UpdatePendingAppoitmentsInput!
) {
  updatePendingAppoitments(condition: $condition, input: $input) {
    agentEmail
    agentName
    agentPhone
    assignedDate
    assignedTo
    brokerage
    createdAt
    email
    id
    name
    owner
    phone
    preferredLocation
    requestAddress
    requestId
    requestedSlot
    serviceName
    status
    updatedAt
    visitorId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdatePendingAppoitmentsMutationVariables,
  APITypes.UpdatePendingAppoitmentsMutation
>;
export const updateProjectComments = /* GraphQL */ `mutation UpdateProjectComments(
  $condition: ModelProjectCommentsConditionInput
  $input: UpdateProjectCommentsInput!
) {
  updateProjectComments(condition: $condition, input: $input) {
    addToGallery
    comment
    createdAt
    createdDate
    files
    id
    isPrivate
    nickname
    owner
    postedByContactId
    postedByProfileImage
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateProjectCommentsMutationVariables,
  APITypes.UpdateProjectCommentsMutation
>;
export const updateProjectMilestones = /* GraphQL */ `mutation UpdateProjectMilestones(
  $condition: ModelProjectMilestonesConditionInput
  $input: UpdateProjectMilestonesInput!
) {
  updateProjectMilestones(condition: $condition, input: $input) {
    createdAt
    createdDate
    description
    estimatedFinish
    estimatedStart
    id
    isCategory
    isComplete
    isInternal
    name
    order
    owner
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateProjectMilestonesMutationVariables,
  APITypes.UpdateProjectMilestonesMutation
>;
export const updateProjectPaymentTerms = /* GraphQL */ `mutation UpdateProjectPaymentTerms(
  $condition: ModelProjectPaymentTermsConditionInput
  $input: UpdateProjectPaymentTermsInput!
) {
  updateProjectPaymentTerms(condition: $condition, input: $input) {
    createdAt
    createdDate
    description
    id
    internal
    isCategory
    order
    owner
    paid
    parentPaymentId
    paymentAmount
    paymentDue
    paymentName
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    type
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateProjectPaymentTermsMutationVariables,
  APITypes.UpdateProjectPaymentTermsMutation
>;
export const updateProjectPermissions = /* GraphQL */ `mutation UpdateProjectPermissions(
  $condition: ModelProjectPermissionsConditionInput
  $input: UpdateProjectPermissionsInput!
) {
  updateProjectPermissions(condition: $condition, input: $input) {
    createdAt
    id
    na
    owner
    permissions
    projectId
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateProjectPermissionsMutationVariables,
  APITypes.UpdateProjectPermissionsMutation
>;
export const updateProjects = /* GraphQL */ `mutation UpdateProjects(
  $condition: ModelProjectsConditionInput
  $input: UpdateProjectsInput!
) {
  updateProjects(condition: $condition, input: $input) {
    accountExecutive
    addedValue
    address {
      bathrooms
      bedrooms
      city
      createdAt
      floors
      houseAddress
      id
      owner
      propertyFullAddress
      propertyType
      redfinLink
      sizeSqft
      state
      updatedAt
      yearBuilt
      zillowLink
      zip
      __typename
    }
    addressId
    agent {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    agentContactId
    archived
    archivedDate
    assignedDate
    assignedTo
    bathrooms
    bedrooms
    boostPrice
    boosterActualCost
    boosterActualPrice
    boosterCompletionDate
    boosterEstimatedCost
    brokerage
    budget
    carryCost
    carryDays
    closingDate
    comments {
      nextToken
      __typename
    }
    contractDate
    contractSentDate
    contractUrl
    contractingStartDate
    createdAt
    createdDate
    daysOnMarket
    description
    documents
    escrowCompanyName
    escrowContactInfo
    escrowDate
    escrowPaymentDate
    estimate
    estimatedClosingDate
    estimatedGrossProfit
    estimatedWeeksDuration
    excludeFromDashboard
    floors
    gallery
    grossProfit
    homeowner {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner2 {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner2ContactId
    homeowner3 {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner3ContactId
    homeownerContactId
    id
    image
    invoiceDate
    invoiceNumber
    item04Projects
    link04ProjectsTitle
    linkProjects1Title2
    listingPrice
    loanBalance
    milestones {
      nextToken
      __typename
    }
    officeNotes
    openEscrowWithinDays
    originalValue
    owner
    paidByEscrow
    paidCost
    paymentTerms {
      nextToken
      __typename
    }
    permissionPrivateRoles
    permissionPrivateUsers
    permissionPublic
    priceQuoteInfo
    projectAdminProjectId
    projectManagerEmailList
    projectManagerPhone
    propertyType
    proposalDate
    quoteId
    quoteItems {
      nextToken
      __typename
    }
    quoteOpenedDate
    quoteSentDate
    quoteSignedDate
    quoteUrl
    quotes {
      nextToken
      __typename
    }
    redfinLink
    requestDate
    requestId
    revShareAmount
    revSharePayDate
    salePrice
    selectedProducts
    signedContracts
    sizeSqft
    status
    statusImage
    statusOrder
    title
    underwritingDate
    updatedAt
    updatedDate
    visitReviewDate
    visitorId
    yearBuilt
    zillowLink
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateProjectsMutationVariables,
  APITypes.UpdateProjectsMutation
>;
export const updateProperties = /* GraphQL */ `mutation UpdateProperties(
  $condition: ModelPropertiesConditionInput
  $input: UpdatePropertiesInput!
) {
  updateProperties(condition: $condition, input: $input) {
    bathrooms
    bedrooms
    city
    createdAt
    floors
    houseAddress
    id
    owner
    projects {
      nextToken
      __typename
    }
    propertyFullAddress
    propertyType
    redfinLink
    sizeSqft
    state
    updatedAt
    yearBuilt
    zillowLink
    zip
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdatePropertiesMutationVariables,
  APITypes.UpdatePropertiesMutation
>;
export const updateQuoteItems = /* GraphQL */ `mutation UpdateQuoteItems(
  $condition: ModelQuoteItemsConditionInput
  $input: UpdateQuoteItemsInput!
) {
  updateQuoteItems(condition: $condition, input: $input) {
    cost
    createdAt
    description
    id
    image
    internal
    isCategory
    itemCompleted
    itemName
    marginPercent
    order
    owner
    parentStageId
    price
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    quantity
    recommendItem
    total
    type
    unitPrice
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateQuoteItemsMutationVariables,
  APITypes.UpdateQuoteItemsMutation
>;
export const updateQuotes = /* GraphQL */ `mutation UpdateQuotes(
  $condition: ModelQuotesConditionInput
  $input: UpdateQuotesInput!
) {
  updateQuotes(condition: $condition, input: $input) {
    accountExecutive
    addressId
    agent {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    agentContactId
    archivedDate
    assignedDate
    assignedTo
    associatedProject
    bathrooms
    bedrooms
    brokerage
    budget
    changeOrder
    contractSentDate
    contractSignedDate
    contractingStartDate
    convertedDate
    createdAt
    creditScore
    document
    documents
    eSignatureDocumentId
    estimatedWeeksDuration
    expiredDate
    floors
    homeowner {
      assignmentPriority
      brokerage
      canReceiveNotifications
      company
      createdAt
      email
      emailNotifications
      firstName
      fullName
      id
      isActive
      lastName
      mobile
      owner
      phone
      roleType
      smsNotifications
      updatedAt
      __typename
    }
    homeowner2ContactId
    homeowner3ContactId
    homeownerContactId
    id
    images
    loanBalance
    officeNotes
    openedDate
    operationManagerApproved
    operationManagerApprovedDate
    owner
    pdfGeneratorUrl
    product
    project {
      accountExecutive
      addedValue
      addressId
      agentContactId
      archived
      archivedDate
      assignedDate
      assignedTo
      bathrooms
      bedrooms
      boostPrice
      boosterActualCost
      boosterActualPrice
      boosterCompletionDate
      boosterEstimatedCost
      brokerage
      budget
      carryCost
      carryDays
      closingDate
      contractDate
      contractSentDate
      contractUrl
      contractingStartDate
      createdAt
      createdDate
      daysOnMarket
      description
      documents
      escrowCompanyName
      escrowContactInfo
      escrowDate
      escrowPaymentDate
      estimate
      estimatedClosingDate
      estimatedGrossProfit
      estimatedWeeksDuration
      excludeFromDashboard
      floors
      gallery
      grossProfit
      homeowner2ContactId
      homeowner3ContactId
      homeownerContactId
      id
      image
      invoiceDate
      invoiceNumber
      item04Projects
      link04ProjectsTitle
      linkProjects1Title2
      listingPrice
      loanBalance
      officeNotes
      openEscrowWithinDays
      originalValue
      owner
      paidByEscrow
      paidCost
      permissionPrivateRoles
      permissionPrivateUsers
      permissionPublic
      priceQuoteInfo
      projectAdminProjectId
      projectManagerEmailList
      projectManagerPhone
      propertyType
      proposalDate
      quoteId
      quoteOpenedDate
      quoteSentDate
      quoteSignedDate
      quoteUrl
      redfinLink
      requestDate
      requestId
      revShareAmount
      revSharePayDate
      salePrice
      selectedProducts
      signedContracts
      sizeSqft
      status
      statusImage
      statusOrder
      title
      underwritingDate
      updatedAt
      updatedDate
      visitReviewDate
      visitorId
      yearBuilt
      zillowLink
      __typename
    }
    projectId
    projectedListingPrice
    quoteESignatureId
    quoteNumber
    quotePdfUrl
    reasonForArchive
    rejectedDate
    requestDate
    requestId
    sentDate
    signature
    signed
    signedDate
    signee1Name
    sizeSqft
    status
    statusImage
    statusOrder
    title
    totalCost
    totalPaymentsByClient
    totalPaymentsToGc
    totalPrice
    underwritingApproved
    underwritingApprovedDate
    updatedAt
    viewedBy
    visitDate
    visitorId
    yearBuilt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateQuotesMutationVariables,
  APITypes.UpdateQuotesMutation
>;
export const updateRequests = /* GraphQL */ `mutation UpdateRequests(
  $condition: ModelRequestsConditionInput
  $input: UpdateRequestsInput!
) {
  updateRequests(condition: $condition, input: $input) {
    accountExecutive
    addressId
    agentContactId
    archived
    archivedDate
    assignedDate
    assignedTo
    bookingId
    budget
    createdAt
    expiredDate
    homeownerContactId
    id
    leadFromSync
    leadFromVenturaStone
    leadSource
    message
    moveToQuotingDate
    needFinance
    officeNotes
    owner
    product
    relationToProperty
    requestedSlot
    requestedVisitDateTime
    rtDigitalSelection
    status
    statusImage
    statusOrder
    updatedAt
    uploadedMedia
    uploadedVideos
    uplodedDocuments
    virtualWalkthrough
    visitDate
    visitorId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateRequestsMutationVariables,
  APITypes.UpdateRequestsMutation
>;
export const updateSESReputationMetrics = /* GraphQL */ `mutation UpdateSESReputationMetrics(
  $condition: ModelSESReputationMetricsConditionInput
  $input: UpdateSESReputationMetricsInput!
) {
  updateSESReputationMetrics(condition: $condition, input: $input) {
    bounceRate
    bounceRateAlert
    complaintRate
    complaintRateAlert
    createdAt
    deliveryRate
    id
    metricDate
    owner
    reputationScore
    sendRateMax
    sendingQuotaMax
    sendingQuotaUsed
    totalBounces
    totalComplaints
    totalEmailsSent
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateSESReputationMetricsMutationVariables,
  APITypes.UpdateSESReputationMetricsMutation
>;
export const updateSecureConfig = /* GraphQL */ `mutation UpdateSecureConfig(
  $condition: ModelSecureConfigConditionInput
  $input: UpdateSecureConfigInput!
) {
  updateSecureConfig(condition: $condition, input: $input) {
    createdAt
    createdBy
    description
    environment
    id
    isActive
    key
    owner
    parameterPath
    service
    updatedAt
    updatedBy
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateSecureConfigMutationVariables,
  APITypes.UpdateSecureConfigMutation
>;
export const updateSignalEvents = /* GraphQL */ `mutation UpdateSignalEvents(
  $condition: ModelSignalEventsConditionInput
  $input: UpdateSignalEventsInput!
) {
  updateSignalEvents(condition: $condition, input: $input) {
    createdAt
    emittedAt
    emittedBy
    id
    payload
    processed
    signalType
    source
    triggeredNotifications {
      nextToken
      __typename
    }
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateSignalEventsMutationVariables,
  APITypes.UpdateSignalEventsMutation
>;
export const updateSignalNotificationHooks = /* GraphQL */ `mutation UpdateSignalNotificationHooks(
  $condition: ModelSignalNotificationHooksConditionInput
  $input: UpdateSignalNotificationHooksInput!
) {
  updateSignalNotificationHooks(condition: $condition, input: $input) {
    channels
    conditions
    createdAt
    enabled
    id
    notificationTemplateId
    priority
    recipientDynamic
    recipientEmails
    recipientRoles
    signalType
    template {
      channel
      contentHtml
      contentText
      createdAt
      id
      isActive
      name
      owner
      subject
      updatedAt
      variables
      __typename
    }
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateSignalNotificationHooksMutationVariables,
  APITypes.UpdateSignalNotificationHooksMutation
>;
