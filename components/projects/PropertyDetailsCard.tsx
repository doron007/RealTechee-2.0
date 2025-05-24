import React from 'react';
import { Project } from '../../types/projects';
import Card from '../common/ui/Card';

interface PropertyDetailsCardProps {
  project: Project;
}

const PropertyDetailsCard: React.FC<PropertyDetailsCardProps> = ({ project }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 border-b pb-2">Property Details</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <dt className="text-gray-600">Address:</dt>
        <dd className="font-medium">{project.location || '123 Main St'}</dd>
        
        <dt className="text-gray-600">Property Type:</dt>
        <dd className="font-medium">{project["Property Type"] || 'Single Family'}</dd>
        
        <dt className="text-gray-600">Year Built:</dt>
        <dd className="font-medium">{project["Year Built"] || '2020'}</dd>
        
        <dt className="text-gray-600">Bedrooms:</dt>
        <dd className="font-medium">{project.Bedrooms || '4'}</dd>
        
        <dt className="text-gray-600">Bathrooms:</dt>
        <dd className="font-medium">{project.Bathrooms || '3'}</dd>
        
        <dt className="text-gray-600">Stories:</dt>
        <dd className="font-medium">{project.Floors || '2'}</dd>
        
        <dt className="text-gray-600">Square Feet:</dt>
        <dd className="font-medium">{project["Size Sqft."] || '2,500'}</dd>
      </dl>
      
      {/* External Links */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <a 
          href={project["Zillow Link"] || "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
        >
          View on Zillow
        </a>
        <a 
          href={project["Redfin Link"] || "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors text-sm"
        >
          View on Redfin
        </a>
      </div>
    </div>
  );
};

export default PropertyDetailsCard;
