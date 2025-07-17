# User Story 04: Contact & Property Management Modal

## 📋 Story Overview

**As an** Account Executive (AE)  
**I want to** edit contact and property information in modal dialogs  
**So that** I can maintain accurate records across all workflows (Requests, Quotes, Projects) without leaving the current page  

---

## 🎯 Acceptance Criteria

### Primary Flow
1. **AE clicks edit contact/property button** from request, quote, or project detail page
2. **Modal opens with pre-populated data** for the selected contact or property
3. **AE edits information** using validated form fields
4. **AE saves changes** which update both the current record and master tables
5. **Modal closes and parent page refreshes** to show updated information
6. **Changes are reflected** across all related records and workflows

### Contact Management Requirements
- [ ] Edit homeowner contact information (name, email, phone, address)
- [ ] Edit agent contact information with agent-specific fields
- [ ] Create new contact if duplicate detection fails
- [ ] Link/unlink contacts to properties and requests
- [ ] Validate email uniqueness and format
- [ ] Validate phone format and international numbers
- [ ] Contact type management (homeowner, agent, contractor, etc.)

### Property Management Requirements
- [ ] Edit property address with geocoding validation
- [ ] Update property details (type, size, characteristics)
- [ ] Link property to multiple contacts (owner, agent, etc.)
- [ ] Validate address format and existence
- [ ] Detect and prevent duplicate properties
- [ ] Support property history and ownership changes
- [ ] Integration with mapping services for location verification

### Reusability Requirements
- [ ] Single modal component reusable across Requests, Quotes, and Projects
- [ ] Context-aware behavior based on calling page
- [ ] Consistent styling and behavior across all usage contexts
- [ ] Support for different access levels (view-only, edit, full-admin)
- [ ] Integration with existing form validation framework
- [ ] Responsive design for mobile and tablet usage

### Data Integrity Requirements
- [ ] Real-time duplicate detection during editing
- [ ] Relationship validation (contact-property-request links)
- [ ] Cascade updates to related records
- [ ] Audit trail for all contact and property changes
- [ ] Conflict resolution for concurrent edits
- [ ] Data backup and recovery for critical changes

---

## 🧪 Test Suite Requirements

### Contact Modal Tests
```typescript
// Test File: e2e/tests/admin/components/contact-management-modal.spec.js
describe('Contact Management Modal', () => {
  
  // Happy Path Tests
  test('Open and edit homeowner contact from request page', async () => {
    // Navigate to request detail page
    // Click "Edit Homeowner" button
    // Verify modal opens with pre-populated data
    // Edit contact name, email, phone
    // Save changes
    // Verify modal closes and data updates in request
    // Check Contacts table for updated record
  });
  
  test('Open and edit agent contact from request page', async () => {
    // Navigate to request with agent information
    // Click "Edit Agent" button
    // Verify modal shows agent-specific fields
    // Update agent contact information
    // Save and verify updates across all related records
  });
  
  test('Create new contact from modal', async () => {
    // Open contact modal
    // Clear existing data to create new contact
    // Fill new contact information
    // Save new contact
    // Verify new Contact record created
    // Check relationship linking to parent request/quote/project
  });
  
  test('Duplicate contact detection and handling', async () => {
    // Edit contact to match existing contact email
    // Verify duplicate detection warning
    // Choose to merge or keep separate
    // Test merge functionality if implemented
    // Verify data integrity after merge/separation
  });
  
  test('Contact modal across different contexts', async () => {
    // Test contact modal from Request detail page
    // Test contact modal from Quote detail page
    // Test contact modal from Project detail page
    // Verify consistent behavior and styling
    // Check context-specific field requirements
  });
  
  // Validation Tests
  test('Contact form validation in modal', async () => {
    // Open contact modal
    // Clear required fields
    // Attempt to save (should fail)
    // Enter invalid email format
    // Enter invalid phone format
    // Verify appropriate error messages
    // Test error message positioning in modal
  });
  
  test('Email uniqueness validation', async () => {
    // Edit contact email to existing email
    // Verify uniqueness validation error
    // Test case-insensitive email matching
    // Verify validation works in real-time
  });
  
  // Edge Case Tests
  test('Modal behavior with large datasets', async () => {
    // Open contact modal with extensive history
    // Test performance with many related records
    // Verify modal responsiveness
    // Test scrolling within modal content
  });
  
  test('Concurrent editing scenarios', async () => {
    // Two users edit same contact simultaneously
    // Test conflict detection and resolution
    // Verify data integrity maintained
    // Check audit trail for concurrent changes
  });
  
  test('Modal accessibility and keyboard navigation', async () => {
    // Test modal opening with keyboard
    // Navigate through form fields with Tab
    // Test Escape key to close modal
    // Verify screen reader compatibility
    // Test focus management and trapping
  });
})
```

