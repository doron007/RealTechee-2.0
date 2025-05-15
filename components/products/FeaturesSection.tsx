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
    sectionLabel: "SELLER FEATURES",
    title: "Empower Your Sellers with Hassle-Free Renovations",
    features: [
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Dashboard",
        description: "For agents to manage and view all projects."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Gallery",
        description: "Homeowners view transformative before and after photos."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Realtime",
        description: "Project progress, scope, and payment terms available daily."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Communication",
        description: "Live chat for homeowners, agents, and project managers."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Booster",
        description: "Property owners pay preparation fees at close with $0 upfront."
      }
    ]
  },
  [ProductType.BUYER]: {
    sectionLabel: "BUYER FEATURES",
    title: "Expand Options for Your Buyers with Renovation Solutions",
    features: [
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Visualize Potential",
        description: "Help buyers see the hidden potential in properties that need renovation, expanding their options."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Accurate Cost Estimation",
        description: "Provide buyers with detailed, transparent quotes for renovation work before they purchase."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Post-Purchase Support",
        description: "Seamless renovation execution after closing, transforming the property to match buyer expectations."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Financing Solutions",
        description: "Multiple financing options to help buyers include renovation costs in their mortgage."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Design Assistance",
        description: "Professional design support to help buyers make their new home exactly what they want."
      }
    ]
  },
  [ProductType.KITCHEN_BATH]: {
    sectionLabel: "KITCHEN & BATH FEATURES",
    title: "Enhance Your Showroom with Premium Remodeling Services",
    features: [
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Expanded Service Options",
        description: "Offer complete remodeling services to customers beyond product sales."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Increased Revenue",
        description: "Generate additional revenue streams without expanding your operational footprint."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Technical Support",
        description: "Access our team of experts for technical guidance on complex projects."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Quality Assurance",
        description: "Maintain your reputation with our vetted contractors and quality control processes."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Simplified Process",
        description: "Our technology streamlines project management from quote to completion."
      }
    ]
  },
  [ProductType.COMMERCIAL]: {
    sectionLabel: "COMMERCIAL FEATURES",
    title: "Optimize Your Commercial Properties with Our Renovation Solutions",
    features: [
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Tenant Improvements",
        description: "Custom renovation solutions to attract and retain quality tenants."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Value Enhancement",
        description: "Strategic improvements that increase property value and rental income."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Project Management",
        description: "Comprehensive oversight from planning to execution, minimizing disruption."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Financing Options",
        description: "Flexible financing solutions designed specifically for commercial renovations."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Compliance Expertise",
        description: "Navigate commercial building codes and regulations with our experienced team."
      }
    ]
  },
  [ProductType.ARCHITECT_DESIGNER]: {
    sectionLabel: "ARCHITECT & DESIGNER FEATURES",
    title: "Bring Your Designs to Life with Seamless Execution",
    features: [
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Design Focus",
        description: "Focus on creating exceptional designs while we handle the construction logistics."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Project Coordination",
        description: "Streamlined communication between design vision and construction execution."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Expanded Services",
        description: "Offer clients a complete design-to-build solution without expanding your team."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Quality Craftsmanship",
        description: "Our vetted contractors ensure your designs are executed with precision."
      },
      {
        icon: "/assets/icons/vuesax-bold-tick-circle.svg",
        title: "Client Satisfaction",
        description: "Enhance client experience with smooth transitions from concept to completion."
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

  return (
    <Section
      background="white"
      spacing="medium"
      id="features"
      className={className}
    >
      <div className="text-center mb-12 animate-on-scroll">
        <SubContent className="text-[#FF5F45] mb-2">{finalSectionLabel}</SubContent>
        <Subtitle className="mb-6">{finalTitle}</Subtitle>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {finalFeatures.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            className="animate-on-scroll"
          />
        ))}
      </div>
    </Section>
  );
}