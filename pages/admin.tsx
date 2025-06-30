import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import Head from 'next/head';
import { H1, H2, H3, P2 } from '../components/typography';
import { UserService } from '../utils/userService';
import { AuthorizationService } from '../utils/authorizationHelpers';
import { AdminService, type CognitoUser } from '../utils/adminService';
import { listContacts, listNotificationQueues, listNotificationTemplates } from '../queries';
import { updateContacts } from '../mutations';
import * as APITypes from '../API';

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

const AdminPage = () => {
  const router = useRouter();
  const { user } = useAuthenticator((context) => [context.user]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'users' | 'contacts' | 'notifications'>('users');
  const [users, setUsers] = useState<CognitoUser[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [error, setError] = useState<string>('');
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, string>>({});
  const [updatingRoles, setUpdatingRoles] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CognitoUser | null>(null);
  const [linkingContacts, setLinkingContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [contactSearch, setContactSearch] = useState<string>('');

  // Check authorization on mount
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/admin');
      return;
    }

    const checkAuthorization = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const email = attributes.email || '';
        const currentRole = attributes['custom:role'] || 'guest';
        setUserEmail(email);
        setUserRole(currentRole);

        // STRICT ACCESS: Only admin and super_admin roles can access this page
        const hasAdminAccess = await AuthorizationService.hasMinimumRole('admin');
        
        // Only allow admin or super_admin roles (not just email check)
        if (hasAdminAccess) {
          setIsAuthorized(true);
          loadUsers();
          loadContacts();
          loadNotifications();
        } else {
          setError('Access denied: Admin privileges required');
        }
      } catch (err) {
        console.error('Authorization check failed:', err);
        setError('Failed to verify admin access');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [user, router]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await AdminService.listUsers(50);
      setUsers(response.users);
      console.log('✅ Loaded users:', response.users.length);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setPendingRoleChanges(prev => ({
      ...prev,
      [userId]: newRole
    }));
    setError(''); // Clear any existing errors
  };

  const applyRoleChange = async (userId: string) => {
    const newRole = pendingRoleChanges[userId];
    if (!newRole) return;

    setUpdatingRoles(prev => ({ ...prev, [userId]: true }));
    
    try {
      // Get the target user details
      const targetUser = users.find(u => u.userId === userId);
      if (!targetUser) {
        setError('User not found');
        return;
      }
      
      // SUPER ADMIN PROTECTION: Cannot modify super admin account
      if (targetUser.email === 'info@realtechee.com') {
        setError('Cannot modify super admin account');
        return;
      }
      
      // ROLE ASSIGNMENT RESTRICTIONS
      const isSuperAdmin = userRole === 'super_admin';
      const isAdmin = userRole === 'admin';
      
      // Only super admin can assign admin role
      if (newRole === 'admin' && !isSuperAdmin) {
        setError('Only super admin can assign admin roles');
        return;
      }
      
      // Only super admin can assign super_admin role
      if (newRole === 'super_admin' && !isSuperAdmin) {
        setError('Only super admin can assign super admin roles');
        return;
      }
      
      // Admins cannot assign roles higher than their own
      if (isAdmin && !isSuperAdmin) {
        const restrictedRoles = ['super_admin', 'admin'];
        if (restrictedRoles.includes(newRole)) {
          setError('Admins cannot assign admin or super admin roles');
          return;
        }
      }
      
      await AdminService.assignRole(userId, newRole);
      setUsers(prev => prev.map(user => 
        user.userId === userId 
          ? { ...user, role: newRole }
          : user
      ));
      
      // Clear pending change
      setPendingRoleChanges(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      
      console.log('✅ User role updated to:', newRole);
    } catch (err) {
      console.error('Failed to update user role:', err);
      setError('Failed to update user role');
    } finally {
      setUpdatingRoles(prev => ({ ...prev, [userId]: false }));
    }
  };

  const cancelRoleChange = (userId: string) => {
    setPendingRoleChanges(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  const openLinkingModal = async (user: CognitoUser) => {
    setSelectedUser(user);
    setSelectedContactId(user.contactId || '');
    
    // Load available contacts for linking
    try {
      const result = await client.graphql({
        query: listContacts,
        variables: {
          limit: 200  // Increased limit for better coverage
        }
      });
      
      if (!result.errors) {
        const contacts = result.data.listContacts?.items || [];
        // Sort contacts by email for easier finding
        const sortedContacts = contacts.sort((a: any, b: any) => {
          const emailA = (a.email || '').toLowerCase();
          const emailB = (b.email || '').toLowerCase();
          return emailA.localeCompare(emailB);
        });
        setLinkingContacts(sortedContacts);
        setFilteredContacts(sortedContacts);
      }
    } catch (err) {
      console.error('Failed to load contacts for linking:', err);
    }
    
    setShowLinkingModal(true);
  };

  // Filter contacts based on search
  useEffect(() => {
    if (!contactSearch.trim()) {
      setFilteredContacts(linkingContacts);
    } else {
      const searchLower = contactSearch.toLowerCase();
      const filtered = linkingContacts.filter((contact: any) => 
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.firstName?.toLowerCase().includes(searchLower) ||
        contact.lastName?.toLowerCase().includes(searchLower) ||
        contact.fullName?.toLowerCase().includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower) ||
        contact.brokerage?.toLowerCase().includes(searchLower)
      );
      setFilteredContacts(filtered);
    }
  }, [contactSearch, linkingContacts]);

  const closeLinkingModal = () => {
    setShowLinkingModal(false);
    setSelectedUser(null);
    setSelectedContactId('');
    setLinkingContacts([]);
    setFilteredContacts([]);
    setContactSearch('');
  };

  const applyContactLinking = async () => {
    if (!selectedUser) return;

    try {
      const contactId = selectedContactId || undefined;
      
      await AdminService.updateUserAttribute(selectedUser.userId, 'custom:contactId', selectedContactId || null);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.userId === selectedUser.userId 
          ? { ...user, contactId }
          : user
      ));
      
      console.log(`✅ Updated contact linking for user ${selectedUser.userId}`);
      closeLinkingModal();
    } catch (err) {
      console.error('Failed to update contact linking:', err);
      setError('Failed to update contact linking');
    }
  };

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      // Load notification queue
      const queueResult = await client.graphql({
        query: listNotificationQueues,
        variables: {
          limit: 50
        }
      });

      // Load notification templates
      const templateResult = await client.graphql({
        query: listNotificationTemplates,
        variables: {
          limit: 20
        }
      });

      if (queueResult.errors || templateResult.errors) {
        console.error('GraphQL errors:', queueResult.errors || templateResult.errors);
        setError('Failed to load notifications');
        return;
      }

      setNotifications(queueResult.data.listNotificationQueues?.items || []);
      setTemplates(templateResult.data.listNotificationTemplates?.items || []);
      console.log('✅ Loaded notifications and templates');
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <H2 className="text-red-900 mb-2">Access Denied</H2>
            <P2 className="text-red-700 mb-4">
              You don't have permission to access the admin panel.
            </P2>
            <P2 className="text-red-600">
              If you need admin access, please contact{' '}
              <a 
                href="mailto:info@realtechee.com?subject=Admin Access Request" 
                className="font-medium underline hover:no-underline"
              >
                info@realtechee.com
              </a>{' '}
              requesting admin privileges.
            </P2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel | RealTechee</title>
        <meta name="description" content="Admin panel for user and contact management" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <H1>Admin Panel</H1>
            <P2 className="text-gray-600 mt-2">
              User and Contact Management - Logged in as: {userEmail}
            </P2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  User Management
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'contacts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Contact Management
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`py-4 px-6 text-sm font-medium border-b-2 ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Notification Management
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'users' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <H2>Cognito Users ({users.length})</H2>
                    <button
                      onClick={loadUsers}
                      disabled={loadingUsers}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loadingUsers ? 'Loading...' : 'Refresh Users'}
                    </button>
                  </div>

                  {loadingUsers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <P2 className="mt-2 text-gray-600">Loading users...</P2>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
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
                          {users.map((user) => (
                            <tr key={user.userId} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.givenName && user.familyName 
                                      ? `${user.givenName} ${user.familyName}`
                                      : user.email.split('@')[0]
                                    }
                                  </div>
                                  <div className="text-sm text-gray-500">ID: {user.userId.slice(0, 8)}...</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.email}</div>
                                {user.phoneNumber && (
                                  <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {user.email === 'info@realtechee.com' ? (
                                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    Super Admin (Protected)
                                  </span>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <select
                                      value={pendingRoleChanges[user.userId] || user.role}
                                      onChange={(e) => handleRoleChange(user.userId, e.target.value)}
                                      className={`text-sm border rounded px-2 py-1 ${
                                        pendingRoleChanges[user.userId] 
                                          ? 'border-orange-300 bg-orange-50' 
                                          : 'border-gray-300'
                                      }`}
                                    >
                                      <option value="guest">Guest</option>
                                      <option value="homeowner">Homeowner</option>
                                      <option value="provider">Provider</option>
                                      <option value="agent">Agent</option>
                                      <option value="srm">SRM</option>
                                      <option value="accounting">Accounting</option>
                                      {/* Only super admin can assign admin role */}
                                      {userRole === 'super_admin' && (
                                        <option value="admin">Admin</option>
                                      )}
                                      {/* Only super admin can assign super_admin role */}
                                      {userRole === 'super_admin' && (
                                        <option value="super_admin">Super Admin</option>
                                      )}
                                    </select>
                                    
                                    {pendingRoleChanges[user.userId] && (
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => applyRoleChange(user.userId)}
                                          disabled={updatingRoles[user.userId]}
                                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {updatingRoles[user.userId] ? 'Applying...' : 'Apply'}
                                        </button>
                                        <button
                                          onClick={() => cancelRoleChange(user.userId)}
                                          disabled={updatingRoles[user.userId]}
                                          className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 disabled:opacity-50"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {user.groups.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Groups: {user.groups.join(', ')}
                                  </div>
                                )}
                                {pendingRoleChanges[user.userId] && (
                                  <div className="text-xs text-orange-600 mt-1 font-medium">
                                    Pending: {user.role} → {pendingRoleChanges[user.userId]}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.status === 'CONFIRMED' 
                                    ? 'bg-green-100 text-green-800'
                                    : user.status === 'UNCONFIRMED'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.status}
                                </span>
                                {user.lastLogin && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Last: {new Date(user.lastLogin).toLocaleDateString()}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    user.emailNotifications 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    Email
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    user.smsNotifications 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    SMS
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center space-x-2">
                                  {user.contactId ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Linked Contact
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      No Contact
                                    </span>
                                  )}
                                  <button
                                    onClick={() => openLinkingModal(user)}
                                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                                  >
                                    Manage
                                  </button>
                                </div>
                                {user.contactId && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    ID: {user.contactId.slice(0, 8)}...
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {users.length === 0 && (
                        <div className="text-center py-8">
                          <P2 className="text-gray-500">No users found</P2>
                          <P2 className="text-gray-400 text-sm mt-2">
                            Note: User listing is currently using mock data for development
                          </P2>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'contacts' && (
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
              )}

              {activeTab === 'notifications' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <H2>Notification System</H2>
                    <button
                      onClick={loadNotifications}
                      disabled={loadingNotifications}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loadingNotifications ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>

                  {loadingNotifications ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <P2 className="mt-2 text-gray-600">Loading notification data...</P2>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Notification Queue Status */}
                      <div className="bg-white border rounded-lg p-6">
                        <H3 className="mb-4">Recent Notifications ({notifications.length})</H3>
                        {notifications.length === 0 ? (
                          <P2 className="text-gray-500">No notifications found</P2>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Event Type
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Recipients
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Channels
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Retries
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {notifications.slice(0, 10).map((notification: any) => (
                                  <tr key={notification.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {notification.eventType}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        ID: {notification.id.slice(0, 8)}...
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        notification.status === 'SENT' 
                                          ? 'bg-green-100 text-green-800'
                                          : notification.status === 'PENDING'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : notification.status === 'FAILED'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-orange-100 text-orange-800'
                                      }`}>
                                        {notification.status}
                                      </span>
                                      {notification.errorMessage && (
                                        <div className="text-xs text-red-600 mt-1" title={notification.errorMessage}>
                                          Error: {notification.errorMessage.substring(0, 30)}...
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {Array.isArray(notification.recipientIds) 
                                          ? `${notification.recipientIds.length} recipients`
                                          : typeof notification.recipientIds === 'string'
                                          ? `${JSON.parse(notification.recipientIds || '[]').length} recipients`
                                          : '0 recipients'
                                        }
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex flex-wrap gap-1">
                                        {(Array.isArray(notification.channels) 
                                          ? notification.channels 
                                          : JSON.parse(notification.channels || '[]')
                                        ).map((channel: string) => (
                                          <span key={channel} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {channel}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {new Date(notification.createdAt).toLocaleTimeString()}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {notification.retryCount || 0}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Notification Templates */}
                      <div className="bg-white border rounded-lg p-6">
                        <H3 className="mb-4">Notification Templates ({templates.length})</H3>
                        {templates.length === 0 ? (
                          <P2 className="text-gray-500">No templates found</P2>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Template Name
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Channel
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subject
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {templates.map((template: any) => (
                                  <tr key={template.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {template.name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        ID: {template.id.slice(0, 8)}...
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {template.channel}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900 max-w-xs truncate">
                                        {template.subject || 'No subject'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        template.isActive 
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {template.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {new Date(template.createdAt).toLocaleDateString()}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* System Status */}
                      <div className="bg-white border rounded-lg p-6">
                        <H3 className="mb-4">System Status</H3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="text-sm font-medium text-green-800">Notification Queue</div>
                            <div className="text-2xl font-bold text-green-900">
                              {notifications.filter(n => n.status === 'SENT').length}
                            </div>
                            <div className="text-sm text-green-600">Successfully sent</div>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="text-sm font-medium text-yellow-800">Pending</div>
                            <div className="text-2xl font-bold text-yellow-900">
                              {notifications.filter(n => n.status === 'PENDING' || n.status === 'RETRYING').length}
                            </div>
                            <div className="text-sm text-yellow-600">Awaiting delivery</div>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="text-sm font-medium text-red-800">Failed</div>
                            <div className="text-2xl font-bold text-red-900">
                              {notifications.filter(n => n.status === 'FAILED').length}
                            </div>
                            <div className="text-sm text-red-600">Delivery failed</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Linking Modal */}
      {showLinkingModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <H3 className="text-lg font-medium text-gray-900 mb-4">
                Manage Contact Linking
              </H3>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <P2 className="text-sm text-gray-600 mb-1">
                  <strong>User Details:</strong>
                </P2>
                <div className="text-xs text-gray-700 space-y-1">
                  <div><strong>Email:</strong> {selectedUser.email}</div>
                  <div><strong>Name:</strong> {selectedUser.givenName} {selectedUser.familyName}</div>
                  <div><strong>Role:</strong> {selectedUser.role}</div>
                  <div><strong>User ID:</strong> {selectedUser.userId}</div>
                  <div><strong>Current Contact:</strong> {selectedUser.contactId ? selectedUser.contactId : 'None'}</div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Search and Link to Contact: ({filteredContacts.length} of {linkingContacts.length} contacts shown)
                </label>
                <input
                  type="text"
                  placeholder="Search by email, name, company, or brokerage..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Contact:
                </label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
                  size={8}
                >
                  <option value="" className="font-sans">
                    🚫 No Contact (Unlink)
                  </option>
                  {filteredContacts.map((contact: any) => {
                    const displayName = contact.fullName || 
                      `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 
                      'No Name';
                    const businessInfo = contact.company || contact.brokerage || '';
                    
                    return (
                      <option key={contact.id} value={contact.id} className="font-mono">
                        📧 {contact.email} | 👤 {displayName}
                        {businessInfo && ` | 🏢 ${businessInfo}`}
                        {` | ID: ${contact.id.slice(0, 8)}...`}
                      </option>
                    );
                  })}
                </select>
                <P2 className="text-xs text-gray-500 mt-1">
                  💡 Contacts sorted by email address for easy finding
                </P2>
              </div>

              {selectedContactId && (
                <div className="mb-4 p-3 bg-green-50 rounded-md border border-green-200">
                  <P2 className="text-sm text-gray-600 mb-2">
                    <strong>✅ Selected Contact Details:</strong>
                  </P2>
                  {(() => {
                    const selectedContact = linkingContacts.find(c => c.id === selectedContactId);
                    if (!selectedContact) return null;
                    
                    return (
                      <div className="text-xs text-gray-700 space-y-1">
                        <div><strong>📧 Email:</strong> {selectedContact.email}</div>
                        <div><strong>👤 Name:</strong> {selectedContact.fullName || 
                          `${selectedContact.firstName || ''} ${selectedContact.lastName || ''}`.trim() || 'No name'}</div>
                        {selectedContact.company && (
                          <div><strong>🏢 Company:</strong> {selectedContact.company}</div>
                        )}
                        {selectedContact.brokerage && (
                          <div><strong>🏠 Brokerage:</strong> {selectedContact.brokerage}</div>
                        )}
                        <div><strong>📱 Phone:</strong> {selectedContact.phone || selectedContact.mobile || 'None'}</div>
                        <div><strong>🔗 Contact ID:</strong> {selectedContact.id}</div>
                        <div><strong>📬 Email Notifications:</strong> {selectedContact.emailNotifications ? '✅ Yes' : '❌ No'}</div>
                        <div><strong>📱 SMS Notifications:</strong> {selectedContact.smsNotifications ? '✅ Yes' : '❌ No'}</div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeLinkingModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={applyContactLinking}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPage;