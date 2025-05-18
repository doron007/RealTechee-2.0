import React, { useState } from 'react';
import TestimonialCard from '../common/ui/TestimonialCard';
import { Subtitle, SubContent } from '../';
import Section from '../common/layout/Section';
import { ProductType } from './HeroSection';
import SliderNavigation from '../common/ui/SliderNavigation';

interface Testimonial {
  id?: number;
  pills: string[];
  testimonial: string;
}

const TESTIMONIALS_CONTENT = {
  [ProductType.SELLER]: {
    title: 'Read What Our Sellers Say',
    background_color: '#F9EAE6',
    text_color: '#E9674A',
    pill_background_color: '#ECFEF7',
    pill_text_color: '#2AA67D',
    testimonials: [
      {
        pills: ['Stress-Free Process', 'Exceeding Expectations'],
        testimonial: 'Thanks to Realtechee, our home improvement journey was stress-free. The results? Beyond our wildest dreams. They truly go above and beyond for their clients!'
      },
      {
        pills: ['Seamless Integration', 'Comprehensive Service'],
        testimonial: 'The seamless integration of Realtechee\'s services into our renovation process was a breath of fresh air. Their team handled everything, leaving no stone unturned!'
      },
      {
        pills: ['Professionalism', 'Boosted Market Value'],
        testimonial: 'Realtechee\'s professionalism and expertise turned our house from lackluster to luxurious, significantly boosting its market value. Their attention to detail is unmatched!'
      },
      {
        pills: ['Gallery', 'Live updates'],
        testimonial: 'The \'before and after\' gallery gave me peace of mind. Watching my home\'s transformation on Realtechee was astonishing!'
      },
      {
        pills: ['Dashboard', 'Clarity & Control'],
        testimonial: 'As an agent, Realtechee\'s dashboard offers clarity and control over every project. This platform is a game-changer!'
      },
      {
        pills: ['Live Updates', 'Communication'],
        testimonial: 'Realtechee transformed our selling experience. Zero upfront costs, transparent communication – it\'s simply unparalleled!'
      }
    ]
  },
  [ProductType.BUYER]: {
    title: 'Success Stories from Buyers',
    background_color: '#F2F9FF',
    text_color: '#16619D',
    pill_background_color: '#D1E3F3',
    pill_text_color: '#16619D',
    testimonials: [
      {
        pills: ['Unmatched value', 'Budget estimate'],
        testimonial: 'Thanks to RealTechee\'s buyer services, my client was able to explore more properties within budget. Their renovation program truly elevated the home buying experience.'
      },
      {
        pills: ['Project visibility', 'Value'],
        testimonial: 'As an agent, partnering with RealTechee has been a game-changer. Their turn-key management solutions have given my clients more options and me a competitive edge.'
      },
      {
        pills: ['Project management', 'Renovation program'],
        testimonial: 'Our agent introduced us to RealTechee, and it made our home buying experience & renovation stress-free. We couldn\'t be more satisfied with the results.'
      },
      {
        pills: ['Value', 'Communication tools'],
        testimonial: 'With RealTechee, I can provide more value to my clients. The communication tools keep everyone in the loop, ensuring projects run smoothly.'
      },
      {
        pills: ['Budget estimate', 'Home buyer service'],
        testimonial: 'As a homebuyer, I couldn\'t be happier with RealTechee. They helped us turn our house into a dream home while staying within budget.'
      },
      {
        pills: ['Renovation program', 'Unmatched value'],
        testimonial: 'RealTechee is truly the future of home buying. The blend of technology with their renovation program offers unmatched value to both agents and buyers.'
      }
    ]
  },
  [ProductType.KITCHEN_BATH]: {
    title: 'Success Stories from Kitchen and Bath Specialists',
    background_color: '#ECFEF7',
    text_color: '#1F8061',
    pill_background_color: '#D4F0E8',
    pill_text_color: '#1F8061',
    testimonials: [
      {
        pills: ['Efficient Prospecting', 'More Opportunities'],
        testimonial: 'RealTechee\'s lead generation tools saved us time and effort, resulting in more projects.'
      },
      {
        pills: ['Simplified Workflow', 'Happy Clients'],
        testimonial: 'Our clients are delighted with the results achieved using RealTechee\'s services.'
      },
      {
        pills: ['Increased Revenue', 'Enhanced Profitability'],
        testimonial: 'RealTechee helped us boost profits by streamlining our processes and generating additional revenue.'
      },
      {
        pills: ['Digital Prominence', 'Online Exposure'],
        testimonial: 'RealTechee significantly enhanced our online visibility, attracting more customers.'
      },
      {
        pills: ['Smooth Interactions', 'Easy Collaboration'],
        testimonial: 'Communication with clients, contractors, and our team became effortless thanks to RealTechee.'
      },
      {
        pills: ['Easy Coordination', 'Increased Revenue'],
        testimonial: 'RealTechee\'s project management tools made our projects run like clockwork.'
      }
    ]
  },
  [ProductType.COMMERCIAL]: {
    title: 'Success Stories from Commercial Real Estate Agents',
    background_color: '#FFF8E6',
    text_color: '#6B4E00',
    pill_background_color: '#FFF8E6',
    pill_text_color: '#6B4E00',
    testimonials: [
      {
        pills: ['Great ROI', 'Growth'],
        testimonial: 'The revenue-sharing aspect has been instrumental in our growth.'
      },
      {
        pills: ['Live Chat', 'Communication'],
        testimonial: 'RealTechee\'s live chat feature saved us countless hours in project communication.'
      },
      {
        pills: ['Financing', 'Happy Clients'],
        testimonial: 'RealTechee\'s comprehensive services and financing options helped us secure more clients and close deals faster.'
      },
      {
        pills: ['Communication', 'Project Visibility'],
        testimonial: 'The real-time visibility and communication tools made our projects run smoother than ever before.'
      },
      {
        pills: ['Increase Profit', 'More Leads'],
        testimonial: 'RealTechee\'s platform boosted my profitability and expanded my client base.'
      },
      {
        pills: ['Project Management', 'Increased Returns'],
        testimonial: 'RealTechee\'s Commercial Program transformed our project management, leading to quicker turnovers and higher returns.'
      }
    ]
  },
  [ProductType.ARCHITECT_DESIGNER]: {
    title: 'Success Stories from Architects & Designers',
    background_color: '#FFF7F6',
    text_color: '#D45D43',
    pill_background_color: '#F6EDEA',
    pill_text_color: '#D45D43',
    testimonials: [
      {
        pills: ['Assistance', 'Partner Support'],
        testimonial: 'The comprehensive assistance I received provided unmatched support.'
      },
      {
        pills: ['Profit Growth', 'Lead Generation'],
        testimonial: 'Increased leads and higher profits – it\'s been a game-changer.'
      },
      {
        pills: ['Value-Added', 'Client Satisfaction'],
        testimonial: 'The program\'s support helped me deliver even more value to my clients.'
      },
      {
        pills: ['Efficient Execution', 'Project Visibility'],
        testimonial: 'Efficient execution designs for my clients have become a reality with Realtechee\'s services.'
      },
      {
        pills: ['Lead Generation', 'Business Growth'],
        testimonial: 'My design business\'s success is soaring with Realtechee\'s incredible partnership.'
      },
      {
        pills: ['Client Satisfaction', 'Project Management'],
        testimonial: 'My architectural practice has seen a process revolution, thanks to Realtechee\'s support.'
      }
    ]
  }
};

