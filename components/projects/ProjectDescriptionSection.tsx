import React from 'react';
import Image from 'next/image';
import { CollapsibleSection } from '../common/ui';
import { CardTitle, BodyContent } from '../Typography';
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
        <BodyContent>{description}</BodyContent>
      </CollapsibleSection>
    </div>
  );
}
