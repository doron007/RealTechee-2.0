import React from 'react';
import H1 from '../typography/H1';
import P2 from '../typography/P2';
import Section from '../common/layout/Section';

// Define product types as an enum for type safety
export enum ProductType {
    SELLER = 'seller',
    BUYER = 'buyer',
    KITCHEN_BATH = 'kitchenBath',
    COMMERCIAL = 'commercial',
    ARCHITECT_DESIGNER = 'architectDesigner'
}

// Content configuration for each product type
const PRODUCT_CONTENT = {
    [ProductType.SELLER]: {
        titles: ['Real Estate Seller Services'],
        subContents: [
            'Selling Properties Has Never Been This Easy',
            '​Enhance home renovation opportunities and experience - sell faster and for a higher price'
        ],
        backgroundImage: '/assets/images/hero-bg.png'
    },
    [ProductType.BUYER]: {
        titles: ['The Next Generation of Real', 'Estate Buyer Services'],
        subContents: [
            'Enhance home renovation opportunities and experience for clients'
        ],
        backgroundImage: '/assets/images/hero-bg.png' // Change this when you have a buyer background
    },
    [ProductType.KITCHEN_BATH]: {
        titles: ['Kitchen and Bath Showroom', 'Program'],
        subContents: [
            'Offer premium remodeling services while partnering with a top technology-based',
            'provider, ensuring exceptional execution and increasing showroom profits.'
        ],
        backgroundImage: '/assets/images/hero-bg.png' // Change this when you have a kitchen/bath background
    },
    [ProductType.COMMERCIAL]: {
        titles: ['Commercial Real Estate', 'Program'],
        subContents: [
            'Support Commercial Real Estate Owners and Tenants',
            'Enhance renovation services and support for a better ROI'
        ],
        backgroundImage: '/assets/images/hero-bg.png' // Change this when you have a commercial background
    },
    [ProductType.ARCHITECT_DESIGNER]: {
        titles: ['Architect & Designer', 'Program'],
        subContents: [
            'Focus on creating exceptional designs and provide a seamless experience for your',
            'clients- from design to build.'
        ],
        backgroundImage: '/assets/images/hero-bg.png' // Change this when you have an architect/designer background
    }
};

interface HeroSectionProps {
    title?: string[];
    description?: string;
    className?: string;
    productType: ProductType;
}

export default function HeroSection({
    className = '',
    title,
    productType,
}: HeroSectionProps) {
    // Get content for the current product type
    const content = PRODUCT_CONTENT[productType];
    const backgroundImage = content.backgroundImage;
    
    return (
        <Section
            id="hero"
            className={`flex flex-col justify-center items-center overflow-hidden ${className}`}
            backgroundImage={backgroundImage}
            background="none"
            spacing="none"
            constrained={false}
            marginTop={50}
            marginBottom={50}
            paddingTop={{ default: 50, md: 80, '2xl': 100 }}
            paddingBottom={{ default: 50, md: 80, '2xl': 100 }}
              >
            <div className="flex flex-col items-center text-center gap-4 md:gap-6">
                <H1 className="text-center">
                    {content.titles.join(' ')}
                </H1>
                <div className="flex flex-col gap-2">
                    {content.subContents.map((subContent, index) => (
                        <P2 
                            key={index} 
                            className="text-center"
                        >
                            {subContent}
                        </P2>
                    ))}
                </div>
            </div>
        </Section>
    );
}