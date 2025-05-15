import React from 'react';
import { SectionLabel, SectionTitle, Subtitle, SubContent } from '../';
import { FeatureCard } from '../common/ui';
import Section from '../common/layout/Section';
import { ProductType } from './HeroSection'; // Import the ProductType enum

interface Feature {
  icon: string;
  title: string;
  description: string;
}

// Features content configuration for each product type
const FEATURES_CONTENT = {
  [ProductType.SELLER]: {
    sectionLabel: "ONLINE PLATFORM",
    title: "Full Project Visibility for Agents and Homeowners",
    features: [
      {
        icon: "/assets/icons/prd-sellers-dashboard.svg",
        title: "Dashboard",
        description: "For agents to manage and view all projects."
      },
      {
        icon: "/assets/icons/prd-sellers-gallery.svg",
        title: "Gallery",
        description: "Homeowners view transformative before and after photos."
      },
      {
        icon: "/assets/icons/prd-sellers-realtime.svg",
        title: "Realtime",
        description: "Project progress, scope, and payment terms available daily."
      },
      {
        icon: "/assets/icons/prd-sellers-communication.svg",
        title: "Communication",
        description: "Live chat for homeowners, agents, and project managers."
      },
      {
        icon: "/assets/icons/prd-sellers-booster.svg",
        title: "Booster",
        description: "Property owners pay preparation fees at close with $0 upfront."
      }
    ]
  },
  [ProductType.BUYER]: {
    sectionLabel: "FEATURES",
    title: "Elevated Home Buying Experience for Agents & Clients",
    features: [
      {
        icon: "/assets/icons/prd-buyers-dash.svg",
        title: "Dashboard Management",
        description: "Agents can efficiently manage and monitor all client projects."
      },
      {
        icon: "/assets/icons/prd-buyers-visual.svg",
        title: "Transformative Visuals",
        description: "Delight homeowners with jaw-dropping before and after photos"
      },
      {
        icon: "/assets/icons/prd-buyers-realtime.svg",
        title: "Real-Time Updates",
        description: "Stay informed with daily updates on project progress, scope, and payment terms."
      },
      {
        icon: "/assets/icons/prd-buyers-communication.svg",
        title: "Seamless Communication",
        description: "Utilize our live chat feature for instant communication between project stakeholders."
      },
      {
        icon: "/assets/icons/prd-buyers-booster.svg",
        title: "Booster",
        description: "Transform your clients' vision into reality while closing more deals effortlessly."
      },
      {
        icon: "/assets/icons/prd-buyers-ai-ml.svg",
        title: "AI & Machine Learning",
        description: "Post-sale renovation decisions are AI-optimized to ensure the lowest cost and largest increase to home value."
      }
    ]
  },
  [ProductType.KITCHEN_BATH]: {
    sectionLabel: "FOR SHOWROOMS, ARCHITECTS, & DESIGNERS",
    title: "How it Works",
    features: [
      {
        icon: "/assets/icons/prd-kb-training.svg",
        title: "Guided Training",
        description: "We provide comprehensive training for you and your sales team to harness the full potential of our program, ensuring a smooth and effective integration into your workflow."
      },
      {
        icon: "/assets/icons/prd-kb-dash.svg",
        title: "Tailored Dashboard",
        description: "Access a showroom dashboard on our platform that is purpose-built for your sales team and offers an intuitive interface for effortless management."
      },
      {
        icon: "/assets/icons/prd-kb-support.svg",
        title: "Dedicated Support",
        description: "You'll be assigned an Account Executive, and a Dedicated Project Manager committed to delivering personalized assistance and ensuring the success of your projects."
      },
      {
        icon: "/assets/icons/prd-kb-realtime.svg",
        title: "Real-Time Visibility",
        description: "RealTechee's cutting-edge platform delivers real-time visibility throughout the entire project lifecycle, enabling you and the homeowners to stay informed, drive better results, and enhance the overall user experience."
      }
    ]
  },
  [ProductType.COMMERCIAL]: {
    sectionLabel: "FOR AGENTS, PROPERTY OWNERS, LANDLORDS, TENANTS, DEVELOPERS AND MANAGEMENT COMPANIES",
    title: "How it Works",
    features: [
      {
        icon: "/assets/icons/prd-com-onboard.svg",
        title: "Effortless Onboarding",
        description: "Our streamlined onboarding process, coupled with comprehensive training, ensures seamless integration of our program into your commercial real estate operations, minimizing disruptions and maximizing efficiency."
      },
      {
        icon: "/assets/icons/prd-com-pm.svg",
        title: "Transparent Project Management",
        description: "RealTechee provides specialized project management tools accessible through a tailored dashboard designed to meet your commercial projects' complex needs, from tenant improvements to new developments, ensuring precise oversight."
      }, 
      {
        icon: "/assets/icons/prd-com-partner.svg",
        title: "Dedicated Support Partners",
        description: "Benefit from the guidance of a dedicated Account Executive and Project Manager committed to offering personalized assistance, guaranteeing flawless project execution."
      }, 
      {
        icon: "/assets/icons/prd-com-realtime.svg",
        title: "Real-Time Progress Insights",
        description: "Gain immediate access to vital project data through our platform, allowing you, your clients, and other stakeholders to make informed decisions swiftly, enhance transparency, foster collaboration, and elevate the user experience."
      }
    ]
  },
  [ProductType.ARCHITECT_DESIGNER]: {
    sectionLabel: "OUR APPROVED VENDORS EXECUTE YOUR DESIGNS WITH REAL-TIME UPDATES AND COLLABORATION, PROVIDING END-TO-END VALUE FOR YOUR CLIENTS.",
    title: "How it Works",
    features: [
      {
        icon: "/assets/icons/prd-ad-training.svg",
        title: "Proficiency Training",
        description: "We offer specialized training programs to empower you and your team with the skills and knowledge necessary to fully leverage our program."
      },
      {
        icon: "/assets/icons/prd-ad-dashboard.svg",
        title: "Designer Dashboard",
        description: "Thoughtfully curated for your product selection process, vision, and personal touch, providing an intuitive interface for efficient project management."
      },
      {
        icon: "/assets/icons/prd-ad-expert.svg",
        title: "Assigned Expertise",
        description: "Your dedicated team consists of a personal Account Executive and a committed Project Manager to ensure the successful execution of your design projects."
      },
      {
        icon: "/assets/icons/prd-ad-proj.svg",
        title: "Live Project Oversight",
        description: "Enjoy real-time project visibility throughout every project lifecycle stage. This ensures that you and your clients remain in the know."
      }
    ]
  }
};

