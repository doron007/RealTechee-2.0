import React from 'react';
import Head from 'next/head';
import Header from '../components/common/layout/Header';
import Footer from '../components/common/layout/Footer';
import H1 from '../components/typography/H1';
import H2 from '../components/typography/H2';
import H3 from '../components/typography/H3';
import H4 from '../components/typography/H4';
import H5 from '../components/typography/H5';
import H6 from '../components/typography/H6';
import P1 from '../components/typography/P1';
import P2 from '../components/typography/P2';
import P3 from '../components/typography/P3';
import Button from '../components/common/buttons/Button';
import { ButtonShowcase, CardShowcase, GetAnEstimateShowcase, StatusPillShowcase } from '../components/style-guide';
import ResponsiveTypographyShowcase from '../components/style-guide/ResponsiveTypographyShowcase';
import TypographyTestPage from '../components/typography/test-page';

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
          <H1 className="mb-12 text-center">RealTechee 2.0 Design System</H1>

          {/* Quick Navigation */}
          <nav className="mb-16 p-6 bg-gray-50 rounded-lg">
            <H2 className="mb-4">Quick Navigation</H2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="#responsive-typography" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-1">01</P3>
                <P2 className="font-medium">Responsive Typography</P2>
              </a>
              <a href="#typography-components" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-1">02</P3>
                <P2 className="font-medium">Typography Components</P2>
              </a>
              <a href="#buttons" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-1">03</P3>
                <P2 className="font-medium">Buttons</P2>
              </a>
              <a href="#colors" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-1">04</P3>
                <P2 className="font-medium">Colors</P2>
              </a>
              <a href="#status-pills" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-1">05</P3>
                <P2 className="font-medium">Status Pills</P2>
              </a>
              <a href="#cards" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-1">06</P3>
                <P2 className="font-medium">Cards</P2>
              </a>
              <a href="#component-library" className="p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-1">07</P3>
                <P2 className="font-medium">Component Library</P2>
              </a>
            </div>
          </nav>

          {/* Responsive Typography Section */}
          <div id="responsive-typography">
            <TypographyTestPage />
          </div>

          <section className="mb-20 scroll-mt-40">
            <H2 className="mb-6 pb-2 border-b">01. Responsive Typography System</H2>
            <ResponsiveTypographyShowcase />
          </section>

          {/* Typography Components Section */}
          <section id="typography-components" className="mb-20 scroll-mt-40">
            <H2 className="mb-6 pb-2 border-b">02. New Semantic Typography Components</H2>

            {/* Semantic Headings */}
            <div className="mb-12">
              <H3 className="mb-4">Semantic Headings (H1-H6)</H3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">H1</P3>
                  <H1>Main Page Heading</H1>
                  <P3 className="mt-3 text-gray-600">
                    Component: <code>H1</code><br />
                    CSS clamp(): scales from 24px to 48px<br />
                    Used for main page titles
                  </P3>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">H2</P3>
                  <H2>Section Heading</H2>
                  <P3 className="mt-3 text-gray-600">
                    Component: <code>H2</code><br />
                    CSS clamp(): scales from 20px to 36px<br />
                    Used for major section headings
                  </P3>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">H3</P3>
                  <H3>Subsection Heading</H3>
                  <P3 className="mt-3 text-gray-600">
                    Component: <code>H3</code><br />
                    CSS clamp(): scales from 18px to 24px<br />
                    Used for subsections and card titles
                  </P3>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">H4</P3>
                  <H4>Minor Heading</H4>
                  <P3 className="mt-3 text-gray-600">
                    Component: <code>H4</code><br />
                    CSS clamp(): scales from 16px to 20px<br />
                    Used for minor headings and card subtitles
                  </P3>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">H5</P3>
                  <H5>Small Heading</H5>
                  <P3 className="mt-3 text-gray-600">
                    Component: <code>H5</code><br />
                    CSS clamp(): scales from 14px to 18px<br />
                    Used for small headings and labels
                  </P3>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">H6</P3>
                  <H6>Smallest Heading</H6>
                  <P3 className="mt-3 text-gray-600">
                    Component: <code>H6</code><br />
                    CSS clamp(): scales from 12px to 16px<br />
                    Used for smallest headings and navigation
                  </P3>
                </div>
              </div>
            </div>

            {/* Semantic Paragraphs */}
            <div className="mb-12">
              <H3 className="mb-4">Semantic Paragraphs (P1-P3)</H3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">P1</P3>
                  <P1>
                    Emphasis paragraph text for important content and large intro paragraphs. 
                    This scales beautifully across all screen sizes with CSS clamp().
                  </P1>
                  <P3 className="mt-3 text-gray-600">
                    Component: <code>P1</code><br />
                    CSS clamp(): scales from 16px to 20px<br />
                    Used for emphasis and form labels
                  </P3>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">P2</P3>
                  <P2>
                    Standard paragraph text for most body content. This is the most commonly 
                    used paragraph component throughout the site with optimal readability.
                  </P2>
                  <P3 className="mt-3 text-gray-600">
                    Component: <code>P2</code><br />
                    CSS clamp(): scales from 14px to 18px<br />
                    Used for standard body text
                  </P3>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">P3</P3>
                  <P3>
                    Supporting text for captions, notes, and secondary content. 
                    Smaller size but maintains readability across devices.
                  </P3>
                  <P3 className="mt-3 text-gray-600">
                    Component: <code>P3</code><br />
                    CSS clamp(): scales from 12px to 16px<br />
                    Used for captions and supporting text
                  </P3>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-6 rounded-lg">
                <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-3">Complete Example</P3>
                <div className="p-6 border border-gray-200 rounded-lg bg-white">
                  <H2>Typography in Action</H2>
                  <H3 className="mt-4">Semantic HTML Structure</H3>
                  <P1 className="mt-4">
                    This example demonstrates proper semantic hierarchy with our new typography system.
                  </P1>
                  <P2 className="mt-4">
                    The new H1-H6 and P1-P3 components use CSS clamp() for fluid responsive scaling, 
                    creating a seamless experience across all device sizes without complex breakpoints.
                  </P2>
                  <P3 className="mt-4 text-gray-600">
                    Supporting information and notes use P3 for optimal hierarchy and readability.
                  </P3>
                  <div className="mt-4">
                    <Button variant="primary">Learn More</Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Buttons Section */}
          <section id="buttons" className="mb-20 scroll-mt-40">
            <H2 className="mb-6 pb-2 border-b">03. Buttons</H2>
            <P2 className="mb-6">
              The RealTechee button system follows the design guidelines with consistent styling across various states and variants.
              Each button type serves a specific purpose in the interface hierarchy.
            </P2>

            {/* Button Showcase Component */}
            <ButtonShowcase />

            {/* Get an Estimate Button Showcase */}
            <div className="mt-12 pt-12 border-t">
              <GetAnEstimateShowcase />
            </div>

            <div className="mt-10">
              <H3 className="mb-4">Usage Examples</H3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border rounded">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">Primary Usage</P3>
                  <div className="mt-4">
                    <Button variant="primary">Get an Estimate</Button>
                    <P3 className="mt-3 text-gray-600">
                      Primary buttons are used for main CTAs such as "Get an Estimate" or "Contact Us"
                    </P3>
                  </div>
                </div>

                <div className="p-6 border rounded">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">Secondary Usage</P3>
                  <div className="mt-4">
                    <Button variant="secondary">Learn More</Button>
                    <P3 className="mt-3 text-gray-600">
                      Secondary buttons are used for supporting actions like "Learn More" or "View Details"
                    </P3>
                  </div>
                </div>

                <div className="p-6 border rounded">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">Tertiary Usage</P3>
                  <div className="mt-4">
                    <Button variant="tertiary">View All</Button>
                    <P3 className="mt-3 text-gray-600">
                      Tertiary buttons are used for less prominent actions like "View All" or in-line links
                    </P3>
                  </div>
                </div>

                <div className="p-6 border rounded">
                  <P3 className="text-[#E9664A] uppercase tracking-wider font-semibold text-xs mb-2">With Icon</P3>
                  <div className="mt-4">
                    <Button variant="primary" withIcon iconPosition="right">Start Now</Button>
                    <P3 className="mt-3 text-gray-600">
                      Buttons with icons add visual emphasis to important actions
                    </P3>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Colors Section */}
          <section id="colors" className="mb-20 scroll-mt-40">
            <H2 className="mb-6 pb-2 border-b">04. Colors</H2>

            <div className="mb-10">
              <H3 className="mb-4">Primary Colors</H3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded">
                  <div className="h-20 bg-dark-gray rounded mb-2"></div>
                  <P2 className="font-bold">Dark Gray</P2>
                  <P3 className="text-gray-600">#2A2B2E</P3>
                </div>

                <div className="p-4 rounded">
                  <div className="h-20 bg-accent-coral rounded mb-2"></div>
                  <P2 className="font-bold">Coral</P2>
                  <P3 className="text-gray-600">#E9664A</P3>
                </div>

                <div className="p-4 rounded">
                  <div className="h-20 bg-white border rounded mb-2"></div>
                  <P2 className="font-bold">White</P2>
                  <P3 className="text-gray-600">#FFFFFF</P3>
                </div>

                <div className="p-4 rounded">
                  <div className="h-20 rounded mb-2" style={{ backgroundColor: "#FCF9F8" }}></div>
                  <P2 className="font-bold">Off-White</P2>
                  <P3 className="text-gray-600">#FCF9F8</P3>
                </div>
              </div>
            </div>

            <div>
              <H3 className="mb-4">Supporting Colors</H3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded">
                  <div className="h-20 rounded mb-2" style={{ backgroundColor: "#FFF7F5" }}></div>
                  <P2 className="font-bold">Light Peach</P2>
                  <P3 className="text-gray-600">#FFF7F5</P3>
                </div>

                <div className="p-4 rounded">
                  <div className="h-20 border rounded mb-2" style={{ borderColor: "#F0E4DF" }}></div>
                  <P2 className="font-bold">Card Border</P2>
                  <P3 className="text-gray-600">#F0E4DF</P3>
                </div>
              </div>
            </div>
          </section>

          {/* Status Pills Section */}
          <section id="status-pills" className="mb-20 scroll-mt-40">
            <H2 className="mb-6 pb-2 border-b">05. Status Pills</H2>
            <P2 className="mb-6">
              Status pills provide visual indication of the current state of an entity (Project, Request, or Quote).
              The consistent color system helps users quickly identify status across the platform.
            </P2>

            {/* Status Pill Showcase Component */}
            <StatusPillShowcase />
          </section>

          {/* Cards Section */}
          <section id="cards" className="mb-20 scroll-mt-40">
            <H2 className="mb-6 pb-2 border-b">06. Card Examples</H2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="card card-hover p-6 border border-gray-200 rounded-lg bg-white">
                <H3>Feature Card</H3>
                <P2 className="mt-4">
                  This is an example of a feature card with standardized styling using the new semantic typography components.
                  The card maintains consistent padding, border radius, and typography hierarchy.
                </P2>
                <div className="mt-6">
                  <Button variant="tertiary">Learn More</Button>
                </div>
              </div>

              <div className="card card-hover p-6 border border-gray-200 rounded-lg bg-white">
                <H3>Testimonial Card</H3>
                <P2 className="mt-4">
                  "RealTechee has transformed how our agents prepare homes for sale.
                  The platform is intuitive and the results are outstanding."
                </P2>
                <div className="mt-6 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="ml-3">
                    <P2 className="font-bold">Jane Smith</P2>
                    <P3 className="text-gray-500">Realtor, ABC Realty</P3>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Showcase Component */}
            <CardShowcase />
          </section>

          {/* Component Library Section */}
          <section id="component-library" className="scroll-mt-40">
            <H2 className="mb-6 pb-2 border-b">07. New Typography Component Library</H2>
            <P2 className="mb-6">
              The RealTechee typography system now uses semantic H1-H6 and P1-P3 components with CSS clamp() 
              for fluid responsive scaling. This provides consistent design patterns and improved accessibility.
            </P2>

            <div className="p-6 bg-gray-50 rounded-lg mb-8">
              <H3 className="mb-4">Component Import Structure</H3>
              <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
                <code>{`import H1 from '../components/typography/H1';
import H2 from '../components/typography/H2';
import H3 from '../components/typography/H3';
import P1 from '../components/typography/P1';
import P2 from '../components/typography/P2';
import P3 from '../components/typography/P3';

// Or use barrel imports
import { H1, H2, H3, P1, P2, P3 } from '../components';

function MyComponent() {
  return (
    <div>
      <H1>Page Title</H1>
      <H2>Section Title</H2>
      <P2>Your content here...</P2>
    </div>
  );
}`}</code>
              </pre>
              <P2 className="mt-4">
                All typography components now use CSS clamp() for fluid responsive scaling, 
                making it easy to maintain consistent typography across your project without complex breakpoints.
              </P2>
            </div>

            <div className="p-6 bg-blue-50 rounded-lg">
              <H3 className="mb-4">Migration Benefits</H3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  <P2>Semantic HTML structure improves accessibility and SEO</P2>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  <P2>CSS clamp() provides smooth responsive scaling without breakpoints</P2>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  <P2>Simplified component API reduces cognitive load for developers</P2>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  <P2>Consistent visual hierarchy across all pages and components</P2>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-2">✓</span>
                  <P2>Future-proof design system that scales with project growth</P2>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}