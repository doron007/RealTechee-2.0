import React from 'react';
import { UseFormRegister, UseFormWatch, FieldErrors, Path } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { BodyContent, SubContent } from '../Typography';

interface CheckboxOption {
  value: string;
  label: string;
}

interface FormCheckboxGroupProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
  name: Path<T>;
  label: string;
  options: CheckboxOption[];
  required?: boolean;
  className?: string;
  columns?: 1 | 2 | 3;
  onChange?: (selectedValues: string[]) => void;
}

export function FormCheckboxGroup<T extends Record<string, any>>({
  register,
  watch,
  errors,
  name,
  label,
  options,
  required = false,
  className = "",
  columns = 2,
  onChange
}: FormCheckboxGroupProps<T>) {
  const watchedValues = watch(name) as string[] || [];
  const hasError = errors[name as keyof typeof errors];

  const handleCheckboxChange = (value: string, checked: boolean) => {
    let newValues: string[];
    
    if (checked) {
      newValues = [...watchedValues, value];
    } else {
      newValues = watchedValues.filter(v => v !== value);
    }
    
    if (onChange) {
      onChange(newValues);
    }
  };

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }[columns];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col gap-3">
        <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
          {label}{required && '*'}
        </BodyContent>
        
        <div className={`grid ${gridColsClass} gap-3`}>
          {options.map((option) => {
            const isChecked = watchedValues.includes(option.value);
            
            return (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  {...register(name)}
                  type="checkbox"
                  value={option.value}
                  onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                  className={`w-5 h-5 text-[#000000] bg-gray-100 border-gray-300 rounded focus:ring-[#000000] focus:ring-2 ${
                    hasError ? 'border-[#D11919]' : ''
                  }`}
                />
                <BodyContent className="text-[#2A2B2E]" spacing="none">
                  {option.label}
                </BodyContent>
              </label>
            );
          })}
        </div>

        <ErrorMessage
          errors={errors}
          name={name as any}
          render={({ message }) => (
            <SubContent className="text-[#D11919] mt-1">
              {message}
            </SubContent>
          )}
        />
      </div>
    </div>
  );
}

export default FormCheckboxGroup;