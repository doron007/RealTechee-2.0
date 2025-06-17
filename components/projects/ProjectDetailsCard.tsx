import React from 'react';
import { Project } from '../../types/projects';
import Card from '../common/ui/Card';
import { BodyContent, CardTitle } from '../Typography';
import { formatCurrency } from '../../utils/formatUtils';
import StatusPill from '../common/ui/StatusPill';

interface ProjectDetailsCardProps {
  project: Project;
}

const ProjectDetailsCard: React.FC<ProjectDetailsCardProps> = ({ project }) => {
  const content = (
    <div className="p-4 flex flex-col gap-2">
      <div className="flex h-8">
        <div className="flex items-center w-full">
          <BodyContent className="text-gray-600 w-32 leading-none my-auto">Status:</BodyContent>
          <StatusPill status={project.status || 'New'} />
        </div>
      </div>
      
      <div className="flex h-8 bg-[#F9F9F9] -mx-4 px-4">
        <div className="flex items-center w-full">
          <BodyContent className="text-gray-600 w-32 leading-none my-auto">Original Price:</BodyContent>
          <BodyContent className="leading-none my-auto">${formatCurrency(project.originalValue?.toString()) || '850,000'}</BodyContent>
        </div>
      </div>

      <div className="flex h-8">
        <div className="flex items-center w-full">
          <BodyContent className="text-gray-600 w-32 leading-none my-auto">Boost Price:</BodyContent>
          <BodyContent className="leading-none my-auto">${formatCurrency(project.boostPrice?.toString()) || '150,000'}</BodyContent>
        </div>
      </div>
      
      <div className="flex h-8 bg-[#F9F9F9] -mx-4 px-4">
        <div className="flex items-center w-full">
          <BodyContent className="text-gray-600 w-32 leading-none my-auto font-bold">Value Added:</BodyContent>
          <BodyContent className="leading-none my-auto text-gray-600 font-bold">${formatCurrency(project.addedValue?.toString()) || '300,000'}</BodyContent>
        </div>
      </div>
    </div>
  );

  return (
    <Card 
      title={<CardTitle className="mb-0">Project Details</CardTitle>}
      content={content}
      className="-my-5 sm:-my-6 md:-my-7"
    />
  );
};

export default ProjectDetailsCard;
