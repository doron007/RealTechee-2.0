import React from 'react';
import Image from 'next/image';
import { H5 } from '../../typography/H5' 

interface TagLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: string;
  label: string;
}

export const TagLabel: React.FC<TagLabelProps> = ({ 
  icon, 
  label, 
  className = '', 
  ...props 
}) => {
  return (
    <div 
      className={`inline-flex items-center gap-2 rounded-[18px] bg-[#FCF9F8] border border-[#F5EDE9] py-2 px-4 ${className}`} 
      {...props}
    >
      <Image src={icon} alt="" width={24} height={24} />
      <H5 className="text-[#2A2B2E] font-extrabold">
        {label}
      </H5>
    </div>
  );
};