import React from 'react';
import Image from 'next/image';
import { SectionLabel, SectionTitle, Subtitle, BodyContent, SubContent, CardTitle } from '../';
import Section from '../common/layout/Section';
import { ProductType } from './HeroSection'; // Import the ProductType enum

interface Benefit {
  icon: string;
  items: {
    title: string;
    content: string;
  }[];
}

// Benefits content configuration for each product type
const BENEFITS_CONTENT = {
  [ProductType.SELLER]: {
    sectionLabel: "BENEFITS, POWERED BY AI",
    title: "Equipping You with a Suite of Selling Tools",
    benefits: [
      {
        icon: "/assets/icons/prd-sellers-benefit-top.svg",
        items: [
          {
            title: "48-Hour Estimates",
            content: "Bring a quote to your seller within 48 hours, launching your project promptly & delighting the client."
          },
          {
            title: "Streamlined Sales",
            content: "Achieve quicker sales and command higher prices. Elevate your annual volume and income potential through our platform."
          },
          {
            title: "Strengthened Client Bonds",
            content: "Deliver exceptional value to homeowners, leading to increased lead conversion rates."
          }
        ]
      },
      {
        icon: "/assets/icons/prd-sellers-benefit-bottom.svg",
        items: [
          {
            title: "Project Transparency",
            content: "You and your client can track daily progress, before and after photos, project stages, scope of work, and payment terms online, anytime."
          },
          {
            title: "Zero Upfront Costs",
            content: "Revolutionary financing; don't stress about the numbers. RealTechee only gets paid at the close of escrow."
          },
          {
            title: "Enormous Value, Lowest Price",
            content: "Our platform uses machine learning to select the preparations resulting in the highest sale value with the lowest cost to implement."
          }
        ]
      }
    ]
  },
  [ProductType.BUYER]: {
    sectionLabel: "WHY PARTNER WITH US",
    title: "The RealTechee Advantage",
    benefits: [
      {
        icon: "/assets/icons/prd-buyers-benefit-top.svg",
        items: [
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          }
        ]
      },
      {
        icon: "/assets/icons/prd-buyers-benefit-bottom.svg",
        items: [
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          }
        ]
      }
    ]
  },
  [ProductType.KITCHEN_BATH]: {
    sectionLabel: "THE REALTECHEE DIFFERENCE",
    title: "Partner Benefits",
    benefits: [
      {
        icon: "/assets/icons/prd-kb-benefit-top.svg",
        items: [
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          }
        ]
      },
      {
        icon: "/assets/icons/prd-kb-benefit-bottom.svg",
        items: [
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          }
        ]
      }
    ]
  },
  [ProductType.COMMERCIAL]: {
    sectionLabel: "BENEFITS",
    title: "Why Choose Our Commercial Program",
    benefits: [
      {
        icon: "/assets/icons/prd-com-benefit-top.svg",
        items: [
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          }
        ]
      },
      {
        icon: "/assets/icons/prd-com-benefit-bottom.svg",
        items: [
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          }
        ]
      }
    ]
  },
  [ProductType.ARCHITECT_DESIGNER]: {
    sectionLabel: "PARTNERING BENEFITS",
    title: "Grow Your Practice With Us",
    benefits: [
      {
        icon: "/assets/icons/prd-ad-benefit-top.svg",
        items: [
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          }
        ]
      },
      {
        icon: "/assets/icons/prd-ad-benefit-bottom.svg",
        items: [
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          },
          {
            title: "",
            content: ""
          }
        ]
      }
    ]
  }
};

interface BenefitsSectionProps {
  className?: string;
  productType: ProductType;
  // Optional overrides
  sectionLabel?: string;
  title?: string;
  benefits?: Benefit[];
}

export default function BenefitsSection({
  className = '',
  productType,
  sectionLabel,
  title,
  benefits,
}: BenefitsSectionProps) {
  // Get content for the current product type
  const content = BENEFITS_CONTENT[productType];

  // Use provided overrides or fall back to content from configuration
  const finalSectionLabel = sectionLabel || content.sectionLabel;
  const finalTitle = title || content.title;
  const finalBenefits = benefits || content.benefits;

  return (
    <Section
      spacing="medium"
      id="benefits"
      background="gray"
      className={`${className}`}
      marginTop={50}
      marginBottom={50}
      paddingTop={{ default: 24, md: 80, '2xl': 100 }}
      paddingBottom={{ default: 24, md: 80, '2xl': 100 }}
    >
      {/* Header section */}
      <div className="text-center m-24 animate-on-scroll">
        <SubContent className="text-[#FF5F45] mb-2">{finalSectionLabel}</SubContent>
        <Subtitle className="text-white mb-4">{finalTitle}</Subtitle>
      </div>
      
      {/* Benefits content section - compressed vertical spacing */}
      <div className="flex flex-col space-y-10">
        {/* First row - 55/45 split on desktop, vertical on mobile */}
        <div className="w-full flex flex-col sm:flex-row">
          {/* Left div - 55% on desktop, 100% on mobile - Big image */}
          <div className="w-full sm:w-[55%] sm:pr-8 mb-6 sm:mb-0 order-1 sm:order-1">
            <Image 
              src={finalBenefits[0].icon}
              alt="Benefits illustration"
              width={700}
              height={350}
              className="w-full h-auto"
            />
          </div>
          
          {/* Right div - 45% on desktop, 100% on mobile - Benefit items */}
          <div className="w-full sm:w-[45%] sm:pl-8 mb-6 sm:mb-12 order-2 sm:order-2">
            <div className="flex flex-col space-y-3">
              {finalBenefits[0].items.map((item, i) => (
                <div key={`top-${i}`} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <Image 
                      src="/assets/icons/ic-tick-circle.svg"
                      alt="Check"
                      width={24}
                      height={24}
                      className="w-full h-full"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white mb-0.5">{item.title}</CardTitle>
                    <BodyContent className="text-white/80 mb-0.5">{item.content}</BodyContent>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Second row - 45/55 split on desktop, vertical on mobile (if there's a second benefit) */}
        {finalBenefits.length > 1 && (
          <div className="w-full flex flex-col sm:flex-row">
            {/* Left div - 45% on desktop, 100% on mobile - Benefit items */}
            <div className="w-full sm:w-[45%] sm:pr-8 mb-6 sm:mb-0 order-2 sm:order-1">
              <div className="flex flex-col space-y-3">
                {finalBenefits[1].items.map((item, i) => (
                  <div key={`bottom-${i}`} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <Image 
                        src="/assets/icons/ic-tick-circle.svg"
                        alt="Check"
                        width={24}
                        height={24}
                        className="w-full h-full"
                        style={{ filter: 'brightness(0) invert(1)' }}
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white mb-0.5">{item.title}</CardTitle>
                      <BodyContent className="text-white/80 mb-0.5">{item.content}</BodyContent>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right div - 55% on desktop, 100% on mobile - Big image */}
            <div className="w-full sm:w-[55%] sm:pl-8 order-1 sm:order-2">
              <Image 
                src={finalBenefits[1].icon}
                alt="Benefits illustration"
                width={700}
                height={350}
                className="w-full h-auto"
              />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}