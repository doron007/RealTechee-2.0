import { useState } from 'react';
import { Section } from '../common/layout';
import { SubContent, Subtitle } from '../Typography';
import { TagLabel } from '../common/ui/TagLabel';
import { BenefitCard } from '../common/ui/BenefitCard';
import { OptionCard } from '../common/ui/OptionCard';
import { ProductType } from './HeroSection'; // Import the ProductType enum

// Define the structure for financing solutions content
interface FinancingSolutionsContent {
  sectionLabel: string;
  title: string;
  benefitCards: {
    title: string;
    description: string;
  }[];
  optionCards?: {
    title: string;
    subtitle: string;
    features: string[];
    variant: 'primary' | 'secondary';
  }[];
}

// Financing solutions content configuration for each product type
const FINANCING_SOLUTIONS_CONTENT: Record<ProductType, FinancingSolutionsContent | null> = {
  [ProductType.SELLER]: {
    sectionLabel: "FINANCING SOLUTIONS",
    title: "RealTechee's Property Booster",
    benefitCards: [
      {
        title: "Zero Upfront Costs",
        description: "RealTechee's Booster eliminates upfront homeowner costs, deferring presale expenses until the close of escrow."
      },
      {
        title: "Finance Collaboration",
        description: "A designated designer and project manager works with the agent and homeowner for optimal results."
      },
      {
        title: "Transparent Progress",
        description: "Experience real-time finance insights for agents and homeowners, ensuring superior outcomes and user experience."
      }
    ],
    optionCards: [
      {
        title: "Booster Upfront",
        subtitle: "No-Financing Hassles",
        features: [
          "Presale home preparation without the need for financing, $0 upfront cost.",
          "Partner with one of our preferred lenders.",
          "Inclusive of all other Booster program benefits."
        ],
        variant: "primary"
      },
      {
        title: "Booster Pro",
        subtitle: "Tailored to Your Preference",
        features: [
          "Engage your preferred vendor with RealTechee's facilitation.",
          "All other Booster program benefits are included."
        ],
        variant: "secondary"
      }
    ]
  },
  [ProductType.BUYER]: {
    sectionLabel: "NEXT GEN FINANCING FOR HOME BUYERS",
    title: "RealTechee's Buying Booster",
    benefitCards: [
      {
        title: "Renovation Assurance",
        description: "RealTechee's Booster guarantees pre-set renovation costs before purchase & financing options if required, making post-sale renos stress-free."
      },
      {
        title: "Collaborative Financing",
        description: "A dedicated designer and project manager collaborate with agents and homeowners to ensure optimal results on time and within budget."
      },
      {
        title: "Transparent Progress",
        description: "Experience real-time finance insights for agents and homeowners, ensuring superior outcomes and user experience."
      }
    ],
    // No option cards for buyers
  },
  // These product types don't have a financing solutions section
  [ProductType.KITCHEN_BATH]: null,
  [ProductType.COMMERCIAL]: null,
  [ProductType.ARCHITECT_DESIGNER]: null
};

interface FinancingSolutionsSectionProps {
  className?: string;
  productType: ProductType;
  // Optional overrides
  sectionLabel?: string;
  title?: string;
  benefitCards?: {
    title: string;
    description: string;
  }[];
  optionCards?: {
    title: string;
    subtitle: string;
    features: string[];
    variant: 'primary' | 'secondary';
  }[];
}

export const FinancingSolutionsSection: React.FC<FinancingSolutionsSectionProps> = ({ 
  className = '',
  productType,
  sectionLabel,
  title,
  benefitCards,
  optionCards
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  
  // Get content for the current product type
  const content = FINANCING_SOLUTIONS_CONTENT[productType];
  
  // If content is null for this product type, don't render the section
  if (!content) {
    return null;
  }

  // Use provided overrides or fall back to content from configuration
  const finalSectionLabel = sectionLabel || content.sectionLabel;
  const finalTitle = title || content.title;
  const finalBenefitCards = benefitCards || content.benefitCards;
  const finalOptionCards = optionCards || content.optionCards;

  return (
    <Section
      spacing="medium"
      id="financing-solutions"
      background="white"
      className={className}
      marginTop={0}
      marginBottom={0}
      paddingTop={{ default: 24, md: 80, '2xl': 112 }}
      paddingBottom={{ default: 74, md: 100, '2xl': 112 }}
    >
      {/* Header */}
      <div className="text-center mb-14 animate-on-scroll">
        <SubContent className="text-[#E9664A] mb-4">{finalSectionLabel}</SubContent>
        <Subtitle className="max-w-4xl mx-auto">{finalTitle}</Subtitle>
      </div>

      {/* Benefits Section */}
      <div className="mb-14">
        <TagLabel 
          icon="/assets/icons/ic-chart.svg" 
          label="Benefits" 
          className="mb-6" 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-[30px]">
          {finalBenefitCards.map((card, index) => (
            <BenefitCard
              key={index}
              title={card.title}
              description={card.description}
              isActive={activeCardIndex === index}
              onMouseEnter={() => setActiveCardIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Options Section - Only show if there are option cards */}
      {finalOptionCards && finalOptionCards.length > 0 && (
        <div>
          <TagLabel 
            icon="/assets/icons/ic-clipboard-tick.svg" 
            label="Choose between" 
            className="mb-6" 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-5 md:items-stretch">
            {finalOptionCards.map((card, index) => (
              <OptionCard
                key={index}
                title={card.title}
                subtitle={card.subtitle}
                features={card.features}
                variant={card.variant}
                className="h-full"
              />
            ))}
          </div>
        </div>
      )}
    </Section>
  );
};