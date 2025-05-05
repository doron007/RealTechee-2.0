import React from 'react';
import Head from 'next/head';
import Header from '../components/common/layout/Header';
import Footer from '../components/common/layout/Footer';
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5, 
  Heading6,
  SectionLabel,
  SubtitlePill,
  BodyText,
  BodyTextSecondary,
  CardTitle,
  CardSubtitle,
  CardText
} from '../components/Typography';
import Button from '../components/common/buttons/Button';
import { ButtonShowcase, CardShowcase, GetAnEstimateShowcase } from '../components/style-guide';
import ResponsiveTypographyShowcase from '../components/style-guide/ResponsiveTypographyShowcase';

export default function StyleGuidePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Brand Guidelines - RealTechee</title>
        <meta name="description" content="RealTechee brand guidelines and style guide" />
      </Head>
      
      <Header />
      
      {/* Added pt-24 sm:pt-28 md:pt-32 lg:pt-36 for proper spacing below the fixed header */}
      <main className="flex-grow pt-24 sm:pt-28 md:pt-32 lg:pt-36">
        <div className="container mx-auto px-4 py-16">
          <Heading1 className="mb-12 text-center">RealTechee 2.0 Style Guide</Heading1>
          
          {/* Responsive Typography Section */}
          <section className="mb-16">
            <Heading2 className="mb-6 pb-2 border-b">Responsive Typography System</Heading2>
            <ResponsiveTypographyShowcase />
          </section>
          
          {/* Typography Section */}
          <section className="mb-16">
            <Heading2 className="mb-6 pb-2 border-b">Typography</Heading2>
            
            <div className="mb-10">
              <SectionLabel className="mb-2">Section Labels</SectionLabel>
              <div className="p-4 bg-gray-50 rounded">
                <SectionLabel>FEATURES</SectionLabel>
                <SectionLabel>TESTIMONIALS</SectionLabel>
                <SectionLabel>SERVICES</SectionLabel>
              </div>
              <p className="text-sm mt-2 text-gray-500">Used above section titles, uppercase, coral color</p>
            </div>
            
            <div className="mb-10">
              <Heading3 className="mb-2">Subtitle Pills</Heading3>
              <div className="p-4 bg-gray-50 rounded">
                <SubtitlePill>Meet RealTechee, Your Home Preparation Partner</SubtitlePill>
              </div>
              <p className="text-sm mt-2 text-gray-500">Used for highlighting short phrases, soft peach background with coral text</p>
            </div>
            
            <div className="mb-10">
              <Heading3 className="mb-2">Headings</Heading3>
              <div className="space-y-6 p-4 bg-gray-50 rounded">
                <Heading1>Heading 1 (48px)</Heading1>
                <Heading2>Heading 2 (39px)</Heading2>
                <Heading3>Heading 3 (31px)</Heading3>
                <Heading4>Heading 4 (25px)</Heading4>
                <Heading5>Heading 5 (20px)</Heading5>
                <Heading6>Heading 6 (16px)</Heading6>
              </div>
              <p className="text-sm mt-2 text-gray-500">Nunito Sans, ExtraBold (800) for H1-H2, Bold (700) for H3-H6</p>
            </div>
            
            <div className="mb-10">
              <Heading3 className="mb-2">Body Text</Heading3>
              <div className="space-y-6 p-4 bg-gray-50 rounded">
                <BodyText>
                  Primary body text using Roboto Regular at 16px with 1.6em line height. 
                  This is used for most paragraph content throughout the site.
                </BodyText>
                <BodyTextSecondary>
                  Secondary body text with 70% opacity, also using Roboto Regular at 16px. 
                  This is used for supporting content or less emphasized paragraphs.
                </BodyTextSecondary>
              </div>
            </div>
            
            <div className="mb-10">
              <Heading3 className="mb-2">Card Typography</Heading3>
              <div className="space-y-6 p-4 bg-gray-50 rounded">
                <CardTitle>Card Title (24-28px)</CardTitle>
                <CardSubtitle>Card Subtitle (18px)</CardSubtitle>
                <CardText>
                  Card text is slightly shorter than regular body text, using 1.5em line height 
                  instead of 1.6em to better fit within card containers.
                </CardText>
              </div>
            </div>
          </section>
          
          {/* Buttons Section */}
          <section className="mb-16">
            <Heading2 className="mb-6 pb-2 border-b">Buttons</Heading2>
            <p className="mb-6">
              The RealTechee button system follows the design guidelines with consistent styling across various states and variants.
            </p>
            
            {/* New Button Showcase Component */}
            <ButtonShowcase />
            
            {/* Get an Estimate Button Showcase */}
            <div className="mt-12 pt-12 border-t">
              <GetAnEstimateShowcase />
            </div>
            
            <div className="mt-10">
              <Heading3 className="mb-4">Usage Examples</Heading3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border rounded">
                  <p className="mb-2 font-bold">Primary Usage</p>
                  <div className="mt-4">
                    <Button variant="primary">Get an Estimate</Button>
                    <p className="text-sm mt-3 text-gray-500">
                      Primary buttons are used for main CTAs such as "Get an Estimate" or "Contact Us"
                    </p>
                  </div>
                </div>
                
                <div className="p-6 border rounded">
                  <p className="mb-2 font-bold">Secondary Usage</p>
                  <div className="mt-4">
                    <Button variant="secondary">Learn More</Button>
                    <p className="text-sm mt-3 text-gray-500">
                      Secondary buttons are used for supporting actions like "Learn More" or "View Details"
                    </p>
                  </div>
                </div>
                
                <div className="p-6 border rounded">
                  <p className="mb-2 font-bold">Tertiary Usage</p>
                  <div className="mt-4">
                    <Button variant="tertiary">View All</Button>
                    <p className="text-sm mt-3 text-gray-500">
                      Tertiary buttons are used for less prominent actions like "View All" or in-line links
                    </p>
                  </div>
                </div>
                
                <div className="p-6 border rounded">
                  <p className="mb-2 font-bold">With Icon</p>
                  <div className="mt-4">
                    <Button variant="primary" withIcon iconPosition="right">Start Now</Button>
                    <p className="text-sm mt-3 text-gray-500">
                      Buttons with icons add visual emphasis to important actions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Colors Section */}
          <section className="mb-16">
            <Heading2 className="mb-6 pb-2 border-b">Colors</Heading2>
            
            <div className="mb-6">
              <Heading3 className="mb-4">Primary Colors</Heading3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded">
                  <div className="h-20 bg-dark-gray rounded mb-2"></div>
                  <p className="font-bold">Dark Gray</p>
                  <p className="text-sm text-gray-500">#2A2B2E</p>
                </div>
                
                <div className="p-4 rounded">
                  <div className="h-20 bg-accent-coral rounded mb-2"></div>
                  <p className="font-bold">Coral</p>
                  <p className="text-sm text-gray-500">#E9664A</p>
                </div>
                
                <div className="p-4 rounded">
                  <div className="h-20 bg-white border rounded mb-2"></div>
                  <p className="font-bold">White</p>
                  <p className="text-sm text-gray-500">#FFFFFF</p>
                </div>
                
                <div className="p-4 rounded">
                  <div className="h-20 rounded mb-2" style={{backgroundColor: "#FCF9F8"}}></div>
                  <p className="font-bold">Off-White</p>
                  <p className="text-sm text-gray-500">#FCF9F8</p>
                </div>
              </div>
            </div>
            
            <div>
              <Heading3 className="mb-4">Pill Background</Heading3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded">
                  <div className="h-20 rounded mb-2" style={{backgroundColor: "#FFF7F5"}}></div>
                  <p className="font-bold">Light Peach</p>
                  <p className="text-sm text-gray-500">#FFF7F5</p>
                </div>
                
                <div className="p-4 rounded">
                  <div className="h-20 border rounded mb-2" style={{borderColor: "#F0E4DF"}}></div>
                  <p className="font-bold">Card Border</p>
                  <p className="text-sm text-gray-500">#F0E4DF</p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Cards Section */}
          <section>
            <Heading2 className="mb-6 pb-2 border-b">Card Examples</Heading2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card card-hover">
                <CardTitle>Feature Card</CardTitle>
                <CardText className="mt-4">
                  This is an example of a feature card with standardized styling. 
                  The card has consistent padding, border radius, and typography.
                </CardText>
                <div className="mt-6">
                  <Button variant="text" text="Learn More" showArrow={true} />
                </div>
              </div>
              
              <div className="card card-hover">
                <CardTitle>Testimonial Card</CardTitle>
                <CardText className="mt-4">
                  "RealTechee has transformed how our agents prepare homes for sale. 
                  The platform is intuitive and the results are outstanding."
                </CardText>
                <div className="mt-6 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="ml-3">
                    <p className="font-heading font-bold text-sm">Jane Smith</p>
                    <p className="text-sm text-gray-500">Realtor, ABC Realty</p>
                  </div>
                </div>
              </div>
            </div>

            {/* New Card Showcase Component */}
            <CardShowcase />
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}