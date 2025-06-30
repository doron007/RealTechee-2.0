import React, { useState, useEffect } from 'react';
import { H3, P2 } from '../typography';
import { UserService, type UserProfile } from '../../utils/userService';

interface UserNotificationPreferencesProps {
  onSave?: (preferences: { emailNotifications: boolean; smsNotifications: boolean; phone?: string }) => void;
  className?: string;
}

export const UserNotificationPreferences: React.FC<UserNotificationPreferencesProps> = ({
  onSave,
  className = ''
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load user profile and settings
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const profile = await UserService.getUserProfile();
      
      if (profile) {
        setUserProfile(profile);
        setEmailNotifications(profile.emailNotifications);
        setSmsNotifications(profile.smsNotifications);
        setPhoneNumber(profile.phoneNumber || '');
        
        console.log('✅ Loaded user notification preferences:', {
          email: profile.emailNotifications,
          sms: profile.smsNotifications,
          phone: profile.phoneNumber ? 'present' : 'missing'
        });
      } else {
        setError('Unable to load user preferences');
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
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

      // Update notification preferences
      const preferencesSuccess = await UserService.updateNotificationPreferences({
        emailNotifications,
        smsNotifications
      });

      // Update phone number if changed
      let phoneSuccess = true;
      if (phoneNumber !== (userProfile?.phoneNumber || '')) {
        try {
          phoneSuccess = await UserService.updateUserProfile({
            phoneNumber: phoneNumber.trim() || undefined
          });
        } catch (phoneError: any) {
          console.error('Phone number update failed:', phoneError);
          setError(phoneError.message || 'Invalid phone number format. Please use format: (713) 591-9400 or +17135919400');
          setSaving(false);
          return;
        }
      }

      if (preferencesSuccess && phoneSuccess) {
        setSuccess('Notification preferences saved successfully!');
        onSave?.({ 
          emailNotifications, 
          smsNotifications, 
          phone: phoneNumber.trim() 
        });

        // Reload profile to get updated data
        await loadUserProfile();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save some preferences. Please try again.');
      }

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
        {/* User Info Display */}
        {userProfile && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <H3 className="text-lg mb-2">Account Information</H3>
            <div className="space-y-1">
              <P2 className="text-gray-700">
                <strong>Email:</strong> {userProfile.email}
              </P2>
              {userProfile.role && (
                <P2 className="text-gray-700">
                  <strong>Role:</strong> {userProfile.role}
                </P2>
              )}
              {userProfile.givenName && (
                <P2 className="text-gray-700">
                  <strong>Name:</strong> {userProfile.givenName} {userProfile.familyName || ''}
                </P2>
              )}
            </div>
          </div>
        )}

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
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(713) 591-9400"
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <P2 className="text-gray-500 text-xs mt-1">
                Required for SMS notifications. Format: (713) 591-9400 or +17135919400
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
                disabled={!phoneNumber.trim()}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <div>
                <P2 className={`font-medium ${!phoneNumber.trim() ? 'text-gray-400' : ''}`}>
                  SMS Notifications
                </P2>
                <P2 className={`${!phoneNumber.trim() ? 'text-gray-400' : 'text-gray-600'}`}>
                  {phoneNumber.trim() ? 'Receive notifications via text message' : 'Enter mobile number to enable SMS'}
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