import { useState, useEffect } from 'react';
import { propertiesAPI, contactsAPI, projectsAPI, client } from '../utils/amplifyAPI';

export default function GraphQLDebugger() {
  const [debugData, setDebugData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const runDebugAnalysis = async () => {
    if (!mounted) return;
    
    setLoading(true);
    console.log('🔍 Starting GraphQL Debug Analysis...');
    
    const debug: any = {
      timestamp: new Date().toISOString(),
      queries: {}
    };

    // Test Properties query with detailed logging
    console.log('\n📊 Testing Properties Query...');
    try {
      // Use the raw client to get more detailed response
      const propertiesResult = await (client.models as any).Properties.list({ limit: 10 });
      
      console.log('Raw Properties Response:', propertiesResult);
      console.log('Properties Data Array:', propertiesResult.data);
      console.log('Properties Errors:', propertiesResult.errors);
      
      debug.queries.properties = {
        success: !!propertiesResult.data,
        totalItems: propertiesResult.data?.length || 0,
        nullItems: propertiesResult.data?.filter((item: any) => item === null).length || 0,
        validItems: propertiesResult.data?.filter((item: any) => item !== null).length || 0,
        errors: propertiesResult.errors || null,
        sampleItem: propertiesResult.data?.find((item: any) => item !== null) || null,
        allItemsNull: propertiesResult.data?.every((item: any) => item === null) || false,
        rawResponse: propertiesResult
      };

      // Also test with the API wrapper
      const apiResult = await propertiesAPI.list();
      debug.queries.propertiesAPI = {
        success: apiResult.success,
        totalItems: apiResult.data?.length || 0,
        nullItems: apiResult.data?.filter((item: any) => item === null).length || 0,
        validItems: apiResult.data?.filter((item: any) => item !== null).length || 0,
        error: apiResult.error || null
      };
      
    } catch (error) {
      console.error('Properties query error:', error);
      debug.queries.properties = { error: error.message };
    }

    // Test Contacts query
    console.log('\n👥 Testing Contacts Query...');
    try {
      const contactsResult = await (client.models as any).Contacts.list({ limit: 10 });
      
      console.log('Raw Contacts Response:', contactsResult);
      
      debug.queries.contacts = {
        success: !!contactsResult.data,
        totalItems: contactsResult.data?.length || 0,
        nullItems: contactsResult.data?.filter((item: any) => item === null).length || 0,
        validItems: contactsResult.data?.filter((item: any) => item !== null).length || 0,
        errors: contactsResult.errors || null,
        sampleItem: contactsResult.data?.find((item: any) => item !== null) || null,
        allItemsNull: contactsResult.data?.every((item: any) => item === null) || false
      };
      
    } catch (error) {
      console.error('Contacts query error:', error);
      debug.queries.contacts = { error: error.message };
    }

    // Test Projects query
    console.log('\n🏗️ Testing Projects Query...');
    try {
      const projectsResult = await (client.models as any).Projects.list({ limit: 10 });
      
      console.log('Raw Projects Response:', projectsResult);
      
      debug.queries.projects = {
        success: !!projectsResult.data,
        totalItems: projectsResult.data?.length || 0,
        nullItems: projectsResult.data?.filter((item: any) => item === null).length || 0,
        validItems: projectsResult.data?.filter((item: any) => item !== null).length || 0,
        errors: projectsResult.errors || null,
        sampleItem: projectsResult.data?.find((item: any) => item !== null) || null,
        allItemsNull: projectsResult.data?.every((item: any) => item === null) || false
      };
      
    } catch (error) {
      console.error('Projects query error:', error);
      debug.queries.projects = { error: error.message };
    }

    // Test a single item query to see if the issue is with list queries
    console.log('\n🔍 Testing Single Item Query...');
    try {
      // First get an ID from the list
      const propertiesResult = await (client.models as any).Properties.list({ limit: 1 });
      if (propertiesResult.data && propertiesResult.data.length > 0) {
        const firstItem = propertiesResult.data[0];
        if (firstItem && firstItem.id) {
          console.log('Testing get() with ID:', firstItem.id);
          const singleResult = await (client.models as any).Properties.get({ id: firstItem.id });
          console.log('Single item result:', singleResult);
          
          debug.queries.singleProperty = {
            success: !!singleResult.data,
            item: singleResult.data,
            errors: singleResult.errors || null
          };
        }
      }
    } catch (error) {
      console.error('Single item query error:', error);
      debug.queries.singleProperty = { error: error.message };
    }

    console.log('\n📋 Debug Analysis Summary:', debug);
    setDebugData(debug);
    setLoading(false);
  };

  if (!mounted) {
    return <div>Loading debugger...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">GraphQL Debug Analysis</h1>
      
      <div className="mb-6">
        <button
          onClick={runDebugAnalysis}
          disabled={loading}
          className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? 'Running Analysis...' : 'Run GraphQL Debug Analysis'}
        </button>
      </div>

      {debugData.queries && (
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold text-lg mb-2">Analysis Results</h3>
            <p className="text-sm text-gray-600">Timestamp: {debugData.timestamp}</p>
          </div>

          {Object.entries(debugData.queries).map(([queryName, data]: [string, any]) => (
            <div key={queryName} className="border border-gray-300 p-4 rounded">
              <h3 className="font-semibold text-lg mb-3 capitalize">{queryName} Query</h3>
              
              {data.error ? (
                <div className="bg-red-100 p-3 rounded">
                  <strong>Error:</strong> {data.error}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Success:</strong> {data.success ? '✅' : '❌'}</div>
                    <div><strong>Total Items:</strong> {data.totalItems}</div>
                    <div><strong>Valid Items:</strong> {data.validItems}</div>
                    <div><strong>Null Items:</strong> {data.nullItems}</div>
                    <div><strong>All Items Null:</strong> {data.allItemsNull ? '⚠️ YES' : '✅ No'}</div>
                  </div>
                  
                  {data.errors && (
                    <div className="bg-yellow-100 p-3 rounded">
                      <strong>GraphQL Errors:</strong>
                      <pre className="text-xs mt-1">{JSON.stringify(data.errors, null, 2)}</pre>
                    </div>
                  )}
                  
                  {data.sampleItem && (
                    <div className="bg-green-100 p-3 rounded">
                      <strong>Sample Valid Item:</strong>
                      <pre className="text-xs mt-1">{JSON.stringify(data.sampleItem, null, 2)}</pre>
                    </div>
                  )}
                  
                  {data.item && queryName === 'singleProperty' && (
                    <div className="bg-blue-100 p-3 rounded">
                      <strong>Single Item Result:</strong>
                      <pre className="text-xs mt-1">{JSON.stringify(data.item, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 bg-yellow-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Debugging Instructions</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Run GraphQL Debug Analysis" to analyze the queries</li>
          <li>Check browser console for detailed logs</li>
          <li>Review the results above for null item patterns</li>
          <li>Check if there are GraphQL errors in the responses</li>
          <li>Compare single item vs list query results</li>
        </ol>
      </div>
    </div>
  );
}