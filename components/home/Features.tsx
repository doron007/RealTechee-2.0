import Image from 'next/image';
import Link from 'next/link';
import type { FeaturesProps } from '../../types/components/home';
import { ActionButton } from '../../utils/componentUtils';

// Feature card component interface
interface FeatureCardProps {
  title: string;
  description: string;
  isActive?: boolean;
}

// Feature card component
const FeatureCard = ({ title, description, isActive = false }: FeatureCardProps) => {
  return (
    <div data-status={isActive ? "active" : "normal"} className="w-[541px] p-6 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-stone-200 inline-flex justify-start items-start gap-2">
      <div className="min-w-[24px] min-h-[24px] w-[24px] h-[24px] mr-2 flex-shrink-0">
        <Image
          src="/assets/icons/vuesax-bold-tick-circle.svg"
          alt="Feature icon"
          width={24}
          height={24}
          style={{ width: '24px', height: '24px' }}
        />
      </div>
      <div className="inline-flex flex-col justify-start items-start gap-2">
        <div 
          className="self-stretch text-black font-extrabold font-['Roboto']"
          style={{
            fontSize: "clamp(18px, 1.4vw, 21px)",
            lineHeight: "1.4em",
            textAlign: "start",
            width: "100%",
            marginBottom: "8px",
          }}
        >
          {title}
        </div>
        <div 
          className="text-medium-gray font-body" 
          style={{
            fontSize: "clamp(16px, 1.2vw, 18px)",
            lineHeight: "1.6em",
            textAlign: "start",
            width: "100%",
            mixBlendMode: "normal"
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};

// Milestone item component
const MilestoneItem = ({ isCompleted = false }: { isCompleted?: boolean }) => {
  return (
    isCompleted ? (
      <div className="self-stretch inline-flex justify-start items-start gap-2">
        <div className="w-6 h-6 relative">
          <Image
            src="/assets/icons/ic-tick-circle.svg"
            alt="Completed milestone"
            width={24}
            height={24}
            className="left-[0px] top-[0px] absolute"
          />
        </div>
        <div className="flex-1 h-6 bg-neutral-500 rounded-[48px]" />
      </div>
    ) : (
      <div className="self-stretch inline-flex justify-start items-start gap-2">
        <div className="w-6 h-6 relative overflow-hidden">
          <Image
            src="/assets/icons/ic-circle.svg"
            alt="Pending milestone"
            width={24}
            height={24}
            className="left-[0px] top-[0px] absolute"
          />
        </div>
        <div className="flex-1 h-6 rounded-[48px] border-[3px] border-neutral-300" />
      </div>
    )
  );
};

export default function Features(props: FeaturesProps) {
  // Define project images to avoid any dynamic string concatenation issues
  const mainImageSrc = "/assets/images/shared_projects_project-image5.png";
  const thumbnailImages = [
    "/assets/images/shared_projects_project-image1.png",
    "/assets/images/shared_projects_project-image2.png",
    "/assets/images/shared_projects_project-image3.png",
    "/assets/images/shared_projects_project-image4.png"
  ];

  return (
    <section className="pt-20 pr-[120px] pl-[120px] pb-20 bg-stone-50 flex flex-col">
      <div className="w-[1200px] mx-auto mb-8">
        <p className="text-sm font-medium text-[#FF5F45] uppercase tracking-wider mb-2">FEATURES</p>
        <h2 
          className="text-dark-gray font-bold font-heading mb-[32px]"
          style={{
            fontSize: "clamp(37px, 3.5vw, 43px)",
            lineHeight: "1.4em",
            textAlign: "start",
            width: "100%",
            mixBlendMode: "normal"
          }}
        >
          Powerful Features to Win More Deals
        </h2>
      
        <div className="flex justify-between items-start gap-8">
          <div className="inline-flex flex-col justify-start items-start gap-8 w-[541px]">
            {/* Feature cards */}
            <FeatureCard
              title="Project Overview at a Glance"
              description="Effortlessly keep track of all your client projects, both completed and ongoing. Get a comprehensive overview of the projects' statuses, ensuring you stay organized and informed throughout the entire project lifecycle."
            />
            
            <FeatureCard
              title="Detailed Project Scope"
              description="Effortlessly keep track of all your client projects, both completed and ongoing. Get a comprehensive overview of the projects' statuses, ensuring you stay organized and informed throughout the entire project lifecycle."
            />
            
            <FeatureCard
              title="Real-Time Project Updates with Photo Interaction"
              description="Your clients stay connected and engaged with their projects through real-time updates accompanied by photos. Comment on updates, ask questions, and receive prompt responses from the experts working on your projects. Enjoy seamless communication and enhance collaboration to ensure the projects meet and exceed their expectations"
            />
            
            {/* Learn More button */}
            <ActionButton href="/learn-more" text="Learn More" primary={true} />
          </div>
          
          {/* Right side - images and milestone widget - exact positioning from Figma, adjusted to align with middle card */}
          <div className="w-[720px] self-stretch relative overflow-hidden">
            <div className="w-96 h-96 left-[230px] top-[290.50px] absolute rounded-full border border-red-400 border-dashed" />
            
            {/* Main image - using the exact positioning from Figma, moved up ~100px */}
            <Image 
              className="w-[505px] h-96 left-[51px] top-[134.50px] absolute rounded-md object-cover" 
              src={mainImageSrc}
              alt="Project overview" 
              width={505}
              height={384}
              priority
            />
            
            {/* Image thumbnails - using the exact positioning from Figma, moved up ~100px */}
            <div className="w-[505.08px] h-16 left-[51px] top-[515.50px] absolute rounded-md">
              <Image 
                className="w-24 h-16 left-0 top-0 absolute rounded-tl-md rounded-bl-md object-cover" 
                src={thumbnailImages[0]} 
                alt="Thumbnail 1" 
                width={97} 
                height={65} 
              />
              <Image 
                className="w-24 h-16 left-[101.14px] top-0 absolute object-cover" 
                src={thumbnailImages[1]} 
                alt="Thumbnail 2" 
                width={99} 
                height={65} 
              />
              <Image 
                className="w-24 h-16 left-[203.97px] top-0 absolute object-cover" 
                src={thumbnailImages[2]} 
                alt="Thumbnail 3" 
                width={97} 
                height={65} 
              />
              <Image 
                className="w-24 h-16 left-[305.11px] top-0 absolute object-cover" 
                src={thumbnailImages[3]} 
                alt="Thumbnail 4" 
                width={99} 
                height={65} 
              />
            </div>
            
            {/* Milestones widget - using the exact positioning from Figma, moved up ~100px */}
            <div className="w-80 px-6 pt-6 pb-8 left-[345px] top-[443.50px] absolute bg-white/90 rounded-md shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] backdrop-blur-[2px] inline-flex flex-col justify-start items-start gap-4 overflow-hidden">
              <div className="justify-start text-zinc-800 text-xl font-extrabold font-['Roboto'] leading-loose">Milestones</div>
              <div className="self-stretch flex flex-col justify-start items-start gap-4">
                <div className="self-stretch flex flex-col justify-start items-start gap-4">
                  <MilestoneItem isCompleted={true} />
                </div>
                <div className="self-stretch flex flex-col justify-start items-start gap-4">
                  <MilestoneItem isCompleted={true} />
                </div>
                <MilestoneItem />
                <MilestoneItem />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}