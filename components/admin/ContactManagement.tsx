import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H2, P2 } from '../typography';
import { listContacts } from '../../queries';
import { updateContacts } from '../../mutations';

const client = generateClient();

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  phone?: string;
  mobile?: string;
  company?: string;
  brokerage?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  linkedUserId?: string; // If contact has a user account
}

const ContactManagement: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const result = await client.graphql({
        query: listContacts,
        variables: {
          limit: 100
        }
      });

      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        setError('Failed to load contacts');
        return;
      }

      const contactsData: Contact[] = (result.data.listContacts?.items || []).map(contact => ({
        id: contact.id,
        firstName: contact.firstName || undefined,
        lastName: contact.lastName || undefined,
        fullName: contact.fullName || undefined,
        email: contact.email || '',
        phone: contact.phone || undefined,
        mobile: contact.mobile || undefined,
        company: contact.company || undefined,
        brokerage: contact.brokerage || undefined,
        emailNotifications: contact.emailNotifications ?? true,
        smsNotifications: contact.smsNotifications ?? false,
        linkedUserId: undefined // TODO: Implement user linking logic
      }));

      setContacts(contactsData);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const updateContactNotifications = async (contactId: string, emailNotifications: boolean, smsNotifications: boolean) => {
    try {
      const result = await client.graphql({
        query: updateContacts,
        variables: {
          input: {
            id: contactId,
            emailNotifications,
            smsNotifications
          }
        }
      });

      if (result.errors) {
        console.error('Update errors:', result.errors);
        setError('Failed to update contact preferences');
        return;
      }

      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, emailNotifications, smsNotifications }
          : contact
      ));

      console.log('✅ Contact notification preferences updated');
    } catch (err) {
      console.error('Failed to update contact:', err);
      setError('Failed to update contact');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <H2>Contacts ({contacts.length})</H2>
        <button
          onClick={loadContacts}
          disabled={loadingContacts}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loadingContacts ? 'Loading...' : 'Refresh Contacts'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loadingContacts ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <P2 className="mt-2 text-gray-600">Loading contacts...</P2>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">ID: {contact.id.slice(0, 8)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contact.mobile || contact.phone || 'No phone'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contact.company || contact.brokerage || 'No company'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={contact.emailNotifications}
                          onChange={(e) => updateContactNotifications(
                            contact.id, 
                            e.target.checked, 
                            contact.smsNotifications
                          )}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Email</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={contact.smsNotifications}
                          onChange={(e) => updateContactNotifications(
                            contact.id, 
                            contact.emailNotifications, 
                            e.target.checked
                          )}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">SMS</span>
                      </label>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.linkedUserId ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Has User Account
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Contact Only
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {contacts.length === 0 && (
            <div className="text-center py-8">
              <P2 className="text-gray-500">No contacts found</P2>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactManagement;