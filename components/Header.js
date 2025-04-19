import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  NavLink, 
  DropdownButton, 
  DropdownLink, 
  MobileDropdownLink, 
  PrimaryActionButton,
  productCategories,
  contactOptions
} from '../utils/componentUtils';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[80px]">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="border border-gray-200 p-1 rounded">
                <Image
                  src="/logo/realtechee_horizontal_no_border.png"
                  alt="RealTechee Logo"
                  width={160}
                  height={32}
                  className="w-[120px] h-auto sm:w-[140px] md:w-[160px] lg:w-[180px]"
                  priority
                />
              </div>
            </Link>
          </div>
          
          {/* Main Navigation (Left Side) */}
          <div className="hidden md:flex flex-1 items-center justify-start ml-4 lg:ml-8 space-x-4 lg:space-x-8">
            {/* Products Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <DropdownButton 
                text="Products" 
                isOpen={productsDropdownOpen} 
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)} 
              />
              
              {/* Products Dropdown Menu */}
              {productsDropdownOpen && (
                <div className="absolute left-0 w-64 bg-white shadow-lg rounded-md overflow-hidden z-50 border border-gray-200" style={{ top: "calc(100%)" }}>
                  <div className="py-2">
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
              )}
            </div>

            {/* Projects */}
            <div className="relative group">
              <NavLink href="/projects" text="Projects" />
            </div>

            {/* About */}
            <div className="relative group">
              <NavLink href="/about" text="About" />
            </div>

            {/* Contact Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setContactDropdownOpen(true)}
              onMouseLeave={() => setContactDropdownOpen(false)}
            >
              <DropdownButton 
                text="Contact" 
                isOpen={contactDropdownOpen} 
                onClick={() => setContactDropdownOpen(!contactDropdownOpen)} 
              />
              
              {/* Contact Dropdown Menu */}
              {contactDropdownOpen && (
                <div className="absolute left-0 w-64 bg-white shadow-lg rounded-md overflow-hidden z-50 border border-gray-200" style={{ top: "calc(100%)" }}>
                  <div className="py-2">
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
              )}
            </div>
          </div>
          
          {/* Right Side Navigation (Login and Get Estimate) */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <Link 
              href="/login" 
              className="px-2 lg:px-3 py-2 font-medium text-sm lg:text-base text-gray-900 hover:text-accent transition-colors underline"
            >
              Login
            </Link>
            
            <PrimaryActionButton href="/get-estimate" text="Get Estimate" />
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <Image src="/icons/close.svg" alt="Close Menu" width={24} height={24} />
              ) : (
                <Image src="/icons/menu.svg" alt="Open Menu" width={24} height={24} />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
            {/* Products Section */}
            <div>
              <button
                className="flex justify-between w-full px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              >
                Products
                <Image 
                  src="/icons/chevron-down.svg" 
                  alt="Dropdown" 
                  width={20} 
                  height={20} 
                  className={`transform ${productsDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {productsDropdownOpen && (
                <div className="pl-4 space-y-1 mt-1">
                  {productCategories.map((category, index) => (
                    <MobileDropdownLink 
                      key={index}
                      href={category.href} 
                      text={category.text}
                      onClick={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <Link 
              href="/projects" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Projects
            </Link>
            
            <Link 
              href="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            
            {/* Contact Section */}
            <div>
              <button
                className="flex justify-between w-full px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                onClick={() => setContactDropdownOpen(!contactDropdownOpen)}
              >
                Contact
                <Image 
                  src="/icons/chevron-down.svg" 
                  alt="Dropdown" 
                  width={20} 
                  height={20} 
                  className={`transform ${contactDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>
              
              {contactDropdownOpen && (
                <div className="pl-4 space-y-1 mt-1">
                  {contactOptions.map((option, index) => (
                    <MobileDropdownLink 
                      key={index}
                      href={option.href} 
                      text={option.text}
                      onClick={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <Link 
              href="/login" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100 underline"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            
            <div className="mt-3">
              <PrimaryActionButton href="/get-estimate" text="Get Estimate" mobile={true} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}