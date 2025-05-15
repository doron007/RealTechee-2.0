import React from 'react';
import { 
  PageHeader, 
  SectionTitle, 
  Subtitle, 
  BodyContent, 
  SubContent,
  ButtonText
} from '../Typography';
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
          <PageHeader>The quick brown fox jumps over the lazy dog</PageHeader>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>PageHeader</code> - This element adapts from 24px to 48px across breakpoints (capped at 48px)</div>
        </div>
        
        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Section Title</span>
          <SectionTitle>The quick brown fox jumps over the lazy dog</SectionTitle>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>SectionTitle</code> - This element adapts from 20px to 36px across breakpoints (capped at 36px)</div>
        </div>
        
        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Subtitle</span>
          <Subtitle>The quick brown fox jumps over the lazy dog</Subtitle>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>Subtitle</code> - This element adapts from 18px to 24px across breakpoints (capped at 24px)</div>
        </div>
        
        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Body Content</span>
          <BodyContent>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. 
            Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus 
            rhoncus ut eleifend nibh porttitor. Ut in nulla enim.
          </BodyContent>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>BodyContent</code> - This element adapts from 16px to 20px across breakpoints (capped at 20px)</div>
        </div>
        
        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Sub Content</span>
          <SubContent>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. 
            Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus 
            rhoncus ut eleifend nibh porttitor. Ut in nulla enim.
          </SubContent>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>SubContent</code> - This element adapts from 14px to 18px across breakpoints (capped at 18px)</div>
        </div>

        <div className="p-6 border border-gray-200 rounded-lg">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Button Text</span>
          <div className="mt-4 flex flex-col gap-6">
            <ButtonText>The quick brown fox jumps over the lazy dog</ButtonText>
            <div className="flex space-x-4">
              <Button variant="primary">
                <ButtonText>Primary Button</ButtonText>
              </Button>
              <Button variant="secondary">
                <ButtonText>Secondary Button</ButtonText>
              </Button>
              <Button variant="tertiary">
                <ButtonText>Tertiary Button</ButtonText>
              </Button>
            </div>
          </div>
          <div className="mt-2 text-gray-500 text-sm">Component: <code>ButtonText</code> - This element adapts from 14px to 18px across breakpoints (capped at 18px)</div>
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
          <PageHeader className="mb-4">Welcome to RealTechee</PageHeader>
          <Subtitle className="mb-6">Your partner in property enhancement and renovation</Subtitle>
          <BodyContent className="mb-8">
            RealTechee helps real estate professionals prepare homes for sale with strategic renovations
            that increase property value. Our comprehensive platform connects agents, contractors, and 
            homeowners through a transparent process.
          </BodyContent>
          <SectionTitle className="mb-4">Our Services</SectionTitle>
          <BodyContent className="mb-4">
            We offer a full range of renovation services tailored to maximize your property's appeal and value.
          </BodyContent>
          <SubContent>
            Contact our team today to learn how we can help you sell homes faster and at higher prices.
          </SubContent>
          <div className="mt-8">
            <Button variant="primary">
              <ButtonText>Get Started</ButtonText>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTypographyShowcase;