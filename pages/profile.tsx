import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import Head from 'next/head';
import Image from 'next/image';
import Button from '../components/common/buttons/Button';

const ProfilePage = () => {
  const router = useRouter();
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [isLoading, setIsLoading] = useState(true);
  const [userAttributes, setUserAttributes] = useState<any>(null);

  // Redirect if not authenticated and fetch user attributes
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile');
    } else {
      const loadUserAttributes = async () => {
        try {
          const attributes = await fetchUserAttributes();
          setUserAttributes(attributes);
        } catch (error) {
          console.error('Error fetching user attributes:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadUserAttributes();
    }
  }, [user, router]);

  // Helper functions to extract user data
  const getUserDisplayName = () => {
    if (!user) return 'User';
    const email = user.signInDetails?.loginId || user.username || '';
    const emailPrefix = email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };

  const getUserEmail = () => {
    if (!user) return '';
    return user.signInDetails?.loginId || userAttributes?.email || '';
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    return displayName.substring(0, 2).toUpperCase();
  };

  const getContactId = () => {
    return userAttributes?.['custom:contactId'] || 'Not linked';
  };

  const getMembershipTier = () => {
    const tier = userAttributes?.['custom:membershipTier'] || 'basic';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getAccountCreated = () => {
    // This would come from Cognito user creation date
    return 'Recently migrated';
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
        <title>My Profile | RealTechee</title>
        <meta name="description" content="Manage your RealTechee profile and account information." />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-2 text-gray-600">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-[#F0E4DF] flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-dark-gray">
                      {getUserInitials()}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {getUserDisplayName()}
                  </h2>
                  <p className="text-gray-600 mb-4">{getUserEmail()}</p>
                  
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                    {getMembershipTier()} Member
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Contact ID:</span>
                      <span className="font-mono text-xs">{getContactId()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Member Since:</span>
                      <span>{getAccountCreated()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Account Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                        {getUserDisplayName()}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Based on your email address
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                        {getUserEmail()}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Your login email (verified)
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Membership Tier
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                        {getMembershipTier()}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Your current access level
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact ID
                      </label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border font-mono">
                        {getContactId()}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Links to your contact record
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Account Actions
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          Account Settings
                        </h4>
                        <p className="text-sm text-gray-600">
                          Change your password and security settings
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        href="/settings"
                        text="Manage"
                        size="sm"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          My Projects
                        </h4>
                        <p className="text-sm text-gray-600">
                          View and manage your project interactions
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        href="/projects"
                        text="View Projects"
                        size="sm"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <h4 className="text-sm font-medium text-red-900">
                          Sign Out
                        </h4>
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
                  </div>
                </div>
              </div>

              {/* Feature Access */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Feature Access
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Browse Projects</span>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        ✓ Enabled
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Post Comments</span>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        ✓ Enabled
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Access Premium Content</span>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        {getMembershipTier() === 'Basic' ? 'Limited' : '✓ Enabled'}
                      </span>
                    </div>
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

export default ProfilePage;