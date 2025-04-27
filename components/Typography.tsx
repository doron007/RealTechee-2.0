import React, { ReactElement } from 'react';

export default function Typography(): ReactElement {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-4xl font-bold mb-10 font-heading">RealTechee Typography Guide</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-very-light-gray">Headings</h2>
        <div className="space-y-6">
          <div className="py-3">
            <h1 className="heading-1">H1 Heading</h1>
            <p className="text-sm text-medium-gray mt-1">Font: Nunito Sans | Weight: Normal | Line Height: 57.60px | Size: text-5xl</p>
          </div>
          <div className="py-3">
            <h2 className="heading-2">H2 Heading</h2>
            <p className="text-sm text-medium-gray mt-1">Font: Nunito Sans | Weight: Normal | Line Height: leading-10 | Size: text-4xl</p>
          </div>
          <div className="py-3">
            <h3 className="heading-3">H3 Heading</h3>
            <p className="text-sm text-medium-gray mt-1">Font: Nunito Sans | Weight: Normal | Line Height: leading-9 | Size: text-3xl</p>
          </div>
          <div className="py-3">
            <h4 className="heading-4">H4 Heading</h4>
            <p className="text-sm text-medium-gray mt-1">Font: Nunito Sans | Weight: Normal | Line Height: 120px | Size: text-2xl</p>
          </div>
          <div className="py-3">
            <h5 className="heading-5">H5 Heading</h5>
            <p className="text-sm text-medium-gray mt-1">Font: Nunito Sans | Weight: Normal | Line Height: normal | Size: text-xl</p>
          </div>
          <div className="py-3">
            <h6 className="heading-6">H6 Heading</h6>
            <p className="text-sm text-medium-gray mt-1">Font: Nunito Sans | Weight: Normal | Line Height: tight | Size: text-base</p>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-very-light-gray">Paragraphs</h2>
        <div className="space-y-6">
          <div className="py-3">
            <p className="paragraph-1">P1 - This is a paragraph text in text-xl size.</p>
            <p className="text-sm text-medium-gray mt-1">Font: Roboto | Weight: Normal | Size: text-xl | Line Height: loose</p>
          </div>
          <div className="py-3">
            <p className="paragraph-2">P2 - This is a paragraph text in text-base size.</p>
            <p className="text-sm text-medium-gray mt-1">Font: Roboto | Weight: Normal | Size: text-base | Line Height: relaxed</p>
          </div>
          <div className="py-3">
            <p className="paragraph-3">P3 - This is a paragraph text in text-xs size.</p>
            <p className="text-sm text-medium-gray mt-1">Font: Roboto | Weight: Normal | Size: text-xs | Line Height: tight</p>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-very-light-gray">Brand Typography</h2>
        <div className="space-y-6">
          <div className="py-3">
            <p className="brand-title">Brand Title</p>
            <p className="text-sm text-medium-gray mt-1">Font: Inter | Weight: Bold | Size: 39pt</p>
          </div>
          <div className="py-3">
            <p className="brand-subtitle">Brand Subtitle for secondary information</p>
            <p className="text-sm text-medium-gray mt-1">Font: Inter | Weight: Regular | Size: 18pt | Color: Neutral 400</p>
          </div>
          <div className="py-3">
            <p className="brand-identity">Brand Identity Text in Playfair Display</p>
            <p className="text-sm text-medium-gray mt-1">Font: Playfair Display | Weight: Regular | Size: 14pt | Color: Neutral 400</p>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-very-light-gray">Content & UI Typography</h2>
        <div className="space-y-6">
          <div className="py-3">
            <h3 className="content-title">Content Title</h3>
            <p className="text-sm text-medium-gray mt-1">Font: Nunito Sans | Weight: SemiBold | Size: 48pt</p>
          </div>
          <div className="py-3">
            <p className="content-body">Content body text used for descriptive paragraphs on landing pages and important sections.</p>
            <p className="text-sm text-medium-gray mt-1">Font: Roboto | Weight: Regular | Size: 20pt | Line Height: 1.6</p>
          </div>
          <div className="py-3">
            <p className="btn-text">Button Text</p>
            <p className="text-sm text-medium-gray mt-1">Font: Inter | Weight: Medium | Size: 16pt</p>
          </div>
          <div className="py-3">
            <p className="menu-text">Menu Navigation Text</p>
            <p className="text-sm text-medium-gray mt-1">Font: Inter | Weight: Medium | Size: 14pt</p>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-very-light-gray">Buttons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="py-3">
            <button className="btn btn-primary">Primary Button</button>
            <p className="text-sm text-medium-gray mt-3">Primary Button: Black background with white text</p>
          </div>
          <div className="py-3">
            <button className="btn btn-secondary">Secondary Button</button>
            <p className="text-sm text-medium-gray mt-3">Secondary Button: Dark gray background with white text</p>
          </div>
          <div className="py-3">
            <button className="btn btn-outline">Outline Button</button>
            <p className="text-sm text-medium-gray mt-3">Outline Button: Transparent with black border and text</p>
          </div>
          <div className="py-3">
            <button className="btn btn-accent-1">Accent 1 Button</button>
            <p className="text-sm text-medium-gray mt-3">Accent 1 Button: Red (#D11919) with white text</p>
          </div>
          <div className="py-3">
            <button className="btn btn-accent-2">Accent 2 Button</button>
            <p className="text-sm text-medium-gray mt-3">Accent 2 Button: Coral/Orange (#E9664A) with white text</p>
          </div>
          <div className="py-3">
            <button className="btn btn-accent-3">Accent 3 Button</button>
            <p className="text-sm text-medium-gray mt-3">Accent 3 Button: Yellow (#FFB900) with black text</p>
          </div>
          <div className="py-3">
            <button className="btn btn-accent-4">Accent 4 Button</button>
            <p className="text-sm text-medium-gray mt-3">Accent 4 Button: Teal (#3BE8B0) with black text</p>
          </div>
          <div className="py-3">
            <button className="btn btn-accent-5">Accent 5 Button</button>
            <p className="text-sm text-medium-gray mt-3">Accent 5 Button: Blue (#17619C) with white text</p>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-very-light-gray">Color Palette</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-md bg-black text-white">
            <p className="font-bold">Black</p>
            <p className="text-sm">#151515</p>
          </div>
          <div className="p-4 rounded-md bg-dark-gray text-white">
            <p className="font-bold">Dark Gray</p>
            <p className="text-sm">#2A2B2E</p>
          </div>
          <div className="p-4 rounded-md bg-medium-gray text-white">
            <p className="font-bold">Medium Gray</p>
            <p className="text-sm">#6E6E73</p>
          </div>
          <div className="p-4 rounded-md bg-light-gray text-black">
            <p className="font-bold">Light Gray</p>
            <p className="text-sm">#919191</p>
          </div>
          <div className="p-4 rounded-md bg-very-light-gray text-black">
            <p className="font-bold">Very Light Gray</p>
            <p className="text-sm">#E4E4E4</p>
          </div>
          <div className="p-4 rounded-md bg-off-white text-black">
            <p className="font-bold">Off White</p>
            <p className="text-sm">#F9F4F3</p>
          </div>
          <div className="p-4 rounded-md bg-white text-black border border-very-light-gray">
            <p className="font-bold">White</p>
            <p className="text-sm">#FFFFFF</p>
          </div>
          <div className="p-4 rounded-md bg-accent-1 text-white">
            <p className="font-bold">Accent 1</p>
            <p className="text-sm">#D11919</p>
          </div>
          <div className="p-4 rounded-md bg-accent-2 text-white">
            <p className="font-bold">Accent 2</p>
            <p className="text-sm">#E9664A</p>
          </div>
          <div className="p-4 rounded-md bg-accent-3 text-black">
            <p className="font-bold">Accent 3</p>
            <p className="text-sm">#FFB900</p>
          </div>
          <div className="p-4 rounded-md bg-accent-4 text-black">
            <p className="font-bold">Accent 4</p>
            <p className="text-sm">#3BE8B0</p>
          </div>
          <div className="p-4 rounded-md bg-accent-5 text-white">
            <p className="font-bold">Accent 5</p>
            <p className="text-sm">#17619C</p>
          </div>
        </div>
      </section>
    </div>
  );
}