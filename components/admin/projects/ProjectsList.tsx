import React from 'react';
import { H1, P2 } from '../../typography';
import ProjectsTable from './ProjectsTable';

const ProjectsList: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <H1>Projects</H1>
          <P2 className="text-gray-600 mt-1">
            Manage and track all project records
          </P2>
        </div>
      </div>

      {/* Material React Table - Professional Solution */}
      <ProjectsTable />
    </div>
  );
};

export default ProjectsList;