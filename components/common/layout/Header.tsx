import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  DropdownLink, 
  MobileDropdownLink, 
  productCategories,
  contactOptions
} from '../../../utils/componentUtils';

// Define HeaderProps interface directly in the file
interface HeaderProps {
  className?: string;
  transparent?: boolean;
  dark?: boolean;
  userLoggedIn?: boolean; // Added to handle logged-in state for mobile menu
}

export default function Header({ userLoggedIn = false, ...props }: HeaderProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState<boolean>(false);
  const [contactDropdownOpen, setContactDropdownOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const headerRef = useRef<HTMLDivElement>(null);

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
      <div className="w-full max-w-[1536px] mx-auto flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-[120px]">
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
        
        {/* Menu bar - desktop */}
        <div className="hidden lg:flex items-center ml-3 xl:ml-6 2xl:ml-8 gap-2 xl:gap-4 2xl:gap-[38px]">
          {/* Products Dropdown */}
          <div 
            className="relative group"
            onMouseEnter={() => setProductsDropdownOpen(true)}
            onMouseLeave={() => setProductsDropdownOpen(false)}
          >
            <button 
              className="text-dark-gray text-responsive-sm lg:text-responsive-base 2xl:text-base font-body font-normal leading-relaxed flex items-center whitespace-nowrap gap-1 py-2 px-1 hover:text-accent transition-colors"
              onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              aria-expanded={productsDropdownOpen}
            >
              Products
              <Image 
                src="/assets/icons/chevron-down.svg" 
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
            <Link href="/projects" className="text-dark-gray text-responsive-sm lg:text-responsive-base 2xl:text-base font-body font-normal leading-relaxed whitespace-nowrap py-2 px-1 hover:text-accent transition-colors">
              Projects
            </Link>
          </div>

          {/* About */}
          <div className="relative group">
            <Link href="/about" className="text-dark-gray text-responsive-sm lg:text-responsive-base 2xl:text-base font-body font-normal leading-relaxed whitespace-nowrap py-2 px-1 hover:text-accent transition-colors">
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
              className="text-dark-gray text-responsive-sm lg:text-responsive-base 2xl:text-base font-body font-normal leading-relaxed flex items-center whitespace-nowrap gap-1 py-2 px-1 hover:text-accent transition-colors"
              onClick={() => setContactDropdownOpen(!contactDropdownOpen)}
              aria-expanded={contactDropdownOpen}
            >
              Contact
              <Image 
                src="/assets/icons/chevron-down.svg" 
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
        
        {/* Action Buttons Container */}
        <div className="hidden lg:flex items-center gap-1.5 xl:gap-2">
          {/* Login/Profile Button */}
          {userLoggedIn ? (
            <div 
              className="relative"
              onMouseEnter={() => setProfileDropdownOpen(true)}
              onMouseLeave={() => setProfileDropdownOpen(false)}
            >
              <button
                className="flex items-center gap-2 py-2 lg:py-2.5 xl:py-3 px-3 lg:px-4 text-dark-gray hover:text-accent text-responsive-sm lg:text-responsive-base font-heading font-extrabold leading-tight whitespace-nowrap transition-colors"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
              >
                <div className="w-8 h-8 rounded-full bg-[#F0E4DF] flex items-center justify-center">
                  <span className="text-dark-gray font-bold text-sm">JD</span>
                </div>
                <span>My Account</span>
                <Image 
                  src="/assets/icons/chevron-down.svg" 
                  alt="Dropdown" 
                  width={14} 
                  height={14} 
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
                  <DropdownLink 
                    href="/logout" 
                    text="Sign Out"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="py-2 lg:py-2.5 xl:py-3 2xl:py-4 px-3 lg:px-4 xl:px-5 2xl:px-6 text-dark-gray hover:text-accent text-responsive-sm lg:text-responsive-base 2xl:text-base font-heading font-extrabold leading-tight flex items-center justify-center whitespace-nowrap transition-colors"
            >
              Login
            </Link>
          )}
          
          {/* Get an Estimate Button */}
          <Link 
            href="/get-estimate" 
            className="py-2 lg:py-2.5 xl:py-3 2xl:py-4 px-3 lg:px-4 xl:px-5 2xl:px-6 rounded-[4px] bg-black hover:bg-zinc-800 text-white flex items-center justify-center whitespace-nowrap gap-1.5 lg:gap-2 xl:gap-3 2xl:gap-4 transition-colors"
          >
            <Image 
              src="/assets/icons/arrow-right.svg" 
              alt="Arrow Right" 
              width={16}
              height={16}
              className="invert w-[14px] h-[14px] lg:w-[16px] lg:h-[16px] xl:w-[18px] xl:h-[18px]" 
            />
            <span className="text-white text-responsive-sm lg:text-responsive-base 2xl:text-base font-heading font-extrabold leading-tight">Get an Estimate</span>
          </Link>
        </div>
        
        {/* Mobile Menu Button - Enhanced for better accessibility and touch target */}
        <div className="lg:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2.5 rounded-md text-medium-gray hover:text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent transition-all"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
            {isOpen ? (
              <Image src="/assets/icons/close.svg" alt="Close Menu" width={24} height={24} />
            ) : (
              <Image src="/assets/icons/menu.svg" alt="Open Menu" width={24} height={24} />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu - Improved with better transitions and styling from Figma */}
      <div 
        className={`lg:hidden bg-white fixed inset-0 z-40 transition-all duration-300 ease-in-out transform ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[-5%] opacity-0 pointer-events-none'
        }`}
        style={{ 
          top: scrolled ? '52px' : '59px', 
          height: scrolled ? 'calc(100vh - 52px)' : 'calc(100vh - 59px)'
        }}
        aria-hidden={!isOpen}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          {/* User info section - shown only when logged in */}
          {userLoggedIn && (
            <div className="px-4 sm:px-6 py-4 border-b border-[#F6F6F6] bg-[#FAFAFA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F0E4DF] rounded-full flex items-center justify-center">
                  <span className="text-dark-gray font-bold">JD</span>
                </div>
                <div className="flex-1">
                  <div className="text-dark-gray font-bold">John Doe</div>
                  <div className="text-medium-gray text-sm">john.doe@example.com</div>
                </div>
                <Link 
                  href="/profile"
                  className="text-accent text-sm font-medium hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  View Profile
                </Link>
              </div>
            </div>
          )}
          
          {/* Navigation Menu - Styled according to Figma mobile design */}
          <div className="px-4 py-2 flex-1">
            {/* Products Section */}
            <div className="py-1.5">
              <button
                className="flex justify-between w-full px-3 py-3 text-base font-body font-medium text-dark-gray active:bg-gray-50 rounded"
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                aria-expanded={productsDropdownOpen}
              >
                <span>Products</span>
                <Image 
                  src="/assets/icons/chevron-down.svg" 
                  alt="Dropdown" 
                  width={20} 
                  height={20} 
                  className={`transform transition-transform duration-200 ${productsDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {/* Products Menu Items with height transition */}
              <div 
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ 
                  maxHeight: productsDropdownOpen ? `${productCategories.length * 44}px` : '0',
                  opacity: productsDropdownOpen ? 1 : 0
                }}
              >
                <div className="pl-4 space-y-1 mt-1 mb-2">
                  {productCategories.map((category, index) => (
                    <MobileDropdownLink 
                      key={index}
                      href={category.href} 
                      text={category.text}
                      onClick={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              </div>
              <div className="h-px bg-[#F6F6F6] my-1"></div>
            </div>
            
            <div className="py-1.5">
              <Link 
                href="/projects" 
                className="block px-3 py-3 text-base font-body font-medium text-dark-gray active:bg-gray-50 rounded"
                onClick={() => setIsOpen(false)}
              >
                Projects
              </Link>
              <div className="h-px bg-[#F6F6F6] my-1"></div>
            </div>
            
            <div className="py-1.5">
              <Link 
                href="/about" 
                className="block px-3 py-3 text-base font-body font-medium text-dark-gray active:bg-gray-50 rounded"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <div className="h-px bg-[#F6F6F6] my-1"></div>
            </div>
            
            {/* Contact Section */}
            <div className="py-1.5">
              <button
                className="flex justify-between w-full px-3 py-3 text-base font-body font-medium text-dark-gray active:bg-gray-50 rounded"
                onClick={() => setContactDropdownOpen(!contactDropdownOpen)}
                aria-expanded={contactDropdownOpen}
              >
                <span>Contact</span>
                <Image 
                  src="/assets/icons/chevron-down.svg" 
                  alt="Dropdown" 
                  width={20} 
                  height={20} 
                  className={`transform transition-transform duration-200 ${contactDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {/* Contact Menu Items with height transition */}
              <div 
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ 
                  maxHeight: contactDropdownOpen ? `${contactOptions.length * 44}px` : '0',
                  opacity: contactDropdownOpen ? 1 : 0
                }}
              >
                <div className="pl-4 space-y-1 mt-1 mb-2">
                  {contactOptions.map((option, index) => (
                    <MobileDropdownLink 
                      key={index}
                      href={option.href} 
                      text={option.text}
                      onClick={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              </div>
              <div className="h-px bg-[#F6F6F6] my-1"></div>
            </div>
            
            {/* Login - Only shown when not logged in */}
            {!userLoggedIn && (
              <div className="py-1.5">
                <Link 
                  href="/login" 
                  className="block px-3 py-3 text-base font-body font-medium text-dark-gray active:bg-gray-50 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <div className="h-px bg-[#F6F6F6] my-1"></div>
              </div>
            )}
            
            {/* Account Options - Only visible when logged in */}
            {userLoggedIn && (
              <div className="mt-4 mb-2">
                <div className="px-3 py-2 text-xs font-medium text-medium-gray">
                  ACCOUNT
                </div>
                <div className="space-y-1">
                  <Link 
                    href="/projects" 
                    className="flex items-center px-3 py-2.5 text-base text-dark-gray active:bg-gray-50 rounded"
                    onClick={() => setIsOpen(false)}
                  >
                    <Image 
                      src="/assets/icons/folder.svg" 
                      alt="" 
                      width={20} 
                      height={20} 
                      className="mr-3" 
                    />
                    My Projects
                  </Link>
                  
                  <Link 
                    href="/settings" 
                    className="flex items-center px-3 py-2.5 text-base text-dark-gray active:bg-gray-50 rounded"
                    onClick={() => setIsOpen(false)}
                  >
                    <Image 
                      src="/assets/icons/settings.svg" 
                      alt="" 
                      width={20} 
                      height={20} 
                      className="mr-3" 
                    />
                    Account Settings
                  </Link>
                  
                  <Link 
                    href="/logout" 
                    className="flex items-center px-3 py-2.5 text-base text-dark-gray active:bg-gray-50 rounded"
                    onClick={() => setIsOpen(false)}
                  >
                    <Image 
                      src="/assets/icons/log-out.svg" 
                      alt="" 
                      width={20} 
                      height={20} 
                      className="mr-3" 
                    />
                    Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom CTA Section */}
          <div className="px-4 pt-3 pb-6 border-t border-[#F6F6F6] bg-[#FCFCFC] mt-auto">
            <Link 
              href="/get-estimate" 
              className="flex items-center justify-center w-full px-6 py-3.5 bg-black hover:bg-zinc-800 text-white rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Image 
                src="/assets/icons/arrow-right.svg" 
                alt="Arrow Right" 
                width={16} 
                height={16} 
                className="mr-2 invert" 
              />
              <span className="text-white text-base font-heading font-extrabold">Get an Estimate</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}