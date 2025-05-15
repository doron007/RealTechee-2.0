import React from 'react';
import { SectionLabel, SectionTitle, BodyContent } from '../';
import Section from '../common/layout/Section';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  sectionLabel: string;
  title: string;
  faqs: FAQItem[];
  className?: string;
}

export default function FAQSection({
  sectionLabel,
  title,
  faqs,
  className = '',
}: FAQSectionProps) {
  return (
    <Section
      background="light"
      spacing="medium"
      id="faq"
      className={className}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-on-scroll">
          <SectionLabel className="text-[#FF5F45] mb-2">{sectionLabel}</SectionLabel>
          <SectionTitle className="mb-6">{title}</SectionTitle>
        </div>
        
        <div className="space-y-6 animate-on-scroll">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-card">
              <SectionTitle as="h3" className="text-xl font-bold text-gray-900 mb-3">{faq.question}</SectionTitle>
              <BodyContent className="text-gray-700">
                {faq.answer}
              </BodyContent>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}