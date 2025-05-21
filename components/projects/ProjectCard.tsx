import React from 'react';
import { Card } from '../common/ui';
import Image from 'next/image';
import { Project } from '../../types/projects';
import { convertWixMediaUrl } from '../../utils/wixMediaUtils';
import StatusPill from '../common/ui/StatusPill';
import { 
  CardTitle, 
  CardContent, 
  SubContent, 
  SectionTitle,
  Subtitle,
  BodyContent,
  ButtonText 
} from '../Typography';
import Button from '../common/buttons/Button';

interface ProjectCardProps {
  project: Project;
  className?: string;
  onClick?: (id: string) => void;
}

/**
 * ProjectCard component displays a single project based on Figma design
 */
export default function ProjectCard({ 
  project,
  className = '',
  onClick
}: ProjectCardProps) {
  // Helper function to format currency values without decimals
  const formatCurrency = (value: string | undefined) => {
    if (!value) return '0';
    // Convert to number, round to remove decimals, then format with commas
    return Math.round(parseFloat(value)).toLocaleString('en-US');
  };

  // Get project properties safely
  const { 
    id, 
    title, 
    imageUrl, 
    Status 
  } = project;
  
  // Access fields with special characters or spaces using bracket notation
  const AddedValue = formatCurrency(project['Added value']);
  const BoostPrice = formatCurrency(project["Booster Estimated Cost"] || project['Boost Price']);
  const SalePrice = formatCurrency(project["Sale Price"]);
  const Bedrooms = project.Bedrooms || '0';
  const Bathrooms = project.Bathrooms || '0';
  const Floors = project.Floors || '0';
  const squareFeet = project["Size Sqft."] || '0';
  
  // Debug logging
  console.log('Project Card Data:', { 
    id, title, imageUrl, Status, 
    AddedValue, BoostPrice, SalePrice,
    Bedrooms, Bathrooms, Floors, squareFeet
  });

  // Helper to extract address parts for two-line display
  const formatAddress = (fullAddress: string | undefined) => {
    // Handle undefined or empty address
    if (!fullAddress) {
      return {
        line1: 'Address Not Available',
        line2: ''
      };
    }
    
    // Simple format assuming the address is something like "123 Main St, City, State ZIP"
    const parts = fullAddress.split(',');
    if (parts.length >= 2) {
      return {
        line1: parts[0].trim(),
        line2: parts.slice(1).join(',').trim()
      };
    }
    return {
      line1: fullAddress,
      line2: ''
    };
  };

  const address = formatAddress(title);
  
  // Handle the click on the entire card or button
  const handleCardClick = () => {
    if (onClick) {
      onClick(id);
    }
  };
  
  // Custom StatItem for project cards
  const ProjectStat = ({ icon, value, label }: { icon: string, value: string, label: string }) => (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 flex-shrink-0">
        <Image 
          src={icon}
          alt={label} 
          width={24} 
          height={24}
          onError={(e) => {
            console.error(`Failed to load icon: ${icon}`);
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <BodyContent spacing="none" className="font-medium text-[#2A2B2E] leading-tight">{value}</BodyContent>
      <CardContent spacing="none" className="text-gray-500 text-xs ml-1">{label}</CardContent>
    </div>
  );

  return (
    <div 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${className}`}
      onClick={handleCardClick}
    >
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden">
        {/* 1. Project Image */}
        <div className="w-full relative overflow-hidden pb-[140%]">
          <Image
            src={imageUrl ? convertWixMediaUrl(imageUrl) : '/assets/images/hero-bg.png'}
            alt={title || 'Project Image'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ 
              objectFit: 'cover',
              objectPosition: 'center', 
            }}
          />
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          {/* 2. Status Pill */}
          {Status && (
            <div className="mb-2">
              <StatusPill status={Status} />
            </div>
          )}

          {/* 3. Value Added Section */}
          {(project['Added value'] || project["Booster Estimated Cost"] || project['Boost Price'] || project["Sale Price"]) && (
            <div className="flex flex-col mb-3">
              {/* Show different label based on whether there's Added Value */}
              <CardContent spacing="none" className="text-gray-500 mb-1">
                {project['Added value'] && parseFloat(project['Added value']) > 0 ? 'Value Added' : 'Boost Cost'}
              </CardContent>
              
              {/* Main Price Value - Show Added Value or Boost Price */}
              <SectionTitle spacing="none" className="mb-1">
                ${AddedValue && parseFloat(project['Added value'] || '0') > 0 ? AddedValue : BoostPrice}
              </SectionTitle>
              
              {/* Price Comparison Section - Only show when there's Added Value */}
              {project['Added value'] && parseFloat(project['Added value']) > 0 && (
                <div className="flex items-center gap-3 mb-2">
                  {BoostPrice && (
                    <Subtitle spacing="none" className="text-gray-500">${BoostPrice}</Subtitle>
                  )}
                  {(BoostPrice && SalePrice) && (
                    <Image 
                      src="/assets/icons/arrow-right.svg" 
                      alt="arrow" 
                      width={16} 
                      height={16} 
                    />
                  )}
                  {SalePrice && (
                    <Subtitle spacing="none" className="text-gray-500">${SalePrice}</Subtitle>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. Title with Address */}
          <div className="mb-3">
            <CardTitle className="text-[#2A2B2E] font-bold mb-1">{address.line1}</CardTitle>
            {address.line2 && <SubContent className="text-gray-500 tracking-wider">{address.line2}</SubContent>}
          </div>

          {/* 5. Project Stats Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
            <ProjectStat 
              icon="/assets/icons/ic-bedroom.svg"
              value={Bedrooms}
              label="Bedrooms"
            />
            <ProjectStat 
              icon="/assets/icons/ic-staircase.svg"
              value={Floors}
              label="Stories"
            />
            <ProjectStat 
              icon="/assets/icons/ic-bath.svg"
              value={Bathrooms}
              label="Baths"
            />
            <ProjectStat 
              icon="/assets/icons/ic-size-sqft.svg"
              value={squareFeet}
              label="Square Feet"
            />
          </div>

          {/* 6. View More Button */}
          <div className="mt-auto flex justify-end">
            <Button 
              variant="secondary"
              size="sm"
              text="View more"
              className="px-5 py-3"
              hasIcon={true}
              iconPosition="right"
              onClick={handleCardClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
