import type { NextPage } from 'next';
import SEOHead from '../../components/seo/SEOHead';
import H1 from '../../components/typography/H1';
import H2 from '../../components/typography/H2';
import P1 from '../../components/typography/P1';
import P2 from '../../components/typography/P2';
import Button from '../../components/common/buttons/Button';
import Card from '../../components/common/ui/Card';
import Link from 'next/link';

const ProductsPage: NextPage = () => {
  const products = [
    {
      title: "For Sellers",
      description: "Maximize your property value with our comprehensive home preparation services. Professional staging, renovation guidance, and market positioning.",
      href: "/products/sellers",
      iconSvg: "/assets/icons/ic-sellers.svg"
    },
    {
      title: "For Buyers",
      description: "Find your dream home and make smart investment decisions with our buyer support services and property analysis tools.",
      href: "/products/buyers",
      iconSvg: "/assets/icons/ic-buyers.svg"
    },
    {
      title: "Kitchen & Bath Showroom",
      description: "Transform your space with our premium kitchen and bathroom design services. Professional consultation and installation.",
      href: "/products/kitchen-and-bath",
      iconSvg: "/assets/icons/ic-kitchen-bath.svg"
    },
    {
      title: "Commercial Program",
      description: "Comprehensive commercial real estate services for businesses, investors, and property managers.",
      href: "/products/commercial",
      iconSvg: "/assets/icons/ic-commercial.svg"
    },
    {
      title: "Architects & Designers",
      description: "Professional partnerships for architects and designers. Collaborate on projects and expand your service offerings.",
      href: "/products/architects-and-designers",
      iconSvg: "/assets/icons/ic-architects.svg"
    }
  ];

  return (
    <>
      <SEOHead 
        pageKey="products"
        customTitle="Products & Services - RealTechee"
        customDescription="Explore RealTechee's comprehensive real estate technology solutions for sellers, buyers, professionals, and commercial clients."
      />
      <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <H1>Our Products & Services</H1>
            <P1 className="mt-6 text-gray-600 max-w-3xl mx-auto">
              Discover our comprehensive suite of real estate technology solutions designed 
              to supercharge success for sellers, buyers, agents, and industry professionals.
            </P1>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {products.map((product, index) => (
              <Link key={index} href={product.href} className="block">
                <Card 
                  title={product.title}
                  content={product.description}
                  className="h-full hover:shadow-lg transition-shadow duration-200"
                  hasHoverEffect={true}
                  footer={
                    <Button
                      variant="secondary"
                      text="Learn More"
                      size="sm"
                    />
                  }
                />
              </Link>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <H2>Ready to Get Started?</H2>
            <P2 className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Choose the service that best fits your needs, or contact our team 
              to discuss a custom solution tailored to your specific requirements.
            </P2>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                text="Get an Estimate"
                href="/contact/get-estimate"
              />
              <Button
                variant="secondary"
                text="Contact Us"
                href="/contact"
              />
            </div>
          </div>
      </div>
    </>
  );
};

export default ProductsPage;