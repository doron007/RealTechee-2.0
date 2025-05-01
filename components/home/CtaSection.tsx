import Link from 'next/link';
import Image from 'next/image';

// Define CtaSectionProps interface directly in the file
interface CtaSectionProps {
  // Add any props you need here
  className?: string;
}

export default function CtaSection(props: CtaSectionProps) {
  return (
    <section className="relative bg-[#2A2B2E] overflow-hidden">
      {/* Background image with darker overlay effect */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute inset-0 bg-[#1A1B1E] opacity-50 z-[1]"></div>
        <Image 
          src="/assets/images/shared_cta-background.jpg" 
          alt="Background" 
          fill 
          priority
          className="object-cover object-center opacity-30"
          sizes="100vw"
        />
      </div>
      
      {/* Content container with exact padding from Figma */}
      <div className="relative py-[88px] px-4 sm:px-6 lg:px-[120px] flex flex-col items-center justify-center gap-[30px] z-10">
        <div className="flex flex-col items-center gap-[10px]">
          <h2 className="text-[48px] font-['Nunito_Sans'] font-extrabold text-white leading-[1.2] text-center">
            Ready to win more big deals faster?
          </h2>
          <p className="text-[20px] font-['Inter'] font-bold text-[#BCBCBF] leading-[1.6] text-center">
            Get a Renovation Estimate Today
          </p>
        </div>

        <Link
          href="/get-estimate"
          className="inline-flex items-center justify-center gap-[16px] px-[24px] py-[16px] bg-white text-[#2A2B2E] rounded-[4px] font-['Nunito_Sans'] font-extrabold text-[16px] leading-[1.2] hover:bg-gray-100 transition-colors"
        >
          Get an Estimate
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.4301 5.93005L20.5001 12.0001L14.4301 18.0701" stroke="#2A2B2E" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.5 12H20.33" stroke="#2A2B2E" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </section>
  );
}