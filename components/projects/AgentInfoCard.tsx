import React from 'react';
import { Project } from '../../types/projects';
import Card from '../common/ui/Card';
import { Button } from '../common/buttons';
import { BodyContent, CardTitle } from '../Typography';
import Image from 'next/image';
import { formatPhoneNumber } from '../../utils/formatUtils';

interface AgentInfoCardProps {
  project: Project;
}

const AgentInfoCard: React.FC<AgentInfoCardProps> = ({ project }) => {
  const content = (
    <div className="p-4 flex flex-col gap-2">
      <div className="flex items-center mb-3">
        <div className="w-16 h-16 rounded-full bg-gray-300 mr-4 flex-shrink-0"></div>
        <div>
          <BodyContent className="font-semibold leading-none mb-1">{project["Agent Name"] || 'John Smith'}</BodyContent>
          {/* <BodyContent className="text-gray-600 text-sm leading-none">Real Estate Specialist</BodyContent> */}
        </div>
      </div>

      <div className="flex h-8">
        <div className="flex items-center w-full">
          <BodyContent className="text-gray-600 w-32 leading-none my-auto">Phone:</BodyContent>
          <BodyContent className="leading-none my-auto">{formatPhoneNumber(project["Agent Phone"]) || '(123) 456-7890'}</BodyContent>
        </div>
      </div>
      
      <div className="flex h-8 bg-[#F9F9F9] -mx-4 px-4">
        <div className="flex items-center w-full">
          <BodyContent className="text-gray-600 w-32 leading-none my-auto">Email:</BodyContent>
          <BodyContent className="leading-none my-auto">{project["Agent Email"] || 'agent@realtechee.com'}</BodyContent>
        </div>
      </div>

      <div className="mt-2">
        <Button 
          variant="primary" 
          text="Contact Agent"
          className="w-full"
        />
      </div>
    </div>
  );

  return (
    <Card 
      title={<CardTitle className="mb-0">Agent Information</CardTitle>}
      content={content}
      className="-my-5 sm:-my-6 md:-my-7"
    />
  );
};

export default AgentInfoCard;
