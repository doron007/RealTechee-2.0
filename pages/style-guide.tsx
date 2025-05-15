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
  Body1,
  Body2,
  Body3,
  SectionLabel,
  SubtitlePill,
  BodyText,
  BodyTextSecondary,
  CardTitle,
  CardSubtitle,
  CardText,
  CardContent,
  PageHeader,
  SectionTitle,
  Subtitle,
  BodyContent,
  SubContent,
  ButtonText
} from '../components/Typography';
import Button from '../components/common/buttons/Button';
import { ButtonShowcase, CardShowcase, GetAnEstimateShowcase } from '../components/style-guide';
import ResponsiveTypographyShowcase from '../components/style-guide/ResponsiveTypographyShowcase';

export default function StyleGuidePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>RealTechee Design System</title>
        <meta name="description" content="RealTechee brand guidelines and design system documentation" />
      </Head>
      
      <Header />
      
      {/* Added pt-24 sm:pt-28 md:pt-32 lg:pt-36 for proper spacing below the fixed header */}
      <main className="flex-grow pt-24 sm:pt-28 md:pt-32 lg:pt-36">
        <div className="container mx-auto px-4 py-16">
          <PageHeader className="mb-12 text-center">RealTechee 2.0 Design System</PageHeader>
          
          {/* Quick Navigation */}
          <nav className="mb-16 p-6 bg-gray-50 rounded-lg">
            <Subtitle as="h2" className="mb-4">Quick Navigation</Subtitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="#responsive-typography" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <SectionLabel>01</SectionLabel>
                <BodyText className="font-medium">Responsive Typography</BodyText>
              </a>
              <a href="#typography-components" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <SectionLabel>02</SectionLabel>
                <BodyText className="font-medium">Typography Components</BodyText>
              </a>
              <a href="#buttons" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <SectionLabel>03</SectionLabel>
                <BodyText className="font-medium">Buttons</BodyText>
              </a>
              <a href="#colors" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <SectionLabel>04</SectionLabel>
                <BodyText className="font-medium">Colors</BodyText>
              </a>
              <a href="#cards" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <SectionLabel>05</SectionLabel>
                <BodyText className="font-medium">Cards</BodyText>
              </a>
              <a href="#component-library" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <SectionLabel>06</SectionLabel>
                <BodyText className="font-medium">Component Library</BodyText>
              </a>
            </div>
          </nav>
          
          {/* Responsive Typography Section */}
          <section id="responsive-typography" className="mb-20 scroll-mt-40">
            <SectionTitle className="mb-6 pb-2 border-b">01. Responsive Typography System</SectionTitle>
            <ResponsiveTypographyShowcase />
          </section>
          
          {/* Typography Components Section */}
          <section id="typography-components" className="mb-20 scroll-mt-40">
            <SectionTitle className="mb-6 pb-2 border-b">02. Typography Components</SectionTitle>
            
            {/* Page & Section Headers */}
            <div className="mb-12">
              <Subtitle className="mb-4">Page & Section Headers</Subtitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <SectionLabel className="mb-2">Page Header</SectionLabel>
                  <PageHeader>Main Page Heading</PageHeader>
                  <BodyTextSecondary className="mt-3">
                    Component: <code>PageHeader</code><br/>
                    Font: Nunito Sans | Weight: Semibold | Size: 20px-48px<br/>
                    Used for main page titles
                  </BodyTextSecondary>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-lg">
                  <SectionLabel className="mb-2">Section Title</SectionLabel>
                  <SectionTitle>Section Heading</SectionTitle>
                  <BodyTextSecondary className="mt-3">
                    Component: <code>SectionTitle</code><br/>
                    Font: Nunito Sans | Weight: Bold | Size: 18px-24px<br/>
                    Used for major section headings
                  </BodyTextSecondary>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-lg">
                  <SectionLabel className="mb-2">Subtitle</SectionLabel>
                  <Subtitle>Secondary Section Heading</Subtitle>
                  <BodyTextSecondary className="mt-3">
                    Component: <code>Subtitle</code><br/>
                    Font: Nunito Sans | Weight: Semibold | Size: 18px-20px<br/>
                    Used for subsections and secondary headings
                  </BodyTextSecondary>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-lg">
                  <SectionLabel className="mb-2">Section Label</SectionLabel>
                  <SectionLabel className="mb-1">FEATURES</SectionLabel>
                  <SectionLabel className="mb-1">TESTIMONIALS</SectionLabel>
                  <SectionLabel>SERVICES</SectionLabel>
                  <BodyTextSecondary className="mt-3">
                    Component: <code>SectionLabel</code><br/>
                    Font: Nunito Sans | Weight: Semibold | Size: 12px-14px | Uppercase<br/>
                    Used for labeling sections, typically above section titles
                  </BodyTextSecondary>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <SectionLabel className="mb-2">Subtitle Pills</SectionLabel>
                <div className="mb-3">
                  <SubtitlePill>Meet RealTechee, Your Home Preparation Partner</SubtitlePill>
                </div>
                <BodyTextSecondary>
                  Component: <code>SubtitlePill</code><br/>
                  Font: Nunito Sans | Weight: Medium | Size: 12px-14px<br/>
                  Used for highlighting short phrases, with soft peach background
                </BodyTextSecondary>
              </div>
            </div>
            
            {/* Traditional Headings */}
            <div className="mb-12">
              <Subtitle className="mb-4">Traditional Headings</Subtitle>
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="space-y-6">
                  <div>
                    <SectionLabel className="mb-1">h1</SectionLabel>
                    <Heading1>Heading 1 (48px)</Heading1>
                    <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Semibold | Line Height: tight</BodyTextSecondary>
                  </div>
                  <div>
                    <SectionLabel className="mb-1">h2</SectionLabel>
                    <Heading2>Heading 2 (39)</Heading2>
                    <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Semibold | Line Height: tight</BodyTextSecondary>
                  </div>
                  <div>
                    <SectionLabel className="mb-1">h3</SectionLabel>
                    <Heading3>Heading 3 (31)</Heading3>
                    <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Semibold | Line Height: snug</BodyTextSecondary>
                  </div>
                  <div>
                    <SectionLabel className="mb-1">h4</SectionLabel>
                    <Heading4>Heading 4 (25)</Heading4>
                    <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Medium | Line Height: snug</BodyTextSecondary>
                  </div>
                  <div>
                    <SectionLabel className="mb-1">h5</SectionLabel>
                    <Heading5>Heading 5 (20)</Heading5>
                    <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Medium | Line Height: normal</BodyTextSecondary>
                  </div>
                  <div>
                    <SectionLabel className="mb-1">h6</SectionLabel>
                    <Heading6>Heading 6 (16px)</Heading6>
                    <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Medium | Line Height: normal</BodyTextSecondary>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Traditional Body */}
            <div className="mb-12">
              <Subtitle className="mb-4">Traditional Body</Subtitle>
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="space-y-6">
                  <div>
                    <SectionLabel className="mb-1">Body 1</SectionLabel>
                    <Body1>Body 1 (20px) - Use for emphasis and large intro paragraphs. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.</Body1>
                    <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Normal | Size: 20px | Line Height: 150%</BodyTextSecondary>
                  </div>
                  <div>
                    <SectionLabel className="mb-1">Body 2</SectionLabel>
                    <Body2>Body 2 (16px) - Standard body text for most paragraphs. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Body2>
                    <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Normal | Size: 16px | Line Height: 150%</BodyTextSecondary>
                  </div>
                  <div>
                    <SectionLabel className="mb-1">Body 3</SectionLabel>
                    <Body3>Body 3 (14px) - Smaller body text for captions, notes, and supporting content. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</Body3>
                    <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Normal | Size: 14px | Line Height: 150%</BodyTextSecondary>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Body Text */}
            <div className="mb-12">
              <Subtitle className="mb-4">Body Text Components</Subtitle>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <SectionLabel className="mb-2">Body Content</SectionLabel>
                  <BodyContent>
                    Primary body text for most content on the site. This text adjusts responsively 
                    from 14px to 18px with a comfortable line height for readability.
                  </BodyContent>
                  <BodyTextSecondary className="mt-3">
                    Component: <code>BodyContent</code><br/>
                    Font: Roboto | Weight: Normal | Size: 14px-18px<br/>
                    Line Height: relaxed (1.6)
                  </BodyTextSecondary>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-lg">
                  <SectionLabel className="mb-2">Sub Content</SectionLabel>
                  <SubContent>
                    Smaller body text for secondary information. This text is slightly 
                    smaller than the main body text, used for supporting content.
                  </SubContent>
                  <BodyTextSecondary className="mt-3">
                    Component: <code>SubContent</code><br/>
                    Font: Roboto | Weight: Normal | Size: 12px-16px<br/>
                    Line Height: relaxed (1.6)
                  </BodyTextSecondary>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-lg">
                  <SectionLabel className="mb-2">Body Text (Legacy)</SectionLabel>
                  <BodyText>
                    Standard body text with 16px base size. This is used for content 
                    that doesn't need responsive sizing beyond basic breakpoints.
                  </BodyText>
                  <BodyTextSecondary className="mt-3">
                    Component: <code>BodyText</code><br/>
                    Font: Roboto | Weight: Normal | Size: 14px-16px<br/>
                    Line Height: relaxed (1.6)
                  </BodyTextSecondary>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-lg">
                  <SectionLabel className="mb-2">Body Text Secondary (Legacy)</SectionLabel>
                  <BodyTextSecondary>
                    Secondary body text with reduced prominence. This text has a muted color 
                    and is typically used for supplementary information.
                  </BodyTextSecondary>
                  <BodyTextSecondary className="mt-3">
                    Component: <code>BodyTextSecondary</code><br/>
                    Font: Roboto | Weight: Normal | Size: 12px-14px<br/>
                    Color: Medium Gray | Line Height: relaxed (1.6)
                  </BodyTextSecondary>
                </div>
              </div>
            </div>
            
            {/* Card Typography */}
            <div className="mb-10">
              <Subtitle className="mb-4">Card Typography</Subtitle>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <CardTitle className="mb-3">Card Title</CardTitle>
                  <BodyTextSecondary>
                    Component: <code>CardTitle</code><br/>
                    Font: Nunito Sans | Weight: Bold | Size: 14px-18px<br/>
                    Used for card headers
                  </BodyTextSecondary>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-lg">
                  <CardSubtitle className="mb-3">Card Subtitle</CardSubtitle>
                  <BodyTextSecondary>
                    Component: <code>CardSubtitle</code><br/>
                    Font: Nunito Sans | Weight: Medium | Size: 12px-16px<br/>
                    Used for card subtitles
                  </BodyTextSecondary>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-lg">
                  <CardContent>
                    This is card content text, optimized for readability within compact card 
                    containers while maintaining a clear visual hierarchy.
                  </CardContent>
                  <BodyTextSecondary className="mt-3">
                    Component: <code>CardContent</code><br/>
                    Font: Roboto | Weight: Normal | Size: 12px-14px<br/>
                    Line Height: relaxed
                  </BodyTextSecondary>
                </div>
              </div>
              
              <div className="mt-6 bg-gray-50 p-6 rounded-lg">
                <SectionLabel className="mb-3">Complete Card Example</SectionLabel>
                <div className="p-6 border border-gray-200 rounded-lg bg-white">
                  <CardTitle>Feature Card Example</CardTitle>
                  <CardSubtitle className="mt-2 text-gray-600">Supporting information</CardSubtitle>
                  <CardContent className="mt-4">
                    This example shows how various card typography components work together 
                    to create a cohesive and readable card design with proper hierarchy.
                  </CardContent>
                  <div className="mt-4">
                    <Button variant="tertiary">Learn More</Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Button Text */}
            <div className="mb-10">
              <Subtitle className="mb-4">Button Typography</Subtitle>
              <div className="p-6 bg-gray-50 rounded-lg">
                <SectionLabel className="mb-2">Button Text</SectionLabel>
                <div className="mb-4">
                  <ButtonText>Button Text Component</ButtonText>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">
                    <ButtonText>Primary</ButtonText>
                  </Button>
                  <Button variant="secondary">
                    <ButtonText>Secondary</ButtonText>
                  </Button>
                  <Button variant="tertiary">
                    <ButtonText>Tertiary</ButtonText>
                  </Button>
                </div>
                <BodyTextSecondary className="mt-4">
                  Component: <code>ButtonText</code><br/>
                  Font: Inter | Weight: Medium | Size: 12px-16px<br/>
                  Line Height: none (tight)<br/>
                  Used within buttons for consistent text styling
                </BodyTextSecondary>
              </div>
            </div>
          </section>
          
          {/* Buttons Section */}
          <section id="buttons" className="mb-20 scroll-mt-40">
            <SectionTitle className="mb-6 pb-2 border-b">03. Buttons</SectionTitle>
            <BodyContent className="mb-6">
              The RealTechee button system follows the design guidelines with consistent styling across various states and variants.
              Each button type serves a specific purpose in the interface hierarchy.
            </BodyContent>
            
            {/* Button Showcase Component */}
            <ButtonShowcase />
            
            {/* Get an Estimate Button Showcase */}
            <div className="mt-12 pt-12 border-t">
              <GetAnEstimateShowcase />
            </div>
            
            <div className="mt-10">
              <Subtitle className="mb-4">Usage Examples</Subtitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border rounded">
                  <SectionLabel className="mb-2">Primary Usage</SectionLabel>
                  <div className="mt-4">
                    <Button variant="primary">Get an Estimate</Button>
                    <BodyTextSecondary className="mt-3">
                      Primary buttons are used for main CTAs such as "Get an Estimate" or "Contact Us"
                    </BodyTextSecondary>
                  </div>
                </div>
                
                <div className="p-6 border rounded">
                  <SectionLabel className="mb-2">Secondary Usage</SectionLabel>
                  <div className="mt-4">
                    <Button variant="secondary">Learn More</Button>
                    <BodyTextSecondary className="mt-3">
                      Secondary buttons are used for supporting actions like "Learn More" or "View Details"
                    </BodyTextSecondary>
                  </div>
                </div>
                
                <div className="p-6 border rounded">
                  <SectionLabel className="mb-2">Tertiary Usage</SectionLabel>
                  <div className="mt-4">
                    <Button variant="tertiary">View All</Button>
                    <BodyTextSecondary className="mt-3">
                      Tertiary buttons are used for less prominent actions like "View All" or in-line links
                    </BodyTextSecondary>
                  </div>
                </div>
                
                <div className="p-6 border rounded">
                  <SectionLabel className="mb-2">With Icon</SectionLabel>
                  <div className="mt-4">
                    <Button variant="primary" withIcon iconPosition="right">Start Now</Button>
                    <BodyTextSecondary className="mt-3">
                      Buttons with icons add visual emphasis to important actions
                    </BodyTextSecondary>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Colors Section */}
          <section id="colors" className="mb-20 scroll-mt-40">
            <SectionTitle className="mb-6 pb-2 border-b">04. Colors</SectionTitle>
            
            <div className="mb-10">
              <Subtitle className="mb-4">Primary Colors</Subtitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded">
                  <div className="h-20 bg-dark-gray rounded mb-2"></div>
                  <BodyText className="font-bold">Dark Gray</BodyText>
                  <BodyTextSecondary>#2A2B2E</BodyTextSecondary>
                </div>
                
                <div className="p-4 rounded">
                  <div className="h-20 bg-accent-coral rounded mb-2"></div>
                  <BodyText className="font-bold">Coral</BodyText>
                  <BodyTextSecondary>#E9664A</BodyTextSecondary>
                </div>
                
                <div className="p-4 rounded">
                  <div className="h-20 bg-white border rounded mb-2"></div>
                  <BodyText className="font-bold">White</BodyText>
                  <BodyTextSecondary>#FFFFFF</BodyTextSecondary>
                </div>
                
                <div className="p-4 rounded">
                  <div className="h-20 rounded mb-2" style={{backgroundColor: "#FCF9F8"}}></div>
                  <BodyText className="font-bold">Off-White</BodyText>
                  <BodyTextSecondary>#FCF9F8</BodyTextSecondary>
                </div>
              </div>
            </div>
            
            <div>
              <Subtitle className="mb-4">Supporting Colors</Subtitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded">
                  <div className="h-20 rounded mb-2" style={{backgroundColor: "#FFF7F5"}}></div>
                  <BodyText className="font-bold">Light Peach</BodyText>
                  <BodyTextSecondary>#FFF7F5</BodyTextSecondary>
                </div>
                
                <div className="p-4 rounded">
                  <div className="h-20 border rounded mb-2" style={{borderColor: "#F0E4DF"}}></div>
                  <BodyText className="font-bold">Card Border</BodyText>
                  <BodyTextSecondary>#F0E4DF</BodyTextSecondary>
                </div>
              </div>
            </div>
          </section>
          
          {/* Cards Section */}
          <section id="cards" className="mb-20 scroll-mt-40">
            <SectionTitle className="mb-6 pb-2 border-b">05. Card Examples</SectionTitle>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
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

            {/* Card Showcase Component */}
            <CardShowcase />
          </section>
          
          {/* Component Library Section */}
          <section id="component-library" className="scroll-mt-40">
            <SectionTitle className="mb-6 pb-2 border-b">06. Component Library</SectionTitle>
            <BodyContent className="mb-6">
              The RealTechee component library provides standardized UI elements that maintain 
              consistent design patterns across the site. The major components are documented below.
            </BodyContent>
            
            <div className="p-6 bg-gray-50 rounded-lg mb-8">
              <Subtitle className="mb-4">Component Import Structure</Subtitle>
              <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
                <code>{`import { 
  PageHeader, 
  SectionTitle,
  Subtitle,
  BodyContent,
  // ...other components
} from '../components/Typography';

// Using components in your React component:
function MyComponent() {
  return (
    <div>
      <PageHeader>Page Title</PageHeader>
      <SectionTitle>Section Title</SectionTitle>
      <BodyContent>Your content here...</BodyContent>
    </div>
  );
}`}</code>
              </pre>
              <BodyContent className="mt-4">
                All typography components are now available from a single import, 
                making it easy to maintain consistent typography across your project.
              </BodyContent>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}