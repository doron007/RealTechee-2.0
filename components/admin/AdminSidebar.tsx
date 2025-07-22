import React from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { H3, H4, P3 } from '../typography';
import Button from '../common/buttons/Button';
import Card from '../common/ui/Card';
import { useAdminSidebar } from '../../hooks/useAdminSidebar';

interface SidebarItem {
  id: string;
  name: string;
  route: string;
  icon: string | null; // Icon path for reusable assets
  badge?: number; // For showing counts/notifications
  isImplemented?: boolean; // Track which sections are implemented
}

interface AdminSidebarProps {
  // Remove props since we'll manage state internally
}

const AdminSidebar: React.FC<AdminSidebarProps> = () => {
  const router = useRouter();
  const { isCollapsed, isMobile, toggle: handleToggle } = useAdminSidebar();

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      route: '/admin',
      icon: '/assets/icons/ic-dashboard.svg',
      isImplemented: true
    },
    {
      id: 'projects',
      name: 'Projects',
      route: '/admin/projects',
      icon: '/assets/icons/ic-projects.svg',
      isImplemented: true
    },
    {
      id: 'quotes',
      name: 'Quotes',
      route: '/admin/quotes',
      icon: '/assets/icons/ic-quotes.svg',
      isImplemented: true
    },
    {
      id: 'requests',
      name: 'Requests',
      route: '/admin/requests',
      icon: '/assets/icons/ic-requests.svg',
      isImplemented: true
    },
    {
      id: 'analytics',
      name: 'Analytics',
      route: '/admin/analytics',
      icon: '/assets/icons/ic-chart.svg',
      isImplemented: true
    },
    {
      id: 'lifecycle',
      name: 'Lifecycle',
      route: '/admin/lifecycle',
      icon: '/assets/icons/ic-watch.svg',
      isImplemented: true
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
      icon: '/assets/icons/ic-users.svg',
      isImplemented: true
    },
    {
      id: 'contacts',
      name: 'Contacts',
      route: '/admin-legacy?tab=contacts',
      icon: '/assets/icons/ic-contacts.svg',
      isImplemented: true
    },
    {
      id: 'notifications',
      name: 'Notifications',
      route: '/admin-legacy?tab=notifications',
      icon: '/assets/icons/ic-notifications.svg',
      isImplemented: true
    },
    {
      id: 'expand-toggle',
      name: 'Expand',
      route: '',
      icon: '/assets/icons/ic-arrow-down.svg',
      isImplemented: true
    }
  ];

  const handleItemClick = (item: SidebarItem) => {
    if (item.id.startsWith('divider')) return;
    
    if (item.id === 'expand-toggle') {
      handleToggle();
      return;
    }
    
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
    <>
      {/* Mobile backdrop overlay when sidebar is expanded */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={handleToggle}
          aria-label="Close sidebar"
        />
      )}
      
      <div
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 shadow-lg flex flex-col lg:relative ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${
          // On mobile, use higher z-index overlay when expanded instead of hiding
          isMobile && !isCollapsed ? 'z-[60] shadow-2xl' : 'z-50'
        }`}
      >
      {/* Header with Logo - Improved Design */}
      <div className="pt-5 pb-4 border-b border-gray-700">
        {!isCollapsed ? (
          <div>
            {/* Logo gets dedicated prominent space */}
            <div className="px-3 pb-3">
              <button 
                onClick={handleLogoClick}
                className="w-full hover:opacity-90 transition-opacity cursor-pointer mb-1.5"
              >
                <div className="bg-white p-2 shadow-sm w-full flex justify-center items-center min-h-[52px]">
                  <Image
                    src="/assets/logos/realtechee-horizontal.png"
                    alt="RealTechee"
                    width={200}
                    height={40}
                    className="h-8 w-auto"
                    priority
                  />
                </div>
              </button>
            </div>
            
            {/* Admin title with collapse button to the right */}
            <div className="px-3 flex items-center justify-between">
              <H3 className="text-white font-bold opacity-90">Admin</H3>
              <Button
                onClick={handleToggle}
                variant="tertiary"
                mode="dark"
                withIcon
                iconSvg="/assets/icons/ic-arrow-down.svg"
                iconPosition="right"
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-md transform rotate-90"
                aria-label="Collapse sidebar"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button 
              onClick={handleLogoClick}
              className="hover:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="bg-white rounded-lg p-1 shadow-sm w-14 h-14 flex items-center justify-center">
                <Image
                  src="/assets/logos/app_realtechee for AppIcon.png"
                  alt="RealTechee"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto">
        <div className={isCollapsed ? "p-2" : "p-3"}>
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
            
            // COO-compliant navigation button styling
            const getNavigationButtonClasses = () => {
              if (isActive) {
                return 'bg-gray-700/50 text-white border-l-4 border-blue-500 !border-t-0 !border-r-0 !border-b-0';
              }
              if (item.isImplemented) {
                return 'text-white hover:bg-gray-700 hover:text-white !border-0';
              }
              return '!text-gray-300 hover:!text-gray-200 cursor-default !border-0 bg-gray-800/30 hover:bg-gray-700/50';
            };
            
            // Use regular icons - Button component will handle disabled styling
            
            // Special handling for expand toggle in collapsed mode
            if (item.id === 'expand-toggle' && !isCollapsed) {
              return null; // Don't show expand button when sidebar is expanded
            }
            
            // Apply rotation for expand toggle
            const iconClasses = item.id === 'expand-toggle' ? 'transform -rotate-90' : '';
            
            const buttonElement = (
              <Button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={!item.isImplemented}
                variant="tertiary"
                mode="dark"
                fullWidth={!isCollapsed}
                withIcon={!!item.icon}
                iconSvg={item.icon || undefined}
                iconPosition="left"
                className={`mb-1 ${isCollapsed ? 'justify-center items-center px-2 py-2.5 w-12 mx-auto [&_img]:!w-8 [&_img]:!h-8 [&>div]:!transform-none [&>div]:hover:!transform-none [&>div]:!flex [&>div]:!items-center [&>div]:!justify-center' : 'justify-start py-2.5 px-3.5'} rounded-xl h-auto ${getNavigationButtonClasses()} ${iconClasses}`}
              >
                {!isCollapsed && (
                  <>
                    <span className={`text-sm font-medium ml-3 ${!item.isImplemented ? 'opacity-50' : ''}`}>
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
              </Button>
            );

            // Add tooltip using title attribute when collapsed
            if (isCollapsed) {
              const buttonWithTooltip = React.cloneElement(buttonElement, {
                title: item.name,
                key: item.id
              });
              return buttonWithTooltip;
            }
            
            return buttonElement;
          })}
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-700">
          <P3 className="text-gray-400 text-center">
            Admin Panel v2.0
          </P3>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminSidebar;