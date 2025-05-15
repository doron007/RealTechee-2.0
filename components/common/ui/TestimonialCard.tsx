import React from 'react';
import { BodyContent } from '../../';

interface PillProps {
  text: string;
  className?: string;
}

const Pill = ({ text, className = '' }: PillProps) => (
  <div className={`inline-flex items-center justify-center py-1 px-3 rounded-full bg-[#EBFDF7] ${className}`}>
    <span className="text-sm font-medium text-[#2AA57D]">{text}</span>
  </div>
);

interface TestimonialCardProps {
  quote: string;
  tags?: string[];
  backgroundColor?: string;
  className?: string;
}

export default function TestimonialCard({
  quote,
  tags = [],
  backgroundColor = 'bg-white',
  className = '',
}: TestimonialCardProps) {
  return (
    <div className={`flex flex-col rounded-[20px] p-8 ${backgroundColor} ${className}`}>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <Pill key={index} text={tag} />
          ))}
        </div>
      )}
      
      <div className="flex-1">
        <BodyContent className="text-[#646469]">{quote}</BodyContent>
      </div>
    </div>
  );
}