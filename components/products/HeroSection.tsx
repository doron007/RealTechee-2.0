import React from 'react';
import {
    SectionTitle,
    BodyContent,
    SubContent
} from '../';
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
        backgroundImage: '/assets/images/seller-hero-bg.png'
    },
    [ProductType.BUYER]: {
        titles: ['The Next Generation of Real', 'Estate Buyer Services'],
        subContents: [
            'Enhance home renovation opportunities and experience for clients'
        ],
        backgroundImage: '/assets/images/seller-hero-bg.png' // Change this when you have a buyer background
    },
    [ProductType.KITCHEN_BATH]: {
        titles: ['Kitchen and Bath Showroom', 'Program'],
        subContents: [
            'Offer premium remodeling services while partnering with a top technology-based',
            'provider, ensuring exceptional execution and increasing showroom profits.'
        ],
        backgroundImage: '/assets/images/seller-hero-bg.png' // Change this when you have a kitchen/bath background
    },
    [ProductType.COMMERCIAL]: {
        titles: ['Commercial Real Estate', 'Program'],
        subContents: [
            'Support Commercial Real Estate Owners and Tenants',
            'Enhance renovation services and support for a better ROI'
        ],
        backgroundImage: '/assets/images/seller-hero-bg.png' // Change this when you have a commercial background
    },
    [ProductType.ARCHITECT_DESIGNER]: {
        titles: ['Architect & Designer', 'Program'],
        subContents: [
            'Focus on creating exceptional designs and provide a seamless experience for your',
            'clients- from design to build.'
        ],
        backgroundImage: '/assets/images/seller-hero-bg.png' // Change this when you have an architect/designer background
    }
};

interface HeroSectionProps {
    title?: string[];
    description?: string;
    className?: string;
    productType?: ProductType;
    // Legacy props for backward compatibility
    isBuyer?: boolean;
    isSeller?: boolean;
    isKitchenBath?: boolean; 
}

export default function HeroSection({
    className = '',
    title,
    productType,
    isBuyer = false,
    isSeller = false,
    isKitchenBath = false,
}: HeroSectionProps) {
    // Determine product type from legacy props if productType is not provided
    let effectiveProductType = productType;
    if (!effectiveProductType) {
        if (isBuyer) effectiveProductType = ProductType.BUYER;
        else if (isKitchenBath) effectiveProductType = ProductType.KITCHEN_BATH;
        else effectiveProductType = ProductType.SELLER; // Default to seller
    }

    // Get content for the current product type
    const content = PRODUCT_CONTENT[effectiveProductType];
    const backgroundImage = content.backgroundImage;
    
    return (
        <Section
            id="hero"
            className={`flex flex-col justify-center items-center overflow-hidden ${className}`}
            backgroundImage={backgroundImage}
            background="none"
            spacing="none"
            paddingTop="63px"
            paddingBottom="63px"
            constrained={false}
        >
            <div className="flex flex-col sm:items-center text-left sm:text-center">
                {content.titles.map((titleLine, index) => (
                    <SectionTitle 
                        key={index} 
                        spacing={index < content.titles.length - 1 ? 'none' : 'medium'} 
                        className={index > 0 ? "mt-2" : ""}
                    >
                        {titleLine}
                    </SectionTitle>
                ))}
                {content.subContents.map((subContent, index) => (
                    <SubContent key={index}>{subContent}</SubContent>
                ))}
            </div>
        </Section>
    );
}