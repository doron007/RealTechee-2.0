import React from 'react';
import Image from 'next/image';

// Define types for the StepCard component
interface StepCardProps {
  step: number;
  icon: string;
  title: string;
  description: string;
}

// Step card component
const StepCard: React.FC<StepCardProps> = ({ step, icon, title, description }) => {
  return (
    <div className="bg-gradient-to-tr from-[#4F4F4F] via-[#4F4F4F]/50 to-[#4F4F4F] border border-[#6C6C6C] rounded-lg p-5 sm:p-6 md:p-8 h-full flex flex-col gap-4 sm:gap-5 md:gap-6">
      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-transparent">
        <Image 
          src={icon} 
          alt={`Step ${step}`} 
          width={32} 
          height={32} 
          className="text-white w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10"
        />
      </div>
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Roboto'] leading-tight">
            Step {step}<br/>
            {title}
          </h3>
        </div>
        <p className="text-white text-sm sm:text-base font-normal font-['Roboto'] leading-relaxed opacity-90">
          {description}
        </p>
      </div>
    </div>
  );
};

interface HowItWorksProps {
  className?: string;
}

export default function HowItWorks(props: HowItWorksProps) {
  const steps = [
    {
      step: 1,
      icon: "/assets/icons/step1-icon.svg",
      title: "Quickly & Easily Submit Your Request",
      description: "Share your information and project needs. Our representative will contact you within 48 hours to coordinate our services."
    },
    {
      step: 2,
      icon: "/assets/icons/step2-icon.svg",
      title: "We Define the Scope",
      description: "Collaborate with our experts to maximize your customer's investment value. We'll tailor a renovation plan to meet their needs and goals."
    },
    {
      step: 3,
      icon: "/assets/icons/step3-icon.svg",
      title: "Review and Sign the Agreement",
      description: "Formalize the project with a detailed agreement, including the scope of work, payment terms, and timeline."
    },
    {
      step: 4,
      icon: "/assets/icons/step4-icon.svg",
      title: "Execute the Plan with Ease",
      description: "Our team manages the entire project, providing on-site supervision and quality assurance. Enjoy real-time visibility and constant communication."
    },
    {
      step: 5,
      icon: "/assets/icons/step5-icon.svg",
      title: "Realize the Enhanced Value",
      description: "Achieve a higher property value. Sell more, sell faster, and command higher prices."
    },
    {
      step: 6,
      icon: "/assets/icons/step6-icon.svg",
      title: "Access Financial Tools for Success",
      description: "Leverage our financial tools for timely support, even with zero upfront payment."
    }
  ];

  return (
    <section className="section-container bg-[#2A2B2E] py-10 sm:py-12 md:py-16 lg:py-20 relative">
      <div className="section-content relative z-10">
        <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16 space-y-2 sm:space-y-3 md:space-y-4">
          <h3 className="text-[#E9664A] font-bold uppercase tracking-widest font-['Nunito_Sans'] text-xs sm:text-sm">
            Steps A-Z
          </h3>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white font-['Nunito_Sans'] leading-tight -tracking-[0.02em]">
            How it Works
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {steps.map((step) => (
            <StepCard
              key={step.step}
              step={step.step}
              icon={step.icon}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}