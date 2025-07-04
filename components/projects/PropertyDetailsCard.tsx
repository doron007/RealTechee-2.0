import React from 'react';
import { Project } from '../../types/projects';
import Card from '../common/ui/Card';
import { Button } from '../common/buttons';
import { H1 } from '../typography/H1';
import { H6 } from '../typography/H6';
import { P1 } from '../typography/P1';
import { P2 } from '../typography/P2';
import { H4 } from '../typography/H4' 
import Image from 'next/image';

interface PropertyDetailsCardProps {
  project: Project;
}

// Reuse the ProjectStat component from ProjectCard
const ProjectStat = ({ icon, value, label }: { icon: string, value: string, label: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-5 h-5 flex-shrink-0">
      <Image
        src={icon}
        alt={label}
        width={20}
        height={20}
        onError={(e) => {
          console.error(`Failed to load icon: ${icon}`);
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
    <P2 className="font-medium text-[#2A2B2E] leading-none">{value}</P2>
    <P2 className="text-gray-500 text-xs leading-none ml-1">{label}</P2>
  </div>
);

const PropertyDetailsCard: React.FC<PropertyDetailsCardProps> = ({ project }) => {
  const { bedrooms, bathrooms, floors } = project;
  const squareFeet = project.sizeSqft || 0;

  const content = (
    <div className="p-4 flex flex-col gap-2">
      <div className="flex h-8">
        <div className="flex items-center w-full">
          <div className="flex items-center gap-2 pb-2">
            <div className="w-5 h-5 flex-shrink-0">
              <Image
                src="/assets/icons/ic-location.svg"
                alt="location"
                width={20}
                height={20}
                onError={(e) => {
                  console.error(`Failed to load icon: "/assets/icons/ic-location.svg"`);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <P1 className="text-gray-600 leading-none">{project.title || project.address?.propertyFullAddress || 'Address'}</P1>
          </div>
        </div>
      </div>

      <div className="flex h-8 pl-4">
        <div className="flex items-center w-full">
          <P1 className="text-gray-600 w-32 leading-none my-auto">Property Type:</P1>
          <P1 className="leading-none my-auto">{project.propertyType || 'Single Family'}</P1>
        </div>
      </div>

      <div className="flex h-8 pl-4 bg-[#F9F9F9]">
        <div className="flex items-center w-full">
          <P1 className="text-gray-600 w-32 leading-none my-auto">Year Built:</P1>
          <P1 className="leading-none my-auto">{project.yearBuilt || '1971'}</P1>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 py-3">
        <ProjectStat
          icon="/assets/icons/ic-bedroom.svg"
          value={bedrooms?.toString() || '4'}
          label="bdrms"
        />
        <ProjectStat
          icon="/assets/icons/ic-staircase.svg"
          value={floors?.toString() || '2'}
          label="stories"
        />
        <ProjectStat
          icon="/assets/icons/ic-bath.svg"
          value={bathrooms?.toString() || '4'}
          label="baths"
        />
        <ProjectStat
          icon="/assets/icons/ic-dimension.svg"
          value={squareFeet?.toString() || '2427'}
          label="sqft"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-1">
        <Button
          variant="secondary"
          href={project.zillowLink || "#"}
          text="View on Zillow"
        />
        <Button
          variant="secondary"
          href={project.redfinLink || "#"}
          text="View on Redfin"
        />
      </div>
    </div>
  );

  return (
    <Card
      title={<H4 className="mb-0">Property Details</H4>}
      content={content}
      className="-my-5 sm:-my-6 md:-my-7"
    />
  );
};

export default PropertyDetailsCard;
