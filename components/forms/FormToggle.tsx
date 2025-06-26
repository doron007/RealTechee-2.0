import React from 'react';
import { UseFormRegister, Path } from 'react-hook-form';
import P1 from '../typography/P1';

interface FormToggleProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  name: Path<T>;
  label: string;
  className?: string;
}

export function FormToggle<T extends Record<string, any>>({
  register,
  name,
  label,
  className = ""
}: FormToggleProps<T>) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <P1 className="text-[#2A2B2E] font-medium">
        {label}
      </P1>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          {...register(name)}
          type="checkbox"
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#000000]"></div>
      </label>
    </div>
  );
}

export default FormToggle;