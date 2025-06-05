import csv
import uuid
from datetime import datetime
import os
import re
import difflib

def ensure_output_dir(output_dir):
    os.makedirs(output_dir, exist_ok=True)

def get_columns():
    return [
        'ID', 'propertyFullAddress', 'houseAddress', 'city', 'state', 'zip', 'propertyType',
        'bedrooms', 'bathrooms', 'floors', 'sizeSqft', 'yearBuilt', 'redfinLink', 'zillowLink', 'createdDate', 'updatedDate', 'Owner'
    ]

def get_projects_to_properties_mapping():
    """Returns a mapping from Properties.csv columns to Projects.csv columns."""
    return {
        'propertyFullAddress': 'Title',  # override: use Title as propertyFullAddress
        'houseAddress': '',
        'city': '',
        'state': '',
        'zip': '',
        'propertyType': 'Property Type',
        'bedrooms': 'Bedrooms',
        'bathrooms': 'Bathrooms',
        'floors': 'Floors',
        'sizeSqft': 'Size Sqft.',
        'yearBuilt': 'Year Built',
        'redfinLink': 'Redfin Link',
        'zillowLink': 'Zillow Link',
    }

def cleanupAddress(address):
    """Cleans up the address by applying normalization rules with exact spacing."""
    if not address:
        return ''
    cleaned_address = address
    # 1. Remove ', USA' and ', US' (order matters, exact spacing)
    cleaned_address = cleaned_address.replace(', USA', '')
    cleaned_address = cleaned_address.replace(', US', '')
    # 2. Replace 'ca', 'california', 'California' with 'CA' (case-insensitive, as whole word)
    cleaned_address = re.sub(r'\bca\b', 'CA', cleaned_address, flags=re.IGNORECASE)
    cleaned_address = re.sub(r'\bcalifornia\b', 'CA', cleaned_address, flags=re.IGNORECASE)
    # 3. Replace ', CA ' with ', CA, ' (exact spacing)
    cleaned_address = cleaned_address.replace(', CA ', ', CA, ')
    # 4. Replace '? CA ?' (where ? is not a comma) with '?, CA, ?'
    cleaned_address = re.sub(r'([^,\s])\s+CA\s+([^,\s])', r'\1, CA, \2', cleaned_address)
    # Remove any unwanted characters (e.g., extra spaces, commas)
    cleaned_address = re.sub(r'[^\w\s,.-]', '', cleaned_address)
    cleaned_address = re.sub(r'\s+', ' ', cleaned_address).strip()
    return cleaned_address