interface FeaturesSectionProps {
  className?: string;
  productType: ProductType;
  // Optional overrides
  sectionLabel?: string;
  title?: string;
  features?: Feature[];
}

export default function FeaturesSection({
  className = '',
  productType,
  sectionLabel,
  title,
  features,
}: FeaturesSectionProps) {
  // Get content for the current product type
  const content = FEATURES_CONTENT[productType];

  // Use provided overrides or fall back to content from configuration
  const finalSectionLabel = sectionLabel || content.sectionLabel;
  const finalTitle = title || content.title;
  const finalFeatures = features || content.features;
  
  // Calculate the optimal layout for desktop view based on the number of cards
  const getCardWidthClass = (totalFeatures: number) => {
    // For mobile and small screens, maintain default responsive behavior
    let baseClasses = "animate-on-scroll w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)]";
    
    // For large screens (lg and above), calculate optimal layout
    if (totalFeatures <= 5) {
      // 1-5 cards: Use maximum of 5 columns
      return `${baseClasses} lg:w-[calc(20%-20px)]`;
    } else if (totalFeatures === 6) {
      // 6 cards: 3x3 layout
      return `${baseClasses} lg:w-[calc(33.333%-16px)]`;
    } else if (totalFeatures === 7 || totalFeatures === 8) {
      // 7-8 cards: 4x2 or 4x4 layout
      return `${baseClasses} lg:w-[calc(25%-18px)]`;
    } else if (totalFeatures <= 10) {
      // 9-10 cards: 5x2 or 5x5 layout
      return `${baseClasses} lg:w-[calc(20%-20px)]`;
    } else if (totalFeatures <= 12) {
      // 11-12 cards: 4x3 layout
      return `${baseClasses} lg:w-[calc(25%-18px)]`;
    } else {
      // 13+ cards: 5xN layout
      return `${baseClasses} lg:w-[calc(20%-20px)]`;
    }
  };

  return (
    <Section
      background="white"
      spacing="medium"
      id="features"
      className={className}
      marginTop={50}
      marginBottom={50}
      paddingTop={{ default: 24, md: 80, '2xl': 100 }}
      paddingBottom={{ default: 24, md: 80, '2xl': 100 }}
    >
      <div className="text-center mb-8 md:mb-12 animate-on-scroll">
        <SubContent className="text-[#FF5F45] mb-2">{finalSectionLabel}</SubContent>
        <Subtitle className="mb-4 md:mb-6">{finalTitle}</Subtitle>
      </div>

      <div className="flex flex-wrap justify-center gap-4 md:gap-6">
        {finalFeatures.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            className={`p-6 md:p-4 ${getCardWidthClass(finalFeatures.length)}`}
          />
        ))}
      </div>
    </Section>
  );
}