import Image from 'next/image';
import Link from 'next/link';

// Define CtaSectionProps interface directly in the file
interface CtaSectionProps {
  // Add any props you need here
  className?: string;
}

// SVG Arrow Icon Component for left-positioned arrow
const LeftArrowIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M14.4301 5.93005L20.5001 12.0001L14.4301 18.0701" 
      stroke="#2A2B2E" 
      strokeWidth="1.5" 
      strokeMiterlimit="10" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M3.5 12H20.33" 
      stroke="#2A2B2E" 
      strokeWidth="1.5" 
      strokeMiterlimit="10" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default function CtaSection(props: CtaSectionProps) {
  return (
    <section className="relative bg-[#2A2B2E] overflow-hidden">
      {/* Background image with darker overlay effect */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute inset-0 bg-[#1A1B1E] opacity-80 z-[1]"></div>
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

        {/* Custom styled button with left-positioned arrow to match Figma design */}
        <Link
          href="/get-estimate"
          className="inline-flex items-center justify-center gap-4 px-6 py-4 bg-white text-[#2A2B2E] border border-[#2A2B2E] rounded hover:bg-gray-100 transition-all"
        >
          <LeftArrowIcon />
          <span className="font-heading text-base font-extrabold leading-tight text-dark-gray">
            Get an Estimate
          </span>
        </Link>
      </div>
    </section>
  );
}