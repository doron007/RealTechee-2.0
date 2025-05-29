import React from 'react';
import Image from 'next/image';
import { CollapsibleSection } from '../common/ui';
import { CardTitle, BodyContent } from '../Typography';

export interface Milestone {
  Name: string;
  Description: string;
  'Is Complete': boolean;
  Order?: number;
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
    if (a['Is Complete'] !== b['Is Complete']) {
      return a['Is Complete'] ? -1 : 1;
    }
    
    // Then sort by order if both have order defined
    if (a.Order !== undefined && b.Order !== undefined) {
      return a.Order - b.Order;
    }
    
    // If only one has order defined, put the one with order first
    if (a.Order !== undefined) return -1;
    if (b.Order !== undefined) return 1;
    
    // If neither has order, maintain original order
    return 0;
  });

  return (
    <div className={className}>
      <CollapsibleSection title={title} initialExpanded={initialExpanded}>
        <div className="space-y-1">
          {sortedMilestones.map((milestone, index) => (
            <div 
              key={index}
              className={`flex items-center gap-4 py-1.5 px-2 ${
                milestone['Is Complete'] ? 'bg-gray-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">
                <Image 
                  src={milestone['Is Complete']
                    ? '/assets/icons/btn-checkbox-checked.svg'
                    : '/assets/icons/btn-checkbox-not-checked.svg'
                  }
                  alt={milestone['Is Complete'] ? "Milestone completed" : "Milestone pending"}
                  width={20}
                  height={20}
                />
              </div>
              
              <div className="flex-1">
                <BodyContent className="!mb-0 text-[#2A2B2E]">{milestone.Name}</BodyContent>
                {milestone.Description && (
                  <BodyContent className="!mb-0 text-gray-600 whitespace-pre-line">{milestone.Description}</BodyContent>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
