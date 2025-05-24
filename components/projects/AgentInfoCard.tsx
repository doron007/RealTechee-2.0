import React from 'react';
import { Project } from '../../types/projects';
import Button from '../common/buttons/Button';

interface AgentInfoCardProps {
  project: Project;
}

const AgentInfoCard: React.FC<AgentInfoCardProps> = ({ project }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 border-b pb-2">Agent Information</h2>
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 rounded-full bg-gray-300 mr-4"></div>
        <div>
          <h3 className="font-semibold text-lg">{project["Agent Name"] || 'John Smith'}</h3>
          <p className="text-gray-600 text-sm">Real Estate Specialist</p>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-y-2">
        <dt className="text-gray-600">Phone:</dt>
        <dd className="font-medium">{project["Agent Phone"] || '(123) 456-7890'}</dd>
        
        <dt className="text-gray-600">Email:</dt>
        <dd className="font-medium">{project["Agent Email"] || 'agent@realtechee.com'}</dd>
      </dl>
      
      <Button variant="primary" className="w-full mt-4">
        Contact Agent
      </Button>
    </div>
  );
};

export default AgentInfoCard;
