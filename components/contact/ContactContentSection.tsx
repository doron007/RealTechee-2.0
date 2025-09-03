import React, { useState, useEffect } from 'react';
import Section from '../common/layout/Section';
import H2 from '../typography/H2';
import H3 from '../typography/H3';
import P2 from '../typography/P2';
import { ProcessStepCard } from './';

interface ProcessStep {
  stepNumber: number;
  title: string;
  description: string;
}

interface ContactContentSectionProps {
  processSteps: ProcessStep[];
  formTitle: string;
  formPlaceholder?: string;
  form?: React.ReactNode; // New prop for actual form component
}

export default function ContactContentSection({ 
  processSteps, 
  formTitle, 
  formPlaceholder = "Form implementation coming next...",
  form
}: ContactContentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Section background="white" spacing="none" className="pt-12 pb-8 sm:pt-16 sm:pb-12 md:pt-20 md:pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
        {/* Mobile: Collapsible "What to Expect" */}
        {isMobile ? (
          <div className="lg:col-span-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-left hover:text-accent transition-colors"
              aria-expanded={isExpanded}
              aria-controls="process-steps"
            >
              <H3 className="text-[#2A2B2E]">What to Expect</H3>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none"
                className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''} text-gray-500`}
              >
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {isExpanded && (
              <div id="process-steps" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 animate-in slide-in-from-top-2">
                {processSteps.map((step, index) => (
                  <div key={step.stepNumber} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-accent text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">
                        {step.stepNumber}
                      </div>
                      <div className="flex-1">
                        <H3 className="text-sm sm:text-base mb-1 leading-tight">{step.title}</H3>
                        <P2 className="text-xs sm:text-sm text-gray-600 leading-relaxed">{step.description}</P2>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Desktop: Original layout */
          <div className="lg:col-span-4">
            <H2>What to Expect</H2>
            
            <div className="mt-8 space-y-8">
              {processSteps.map((step, index) => (
                <ProcessStepCard
                  key={step.stepNumber}
                  stepNumber={step.stepNumber}
                  title={step.title}
                  description={step.description}
                  isLast={index === processSteps.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Right Column: Form (692px equivalent - 8 columns) */}
        <div className="lg:col-span-8">
          {/* <SectionTitle spacing="none">{formTitle}</SectionTitle> */}
          
          {/* Actual form or placeholder */}
          <div className="mt-0">
            {form ? (
              form
            ) : (
              <div className="space-y-6">
                <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center bg-gray-50">
                  <p className="text-medium-gray mb-2">📝 {formTitle} Form</p>
                  <p className="text-sm text-light-gray">{formPlaceholder}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}