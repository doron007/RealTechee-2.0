import React, { ReactNode, ReactElement } from 'react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export const Heading1: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h1 className={`heading-1 ${className}`}>{children}</h1>
);

export const Heading2: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h2 className={`heading-2 ${className}`}>{children}</h2>
);

export const Heading3: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h3 className={`heading-3 ${className}`}>{children}</h3>
);

export const Heading4: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h4 className={`heading-4 ${className}`}>{children}</h4>
);

export const Heading5: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h5 className={`heading-5 ${className}`}>{children}</h5>
);

export const Heading6: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h6 className={`heading-6 ${className}`}>{children}</h6>
);

export const SectionLabel: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <div className={`section-label ${className}`}>{children}</div>
);

export const SubtitlePill: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <div className={`subtitle-pill ${className}`}>{children}</div>
);

export const BodyText: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <p className={`body-text ${className}`}>{children}</p>
);

export const BodyTextSecondary: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <p className={`body-text-secondary ${className}`}>{children}</p>
);

export const CardTitle: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h3 className={`card-title ${className}`}>{children}</h3>
);

export const CardSubtitle: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <h4 className={`card-subtitle ${className}`}>{children}</h4>
);

export const CardText: React.FC<TypographyProps> = ({ children, className = '' }) => (
  <p className={`card-text ${className}`}>{children}</p>
);

