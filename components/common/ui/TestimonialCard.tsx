import React, { ReactNode } from 'react';
import { CardText, SubtitlePill } from '../../Typography';

interface TestimonialCardProps {
  /**
   * Background color for the card
   */
  backgroundColor?: string;
  
  /**
   * Additional class names for the card
   */
  className?: string;
  
  /**
   * Array of pill labels to display
   */
  pills?: string[];
  
  /**
   * Background color for the pills
   */
  pillBackgroundColor?: string;
  
  /**
   * Text color for the pills
   */
  pillTextColor?: string;
  
  /**
   * The testimonial text content
   */
  testimonial?: string;
  
  /**
   * Optional custom content instead of using the pills/testimonial props
   */
  children?: ReactNode;
}

/**
 * Testimonial Card component for displaying customer testimonials
 */
export default function TestimonialCard({
  backgroundColor = 'bg-white',
  className = '',
  pills = [],
  pillBackgroundColor = '#F6EDEA',
  pillTextColor = '#D45D43',
  testimonial = '',
  children
}: TestimonialCardProps) {
  return (
    <div className={`${backgroundColor} ${className} flex flex-col h-full rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg`}>
      {children ? (
        children
      ) : (
        <>
          {/* Pills stacked vertically and centered */}
          {pills.length > 0 && (
            <div className="flex flex-col items-center gap-2 mb-4">
              {pills.map((pill, pillIndex) => (
                <SubtitlePill 
                  key={pillIndex}
                  className={`bg-[${pillBackgroundColor}] text-[${pillTextColor}]`}
                  uppercase={false}
                >
                  {pill}
                </SubtitlePill>
              ))}
            </div>
          )}
          
          {/* Testimonial text using CardText for better design consistency */}
          {testimonial && 
            <CardText className="text-gray-700 italic">
              {testimonial}
            </CardText>
          }
        </>
      )}
    </div>
  );
}