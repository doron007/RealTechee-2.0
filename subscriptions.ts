/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateAffiliates = /* GraphQL */ `subscription OnCreateAffiliates(
  $filter: ModelSubscriptionAffiliatesFilterInput
) {
  onCreateAffiliates(filter: $filter) {
    accounting
    addressId
    communication
    company
    contactId
    createdAt
    createdDate
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
    updatedDate
    warrantyPeriod
    waterSystem
    workersCompensationInsurance
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAffiliatesSubscriptionVariables,
  APITypes.OnCreateAffiliatesSubscription
>;
export const onCreateAuditLog = /* GraphQL */ `subscription OnCreateAuditLog($filter: ModelSubscriptionAuditLogFilterInput) {
  onCreateAuditLog(filter: $filter) {
    action
    changeType
    changedFields
    createdAt
    createdDate
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
` as GeneratedSubscription<
  APITypes.OnCreateAuditLogSubscriptionVariables,
  APITypes.OnCreateAuditLogSubscription
>;
export const onCreateAuth = /* GraphQL */ `subscription OnCreateAuth($filter: ModelSubscriptionAuthFilterInput) {
  onCreateAuth(filter: $filter) {
    createdAt
    createdDate
    email
    hash
    id
    owner
    token
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAuthSubscriptionVariables,
  APITypes.OnCreateAuthSubscription
>;
export const onCreateBackOfficeAssignTo = /* GraphQL */ `subscription OnCreateBackOfficeAssignTo(
  $filter: ModelSubscriptionBackOfficeAssignToFilterInput
) {
  onCreateBackOfficeAssignTo(filter: $filter) {
    active
    contactId
    createdAt
    createdDate
    email
    id
    mobile
    name
    order
    owner
    sendEmailNotifications
    sendSmsNotifications
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateBackOfficeAssignToSubscriptionVariables,
  APITypes.OnCreateBackOfficeAssignToSubscription
>;
export const onCreateBackOfficeBookingStatuses = /* GraphQL */ `subscription OnCreateBackOfficeBookingStatuses(
  $filter: ModelSubscriptionBackOfficeBookingStatusesFilterInput
) {
  onCreateBackOfficeBookingStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateBackOfficeBookingStatusesSubscriptionVariables,
  APITypes.OnCreateBackOfficeBookingStatusesSubscription
>;
export const onCreateBackOfficeBrokerage = /* GraphQL */ `subscription OnCreateBackOfficeBrokerage(
  $filter: ModelSubscriptionBackOfficeBrokerageFilterInput
) {
  onCreateBackOfficeBrokerage(filter: $filter) {
    createdAt
    createdDate
    id
    live
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateBackOfficeBrokerageSubscriptionVariables,
  APITypes.OnCreateBackOfficeBrokerageSubscription
>;
export const onCreateBackOfficeNotifications = /* GraphQL */ `subscription OnCreateBackOfficeNotifications(
  $filter: ModelSubscriptionBackOfficeNotificationsFilterInput
) {
  onCreateBackOfficeNotifications(filter: $filter) {
    bcc
    body
    bodyAsSimpleText
    cc
    createdAt
    createdDate
    id
    key
    owner
    subject
    to
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateBackOfficeNotificationsSubscriptionVariables,
  APITypes.OnCreateBackOfficeNotificationsSubscription
>;
export const onCreateBackOfficeProducts = /* GraphQL */ `subscription OnCreateBackOfficeProducts(
  $filter: ModelSubscriptionBackOfficeProductsFilterInput
) {
  onCreateBackOfficeProducts(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateBackOfficeProductsSubscriptionVariables,
  APITypes.OnCreateBackOfficeProductsSubscription
>;
export const onCreateBackOfficeProjectStatuses = /* GraphQL */ `subscription OnCreateBackOfficeProjectStatuses(
  $filter: ModelSubscriptionBackOfficeProjectStatusesFilterInput
) {
  onCreateBackOfficeProjectStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateBackOfficeProjectStatusesSubscriptionVariables,
  APITypes.OnCreateBackOfficeProjectStatusesSubscription
>;
export const onCreateBackOfficeQuoteStatuses = /* GraphQL */ `subscription OnCreateBackOfficeQuoteStatuses(
  $filter: ModelSubscriptionBackOfficeQuoteStatusesFilterInput
) {
  onCreateBackOfficeQuoteStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateBackOfficeQuoteStatusesSubscriptionVariables,
  APITypes.OnCreateBackOfficeQuoteStatusesSubscription
>;
export const onCreateBackOfficeRequestStatuses = /* GraphQL */ `subscription OnCreateBackOfficeRequestStatuses(
  $filter: ModelSubscriptionBackOfficeRequestStatusesFilterInput
) {
  onCreateBackOfficeRequestStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateBackOfficeRequestStatusesSubscriptionVariables,
  APITypes.OnCreateBackOfficeRequestStatusesSubscription
>;
export const onCreateBackOfficeRoleTypes = /* GraphQL */ `subscription OnCreateBackOfficeRoleTypes(
  $filter: ModelSubscriptionBackOfficeRoleTypesFilterInput
) {
  onCreateBackOfficeRoleTypes(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateBackOfficeRoleTypesSubscriptionVariables,
  APITypes.OnCreateBackOfficeRoleTypesSubscription
>;
export const onCreateContactAuditLog = /* GraphQL */ `subscription OnCreateContactAuditLog(
  $filter: ModelSubscriptionContactAuditLogFilterInput
) {
  onCreateContactAuditLog(filter: $filter) {
    action
    changeType
    contactId
    createdAt
    createdDate
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
` as GeneratedSubscription<
  APITypes.OnCreateContactAuditLogSubscriptionVariables,
  APITypes.OnCreateContactAuditLogSubscription
>;
export const onCreateContactUs = /* GraphQL */ `subscription OnCreateContactUs($filter: ModelSubscriptionContactUsFilterInput) {
  onCreateContactUs(filter: $filter) {
    addressId
    contactId
    createdAt
    createdDate
    id
    message
    owner
    product
    subject
    submissionTime
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateContactUsSubscriptionVariables,
  APITypes.OnCreateContactUsSubscription
>;
export const onCreateContacts = /* GraphQL */ `subscription OnCreateContacts($filter: ModelSubscriptionContactsFilterInput) {
  onCreateContacts(filter: $filter) {
    agentProjects {
      nextToken
      __typename
    }
    agentQuotes {
      nextToken
      __typename
    }
    brokerage
    company
    createdAt
    createdDate
    email
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
    lastName
    mobile
    owner
    phone
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateContactsSubscriptionVariables,
  APITypes.OnCreateContactsSubscription
>;
export const onCreateESignatureDocuments = /* GraphQL */ `subscription OnCreateESignatureDocuments(
  $filter: ModelSubscriptionESignatureDocumentsFilterInput
) {
  onCreateESignatureDocuments(filter: $filter) {
    addressId
    createdAt
    createdDate
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
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateESignatureDocumentsSubscriptionVariables,
  APITypes.OnCreateESignatureDocumentsSubscription
>;
export const onCreateLegal = /* GraphQL */ `subscription OnCreateLegal($filter: ModelSubscriptionLegalFilterInput) {
  onCreateLegal(filter: $filter) {
    content
    createdAt
    createdDate
    documentId
    id
    legalDocumentId
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateLegalSubscriptionVariables,
  APITypes.OnCreateLegalSubscription
>;
export const onCreateMemberSignature = /* GraphQL */ `subscription OnCreateMemberSignature(
  $filter: ModelSubscriptionMemberSignatureFilterInput
) {
  onCreateMemberSignature(filter: $filter) {
    createdAt
    createdDate
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
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateMemberSignatureSubscriptionVariables,
  APITypes.OnCreateMemberSignatureSubscription
>;
export const onCreatePendingAppoitments = /* GraphQL */ `subscription OnCreatePendingAppoitments(
  $filter: ModelSubscriptionPendingAppoitmentsFilterInput
) {
  onCreatePendingAppoitments(filter: $filter) {
    agentEmail
    agentName
    agentPhone
    assignedDate
    assignedTo
    brokerage
    createdAt
    createdDate
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
    updatedDate
    visitorId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreatePendingAppoitmentsSubscriptionVariables,
  APITypes.OnCreatePendingAppoitmentsSubscription
>;
export const onCreateProjectComments = /* GraphQL */ `subscription OnCreateProjectComments(
  $filter: ModelSubscriptionProjectCommentsFilterInput
  $owner: String
) {
  onCreateProjectComments(filter: $filter, owner: $owner) {
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
      projectID
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
` as GeneratedSubscription<
  APITypes.OnCreateProjectCommentsSubscriptionVariables,
  APITypes.OnCreateProjectCommentsSubscription
>;
export const onCreateProjectMilestones = /* GraphQL */ `subscription OnCreateProjectMilestones(
  $filter: ModelSubscriptionProjectMilestonesFilterInput
) {
  onCreateProjectMilestones(filter: $filter) {
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
      projectID
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
` as GeneratedSubscription<
  APITypes.OnCreateProjectMilestonesSubscriptionVariables,
  APITypes.OnCreateProjectMilestonesSubscription
>;
export const onCreateProjectPaymentTerms = /* GraphQL */ `subscription OnCreateProjectPaymentTerms(
  $filter: ModelSubscriptionProjectPaymentTermsFilterInput
) {
  onCreateProjectPaymentTerms(filter: $filter) {
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
      projectID
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
    projectID
    type
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateProjectPaymentTermsSubscriptionVariables,
  APITypes.OnCreateProjectPaymentTermsSubscription
>;
export const onCreateProjectPermissions = /* GraphQL */ `subscription OnCreateProjectPermissions(
  $filter: ModelSubscriptionProjectPermissionsFilterInput
) {
  onCreateProjectPermissions(filter: $filter) {
    createdAt
    createdDate
    id
    na
    owner
    permissions
    projectId
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateProjectPermissionsSubscriptionVariables,
  APITypes.OnCreateProjectPermissionsSubscription
>;
export const onCreateProjects = /* GraphQL */ `subscription OnCreateProjects($filter: ModelSubscriptionProjectsFilterInput) {
  onCreateProjects(filter: $filter) {
    accountExecutive
    addedValue
    address {
      bathrooms
      bedrooms
      city
      createdAt
      createdDate
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
      updatedDate
      yearBuilt
      zillowLink
      zip
      __typename
    }
    addressId
    agent {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
      __typename
    }
    homeowner2 {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
      __typename
    }
    homeowner2ContactId
    homeowner3 {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
    projectID
    projectManagerEmailList
    projectManagerPhone
    propertyType
    proposalDate
    quoteId
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
` as GeneratedSubscription<
  APITypes.OnCreateProjectsSubscriptionVariables,
  APITypes.OnCreateProjectsSubscription
>;
export const onCreateProperties = /* GraphQL */ `subscription OnCreateProperties(
  $filter: ModelSubscriptionPropertiesFilterInput
) {
  onCreateProperties(filter: $filter) {
    bathrooms
    bedrooms
    city
    createdAt
    createdDate
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
    updatedDate
    yearBuilt
    zillowLink
    zip
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreatePropertiesSubscriptionVariables,
  APITypes.OnCreatePropertiesSubscription
>;
export const onCreateQuoteItems = /* GraphQL */ `subscription OnCreateQuoteItems(
  $filter: ModelSubscriptionQuoteItemsFilterInput
) {
  onCreateQuoteItems(filter: $filter) {
    cost
    createdAt
    createdDate
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
    projectID
    quantity
    recommendItem
    total
    type
    unitPrice
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateQuoteItemsSubscriptionVariables,
  APITypes.OnCreateQuoteItemsSubscription
>;
export const onCreateQuotes = /* GraphQL */ `subscription OnCreateQuotes($filter: ModelSubscriptionQuotesFilterInput) {
  onCreateQuotes(filter: $filter) {
    accountExecutive
    addressId
    agent {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
    createdDate
    creditScore
    document
    documents
    eSignatureDocumentId
    estimatedWeeksDuration
    expiredDate
    floors
    homeowner {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
      projectID
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
    updatedDate
    viewedBy
    visitDate
    visitorId
    yearBuilt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateQuotesSubscriptionVariables,
  APITypes.OnCreateQuotesSubscription
>;
export const onCreateRequests = /* GraphQL */ `subscription OnCreateRequests($filter: ModelSubscriptionRequestsFilterInput) {
  onCreateRequests(filter: $filter) {
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
    createdDate
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
    updatedDate
    uploadedMedia
    uploadedVideos
    uplodedDocuments
    virtualWalkthrough
    visitDate
    visitorId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateRequestsSubscriptionVariables,
  APITypes.OnCreateRequestsSubscription
>;
export const onDeleteAffiliates = /* GraphQL */ `subscription OnDeleteAffiliates(
  $filter: ModelSubscriptionAffiliatesFilterInput
) {
  onDeleteAffiliates(filter: $filter) {
    accounting
    addressId
    communication
    company
    contactId
    createdAt
    createdDate
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
    updatedDate
    warrantyPeriod
    waterSystem
    workersCompensationInsurance
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAffiliatesSubscriptionVariables,
  APITypes.OnDeleteAffiliatesSubscription
>;
export const onDeleteAuditLog = /* GraphQL */ `subscription OnDeleteAuditLog($filter: ModelSubscriptionAuditLogFilterInput) {
  onDeleteAuditLog(filter: $filter) {
    action
    changeType
    changedFields
    createdAt
    createdDate
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
` as GeneratedSubscription<
  APITypes.OnDeleteAuditLogSubscriptionVariables,
  APITypes.OnDeleteAuditLogSubscription
>;
export const onDeleteAuth = /* GraphQL */ `subscription OnDeleteAuth($filter: ModelSubscriptionAuthFilterInput) {
  onDeleteAuth(filter: $filter) {
    createdAt
    createdDate
    email
    hash
    id
    owner
    token
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAuthSubscriptionVariables,
  APITypes.OnDeleteAuthSubscription
>;
export const onDeleteBackOfficeAssignTo = /* GraphQL */ `subscription OnDeleteBackOfficeAssignTo(
  $filter: ModelSubscriptionBackOfficeAssignToFilterInput
) {
  onDeleteBackOfficeAssignTo(filter: $filter) {
    active
    contactId
    createdAt
    createdDate
    email
    id
    mobile
    name
    order
    owner
    sendEmailNotifications
    sendSmsNotifications
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteBackOfficeAssignToSubscriptionVariables,
  APITypes.OnDeleteBackOfficeAssignToSubscription
>;
export const onDeleteBackOfficeBookingStatuses = /* GraphQL */ `subscription OnDeleteBackOfficeBookingStatuses(
  $filter: ModelSubscriptionBackOfficeBookingStatusesFilterInput
) {
  onDeleteBackOfficeBookingStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteBackOfficeBookingStatusesSubscriptionVariables,
  APITypes.OnDeleteBackOfficeBookingStatusesSubscription
>;
export const onDeleteBackOfficeBrokerage = /* GraphQL */ `subscription OnDeleteBackOfficeBrokerage(
  $filter: ModelSubscriptionBackOfficeBrokerageFilterInput
) {
  onDeleteBackOfficeBrokerage(filter: $filter) {
    createdAt
    createdDate
    id
    live
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteBackOfficeBrokerageSubscriptionVariables,
  APITypes.OnDeleteBackOfficeBrokerageSubscription
>;
export const onDeleteBackOfficeNotifications = /* GraphQL */ `subscription OnDeleteBackOfficeNotifications(
  $filter: ModelSubscriptionBackOfficeNotificationsFilterInput
) {
  onDeleteBackOfficeNotifications(filter: $filter) {
    bcc
    body
    bodyAsSimpleText
    cc
    createdAt
    createdDate
    id
    key
    owner
    subject
    to
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteBackOfficeNotificationsSubscriptionVariables,
  APITypes.OnDeleteBackOfficeNotificationsSubscription
>;
export const onDeleteBackOfficeProducts = /* GraphQL */ `subscription OnDeleteBackOfficeProducts(
  $filter: ModelSubscriptionBackOfficeProductsFilterInput
) {
  onDeleteBackOfficeProducts(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteBackOfficeProductsSubscriptionVariables,
  APITypes.OnDeleteBackOfficeProductsSubscription
>;
export const onDeleteBackOfficeProjectStatuses = /* GraphQL */ `subscription OnDeleteBackOfficeProjectStatuses(
  $filter: ModelSubscriptionBackOfficeProjectStatusesFilterInput
) {
  onDeleteBackOfficeProjectStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteBackOfficeProjectStatusesSubscriptionVariables,
  APITypes.OnDeleteBackOfficeProjectStatusesSubscription
>;
export const onDeleteBackOfficeQuoteStatuses = /* GraphQL */ `subscription OnDeleteBackOfficeQuoteStatuses(
  $filter: ModelSubscriptionBackOfficeQuoteStatusesFilterInput
) {
  onDeleteBackOfficeQuoteStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteBackOfficeQuoteStatusesSubscriptionVariables,
  APITypes.OnDeleteBackOfficeQuoteStatusesSubscription
>;
export const onDeleteBackOfficeRequestStatuses = /* GraphQL */ `subscription OnDeleteBackOfficeRequestStatuses(
  $filter: ModelSubscriptionBackOfficeRequestStatusesFilterInput
) {
  onDeleteBackOfficeRequestStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteBackOfficeRequestStatusesSubscriptionVariables,
  APITypes.OnDeleteBackOfficeRequestStatusesSubscription
>;
export const onDeleteBackOfficeRoleTypes = /* GraphQL */ `subscription OnDeleteBackOfficeRoleTypes(
  $filter: ModelSubscriptionBackOfficeRoleTypesFilterInput
) {
  onDeleteBackOfficeRoleTypes(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteBackOfficeRoleTypesSubscriptionVariables,
  APITypes.OnDeleteBackOfficeRoleTypesSubscription
>;
export const onDeleteContactAuditLog = /* GraphQL */ `subscription OnDeleteContactAuditLog(
  $filter: ModelSubscriptionContactAuditLogFilterInput
) {
  onDeleteContactAuditLog(filter: $filter) {
    action
    changeType
    contactId
    createdAt
    createdDate
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
` as GeneratedSubscription<
  APITypes.OnDeleteContactAuditLogSubscriptionVariables,
  APITypes.OnDeleteContactAuditLogSubscription
>;
export const onDeleteContactUs = /* GraphQL */ `subscription OnDeleteContactUs($filter: ModelSubscriptionContactUsFilterInput) {
  onDeleteContactUs(filter: $filter) {
    addressId
    contactId
    createdAt
    createdDate
    id
    message
    owner
    product
    subject
    submissionTime
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteContactUsSubscriptionVariables,
  APITypes.OnDeleteContactUsSubscription
>;
export const onDeleteContacts = /* GraphQL */ `subscription OnDeleteContacts($filter: ModelSubscriptionContactsFilterInput) {
  onDeleteContacts(filter: $filter) {
    agentProjects {
      nextToken
      __typename
    }
    agentQuotes {
      nextToken
      __typename
    }
    brokerage
    company
    createdAt
    createdDate
    email
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
    lastName
    mobile
    owner
    phone
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteContactsSubscriptionVariables,
  APITypes.OnDeleteContactsSubscription
>;
export const onDeleteESignatureDocuments = /* GraphQL */ `subscription OnDeleteESignatureDocuments(
  $filter: ModelSubscriptionESignatureDocumentsFilterInput
) {
  onDeleteESignatureDocuments(filter: $filter) {
    addressId
    createdAt
    createdDate
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
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteESignatureDocumentsSubscriptionVariables,
  APITypes.OnDeleteESignatureDocumentsSubscription
>;
export const onDeleteLegal = /* GraphQL */ `subscription OnDeleteLegal($filter: ModelSubscriptionLegalFilterInput) {
  onDeleteLegal(filter: $filter) {
    content
    createdAt
    createdDate
    documentId
    id
    legalDocumentId
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteLegalSubscriptionVariables,
  APITypes.OnDeleteLegalSubscription
>;
export const onDeleteMemberSignature = /* GraphQL */ `subscription OnDeleteMemberSignature(
  $filter: ModelSubscriptionMemberSignatureFilterInput
) {
  onDeleteMemberSignature(filter: $filter) {
    createdAt
    createdDate
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
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteMemberSignatureSubscriptionVariables,
  APITypes.OnDeleteMemberSignatureSubscription
>;
export const onDeletePendingAppoitments = /* GraphQL */ `subscription OnDeletePendingAppoitments(
  $filter: ModelSubscriptionPendingAppoitmentsFilterInput
) {
  onDeletePendingAppoitments(filter: $filter) {
    agentEmail
    agentName
    agentPhone
    assignedDate
    assignedTo
    brokerage
    createdAt
    createdDate
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
    updatedDate
    visitorId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeletePendingAppoitmentsSubscriptionVariables,
  APITypes.OnDeletePendingAppoitmentsSubscription
>;
export const onDeleteProjectComments = /* GraphQL */ `subscription OnDeleteProjectComments(
  $filter: ModelSubscriptionProjectCommentsFilterInput
  $owner: String
) {
  onDeleteProjectComments(filter: $filter, owner: $owner) {
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
      projectID
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
` as GeneratedSubscription<
  APITypes.OnDeleteProjectCommentsSubscriptionVariables,
  APITypes.OnDeleteProjectCommentsSubscription
>;
export const onDeleteProjectMilestones = /* GraphQL */ `subscription OnDeleteProjectMilestones(
  $filter: ModelSubscriptionProjectMilestonesFilterInput
) {
  onDeleteProjectMilestones(filter: $filter) {
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
      projectID
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
` as GeneratedSubscription<
  APITypes.OnDeleteProjectMilestonesSubscriptionVariables,
  APITypes.OnDeleteProjectMilestonesSubscription
>;
export const onDeleteProjectPaymentTerms = /* GraphQL */ `subscription OnDeleteProjectPaymentTerms(
  $filter: ModelSubscriptionProjectPaymentTermsFilterInput
) {
  onDeleteProjectPaymentTerms(filter: $filter) {
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
      projectID
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
    projectID
    type
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteProjectPaymentTermsSubscriptionVariables,
  APITypes.OnDeleteProjectPaymentTermsSubscription
>;
export const onDeleteProjectPermissions = /* GraphQL */ `subscription OnDeleteProjectPermissions(
  $filter: ModelSubscriptionProjectPermissionsFilterInput
) {
  onDeleteProjectPermissions(filter: $filter) {
    createdAt
    createdDate
    id
    na
    owner
    permissions
    projectId
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteProjectPermissionsSubscriptionVariables,
  APITypes.OnDeleteProjectPermissionsSubscription
>;
export const onDeleteProjects = /* GraphQL */ `subscription OnDeleteProjects($filter: ModelSubscriptionProjectsFilterInput) {
  onDeleteProjects(filter: $filter) {
    accountExecutive
    addedValue
    address {
      bathrooms
      bedrooms
      city
      createdAt
      createdDate
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
      updatedDate
      yearBuilt
      zillowLink
      zip
      __typename
    }
    addressId
    agent {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
      __typename
    }
    homeowner2 {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
      __typename
    }
    homeowner2ContactId
    homeowner3 {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
    projectID
    projectManagerEmailList
    projectManagerPhone
    propertyType
    proposalDate
    quoteId
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
` as GeneratedSubscription<
  APITypes.OnDeleteProjectsSubscriptionVariables,
  APITypes.OnDeleteProjectsSubscription
>;
export const onDeleteProperties = /* GraphQL */ `subscription OnDeleteProperties(
  $filter: ModelSubscriptionPropertiesFilterInput
) {
  onDeleteProperties(filter: $filter) {
    bathrooms
    bedrooms
    city
    createdAt
    createdDate
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
    updatedDate
    yearBuilt
    zillowLink
    zip
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeletePropertiesSubscriptionVariables,
  APITypes.OnDeletePropertiesSubscription
>;
export const onDeleteQuoteItems = /* GraphQL */ `subscription OnDeleteQuoteItems(
  $filter: ModelSubscriptionQuoteItemsFilterInput
) {
  onDeleteQuoteItems(filter: $filter) {
    cost
    createdAt
    createdDate
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
    projectID
    quantity
    recommendItem
    total
    type
    unitPrice
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteQuoteItemsSubscriptionVariables,
  APITypes.OnDeleteQuoteItemsSubscription
>;
export const onDeleteQuotes = /* GraphQL */ `subscription OnDeleteQuotes($filter: ModelSubscriptionQuotesFilterInput) {
  onDeleteQuotes(filter: $filter) {
    accountExecutive
    addressId
    agent {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
    createdDate
    creditScore
    document
    documents
    eSignatureDocumentId
    estimatedWeeksDuration
    expiredDate
    floors
    homeowner {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
      projectID
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
    updatedDate
    viewedBy
    visitDate
    visitorId
    yearBuilt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteQuotesSubscriptionVariables,
  APITypes.OnDeleteQuotesSubscription
>;
export const onDeleteRequests = /* GraphQL */ `subscription OnDeleteRequests($filter: ModelSubscriptionRequestsFilterInput) {
  onDeleteRequests(filter: $filter) {
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
    createdDate
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
    updatedDate
    uploadedMedia
    uploadedVideos
    uplodedDocuments
    virtualWalkthrough
    visitDate
    visitorId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteRequestsSubscriptionVariables,
  APITypes.OnDeleteRequestsSubscription
>;
export const onUpdateAffiliates = /* GraphQL */ `subscription OnUpdateAffiliates(
  $filter: ModelSubscriptionAffiliatesFilterInput
) {
  onUpdateAffiliates(filter: $filter) {
    accounting
    addressId
    communication
    company
    contactId
    createdAt
    createdDate
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
    updatedDate
    warrantyPeriod
    waterSystem
    workersCompensationInsurance
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAffiliatesSubscriptionVariables,
  APITypes.OnUpdateAffiliatesSubscription
>;
export const onUpdateAuditLog = /* GraphQL */ `subscription OnUpdateAuditLog($filter: ModelSubscriptionAuditLogFilterInput) {
  onUpdateAuditLog(filter: $filter) {
    action
    changeType
    changedFields
    createdAt
    createdDate
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
` as GeneratedSubscription<
  APITypes.OnUpdateAuditLogSubscriptionVariables,
  APITypes.OnUpdateAuditLogSubscription
>;
export const onUpdateAuth = /* GraphQL */ `subscription OnUpdateAuth($filter: ModelSubscriptionAuthFilterInput) {
  onUpdateAuth(filter: $filter) {
    createdAt
    createdDate
    email
    hash
    id
    owner
    token
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAuthSubscriptionVariables,
  APITypes.OnUpdateAuthSubscription
>;
export const onUpdateBackOfficeAssignTo = /* GraphQL */ `subscription OnUpdateBackOfficeAssignTo(
  $filter: ModelSubscriptionBackOfficeAssignToFilterInput
) {
  onUpdateBackOfficeAssignTo(filter: $filter) {
    active
    contactId
    createdAt
    createdDate
    email
    id
    mobile
    name
    order
    owner
    sendEmailNotifications
    sendSmsNotifications
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateBackOfficeAssignToSubscriptionVariables,
  APITypes.OnUpdateBackOfficeAssignToSubscription
>;
export const onUpdateBackOfficeBookingStatuses = /* GraphQL */ `subscription OnUpdateBackOfficeBookingStatuses(
  $filter: ModelSubscriptionBackOfficeBookingStatusesFilterInput
) {
  onUpdateBackOfficeBookingStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateBackOfficeBookingStatusesSubscriptionVariables,
  APITypes.OnUpdateBackOfficeBookingStatusesSubscription
>;
export const onUpdateBackOfficeBrokerage = /* GraphQL */ `subscription OnUpdateBackOfficeBrokerage(
  $filter: ModelSubscriptionBackOfficeBrokerageFilterInput
) {
  onUpdateBackOfficeBrokerage(filter: $filter) {
    createdAt
    createdDate
    id
    live
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateBackOfficeBrokerageSubscriptionVariables,
  APITypes.OnUpdateBackOfficeBrokerageSubscription
>;
export const onUpdateBackOfficeNotifications = /* GraphQL */ `subscription OnUpdateBackOfficeNotifications(
  $filter: ModelSubscriptionBackOfficeNotificationsFilterInput
) {
  onUpdateBackOfficeNotifications(filter: $filter) {
    bcc
    body
    bodyAsSimpleText
    cc
    createdAt
    createdDate
    id
    key
    owner
    subject
    to
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateBackOfficeNotificationsSubscriptionVariables,
  APITypes.OnUpdateBackOfficeNotificationsSubscription
>;
export const onUpdateBackOfficeProducts = /* GraphQL */ `subscription OnUpdateBackOfficeProducts(
  $filter: ModelSubscriptionBackOfficeProductsFilterInput
) {
  onUpdateBackOfficeProducts(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateBackOfficeProductsSubscriptionVariables,
  APITypes.OnUpdateBackOfficeProductsSubscription
>;
export const onUpdateBackOfficeProjectStatuses = /* GraphQL */ `subscription OnUpdateBackOfficeProjectStatuses(
  $filter: ModelSubscriptionBackOfficeProjectStatusesFilterInput
) {
  onUpdateBackOfficeProjectStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateBackOfficeProjectStatusesSubscriptionVariables,
  APITypes.OnUpdateBackOfficeProjectStatusesSubscription
>;
export const onUpdateBackOfficeQuoteStatuses = /* GraphQL */ `subscription OnUpdateBackOfficeQuoteStatuses(
  $filter: ModelSubscriptionBackOfficeQuoteStatusesFilterInput
) {
  onUpdateBackOfficeQuoteStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateBackOfficeQuoteStatusesSubscriptionVariables,
  APITypes.OnUpdateBackOfficeQuoteStatusesSubscription
>;
export const onUpdateBackOfficeRequestStatuses = /* GraphQL */ `subscription OnUpdateBackOfficeRequestStatuses(
  $filter: ModelSubscriptionBackOfficeRequestStatusesFilterInput
) {
  onUpdateBackOfficeRequestStatuses(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateBackOfficeRequestStatusesSubscriptionVariables,
  APITypes.OnUpdateBackOfficeRequestStatusesSubscription
>;
export const onUpdateBackOfficeRoleTypes = /* GraphQL */ `subscription OnUpdateBackOfficeRoleTypes(
  $filter: ModelSubscriptionBackOfficeRoleTypesFilterInput
) {
  onUpdateBackOfficeRoleTypes(filter: $filter) {
    createdAt
    createdDate
    id
    order
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateBackOfficeRoleTypesSubscriptionVariables,
  APITypes.OnUpdateBackOfficeRoleTypesSubscription
>;
export const onUpdateContactAuditLog = /* GraphQL */ `subscription OnUpdateContactAuditLog(
  $filter: ModelSubscriptionContactAuditLogFilterInput
) {
  onUpdateContactAuditLog(filter: $filter) {
    action
    changeType
    contactId
    createdAt
    createdDate
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
` as GeneratedSubscription<
  APITypes.OnUpdateContactAuditLogSubscriptionVariables,
  APITypes.OnUpdateContactAuditLogSubscription
>;
export const onUpdateContactUs = /* GraphQL */ `subscription OnUpdateContactUs($filter: ModelSubscriptionContactUsFilterInput) {
  onUpdateContactUs(filter: $filter) {
    addressId
    contactId
    createdAt
    createdDate
    id
    message
    owner
    product
    subject
    submissionTime
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateContactUsSubscriptionVariables,
  APITypes.OnUpdateContactUsSubscription
>;
export const onUpdateContacts = /* GraphQL */ `subscription OnUpdateContacts($filter: ModelSubscriptionContactsFilterInput) {
  onUpdateContacts(filter: $filter) {
    agentProjects {
      nextToken
      __typename
    }
    agentQuotes {
      nextToken
      __typename
    }
    brokerage
    company
    createdAt
    createdDate
    email
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
    lastName
    mobile
    owner
    phone
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateContactsSubscriptionVariables,
  APITypes.OnUpdateContactsSubscription
>;
export const onUpdateESignatureDocuments = /* GraphQL */ `subscription OnUpdateESignatureDocuments(
  $filter: ModelSubscriptionESignatureDocumentsFilterInput
) {
  onUpdateESignatureDocuments(filter: $filter) {
    addressId
    createdAt
    createdDate
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
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateESignatureDocumentsSubscriptionVariables,
  APITypes.OnUpdateESignatureDocumentsSubscription
>;
export const onUpdateLegal = /* GraphQL */ `subscription OnUpdateLegal($filter: ModelSubscriptionLegalFilterInput) {
  onUpdateLegal(filter: $filter) {
    content
    createdAt
    createdDate
    documentId
    id
    legalDocumentId
    owner
    title
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateLegalSubscriptionVariables,
  APITypes.OnUpdateLegalSubscription
>;
export const onUpdateMemberSignature = /* GraphQL */ `subscription OnUpdateMemberSignature(
  $filter: ModelSubscriptionMemberSignatureFilterInput
) {
  onUpdateMemberSignature(filter: $filter) {
    createdAt
    createdDate
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
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateMemberSignatureSubscriptionVariables,
  APITypes.OnUpdateMemberSignatureSubscription
>;
export const onUpdatePendingAppoitments = /* GraphQL */ `subscription OnUpdatePendingAppoitments(
  $filter: ModelSubscriptionPendingAppoitmentsFilterInput
) {
  onUpdatePendingAppoitments(filter: $filter) {
    agentEmail
    agentName
    agentPhone
    assignedDate
    assignedTo
    brokerage
    createdAt
    createdDate
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
    updatedDate
    visitorId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdatePendingAppoitmentsSubscriptionVariables,
  APITypes.OnUpdatePendingAppoitmentsSubscription
>;
export const onUpdateProjectComments = /* GraphQL */ `subscription OnUpdateProjectComments(
  $filter: ModelSubscriptionProjectCommentsFilterInput
  $owner: String
) {
  onUpdateProjectComments(filter: $filter, owner: $owner) {
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
      projectID
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
` as GeneratedSubscription<
  APITypes.OnUpdateProjectCommentsSubscriptionVariables,
  APITypes.OnUpdateProjectCommentsSubscription
>;
export const onUpdateProjectMilestones = /* GraphQL */ `subscription OnUpdateProjectMilestones(
  $filter: ModelSubscriptionProjectMilestonesFilterInput
) {
  onUpdateProjectMilestones(filter: $filter) {
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
      projectID
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
` as GeneratedSubscription<
  APITypes.OnUpdateProjectMilestonesSubscriptionVariables,
  APITypes.OnUpdateProjectMilestonesSubscription
>;
export const onUpdateProjectPaymentTerms = /* GraphQL */ `subscription OnUpdateProjectPaymentTerms(
  $filter: ModelSubscriptionProjectPaymentTermsFilterInput
) {
  onUpdateProjectPaymentTerms(filter: $filter) {
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
      projectID
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
    projectID
    type
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateProjectPaymentTermsSubscriptionVariables,
  APITypes.OnUpdateProjectPaymentTermsSubscription
>;
export const onUpdateProjectPermissions = /* GraphQL */ `subscription OnUpdateProjectPermissions(
  $filter: ModelSubscriptionProjectPermissionsFilterInput
) {
  onUpdateProjectPermissions(filter: $filter) {
    createdAt
    createdDate
    id
    na
    owner
    permissions
    projectId
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateProjectPermissionsSubscriptionVariables,
  APITypes.OnUpdateProjectPermissionsSubscription
>;
export const onUpdateProjects = /* GraphQL */ `subscription OnUpdateProjects($filter: ModelSubscriptionProjectsFilterInput) {
  onUpdateProjects(filter: $filter) {
    accountExecutive
    addedValue
    address {
      bathrooms
      bedrooms
      city
      createdAt
      createdDate
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
      updatedDate
      yearBuilt
      zillowLink
      zip
      __typename
    }
    addressId
    agent {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
      __typename
    }
    homeowner2 {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
      __typename
    }
    homeowner2ContactId
    homeowner3 {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
    projectID
    projectManagerEmailList
    projectManagerPhone
    propertyType
    proposalDate
    quoteId
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
` as GeneratedSubscription<
  APITypes.OnUpdateProjectsSubscriptionVariables,
  APITypes.OnUpdateProjectsSubscription
>;
export const onUpdateProperties = /* GraphQL */ `subscription OnUpdateProperties(
  $filter: ModelSubscriptionPropertiesFilterInput
) {
  onUpdateProperties(filter: $filter) {
    bathrooms
    bedrooms
    city
    createdAt
    createdDate
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
    updatedDate
    yearBuilt
    zillowLink
    zip
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdatePropertiesSubscriptionVariables,
  APITypes.OnUpdatePropertiesSubscription
>;
export const onUpdateQuoteItems = /* GraphQL */ `subscription OnUpdateQuoteItems(
  $filter: ModelSubscriptionQuoteItemsFilterInput
) {
  onUpdateQuoteItems(filter: $filter) {
    cost
    createdAt
    createdDate
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
    projectID
    quantity
    recommendItem
    total
    type
    unitPrice
    updatedAt
    updatedDate
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateQuoteItemsSubscriptionVariables,
  APITypes.OnUpdateQuoteItemsSubscription
>;
export const onUpdateQuotes = /* GraphQL */ `subscription OnUpdateQuotes($filter: ModelSubscriptionQuotesFilterInput) {
  onUpdateQuotes(filter: $filter) {
    accountExecutive
    addressId
    agent {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
    createdDate
    creditScore
    document
    documents
    eSignatureDocumentId
    estimatedWeeksDuration
    expiredDate
    floors
    homeowner {
      brokerage
      company
      createdAt
      createdDate
      email
      firstName
      fullName
      id
      lastName
      mobile
      owner
      phone
      updatedAt
      updatedDate
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
      projectID
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
    updatedDate
    viewedBy
    visitDate
    visitorId
    yearBuilt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateQuotesSubscriptionVariables,
  APITypes.OnUpdateQuotesSubscription
>;
export const onUpdateRequests = /* GraphQL */ `subscription OnUpdateRequests($filter: ModelSubscriptionRequestsFilterInput) {
  onUpdateRequests(filter: $filter) {
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
    createdDate
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
    updatedDate
    uploadedMedia
    uploadedVideos
    uplodedDocuments
    virtualWalkthrough
    visitDate
    visitorId
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateRequestsSubscriptionVariables,
  APITypes.OnUpdateRequestsSubscription
>;
