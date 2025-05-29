import React from 'react';
import { Checkbox } from '@mui/material';
import { CollapsibleSection } from '../common/ui';
import { BodyContent } from '../Typography';

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
              className={`flex items-start gap-4 py-1.5 px-2 ${milestone['Is Complete'] ? 'bg-gray-200' : 'bg-gray-50'
                }`}
            >
              <Checkbox
                checked={milestone['Is Complete']}
                onChange={() => onMilestoneToggle?.(milestone)}
                color="default"
                className="!pt-1"
              />
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
