import React, { useState } from 'react';
import Image from 'next/image';
import { ButtonText } from '../../';
import TestimonialCard from './TestimonialCard';

interface TestimonialItem {
  id: number;
  quote: string;
  tags: string[];
}

interface TestimonialCarouselProps {
  testimonials: TestimonialItem[];
  className?: string;
}

export default function TestimonialCarousel({
  testimonials,
  className = '',
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const isAtBeginning = currentIndex === 0;
  const isAtEnd = currentIndex === testimonials.length - 1;

  // Show 3 testimonials at a time on desktop, 1 on mobile
  const visibleTestimonials = [];
  for (let i = 0; i < 3; i++) {
    const index = (currentIndex + i) % testimonials.length;
    if (testimonials[index]) {
      visibleTestimonials.push(testimonials[index]);
    }
  }

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {visibleTestimonials.map((testimonial, index) => (
          <div 
            key={`${testimonial.id}-${index}`} 
            className={`transition-opacity duration-300 ${index > 0 ? 'hidden md:block' : ''}`}
          >
            <TestimonialCard quote={testimonial.quote} tags={testimonial.tags} />
          </div>
        ))}
      </div>

      <div className="flex justify-end items-center gap-3">
        <button 
          onClick={goToPrevious} 
          className={`flex items-center gap-2 py-2 px-3 rounded ${
            isAtBeginning 
              ? 'text-[#BCBCBF] cursor-not-allowed' 
              : 'text-[#2A2B2E] hover:bg-gray-100'
          }`}
          disabled={isAtBeginning}
        >
          <Image 
            src="/assets/icons/arrow-right.svg" 
            alt="Previous" 
            width={16} 
            height={16} 
            className={`transform rotate-180 ${isAtBeginning ? 'opacity-50' : ''}`}
          />
          <ButtonText>Back</ButtonText>
        </button>
        
        <button 
          onClick={goToNext} 
          className={`flex items-center gap-2 py-2 px-3 rounded ${
            isAtEnd 
              ? 'text-[#BCBCBF] cursor-not-allowed' 
              : 'text-[#2A2B2E] hover:bg-gray-100'
          }`}
          disabled={isAtEnd}
        >
          <ButtonText>Next</ButtonText>
          <Image 
            src="/assets/icons/arrow-right.svg" 
            alt="Next" 
            width={16} 
            height={16} 
            className={isAtEnd ? 'opacity-50' : ''}
          />
        </button>
      </div>
    </div>
  );
}