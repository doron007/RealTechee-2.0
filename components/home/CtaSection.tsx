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
    className="w-4 h-4 sm:w-5 sm:h-5"
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
    <section className="section-container bg-[#2A2B2E] relative overflow-hidden">
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
      
      {/* Content container with responsive padding */}
      <div className="section-content relative py-10 sm:py-14 md:py-16 lg:py-[88px] px-4 sm:px-6 md:px-8 flex flex-col items-center justify-center gap-5 sm:gap-6 md:gap-[30px] z-10">
        <div className="flex flex-col items-center gap-2 sm:gap-[10px]">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[48px] font-['Nunito_Sans'] font-extrabold text-white leading-tight text-center max-w-3xl">
            Ready to win more big deals faster?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-[20px] font-['Inter'] font-bold text-[#BCBCBF] leading-relaxed text-center">
            Get a Renovation Estimate Today
          </p>
        </div>

        {/* Custom styled button with left-positioned arrow to match Figma design */}
        <Link
          href="/get-estimate"
          className="inline-flex items-center justify-center gap-2 sm:gap-3 md:gap-4 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 bg-white text-[#2A2B2E] border border-[#2A2B2E] rounded hover:bg-gray-100 transition-all"
        >
          <LeftArrowIcon />
          <span className="font-heading text-sm sm:text-base font-extrabold leading-tight text-dark-gray">
            Get an Estimate
          </span>
        </Link>
      </div>
    </section>
  );
}