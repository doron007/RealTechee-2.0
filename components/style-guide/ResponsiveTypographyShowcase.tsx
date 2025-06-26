import React from 'react';
import { H1 } from '../typography/H1';
import { H2 } from '../typography/H2';
import { H3 } from '../typography/H3';
import { P1 } from '../typography/P1';
import { P2 } from '../typography/P2';
import { P3 } from '../typography/P3'
import Button from '../common/buttons/Button';

const ResponsiveTypographyShowcase: React.FC = () => {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-semibold mb-4">Responsive Typography System</h2>
        <p className="text-gray-600 mb-6">
          This system ensures consistent text sizing across breakpoints following best practices.
          Resize your browser window to see how each text element adapts responsively.
        </p>
      </div>
      
      {/* Typography Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Element Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">sm (≥640px)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">md (≥768px)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">lg (≥1024px)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">xl (≥1280px)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">xxl (≥1400px)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2xl (≥1536px)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Page Header</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-3xl (24px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-4xl (36px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-5xl (48px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-5xl (48px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-5xl (48px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-5xl (48px)</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Section Title</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-2xl (20px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-3xl (24px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-4xl (36px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-4xl (36px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-4xl (36px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-4xl (36px)</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Subtitle</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-xl (18px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-2xl (20px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-3xl (24px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-3xl (24px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-3xl (24px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-3xl (24px)</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Body Content</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-base (16px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-lg (18px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-lg (18px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-xl (20px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-xl (20px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-xl (20px)</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Sub Content</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-sm (14px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-base (16px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-base (16px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-lg (18px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-lg (18px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-lg (18px)</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Button Text</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-sm (14px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-base (16px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-base (16px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-lg (18px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-lg (18px)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">text-lg (18px)</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Live Examples */}
      <div className="mt-12 space-y-12">
        <h2 className="text-xl font-semibold mb-6">Live Examples</h2>
        
        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Page Header</span>
          <H1>The quick brown fox jumps over the lazy dog</H1>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>H1</code> - This element uses clamp(2rem,4vw,3rem) for responsive sizing (32px → 48px)</div>
        </div>
        
        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Section Title</span>
          <H2>The quick brown fox jumps over the lazy dog</H2>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>H2</code> - This element uses clamp(1.5rem,3vw,2.5rem) for responsive sizing (24px → 40px)</div>
        </div>
        
        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Subtitle</span>
          <H3>The quick brown fox jumps over the lazy dog</H3>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>H3</code> - This element uses clamp(1.25rem,2.5vw,2rem) for responsive sizing (20px → 32px)</div>
        </div>
        
        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Body Content</span>
          <P1>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. 
            Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus 
            rhoncus ut eleifend nibh porttitor. Ut in nulla enim.
          </P1>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>P1</code> - This element uses clamp(1rem,1.5vw,1.25rem) for responsive sizing (16px → 20px)</div>
        </div>
        
        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Sub Content</span>
          <P3>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. 
            Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus 
            rhoncus ut eleifend nibh porttitor. Ut in nulla enim.
          </P3>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>P3</code> - This element uses clamp(0.75rem,0.5vw,0.875rem) for responsive sizing (12px → 14px)</div>
        </div>

        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Button Text</span>
          <div className="mt-4 flex flex-col gap-6">
            <P2>The quick brown fox jumps over the lazy dog</P2>
            <div className="flex space-x-4">
              <Button variant="primary">
                <P2>Primary Button</P2>
              </Button>
              <Button variant="secondary">
                <P2>Secondary Button</P2>
              </Button>
              <Button variant="tertiary">
                <P2>Tertiary Button</P2>
              </Button>
            </div>
          </div>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>P2</code> - This element uses clamp(0.875rem,1vw,1rem) for responsive sizing (14px → 16px)</div>
          <div className="mt-2 text-gray-500 text-sm">Font: Inter, Weight: Medium, Leading: none (tight)</div>
        </div>
      </div>
      
      <div className="mt-16 p-6 border border-gray-200 rounded-lg bg-yellow-50">
        <h2 className="text-xl font-semibold mb-3">Typography Size Cap Notes</h2>
        <p className="mb-4">
          The typography sizes have been capped at reasonable maximums to ensure readability across all screen sizes:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Page Header is capped at 48px (text-5xl) for xl breakpoints and above</li>
          <li>Section Title is capped at 36px (text-4xl) for xl breakpoints and above</li>
          <li>Subtitle is capped at 24px (text-3xl) for lg breakpoints and above</li>
          <li>Body Content is capped at 20px (text-xl) for xl breakpoints and above</li>
          <li>Sub Content is capped at 18px (text-lg) for xl breakpoints and above</li>
          <li>Button Text is capped at 18px (text-lg) for xl breakpoints and above</li>
        </ul>
        <p className="mt-4 text-gray-600">
          These caps ensure text remains at a comfortable reading size even on very large screens,
          and they align with the site's max-width container.
        </p>
      </div>
      
      {/* Example Composition */}
      <div className="mt-16 p-8 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Example Composition</h2>
        
        <div className="bg-gray-50 p-8 rounded-lg">
          <H1 className="mb-4">Welcome to RealTechee</H1>
          <H3 className="mb-6">Your partner in property enhancement and renovation</H3>
          <P1 className="mb-8">
            RealTechee helps real estate professionals prepare homes for sale with strategic renovations
            that increase property value. Our comprehensive platform connects agents, contractors, and 
            homeowners through a transparent process.
          </P1>
          <H2 className="mb-4">Our Services</H2>
          <P1 className="mb-4">
            We offer a full range of renovation services tailored to maximize your property's appeal and value.
          </P1>
          <P3>
            Contact our team today to learn how we can help you sell homes faster and at higher prices.
          </P3>
          <div className="mt-8">
            <Button variant="primary">
              <P2>Get Started</P2>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTypographyShowcase;