/**
 * FormSection component - Standardizes form section layout
 * Eliminates repeated section structure across all forms
 */

import React from 'react';
import { SectionTitle } from '../Typography';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  titleClassName?: string;
  sectionClassName?: string;
  contentClassName?: string;
}

/**
 * Standardized form section with title and content area
 * Used consistently across all contact forms
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  titleClassName = "text-[#2A2B2E]",
  sectionClassName = "flex flex-col gap-4",
  contentClassName = "flex flex-col gap-4"
}) => {
  return (
    <div className={sectionClassName}>
      <SectionTitle className={titleClassName}>
        {title}
      </SectionTitle>
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
};

export default FormSection;