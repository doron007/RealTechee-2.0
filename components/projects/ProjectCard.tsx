import React, { useState, useEffect } from 'react';
import { Card } from '../common/ui';
import Image from 'next/image';
import OptimizedImage from '../common/ui/OptimizedImage';
import { Project } from '../../types/projects';
import { safeImageUrl } from '../../utils/clientWixMediaUtils';
import StatusPill from '../common/ui/StatusPill';
import H3 from '../typography/H3';
import H2 from '../typography/H2';
import P1 from '../typography/P1';
import P2 from '../typography/P2';
import P3 from '../typography/P3';
import Button from '../common/buttons/Button';
import { formatCurrency } from '../../utils/formatUtils';

// Define reliable fallback images that exist in the project
const FALLBACK_IMAGES = [
  '/assets/images/hero-bg.png',
  '/assets/images/properties/property-1.jpg',
  '/assets/images/properties/property-2.jpg'
];

// Removed inline definition of formatCurrency

interface ProjectCardProps {
  project: Project;
  className?: string;
  onClick?: (id: string) => void;
  priority?: boolean;
}

/**
 * ProjectCard component displays a single project based on Figma design
 */
export default function ProjectCard({ 
  project,
  className = '',
  onClick,
  priority = false
}: ProjectCardProps) {
  // State to store the resolved image URL
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string>(FALLBACK_IMAGES[0]);
  // State to track if we've already fallen back to the placeholder
  const [usedFallback, setUsedFallback] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const resolveImageUrl = async () => {
      if (project.imageUrl) {
        try {
          const url = await safeImageUrl(project.imageUrl);
          if (isMounted) {
            setResolvedImageUrl(url);
            setUsedFallback(false); // Reset fallback status when we successfully load a new URL
          }
        } catch (error) {
          console.error('Failed to resolve image URL:', error);
        }
      }
    };
    resolveImageUrl();
    return () => {
      isMounted = false;
    };
  }, [project.imageUrl]);

  // Get project properties safely
  const { 
    id,
    title,
    imageUrl,
    status
  } = project;

  // Access fields using camelCase field names
  const AddedValue = formatCurrency(project.addedValue?.toString());
  const BoostPrice = formatCurrency((project.boosterEstimatedCost || project.boostPrice)?.toString());
  const SalePrice = formatCurrency(project.salePrice?.toString());
  const Bedrooms = project.bedrooms?.toString() || '0';
  const Bathrooms = project.bathrooms?.toString() || '0';
  const Floors = project.floors?.toString() || '0';
  const squareFeet = project.sizeSqft?.toString() || '0';

  //
  // // Debug logging
  // console.log('Project Card Data:', { 
  //   id, title, imageUrl, Status, 
  //   AddedValue, BoostPrice, SalePrice,
  //   Bedrooms, Bathrooms, Floors, squareFeet
  // });

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
      <P2 className="font-medium text-[#2A2B2E] leading-tight">{value}</P2>
      <P3 className="text-gray-500 text-xs ml-1">{label}</P3>
    </div>
  );

  return (
    <div 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${className}`}
      onClick={handleCardClick}
    >
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden">
        {/* 1. Project Image Container */}
        <div className="pt-6 px-6">
          <div className="w-full relative overflow-hidden pb-[62%] rounded-lg">
            <OptimizedImage
              src={resolvedImageUrl}
              alt={project.title || 'Project Image'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
              quality={priority ? 85 : 75} // Higher quality for priority images
              placeholder="blur"
              className="object-cover object-center"
              lazyLoad={!priority} // Disable lazy loading for priority images
              fallbackSrc={FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]}
              onError={(e) => {
                // Only try to use the placeholder if we haven't already done so
                if (!usedFallback) {
                  console.warn('Image failed to load, using fallback.');
                  setUsedFallback(true);
                  // Rotate through fallback images to distribute load
                  const fallbackIndex = Math.floor(Math.random() * FALLBACK_IMAGES.length);
                  setResolvedImageUrl(FALLBACK_IMAGES[fallbackIndex]);
                } else {
                  // If we're already using the fallback, just log the error
                  console.error('Fallback image also failed to load.');
                  // Prevent further attempts by stopping propagation
                  e.stopPropagation();
                }
              }}
            />
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          {/* 2. Status Pill */}
          {status && (
            <div className="mb-2">
              <StatusPill status={status} />
            </div>
          )}

          {/* 3. Value Added Section */}
          {(project.addedValue || project.boosterEstimatedCost || project.boostPrice || project.salePrice) && (
            <div className="flex flex-col mb-3">
              {/* Show different label based on whether there's Added Value */}
              <P3 className="text-gray-500 mb-1">
                {project.addedValue && parseFloat(project.addedValue.toString()) > 0 ? 'Value Added' : 'Boost Cost'}
              </P3>
              
              {/* Main Price Value - Show Added Value or Boost Price */}
              <H2 className="mb-1">
                ${AddedValue && parseFloat(project.addedValue?.toString() || '0') > 0 ? AddedValue : BoostPrice}
              </H2>
              
              {/* Price Comparison Section - Only show when there's Added Value */}
              {project.addedValue && parseFloat(project.addedValue.toString()) > 0 && (
                <div className="flex items-center gap-3 mb-2">
                  {BoostPrice && (
                    <P2 className="text-gray-500">${BoostPrice}</P2>
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
                    <P2 className="text-gray-500">${SalePrice}</P2>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. Title with Address */}
          <div className="mb-3">
            <H3 className="text-[#2A2B2E] font-bold mb-0">{address.line1}</H3>
            {address.line2 && <P3 className="text-gray-500 tracking-wider">{address.line2}</P3>}
          </div>

          {/* 5. Project Stats Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
            <ProjectStat 
              icon="/assets/icons/ic-bedroom.svg"
              value={Bedrooms}
              label="bdrms"
            />
            <ProjectStat 
              icon="/assets/icons/ic-staircase.svg"
              value={Floors}
              label="stories"
            />
            <ProjectStat 
              icon="/assets/icons/ic-bath.svg"
              value={Bathrooms}
              label="baths"
            />
            <ProjectStat 
              icon="/assets/icons/ic-dimension.svg"
              value={squareFeet}
              label="sqft"
            />
          </div>

          {/* 6. View More Button */}
          <div className="mt-auto flex justify-end">
            <Button 
              variant="secondary"
              size="sm"
              text="View more"
              className="px-5 py-3"
              showArrow={true}
              iconPosition="left"
              onClick={handleCardClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
