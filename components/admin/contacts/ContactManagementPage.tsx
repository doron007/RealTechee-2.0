import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { H2, H4, P2 } from '../../typography';
import Card from '../../common/ui/Card';
import StatusPill from '../../common/ui/StatusPill';
import { DateTimeUtils } from '../../../utils/dateTimeUtils';
import { listContacts } from '../../../queries';

const client = generateClient();

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  company?: string;
  source?: string;
}

const ContactManagementPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await client.graphql({
        query: listContacts,
        variables: {
          limit: 100
        }
      });
      
      const contactsData = response.data.listContacts.items.map(contact => ({
        id: contact.id,
        name: contact.firstName && contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.firstName || contact.lastName || 'Unknown',
        email: contact.email || '',
        phone: contact.phone || undefined,
        role: 'Contact', // Default role since contactType not available in schema
        status: 'ACTIVE', // Default status since not available in schema
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        company: contact.company || undefined,
        source: 'Direct' // Default source since leadSource not available in schema
      }));
      
      setContacts(contactsData);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || contact.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'INACTIVE': return 'gray';
      case 'PENDING': return 'yellow';
      default: return 'gray';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'purple';
      case 'Agent': return 'blue';
      case 'ProjectManager': return 'indigo';
      case 'Client': return 'green';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <H2 className="mb-6">Contact Management</H2>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading contacts...</div>
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
          <H2 className="mb-2">Contact Management</H2>
          <P2 className="text-gray-600">Manage contacts, agents, and project managers</P2>
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
                  Search Contacts
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or company..."
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
                {/* Role Filter */}
                <div className="w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Agent">Agent</option>
                    <option value="ProjectManager">Project Manager</option>
                    <option value="Client">Client</option>
                  </select>
                </div>

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
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile: Collapsible additional filters */}
            <div className={`lg:hidden mt-4 ${filtersExpanded ? 'block' : 'hidden'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Agent">Agent</option>
                    <option value="ProjectManager">Project Manager</option>
                    <option value="Client">Client</option>
                  </select>
                </div>

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
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contacts List - Mobile Responsive */}
        <div className="space-y-4">
          {filteredContacts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-8 text-center text-gray-500">
                No contacts found matching your criteria.
              </div>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div key={contact.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 lg:p-6">
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <H4 className="text-gray-900">{contact.name}</H4>
                        <P2 className="text-gray-600 text-sm">{contact.email}</P2>
                        {contact.phone && (
                          <P2 className="text-gray-600 text-sm">{contact.phone}</P2>
                        )}
                        {contact.company && (
                          <P2 className="text-gray-500 text-sm">{contact.company}</P2>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <StatusPill status={contact.status} />
                        <StatusPill status={contact.role} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <br />
                        <span className="text-gray-900">
                          {DateTimeUtils.forDisplay(contact.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Updated:</span>
                        <br />
                        <span className="text-gray-900">
                          {DateTimeUtils.timeAgo(contact.updatedAt)}
                        </span>
                      </div>
                    </div>
                    
                    {contact.source && (
                      <div className="text-sm">
                        <span className="text-gray-500">Source:</span> {contact.source}
                      </div>
                    )}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:block">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <H4 className="text-gray-900">{contact.name}</H4>
                            <P2 className="text-gray-600">{contact.email}</P2>
                            {contact.phone && (
                              <P2 className="text-gray-600 text-sm">{contact.phone}</P2>
                            )}
                            {contact.company && (
                              <P2 className="text-gray-500 text-sm">{contact.company}</P2>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <StatusPill status={contact.status} />
                            <StatusPill status={contact.role} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Created:</span> {DateTimeUtils.forDisplay(contact.createdAt)}
                        </div>
                        <div>
                          <span className="text-gray-500">Updated:</span> {DateTimeUtils.timeAgo(contact.updatedAt)}
                        </div>
                        {contact.source && (
                          <div>
                            <span className="text-gray-500">Source:</span> {contact.source}
                          </div>
                        )}
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
              <div>Total Contacts: {filteredContacts.length}</div>
              <div className="mt-2 lg:mt-0 flex flex-wrap gap-4">
                <span>Active: {filteredContacts.filter(c => c.status === 'ACTIVE').length}</span>
                <span>Agents: {filteredContacts.filter(c => c.role === 'Agent').length}</span>
                <span>Project Managers: {filteredContacts.filter(c => c.role === 'ProjectManager').length}</span>
                <span>Clients: {filteredContacts.filter(c => c.role === 'Client').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactManagementPage;