import Image from 'next/image';
import Link from 'next/link';
import { SectionTitle, SubContent, ButtonText } from '../../Typography';

// Define CtaSectionProps interface with customizable text props
export interface CtaSectionProps {
  /** Main heading text */
  title?: string;
  /** Subtitle or description text */
  subtitle?: string;
  /** CTA button text */
  buttonText?: string;
  /** CTA button link */
  buttonLink?: string;
  /** CSS class for additional styling */
  className?: string;
  /** Background image path (optional, uses default if not provided) */
  backgroundImage?: string;
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

export default function CtaSection({
  title = "Ready to win more big deals faster?",
  subtitle = "Get a Renovation Estimate Today",
  buttonText = "Get an Estimate",
  buttonLink = "/get-estimate",
  className = "",
  backgroundImage = "/assets/images/shared_cta-background.jpg"
}: CtaSectionProps) {
  return (
    <section className={`section-container bg-[#2A2B2E] relative overflow-hidden ${className}`}>
      {/* Background image with darker overlay effect */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute inset-0 bg-[#1A1B1E] opacity-80 z-[1]"></div>
        <Image 
          src={backgroundImage} 
          alt="Background" 
          fill 
          priority
          className="object-cover object-center opacity-30"
          sizes="100vw"
        />
      </div>
      
      {/* Content container with more compact responsive padding */}
      <div className="section-content relative py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 md:px-8 flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5 z-10">
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <SectionTitle center className="text-white mb-0">
            {title}
          </SectionTitle>
          <SubContent center className="text-[#BCBCBF]">
            {subtitle}
          </SubContent>
        </div>

        {/* Custom styled button with left-positioned arrow to match Figma design */}
        <Link
          href={buttonLink}
          className="mt-1 inline-flex items-center justify-center gap-2 sm:gap-3 md:gap-4 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white text-[#2A2B2E] border border-[#2A2B2E] rounded hover:bg-gray-100 transition-all"
        >
          <LeftArrowIcon />
          <ButtonText className="font-extrabold text-dark-gray">
            {buttonText}
          </ButtonText>
        </Link>
      </div>
    </section>
  );
}