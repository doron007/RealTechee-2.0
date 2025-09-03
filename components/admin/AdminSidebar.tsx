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
  isCollapsed: boolean;
  isMobile: boolean;
  isHamburgerMode: boolean;
  isMenuOpen: boolean;
  toggle: () => void;
  closeMenu: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  isCollapsed, 
  isMobile, 
  isHamburgerMode, 
  isMenuOpen, 
  toggle: handleToggle, 
  closeMenu 
}) => {
  const router = useRouter();

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
      route: '/admin/users',
      icon: '/assets/icons/ic-users.svg',
      isImplemented: true
    },
    {
      id: 'contacts',
      name: 'Contacts',
      route: '/admin/contacts',
      icon: '/assets/icons/ic-contacts.svg',
      isImplemented: true
    },
    {
      id: 'notifications',
      name: 'Notifications',
      route: '/admin/notifications',
      icon: '/assets/icons/ic-notifications.svg',
      isImplemented: true
    },
    {
      id: 'notification-monitor',
      name: 'Live Monitor',
      route: '/admin/notification-monitor',
      icon: '/assets/icons/ic-chart.svg',
      isImplemented: true
    },
    {
      id: 'system',
      name: 'System Config',
      route: '/admin/system',
      icon: '/assets/icons/settings.svg',
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
    
    // Close hamburger menu when navigating on mobile
    if (isHamburgerMode) {
      closeMenu();
    }
    
    router.push(item.route);
  };

  const handleLogoClick = () => {
    // Close hamburger menu when navigating on mobile
    if (isHamburgerMode) {
      closeMenu();
    }
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
      {((isMobile && !isCollapsed) || (isHamburgerMode && isMenuOpen)) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[55] lg:hidden"
          onClick={isHamburgerMode ? closeMenu : handleToggle}
          aria-label="Close sidebar"
        />
      )}
      
      <div
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white flex flex-col lg:relative ${
          // Width logic: hamburger mode uses full mobile width, otherwise collapse/expand
          isHamburgerMode ? 'w-64' : (isCollapsed ? 'w-16' : 'w-64')
        } ${
          // Position logic: hamburger mode slides in/out, others use z-index
          isHamburgerMode 
            ? `z-[60] shadow-2xl transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}` 
            : (isMobile && !isCollapsed ? 'z-[60] shadow-2xl transition-all duration-300' : 'z-50 transition-all duration-300')
        }`}
      >
      {/* Header with Logo - Improved Design */}
      <div className="pt-5 pb-4 border-b border-gray-700">
        {(!isCollapsed || isHamburgerMode) ? (
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
            
            {/* Admin title with collapse/close button to the right */}
            <div className="px-3 flex items-center justify-between">
              <H3 className="text-white font-bold opacity-90">Admin</H3>
              {isHamburgerMode ? (
                /* Close button for hamburger mode */
                <button
                  onClick={closeMenu}
                  className="p-2 hover:bg-white hover:bg-opacity-10 rounded-md transition-colors flex-shrink-0 ml-2"
                  aria-label="Close menu"
                >
                  <div className="w-6 h-6 flex items-center justify-center relative">
                    <span className="block w-4 h-0.5 bg-white transform rotate-45 absolute" />
                    <span className="block w-4 h-0.5 bg-white transform -rotate-45 absolute" />
                  </div>
                </button>
              ) : (
                /* Collapse button for desktop/tablet */
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
              )}
            </div>
          </div>
        ) : !isHamburgerMode ? (
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
        ) : null}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto">
        <div className={(isCollapsed && !isHamburgerMode) ? "p-2" : "p-3"}>
          {sidebarItems
            .filter(item => {
              // Hide expand toggle in hamburger mode - not needed since menu slides in/out
              if (isHamburgerMode && item.id === 'expand-toggle') {
                return false;
              }
              return true;
            })
            .map((item) => {
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
                fullWidth={!(isCollapsed && !isHamburgerMode)}
                withIcon={!!item.icon}
                iconSvg={item.icon || undefined}
                iconPosition="left"
                className={`mb-1 ${(isCollapsed && !isHamburgerMode) ? 'justify-center items-center px-2 py-2.5 w-12 mx-auto [&_img]:!w-8 [&_img]:!h-8 [&>div]:!transform-none [&>div]:hover:!transform-none [&>div]:!flex [&>div]:!items-center [&>div]:!justify-center' : 'justify-start py-2.5 px-3.5'} rounded-xl h-auto ${getNavigationButtonClasses()} ${iconClasses}`}
              >
                {(!isCollapsed || isHamburgerMode) && (
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

            // Add tooltip using title attribute when collapsed (but not in hamburger mode)
            if (isCollapsed && !isHamburgerMode) {
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
      {(!isCollapsed || isHamburgerMode) && (
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