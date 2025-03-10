import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/">
          <Image 
            src="/logo/realtechee_horizontal_no_border.png" 
            alt="RealTechee Logo" 
            width={180} 
            height={45} 
            priority 
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex space-x-8 items-center">
          <Link href="#stats" className="text-gray-800 hover:text-gray-900 font-medium">Our Services</Link>
          <Link href="#video" className="text-gray-800 hover:text-gray-900 font-medium">How It Works</Link>
          <Link href="#portfolio" className="text-gray-800 hover:text-gray-900 font-medium">Portfolio</Link>
          <Link href="#contact" className="text-gray-800 hover:text-gray-900 font-medium">Contact</Link>
          <button 
            className="px-5 py-2 rounded-lg font-semibold"
            style={{
              backgroundColor: "var(--accent-color)",
              color: "white"
            }}
          >
            Get Started
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          className="md:hidden text-gray-700 hover:text-gray-900"
          aria-label="Toggle menu"
        >
          {/* Icon: three horizontal bars */}
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <ul className="flex flex-col py-3">
            <li><Link href="#stats" className="block px-6 py-3 text-gray-800 font-medium">Our Services</Link></li>
            <li><Link href="#video" className="block px-6 py-3 text-gray-800 font-medium">How It Works</Link></li>
            <li><Link href="#portfolio" className="block px-6 py-3 text-gray-800 font-medium">Portfolio</Link></li>
            <li><Link href="#contact" className="block px-6 py-3 text-gray-800 font-medium">Contact</Link></li>
            <li className="px-6 py-3">
              <button 
                className="w-full px-5 py-2 rounded-lg font-semibold"
                style={{
                  backgroundColor: "var(--accent-color)",
                  color: "white"
                }}
              >
                Get Started
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}