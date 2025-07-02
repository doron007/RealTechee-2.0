import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { H3, P3 } from '../typography';

interface SidebarItem {
  id: string;
  name: string;
  route: string;
  icon: React.ReactNode;
  badge?: number; // For showing counts/notifications
  isImplemented?: boolean; // Track which sections are implemented
}

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  isCollapsed = false, 
  onToggle 
}) => {
  const router = useRouter();

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      route: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      isImplemented: true
    },
    {
      id: 'projects',
      name: 'Projects',
      route: '/admin/projects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      isImplemented: false
    },
    {
      id: 'quotes',
      name: 'Quotes',
      route: '/admin/quotes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      isImplemented: false
    },
    {
      id: 'requests',
      name: 'Requests',
      route: '/admin/requests',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      isImplemented: false
    },
    {
      id: 'divider-1',
      name: '',
      route: '',
      icon: null,
      isImplemented: true
    },
    {
      id: 'users',
      name: 'Users',
      route: '/admin-legacy?tab=users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      isImplemented: true
    },
    {
      id: 'contacts',
      name: 'Contacts',
      route: '/admin-legacy?tab=contacts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      isImplemented: true
    },
    {
      id: 'notifications',
      name: 'Notifications',
      route: '/admin-legacy?tab=notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5" />
        </svg>
      ),
      isImplemented: true
    }
  ];

  const handleItemClick = (item: SidebarItem) => {
    if (item.id.startsWith('divider')) return;
    
    if (!item.isImplemented) {
      alert(`${item.name} management will be implemented in upcoming phases`);
      return;
    }
    
    router.push(item.route);
  };

  const handleLogoClick = () => {
    router.push('/admin');
  };

  const isActiveRoute = (route: string) => {
    if (route === '/admin') {
      return router.pathname === '/admin';
    }
    return router.pathname.startsWith(route) || router.asPath.includes(route);
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-50 shadow-lg flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header with Logo */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex flex-col space-y-3">
            <button 
              onClick={handleLogoClick}
              className="hover:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="bg-white rounded px-2 py-1 shadow-sm">
                <Image
                  src="/assets/images/brand_logos_web_Small logo 118x16.png"
                  alt="RealTechee"
                  width={118}
                  height={16}
                  className="h-4 w-auto"
                />
              </div>
            </button>
            <H3 className="text-white font-bold text-sm">Admin</H3>
          </div>
        ) : (
          <button 
            onClick={handleLogoClick}
            className="hover:opacity-90 transition-opacity cursor-pointer mx-auto"
          >
            <div className="bg-white rounded p-1 shadow-sm">
              <Image
                src="/assets/images/brand_logos_web_Small logo 118x16.png"
                alt="RealTechee"
                width={28}
                height={4}
                className="h-3 w-auto"
              />
            </div>
          </button>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg 
            className={`w-4 h-4 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-2">
          {sidebarItems.map((item) => {
            // Render divider
            if (item.id.startsWith('divider')) {
              return (
                <div key={item.id} className="my-2">
                  <hr className="border-gray-700" />
                </div>
              );
            }

            const isActive = isActiveRoute(item.route);
            
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center p-3 mb-1 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : item.isImplemented
                    ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                    : 'text-gray-500 hover:text-gray-400 cursor-default'
                }`}
                disabled={!item.isImplemented}
              >
                <span className={`${!item.isImplemented ? 'opacity-50' : ''}`}>
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <>
                    <span className={`ml-3 text-sm font-medium ${!item.isImplemented ? 'opacity-50' : ''}`}>
                      {item.name}
                    </span>
                    
                    {!item.isImplemented && (
                      <span className="ml-auto text-xs bg-gray-600 px-2 py-1 rounded">
                        Soon
                      </span>
                    )}
                    
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed && (
          <P3 className="text-gray-400 text-center">
            Admin Panel v2.0
          </P3>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;