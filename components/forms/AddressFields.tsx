import React from 'react';
import { UseFormRegister, FieldErrors, Path } from 'react-hook-form';
import { SubContent } from '../Typography';

interface AddressFieldsProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  prefix: Path<T>; // e.g., "propertyAddress" or "address"
  addressLabel?: string;
}

export function AddressFields<T extends Record<string, any>>({
  register,
  errors,
  prefix,
  addressLabel = "Address*"
}: AddressFieldsProps<T>) {
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
      {/* Full Address - Full Width */}
      <div className="w-full">
        <div className="flex flex-col gap-1">
          <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
            {addressLabel}
          </label>
          <div className="w-full bg-white border border-[#D2D2D4] rounded px-6 py-4 flex items-center">
            <input
              {...register(`${prefix}.streetAddress` as Path<T>)}
              className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
              placeholder=""
            />
          </div>
          {getFieldError('streetAddress') && (
            <SubContent className="text-[#D11919] mt-1">
              {getFieldError('streetAddress')}
            </SubContent>
          )}
        </div>
      </div>

      {/* State, City, ZIP - Three Columns */}
      <div className="flex gap-5 w-full">
        {/* State */}
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
              State*
            </label>
            <div className="w-full bg-white border border-[#D2D2D4] rounded px-6 py-4 flex items-center justify-between">
              <select
                {...register(`${prefix}.state` as Path<T>)}
                className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] appearance-none"
                defaultValue="CA"
              >
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AS">American Samoa</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="DC">District Of Columbia</option>
                <option value="FM">Federated States Of Micronesia</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="GU">Guam</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MH">Marshall Islands</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="MP">Northern Mariana Islands</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PW">Palau</option>
                <option value="PA">Pennsylvania</option>
                <option value="PR">Puerto Rico</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VI">Virgin Islands</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
              </select>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M4 8L12 16L20 8" stroke="#2A2B2E" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {getFieldError('state') && (
              <SubContent className="text-[#D11919] mt-1">
                {getFieldError('state')}
              </SubContent>
            )}
          </div>
        </div>

        {/* City */}
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
              City*
            </label>
            <div className="w-full bg-white border border-[#D2D2D4] rounded px-6 py-4 flex items-center">
              <input
                {...register(`${prefix}.city` as Path<T>)}
                className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                placeholder=""
              />
            </div>
            {getFieldError('city') && (
              <SubContent className="text-[#D11919] mt-1">
                {getFieldError('city')}
              </SubContent>
            )}
          </div>
        </div>

        {/* ZIP */}
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <label className="text-base font-normal text-[#2A2B2E] leading-[1.6]">
              ZIP*
            </label>
            <div className="w-full bg-white border border-[#D2D2D4] rounded px-6 py-4 flex items-center">
              <input
                {...register(`${prefix}.zip` as Path<T>)}
                className="w-full bg-transparent border-0 outline-0 text-base font-normal text-[#2A2B2E] leading-[1.6] placeholder:text-[#646469]"
                placeholder=""
                maxLength={10}
              />
            </div>
            {getFieldError('zip') && (
              <SubContent className="text-[#D11919] mt-1">
                {getFieldError('zip')}
              </SubContent>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AddressFields;