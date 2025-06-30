import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H3, P2 } from '../typography';

const client = generateClient<any>();

interface NotificationPreferencesProps {
  contactId?: string;
  onSave?: (preferences: { emailNotifications: boolean; smsNotifications: boolean; phone: string }) => void;
  className?: string;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  contactId,
  onSave,
  className = ''
}) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load contact data
  useEffect(() => {
    if (contactId) {
      loadContactData();
    }
  }, [contactId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContactData = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await client.graphql({
        query: `query GetContact($id: ID!) {
          getContacts(id: $id) {
            id
            emailNotifications
            smsNotifications
            phone
          }
        }`,
        variables: { id: contactId! }
      }) as any;
      
      const contact = result.data?.getContacts;
      
      if (contact) {
        setEmailNotifications(contact.emailNotifications ?? true);
        setSmsNotifications(contact.smsNotifications ?? false);
        setPhone(contact.phone || '');
      }
    } catch (err) {
      console.error('Failed to load contact data:', err);
      setError('Failed to load your notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (contactId) {
        // Update contact with simplified preferences
        const updateResult = await client.graphql({
          query: `mutation UpdateContact($input: UpdateContactsInput!) {
            updateContacts(input: $input) {
              id
              emailNotifications
              smsNotifications
              phone
            }
          }`,
          variables: {
            input: {
              id: contactId,
              emailNotifications,
              smsNotifications,
              phone: phone.trim() || undefined
            }
          }
        }) as any;
      }

      setSuccess('Notification preferences saved successfully!');
      onSave?.({ emailNotifications, smsNotifications, phone: phone.trim() });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
      setError('Failed to save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
      <H3 className="mb-6">Notification Preferences</H3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Contact Information */}
        <div>
          <H3 className="text-lg mb-4">Contact Information</H3>
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <P2 className="text-gray-500 text-xs mt-1">
                Required for SMS notifications
              </P2>
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <div>
          <H3 className="text-lg mb-4">Notification Channels</H3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <P2 className="font-medium">Email Notifications</P2>
                <P2 className="text-gray-600">Receive notifications via email</P2>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                disabled={!phone.trim()}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <div>
                <P2 className={`font-medium ${!phone.trim() ? 'text-gray-400' : ''}`}>
                  SMS Notifications
                </P2>
                <P2 className={`${!phone.trim() ? 'text-gray-400' : 'text-gray-600'}`}>
                  {phone.trim() ? 'Receive notifications via text message' : 'Enter mobile number to enable SMS'}
                </P2>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};