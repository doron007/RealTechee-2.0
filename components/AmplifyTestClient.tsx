import { useState, useEffect } from 'react';
import { propertyAPI, contactAPI, projectAPI } from '../utils/amplifyAPI';

export default function AmplifyTestClient() {
  const [properties, setProperties] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before doing anything
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load data when component mounts
  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const propertyResult = await propertyAPI.list();
      const contactResult = await contactAPI.list();
      
      if (propertyResult.success) {
        setProperties(propertyResult.data || []);
      }
      
      if (contactResult.success) {
        setContacts(contactResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('❌ Error loading data. Check console for details.');
    }
    
    setLoading(false);
  };

  const createTestProperty = async () => {
    setLoading(true);
    setMessage('Creating test property...');
    
    try {
      const result = await propertyAPI.create({
        propertyFullAddress: '123 Test Street, Test City, CA 90210',
        houseAddress: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        zip: '90210'
      });

      if (result.success) {
        setMessage('✅ Property created successfully!');
        loadData(); // Refresh the list
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
      const result = await contactAPI.create({
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        company: 'Test Company'
      });

      if (result.success) {
        setMessage('✅ Contact created successfully!');
        loadData(); // Refresh the list
      } else {
        setMessage('❌ Error creating contact: ' + JSON.stringify(result.error));
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      setMessage('❌ Error creating contact: ' + error);
    }
    
    setLoading(false);
  };

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return <div className="max-w-4xl mx-auto p-6">Initializing...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Amplify Gen 2 Test Page</h1>
      
      {/* Connection Status */}
      <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
        🟢 Connected to Amplify Sandbox
      </div>
      
      {/* Status Message */}
      {message && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
          {message}
        </div>
      )}

      {/* Test Buttons */}
      <div className="flex gap-4 mb-6">
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
          onClick={loadData}
          disabled={loading}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Properties Section */}
        <div className="border border-gray-300 p-4 rounded">
          <h2 className="text-xl font-semibold mb-3">Properties ({properties.length})</h2>
          {properties.length === 0 ? (
            <p className="text-gray-500">No properties yet. Create one to test!</p>
          ) : (
            <div className="space-y-2">
              {properties.map((property: any) => (
                <div key={property.id} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">{property.propertyFullAddress || 'No address'}</div>
                  <div className="text-sm text-gray-600">
                    {property.city}, {property.state} {property.zip}
                  </div>
                  <div className="text-xs text-gray-400">ID: {property.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contacts Section */}
        <div className="border border-gray-300 p-4 rounded">
          <h2 className="text-xl font-semibold mb-3">Contacts ({contacts.length})</h2>
          {contacts.length === 0 ? (
            <p className="text-gray-500">No contacts yet. Create one to test!</p>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact: any) => (
                <div key={contact.id} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">{contact.fullName || contact.firstName + ' ' + contact.lastName || 'No name'}</div>
                  <div className="text-sm text-gray-600">{contact.email}</div>
                  <div className="text-sm text-gray-600">{contact.phone}</div>
                  <div className="text-xs text-blue-600">{contact.company}</div>
                  <div className="text-xs text-gray-400">ID: {contact.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Info */}
      <div className="mt-8 bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">API Configuration:</h3>
        <div className="text-sm space-y-1">
          <div><strong>Status:</strong> Connected to sandbox</div>
          <div><strong>Auth Mode:</strong> API Key</div>
          <div><strong>Region:</strong> us-west-1</div>
          <div><strong>Environment:</strong> Development (Sandbox)</div>
        </div>
      </div>
    </div>
  );
}
