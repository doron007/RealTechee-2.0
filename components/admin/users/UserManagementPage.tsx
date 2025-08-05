import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H2, H4, P2 } from '../../typography';
import StatusPill from '../../common/ui/StatusPill';
import { DateTimeUtils } from '../../../utils/dateTimeUtils';

const client = generateClient();

interface User {
  id: string;
  username: string;
  email: string;
  status: string;
  created: string;
  lastLogin?: string;
  groups: string[];
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // This would typically call a custom GraphQL query or Lambda function
      // For now, we'll use mock data
      const mockUsers: User[] = [
        {
          id: '1',
          username: 'admin@realtechee.com',
          email: 'admin@realtechee.com',
          status: 'CONFIRMED',
          created: '2024-01-15T10:00:00Z',
          lastLogin: '2024-08-04T15:30:00Z',
          groups: ['Admin', 'Sales']
        },
        {
          id: '2',
          username: 'info@realtechee.com',
          email: 'info@realtechee.com',
          status: 'CONFIRMED',
          created: '2024-01-20T14:20:00Z',
          lastLogin: '2024-08-04T09:15:00Z',
          groups: ['Admin']
        }
      ];
      setUsers(mockUsers);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'green';
      case 'UNCONFIRMED': return 'yellow';
      case 'FORCE_CHANGE_PASSWORD': return 'orange';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <H2 className="mb-6">User Management</H2>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading users...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <H2 className="mb-2">User Management</H2>
          <P2 className="text-gray-600">Manage user accounts and permissions</P2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Filters - Mobile Responsive with Collapsible */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          <div className="p-4">
            {/* Always visible search + toggle button on mobile */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search - Always visible */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email or username..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Mobile: Toggle button for additional filters */}
              <div className="lg:hidden flex-shrink-0">
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 flex items-center justify-center gap-2 transition-colors"
                >
                  Filters
                  <svg
                    className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Desktop: Always visible filters */}
              <div className="hidden lg:flex lg:gap-4">
                {/* Status Filter */}
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="UNCONFIRMED">Unconfirmed</option>
                    <option value="FORCE_CHANGE_PASSWORD">Force Change Password</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile: Collapsible additional filters */}
            <div className={`lg:hidden mt-4 ${filtersExpanded ? 'block' : 'hidden'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="UNCONFIRMED">Unconfirmed</option>
                    <option value="FORCE_CHANGE_PASSWORD">Force Change Password</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users List - Mobile Responsive */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-8 text-center text-gray-500">
                No users found matching your criteria.
              </div>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 lg:p-6">
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <H4 className="text-gray-900">{user.email}</H4>
                        <P2 className="text-gray-600 text-sm">@{user.username}</P2>
                      </div>
                      <StatusPill status={user.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <br />
                        <span className="text-gray-900">
                          {DateTimeUtils.forDisplay(user.created)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Login:</span>
                        <br />
                        <span className="text-gray-900">
                          {user.lastLogin ? DateTimeUtils.timeAgo(user.lastLogin) : 'Never'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 text-sm">Groups:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {user.groups.map((group) => (
                          <span
                            key={group}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                          >
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <H4 className="text-gray-900">{user.email}</H4>
                            <P2 className="text-gray-600">@{user.username}</P2>
                          </div>
                          <StatusPill status={user.status} />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Created:</span> {DateTimeUtils.forDisplay(user.created)}
                        </div>
                        <div>
                          <span className="text-gray-500">Last Login:</span> {user.lastLogin ? DateTimeUtils.timeAgo(user.lastLogin) : 'Never'}
                        </div>
                        <div>
                          <span className="text-gray-500">Groups:</span>
                          <div className="mt-1 flex space-x-1">
                            {user.groups.map((group) => (
                              <span
                                key={group}
                                className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                              >
                                {group}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats Footer */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-6">
          <div className="p-4 bg-gray-50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between text-sm text-gray-600">
              <div>Total Users: {filteredUsers.length}</div>
              <div className="mt-2 lg:mt-0">
                Confirmed: {filteredUsers.filter(u => u.status === 'CONFIRMED').length} • 
                Pending: {filteredUsers.filter(u => u.status === 'UNCONFIRMED').length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;