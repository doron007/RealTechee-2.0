/**
 * Test Data Generator for Form Submission Tests
 * 
 * Generates consistent, realistic test data for all form types
 * with proper markers for test data identification.
 */

// Built-in test data generation without external dependencies

// Sample data arrays for realistic test generation
const SAMPLE_DATA = {
  firstNames: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa'],
  lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'],
  cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Oakland', 'Fresno'],
  streets: ['Main St', 'Oak Ave', 'Pine St', 'First Ave', 'Second St', 'Park Blvd', 'Elm Dr'],
  companies: ['ABC Realty', 'Premier Properties', 'Golden Gate Real Estate', 'Sunshine Homes', 'Pacific Realty']
};

// Simple random selection helper
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate test session identifier
 */
const generateTestSession = () => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  return `test_${timestamp}_${randomId}`;
};

/**
 * Generate realistic address data
 */
const generateAddress = (options = {}) => {
  const state = options.state || 'CA';
  const city = options.city || randomChoice(SAMPLE_DATA.cities);
  const streetNumber = randomNumber(100, 9999);
  const streetName = randomChoice(SAMPLE_DATA.streets);
  
  return {
    streetAddress: `${streetNumber} ${streetName}`,
    city,
    state,
    zip: state === 'CA' ? `9${randomNumber(1000, 5999)}` : `${randomNumber(10000, 99999)}`
  };
};

/**
 * Generate test contact information
 */
const generateContactInfo = (options = {}) => {
  const firstName = options.firstName || randomChoice(SAMPLE_DATA.firstNames);
  const lastName = options.lastName || randomChoice(SAMPLE_DATA.lastNames);
  
  return {
    fullName: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email: options.email || `test.${firstName.toLowerCase()}.${lastName.toLowerCase()}@playwright.test`,
    phone: options.phone || `${randomNumber(100, 999)}${randomNumber(100, 999)}${randomNumber(1000, 9999)}`
  };
};

/**
 * Generate company/brokerage data
 */
const generateCompanyInfo = () => {
  const brokerages = [
    'Equity Union',
    'Sync',
    'Other'
  ];
  
  return {
    brokerage: randomChoice(brokerages),
    customBrokerage: randomChoice(SAMPLE_DATA.companies)
  };
};

/**
 * Generate Get Estimate form data
 */
const generateGetEstimateData = (overrides = {}) => {
  const agentInfo = generateContactInfo({ firstName: 'TestAgent' });
  const homeownerInfo = overrides.separateHomeowner 
    ? generateContactInfo({ firstName: 'TestHomeowner' })
    : null;
  const propertyAddress = generateAddress();
  const companyInfo = generateCompanyInfo();

  const baseData = {
    // Property Information
    propertyAddress,
    
    // Who Are You
    relationToProperty: randomChoice([
      'Real Estate Agent',
      'Homeowner', 
      'Architect / Designer',
      'Broker',
      'Loan Officer'
    ]),
    
    // Agent Information (always required)
    agentInfo: {
      ...agentInfo,
      brokerage: companyInfo.brokerage,
      ...(companyInfo.brokerage === 'Other' && {
        customBrokerage: companyInfo.customBrokerage
      })
    },
    
    // Homeowner Information (optional)
    ...(homeownerInfo && { homeownerInfo }),
    
    // Project Details
    needFinance: Math.random() > 0.5,
    notes: 'This is a test submission for automated E2E testing. Please process accordingly.',
    
    // Meeting Details
    rtDigitalSelection: randomChoice(['upload', 'video-call', 'in-person']),
    
    // File Uploads (simulated - actual files handled by FileUploadField)
    uploadedMedia: []
  };

  // Add meeting date/time if not upload mode
  if (baseData.rtDigitalSelection !== 'upload') {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + randomNumber(1, 30)); // 1-30 days in future
    baseData.requestedVisitDateTime = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD
    baseData.requestedVisitTime = '10:00'; // Fixed time for consistency
  }

  return {
    ...baseData,
    ...overrides
  };
};

/**
 * Generate Contact Us form data
 */
const generateContactUsData = (overrides = {}) => {
  const contactInfo = generateContactInfo({ firstName: 'TestContact' });
  
  return {
    ...contactInfo,
    subject: overrides.subject || randomChoice([
      'General Inquiry',
      'Project Information',
      'Partnership Opportunity',
      'Technical Support',
      'Billing Question'
    ]),
    message: overrides.message || 'This is a test message for the Contact Us form. Please process as test data.',
    product: overrides.product || randomChoice([
      'Kitchen and Bath',
      'Buyers Service',
      'Sellers Service',
      'Architects and Designers',
      'Commercial',
      'Other'
    ]),
    ...overrides
  };
};

/**
 * Generate Get Qualified form data (similar to Get Estimate)
 */
const generateGetQualifiedData = (overrides = {}) => {
  // Get Qualified form is similar to Get Estimate
  return generateGetEstimateData({
    relationToProperty: 'Homeowner', // Typically homeowners for qualification
    rtDigitalSelection: 'video-call', // Prefer consultations for qualification
    ...overrides
  });
};

/**
 * Generate Affiliate form data
 */
