import React from 'react';
import { Checkbox } from '@mui/material';
import { CollapsibleSection } from '../common/ui';
import P2 from '../typography/P2';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  isComplete: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
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
  // Sort milestones: completed first, then by order, then by creation date (legacy first)
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

    // If neither has order, sort by creation date (legacy business date first)
    // Priority: createdDate (legacy) > createdAt (Amplify auto-generated)
    const dateA = new Date(a.createdDate || a.createdAt || 0);
    const dateB = new Date(b.createdDate || b.createdAt || 0);
    return dateA.getTime() - dateB.getTime(); // Earliest first for milestones
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
                <P2 className="mb-0 text-[#2A2B2E]">{milestone.name}</P2>
                {milestone.description && (
                  <P2 className="mb-0 text-gray-600 whitespace-pre-line">{milestone.description}</P2>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
