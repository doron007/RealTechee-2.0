import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H2, H3, P2 } from '../typography';
import { AdminService, type CognitoUser } from '../../utils/adminService';
import { listContacts } from '../../queries';

const client = generateClient();

interface UserManagementProps {
  userRole?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ userRole = 'admin' }) => {
  const [users, setUsers] = useState<CognitoUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string>('');
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, string>>({});
  const [updatingRoles, setUpdatingRoles] = useState<Record<string, boolean>>({});
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CognitoUser | null>(null);
  const [linkingContacts, setLinkingContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [contactSearch, setContactSearch] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

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

  return (
    <>
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

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

export default UserManagement;