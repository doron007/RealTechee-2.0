import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import P1 from '../typography/P1';
import P2 from '../typography/P2'; 
import { Card } from '../common/ui';
import Button from '../common/buttons/Button';
import H2 from '../typography/H2';
import P3 from '../typography/P3';
import type { FeaturesProps } from '../../types/components/home';

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

    const currentRef = featuresRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section className="section-container bg-stone-50 py-10 sm:py-12 md:py-16 lg:py-20 overflow-x-hidden">
      <div className="section-content">
        <div ref={featuresRef} className="w-full max-w-[1200px] mx-auto mb-6 sm:mb-8">
          <P3 className="text-[#E9664A] uppercase tracking-[0.18em] font-bold mb-4">
            Features
          </P3>
          <H2 className="mb-8">
            Powerful Features to Win More Deals
          </H2>
        
          {/* Main content flex container - improved responsive layout */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-6 xl:gap-8">
            {/* Left column - feature cards */}
            <div className="flex flex-col justify-start items-start gap-4 sm:gap-5 md:gap-6 lg:gap-8 w-full lg:w-[45%] xl:w-[541px]">
              {/* Feature cards with staggered animations using standardized Card component */}
              <div className={`transition-all duration-700 ease-out delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Card 
                  variant="feature"
                  icon="/assets/icons/vuesax-bold-tick-circle.svg"
                  title="Project Overview at a Glance"
                  content="Effortlessly keep track of all your client projects, both completed and ongoing. Get a comprehensive overview of the projects' statuses, ensuring you stay organized and informed throughout the entire project lifecycle."
                  iconPosition="left"
                />
              </div>
              
              <div className={`transition-all duration-700 ease-out delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Card 
                  variant="feature"
                  icon="/assets/icons/vuesax-bold-tick-circle.svg"
                  title="Detailed Project Scope"
                  content="Define clear project parameters with comprehensive scope documents that outline all aspects of the renovation. Prevent scope creep and maintain transparency with clients by having detailed documentation readily available."
                  iconPosition="left"
                />
              </div>
              
              <div className={`transition-all duration-700 ease-out delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <Card
                  variant="feature"
                  icon="/assets/icons/vuesax-bold-tick-circle.svg"
                  title="Real-Time Project Updates with Photo Interaction"
                  content="Your clients stay connected and engaged with their projects through real-time updates accompanied by photos. Comment on updates, ask questions, and receive prompt responses from the experts working on your projects."
                  iconPosition="left"
                />
              </div>
              
              {/* Learn More button - Updated to use standardized Button component */}
              <div className={`mt-4 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Button
                  variant="primary"
                  href="/contact/contact-us"
                  //withIcon={true}
                  //iconPosition="right"
                  text="Learn More"
                >
                  <P2>Explore All Features</P2>
                </Button>
              </div>
            </div>
            
            {/* Right side - images and milestone widget - Enhanced responsive behavior */}
            <div className={`w-full lg:w-[50%] xl:w-[650px] h-[350px] xs:h-[380px] sm:h-[450px] md:h-[540px] lg:h-[700px] relative overflow-hidden mt-8 lg:mt-0 transition-all duration-1000 ${isRightVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              {/* Circle decoration - hidden on xs, visible on sm and up */}
              <div className="hidden lg:block w-52 h-52 lg:w-96 lg:h-96 absolute right-0 lg:right-16 bottom-4 lg:bottom-20 rounded-full border border-accent border-dashed animate-pulse-slow opacity-60" />
              
              {/* Main image - better responsive positioning */}
              <div className="relative lg:absolute w-full lg:w-[505px] h-auto lg:h-96 mx-auto lg:mx-0 lg:left-0 lg:top-[20%] shadow-lg rounded-lg overflow-hidden">
                <Image 
                  className="w-full h-auto rounded-md object-cover" 
                  src={mainImageSrc}
                  alt="Project overview dashboard showing renovation progress" 
                  width={505}
                  height={384}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 505px"
                  priority
                />
              </div>
              
              {/* Image thumbnails - responsive grid, hidden on xs, visible on sm and up */}
              <div className="hidden lg:flex w-full lg:w-[505px] h-10 lg:h-16 absolute left-0 lg:bottom-[16%] gap-1 lg:gap-[3px]">
                {thumbnailImages.map((src, index) => (
                  <div key={index} className="w-1/4 h-full overflow-hidden rounded-md">
                    <Image 
                      className="w-full h-full object-cover" 
                      src={src} 
                      alt={`Project thumbnail ${index + 1} showing renovation progress`} 
                      width={99} 
                      height={65} 
                    />
                  </div>
                ))}
              </div>
              
              {/* Milestones widget - hidden on xs, visible on sm and up, better positioning */}
              <div className="hidden lg:flex w-[200px] lg:w-[280px] px-3 lg:px-6 pt-3 lg:pt-6 pb-4 lg:pb-8 absolute right-0 
                sm:bottom-[0%] md:bottom-[0%] lg:bottom-[0%] bg-white/90 rounded-md shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] 
                backdrop-blur-sm flex-col justify-start items-start gap-2 sm:gap-3 md:gap-4">
                <P1 className="justify-start text-zinc-800 font-bold leading-loose">Project Milestones</P1>
                <div className="self-stretch w-full flex flex-col justify-start items-start gap-2 sm:gap-3 md:gap-4">
                  <MilestoneItem isCompleted={true} />
                  <MilestoneItem isCompleted={true} />
                  <MilestoneItem />
                  <MilestoneItem />
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}