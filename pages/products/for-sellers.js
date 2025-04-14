import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

// Components
import Layout from '../../components/Layout';
import CTA from '../../components/CtaSection';

export default function ForSellers() {
  // Animation on scroll effect
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });

    return () => {
      animateElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <Layout 
      title="For Sellers - Zero Out-of-Pocket Renovations" 
      description="We offer your homeowner clients $0 out-of-pocket construction costs until the close of escrow, payment is made with the escrow proceeds."
    >
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-on-scroll">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                For Sellers: Zero Out-of-Pocket Renovations
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                We offer your homeowner clients $0 out-of-pocket construction costs until the close of escrow, payment is made with the escrow proceeds. Eliminating deal withdrawals and price concessions for sellers due to inspection findings.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/get-estimate"
                  className="btn btn-primary"
                >
                  Get Started
                </Link>
                <Link
                  href="/contact"
                  className="btn btn-outline"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
            <div className="animate-on-scroll">
              <Image 
                src="/images/seller-renovation.jpg" 
                alt="Seller renovation service" 
                width={600} 
                height={400}
                className="rounded-lg shadow-card"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Benefits for Sellers
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Our renovation services provide numerous advantages for sellers looking to maximize their property value.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-bg-light p-8 rounded-lg shadow-card hover:shadow-card-hover transition-shadow animate-on-scroll">
              <div className="flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-6 mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L19.5 9.5L17.5 11.5L14 8V22H10V8L6.5 11.5L4.5 9.5L12 2Z" fill="white"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Increased Property Value
              </h3>
              <p className="text-gray-700 text-center">
                Strategic renovations typically lead to a 15-25% increase in property value, far exceeding the renovation costs.
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="bg-bg-light p-8 rounded-lg shadow-card hover:shadow-card-hover transition-shadow animate-on-scroll">
              <div className="flex items-center justify-center w-16 h-16 bg-accent-teal rounded-full mb-6 mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Faster Time to Sale
              </h3>
              <p className="text-gray-700 text-center">
                Renovated properties sell 2x faster than non-renovated properties, reducing carrying costs and market exposure.
              </p>
            </div>
            
            {/* Benefit 3 */}
            <div className="bg-bg-light p-8 rounded-lg shadow-card hover:shadow-card-hover transition-shadow animate-on-scroll">
              <div className="flex items-center justify-center w-16 h-16 bg-accent-yellow rounded-full mb-6 mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                No Upfront Costs
              </h3>
              <p className="text-gray-700 text-center">
                $0 out-of-pocket expenses until closing, with payment coming directly from escrow proceeds, eliminating financial barriers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works for Sellers
            </h2>
          </div>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>
            
            {/* Step 1 */}
            <div className="relative mb-16 animate-on-scroll">
              <div className="flex items-center justify-center">
                <div className="absolute z-10 flex items-center justify-center w-12 h-12 bg-accent rounded-full">
                  <span className="text-white font-bold">1</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                <div className="bg-white p-6 rounded-lg shadow-card md:text-right order-2 md:order-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Property Assessment</h3>
                  <p className="text-gray-700">
                    Our experts evaluate your property to identify the most impactful renovation opportunities that will maximize value while minimizing costs.
                  </p>
                </div>
                <div className="flex justify-center items-center order-1 md:order-2">
                  <Image 
                    src="/images/property-assessment.jpg" 
                    alt="Property assessment" 
                    width={300} 
                    height={200}
                    className="rounded-lg shadow-card"
                  />
                </div>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative mb-16 animate-on-scroll">
              <div className="flex items-center justify-center">
                <div className="absolute z-10 flex items-center justify-center w-12 h-12 bg-accent rounded-full">
                  <span className="text-white font-bold">2</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                <div className="flex justify-center items-center">
                  <Image 
                    src="/images/renovation-plan.jpg" 
                    alt="Renovation plan" 
                    width={300} 
                    height={200}
                    className="rounded-lg shadow-card"
                  />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-card md:text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Custom Renovation Plan</h3>
                  <p className="text-gray-700">
                    We create a detailed renovation plan with transparent pricing and timeline, focusing on high-ROI improvements that appeal to buyers.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative animate-on-scroll">
              <div className="flex items-center justify-center">
                <div className="absolute z-10 flex items-center justify-center w-12 h-12 bg-accent rounded-full">
                  <span className="text-white font-bold">3</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                <div className="bg-white p-6 rounded-lg shadow-card md:text-right order-2 md:order-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Execution & Payment from Escrow</h3>
                  <p className="text-gray-700">
                    Our team handles the entire renovation process with zero upfront costs. Payment is made directly from escrow proceeds at closing.
                  </p>
                </div>
                <div className="flex justify-center items-center order-1 md:order-2">
                  <Image 
                    src="/images/renovation-execution.jpg" 
                    alt="Renovation execution" 
                    width={300} 
                    height={200}
                    className="rounded-lg shadow-card"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-bg-light p-8 rounded-lg shadow-card animate-on-scroll">
              <div className="flex items-start mb-6">
                <div className="mr-4">
                  <Image 
                    src="/testimonials/testimonial-1.jpg" 
                    alt="Client testimonial" 
                    width={60} 
                    height={60}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Sarah Johnson</h3>
                  <p className="text-sm text-gray-600">Homeowner, Los Angeles</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "Working with RealTechee transformed my home selling experience. With zero upfront costs, they renovated my kitchen and bathroom, which increased my property value by over $85,000. The home sold in just 5 days!"
              </p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-bg-light p-8 rounded-lg shadow-card animate-on-scroll">
              <div className="flex items-start mb-6">
                <div className="mr-4">
                  <Image 
                    src="/testimonials/testimonial-2.jpg" 
                    alt="Real estate agent testimonial" 
                    width={60} 
                    height={60}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Michael Rodriguez</h3>
                  <p className="text-sm text-gray-600">Real Estate Agent, Century 21</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                "RealTechee has been a game-changer for my business. Their zero upfront cost model makes it easy to convince sellers to make necessary upgrades. My clients are consistently amazed by the ROI, and I've closed deals 30% faster on average."
              </p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-bg-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-6 animate-on-scroll">
            {/* FAQ Item 1 */}
            <div className="bg-white p-6 rounded-lg shadow-card">
              <h3 className="text-xl font-bold text-gray-900 mb-3">How does the zero upfront cost model work?</h3>
              <p className="text-gray-700">
                Our zero upfront cost model allows homeowners to renovate their property without paying anything until escrow closes. The renovation costs are covered by us and then paid directly from the escrow proceeds during the sale, eliminating the need for homeowners to invest their own capital.
              </p>
            </div>
            
            {/* FAQ Item 2 */}
            <div className="bg-white p-6 rounded-lg shadow-card">
              <h3 className="text-xl font-bold text-gray-900 mb-3">What types of renovations provide the best ROI?</h3>
              <p className="text-gray-700">
                Based on our extensive experience, kitchen and bathroom renovations typically provide the highest ROI, often 1.5-2x the investment. Other high-ROI improvements include fresh paint, flooring updates, curb appeal enhancements, and modern lighting fixtures. Our experts will recommend the most strategic improvements for your specific property.
              </p>
            </div>
            
            {/* FAQ Item 3 */}
            <div className="bg-white p-6 rounded-lg shadow-card">
              <h3 className="text-xl font-bold text-gray-900 mb-3">What happens if the property doesn't sell?</h3>
              <p className="text-gray-700">
                In the rare event that a property doesn't sell, we offer flexible payment options. We can either convert the renovation cost into a low-interest loan or extend the payment timeline until the property sells. Our team works closely with real estate agents to ensure properties are priced appropriately and marketed effectively to maximize sale potential.
              </p>
            </div>
            
            {/* FAQ Item 4 */}
            <div className="bg-white p-6 rounded-lg shadow-card">
              <h3 className="text-xl font-bold text-gray-900 mb-3">How long does the renovation process take?</h3>
              <p className="text-gray-700">
                The timeline varies based on the scope of work, but most of our seller renovations are completed within 2-4 weeks. Our experienced contractors work efficiently to minimize disruption while maintaining high-quality standards. We provide a detailed timeline during the planning phase and keep clients updated throughout the process with real-time progress reports.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <CTA />
    </Layout>
  );
}