export default function Typography(): ReactElement {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <Heading1 className="mb-10 font-heading">RealTechee Typography Guide</Heading1>
      
      <section className="mb-12">
        <Heading2 className="mb-6 pb-2 border-b border-very-light-gray">Headings</Heading2>
        <div className="space-y-6">
          <div className="py-3">
            <Heading1>H1 Heading</Heading1>
            <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Normal | Line Height: 57.60px | Size: text-5xl</BodyTextSecondary>
          </div>
          <div className="py-3">
            <Heading2>H2 Heading</Heading2>
            <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Normal | Line Height: leading-10 | Size: text-4xl</BodyTextSecondary>
          </div>
          <div className="py-3">
            <Heading3>H3 Heading</Heading3>
            <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Normal | Line Height: leading-9 | Size: text-3xl</BodyTextSecondary>
          </div>
          <div className="py-3">
            <Heading4>H4 Heading</Heading4>
            <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Normal | Line Height: 120px | Size: text-2xl</BodyTextSecondary>
          </div>
          <div className="py-3">
            <Heading5>H5 Heading</Heading5>
            <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Normal | Line Height: normal | Size: text-xl</BodyTextSecondary>
          </div>
          <div className="py-3">
            <Heading6>H6 Heading</Heading6>
            <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: Normal | Line Height: tight | Size: text-base</BodyTextSecondary>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <Heading2 className="mb-6 pb-2 border-b border-very-light-gray">Paragraphs</Heading2>
        <div className="space-y-6">
          <div className="py-3">
            <BodyText className="paragraph-1">P1 - This is a paragraph text in text-xl size.</BodyText>
            <BodyTextSecondary className="mt-1">Font: Roboto | Weight: Normal | Size: text-xl | Line Height: loose</BodyTextSecondary>
          </div>
          <div className="py-3">
            <BodyText className="paragraph-2">P2 - This is a paragraph text in text-base size.</BodyText>
            <BodyTextSecondary className="mt-1">Font: Roboto | Weight: Normal | Size: text-base | Line Height: relaxed</BodyTextSecondary>
          </div>
          <div className="py-3">
            <BodyText className="paragraph-3">P3 - This is a paragraph text in text-xs size.</BodyText>
            <BodyTextSecondary className="mt-1">Font: Roboto | Weight: Normal | Size: text-xs | Line Height: tight</BodyTextSecondary>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <Heading2 className="mb-6 pb-2 border-b border-very-light-gray">Brand Typography</Heading2>
        <div className="space-y-6">
          <div className="py-3">
            <BodyText className="brand-title">Brand Title</BodyText>
            <BodyTextSecondary className="mt-1">Font: Inter | Weight: Bold | Size: 39pt</BodyTextSecondary>
          </div>
          <div className="py-3">
            <BodyText className="brand-subtitle">Brand Subtitle for secondary information</BodyText>
            <BodyTextSecondary className="mt-1">Font: Inter | Weight: Regular | Size: 18pt | Color: Neutral 400</BodyTextSecondary>
          </div>
          <div className="py-3">
            <BodyText className="brand-identity">Brand Identity Text in Playfair Display</BodyText>
            <BodyTextSecondary className="mt-1">Font: Playfair Display | Weight: Regular | Size: 14pt | Color: Neutral 400</BodyTextSecondary>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <Heading2 className="mb-6 pb-2 border-b border-very-light-gray">Content & UI Typography</Heading2>
        <div className="space-y-6">
          <div className="py-3">
            <Heading3 className="content-title">Content Title</Heading3>
            <BodyTextSecondary className="mt-1">Font: Nunito Sans | Weight: SemiBold | Size: 48pt</BodyTextSecondary>
          </div>
          <div className="py-3">
            <BodyText className="content-body">Content body text used for descriptive paragraphs on landing pages and important sections.</BodyText>
            <BodyTextSecondary className="mt-1">Font: Roboto | Weight: Regular | Size: 20pt | Line Height: 1.6</BodyTextSecondary>
          </div>
          <div className="py-3">
            <BodyText className="btn-text">Button Text</BodyText>
            <BodyTextSecondary className="mt-1">Font: Inter | Weight: Medium | Size: 16pt</BodyTextSecondary>
          </div>
          <div className="py-3">
            <BodyText className="menu-text">Menu Navigation Text</BodyText>
            <BodyTextSecondary className="mt-1">Font: Inter | Weight: Medium | Size: 14pt</BodyTextSecondary>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <Heading2 className="mb-6 pb-2 border-b border-very-light-gray">Buttons</Heading2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="py-3">
            <button className="btn btn-primary">Primary Button</button>
            <BodyTextSecondary className="mt-3">Primary Button: Black background with white text</BodyTextSecondary>
          </div>
          <div className="py-3">
            <button className="btn btn-secondary">Secondary Button</button>
            <BodyTextSecondary className="mt-3">Secondary Button: Dark gray background with white text</BodyTextSecondary>
          </div>
          <div className="py-3">
            <button className="btn btn-outline">Outline Button</button>
            <BodyTextSecondary className="mt-3">Outline Button: Transparent with black border and text</BodyTextSecondary>
          </div>
          <div className="py-3">
            <button className="btn btn-accent-1">Accent 1 Button</button>
            <BodyTextSecondary className="mt-3">Accent 1 Button: Red (#D11919) with white text</BodyTextSecondary>
          </div>
          <div className="py-3">
            <button className="btn btn-accent-2">Accent 2 Button</button>
            <BodyTextSecondary className="mt-3">Accent 2 Button: Coral/Orange (#E9664A) with white text</BodyTextSecondary>
          </div>
          <div className="py-3">
            <button className="btn btn-accent-3">Accent 3 Button</button>
            <BodyTextSecondary className="mt-3">Accent 3 Button: Yellow (#FFB900) with black text</BodyTextSecondary>
          </div>
          <div className="py-3">
            <button className="btn btn-accent-4">Accent 4 Button</button>
            <BodyTextSecondary className="mt-3">Accent 4 Button: Teal (#3BE8B0) with black text</BodyTextSecondary>
          </div>
          <div className="py-3">
            <button className="btn btn-accent-5">Accent 5 Button</button>
            <BodyTextSecondary className="mt-3">Accent 5 Button: Blue (#17619C) with white text</BodyTextSecondary>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <Heading2 className="mb-6 pb-2 border-b border-very-light-gray">Color Palette</Heading2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-md bg-black text-white">
            <BodyText className="font-bold">Black</BodyText>
            <BodyTextSecondary>#151515</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-dark-gray text-white">
            <BodyText className="font-bold">Dark Gray</BodyText>
            <BodyTextSecondary>#2A2B2E</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-medium-gray text-white">
            <BodyText className="font-bold">Medium Gray</BodyText>
            <BodyTextSecondary>#6E6E73</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-light-gray text-black">
            <BodyText className="font-bold">Light Gray</BodyText>
            <BodyTextSecondary>#919191</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-very-light-gray text-black">
            <BodyText className="font-bold">Very Light Gray</BodyText>
            <BodyTextSecondary>#E4E4E4</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-off-white text-black">
            <BodyText className="font-bold">Off White</BodyText>
            <BodyTextSecondary>#F9F4F3</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-white text-black border border-very-light-gray">
            <BodyText className="font-bold">White</BodyText>
            <BodyTextSecondary>#FFFFFF</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-accent-1 text-white">
            <BodyText className="font-bold">Accent 1</BodyText>
            <BodyTextSecondary>#D11919</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-accent-2 text-white">
            <BodyText className="font-bold">Accent 2</BodyText>
            <BodyTextSecondary>#E9664A</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-accent-3 text-black">
            <BodyText className="font-bold">Accent 3</BodyText>
            <BodyTextSecondary>#FFB900</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-accent-4 text-black">
            <BodyText className="font-bold">Accent 4</BodyText>
            <BodyTextSecondary>#3BE8B0</BodyTextSecondary>
          </div>
          <div className="p-4 rounded-md bg-accent-5 text-white">
            <BodyText className="font-bold">Accent 5</BodyText>
            <BodyTextSecondary>#17619C</BodyTextSecondary>
          </div>
        </div>
      </section>
    </div>
  );
}