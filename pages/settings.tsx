import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, updatePassword, deleteUser, fetchUserAttributes } from 'aws-amplify/auth';
import Head from 'next/head';
import Button from '../components/common/buttons/Button';
import { UserNotificationPreferences } from '../components/notifications/UserNotificationPreferences';
import { AuthorizationService } from '../utils/authorizationHelpers';
import { UserService } from '../utils/userService';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../amplify/data/resource';

const client = generateClient<any>();

const SettingsPage = () => {
  const router = useRouter();
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [isLoading, setIsLoading] = useState(true);
  const [userAttributes, setUserAttributes] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Redirect if not authenticated and fetch user attributes
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/settings');
    } else {
      const loadUserAttributes = async () => {
        try {
          const attributes = await fetchUserAttributes();
          setUserAttributes(attributes);
          
          // Check if user has admin access
          const email = attributes.email || '';
          const isSuperAdminEmail = email === 'info@realtechee.com';
          
          const hasSuperAdminRole = await AuthorizationService.hasMinimumRole('super_admin');
          const hasAdminAccess = await AuthorizationService.hasMinimumRole('admin');
          setIsAdmin(isSuperAdminEmail || hasSuperAdminRole || hasAdminAccess);
          
          console.log('✅ User attributes loaded successfully');
        } catch (error) {
          console.error('Error fetching user attributes:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadUserAttributes();
    }
  }, [user, router]);

  const getUserEmail = () => {
    if (!user) return '';
    return user.signInDetails?.loginId || userAttributes?.email || '';
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', message: 'All fields are required' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', message: 'Password must be at least 8 characters' });
      return;
    }

    setIsChangingPassword(true);

    try {
      await updatePassword({ oldPassword: currentPassword, newPassword });
      setPasswordMessage({ type: 'success', message: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      setPasswordMessage({ 
        type: 'error', 
        message: error.message || 'Failed to change password. Please check your current password.' 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      try {
        await deleteUser();
        router.push('/');
      } catch (error: any) {
        console.error('Account deletion error:', error);
        alert('Failed to delete account. Please contact support.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Account Settings | RealTechee</title>
        <meta name="description" content="Manage your RealTechee account settings and security preferences." />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-2 text-gray-600">
              Manage your security settings and account preferences
            </p>
          </div>

          <div className="space-y-8">
            {/* Notification Preferences */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Notification Preferences
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Manage how and when you receive notifications from RealTechee
                </p>
              </div>
              <div className="p-6">
                <UserNotificationPreferences 
                  onSave={(preferences) => {
                    console.log('User notification preferences saved:', preferences);
                  }}
                />
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Security Settings
                </h2>
              </div>
              <div className="p-6">
                {/* Change Password Form */}
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-4">
                      Change Password
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-4 max-w-md">
                      <div>
                        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="current-password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent"
                          placeholder="Enter current password"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent"
                          placeholder="Enter new password"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirm-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>

                    {passwordMessage && (
                      <div className={`mt-4 p-3 rounded-md ${
                        passwordMessage.type === 'success' 
                          ? 'bg-green-50 border border-green-200 text-green-700' 
                          : 'bg-red-50 border border-red-200 text-red-700'
                      }`}>
                        {passwordMessage.message}
                      </div>
                    )}

                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isChangingPassword ? 'Changing...' : 'Change Password'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordMessage(null);
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Account Information
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border max-w-md">
                      {getUserEmail()}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Contact support to change your email address
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User ID
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border font-mono max-w-md">
                      {userAttributes?.sub || 'Not available'}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Your unique identifier in the system
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Quick Actions
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        My Profile
                      </h3>
                      <p className="text-sm text-gray-600">
                        View and manage your profile information
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      href="/profile"
                      text="View Profile"
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        My Projects
                      </h3>
                      <p className="text-sm text-gray-600">
                        Access your project interactions and comments
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      href="/projects"
                      text="View Projects"
                      size="sm"
                    />
                  </div>
                  
                  {/* Admin Panel Link - Only show for admin users */}
                  {isAdmin && (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Admin Panel
                        </h3>
                        <p className="text-sm text-gray-600">
                          Manage users, contacts, and system settings
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        href="/admin"
                        text="Admin Panel"
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-lg shadow border-red-200 border">
              <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                <h2 className="text-lg font-medium text-red-900">
                  Danger Zone
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <h3 className="text-sm font-medium text-red-900">
                        Sign Out
                      </h3>
                      <p className="text-sm text-red-600">
                        Sign out of your account on this device
                      </p>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Sign Out
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-red-300 rounded-lg bg-red-100">
                    <div>
                      <h3 className="text-sm font-medium text-red-900">
                        Delete Account
                      </h3>
                      <p className="text-sm text-red-700">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;