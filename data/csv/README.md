# CSV Files Schema Documentation

This document provides a comprehensive list of columns for each CSV file in the data structure.

## Common Patterns

Most tables include standard metadata columns:
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner

## File Schemas

### 1. Affiliates.csv
- ID
- Title
- Company
- Service Type ['Service Type' -> 'serviceType']
- Name
- Email
- Phone
- Full Address ['Full Address' -> 'fullAddress']
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Worker's Compensation Ins. ['Worker's Compensation Ins.' -> 'workersCompensationInsurance']
- License
- Environmental Factor ['Environmental Factor' -> 'environmentalFactor']
- OSHA Compliance ['OSHA Compliance' -> 'oshaCompliance']
- Signed NDA ['Signed NDA' -> 'signedNda']
- Safety Plan ['Safety Plan' -> 'safetyPlan']
- Water System ['Water System' -> 'waterSystem']
- \# of Employees ['# of Employees' -> 'numEmployees']
- General Guidelines ['General Guidelines' -> 'generalGuidelines']
- Communication
- Material Utilization ['Material Utilization' -> 'materialUtilization']
- Quality Assurance ['Quality Assurance' -> 'qualityAssurance']
- Project Remnant List ['Project Remnant List' -> 'projectRemnantList']
- Warranty Period ['Warranty Period' -> 'warrantyPeriod']
- Accounting
- Qualifier Name ['Qualifier Name' -> 'qualifierName']
- Date
- Qualfier Signature ['Qualfier Signature' -> 'qualifierSignature']
- 92_SLA (All) [Delete]
- 92_SLA (Company, Email) [Delete]
- link-sla-2-name [Delete]

### 2. Auth.csv
- Owner
- Email
- Hash
- Token
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']

### 3. BackOffice_AssignTo.csv
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Name
- Email
- Mobile
- sendEmailNotifications
- sendSmsNotifications
- Active
- order

### 4. BackOffice_BookingStatuses.csv
- Title
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Order

### 5. BackOffice_Brokerage.csv
- Title
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Order
- Live

### 6. BackOffice_Products.csv
- Title
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Order

### 7. BackOffice_ProjectStatuses.csv
- Title
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Order

### 8. ContactUs.csv
- Submission Time ['Submission Time' -> 'submissionTime']
- First Name ['First Name' -> 'firstName']
- Last Name ['Last Name' -> 'lastName']
- Email
- Address
- Subject
- Message
- Product
- Phone
- Email 2 ['Email 2' -> 'email2']
- ID
- Owner
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']

### 9. ProjectComments.csv
- Posted By ['Posted By' -> 'postedBy']
- Nickname
- Project ID ['Project ID' -> 'projectId']
- Files
- Comment
- Is Private ['Is Private' -> 'isPrivate']
- Posted By Profile Image ['Posted By Profile Image' -> 'postedByProfileImage']
- Add To Gallery ['Add To Gallery' -> 'addToGallery']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner

### 10. ProjectMilestones.csv
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Name
- Description
- Project ID ['Project ID' -> 'projectId']
- Order
- Is Complete ['Is Complete' -> 'isComplete']
- Estimated Start ['Estimated Start' -> 'estimatedStart']
- Estimated Finish ['Estimated Finish' -> 'estimatedFinish']
- Is Category ['Is Category' -> 'isCategory']
- Is Internal ['Is Internal' -> 'isInternal']

### 11. ProjectPaymentTerms.csv
- ID
- projectID
- Type
- PaymentName ['PaymentName' -> 'paymentName']
- Payment Amount ['Payment Amount' -> 'paymentAmount']
- paymentDue
- Description
- Order
- Paid
- Parent Payment ID ['Parent Payment ID' -> 'parentPaymentId']
- Is Category ['Is Category' -> 'isCategory']
- Internal
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner

### 12. QuoteItems.csv
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- projectID
- Item Name ['Item Name' -> 'itemName']
- Item Completed ['Item Completed' -> 'itemCompleted']
- Parent Stage ID ['Parent Stage ID' -> 'parentStageId']
- Order
- Is Category ['Is Category' -> 'isCategory']
- Description
- Qty
- Unit Price ['Unit Price' -> 'unitPrice']
- Total
- Type
- Recommend Item ['Recommend Item' -> 'recommendItem']
- Image
- Internal
- Margin Percent ['Margin Percent' -> 'marginPercent']
- Cost
- price

