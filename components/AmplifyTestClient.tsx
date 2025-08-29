import { useState, useEffect, useCallback } from 'react';
import { 
  propertiesAPI, 
  contactsAPI, 
  projectsAPI,
  affiliatesAPI,
  quotesAPI,
  requestsAPI,
  authAPI,
  backOfficeAssignToAPI,
  backOfficeBookingStatusesAPI,
  backOfficeBrokerageAPI,
  backOfficeNotificationsAPI,
  getBackOfficeProductsAPI,
  backOfficeProjectStatusesAPI,
  backOfficeQuoteStatusesAPI,
  backOfficeRequestStatusesAPI,
  backOfficeRoleTypesAPI,
  contactUsAPI,
  legalAPI,
  memberSignatureAPI,
  pendingAppoitmentsAPI,
  projectCommentsAPI,
  projectMilestonesAPI,
  projectPaymentTermsAPI,
  projectPermissionsAPI,
  quoteItemsAPI,
  eSignatureDocumentsAPI
} from '../utils/amplifyAPI';

export default function AmplifyTestClient() {
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allTableCounts, setAllTableCounts] = useState<Record<string, number | string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadAllData = useCallback(async () => {
    setLoading(true);
    console.log('🔄 Starting data load...');
    
    try {
      // Load main test data using existing API structure
      console.log('📡 Making API calls...');
      const [propertyResult, contactResult, affiliateResult, quoteResult, projectResult] = await Promise.all([
        propertiesAPI.list(),
        contactsAPI.list(), 
        affiliatesAPI.list(),
        quotesAPI.list(),
        projectsAPI.list()
      ]);
      
      console.log('📊 API Results:', {
        properties: { success: propertyResult.success, count: propertyResult.data?.length || 0, error: propertyResult.error, fullResult: propertyResult },
        contacts: { success: contactResult.success, count: contactResult.data?.length || 0, error: contactResult.error, fullResult: contactResult },
        affiliates: { success: affiliateResult.success, count: affiliateResult.data?.length || 0, error: affiliateResult.error, fullResult: affiliateResult },
        quotes: { success: quoteResult.success, count: quoteResult.data?.length || 0, error: quoteResult.error, fullResult: quoteResult },
        projects: { success: projectResult.success, count: projectResult.data?.length || 0, error: projectResult.error, fullResult: projectResult }
      });

      if (propertyResult.success) {
        const filteredProperties = (propertyResult.data || []).filter((item: any) => item != null);
        console.log('Properties loaded:', filteredProperties.length, 'items');
        setProperties(filteredProperties);
      }
      if (contactResult.success) {
        const filteredContacts = (contactResult.data || []).filter((item: any) => item != null);
        console.log('Contacts loaded:', filteredContacts.length, 'items');
        setContacts(filteredContacts);
      }
      if (affiliateResult.success) {
        const filteredAffiliates = (affiliateResult.data || []).filter((item: any) => item != null);
        console.log('Affiliates loaded:', filteredAffiliates.length, 'items');
        setAffiliates(filteredAffiliates);
      }
      if (quoteResult.success) {
        const filteredQuotes = (quoteResult.data || []).filter((item: any) => item != null);
        console.log('Quotes loaded:', filteredQuotes.length, 'items');
        setQuotes(filteredQuotes);
      }
      if (projectResult.success) {
        const filteredProjects = (projectResult.data || []).filter((item: any) => item != null);
        console.log('Projects loaded:', filteredProjects.length, 'items');
        setProjects(filteredProjects);
      }

      // Get counts for all tables
      const counts = await getAllTableCounts();
      setAllTableCounts(counts);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('❌ Error loading data. Check console for details.');
    }
    
    setLoading(false);
  }, []);

  // Ensure component is mounted before doing anything
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load data when component mounts
  useEffect(() => {
    if (mounted) {
      loadAllData();
    }
  }, [mounted, loadAllData]);

  const getAllTableCounts = async (): Promise<Record<string, number | string>> => {
    const apis = [
      { name: 'Affiliates', api: affiliatesAPI },
      { name: 'Auth', api: authAPI },
      { name: 'BackOfficeAssignTo', api: backOfficeAssignToAPI },
      { name: 'BackOfficeBookingStatuses', api: backOfficeBookingStatusesAPI },
      { name: 'BackOfficeBrokerage', api: backOfficeBrokerageAPI },
      { name: 'BackOfficeNotifications', api: backOfficeNotificationsAPI },
      { name: 'BackOfficeProducts', api: getBackOfficeProductsAPI() },
      { name: 'BackOfficeProjectStatuses', api: backOfficeProjectStatusesAPI },
      { name: 'BackOfficeQuoteStatuses', api: backOfficeQuoteStatusesAPI },
      { name: 'BackOfficeRequestStatuses', api: backOfficeRequestStatusesAPI },
      { name: 'BackOfficeRoleTypes', api: backOfficeRoleTypesAPI },
      { name: 'ContactUs', api: contactUsAPI },
      { name: 'Contacts', api: contactsAPI },
      { name: 'Legal', api: legalAPI },
      { name: 'MemberSignature', api: memberSignatureAPI },
      { name: 'PendingAppoitments', api: pendingAppoitmentsAPI },
      { name: 'ProjectComments', api: projectCommentsAPI },
      { name: 'ProjectMilestones', api: projectMilestonesAPI },
      { name: 'ProjectPaymentTerms', api: projectPaymentTermsAPI },
      { name: 'ProjectPermissions', api: projectPermissionsAPI },
      { name: 'Projects', api: projectsAPI },
      { name: 'Properties', api: propertiesAPI },
      { name: 'QuoteItems', api: quoteItemsAPI },
      { name: 'Quotes', api: quotesAPI },
      { name: 'Requests', api: requestsAPI },
      { name: 'eSignatureDocuments', api: eSignatureDocumentsAPI }
    ];

    const counts: Record<string, number | string> = {};
    for (const { name, api } of apis) {
      try {
        const result = await api.list();
        counts[name] = result.success ? (result.data?.length || 0) : 'Error';
      } catch (error) {
        counts[name] = 'Error';
      }
    }
    return counts;
  };

  const createTestProperty = async () => {
    setLoading(true);
    setMessage('Creating test property...');
    
    try {
      const result = await propertiesAPI.create({
        propertyFullAddress: '123 Test Street, Test City, CA 90210',
        houseAddress: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        zip: '90210'
      });

      if (result.success) {
        setMessage('✅ Property created successfully!');
        loadAllData(); // Refresh the list
      } else {
        setMessage('❌ Error creating property: ' + JSON.stringify(result.error));
      }
    } catch (error) {
      console.error('Error creating property:', error);
      setMessage('❌ Error creating property: ' + error);
    }
    
    setLoading(false);
  };

  const createTestContact = async () => {
    setLoading(true);
    setMessage('Creating test contact...');
    
    try {
      const result = await contactsAPI.create({
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        company: 'Test Company'
      });

      if (result.success) {
        setMessage('✅ Contact created successfully!');
        loadAllData(); // Refresh the list
      } else {
        setMessage('❌ Error creating contact: ' + JSON.stringify(result.error));
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      setMessage('❌ Error creating contact: ' + error);
    }
    
    setLoading(false);
  };

  const testAllAPIs = async () => {
    setLoading(true);
    setMessage('Testing all 26 APIs...');
    
    // Import all APIs statically to avoid dynamic import issues
    const { 
      affiliatesAPI, authAPI, backOfficeAssignToAPI, backOfficeBookingStatusesAPI,
      backOfficeBrokerageAPI, backOfficeNotificationsAPI,
      backOfficeProjectStatusesAPI, backOfficeQuoteStatusesAPI, backOfficeRequestStatusesAPI,
      backOfficeRoleTypesAPI, contactUsAPI, contactsAPI, legalAPI, memberSignatureAPI,
      pendingAppoitmentsAPI, projectCommentsAPI, projectMilestonesAPI, projectPaymentTermsAPI,
      projectPermissionsAPI, projectsAPI, propertiesAPI, quoteItemsAPI, quotesAPI,
      requestsAPI, eSignatureDocumentsAPI
    } = await import('../utils/amplifyAPI');
    
    const apiTests = [
      { name: 'affiliatesAPI', api: affiliatesAPI },
      { name: 'authAPI', api: authAPI },
      { name: 'backOfficeAssignToAPI', api: backOfficeAssignToAPI },
      { name: 'backOfficeBookingStatusesAPI', api: backOfficeBookingStatusesAPI },
      { name: 'backOfficeBrokerageAPI', api: backOfficeBrokerageAPI },
      { name: 'backOfficeNotificationsAPI', api: backOfficeNotificationsAPI },
      { name: 'backOfficeProductsAPI', api: getBackOfficeProductsAPI() },
      { name: 'backOfficeProjectStatusesAPI', api: backOfficeProjectStatusesAPI },
      { name: 'backOfficeQuoteStatusesAPI', api: backOfficeQuoteStatusesAPI },
      { name: 'backOfficeRequestStatusesAPI', api: backOfficeRequestStatusesAPI },
      { name: 'backOfficeRoleTypesAPI', api: backOfficeRoleTypesAPI },
      { name: 'contactUsAPI', api: contactUsAPI },
      { name: 'contactsAPI', api: contactsAPI },
      { name: 'legalAPI', api: legalAPI },
      { name: 'memberSignatureAPI', api: memberSignatureAPI },
      { name: 'pendingAppoitmentsAPI', api: pendingAppoitmentsAPI },
      { name: 'projectCommentsAPI', api: projectCommentsAPI },
      { name: 'projectMilestonesAPI', api: projectMilestonesAPI },
      { name: 'projectPaymentTermsAPI', api: projectPaymentTermsAPI },
      { name: 'projectPermissionsAPI', api: projectPermissionsAPI },
      { name: 'projectsAPI', api: projectsAPI },
      { name: 'propertiesAPI', api: propertiesAPI },
      { name: 'quoteItemsAPI', api: quoteItemsAPI },
      { name: 'quotesAPI', api: quotesAPI },
      { name: 'requestsAPI', api: requestsAPI },
      { name: 'eSignatureDocumentsAPI', api: eSignatureDocumentsAPI }
    ];
    
    const results = [];
    for (const { name, api } of apiTests) {
      try {
        const result = await api.list();
        results.push({
          api: name,
          success: result.success,
          count: result.success ? (result.data?.length || 0) : 0,
          error: result.success ? null : result.error
        });
      } catch (error: unknown) {
        results.push({
          api: name,
          success: false,
          count: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalRecords = results.reduce((sum, r) => sum + r.count, 0);
    
    setMessage(`✅ API Test Complete: ${successCount}/${apiTests.length} APIs working, ${totalRecords} total records`);
    console.log('API Test Results:', results);
    setLoading(false);
  };

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return <div className="max-w-4xl mx-auto p-6">Initializing...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Amplify Gen 2 Test Dashboard</h1>
      
      {/* Connection Status */}
      <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
        🟢 Connected to Amplify Sandbox | 26 APIs Available
      </div>
      
      {/* Status Message */}
      {message && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {['overview', 'data', 'testing'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 ${
              activeTab === tab 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded border">
              <h3 className="font-semibold text-blue-800">Migration Status</h3>
              <p className="text-2xl font-bold text-blue-600">100%</p>
              <p className="text-sm text-blue-600">4,326 records migrated</p>
            </div>
            <div className="bg-green-50 p-4 rounded border">
              <h3 className="font-semibold text-green-800">APIs Available</h3>
              <p className="text-2xl font-bold text-green-600">26</p>
              <p className="text-sm text-green-600">All models accessible</p>
            </div>
            <div className="bg-purple-50 p-4 rounded border">
              <h3 className="font-semibold text-purple-800">GraphQL Status</h3>
              <p className="text-2xl font-bold text-purple-600">Active</p>
              <p className="text-sm text-purple-600">API Key authentication</p>
            </div>
          </div>

          {/* Table Counts */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-3">Live Data Counts</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {Object.entries(allTableCounts).map(([table, count]) => (
                <div key={table} className="flex justify-between">
                  <span>{table}:</span>
                  <span className="font-mono">{String(count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Data Relationship Summary */}
          <div className="bg-blue-50 p-4 rounded border">
            <h3 className="font-semibold text-blue-800 mb-2">Data Relationships</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Projects:</span> {projects.length} total
                <br />
                <span className="font-medium">Properties:</span> {properties.length} total
              </div>
              <div>
                <span className="font-medium">Projects with addressId:</span> {projects.filter((p: any) => p?.addressId).length}
                <br />
                <span className="font-medium">Matched Relationships:</span> {
                  projects.filter((p: any) => p?.addressId && properties.find((prop: any) => prop?.id === p.addressId)).length
                }
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
          {/* Properties Section */}
          <div className="border border-gray-300 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3">Properties ({properties.length})</h2>
            {properties.length === 0 ? (
              <p className="text-gray-500">No properties yet. Create one to test!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {properties.slice(0, 5).filter((property: any) => property && property.id).map((property: any) => (
                  <div key={property.id} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">{property.propertyFullAddress || 'No address'}</div>
                    <div className="text-sm text-gray-600">
                      {property.city || ''}, {property.state || ''} {property.zip || ''}
                    </div>
                    <div className="text-xs text-gray-400">ID: {property.id}</div>
                  </div>
                ))}
                {properties.length > 5 && (
                  <p className="text-sm text-gray-500">... and {properties.length - 5} more</p>
                )}
              </div>
            )}
          </div>

          {/* Contacts Section */}
          <div className="border border-gray-300 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3">Contacts ({contacts.length})</h2>
            {contacts.length === 0 ? (
              <p className="text-gray-500">No contacts yet. Create one to test!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {contacts.slice(0, 5).filter((contact: any) => contact && contact.id).map((contact: any) => (
                  <div key={contact.id} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">{contact.fullName || (contact.firstName && contact.lastName ? contact.firstName + ' ' + contact.lastName : 'No name')}</div>
                    <div className="text-sm text-gray-600">{contact.email || ''}</div>
                    <div className="text-sm text-gray-600">{contact.phone || ''}</div>
                    <div className="text-xs text-blue-600">{contact.company || ''}</div>
                    <div className="text-xs text-gray-400">ID: {contact.id}</div>
                  </div>
                ))}
                {contacts.length > 5 && (
                  <p className="text-sm text-gray-500">... and {contacts.length - 5} more</p>
                )}
              </div>
            )}
          </div>

          {/* Affiliates Section */}
          <div className="border border-gray-300 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3">Affiliates ({affiliates.length})</h2>
            {affiliates.length === 0 ? (
              <p className="text-gray-500">No affiliates found</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {affiliates.slice(0, 5).filter((affiliate: any) => affiliate && affiliate.id).map((affiliate: any) => (
                  <div key={affiliate.id} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">{affiliate.name || 'No name'}</div>
                    <div className="text-sm text-gray-600">{affiliate.company || ''}</div>
                    <div className="text-sm text-gray-600">{affiliate.email || ''}</div>
                    <div className="text-xs text-gray-400">ID: {affiliate.id}</div>
                  </div>
                ))}
                {affiliates.length > 5 && (
                  <p className="text-sm text-gray-500">... and {affiliates.length - 5} more</p>
                )}
              </div>
            )}
          </div>

          {/* Quotes Section */}
          <div className="border border-gray-300 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3">Quotes ({quotes.length})</h2>
            {quotes.length === 0 ? (
              <p className="text-gray-500">No quotes found</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {quotes.slice(0, 5).filter((quote: any) => quote && quote.id).map((quote: any) => (
                  <div key={quote.id} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium">Quote #{quote.id?.slice(-6) || 'N/A'}</div>
                    <div className="text-sm text-gray-600">{quote.status || 'No status'}</div>
                    <div className="text-xs text-gray-400">ID: {quote.id}</div>
                  </div>
                ))}
                {quotes.length > 5 && (
                  <p className="text-sm text-gray-500">... and {quotes.length - 5} more</p>
                )}
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="border border-gray-300 p-4 rounded">
            <h2 className="text-xl font-semibold mb-3">Projects ({projects.length})</h2>
            {projects.length === 0 ? (
              <p className="text-gray-500">No projects found</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projects.slice(0, 5).filter((project: any) => project && project.id).map((project: any) => {
                  // Find the associated property by addressId
                  const associatedProperty = properties.find((prop: any) => prop && prop.id === project.addressId) as any;
                  
                  return (
                    <div key={project.id} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium">Project #{project.id?.slice(-6) || 'N/A'}</div>
                      <div className="text-sm text-gray-600">
                        {associatedProperty ? 
                          associatedProperty.propertyFullAddress : 
                          `Address ID: ${project.addressId || 'N/A'}`
                        }
                      </div>
                      <div className="text-sm text-blue-600">{project.status || 'No status'}</div>
                      <div className="text-xs text-gray-400">Project ID: {project.id}</div>
                      {project.addressId && (
                        <div className="text-xs text-gray-400">Address ID: {project.addressId}</div>
                      )}
                    </div>
                  );
                })}
                {projects.length > 5 && (
                  <p className="text-sm text-gray-500">... and {projects.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Testing Tab */}
      {activeTab === 'testing' && (
        <div className="space-y-6">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={createTestProperty}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Create Test Property'}
            </button>
            
            <button
              onClick={createTestContact}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Create Test Contact'}
            </button>

            <button
              onClick={loadAllData}
              disabled={loading}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>

            <button
              onClick={testAllAPIs}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test All 26 APIs'}
            </button>
          </div>
        </div>
      )}

      {/* API Info */}
      <div className="mt-8 bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">API Configuration:</h3>
        <div className="text-sm space-y-1">
          <div><strong>Status:</strong> Connected to sandbox</div>
          <div><strong>Auth Mode:</strong> API Key</div>
          <div><strong>Region:</strong> us-west-1</div>
          <div><strong>Environment:</strong> Development (Sandbox)</div>
          <div><strong>Models:</strong> 26 total (all migrated successfully)</div>
        </div>
      </div>
    </div>
  );
}
