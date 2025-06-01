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
- Title ['Title' -> 'title']
- Company ['Company' -> 'company']
- Service Type ['Service Type' -> 'serviceType']
- Contact ID ['Contact ID' -> 'contactId']  # Reference to Contacts table where isAffiliate=true
- Name ['Name' -> 'name'] [Delete]
- Email ['Email' -> 'email'] [Delete]
- Phone ['Phone' -> 'phone'] [Delete]
- Full Address ['Full Address' -> 'fullAddress'] [Delete]
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
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
- Accounting ['Accounting' -> 'accounting']
- Qualifier Name ['Qualifier Name' -> 'qualifierName']
- Date ['Date' -> 'date']
- Qualfier Signature ['Qualfier Signature' -> 'qualifierSignature']
- 92_SLA (All) [Delete]
- 92_SLA (Company, Email) [Delete]
- link-sla-2-name [Delete]

### 2. Auth.csv
- Owner ['Owner' -> 'owner']
- Email ['Email' -> 'email']
- Hash ['Hash' -> 'hash']
- Token ['Token' -> 'token']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']

### 3. BackOffice_AssignTo.csv
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- Contact ID ['Contact ID' -> 'contactId']  # Reference to Contacts table where isProjectManager=true
- Name ['Name' -> 'name'] [Delete]
- Email ['Email' -> 'email'] [Delete]
- Mobile ['Mobile' -> 'mobile'] [Delete]
- Send Email Notifications ['Send Email Notifications' -> 'sendEmailNotifications']
- Send SMS Notifications ['Send SMS Notifications' -> 'sendSmsNotifications']
- Active ['Active' -> 'active']
- order ['Order' -> 'order']

### 4. BackOffice_BookingStatuses.csv
- Title ['Title' -> 'title']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- Order ['Order' -> 'order']

### 5. BackOffice_Brokerage.csv
- Title ['Title' -> 'title']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- Order ['Order' -> 'order']
- Live ['Live' -> 'live']

### 6. BackOffice_Products.csv
- Title ['Title' -> 'title']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- Order ['Order' -> 'order']

### 7. BackOffice_ProjectStatuses.csv
- Title ['Title' -> 'title']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- Order ['Order' -> 'order']

### 8. ContactUs.csv
- Submission Time ['Submission Time' -> 'submissionTime']
- First Name ['First Name' -> 'firstName'] [Delete]
- Last Name ['Last Name' -> 'lastName'] [Delete]
- Email [Delete]
- Address [Delete]
- Subject ['Subject' -> 'subject']
- Message ['Message' -> 'message']
- Product ['Product' -> 'product']
- Phone [Delete]
- Email 2 ['Email 2' -> 'email2'] [Delete]
- ID
- Owner ['Owner' -> 'owner']
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Contact ID ['Contact ID' -> 'contactId']  # Reference to Contacts table

### 9. ProjectComments.csv
- Author ID ['Author ID' -> 'authorId']  # Reference to Contacts table
- Posted By ['Posted By' -> 'postedBy'] [Delete]  # Using authorId instead
- Nickname ['Nickname' -> 'nickname']
- Project ID ['Project ID' -> 'projectId']
- Files ['Files' -> 'files']
- Comment ['Comment' -> 'comment']
- Is Private ['Is Private' -> 'isPrivate']
- Posted By Profile Image ['Posted By Profile Image' -> 'postedByProfileImage'] [Delete]  # Using authorId instead
- Add To Gallery ['Add To Gallery' -> 'addToGallery']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']

### 10. ProjectMilestones.csv
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- Name ['Name' -> 'name']
- Description ['Description' -> 'description']
- Project ID ['Project ID' -> 'projectId']
- Order ['Order' -> 'order']
- Is Complete ['Is Complete' -> 'isComplete']
- Estimated Start ['Estimated Start' -> 'estimatedStart']
- Estimated Finish ['Estimated Finish' -> 'estimatedFinish']
- Is Category ['Is Category' -> 'isCategory']
- Is Internal ['Is Internal' -> 'isInternal']

### 11. ProjectPaymentTerms.csv
- ID
- projectID
- Type ['Type' -> 'type']
- PaymentName ['PaymentName' -> 'paymentName']
- Payment Amount ['Payment Amount' -> 'paymentAmount']
- paymentDue
- Description ['Description' -> 'description']
- Order ['Order' -> 'order']
- Paid ['Paid' -> 'paid']
- Parent Payment ID ['Parent Payment ID' -> 'parentPaymentId']
- Is Category ['Is Category' -> 'isCategory']
- Internal ['Internal' -> 'internal']
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']

