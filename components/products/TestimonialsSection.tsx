import React from 'react';
import { SectionLabel, SectionTitle } from '../';
import { TestimonialCarousel } from '../common/ui';
import Section from '../common/layout/Section';

interface Testimonial {
  id: number;
  quote: string;
  tags: string[];
}

interface TestimonialsSectionProps {
  sectionLabel: string;
  title: string;
  testimonials: Testimonial[];
  className?: string;
}

export default function TestimonialsSection({
  sectionLabel,
  title,
  testimonials,
  className = '',
}: TestimonialsSectionProps) {
  return (
    <Section
      background="light"
      spacing="medium"
      id="testimonials"
      className={`bg-[#F8E9E6] ${className}`}
    >
      <div className="text-center mb-10 animate-on-scroll">
        <SectionLabel className="text-[#FF5F45] mb-2">{sectionLabel}</SectionLabel>
        <SectionTitle className="mb-6">{title}</SectionTitle>
      </div>
      
      <TestimonialCarousel 
        testimonials={testimonials} 
        className="animate-on-scroll"
      />
    </Section>
  );
}