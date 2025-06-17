import React from 'react';
import { Project } from '../../types/projects';
import Card from '../common/ui/Card';
import { Button } from '../common/buttons';
import { BodyContent, CardTitle } from '../Typography';
import Image from 'next/image';
import { formatPhoneNumber } from '../../utils/formatUtils';
import { createLogger } from '../../utils/logger';

interface AgentInfoCardProps {
  project: Project;
}

const logger = createLogger('AgentInfoCard');

const AgentInfoCard: React.FC<AgentInfoCardProps> = ({ project }) => {
  // Agent data can come from the relationship or be stored directly
  const agentName = project.agent?.fullName || 
    (project.agent?.firstName && project.agent?.lastName 
      ? `${project.agent.firstName} ${project.agent.lastName}` 
      : null) ||
    'John Smith';
    
  const agentPhone = project.agent?.phone || '(123) 456-7890';
  const agentEmail = project.agent?.email || 'agent@realtechee.com';

  // Debug log for development - will be filtered out in production
  logger.debug('Agent data loaded', {
    hasAgent: !!project.agent,
    agentId: project.agentContactId,
    agentName,
    agentPhone,
    agentEmail,
    fullAgentData: project.agent
  });

  // Info log for successful agent loading - will show in production
  if (project.agent) {
    logger.info('Agent contact loaded successfully', { agentName });
  } else {
    logger.warn('No agent contact data available, using fallback', { projectId: project.projectID });
  }

  const content = (
    <div className="p-4 flex flex-col gap-2">
      <div className="flex items-center mb-3">
        <div className="w-16 h-16 rounded-full bg-gray-300 mr-4 flex-shrink-0"></div>
        <div>
          <BodyContent className="font-semibold leading-none mb-1">{agentName}</BodyContent>
          {/* <BodyContent className="text-gray-600 text-sm leading-none">Real Estate Specialist</BodyContent> */}
        </div>
      </div>

      <div className="flex h-8">
        <div className="flex items-center w-full">
          <BodyContent className="text-gray-600 w-32 leading-none my-auto">Phone:</BodyContent>
          <BodyContent className="leading-none my-auto">{formatPhoneNumber(agentPhone)}</BodyContent>
        </div>
      </div>
      
      <div className="flex h-8 bg-[#F9F9F9] -mx-4 px-4">
        <div className="flex items-center w-full">
          <BodyContent className="text-gray-600 w-32 leading-none my-auto">Email:</BodyContent>
          <BodyContent className="leading-none my-auto">{agentEmail}</BodyContent>
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