### Property Modal Tests
```typescript
// Test File: e2e/tests/admin/components/property-management-modal.spec.js
describe('Property Management Modal', () => {
  
  test('Edit property information from request page', async () => {
    // Navigate to request detail page
    // Click "Edit Property" button
    // Verify modal opens with property data
    // Update address, type, size
    // Save changes
    // Verify geocoding validation
    // Check property updates across related records
  });
  
  test('Address validation and geocoding', async () => {
    // Edit property address
    // Enter valid address
    // Verify geocoding integration
    // Test invalid address handling
    // Check address format validation
    // Verify map integration if implemented
  });
  
  test('Property duplicate detection', async () => {
    // Edit property to match existing address
    // Verify duplicate detection warning
    // Test merge/link functionality
    // Ensure property relationships maintained
  });
  
  test('Property-contact relationship management', async () => {
    // Open property modal
    // View linked contacts (owner, agent)
    // Add new contact relationship
    // Remove existing relationship
    // Verify relationship changes persist
  });
  
  test('Property modal responsive design', async () => {
    // Test modal on mobile device
    // Test modal on tablet
    // Verify form usability across screen sizes
    // Test touch interactions
    // Check modal sizing and positioning
  });
})
```

### Integration and Workflow Tests
```typescript
// Test File: e2e/tests/integration/modal-integration-workflow.spec.js
describe('Modal Integration Workflow', () => {
  
  test('Contact edit impacts across all workflows', async () => {
    // Edit contact from Request page
    // Verify changes appear in related Quote
    // Check changes appear in related Project
    // Verify audit trail across all contexts
  });
  
  test('Property edit cascade effects', async () => {
    // Edit property from one request
    // Verify changes appear in other requests for same property
    // Check related quotes and projects update
    // Ensure geocoding updates propagate
  });
  
  test('Modal context switching', async () => {
    // Open contact modal from Request
    // Save changes and close
    // Navigate to related Quote
    // Open same contact modal
    // Verify changes persisted and context appropriate
  });
  
  test('Modal error handling and recovery', async () => {
    // Simulate network error during save
    // Verify error handling and user feedback
    // Test retry mechanisms
    // Ensure data not lost during errors
    // Verify modal state recovery
  });
})
```

---

## 📊 Success Metrics

### Technical Metrics
- [ ] **Modal load time**: <1 second for form rendering
- [ ] **Save operation time**: <2 seconds for contact/property updates
- [ ] **Geocoding response time**: <3 seconds for address validation
- [ ] **Duplicate detection speed**: <500ms for real-time validation
- [ ] **Error rate**: <0.5% of modal operations fail

### Business Metrics
- [ ] **Data accuracy improvement**: 90% reduction in duplicate contacts/properties
- [ ] **Workflow efficiency**: 40% faster contact/property updates
- [ ] **Data completeness**: 95% of contacts have complete information
- [ ] **Cross-workflow consistency**: 99% data consistency across modules
- [ ] **User adoption**: 80% of AEs use modal editing vs. separate pages

### User Experience Metrics
- [ ] **Modal usability**: >4.5/5 rating for ease of use
- [ ] **Form completion time**: <2 minutes average for contact edits
- [ ] **Error frequency**: <1 validation error per form submission
- [ ] **Context switching**: 60% reduction in page navigation for edits
- [ ] **Mobile usability**: >4.0/5 rating for mobile modal experience