def extract_unique_properties(input_csv, columns, owner, today):
    mapping = get_projects_to_properties_mapping()
    unique_props = set()
    rows = []
    with open(input_csv, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            # Use propertyFullAddress (from Title) as unique key
            key = row.get('Title', '').strip()
            key = cleanupAddress(key)  # Clean up the address
            if key and key not in unique_props:
                unique_props.add(key)
                out_row = {col: '' for col in columns}
                for col in columns:
                    if col == 'ID':
                        out_row['ID'] = str(uuid.uuid4())
                    elif col == 'propertyFullAddress':
                        out_row['propertyFullAddress'] = key
                    elif col == 'createdDate' or col == 'updatedDate':
                        out_row[col] = today
                    elif col == 'Owner':
                        out_row['Owner'] = owner
                    elif col in mapping and mapping[col]:
                        out_row[col] = row.get(mapping[col], '')
                    # else leave blank or skip if mapping is empty
                rows.append(out_row)
    return rows

def write_properties_csv(output_csv, columns, rows):
    with open(output_csv, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)

def parse_address(full_address):
    """
    Parse address string into houseAddress, city, state, zip by splitting on commas.
    Returns (houseAddress, city, state, zip) or ('', '', '', '') if not matched.
    """
    # Expecting: houseAddress, city, state, zip (all comma separated)
    parts = [p.strip() for p in full_address.split(',')]
    if len(parts) >= 4:
        house = parts[0]
        city = parts[1]
        state = parts[2]
        zip_code = parts[3]
        return house, city, state, zip_code
    return '', '', '', ''

def backfill_address_fields(properties_csv):
    rows = []
    with open(properties_csv, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        columns = reader.fieldnames
        for row in reader:
            # Remove any None keys that may have been introduced
            if None in row:
                del row[None]
            full_address = row.get('propertyFullAddress', '')
            house, city, state, zip_code = parse_address(full_address)
            if not row.get('houseAddress'):
                row['houseAddress'] = house
            if not row.get('city'):
                row['city'] = city
            if not row.get('state'):
                row['state'] = state
            if not row.get('zip'):
                row['zip'] = zip_code
            # Only keep keys that are in columns
            filtered_row = {k: v for k, v in row.items() if k in columns}
            rows.append(filtered_row)
    # Write to a new file with timestamp
    now_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    out_file = properties_csv.replace('.csv', f'_{now_str}.csv')
    with open(out_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Backfilled file written to: {out_file}")
    
def scanAndAppendAddressesFromOtherCSV(other_csv, other_csv_address_field):
    """
    Scan Quotes.csv for new addresses and append to Properties.csv if not already present.
    Uses elastic search: compares first 10 characters (case-insensitive) of addresses.
    If cleanupAddress returns blank, fallback to using the original address from the quote.
    """
    properties_csv = 'data/csv/new/Properties.csv'
    OWNER = '03839c70-7508-4e6d-b906-4df699fc5aa1'
    today = datetime.now().strftime('%Y-%m-%d')
    columns = get_columns()

    # Load existing properties and build elastic search set
    elastic_keys = set()
    properties_rows = []
    with open(properties_csv, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            addr = row.get('propertyFullAddress', '')
            if addr:
                elastic_key = addr[:10].lower()
                elastic_keys.add(elastic_key)
            properties_rows.append(row)

    # Scan Quotes.csv for new addresses
    new_rows = []
    with open(other_csv, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            quote_addr = row.get(other_csv_address_field, '').strip()
            cleaned_addr = cleanupAddress(quote_addr)
            # Fallback: if cleaning returns blank, use original
            final_addr = cleaned_addr if cleaned_addr else quote_addr
            elastic_key = final_addr[:10].lower()
            if final_addr and elastic_key not in elastic_keys:
                # Prepare new property row
                new_row = {col: '' for col in columns}
                new_row['ID'] = str(uuid.uuid4())
                new_row['propertyFullAddress'] = final_addr
                new_row['createdDate'] = today
                new_row['updatedDate'] = today
                new_row['Owner'] = OWNER
                # Optionally, parse and fill houseAddress, city, state, zip
                house, city, state, zip_code = parse_address(final_addr)
                new_row['houseAddress'] = house
                new_row['city'] = city
                new_row['state'] = state
                new_row['zip'] = zip_code
                new_rows.append(new_row)
                elastic_keys.add(elastic_key)

    # Append new rows to properties
    all_rows = properties_rows + new_rows
    # Write to a new file with timestamp
    now_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    out_file = properties_csv # properties_csv.replace('.csv', f'_{now_str}.csv')
    with open(out_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=columns)
        writer.writeheader()
        writer.writerows(all_rows)
    print(f"Appended {len(new_rows)} new addresses from Quotes (elastic match). Output: {out_file}")
    
def get_csv_old_to_new_mapping():
    """
    Returns a dictionary mapping each CSV filename to a dict of old_field_name -> new_field_name.
    The mapping is based on the README.md field mapping rules.
    Each mapping dict covers all fields for that CSV (README count = mapping count).
    All new field names are in camelCase (start with lower case).
    [Delete] fields are mapped, but with a comment for traceability.
    """
    return {
        # 1. Affiliates.csv (README fields: 28, mapping: 28)
        'Affiliates.csv': {
            'ID': 'ID',
            'Title': 'title',
            'Company': 'company',
            'Service Type': 'serviceType',
            'Contact ID': 'contactId',
            'Name': 'name',  # [Delete]
            'Email': 'email',  # [Delete]
            'Phone': 'phone',  # [Delete]
            'Full Address': 'fullAddress',  # [Delete]
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            "Worker's Compensation Ins.": 'workersCompensationInsurance',
            'License': 'license',
            'Environmental Factor': 'environmentalFactor',
            'OSHA Compliance': 'oshaCompliance',
            'Signed NDA': 'signedNda',
            'Safety Plan': 'safetyPlan',
            'Water System': 'waterSystem',
            '# of Employees': 'numEmployees',
            'General Guidelines': 'generalGuidelines',
            'Communication': 'communication',
            'Material Utilization': 'materialUtilization',
            'Quality Assurance': 'qualityAssurance',
            'Project Remnant List': 'projectRemnantList',
            'Warranty Period': 'warrantyPeriod',
            'Accounting': 'accounting',
            'Qualifier Name': 'qualifierName',
            'Date': 'date',
            'Qualfier Signature': 'qualifierSignature',
            '92_SLA (All)': 'slaAll',  # [Delete]
            '92_SLA (Company, Email)': 'slaCompanyEmail',  # [Delete]
            'link-sla-2-name': 'linkSla2Name',  # [Delete]
        },
        # 2. Auth.csv (README fields: 7, mapping: 7)
        'Auth.csv': {
            'Owner': 'owner',
            'Email': 'email',
            'Hash': 'hash',
            'Token': 'token',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
        },
        # 3. BackOffice_AssignTo.csv (README fields: 12, mapping: 12)
        'BackOffice_AssignTo.csv': {
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Contact ID': 'contactId',
            'Name': 'name',  # [Delete]
            'Email': 'email',  # [Delete]
            'Mobile': 'mobile',  # [Delete]
            'Send Email Notifications': 'sendEmailNotifications',
            'Send SMS Notifications': 'sendSmsNotifications',
            'Active': 'active',
            'order': 'order',
        },
        # 4. BackOffice_BookingStatuses.csv (README fields: 6, mapping: 6)
        'BackOffice_BookingStatuses.csv': {
            'Title': 'title',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Order': 'order',
        },
        # 5. BackOffice_Brokerage.csv (README fields: 7, mapping: 7)
        'BackOffice_Brokerage.csv': {
            'Title': 'title',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Order': 'order',
            'Live': 'live',
        },
        # 6. BackOffice_Products.csv (README fields: 6, mapping: 6)
        'BackOffice_Products.csv': {
            'Title': 'title',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Order': 'order',
        },
        # 7. BackOffice_ProjectStatuses.csv (README fields: 6, mapping: 6)
        'BackOffice_ProjectStatuses.csv': {
            'Title': 'title',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Order': 'order',
        },
        # 8. ContactUs.csv (README fields: 16, mapping: 16)
        'ContactUs.csv': {
            'Submission Time': 'submissionTime',
            'First Name': 'firstName',  # [Delete]
            'Last Name': 'lastName',  # [Delete]
            'Email': 'email',  # [
            'Address': 'address',  # [Delete]
            'Subject': 'subject',
            'Message': 'message',
            'Product': 'product',
            'Phone': 'phone',  # [Delete]
            'Email 2': 'email2',  # [Delete]
            'ID': 'ID',
            'Owner': 'owner',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Contact ID': 'contactId',
        },
        # 9. ProjectComments.csv (README fields: 15, mapping: 15)
        'ProjectComments.csv': {
            'Author ID': 'authorId',
            'Posted By': 'postedBy',  # [Delete]
            'Nickname': 'nickname',
            'Project ID': 'projectId',
            'Files': 'files',
            'Comment': 'comment',
            'Is Private': 'isPrivate',
            'Posted By Profile Image': 'postedByProfileImage',  # [Delete]
            'Add To Gallery': 'addToGallery',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
        },
        # 10. ProjectMilestones.csv (README fields: 12, mapping: 12)
        'ProjectMilestones.csv': {
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Name': 'name',
            'Description': 'description',
            'Project ID': 'projectId',
            'Order': 'order',
            'Is Complete': 'isComplete',
            'Estimated Start': 'estimatedStart',
            'Estimated Finish': 'estimatedFinish',
            'Is Category': 'isCategory',
            'Is Internal': 'isInternal',
        },
        # 11. ProjectPaymentTerms.csv (README fields: 15, mapping: 15)
        'ProjectPaymentTerms.csv': {
            'ID': 'ID',
            'projectID': 'projectID',
            'Type': 'type',
            'PaymentName': 'paymentName',
            'Payment Amount': 'paymentAmount',
            'paymentDue': 'paymentDue',
            'Description': 'description',
            'Order': 'order',
            'Paid': 'paid',
            'Parent Payment ID': 'parentPaymentId',
            'Is Category': 'isCategory',
            'Internal': 'internal',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
        },
        # 12. QuoteItems.csv (README fields: 21, mapping: 21)
        'QuoteItems.csv': {
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'projectID': 'projectID',
            'Item Name': 'itemName',
            'Item Completed': 'itemCompleted',
            'Parent Stage ID': 'parentStageId',
            'Order': 'order',
            'Is Category': 'isCategory',
            'Description': 'description',
            'Qty': 'quantity',
            'Unit Price': 'unitPrice',
            'Total': 'total',
            'Type': 'type',
            'Recommend Item': 'recommendItem',
            'Image': 'image',
            'Internal': 'internal',
            'Margin Percent': 'marginPercent',
            'Cost': 'cost',
            'price': 'price',
        },
        # 13. Quotes.csv (README fields: 69, mapping: 69)
        'Quotes.csv': {
            'ID': 'ID',
            'RequestID': 'requestId',
            'Project ID': 'projectId',
            'Property ID': 'propertyId',
            'Agent ID': 'agentId',
            'Contact ID': 'contactId',
            'Contact ID 2': 'contact2Id',
            'Contact ID 3': 'contact3Id',
            'Address': 'address',  # [Delete]
            'Status': 'status',
            'Status Image': 'statusImage',
            'Status Order': 'statusOrder',
            'AssignedTo': 'assignedTo',
            'Assigned Date': 'assignedDate',
            'Updated Date': 'updatedDate',
            'AgentName': 'agentName',  # [Delete]
            'AgentPhone': 'agentPhone',  # [Delete]
            'AgentEmail': 'agentEmail',  # [Delete]
            'HomeownerName': 'homeownerName',  # [Delete]
            'HomeownerPhone': 'homeownerPhone',  # [Delete]
            'HomeownerEmail': 'homeownerEmail',  # [Delete]
            'Homeowner Name 2': 'homeownerName2',  # [Delete]
            'Homeowner Phone 2': 'homeownerPhone2',  # [Delete]
            'Homeowner Email 2': 'homeownerEmail2',  # [Delete]
            'Homeowner Name 3': 'homeownerName3',  # [Delete]
            'Homeowner Phone 3': 'homeownerPhone3',  # [Delete]
            'Homeowner Email 3': 'homeownerEmail3',  # [Delete]
            'Quote Number': 'quoteNumber',
            'Title': 'title',
            'Property Full Address': 'propertyFullAddress',  # [Delete]
            'House Address': 'houseAddress',  # [Delete]
            'State': 'state',  # [Delete]
            'City': 'city',  # [Delete]
            'Zip': 'zip',  # [Delete]
            'Visitor ID': 'visitorId',
            'Pdf Generator URL': 'pdfGeneratorUrl',
            'Document': 'document',
            'Documents': 'documents',
            'Images': 'images',
            'Budget': 'budget',
            'Total Cost': 'totalCost',
            'Total Price': 'totalPrice',
            'Product': 'product',
            'Operation Manager Approved': 'operationManagerApproved',
            'Underwriting Approved': 'underwritingApproved',
            'Signed': 'signed',
            'signee1Name': 'signee1Name',
            'Signature': 'signature',
            'Projected Listing Price': 'projectedListingPrice',
            'Loan Balance': 'loanBalance',
            'Credit Score': 'creditScore',
            'eSignature Document ID': 'eSignatureDocumentId',
            'Quote PDF url': 'quotePdfUrl',
            'Viewedby': 'viewedBy',
            'Associated Project': 'associatedProject',
            'Change Order': 'changeOrder',
            'Request Date': 'requestDate',
            'Visit Date': 'visitDate',
            'Created Date': 'createdDate',
            'Operation Manager Approved Date': 'operationManagerApprovedDate',
            'Sent Date': 'sentDate',
            'Opened Date': 'openedDate',
            'Signed Date': 'signedDate',
            'Underwriting Approved Date': 'underwritingApprovedDate',
            'Contracting Start Date': 'contractingStartDate',
            'Contract Sent Date': 'contractSentDate',
            'Contract Signed Date': 'contractSignedDate',
            'Converted Date': 'convertedDate',
            'Expired Date': 'expiredDate',
            'Archived Date': 'archivedDate',
            'Rejected Date': 'rejectedDate',
            'Brokerage': 'brokerage',
            'Office Notes': 'officeNotes',
            'Reason For Archive': 'reasonForArchive',
            'Estimated Weeks Duration': 'estimatedWeeksDuration',
            'Account Executive': 'accountExecutive',
            'Bedrooms': 'bedrooms',
            'Year Built': 'yearBuilt',
            'Floors': 'floors',
            'Bathrooms': 'bathrooms',
            'Size (sqft)': 'sizeSqft',
            'Total Payments by Client': 'totalPaymentsByClient',
            'Total Payments to GC': 'totalPaymentsToGc',
            'Quote eSignature (ID)': 'quoteESignatureId',
            'Owner': 'owner',
        },
        # 14. Requests.csv (README fields: 54, mapping: 54)
        'Requests.csv': {
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'ID': 'ID',
            'Status': 'status',
            'Status Image': 'statusImage',
            'Status Order': 'statusOrder',
            'Property ID': 'propertyId',
            'Agent ID': 'agentId',
            'Contact ID': 'contactId',
            'Account Executive ID': 'accountExecutiveId',
            'Account Executive': 'accountExecutive',
            'Product': 'product',
            'Assigned To': 'assignedTo',
            'Assigned Date': 'assignedDate',
            'Agent Name': 'agentName',  # [Delete]
            'AgentPhone': 'agentPhone',  # [Delete]
            'Agent Email': 'agentEmail',  # [Delete]
            'Homeowner Full Name': 'homeownerFullName',  # [Delete]
            'Homeowner First Name': 'homeownerFirstName',  # [Delete]
            'Homeowner Last Name': 'homeownerLastName',  # [Delete]
            'Homeowner Phone': 'homeownerPhone',  # [Delete]
            'Homeowner Email': 'homeownerEmail',  # [Delete]
            'Property Address': 'propertyAddress',  # [Delete]
            'Property Full Address': 'propertyFullAddress',  # [Delete]
            'House Address': 'houseAddress',  # [Delete]
            'City': 'city',  # [Delete]
            'State': 'state',  # [Delete]
            'Zip': 'zip',  # [Delete]
            'Message': 'message',
            'Virtual Walkthrough': 'virtualWalkthrough',
            'Budget': 'budget',
            'Listing City': 'listingCity',
            'Listing State': 'listingState',
            'Listing Zip Code': 'listingZipCode',
            'Relation to Property': 'relationToProperty',
            'Uploaded Media': 'uploadedMedia',
            'Uploaded Documents': 'uploadedDocuments',
            'Uploaded Videos': 'uploadedVideos',
            'RT Digital Selection': 'rtDigitalSelection',
            'Lead Source': 'leadSource',
            'Need Finance': 'needFinance',
            'Lead From Sync': 'leadFromSync',
            'Lead From Ventura Stone': 'leadFromVenturaStone',
            'Office Notes': 'officeNotes',
            'Archived': 'archived',
            'Booking ID': 'bookingId',
            'Requested Visit Date / Time': 'requestedVisitDateTime',
            'VisitorId': 'visitorId',
            'Visit Date': 'visitDate',
            'Move To Quoting Date': 'moveToQuotingDate',
            'Expired Date': 'expiredDate',
            'Archived Date': 'archivedDate',
            'Owner': 'owner',
        },
        # 15. Properties.csv (README fields: 16, mapping: 16)
        'Properties.csv': {
            'ID': 'ID',
            'propertyFullAddress': 'propertyFullAddress',
            'houseAddress': 'houseAddress',
            'city': 'city',
            'state': 'state',
            'zip': 'zip',
            'propertyType': 'propertyType',
            'bedrooms': 'bedrooms',
            'bathrooms': 'bathrooms',
            'floors': 'floors',
            'sizeSqft': 'sizeSqft',
            'yearBuilt': 'yearBuilt',
            'redfinLink': 'redfinLink',
            'zillowLink': 'zillowLink',
            'createdDate': 'createdDate',
            'updatedDate': 'updatedDate',
            'Owner': 'owner',
        },
        # 16. Projects.csv (README fields: 74+, mapping: 74+)
        'Projects.csv': {
            'ID': 'ID',
            'Project ID': 'projectId',
            'Title': 'title',
            'Status': 'status',
            'Status Image': 'statusImage',
            'Status Order': 'statusOrder',
            'Property ID': 'propertyId',
            'Agent ID': 'agentId',
            'Contact ID': 'contactId',
            'Contact ID 2': 'contact2Id',
            'Contact ID 3': 'contact3Id',
            'Property Type': 'propertyType',
            'Description': 'description',
            'Image': 'image',
            'Gallery': 'gallery',
            'Agent Name': 'agentName',  # [Delete]
            'Agent Email': 'agentEmail',  # [Delete]
            'Agent Phone': 'agentPhone',  # [Delete]
            'Homeowner Full Name': 'homeownerFullName',  # [Delete]
            'Homeowner Email': 'homeownerEmail',  # [Delete]
            'Homeowner Phone': 'homeownerPhone',  # [Delete]
            'Homeowner Full Name 2': 'homeownerFullName2',  # [Delete]
            'Homeowner Email 2': 'homeownerEmail2',  # [Delete]
            'Homeowner Phone 2': 'homeownerPhone2',  # [Delete]
            'Homeowner Full Name 3': 'homeownerFullName3',  # [Delete]
            'Homeowner Email 3': 'homeownerEmail3',  # [Delete]
            'Homeowner Phone 3': 'homeownerPhone3',  # [Delete]
            'Bedrooms': 'bedrooms',  # [Delete]
            'Bathrooms': 'bathrooms',  # [Delete]
            'Floors': 'floors',  # [Delete]
            'Size Sqft.': 'sizeSqft',  # [Delete]
            'Year Built': 'yearBuilt',  # [Delete]
            'Redfin Link': 'redfinLink',  # [Delete]
            'Zillow Link': 'zillowLink',  # [Delete]
            'Original Value': 'originalValue',  # [Delete]
            'Listing Price': 'listingPrice',  # [Delete]
            'Sale Price': 'salePrice',  # [Delete]
            'Boost Price': 'boostPrice',
            'Booster Estimated Cost': 'boosterEstimatedCost',
            'Booster Actual Cost': 'boosterActualCost',
            'Paid by Escrow': 'paidByEscrow',
            'Added value': 'addedValue',
            'Gross Profit': 'grossProfit',
            'Estimated Gross Profit': 'estimatedGrossProfit',
            'Paid Cost': 'paidCost',
            'Day on the market': 'daysOnMarket',
            'Rev-share Amount': 'revShareAmount',
            'Loan Balance': 'loanBalance',
            'Carry Cost': 'carryCost',
            'Open Escrow Within (days)': 'openEscrowWithinDays',
            'Carry Days': 'carryDays',
            'Booster Actual Price': 'boosterActualPrice',
            'Budget': 'budget',
            'Request Date': 'requestDate',
            'Visit / Review Date': 'visitReviewDate',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Proposal Date': 'proposalDate',
            'Contract Date': 'contractDate',
            'Escrow Date': 'escrowDate',
            'Estimated Closing Date': 'estimatedClosingDate',
            'Closing Date': 'closingDate',
            'Rev-share Pay Date': 'revSharePayDate',
            'Underwriting Date': 'underwritingDate',
            'Escrow Payment Date': 'escrowPaymentDate',
            'Booster Completion Date': 'boosterCompletionDate',
            'Invoice Date': 'invoiceDate',
            'Escrow Company Name': 'escrowCompanyName',
            'Escrow Contact Info': 'escrowContactInfo',
            'Exclude From Dashboard': 'excludeFromDashboard',
            'Invoice Number': 'invoiceNumber',
            'Brokerage': 'brokerage',
            'Selected Products': 'selectedProducts',
            'Signed Contracts': 'signedContracts',
            'link-04-projects-title': 'link04ProjectsTitle',  # [Delete]
            '04_Projects (Item)': 'item04Projects',  # [Delete]
            'link-projects-1-title-2': 'linkProjects1Title2',
            'Estimate': 'estimate',
            'Price Quote Info': 'priceQuoteInfo',
            'quote URL': 'quoteUrl',
            'Documents': 'documents',
            'permissionPublic': 'permissionPublic',
            'permissionPrivateRoles': 'permissionPrivateRoles',
            'permissionPrivateUsers': 'permissionPrivateUsers',
            'projectManagerEmailList': 'projectManagerEmailList',
            'projectManagerPhone': 'projectManagerPhone',
            'visitorId': 'visitorId',
            'quoteId': 'quoteId',
            'Request ID': 'requestId',
            'Assigned To': 'assignedTo',
            'Assigned Date': 'assignedDate',
            'Office Notes': 'officeNotes',
            'Quote Sent Date': 'quoteSentDate',
            'Quote Opened Date': 'quoteOpenedDate',
            'Quote Signed Date': 'quoteSignedDate',
            'Contracting Start Date': 'contractingStartDate',
            'Contract Sent Date': 'contractSentDate',
            'Archived Date': 'archivedDate',
            'Estimated Weeks Duration': 'estimatedWeeksDuration',
            'Account Executive': 'accountExecutive',
            'Project Admin (ProjectID)': 'projectAdminProjectId',
            'Contract URL': 'contractUrl',
            'Archived': 'archived',
        },
        # 17. BackOffice_Notifications.csv (README fields: 13, mapping: 13)
        'BackOffice_Notifications.csv': {
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Key': 'key',
            'To': 'to',
            'CC': 'cc',
            'BCC': 'bcc',
            'Subject': 'subject',
            'Body': 'body',
            'Body As Simple Text': 'bodyAsSimpleText',
        },
        # 18. BackOffice_QuoteStatuses.csv (README fields: 6, mapping: 6)
        'BackOffice_QuoteStatuses.csv': {
            'Title': 'title',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Order': 'order',
        },
        # 19. BackOffice_RequestStatuses.csv (README fields: 6, mapping: 6)
        'BackOffice_RequestStatuses.csv': {
            'Title': 'title',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Order': 'order',
        },
        # 20. BackOffice_RoleTypes.csv (README fields: 6, mapping: 6)
        'BackOffice_RoleTypes.csv': {
            'Title': 'title',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Order': 'order',
        },
        # 21. eSignatureDocuments.csv (README fields: 20, mapping: 20)
        'eSignatureDocuments.csv': {
            'ID': 'ID',
            'Contact ID': 'contactId',  # Reference to Contacts table
            'Signed': 'signed',
            'Template ID': 'templateId',
            'Document Data': 'documentData',
            'PDF Generator URL': 'pdfGeneratorUrl',
            'Document': 'document',
            'Signed By': 'signedBy',  # [Delete] Using contactId instead
            'Signature': 'signature',
            'Initials': 'initials',
            'Address': 'address',  # [Delete] Using contactId instead
            'Quote PDF url': 'quotePdfUrl',
            'Signed Date': 'signedDate',
            'Signed Document': 'signedDocument',
            'Signed PDF Generator URL': 'signedPdfGeneratorUrl',
            'Signed Quote PDF Public URL': 'signedQuotePdfPublicUrl',
            'Homeowner Email': 'homeownerEmail',  # [Delete] Should use contactId instead
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
        },
        # 22. Legal.csv (README fields: 8, mapping: 8)
        'Legal.csv': {
            'Title': 'title',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Content': 'content',
            '12_Legal (Document ID)': '12LegalDocumentId',  # [Delete] Legacy field
            'Document ID': 'documentId',
        },
        # 23. MemberSignature.csv (README fields: 13, mapping: 13)
        'MemberSignature.csv': {
            'Contact ID': 'contactId',  # Reference to Contacts table
            'Member Email': 'memberEmail',  # [Delete]
            'Signature': 'signature',
            'Initials': 'initials',
            'IP': 'ip',
            'Full Name': 'fullName',  # [Delete]
            'Initials Public URL': 'initialsPublicUrl',
            'Initials Wix URL': 'initialsWixUrl',
            'Signature Public URL': 'signaturePublicUrl',
            'Signature Wix URL': 'signatureWixUrl',
            'ID': 'ID',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
        },
        # 24. PendingAppoitments.csv (README fields: 23, mapping: 23)
        'PendingAppoitments.csv': {
            'ID': 'ID',
            'Assigned To': 'assignedTo',
            'Status': 'status',
            'Service Name': 'serviceName',
            'Name': 'name',  # [Delete]
            'Email': 'email',  # [Delete]
            'Phone': 'phone',  # [Delete]
            'Agent Name': 'agentName',  # [Delete]
            'Agent Email': 'agentEmail',  # [Delete]
            'Agent Phone': 'agentPhone',  # [Delete]
            'Request Address': 'requestAddress',  # [Delete] Using propertyId instead
            'Brokerage': 'brokerage',  # [Delete]
            'VisitorId': 'visitorId',
            'Requested Slot': 'requestedSlot',
            'Preferred Location': 'preferredLocation',
            'Request ID': 'requestId',
            'Assigned Date': 'assignedDate',
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Owner': 'owner',
            'Property ID': 'propertyId',  # Reference to Properties table
            'Agent ID': 'agentId',  # Reference to Contacts table where isAgent=true
            'Contact ID': 'contactId',  # Reference to Contacts table
        },
        # 25. ProjectPermissions.csv (README fields: 7, mapping: 7)
        'ProjectPermissions.csv': {
            'Created Date': 'createdDate',
            'Updated Date': 'updatedDate',
            'Project ID': 'projectId',
            'ID': 'ID',
            'Owner': 'owner',
            'NA': 'na',
            'Permissions': 'permissions',
        },
    }

def normalize_header(header):
    h = header.strip().lower().replace('’', "'").replace('“', '"').replace('”', '"')
    h = re.sub(r'\s+', ' ', h)
    return h

def updateCsvFieldNames(input_csv):
    """
    Update the field names in the input CSV file based on the mapping from old to new field names.
    Writes the updated CSV to /data/csv/new/ with the same filename.
    Handles special characters and whitespace in header matching.
    Also strips BOM from the first header field if present.
    """
    mapping = get_csv_old_to_new_mapping()
    if not os.path.exists(input_csv):
        raise FileNotFoundError(f"Input CSV file does not exist: {input_csv}")

    base_filename = os.path.basename(input_csv)
    if base_filename not in mapping:
        raise ValueError(f"No mapping found for CSV file: {base_filename}")
    field_map = mapping[base_filename]

    # Build a normalized mapping for robust header matching
    normalized_map = {normalize_header(k): v for k, v in field_map.items()}

    output_dir = os.path.join(os.path.dirname(input_csv), 'new')
    os.makedirs(output_dir, exist_ok=True)
    output_csv = os.path.join(output_dir, base_filename)

    # Use utf-8-sig to strip BOM if present
    with open(input_csv, newline='', encoding='utf-8-sig') as infile:
        reader = csv.reader(infile)
        rows = list(reader)
        if not rows:
            raise ValueError(f"Input CSV is empty: {input_csv}")
        old_header = rows[0]
        # Use normalized header for matching
        new_header = [normalized_map.get(normalize_header(col), col) for col in old_header]
        with open(output_csv, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.writer(outfile)
            writer.writerow(new_header)
            writer.writerows(rows[1:])
    print(f"Updated field names for {input_csv} -> {output_csv}")
    
def normalize_str(s):
    if not s:
        return ''
    return re.sub(r'[^a-z0-9]', '', s.strip().lower())

def findMatchingContact(email, fullName=None, firstName=None, lastName=None, phone=None, contacts_csv_path='data/csv/final/Contacts.csv'):
    """
    Find the best matching contact in Contacts.csv based on provided fields.
    Returns the contact row (dict) or None if no good match.
    Matching is elastic: case-insensitive, ignores spaces/punctuation, partials allowed.
    Priority: email (strongest, required), then fullName, then first+last, then phone.
    Only email is required.
    """
    best_score = 0
    best_row = None
    norm_email = normalize_str(email) if email else ''
    norm_phone = normalize_str(phone) if phone else ''
    norm_fullName = normalize_str(fullName) if fullName else ''
    norm_first = normalize_str(firstName) if firstName else ''
    norm_last = normalize_str(lastName) if lastName else ''
    with open(contacts_csv_path, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            score = 0
            contact_full = normalize_str(row.get('fullName'))
            contact_email = normalize_str(row.get('email'))
            contact_first = normalize_str(row.get('firstName'))
            contact_last = normalize_str(row.get('lastName'))
            contact_phone = normalize_str(row.get('phone'))
            contact_mobile = normalize_str(row.get('mobile'))
            # Email match (strongest, required)
            if norm_email and contact_email == norm_email:
                score += 100
            elif norm_email and (norm_email in contact_email or contact_email in norm_email):
                score += 60
            elif norm_email and difflib.SequenceMatcher(None, norm_email, contact_email).ratio() > 0.85:
                score += 40
            # Full name match (secondary)
            if norm_fullName and contact_full == norm_fullName:
                score += 30
            elif norm_fullName and (norm_fullName in contact_full or contact_full in norm_fullName):
                score += 20
            elif norm_fullName and difflib.SequenceMatcher(None, norm_fullName, contact_full).ratio() > 0.85:
                score += 10
            # First+Last fuzzy match (optional)
            if norm_first and norm_last:
                if contact_first == norm_first and contact_last == norm_last:
                    score += 10
                elif norm_first in contact_first or contact_first in norm_first:
                    score += 5
                elif norm_last in contact_last or contact_last in norm_last:
                    score += 5
            # Phone match (optional)
            if norm_phone and (contact_phone == norm_phone or contact_mobile == norm_phone):
                score += 5
            # If any score, consider as candidate
            if score > best_score:
                best_score = score
                best_row = row
    # Threshold: require at least 60 (email partial) or 100 (email exact)
    if best_score >= 60:
        return best_row
    return None

def findMatchingAddress(propertyFullAddress, houseAddress, properties_csv_path='data/csv/final/Properties.csv'):
    """
    Find the best matching address in Properties.csv based on propertyFullAddress (and optionally houseAddress).
    Normalizes both sides by removing spaces and special characters, then matches on the first 10 characters of the full address (case-insensitive).
    Returns the property row (dict) or None if no good match.
    """
    def norm_addr(addr):
        if not addr:
            return ''
        # Remove spaces and special characters (',', '.', etc), lowercase
        return re.sub(r'[^a-z0-9]', '', addr.strip().lower())

    norm_full = norm_addr(propertyFullAddress)
    norm_house = norm_addr(houseAddress) if houseAddress else None
    if not norm_full:
        return None
    key = norm_full[:10]
    best_row = None
    with open(properties_csv_path, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            row_full = norm_addr(row.get('propertyFullAddress', ''))
            if row_full[:10] == key:
                # Optionally, if houseAddress is provided, check it too for extra confidence
                if norm_house:
                    row_house = norm_addr(row.get('houseAddress', ''))
                    if row_house and row_house == norm_house:
                        return row
                else:
                    return row
    return None

def writeCSVWithContactId(csvFileName, field_mapping, contact_id_field, output_csv, contacts_csv_path='data/csv/final/Contacts.csv'):
    """
    For each row in csvFileName, use field_mapping to extract the fields for findMatchingContact.
    Adds a new column (contact_id_field) at the end with the matched contactId (or blank if no match).
    Writes the updated rows to output_csv.
    """
    with open(csvFileName, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames + [contact_id_field]
        rows = []
        for row in reader:
            fullName = row.get(field_mapping.get('fullName', ''), '')
            firstName = row.get(field_mapping.get('firstName', ''), '') if field_mapping.get('firstName') else None
            lastName = row.get(field_mapping.get('lastName', ''), '') if field_mapping.get('lastName') else None
            email = row.get(field_mapping.get('email', ''), '') if field_mapping.get('email') else None
            phone = row.get(field_mapping.get('phone', ''), '') if field_mapping.get('phone') else None
            match = findMatchingContact(email, fullName, firstName, lastName, phone, contacts_csv_path=contacts_csv_path)
            contactId = match['ID'] if match else ''
            row[contact_id_field] = contactId
            rows.append(row)
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    with open(output_csv, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote updated CSV with contact IDs to: {output_csv}")

def writeCSVWithAddressId(csvFileName, field_mapping, address_id_field, output_csv, properties_csv_path='data/csv/final/Properties.csv'):
    with open(csvFileName, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames + [address_id_field]
        rows = []
        for row in reader:
            propertyFullAddress = row.get(field_mapping.get('propertyFullAddress', ''), '')
            houseAddress = row.get(field_mapping.get('houseAddress', ''), '') if field_mapping.get('houseAddress') else None
            match = findMatchingAddress(propertyFullAddress, houseAddress, properties_csv_path=properties_csv_path)
            addressId = match['ID'] if match else ''
            row[address_id_field] = addressId
            rows.append(row)
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    with open(output_csv, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote updated CSV with address IDs to: {output_csv}")

def main():
    # input_csv = 'data/csv/Projects.csv'
    # output_dir = 'data/csv/new'
    # output_csv = os.path.join(output_dir, 'Properties.csv')
    # OWNER = '03839c70-7508-4e6d-b906-4df699fc5aa1'
    # today = datetime.now().strftime('%Y-%m-%d')
    # columns = get_columns()
    # ensure_output_dir(output_dir)
    # rows = extract_unique_properties(input_csv, columns, OWNER, today)
    # write_properties_csv(output_csv, columns, rows)

    # properties_csv = 'data/csv/new/Properties.csv'
    # backfill_address_fields(properties_csv)
    
    # scanAndAppendAddressesFromOtherCSV('data/csv/Quotes.csv', 'Address')
    # scanAndAppendAddressesFromOtherCSV('data/csv/Requests.csv', 'Property Address')
    
    # updateCsvFieldNames('data/csv/Affiliates.csv')
    # updateCsvFieldNames('data/csv/Auth.csv')
    # updateCsvFieldNames('data/csv/BackOffice_AssignTo.csv')
    # updateCsvFieldNames('data/csv/BackOffice_BookingStatuses.csv')
    # updateCsvFieldNames('data/csv/BackOffice_Brokerage.csv')
    # updateCsvFieldNames('data/csv/BackOffice_Notifications.csv')
    # updateCsvFieldNames('data/csv/BackOffice_Products.csv')
    # updateCsvFieldNames('data/csv/BackOffice_ProjectStatuses.csv')
    # updateCsvFieldNames('data/csv/ContactUs.csv')
    # updateCsvFieldNames('data/csv/ProjectComments.csv')
    # updateCsvFieldNames('data/csv/ProjectMilestones.csv')
    # updateCsvFieldNames('data/csv/ProjectPaymentTerms.csv')
    # updateCsvFieldNames('data/csv/QuoteItems.csv')
    # updateCsvFieldNames('data/csv/Quotes.csv')
    # updateCsvFieldNames('data/csv/Requests.csv')
    # updateCsvFieldNames('data/csv/BackOffice_QuoteStatuses.csv')
    # updateCsvFieldNames('data/csv/BackOffice_RequestStatuses.csv')
    # updateCsvFieldNames('data/csv/BackOffice_RoleTypes.csv')
    # updateCsvFieldNames('data/csv/eSignatureDocuments.csv')
    # updateCsvFieldNames('data/csv/Legal.csv')
    # updateCsvFieldNames('data/csv/MemberSignature.csv')
    # updateCsvFieldNames('data/csv/PendingAppoitments.csv')
    # updateCsvFieldNames('data/csv/ProjectPermissions.csv')
    # updateCsvFieldNames('data/csv/Projects.csv')
    
    field_mapping_contactId = [
        # {
        #     'csvFileName': 'data/csv/new/Affiliates.csv',
        #     'outputCsv': 'data/csv/final/Affiliates.csv',
        #     'contactId': 'contactId',
        #     'mapping': {
        #         'fullName': 'name',      # CSV column for full name
        #         'email': 'email',        # CSV column for email
        #         'phone': 'phone',        # CSV column for phone (optional)
        #     }
        # },
        # {
        #     'csvFileName': 'data/csv/new/BackOffice_AssignTo.csv',
        #     'outputCsv': 'data/csv/final/BackOffice_AssignTo.csv',
        #     'contactId': 'contactId',
        #     'mapping': {
        #         'fullName': 'name',      # CSV column for full name
        #         'email': 'email',        # CSV column for email
        #         'phone': 'mobile',        # CSV column for phone (optional)
        #     }
        # },
        # {
        #     'csvFileName': 'data/csv/new/ContactUs.csv',
        #     'outputCsv': 'data/csv/final/ContactUs.csv',
        #     'contactId': 'contactId',
        #     'mapping': {
        #         'email': 'email',        # CSV column for email
        #     }
        # },
        # {
        #     'csvFileName': 'data/csv/new/ProjectComments.csv',
        #     'outputCsv': 'data/csv/final/ProjectComments.csv',
        #     'contactId': 'postedByContactId',
        #     'mapping': {
        #         'email': 'postedBy',        # CSV column for email
        #     }
        # },
        # {
        #     'csvFileName': 'data/csv/new/Requests.csv',
        #     'outputCsv': 'data/csv/final/Requests.csv',
        #     'contactId': 'agentContactId',
        #     'mapping': {
        #         'email': 'agentEmail',        # CSV column for email
        #         'fullName': 'agentName',        # CSV column for email
        #         'phone': 'agentPhone',        # CSV column for email
        #     }
        # },
        # {
        #     'csvFileName': 'data/csv/final/Requests.csv',
        #     'outputCsv': 'data/csv/final/Requests.csv',
        #     'contactId': 'homeownerContactId',
        #     'mapping': {
        #         'email': 'homeownerEmail',        # CSV column for email
        #         'fullName': 'homeownerFullName',        # CSV column for email
        #         'phone': 'homeownerPhone',        # CSV column for email
        #     }
        # },
        # {
        #     'csvFileName': 'data/csv/new/Projects.csv',
        #     'outputCsv': 'data/csv/final/Projects.csv',
        #     'contactId': 'agentContactId',
        #     'mapping': {
        #         'email': 'agentEmail',        # CSV column for email
        #         'fullName': 'agentName',        # CSV column for email
        #         'phone': 'agentPhone',        # CSV column for email
        #     }
        # },
        # {
        #     'csvFileName': 'data/csv/final/Projects.csv',
        #     'outputCsv': 'data/csv/final/Projects.csv',
        #     'contactId': 'homeownerContactId',
        #     'mapping': {
        #         'email': 'homeownerEmail',        # CSV column for email
        #         'fullName': 'homeownerFullName',        # CSV column for email
        #         'phone': 'homeownerPhone',        # CSV column for email
        #     }
        # },        {
        #     'csvFileName': 'data/csv/final/Projects.csv',
        #     'outputCsv': 'data/csv/final/Projects.csv',
        #     'contactId': 'homeowner2ContactId',
        #     'mapping': {
        #         'email': 'homeownerEmail2',        # CSV column for email
        #         'fullName': 'homeownerName2',        # CSV column for email
        #         'phone': 'homeownerPhone2',        # CSV column for email
        #     }
        # },
        # {
        #     'csvFileName': 'data/csv/final/Projects.csv',
        #     'outputCsv': 'data/csv/final/Projects.csv',
        #     'contactId': 'homeowner3ContactId',
        #     'mapping': {
        #         'email': 'homeownerEmail3',        # CSV column for email
        #         'fullName': 'homeownerName3',        # CSV column for email
        #         'phone': 'homeownerPhone3',        # CSV column for email
        #     }
        # }
    ]    
    # Use the new flexible field_mapping_contactId structure for batch processing
    for mapping in field_mapping_contactId:
        writeCSVWithContactId(
            mapping['csvFileName'],
            mapping['mapping'],
            mapping['address_id_field'],
            mapping['outputCsv']
        )
    
    field_mapping_addressId = [
        {
            'csvFileName': 'data/csv/final/Affiliates.csv',
            'outputCsv': 'data/csv/final/Affiliates.csv',
            'address_id_field': 'addressId',
            'mapping': {
                'propertyFullAddress': 'fullAddress',
                # 'houseAddress': '',
            }
        },
        {
            'csvFileName': 'data/csv/final/ContactUs.csv',
            'outputCsv': 'data/csv/final/ContactUs.csv',
            'address_id_field': 'addressId',
            'mapping': {
                'propertyFullAddress': 'address',
                # 'houseAddress': '',
            }
        },
        {
            'csvFileName': 'data/csv/final/Quotes.csv',
            'outputCsv': 'data/csv/final/Quotes.csv',
            'address_id_field': 'addressId',
            'mapping': {
                'propertyFullAddress': 'title',
                'houseAddress': 'houseAddress',
            }
        },
        {
            'csvFileName': 'data/csv/final/Requests.csv',
            'outputCsv': 'data/csv/final/Requests.csv',
            'address_id_field': 'addressId',
            'mapping': {
                'propertyFullAddress': 'propertyAddress',
                'houseAddress': 'houseAddress',
            }
        },
        {
            'csvFileName': 'data/csv/final/eSignatureDocuments.csv',
            'outputCsv': 'data/csv/final/eSignatureDocuments.csv',
            'address_id_field': 'addressId',
            'mapping': {
                'propertyFullAddress': 'address',
                # 'houseAddress': '',
            }
        },
        {
            'csvFileName': 'data/csv/final/Projects.csv',
            'outputCsv': 'data/csv/final/Projects.csv',
            'address_id_field': 'addressId',
            'mapping': {
                'propertyFullAddress': 'title',
                # 'houseAddress': '',
            }
        }     
    ]
        
    # Use the new flexible field_mapping_addressId structure for batch processing
    for mapping in field_mapping_addressId:
        writeCSVWithAddressId(
            mapping['csvFileName'],
            mapping['mapping'],
            mapping['address_id_field'],
            mapping['outputCsv']
        )


    None

if __name__ == '__main__':
    main()