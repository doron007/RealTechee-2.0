import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserManagement, ContactManagement, NotificationManagement } from './';

type TabType = 'users' | 'contacts' | 'notifications';

const LegacyAdminTabs: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // Set active tab based on URL parameter
  useEffect(() => {
    const tab = router.query.tab as TabType;
    if (tab && ['users', 'contacts', 'notifications'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [router.query.tab]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/admin-legacy?tab=${tab}`, undefined, { shallow: true });
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => handleTabChange('users')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => handleTabChange('contacts')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'contacts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contact Management
            </button>
            <button
              onClick={() => handleTabChange('notifications')}
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
          {activeTab === 'users' && <UserManagement userRole="admin" />}
          {activeTab === 'contacts' && <ContactManagement />}
          {activeTab === 'notifications' && <NotificationManagement />}
        </div>
      </div>
    </div>
  );
};

export default LegacyAdminTabs;