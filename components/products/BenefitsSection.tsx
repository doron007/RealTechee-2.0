import React from 'react';
import Image from 'next/image';
import P3 from '../typography/P3';
import H2 from '../typography/H2';
import H3 from '../typography/H3';
import P2 from '../typography/P2';
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
    sectionLabel: "REVOLUTIONIZING BUYING FOR CLIENTS & AGENTS",
    title: "Enhance Client Value, Attract More Business",
    benefits: [
      {
        icon: "/assets/icons/prd-buyers-benefit-top.svg",
        items: [
          {
            title: "Expand Property Options",
            content: "Qualify your clients for more properties that align with their budget by leveraging cost-effective home improvements."
          },
          {
            title: "48-Hour Estimates",
            content: "Provide swift quotes to your buyers within 48 hours, kickstarting home improvement projects promptly and impressing your clients."
          },
          {
            title: "Revenue Share",
            content: "Boost your income effortlessly as Realtechee rewards your partnership with a generous RevShare on every signed contract."
          }
        ]
      },
      {
        icon: "/assets/icons/prd-buyers-benefit-bottom.svg",
        items: [
          {
            title: "Project Transparency",
            content: "You and your client can monitor daily progress, view before and after photos, track project stages, review scope of work, and payment terms online, anytime."
          },
          {
            title: "Increased Lead Conversion",
            content: "Deliver added value to homeowners, boosting your or your teams lead conversion rates in the real estate purchasing market."
          },
          {
            title: "Streamline Property Purchase",
            content: "Accelerate your property buying process, efficiently remodel within your budget, and stay on track with your project timeline."
          }
        ]
      }
    ]
  },
  [ProductType.KITCHEN_BATH]: {
    sectionLabel: "FEATURES",
    title: "Offer More Value to Your Customers and Grow Your Business - Attract More Customers",
    benefits: [
      {
        icon: "/assets/icons/prd-kb-benefit-top.svg",
        items: [
          {
            title: "Online Presence Boost",
            content: "Elevate your digital presence and promote your brand across extensive marketing channels."
          },
          {
            title: "Lead Generation",
            content: "Identify and generate more leads, boosted by RealTechee's marketing channels and dashboard tools to attract more clients."
          },
          {
            title: "Online Platform",
            content: "Seamlessly work with contractors and homeowners using our user-friendly dashboard and project management tools."
          }
        ]
      },
      {
        icon: "/assets/icons/prd-kb-benefit-bottom.svg",
        items: [
          {
            title: "Exclusive Program Access",
            content: "Elevate your competitive edge by offering clients exclusive access to RealTechee's remodeling concierge program."
          },
          {
            title: "Revenue Share",
            content: "Increase your profitability potential thanks to non-product income streams generated via RealTechee's innovative platform."
          },
          {
            title: "Flexible Financing Options",
            content: "Access tailored financing solutions to accommodate your project needs, ensuring financial flexibility for you and your clients."
          }
        ]
      }
    ]
  },
  [ProductType.COMMERCIAL]: {
    sectionLabel: "FEATURES",
    title: "Accessible Solutions to Maximize Returns in Commercial Real Estate",
    benefits: [
      {
        icon: "/assets/icons/prd-com-benefit-top.svg",
        items: [
          {
            title: "Versatile Commercial Solutions",
            content: "Access a wide range of tailored services for commercial real estate, covering tenant improvements, renovations, new construction, and property development, all through a unified platform."
          },
          {
            title: "Immersive Virtual Walkthroughs",
            content: "Experience detailed virtual walkthroughs that allow stakeholders to understand project progress and design in-depth, ensuring alignment at every stage of your project."
          },
          {
            title: "Project Timeline Management",
            content: "Efficiently manage project timelines and milestones to ensure on-time project delivery and client satisfaction."
          }
        ]
      },
      {
        icon: "/assets/icons/prd-com-benefit-bottom.svg",
        items: [
          {
            title: "Revenue Sharing Opportunity",
            content: "Boost profitability with a revenue share on all customer referrals."
          },
          {
            title: "Collaboration Tools",
            content: "Leverage user-friendly communication tools for seamless collaboration among contractors, developers, and property owners, streamlining project coordination."
          },
          {
            title: "Flexible Financing Solutions",
            content: "Enjoy access to flexible financing options specifically structured to meet the unique needs of commercial projects. In addition to Zero out of pocket programs for commercial real estate transactions - paid at close of escrow."
          }
        ]
      }
    ]
  },
  [ProductType.ARCHITECT_DESIGNER]: {
    sectionLabel: "FEATURES",
    title: "Your Partner in Simplifying the Design-Build Journey",
    benefits: [
      {
        icon: "/assets/icons/prd-ad-benefit-top.svg",
        items: [
          {
            title: "Digital Collaboration Platform",
            content: "Work cohesively with clients, contractors, and project managers on our digital platform."
          },
          {
            title: "Personalized Project Dashboard",
            content: "Effectively manage and monitor your projects using a personalized dashboard, offering real-time insights to your clients."
          },
          {
            title: "Immersive Virtual Walk-Throughs",
            content: "Watch your designs come to life through live virtual walk-throughs during renovations, ensuring a smooth transition from concept to reality."
          }
        ]
      },
      {
        icon: "/assets/icons/prd-ad-benefit-bottom.svg",
        items: [
          {
            title: "Marketing Channel Access",
            content: "Collaborate with RealTechee to extend your brand's reach through our diverse marketing channels, attracting a broader range of design clients."
          },
          {
            title: "Flexible Financing Solutions",
            content: "Realtechee provides you with the ability to secure tailored financing options for their clients, ensuring that projects align with budget constraints and financial goals."
          },
          {
            title: "New Revenue Vertical",
            content: "Elevate your financial standing with Realtechee's unique revenue-sharing program, generating additional non-product income streams."
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
      marginTop={0}
      marginBottom={0}
      paddingTop={{ default: 24, md: 80, '2xl': 100 }}
      paddingBottom={{ default: 74, md: 130, '2xl': 150 }}
    >
      {/* Header section */}
      <div className="text-center m-24 animate-on-scroll">
        <P3 className="text-[#FF5F45] mb-2 uppercase tracking-wider">{finalSectionLabel}</P3>
        <H2 className="text-white mb-4">{finalTitle}</H2>
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
                    <H3 className="text-white mb-0.5">{item.title}</H3>
                    <P2 className="text-white/80 mb-0.5">{item.content}</P2>
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
                      <H3 className="text-white mb-0.5">{item.title}</H3>
                      <P2 className="text-white/80 mb-0.5">{item.content}</P2>
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