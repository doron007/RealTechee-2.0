import React from 'react';
import { SectionTitle, CardTitle, CardSubtitle, CardContent } from '../';
import { Card } from '../common/ui';

export default function CardShowcase() {
  return (
    <div className="mt-16">
      <SectionTitle className="mb-8">Card Components</SectionTitle>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="text-xl font-bold mb-4">Default Card</h3>
          <Card
            title="Default Card Title"
            content="This is the default card design with standard styling and layout. It provides a clean, simple container for content."
          />
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-4">Feature Card</h3>
          <Card
            variant="feature"
            icon="/assets/icons/vuesax-bold-tick-circle.svg"
            title="Feature Card Title"
            content="Feature cards highlight product capabilities with an icon on the left and text content on the right."
            iconPosition="left"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="text-xl font-bold mb-4">Deal Breaker Card (with hover)</h3>
          <Card
            variant="dealBreaker"
            icon="/assets/icons/home-value.svg"
            title="Deal Breaker Card"
            content="Deal breaker cards feature hover effects that change the background color and text color. They're used to highlight key selling points."
            hasHoverEffect={true}
          />
        </div>
        
        <div className="bg-[#2A2B2E] p-8 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Step Card</h3>
          <Card
            variant="step"
            icon="/assets/icons/step1-icon.svg"
            title="Step Card Title"
            content="Step cards are used in process flows and feature numbered steps with a distinctive dark gradient background."
            step={1}
          />
        </div>
      </div>
      
      <div className="mt-12">
        <h3 className="text-xl font-bold mb-4">Card Typography Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-semibold mb-2">CardTitle</h4>
            <CardTitle>This is a Card Title</CardTitle>
            <p className="mt-2 text-sm text-gray-500">
              Font: Heading font<br />
              Weight: Bold<br />
              Size: Responsive from base (16px) to xl (20px)
            </p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-semibold mb-2">CardSubtitle</h4>
            <CardSubtitle>This is a Card Subtitle</CardSubtitle>
            <p className="mt-2 text-sm text-gray-500">
              Font: Heading font<br />
              Weight: Medium<br />
              Size: Responsive from sm (14px) to lg (18px)
            </p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <h4 className="text-lg font-semibold mb-2">CardContent</h4>
            <CardContent>This is Card Content text which is used for the main descriptive text in cards across the site.</CardContent>
            <p className="mt-2 text-sm text-gray-500">
              Font: Body font<br />
              Weight: Normal<br />
              Size: Responsive from sm (14px) to base (16px)
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 p-6 border border-gray-200 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Card with Multiple Elements</h3>
        <Card
          title={<CardTitle>Custom Card Title</CardTitle>}
          subtitle={<CardSubtitle>Card Subtitle Example</CardSubtitle>}
          content={<CardContent>This example shows how multiple typography components can be used together in a card to create a more complex layout with proper hierarchy.</CardContent>}
          footer={
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Action Button
              </button>
            </div>
          }
          className="max-w-lg"
        />
      </div>
    </div>
  );
}