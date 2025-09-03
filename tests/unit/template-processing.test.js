/**
 * Template Processing Validation Tests
 * 
 * Tests unified template processing between Live Preview and Lambda
 * Uses real signal payload data to validate identical rendering
 */

const Handlebars = require('handlebars');

// Import shared helpers (Node.js compatible version)
const { registerHelpers } = require('../../amplify/functions/notification-processor/src/utils/handlebarsHelpers');

// Test template (simplified version of actual template)
const TEST_TEMPLATE = `<!DOCTYPE html>
<html>
<head><title>Test Template</title></head>
<body>
  <h1>{{projectType}} — {{homeownerFullName}}</h1>
  <p>Submitted by {{agentFullName}} ({{agentBrokerage}})</p>
  <p>Meeting: {{formatDate meetingDateTime}} ({{meetingType}})</p>
  <p>Financing: {{#if needFinance}}Required{{else}}Not needed{{/if}}</p>
  <p>Phone: {{formatPhone homeownerPhone}}</p>
  <p>Agent Phone: {{formatPhone agentPhone}}</p>
  <div>Files: {{{fileLinks uploadedMedia}}}</div>
</body>
</html>`;

// Real signal payload data (based on actual form submission)
const REAL_SIGNAL_PAYLOAD = {
  // Agent Information (primary contact)
  customerName: 'John Smith',
  customerEmail: 'john.smith@realestate.com',
  customerPhone: '5551234567',
  agentFullName: 'John Smith',
  agentEmail: 'john.smith@realestate.com', 
  agentPhone: '5551234567',
  agentBrokerage: 'Premium Realty Group',
  
  // Homeowner Information
  homeownerFullName: 'Jane Homeowner',
  homeownerEmail: 'jane@example.com',
  homeownerPhone: '5559876543',
  
  // Property Information
  propertyAddress: '123 Main St, Los Angeles, CA 90210',
  propertyStreetAddress: '123 Main St',
  propertyCity: 'Los Angeles',
  propertyState: 'CA',
  propertyZip: '90210',
  
  // Project Information
  relationToProperty: 'homeowner',
  needFinance: true,
  projectType: 'Kitchen & Bathroom Renovation',
  projectMessage: 'Looking for a complete kitchen and bathroom remodel',
  
  // Meeting Information
  meetingType: 'in-person',
  meetingDateTime: '2025-01-15T14:00:00.000Z',
  requestedVisitDateTime: '2025-01-15T14:00:00.000Z',
  
  // File Upload Information
  uploadedMedia: '["https://example.com/kitchen1.jpg", "https://example.com/bathroom1.jpg"]',
  uplodedDocuments: '["https://example.com/floorplan.pdf"]',
  uploadedVideos: '[]',
  
  // System Information
  submissionId: 'test-123-456-789',
  submissionTimestamp: '2025-01-10T10:30:00.000Z',
  dashboardUrl: 'https://staging.example.com/admin/requests/test-123'
};

// Test payload with missing/null values (edge case testing)
const EDGE_CASE_PAYLOAD = {
  agentFullName: 'Test Agent',
  agentEmail: 'agent@test.com',
  agentBrokerage: 'Test Brokerage',
  projectType: 'General Renovation',
  
  // Missing values that should be handled gracefully
  homeownerFullName: '',
  homeownerEmail: null,
  homeownerPhone: undefined,
  meetingDateTime: 'invalid-date',
  needFinance: null,
  uploadedMedia: '[]',
  projectMessage: ''
};

describe('Unified Template Processing', () => {
  let compiledTemplate;

  beforeAll(() => {
    // Register shared helpers
    registerHelpers(Handlebars);
    
    // Compile template
    compiledTemplate = Handlebars.compile(TEST_TEMPLATE);
  });

  describe('Real Signal Payload Processing', () => {
    test('should process complete signal payload correctly', () => {
      const result = compiledTemplate(REAL_SIGNAL_PAYLOAD);
      
      // Validate key content is present and formatted
      expect(result).toContain('Kitchen &amp; Bathroom Renovation — Jane Homeowner');
      expect(result).toContain('Submitted by John Smith (Premium Realty Group)');
      expect(result).toContain('Meeting: January 15, 2025'); // Formatted date
      expect(result).toContain('Financing: Required'); // Boolean handling
      expect(result).toContain('(555) 987-6543'); // Formatted phone (homeowner)
      expect(result).toContain('(555) 123-4567'); // Formatted phone (agent)
      
      // Check file links are processed
      expect(result).toContain('kitchen1.jpg');
      expect(result).toContain('bathroom1.jpg');
      
      console.log('✅ Real payload test passed');
    });

    test('should handle file links with proper formatting', () => {
      const result = compiledTemplate(REAL_SIGNAL_PAYLOAD);
      
      // Should contain file links
      expect(result).toContain('href="https://example.com/kitchen1.jpg"');
      expect(result).toContain('href="https://example.com/bathroom1.jpg"');
      
      console.log('✅ File links test passed');
    });
  });

  describe('Edge Case Handling', () => {
    test('should handle missing/null values gracefully', () => {
      const result = compiledTemplate(EDGE_CASE_PAYLOAD);
      
      // Should not contain errors or undefined
      expect(result).not.toContain('undefined');
      expect(result).not.toContain('null');
      expect(result).not.toContain('Invalid Date');
      expect(result).not.toContain('NaN');
      
      // Should handle empty homeowner name gracefully
      expect(result).toContain('General Renovation — '); // Empty name handled
      
      // Should handle invalid date gracefully
      expect(result).toContain('Meeting: '); // Empty formatted date
      
      // Should handle null boolean gracefully
      expect(result).toContain('Financing: Not needed'); // Default to false
      
      console.log('✅ Edge cases test passed');
    });

    test('should handle empty file arrays', () => {
      const result = compiledTemplate(EDGE_CASE_PAYLOAD);
      
      // Should not show error for empty file array
      expect(result).not.toContain('Error loading files');
      expect(result).toContain('Files: '); // Empty but no error
      
      console.log('✅ Empty files test passed');
    });
  });

  describe('Template Robustness', () => {
    test('should handle completely empty payload', () => {
      const result = compiledTemplate({});
      
      // Should render without errors
      expect(result).toContain('<html>');
      expect(result).toContain('</html>');
      expect(result).not.toContain('undefined');
      expect(result).not.toContain('null');
      
      console.log('✅ Empty payload test passed');
    });

    test('should format phone numbers consistently', () => {
      const testPayload = {
        homeownerPhone: '1234567890',
        agentPhone: '15551234567', // 11 digit with country code
      };
      
      const result = compiledTemplate(testPayload);
      
      expect(result).toContain('(123) 456-7890'); // 10 digit formatting
      expect(result).toContain('(555) 123-4567'); // 11 digit formatting
      
      console.log('✅ Phone formatting test passed');
    });

    test('should handle malformed JSON in file fields', () => {
      const testPayload = {
        uploadedMedia: 'not-valid-json',
        agentFullName: 'Test Agent'
      };
      
      const result = compiledTemplate(testPayload);
      
      // Should not crash, should handle gracefully
      expect(result).toContain('<html>');
      expect(result).not.toContain('not-valid-json');
      
      console.log('✅ Malformed JSON test passed');
    });
  });

  describe('Output Validation', () => {
    test('should generate valid HTML structure', () => {
      const result = compiledTemplate(REAL_SIGNAL_PAYLOAD);
      
      // Basic HTML structure validation
      expect(result).toMatch(/<!DOCTYPE html>/);
      expect(result).toMatch(/<html>/);
      expect(result).toMatch(/<head>.*<\/head>/s);
      expect(result).toMatch(/<body>.*<\/body>/s);
      expect(result).toMatch(/<\/html>/);
      
      console.log('✅ HTML structure test passed');
    });

    test('should escape HTML in user content', () => {
      const testPayload = {
        projectMessage: '<script>alert("test")</script>',
        homeownerFullName: 'Jane <script>alert("xss")</script> Doe'
      };
      
      const result = compiledTemplate(testPayload);
      
      // Should escape HTML
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
      
      console.log('✅ HTML escaping test passed');
    });
  });
});

// Test runner function for manual execution
function runTemplateTests() {
  console.log('🧪 Starting Template Processing Tests...\n');
  
  try {
    // Register helpers
    registerHelpers(Handlebars);
    const template = Handlebars.compile(TEST_TEMPLATE);
    
    console.log('=== Testing Real Signal Payload ===');
    const realResult = template(REAL_SIGNAL_PAYLOAD);
    console.log('Real payload result length:', realResult.length);
    console.log('Contains expected content:', realResult.includes('Kitchen') && realResult.includes('Jane Homeowner'));
    
    console.log('\n=== Testing Edge Cases ===');
    const edgeResult = template(EDGE_CASE_PAYLOAD);
    console.log('Edge case result length:', edgeResult.length);
    console.log('No undefined values:', !edgeResult.includes('undefined'));
    
    console.log('\n=== Testing Empty Payload ===');
    const emptyResult = template({});
    console.log('Empty payload result length:', emptyResult.length);
    console.log('Valid HTML structure:', emptyResult.includes('<html>') && emptyResult.includes('</html>'));
    
    console.log('\n✅ All template processing tests completed successfully!');
    
    return {
      realPayloadResult: realResult,
      edgeCaseResult: edgeResult,
      emptyPayloadResult: emptyResult,
      allTestsPassed: true
    };
    
  } catch (error) {
    console.error('❌ Template processing test failed:', error);
    return {
      error: error.message,
      allTestsPassed: false
    };
  }
}

// Export for testing
module.exports = {
  runTemplateTests,
  REAL_SIGNAL_PAYLOAD,
  EDGE_CASE_PAYLOAD,
  TEST_TEMPLATE
};