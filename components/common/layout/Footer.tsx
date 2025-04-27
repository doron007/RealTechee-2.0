import Image from 'next/image';
import Link from 'next/link';

// Define FooterProps interface directly in the file
interface FooterProps {
  // Add any props you need here
  className?: string;
}

export default function Footer(props: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white py-12 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1">
            <Link href="/">
              <Image
                src="/logo/realtechee_horizontal_no_border.png"
                alt="RealTechee Logo"
                width={180}
                height={38}
                priority
              />
            </Link>
            <p className="mt-4 text-gray-600 text-sm">
              Supercharge your agents' success with a proven real estate home preparation platform. Attract the right customers, dominate the market, and achieve outstanding results effortlessly.
            </p>
            <Link 
              href="/contact" 
              className="mt-4 inline-block px-6 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors text-sm"
            >
              Contact Us
            </Link>
          </div>
          
          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Products */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/for-sellers" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  For Sellers
                </Link>
              </li>
              <li>
                <Link href="/for-buyers" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  For Buyers
                </Link>
              </li>
              <li>
                <Link href="/kitchen-bath-showroom" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  Kitchen & Bath Showroom
                </Link>
              </li>
              <li>
                <Link href="/commercial-program" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  Commercial Program
                </Link>
              </li>
              <li>
                <Link href="/architect-designer" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  Architect & Designer
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/general-inquiry" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  General Inquiry
                </Link>
              </li>
              <li>
                <Link href="/get-estimate" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  Get Estimate
                </Link>
              </li>
              <li>
                <Link href="/get-qualified" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  Get Qualified
                </Link>
              </li>
              <li>
                <Link href="/become-affiliate" className="text-gray-600 hover:text-[#FF5F45] transition-colors">
                  Become an Affiliate
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            &copy; {currentYear} RealTechee
          </p>
        </div>
      </div>
    </footer>
  );
}