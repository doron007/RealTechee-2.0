import React from 'react';
import { Project } from '../../types/projects';
import Card from '../common/ui/Card';
import P2 from '../typography/P2';
import H3 from '../typography/H3';
import { formatCurrency } from '../../utils/formatUtils';
import StatusPill from '../common/ui/StatusPill';

// Function to format financial amounts (no masking for Project Details)
const formatAmount = (amount: string | number | undefined, fallback: string): string => {
  const value = amount ? amount.toString() : fallback;
  const formattedAmount = formatCurrency(value);
  return '$' + formattedAmount;
};

interface ProjectDetailsCardProps {
  project: Project;
}

const ProjectDetailsCard: React.FC<ProjectDetailsCardProps> = ({ project }) => {
  const content = (
    <div className="p-4 flex flex-col gap-2">
      <div className="flex h-8">
        <div className="flex items-center w-full">
          <P2 className="text-gray-600 w-32 leading-none my-auto">Status:</P2>
          <StatusPill status={project.status || 'New'} />
        </div>
      </div>
      
      <div className="flex h-8 bg-[#F9F9F9] -mx-4 px-4">
        <div className="flex items-center w-full">
          <P2 className="text-gray-600 w-32 leading-none my-auto">Original Price:</P2>
          <P2 className="leading-none my-auto">{formatAmount(project.originalValue, '850000')}</P2>
        </div>
      </div>

      <div className="flex h-8">
        <div className="flex items-center w-full">
          <P2 className="text-gray-600 w-32 leading-none my-auto">Boost Price:</P2>
          <P2 className="leading-none my-auto">{formatAmount(project.boostPrice, '150000')}</P2>
        </div>
      </div>
      
      <div className="flex h-8 bg-[#F9F9F9] -mx-4 px-4">
        <div className="flex items-center w-full">
          <P2 className="text-gray-600 w-32 leading-none my-auto font-bold">Value Added:</P2>
          <P2 className="leading-none my-auto text-gray-600 font-bold">{formatAmount(project.addedValue, '300000')}</P2>
        </div>
      </div>
    </div>
  );

  return (
    <Card 
      title={<H3 className="mb-0">Project Details</H3>}
      content={content}
      className="-my-5 sm:-my-6 md:-my-7"
    />
  );
};

export default ProjectDetailsCard;
