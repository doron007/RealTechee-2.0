import React from 'react';
import { Checkbox } from '@mui/material';
import { CollapsibleSection } from '../common/ui';
import { BodyContent } from '../Typography';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  isComplete: boolean;
  order?: number;
  createdDate?: string;
  updatedDate?: string;
  owner?: string;
  isCategory?: boolean;
  isInternal?: boolean;
  estimatedStart?: string;
  estimatedFinish?: string;
}

interface MilestonesListProps {
  milestones: Milestone[];
  title?: string;
  initialExpanded?: boolean;
  className?: string;
  onMilestoneToggle?: (milestone: Milestone) => void;
}

export default function MilestonesList({
  milestones,
  title = "Milestones",
  initialExpanded = true,
  className = "",
  onMilestoneToggle
}: MilestonesListProps) {
  // Sort milestones: completed first, then by order
  const sortedMilestones = [...milestones].sort((a, b) => {
    // First sort by completion status (completed items first)
    if (a.isComplete !== b.isComplete) {
      return a.isComplete ? -1 : 1;
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
        <div className="space-y-1">
          {sortedMilestones.map((milestone, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 py-1.5 px-2 ${milestone.isComplete ? 'bg-gray-200' : 'bg-gray-50'
                }`}
            >
              <Checkbox
                checked={milestone.isComplete}
                onChange={() => onMilestoneToggle?.(milestone)}
                color="default"
                className="!pt-1"
              />
              <div className="flex-1">
                <BodyContent className="!mb-0 text-[#2A2B2E]">{milestone.name}</BodyContent>
                {milestone.description && (
                  <BodyContent className="!mb-0 text-gray-600 whitespace-pre-line">{milestone.description}</BodyContent>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
