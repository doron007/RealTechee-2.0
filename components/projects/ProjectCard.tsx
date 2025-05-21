import React from 'react';
import { Card } from '../common/ui';
import Image from 'next/image';
import { Project } from '../../types/projects';
import { convertWixMediaUrl } from '../../utils/wixMediaUtils';

interface ProjectCardProps {
  project: Project;
  className?: string;
  onClick?: (id: string) => void;
}

/**
 * ProjectCard component displays a single project
 * This is a stub implementation that will be expanded in the future
 */
export default function ProjectCard({ 
  project,
  className = '',
  onClick
}: ProjectCardProps) {
  const { id, title, description, imageUrl } = project;
  
  return (
    <div 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${className}`}
      onClick={() => onClick && onClick(id)}
    >
      <Card
        variant="default"
        title={title}
        content={description}
        className="h-full"
      >
        <div className="w-full h-48 relative mb-4 overflow-hidden rounded-t-lg">
          <Image
            src={convertWixMediaUrl(imageUrl)}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ 
              objectFit: 'cover',
              objectPosition: 'center' 
            }}
          />
        </div>
      </Card>
    </div>
  );
}
