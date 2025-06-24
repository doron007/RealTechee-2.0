import React from 'react';
import { UseFormRegister, UseFormWatch, FieldErrors, Path } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { BodyContent, SubContent } from '../Typography';

interface RadioOption {
  value: string;
  label: string;
}

interface FormRadioGroupProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
  name: Path<T>;
  label: string;
  options: RadioOption[];
  required?: boolean;
  className?: string;
  direction?: 'horizontal' | 'vertical';
}

export function FormRadioGroup<T extends Record<string, any>>({
  register,
  watch,
  errors,
  name,
  label,
  options,
  required = false,
  className = "",
  direction = 'horizontal'
}: FormRadioGroupProps<T>) {
  const watchedValue = watch(name);
  const hasError = errors[name as keyof typeof errors];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col gap-3">
        <BodyContent as="label" className="text-[#2A2B2E]" spacing="none">
          {label}{required && '*'}
        </BodyContent>
        
        <div className={`flex gap-4 ${direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'}`}>
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                {...register(name)}
                type="radio"
                value={option.value}
                className="sr-only"
              />
              <div className="relative">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  hasError 
                    ? 'border-[#D11919]' 
                    : watchedValue === option.value 
                      ? 'border-[#2A2B2E]' 
                      : 'border-[#D2D2D4]'
                } bg-white`}>
                  {watchedValue === option.value && (
                    <div className="w-[10.67px] h-[10.67px] rounded-full bg-[#2A2B2E]" />
                  )}
                </div>
              </div>
              <BodyContent as="span" className="text-[#2A2B2E]" spacing="none">
                {option.label}
              </BodyContent>
            </label>
          ))}
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

export default FormRadioGroup;