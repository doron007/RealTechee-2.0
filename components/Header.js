import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo/realtechee_horizontal_no_border.png"
                alt="RealTechee Logo"
                width={180}
                height={38}
                priority
              />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="relative group">
              <Link 
                href="/products" 
                className="font-medium text-gray-900 hover:text-[#FF5F45] transition-colors"
              >
                Products
              </Link>
            </div>

            <div className="relative group">
              <Link 
                href="/projects" 
                className="font-medium text-gray-900 hover:text-[#FF5F45] transition-colors"
              >
                Projects
              </Link>
            </div>

            <div className="relative group">
              <Link 
                href="/about" 
                className="font-medium text-gray-900 hover:text-[#FF5F45] transition-colors"
              >
                About
              </Link>
            </div>

            <div className="relative group">
              <Link 
                href="/contact" 
                className="font-medium text-gray-900 hover:text-[#FF5F45] transition-colors"
              >
                Contact
              </Link>
            </div>

            <div className="ml-4 flex items-center space-x-3">
              <Link 
                href="/login" 
                className="px-3 py-2 font-medium text-gray-900 hover:text-[#FF5F45] transition-colors"
              >
                Login
              </Link>
              
              <Link 
                href="/get-estimate" 
                className="px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors flex items-center"
              >
                <span>Get Estimate</span>
                <svg 
                  className="ml-2 h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3" 
                  />
                </svg>
              </Link>
            </div>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
            <Link 
              href="/products" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Products
            </Link>
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
            <Link 
              href="/contact" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link 
              href="/login" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            <Link 
              href="/get-estimate" 
              className="block w-full text-center px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Get Estimate
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}