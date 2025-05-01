import React from 'react';
import Image from 'next/image';

/**
 * BrandIdentitySection component that displays brand identity and logo alternatives
 * Follows the Figma layout with a side-by-side arrangement
 */
export default function BrandIdentitySection(props: any) {
  return (
    <div className="relative w-full md:w-[548px] h-auto md:h-24 mb-12">
      {/* Brand Identity - Left Side */}
      <div className="absolute left-0 top-0 inline-flex flex-col justify-start items-start gap-7">
        <div className="justify-start">
          <span className="text-neutral-400 text-lg font-normal font-inter">BI </span>
          <span className="text-neutral-400 text-sm font-normal font-['Playfair_Display']">Brand Identity</span>
        </div>
        <div className="w-full h-12 flex items-center">
          <Image 
            src="/assets/images/brand_logos_realtechee-horizontal.png" 
            alt="RealTechee Logo" 
            width={353} 
            height={48} 
            className="object-contain"
          />
        </div>
      </div>
      
      {/* Logo Alternative - Right Side */}
      <div className="absolute left-0 md:left-[410px] top-[110px] md:top-0 inline-flex flex-col justify-start items-start gap-7">
        <div className="text-neutral-400 text-lg font-normal font-inter">Logo alternative</div>
        <div className="h-12 flex items-center">
          <Image 
            src="/assets/images/brand_logos_web_Logo alternative 39x48.png" 
            alt="RealTechee Logo Alternative" 
            width={39} 
            height={48} 
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}