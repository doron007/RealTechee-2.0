import React from 'react';
import Image from 'next/image';
import { CollapsibleSection } from '../common/ui';
import { CardTitle, BodyContent } from '../Typography';

export interface Milestone {
  name: string;
  description: string;
  isCompleted: boolean;
  order?: number; // Optional prop for ordering
}

interface MilestonesListProps {
  milestones: Milestone[];
  title?: string;
  initialExpanded?: boolean;
  className?: string;
}

export default function MilestonesList({ 
  milestones,
  title = "Milestones",
  initialExpanded = true,
  className = ""
}: MilestonesListProps) {
  // Sort milestones: completed first, then by order (if exists), then preserve original order
  const sortedMilestones = [...milestones].sort((a, b) => {
    // First sort by completion status (completed items first)
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? -1 : 1;
    }
    
    // Then sort by order if both have order defined
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    
    // If only one has order defined, put the one with order first
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    
    // If neither has order, maintain original order
    return 0;
  });

  return (
    <div className={className}>
      <CollapsibleSection title={title} initialExpanded={initialExpanded}>
        <div className="space-y-2">
          {sortedMilestones.map((milestone, index) => (
            <div 
              key={index} 
              className={`flex gap-4 p-2 ${
                milestone.isCompleted ? 'bg-gray-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                <Image 
                  src={milestone.isCompleted 
                    ? '/assets/icons/btn-checkbox-checked.svg'
                    : '/assets/icons/btn-checkbox-not-checked.svg'
                  }
                  alt={milestone.isCompleted ? "Completed milestone" : "Pending milestone"}
                  width={20}
                  height={20}
                />
              </div>
              <div className="flex-1">
                <CardTitle className="text-[#2A2B2E] mb-2">{milestone.name}</CardTitle>
                <BodyContent className="!mb-0 text-gray-600 whitespace-pre-line">{milestone.description}</BodyContent>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
