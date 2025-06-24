/**
 * DynamicSectionRenderer - Renders form sections based on configuration
 * Eliminates repetitive section declarations through schema-driven rendering
 */

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import FormSection from './FormSection';
import DynamicFieldRenderer from './DynamicFieldRenderer';
import { FormSectionConfig, getSectionFields } from '../../lib/constants/fieldConfigs';

interface DynamicSectionRendererProps<T extends Record<string, any>> {
  section: FormSectionConfig;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  watch: UseFormWatch<T>;
  className?: string;
  customChildren?: React.ReactNode; // For non-dynamic fields like AddressFields
}

/**
 * Renders a form section with its fields based on configuration
 * Supports different layout types and custom content injection
 */
export function DynamicSectionRenderer<T extends Record<string, any>>({
  section,
  register,
  errors,
  watch,
  className = "",
  customChildren
}: DynamicSectionRendererProps<T>) {
  
  const sectionFields = getSectionFields(section.id);
  
  // Handle different section layouts
  const renderSectionContent = () => {
    switch (section.layout) {
      case 'side-by-side':
        return renderSideBySideLayout();
      case 'two-column':
        return renderTwoColumnLayout();
      default:
        return renderDefaultLayout();
    }
  };

  // Default vertical layout
  const renderDefaultLayout = () => (
    <>
      {sectionFields.map((field) => (
        <DynamicFieldRenderer
          key={field.id}
          field={field}
          register={register}
          errors={errors}
          watch={watch}
        />
      ))}
      {customChildren}
    </>
  );

  // Side-by-side layout (used for Note and Finance section)
  const renderSideBySideLayout = () => (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full">
      {sectionFields.map((field) => (
        <div key={field.id} className={field.id === 'notes' ? 'flex-1' : 'flex flex-col gap-4 lg:min-w-[200px]'}>
          <DynamicFieldRenderer
            field={field}
            register={register}
            errors={errors}
            watch={watch}
          />
        </div>
      ))}
      {customChildren}
    </div>
  );

  // Two-column layout
  const renderTwoColumnLayout = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sectionFields.map((field) => (
        <DynamicFieldRenderer
          key={field.id}
          field={field}
          register={register}
          errors={errors}
          watch={watch}
        />
      ))}
      {customChildren}
    </div>
  );

  return (
    <FormSection
      title={section.title}
      sectionClassName={`${className} ${section.className || ''}`}
    >
      {section.description && (
        <p className="text-[#2A2B2E] w-full mb-4">
          {section.description}
        </p>
      )}
      {renderSectionContent()}
    </FormSection>
  );
}

export default DynamicSectionRenderer;