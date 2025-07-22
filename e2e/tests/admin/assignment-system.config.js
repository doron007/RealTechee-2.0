// Assignment System Test Configuration
// Configuration specific to assignment system E2E tests

export const assignmentTestConfig = {
  // Test timeouts
  timeouts: {
    formSubmission: 15000,
    requestLoad: 10000,
    assignment: 5000,
    save: 10000,
    cleanup: 30000
  },
  
  // Test URLs
  urls: {
    base: 'http://localhost:3000',
    getEstimate: 'http://localhost:3000/contact/get-estimate',
    adminRequests: 'http://localhost:3000/admin/requests',
    adminDashboard: 'http://localhost:3000/admin/dashboard'
  },
  
  // Test credentials
  credentials: {
    admin: {
      email: 'info@realtechee.com',
      password: 'Sababa123!'
    }
  },
  
  // Test data patterns
  testData: {
    // Common test prefixes for easy identification
    prefixes: {
      assignment: 'Assignment Test',
      roundRobin: 'RR Test',
      performance: 'Perf Test',
      accessibility: 'A11y Test',
      cleanup: 'Cleanup Test'
    },
    
    // Test property addresses
    addresses: {
      default: {
        streetAddress: '123 Test Assignment St',
        city: 'Test City',
        state: 'CA',
        zip: '90210'
      },
      roundRobin: [
        { streetAddress: '100 Round Robin Ave', city: 'RR City', state: 'CA', zip: '90210' },
        { streetAddress: '200 Round Robin Ave', city: 'RR City', state: 'CA', zip: '90210' },
        { streetAddress: '300 Round Robin Ave', city: 'RR City', state: 'CA', zip: '90210' }
      ]
    },
    
    // Test agent data
    agents: {
      default: {
        fullName: 'Test Agent Assignment',
        email: 'agent.assignment@test.com',
        phone: '(555) 123-4567',
        company: 'Test Assignment Brokerage'
      },
      roundRobin: [
        { fullName: 'RR Agent 1', email: 'rr1@test.com', phone: '(555) 111-1111', company: 'RR Brokerage 1' },
        { fullName: 'RR Agent 2', email: 'rr2@test.com', phone: '(555) 222-2222', company: 'RR Brokerage 2' },
        { fullName: 'RR Agent 3', email: 'rr3@test.com', phone: '(555) 333-3333', company: 'RR Brokerage 3' }
      ]
    },
    
    // Test project types
    projects: [
      'Kitchen Renovation',
      'Bathroom Renovation',
      'Full Home Renovation',
      'Staging Services'
    ]
  },
  
  // Performance benchmarks
  performance: {
    maxAssignmentTime: 3000, // 3 seconds
    maxFormSubmissionTime: 15000, // 15 seconds
    maxPageLoadTime: 5000, // 5 seconds
    maxSaveTime: 10000 // 10 seconds
  },
  
  // Test selectors
  selectors: {
    // Form selectors
    relationToProperty: 'select[name="relationToProperty"]',
    streetAddress: 'input[name="propertyAddress.streetAddress"]',
    city: 'input[name="propertyAddress.city"]',
    state: 'select[name="propertyAddress.state"]',
    zip: 'input[name="propertyAddress.zip"]',
    agentName: 'input[name="agentInfo.fullName"]',
    agentEmail: 'input[name="agentInfo.email"]',
    agentPhone: 'input[name="agentInfo.phone"]',
    agentCompany: 'input[name="agentInfo.company"]',
    projectType: 'select[name="rtDigitalSelection"]',
    notes: 'textarea[name="notes"]',
    submitButton: 'button[type="submit"]',
    
    // Admin panel selectors
    requestRow: '[data-testid="request-row"]',
    requestId: '[data-testid="request-id"]',
    assignmentDropdown: 'select:has-text("Assigned To")',
    assignmentCell: '[data-testid="assignment-cell"]',
    saveButton: 'button:has-text("Save Changes")',
    deleteButton: 'button:has-text("Delete")',
    confirmDelete: 'button:has-text("Yes, Delete")',
    
    // Success/error messages
    successMessage: 'text=Thank you for your request!',
    savedMessage: 'text=saved successfully',
    deletedMessage: 'text=deleted successfully',
    errorMessage: 'text=not available or invalid',
    
    // Page titles
    getEstimateTitle: 'text=Get Your Estimate',
    requestsTitle: 'text=Requests Management',
    dashboardTitle: 'text=Admin Dashboard',
    requestInfoTitle: 'text=Request Information'
  },
  
  // Test assertions
  assertions: {
    // Minimum number of AEs expected in dropdown
    minAEOptions: 2,
    
    // Maximum acceptable assignment time (ms)
    maxAssignmentDuration: 3000,
    
    // Round-robin distribution tolerance
    distributionTolerance: 0.6, // Max 60% to any single AE
    
    // Accessibility requirements
    accessibility: {
      keyboardNavigation: true,
      focusManagement: true,
      properLabeling: true
    }
  },
  
  // Test cleanup patterns
  cleanup: {
    // Email patterns to identify test data
    testEmailPatterns: [
      'agent.assignment@test.com',
      'agent.failover@test.com',
      'rr1@test.com',
      'rr2@test.com',
      'rr3@test.com',
      'perf.test@test.com',
      'a11y.test@test.com'
    ],
    
    // Agent name patterns
    testAgentPatterns: [
      'Test Agent Assignment',
      'Test Agent Failover',
      'RR Agent 1',
      'RR Agent 2',
      'RR Agent 3',
      'Perf Test Agent',
      'A11y Test Agent'
    ],
    
    // Address patterns
    testAddressPatterns: [
      'Assignment Test St',
      'Round Robin Ave',
      'Performance Test Blvd',
      'Accessibility Test Dr'
    ]
  },
  
  // Test environment checks
  environment: {
    // Required environment variables
    requiredEnvVars: [
      'NODE_ENV'
    ],
    
    // URLs to check before running tests
    healthChecks: [
      'http://localhost:3000/health',
      'http://localhost:3000/api/health'
    ],
    
    // Services that should be running
    requiredServices: [
      'Next.js development server',
      'AWS Amplify backend',
      'DynamoDB local (if applicable)'
    ]
  },
  
  // Test reporting
  reporting: {
    // Test result categories
    categories: {
      core: 'Core Assignment Functionality',
      autoAssign: 'Auto-Assignment Features',
      roundRobin: 'Round-Robin Distribution',
      performance: 'Performance & Load Testing',
      accessibility: 'Accessibility Compliance',
      edgeCases: 'Edge Case Handling',
      cleanup: 'Data Cleanup & Maintenance'
    },
    
    // Success criteria
    successCriteria: {
      minPassRate: 0.95, // 95% of tests must pass
      maxFailureRate: 0.05, // Max 5% failure rate
      performanceThreshold: 3000 // Max 3 seconds for critical operations
    }
  }
};

export default assignmentTestConfig;