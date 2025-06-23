import React from 'react';
import Section from '../common/layout/Section';
import { SectionTitle } from '../Typography';
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
  return (
    <Section background="white" spacing="none" className="pt-20 pb-12 sm:pt-20 sm:pb-16 md:pt-20 md:pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: What to Expect (386px equivalent - 4 columns) */}
        <div className="lg:col-span-4">
          <SectionTitle spacing="none">What to Expect</SectionTitle>
          
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

        {/* Right Column: Form (692px equivalent - 8 columns) */}
        <div className="lg:col-span-8">
          <SectionTitle spacing="none">{formTitle}</SectionTitle>
          
          {/* Actual form or placeholder */}
          <div className="mt-6">
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