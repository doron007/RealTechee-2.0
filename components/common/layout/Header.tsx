import { useState, useEffect } from 'react';
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
      <div className="w-full h-[80px] flex items-center px-6 lg:px-10 xl:px-[60px] 2xl:px-[120px] py-[32px]">
        {/* Logo - reduced size */}
        <div className="flex-shrink-0 h-[45px] flex items-center">
          <Link href="/" className="flex items-center h-full">
            <div className="border border-very-light-gray p-1 rounded h-full flex items-center">
              <Image
                src="/logo/realtechee_horizontal_no_border.png"
                alt="RealTechee Logo"
                width={160}
                height={28}
                className="h-[35px] w-auto"
                priority
              />
            </div>
          </Link>
        </div>
        
        {/* Menu bar - adjusted for responsiveness */}
        <div className="hidden xl:flex items-center ml-[30px] 2xl:ml-[50px] w-auto xl:w-[377px] h-[26px] gap-[20px] xl:gap-[30px] 2xl:gap-[38px] rounded-[30px]">
          {/* Products Dropdown */}
          <div 
            className="relative group"
            onMouseEnter={() => setProductsDropdownOpen(true)}
            onMouseLeave={() => setProductsDropdownOpen(false)}
          >
            <button 
              className="text-zinc-800 text-[14px] xl:text-[15px] 2xl:text-base font-body font-normal leading-relaxed flex items-center whitespace-nowrap"
              onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
            >
              Products
              <Image 
                src="/icons/chevron-down.svg" 
                alt="Dropdown" 
                width={16} 
                height={16} 
                className={`ml-1 transform ${productsDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
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
            <Link href="/projects" className="text-zinc-800 text-[14px] xl:text-[15px] 2xl:text-base font-body font-normal leading-relaxed whitespace-nowrap">
              Projects
            </Link>
          </div>

          {/* About */}
          <div className="relative group">
            <Link href="/about" className="text-zinc-800 text-[14px] xl:text-[15px] 2xl:text-base font-body font-normal leading-relaxed whitespace-nowrap">
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
              className="text-zinc-800 text-[14px] xl:text-[15px] 2xl:text-base font-body font-normal leading-relaxed flex items-center whitespace-nowrap"
              onClick={() => setContactDropdownOpen(!contactDropdownOpen)}
            >
              Contact
              <Image 
                src="/icons/chevron-down.svg" 
                alt="Dropdown" 
                width={16} 
                height={16} 
                className={`ml-1 transform ${contactDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
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
        
        {/* Spacer to push action buttons to the right */}
        <div className="flex-grow"></div>
        
        {/* Action Buttons Container */}
        <div className="hidden xl:flex items-center gap-3 2xl:gap-4">
          {/* Login Button */}
          <Link 
            href="/login" 
            className="h-[45px] 2xl:h-[51px] py-[12px] 2xl:py-[16px] px-[18px] 2xl:px-[24px] rounded-[4px] text-zinc-800 text-[14px] xl:text-[15px] 2xl:text-base font-body font-normal leading-relaxed flex items-center justify-center whitespace-nowrap"
          >
            Login
          </Link>
          
          {/* Get an Estimate Button */}
          <Link 
            href="/get-estimate" 
            className="h-[45px] 2xl:h-[51px] py-[12px] 2xl:py-[16px] px-[18px] 2xl:px-[24px] rounded-[4px] bg-black text-white flex items-center justify-center whitespace-nowrap"
          >
            <Image 
              src="/icons/arrow-right.svg" 
              alt="Arrow Right" 
              width={18} 
              height={18} 
              className="mr-2 2xl:mr-3 invert" 
            />
            <span className="text-white text-[14px] xl:text-[15px] 2xl:text-base font-body font-normal leading-relaxed">Get an Estimate</span>
          </Link>
        </div>
        
        {/* Mobile Menu Button - now shows below 1200px (xl breakpoint) */}
        <div className="xl:hidden ml-auto">
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
      
      {/* Mobile Menu - now applies below 1200px (xl breakpoint) */}
      {isOpen && (
        <div className="xl:hidden bg-white">
          <div className="px-[6vw] pt-2 pb-3 space-y-1 border-t border-very-light-gray">
            {/* Products Section */}
            <div>
              <button
                className="flex justify-between w-full px-3 py-2 rounded-md text-base font-body font-normal text-dark-gray hover:bg-off-white"
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
              className="block px-3 py-2 rounded-md text-base font-body font-normal text-dark-gray hover:bg-off-white"
              onClick={() => setIsOpen(false)}
            >
              Projects
            </Link>
            
            <Link 
              href="/about" 
              className="block px-3 py-2 rounded-md text-base font-body font-normal text-dark-gray hover:bg-off-white"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
            
            {/* Contact Section */}
            <div>
              <button
                className="flex justify-between w-full px-3 py-2 rounded-md text-base font-body font-normal text-dark-gray hover:bg-off-white"
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
              className="block px-3 py-2 rounded-md text-base font-body font-normal text-dark-gray hover:bg-off-white"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            
            <div className="mt-3">
              <Link 
                href="/get-estimate" 
                className="flex items-center justify-center w-full px-4 py-2 bg-black text-white rounded-md"
                onClick={() => setIsOpen(false)}
              >
                <Image 
                  src="/icons/arrow-right.svg" 
                  alt="Arrow Right" 
                  width={16} 
                  height={16} 
                  className="mr-2 h-4 w-4 invert" 
                />
                <span className="text-white text-base font-body font-normal">Get an Estimate</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}