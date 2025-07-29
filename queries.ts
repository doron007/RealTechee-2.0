/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getAffiliates = /* GraphQL */ `query GetAffiliates($id: ID!) {
  getAffiliates(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAffiliatesQueryVariables,
  APITypes.GetAffiliatesQuery
>;
export const getAppPreferences = /* GraphQL */ `query GetAppPreferences($id: ID!) {
  getAppPreferences(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAppPreferencesQueryVariables,
  APITypes.GetAppPreferencesQuery
>;
export const getAuditLog = /* GraphQL */ `query GetAuditLog($id: ID!) {
  getAuditLog(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAuditLogQueryVariables,
  APITypes.GetAuditLogQuery
>;
export const getAuth = /* GraphQL */ `query GetAuth($id: ID!) {
  getAuth(id: $id) {
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
` as GeneratedQuery<APITypes.GetAuthQueryVariables, APITypes.GetAuthQuery>;
export const getBackOfficeAssignTo = /* GraphQL */ `query GetBackOfficeAssignTo($id: ID!) {
  getBackOfficeAssignTo(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetBackOfficeAssignToQueryVariables,
  APITypes.GetBackOfficeAssignToQuery
>;
export const getBackOfficeBookingStatuses = /* GraphQL */ `query GetBackOfficeBookingStatuses($id: ID!) {
  getBackOfficeBookingStatuses(id: $id) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetBackOfficeBookingStatusesQueryVariables,
  APITypes.GetBackOfficeBookingStatusesQuery
>;
export const getBackOfficeBrokerage = /* GraphQL */ `query GetBackOfficeBrokerage($id: ID!) {
  getBackOfficeBrokerage(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetBackOfficeBrokerageQueryVariables,
  APITypes.GetBackOfficeBrokerageQuery
>;
export const getBackOfficeNotifications = /* GraphQL */ `query GetBackOfficeNotifications($id: ID!) {
  getBackOfficeNotifications(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetBackOfficeNotificationsQueryVariables,
  APITypes.GetBackOfficeNotificationsQuery
>;
export const getBackOfficeProducts = /* GraphQL */ `query GetBackOfficeProducts($id: ID!) {
  getBackOfficeProducts(id: $id) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetBackOfficeProductsQueryVariables,
  APITypes.GetBackOfficeProductsQuery
>;
export const getBackOfficeProjectStatuses = /* GraphQL */ `query GetBackOfficeProjectStatuses($id: ID!) {
  getBackOfficeProjectStatuses(id: $id) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetBackOfficeProjectStatusesQueryVariables,
  APITypes.GetBackOfficeProjectStatusesQuery
>;
export const getBackOfficeQuoteStatuses = /* GraphQL */ `query GetBackOfficeQuoteStatuses($id: ID!) {
  getBackOfficeQuoteStatuses(id: $id) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetBackOfficeQuoteStatusesQueryVariables,
  APITypes.GetBackOfficeQuoteStatusesQuery
>;
export const getBackOfficeRequestStatuses = /* GraphQL */ `query GetBackOfficeRequestStatuses($id: ID!) {
  getBackOfficeRequestStatuses(id: $id) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetBackOfficeRequestStatusesQueryVariables,
  APITypes.GetBackOfficeRequestStatusesQuery
>;
export const getBackOfficeRoleTypes = /* GraphQL */ `query GetBackOfficeRoleTypes($id: ID!) {
  getBackOfficeRoleTypes(id: $id) {
    createdAt
    id
    order
    owner
    title
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetBackOfficeRoleTypesQueryVariables,
  APITypes.GetBackOfficeRoleTypesQuery
>;
export const getContactAuditLog = /* GraphQL */ `query GetContactAuditLog($id: ID!) {
  getContactAuditLog(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetContactAuditLogQueryVariables,
  APITypes.GetContactAuditLogQuery
>;
export const getContactUs = /* GraphQL */ `query GetContactUs($id: ID!) {
  getContactUs(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetContactUsQueryVariables,
  APITypes.GetContactUsQuery
>;
export const getContacts = /* GraphQL */ `query GetContacts($id: ID!) {
  getContacts(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetContactsQueryVariables,
  APITypes.GetContactsQuery
>;
export const getESignatureDocuments = /* GraphQL */ `query GetESignatureDocuments($id: ID!) {
  getESignatureDocuments(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetESignatureDocumentsQueryVariables,
  APITypes.GetESignatureDocumentsQuery
>;
export const getLegal = /* GraphQL */ `query GetLegal($id: ID!) {
  getLegal(id: $id) {
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
` as GeneratedQuery<APITypes.GetLegalQueryVariables, APITypes.GetLegalQuery>;
export const getMemberSignature = /* GraphQL */ `query GetMemberSignature($id: ID!) {
  getMemberSignature(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetMemberSignatureQueryVariables,
  APITypes.GetMemberSignatureQuery
>;
export const getNotificationEvents = /* GraphQL */ `query GetNotificationEvents($id: ID!) {
  getNotificationEvents(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetNotificationEventsQueryVariables,
  APITypes.GetNotificationEventsQuery
>;
export const getNotificationQueue = /* GraphQL */ `query GetNotificationQueue($id: ID!) {
  getNotificationQueue(id: $id) {
    channels
    createdAt
    errorMessage
    eventType
    id
    owner
    payload
    recipientIds
    retryCount
    scheduledAt
    sentAt
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
` as GeneratedQuery<
  APITypes.GetNotificationQueueQueryVariables,
  APITypes.GetNotificationQueueQuery
>;
export const getNotificationTemplate = /* GraphQL */ `query GetNotificationTemplate($id: ID!) {
  getNotificationTemplate(id: $id) {
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
    subject
    updatedAt
    variables
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetNotificationTemplateQueryVariables,
  APITypes.GetNotificationTemplateQuery
>;
export const getPendingAppoitments = /* GraphQL */ `query GetPendingAppoitments($id: ID!) {
  getPendingAppoitments(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetPendingAppoitmentsQueryVariables,
  APITypes.GetPendingAppoitmentsQuery
>;
export const getProjectComments = /* GraphQL */ `query GetProjectComments($id: ID!) {
  getProjectComments(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetProjectCommentsQueryVariables,
  APITypes.GetProjectCommentsQuery
>;
export const getProjectMilestones = /* GraphQL */ `query GetProjectMilestones($id: ID!) {
  getProjectMilestones(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetProjectMilestonesQueryVariables,
  APITypes.GetProjectMilestonesQuery
>;
export const getProjectPaymentTerms = /* GraphQL */ `query GetProjectPaymentTerms($id: ID!) {
  getProjectPaymentTerms(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetProjectPaymentTermsQueryVariables,
  APITypes.GetProjectPaymentTermsQuery
>;
export const getProjectPermissions = /* GraphQL */ `query GetProjectPermissions($id: ID!) {
  getProjectPermissions(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetProjectPermissionsQueryVariables,
  APITypes.GetProjectPermissionsQuery
>;
export const getProjects = /* GraphQL */ `query GetProjects($id: ID!) {
  getProjects(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetProjectsQueryVariables,
  APITypes.GetProjectsQuery
>;
export const getProperties = /* GraphQL */ `query GetProperties($id: ID!) {
  getProperties(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetPropertiesQueryVariables,
  APITypes.GetPropertiesQuery
>;
export const getQuoteItems = /* GraphQL */ `query GetQuoteItems($id: ID!) {
  getQuoteItems(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetQuoteItemsQueryVariables,
  APITypes.GetQuoteItemsQuery
>;
export const getQuotes = /* GraphQL */ `query GetQuotes($id: ID!) {
  getQuotes(id: $id) {
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
` as GeneratedQuery<APITypes.GetQuotesQueryVariables, APITypes.GetQuotesQuery>;
export const getRequests = /* GraphQL */ `query GetRequests($id: ID!) {
  getRequests(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetRequestsQueryVariables,
  APITypes.GetRequestsQuery
>;
export const getSecureConfig = /* GraphQL */ `query GetSecureConfig($id: ID!) {
  getSecureConfig(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetSecureConfigQueryVariables,
  APITypes.GetSecureConfigQuery
>;
export const listAffiliates = /* GraphQL */ `query ListAffiliates(
  $filter: ModelAffiliatesFilterInput
  $limit: Int
  $nextToken: String
) {
  listAffiliates(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAffiliatesQueryVariables,
  APITypes.ListAffiliatesQuery
>;
export const listAppPreferences = /* GraphQL */ `query ListAppPreferences(
  $filter: ModelAppPreferencesFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listAppPreferences(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAppPreferencesQueryVariables,
  APITypes.ListAppPreferencesQuery
>;
export const listAuditLogs = /* GraphQL */ `query ListAuditLogs(
  $filter: ModelAuditLogFilterInput
  $limit: Int
  $nextToken: String
) {
  listAuditLogs(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAuditLogsQueryVariables,
  APITypes.ListAuditLogsQuery
>;
export const listAuths = /* GraphQL */ `query ListAuths(
  $filter: ModelAuthFilterInput
  $limit: Int
  $nextToken: String
) {
  listAuths(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      email
      hash
      id
      owner
      token
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListAuthsQueryVariables, APITypes.ListAuthsQuery>;
export const listBackOfficeAssignTos = /* GraphQL */ `query ListBackOfficeAssignTos(
  $filter: ModelBackOfficeAssignToFilterInput
  $limit: Int
  $nextToken: String
) {
  listBackOfficeAssignTos(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBackOfficeAssignTosQueryVariables,
  APITypes.ListBackOfficeAssignTosQuery
>;
export const listBackOfficeBookingStatuses = /* GraphQL */ `query ListBackOfficeBookingStatuses(
  $filter: ModelBackOfficeBookingStatusesFilterInput
  $limit: Int
  $nextToken: String
) {
  listBackOfficeBookingStatuses(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      order
      owner
      title
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBackOfficeBookingStatusesQueryVariables,
  APITypes.ListBackOfficeBookingStatusesQuery
>;
export const listBackOfficeBrokerages = /* GraphQL */ `query ListBackOfficeBrokerages(
  $filter: ModelBackOfficeBrokerageFilterInput
  $limit: Int
  $nextToken: String
) {
  listBackOfficeBrokerages(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      live
      order
      owner
      title
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBackOfficeBrokeragesQueryVariables,
  APITypes.ListBackOfficeBrokeragesQuery
>;
export const listBackOfficeNotifications = /* GraphQL */ `query ListBackOfficeNotifications(
  $filter: ModelBackOfficeNotificationsFilterInput
  $limit: Int
  $nextToken: String
) {
  listBackOfficeNotifications(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBackOfficeNotificationsQueryVariables,
  APITypes.ListBackOfficeNotificationsQuery
>;
export const listBackOfficeProducts = /* GraphQL */ `query ListBackOfficeProducts(
  $filter: ModelBackOfficeProductsFilterInput
  $limit: Int
  $nextToken: String
) {
  listBackOfficeProducts(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      order
      owner
      title
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBackOfficeProductsQueryVariables,
  APITypes.ListBackOfficeProductsQuery
>;
export const listBackOfficeProjectStatuses = /* GraphQL */ `query ListBackOfficeProjectStatuses(
  $filter: ModelBackOfficeProjectStatusesFilterInput
  $limit: Int
  $nextToken: String
) {
  listBackOfficeProjectStatuses(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      order
      owner
      title
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBackOfficeProjectStatusesQueryVariables,
  APITypes.ListBackOfficeProjectStatusesQuery
>;
export const listBackOfficeQuoteStatuses = /* GraphQL */ `query ListBackOfficeQuoteStatuses(
  $filter: ModelBackOfficeQuoteStatusesFilterInput
  $limit: Int
  $nextToken: String
) {
  listBackOfficeQuoteStatuses(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      order
      owner
      title
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBackOfficeQuoteStatusesQueryVariables,
  APITypes.ListBackOfficeQuoteStatusesQuery
>;
export const listBackOfficeRequestStatuses = /* GraphQL */ `query ListBackOfficeRequestStatuses(
  $filter: ModelBackOfficeRequestStatusesFilterInput
  $limit: Int
  $nextToken: String
) {
  listBackOfficeRequestStatuses(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      order
      owner
      title
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBackOfficeRequestStatusesQueryVariables,
  APITypes.ListBackOfficeRequestStatusesQuery
>;
export const listBackOfficeRoleTypes = /* GraphQL */ `query ListBackOfficeRoleTypes(
  $filter: ModelBackOfficeRoleTypesFilterInput
  $limit: Int
  $nextToken: String
) {
  listBackOfficeRoleTypes(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      order
      owner
      title
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBackOfficeRoleTypesQueryVariables,
  APITypes.ListBackOfficeRoleTypesQuery
>;
export const listContactAuditLogs = /* GraphQL */ `query ListContactAuditLogs(
  $filter: ModelContactAuditLogFilterInput
  $limit: Int
  $nextToken: String
) {
  listContactAuditLogs(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListContactAuditLogsQueryVariables,
  APITypes.ListContactAuditLogsQuery
>;
export const listContacts = /* GraphQL */ `query ListContacts(
  $filter: ModelContactsFilterInput
  $limit: Int
  $nextToken: String
) {
  listContacts(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListContactsQueryVariables,
  APITypes.ListContactsQuery
>;
export const listContactuses = /* GraphQL */ `query ListContactuses(
  $filter: ModelContactUsFilterInput
  $limit: Int
  $nextToken: String
) {
  listContactuses(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListContactusesQueryVariables,
  APITypes.ListContactusesQuery
>;
export const listESignatureDocuments = /* GraphQL */ `query ListESignatureDocuments(
  $filter: ModelESignatureDocumentsFilterInput
  $limit: Int
  $nextToken: String
) {
  listESignatureDocuments(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListESignatureDocumentsQueryVariables,
  APITypes.ListESignatureDocumentsQuery
>;
export const listLegals = /* GraphQL */ `query ListLegals(
  $filter: ModelLegalFilterInput
  $limit: Int
  $nextToken: String
) {
  listLegals(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListLegalsQueryVariables,
  APITypes.ListLegalsQuery
>;
export const listMemberSignatures = /* GraphQL */ `query ListMemberSignatures(
  $filter: ModelMemberSignatureFilterInput
  $limit: Int
  $nextToken: String
) {
  listMemberSignatures(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListMemberSignaturesQueryVariables,
  APITypes.ListMemberSignaturesQuery
>;
export const listNotificationEvents = /* GraphQL */ `query ListNotificationEvents(
  $filter: ModelNotificationEventsFilterInput
  $limit: Int
  $nextToken: String
) {
  listNotificationEvents(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListNotificationEventsQueryVariables,
  APITypes.ListNotificationEventsQuery
>;
export const listNotificationQueues = /* GraphQL */ `query ListNotificationQueues(
  $filter: ModelNotificationQueueFilterInput
  $limit: Int
  $nextToken: String
) {
  listNotificationQueues(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      channels
      createdAt
      errorMessage
      eventType
      id
      owner
      payload
      recipientIds
      retryCount
      scheduledAt
      sentAt
      status
      templateId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListNotificationQueuesQueryVariables,
  APITypes.ListNotificationQueuesQuery
>;
export const listNotificationTemplates = /* GraphQL */ `query ListNotificationTemplates(
  $filter: ModelNotificationTemplateFilterInput
  $limit: Int
  $nextToken: String
) {
  listNotificationTemplates(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListNotificationTemplatesQueryVariables,
  APITypes.ListNotificationTemplatesQuery
>;
export const listPendingAppoitments = /* GraphQL */ `query ListPendingAppoitments(
  $filter: ModelPendingAppoitmentsFilterInput
  $limit: Int
  $nextToken: String
) {
  listPendingAppoitments(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListPendingAppoitmentsQueryVariables,
  APITypes.ListPendingAppoitmentsQuery
>;
export const listProjectComments = /* GraphQL */ `query ListProjectComments(
  $filter: ModelProjectCommentsFilterInput
  $limit: Int
  $nextToken: String
) {
  listProjectComments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
      projectId
      updatedAt
      updatedDate
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListProjectCommentsQueryVariables,
  APITypes.ListProjectCommentsQuery
>;
export const listProjectMilestones = /* GraphQL */ `query ListProjectMilestones(
  $filter: ModelProjectMilestonesFilterInput
  $limit: Int
  $nextToken: String
) {
  listProjectMilestones(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
      projectId
      updatedAt
      updatedDate
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListProjectMilestonesQueryVariables,
  APITypes.ListProjectMilestonesQuery
>;
export const listProjectPaymentTerms = /* GraphQL */ `query ListProjectPaymentTerms(
  $filter: ModelProjectPaymentTermsFilterInput
  $limit: Int
  $nextToken: String
) {
  listProjectPaymentTerms(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
      projectId
      type
      updatedAt
      updatedDate
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListProjectPaymentTermsQueryVariables,
  APITypes.ListProjectPaymentTermsQuery
>;
export const listProjectPermissions = /* GraphQL */ `query ListProjectPermissions(
  $filter: ModelProjectPermissionsFilterInput
  $limit: Int
  $nextToken: String
) {
  listProjectPermissions(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      createdAt
      id
      na
      owner
      permissions
      projectId
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListProjectPermissionsQueryVariables,
  APITypes.ListProjectPermissionsQuery
>;
export const listProjects = /* GraphQL */ `query ListProjects(
  $filter: ModelProjectsFilterInput
  $limit: Int
  $nextToken: String
) {
  listProjects(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListProjectsQueryVariables,
  APITypes.ListProjectsQuery
>;
export const listProperties = /* GraphQL */ `query ListProperties(
  $filter: ModelPropertiesFilterInput
  $limit: Int
  $nextToken: String
) {
  listProperties(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListPropertiesQueryVariables,
  APITypes.ListPropertiesQuery
>;
export const listQuoteItems = /* GraphQL */ `query ListQuoteItems(
  $filter: ModelQuoteItemsFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuoteItems(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
      projectId
      quantity
      recommendItem
      total
      type
      unitPrice
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuoteItemsQueryVariables,
  APITypes.ListQuoteItemsQuery
>;
export const listQuotes = /* GraphQL */ `query ListQuotes(
  $filter: ModelQuotesFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuotes(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      accountExecutive
      addressId
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuotesQueryVariables,
  APITypes.ListQuotesQuery
>;
export const listRequests = /* GraphQL */ `query ListRequests(
  $filter: ModelRequestsFilterInput
  $limit: Int
  $nextToken: String
) {
  listRequests(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListRequestsQueryVariables,
  APITypes.ListRequestsQuery
>;
export const listSecureConfigs = /* GraphQL */ `query ListSecureConfigs(
  $filter: ModelSecureConfigFilterInput
  $id: ID
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listSecureConfigs(
    filter: $filter
    id: $id
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSecureConfigsQueryVariables,
  APITypes.ListSecureConfigsQuery
>;