const generateAffiliateData = (overrides = {}) => {
  const contactInfo = generateContactInfo({ firstName: 'TestAffiliate' });
  const companyInfo = generateCompanyInfo();
  
  return {
    ...contactInfo,
    company: overrides.company || companyInfo.customBrokerage,
    serviceType: overrides.serviceType || randomChoice([
      'General Contractor',
      'Architect',
      'Interior Designer',
      'Landscaper',
      'Home Inspector',
      'Photographer',
      'Other'
    ]),
    title: overrides.title || 'Test Professional Title',
    
    // License and compliance info
    license: overrides.license || `LIC-${randomNumber(10000000, 99999999)}`,
    workersCompensationInsurance: overrides.workersCompensationInsurance || 'Yes',
    oshaCompliance: overrides.oshaCompliance || 'Yes',
    signedNda: overrides.signedNda || 'Yes',
    
    // Business details
    numEmployees: overrides.numEmployees || randomNumber(1, 50),
    warrantyPeriod: overrides.warrantyPeriod || '2 years',
    
    // Additional fields
    environmentalFactor: overrides.environmentalFactor || 'Standard compliance',
    safetyPlan: overrides.safetyPlan || 'OSHA compliant safety protocols',
    waterSystem: overrides.waterSystem || 'Municipal water connection',
    generalGuidelines: overrides.generalGuidelines || 'Standard industry practices',
    communication: overrides.communication || 'Email and phone preferred',
    materialUtilization: overrides.materialUtilization || 'Efficient material usage',
    qualityAssurance: overrides.qualityAssurance || 'Quality control protocols',
    projectRemnantList: overrides.projectRemnantList || false,
    accounting: overrides.accounting || randomNumber(1000, 50000),
    
    // Qualifier information
    qualifierName: overrides.qualifierName || contactInfo.fullName,
    qualifierSignature: overrides.qualifierSignature || `${contactInfo.fullName} - Digital Signature`,
    date: overrides.date || new Date().toISOString(),
    
    // SLA information
    slaAll: overrides.slaAll || 'Accepted',
    slaCompanyEmail: overrides.slaCompanyEmail || contactInfo.email,
    linkSla2Name: overrides.linkSla2Name || 'https://example.com/sla',
    
    ...overrides
  };
};

/**
 * Create test data variations for different scenarios
 */
const createTestScenarios = {
  // Get Estimate scenarios
  getEstimate: {
    // Basic agent-only submission
    agentOnly: () => generateGetEstimateData({ 
      homeownerInfo: null,
      relationToProperty: 'Real Estate Agent'
    }),
    
    // Agent and homeowner with same email (merged contact)
    mergedContact: () => {
      const agentData = generateGetEstimateData();
      agentData.homeownerInfo = {
        ...agentData.agentInfo,
        fullName: 'Test Homeowner Name' // Different name, same email
      };
      return agentData;
    },
    
    // Agent and homeowner with different emails
    separateContacts: () => generateGetEstimateData({ 
      separateHomeowner: true,
      relationToProperty: 'Real Estate Agent'
    }),
    
    // Upload mode (no meeting date/time)
    uploadMode: () => generateGetEstimateData({
      rtDigitalSelection: 'upload'
    }),
    
    // Video call mode (requires meeting date/time)
    videoCallMode: () => generateGetEstimateData({
      rtDigitalSelection: 'video-call'
    }),
    
    // In-person mode (requires meeting date/time)
    inPersonMode: () => generateGetEstimateData({
      rtDigitalSelection: 'in-person'
    }),
    
    // Custom brokerage scenario
    customBrokerage: () => generateGetEstimateData({
      agentInfo: {
        ...generateContactInfo({ firstName: 'TestAgent' }),
        brokerage: 'Other',
        customBrokerage: 'Test Custom Brokerage LLC'
      }
    }),
    
    // Minimum required fields only
    minimal: () => {
      const data = generateGetEstimateData();
      return {
        propertyAddress: data.propertyAddress,
        relationToProperty: data.relationToProperty,
        agentInfo: data.agentInfo,
        needFinance: false,
        notes: '',
        rtDigitalSelection: 'upload',
        uploadedMedia: []
      };
    }
  },
  
  // Contact Us scenarios
  contactUs: {
    basic: () => generateContactUsData(),
    minimal: () => ({
      fullName: generateContactInfo({ firstName: 'TestContact' }).fullName,
      email: generateContactInfo({ firstName: 'TestContact' }).email,
      message: 'Test message for Contact Us form'
    })
  },
  
  // Get Qualified scenarios
  getQualified: {
    basic: () => generateGetQualifiedData(),
    homeownerFocus: () => generateGetQualifiedData({
      relationToProperty: 'Homeowner',
      rtDigitalSelection: 'video-call'
    })
  },
  
  // Affiliate scenarios
  affiliate: {
    basic: () => generateAffiliateData(),
    contractor: () => generateAffiliateData({
      serviceType: 'General Contractor',
      numEmployees: 15
    }),
    architect: () => generateAffiliateData({
      serviceType: 'Architect',
      title: 'Principal Architect'
    })
  }
};

module.exports = {
  generateTestSession,
  generateAddress,
  generateContactInfo,
  generateCompanyInfo,
  generateGetEstimateData,
  generateContactUsData,
  generateGetQualifiedData,
  generateAffiliateData,
  createTestScenarios
};