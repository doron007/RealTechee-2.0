import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  DropdownLink, 
  MobileDropdownLink, 
  productCategories,
  contactOptions
} from '../../../utils/componentUtils';
import Button from '../buttons/Button';
import EstimateButton from '../buttons/EstimateButton';
// Dynamic import to avoid loading authorization service in main bundle
// import { AuthorizationService } from '../../../utils/authorizationHelpers';

// Define HeaderProps interface directly in the file
interface HeaderProps {
  className?: string;
  transparent?: boolean;
  dark?: boolean;
  userLoggedIn?: boolean; // Added to handle logged-in state for mobile menu
  user?: any; // Amplify user object
  onSignOut?: () => void; // Sign out function
}

export default function Header({ userLoggedIn = false, user, onSignOut, ...props }: HeaderProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState<boolean>(false);
  const [contactDropdownOpen, setContactDropdownOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean>(false);

  // Helper functions to extract user data
  const getUserDisplayName = () => {
    if (!user) return 'User';
    // Try to get name from user attributes
    const email = user.signInDetails?.loginId || user.username || '';
    const customContactId = user.attributes?.['custom:contactId'] || '';
    
    // For now, use email prefix as display name
    // Later we could fetch from Contacts table using contactId
    const emailPrefix = email.split('@')[0];
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };

  const getUserEmail = () => {
    if (!user) return 'user@example.com';
    return user.signInDetails?.loginId || user.username || user.attributes?.email || 'user@example.com';
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    return displayName.substring(0, 2).toUpperCase();
  };

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
    setIsOpen(false);
    setProfileDropdownOpen(false);
  };
  const headerRef = useRef<HTMLDivElement>(null);

  // Check admin access when user logs in with dynamic import
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (userLoggedIn && user) {
        try {
          // Dynamic import to avoid loading in main bundle
          const { AuthorizationService } = await import('../../../utils/authorizationHelpers');
          const isAdmin = await AuthorizationService.hasMinimumRole('admin');
          setHasAdminAccess(isAdmin);
        } catch (err) {
          console.error('Failed to check admin access:', err);
          setHasAdminAccess(false);
        }
      } else {
        setHasAdminAccess(false);
      }
    };
    checkAdminAccess();
  }, [userLoggedIn, user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setProductsDropdownOpen(false);
        setContactDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Enhanced scroll detection with debouncing
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 10) {
            setScrolled(true);
          } else {
            setScrolled(false);
          }
          lastScrollY = window.scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header 
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2 sm:py-3' : 'bg-white py-3 sm:py-4 md:py-5 lg:py-6'
      }`}
    >
      <div className="w-full max-w-[1536px] mx-auto flex items-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-14 2xl:px-16">
        {/* Logo */}
        <div className={`flex-shrink-0 h-[32px] sm:h-[35px] md:h-[40px] lg:h-[45px] flex items-center transition-all duration-300 ${scrolled ? 'transform scale-95' : ''}`}>
          <Link href="/" className="flex items-center h-full">
            <div className="border border-very-light-gray p-1 rounded h-full flex items-center">
              <Image
                src="/assets/logos/web_realtechee_horizontal_no_border.png"
                alt="RealTechee Logo"
                width={140}
                height={24}
                className="h-[24px] sm:h-[26px] md:h-[28px] lg:h-[32px] xl:h-[35px] w-auto"
                priority
              />
            </div>
          </Link>
        </div>
        
        {/* Menu bar - desktop - now only showing at xl and above breakpoints */}
        <div className="hidden xl:flex items-center ml-6 xl:ml-12 2xl:ml-14 gap-2 xl:gap-6 2xl:gap-8">
          {/* Products Dropdown */}
          <div 
            className="relative group"
            onMouseEnter={() => setProductsDropdownOpen(true)}
            onMouseLeave={() => setProductsDropdownOpen(false)}
          >
            <button 
              className="text-dark-gray text-responsive-sm xl:text-responsive-base 2xl:text-base font-body font-normal leading-relaxed flex items-center whitespace-nowrap gap-1 py-2 px-1 hover:text-accent transition-colors"
              onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              aria-expanded={productsDropdownOpen}
            >
              Products
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Dropdown" 
                width={16} 
                height={16} 
                className={`transform transition-transform duration-300 ${productsDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {/* Products Dropdown Menu with smooth animation */}
            <div 
              className={`absolute left-0 w-72 bg-white shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] rounded-[6px] overflow-hidden z-50 border border-[#F6F6F6] transition-all duration-300 origin-top ${
                productsDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`} 
              style={{ top: "100%" }}
            >
              <div className="pt-1">
                {productCategories.map((category, index) => (
                  <DropdownLink 
                    key={index}
                    href={category.href} 
                    text={category.text}
                    onClick={() => setProductsDropdownOpen(false)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="relative group">
            <Link href="/projects" className="text-dark-gray text-responsive-sm xl:text-responsive-base 2xl:text-base font-body font-normal leading-relaxed whitespace-nowrap py-2 px-1 hover:text-accent transition-colors">
              Projects
            </Link>
          </div>

          {/* About */}
          <div className="relative group">
            <Link href="/about" className="text-dark-gray text-responsive-sm xl:text-responsive-base 2xl:text-base font-body font-normal leading-relaxed whitespace-nowrap py-2 px-1 hover:text-accent transition-colors">
              About
            </Link>
          </div>

          {/* Contact Dropdown */}
          <div 
            className="relative group"
            onMouseEnter={() => setContactDropdownOpen(true)}
            onMouseLeave={() => setContactDropdownOpen(false)}
          >
            <button 
              className="text-dark-gray text-responsive-sm xl:text-responsive-base 2xl:text-base font-body font-normal leading-relaxed flex items-center whitespace-nowrap gap-1 py-2 px-1 hover:text-accent transition-colors"
              onClick={() => setContactDropdownOpen(!contactDropdownOpen)}
              aria-expanded={contactDropdownOpen}
            >
              Contact
              <Image 
                src="/assets/icons/ic-arrow-down.svg" 
                alt="Dropdown" 
                width={16} 
                height={16} 
                className={`transform transition-transform duration-300 ${contactDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            {/* Contact Dropdown Menu with smooth animation */}
            <div 
              className={`absolute left-0 w-64 bg-white shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] rounded-[6px] overflow-hidden z-50 border border-[#F6F6F6] transition-all duration-300 origin-top ${
                contactDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`} 
              style={{ top: "100%" }}
            >
              <div className="pt-1">
                {contactOptions.map((option, index) => (
                  <DropdownLink 
                    key={index}
                    href={option.href} 
                    text={option.text}
                    onClick={() => setContactDropdownOpen(false)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons Container - Only showing at xl and above */}
        <div className="hidden xl:flex items-center gap-4 xl:gap-6 ml-auto">
          {/* Login/Profile Button */}
          {userLoggedIn ? (
            <div 
              className="relative"
              onMouseEnter={() => setProfileDropdownOpen(true)}
              onMouseLeave={() => setProfileDropdownOpen(false)}
            >
              <button
                className="flex items-center gap-2 py-2 xl:py-2.5 2xl:py-3 px-3 xl:px-4 text-dark-gray hover:text-accent text-responsive-sm xl:text-responsive-base font-heading font-medium leading-tight whitespace-nowrap transition-colors"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
              >
                <span>{getUserDisplayName()}</span>
                <Image 
                  src="/assets/icons/ic-arrow-down.svg" 
                  alt="Dropdown" 
                  width={16} 
                  height={16} 
                  className={`transform transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {/* Profile Dropdown Menu */}
              <div 
                className={`absolute right-0 w-64 bg-white shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] rounded-[6px] overflow-hidden z-50 border border-[#F6F6F6] transition-all duration-300 origin-top ${
                  profileDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`} 
                style={{ top: "100%" }}
              >
                <div className="pt-1">
                  <DropdownLink 
                    href="/profile" 
                    text="My Profile"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <DropdownLink 
                    href="/projects" 
                    text="My Projects"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <DropdownLink 
                    href="/settings" 
                    text="Account Settings"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  {hasAdminAccess && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm font-heading font-medium text-blue-700 bg-blue-50 border-l-2 border-blue-500 hover:bg-blue-100 transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      🛡️ Admin Panel
                    </Link>
                  )}
                  <button
                    className="w-full text-left px-4 py-2 text-responsive-sm xl:text-responsive-base text-dark-gray hover:bg-[#FAFAFA] font-medium transition-colors"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="tertiary"
              href="/login"
              text="Login"
              underline={true}
              onClick={() => setIsOpen(false)}
            />
          )}
          
          {/* Get an Estimate Button */}
          <EstimateButton
            priority="primary"
            href="/contact/get-estimate"
            onClick={() => setIsOpen(false)}
          />
        </div>
        
        {/* Mobile Menu Button - Now showing on lg and below */}
        <div className="xl:hidden ml-auto">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2.5 rounded-md text-medium-gray hover:text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent transition-all"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
            {isOpen ? (
              <Image src="/assets/icons/ic-cancel.svg" alt="Close Menu" width={24} height={24} />
            ) : (
              <Image src="/assets/icons/menu.svg" alt="Open Menu" width={24} height={24} />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu - Updated according to Figma design */}
      <div 
        className={`xl:hidden bg-white fixed right-0 z-40 transition-all duration-300 ease-in-out transform shadow-lg ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          top: scrolled ? '65px' : '75px', // Increased values to ensure menu appears below the header
          height: scrolled ? 'calc(100vh - 65px)' : 'calc(100vh - 75px)',
          width: '280px', // Width based on the longest menu item
          maxWidth: '90vw'
        }}
        aria-hidden={!isOpen}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Top Action Buttons Container */}
          <div className="p-4 space-y-3 border-b border-[#F6F6F6]">
            {/* Login/Profile Button */}
            {userLoggedIn ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded bg-[#FAFAFA]">
                <div className="w-9 h-9 rounded-full bg-[#F0E4DF] flex items-center justify-center flex-shrink-0">
                  <span className="text-dark-gray font-bold text-sm">{getUserInitials()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-dark-gray font-medium text-sm truncate">{getUserDisplayName()}</div>
                  <div className="text-medium-gray text-xs">{getUserEmail()}</div>
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                href="/login"
                text="Login"
                fullWidth={true}
                onClick={() => setIsOpen(false)}
                textSize="responsive-sm"
              />
            )}
            
            {/* Get an Estimate Button */}
            <EstimateButton
              priority="primary"
              href="/contact/get-estimate"
              fullWidth={true}
              onClick={() => setIsOpen(false)}
              size="sm"
            />
          </div>
          
          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-3">
              {/* Products Section */}
              <div>
                <button
                  className="flex justify-between w-full px-3 py-2.5 text-base font-medium text-dark-gray hover:bg-gray-50 rounded"
                  onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                  aria-expanded={productsDropdownOpen}
                >
                  <span>Products</span>
                  <Image 
                    src="/assets/icons/ic-arrow-down.svg" 
                    alt="Dropdown" 
                    width={16} 
                    height={16} 
                    className={`transform transition-transform duration-200 ${productsDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {/* Products Menu Items with height transition */}
                <div 
                  className="overflow-hidden transition-all duration-200 ease-in-out pb-0"
                  style={{ 
                    maxHeight: productsDropdownOpen ? `${(productCategories.length * 36) + 16}px` : '0',
                    opacity: productsDropdownOpen ? 1 : 0,
                    marginBottom: productsDropdownOpen ? '0.75rem' : '0'
                  }}
                >
                  <div className="pl-4 space-y-1 mt-1">
                    {productCategories.map((category, index) => (
                      <Link 
                        key={index}
                        href={category.href}
                        className="block px-3 py-2 text-sm font-normal text-dark-gray hover:bg-gray-50 rounded"
                        onClick={() => setIsOpen(false)}
                      >
                        {category.text}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Projects Link */}
              <div>
                <Link 
                  href="/projects" 
                  className="block px-3 py-2.5 text-base font-medium text-dark-gray hover:bg-gray-50 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  Projects
                </Link>
              </div>
              
              {/* About Link */}
              <div>
                <Link 
                  href="/about" 
                  className="block px-3 py-2.5 text-base font-medium text-dark-gray hover:bg-gray-50 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
              </div>
              
              {/* Contact Section */}
              <div>
                <button
                  className="flex justify-between w-full px-3 py-2.5 text-base font-medium text-dark-gray hover:bg-gray-50 rounded"
                  onClick={() => setContactDropdownOpen(!contactDropdownOpen)}
                  aria-expanded={contactDropdownOpen}
                >
                  <span>Contact</span>
                  <Image 
                    src="/assets/icons/ic-arrow-down.svg" 
                    alt="Dropdown" 
                    width={16} 
                    height={16} 
                    className={`transform transition-transform duration-200 ${contactDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {/* Contact Menu Items with height transition */}
                <div 
                  className="overflow-hidden transition-all duration-200 ease-in-out pb-0"
                  style={{ 
                    maxHeight: contactDropdownOpen ? `${(contactOptions.length * 36) + 24}px` : '0',
                    opacity: contactDropdownOpen ? 1 : 0,
                    marginBottom: contactDropdownOpen ? '0.75rem' : '0'
                  }}
                >
                  <div className="pl-4 space-y-1 mt-1">
                    {contactOptions.map((option, index) => (
                      <Link 
                        key={index}
                        href={option.href}
                        className="block px-3 py-2 text-sm font-normal text-dark-gray hover:bg-gray-50 rounded"
                        onClick={() => setIsOpen(false)}
                      >
                        {option.text}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </nav>
            
            {/* User Account Options - Only when logged in */}
            {userLoggedIn && (
              <div className="mt-6 pt-6 border-t border-[#F6F6F6]">
                <div className="px-3 pb-2 text-xs font-medium uppercase text-medium-gray">
                  Account
                </div>
                <div className="space-y-1">
                  <Link 
                    href="/profile" 
                    className="flex items-center px-3 py-2.5 text-sm text-dark-gray hover:bg-gray-50 rounded"
                    onClick={() => setIsOpen(false)}
                  >
                    <Image 
                      src="/assets/icons/user.svg" 
                      alt="User profile icon" 
                      width={18} 
                      height={18} 
                      className="mr-3" 
                    />
                    My Profile
                  </Link>
                  
                  <Link 
                    href="/projects" 
                    className="flex items-center px-3 py-2.5 text-sm text-dark-gray hover:bg-gray-50 rounded"
                    onClick={() => setIsOpen(false)}
                  >
                    <Image 
                      src="/assets/icons/folder.svg" 
                      alt="Projects folder icon" 
                      width={18} 
                      height={18} 
                      className="mr-3" 
                    />
                    My Projects
                  </Link>
                  
                  <Link 
                    href="/settings" 
                    className="flex items-center px-3 py-2.5 text-sm text-dark-gray hover:bg-gray-50 rounded"
                    onClick={() => setIsOpen(false)}
                  >
                    <Image 
                      src="/assets/icons/settings.svg" 
                      alt="Account settings icon" 
                      width={18} 
                      height={18} 
                      className="mr-3" 
                    />
                    Account Settings
                  </Link>
                  
                  {hasAdminAccess && (
                    <Link 
                      href="/admin" 
                      className="flex items-center px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded font-medium border-l-2 border-blue-500 bg-blue-50"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="mr-3 text-lg">🛡️</span>
                      Admin Panel
                    </Link>
                  )}
                  
                  <button
                    className="flex items-center w-full px-3 py-2.5 text-sm text-dark-gray hover:bg-gray-50 rounded"
                    onClick={handleSignOut}
                  >
                    <Image 
                      src="/assets/icons/log-out.svg" 
                      alt="Sign out icon" 
                      width={18} 
                      height={18} 
                      className="mr-3" 
                    />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}