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
  
  // Role Management Fields
  roleType?: string; // 'AE', 'PM', 'Admin', 'Customer', etc.
  isActive?: boolean; // Whether contact is active for assignments
  assignmentPriority?: number; // Priority for automatic assignment (1=highest)
  canReceiveNotifications?: boolean; // Master notification toggle
}

const ContactManagement: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Role Management State
  const [selectedTab, setSelectedTab] = useState<'contacts' | 'roles'>('contacts');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]); // Local state for role editing
  
  // Search, Filter, Sort, and Pagination State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, active, inactive
  const [filterNotifications, setFilterNotifications] = useState<string>('all'); // all, enabled, disabled
  const [sortField, setSortField] = useState<string>('fullName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  // Track filter changes to prevent page reset on contact updates
  const [shouldResetPage, setShouldResetPage] = useState<boolean>(true);
  
  // Success notification state
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  
  // Page size options
  const pageSizeOptions = [
    { value: 10, label: '10' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 0, label: 'All' }
  ];
  
  // Define available role types
  const roleTypes = [
    'AE', // Account Executive
    'PM', // Project Manager
    'Admin', // Administrator
    'Customer', // Customer/Homeowner
    'Affiliate', // Business Partner
    'Accounting', // Accounting/Finance
  ];

  // Helper functions for multiple roles
  const parseRoles = (roleString?: string): string[] => {
    if (!roleString) return [];
    return roleString.split(',').map(r => r.trim()).filter(r => r.length > 0);
  };

  const formatRoles = (roles: string[]): string => {
    return roles.join(', ');
  };

  const hasRole = (contact: Contact, role: string): boolean => {
    return parseRoles(contact.roleType).includes(role);
  };

  const addRole = (contact: Contact, newRole: string): string => {
    const currentRoles = parseRoles(contact.roleType);
    if (!currentRoles.includes(newRole)) {
      currentRoles.push(newRole);
    }
    return formatRoles(currentRoles);
  };

  const removeRole = (contact: Contact, roleToRemove: string): string => {
    const currentRoles = parseRoles(contact.roleType);
    const filteredRoles = currentRoles.filter(role => role !== roleToRemove);
    return formatRoles(filteredRoles);
  };

  // Role editing functions
  const startEditingRole = (contactId: string, currentRoles: string) => {
    setEditingRole(contactId);
    setEditingRoles(parseRoles(currentRoles));
  };

  const cancelEditingRole = () => {
    setEditingRole(null);
    setEditingRoles([]);
  };

  const toggleRoleInEdit = (role: string) => {
    setEditingRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const saveRoleChanges = async (contactId: string) => {
    const newRoleString = formatRoles(editingRoles);
    await updateContactRole(contactId, newRoleString);
    setEditingRole(null);
    setEditingRoles([]);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      // First, try to get the total count and then fetch all contacts
      let allContacts: any[] = [];
      let nextToken = null;
      
      do {
        const result: any = await client.graphql({
          query: listContacts,
          variables: {
            limit: 1000, // Use a large limit to minimize API calls
            nextToken
          }
        });

        if (result.errors) {
          console.error('GraphQL errors:', result.errors);
          setError('Failed to load contacts');
          return;
        }

        const items = result.data.listContacts?.items || [];
        allContacts = allContacts.concat(items);
        nextToken = result.data.listContacts?.nextToken;
        
        console.log(`📋 Loaded ${items.length} contacts (total: ${allContacts.length}), nextToken: ${nextToken ? 'exists' : 'null'}`);
        
      } while (nextToken);

      const contactsData: Contact[] = allContacts.map(contact => ({
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
        linkedUserId: undefined, // TODO: Implement user linking logic
        
        // Role Management Fields
        roleType: contact.roleType || undefined,
        isActive: contact.isActive ?? true,
        assignmentPriority: contact.assignmentPriority ?? 1,
        canReceiveNotifications: contact.canReceiveNotifications ?? true
      }));

      console.log(`✅ Successfully loaded ${contactsData.length} total contacts from database`);
      setContacts(contactsData);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  // Apply search, filter, and sort to contacts
  useEffect(() => {
    let filtered = [...contacts];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact => 
        (contact.fullName?.toLowerCase().includes(query)) ||
        (contact.firstName?.toLowerCase().includes(query)) ||
        (contact.lastName?.toLowerCase().includes(query)) ||
        (contact.email?.toLowerCase().includes(query)) ||
        (contact.phone?.includes(query)) ||
        (contact.mobile?.includes(query)) ||
        (contact.company?.toLowerCase().includes(query)) ||
        (contact.brokerage?.toLowerCase().includes(query))
      );
    }

    // Apply role filter - support multiple roles (comma-separated)
    if (filterRole !== 'all') {
      if (filterRole === '') {
        // Show contacts with no role
        filtered = filtered.filter(contact => !contact.roleType);
      } else {
        // Show contacts with specific role (supports multiple roles)
        filtered = filtered.filter(contact => 
          contact.roleType?.split(',').map(r => r.trim()).includes(filterRole)
        );
      }
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(contact => 
        filterStatus === 'active' ? contact.isActive !== false : contact.isActive === false
      );
    }

    // Apply notifications filter
    if (filterNotifications !== 'all') {
      filtered = filtered.filter(contact => 
        filterNotifications === 'enabled' ? contact.canReceiveNotifications !== false : contact.canReceiveNotifications === false
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';

      switch (sortField) {
        case 'fullName':
          aValue = a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'zzz';
          bValue = b.fullName || `${b.firstName || ''} ${b.lastName || ''}`.trim() || 'zzz';
          break;
        case 'email':
          aValue = a.email || 'zzz';
          bValue = b.email || 'zzz';
          break;
        case 'roleType':
          aValue = a.roleType || 'zzz';
          bValue = b.roleType || 'zzz';
          break;
        case 'company':
          aValue = a.company || a.brokerage || 'zzz';
          bValue = b.company || b.brokerage || 'zzz';
          break;
        case 'assignmentPriority':
          aValue = a.assignmentPriority || 999;
          bValue = b.assignmentPriority || 999;
          break;
        default:
          aValue = a.fullName || 'zzz';
          bValue = b.fullName || 'zzz';
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredContacts(filtered);
    
    // Only reset to first page when filters actually change (not on contact updates)
    if (shouldResetPage) {
      setCurrentPage(1);
      setShouldResetPage(false);
    }
  }, [contacts, searchQuery, filterRole, filterStatus, filterNotifications, sortField, sortDirection, shouldResetPage]);

  // Get paginated contacts for current page
  const paginatedContacts = itemsPerPage === 0 
    ? filteredContacts // Show all if itemsPerPage is 0
    : filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(filteredContacts.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Wrapper functions to trigger page reset when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShouldResetPage(true);
  };

  const handleFilterRoleChange = (value: string) => {
    setFilterRole(value);
    setShouldResetPage(true);
  };

  const handleFilterStatusChange = (value: string) => {
    setFilterStatus(value);
    setShouldResetPage(true);
  };

  const handleFilterNotificationsChange = (value: string) => {
    setFilterNotifications(value);
    setShouldResetPage(true);
  };

  const handleSortFieldChange = (value: string) => {
    setSortField(value);
    setShouldResetPage(true);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterNotifications('all');
    setSortField('fullName');
    setSortDirection('asc');
    setCurrentPage(1);
    setItemsPerPage(10); // Reset to default page size
    setShouldResetPage(true);
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
        setNotification({message: 'Failed to update contact preferences', type: 'error'});
        return;
      }

      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, emailNotifications, smsNotifications }
          : contact
      ));

      setNotification({message: 'Contact preferences updated successfully', type: 'success'});
      console.log('✅ Contact notification preferences updated');
    } catch (err) {
      console.error('Failed to update contact:', err);
      setNotification({message: 'Failed to update contact', type: 'error'});
    }
  };

  const updateContactRole = async (
    contactId: string, 
    roleType?: string, 
    isActive?: boolean, 
    assignmentPriority?: number,
    canReceiveNotifications?: boolean
  ) => {
    try {
      const updateInput: any = { id: contactId };
      
      if (roleType !== undefined) updateInput.roleType = roleType;
      if (isActive !== undefined) updateInput.isActive = isActive;
      if (assignmentPriority !== undefined) updateInput.assignmentPriority = assignmentPriority;
      if (canReceiveNotifications !== undefined) updateInput.canReceiveNotifications = canReceiveNotifications;

      console.log('🔧 Updating contact role with input:', updateInput);

      const result = await client.graphql({
        query: updateContacts,
        variables: { input: updateInput }
      });

      console.log('🔍 GraphQL result:', result);

      if (result.errors) {
        console.error('❌ Role update errors:', result.errors);
        console.error('❌ Full error details:', JSON.stringify(result.errors, null, 2));
        setNotification({message: `Failed to update contact role: ${result.errors[0]?.message || 'Unknown error'}`, type: 'error'});
        return;
      }

      // Update local state
      setContacts(prev => prev.map(contact => 
        contact.id === contactId 
          ? { 
              ...contact, 
              roleType: roleType !== undefined ? roleType : contact.roleType,
              isActive: isActive !== undefined ? isActive : contact.isActive,
              assignmentPriority: assignmentPriority !== undefined ? assignmentPriority : contact.assignmentPriority,
              canReceiveNotifications: canReceiveNotifications !== undefined ? canReceiveNotifications : contact.canReceiveNotifications
            }
          : contact
      ));

      setNotification({message: 'Contact role updated successfully', type: 'success'});
      console.log('✅ Contact role updated');
    } catch (err) {
      console.error('❌ Failed to update contact role (catch block):', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
      setNotification({message: `Failed to update contact role: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error'});
    }
  };

  // Auto-dismiss notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div>
      {/* Success/Error Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-3 text-lg font-semibold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header with Tabs */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <H2>Contacts & Role Management ({filteredContacts.length} of {contacts.length})</H2>
          <button
            onClick={loadContacts}
            disabled={loadingContacts}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingContacts ? 'Loading...' : 'Refresh Contacts'}
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Contacts
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by name, email, phone, or company..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Role Filter */}
            <div>
              <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Role
              </label>
              <select
                id="roleFilter"
                value={filterRole}
                onChange={(e) => handleFilterRoleChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Roles</option>
                {roleTypes.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
                <option value="">No Role</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                id="statusFilter"
                value={filterStatus}
                onChange={(e) => handleFilterStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Notifications Filter */}
            <div>
              <label htmlFor="notificationsFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Notifications
              </label>
              <select
                id="notificationsFilter"
                value={filterNotifications}
                onChange={(e) => handleFilterNotificationsChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Contacts</option>
                <option value="enabled">Notifications Enabled</option>
                <option value="disabled">Notifications Disabled</option>
              </select>
            </div>

            {/* Sort Control */}
            <div>
              <label htmlFor="sortField" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex gap-1">
                <select
                  id="sortField"
                  value={sortField}
                  onChange={(e) => handleSortFieldChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="fullName">Name</option>
                  <option value="email">Email</option>
                  <option value="roleType">Role</option>
                  <option value="company">Company</option>
                  <option value="assignmentPriority">Priority</option>
                </select>
                <button
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Page Size Control */}
            <div>
              <label htmlFor="pageSize" className="block text-sm font-medium text-gray-700 mb-1">
                Items per Page
              </label>
              <select
                id="pageSize"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {pageSizeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('contacts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contacts List
            </button>
            <button
              onClick={() => setSelectedTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'roles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Role Management
            </button>
          </nav>
        </div>
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
        <>
          {/* Contacts Tab */}
          {selectedTab === 'contacts' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('fullName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Contact</span>
                        {sortField === 'fullName' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        {sortField === 'email' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('company')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Company</span>
                        {sortField === 'company' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
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
                  {paginatedContacts.map((contact) => (
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
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(currentPage - 1) * itemsPerPage + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * itemsPerPage, filteredContacts.length)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{filteredContacts.length}</span>{' '}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ‹
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === pageNumber
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ›
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}

              {filteredContacts.length === 0 && (
                <div className="text-center py-8">
                  <P2 className="text-gray-500">
                    {searchQuery || filterRole !== 'all' || filterStatus !== 'all' || filterNotifications !== 'all' 
                      ? 'No contacts match your search criteria' 
                      : 'No contacts found'}
                  </P2>
                </div>
              )}
            </div>
          )}

          {/* Role Management Tab */}
          {selectedTab === 'roles' && (
            <div className="space-y-6">
              {/* Role Assignment Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Role Management</h3>
                <P2 className="text-blue-700 mb-2">
                  Assign roles to contacts to control notification routing and access permissions.
                </P2>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li><strong>AE (Account Executive):</strong> Receives new estimate requests and manages customer relationships</li>
                  <li><strong>PM (Project Manager):</strong> Manages project execution and updates</li>
                  <li><strong>Admin:</strong> Full system access and management capabilities</li>
                  <li><strong>Customer:</strong> Property owners and homeowners</li>
                  <li><strong>Affiliate:</strong> Business partners and contractors</li>
                </ul>
              </div>

              {/* Role Management Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('fullName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Contact</span>
                          {sortField === 'fullName' && (
                            <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('roleType')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Role</span>
                          {sortField === 'roleType' && (
                            <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('assignmentPriority')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Priority</span>
                          {sortField === 'assignmentPriority' && (
                            <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
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
                    {paginatedContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{contact.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRole === contact.id ? (
                            <div className="space-y-3">
                              <div className="space-y-1">
                                {roleTypes.map(role => (
                                  <label key={role} className="flex items-center text-sm">
                                    <input
                                      type="checkbox"
                                      checked={editingRoles.includes(role)}
                                      onChange={() => toggleRoleInEdit(role)}
                                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mr-2"
                                    />
                                    {role}
                                  </label>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveRoleChanges(contact.id)}
                                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingRole}
                                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {parseRoles(contact.roleType).length > 0 ? (
                                parseRoles(contact.roleType).map(role => (
                                  <span key={role} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-1 mb-1 ${
                                    role === 'AE' ? 'bg-green-100 text-green-800' :
                                    role === 'PM' ? 'bg-blue-100 text-blue-800' :
                                    role === 'Admin' ? 'bg-red-100 text-red-800' :
                                    role === 'Customer' ? 'bg-yellow-100 text-yellow-800' :
                                    role === 'Affiliate' ? 'bg-purple-100 text-purple-800' :
                                    role === 'Accounting' ? 'bg-indigo-100 text-indigo-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {role}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No Role
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={contact.isActive ?? true}
                              onChange={(e) => updateContactRole(contact.id, undefined, e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className={`ml-2 text-sm ${contact.isActive ? 'text-green-600' : 'text-red-600'}`}>
                              {contact.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={contact.assignmentPriority ?? 1}
                            onChange={(e) => updateContactRole(contact.id, undefined, undefined, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={contact.canReceiveNotifications ?? true}
                              onChange={(e) => updateContactRole(contact.id, undefined, undefined, undefined, e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className={`ml-2 text-sm ${contact.canReceiveNotifications ? 'text-green-600' : 'text-red-600'}`}>
                              {contact.canReceiveNotifications ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => editingRole === contact.id 
                              ? cancelEditingRole() 
                              : startEditingRole(contact.id, contact.roleType || '')
                            }
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            {editingRole === contact.id ? 'Cancel' : 'Edit Roles'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination Controls for Role Management */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {(currentPage - 1) * itemsPerPage + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * itemsPerPage, filteredContacts.length)}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">{filteredContacts.length}</span>{' '}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ‹
                          </button>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => setCurrentPage(pageNumber)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNumber
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ›
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}

                {filteredContacts.length === 0 && (
                  <div className="text-center py-8">
                    <P2 className="text-gray-500">
                      {searchQuery || filterRole !== 'all' || filterStatus !== 'all' || filterNotifications !== 'all' 
                        ? 'No contacts match your search criteria' 
                        : 'No contacts found'}
                    </P2>
                  </div>
                )}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                {roleTypes.map(role => {
                  const roleCount = contacts.filter(c => hasRole(c, role) && c.isActive).length;
                  return (
                    <div key={role} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">{role}</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900">{roleCount}</div>
                      <div className="text-sm text-gray-500">Active contacts</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContactManagement;