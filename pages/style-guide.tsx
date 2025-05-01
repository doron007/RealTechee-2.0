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
import Button from '../components/common/buttons/Buttons';

export default function StyleGuidePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>Brand Guidelines - RealTechee</title>
        <meta name="description" content="RealTechee brand guidelines and style guide" />
      </Head>
      
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16">
          <Heading1 className="mb-12 text-center">RealTechee 2.0 Style Guide</Heading1>
          
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border rounded">
                <p className="mb-2 font-bold">Primary Button</p>
                <div className="flex flex-col gap-4">
                  <Button variant="primary" text="Learn More" />
                  <Button variant="primary" text="Learn More" showArrow={true} />
                  <Button variant="primary" text="Learn More" disabled={true} />
                </div>
              </div>
              
              <div className="p-6 border rounded">
                <p className="mb-2 font-bold">Secondary Button</p>
                <div className="flex flex-col gap-4">
                  <Button variant="secondary" text="Get in Touch" />
                  <Button variant="secondary" text="Get in Touch" showArrow={true} />
                  <Button variant="secondary" text="Get in Touch" disabled={true} />
                </div>
              </div>
              
              <div className="p-6 border rounded">
                <p className="mb-2 font-bold">Outline Button</p>
                <div className="flex flex-col gap-4">
                  <Button variant="outline" text="Read More" />
                  <Button variant="outline" text="Read More" showArrow={true} />
                  <Button variant="outline" text="Read More" disabled={true} />
                </div>
              </div>
              
              <div className="p-6 border rounded">
                <p className="mb-2 font-bold">Text Button</p>
                <div className="flex flex-col gap-4">
                  <Button variant="text" text="View Details" />
                  <Button variant="text" text="View Details" showArrow={true} />
                  <Button variant="text" text="View Details" disabled={true} />
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
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}