---

## 🔧 Implementation Details

### Modal Component Architecture
```typescript
interface ContactPropertyModal {
  // Modal configuration
  type: 'contact' | 'property';
  mode: 'edit' | 'view' | 'create';
  context: 'request' | 'quote' | 'project';
  
  // Data props
  entityId?: string;           // Contact or Property ID
  parentId: string;            // Request/Quote/Project ID
  parentType: string;          // Parent entity type
  
  // Callback functions
  onSave: (data: ContactData | PropertyData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => Promise<void>;
  
  // Access control
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canCreate: boolean;
    canViewSensitive: boolean;
  };
}

interface ContactData {
  contactId?: string;
  contactType: 'homeowner' | 'agent' | 'contractor' | 'other';
  
  // Personal information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  
  // Agent-specific fields
  licenseNumber?: string;
  brokerage?: string;
  agentMlsId?: string;
  
  // Contractor-specific fields
  contractorLicense?: string;
  insuranceInfo?: string;
  specialties?: string[];
  
  // Relationship information
  relationToProperty: string;
  relationshipStartDate?: Date;
  relationshipEndDate?: Date;
  
  // Communication preferences
  preferredContactMethod: 'email' | 'phone' | 'text' | 'any';
  bestTimeToContact?: string;
  communicationNotes?: string;
  
  // System fields
  source: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  lastModifiedBy?: string;
}

interface PropertyData {
  propertyId?: string;
  
  // Address information
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Geocoding data
  latitude?: number;
  longitude?: number;
  geocodingAccuracy?: string;
  
  // Property details
  propertyType: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'commercial';
  squareFootage?: number;
  lotSize?: string;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  
  // Property characteristics
  stories?: number;
  garage?: boolean;
  pool?: boolean;
  fireplace?: boolean;
  basement?: boolean;
  
  // Valuation information
  estimatedValue?: number;
  lastSalePrice?: number;
  lastSaleDate?: Date;
  taxAssessedValue?: number;
  
  // System fields
  source: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  lastModifiedBy?: string;
}
```

### Modal Validation Rules
```typescript
const contactValidationRules = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-']+$/,
    message: 'First name must be 2-50 characters, letters only'
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\-']+$/,
    message: 'Last name must be 2-50 characters, letters only'
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    uniqueCheck: true,
    caseSensitive: false,
    message: 'Valid unique email address required'
  },
  phone: {
    required: true,
    pattern: /^\+?[\d\s\-\(\)\.]+$/,
    minLength: 10,
    maxLength: 20,
    format: 'international',
    message: 'Valid phone number required (10+ digits)'
  }
};

const propertyValidationRules = {
  streetAddress: {
    required: true,
    minLength: 5,
    maxLength: 200,
    message: 'Complete street address required'
  },
  city: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-']+$/,
    message: 'Valid city name required'
  },
  state: {
    required: true,
    pattern: /^[A-Z]{2}$/,
    message: 'Valid 2-letter state code required'
  },
  zipCode: {
    required: true,
    pattern: /^\d{5}(-\d{4})?$/,
    message: 'Valid ZIP code required (12345 or 12345-6789)'
  },
  geocoding: {
    required: false,
    autoValidate: true,
    timeout: 5000,
    fallbackAllowed: true
  }
};
```

