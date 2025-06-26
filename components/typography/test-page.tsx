import React from 'react';
import { H1, H2, H3, H4, H5, H6, P1, P2, P3 } from './index';

/**
 * Test page for new typography components
 * View this component to test responsive scaling
 */
export default function TypographyTestPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold mb-4">Typography Test Page</h1>
        <p className="text-gray-600">
          Resize your browser window to see CSS clamp scaling in action.
          Test from 320px (mobile) to 1440px+ (desktop).
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Heading Components (H1-H6)</h2>
        <div className="space-y-4">
          <div>
            <H1>H1: Page Title - The Quick Brown Fox</H1>
            <p className="text-sm text-gray-500">clamp(2rem,4vw,3rem) - 32px → 48px</p>
          </div>
          
          <div>
            <H2>H2: Section Heading - The Quick Brown Fox</H2>
            <p className="text-sm text-gray-500">clamp(1.5rem,3vw,2.5rem) - 24px → 40px</p>
          </div>
          
          <div>
            <H3>H3: Subsection Title - The Quick Brown Fox</H3>
            <p className="text-sm text-gray-500">clamp(1.25rem,2.5vw,2rem) - 20px → 32px</p>
          </div>
          
          <div>
            <H4>H4: Card Title - The Quick Brown Fox</H4>
            <p className="text-sm text-gray-500">clamp(1.125rem,2vw,1.75rem) - 18px → 28px</p>
          </div>
          
          <div>
            <H5>H5: Small Heading - The Quick Brown Fox</H5>
            <p className="text-sm text-gray-500">clamp(1rem,1.5vw,1.5rem) - 16px → 24px</p>
          </div>
          
          <div>
            <H6>H6: Caption/Label - The Quick Brown Fox</H6>
            <p className="text-sm text-gray-500">clamp(0.875rem,1vw,1.25rem) - 14px → 20px</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Body Text Components (P1-P3)</h2>
        <div className="space-y-4">
          <div>
            <P1>
              P1: Important body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This text should 
              be used for important descriptions and key content.
            </P1>
            <p className="text-sm text-gray-500">clamp(1rem,1.5vw,1.25rem) - 16px → 20px</p>
          </div>
          
          <div>
            <P2>
              P2: Regular body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is your 
              standard paragraph text for most content.
            </P2>
            <p className="text-sm text-gray-500">clamp(0.875rem,1vw,1rem) - 14px → 16px</p>
          </div>
          
          <div>
            <P3>
              P3: Small text/captions - Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              This text is used for captions, small notes, and secondary information.
            </P3>
            <p className="text-sm text-gray-500">clamp(0.75rem,0.5vw,0.875rem) - 12px → 14px</p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Usage Example</h2>
        <div className="bg-white p-6 rounded border">
          <H1>Welcome to RealTechee</H1>
          <P1>
            We help real estate professionals maximize their client's sale value 
            and minimize buying costs through innovative technology solutions.
          </P1>
          
          <H2>Our Services</H2>
          <P2>
            Our comprehensive platform includes virtual walk-throughs, automated 
            programs, CRM integration, and custom UI solutions.
          </P2>
          
          <H3>Featured Solution</H3>
          <P2>
            Transform your real estate business with our turn-key technology stack 
            designed specifically for industry professionals.
          </P2>
          <P3>Available for qualified partners only</P3>
        </div>
      </section>
    </div>
  );
}