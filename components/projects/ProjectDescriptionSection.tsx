import React from 'react';
import Image from 'next/image';
import { CollapsibleSection } from '../common/ui';
import P2 from '../typography/P2';
import { formatCurrency } from '../../utils/formatUtils';

export interface ProjectDescriptionSection {
  description: string;
}

interface ProjectDescriptionSectionProps {
  description?: string;
  title?: string;
  initialExpanded?: boolean;
  className?: string;
}

export default function ProjectDescriptionSection({
  description = "This handsomely upgraded propoerty will not last on the market!",
  title = "Project Description",
  initialExpanded = true,
  className = ""
}: ProjectDescriptionSectionProps) {

  return (
    <div className={className}>
      <CollapsibleSection title={title} initialExpanded={initialExpanded}>
        <P2>{description}</P2>
      </CollapsibleSection>
    </div>
  );
}
