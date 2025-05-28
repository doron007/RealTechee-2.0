import React, { useState } from 'react';
import Image from 'next/image';
import { SectionTitle, CardTitle } from '../../Typography';

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
    <div className="mb-8 border rounded-lg overflow-hidden">
      <button 
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
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
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