### 13. Quotes.csv
- ID
- RequestID
- Project ID ['Project ID' -> 'projectId']
- Address
- Status
- Status Image ['Status Image' -> 'statusImage']  
- Status Order ['Status Order' -> 'statusOrder']
- AssignedTo
- Assigned Date ['Assigned Date' -> 'assignedDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- AgentName ['AgentName' -> 'agentName']
- AgentPhone
- AgentEmail
- HomeownerName ['HomeownerName' -> 'homeownerName']
- HomeownerPhone ['HomeownerPhone' -> 'homeownerPhone']
- HomeownerEmail ['HomeownerEmail' -> 'homeownerEmail']
- Homeowner Name 2 ['Homeowner Name 2' -> 'homeownerName2']
- Homeowner Phone 2 ['Homeowner Phone 2' -> 'homeownerPhone2']
- Homeowner Email 2 ['Homeowner Email 2' -> 'homeownerEmail2']
- Homeowner Name 3 ['Homeowner Name 3' -> 'homeownerName3']
- Homeowner Phone 3 ['Homeowner Phone 3' -> 'homeownerPhone3'] # Note: CSV has double space
- Homeowner Email 3 ['Homeowner Email 3' -> 'homeownerEmail3']
- Quote Number ['Quote Number' -> 'quoteNumber']
- Title
- Property Full Address ['Property Full Address' -> 'propertyFullAddress']
- House Address ['House Address' -> 'houseAddress']
- State # First occurrence
- City # First occurrence
- Zip # First occurrence
- Visitor ID ['Visitor ID' -> 'visitorId']
- Pdf Generator URL ['Pdf Generator URL' -> 'pdfGeneratorUrl']
- Document
- Documents
- Images
- Budget
- Total Cost ['Total Cost' -> 'totalCost']
- Total Price ['Total Price' -> 'totalPrice']
- Product
- Operation Manager Approved ['Operation Manager Approved' -> 'operationManagerApproved']
- Underwriting Approved ['Underwriting Approved' -> 'underwritingApproved']
- Signed
- signee1Name
- Signature
- Projected Listing Price ['Projected Listing Price' -> 'projectedListingPrice']
- Loan Balance ['Loan Balance' -> 'loanBalance']
- Credit Score ['Credit Score' -> 'creditScore']
- eSignature Document ID ['eSignature Document ID' -> 'eSignatureDocumentId']
- Quote PDF url ['Quote PDF url' -> 'quotePdfUrl']
- Viewedby ['Viewedby' -> 'viewedBy']
- Associated Project ['Associated Project' -> 'associatedProject']
- Change Order ['Change Order' -> 'changeOrder']
- Request Date ['Request Date' -> 'requestDate']
- Visit Date ['Visit Date' -> 'visitDate']
- Created Date ['Created Date' -> 'createdDate']
- Operation Manager Approved Date ['Operation Manager Approved Date' -> 'operationManagerApprovedDate']
- Sent Date ['Sent Date' -> 'sentDate']
- Opened Date ['Opened Date' -> 'openedDate']
- Signed Date ['Signed Date' -> 'signedDate']
- Underwriting Approved Date ['Underwriting Approved Date' -> 'underwritingApprovedDate']
- Contracting Start Date ['Contracting Start Date' -> 'contractingStartDate']
- Contract Sent Date ['Contract Sent Date' -> 'contractSentDate']
- Contract Signed Date ['Contract Signed Date' -> 'contractSignedDate']
- Converted Date ['Converted Date' -> 'convertedDate']
- Expired Date ['Expired Date' -> 'expiredDate']
- Archived Date ['Archived Date' -> 'archivedDate']
- Rejected Date ['Rejected Date' -> 'rejectedDate']
- Brokerage
- Office Notes ['Office Notes' -> 'officeNotes']
- Reason For Archive ['Reason For Archive' -> 'reasonForArchive']
- Estimated Weeks Duration ['Estimated Weeks Duration' -> 'estimatedWeeksDuration']
- Account Executive ['Account Executive' -> 'accountExecutive']
- Bedrooms
- Year Built ['Year Built' -> 'yearBuilt']
- Floors
- Bathrooms
- Size (sqft) ['Size (sqft)' -> 'sizeSqft']
- Total Payments by Client ['Total Payments by Client' -> 'totalPaymentsByClient']
- Total Payments to GC ['Total Payments to GC' -> 'totalPaymentsToGc']
- Quote eSignature (ID) ['Quote eSignature (ID)' -> 'quoteESignatureId']
- Owner

### 14. Requests.csv
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- ID
- Status
- Status Image ['Status Image' -> 'statusImage']
- Status Order ['Status Order' -> 'statusOrder']
- Account Executive ['Account Executive' -> 'accountExecutive']
- Product
- Assigned To ['Assigned To' -> 'assignedTo']
- Assigned Date ['Assigned Date' -> 'assignedDate']
- Agent Name ['Agent Name' -> 'agentName']
- AgentPhone
- Agent Email ['Agent Email' -> 'agentEmail']
- Homeowner Full Name ['Homeowner Full Name' -> 'homeownerFullName']
- Homeowner First Name ['Homeowner First Name' -> 'homeownerFirstName']
- Homeowner Last Name ['Homeowner Last Name' -> 'homeownerLastName']
- Homeowner Phone ['Homeowner Phone' -> 'homeownerPhone']
- Homeowner Email ['Homeowner Email' -> 'homeownerEmail']
- Property Address ['Property Address' -> 'propertyAddress']
- Property Full Address ['Property Full Address' -> 'propertyFullAddress']
- House Address ['House Address' -> 'houseAddress']
- City
- State
- Zip
- Message
- Virtual Walkthrough ['Virtual Walkthrough' -> 'virtualWalkthrough']
- Budget
- Listing City ['Listing City' -> 'listingCity']
- Listing State ['Listing State' -> 'listingState']
- Listing Zip Code ['Listing Zip Code' -> 'listingZipCode']
- Relation to Property ['Relation to Property' -> 'relationToProperty']
- Uploaded Media ['Uploaded Media' -> 'uploadedMedia']
- Uploded Documents ['Uploded Documents' -> 'uploadedDocuments']  # Note: typo in original CSV
- Uploaded Videos ['Uploaded Videos' -> 'uploadedVideos']
- RT Digital Selection ['RT Digital Selection' -> 'rtDigitalSelection']
- Lead Source ['Lead Source' -> 'leadSource']
- Need Finance ['Need Finance' -> 'needFinance']
- leadFromSync
- Lead From Ventura Stone ['Lead From Ventura Stone' -> 'leadFromVenturaStone']
- Office Notes ['Office Notes' -> 'officeNotes']
- Archived
- Booking ID ['Booking ID' -> 'bookingId']
- Requested Visit Date / Time ['Requested Visit Date / Time' -> 'requestedVisitDateTime']
- Visitorid
- Visit Date ['Visit Date' -> 'visitDate']
- Move To Quoting Date ['Move To Quoting Date' -> 'moveToQuotingDate']
- Expired Date ['Expired Date' -> 'expiredDate']
- Archived Date ['Archived Date' -> 'archivedDate']
- Owner

### BackOffice_Notifications.csv
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- key
- To
- CC
- BCC
- Subject
- Body
- Body As Simple Text ['Body As Simple Text' -> 'bodyAsSimpleText']

### BackOffice_QuoteStatuses.csv
- Title
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Order

### BackOffice_RequestStatuses.csv
- Title
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Order

### BackOffice_RoleTypes.csv
- Title
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Order

### eSignatureDocuments.csv
- ID
- Signed
- Template ID ['Template ID' -> 'templateId']
- Document Data ['Document Data' -> 'documentData']
- PDF Generator URL ['PDF Generator URL' -> 'pdfGeneratorUrl']
- Document
- Signed By ['Signed By' -> 'signedBy']
- Signature
- Initials
- Address
- Quote PDF url ['Quote PDF url' -> 'quotePdfUrl']
- Signed Date ['Signed Date' -> 'signedDate']
- Signed Document ['Signed Document' -> 'signedDocument']
- Signed PDF Generator URL ['Signed PDF Generator URL' -> 'signedPdfGeneratorUrl']
- Signed Quote PDF Public URL ['Signed Quote PDF Public URL' -> 'signedQuotePdfPublicUrl']
- Homeowner Email ['Homeowner Email' -> 'homeownerEmail']
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner

### Legal.csv
- Title
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner
- Content
- 12_Legal (Document ID) [Delete] # Legacy field
- Document ID ['Document ID' -> 'documentId']

### MemberSignature.csv
- Member Email ['Member Email' -> 'memberEmail']
- Signature
- Initials
- IP
- Full Name ['Full Name' -> 'fullName']
- Initials Public URL ['Initials Public URL' -> 'initialsPublicUrl']
- Initials Wix URL ['Initials Wix URL' -> 'initialsWixUrl']
- Signature Public URL ['Signature Public URL' -> 'signaturePublicUrl']
- Signature Wix URL ['Signature Wix URL' -> 'signatureWixUrl']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner

### PendingAppoitments.csv
- ID
- Assigned To ['Assigned To' -> 'assignedTo']
- Status
- Service Name ['Service Name' -> 'serviceName']
- Name
- Email
- Phone
- Agent Name ['Agent Name' -> 'agentName']
- Agent Email ['Agent Email' -> 'agentEmail']
- Agent Phone ['Agent Phone' -> 'agentPhone']
- Request Address ['Request Address' -> 'requestAddress']
- Brokerage
- Visitorid
- Requested Slot ['Requested Slot' -> 'requestedSlot']
- Preferred Location ['Preferred Location' -> 'preferredLocation']
- Request ID ['Request ID' -> 'requestId']
- Assigned Date ['Assigned Date' -> 'assignedDate']
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner

### ProjectPermissions.csv
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- projectId
- ID
- Owner
- NA
- Permissions

### Projects.csv
- ID
- projectID
- Title
- Status
- Status Image ['Status Image' -> 'statusImage']
- Status Order ['Status Order' -> 'statusOrder']
- Property Type ['Property Type' -> 'propertyType']
- Description
- Image
- Gallery
- Agent Name ['Agent Name' -> 'agentName']
- Agent Email ['Agent Email' -> 'agentEmail']
- Agent Phone ['Agent Phone' -> 'agentPhone']
- Homeowner Full Name ['Homeowner Full Name' -> 'homeownerFullName']
- Homeowner Email ['Homeowner Email' -> 'homeownerEmail']
- Homeowner Phone ['Homeowner Phone' -> 'homeownerPhone']
- Homeowner Full Name 2 ['Homeowner Full Name 2' -> 'homeownerFullName2']
- Homeowner Email 2 ['Homeowner Email 2' -> 'homeownerEmail2']
- Homeowner Phone 2 ['Homeowner Phone 2' -> 'homeownerPhone2']
- Homeowner Full Name 3 ['Homeowner Full Name 3' -> 'homeownerFullName3']
- Homeowner Email 3 ['Homeowner Email 3' -> 'homeownerEmail3']
- Homeowner Phone 3 ['Homeowner Phone 3' -> 'homeownerPhone3']
- Bedrooms
- Bathrooms
- Floors
- Size Sqft. ['Size Sqft.' -> 'sizeSqft']
- Year Built ['Year Built' -> 'yearBuilt']
- Redfin Link ['Redfin Link' -> 'redfinLink']
- Zillow Link ['Zillow Link' -> 'zillowLink']
- Original Value ['Original Value' -> 'originalValue']
- Listing Price ['Listing Price' -> 'listingPrice']
- Sale Price ['Sale Price' -> 'salePrice']
- Boost Price ['Boost Price' -> 'boostPrice']
- Booster Estimated Cost ['Booster Estimated Cost' -> 'boosterEstimatedCost']
- Booster Actual Cost ['Booster Actual Cost' -> 'boosterActualCost']
- Paid by Escrow ['Paid by Escrow' -> 'paidByEscrow']
- Added value ['Added value' -> 'addedValue']
- Gross Profit ['Gross Profit' -> 'grossProfit']
- Estimated Gross Profit ['Estimated Gross Profit' -> 'estimatedGrossProfit']
- Paid Cost ['Paid Cost' -> 'paidCost']
- Day on the market ['Day on the market' -> 'daysOnMarket']
- Rev-share Amount ['Rev-share Amount' -> 'revShareAmount']
- Loan Balance ['Loan Balance' -> 'loanBalance']
- Carry Cost ['Carry Cost' -> 'carryCost']
- Open Escrow Within (days) ['Open Escrow Within (days)' -> 'openEscrowWithinDays']
- Carry Days ['Carry Days' -> 'carryDays']
- Booster Actual Price ['Booster Actual Price' -> 'boosterActualPrice']
- Budget
- Request Date ['Request Date' -> 'requestDate']
- Visit / Review Date ['Visit / Review Date' -> 'visitReviewDate']
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Proposal Date ['Proposal Date' -> 'proposalDate']
- Contract Date ['Contract Date' -> 'contractDate']
- Escrow Date ['Escrow Date' -> 'escrowDate']
- Estimated Closing Date ['Estimated Closing Date' -> 'estimatedClosingDate']
- Closing Date ['Closing Date' -> 'closingDate']
- Rev-share Pay Date ['Rev-share Pay Date' -> 'revSharePayDate']
- Underwriting Date ['Underwriting Date' -> 'underwritingDate']
- Escrow Payment Date ['Escrow Payment Date' -> 'escrowPaymentDate']
- Booster Completion Date ['Booster Completion Date' -> 'boosterCompletionDate']
- Invoice Date ['Invoice Date' -> 'invoiceDate']
- Escrow Company Name ['Escrow Company Name' -> 'escrowCompanyName']
- Escrow Contact Info ['Escrow Contact Info' -> 'escrowContactInfo']
- Exclude From Dashboard ['Exclude From Dashboard' -> 'excludeFromDashboard']
- Invoice Number ['Invoice Number' -> 'invoiceNumber']
- Brokerage
- Selected Products ['Selected Products' -> 'selectedProducts']
- Signed Contracts ['Signed Contracts' -> 'signedContracts']
- link-04-projects-title [Delete]
- 04_Projects (Item) [Delete] # Note: appears twice in CSV