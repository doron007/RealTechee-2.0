import React from 'react';
import { UseFormRegister, UseFormWatch, FieldErrors, Path } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { BodyContent, SubContent } from '../Typography';

interface ButtonOption {
  value: string;
  label: string;
}

interface FormButtonGroupProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
  name: Path<T>;
  label: string;
  options: ButtonOption[];
  required?: boolean;
  className?: string;
  responsive?: boolean;
}

export function FormButtonGroup<T extends Record<string, any>>({
  register,
  watch,
  errors,
  name,
  label,
  options,
  required = false,
  className = "",
  responsive = true
}: FormButtonGroupProps<T>) {
  const watchedValue = watch(name);
  const hasError = errors[name as keyof typeof errors];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col gap-3">
        <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
          {label}{required && '*'}
        </BodyContent>
        
        <div className={`flex gap-3 w-full ${
          responsive ? 'flex-col sm:flex-row sm:gap-5' : 'flex-row'
        }`}>
          {options.map((option) => {
            const isSelected = watchedValue === option.value;
            
            return (
              <label
                key={option.value}
                className={`flex-1 px-6 py-4 rounded border text-base font-[800] leading-[1.2] font-nunito text-center cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#000000] text-white border-[#2A2B2E]'
                    : hasError
                      ? 'bg-white text-[#2A2B2E] border-[#D11919]'
                      : 'bg-white text-[#2A2B2E] border-[#2A2B2E] hover:bg-[#f5f5f5]'
                }`}
              >
                <input
                  {...register(name)}
                  type="radio"
                  value={option.value}
                  className="sr-only"
                />
                {option.label}
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

export default FormButtonGroup;