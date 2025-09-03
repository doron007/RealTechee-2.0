import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import P1 from '../typography/P1';
import P3 from '../typography/P3';

interface FormDateTimeInputProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  name: Path<T>;
  label: string;
  type: 'date' | 'time' | 'datetime-local';
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
  showIcon?: boolean;
}

export function FormDateTimeInput<T extends Record<string, any>>({
  register,
  errors,
  name,
  label,
  type,
  placeholder = "",
  required = false,
  min,
  max,
  className = "",
  showIcon = true
}: FormDateTimeInputProps<T>) {
  const hasError = errors[name as keyof typeof errors];

  const getIcon = () => {
    if (!showIcon) return null;
    
    if (type === 'date' || type === 'datetime-local') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="#646469"/>
        </svg>
      );
    }
    
    if (type === 'time') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.7L16.2,16.2Z" fill="#646469"/>
        </svg>
      );
    }
    
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col gap-1">
        <P1 className="text-[#2A2B2E] font-medium">
          {label}{required && '*'}
        </P1>
        <div className={`w-full bg-white border rounded px-4 py-3 flex items-center justify-between ${
          hasError ? 'border-[#D11919]' : 'border-[#D2D2D4]'
        }`}>
          <input
            {...register(name)}
            type={type}
            className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.4] placeholder:text-[#646469]"
            style={{ fontSize: 'max(16px, 1rem)' }}
            placeholder={placeholder}
            min={min}
            max={max}
          />
          {getIcon()}
        </div>
        <ErrorMessage
          errors={errors}
          name={name as any}
          render={({ message }) => (
            <P3 className="text-[#D11919] mt-1">
              {message}
            </P3>
          )}
        />
      </div>
    </div>
  );
}

export default FormDateTimeInput;