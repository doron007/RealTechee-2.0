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
} from '../../../utils/componentUtils';

// Define HeaderProps interface directly in the file
interface HeaderProps {
  className?: string;
  transparent?: boolean;
  dark?: boolean;
}

export default function Header(props: HeaderProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState<boolean>(false);
  const [contactDropdownOpen, setContactDropdownOpen] = useState<boolean>(false);

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
    <header className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white'}`}>
      {/* Full width container without max-width constraint */}
      <div className="w-full">
        {/* 6-column layout using grid */}
        <div className="grid grid-cols-[6vw_max-content_max-content_auto_max-content_6vw] items-center h-[80px]">
          {/* Column 1: Left margin (6vw) - empty */}
          <div></div>
          
          {/* Column 2: Logo (max-content) */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="border border-very-light-gray p-1 rounded">
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
          
          {/* Column 3: Menu bar (max-content) */}
          <div className="hidden md:flex items-center ml-4 lg:ml-8 space-x-4 lg:space-x-8">
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
                <div className="absolute left-0 w-64 bg-white shadow-lg rounded-md overflow-hidden z-50 border border-very-light-gray" style={{ top: "calc(100%)" }}>
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
                <div className="absolute left-0 w-64 bg-white shadow-lg rounded-md overflow-hidden z-50 border border-very-light-gray" style={{ top: "calc(100%)" }}>
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
          
          {/* Column 4: Login (auto) */}
          <div className="hidden md:flex items-center justify-end">
            <Link 
              href="/login" 
              className="px-2 lg:px-3 py-2 font-medium text-sm lg:text-base text-dark-gray hover:text-black transition-colors underline"
            >
              Login
            </Link>
          </div>
          
          {/* Column 5: Get Estimate button (max-content) */}
          <div className="hidden md:flex items-center">
            <PrimaryActionButton href="/get-estimate" text="Get Estimate" />
          </div>
          
          {/* Column 6: Right margin (6vw) - used for mobile menu button on small screens */}
          <div className="flex justify-end">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-medium-gray hover:text-black hover:bg-off-white focus:outline-none"
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
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white">
          <div className="px-[6vw] pt-2 pb-3 space-y-1 border-t border-very-light-gray">
            {/* Products Section */}
            <div>
              <button
                className="flex justify-between w-full px-3 py-2 rounded-md text-base font-medium text-dark-gray hover:bg-off-white"
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
              className="block px-3 py-2 rounded-md text-base font-medium text-dark-gray hover:bg-off-white"
              onClick={() => setIsOpen(false)}
            >
              Projects
            </Link>
            
            <Link 
              href="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium text-dark-gray hover:bg-off-white"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            
            {/* Contact Section */}
            <div>
              <button
                className="flex justify-between w-full px-3 py-2 rounded-md text-base font-medium text-dark-gray hover:bg-off-white"
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
              className="block px-3 py-2 rounded-md text-base font-medium text-dark-gray hover:bg-off-white underline"
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