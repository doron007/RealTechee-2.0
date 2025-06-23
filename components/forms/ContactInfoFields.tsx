import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { SubContent } from '../Typography';

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
}

export function ContactInfoFields<T extends Record<string, any>>({
  register,
  errors,
  prefix,
  nameLabel = "Full name*",
  emailLabel = "Email Address*",
  phoneLabel = "Phone Number*"
}: ContactInfoFieldsProps<T>) {
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
            {nameLabel}
          </label>
          <div className="w-full bg-white border border-[#D2D2D4] rounded px-6 py-4 flex items-center">
            <input
              {...register(`${prefix}.fullName` as Path<T>)}
              className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
              placeholder=""
            />
          </div>
          {getFieldError('fullName') && (
            <SubContent className="text-[#D11919] mt-1">
              {getFieldError('fullName')}
            </SubContent>
          )}
        </div>
      </div>

      {/* Email and Phone - Side by Side */}
      <div className="flex gap-5 w-full">
        {/* Email Address */}
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
              {emailLabel}
            </label>
            <div className="w-full bg-white border border-[#D2D2D4] rounded px-6 py-4 flex items-center">
              <input
                {...register(`${prefix}.email` as Path<T>)}
                type="email"
                className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                placeholder=""
              />
            </div>
            {getFieldError('email') && (
              <SubContent className="text-[#D11919] mt-1">
                {getFieldError('email')}
              </SubContent>
            )}
          </div>
        </div>

        {/* Phone Number */}
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
              {phoneLabel}
            </label>
            <div className="w-full bg-white border border-[#D2D2D4] rounded px-6 py-4 flex items-center">
              <input
                {...register(`${prefix}.phone` as Path<T>)}
                type="tel"
                className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                placeholder="Add 10 digits (numbers only) ..."
              />
            </div>
            {getFieldError('phone') && (
              <SubContent className="text-[#D11919] mt-1">
                {getFieldError('phone')}
              </SubContent>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ContactInfoFields;