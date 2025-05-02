import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { 
  SectionLabel,
  Heading2,
  CardTitle,
  CardText
} from '../Typography';
import Button from '../common/buttons/Buttons';
import type { FeaturesProps } from '../../types/components/home';

// Feature card component interface
interface FeatureCardProps {
  title: string;
  description: string;
  isActive?: boolean;
  delay?: number;
  isVisible?: boolean;
}

// Feature card component
const FeatureCard = ({ title, description, isActive = false, delay = 0, isVisible = false }: FeatureCardProps) => {
  return (
    <div 
      data-status={isActive ? "active" : "normal"} 
      className={`w-full p-4 sm:p-5 md:p-6 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-stone-200 
      flex justify-start items-start gap-2 transition-all duration-700 ease-out ${delay ? `delay-${delay}` : ''} 
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="min-w-[20px] min-h-[20px] w-[20px] h-[20px] sm:min-w-[24px] sm:min-h-[24px] sm:w-[24px] sm:h-[24px] mr-2 flex-shrink-0 text-accent">
        <Image
          src="/assets/icons/vuesax-bold-tick-circle.svg"
          alt="Feature icon"
          width={24}
          height={24}
          className="w-full h-full"
        />
      </div>
      <div className="inline-flex flex-col justify-start items-start gap-2">
        <CardTitle className="text-base sm:text-lg md:text-xl">{title}</CardTitle>
        <CardText className="text-sm sm:text-base">{description}</CardText>
      </div>
    </div>
  );
};

// Milestone item component
const MilestoneItem = ({ isCompleted = false }: { isCompleted?: boolean }) => {
  return (
    isCompleted ? (
      <div className="self-stretch inline-flex justify-start items-center gap-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 relative text-accent">
          <Image
            src="/assets/icons/ic-tick-circle.svg"
            alt="Completed milestone"
            width={24}
            height={24}
            className="w-full h-full"
          />
        </div>
        <div className="flex-1 h-2 sm:h-3 bg-accent rounded-[48px]" />
      </div>
    ) : (
      <div className="self-stretch inline-flex justify-start items-center gap-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 relative overflow-hidden">
          <Image
            src="/assets/icons/ic-circle.svg"
            alt="Pending milestone"
            width={24}
            height={24}
            className="w-full h-full"
          />
        </div>
        <div className="flex-1 h-2 sm:h-3 rounded-[48px] border border-neutral-300" />
      </div>
    )
  );
};

export default function Features(props: FeaturesProps) {
  // State for animation visibility
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isRightVisible, setIsRightVisible] = useState<boolean>(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Define project images to avoid any dynamic string concatenation issues
  const mainImageSrc = "/assets/images/shared_projects_project-image5.png";
  const thumbnailImages = [
    "/assets/images/shared_projects_project-image1.png",
    "/assets/images/shared_projects_project-image2.png",
    "/assets/images/shared_projects_project-image3.png",
    "/assets/images/shared_projects_project-image4.png"
  ];

  // Animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Add a small delay before showing the right column
          setTimeout(() => setIsRightVisible(true), 300);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.15
      }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, []);

  return (
    <section className="section-container bg-stone-50 py-10 sm:py-12 md:py-16 lg:py-20 overflow-x-hidden">
      <div className="section-content">
        <div ref={featuresRef} className="w-full max-w-[1200px] mx-auto mb-6 sm:mb-8">
          <SectionLabel className={`mb-2 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            FEATURES
          </SectionLabel>
          <Heading2 className={`mb-6 sm:mb-8 md:mb-[32px] text-2xl sm:text-3xl md:text-4xl transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Powerful Features to Win More Deals
          </Heading2>
        
          {/* Main content flex container - improved responsive layout */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-6 xl:gap-8">
            {/* Left column - feature cards */}
            <div className="flex flex-col justify-start items-start gap-4 sm:gap-5 md:gap-6 lg:gap-8 w-full lg:w-[45%] xl:w-[541px]">
              {/* Feature cards with staggered animations */}
              <FeatureCard
                title="Project Overview at a Glance"
                description="Effortlessly keep track of all your client projects, both completed and ongoing. Get a comprehensive overview of the projects' statuses, ensuring you stay organized and informed throughout the entire project lifecycle."
                isVisible={isVisible}
                delay={200}
              />
              
              <FeatureCard
                title="Detailed Project Scope"
                description="Define clear project parameters with comprehensive scope documents that outline all aspects of the renovation. Prevent scope creep and maintain transparency with clients by having detailed documentation readily available."
                isVisible={isVisible}
                delay={300}
              />
              
              <FeatureCard
                title="Real-Time Project Updates with Photo Interaction"
                description="Your clients stay connected and engaged with their projects through real-time updates accompanied by photos. Comment on updates, ask questions, and receive prompt responses from the experts working on your projects."
                isVisible={isVisible}
                delay={400}
              />
              
              {/* Learn More button - Updated to use standardized Button component */}
              <div className={`mt-4 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Button
                  variant="primary"
                  href="/features"
                  text="Explore All Features"
                  showArrow={true}
                />
              </div>
            </div>
            
            {/* Right side - images and milestone widget - Enhanced responsive behavior */}
            <div className={`w-full lg:w-[50%] xl:w-[650px] h-[350px] xs:h-[380px] sm:h-[450px] md:h-[520px] lg:h-[600px] relative overflow-hidden mt-8 lg:mt-0 transition-all duration-1000 ${isRightVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              {/* Circle decoration - hidden on xs, visible on sm and up */}
              <div className="hidden sm:block w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 absolute right-0 sm:right-4 md:right-8 lg:right-16 bottom-4 sm:bottom-8 lg:bottom-20 rounded-full border border-accent border-dashed animate-pulse-slow opacity-60" />
              
              {/* Main image - better responsive positioning */}
              <div className="relative sm:absolute w-full sm:w-[90%] md:w-[80%] lg:w-[505px] h-auto sm:h-56 md:h-64 lg:h-96 mx-auto sm:mx-0 sm:left-0 sm:top-[10%] md:top-[15%] lg:top-[20%] shadow-lg rounded-lg overflow-hidden">
                <Image 
                  className="w-full h-auto rounded-md object-cover hover:scale-105 transition-transform duration-700" 
                  src={mainImageSrc}
                  alt="Project overview dashboard showing renovation progress" 
                  width={505}
                  height={384}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 505px"
                  priority
                />
              </div>
              
              {/* Image thumbnails - responsive grid, hidden on xs, visible on sm and up */}
              <div className="hidden sm:flex w-full sm:w-[90%] md:w-[80%] lg:w-[505px] h-10 sm:h-12 md:h-16 absolute left-0 sm:left-0 sm:bottom-[30%] md:bottom-[25%] lg:bottom-[20%] gap-1 md:gap-[3px]">
                {thumbnailImages.map((src, index) => (
                  <div key={index} className="w-1/4 h-full overflow-hidden rounded-md">
                    <Image 
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" 
                      src={src} 
                      alt={`Project thumbnail ${index + 1} showing renovation progress`} 
                      width={99} 
                      height={65} 
                    />
                  </div>
                ))}
              </div>
              
              {/* Milestones widget - hidden on xs, visible on sm and up, better positioning */}
              <div className="hidden sm:flex w-[200px] md:w-[220px] lg:w-[280px] px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6 pb-4 sm:pb-6 md:pb-8 absolute right-0 sm:right-0 sm:bottom-[40%] md:bottom-[35%] lg:bottom-[30%] bg-white/90 rounded-md shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] backdrop-blur-sm flex-col justify-start items-start gap-2 sm:gap-3 md:gap-4">
                <div className="justify-start text-zinc-800 text-base sm:text-lg md:text-xl font-bold font-['Roboto'] leading-loose">Project Milestones</div>
                <div className="self-stretch w-full flex flex-col justify-start items-start gap-2 sm:gap-3 md:gap-4">
                  <MilestoneItem isCompleted={true} />
                  <MilestoneItem isCompleted={true} />
                  <MilestoneItem />
                  <MilestoneItem />
                </div>
                {/* Added status label */}
                <div className="mt-1 sm:mt-2 py-1 px-2 sm:px-3 bg-green-100 rounded-full text-xs text-green-700 font-medium">
                  50% Complete
                </div>
              </div>
              
              {/* Mobile view milestone indicators - only visible on xs screens */}
              <div className="flex sm:hidden w-full justify-center mt-4">
                <div className="flex gap-2 items-center py-2 px-3 bg-white rounded-full shadow-sm">
                  <div className="w-4 h-4 relative text-accent">
                    <Image
                      src="/assets/icons/ic-tick-circle.svg"
                      alt="Milestone status"
                      width={16}
                      height={16}
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-xs font-medium">2/4 Milestones Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}