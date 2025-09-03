import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import P3 from '../typography/P3';

interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface ContactInfoFieldsProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  prefix: Path<T>; // e.g., "homeownerInfo" or "agentInfo"
  nameLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  optional?: boolean; // When true, fields are not required
}

export function ContactInfoFields<T extends Record<string, any>>({
  register,
  errors,
  prefix,
  nameLabel = "Full name*",
  emailLabel = "Email Address*",
  phoneLabel = "Phone Number*",
  optional = false
}: ContactInfoFieldsProps<T>) {
  // Update default labels to remove asterisks when optional
  const finalNameLabel = optional && nameLabel === "Full name*" ? "Full name" : nameLabel;
  const finalEmailLabel = optional && emailLabel === "Email Address*" ? "Email Address" : emailLabel;
  const finalPhoneLabel = optional && phoneLabel === "Phone Number*" ? "Phone Number" : phoneLabel;
  const getFieldError = (field: string): string | undefined => {
    const prefixParts = prefix.split('.');
    let errorObj: any = errors;
    
    for (const part of prefixParts) {
      errorObj = errorObj?.[part];
    }
    
    return errorObj?.[field]?.message as string | undefined;
  };

  return (
    <>
      {/* Full Name - Full Width */}
      <div className="w-full">
        <div className="flex flex-col gap-1">
          <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
            {finalNameLabel}
          </label>
          <div className={`w-full bg-white border rounded px-6 py-4 flex items-center ${getFieldError('fullName') ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
            <input
              {...register(`${prefix}.fullName` as Path<T>)}
              className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
              placeholder=""
              required={!optional}
            />
          </div>
          <ErrorMessage
            errors={errors}
            name={`${prefix}.fullName` as any}
            render={({ message }) => (
              <P3 className="text-[#D11919] mt-1">
                {message}
              </P3>
            )}
          />
        </div>
      </div>

      {/* Email and Phone - Responsive Layout */}
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-5 w-full">
        {/* Email Address */}
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-sm sm:text-base font-normal text-[#2A2B2E] leading-[1.6]">
              {finalEmailLabel}
            </label>
            <div className={`w-full bg-white border rounded px-3 py-3 sm:px-6 sm:py-4 flex items-center ${getFieldError('email') ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
              <input
                {...register(`${prefix}.email` as Path<T>)}
                type="email"
                className="w-full bg-transparent border-0 outline-0 text-sm sm:text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                placeholder=""
                required={!optional}
              />
            </div>
            <ErrorMessage
              errors={errors}
              name={`${prefix}.email` as any}
              render={({ message }) => (
                <P3 className="text-[#D11919] mt-1">
                  {message}
                </P3>
              )}
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-sm sm:text-base font-normal text-[#2A2B2E] leading-[1.6]">
              {finalPhoneLabel}
            </label>
            <div className={`w-full bg-white border rounded px-3 py-3 sm:px-6 sm:py-4 flex items-center ${getFieldError('phone') ? 'border-[#D11919]' : 'border-[#D2D2D4]'}`}>
              <input
                {...register(`${prefix}.phone` as Path<T>)}
                type="tel"
                className="w-full bg-transparent border-0 outline-0 text-sm sm:text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                placeholder="Add 10 digits (numbers only) ..."
                required={!optional}
              />
            </div>
            <ErrorMessage
              errors={errors}
              name={`${prefix}.phone` as any}
              render={({ message }) => (
                <P3 className="text-[#D11919] mt-1">
                  {message}
                </P3>
              )}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default ContactInfoFields;