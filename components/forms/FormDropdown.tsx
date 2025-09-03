import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { KeyboardArrowDown } from '@mui/icons-material';
import FormFieldWrapper from './FormFieldWrapper';
import FormFieldContainer from './FormFieldContainer';

interface FormDropdownProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}

/**
 * FormDropdown component using enterprise wrapper components
 * Dramatically reduced from 87 lines to ~50 lines
 * Leverages FormFieldWrapper and FormFieldContainer for consistency
 */
export function FormDropdown<T extends Record<string, any>>({
  register,
  errors,
  name,
  label,
  placeholder,
  options,
  required = false,
  defaultValue,
  className = ""
}: FormDropdownProps<T>) {

  // Dropdown arrow icon using MUI
  const DropdownIcon = () => (
    <KeyboardArrowDown 
      sx={{ 
        color: '#2A2B2E',
        fontSize: 24,
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none'
      }}
    />
  );

  return (
    <FormFieldWrapper
      register={register}
      errors={errors}
      name={name}
      label={label}
      required={required}
      className={className}
    >
      {(hasError, fieldId) => (
        <FormFieldContainer hasError={hasError} size="md" className="relative">
          <select
            {...register(name)}
            id={fieldId}
            className="w-full bg-transparent border-0 outline-0 text-base font-normal leading-[1.4] appearance-none pr-8 text-[#2A2B2E]"
            style={{ fontSize: 'max(16px, 1rem)' }}
            defaultValue={defaultValue}
            required={required}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <DropdownIcon />
        </FormFieldContainer>
      )}
    </FormFieldWrapper>
  );
}

export default FormDropdown;