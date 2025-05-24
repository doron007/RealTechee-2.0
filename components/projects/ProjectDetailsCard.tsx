import React from 'react';
import { Project } from '../../types/projects';

interface ProjectDetailsCardProps {
  project: Project;
}

const ProjectDetailsCard: React.FC<ProjectDetailsCardProps> = ({ project }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 border-b pb-2">Project Details</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <dt className="text-gray-600">Status:</dt>
        <dd>
          <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
            {project.Status || 'In Progress'}
          </span>
        </dd>
        
        <dt className="text-gray-600">Original Price:</dt>
        <dd className="font-medium">${project["Original Value"] || '850,000'}</dd>
        
        <dt className="text-gray-600">Boost Price:</dt>
        <dd className="font-medium">${project["Boost Price"] || '150,000'}</dd>
        
        <dt className="text-gray-600">Value Added:</dt>
        <dd className="font-medium text-green-600">${project["Added value"] || '300,000'}</dd>
      </dl>
    </div>
  );
};

export default ProjectDetailsCard;
