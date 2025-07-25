import React, { useState } from 'react';
import Image from 'next/image';
import H3 from '../../typography/H3';

interface CollapsibleSectionProps {
  title: string;
  initialExpanded?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  initialExpanded = true,
  children 
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);

  return (
    <div className="mb-4 overflow-hidden">
      <button 
        className="w-full flex justify-between items-center py-2 hover:bg-gray-100 transition-colors text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <H3 className="mb-0">{title}</H3>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <Image 
            src="/assets/icons/ic-arrow-down.svg"
            alt={isExpanded ? "Collapse" : "Expand"}
            width={20}
            height={20}
          />
        </div>
      </button>
      {isExpanded && (
        <div className="py-2 pl-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
