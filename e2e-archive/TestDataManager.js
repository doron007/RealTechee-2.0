/**
 * Test Data Manager
 * 
 * Manages test data for the modular admin test suite including:
 * - Sample data generation
 * - Test data validation
 * - Data consistency checks
 * - Mock data creation
 */

class TestDataManager {
  constructor() {
    this.sampleData = {
      projects: [],
      quotes: [],
      requests: [],
      users: [],
      addresses: []
    };
    
    this.addressPatterns = {
      california: /^.+,\s*CA\s+\d{5}$/i,
      generic: /^.+,\s*[A-Z]{2}\s+\d{5}$/i
    };
    
    this.initializeSampleData();
  }

  /**
   * Initialize sample data for testing
   */
  initializeSampleData() {
    // Sample addresses
    this.sampleData.addresses = [
      '123 Main St, Los Angeles, CA 90210',
      '456 Oak Ave, San Francisco, CA 94102',
      '789 Pine Rd, San Diego, CA 92101',
      '321 Elm St, Sacramento, CA 95814',
      '654 Maple Dr, Fresno, CA 93701'
    ];
    
    // Sample users
    this.sampleData.users = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'agent',
        brokerage: 'Prime Realty'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'agent',
        brokerage: 'Elite Properties'
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'client',
        brokerage: null
      },
      {
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        role: 'admin',
        brokerage: 'RealTechee'
      }
    ];
    
    // Sample projects
    this.sampleData.projects = [
      {
        title: 'Home Inspection - Downtown Loft',
        address: this.sampleData.addresses[0],
        clientName: 'John Doe',
        agentName: 'Jane Smith',
        status: 'Active',
        createdDate: '2024-01-15',
        opportunity: 'High'
      },
      {
        title: 'Repair Assessment - Suburban Home',
        address: this.sampleData.addresses[1],
        clientName: 'Bob Johnson',
        agentName: 'Alice Brown',
        status: 'Completed',
        createdDate: '2024-01-20',
        opportunity: 'Medium'
      },
      {
        title: 'Pre-Sale Inspection - Condo',
        address: this.sampleData.addresses[2],
        clientName: 'Sarah Wilson',
        agentName: 'John Doe',
        status: 'In Progress',
        createdDate: '2024-01-25',
        opportunity: 'Low'
      }
    ];
    
    // Sample quotes
    this.sampleData.quotes = [
      {
        title: 'Inspection Quote - Downtown Loft',
        description: 'Comprehensive home inspection for downtown loft property',
        clientName: 'John Doe',
        clientEmail: 'john.doe@example.com',
        agentName: 'Jane Smith',
        status: 'Sent',
        product: 'Inspection',
        createdDate: '2024-01-10'
      },
      {
        title: 'Repair Quote - Suburban Home',
        description: 'Repair assessment and quote for suburban property',
        clientName: 'Bob Johnson',
        clientEmail: 'bob.johnson@example.com',
        agentName: 'Alice Brown',
        status: 'Approved',
        product: 'Repair',
        createdDate: '2024-01-18'
      },
      {
        title: 'Maintenance Quote - Condo',
        description: 'Ongoing maintenance services for condo property',
        clientName: 'Sarah Wilson',
        clientEmail: 'sarah.wilson@example.com',
        agentName: 'John Doe',
        status: 'Draft',
        product: 'Maintenance',
        createdDate: '2024-01-22'
      }
    ];
    
    // Sample requests
    this.sampleData.requests = [
      {
        message: 'Need urgent inspection for property purchase',
        clientName: 'John Doe',
        clientEmail: 'john.doe@example.com',
        agentName: 'Jane Smith',
        product: 'Inspection',
        status: 'New',
        leadSource: 'Website',
        createdDate: '2024-01-05'
      },
      {
        message: 'Repair assessment needed for insurance claim',
        clientName: 'Bob Johnson',
        clientEmail: 'bob.johnson@example.com',
        agentName: 'Alice Brown',
        product: 'Repair',
        status: 'In Progress',
        leadSource: 'Referral',
        createdDate: '2024-01-12'
      },
      {
        message: 'Regular maintenance service inquiry',
        clientName: 'Sarah Wilson',
        clientEmail: 'sarah.wilson@example.com',
        agentName: 'John Doe',
        product: 'Maintenance',
        status: 'Completed',
        leadSource: 'Social Media',
        createdDate: '2024-01-19'
      }
    ];
  }

  /**
   * Get sample data by type
   */
  getSampleData(type) {
    return this.sampleData[type] || [];
  }

  /**
   * Get random sample data item
   */
  getRandomSampleData(type) {
    const data = this.getSampleData(type);
    return data.length > 0 ? data[Math.floor(Math.random() * data.length)] : null;
  }

  /**
   * Generate test search terms
   */
  generateTestSearchTerms(dataType) {
    const sampleData = this.getSampleData(dataType);
    const searchTerms = [];
    
    if (sampleData.length === 0) {
      return ['test', 'sample', 'demo'];
    }
    
    switch (dataType) {
      case 'projects':
        searchTerms.push(
          sampleData[0].title?.split(' ')[0] || 'project',
          sampleData[0].clientName?.split(' ')[0] || 'client',
          sampleData[0].agentName?.split(' ')[0] || 'agent',
          sampleData[0].status || 'active'
        );
        break;
        
      case 'quotes':
        searchTerms.push(
          sampleData[0].title?.split(' ')[0] || 'quote',
          sampleData[0].clientName?.split(' ')[0] || 'client',
          sampleData[0].product || 'inspection',
          sampleData[0].status || 'sent'
        );
        break;
        
      case 'requests':
        searchTerms.push(
          sampleData[0].message?.split(' ')[0] || 'request',
          sampleData[0].clientName?.split(' ')[0] || 'client',
          sampleData[0].product || 'inspection',
          sampleData[0].leadSource || 'website'
        );
        break;
        
      default:
        searchTerms.push('test', 'sample', 'demo');
    }
    
    return searchTerms.filter(term => term && term.length > 0);
  }

  /**
   * Generate test filter values
   */
  generateTestFilterValues(dataType, filterType) {
    const sampleData = this.getSampleData(dataType);
    const filterValues = [];
    
    switch (filterType) {
      case 'status':
        switch (dataType) {
          case 'projects':
            filterValues.push('Active', 'Completed', 'In Progress', 'Archived');
            break;
          case 'quotes':
            filterValues.push('Draft', 'Sent', 'Approved', 'Declined', 'Expired');
            break;
          case 'requests':
            filterValues.push('New', 'In Progress', 'Completed', 'Cancelled');
            break;
        }
        break;
        
      case 'product':
        filterValues.push('Inspection', 'Repair', 'Maintenance', 'Consulting');
        break;
        
      case 'leadSource':
        filterValues.push('Website', 'Referral', 'Social Media', 'Email', 'Phone');
        break;
        
      case 'opportunity':
        filterValues.push('High', 'Medium', 'Low');
        break;
        
      default:
        filterValues.push('All', 'Active', 'Inactive');
    }
    
    return filterValues;
  }

  /**
   * Validate data format
   */
  validateDataFormat(data, dataType) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    switch (dataType) {
      case 'projects':
        if (!data.title || data.title.length < 3) {
          validation.errors.push('Project title must be at least 3 characters');
          validation.valid = false;
        }
        if (!this.validateAddress(data.address)) {
          validation.warnings.push('Address format may not be valid');
        }
        break;
        
      case 'quotes':
        if (!data.title || data.title.length < 3) {
          validation.errors.push('Quote title must be at least 3 characters');
          validation.valid = false;
        }
        if (!this.validateEmail(data.clientEmail)) {
          validation.errors.push('Client email format is invalid');
          validation.valid = false;
        }
        break;
        
      case 'requests':
        if (!data.message || data.message.length < 10) {
          validation.errors.push('Request message must be at least 10 characters');
          validation.valid = false;
        }
        if (!this.validateEmail(data.clientEmail)) {
          validation.errors.push('Client email format is invalid');
          validation.valid = false;
        }
        break;
    }
    
    return validation;
  }

  /**
   * Validate address format
   */
  validateAddress(address) {
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    return this.addressPatterns.california.test(address) || 
           this.addressPatterns.generic.test(address);
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  /**
   * Generate mock form data
   */
  generateMockFormData(formType) {
    const mockData = {};
    
    switch (formType) {
      case 'project':
        mockData.title = 'Test Project ' + Date.now();
        mockData.address = this.getRandomSampleData('addresses') || '123 Test St, Test City, CA 90210';
        mockData.clientName = 'Test Client';
        mockData.agentName = 'Test Agent';
        mockData.status = 'Active';
        mockData.description = 'This is a test project for automated testing';
        break;
        
      case 'quote':
        mockData.title = 'Test Quote ' + Date.now();
        mockData.description = 'This is a test quote for automated testing';
        mockData.clientName = 'Test Client';
        mockData.clientEmail = 'test@example.com';
        mockData.agentName = 'Test Agent';
        mockData.product = 'Inspection';
        mockData.status = 'Draft';
        break;
        
      case 'request':
        mockData.message = 'This is a test request for automated testing purposes';
        mockData.clientName = 'Test Client';
        mockData.clientEmail = 'test@example.com';
        mockData.agentName = 'Test Agent';
        mockData.product = 'Inspection';
        mockData.leadSource = 'Website';
        mockData.status = 'New';
        break;
        
      default:
        mockData.testField = 'Test Value';
    }
    
    return mockData;
  }

  /**
   * Get data consistency rules
   */
  getDataConsistencyRules() {
    return {
      addressFormat: {
        pattern: this.addressPatterns.california,
        message: 'Address must be in format: Street, City, CA ZIP'
      },
      emailFormat: {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: 'Email must be in valid format'
      },
      statusValues: {
        projects: ['Active', 'Completed', 'In Progress', 'Archived'],
        quotes: ['Draft', 'Sent', 'Approved', 'Declined', 'Expired'],
        requests: ['New', 'In Progress', 'Completed', 'Cancelled']
      },
      productValues: ['Inspection', 'Repair', 'Maintenance', 'Consulting'],
      leadSourceValues: ['Website', 'Referral', 'Social Media', 'Email', 'Phone'],
      opportunityValues: ['High', 'Medium', 'Low']
    };
  }

  /**
   * Validate data consistency across pages
   */
  validateDataConsistency(extractedData) {
    const rules = this.getDataConsistencyRules();
    const consistencyResults = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check address format consistency
    if (extractedData.addresses && extractedData.addresses.length > 0) {
      const invalidAddresses = extractedData.addresses.filter(addr => 
        !this.validateAddress(addr)
      );
      
      if (invalidAddresses.length > 0) {
        consistencyResults.warnings.push({
          type: 'address_format',
          message: `${invalidAddresses.length} addresses don't match expected format`,
          details: invalidAddresses
        });
      }
    }
    
    // Check email format consistency
    if (extractedData.emails && extractedData.emails.length > 0) {
      const invalidEmails = extractedData.emails.filter(email => 
        !this.validateEmail(email)
      );
      
      if (invalidEmails.length > 0) {
        consistencyResults.errors.push({
          type: 'email_format',
          message: `${invalidEmails.length} emails have invalid format`,
          details: invalidEmails
        });
        consistencyResults.valid = false;
      }
    }
    
    return consistencyResults;
  }

  /**
   * Get summary of test data
   */
  getTestDataSummary() {
    return {
      projects: this.sampleData.projects.length,
      quotes: this.sampleData.quotes.length,
      requests: this.sampleData.requests.length,
      users: this.sampleData.users.length,
      addresses: this.sampleData.addresses.length,
      totalRecords: Object.values(this.sampleData).reduce((sum, arr) => sum + arr.length, 0)
    };
  }
}

module.exports = TestDataManager;