### API Endpoints
```typescript
// GET /api/admin/contacts/{id}
{
  method: 'GET',
  authentication: 'admin|ae',
  response: ContactData
}

// PUT /api/admin/contacts/{id}
{
  method: 'PUT',
  authentication: 'admin|ae',
  body: Partial<ContactData>,
  response: {
    success: boolean,
    contact: ContactData,
    validationErrors?: ValidationError[],
    duplicateWarning?: DuplicateContact[]
  }
}

// POST /api/admin/contacts
{
  method: 'POST',
  authentication: 'admin|ae',
  body: ContactData,
  response: {
    success: boolean,
    contactId: string,
    contact: ContactData,
    duplicatesDetected?: DuplicateContact[]
  }
}

// GET /api/admin/properties/{id}
{
  method: 'GET',
  authentication: 'admin|ae',
  response: PropertyData
}

// PUT /api/admin/properties/{id}
{
  method: 'PUT',
  authentication: 'admin|ae',
  body: Partial<PropertyData>,
  response: {
    success: boolean,
    property: PropertyData,
    geocodingResult?: GeocodingResult,
    duplicateWarning?: DuplicateProperty[]
  }
}

// POST /api/admin/properties/geocode
{
  method: 'POST',
  authentication: 'admin|ae',
  body: {
    address: string,
    city: string,
    state: string,
    zipCode: string
  },
  response: {
    success: boolean,
    coordinates?: {
      latitude: number,
      longitude: number,
      accuracy: string
    },
    formattedAddress?: string,
    suggestions?: string[]
  }
}
```

---

## 🚨 Risk Mitigation

### Potential Issues
- [ ] **Modal performance with large datasets**: Implement virtual scrolling and lazy loading
- [ ] **Concurrent editing conflicts**: Version control and real-time conflict detection
- [ ] **Geocoding service failures**: Fallback to manual coordinate entry
- [ ] **Duplicate detection accuracy**: Machine learning and fuzzy matching improvements
- [ ] **Mobile modal usability**: Responsive design and touch optimization

### Data Integrity Risks
- [ ] **Cascade update failures**: Transaction management and rollback procedures
- [ ] **Relationship corruption**: Referential integrity checks and validation
- [ ] **Audit trail gaps**: Comprehensive logging and change tracking
- [ ] **Data loss during edits**: Auto-save and recovery mechanisms
- [ ] **Permission bypass**: Server-side access control validation

### User Experience Risks
- [ ] **Modal accessibility issues**: WCAG 2.1 AA compliance testing
- [ ] **Context confusion**: Clear modal titling and breadcrumbs
- [ ] **Data loss warnings**: Unsaved changes detection and alerts
- [ ] **Performance degradation**: Optimization for older devices
- [ ] **Network error handling**: Graceful offline behavior

---

## 🎯 Definition of Done

### Technical Requirements
- [ ] Contact modal implemented with full CRUD operations
- [ ] Property modal implemented with geocoding integration
- [ ] Modal component reusable across Requests, Quotes, Projects
- [ ] Real-time validation and duplicate detection working
- [ ] Cascade updates to related records functioning
- [ ] Audit trail capturing all changes
- [ ] Mobile responsive design implemented

### Quality Requirements
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Mobile and tablet testing completed
- [ ] Accessibility testing WCAG 2.1 AA compliant
- [ ] Performance testing meets success metrics
- [ ] Security testing completed for input validation
- [ ] User acceptance testing completed with AE users

### Documentation Requirements
- [ ] Component documentation with usage examples
- [ ] API documentation for modal endpoints
- [ ] Integration guide for other modules
- [ ] User guide with screenshots and workflows
- [ ] Troubleshooting guide for common issues

---

## 📋 Dependencies & Integration Points

### System Dependencies
- [ ] **Contacts table**: Master contact data storage
- [ ] **Properties table**: Master property data storage
- [ ] **Geocoding service**: Address validation and mapping
- [ ] **Audit logging system**: Change tracking and compliance
- [ ] **Permission system**: Role-based access control

### Integration Requirements
- [ ] **Request detail page**: Contact and property edit buttons
- [ ] **Quote detail page**: Modal integration for contact/property edits
- [ ] **Project detail page**: Modal integration for related records
- [ ] **Form validation framework**: Consistent validation across modals
- [ ] **Notification system**: Alerts for significant contact/property changes

---

**Priority**: 🔴 **CRITICAL**  
**Story Points**: **8**  
**Dependencies**: Contact/Property tables, Geocoding service, Form validation framework  
**Estimated Duration**: **1-2 weeks**  

---

*This user story provides reusable contact and property management across all workflows, ensuring data consistency and improving user experience by eliminating context switching.*