interface TestimonialsSectionProps {
  className?: string;
  productType: ProductType;
  // Optional overrides
  sectionLabel?: string;
  title?: string;
  testimonials?: Testimonial[];
}

export default function TestimonialsSection({
  className = '',
  productType,
  sectionLabel,
  title,
}: TestimonialsSectionProps) {
  const content = TESTIMONIALS_CONTENT[productType];
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(content.testimonials.length / 3);
  
  // Get current testimonials to display (3 per page)
  const currentTestimonials = content.testimonials.slice(currentPage * 3, (currentPage + 1) * 3);
  
  // Navigation handlers
  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };
  
  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  return (
    <Section
      background="none"
      spacing="medium"
      id="testimonials"
      className={`${className} bg-[${content.background_color}]`}
      marginTop={0}
      marginBottom={0}
      paddingTop={{ default: 74, md: 130, '2xl': 150 }}
      paddingBottom={{ default: 74, md: 130, '2xl': 150 }}
    >
      <div className="text-center mb-8 md:mb-12 animate-on-scroll">
        <SubContent className={`text-[${content.text_color}] mb-2`}>TESTIMONIALS</SubContent>
        <Subtitle className="mb-4 md:mb-6">{content.title}</Subtitle>
      </div>

      {/* Testimonials 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {currentTestimonials.map((testimonial, index) => (
          <div key={index} className="animate-on-scroll" style={{ animationDelay: `${index * 100}ms` }}>
            <TestimonialCard
              backgroundColor="bg-white"
              className="h-full shadow-md rounded-lg p-6"
              pills={testimonial.pills}
              testimonial={testimonial.testimonial}
              pillBackgroundColor={content.pill_background_color}
              pillTextColor={content.pill_text_color}
            />
          </div>
        ))}
      </div>

      {/* Navigation controls */}
      {totalPages > 1 && (
        <SliderNavigation 
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevious={handlePrev}
          onNext={handleNext}
          onPageSelect={setCurrentPage}
          accentColor={content.text_color}
        />
      )}
    </Section>
  );
}