### 12. QuoteItems.csv
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- projectID
- Item Name ['Item Name' -> 'itemName']
- Item Completed ['Item Completed' -> 'itemCompleted']
- Parent Stage ID ['Parent Stage ID' -> 'parentStageId']
- Order ['Order' -> 'order']
- Is Category ['Is Category' -> 'isCategory']
- Description ['Description' -> 'description']
- Qty ['Qty' -> 'quantity']
- Unit Price ['Unit Price' -> 'unitPrice']
- Total ['Total' -> 'total']
- Type ['Type' -> 'type']
- Recommend Item ['Recommend Item' -> 'recommendItem']
- Image ['Image' -> 'image']
- Internal ['Internal' -> 'internal']
- Margin Percent ['Margin Percent' -> 'marginPercent']
- Cost ['Cost' -> 'cost']
- price

### 13. Quotes.csv
- ID
- RequestID
- Project ID ['Project ID' -> 'projectId']
- propertyId ['Property ID' -> 'propertyId']  # Reference to Properties table
- agentId ['Agent ID' -> 'agentId']  # Reference to Contacts table where isAgent=true
- contactId ['Contact ID' -> 'contactId']  # Primary homeowner contact reference
- contact2Id ['Contact ID 2' -> 'contact2Id']  # Second homeowner contact reference (optional)
- contact3Id ['Contact ID 3' -> 'contact3Id']  # Third homeowner contact reference (optional)
- Address ['Address' -> 'address'] [Delete]
- Status ['Status' -> 'status']  
- Status Image ['Status Image' -> 'statusImage']  
- Status Order ['Status Order' -> 'statusOrder']
- AssignedTo ['AssignedTo' -> 'assignedTo']
- Assigned Date ['Assigned Date' -> 'assignedDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- AgentName ['AgentName' -> 'agentName'] [Delete]
- AgentPhone ['AgentPhone' -> 'agentPhone'] [Delete]
- AgentEmail ['AgentEmail' -> 'agentEmail'] [Delete]
- HomeownerName ['HomeownerName' -> 'homeownerName'] [Delete]
- HomeownerPhone ['HomeownerPhone' -> 'homeownerPhone'] [Delete]
- HomeownerEmail ['HomeownerEmail' -> 'homeownerEmail'] [Delete]
- Homeowner Name 2 ['Homeowner Name 2' -> 'homeownerName2'] [Delete]
- Homeowner Phone 2 ['Homeowner Phone 2' -> 'homeownerPhone2'] [Delete]
- Homeowner Email 2 ['Homeowner Email 2' -> 'homeownerEmail2'] [Delete]
- Homeowner Name 3 ['Homeowner Name 3' -> 'homeownerName3'] [Delete]
- Homeowner Phone 3 ['Homeowner Phone 3' -> 'homeownerPhone3'] [Delete]
- Homeowner Email 3 ['Homeowner Email 3' -> 'homeownerEmail3'] [Delete]
- Quote Number ['Quote Number' -> 'quoteNumber']
- Title ['Title' -> 'title']  
- Property Full Address ['Property Full Address' -> 'propertyFullAddress'] [Delete]
- House Address ['House Address' -> 'houseAddress'] [Delete]
- State [Delete]
- City [Delete]
- Zip [Delete]
- Visitor ID ['Visitor ID' -> 'visitorId']
- Pdf Generator URL ['Pdf Generator URL' -> 'pdfGeneratorUrl']
- Document ['Document' -> 'document']  
- Documents ['Documents' -> 'documents']  
- Images ['Images' -> 'images']  
- Budget ['Budget' -> 'budget']  
- Total Cost ['Total Cost' -> 'totalCost']
- Total Price ['Total Price' -> 'totalPrice']
- Product ['Product' -> pProduct']  
- Operation Manager Approved ['Operation Manager Approved' -> 'operationManagerApproved']
- Underwriting Approved ['Underwriting Approved' -> 'underwritingApproved']
- Signed ['Signed' -> 'signed']  
- signee1Name
- Signature ['Signature' -> 'signature']  
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
- Brokerage ['Brokerage' -> 'brokerage']  
- Office Notes ['Office Notes' -> 'officeNotes']
- Reason For Archive ['Reason For Archive' -> 'reasonForArchive']
- Estimated Weeks Duration ['Estimated Weeks Duration' -> 'estimatedWeeksDuration']
- Account Executive ['Account Executive' -> 'accountExecutive']
- Bedrooms ['Bedrooms' -> 'bedrooms']  
- Year Built ['Year Built' -> 'yearBuilt']
- Floors ['Floors' -> 'floors']  
- Bathrooms ['Bathrooms' -> 'bathrooms']  
- Size (sqft) ['Size (sqft)' -> 'sizeSqft']
- Total Payments by Client ['Total Payments by Client' -> 'totalPaymentsByClient']
- Total Payments to GC ['Total Payments to GC' -> 'totalPaymentsToGc']
- Quote eSignature (ID) ['Quote eSignature (ID)' -> 'quoteESignatureId']
- Owner ['Owner' -> 'owner'] 

### 14. Requests.csv
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- ID
- Status ['Status' -> 'status']
- Status Image ['Status Image' -> 'statusImage']
- Status Order ['Status Order' -> 'statusOrder']
- Property ID ['Property ID' -> 'propertyId']  # Reference to Properties table
- Agent ID ['Agent ID' -> 'agentId']  # Reference to Contacts table where isAgent=true
- Contact ID ['Contact ID' -> 'contactId']  # Reference to Contacts table (homeowner)
- Account Executive ID ['Account Executive ID' -> 'accountExecutiveId']  # Reference to Contacts table where isAccountExecutive=true
- Account Executive ['Account Executive' -> 'accountExecutive']
- Product ['Product' -> 'product']
- Assigned To ['Assigned To' -> 'assignedTo']
- Assigned Date ['Assigned Date' -> 'assignedDate']
- Agent Name ['Agent Name' -> 'agentName'] [Delete]
- AgentPhone ['AgentPhone' -> 'agentPhone'] [Delete]
- Agent Email ['Agent Email' -> 'agentEmail'] [Delete]
- Homeowner Full Name ['Homeowner Full Name' -> 'homeownerFullName'] [Delete]
- Homeowner First Name ['Homeowner First Name' -> 'homeownerFirstName'] [Delete]
- Homeowner Last Name ['Homeowner Last Name' -> 'homeownerLastName'] [Delete]
- Homeowner Phone ['Homeowner Phone' -> 'homeownerPhone'] [Delete]
- Homeowner Email ['Homeowner Email' -> 'homeownerEmail'] [Delete]
- Property Address ['Property Address' -> 'propertyAddress'] [Delete]
- Property Full Address ['Property Full Address' -> 'propertyFullAddress'] [Delete]
- House Address ['House Address' -> 'houseAddress'] [Delete]
- City ['City' -> 'city'] [Delete]  # Using propertyId instead [Delete]  # Using propertyId instead [Delete]
- State ['State' -> 'state'] [Delete]
- Zip ['Zip' -> 'zip'] [Delete]
- Message ['Message' -> 'message']
- Virtual Walkthrough ['Virtual Walkthrough' -> 'virtualWalkthrough']
- Budget ['Budget' -> 'budget']
- Listing City ['Listing City' -> 'listingCity']
- Listing State ['Listing State' -> 'listingState']
- Listing Zip Code ['Listing Zip Code' -> 'listingZipCode']
- Relation to Property ['Relation to Property' -> 'relationToProperty']
- Listing City [Delete]  # Using propertyId instead
- Listing State [Delete]  # Using propertyId instead
- Listing Zip Code [Delete]  # Using propertyId instead
- Uploaded Media ['Uploaded Media' -> 'uploadedMedia']
- Uploaded Documents ['Uploaded Documents' -> 'uploadedDocuments']
- Uploaded Videos ['Uploaded Videos' -> 'uploadedVideos']
- RT Digital Selection ['RT Digital Selection' -> 'rtDigitalSelection']
- Lead Source ['Lead Source' -> 'leadSource']
- Need Finance ['Need Finance' -> 'needFinance']
- Lead From Sync ['Lead From Sync' -> 'leadFromSync']
- Lead From Ventura Stone ['Lead From Ventura Stone' -> 'leadFromVenturaStone']
- Office Notes ['Office Notes' -> 'officeNotes']
- Archived ['Archived' -> 'archived']
- Booking ID ['Booking ID' -> 'bookingId']
- Requested Visit Date / Time ['Requested Visit Date / Time' -> 'requestedVisitDateTime']
- VisitorId ['VisitorId' -> 'visitorId']
- Visit Date ['Visit Date' -> 'visitDate']
- Move To Quoting Date ['Move To Quoting Date' -> 'moveToQuotingDate']
- Expired Date ['Expired Date' -> 'expiredDate']
- Archived Date ['Archived Date' -> 'archivedDate']
- Owner ['Owner' -> 'owner']

### BackOffice_Notifications.csv
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- key ['Key' -> 'key']
- To ['To' -> 'to']
- CC ['CC' -> 'cc']
- BCC ['BCC' -> 'bcc']
- Subject ['Subject' -> 'subject']
- Body ['Body' -> 'body']
- Body As Simple Text ['Body As Simple Text' -> 'bodyAsSimpleText']

### BackOffice_QuoteStatuses.csv
- Title ['Title' -> 'title']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- Order ['Order' -> 'order']

### BackOffice_RequestStatuses.csv
- Title ['Title' -> 'title']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- Order ['Order' -> 'order']

### BackOffice_RoleTypes.csv
- Title ['Title' -> 'title']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- Order ['Order' -> 'order']

### eSignatureDocuments.csv
- ID
- Contact ID ['Contact ID' -> 'contactId']  # Reference to Contacts table
- Signed ['Signed' -> 'signed']
- Template ID ['Template ID' -> 'templateId']
- Document Data ['Document Data' -> 'documentData']
- PDF Generator URL ['PDF Generator URL' -> 'pdfGeneratorUrl']
- Document ['Document' -> 'document']
- Signed By ['Signed By' -> 'signedBy'] [Delete]  # Using contactId instead
- Signature ['Signature' -> 'signature']
- Initials ['Initials' -> 'initials']
- Address [Delete]  # Using contactId instead
- Quote PDF url ['Quote PDF url' -> 'quotePdfUrl']
- Signed Date ['Signed Date' -> 'signedDate']
- Signed Document ['Signed Document' -> 'signedDocument']
- Signed PDF Generator URL ['Signed PDF Generator URL' -> 'signedPdfGeneratorUrl']
- Signed Quote PDF Public URL ['Signed Quote PDF Public URL' -> 'signedQuotePdfPublicUrl']
- Homeowner Email ['Homeowner Email' -> 'homeownerEmail'] [Delete]  # Should use contactId instead
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner

### Legal.csv
- Title ['Title' -> 'title']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- Content ['Content' -> 'content']
- 12_Legal (Document ID) [Delete] # Legacy field
- Document ID ['Document ID' -> 'documentId']

### MemberSignature.csv
- contactId ['Contact ID' -> 'contactId']  # Reference to Contacts table
- Member Email ['Member Email' -> 'memberEmail'] [Delete]
- Signature ['Signature' -> 'signature']
- Initials ['Initials' -> 'initials']
- IP ['IP' -> 'ip']
- Full Name ['Full Name' -> 'fullName'] [Delete]
- Initials Public URL ['Initials Public URL' -> 'initialsPublicUrl']
- Initials Wix URL ['Initials Wix URL' -> 'initialsWixUrl']
- Signature Public URL ['Signature Public URL' -> 'signaturePublicUrl']
- Signature Wix URL ['Signature Wix URL' -> 'signatureWixUrl']
- ID
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']

### PendingAppoitments.csv
- ID
- Assigned To ['Assigned To' -> 'assignedTo']
- Status ['Status' -> 'status']
- Service Name ['Service Name' -> 'serviceName']
- Name ['Name' -> 'name'] [Delete]
- Email ['Email' -> 'email'] [Delete]
- Phone ['Phone' -> 'phone'] [Delete]
- Agent Name ['Agent Name' -> 'agentName'] [Delete]
- Agent Email ['Agent Email' -> 'agentEmail'] [Delete]
- Agent Phone ['Agent Phone' -> 'agentPhone'] [Delete]
- Request Address ['Request Address' -> 'requestAddress'] [Delete]  # Using propertyId instead
- Brokerage ['Brokerage' -> 'brokerage'] [Delete]
- Visitorid ['VisitorId' -> 'visitorId']
- Requested Slot ['Requested Slot' -> 'requestedSlot']
- Preferred Location ['Preferred Location' -> 'preferredLocation']
- Request ID ['Request ID' -> 'requestId']
- Assigned Date ['Assigned Date' -> 'assignedDate']
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner ['Owner' -> 'owner']
- propertyId ['Property ID' -> 'propertyId']  # Reference to Properties table
- agentId ['Agent ID' -> 'agentId']  # Reference to Contacts table where isAgent=true
- contactId ['Contact ID' -> 'contactId']  # Reference to Contacts table

### ProjectPermissions.csv
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Project ID ['Project ID' -> 'projectId']
- ID
- Owner ['Owner' -> 'owner']
- NA ['NA' -> 'na']
- Permissions ['Permissions' -> 'permissions']

### Projects.csv
- ID
- Project ID ['Project ID' -> 'projectId']
- Title ['Title' -> 'title']
- Status ['Status' -> 'status']
- Status Image ['Status Image' -> 'statusImage']
- Status Order ['Status Order' -> 'statusOrder']
- Property ID ['Property ID' -> 'propertyId']
- Agent ID ['Agent ID' -> 'agentId']
- Contact ID ['Contact ID' -> 'contactId']
- Contact ID 2 ['Contact ID 2' -> 'contact2Id']
- Contact ID 3 ['Contact ID 3' -> 'contact3Id']
- Property Type ['Property Type' -> 'propertyType']
- Description ['Description' -> 'description']
- Image ['Image' -> 'image']
- Gallery ['Gallery' -> 'gallery']
- Agent Name ['Agent Name' -> 'agentName'] [Delete]
- Agent Email ['Agent Email' -> 'agentEmail'] [Delete]
- Agent Phone ['Agent Phone' -> 'agentPhone'] [Delete]
- Homeowner Full Name ['Homeowner Full Name' -> 'homeownerFullName'] [Delete]
- Homeowner Email ['Homeowner Email' -> 'homeownerEmail'] [Delete]
- Homeowner Phone ['Homeowner Phone' -> 'homeownerPhone'] [Delete]
- Homeowner Full Name 2 ['Homeowner Full Name 2' -> 'homeownerFullName2'] [Delete]
- Homeowner Email 2 ['Homeowner Email 2' -> 'homeownerEmail2'] [Delete]
- Homeowner Phone 2 ['Homeowner Phone 2' -> 'homeownerPhone2'] [Delete]
- Homeowner Full Name 3 ['Homeowner Full Name 3' -> 'homeownerFullName3'] [Delete]
- Homeowner Email 3 ['Homeowner Email 3' -> 'homeownerEmail3'] [Delete]
- Homeowner Phone 3 ['Homeowner Phone 3' -> 'homeownerPhone3'] [Delete]
- Bedrooms ['Bedrooms' -> 'bedrooms'] [Delete]  # Using propertyId instead
- Bathrooms ['Bathrooms' -> 'bathrooms'] [Delete]  # Using propertyId instead
- Floors ['Floors' -> 'floors'] [Delete]  # Using propertyId instead
- Size Sqft. ['Size Sqft.' -> 'sizeSqft'] [Delete]  # Using propertyId instead
- Year Built ['Year Built' -> 'yearBuilt'] [Delete]  # Using propertyId instead
- Redfin Link ['Redfin Link' -> 'redfinLink'] [Delete]  # Using propertyId instead
- Zillow Link ['Zillow Link' -> 'zillowLink'] [Delete]  # Using propertyId instead
- Original Value ['Original Value' -> 'originalValue'] [Delete]  # Using propertyId instead
- Listing Price ['Listing Price' -> 'listingPrice'] [Delete]  # Using propertyId instead
- Sale Price ['Sale Price' -> 'salePrice'] [Delete]  # Using propertyId instead
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
- Budget ['Budget' -> 'budget']
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
- Brokerage ['Brokerage' -> 'brokerage']
- Selected Products ['Selected Products' -> 'selectedProducts']
- Signed Contracts ['Signed Contracts' -> 'signedContracts']
- link-04-projects-title [Delete]
- 04_Projects (Item) [Delete] # Note: appears twice in CSV

## Proposed New Tables for Data Consolidation

### Properties.csv
- ID
- propertyFullAddress
- houseAddress
- city
- state
- zip
- propertyType
- bedrooms
- bathrooms
- floors
- sizeSqft
- yearBuilt
- redfinLink
- zillowLink
- listingCity
- listingState
- listingZipCode
- originalValue
- listingPrice
- salePrice
- Created Date ['Created Date' -> 'createdDate']
- Updated Date ['Updated Date' -> 'updatedDate']
- Owner

### Contacts.csv
- ID
- firstName
- lastName
- fullName
- email
- phone
- mobile
- company
- brokerage