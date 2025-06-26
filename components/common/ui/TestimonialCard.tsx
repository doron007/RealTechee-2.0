import React, { ReactNode } from 'react';
import { P2 } from '../../typography/P2'
import { P3 } from '../../typography/P3' 

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
                <div 
                  key={pillIndex}
                  className="inline-flex px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: pillBackgroundColor,
                    color: pillTextColor
                  }}
                >
                  <P3 className="text-center">
                    {pill}
                  </P3>
                </div>
              ))}
            </div>
          )}
          
          {/* Testimonial text using P2 for better design consistency */}
          {testimonial && 
            <P2 className="text-gray-700 italic">
              {testimonial}
            </P2>
          }
        </>
      )}
    </div>
  );
}